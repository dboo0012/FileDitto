//! FFmpeg file converter application backend.
//!
//! This application provides a Tauri-based backend for converting media files
//! using FFmpeg, with features including:
//! - File metadata extraction using FFprobe
//! - File format conversion with quality options
//! - Real-time conversion progress tracking
//! - Batch file processing support

use std::collections::HashMap;
use std::sync::{Arc, Mutex};

// Module declarations
mod conversion;
mod conversion_settings;
mod ffmpeg;
mod metadata;
mod path;
mod settings;
mod types;

// Re-export types for easier access
pub use types::*;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let conversion_state: ConversionState = Arc::new(Mutex::new(HashMap::new()));
    let process_handles: ProcessHandles = Arc::new(Mutex::new(HashMap::new()));

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_shell::init())
        .manage(conversion_state)
        .manage(process_handles)
        .invoke_handler(tauri::generate_handler![
            metadata::extract_file_metadata,
            conversion::convert_file,
            conversion::get_conversion_progress,
            conversion::cancel_conversion,
            ffmpeg::check_ffmpeg_availability,
            settings::load_user_settings,
            settings::save_user_settings,
            settings::reset_user_settings
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
