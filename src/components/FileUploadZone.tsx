import { DragEvent, ChangeEvent } from 'react';
import { Upload } from 'lucide-react';

interface FileUploadZoneProps {
  dragActive: boolean;
  onDragEnter: (e: DragEvent) => void;
  onDragLeave: (e: DragEvent) => void;
  onDragOver: (e: DragEvent) => void;
  onDrop: (e: DragEvent) => void;
  onFileSelect: (e: ChangeEvent<HTMLInputElement>) => void;
}

export const FileUploadZone = ({
  dragActive,
  onDragEnter,
  onDragLeave,
  onDragOver,
  onDrop,
  onFileSelect,
}: FileUploadZoneProps) => {
  return (
    <div
      className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
        dragActive 
          ? 'border-blue-400 bg-blue-50' 
          : 'border-gray-300 hover:border-gray-400'
      }`}
      onDragEnter={onDragEnter}
      onDragLeave={onDragLeave}
      onDragOver={onDragOver}
      onDrop={onDrop}
    >
      <input
        type="file"
        multiple
        onChange={onFileSelect}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        accept="video/*,audio/*,image/*"
      />
      
      <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
      <p className="text-sm text-gray-600 mb-2">
        <span className="font-medium text-blue-600">Click to upload</span> or drag and drop
      </p>
      <p className="text-xs text-gray-500">
        Support for video, audio, and image files (MP4, AVI, MP3, JPG, PNG, etc.)
      </p>
      <p className="text-xs text-blue-600 mt-1">
        For best results, use "Browse Files" button above
      </p>
    </div>
  );
}; 