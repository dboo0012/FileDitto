import { ConversionOptions, CustomQualityOptions } from '../types/tauri';
import { TauriAPI } from '../utils/tauri';
import { FileItem } from '../components/FileListItem';
import { FormatUtils, MediaTypeFormats, MediaTypeQualities, CustomQualitySettings } from '../types/supportedFormats';

export class ConversionService {
  static async startConversion(
    files: FileItem[],
    formatsByType: MediaTypeFormats,
    qualitiesByType: MediaTypeQualities,
    customSettings: CustomQualitySettings,
    currentOutputMode: "same_as_input" | "custom_directory",
    customDirectory: string,
    preserveMetadata: boolean,
    updateFileStatus: (fileId: string, updates: Partial<FileItem>) => void
  ) {
    if (files.length === 0) return;

    // Start conversion for each file (include pending, error, and completed files for retry)
    for (const file of files) {
      if (file.status === "converting") continue; // Skip files currently being converted

      // Determine the media type for this file
      const mediaType = FormatUtils.detectMediaType(file.name);
      if (!mediaType) {
        console.warn(`Could not detect media type for ${file.name}, skipping`);
        updateFileStatus(file.id, {
          status: "error",
          errorMessage: "Could not detect file type",
        });
        continue;
      }

      // Get the format and quality for this media type
      const selectedFormat = formatsByType[mediaType];
      const selectedQuality = qualitiesByType[mediaType];

      if (!selectedFormat) {
        console.warn(`No format selected for ${mediaType} type, skipping ${file.name}`);
        updateFileStatus(file.id, {
          status: "error",
          errorMessage: `No output format selected for ${mediaType} files`,
        });
        continue;
      }

      // Build custom quality options only when "custom" quality is selected
      let customQualityOptions: CustomQualityOptions | undefined = undefined;
      
      if (selectedQuality === 'custom') {
        customQualityOptions = {};
        if (mediaType === 'video') {
          customQualityOptions.video = {
            encoder: customSettings.video.encoder,
            resolution: customSettings.video.resolution,
            frame_rate: customSettings.video.frameRate,
            quality: customSettings.video.quality,
          };
        } else if (mediaType === 'audio') {
          customQualityOptions.audio = {
            bitrate: customSettings.audio.bitrate,
            sample_rate: customSettings.audio.sampleRate,
          };
        } else if (mediaType === 'image') {
          customQualityOptions.image = {
            quality: customSettings.image.quality,
          };
        }
      }

      const options: ConversionOptions = {
        output_format: selectedFormat,
        quality: selectedQuality,
        output_dir: currentOutputMode === "custom_directory" ? customDirectory || undefined : undefined,
        preserve_metadata: preserveMetadata,
        custom_settings: customQualityOptions,
      };

      try {
        const outputPath =
          currentOutputMode === "custom_directory" && customDirectory
            ? TauriAPI.generateOutputPath(
                file.path,
                selectedFormat,
                customDirectory
              )
            : TauriAPI.generateOutputPath(file.path, selectedFormat);
        const conversionId = await TauriAPI.convertFile(
          file.path,
          outputPath,
          options
        );

        // Update file with conversion ID and status
        updateFileStatus(file.id, {
          status: "converting",
          conversionId,
          outputFormat: selectedFormat,
          errorMessage: undefined, // Clear any previous error
        });
      } catch (error) {
        console.error(`Error starting conversion for ${file.name}:`, error);
        updateFileStatus(file.id, {
          status: "error",
          errorMessage: `Failed to start conversion: ${error}`,
        });
      }
    }
  }
}
