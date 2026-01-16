
import { GoogleGenAI, Type } from "@google/genai";
import { FilterLevel, OutputSettings, AnalysisResult, Language } from "../types";

export class GeminiService {
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
    
    // Formatting directive for timeline
    const timelineInstruction = settings.includeTimeline 
      ? (isZh ? "（必须细分时间轴，以 [MM:SS] 为索引描述每一个动作的起承转合）" : " (Must use granular [MM:SS] timestamps to index every phase of the movement)")
      : "";

    const fieldMap: Record<string, string> = {
      durationTransitions: isZh ? "时长与转场点：分析视频总长度及关键剪辑/转场点" : "Duration & Transitions",
      rolesObjects: isZh ? "角色与物品分类：识别画面中的主要人物角色、物品资产及其类别" : "Roles & Object assets",
      actionTrajectory: isZh ? "动作位移轨迹：描述动态物体的空间移动路径与方向" : "Action trajectory in space",
      artVisualStyle: isZh ? "艺术 with 视觉风格：分析画面构图、色彩、灯光、视觉流派" : "Artistic and visual style",
      dialogueEmotions: isZh ? "台词与情感标注：语音内容及其背后的心理情绪倾向" : "Dialogue content and emotional tone",
      cinematographyTech: isZh ? "专业运镜技术：推拉摇移等摄影技术与焦段运用" : "Professional cinematography techniques",
      physicalEnvironment: isZh ? "物理环境建模：描述场景的地理位置、空间结构与环境特性" : "Physical environment and spatial modeling",
      textRecognition: isZh ? "文字内容识别：画面中出现的任何文字、标题、标牌等 OCR 信息" : "Text recognition (OCR)",
      actionPhysicality: isZh ? "动作物理过程：动作的力学表现、速度感、碰撞及物理逻辑" : "Physical process of actions",
      cameraPathing: isZh ? "镜头视点轨迹：相机在三维空间中的视点移动路径" : "Camera viewpoint pathing",
      transcription: isZh 
        ? `语音转录。必须严格遵循 SRT 格式，示例：\n${srtExample}` 
        : `Audio transcription. Must strictly follow SRT format, example:\n${srtExample}`,
      psychologicalAtmosphere: isZh ? "心理氛围分析：视听语言营造的整体意境与心理感受" : "Psychological atmosphere analysis",
      audioLayering: isZh ? "音频分层解析：对环境背景音、配乐、特效音进行拆解说明" : "Audio layer analysis",
      limbMovements: isZh 
        ? `肢体动作超深度捕捉：极度详尽地描述肢体的动力学特征、关节轴向变化、肌肉爆发力感。${timelineInstruction}` 
        : `Ultra-Deep Limb Capture: Detailed kinetic analysis of limbs, joint axial shifts, and muscular explosive force.${timelineInstruction}`,
      bodyMovements: isZh ? "躯体动作：分析人物躯干、姿态及整体身体律动" : "Body Movements: torso actions, posture, and overall body movement",
      facialExpressions: isZh 
        ? "深层表情解析：捕捉微表情、肌肉张力、情绪转换的瞬时变化。" 
        : "Deep Facial Expression Analysis: Capture micro-expressions, muscle tension, and emotional transitions.",
      eyeDetail: isZh 
        ? `眼神动作极致深度捕捉：除虹膜外，必须细分描述：1.[扫视模式(Saccade)]（眼球跳跃频率与路径）；2.[注视深度(Fixation)]（视觉焦点停留时长与目标）；3.[眼周联动]（眼轮匝肌微动与神态关联）。${timelineInstruction}` 
        : `Extreme Gaze Detail Capture: Must break down into: 1.[Saccade Patterns] (frequency and path); 2.[Fixation Depth] (target and duration); 3.[Periocular Coordination] (muscle interaction).${timelineInstruction}`,
      naturalLanguageSummary: isZh 
        ? `自然语言综合描述：请根据此媒体的所有特征提供一个约 ${settings.wordCount} 字左右的综合性叙述。` 
        : `Natural Language Synthesis: Please provide a cohesive narrative description of about ${settings.wordCount} words based on all media characteristics.`
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
      ? `你是一个顶尖的生物力学与视觉分析专家。请根据提供的媒体内容进行极致细致的解析。
         安全过滤策略：${filterDesc}
         
         核心要求：
         1. 眼神与肢体捕捉：必须达到解剖学级别的描述深度。
         2. 时间轴同步：如果启用了时间轴，描述必须按 [MM:SS] 逐秒或逐关键帧进行序列化描述，禁止模糊概括。
         3. 眼神细分：必须明确区分扫视（快速跳跃）和注视（长时停留）的具体规律。
         
         关于转录：必须严格使用 SRT 格式输出。
         必须严格以 JSON 格式返回结果。`
      : `You are a premier biomechanical and visual analysis expert. Provide extreme detail.
         Safety Strategy: ${filterDesc}
         
         CORE REQUIREMENTS:
         1. Gaze & Limb Capture: Descriptions must reach anatomical depth.
         2. Timeline Sync: If enabled, descriptions must be serialized using [MM:SS] for specific sub-actions. No vague summaries.
         3. Gaze Segmentation: Clearly distinguish between Saccades (rapid jumps) and Fixations (prolonged focus).
         
         Transcription: Must strictly follow SRT format.
         You must return results in strict JSON format.`;

    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: [
        {
          parts: [
            { inlineData: mediaData },
            { text: isZh ? "请对媒体进行极深层生物力学捕捉。特别针对肢体动作和眼神眼神，按照细分的时间轴节点提供详细的子项分析。" : "Perform ultra-deep biomechanical capture. Specifically for limb movements and gaze, provide detailed sub-analysis indexed by granular timeline nodes." }
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
