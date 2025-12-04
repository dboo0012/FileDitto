import React, { useState, useEffect, useMemo } from "react";
import { 
  Trash2, 
  StopCircle, 
  FileText, 
  CheckCircle, 
  AlertCircle, 
  Info, 
  FolderOpen, 
  X,
  Video,
  Music,
  Image as ImageIcon,
  ChevronDown,
  ChevronRight,
  MoreHorizontal,
  ChevronsUpDown
} from "lucide-react";
import { FileItem } from "./FileListItem";
import { TauriAPI } from "../utils/tauri";
import { FormatUtils, MediaType, MediaTypeFormats } from "../types/supportedFormats";
import { ImagePreview } from "./ImagePreview";
import { VideoPreview } from "./VideoPreview";

// Maximum number of files to show per group initially
const INITIAL_DISPLAY_LIMIT = 20;

interface FileListProps {
  files: FileItem[];
  isLoading: boolean;
  onRemove: (id: string) => Promise<void> | void;
  onShowMetadata: (file: FileItem) => void;
  onCancel: (conversionId: string) => void;
  onCancelAll: () => Promise<void> | void;
  onClearAll: () => Promise<void> | void;
  onOpenFolder?: (filePath: string) => void;
  formatsByType?: MediaTypeFormats;
}

interface GroupedFiles {
  video: FileItem[];
  audio: FileItem[];
  image: FileItem[];
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
  formatsByType,
}) => {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [collapsedGroups, setCollapsedGroups] = useState<Set<MediaType>>(new Set());
  const [expandedGroups, setExpandedGroups] = useState<Set<MediaType>>(new Set());
  const formatFileSize = TauriAPI.formatFileSize;

  // Toggle collapse state for a media type group
  const toggleGroupCollapse = (mediaType: MediaType) => {
    setCollapsedGroups(prev => {
      const next = new Set(prev);
      if (next.has(mediaType)) {
        next.delete(mediaType);
      } else {
        next.add(mediaType);
      }
      return next;
    });
  };

  // Toggle showing all files in a group
  const toggleShowAllFiles = (mediaType: MediaType, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering collapse
    setExpandedGroups(prev => {
      const next = new Set(prev);
      if (next.has(mediaType)) {
        next.delete(mediaType);
      } else {
        next.add(mediaType);
      }
      return next;
    });
  };

  // Group files by media type
  const groupedFiles = useMemo((): GroupedFiles => {
    const groups: GroupedFiles = { video: [], audio: [], image: [] };
    files.forEach(file => {
      const mediaType = FormatUtils.detectMediaType(file.name);
      if (mediaType && groups[mediaType]) {
        groups[mediaType].push(file);
      }
    });
    return groups;
  }, [files]);

  // Get ordered list of media types that have files
  const presentMediaTypes = useMemo((): MediaType[] => {
    const types: MediaType[] = [];
    if (groupedFiles.video.length > 0) types.push("video");
    if (groupedFiles.audio.length > 0) types.push("audio");
    if (groupedFiles.image.length > 0) types.push("image");
    return types;
  }, [groupedFiles]);

  // Get icon for media type
  const getMediaTypeIcon = (mediaType: MediaType) => {
    switch (mediaType) {
      case "video": return <Video className="h-4 w-4" />;
      case "audio": return <Music className="h-4 w-4" />;
      case "image": return <ImageIcon className="h-4 w-4" />;
    }
  };

  // Get the output format to display for a file
  const getDisplayOutputFormat = (file: FileItem): string | undefined => {
    // If file already has outputFormat set (e.g., during/after conversion), use that
    if (file.outputFormat) return file.outputFormat;
    
    // Otherwise, show the currently selected format for this file's media type
    if (formatsByType) {
      const mediaType = FormatUtils.detectMediaType(file.name);
      if (mediaType) {
        return formatsByType[mediaType] || undefined;
      }
    }
    return undefined;
  };

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
      if (file.type === "audio") {
        return <Music className="h-5 w-5 text-gray-400" />;
      }
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
        <table className="min-w-full divide-y divide-gray-200 table-fixed">
          <colgroup>
            <col className="w-12" />
            <col />
            <col className="w-24" />
            <col className="w-28" />
            <col className="w-28" />
            <col className="w-24" />
          </colgroup>
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
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
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Size
              </th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Format
              </th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th scope="col" className="relative px-4 py-3">
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
              presentMediaTypes.map((mediaType) => {
                const groupFiles = groupedFiles[mediaType];
                const selectedFormat = formatsByType?.[mediaType];
                const isCollapsed = collapsedGroups.has(mediaType);
                const isExpanded = expandedGroups.has(mediaType);
                const hasMoreFiles = groupFiles.length > INITIAL_DISPLAY_LIMIT;
                const displayedFiles = isExpanded ? groupFiles : groupFiles.slice(0, INITIAL_DISPLAY_LIMIT);
                const hiddenCount = groupFiles.length - INITIAL_DISPLAY_LIMIT;
                
                return (
                  <React.Fragment key={mediaType}>
                    {/* Media type separator header - collapsible */}
                    {presentMediaTypes.length > 1 && (
                      <tr 
                        className="bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors"
                        onClick={() => toggleGroupCollapse(mediaType)}
                      >
                        <td colSpan={6} className="px-4 py-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="text-gray-400">
                                {isCollapsed ? (
                                  <ChevronRight className="h-4 w-4" />
                                ) : (
                                  <ChevronDown className="h-4 w-4" />
                                )}
                              </span>
                              <span className="text-gray-500">
                                {getMediaTypeIcon(mediaType)}
                              </span>
                              <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                                {mediaType} Files ({groupFiles.length})
                              </span>
                              {hasMoreFiles && !isCollapsed && (
                                <span className="text-xs text-gray-400">
                                  {isExpanded ? '(showing all)' : `(showing ${INITIAL_DISPLAY_LIMIT})`}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              {selectedFormat && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-700">
                                  → {selectedFormat.toUpperCase()}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                    
                    {/* Files in this group - hidden when collapsed */}
                    {!isCollapsed && displayedFiles.map((file) => {
                      const isSelected = selectedIds.has(file.id);
                      const mediaType = FormatUtils.detectMediaType(file.name);
                      const isImage = mediaType === "image";
                      const isVideo = mediaType === "video";
                      const displayFormat = getDisplayOutputFormat(file);
                      
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
                              ) : isVideo ? (
                                <div className="flex-shrink-0 h-10 w-10 rounded-md overflow-hidden mr-3">
                                  <VideoPreview file={file} className="h-full w-full" />
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
                                  {file.metadata?.dimensions}
                                  {file.metadata?.dimensions && file.metadata?.duration && " • "}
                                  {file.metadata?.duration}
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
                            {displayFormat ? (
                               <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium 
                                 ${file.outputFormat 
                                   ? 'bg-blue-100 text-blue-800' 
                                   : 'bg-gray-100 text-gray-600 border border-dashed border-gray-300'
                                 }`}>
                                 {displayFormat.toUpperCase()}
                               </span>
                            ) : (
                              <span className="text-gray-400 text-xs italic">Select format</span>
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
                    })}
                    
                    {/* Show more/less button when there are more files than the limit */}
                    {!isCollapsed && hasMoreFiles && (
                      <tr className="bg-gray-50/50">
                        <td colSpan={6} className="px-4 py-2">
                          <button
                            onClick={(e) => toggleShowAllFiles(mediaType, e)}
                            className="w-full flex items-center justify-center gap-2 py-1.5 text-xs font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded transition-colors"
                          >
                            {isExpanded ? (
                              <>
                                <ChevronsUpDown className="h-3.5 w-3.5" />
                                Show less (hide {hiddenCount} files)
                              </>
                            ) : (
                              <>
                                <MoreHorizontal className="h-3.5 w-3.5" />
                                Show {hiddenCount} more files
                              </>
                            )}
                          </button>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
