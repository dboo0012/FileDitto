import React, { useMemo, useState, useEffect } from "react";
import { Video, Music, Image as ImageIcon, Info, Sliders } from "lucide-react";
import { FileItem } from "./FileListItem";
import {
  FormatUtils,
  SupportedFormat,
  QualityLevel,
  MediaType,
  MediaTypeFormats,
  MediaTypeQualities,
} from "../types/supportedFormats";

interface QualitySelectorProps {
  formatsByType: MediaTypeFormats;
  qualitiesByType: MediaTypeQualities;
  setQualityForType: (mediaType: MediaType, quality: QualityLevel) => void;
  files: FileItem[];
  isDisabled?: boolean;
}

export const QualitySelector: React.FC<QualitySelectorProps> = ({
  formatsByType,
  qualitiesByType,
  setQualityForType,
  files,
  isDisabled = false,
}) => {
  const [activeTab, setActiveTab] = useState<MediaType>("video");

  // Determine which media types are present in files (ordered: video, audio, image)
  const presentMediaTypes = useMemo((): MediaType[] => {
    const types = new Set<MediaType>();
    files.forEach(file => {
      const mediaType = FormatUtils.detectMediaType(file.name);
      if (mediaType) types.add(mediaType);
    });
    // Return in consistent order: video, audio, image
    const orderedTypes: MediaType[] = ["video", "audio", "image"];
    return orderedTypes.filter(type => types.has(type));
  }, [files]);

  // Auto-switch to first present media type
  useEffect(() => {
    if (presentMediaTypes.length > 0 && !presentMediaTypes.includes(activeTab)) {
      setActiveTab(presentMediaTypes[0]);
    }
  }, [presentMediaTypes, activeTab]);

  // Get current format and quality for active type
  const currentFormat = formatsByType[activeTab];
  const currentQuality = qualitiesByType[activeTab];

  // Get available quality levels for the active type's selected format
  const availableQualities = useMemo(() => {
    if (!currentFormat) return ["high", "medium", "low"] as QualityLevel[];
    return FormatUtils.getAvailableQualities(currentFormat as SupportedFormat);
  }, [currentFormat]);

  // Update quality when format changes and current quality is not available
  useEffect(() => {
    if (currentFormat && !availableQualities.includes(currentQuality)) {
      const defaultQuality = FormatUtils.getDefaultQuality(currentFormat as SupportedFormat);
      setQualityForType(activeTab, defaultQuality);
    }
  }, [currentFormat, availableQualities, currentQuality, setQualityForType, activeTab]);

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

  const getMediaIcon = (type: MediaType) => {
    switch (type) {
      case "video": return <Video className="w-4 h-4" />;
      case "audio": return <Music className="w-4 h-4" />;
      case "image": return <ImageIcon className="w-4 h-4" />;
    }
  };

  // Check if no formats are selected
  const noFormatsSelected = presentMediaTypes.every(type => !formatsByType[type]);

  if (files.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <Sliders className="w-10 h-10 mx-auto mb-3 text-gray-300" />
        <p className="text-sm">Add files to configure quality settings</p>
      </div>
    );
  }

  if (noFormatsSelected) {
    return (
      <div className="flex items-start space-x-2 text-sm text-amber-700 bg-amber-50 p-4 rounded-lg border border-amber-100">
        <Info className="w-5 h-5 mt-0.5 flex-shrink-0" />
        <div>
          <p className="font-medium">Select formats first</p>
          <p className="text-amber-600 mt-1">
            Go to the Format tab and select output formats for your files before configuring quality settings.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <label className="text-sm font-medium text-gray-700">
          Quality Preference
        </label>
        {isDisabled && (
          <span className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded border border-amber-100">
            Selection disabled during conversion
          </span>
        )}
      </div>

      {/* Media Type Tabs */}
      {presentMediaTypes.length > 1 && (
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg mb-4">
          {presentMediaTypes.map((type) => {
            const hasFormat = !!formatsByType[type];
            const isActive = activeTab === type;
            
            return (
              <button
                key={type}
                onClick={() => !isDisabled && hasFormat && setActiveTab(type)}
                disabled={isDisabled || !hasFormat}
                className={`
                  flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md text-sm font-medium transition-all
                  ${isActive
                    ? "bg-white text-blue-600 shadow-sm"
                    : hasFormat
                      ? "text-gray-500 hover:text-gray-700 hover:bg-gray-200/50"
                      : "text-gray-300 cursor-not-allowed bg-gray-50/50"
                  }
                `}
              >
                {getMediaIcon(type)}
                <span className="capitalize">{type}</span>
                {hasFormat && (
                  <span className="text-xs bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded uppercase">
                    {formatsByType[type]}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Single media type header */}
      {presentMediaTypes.length === 1 && currentFormat && (
        <div className="flex items-center gap-2 mb-4 p-2 bg-gray-50 rounded-lg">
          {getMediaIcon(activeTab)}
          <span className="text-sm text-gray-600 capitalize">{activeTab}</span>
          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded uppercase font-medium">
            {currentFormat}
          </span>
        </div>
      )}

      {/* Quality Options */}
      {currentFormat ? (
        <div className="space-y-2">
          {availableQualities.map((quality) => (
            <label
              key={quality}
              className={`
                flex items-center p-3 rounded-xl border-2 transition-all duration-200 cursor-pointer
                ${currentQuality === quality
                  ? "bg-blue-50 border-blue-500 text-blue-900"
                  : "bg-white border-gray-200 hover:border-blue-300"
                }
                ${isDisabled ? "opacity-50 cursor-not-allowed" : ""}
              `}
            >
              <input
                type="radio"
                name={`quality-${activeTab}`}
                value={quality}
                checked={currentQuality === quality}
                onChange={(e) => !isDisabled && setQualityForType(activeTab, e.target.value as QualityLevel)}
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
      ) : (
        <div className="text-center py-6 text-gray-500 bg-gray-50 rounded-lg">
          <p className="text-sm">Select a format for {activeTab} files first</p>
        </div>
      )}

      {/* Quality Summary for multiple types */}
      {presentMediaTypes.length > 1 && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <p className="text-xs text-gray-500 mb-2">Quality settings summary:</p>
          <div className="flex flex-wrap gap-2">
            {presentMediaTypes.map((type) => {
              const format = formatsByType[type];
              const quality = qualitiesByType[type];
              
              if (!format) return null;
              
              return (
                <div 
                  key={type}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs bg-gray-100 text-gray-700"
                >
                  {getMediaIcon(type)}
                  <span className="capitalize">{type}:</span>
                  <span className="font-medium capitalize">{quality}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

