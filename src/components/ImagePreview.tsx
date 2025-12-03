import React, { useState, useMemo, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { convertFileSrc } from "@tauri-apps/api/core";
import { X, ZoomIn } from "lucide-react";
import { FileItem } from "./FileListItem";
import { FormatUtils } from "../types/supportedFormats";

interface ImagePreviewProps {
  file: FileItem;
  className?: string;
}

interface ImageLightboxProps {
  imageSrc: string;
  fileName: string;
  onClose: () => void;
}

const ANIMATION_DURATION = 200; // ms

const ImageLightbox: React.FC<ImageLightboxProps> = ({
  imageSrc,
  fileName,
  onClose,
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  // Handle close with animation
  const handleClose = useCallback(() => {
    if (isClosing) return; // Prevent multiple close triggers
    setIsClosing(true);
    setTimeout(() => {
      onClose();
    }, ANIMATION_DURATION);
  }, [onClose, isClosing]);

  // Handle escape key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    // Prevent body scroll when lightbox is open
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [handleClose]);

  // Handle click on backdrop to close
  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) {
        handleClose();
      }
    },
    [handleClose]
  );

  return createPortal(
    <div
      className={`
        fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm
        transition-all duration-200 ease-out
        ${isClosing ? "bg-black/0" : "bg-black/80"}
      `}
      onClick={handleBackdropClick}
      style={{ 
        animation: isClosing ? "fadeOut 0.2s ease-out forwards" : "fadeIn 0.2s ease-out" 
      }}
    >
      {/* Close button */}
      <button
        onClick={handleClose}
        className={`
          absolute top-4 right-4 z-10 p-2 rounded-full bg-black/50 text-white 
          hover:bg-black/70 transition-all duration-200
          ${isClosing ? "opacity-0 scale-90" : "opacity-100 scale-100"}
        `}
        title="Close (Esc)"
      >
        <X className="h-6 w-6" />
      </button>

      {/* File name */}
      <div 
        className={`
          absolute top-4 left-4 z-10 px-3 py-1.5 rounded-lg bg-black/50 
          text-white text-sm font-medium max-w-md truncate
          transition-all duration-200
          ${isClosing ? "opacity-0 -translate-y-2" : "opacity-100 translate-y-0"}
        `}
      >
        {fileName}
      </div>

      {/* Loading indicator */}
      {!isLoaded && !isClosing && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-10 h-10 border-4 border-white/30 border-t-white rounded-full animate-spin" />
        </div>
      )}

      {/* Image container */}
      <div 
        className={`
          relative max-w-[90vw] max-h-[90vh] p-4
          transition-all duration-200 ease-out
          ${isClosing ? "opacity-0 scale-95" : "opacity-100 scale-100"}
        `}
      >
        <img
          src={imageSrc}
          alt={fileName}
          className={`
            max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl
            transition-all duration-300
            ${isLoaded && !isClosing ? "opacity-100 scale-100" : "opacity-0 scale-95"}
          `}
          onLoad={() => setIsLoaded(true)}
        />
      </div>

      {/* Instructions */}
      <div 
        className={`
          absolute bottom-4 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-lg 
          bg-black/50 text-white/70 text-xs
          transition-all duration-200
          ${isClosing ? "opacity-0 translate-y-2" : "opacity-100 translate-y-0"}
        `}
      >
        Press <kbd className="px-1.5 py-0.5 bg-white/20 rounded text-white">Esc</kbd> or click outside to close
      </div>
    </div>,
    document.body
  );
};

export const ImagePreview: React.FC<ImagePreviewProps> = ({
  file,
  className = "",
}) => {
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [showLightbox, setShowLightbox] = useState(false);

  // Only show preview for image files
  const isImage = FormatUtils.detectMediaType(file.name) === "image";

  // Convert the file path to an asset URL that Tauri's webview can load
  const imageSrc = useMemo(() => {
    if (!isImage || !file.path) return null;
    try {
      return convertFileSrc(file.path);
    } catch (error) {
      console.error("Error converting file src:", error);
      return null;
    }
  }, [file.path, isImage]);

  const handleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent row selection or other parent click handlers
    setShowLightbox(true);
  }, []);

  const handleCloseLightbox = useCallback(() => {
    setShowLightbox(false);
  }, []);

  if (!isImage || imageError || !imageSrc) {
    return null;
  }

  return (
    <>
      <div
        className={`relative cursor-pointer group ${className}`}
        onClick={handleClick}
        title="Click to enlarge"
      >
        {!imageLoaded && (
          <div className="absolute inset-0 bg-gray-100 rounded animate-pulse flex items-center justify-center">
            <div className="text-gray-400 text-xs">...</div>
          </div>
        )}

        <img
          src={imageSrc}
          alt={file.name}
          className={`
            rounded border border-gray-200 object-cover transition-all duration-200
            ${imageLoaded ? "opacity-100" : "opacity-0"}
            group-hover:border-blue-400 group-hover:shadow-md
            ${className}
          `}
          onLoad={() => setImageLoaded(true)}
          onError={() => setImageError(true)}
          style={{
            maxWidth: "100%",
            maxHeight: "120px",
          }}
        />

        {/* Zoom indicator on hover */}
        {imageLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/30 rounded transition-all duration-200">
            <ZoomIn className="h-4 w-4 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
          </div>
        )}
      </div>

      {/* Lightbox modal */}
      {showLightbox && (
        <ImageLightbox
          imageSrc={imageSrc}
          fileName={file.name}
          onClose={handleCloseLightbox}
        />
      )}
    </>
  );
};
