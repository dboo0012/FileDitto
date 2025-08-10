import { FileText, CheckCircle, AlertCircle, X, Info } from 'lucide-react';
import { FileMetadata, ConversionStatus } from '../types/tauri';
import { TauriAPI } from '../utils/tauri';

export interface FileItem {
  id: string;
  name: string;
  path: string;
  size: number;
  type: string;
  status: ConversionStatus;
  outputFormat?: string;
  errorMessage?: string;
  metadata?: FileMetadata;
  conversionId?: string;
}

interface FileListItemProps {
  file: FileItem;
  onRemove: (id: string) => void;
  onShowMetadata?: (file: FileItem) => void;
}

export const FileListItem = ({ 
  file, 
  onRemove, 
  onShowMetadata 
}: FileListItemProps) => {
  const formatFileSize = TauriAPI.formatFileSize;

  const getStatusIcon = () => {
    if (file.status === 'completed') {
      return <CheckCircle className="h-5 w-5 text-green-500" />;
    } else if (file.status === 'error') {
      return <AlertCircle className="h-5 w-5 text-red-500" />;
    } else if (file.status === 'converting') {
      return <div className="h-5 w-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />;
    } else {
      return <FileText className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusText = () => {
    if (file.status === 'completed') {
      return 'Completed';
    } else if (file.status === 'error') {
      return 'Failed';
    } else if (file.status === 'converting') {
      return 'Converting...';
    } else {
      return 'Pending';
    }
  };

  return (
    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors">
      <div className="flex items-center min-w-0 flex-1">
        {getStatusIcon()}
        <div className="ml-3 min-w-0 flex-1">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-gray-900 truncate">
              {file.name}
            </p>
          </div>

          <div className="flex items-center mt-1 text-xs text-gray-500">
            <span>{formatFileSize(file.size)}</span>
            {file.type && (
              <>
                <span className="mx-1">•</span>
                <span>{file.type}</span>
              </>
            )}
            {file.outputFormat && (
              <>
                <span className="mx-1">→</span>
                <span className="text-blue-600 font-medium">{file.outputFormat.toUpperCase()}</span>
              </>
            )}
          </div>
            
          {file.metadata && (
            <div className="flex items-center mt-1 text-xs text-gray-500 space-x-3">
              {file.metadata.dimensions && (
                <span>{file.metadata.dimensions}</span>
              )}
              {file.metadata.duration && (
                <span>{file.metadata.duration}</span>
              )}
            </div>
          )}

          {file.status === 'error' && file.errorMessage && (
            <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
              {file.errorMessage}
            </div>
          )}
        </div>
      </div>
      
      <div className="flex items-center ml-3 space-x-2">
        <span className="text-xs text-gray-500 ml-2 flex items-center">
          {getStatusText()}
        </span>
        {file.metadata && onShowMetadata && (
          <button
            onClick={() => onShowMetadata(file)}
            className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
            title="Show metadata"
          >
            <Info className="h-4 w-4" />
          </button>
        )}
        <button
          onClick={() => onRemove(file.id)}
          className="p-1 text-gray-400 hover:text-red-600 transition-colors"
          title="Remove file"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}; 