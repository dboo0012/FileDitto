/**
 * Media file types and supported format configurations
 */

// Base types for media categories
export type MediaType = 'video' | 'audio' | 'image';

// Quality levels for different formats
export type QualityLevel = 'high' | 'medium' | 'low' | 'default';

// Supported format types by category
export type VideoFormat = 'mp4' | 'webm' | 'avi' | 'mov' | 'mkv' | 'flv' | 'wmv' | '3gp';
export type AudioFormat = 'mp3' | 'aac' | 'wav' | 'flac' | 'ogg' | 'wma' | 'm4a' | 'opus';
export type ImageFormat = 'jpg' | 'jpeg' | 'png' | 'webp' | 'gif' | 'bmp' | 'tiff' | 'svg';

// Union type for all supported formats
export type SupportedFormat = VideoFormat | AudioFormat | ImageFormat;

// Format configuration interface
export interface FormatConfig {
  videoCodec?: string;
  audioCodec?: string;
  preset?: string;
  crf?: string;
  bitrate?: string;
  quality?: string;
  lossless?: boolean;
}

// Media format information
export interface MediaFormatInfo {
  name: string;
  extension: string;
  type: MediaType;
  description: string;
  supportedQualities: QualityLevel[];
  defaultQuality: QualityLevel;
  isLossless?: boolean;
}

// File type detection patterns
export interface FileTypePattern {
  extensions: string[];
  mimeTypes: string[];
  type: MediaType;
}

// Supported formats database
export const SUPPORTED_FORMATS: Record<SupportedFormat, MediaFormatInfo> = {
  // Video formats
  mp4: {
    name: 'MP4',
    extension: 'mp4',
    type: 'video',
    description: 'Most widely supported video format',
    supportedQualities: ['high', 'medium', 'low'],
    defaultQuality: 'medium',
  },
  webm: {
    name: 'WebM',
    extension: 'webm',
    type: 'video',
    description: 'Open web video format optimized for web browsers',
    supportedQualities: ['high', 'medium', 'low'],
    defaultQuality: 'medium',
  },
  avi: {
    name: 'AVI',
    extension: 'avi',
    type: 'video',
    description: 'Legacy video format with wide compatibility',
    supportedQualities: ['default'],
    defaultQuality: 'default',
  },
  mov: {
    name: 'MOV',
    extension: 'mov',
    type: 'video',
    description: 'Apple QuickTime format',
    supportedQualities: ['default'],
    defaultQuality: 'default',
  },
  mkv: {
    name: 'MKV',
    extension: 'mkv',
    type: 'video',
    description: 'Matroska container format',
    supportedQualities: ['high', 'medium', 'low'],
    defaultQuality: 'medium',
  },
  flv: {
    name: 'FLV',
    extension: 'flv',
    type: 'video',
    description: 'Flash video format',
    supportedQualities: ['default'],
    defaultQuality: 'default',
  },
  wmv: {
    name: 'WMV',
    extension: 'wmv',
    type: 'video',
    description: 'Windows Media Video format',
    supportedQualities: ['default'],
    defaultQuality: 'default',
  },
  '3gp': {
    name: '3GP',
    extension: '3gp',
    type: 'video',
    description: 'Mobile video format',
    supportedQualities: ['default'],
    defaultQuality: 'default',
  },

  // Audio formats
  mp3: {
    name: 'MP3',
    extension: 'mp3',
    type: 'audio',
    description: 'Most popular audio format',
    supportedQualities: ['high', 'medium', 'low'],
    defaultQuality: 'medium',
  },
  aac: {
    name: 'AAC',
    extension: 'aac',
    type: 'audio',
    description: 'Advanced Audio Coding, better quality than MP3',
    supportedQualities: ['high', 'medium', 'low'],
    defaultQuality: 'medium',
  },
  wav: {
    name: 'WAV',
    extension: 'wav',
    type: 'audio',
    description: 'Uncompressed audio format',
    supportedQualities: ['default'],
    defaultQuality: 'default',
    isLossless: true,
  },
  flac: {
    name: 'FLAC',
    extension: 'flac',
    type: 'audio',
    description: 'Free Lossless Audio Codec',
    supportedQualities: ['default'],
    defaultQuality: 'default',
    isLossless: true,
  },
  ogg: {
    name: 'OGG',
    extension: 'ogg',
    type: 'audio',
    description: 'Open source audio format',
    supportedQualities: ['high', 'medium', 'low'],
    defaultQuality: 'medium',
  },
  wma: {
    name: 'WMA',
    extension: 'wma',
    type: 'audio',
    description: 'Windows Media Audio format',
    supportedQualities: ['default'],
    defaultQuality: 'default',
  },
  m4a: {
    name: 'M4A',
    extension: 'm4a',
    type: 'audio',
    description: 'Apple audio format',
    supportedQualities: ['high', 'medium', 'low'],
    defaultQuality: 'medium',
  },
  opus: {
    name: 'Opus',
    extension: 'opus',
    type: 'audio',
    description: 'Modern, highly efficient audio codec',
    supportedQualities: ['high', 'medium', 'low'],
    defaultQuality: 'medium',
  },

  // Image formats
  jpg: {
    name: 'JPEG',
    extension: 'jpg',
    type: 'image',
    description: 'Most common image format',
    supportedQualities: ['high', 'medium', 'low'],
    defaultQuality: 'medium',
  },
  jpeg: {
    name: 'JPEG',
    extension: 'jpeg',
    type: 'image',
    description: 'Most common image format',
    supportedQualities: ['high', 'medium', 'low'],
    defaultQuality: 'medium',
  },
  png: {
    name: 'PNG',
    extension: 'png',
    type: 'image',
    description: 'Lossless image format with transparency',
    supportedQualities: ['default'],
    defaultQuality: 'default',
    isLossless: true,
  },
  webp: {
    name: 'WebP',
    extension: 'webp',
    type: 'image',
    description: 'Modern web image format with better compression',
    supportedQualities: ['high', 'medium', 'low'],
    defaultQuality: 'medium',
  },
  gif: {
    name: 'GIF',
    extension: 'gif',
    type: 'image',
    description: 'Animated image format',
    supportedQualities: ['default'],
    defaultQuality: 'default',
  },
  bmp: {
    name: 'BMP',
    extension: 'bmp',
    type: 'image',
    description: 'Uncompressed bitmap image',
    supportedQualities: ['default'],
    defaultQuality: 'default',
    isLossless: true,
  },
  tiff: {
    name: 'TIFF',
    extension: 'tiff',
    type: 'image',
    description: 'Professional image format',
    supportedQualities: ['default'],
    defaultQuality: 'default',
    isLossless: true,
  },
  svg: {
    name: 'SVG',
    extension: 'svg',
    type: 'image',
    description: 'Vector graphics format',
    supportedQualities: ['default'],
    defaultQuality: 'default',
  },
};

