import React from "react";
import { Trash2 } from "lucide-react";
import { FileListItem, FileItem } from "./FileListItem";

interface FileListProps {
  files: FileItem[];
  isLoading: boolean;
  onRemove: (id: string) => void;
  onShowMetadata: (file: FileItem) => void;
  onClearAll: () => void;
}

export const FileList: React.FC<FileListProps> = ({
  files,
  isLoading,
  onRemove,
  onShowMetadata,
  onClearAll,
}) => {
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
            <button
              onClick={onClearAll}
              className="flex items-center px-3 py-1 text-sm text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors"
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Clear All
            </button>
          </div>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {files.map((file) => (
              <FileListItem
                key={file.id}
                file={file}
                onRemove={onRemove}
                onShowMetadata={onShowMetadata}
              />
            ))}
          </div>
        </div>
      )}
    </>
  );
};
