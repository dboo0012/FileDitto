import { useState, useEffect, MouseEvent } from 'react';
import { X, Settings as SettingsIcon, Sliders, HardDrive } from 'lucide-react';

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsPanel = ({ isOpen, onClose }: SettingsPanelProps) => {
  const [outputPath, setOutputPath] = useState('');
  const [preserveMetadata, setPreserveMetadata] = useState(true);
  const [autoDelete, setAutoDelete] = useState(false);
  const [compressionLevel, setCompressionLevel] = useState(50);

  // Handle body scroll lock when panel is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const handleBrowse = async () => {
    try {
      // Use Tauri's directory picker
      const { TauriAPI } = await import('../utils/tauri');
      const directory = await TauriAPI.openDirectoryDialog();
      if (directory) {
        setOutputPath(directory);
      }
    } catch (err) {
      console.error('Failed to select directory:', err);
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
             onClick={(e: MouseEvent<HTMLDivElement>) => {
         if (e.target === e.currentTarget) onClose();
       }}
    >
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center">
            <SettingsIcon className="h-6 w-6 text-gray-600 mr-2" />
            <h3 className="text-lg font-medium text-gray-900">Conversion Settings</h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <div className="p-4 space-y-6 overflow-y-auto max-h-[calc(100vh-12rem)]">
          {/* Output Directory */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <HardDrive className="inline h-4 w-4 mr-2" />
              Output Directory
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={outputPath}
                onChange={(e) => setOutputPath(e.target.value)}
                placeholder="Choose output folder..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <button 
                onClick={handleBrowse}
                className="px-3 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
              >
                Browse
              </button>
            </div>
          </div>

          {/* Compression Level */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Sliders className="inline h-4 w-4 mr-2" />
              Compression Level: {compressionLevel}%
            </label>
            <input
              type="range"
              min="0"
              max="100"
              value={compressionLevel}
              onChange={(e) => setCompressionLevel(Number(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>Fast</span>
              <span>Balanced</span>
              <span>Best Quality</span>
            </div>
          </div>

          {/* Options */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700">
                Preserve Original Metadata
              </label>
              <input
                type="checkbox"
                checked={preserveMetadata}
                onChange={(e) => setPreserveMetadata(e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
            </div>
            
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700">
                Auto-delete source files after conversion
              </label>
              <input
                type="checkbox"
                checked={autoDelete}
                onChange={(e) => setAutoDelete(e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Save Settings
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};