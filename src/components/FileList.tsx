import React, { useState, useEffect } from "react";
import { 
  Trash2, 
  StopCircle, 
  FileText, 
  CheckCircle, 
  AlertCircle, 
  Info, 
  FolderOpen, 
  X 
} from "lucide-react";
import { FileItem } from "./FileListItem";
import { TauriAPI } from "../utils/tauri";
import { FormatUtils } from "../types/supportedFormats";
import { ImagePreview } from "./ImagePreview";

interface FileListProps {
  files: FileItem[];
  isLoading: boolean;
  onRemove: (id: string) => Promise<void> | void;
  onShowMetadata: (file: FileItem) => void;
  onCancel: (conversionId: string) => void;
  onCancelAll: () => Promise<void> | void;
  onClearAll: () => Promise<void> | void;
  onOpenFolder?: (filePath: string) => void;
}

export const FileList: React.FC<FileListProps> = ({
  files,
  isLoading,
  onRemove,
  onShowMetadata,
  onCancel,
  onCancelAll,
  onClearAll,
  onOpenFolder,
}) => {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const formatFileSize = TauriAPI.formatFileSize;

  // Reset selection when files change (optional, or keep selection if file still exists)
  useEffect(() => {
    setSelectedIds(prev => {
      const next = new Set<string>();
      prev.forEach(id => {
        if (files.find(f => f.id === id)) {
          next.add(id);
        }
      });
      return next;
    });
  }, [files]);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(files.map(f => f.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    const next = new Set(selectedIds);
    if (checked) {
      next.add(id);
    } else {
      next.delete(id);
    }
    setSelectedIds(next);
  };

  const handleRemoveSelected = async () => {
    const idsToRemove = Array.from(selectedIds);
    // Clear selection first to avoid UI glitches
    setSelectedIds(new Set());
    
    // Remove files one by one (or use a batch API if available)
    for (const id of idsToRemove) {
      await onRemove(id);
    }
  };

  const convertingFiles = files.filter((f) => f.status === "converting");
  const hasConvertingFiles = convertingFiles.length > 0;

  const getStatusIcon = (file: FileItem) => {
    if (file.status === "completed") {
      return <CheckCircle className="h-5 w-5 text-green-500" />;
    } else if (file.status === "error") {
      return <AlertCircle className="h-5 w-5 text-red-500" />;
    } else if (file.status === "cancelled") {
      return <StopCircle className="h-5 w-5 text-orange-500" />;
    } else if (file.status === "converting") {
      return (
        <div className="h-5 w-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      );
    } else {
      return <FileText className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusText = (file: FileItem) => {
    if (file.status === "completed") return "Completed";
    if (file.status === "error") return "Failed";
    if (file.status === "cancelled") return "Cancelled";
    if (file.status === "converting") return "Converting...";
    return "Pending";
  };

  if (files.length === 0 && !isLoading) {
    return null;
  }

  return (
    <div className="mt-6 bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
      {/* Header Actions */}
      <div className="px-4 py-3 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h3 className="text-sm font-semibold text-gray-900">
            Files ({files.length})
          </h3>
          {selectedIds.size > 0 && (
             <span className="text-sm text-blue-600 font-medium">
               {selectedIds.size} selected
             </span>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          {selectedIds.size > 0 && (
            <button
              onClick={handleRemoveSelected}
              className="flex items-center px-3 py-1.5 text-xs font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors"
            >
              <Trash2 className="h-3.5 w-3.5 mr-1.5" />
              Delete Selected
            </button>
          )}
          
          {hasConvertingFiles && (
            <button
              onClick={onCancelAll}
              className="flex items-center px-3 py-1.5 text-xs font-medium text-orange-600 hover:text-orange-700 hover:bg-orange-50 rounded-md transition-colors"
            >
              <StopCircle className="h-3.5 w-3.5 mr-1.5" />
              Stop All
            </button>
          )}
          
          <button
            onClick={onClearAll}
            className="flex items-center px-3 py-1.5 text-xs font-medium text-gray-600 hover:text-red-600 hover:bg-gray-100 rounded-md transition-colors"
          >
            <Trash2 className="h-3.5 w-3.5 mr-1.5" />
            Clear All
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-8">
                <input
                  type="checkbox"
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  checked={files.length > 0 && selectedIds.size === files.length}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                />
              </th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                File
              </th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                Size
              </th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                Format
              </th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                Status
              </th>
              <th scope="col" className="relative px-4 py-3 w-20">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {isLoading ? (
              <tr>
                <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">
                   <div className="flex justify-center items-center">
                     <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 mr-2"></div>
                     Loading files...
                   </div>
                </td>
              </tr>
            ) : (
              files.map((file) => {
                const isSelected = selectedIds.has(file.id);
                const isImage = FormatUtils.detectMediaType(file.name) === "image";
                
                return (
                  <tr 
                    key={file.id} 
                    className={`hover:bg-gray-50 transition-colors ${isSelected ? 'bg-blue-50' : ''}`}
                  >
                    <td className="px-4 py-3 whitespace-nowrap">
                      <input
                        type="checkbox"
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        checked={isSelected}
                        onChange={(e) => handleSelectOne(file.id, e.target.checked)}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center">
                        {isImage ? (
                          <div className="flex-shrink-0 h-10 w-10 bg-gray-100 rounded-md overflow-hidden mr-3 border border-gray-200">
                            <ImagePreview file={file} className="h-full w-full object-cover" />
                          </div>
                        ) : (
                          <div className="flex-shrink-0 h-10 w-10 bg-gray-100 rounded-md flex items-center justify-center mr-3 border border-gray-200">
                            {getStatusIcon(file)}
                          </div>
                        )}
                        <div className="min-w-0 overflow-hidden">
                          <div className="text-sm font-medium text-gray-900 truncate max-w-[200px] sm:max-w-[300px]" title={file.name}>
                            {file.name}
                          </div>
                          <div className="text-xs text-gray-500">
                            {file.type}
                            {file.metadata?.dimensions && ` • ${file.metadata.dimensions}`}
                            {file.metadata?.duration && ` • ${file.metadata.duration}`}
                          </div>
                          {file.status === "error" && file.errorMessage && (
                             <div className="text-xs text-red-600 truncate max-w-xs mt-0.5">
                               {file.errorMessage}
                             </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                      {formatFileSize(file.size)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                      {file.outputFormat ? (
                         <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                           {file.outputFormat.toUpperCase()}
                         </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                       <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                         ${file.status === 'completed' ? 'bg-green-100 text-green-800' : 
                           file.status === 'error' ? 'bg-red-100 text-red-800' : 
                           file.status === 'converting' ? 'bg-blue-100 text-blue-800' : 
                           file.status === 'cancelled' ? 'bg-orange-100 text-orange-800' : 
                           'bg-gray-100 text-gray-800'}`}>
                         {getStatusText(file)}
                       </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        {onShowMetadata && (
                          <button
                            onClick={() => onShowMetadata(file)}
                            className="text-gray-400 hover:text-blue-600 transition-colors"
                            title="Info"
                          >
                            <Info className="h-4 w-4" />
                          </button>
                        )}
                        
                        {file.status === "completed" && onOpenFolder && (
                          <button
                            onClick={() => onOpenFolder(file.outputPath || file.path)}
                            className="text-gray-400 hover:text-blue-600 transition-colors"
                            title="Open Folder"
                          >
                            <FolderOpen className="h-4 w-4" />
                          </button>
                        )}

                        {file.status === "converting" && file.conversionId && onCancel ? (
                          <button
                            onClick={() => onCancel(file.conversionId!)}
                            className="text-orange-400 hover:text-orange-600 transition-colors"
                            title="Cancel"
                          >
                            <StopCircle className="h-4 w-4" />
                          </button>
                        ) : (
                          <button
                            onClick={() => onRemove(file.id)}
                            className="text-gray-400 hover:text-red-600 transition-colors"
                            title="Remove"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
