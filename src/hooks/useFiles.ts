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

  const removeFile = useCallback(async (id: string, onCancel?: (conversionId: string) => Promise<void>) => {
    // Find the file to check if it's currently converting
    const file = files.find(f => f.id === id);
    
    if (file && file.status === 'converting' && file.conversionId && onCancel) {
      // Cancel the conversion first
      console.log("File is currently converting, cancelling conversion first");
      await onCancel(file.conversionId);
    }
    
    setFiles((prev) => prev.filter((file) => file.id !== id));
  }, [files]);

  const clearAllFiles = useCallback(async (onCancel?: (conversionId: string) => Promise<void>) => {
    if (onCancel) {
      // Cancel all ongoing conversions first
      const convertingFiles = files.filter(f => f.status === 'converting' && f.conversionId);
      
      if (convertingFiles.length > 0) {
        console.log(`Cancelling ${convertingFiles.length} ongoing conversions before clearing all files`);
        // Cancel all conversions in parallel
        await Promise.all(
          convertingFiles.map(file => 
            file.conversionId ? onCancel(file.conversionId) : Promise.resolve()
          )
        );
      }
    }
    
    setFiles([]);
  }, [files]);

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
