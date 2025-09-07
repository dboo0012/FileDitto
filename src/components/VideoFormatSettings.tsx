import React from "react";
import { FileItem } from "./FileListItem";
import {
  FormatUtils,
  SupportedFormat,
  SUPPORTED_FORMATS,
  VideoFormat,
} from "../types/supportedFormats";

interface VideoFormatSettingsProps {
  selectedFormat: string;
  onFormatSelect: (format: string) => void;
  selectedQuality: string;
  onQualitySelect: (quality: string) => void;
  files: FileItem[];
  isDisabled?: boolean;
}

export const VideoFormatSettings: React.FC<VideoFormatSettingsProps> = ({
  selectedFormat,
  onFormatSelect,
  selectedQuality,
  onQualitySelect,
  files,
  isDisabled = false,
}) => {
  // Get video formats that are supported by the backend
  const getAvailableVideoFormats = (): VideoFormat[] => {
    return FormatUtils.getBackendSupportedFormatsByType(
      "video"
    ) as VideoFormat[];
  };

  // Check if a format is compatible with uploaded files
  const isFormatCompatible = (format: SupportedFormat): boolean => {
    if (files.length === 0) return true;

    return files.some((file) => {
      const extension = file.name.split(".").pop()?.toLowerCase();
      if (!extension) return false;
      return FormatUtils.isConversionSupported(extension, format);
    });
  };

  // Get quality options for the selected format
  const getQualityOptions = () => {
    if (!selectedFormat) return [];
    return FormatUtils.getAvailableQualities(selectedFormat as SupportedFormat);
  };

  // Format descriptions for better UX
  const getFormatDescription = (format: VideoFormat): string => {
    switch (format) {
      case "mp4":
        return "Most compatible";
      case "webm":
        return "Web optimized";
      case "avi":
        return "Legacy format";
      case "mov":
        return "Apple format";
      default:
        return "";
    }
  };

  // Quality descriptions
  const getQualityDescription = (quality: string): string => {
    switch (quality) {
      case "high":
        return "Best quality, larger files, slower";
      case "medium":
        return "Balanced quality and speed";
      case "low":
        return "Faster encoding, smaller files";
      default:
        return "Standard settings";
    }
  };

  const availableFormats = getAvailableVideoFormats();

  return (
    <div className="space-y-6">
      {/* Format Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Select Video Format
        </label>

        {files.length > 0 && (
          <div className="mb-3 text-xs text-blue-600 bg-blue-50 p-2 rounded">
            💡 Converting{" "}
            {
              files.filter(
                (f) => FormatUtils.detectMediaType(f.name) === "video"
              ).length
            }{" "}
            video file(s)
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {availableFormats.map((format) => {
            const formatInfo = SUPPORTED_FORMATS[format];
            const isCompatible = isFormatCompatible(format);
            const isSelected = selectedFormat === format;

            return (
              <button
                key={format}
                onClick={() =>
                  !isDisabled && isCompatible && onFormatSelect(format)
                }
                disabled={!isCompatible || isDisabled}
                className={`
                  p-4 text-left rounded-lg border transition-all duration-200
                  ${
                    isSelected
                      ? "bg-blue-50 border-blue-300 text-blue-900 ring-2 ring-blue-200"
                      : isCompatible && !isDisabled
                      ? "bg-white border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300"
                      : "bg-gray-50 border-gray-200 text-gray-400 cursor-not-allowed"
                  }
                `}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="font-medium text-sm">{formatInfo.name}</div>
                  <div className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-600">
                    .{format.toUpperCase()}
                  </div>
                </div>

                <div className="text-xs text-gray-600 mb-2">
                  {getFormatDescription(format)}
                </div>

                {!isCompatible && (
                  <div className="text-xs text-red-500 mt-1">
                    Not compatible with uploaded files
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Quality Selection */}
      {selectedFormat && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Quality Settings
          </label>

          <div className="space-y-2">
            {getQualityOptions().map((quality) => (
              <label
                key={quality}
                className={`
                  flex items-center p-3 rounded-lg border transition-colors cursor-pointer
                  ${
                    selectedQuality === quality
                      ? "bg-blue-50 border-blue-200 text-blue-900"
                      : "bg-white border-gray-200 hover:bg-gray-50"
                  }
                  ${isDisabled ? "opacity-50 cursor-not-allowed" : ""}
                `}
              >
                <input
                  type="radio"
                  value={quality}
                  checked={selectedQuality === quality}
                  onChange={(e) =>
                    !isDisabled && onQualitySelect(e.target.value)
                  }
                  disabled={isDisabled}
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

          <div className="mt-3 p-3 bg-gray-50 rounded-lg">
            <div className="text-xs text-gray-600">
              <span className="font-medium">Selected:</span>{" "}
              {SUPPORTED_FORMATS[selectedFormat as SupportedFormat]?.name}
              {selectedQuality !== "default" && ` (${selectedQuality} quality)`}
            </div>
          </div>
        </div>
      )}

      {/* Format Recommendations */}
      {files.length > 0 && !selectedFormat && (
        <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h4 className="font-medium text-blue-900 mb-2">💡 Quick Guide</h4>
          <div className="text-sm text-blue-800 space-y-1">
            <div>
              • <strong>MP4:</strong> Best compatibility
            </div>
            <div>
              • <strong>WebM:</strong> Web streaming
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
