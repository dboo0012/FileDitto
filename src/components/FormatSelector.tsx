import React, { useState, useEffect, useMemo } from "react";
import { 
  Video, 
  Music, 
  Image as ImageIcon, 
  Check,
  Info
} from "lucide-react";
import { FileItem } from "./FileListItem";
import {
  FormatUtils,
  SupportedFormat,
  SUPPORTED_FORMATS,
  MediaType,
  MediaTypeFormats,
} from "../types/supportedFormats";

interface FormatSelectorProps {
  formatsByType: MediaTypeFormats;
  onFormatSelectForType: (mediaType: MediaType, format: string) => void;
  files: FileItem[];
  isDisabled?: boolean;
}

export const FormatSelector: React.FC<FormatSelectorProps> = ({
  formatsByType,
  onFormatSelectForType,
  files,
  isDisabled = false,
}) => {
  const [activeTab, setActiveTab] = useState<MediaType>("video");

  // Determine enabled tabs based on uploaded files - only enable tabs for media types in files
  const enabledTabs = useMemo(() => {
    if (files.length === 0) {
      return { video: false, audio: false, image: false };
    }

    const uploadedTypes = new Set(
      files.map((f) => FormatUtils.detectMediaType(f.name)).filter(Boolean)
    );

    // Only enable tab if uploaded files include that media type
    return {
      video: uploadedTypes.has("video"),
      audio: uploadedTypes.has("audio"), 
      image: uploadedTypes.has("image"),
    };
  }, [files]);

  // Get the list of media types present in files
  const presentMediaTypes = useMemo((): MediaType[] => {
    const types: MediaType[] = [];
    if (enabledTabs.video) types.push("video");
    if (enabledTabs.audio) types.push("audio");
    if (enabledTabs.image) types.push("image");
    return types;
  }, [enabledTabs]);

  // Auto-switch tab to first enabled tab when files change
  useEffect(() => {
    if (files.length > 0 && !enabledTabs[activeTab]) {
      // Find first enabled tab
      const firstEnabled = (["video", "audio", "image"] as MediaType[]).find(
        (t) => enabledTabs[t]
      );
      if (firstEnabled) {
        setActiveTab(firstEnabled);
      }
    }
  }, [enabledTabs, activeTab, files.length]);

  // Get current selected format for active tab
  const selectedFormat = formatsByType[activeTab];

  const formats = useMemo(() => {
    return FormatUtils.getBackendSupportedFormatsByType(activeTab);
  }, [activeTab]);

  const tabs: { id: MediaType; label: string; icon: React.ReactNode }[] = [
    { id: "video", label: "Video", icon: <Video className="w-4 h-4" /> },
    { id: "audio", label: "Audio", icon: <Music className="w-4 h-4" /> },
    { id: "image", label: "Image", icon: <ImageIcon className="w-4 h-4" /> },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <label className="text-sm font-medium text-gray-700">
          Select Output Format
        </label>
        {isDisabled && (
          <span className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded border border-amber-100">
            Selection disabled during conversion
          </span>
        )}
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg mb-4">
        {tabs.map((tab) => {
          const isTabEnabled = enabledTabs[tab.id];
          
          return (
            <button
              key={tab.id}
              onClick={() => !isDisabled && isTabEnabled && setActiveTab(tab.id)}
              disabled={isDisabled || !isTabEnabled}
              className={`
                flex-1 flex items-center justify-center space-x-2 py-2 px-3 rounded-md text-sm font-medium transition-all
                ${
                  activeTab === tab.id
                    ? "bg-white text-blue-600 shadow-sm"
                    : isTabEnabled
                    ? "text-gray-500 hover:text-gray-700 hover:bg-gray-200/50"
                    : "text-gray-300 cursor-not-allowed bg-gray-50/50"
                }
              `}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[320px] overflow-y-auto pr-1 custom-scrollbar">
        {formats.map((format) => {
          const info = SUPPORTED_FORMATS[format];
          const selected = selectedFormat === format;
          
          // If we are in an active tab, we assume all formats in that tab are "valid" options
          // for the user to select, even if some specific files might not support it.
          // The tab filtering logic protects the user from major incompatibilities.
          
          return (
            <button
              key={format}
              onClick={() => !isDisabled && onFormatSelectForType(activeTab, format)}
              disabled={isDisabled}
              className={`
                relative flex flex-col items-start p-3 rounded-xl border transition-all duration-200 text-left group
                ${
                  selected
                    ? "border-blue-500 bg-blue-50 ring-1 ring-blue-500"
                    : !isDisabled
                    ? "border-gray-200 bg-white hover:border-blue-300 hover:shadow-sm"
                    : "border-gray-100 bg-gray-50 opacity-60 cursor-not-allowed"
                }
              `}
            >
              <div className="flex items-center justify-between w-full mb-2">
                <span className={`
                  text-xs font-bold uppercase px-1.5 py-0.5 rounded 
                  ${selected ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-600"}
                `}>
                  {info.extension}
                </span>
                {selected && <Check className="w-4 h-4 text-blue-600" />}
              </div>
              
              <span className={`font-medium text-sm mb-0.5 ${selected ? "text-blue-900" : "text-gray-900"}`}>
                {info.name}
              </span>
              
              <span className="text--[10px] text-gray-500 line-clamp-2 leading-tight">
                {info.description}
              </span>
            </button>
          );
        })}
      </div>

      {/* Show selected formats summary for all media types */}
      {presentMediaTypes.length > 1 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {presentMediaTypes.map((type) => {
            const format = formatsByType[type];
            const icon = type === "video" ? <Video className="w-3 h-3" /> : 
                        type === "audio" ? <Music className="w-3 h-3" /> : 
                        <ImageIcon className="w-3 h-3" />;
            return (
              <div 
                key={type}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-colors cursor-pointer
                  ${activeTab === type 
                    ? 'bg-blue-100 text-blue-700 ring-1 ring-blue-300' 
                    : format 
                      ? 'bg-green-50 text-green-700 hover:bg-green-100' 
                      : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                  }`}
                onClick={() => !isDisabled && setActiveTab(type)}
              >
                {icon}
                <span className="capitalize">{type}:</span>
                <span className={format ? 'font-bold uppercase' : 'italic'}>
                  {format || 'Not set'}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* Contextual Help */}
      {files.length > 0 && presentMediaTypes.some(type => !formatsByType[type]) && (
        <div className="mt-4 flex items-start space-x-2 text-sm text-blue-700 bg-blue-50 p-3 rounded-lg border border-blue-100">
          <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <p>
            {presentMediaTypes.length > 1 
              ? `You have ${presentMediaTypes.length} media types. Select output format for each type using the tabs above.`
              : "Select a target format from the list above to start configuring your conversion."
            }
          </p>
        </div>
      )}
    </div>
  );
};
