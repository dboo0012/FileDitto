import React, { useMemo } from "react";
import { FileItem } from "./FileListItem";
import {
  FormatUtils,
  SupportedFormat,
  QualityLevel,
  SUPPORTED_FORMATS,
} from "../types/supportedFormats";
import { FormatSelector } from "./FormatSelector";

interface FormatSettingsProps {
  selectedFormat: string;
  setSelectedFormat: (format: string) => void;
  selectedQuality: string;
  setSelectedQuality: (quality: string) => void;
  preserveMetadata: boolean;
  onStartConversion: () => void;
  onResetFiles: () => void;
  files: FileItem[];
  ffmpegAvailable: boolean | null;
}

export const FormatSettings: React.FC<FormatSettingsProps> = ({
  selectedFormat,
  setSelectedFormat,
  selectedQuality,
  setSelectedQuality,
  preserveMetadata,
  onStartConversion,
  onResetFiles,
  files,
  ffmpegAvailable,
}) => {
  const hasRetryableFiles = files.some(
    (f) => f.status === "error" || f.status === "completed"
  );

  // Check if any files are currently converting
  const isConverting = files.some((f) => f.status === "converting");

  // Get available quality levels for selected format
  const availableQualities = useMemo(() => {
    if (!selectedFormat) return ["high", "medium", "low"] as QualityLevel[];
    return FormatUtils.getAvailableQualities(selectedFormat as SupportedFormat);
  }, [selectedFormat]);

  // Update quality when format changes
  React.useEffect(() => {
    if (
      selectedFormat &&
      !availableQualities.includes(selectedQuality as QualityLevel)
    ) {
      const defaultQuality = FormatUtils.getDefaultQuality(
        selectedFormat as SupportedFormat
      );
      setSelectedQuality(defaultQuality);
    }
  }, [selectedFormat, availableQualities, selectedQuality, setSelectedQuality]);

  const getQualityDescription = (quality: string): string => {
    switch (quality) {
      case "high":
        return "Best quality, larger file size";
      case "medium":
        return "Balanced quality and size";
      case "low":
        return "Smallest file size, lower quality";
      case "default":
        return "Standard settings";
      default:
        return "";
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">
        Conversion Settings
      </h3>

      <div className="space-y-6">
        
        <FormatSelector
          selectedFormat={selectedFormat}
          onFormatSelect={setSelectedFormat}
          files={files}
          isDisabled={isConverting}
        />

        {selectedFormat && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Quality Preference
            </label>
            <div className="space-y-2">
              {availableQualities.map((quality) => (
                <label
                  key={quality}
                  className={`
                    flex items-center p-3 rounded-lg border transition-colors cursor-pointer
                    ${
                      selectedQuality === quality
                        ? "bg-blue-50 border-blue-200 text-blue-900"
                        : "bg-white border-gray-200 hover:bg-gray-50"
                    }
                    ${isConverting ? "opacity-50 cursor-not-allowed" : ""}
                  `}
                >
                  <input
                    type="radio"
                    name="quality"
                    value={quality}
                    checked={selectedQuality === quality}
                    onChange={(e) => !isConverting && setSelectedQuality(e.target.value)}
                    disabled={isConverting}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  />
                  <div className="ml-3 flex-1">
                    <div className="font-medium text-sm capitalize">
                      {quality} Quality
                    </div>
                    <div className="text-xs text-gray-600">
                      {getQualityDescription(quality)}
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>
        )}

        <div className="pt-4 border-t border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm text-gray-700">
              Preserve Metadata
            </span>
            <span className={`text-xs px-2 py-1 rounded ${preserveMetadata ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
              {preserveMetadata ? "Enabled" : "Disabled"}
            </span>
          </div>

          <div className="space-y-3">
            <button
              onClick={onStartConversion}
              disabled={
                files.length === 0 ||
                !selectedFormat ||
                !ffmpegAvailable ||
                isConverting
              }
              className="w-full bg-blue-600 text-white py-2.5 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium shadow-sm"
            >
              {isConverting ? "Converting..." : "Start Conversion"}
            </button>

            {hasRetryableFiles && !isConverting && (
              <button
                onClick={onResetFiles}
                className="w-full bg-white border border-gray-300 text-gray-700 py-2.5 px-4 rounded-lg hover:bg-gray-50 transition-colors font-medium text-sm"
              >
                Reset All for Retry
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
