import React from "react";
import { 
  CheckCircle, 
  AlertCircle, 
  Loader2, 
  FolderOpen,
  Activity
} from "lucide-react";
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
  
  // Don't show summary if no activity has happened
  const hasActivity = completedFiles.length > 0 || convertingFiles.length > 0 || errorFiles.length > 0;

  if (!hasActivity && files.length === 0) {
    return null;
  }

  const handleOpenOutputFolder = () => {
    if (!onOpenOutputFolder) return;

    // Try to find the most recent completed file's output path
    const lastCompletedFile = completedFiles[completedFiles.length - 1];
    if (lastCompletedFile?.outputPath) {
      onOpenOutputFolder(lastCompletedFile.outputPath);
    }
  };

  const StatRow = ({ 
    icon, 
    label, 
    count, 
    colorClass, 
    bgClass 
  }: { 
    icon: React.ReactNode, 
    label: string, 
    count: number, 
    colorClass: string,
    bgClass: string 
  }) => (
    <div className="flex items-center justify-between py-2">
      <div className="flex items-center space-x-3">
        <div className={`p-2 rounded-lg ${bgClass}`}>
          {icon}
        </div>
        <span className="text-sm font-medium text-gray-700">{label}</span>
      </div>
      <span className={`text-lg font-semibold ${colorClass}`}>
        {count}
      </span>
    </div>
  );

  // Calculate total progress if converting
  const totalToProcess = files.length;
  const progressPercentage = totalToProcess > 0 ? Math.round(((completedFiles.length + errorFiles.length) / totalToProcess) * 100) : 0;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100 flex items-center space-x-2 bg-gray-50">
        <Activity className="w-5 h-5 text-gray-500" />
        <h3 className="text-sm font-semibold text-gray-900">Conversion Status</h3>
      </div>

      <div className="p-6 space-y-4">
        {convertingFiles.length > 0 && (
          <div className="mb-6">
            <div className="flex justify-between text-xs text-gray-600 mb-2">
              <span>Total Progress</span>
              <span className="font-medium">{progressPercentage}%</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
            <p className="text-xs text-center text-gray-500 mt-2 animate-pulse">
              Processing {convertingFiles.length} file{convertingFiles.length !== 1 ? 's' : ''}...
            </p>
          </div>
        )}

        <div className="space-y-1">
          <StatRow 
            icon={<CheckCircle className="w-4 h-4 text-green-600" />}
            label="Completed"
            count={completedFiles.length}
            colorClass="text-green-700"
            bgClass="bg-green-50"
          />
          
          <StatRow 
            icon={<Loader2 className="w-4 h-4 text-blue-600 animate-spin" />}
            label="In Progress"
            count={convertingFiles.length}
            colorClass="text-blue-700"
            bgClass="bg-blue-50"
          />
          
          <StatRow 
            icon={<AlertCircle className="w-4 h-4 text-red-600" />}
            label="Failed"
            count={errorFiles.length}
            colorClass="text-red-700"
            bgClass="bg-red-50"
          />
        </div>

        {completedFiles.length > 0 && (
          <div className="pt-4 mt-2 border-t border-gray-100">
            <button
              onClick={handleOpenOutputFolder}
              className="w-full group flex items-center justify-center space-x-2 bg-white border-2 border-green-100 text-green-700 py-2.5 px-4 rounded-lg hover:bg-green-50 hover:border-green-200 transition-all duration-200 font-medium"
            >
              <FolderOpen className="h-4 w-4 group-hover:scale-110 transition-transform" />
              <span>Open Output Folder</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
