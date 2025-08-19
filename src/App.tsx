import { useState, useEffect } from "react";
import "./App.css";
import { FileUploadZone } from "./components/FileUploadZone";
import { FileList } from "./components/FileList";
import { ConversionPanel } from "./components/ConversionPanel";
import { MetadataModal } from "./components/MetadataModal";
import { SettingsPanel } from "./components/SettingsPanel";
import { FFmpegWarning } from "./components/FFmpegWarning";
import { AppHeader } from "./components/AppHeader";
import { TauriAPI } from "./utils/tauri";
import { FileItem } from "./components/FileListItem";
import { setupDragDropListener } from "./events/dragDrop";
import { useFiles } from "./hooks/useFiles";
import { useConversion } from "./hooks/useConversion";
import { useSettings } from "./hooks/useSettings";
import { useFFmpeg } from "./hooks/useFFmpeg";
import { ConversionService } from "./services/conversionService";

function App() {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);
  const [showMetadataModal, setShowMetadataModal] = useState(false);
  const [showSettingsPanel, setShowSettingsPanel] = useState(false);

  const {
    files,
    isLoading,
    handleFilePaths,
    removeFile,
    clearAllFiles,
    resetFilesForRetry,
    updateFileStatus,
    updateFilesByConversionId,
  } = useFiles();

  const {
    selectedFormat,
    setSelectedFormat,
    selectedQuality,
    setSelectedQuality,
    getFormatRecommendations,
  } = useConversion({ files, updateFilesByConversionId });

  const {
    userSettings,
    currentOutputMode,
    customDirectory,
    setCustomDirectory,
    handleOutputModeChange,
    selectOutputDirectory,
    saveSettings,
  } = useSettings();

  const { ffmpegAvailable, checkFFmpegAvailability } = useFFmpeg();

  // Set up drag and drop event listener
  useEffect(() => {
    let unlisten: (() => void) | null = null;

    const initializeDragDrop = async () => {
      unlisten = await setupDragDropListener({
        setDragActive,
        handleFilePaths,
      });
    };

    initializeDragDrop();

    return () => {
      if (unlisten) unlisten();
    };
  }, [handleFilePaths]);

  const handleFileSelect = async () => {
    try {
      const selectedPaths = await TauriAPI.openFileDialog();
      if (selectedPaths && selectedPaths.length > 0) {
        await handleFilePaths(selectedPaths);
      }
    } catch (error) {
      console.error("Error selecting files:", error);
    }
  };

  const showMetadata = (file: FileItem) => {
    setSelectedFile(file);
    setShowMetadataModal(true);
  };

  const startConversion = async () => {
    await ConversionService.startConversion(
      files,
      selectedFormat,
      selectedQuality,
      currentOutputMode,
      customDirectory,
      userSettings.preserve_metadata,
      updateFileStatus
    );
  };

  // Show FFmpeg warning if not available
  if (ffmpegAvailable === false) {
    return <FFmpegWarning onRetry={() => checkFFmpegAvailability()} />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader
        ffmpegAvailable={ffmpegAvailable}
        onOpenSettings={() => setShowSettingsPanel(true)}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <FileUploadZone
                dragActive={dragActive}
                onBrowseClick={handleFileSelect}
              />

              <FileList
                files={files}
                isLoading={isLoading}
                onRemove={removeFile}
                onShowMetadata={showMetadata}
                onClearAll={clearAllFiles}
              />
            </div>
          </div>

          <ConversionPanel
            files={files}
            selectedFormat={selectedFormat}
            setSelectedFormat={setSelectedFormat}
            selectedQuality={selectedQuality}
            setSelectedQuality={setSelectedQuality}
            currentOutputMode={currentOutputMode}
            customDirectory={customDirectory}
            setCustomDirectory={setCustomDirectory}
            onOutputModeChange={handleOutputModeChange}
            onSelectOutputDirectory={selectOutputDirectory}
            onStartConversion={startConversion}
            onResetFiles={resetFilesForRetry}
            preserveMetadata={userSettings.preserve_metadata}
            getFormatRecommendations={getFormatRecommendations}
            ffmpegAvailable={ffmpegAvailable}
          />
        </div>
      </main>

      <MetadataModal
        file={selectedFile}
        isOpen={showMetadataModal}
        onClose={() => setShowMetadataModal(false)}
      />

      <SettingsPanel
        isOpen={showSettingsPanel}
        onClose={() => setShowSettingsPanel(false)}
        onSettingsUpdate={saveSettings}
      />
    </div>
  );
}

export default App;
