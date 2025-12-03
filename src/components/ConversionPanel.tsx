import { ConversionSummary } from "./ConversionSummary";
import { FormatSettings } from "./FormatSettings";
import { FileItem } from "./FileListItem";

interface ConversionPanelProps {
  files: FileItem[];
  selectedFormat: string;
  setSelectedFormat: (format: string) => void;
  selectedQuality: string;
  setSelectedQuality: (quality: string) => void;
  onOpenOutputFolder?: (path?: string) => void;
  onStartConversion: () => void;
  onResetFiles: () => void;
  preserveMetadata: boolean;
  ffmpegAvailable: boolean | null;
}

export const ConversionPanel = ({
  files,
  selectedFormat,
  setSelectedFormat,
  selectedQuality,
  setSelectedQuality,
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
        selectedFormat={selectedFormat}
        setSelectedFormat={setSelectedFormat}
        selectedQuality={selectedQuality}
        setSelectedQuality={setSelectedQuality}
        preserveMetadata={preserveMetadata}
        onStartConversion={onStartConversion}
        onResetFiles={onResetFiles}
        files={files}
        ffmpegAvailable={ffmpegAvailable}
      />
    </div>
  );
};
