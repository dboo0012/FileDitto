import { useState, useEffect } from 'react';
import { ConversionProgress, ConversionResult } from '../types/tauri';
import { TauriAPI } from '../utils/tauri';
import { FileItem } from '../components/FileListItem';

interface UseConversionProps {
  files: FileItem[];
  updateFilesByConversionId: (conversionId: string, updates: Partial<FileItem>) => void;
}

export const useConversion = ({ files, updateFilesByConversionId }: UseConversionProps) => {
  const [selectedFormat, setSelectedFormat] = useState("");
  const [selectedQuality, setSelectedQuality] = useState("medium");

  // Set up event listeners for conversion progress and completion
  useEffect(() => {
    let progressUnlisten: (() => void) | null = null;
    let completeUnlisten: (() => void) | null = null;

    const setupListeners = async () => {
      // Listen for conversion progress updates
      progressUnlisten = await TauriAPI.listenToConversionProgress(
        (progress: ConversionProgress) => {
          updateFilesByConversionId(progress.id, {
            status: progress.status === "Converting" ? "converting" : undefined,
          });
        }
      );

      // Listen for conversion completion
      completeUnlisten = await TauriAPI.listenToConversionComplete(
        (result: ConversionResult) => {
          updateFilesByConversionId(result.id, {
            status: result.success ? "completed" : "error",
            errorMessage: result.error || undefined,
          });
        }
      );
    };

    setupListeners();

    return () => {
      if (progressUnlisten) progressUnlisten();
      if (completeUnlisten) completeUnlisten();
    };
  }, [updateFilesByConversionId]);

  const getFormatRecommendations = () => {
    if (files.length === 0) return [];

    const hasVideo = files.some(
      (f) => f.type === "video" || f.type.startsWith("video/")
    );
    const hasAudio = files.some(
      (f) => f.type === "audio" || f.type.startsWith("audio/")
    );
    const hasImage = files.some(
      (f) => f.type === "image" || f.type.startsWith("image/")
    );

    const recommendations = [];
    if (hasVideo) recommendations.push("mp4", "webm");
    if (hasAudio) recommendations.push("mp3", "wav");
    if (hasImage) recommendations.push("jpg", "png", "webp");

    return recommendations;
  };

  return {
    selectedFormat,
    setSelectedFormat,
    selectedQuality,
    setSelectedQuality,
    getFormatRecommendations,
  };
};
