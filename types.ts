
export type Language = 'zh' | 'en';

export enum FilterLevel {
  NORMAL = 'NORMAL',
  GENERAL = 'GENERAL',
  STRICT = 'STRICT',
  EXTREME = 'EXTREME'
}

export interface OutputSettings {
  durationTransitions: boolean;
  rolesObjects: boolean;
  actionTrajectory: boolean;
  artVisualStyle: boolean;
  dialogueEmotions: boolean;
  cinematographyTech: boolean;
  physicalEnvironment: boolean;
  textRecognition: boolean;
  actionPhysicality: boolean;
  cameraPathing: boolean;
  transcription: boolean;
  psychologicalAtmosphere: boolean;
  audioLayering: boolean;
  limbMovements: boolean;
  bodyMovements: boolean;
  facialExpressions: boolean;
  eyeDetail: boolean;
  includeTimeline: boolean;
  naturalLanguageSummary: boolean;
  wordCount: number;
}

export interface AnalysisResult {
  durationTransitions?: string;
  rolesObjects?: string;
  actionTrajectory?: string;
  artVisualStyle?: string;
  dialogueEmotions?: string;
  cinematographyTech?: string;
  physicalEnvironment?: string;
  textRecognition?: string;
  actionPhysicality?: string;
  cameraPathing?: string;
  transcription?: string; // SRT format
  psychologicalAtmosphere?: string;
  audioLayering?: string;
  limbMovements?: string;
  bodyMovements?: string;
  facialExpressions?: string;
  eyeDetail?: string;
  naturalLanguageSummary?: string;
}

export type MediaSourceType = 'sora' | 'youtube' | 'url' | 'file';

export interface MediaSource {
  type: MediaSourceType;
  value: string | File;
  previewUrl: string;
}
