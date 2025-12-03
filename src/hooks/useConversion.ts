import { useState, useEffect, useCallback } from "react";
import { ConversionProgress, ConversionResult } from "../types/tauri";
import { TauriAPI } from "../utils/tauri";
import { FileItem } from "../components/FileListItem";
import {
  MediaType,
  MediaTypeFormats,
  MediaTypeQualities,
  QualityLevel,
  CustomQualitySettings,
  VideoQualitySettings,
  AudioQualitySettings,
  ImageQualitySettings,
  getDefaultCustomSettings,
} from "../types/supportedFormats";

interface UseConversionProps {
  updateFilesByConversionId: (
    conversionId: string,
    updates: Partial<FileItem>
  ) => void;
}

const DEFAULT_FORMATS: MediaTypeFormats = {
  video: "",
  audio: "",
  image: "",
};

const DEFAULT_QUALITIES: MediaTypeQualities = {
  video: "medium",
  audio: "medium",
  image: "medium",
};

const DEFAULT_CUSTOM_SETTINGS: CustomQualitySettings = getDefaultCustomSettings("medium");

export const useConversion = ({
  updateFilesByConversionId,
}: UseConversionProps) => {
  // Per-media-type format and quality selection
  const [formatsByType, setFormatsByType] = useState<MediaTypeFormats>(DEFAULT_FORMATS);
  const [qualitiesByType, setQualitiesByType] = useState<MediaTypeQualities>(DEFAULT_QUALITIES);
  const [customSettings, setCustomSettings] = useState<CustomQualitySettings>(DEFAULT_CUSTOM_SETTINGS);

  const setFormatForType = useCallback((mediaType: MediaType, format: string) => {
    setFormatsByType(prev => ({ ...prev, [mediaType]: format }));
  }, []);

  const setQualityForType = useCallback((mediaType: MediaType, quality: QualityLevel) => {
    setQualitiesByType(prev => ({ ...prev, [mediaType]: quality }));
    // Custom settings are independent and only used when quality="custom"
    // No need to update them when switching presets
  }, []);

  const setVideoSettings = useCallback((settings: VideoQualitySettings) => {
    setCustomSettings(prev => ({ ...prev, video: settings }));
  }, []);

  const setAudioSettings = useCallback((settings: AudioQualitySettings) => {
    setCustomSettings(prev => ({ ...prev, audio: settings }));
  }, []);

  const setImageSettings = useCallback((settings: ImageQualitySettings) => {
    setCustomSettings(prev => ({ ...prev, image: settings }));
  }, []);

  const getFormatForType = useCallback((mediaType: MediaType): string => {
    return formatsByType[mediaType];
  }, [formatsByType]);

  const getQualityForType = useCallback((mediaType: MediaType): QualityLevel => {
    return qualitiesByType[mediaType];
  }, [qualitiesByType]);

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
            outputPath: result.output_path || undefined,
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

  return {
    // Per-media-type format/quality management
    formatsByType,
    qualitiesByType,
    setFormatForType,
    setQualityForType,
    getFormatForType,
    getQualityForType,
    // Custom quality settings
    customSettings,
    setVideoSettings,
    setAudioSettings,
    setImageSettings,
  };
};
