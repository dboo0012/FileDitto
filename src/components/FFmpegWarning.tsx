import React from "react";
import { AlertTriangle } from "lucide-react";

interface FFmpegWarningProps {
  onRetry: () => void;
}

export const FFmpegWarning: React.FC<FFmpegWarningProps> = ({ onRetry }) => {
  const checkFFmpegAvailability = async () => {
    try {
      // const available = await TauriAPI.checkFFmpegAvailability();
      // For now, we'll just retry
      onRetry();
    } catch (error) {
      console.error("Error checking FFmpeg:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
        <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
        <h1 className="text-xl font-semibold text-gray-900 mb-2">
          FFmpeg Not Found
        </h1>
        <p className="text-gray-600 mb-4">
          FFmpeg is required for file conversion but was not found on your
          system.
        </p>
        <div className="text-sm text-gray-500 mb-6">
          <p>Please install FFmpeg and ensure it's in your system PATH:</p>
          <ul className="mt-2 text-left">
            <li>• Windows: Download from ffmpeg.org</li>
            <li>• macOS: brew install ffmpeg</li>
            <li>• Linux: sudo apt install ffmpeg</li>
          </ul>
        </div>
        <button
          onClick={checkFFmpegAvailability}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
        >
          Check Again
        </button>
      </div>
    </div>
  );
};
