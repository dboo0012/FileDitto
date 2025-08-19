import { useState, useEffect } from 'react';
import { UserSettings } from '../types/tauri';
import { TauriAPI } from '../utils/tauri';

const defaultSettings: UserSettings = {
  output_path: {
    mode: "same_as_input",
    custom_directory: undefined,
  },
  preserve_metadata: true,
  compression_level: 50,
  auto_delete: false,
};

export const useSettings = () => {
  const [userSettings, setUserSettings] = useState<UserSettings>(defaultSettings);
  const [currentOutputMode, setCurrentOutputMode] = useState<"same_as_input" | "custom_directory">("same_as_input");
  const [customDirectory, setCustomDirectory] = useState<string>("");

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const settings = await TauriAPI.loadUserSettings();
        setUserSettings(settings);
        setCurrentOutputMode(settings.output_path.mode);
        if (settings.output_path.custom_directory) {
          setCustomDirectory(settings.output_path.custom_directory);
        }
      } catch (error) {
        console.error("Failed to load user settings:", error);
        // Continue with defaults
      }
    };

    loadSettings();
  }, []);

  const saveSettings = async (newSettings: UserSettings) => {
    try {
      await TauriAPI.saveUserSettings(newSettings);
      setUserSettings(newSettings);
    } catch (error) {
      console.error("Failed to save settings:", error);
    }
  };

  const handleOutputModeChange = async (mode: "same_as_input" | "custom_directory") => {
    setCurrentOutputMode(mode);
    
    const updatedSettings = {
      ...userSettings,
      output_path: {
        mode,
        custom_directory: mode === "custom_directory" ? customDirectory || undefined : undefined,
      },
    };

    setUserSettings(updatedSettings);

    try {
      await TauriAPI.saveUserSettings(updatedSettings);
    } catch (error) {
      console.error("Failed to save output mode setting:", error);
    }
  };

  const selectOutputDirectory = async () => {
    try {
      const directory = await TauriAPI.openDirectoryDialog();
      if (directory) {
        setCustomDirectory(directory);
        
        const updatedSettings = {
          ...userSettings,
          output_path: {
            mode: "custom_directory" as const,
            custom_directory: directory,
          },
        };

        setUserSettings(updatedSettings);
        setCurrentOutputMode("custom_directory");

        try {
          await TauriAPI.saveUserSettings(updatedSettings);
        } catch (error) {
          console.error("Failed to save custom directory setting:", error);
        }
      }
    } catch (error) {
      console.error("Error selecting output directory:", error);
    }
  };

  return {
    userSettings,
    currentOutputMode,
    customDirectory,
    setCustomDirectory,
    handleOutputModeChange,
    selectOutputDirectory,
    saveSettings,
  };
};
