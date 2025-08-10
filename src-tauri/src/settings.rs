//! User settings management with persistent storage.

use anyhow::{anyhow, Result};
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use tauri::{AppHandle, Manager};

/// User settings for the application with persistent storage.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UserSettings {
    pub output_path: OutputPathSettings,
    pub preserve_metadata: bool,
    pub compression_level: u8,
    pub auto_delete: bool,
}

/// Output path configuration options.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OutputPathSettings {
    pub mode: OutputPathMode,
    pub custom_directory: Option<String>,
}

/// Available output path modes.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum OutputPathMode {
    SameAsInput,
    CustomDirectory,
}

impl Default for UserSettings {
    fn default() -> Self {
        Self {
            output_path: OutputPathSettings {
                mode: OutputPathMode::SameAsInput,
                custom_directory: None,
            },
            preserve_metadata: true,
            compression_level: 50,
            auto_delete: false,
        }
    }
}

impl UserSettings {
    /// Get the settings file path for the current user.
    fn get_settings_path(app_handle: &AppHandle) -> Result<PathBuf> {
        let app_data_dir = app_handle
            .path()
            .app_data_dir()
            .map_err(|e| anyhow!("Failed to get app data directory: {}", e))?;

        // Ensure the directory exists
        if !app_data_dir.exists() {
            fs::create_dir_all(&app_data_dir)
                .map_err(|e| anyhow!("Failed to create app data directory: {}", e))?;
        }

        Ok(app_data_dir.join("settings.json"))
    }

    /// Load user settings from disk, or return defaults if file doesn't exist.
    pub fn load(app_handle: &AppHandle) -> Result<Self> {
        let settings_path = Self::get_settings_path(app_handle)?;

        if !settings_path.exists() {
            println!("⚙️ Settings file not found, using defaults");
            return Ok(Self::default());
        }

        let settings_content = fs::read_to_string(&settings_path)
            .map_err(|e| anyhow!("Failed to read settings file: {}", e))?;

        let settings: UserSettings = serde_json::from_str(&settings_content)
            .map_err(|e| anyhow!("Failed to parse settings file: {}", e))?;

        println!("⚙️ Loaded user settings from: {}", settings_path.display());
        Ok(settings)
    }

    /// Save user settings to disk.
    pub fn save(&self, app_handle: &AppHandle) -> Result<()> {
        let settings_path = Self::get_settings_path(app_handle)?;

        let settings_json = serde_json::to_string_pretty(self)
            .map_err(|e| anyhow!("Failed to serialize settings: {}", e))?;

        fs::write(&settings_path, settings_json)
            .map_err(|e| anyhow!("Failed to write settings file: {}", e))?;

        println!("⚙️ Saved user settings to: {}", settings_path.display());
        Ok(())
    }

    /// Validate settings and fix any issues.
    pub fn validate(&mut self) -> Vec<String> {
        let mut warnings = Vec::new();

        // Validate compression level
        if self.compression_level > 100 {
            self.compression_level = 100;
            warnings.push("Compression level was above 100, reset to 100".to_string());
        }

        // Validate custom directory path if set
        if let OutputPathMode::CustomDirectory = self.output_path.mode {
            if let Some(ref custom_dir) = self.output_path.custom_directory {
                let path = PathBuf::from(custom_dir);
                if !path.exists() {
                    warnings.push(format!(
                        "Custom output directory does not exist: {}. Will fallback to same as input.",
                        custom_dir
                    ));
                }
                if path.exists() && !path.is_dir() {
                    warnings.push(format!(
                        "Custom output path is not a directory: {}. Will fallback to same as input.",
                        custom_dir
                    ));
                }
            } else {
                // Custom directory mode but no directory set
                self.output_path.mode = OutputPathMode::SameAsInput;
                warnings.push("Custom directory mode was selected but no directory was set. Reset to 'same as input'.".to_string());
            }
        }

        warnings
    }
}

/// Tauri command to load user settings.
#[tauri::command]
pub async fn load_user_settings(app_handle: AppHandle) -> Result<UserSettings, String> {
    let mut settings =
        UserSettings::load(&app_handle).map_err(|e| format!("Failed to load settings: {}", e))?;

    let warnings = settings.validate();
    if !warnings.is_empty() {
        println!("⚠️ Settings validation warnings: {:?}", warnings);
        // Auto-save corrected settings
        if let Err(e) = settings.save(&app_handle) {
            println!("⚠️ Failed to save corrected settings: {}", e);
        }
    }

    Ok(settings)
}

/// Tauri command to save user settings.
#[tauri::command]
pub async fn save_user_settings(
    settings: UserSettings,
    app_handle: AppHandle,
) -> Result<(), String> {
    let mut settings = settings;
    let warnings = settings.validate();

    if !warnings.is_empty() {
        println!("⚠️ Settings validation warnings: {:?}", warnings);
        return Err(format!(
            "Settings validation failed: {}",
            warnings.join(", ")
        ));
    }

    settings
        .save(&app_handle)
        .map_err(|e| format!("Failed to save settings: {}", e))?;

    Ok(())
}

/// Tauri command to reset settings to defaults.
#[tauri::command]
pub async fn reset_user_settings(app_handle: AppHandle) -> Result<UserSettings, String> {
    let default_settings = UserSettings::default();
    default_settings
        .save(&app_handle)
        .map_err(|e| format!("Failed to save default settings: {}", e))?;

    println!("⚙️ Reset user settings to defaults");
    Ok(default_settings)
}
