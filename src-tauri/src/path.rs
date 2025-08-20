//! Utilities for locating FFmpeg binaries on the system and opening file locations.

use anyhow::Context;
use std::{
    env::current_exe,
    path::{Path, PathBuf},
    process::Command,
};
use tauri::command;

/// Returns the path to the FFmpeg executable, prioritizing sidecar over system PATH.
pub fn ffmpeg_path() -> PathBuf {
    get_binary_path("ffmpeg")
}

/// Returns the path to the FFprobe executable, prioritizing sidecar over system PATH.
pub fn ffprobe_path() -> PathBuf {
    get_binary_path("ffprobe")
}

/// Generic function to get binary path, checking sidecar first then falling back to system PATH.
fn get_binary_path(binary_name: &str) -> PathBuf {
    let system_path = Path::new(binary_name).to_path_buf();

    match get_sidecar_path(binary_name) {
        Ok(sidecar_path) if sidecar_path.exists() => {
            println!(
                "✅ Loaded sidecar {}: {}",
                binary_name,
                sidecar_path.display()
            );
            sidecar_path
        }
        Ok(sidecar_path) => {
            println!(
                "⚠️ Sidecar {} not found at {}, using default system PATH",
                binary_name,
                sidecar_path.display()
            );
            system_path
        }
        Err(_) => {
            println!(
                "⚠️ Could not determine sidecar path for {}, using system PATH",
                binary_name
            );
            system_path
        }
    }
}

/// Gets the expected path to a binary adjacent to the current executable.
/// On Windows, adds .exe extension automatically.
fn get_sidecar_path(binary_name: &str) -> anyhow::Result<PathBuf> {
    let mut path = current_exe()?
        .parent()
        .context("Cannot get parent directory of current executable")?
        .join(binary_name);

    if cfg!(windows) {
        path.set_extension("exe");
    }

    Ok(path)
}

/// Opens the file location in the system file explorer.
///
/// On Windows, this uses `explorer /select,"path"` to open Explorer and highlight the file.
/// On macOS, this uses `open -R "path"` to reveal the file in Finder.
/// On Linux, this attempts to use xdg-open to open the containing directory.
#[command]
pub async fn open_file_location(file_path: String) -> Result<(), String> {
    println!("🔍 Attempting to open file location for: {}", file_path);

    let path = Path::new(&file_path);

    // Check if the file exists
    if !path.exists() {
        println!("❌ File not found: {}", file_path);
        return Err(format!("File not found: {}", file_path));
    }

    println!("✅ File exists, opening location...");

    let result = if cfg!(target_os = "windows") {
        // Windows: Use explorer with /select to highlight the file
        println!("🪟 Using Windows explorer command");
        Command::new("explorer")
            .args(["/select,", &file_path])
            .spawn()
    } else if cfg!(target_os = "macos") {
        // macOS: Use open -R to reveal in Finder
        println!("🍎 Using macOS open command");
        Command::new("open").args(["-R", &file_path]).spawn()
    } else {
        // Linux: Open the containing directory with xdg-open
        println!("🐧 Using Linux xdg-open command");
        if let Some(parent) = path.parent() {
            Command::new("xdg-open").arg(parent).spawn()
        } else {
            return Err("Cannot determine parent directory".to_string());
        }
    };

    match result {
        Ok(_) => {
            println!("✅ Successfully opened file location");
            Ok(())
        }
        Err(e) => {
            println!("❌ Failed to open file location: {}", e);
            Err(format!("Failed to open file location: {}", e))
        }
    }
}
