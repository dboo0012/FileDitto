import React, { useMemo } from "react";
import { FileItem } from "./FileListItem";
import {
  FormatUtils,
  SupportedFormat,
  QualityLevel,
  SUPPORTED_FORMATS,
} from "../types/supportedFormats";
import { useFormatRecommendations } from "../hooks/useFormatRecommendations";

interface FormatSettingsProps {
  selectedFormat: string;
  setSelectedFormat: (format: string) => void;
  selectedQuality: string;
  setSelectedQuality: (quality: string) => void;
  preserveMetadata: boolean;
  recommendations: string[];
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
  recommendations,
  onStartConversion,
  onResetFiles,
  files,
  ffmpegAvailable,
}) => {
  const hasRetryableFiles = files.some(
    (f) => f.status === "error" || f.status === "completed"
  );

  // Use the format recommendations hook
  const { recommendedFormats, availableFormats, isFormatCompatible } =
    useFormatRecommendations(files);

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

  // Render format options grouped by media type
  const renderFormatOptions = () => {
    const options: JSX.Element[] = [];

    Object.entries(availableFormats).forEach(([mediaType, formats]) => {
      if (formats.length > 0) {
        options.push(
          <optgroup key={mediaType} label={mediaType}>
            {formats.map((format) => {
              const formatInfo = SUPPORTED_FORMATS[format];
              const isCompatible = isFormatCompatible(format);

              return (
                <option key={format} value={format} disabled={!isCompatible}>
                  {formatInfo.name} ({format.toUpperCase()})
                  {!isCompatible ? " - Not compatible" : ""}
                </option>
              );
            })}
          </optgroup>
        );
      }
    });

    return options;
  };

  // Render quality options
  const renderQualityOptions = () => {
    return availableQualities.map((quality) => {
      let label = quality.charAt(0).toUpperCase() + quality.slice(1);
      let description = "";

      switch (quality) {
        case "high":
          description = " (Best quality, slower)";
          break;
        case "medium":
          description = " (Balanced)";
          break;
        case "low":
          description = " (Faster, smaller file)";
          break;
        case "default":
          description = " (Standard)";
          break;
      }

      return (
        <option key={quality} value={quality}>
          {label}
          {description}
        </option>
      );
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">
        Conversion Settings
      </h3>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Output Format
          </label>
          <select
            value={selectedFormat}
            onChange={(e) => setSelectedFormat(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Select format...</option>
            {renderFormatOptions()}
          </select>

          {files.length > 0 && (
            <div className="mt-2 text-xs text-gray-500">
              Showing formats compatible with your uploaded files
            </div>
          )}

          {(recommendedFormats.length > 0 || recommendations.length > 0) && (
            <div className="mt-2">
              <p className="text-xs text-gray-500 mb-1">
                Recommended for your files:
              </p>
              <div className="flex flex-wrap gap-1">
                {/* Use hook recommendations first, fallback to prop recommendations */}
                {(recommendedFormats.length > 0
                  ? recommendedFormats
                  : recommendations
                ).map((format) => (
                  <button
                    key={format}
                    onClick={() => setSelectedFormat(format)}
                    className="px-2 py-1 text-xs bg-blue-50 text-blue-700 rounded hover:bg-blue-100 transition-colors"
                  >
                    {SUPPORTED_FORMATS[format as SupportedFormat]?.name ||
                      format.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Quality
          </label>
          <select
            value={selectedQuality}
            onChange={(e) => setSelectedQuality(e.target.value)}
            disabled={!selectedFormat}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
          >
            {renderQualityOptions()}
          </select>

          {selectedFormat && (
            <div className="mt-1 text-xs text-gray-500">
              Available qualities for{" "}
              {SUPPORTED_FORMATS[selectedFormat as SupportedFormat]?.name ||
                selectedFormat}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-700">
            Preserve original metadata
          </span>
          <span className="text-sm text-gray-600">
            {preserveMetadata ? "Yes" : "No"}
            <span className="text-gray-400 ml-1">(configure in settings)</span>
          </span>
        </div>

        <div className="space-y-3">
          <button
            onClick={onStartConversion}
            disabled={files.length === 0 || !selectedFormat || !ffmpegAvailable}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium"
          >
            Start Conversion
          </button>

          {hasRetryableFiles && (
            <button
              onClick={onResetFiles}
              className="w-full bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700 transition-colors font-medium text-sm"
            >
              Reset All for Retry
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
