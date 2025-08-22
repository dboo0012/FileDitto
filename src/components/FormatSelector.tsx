import React from "react";
import { FileItem } from "./FileListItem";
import {
  FormatUtils,
  SupportedFormat,
  SUPPORTED_FORMATS,
  MediaType,
} from "../types/supportedFormats";

interface FormatSelectorProps {
  selectedFormat: string;
  onFormatSelect: (format: string) => void;
  files: FileItem[];
  isDisabled?: boolean;
}

export const FormatSelector: React.FC<FormatSelectorProps> = ({
  selectedFormat,
  onFormatSelect,
  files,
  isDisabled = false,
}) => {


  // Get available formats grouped by media type
  const getAvailableFormats = (): Record<string, SupportedFormat[]> => {
    if (files.length === 0) {
      // Show all backend supported formats when no files are uploaded
      const allFormats = FormatUtils.getFormatsGroupedByType();
      // Convert keys to title case for consistency
      const formatted: Record<string, SupportedFormat[]> = {};
      Object.entries(allFormats).forEach(([type, formats]) => {
        const typeKey = type.charAt(0).toUpperCase() + type.slice(1);
        formatted[typeKey] = formats;
      });
      return formatted;
    }

    // Only show formats compatible with uploaded file types
    const detectedTypes = new Set<MediaType>();
    files.forEach((file) => {
      const mediaType = FormatUtils.detectMediaType(file.name, file.type);
      if (mediaType) {
        detectedTypes.add(mediaType);
      }
    });

    const grouped: Record<string, SupportedFormat[]> = {};
    detectedTypes.forEach((type) => {
      const typeKey = type.charAt(0).toUpperCase() + type.slice(1);
      grouped[typeKey] = FormatUtils.getBackendSupportedFormatsByType(type);
    });

    return grouped;
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

  const availableFormats = getAvailableFormats();

  // Render format selection buttons grouped by media type
  const renderFormatButtons = () => {
    const sections: JSX.Element[] = [];

    Object.entries(availableFormats).forEach(([mediaType, formats]) => {
      if (formats.length > 0) {
        sections.push(
          <div key={mediaType} className="space-y-2">
            <h4 className="text-sm font-medium text-gray-700 capitalize">
              {mediaType} Formats
            </h4>
            <div className="grid grid-cols-2 gap-2">
              {formats.map((format) => {
                const formatInfo = SUPPORTED_FORMATS[format];
                const isCompatible = isFormatCompatible(format);
                const isSelected = selectedFormat === format;
                return (
                  <button
                    key={format}
                    onClick={() => !isDisabled && isCompatible && onFormatSelect(format)}
                    disabled={!isCompatible || isDisabled}
                    className={`
                      p-3 text-left rounded-lg border transition-all duration-200 text-sm
                      ${isSelected
                        ? "bg-blue-50 border-blue-200 text-blue-900 ring-2 ring-blue-200"
                        : isCompatible && !isDisabled
                        ? "bg-white border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300"
                        : "bg-gray-50 border-gray-200 text-gray-400 cursor-not-allowed"
                      }
                    `}
                  >
                    <div>
                      <div className="font-medium">{formatInfo.name}</div>
                      <div className="text-xs opacity-75">
                        .{format.toUpperCase()}
                      </div>
                    </div>
                    {!isCompatible && (
                      <div className="text-xs text-red-500 mt-1">
                        Not compatible
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        );
      }
    });

    return sections;
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <label className="text-sm font-medium text-gray-700">
          Select Output Format
        </label>
        {isDisabled && (
          <div className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded">
            Converting... formats disabled
          </div>
        )}
      </div>

      {files.length > 0 && (
        <div className="mb-3 text-xs text-gray-500">
          Showing formats compatible with your uploaded files
        </div>
      )}

      <div className="space-y-4">{renderFormatButtons()}</div>

      {!selectedFormat && files.length > 0 && (
        <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <div className="text-sm text-blue-800">
            💡 Click on a format above to select it for conversion
          </div>
        </div>
      )}
    </div>
  );
};
