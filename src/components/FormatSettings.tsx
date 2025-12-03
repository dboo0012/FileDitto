import React, { useMemo, useState } from "react";
import { FileItem } from "./FileListItem";
import { Settings, Sliders } from "lucide-react";
import {
  FormatUtils,
  QualityLevel,
  MediaType,
  MediaTypeFormats,
  MediaTypeQualities,
} from "../types/supportedFormats";
import { FormatSelector } from "./FormatSelector";
import { QualitySelector } from "./QualitySelector";

type SettingsTab = "format" | "quality";

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
  const [activeTab, setActiveTab] = useState<SettingsTab>("format");
  
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

  // Check if all present media types have a format selected
  const allFormatsSelected = useMemo(() => {
    return presentMediaTypes.every(type => formatsByType[type]);
  }, [presentMediaTypes, formatsByType]);

  const mainTabs: { id: SettingsTab; label: string; icon: React.ReactNode }[] = [
    { id: "format", label: "Format", icon: <Settings className="w-4 h-4" /> },
    { id: "quality", label: "Quality", icon: <Sliders className="w-4 h-4" /> },
  ];

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">
        Conversion Settings
      </h3>

      {/* Main Tabs: Format / Quality */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg mb-5">
        {mainTabs.map((tab) => {
          const isActive = activeTab === tab.id;
          // Show indicator for format tab if not all formats selected
          const showWarning = tab.id === "format" && presentMediaTypes.length > 0 && !allFormatsSelected;
          
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              disabled={isConverting}
              className={`
                flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-md text-sm font-medium transition-all relative
                ${isActive
                  ? "bg-white text-blue-600 shadow-sm"
                  : "text-gray-600 hover:text-gray-800 hover:bg-gray-200/50"
                }
                ${isConverting ? "opacity-50 cursor-not-allowed" : ""}
              `}
            >
              {tab.icon}
              <span>{tab.label}</span>
              {showWarning && (
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-amber-500 rounded-full" />
              )}
            </button>
          );
        })}
      </div>

      <div className="space-y-6">
        {/* Format Tab Content */}
        {activeTab === "format" && (
          <FormatSelector
            formatsByType={formatsByType}
            onFormatSelectForType={setFormatForType}
            files={files}
            isDisabled={isConverting}
          />
        )}

        {/* Quality Tab Content */}
        {activeTab === "quality" && (
          <QualitySelector
            formatsByType={formatsByType}
            qualitiesByType={qualitiesByType}
            setQualityForType={setQualityForType}
            files={files}
            isDisabled={isConverting}
          />
        )}

        {/* Action Buttons */}
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
