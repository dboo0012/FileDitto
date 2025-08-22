import { useState, useEffect } from "react";
import { ConversionProgress, ConversionResult } from "../types/tauri";
import { TauriAPI } from "../utils/tauri";
import { FileItem } from "../components/FileListItem";

interface UseConversionProps {
  files: FileItem[];
  updateFilesByConversionId: (
    conversionId: string,
    updates: Partial<FileItem>
  ) => void;
}

export const useConversion = ({
  files,
  updateFilesByConversionId,
}: UseConversionProps) => {
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
    selectedFormat,
    setSelectedFormat,
    selectedQuality,
    setSelectedQuality,
  };
};
