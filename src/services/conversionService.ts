import { ConversionOptions } from '../types/tauri';
import { TauriAPI } from '../utils/tauri';
import { FileItem } from '../components/FileListItem';

export class ConversionService {
  static async startConversion(
    files: FileItem[],
    selectedFormat: string,
    selectedQuality: string,
    currentOutputMode: "same_as_input" | "custom_directory",
    customDirectory: string,
    preserveMetadata: boolean,
    updateFileStatus: (fileId: string, updates: Partial<FileItem>) => void
  ) {
    if (files.length === 0 || !selectedFormat) return;

    const options: ConversionOptions = {
      output_format: selectedFormat,
      quality: selectedQuality,
      output_dir: currentOutputMode === "custom_directory" ? customDirectory || undefined : undefined,
      preserve_metadata: preserveMetadata,
    };

    // Start conversion for each file (include pending, error, and completed files for retry)
    for (const file of files) {
      if (file.status === "converting") continue; // Skip files currently being converted

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
