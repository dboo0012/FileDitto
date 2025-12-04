import React, { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { convertFileSrc } from "@tauri-apps/api/core";
import { Play, Pause, Rewind, FastForward } from "lucide-react";
import { FileItem } from "./FileListItem";
import { FormatUtils } from "../types/supportedFormats";

interface AudioPreviewProps {
  file: FileItem;
  className?: string;
  compact?: boolean;
  showFileName?: boolean;
}

const PLAYBACK_SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 2];
const SKIP_SECONDS = 10;

export const AudioPreview: React.FC<AudioPreviewProps> = ({
  file,
  className = "",
  compact = false,
  showFileName = true,
}) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);

  // Only render for audio files
  const isAudio = FormatUtils.detectMediaType(file.name) === "audio";

  // Convert the file path to an asset URL that Tauri's webview can load
  const audioSrc = useMemo(() => {
    if (!isAudio || !file.path) return null;
    try {
      return convertFileSrc(file.path);
    } catch (error) {
      console.error("Error converting file src:", error);
      return null;
    }
  }, [file.path, isAudio]);

  // Format time as mm:ss
  const formatTime = useCallback((seconds: number) => {
    if (!isFinite(seconds) || isNaN(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  }, []);

  // Handle play/pause
  const togglePlay = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (!audioRef.current) return;
    
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
  }, [isPlaying]);

  // Handle skip forward/backward
  const handleSkip = useCallback((seconds: number) => (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!audioRef.current) return;
    audioRef.current.currentTime = Math.max(0, Math.min(duration, audioRef.current.currentTime + seconds));
  }, [duration]);

  // Handle playback speed change
  const handleSpeedChange = useCallback((speed: number) => (e: React.MouseEvent) => {
    e.stopPropagation();
    setPlaybackRate(speed);
    if (audioRef.current) {
      audioRef.current.playbackRate = speed;
    }
    setShowSpeedMenu(false);
  }, []);

  // Handle progress bar click/drag
  const handleProgressClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    if (!audioRef.current || !progressRef.current) return;
    
    const rect = progressRef.current.getBoundingClientRect();
    const percent = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    audioRef.current.currentTime = percent * duration;
  }, [duration]);

  // Handle mouse down on progress bar for dragging
  const handleProgressMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    setIsDragging(true);
    handleProgressClick(e);
  }, [handleProgressClick]);

  // Handle mouse move during drag
  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!audioRef.current || !progressRef.current) return;
      
      const rect = progressRef.current.getBoundingClientRect();
      const percent = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      audioRef.current.currentTime = percent * duration;
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, duration]);

  // Audio event handlers
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleDurationChange = () => setDuration(audio.duration);
    const handleLoadedData = () => {
      setIsLoaded(true);
      setDuration(audio.duration);
    };
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("durationchange", handleDurationChange);
    audio.addEventListener("loadeddata", handleLoadedData);
    audio.addEventListener("play", handlePlay);
    audio.addEventListener("pause", handlePause);
    audio.addEventListener("ended", handleEnded);

    return () => {
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("durationchange", handleDurationChange);
      audio.removeEventListener("loadeddata", handleLoadedData);
      audio.removeEventListener("play", handlePlay);
      audio.removeEventListener("pause", handlePause);
      audio.removeEventListener("ended", handleEnded);
    };
  }, [audioSrc]);

  // Close speed menu when clicking outside
  useEffect(() => {
    if (!showSpeedMenu) return;
    
    const handleClickOutside = () => setShowSpeedMenu(false);
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [showSpeedMenu]);

  if (!isAudio || !audioSrc) {
    return null;
  }

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  if (compact) {
    // Compact version - seamless with table
    return (
      <div 
        className={`flex flex-col ${className}`}
        onClick={(e) => e.stopPropagation()}
      >
        <audio ref={audioRef} src={audioSrc} preload="metadata" />
        
        {/* File name at top */}
        {showFileName && (
          <div className="pb-2">
            <p className="text-sm font-medium text-gray-900 truncate text-center" title={file.name}>
              {file.name.replace(/\.[^/.]+$/, "")}
            </p>
          </div>
        )}
        
        {/* Main playback controls with speed button */}
        <div className="flex items-center justify-center gap-6 py-1">
          {/* Playback speed - left side */}
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowSpeedMenu(!showSpeedMenu);
              }}
              className={`
                px-2 py-0.5 text-xs font-medium rounded transition-colors
                ${playbackRate !== 1 
                  ? "bg-blue-100 text-blue-600" 
                  : "text-gray-500 hover:text-gray-700 hover:bg-gray-200"
                }
              `}
              title="Playback speed"
            >
              {playbackRate}x
            </button>
            
            {/* Speed dropdown */}
            {showSpeedMenu && (
              <div className="absolute bottom-full left-0 mb-1 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10">
                {PLAYBACK_SPEEDS.map((speed) => (
                  <button
                    key={speed}
                    onClick={handleSpeedChange(speed)}
                    className={`
                      block w-full px-4 py-1.5 text-xs text-left whitespace-nowrap
                      ${playbackRate === speed 
                        ? "bg-blue-50 text-blue-600 font-medium" 
                        : "text-gray-700 hover:bg-gray-100"
                      }
                    `}
                  >
                    {speed}x
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Rewind */}
          <button
            onClick={handleSkip(-SKIP_SECONDS)}
            disabled={!isLoaded}
            className="p-1 text-gray-500 hover:text-gray-700 transition-colors disabled:opacity-40"
            title={`Rewind ${SKIP_SECONDS}s`}
          >
            <Rewind className="h-5 w-5" fill="currentColor" />
          </button>

          {/* Play/Pause */}
          <button
            onClick={togglePlay}
            disabled={!isLoaded}
            className={`
              p-1 text-gray-700 hover:text-gray-900 transition-all
              ${!isLoaded ? "opacity-40 cursor-not-allowed" : ""}
            `}
            title={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? (
              <Pause className="h-6 w-6" fill="currentColor" />
            ) : (
              <Play className="h-6 w-6" fill="currentColor" />
            )}
          </button>

          {/* Fast Forward */}
          <button
            onClick={handleSkip(SKIP_SECONDS)}
            disabled={!isLoaded}
            className="p-1 text-gray-500 hover:text-gray-700 transition-colors disabled:opacity-40"
            title={`Forward ${SKIP_SECONDS}s`}
          >
            <FastForward className="h-5 w-5" fill="currentColor" />
          </button>

          {/* Spacer to balance layout */}
          <div className="w-8" />
        </div>

        {/* Progress bar section */}
        <div className="pt-1 pb-0.5">
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-gray-500 tabular-nums w-9 text-right">
              {formatTime(currentTime)}
            </span>
            
            {/* Progress bar */}
            <div
              ref={progressRef}
              className="flex-1 h-1 bg-gray-300 rounded-full cursor-pointer group relative"
              onClick={handleProgressClick}
              onMouseDown={handleProgressMouseDown}
            >
              <div
                className="h-full bg-blue-500 rounded-full transition-all duration-75"
                style={{ width: `${progress}%` }}
              />
              {/* Scrub handle */}
              <div
                className={`
                  absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white border-2 border-blue-500 rounded-full shadow-sm
                  transition-all duration-100
                  ${isDragging ? "scale-125 border-blue-600" : ""}
                `}
                style={{ left: `calc(${progress}% - 6px)` }}
              />
            </div>

            <span className="text-[11px] text-gray-500 tabular-nums w-9">
              {formatTime(duration)}
            </span>
          </div>
        </div>
      </div>
    );
  }

  // Full version with all controls - similar style to compact
  return (
    <div 
      className={`bg-gray-50 rounded-lg border border-gray-200 overflow-hidden ${className}`}
      onClick={(e) => e.stopPropagation()}
    >
      <audio ref={audioRef} src={audioSrc} preload="metadata" />
      
      {/* File name at top */}
      {showFileName && (
        <div className="px-5 pt-4 pb-2">
          <p className="text-base font-semibold text-gray-900 truncate text-center" title={file.name}>
            {file.name.replace(/\.[^/.]+$/, "")}
          </p>
        </div>
      )}
      
      {/* Main playback controls with speed button */}
      <div className="flex items-center justify-center gap-6 py-3">
        {/* Playback speed - left side */}
        <div className="relative">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowSpeedMenu(!showSpeedMenu);
            }}
            className={`
              px-2 py-1 text-xs font-medium rounded transition-colors
              ${playbackRate !== 1 
                ? "bg-blue-100 text-blue-600" 
                : "text-gray-500 hover:text-gray-700 hover:bg-gray-200"
              }
            `}
            title="Playback speed"
          >
            {playbackRate}x
          </button>
          
          {/* Speed dropdown */}
          {showSpeedMenu && (
            <div className="absolute bottom-full left-0 mb-1 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10">
              {PLAYBACK_SPEEDS.map((speed) => (
                <button
                  key={speed}
                  onClick={handleSpeedChange(speed)}
                  className={`
                    block w-full px-4 py-1.5 text-xs text-left whitespace-nowrap
                    ${playbackRate === speed 
                      ? "bg-blue-50 text-blue-600 font-medium" 
                      : "text-gray-700 hover:bg-gray-100"
                    }
                  `}
                >
                  {speed}x
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Rewind */}
        <button
          onClick={handleSkip(-SKIP_SECONDS)}
          disabled={!isLoaded}
          className="p-2 text-gray-600 hover:text-gray-800 transition-colors disabled:opacity-40"
          title={`Rewind ${SKIP_SECONDS}s`}
        >
          <Rewind className="h-6 w-6" fill="currentColor" />
        </button>

        {/* Play/Pause */}
        <button
          onClick={togglePlay}
          disabled={!isLoaded}
          className={`
            p-2 text-gray-700 hover:text-gray-900 transition-all
            ${!isLoaded ? "opacity-40 cursor-not-allowed" : ""}
          `}
          title={isPlaying ? "Pause" : "Play"}
        >
          {isPlaying ? (
            <Pause className="h-8 w-8" fill="currentColor" />
          ) : (
            <Play className="h-8 w-8" fill="currentColor" />
          )}
        </button>

        {/* Fast Forward */}
        <button
          onClick={handleSkip(SKIP_SECONDS)}
          disabled={!isLoaded}
          className="p-2 text-gray-600 hover:text-gray-800 transition-colors disabled:opacity-40"
          title={`Forward ${SKIP_SECONDS}s`}
        >
          <FastForward className="h-6 w-6" fill="currentColor" />
        </button>

        {/* Spacer to balance layout */}
        <div className="w-8" />
      </div>

      {/* Progress bar section */}
      <div className="px-5 pb-4">
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-500 tabular-nums w-10 text-right">
            {formatTime(currentTime)}
          </span>
          
          {/* Progress bar */}
          <div
            ref={progressRef}
            className="flex-1 h-1.5 bg-gray-300 rounded-full cursor-pointer group relative"
            onClick={handleProgressClick}
            onMouseDown={handleProgressMouseDown}
          >
            <div
              className="h-full bg-blue-500 rounded-full transition-all duration-75"
              style={{ width: `${progress}%` }}
            />
            {/* Scrub handle */}
            <div
              className={`
                absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white border-2 border-blue-500 rounded-full shadow-sm
                transition-all duration-100
                ${isDragging ? "scale-110 border-blue-600" : ""}
              `}
              style={{ left: `calc(${progress}% - 8px)` }}
            />
          </div>

          <span className="text-xs text-gray-500 tabular-nums w-10">
            {formatTime(duration)}
          </span>
        </div>
      </div>
    </div>
  );
};

