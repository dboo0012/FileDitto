import { useState, useCallback } from 'react';
import { FileItem } from '../components/FileListItem';
import { TauriAPI } from '../utils/tauri';

export const useFiles = () => {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleFilePaths = useCallback(async (filePaths: string[]) => {
    setIsLoading(true);
    const newFiles: FileItem[] = [];

    for (const filePath of filePaths) {
      try {
        const fileName = filePath.split(/[/\\]/).pop() || filePath;

        const fileItem: FileItem = {
          id: `${crypto.randomUUID()}`,
          name: fileName,
          path: filePath,
          size: 0, // We'll get this from metadata
          type: TauriAPI.detectFileType(fileName),
          status: "pending",
        };

        // Extract metadata
        try {
          const metadata = await TauriAPI.extractFileMetadata(filePath);
          fileItem.metadata = metadata;
          fileItem.size = metadata.size || 0;
        } catch (error) {
          console.warn(`Could not extract metadata for ${fileName}:`, error);
        }

        newFiles.push(fileItem);
      } catch (error) {
        console.error(`Error processing file ${filePath}:`, error);
      }
    }

    setFiles((prev) => [...prev, ...newFiles]);
    setIsLoading(false);
    console.log("Laoded files", newFiles);
  }, []);

  const removeFile = useCallback((id: string) => {
    setFiles((prev) => prev.filter((file) => file.id !== id));
  }, []);

  const clearAllFiles = useCallback(() => {
    setFiles([]);
  }, []);

  const resetFilesForRetry = useCallback(() => {
    setFiles((prev) =>
      prev.map((file) => ({
        ...file,
        status: "pending" as const,
        progress: undefined,
        errorMessage: undefined,
        conversionId: undefined,
        outputFormat: undefined,
      }))
    );
  }, []);

  const updateFileStatus = useCallback((fileId: string, updates: Partial<FileItem>) => {
    setFiles((prev) =>
      prev.map((file) =>
        file.id === fileId ? { ...file, ...updates } : file
      )
    );
  }, []);

  const updateFilesByConversionId = useCallback((conversionId: string, updates: Partial<FileItem>) => {
    setFiles((prev) =>
      prev.map((file) =>
        file.conversionId === conversionId ? { ...file, ...updates } : file
      )
    );
  }, []);

  return {
    files,
    isLoading,
    handleFilePaths,
    removeFile,
    clearAllFiles,
    resetFilesForRetry,
    updateFileStatus,
    updateFilesByConversionId,
  };
};
