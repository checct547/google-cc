
import { GoogleGenAI, Type } from "@google/genai";
import { FilterLevel, OutputSettings, AnalysisResult, Language } from "../types";

export class GeminiService {
  // Returns a description string based on the selected filter level and custom keywords.
  // This provides context for the safety instructions in the Gemini prompt.
  private getFilterDescription(level: FilterLevel, custom: string, lang: Language): string {
    const isZh = lang === 'zh';
    let base = "";
    switch (level) {
      case FilterLevel.GENERAL:
        base = isZh ? "中性但可能触发审核的词汇。" : "Neutral words that might trigger audits.";
        break;
      case FilterLevel.STRICT:
        base = isZh ? "人体过度接触、暧昧动作、过度身体描写等高敏感内容。" : "Excessive physical contact, ambiguous actions, detailed body descriptions.";
        break;
      case FilterLevel.EXTREME:
        base = isZh ? "包含未成年人、色情、极端暴力、恐怖主义、非法行为等极端内容。" : "Extreme content including minors, pornography, extreme violence, terrorism, illegal acts.";
        break;
      default:
        base = isZh ? "无特殊过滤要求。" : "No special filtering requirements.";
    }
    const customPrompt = custom ? (isZh ? `额外过滤关键词: ${custom}` : `Additional filter keywords: ${custom}`) : "";
    return `${base} ${customPrompt}`.trim();
  }

  /**
   * Performs deep analysis of media (image, audio, or video) using Gemini 3 Pro.
   */
  async analyzeMedia(
    mediaData: { data: string; mimeType: string },
    settings: OutputSettings,
    filterLevel: FilterLevel,
    customFilter: string,
    lang: Language,
    transcribeOnly: boolean
  ): Promise<AnalysisResult> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const isZh = lang === 'zh';
    const filterDesc = this.getFilterDescription(filterLevel, customFilter, lang);

    const properties: Record<string, any> = {};
    const srtExample = "1\n00:00:00,000 --> 00:00:05,360\n文本内容";
    const fieldMap: Record<string, string> = {
      duration: isZh ? "媒体时长" : "Media duration",
      style: isZh ? "艺术/视频风格" : "Artistic/Video style",
      textInMedia: isZh ? "媒体中的文字" : "Text appearing in media",
      roles: isZh ? "角色或主要物体" : "Roles or main objects",
      dialogue: isZh ? "人物台词/对白" : "Dialogues/Speech",
      actionProcess: isZh ? "动作过程描述" : "Action process description",
      actionTrajectory: isZh ? "动作轨迹分析" : "Action trajectory analysis",
      cameraProcess: isZh ? "镜头移动/运镜过程" : "Camera movement process",
      cameraTrajectory: isZh ? "镜头轨迹描述" : "Camera trajectory description",
      transcription: isZh 
        ? `语音转录。必须严格遵循 SRT 格式，示例：\n${srtExample}` 
        : `Audio transcription. Must strictly follow SRT format, example:\n${srtExample}`,
      environment: isZh ? "所处环境描述" : "Environment description",
      atmosphere: isZh ? "画面/音频氛围" : "Visual/Audio atmosphere",
      audioElements: isZh ? "音效/音乐元素" : "Sound effects/Music elements",
    };

    if (transcribeOnly) {
      properties.transcription = { type: Type.STRING, description: fieldMap.transcription };
    } else {
      (Object.keys(fieldMap) as Array<keyof typeof fieldMap>).forEach(key => {
        if (settings[key as keyof OutputSettings] !== false) {
          properties[key] = { type: Type.STRING, description: fieldMap[key] };
        }
      });
    }

    const systemInstruction = isZh 
      ? `你是一个专业的媒体分析专家。请根据提供的媒体内容进行深度解析。
         安全过滤策略：${filterDesc}
         关于转录：必须严格使用 SRT 格式输出，包含索引序号、时间轴(00:00:00,000 --> 00:00:00,000)和内容。
         ${settings.includeTimeline ? "分析结果中必须包含精确的时间轴。" : ""}
         必须严格以 JSON 格式返回结果。`
      : `You are a professional media analysis expert. Deeply analyze the provided media content.
         Safety Filtering Strategy: ${filterDesc}
         Transcription: Must strictly use SRT format output, including index number, timeline (00:00:00,000 --> 00:00:00,000), and content.
         ${settings.includeTimeline ? "Analysis results must include precise timestamps." : ""}
         You must return the results in strict JSON format.`;

    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: [
        {
          parts: [
            { inlineData: mediaData },
            { text: isZh ? "解析此媒体并按属性返回 JSON 报告。确保 transcription 字段内容严格遵循 SRT 格式示例。" : "Analyze this media and return a JSON report. Ensure the transcription field strictly follows the SRT format example." }
          ]
        }
      ],
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties
        }
      }
    });

    try {
      const text = response.text || "{}";
      return JSON.parse(text);
    } catch (e) {
      console.error("Gemini Analysis Parsing Error:", e);
      return {};
    }
  }
}
