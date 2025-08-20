import React from "react";
import { Trash2, StopCircle } from "lucide-react";
import { FileListItem, FileItem } from "./FileListItem";

interface FileListProps {
  files: FileItem[];
  isLoading: boolean;
  onRemove: (id: string) => Promise<void> | void;
  onShowMetadata: (file: FileItem) => void;
  onCancel: (conversionId: string) => void;
  onCancelAll: () => Promise<void> | void;
  onClearAll: () => Promise<void> | void;
}

export const FileList: React.FC<FileListProps> = ({
  files,
  isLoading,
  onRemove,
  onShowMetadata,
  onCancel,
  onCancelAll,
  onClearAll,
}) => {
  // Check if there are any files currently converting
  const convertingFiles = files.filter((f) => f.status === "converting");
  const hasConvertingFiles = convertingFiles.length > 0;
  return (
    <>
      {/* Loading Indicator */}
      {isLoading && (
        <div className="mt-4 text-center text-sm text-gray-600">
          <div className="inline-block animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 mr-2"></div>
          Processing files...
        </div>
      )}

      {/* File List */}
      {files.length > 0 && (
        <div className="mt-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-gray-900">
              Selected Files ({files.length})
            </h3>
            <div className="flex items-center space-x-2">
              {hasConvertingFiles && (
                <button
                  onClick={onCancelAll}
                  className="flex items-center px-3 py-1 text-sm text-orange-600 hover:text-orange-800 hover:bg-orange-50 rounded transition-colors"
                >
                  <StopCircle className="h-4 w-4 mr-1" />
                  Cancel All ({convertingFiles.length})
                </button>
              )}
              <button
                onClick={onClearAll}
                className="flex items-center px-3 py-1 text-sm text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors"
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Clear All
              </button>
            </div>
          </div>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {files.map((file) => (
              <FileListItem
                key={file.id}
                file={file}
                onRemove={onRemove}
                onShowMetadata={onShowMetadata}
                onCancel={onCancel}
              />
            ))}
          </div>
        </div>
      )}
    </>
  );
};
