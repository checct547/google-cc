
import { GoogleGenAI, Type } from "@google/genai";
import { FilterLevel, OutputSettings, AnalysisResult, Language } from "../types";

const API_KEY = process.env.API_KEY || "";

export class GeminiService {
  private ai: GoogleGenAI;

  constructor() {
    this.ai = new GoogleGenAI({ apiKey: API_KEY });
  }

  private getFilterDescription(level: FilterLevel, custom: string, lang: Language): string {
    const isZh = lang === 'zh';
    let base = "";
    switch (level) {
      case FilterLevel.GENERAL:
        base = isZh ? "替换看似中性但常触发审核的敏感词汇。" : "Replace neutral words that often trigger audits.";
        break;
      case FilterLevel.STRICT:
        base = isZh ? "严格过滤并替换：人体过度接触、私密空间双人过度互动、过度暧昧动作、过度身体描写。" : "Strictly filter and replace: excessive physical contact, intimate space interaction, ambiguous actions, body descriptions.";
        break;
      case FilterLevel.EXTREME:
        base = isZh ? "极限过滤并清洗：1.未成年相关 2.明确色情 3.极端暴力 4.恐怖主义 5.性暗示 6.裸露 7.人物不当行为 8.非法行为 9.自残 10.侵犯隐私。" : "Extreme filtering: 1.Minors 2.Pornography 3.Extreme violence 4.Terrorism 5.Sexual suggestion 6.Nudity 7.Misconduct 8.Illegal acts 9.Self-harm 10.Privacy.";
        break;
      default:
        base = isZh ? "常规审核逻辑。" : "Standard audit logic.";
    }
    return `${base} ${custom ? `${isZh ? '附加自定义过滤' : 'Additional filters'}: ${custom}` : ""}`;
  }

  async analyzeMedia(
    media: { data?: string; mimeType?: string; url?: string },
    settings: OutputSettings,
    filterLevel: FilterLevel,
    customFilter: string,
    lang: Language,
    transcribeOnly: boolean = false
  ): Promise<AnalysisResult> {
    const isZh = lang === 'zh';
    const targetLang = isZh ? 'Chinese' : 'English';
    const filterDesc = this.getFilterDescription(filterLevel, customFilter, lang);

    const schemaProperties: any = {};
    if (transcribeOnly) {
      schemaProperties.transcription = { 
        type: Type.STRING, 
        description: `SRT format transcription, MUST BE TRANSLATED TO ${targetLang}` 
      };
    } else {
      if (settings.duration) schemaProperties.duration = { type: Type.STRING };
      if (settings.style) schemaProperties.style = { type: Type.STRING };
      if (settings.textInMedia) schemaProperties.textInMedia = { type: Type.STRING };
      if (settings.roles) schemaProperties.roles = { type: Type.STRING };
      if (settings.dialogue) schemaProperties.dialogue = { type: Type.STRING };
      if (settings.actionProcess) schemaProperties.actionProcess = { type: Type.STRING };
      if (settings.actionTrajectory) schemaProperties.actionTrajectory = { type: Type.STRING };
      if (settings.cameraProcess) schemaProperties.cameraProcess = { type: Type.STRING };
      if (settings.cameraTrajectory) schemaProperties.cameraTrajectory = { type: Type.STRING };
      if (settings.transcription) {
        schemaProperties.transcription = { 
          type: Type.STRING, 
          description: `SRT format transcription, MUST BE TRANSLATED TO ${targetLang}` 
        };
      }
      if (settings.environment) schemaProperties.environment = { type: Type.STRING };
      if (settings.atmosphere) schemaProperties.atmosphere = { type: Type.STRING };
      if (settings.audioElements) schemaProperties.audioElements = { type: Type.STRING };
    }

    const systemInstruction = `You are a world-class AI media analyst. 
    ${media.url ? 'A URL has been provided. You MUST use Google Search to find as much information as possible about the media at this URL.' : 'A direct media stream has been provided.'}
    Focus on extracting:
    1. Visual Action Trajectories: How characters or objects move in 3D space.
    2. Camera Movement: Panning, tilting, zooming, tracking shots.
    3. Motion Details: Specific physics or dynamics of the actions.
    4. Content Details: Character descriptions, environment, and atmosphere.
    
    Output Language: ${targetLang}. 
    IMPORTANT: All text in the JSON output, including transcription/dialogue in SRT, MUST be in ${targetLang}.
    Filtering & Cleaning: ${filterDesc}. Automatically replace sensitive terms with safe, neutral alternatives.
    Timeline Feature: ${settings.includeTimeline ? "Use timestamps in [00:00:00] format." : "No timestamps."}
    Return result strictly as JSON.`;

    const contents: any[] = [];
    if (media.data && media.mimeType) {
      contents.push({
        parts: [
          { inlineData: { data: media.data, mimeType: media.mimeType } },
          { text: transcribeOnly ? `Transcribe and translate to ${targetLang}.` : `Generate full visual prompt analysis in ${targetLang}.` }
        ]
      });
    } else if (media.url) {
      contents.push({
        parts: [
          { text: `The media is located at: ${media.url}. Use Google Search Grounding to analyze the visual content, motion trajectories, and soundscape of this specific media. Return the analysis in ${targetLang}.` }
        ]
      });
    }

    const response = await this.ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: schemaProperties,
          required: Object.keys(schemaProperties)
        },
        tools: media.url ? [{ googleSearch: {} }] : undefined
      }
    });

    try {
      const parsed = JSON.parse(response.text || "{}");
      const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
      if (groundingChunks) {
        parsed.groundingUrls = groundingChunks
          .filter((chunk: any) => chunk.web)
          .map((chunk: any) => ({
            uri: chunk.web.uri,
            title: chunk.web.title
          }));
      }
      return parsed;
    } catch (e) {
      console.error("Analysis Error", e);
      return {};
    }
  }
}
