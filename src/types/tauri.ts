export interface FileMetadata {
  dimensions?: string;
  duration?: string;
  bitrate?: string;
  codec?: string;
  format?: string;
  size?: number;
}

// Video quality settings for custom conversion
export interface VideoQualityOptions {
  encoder: string;
  resolution: string;
  frame_rate: string;
  quality: number;
}

// Audio quality settings for custom conversion
export interface AudioQualityOptions {
  bitrate: number;
  sample_rate: number;
}

// Image quality settings for custom conversion
export interface ImageQualityOptions {
  quality: number;
}

// Custom quality settings union
export interface CustomQualityOptions {
  video?: VideoQualityOptions;
  audio?: AudioQualityOptions;
  image?: ImageQualityOptions;
}

export interface ConversionOptions {
  output_format: string;
  quality: string;
  output_dir?: string;
  preserve_metadata: boolean;
  custom_settings?: CustomQualityOptions;
}

export interface ConversionProgress {
  id: string;
  progress: number;
  status: string;
  current_file: string;
  eta?: string;
  speed?: string;
}

export interface ConversionResult {
  id: string;
  success: boolean;
  output_path?: string;
  error?: string;
}

export type ConversionStatus =
  | "pending"
  | "converting"
  | "completed"
  | "error"
  | "cancelled";

// User Settings Types
export interface UserSettings {
  output_path: OutputPathSettings;
  preserve_metadata: boolean;
  compression_level: number;
  auto_delete: boolean;
}

export interface OutputPathSettings {
  mode: OutputPathMode;
  custom_directory?: string;
}

export type OutputPathMode = "same_as_input" | "custom_directory";
