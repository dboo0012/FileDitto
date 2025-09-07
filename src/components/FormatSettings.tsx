import React, { useMemo } from "react";
import { FileItem } from "./FileListItem";
import {
  FormatUtils,
  SupportedFormat,
  QualityLevel,
  SUPPORTED_FORMATS,
} from "../types/supportedFormats";
import { FormatSelector } from "./FormatSelector";
import { ImageFormatSettings } from "./ImageFormatSettings";

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

  // Determine if we're dealing with image files
  const isImageConversion = useMemo(() => {
    if (!files.length) return false;
    return files.some(
      (file) => FormatUtils.detectMediaType(file.name) === "image"
    );
  }, [files]);

  // Determine the primary media type
  const primaryMediaType = useMemo(() => {
    if (!files.length) return null;
    const types = files
      .map((file) => FormatUtils.detectMediaType(file.name))
      .filter(Boolean);
    if (types.length === 0) return null;

    // Return the most common media type
    const typeCounts = types.reduce((acc, type) => {
      acc[type!] = (acc[type!] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return (
      Object.entries(typeCounts).sort(([, a], [, b]) => b - a)[0]?.[0] || null
    );
  }, [files]);

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

      <div className="space-y-6">
        {/* Conditional rendering based on media type */}
        {primaryMediaType === "image" ? (
          <ImageFormatSettings
            selectedFormat={selectedFormat}
            onFormatSelect={setSelectedFormat}
            selectedQuality={selectedQuality}
            onQualitySelect={setSelectedQuality}
            files={files}
            isDisabled={isConverting}
          />
        ) : (
          <>
            <FormatSelector
              selectedFormat={selectedFormat}
              onFormatSelect={setSelectedFormat}
              files={files}
              isDisabled={isConverting}
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quality
              </label>
              <select
                value={selectedQuality}
                onChange={(e) => setSelectedQuality(e.target.value)}
                disabled={!selectedFormat || isConverting}
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
          </>
        )}

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
            disabled={
              files.length === 0 ||
              !selectedFormat ||
              !ffmpegAvailable ||
              isConverting
            }
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium"
          >
            {isConverting ? "Converting..." : "Start Conversion"}
          </button>

          {hasRetryableFiles && !isConverting && (
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
