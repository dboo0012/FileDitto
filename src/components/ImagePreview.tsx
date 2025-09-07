import React, { useState } from "react";
import { FileItem } from "./FileListItem";
import { FormatUtils } from "../types/supportedFormats";

interface ImagePreviewProps {
  file: FileItem;
  className?: string;
}

export const ImagePreview: React.FC<ImagePreviewProps> = ({
  file,
  className = "",
}) => {
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  // Only show preview for image files
  const isImage = FormatUtils.detectMediaType(file.name) === "image";

  if (!isImage || imageError) {
    return null;
  }

  return (
    <div className={`relative ${className}`}>
      {!imageLoaded && (
        <div className="absolute inset-0 bg-gray-100 rounded animate-pulse flex items-center justify-center">
          <div className="text-gray-400 text-xs">Loading...</div>
        </div>
      )}

      <img
        src={`file://${file.path}`}
        alt={file.name}
        className={`
          rounded border border-gray-200 object-cover transition-opacity duration-200
          ${imageLoaded ? "opacity-100" : "opacity-0"}
          ${className}
        `}
        onLoad={() => setImageLoaded(true)}
        onError={() => setImageError(true)}
        style={{
          maxWidth: "100%",
          maxHeight: "120px",
        }}
      />
    </div>
  );
};
