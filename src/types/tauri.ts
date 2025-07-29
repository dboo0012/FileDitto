export interface FileMetadata {
  dimensions?: string;
  duration?: string;
  bitrate?: string;
  codec?: string;
  format?: string;
  size?: number;
}

export interface ConversionOptions {
  output_format: string;
  quality: string;
  output_dir?: string;
  preserve_metadata: boolean;
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

export type ConversionStatus = 'pending' | 'converting' | 'completed' | 'error' | 'cancelled'; 