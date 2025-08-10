import { useState, useEffect, MouseEvent } from 'react';
import { X, Settings as SettingsIcon, Sliders, RotateCcw, Save, CheckCircle } from 'lucide-react';
import { TauriAPI } from '../utils/tauri';
import { UserSettings } from '../types/tauri';

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onSettingsUpdate?: (settings: UserSettings) => void;
}

export const SettingsPanel = ({ isOpen, onClose, onSettingsUpdate }: SettingsPanelProps) => {
  const [settings, setSettings] = useState<UserSettings>({
    output_path: {
      mode: 'same_as_input',
      custom_directory: undefined,
    },
    preserve_metadata: true,
    compression_level: 50,
    auto_delete: false,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load settings when panel opens
  useEffect(() => {
    if (isOpen) {
      loadSettings();
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
      // Reset temporary states when closing
      setSaveSuccess(false);
      setError(null);
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const loadSettings = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const loadedSettings = await TauriAPI.loadUserSettings();
      setSettings(loadedSettings);
    } catch (err) {
      setError(`Failed to load settings: ${err}`);
      console.error('Error loading settings:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    setIsSaving(true);
    setError(null);
    setSaveSuccess(false);

    try {
      await TauriAPI.saveUserSettings(settings);
      setSaveSuccess(true);
      onSettingsUpdate?.(settings);
      
      // Auto-close after successful save
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (err) {
      setError(`Failed to save settings: ${err}`);
      console.error('Error saving settings:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetSettings = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const defaultSettings = await TauriAPI.resetUserSettings();
      setSettings(defaultSettings);
      onSettingsUpdate?.(defaultSettings);
    } catch (err) {
      setError(`Failed to reset settings: ${err}`);
      console.error('Error resetting settings:', err);
    } finally {
      setIsLoading(false);
    }
  };



  const updateSetting = <K extends keyof UserSettings>(key: K, value: UserSettings[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }));
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
        
        {/* Loading State */}
        {isLoading && (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-sm text-gray-500">Loading settings...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="p-4 bg-red-50 border-b">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Success State */}
        {saveSuccess && (
          <div className="p-4 bg-green-50 border-b flex items-center">
            <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
            <p className="text-sm text-green-600">Settings saved successfully!</p>
          </div>
        )}
        
        {!isLoading && (
          <div className="p-4 space-y-6 overflow-y-auto max-h-[calc(100vh-12rem)]">


            {/* Compression Level */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Sliders className="inline h-4 w-4 mr-2" />
                Compression Level: {settings.compression_level}%
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={settings.compression_level}
                onChange={(e) => updateSetting('compression_level', Number(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>Fast</span>
                <span>Balanced</span>
                <span>Best Quality</span>
              </div>
            </div>

            {/* General Options */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700">
                  Preserve Original Metadata
                </label>
                <input
                  type="checkbox"
                  checked={settings.preserve_metadata}
                  onChange={(e) => updateSetting('preserve_metadata', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
              </div>
              
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700">
                  Auto-delete source files after conversion
                </label>
                <input
                  type="checkbox"
                  checked={settings.auto_delete}
                  onChange={(e) => updateSetting('auto_delete', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4 border-t border-gray-200">
              <button
                onClick={handleResetSettings}
                disabled={isLoading || isSaving}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors disabled:opacity-50 flex items-center"
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset
              </button>
              <button
                onClick={onClose}
                disabled={isSaving}
                className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveSettings}
                disabled={isSaving}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center"
              >
                {isSaving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Settings
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};