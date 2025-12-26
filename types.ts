
export type Language = 'zh' | 'en';

export enum FilterLevel {
  NORMAL = 'NORMAL',
  GENERAL = 'GENERAL',
  STRICT = 'STRICT',
  EXTREME = 'EXTREME'
}

export interface OutputSettings {
  duration: boolean;
  style: boolean;
  textInMedia: boolean;
  roles: boolean;
  dialogue: boolean;
  actionProcess: boolean;
  actionTrajectory: boolean;
  cameraProcess: boolean;
  cameraTrajectory: boolean;
  transcription: boolean;
  environment: boolean;
  atmosphere: boolean;
  audioElements: boolean;
  includeTimeline: boolean;
}

export interface AnalysisResult {
  duration?: string;
  style?: string;
  textInMedia?: string;
  roles?: string;
  dialogue?: string;
  actionProcess?: string;
  actionTrajectory?: string;
  cameraProcess?: string;
  cameraTrajectory?: string;
  transcription?: string; // SRT format
  environment?: string;
  atmosphere?: string;
  audioElements?: string;
}

export type MediaSourceType = 'sora' | 'youtube' | 'url' | 'file';

export interface MediaSource {
  type: MediaSourceType;
  value: string | File;
  previewUrl: string;
}
