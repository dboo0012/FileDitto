import React from "react";
import { Download } from "lucide-react";
import { FileItem } from "./FileListItem";

interface ConversionSummaryProps {
  files: FileItem[];
  onOpenOutputFolder?: (path?: string) => void;
}

export const ConversionSummary: React.FC<ConversionSummaryProps> = ({
  files,
  onOpenOutputFolder,
}) => {
  const completedFiles = files.filter((f) => f.status === "completed");
  const convertingFiles = files.filter((f) => f.status === "converting");
  const errorFiles = files.filter((f) => f.status === "error");

  const handleOpenOutputFolder = () => {
    if (!onOpenOutputFolder) return;

    // Try to find the most recent completed file's output path
    const lastCompletedFile = completedFiles[completedFiles.length - 1];
    if (lastCompletedFile?.outputPath) {
      onOpenOutputFolder(lastCompletedFile.outputPath);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Summary</h3>
      <div className="space-y-3 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-600">Total Files:</span>
          <span className="font-medium">{files.length}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Completed:</span>
          <span className="font-medium text-green-600">
            {completedFiles.length}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">In Progress:</span>
          <span className="font-medium text-blue-600">
            {convertingFiles.length}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Failed:</span>
          <span className="font-medium text-red-600">{errorFiles.length}</span>
        </div>
      </div>

      {completedFiles.length > 0 && (
        <button
          onClick={handleOpenOutputFolder}
          className="w-full mt-4 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition-colors font-medium flex items-center justify-center"
        >
          <Download className="h-4 w-4 mr-2" />
          Open Output Folder
        </button>
      )}
    </div>
  );
};
