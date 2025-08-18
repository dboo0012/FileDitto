import { useState, useEffect, useCallback } from 'react';
import { Settings, FileText, Trash2, Download, AlertTriangle, Folder } from 'lucide-react';
import "./App.css";
import { FileUploadZone } from './components/FileUploadZone';
import { FileListItem, FileItem } from './components/FileListItem';
import { MetadataModal } from './components/MetadataModal';
import { SettingsPanel } from './components/SettingsPanel';
import { TauriAPI } from './utils/tauri';
import { ConversionOptions, ConversionProgress, ConversionResult, UserSettings } from './types/tauri';
import { setupDragDropListener } from './events/dragDrop';

function App() {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState('');
  const [selectedQuality, setSelectedQuality] = useState('medium');
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);
  const [showMetadataModal, setShowMetadataModal] = useState(false);
  const [showSettingsPanel, setShowSettingsPanel] = useState(false);
  const [userSettings, setUserSettings] = useState<UserSettings>({
    output_path: {
      mode: 'same_as_input',
      custom_directory: undefined,
    },
    preserve_metadata: true,
    compression_level: 50,
    auto_delete: false,
  });
  const [currentOutputMode, setCurrentOutputMode] = useState<'same_as_input' | 'custom_directory'>('same_as_input');
  const [customDirectory, setCustomDirectory] = useState<string>('');
  const [ffmpegAvailable, setFFmpegAvailable] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Load user settings and check FFmpeg availability on startup
  useEffect(() => {
    const initializeApp = async () => {
      // Load settings first
      try {
        const settings = await TauriAPI.loadUserSettings();
        setUserSettings(settings);
        setCurrentOutputMode(settings.output_path.mode);
        if (settings.output_path.custom_directory) {
          setCustomDirectory(settings.output_path.custom_directory);
        }
      } catch (error) {
        console.error('Failed to load user settings:', error);
        // Continue with defaults
      }
      
      // Then check FFmpeg availability
      await checkFFmpegAvailability();
    };

    initializeApp();
  }, []);

  // Set up event listeners for conversion progress and completion
  useEffect(() => {
    let progressUnlisten: (() => void) | null = null;
    let completeUnlisten: (() => void) | null = null;

    const setupListeners = async () => {
      // Listen for conversion progress updates
      progressUnlisten = await TauriAPI.listenToConversionProgress((progress: ConversionProgress) => {
        setFiles(prev => prev.map(file => 
          file.conversionId === progress.id 
            ? { 
                ...file, 
                status: progress.status === 'Converting' ? 'converting' : file.status
              }
            : file
        ));
      });

      // Listen for conversion completion
      completeUnlisten = await TauriAPI.listenToConversionComplete((result: ConversionResult) => {
        setFiles(prev => prev.map(file => 
          file.conversionId === result.id 
            ? { 
                ...file, 
                status: result.success ? 'completed' : 'error',
                errorMessage: result.error || undefined
              }
            : file
        ));
      });
    };

    setupListeners();

    return () => {
      if (progressUnlisten) progressUnlisten();
      if (completeUnlisten) completeUnlisten();
    };
  }, []);

  const checkFFmpegAvailability = async () => {
    try {
      // const available = await TauriAPI.checkFFmpegAvailability();
      setFFmpegAvailable(true);
    } catch (error) {
      console.error('Error checking FFmpeg:', error);
      setFFmpegAvailable(false);
    }
  };

  const handleFileSelect = async () => {
    try {
      const selectedPaths = await TauriAPI.openFileDialog();
      if (selectedPaths && selectedPaths.length > 0) {
        await handleFilePaths(selectedPaths);
      }
    } catch (error) {
      console.error('Error selecting files:', error);
    }
  };



  const handleFilePaths = useCallback(async (filePaths: string[]) => {
    setIsLoading(true);
    const newFiles: FileItem[] = [];

    for (const filePath of filePaths) {
      try {
        const fileName = filePath.split(/[/\\]/).pop() || filePath;
        
        const fileItem: FileItem = {
          id: `${crypto.randomUUID()}`,
          name: fileName,
          path: filePath,
          size: 0, // We'll get this from metadata
          type: TauriAPI.detectFileType(fileName),
          status: 'pending'
        };

        // Extract metadata
        try {
          const metadata = await TauriAPI.extractFileMetadata(filePath);
          fileItem.metadata = metadata;
          fileItem.size = metadata.size || 0;
        } catch (error) {
          console.warn(`Could not extract metadata for ${fileName}:`, error);
        }

        newFiles.push(fileItem);
      } catch (error) {
        console.error(`Error processing file ${filePath}:`, error);
      }
    }

    setFiles(prev => [...prev, ...newFiles]);
    setIsLoading(false);
    console.log('Laoded files', newFiles);
  }, [setIsLoading, setFiles]);

  // Set up Tauri drag and drop event listener
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
      if (unlisten) {
        unlisten();
      }
    };
  }, [setDragActive, handleFilePaths]);

  const removeFile = (id: string) => {
    setFiles(prev => prev.filter(file => file.id !== id));
  };

  const showMetadata = (file: FileItem) => {
    setSelectedFile(file);
    setShowMetadataModal(true);
  };

  const clearAllFiles = () => {
    setFiles([]);
  };

  const resetFilesForRetry = () => {
    setFiles(prev => prev.map(file => ({
      ...file,
      status: 'pending' as const,
      progress: undefined,
      errorMessage: undefined,
      conversionId: undefined,
      outputFormat: undefined
    })));
  };

  const handleOutputModeChange = async (mode: 'same_as_input' | 'custom_directory') => {
    setCurrentOutputMode(mode);
    
    // Update and save settings
    const updatedSettings = {
      ...userSettings,
      output_path: {
        mode,
        custom_directory: mode === 'custom_directory' ? customDirectory || undefined : undefined,
      }
    };
    
    setUserSettings(updatedSettings);
    
    try {
      await TauriAPI.saveUserSettings(updatedSettings);
    } catch (error) {
      console.error('Failed to save output mode setting:', error);
    }
  };

  const selectOutputDirectory = async () => {
    try {
      const directory = await TauriAPI.openDirectoryDialog();
      if (directory) {
        setCustomDirectory(directory);
        
        // Automatically switch to custom mode and save
        const updatedSettings = {
          ...userSettings,
          output_path: {
            mode: 'custom_directory' as const,
            custom_directory: directory,
          }
        };
        
        setUserSettings(updatedSettings);
        setCurrentOutputMode('custom_directory');
        
        try {
          await TauriAPI.saveUserSettings(updatedSettings);
        } catch (error) {
          console.error('Failed to save custom directory setting:', error);
        }
      }
    } catch (error) {
      console.error('Error selecting output directory:', error);
    }
  };



  const startConversion = async () => {
    if (files.length === 0 || !selectedFormat || !ffmpegAvailable) return;
    
    const options: ConversionOptions = {
      output_format: selectedFormat,
      quality: selectedQuality,
      output_dir: currentOutputMode === 'custom_directory' ? customDirectory || undefined : undefined,
      preserve_metadata: userSettings.preserve_metadata,
    };

    // Start conversion for each file (include pending, error, and completed files for retry)
    for (const file of files) {
      if (file.status === 'converting') continue; // Skip files currently being converted

      try {
        const outputPath = currentOutputMode === 'custom_directory' && customDirectory
          ? TauriAPI.generateOutputPath(file.path, selectedFormat, customDirectory)
          : TauriAPI.generateOutputPath(file.path, selectedFormat);
        const conversionId = await TauriAPI.convertFile(file.path, outputPath, options);
        
        // Update file with conversion ID and status
        setFiles(prev => prev.map(f => 
          f.id === file.id 
            ? { 
                ...f, 
                status: 'converting',
                conversionId,
                outputFormat: selectedFormat,
                progress: 0,
                errorMessage: undefined // Clear any previous error
              }
            : f
        ));
      } catch (error) {
        console.error(`Error starting conversion for ${file.name}:`, error);
        setFiles(prev => prev.map(f => 
          f.id === file.id 
            ? { 
                ...f, 
                status: 'error',
                errorMessage: `Failed to start conversion: ${error}`
              }
            : f
        ));
      }
    }
  };

  const getFormatRecommendations = () => {
    if (files.length === 0) return [];
    
    const hasVideo = files.some(f => f.type === 'video' || f.type.startsWith('video/'));
    const hasAudio = files.some(f => f.type === 'audio' || f.type.startsWith('audio/'));
    const hasImage = files.some(f => f.type === 'image' || f.type.startsWith('image/'));
    
    const recommendations = [];
    if (hasVideo) recommendations.push('mp4', 'webm');
    if (hasAudio) recommendations.push('mp3', 'wav');
    if (hasImage) recommendations.push('jpg', 'png', 'webp');
    
    return recommendations;
  };

  const recommendations = getFormatRecommendations();

  // Show FFmpeg warning if not available
  if (ffmpegAvailable === false) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
          <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-xl font-semibold text-gray-900 mb-2">FFmpeg Not Found</h1>
          <p className="text-gray-600 mb-4">
            FFmpeg is required for file conversion but was not found on your system.
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
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <FileText className="h-8 w-8 text-blue-600 mr-3" />
              <h1 className="text-xl font-semibold text-gray-900">File Converter</h1>
              {ffmpegAvailable && (
                <span className="ml-3 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  FFmpeg Online
                </span>
              )}
            </div>
            <button 
              onClick={() => setShowSettingsPanel(true)}
              className="flex items-center px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
            >
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* File Upload Section */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-medium text-gray-900">Upload Files</h2>
                <div className="flex items-center space-x-2">
                  <button
                    className="flex items-center px-3 py-1 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors"
                  >
                    <Folder className="h-4 w-4 mr-1" />
                    Browse Files
                  </button>
                  {files.length > 0 && (
                    <button
                      onClick={clearAllFiles}
                      className="flex items-center px-3 py-1 text-sm text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors"
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Clear All
                    </button>
                  )}
                </div>
              </div>
              
              {/* File Upload Zone */}
              <FileUploadZone
                dragActive={dragActive}
                onBrowseClick={handleFileSelect}
              />

              {/* Loading Indicator */}
              {isLoading && (
                <div className="mt-4 text-center text-sm text-gray-600">
                  <div className="inline-block animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 mr-2"></div>
                  Processing files...
                </div>
              )}

              {/* File List */}
              {files.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-sm font-medium text-gray-900 mb-3">
                    Selected Files ({files.length})
                  </h3>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {files.map((file) => (
                      <FileListItem
                        key={file.id}
                        file={file}
                        onRemove={removeFile}
                        onShowMetadata={showMetadata}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Conversion Settings Panel */}
          <div className="space-y-6">
            {/* Output Directory */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Output Settings</h3>
              
              <div className="space-y-4">
                <div>
                  <div className="space-y-3">
                    {/* Same as Input Option */}
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="radio"
                        name="outputMode"
                        value="same_as_input"
                        checked={currentOutputMode === 'same_as_input'}
                        onChange={() => handleOutputModeChange('same_as_input')}
                        className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">
                        Same as input file directory
                      </span>
                    </label>

                    {/* Custom Directory Option */}
                    <label className="flex items-start cursor-pointer">
                      <input
                        type="radio"
                        name="outputMode"
                        value="custom_directory"
                        checked={currentOutputMode === 'custom_directory'}
                        onChange={() => handleOutputModeChange('custom_directory')}
                        className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500 mt-0.5"
                      />
                      <div className="ml-2 flex-1">
                        <span className="text-sm text-gray-700">Custom directory</span>
                        
                        {currentOutputMode === 'custom_directory' && (
                          <div className="mt-2 flex gap-2">
                            <input
                              type="text"
                              value={customDirectory}
                              onChange={(e) => setCustomDirectory(e.target.value)}
                              placeholder="Choose output folder..."
                              className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                            <button 
                              onClick={selectOutputDirectory}
                              className="px-3 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors flex items-center"
                            >
                              <Folder className="h-4 w-4" />
                            </button>
                          </div>
                        )}
                        
                        {currentOutputMode === 'custom_directory' && customDirectory && (
                          <div className="mt-1 text-xs text-gray-500">
                            {customDirectory}
                          </div>
                        )}
                      </div>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* Format Selection */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Conversion Settings</h3>
              
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
                      <p className="text-xs text-gray-500 mb-1">Recommended for your files:</p>
                      <div className="flex flex-wrap gap-1">
                        {recommendations.map(format => (
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
                  <span className="text-sm text-gray-700">Preserve original metadata</span>
                  <span className="text-sm text-gray-600">
                    {userSettings.preserve_metadata ? 'Yes' : 'No'} 
                    <span className="text-gray-400 ml-1">(configure in settings)</span>
                  </span>
                </div>

                <div className="space-y-3">
                  <button
                    onClick={startConversion}
                    disabled={files.length === 0 || !selectedFormat || !ffmpegAvailable}
                    className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium"
                  >
                    Start Conversion
                  </button>
                  
                  {files.some(f => f.status === 'error' || f.status === 'completed') && (
                    <button
                      onClick={resetFilesForRetry}
                      className="w-full bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700 transition-colors font-medium text-sm"
                    >
                      Reset All for Retry
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Conversion Summary */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Summary</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Files:</span>
                  <span className="font-medium">{files.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Completed:</span>
                  <span className="font-medium text-green-600">
                    {files.filter(f => f.status === 'completed').length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">In Progress:</span>
                  <span className="font-medium text-blue-600">
                    {files.filter(f => f.status === 'converting').length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Failed:</span>
                  <span className="font-medium text-red-600">
                    {files.filter(f => f.status === 'error').length}
                  </span>
                </div>
              </div>
              
              {files.filter(f => f.status === 'completed').length > 0 && (
                <button className="w-full mt-4 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition-colors font-medium flex items-center justify-center">
                  <Download className="h-4 w-4 mr-2" />
                  Open Output Folder
                </button>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Metadata Modal */}
      <MetadataModal
        file={selectedFile}
        isOpen={showMetadataModal}
        onClose={() => setShowMetadataModal(false)}
      />

      {/* Settings Panel */}
      <SettingsPanel
        isOpen={showSettingsPanel}
        onClose={() => setShowSettingsPanel(false)}
        onSettingsUpdate={setUserSettings}
      />
    </div>
  );
}

export default App;
