
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
        base = isZh ? "中性但可能触发审核的词汇。" : "Neutral words that might trigger audits.";
        break;
      case FilterLevel.STRICT:
        base = isZh ? "人体过度接触、暧昧动作、过度身体描写等高敏感内容。" : "Excessive physical contact, ambiguous actions, detailed body descriptions.";
        break;
      case FilterLevel.EXTREME:
        base = isZh ? "包含未成年人、色情、极端暴力、恐怖主义、非法行为等极端内容。" : "Extreme content including minors, pornography, extreme violence, terrorism, illegal acts.";
        break;
      default:
        base = "";
    }
    return `${base} ${custom ? `Additional filters: ${custom}` : ""}`;
  }

  async analyzeMedia(
    mediaData: { data: string; mimeType: string },
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

    const systemInstruction = `You are a world-class media analysis expert. 
    Analyze the provided media and output a detailed description based on the requested fields. 
    Output Language: ${targetLang}. 
    IMPORTANT: All output text, including transcription and dialogue in SRT format, MUST be automatically translated into ${targetLang}.
    Filtering Logic: ${filterDesc || "None"}. If content violates the filter, substitute with clean descriptions.
    Timeline Feature: ${settings.includeTimeline ? "Include timestamps in [00:00:00] format for descriptions." : "Do not include timestamps."}
    Strictly follow the JSON schema provided.`;

    const response = await this.ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        {
          parts: [
            { inlineData: mediaData },
            { text: transcribeOnly ? `Please only provide the transcription in SRT format, translated into ${targetLang}.` : `Generate a detailed prompt description for this media, with all text translated into ${targetLang}.` }
          ]
        }
      ],
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: schemaProperties,
          required: Object.keys(schemaProperties)
        }
      }
    });

    try {
      const parsed = JSON.parse(response.text || "{}");
      return parsed;
    } catch (e) {
      console.error("JSON Parse Error", e);
      return {};
    }
  }
}