// File type detection patterns
export const FILE_TYPE_PATTERNS: FileTypePattern[] = [
  // Video patterns
  {
    extensions: ['.mp4', '.m4v'],
    mimeTypes: ['video/mp4'],
    type: 'video',
  },
  {
    extensions: ['.webm'],
    mimeTypes: ['video/webm'],
    type: 'video',
  },
  {
    extensions: ['.avi'],
    mimeTypes: ['video/x-msvideo'],
    type: 'video',
  },
  {
    extensions: ['.mov'],
    mimeTypes: ['video/quicktime'],
    type: 'video',
  },
  {
    extensions: ['.mkv'],
    mimeTypes: ['video/x-matroska'],
    type: 'video',
  },
  {
    extensions: ['.flv'],
    mimeTypes: ['video/x-flv'],
    type: 'video',
  },
  {
    extensions: ['.wmv'],
    mimeTypes: ['video/x-ms-wmv'],
    type: 'video',
  },
  {
    extensions: ['.3gp'],
    mimeTypes: ['video/3gpp'],
    type: 'video',
  },

  // Audio patterns
  {
    extensions: ['.mp3'],
    mimeTypes: ['audio/mpeg'],
    type: 'audio',
  },
  {
    extensions: ['.aac'],
    mimeTypes: ['audio/aac'],
    type: 'audio',
  },
  {
    extensions: ['.wav'],
    mimeTypes: ['audio/wav'],
    type: 'audio',
  },
  {
    extensions: ['.flac'],
    mimeTypes: ['audio/flac'],
    type: 'audio',
  },
  {
    extensions: ['.ogg'],
    mimeTypes: ['audio/ogg'],
    type: 'audio',
  },
  {
    extensions: ['.wma'],
    mimeTypes: ['audio/x-ms-wma'],
    type: 'audio',
  },
  {
    extensions: ['.m4a'],
    mimeTypes: ['audio/mp4'],
    type: 'audio',
  },
  {
    extensions: ['.opus'],
    mimeTypes: ['audio/opus'],
    type: 'audio',
  },

  // Image patterns
  {
    extensions: ['.jpg', '.jpeg'],
    mimeTypes: ['image/jpeg'],
    type: 'image',
  },
  {
    extensions: ['.png'],
    mimeTypes: ['image/png'],
    type: 'image',
  },
  {
    extensions: ['.webp'],
    mimeTypes: ['image/webp'],
    type: 'image',
  },
  {
    extensions: ['.gif'],
    mimeTypes: ['image/gif'],
    type: 'image',
  },
  {
    extensions: ['.bmp'],
    mimeTypes: ['image/bmp'],
    type: 'image',
  },
  {
    extensions: ['.tiff', '.tif'],
    mimeTypes: ['image/tiff'],
    type: 'image',
  },
  {
    extensions: ['.svg'],
    mimeTypes: ['image/svg+xml'],
    type: 'image',
  },
];

