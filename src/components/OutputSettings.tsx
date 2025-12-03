import React from "react";
import { Folder, FolderOpen } from "lucide-react";
import { FileItem } from "./FileListItem";

interface OutputSettingsProps {
  currentOutputMode: "same_as_input" | "custom_directory";
  customDirectory: string;
  onOutputModeChange: (mode: "same_as_input" | "custom_directory") => void;
  onSelectOutputDirectory: () => void;
  onOpenOutputFolder?: (path?: string) => void;
  setCustomDirectory: (directory: string) => void;
  files?: FileItem[];
}

export const OutputSettings: React.FC<OutputSettingsProps> = ({
  currentOutputMode,
  customDirectory,
  onOutputModeChange,
  onSelectOutputDirectory,
  onOpenOutputFolder,
  setCustomDirectory,
  files = [],
}) => {
  // Get unique directory paths from files
  const getInputDirectories = () => {
    if (files.length === 0) return [];
    const dirs = new Set<string>();
    files.forEach(file => {
      // Extract directory from file path
      // Windows path support
      const path = file.path;
      const lastSlash = Math.max(path.lastIndexOf('/'), path.lastIndexOf('\\'));
      if (lastSlash !== -1) {
        dirs.add(path.substring(0, lastSlash));
      }
    });
    return Array.from(dirs);
  };

  const inputDirs = getInputDirectories();
  const hasMultipleInputDirs = inputDirs.length > 1;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">
        Output Destination
      </h3>

      <div className="space-y-4">
        <div>
          <div className="space-y-4">
            {/* Same as Input Option */}
            <label className={`flex items-start cursor-pointer p-3 rounded-lg border transition-colors ${currentOutputMode === "same_as_input" ? "bg-blue-50 border-blue-200 ring-1 ring-blue-200" : "bg-white border-gray-200 hover:bg-gray-50"}`}>
              <div className="flex items-center h-5">
                <input
                  type="radio"
                  name="outputMode"
                  value="same_as_input"
                  checked={currentOutputMode === "same_as_input"}
                  onChange={() => onOutputModeChange("same_as_input")}
                  className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                />
              </div>
              <div className="ml-3 w-full">
                <span className="block text-sm font-medium text-gray-900">
                  Same as input location
                </span>
                
                {currentOutputMode === "same_as_input" && (
                  <div className="mt-2 text-xs text-gray-600 bg-white/50 rounded border border-blue-100 p-2">
                    {inputDirs.length === 0 ? (
                      <span className="text-gray-400 italic">No files selected</span>
                    ) : hasMultipleInputDirs ? (
                      <div className="space-y-1">
                        <span className="font-medium text-blue-700">Multiple locations:</span>
                        {inputDirs.slice(0, 3).map((dir, i) => (
                          <div key={i} className="flex items-center truncate">
                            <span className="truncate" title={dir}>{dir}</span>
                          </div>
                        ))}
                        {inputDirs.length > 3 && (
                          <div className="pl-4 text-gray-500">...and {inputDirs.length - 3} more</div>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center break-all">
                         <span className="font-medium text-gray-700">{inputDirs[0]}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </label>

            {/* Custom Directory Option */}
            <label className={`flex items-start cursor-pointer p-3 rounded-lg border transition-colors ${currentOutputMode === "custom_directory" ? "bg-blue-50 border-blue-200 ring-1 ring-blue-200" : "bg-white border-gray-200 hover:bg-gray-50"}`}>
              <div className="flex items-center h-5">
                <input
                  type="radio"
                  name="outputMode"
                  value="custom_directory"
                  checked={currentOutputMode === "custom_directory"}
                  onChange={() => onOutputModeChange("custom_directory")}
                  className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                />
              </div>
              <div className="ml-3 w-full">
                <span className="block text-sm font-medium text-gray-900">
                  Custom folder
                </span>

                {currentOutputMode === "custom_directory" && (
                  <div className="mt-2 flex gap-2">
                    <div className="relative flex-1">
                      <input
                        type="text"
                        value={customDirectory}
                        onChange={(e) => setCustomDirectory(e.target.value)}
                        placeholder="Select a destination folder..."
                        readOnly
                        className="w-full pl-3 pr-10 py-2 text-xs sm:text-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white cursor-pointer text-gray-600"
                        onClick={onSelectOutputDirectory}
                      />
                      {customDirectory && (
                        <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">
                           <Folder className="h-4 w-4 text-gray-400" />
                        </div>
                      )}
                    </div>
                    
                    <button
                      onClick={onSelectOutputDirectory}
                      className="px-3 py-2 bg-white border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors flex items-center text-sm font-medium"
                    >
                      Browse
                    </button>
                    
                    {customDirectory && onOpenOutputFolder && (
                      <button
                        onClick={() => onOpenOutputFolder(customDirectory)}
                        className="px-3 py-2 bg-white border border-gray-300 text-blue-600 rounded-md hover:bg-blue-50 transition-colors flex items-center"
                        title="Open folder"
                      >
                        <FolderOpen className="h-4 w-4" />
                      </button>
                    )}
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
