import React from "react";
import { FileItem } from "./FileListItem";

interface FormatSettingsProps {
  selectedFormat: string;
  setSelectedFormat: (format: string) => void;
  selectedQuality: string;
  setSelectedQuality: (quality: string) => void;
  preserveMetadata: boolean;
  recommendations: string[];
  onStartConversion: () => void;
  onResetFiles: () => void;
  files: FileItem[];
  ffmpegAvailable: boolean | null;
}

export const FormatSettings: React.FC<FormatSettingsProps> = ({
  selectedFormat,
  setSelectedFormat,
  selectedQuality,
  setSelectedQuality,
  preserveMetadata,
  recommendations,
  onStartConversion,
  onResetFiles,
  files,
  ffmpegAvailable,
}) => {
  const hasRetryableFiles = files.some(
    (f) => f.status === "error" || f.status === "completed"
  );

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">
        Conversion Settings
      </h3>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Output Format
          </label>
          <select
            value={selectedFormat}
            onChange={(e) => setSelectedFormat(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Select format...</option>
            <optgroup label="Video">
              <option value="mp4">MP4</option>
              <option value="avi">AVI</option>
              <option value="mov">MOV</option>
              <option value="webm">WebM</option>
              <option value="mkv">MKV</option>
            </optgroup>
            <optgroup label="Audio">
              <option value="mp3">MP3</option>
              <option value="wav">WAV</option>
              <option value="aac">AAC</option>
              <option value="flac">FLAC</option>
              <option value="ogg">OGG</option>
            </optgroup>
            <optgroup label="Image">
              <option value="jpg">JPG</option>
              <option value="png">PNG</option>
              <option value="webp">WebP</option>
              <option value="gif">GIF</option>
              <option value="bmp">BMP</option>
            </optgroup>
          </select>

          {recommendations.length > 0 && (
            <div className="mt-2">
              <p className="text-xs text-gray-500 mb-1">
                Recommended for your files:
              </p>
              <div className="flex flex-wrap gap-1">
                {recommendations.map((format) => (
                  <button
                    key={format}
                    onClick={() => setSelectedFormat(format)}
                    className="px-2 py-1 text-xs bg-blue-50 text-blue-700 rounded hover:bg-blue-100 transition-colors"
                  >
                    {format.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Quality
          </label>
          <select
            value={selectedQuality}
            onChange={(e) => setSelectedQuality(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="high">High (Slower)</option>
            <option value="medium">Medium (Balanced)</option>
            <option value="low">Low (Faster)</option>
          </select>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-700">
            Preserve original metadata
          </span>
          <span className="text-sm text-gray-600">
            {preserveMetadata ? "Yes" : "No"}
            <span className="text-gray-400 ml-1">(configure in settings)</span>
          </span>
        </div>

        <div className="space-y-3">
          <button
            onClick={onStartConversion}
            disabled={files.length === 0 || !selectedFormat || !ffmpegAvailable}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium"
          >
            Start Conversion
          </button>

          {hasRetryableFiles && (
            <button
              onClick={onResetFiles}
              className="w-full bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700 transition-colors font-medium text-sm"
            >
              Reset All for Retry
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