// Currently supported formats in backend (based on Rust code)
export const BACKEND_SUPPORTED_FORMATS: SupportedFormat[] = [
  'mp4', 'webm', 'avi', 'mov'
];

/**
 * Utility functions for format handling
 */
export class FormatUtils {
  /**
   * Get all formats by media type
   */
  static getFormatsByType(type: MediaType): SupportedFormat[] {
    return Object.entries(SUPPORTED_FORMATS)
      .filter(([_, info]) => info.type === type)
      .map(([format]) => format as SupportedFormat);
  }

  /**
   * Get supported formats for current backend implementation
   */
  static getBackendSupportedFormatsByType(type: MediaType): SupportedFormat[] {
    return this.getFormatsByType(type).filter(format => 
      BACKEND_SUPPORTED_FORMATS.includes(format)
    );
  }

  /**
   * Detect media type from file extension or MIME type
   */
  static detectMediaType(fileName: string, mimeType?: string): MediaType | null {
    const extension = fileName.toLowerCase().split('.').pop();
    
    // First try MIME type detection
    if (mimeType) {
      const pattern = FILE_TYPE_PATTERNS.find(p => 
        p.mimeTypes.includes(mimeType)
      );
      if (pattern) return pattern.type;
    }

    // Fallback to extension detection
    if (extension) {
      const pattern = FILE_TYPE_PATTERNS.find(p => 
        p.extensions.some(ext => ext === `.${extension}`)
      );
      if (pattern) return pattern.type;
    }

    return null;
  }

  /**
   * Get format information
   */
  static getFormatInfo(format: SupportedFormat): MediaFormatInfo | null {
    return SUPPORTED_FORMATS[format] || null;
  }

  /**
   * Check if format is supported by backend
   */
  static isBackendSupported(format: SupportedFormat): boolean {
    return BACKEND_SUPPORTED_FORMATS.includes(format);
  }

  /**
   * Get recommended formats for uploaded files
   */
  static getRecommendedFormats(files: { name: string; type?: string }[]): SupportedFormat[] {
    const detectedTypes = new Set<MediaType>();
    
    files.forEach(file => {
      const mediaType = this.detectMediaType(file.name, file.type);
      if (mediaType) {
        detectedTypes.add(mediaType);
      }
    });

    const recommendations: SupportedFormat[] = [];
    
    detectedTypes.forEach(type => {
      const supportedFormats = this.getBackendSupportedFormatsByType(type);
      
      // Add the most common/recommended format for each type
      switch (type) {
        case 'video':
          if (supportedFormats.includes('mp4')) recommendations.push('mp4');
          if (supportedFormats.includes('webm')) recommendations.push('webm');
          break;
        case 'audio':
          if (supportedFormats.includes('mp3')) recommendations.push('mp3');
          if (supportedFormats.includes('aac')) recommendations.push('aac');
          break;
        case 'image':
          if (supportedFormats.includes('jpg')) recommendations.push('jpg');
          if (supportedFormats.includes('webp')) recommendations.push('webp');
          break;
      }
    });

    return [...new Set(recommendations)]; // Remove duplicates
  }

  /**
   * Get available quality levels for a format
   */
  static getAvailableQualities(format: SupportedFormat): QualityLevel[] {
    const info = this.getFormatInfo(format);
    return info?.supportedQualities || ['default'];
  }

  /**
   * Get default quality for a format
   */
  static getDefaultQuality(format: SupportedFormat): QualityLevel {
    const info = this.getFormatInfo(format);
    return info?.defaultQuality || 'default';
  }

  /**
   * Group formats by media type for UI display
   */
  static getFormatsGroupedByType(): Record<MediaType, SupportedFormat[]> {
    const grouped: Record<MediaType, SupportedFormat[]> = {
      video: [],
      audio: [],
      image: [],
    };

    Object.entries(SUPPORTED_FORMATS).forEach(([format, info]) => {
      if (this.isBackendSupported(format as SupportedFormat)) {
        grouped[info.type].push(format as SupportedFormat);
      }
    });

    return grouped;
  }

  /**
   * Validate if a format conversion is supported
   */
  static isConversionSupported(
    sourceFormat: string, 
    targetFormat: SupportedFormat
  ): boolean {
    const sourceType = this.detectMediaType(`file.${sourceFormat}`);
    const targetInfo = this.getFormatInfo(targetFormat);
    
    if (!sourceType || !targetInfo) return false;
    
    // Basic rule: same media type conversions are generally supported
    // Cross-media type conversions (like video to audio) would need special handling
    return sourceType === targetInfo.type && this.isBackendSupported(targetFormat);
  }
}
