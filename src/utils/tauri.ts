import { invoke } from '@tauri-apps/api/core';
import { listen, UnlistenFn } from '@tauri-apps/api/event';
import { open } from '@tauri-apps/plugin-dialog';
import { FileMetadata, ConversionOptions, ConversionProgress, ConversionResult } from '../types/tauri';

export class TauriAPI {
  // Check if FFmpeg is available
  static async checkFFmpegAvailability(): Promise<boolean> {
    try {
      return await invoke<boolean>('check_ffmpeg_availability');
    } catch (error) {
      console.error('Error checking FFmpeg availability:', error);
      return false;
    }
  }

  // Extract metadata from a file
  static async extractFileMetadata(filePath: string): Promise<FileMetadata> {
    try {
      return await invoke<FileMetadata>('extract_file_metadata', { filePath });
    } catch (error) {
      console.error('Error extracting metadata:', error);
      throw new Error(`Failed to extract metadata: ${error}`);
    }
  }

  // Start file conversion
  static async convertFile(
    filePath: string,
    outputPath: string,
    options: ConversionOptions
  ): Promise<string> {
    try {
      return await invoke<string>('convert_file', {
        filePath,
        outputPath,
        options,
      });
    } catch (error) {
      console.error('Error starting conversion:', error);
      throw new Error(`Failed to start conversion: ${error}`);
    }
  }

  // Get conversion progress
  static async getConversionProgress(conversionId: string): Promise<ConversionProgress | null> {
    try {
      return await invoke<ConversionProgress | null>('get_conversion_progress', {
        conversionId,
      });
    } catch (error) {
      console.error('Error getting conversion progress:', error);
      return null;
    }
  }

  // Cancel conversion
  static async cancelConversion(conversionId: string): Promise<boolean> {
    try {
      return await invoke<boolean>('cancel_conversion', { conversionId });
    } catch (error) {
      console.error('Error cancelling conversion:', error);
      return false;
    }
  }

  // Listen to conversion progress events
  static async listenToConversionProgress(
    callback: (progress: ConversionProgress) => void
  ): Promise<UnlistenFn> {
    return await listen<ConversionProgress>('conversion_progress', (event) => {
      callback(event.payload);
    });
  }

  // Listen to conversion completion events
  static async listenToConversionComplete(
    callback: (result: ConversionResult) => void
  ): Promise<UnlistenFn> {
    return await listen<ConversionResult>('conversion_complete', (event) => {
      callback(event.payload);
    });
  }

  // Open file dialog to select files
  static async openFileDialog(): Promise<string[] | null> {
    try {
      const selected = await open({
        multiple: true,
        filters: [
          {
            name: 'Media Files',
            extensions: [
              'mp4', 'avi', 'mov', 'mkv', 'webm', 'flv', 'wmv',
              'mp3', 'wav', 'aac', 'flac', 'ogg', 'wma',
              'jpg', 'jpeg', 'png', 'gif', 'bmp', 'tiff', 'webp'
            ],
          },
          {
            name: 'Video Files',
            extensions: ['mp4', 'avi', 'mov', 'mkv', 'webm', 'flv', 'wmv'],
          },
          {
            name: 'Audio Files',
            extensions: ['mp3', 'wav', 'aac', 'flac', 'ogg', 'wma'],
          },
          {
            name: 'Image Files',
            extensions: ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'tiff', 'webp'],
          },
        ],
      });
      
      return Array.isArray(selected) ? selected : selected ? [selected] : null;
    } catch (error) {
      console.error('Error opening file dialog:', error);
      return null;
    }
  }

  // Open directory dialog
  static async openDirectoryDialog(): Promise<string | null> {
    try {
      const selected = await open({
        directory: true,
      });
      
      return typeof selected === 'string' ? selected : null;
    } catch (error) {
      console.error('Error opening directory dialog:', error);
      return null;
    }
  }

  // Generate output file path
  static generateOutputPath(inputPath: string, outputFormat: string, outputDir?: string): string {
    const pathParts = inputPath.replace(/\\/g, '/').split('/');
    const fileName = pathParts[pathParts.length - 1];
    const baseName = fileName.substring(0, fileName.lastIndexOf('.')) || fileName;
    const newFileName = `${baseName}_converted.${outputFormat}`;
    
    if (outputDir) {
      return `${outputDir}/${newFileName}`;
    } else {
      // Use same directory as input file
      pathParts[pathParts.length - 1] = newFileName;
      return pathParts.join('/');
    }
  }

  // Format file size
  static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // Detect file type from path
  static detectFileType(filePath: string): 'video' | 'audio' | 'image' | 'unknown' {
    const extension = filePath.split('.').pop()?.toLowerCase();
    
    const videoExtensions = ['mp4', 'avi', 'mov', 'mkv', 'webm', 'flv', 'wmv'];
    const audioExtensions = ['mp3', 'wav', 'aac', 'flac', 'ogg', 'wma'];
    const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'tiff', 'webp'];
    
    if (extension && videoExtensions.includes(extension)) return 'video';
    if (extension && audioExtensions.includes(extension)) return 'audio';
    if (extension && imageExtensions.includes(extension)) return 'image';
    
    return 'unknown';
  }
} 