import { X, File, Image, Video, Music } from 'lucide-react';
import { FileItem } from './FileListItem';

interface MetadataModalProps {
  file: FileItem | null;
  isOpen: boolean;
  onClose: () => void;
}

export const MetadataModal = ({ file, isOpen, onClose }: MetadataModalProps) => {
  if (!isOpen || !file) return null;

  const getFileIcon = () => {
    if (file.type.startsWith('video/')) return <Video className="h-6 w-6 text-blue-500" />;
    if (file.type.startsWith('audio/')) return <Music className="h-6 w-6 text-green-500" />;
    if (file.type.startsWith('image/')) return <Image className="h-6 w-6 text-purple-500" />;
    return <File className="h-6 w-6 text-gray-500" />;
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-96 overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center">
            {getFileIcon()}
            <h3 className="ml-2 text-lg font-medium text-gray-900">File Metadata</h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <div className="p-4 overflow-y-auto">
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-2">Basic Information</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Name:</span>
                  <span className="font-medium text-right max-w-48 truncate">{file.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Size:</span>
                  <span className="font-medium">{formatFileSize(file.size)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Type:</span>
                  <span className="font-medium">{file.type || 'Unknown'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Status:</span>
                  <span className={`font-medium ${
                    file.status === 'completed' ? 'text-green-600' :
                    file.status === 'error' ? 'text-red-600' :
                    file.status === 'converting' ? 'text-blue-600' :
                    'text-gray-600'
                  }`}>
                    {file.status.charAt(0).toUpperCase() + file.status.slice(1)}
                  </span>
                </div>
              </div>
            </div>

            {file.metadata && (
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-2">Media Information</h4>
                <div className="space-y-2 text-sm">
                  {file.metadata.dimensions && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Dimensions:</span>
                      <span className="font-medium">{file.metadata.dimensions}</span>
                    </div>
                  )}
                  {file.metadata.duration && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Duration:</span>
                      <span className="font-medium">{file.metadata.duration}</span>
                    </div>
                  )}
                  {file.metadata.bitrate && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Bitrate:</span>
                      <span className="font-medium">{file.metadata.bitrate}</span>
                    </div>
                  )}
                  {file.metadata.codec && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Codec:</span>
                      <span className="font-medium">{file.metadata.codec}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {file.outputFormat && (
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-2">Conversion Settings</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Output Format:</span>
                    <span className="font-medium text-blue-600">{file.outputFormat.toUpperCase()}</span>
                  </div>
                  {file.progress !== undefined && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Progress:</span>
                      <span className="font-medium">{file.progress}%</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {file.errorMessage && (
              <div>
                <h4 className="text-sm font-medium text-red-600 mb-2">Error Details</h4>
                <div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                  {file.errorMessage}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}; 