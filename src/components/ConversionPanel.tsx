import React from "react";
import { OutputSettings } from "./OutputSettings";
import { FormatSettings } from "./FormatSettings";
import { ConversionSummary } from "./ConversionSummary";
import { FileItem } from "./FileListItem";

interface ConversionPanelProps {
  files: FileItem[];
  selectedFormat: string;
  setSelectedFormat: (format: string) => void;
  selectedQuality: string;
  setSelectedQuality: (quality: string) => void;
  currentOutputMode: "same_as_input" | "custom_directory";
  customDirectory: string;
  setCustomDirectory: (directory: string) => void;
  onOutputModeChange: (mode: "same_as_input" | "custom_directory") => void;
  onSelectOutputDirectory: () => void;
  onOpenOutputFolder?: (path?: string) => void;
  onStartConversion: () => void;
  onResetFiles: () => void;
  preserveMetadata: boolean;
  getFormatRecommendations: () => string[];
  ffmpegAvailable: boolean | null;
}

export const ConversionPanel: React.FC<ConversionPanelProps> = ({
  files,
  selectedFormat,
  setSelectedFormat,
  selectedQuality,
  setSelectedQuality,
  currentOutputMode,
  customDirectory,
  setCustomDirectory,
  onOutputModeChange,
  onSelectOutputDirectory,
  onOpenOutputFolder,
  onStartConversion,
  onResetFiles,
  preserveMetadata,
  getFormatRecommendations,
  ffmpegAvailable,
}) => {
  return (
    <div className="space-y-6">
      <OutputSettings
        currentOutputMode={currentOutputMode}
        customDirectory={customDirectory}
        onOutputModeChange={onOutputModeChange}
        onSelectOutputDirectory={onSelectOutputDirectory}
        onOpenOutputFolder={onOpenOutputFolder}
        setCustomDirectory={setCustomDirectory}
      />

      <FormatSettings
        selectedFormat={selectedFormat}
        setSelectedFormat={setSelectedFormat}
        selectedQuality={selectedQuality}
        setSelectedQuality={setSelectedQuality}
        preserveMetadata={preserveMetadata}
        recommendations={getFormatRecommendations()}
        onStartConversion={onStartConversion}
        onResetFiles={onResetFiles}
        files={files}
        ffmpegAvailable={ffmpegAvailable}
      />

      <ConversionSummary
        files={files}
        onOpenOutputFolder={onOpenOutputFolder}
      />
    </div>
  );
};
