//! Utilities for locating FFmpeg binaries on the system.

use anyhow::Context;
use std::{
    env::current_exe,
    path::{Path, PathBuf},
};

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
                "✅ Using sidecar {} at: {}",
                binary_name,
                sidecar_path.display()
            );
            sidecar_path
        }
        Ok(sidecar_path) => {
            println!(
                "⚠️  Sidecar {} not found at {}, using system PATH",
                binary_name,
                sidecar_path.display()
            );
            system_path
        }
        Err(_) => {
            println!(
                "⚠️  Could not determine sidecar path for {}, using system PATH",
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
