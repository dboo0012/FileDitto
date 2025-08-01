import { Upload } from 'lucide-react';

interface FileUploadZoneProps {
  dragActive: boolean;
  onBrowseClick: () => void;
}

export const FileUploadZone = ({
  dragActive,
  onBrowseClick,
}: FileUploadZoneProps) => {
  return (
    <div
      className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
        dragActive 
          ? 'border-blue-400 bg-blue-50' 
          : 'border-gray-300 hover:border-gray-400'
      }`}
      onClick={onBrowseClick}
    >
      <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
      <p className="text-sm text-gray-600 mb-2">
        <span className="font-medium text-blue-600">Click to browse files</span> or drag and drop
      </p>
      <p className="text-xs text-gray-500">
        Support for video, audio, and image files (MP4, AVI, MP3, JPG, PNG, etc.)
      </p>
    </div>
  );
}; 