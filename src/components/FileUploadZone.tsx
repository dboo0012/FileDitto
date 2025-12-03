import { Upload } from "lucide-react";

interface FileUploadZoneProps {
  dragActive: boolean;
  onBrowseClick: () => void;
}

export const FileUploadZone = ({
  dragActive,
  onBrowseClick,
}: FileUploadZoneProps) => {
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-medium text-gray-900">Upload Files</h2>
      </div>

      <div
        className={`
          group relative border-2 border-dashed rounded-xl p-10 text-center transition-all duration-200 cursor-pointer
          ${
            dragActive
              ? "border-blue-500 bg-blue-50 ring-4 ring-blue-100"
              : "border-gray-300 hover:border-blue-400 hover:bg-gray-50"
          }
        `}
        onClick={onBrowseClick}
      >
        <div className={`
          mx-auto h-14 w-14 flex items-center justify-center rounded-full mb-4 transition-transform duration-200 group-hover:scale-110
          ${dragActive ? "bg-blue-100 text-blue-600" : "bg-gray-100 text-gray-400 group-hover:text-blue-500 group-hover:bg-blue-50"}
        `}>
          <Upload className="h-7 w-7" />
        </div>
        
        <div className="space-y-1 mb-4">
          <p className="text-base font-medium text-gray-900">
            <span className="text-blue-600 hover:underline">Click to browse</span>
            {" "}or drag and drop
          </p>
          <p className="text-sm text-gray-500">
            Support for Video, Audio, and Image files
          </p>
        </div>

        <div className="inline-flex items-center px-3 py-1 rounded-full bg-gray-50 text-xs text-gray-500 border border-gray-100">
          MP4, AVI, MP3, JPG, PNG, WebP, and more
        </div>
      </div>
    </div>
  );
};
