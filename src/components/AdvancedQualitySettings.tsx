import React from "react";
import { Info } from "lucide-react";
import {
  MediaType,
  VideoQualitySettings,
  AudioQualitySettings,
  ImageQualitySettings,
  VideoEncoder,
  VideoResolution,
  FrameRate,
  VIDEO_ENCODER_LABELS,
  VIDEO_RESOLUTION_LABELS,
  FRAME_RATE_LABELS,
  FORMAT_SUPPORTED_ENCODERS,
} from "../types/supportedFormats";

interface AdvancedQualitySettingsProps {
  mediaType: MediaType;
  format: string;
  videoSettings: VideoQualitySettings;
  audioSettings: AudioQualitySettings;
  imageSettings: ImageQualitySettings;
  onVideoSettingsChange: (settings: VideoQualitySettings) => void;
  onAudioSettingsChange: (settings: AudioQualitySettings) => void;
  onImageSettingsChange: (settings: ImageQualitySettings) => void;
  isDisabled?: boolean;
}

export const AdvancedQualitySettings: React.FC<AdvancedQualitySettingsProps> = ({
  mediaType,
  format,
  videoSettings,
  audioSettings,
  imageSettings,
  onVideoSettingsChange,
  onAudioSettingsChange,
  onImageSettingsChange,
  isDisabled = false,
}) => {
  // Get supported encoders for the current format
  const supportedEncoders = FORMAT_SUPPORTED_ENCODERS[format] || ['h264'];

  const renderVideoSettings = () => (
    <div className="space-y-5">
      {/* Encoder Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Video Encoder
        </label>
        <div className="grid grid-cols-2 gap-2">
          {supportedEncoders.map((encoder) => (
            <button
              key={encoder}
              onClick={() => onVideoSettingsChange({ ...videoSettings, encoder })}
              disabled={isDisabled}
              className={`
                px-3 py-2 text-sm rounded-lg border-2 transition-all
                ${videoSettings.encoder === encoder
                  ? "border-blue-500 bg-blue-50 text-blue-700"
                  : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
                }
                ${isDisabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
              `}
            >
              {VIDEO_ENCODER_LABELS[encoder]}
            </button>
          ))}
        </div>
        <p className="mt-1.5 text-xs text-gray-500">
          {videoSettings.encoder === 'h264' && "Most compatible, good quality-to-size ratio"}
          {videoSettings.encoder === 'h265' && "Better compression, requires modern devices"}
          {videoSettings.encoder === 'av1' && "Best compression, slower encoding"}
          {videoSettings.encoder === 'vp9' && "Open format, good for web streaming"}
        </p>
      </div>

      {/* Resolution Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Resolution
        </label>
        <div className="grid grid-cols-3 gap-2">
          {(Object.keys(VIDEO_RESOLUTION_LABELS) as VideoResolution[]).map((resolution) => (
            <button
              key={resolution}
              onClick={() => onVideoSettingsChange({ ...videoSettings, resolution })}
              disabled={isDisabled}
              className={`
                px-2 py-2 text-xs rounded-lg border-2 transition-all
                ${videoSettings.resolution === resolution
                  ? "border-blue-500 bg-blue-50 text-blue-700"
                  : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
                }
                ${isDisabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
              `}
            >
              {VIDEO_RESOLUTION_LABELS[resolution]}
            </button>
          ))}
        </div>
      </div>

      {/* Frame Rate Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Frame Rate
        </label>
        <div className="grid grid-cols-2 gap-2">
          {(Object.keys(FRAME_RATE_LABELS) as FrameRate[]).map((fps) => (
            <button
              key={fps}
              onClick={() => onVideoSettingsChange({ ...videoSettings, frameRate: fps })}
              disabled={isDisabled}
              className={`
                px-3 py-2 text-sm rounded-lg border-2 transition-all
                ${videoSettings.frameRate === fps
                  ? "border-blue-500 bg-blue-50 text-blue-700"
                  : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
                }
                ${isDisabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
              `}
            >
              {FRAME_RATE_LABELS[fps]}
            </button>
          ))}
        </div>
      </div>

      {/* Quality Slider */}
      <div>
        <div className="flex justify-between items-center mb-2">
          <label className="block text-sm font-medium text-gray-700">
            Quality
          </label>
          <span className="text-sm font-medium text-blue-600">
            {videoSettings.quality}%
          </span>
        </div>
        <input
          type="range"
          min="1"
          max="100"
          step="1"
          value={videoSettings.quality}
          onChange={(e) => onVideoSettingsChange({ ...videoSettings, quality: parseInt(e.target.value) })}
          disabled={isDisabled}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600 disabled:opacity-50"
        />
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>Smaller file</span>
          <span>Better quality</span>
        </div>
      </div>
    </div>
  );

  const renderAudioSettings = () => (
    <div className="space-y-5">
      {/* Bitrate Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Audio Bitrate
        </label>
        <div className="grid grid-cols-5 gap-2">
          {[64, 128, 192, 256, 320].map((bitrate) => (
            <button
              key={bitrate}
              onClick={() => onAudioSettingsChange({ ...audioSettings, bitrate })}
              disabled={isDisabled}
              className={`
                px-2 py-2 text-xs rounded-lg border-2 transition-all
                ${audioSettings.bitrate === bitrate
                  ? "border-blue-500 bg-blue-50 text-blue-700"
                  : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
                }
                ${isDisabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
              `}
            >
              {bitrate}k
            </button>
          ))}
        </div>
        <p className="mt-1.5 text-xs text-gray-500">
          Higher bitrate = better quality, larger file size
        </p>
      </div>

      {/* Sample Rate Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Sample Rate
        </label>
        <div className="grid grid-cols-3 gap-2">
          {[22050, 44100, 48000].map((rate) => (
            <button
              key={rate}
              onClick={() => onAudioSettingsChange({ ...audioSettings, sampleRate: rate })}
              disabled={isDisabled}
              className={`
                px-3 py-2 text-sm rounded-lg border-2 transition-all
                ${audioSettings.sampleRate === rate
                  ? "border-blue-500 bg-blue-50 text-blue-700"
                  : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
                }
                ${isDisabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
              `}
            >
              {rate === 22050 ? "22.05 kHz" : rate === 44100 ? "44.1 kHz" : "48 kHz"}
            </button>
          ))}
        </div>
        <p className="mt-1.5 text-xs text-gray-500">
          44.1 kHz is CD quality, 48 kHz is standard for video
        </p>
      </div>
    </div>
  );

  const renderImageSettings = () => {
    const isPNG = format === 'png';
    
    return (
      <div className="space-y-5">
        {/* Quality/Compression Slider */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="block text-sm font-medium text-gray-700">
              {isPNG ? "Compression Level" : "Quality"}
            </label>
            <span className="text-sm font-medium text-blue-600">
              {imageSettings.quality}%
            </span>
          </div>
          <input
            type="range"
            min="1"
            max="100"
            step="1"
            value={imageSettings.quality}
            onChange={(e) => onImageSettingsChange({ quality: parseInt(e.target.value) })}
            disabled={isDisabled}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600 disabled:opacity-50"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>{isPNG ? "Faster, larger" : "Smaller file"}</span>
            <span>{isPNG ? "Slower, smaller" : "Better quality"}</span>
          </div>
        </div>

        {/* Format-specific info */}
        <div className="flex items-start gap-2 p-3 bg-gray-50 rounded-lg">
          <Info className="w-4 h-4 text-gray-500 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-gray-600">
            {format === 'jpeg' && "JPEG uses lossy compression. Higher quality = larger files."}
            {format === 'png' && "PNG is lossless. This slider controls compression effort, not quality."}
            {format === 'webp' && "WebP offers better compression than JPEG with similar quality."}
            {format === 'bmp' && "BMP is uncompressed. Quality settings have no effect."}
            {format === 'tiff' && "TIFF supports various compression methods for professional use."}
          </p>
        </div>
      </div>
    );
  };

  return (
    <div className="mt-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
      {mediaType === "video" && renderVideoSettings()}
      {mediaType === "audio" && renderAudioSettings()}
      {mediaType === "image" && renderImageSettings()}
    </div>
  );
};

