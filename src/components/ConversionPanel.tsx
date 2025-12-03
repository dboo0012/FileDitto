import { ConversionSummary } from "./ConversionSummary";
import { FormatSettings } from "./FormatSettings";
import { FileItem } from "./FileListItem";
import {
  MediaType,
  MediaTypeFormats,
  MediaTypeQualities,
  QualityLevel,
  CustomQualitySettings,
  VideoQualitySettings,
  AudioQualitySettings,
  ImageQualitySettings,
} from "../types/supportedFormats";

interface ConversionPanelProps {
  files: FileItem[];
  formatsByType: MediaTypeFormats;
  qualitiesByType: MediaTypeQualities;
  setFormatForType: (mediaType: MediaType, format: string) => void;
  setQualityForType: (mediaType: MediaType, quality: QualityLevel) => void;
  customSettings: CustomQualitySettings;
  onVideoSettingsChange: (settings: VideoQualitySettings) => void;
  onAudioSettingsChange: (settings: AudioQualitySettings) => void;
  onImageSettingsChange: (settings: ImageQualitySettings) => void;
  onOpenOutputFolder?: (path?: string) => void;
  onStartConversion: () => void;
  onResetFiles: () => void;
  preserveMetadata: boolean;
  ffmpegAvailable: boolean | null;
}

export const ConversionPanel = ({
  files,
  formatsByType,
  qualitiesByType,
  setFormatForType,
  setQualityForType,
  customSettings,
  onVideoSettingsChange,
  onAudioSettingsChange,
  onImageSettingsChange,
  onOpenOutputFolder,
  onStartConversion,
  onResetFiles,
  preserveMetadata,
  ffmpegAvailable,
}: ConversionPanelProps) => {
  return (
    <div className="space-y-6">
      <ConversionSummary
        files={files}
        onOpenOutputFolder={onOpenOutputFolder}
      />

      <FormatSettings
        formatsByType={formatsByType}
        qualitiesByType={qualitiesByType}
        setFormatForType={setFormatForType}
        setQualityForType={setQualityForType}
        customSettings={customSettings}
        onVideoSettingsChange={onVideoSettingsChange}
        onAudioSettingsChange={onAudioSettingsChange}
        onImageSettingsChange={onImageSettingsChange}
        preserveMetadata={preserveMetadata}
        onStartConversion={onStartConversion}
        onResetFiles={onResetFiles}
        files={files}
        ffmpegAvailable={ffmpegAvailable}
      />
    </div>
  );
};
