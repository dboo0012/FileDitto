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
                "✅ Loaded sidecar {binary_name}: {}",
                sidecar_path.display()
            );
            sidecar_path
        }
        Ok(sidecar_path) => {
            println!(
                "⚠️ Sidecar {binary_name} not found at {}, using default system PATH",
                sidecar_path.display()
            );
            system_path
        }
        Err(_) => {
            println!("⚠️ Could not determine sidecar path for {binary_name}, using system PATH");
            system_path
        }
    }
}

/// Gets the expected path to a binary adjacent to the current executable.
/// On Windows, adds .exe extension automatically.
#[cfg(windows)]
fn get_sidecar_path(binary_name: &str) -> anyhow::Result<PathBuf> {
    let mut path = current_exe()?
        .parent()
        .context("Cannot get parent directory of current executable")?
        .join(binary_name);
    path.set_extension("exe");
    Ok(path)
}

/// Gets the expected path to a binary adjacent to the current executable.
#[cfg(not(windows))]
fn get_sidecar_path(binary_name: &str) -> anyhow::Result<PathBuf> {
    let path = current_exe()?
        .parent()
        .context("Cannot get parent directory of current executable")?
        .join(binary_name);
    Ok(path)
}

/// Opens the file location in the system file explorer.
///
/// On Windows, this uses `explorer /select,"path"` to open Explorer and highlight the file.
/// On macOS, this uses `open -R "path"` to reveal the file in Finder.
/// On Linux, this attempts to use xdg-open to open the containing directory.
#[command]
pub async fn open_file_location(file_path: String) -> Result<(), String> {
    println!("🔍 Attempting to open file location for: {file_path}");

    let path = Path::new(&file_path);

    // Check if the file exists
    if !path.exists() {
        println!("❌ File not found: {file_path}");
        return Err(format!("File not found: {file_path}"));
    }

    println!("✅ File exists, opening location...");

    open_in_file_explorer(&file_path, path)
}

#[cfg(target_os = "windows")]
fn open_in_file_explorer(file_path: &str, _path: &Path) -> Result<(), String> {
    println!("🪟 Using Windows explorer command");
    Command::new("explorer")
        .args(["/select,", file_path])
        .spawn()
        .map(|_| println!("✅ Successfully opened file location"))
        .map_err(|e| {
            println!("❌ Failed to open file location: {e}");
            format!("Failed to open file location: {e}")
        })
}

#[cfg(target_os = "macos")]
fn open_in_file_explorer(file_path: &str, _path: &Path) -> Result<(), String> {
    println!("🍎 Using macOS open command");
    Command::new("open")
        .args(["-R", file_path])
        .spawn()
        .map(|_| println!("✅ Successfully opened file location"))
        .map_err(|e| {
            println!("❌ Failed to open file location: {e}");
            format!("Failed to open file location: {e}")
        })
}

#[cfg(all(not(target_os = "windows"), not(target_os = "macos")))]
fn open_in_file_explorer(_file_path: &str, path: &Path) -> Result<(), String> {
    println!("🐧 Using Linux xdg-open command");
    let parent = path
        .parent()
        .ok_or_else(|| "Cannot determine parent directory".to_string())?;

    Command::new("xdg-open")
        .arg(parent)
        .spawn()
        .map(|_| println!("✅ Successfully opened file location"))
        .map_err(|e| {
            println!("❌ Failed to open file location: {e}");
            format!("Failed to open file location: {e}")
        })
}
