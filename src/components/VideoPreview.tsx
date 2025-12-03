import React, { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import { convertFileSrc } from "@tauri-apps/api/core";
import { X, Play, Video } from "lucide-react";
import { FileItem } from "./FileListItem";
import { FormatUtils } from "../types/supportedFormats";

interface VideoPreviewProps {
  file: FileItem;
  className?: string;
}

const ANIMATION_DURATION = 200; // ms
const PLAYBACK_SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 2];

export const VideoPreview: React.FC<VideoPreviewProps> = ({
  file,
  className = "",
}) => {
  const [showLightbox, setShowLightbox] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Handle playback speed change
  const handleSpeedChange = useCallback((speed: number) => {
    setPlaybackRate(speed);
    if (videoRef.current) {
      videoRef.current.playbackRate = speed;
    }
  }, []);

  // Only show preview for video files
  const isVideo = FormatUtils.detectMediaType(file.name) === "video";

  // Convert file src when lightbox is open
  const videoSrc = useMemo(() => {
    if (!showLightbox || !isVideo || !file.path) return null;
    try {
      return convertFileSrc(file.path);
    } catch (error) {
      console.error("Error converting file src:", error);
      return null;
    }
  }, [file.path, isVideo, showLightbox]);

  // Handle close with animation
  const handleClose = useCallback(() => {
    if (isClosing) return;
    
    // Pause video when closing
    if (videoRef.current) {
      videoRef.current.pause();
    }
    
    setIsClosing(true);
    setTimeout(() => {
      setShowLightbox(false);
      setIsClosing(false);
      setIsLoaded(false);
      setPlaybackRate(1); // Reset speed when closing
    }, ANIMATION_DURATION);
  }, [isClosing]);

  // Handle escape key to close
  useEffect(() => {
    if (!showLightbox) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [showLightbox, handleClose]);

  // Handle click on backdrop to close
  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) {
        handleClose();
      }
    },
    [handleClose]
  );

  const handleThumbnailClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setShowLightbox(true);
  }, []);

  if (!isVideo) {
    return null;
  }

  return (
    <>
      {/* Static thumbnail placeholder - no video loading */}
      <div
        className={`relative cursor-pointer group ${className}`}
        onClick={handleThumbnailClick}
        title="Click to play video"
      >
        {/* Video icon background */}
        <div
          className={`
            flex items-center justify-center bg-gradient-to-br from-gray-700 to-gray-900 
            rounded border border-gray-300 transition-all duration-200
            group-hover:border-blue-400 group-hover:shadow-md
            ${className}
          `}
        >
          <Video className="h-5 w-5 text-gray-400" />
        </div>

        {/* Play button overlay on hover */}
        <div
          className={`
            absolute inset-0 flex items-center justify-center 
            bg-black/0 group-hover:bg-black/40 rounded transition-all duration-200
          `}
        >
          <div
            className={`
              w-6 h-6 rounded-full bg-white/90 flex items-center justify-center
              opacity-0 group-hover:opacity-100 scale-75 group-hover:scale-100
              transition-all duration-200 shadow-lg
            `}
          >
            <Play className="h-3 w-3 text-gray-800 ml-0.5" fill="currentColor" />
          </div>
        </div>
      </div>

      {/* Video lightbox */}
      {showLightbox && videoSrc && createPortal(
        <div
          className={`
            fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm
            transition-all duration-200 ease-out
            ${isClosing ? "bg-black/0" : "bg-black/90"}
          `}
          onClick={handleBackdropClick}
          style={{
            animation: isClosing
              ? "fadeOut 0.2s ease-out forwards"
              : "fadeIn 0.2s ease-out",
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
            {file.name}
          </div>

          {/* Playback speed controls */}
          <div
            className={`
              absolute top-4 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1
              px-2 py-1 rounded-lg bg-black/50
              transition-all duration-200
              ${isClosing ? "opacity-0 -translate-y-2" : "opacity-100 translate-y-0"}
            `}
          >
            <span className="text-white/60 text-xs mr-1">Speed:</span>
            {PLAYBACK_SPEEDS.map((speed) => (
              <button
                key={speed}
                onClick={() => handleSpeedChange(speed)}
                className={`
                  px-2 py-0.5 rounded text-xs font-medium transition-all
                  ${playbackRate === speed 
                    ? "bg-white text-black" 
                    : "text-white/80 hover:bg-white/20"
                  }
                `}
              >
                {speed}x
              </button>
            ))}
          </div>

          {/* Loading indicator */}
          {!isLoaded && !isClosing && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-10 h-10 border-4 border-white/30 border-t-white rounded-full animate-spin" />
            </div>
          )}

          {/* Video container */}
          <div
            className={`
              relative max-w-[90vw] max-h-[90vh] p-4
              transition-all duration-200 ease-out
              ${isClosing ? "opacity-0 scale-95" : "opacity-100 scale-100"}
            `}
          >
            <video
              ref={videoRef}
              src={videoSrc}
              controls
              autoPlay
              disablePictureInPicture
              controlsList="nodownload"
              className={`
                max-w-full max-h-[85vh] rounded-lg shadow-2xl bg-black
                transition-opacity duration-300
                ${isLoaded && !isClosing ? "opacity-100" : "opacity-0"}
              `}
              onLoadedData={() => setIsLoaded(true)}
              onCanPlay={() => setIsLoaded(true)}
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
            Press{" "}
            <kbd className="px-1.5 py-0.5 bg-white/20 rounded text-white">Esc</kbd>{" "}
            or click outside to close
          </div>
        </div>,
        document.body
      )}
    </>
  );
};
