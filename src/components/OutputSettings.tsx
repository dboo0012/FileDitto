import React from "react";
import { Folder, FolderOpen } from "lucide-react";

interface OutputSettingsProps {
  currentOutputMode: "same_as_input" | "custom_directory";
  customDirectory: string;
  onOutputModeChange: (mode: "same_as_input" | "custom_directory") => void;
  onSelectOutputDirectory: () => void;
  onOpenOutputFolder?: (path?: string) => void;
  setCustomDirectory: (directory: string) => void;
}

export const OutputSettings: React.FC<OutputSettingsProps> = ({
  currentOutputMode,
  customDirectory,
  onOutputModeChange,
  onSelectOutputDirectory,
  onOpenOutputFolder,
  setCustomDirectory,
}) => {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">
        Output Settings
      </h3>

      <div className="space-y-4">
        <div>
          <div className="space-y-3">
            {/* Same as Input Option */}
            <label className="flex items-center cursor-pointer">
              <input
                type="radio"
                name="outputMode"
                value="same_as_input"
                checked={currentOutputMode === "same_as_input"}
                onChange={() => onOutputModeChange("same_as_input")}
                className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">
                Same as input file directory
              </span>
            </label>

            {/* Custom Directory Option */}
            <label className="flex items-start cursor-pointer">
              <input
                type="radio"
                name="outputMode"
                value="custom_directory"
                checked={currentOutputMode === "custom_directory"}
                onChange={() => onOutputModeChange("custom_directory")}
                className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500 mt-0.5"
              />
              <div className="ml-2 flex-1">
                <span className="text-sm text-gray-700">Custom directory</span>

                {currentOutputMode === "custom_directory" && (
                  <div className="mt-2 flex gap-2">
                    <input
                      type="text"
                      value={customDirectory}
                      onChange={(e) => setCustomDirectory(e.target.value)}
                      placeholder="Choose output folder..."
                      className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <button
                      onClick={onSelectOutputDirectory}
                      className="px-3 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors flex items-center"
                      title="Select output folder"
                    >
                      <Folder className="h-4 w-4" />
                    </button>
                    {customDirectory && onOpenOutputFolder && (
                      <button
                        onClick={() => onOpenOutputFolder(customDirectory)}
                        className="px-3 py-2 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors flex items-center"
                        title="Open output folder"
                      >
                        <FolderOpen className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                )}

                {currentOutputMode === "custom_directory" &&
                  customDirectory && (
                    <div className="mt-1 text-xs text-gray-500">
                      {customDirectory}
                    </div>
                  )}
              </div>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};
