import React, { useMemo, useState, useEffect } from "react";
import { FileItem } from "./FileListItem";
import {
  FormatUtils,
  SupportedFormat,
  QualityLevel,
  MediaType,
  MediaTypeFormats,
  MediaTypeQualities,
} from "../types/supportedFormats";
import { FormatSelector } from "./FormatSelector";

interface FormatSettingsProps {
  formatsByType: MediaTypeFormats;
  qualitiesByType: MediaTypeQualities;
  setFormatForType: (mediaType: MediaType, format: string) => void;
  setQualityForType: (mediaType: MediaType, quality: QualityLevel) => void;
  preserveMetadata: boolean;
  onStartConversion: () => void;
  onResetFiles: () => void;
  files: FileItem[];
  ffmpegAvailable: boolean | null;
}

export const FormatSettings: React.FC<FormatSettingsProps> = ({
  formatsByType,
  qualitiesByType,
  setFormatForType,
  setQualityForType,
  preserveMetadata,
  onStartConversion,
  onResetFiles,
  files,
  ffmpegAvailable,
}) => {
  // Track which media type's quality settings to display
  const [activeQualityType, setActiveQualityType] = useState<MediaType>("video");
  const hasRetryableFiles = files.some(
    (f) => f.status === "error" || f.status === "completed"
  );

  // Check if any files are currently converting
  const isConverting = files.some((f) => f.status === "converting");

  // Determine which media types are present in files
  const presentMediaTypes = useMemo((): MediaType[] => {
    const types = new Set<MediaType>();
    files.forEach(file => {
      const mediaType = FormatUtils.detectMediaType(file.name);
      if (mediaType) types.add(mediaType);
    });
    return Array.from(types);
  }, [files]);

  // Set active quality type to first present media type if current is not present
  useEffect(() => {
    if (presentMediaTypes.length > 0 && !presentMediaTypes.includes(activeQualityType)) {
      setActiveQualityType(presentMediaTypes[0]);
    }
  }, [presentMediaTypes, activeQualityType]);

  // Get current format and quality for active type
  const currentFormat = formatsByType[activeQualityType];
  const currentQuality = qualitiesByType[activeQualityType];

  // Get available quality levels for the active type's selected format
  const availableQualities = useMemo(() => {
    if (!currentFormat) return ["high", "medium", "low"] as QualityLevel[];
    return FormatUtils.getAvailableQualities(currentFormat as SupportedFormat);
  }, [currentFormat]);

  // Update quality when format changes
  useEffect(() => {
    if (
      currentFormat &&
      !availableQualities.includes(currentQuality)
    ) {
      const defaultQuality = FormatUtils.getDefaultQuality(
        currentFormat as SupportedFormat
      );
      setQualityForType(activeQualityType, defaultQuality);
    }
  }, [currentFormat, availableQualities, currentQuality, setQualityForType, activeQualityType]);

  // Check if all present media types have a format selected
  const allFormatsSelected = useMemo(() => {
    return presentMediaTypes.every(type => formatsByType[type]);
  }, [presentMediaTypes, formatsByType]);

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
          formatsByType={formatsByType}
          onFormatSelectForType={setFormatForType}
          files={files}
          isDisabled={isConverting}
        />

        {currentFormat && presentMediaTypes.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-medium text-gray-700">
                Quality Preference
              </label>
              {presentMediaTypes.length > 1 && (
                <div className="flex gap-1">
                  {presentMediaTypes.map(type => (
                    <button
                      key={type}
                      onClick={() => setActiveQualityType(type)}
                      disabled={!formatsByType[type]}
                      className={`
                        px-2 py-1 text-xs rounded capitalize transition-colors
                        ${activeQualityType === type 
                          ? 'bg-blue-100 text-blue-700 font-medium' 
                          : formatsByType[type]
                            ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            : 'bg-gray-50 text-gray-400 cursor-not-allowed'
                        }
                      `}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="space-y-2">
              {availableQualities.map((quality) => (
                <label
                  key={quality}
                  className={`
                    flex items-center p-3 rounded-lg border transition-colors cursor-pointer
                    ${
                      currentQuality === quality
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
                    checked={currentQuality === quality}
                    onChange={(e) => !isConverting && setQualityForType(activeQualityType, e.target.value as QualityLevel)}
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
                !allFormatsSelected ||
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
