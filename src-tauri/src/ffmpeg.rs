//! FFmpeg availability checking and utilities.

use crate::path;
use std::process::Command;

/// Checks if FFmpeg and FFprobe are available and working.
#[tauri::command]
pub async fn check_ffmpeg_availability() -> Result<bool, String> {
    let ffmpeg_path = path::ffmpeg_path();
    let ffprobe_path = path::ffprobe_path();

    let ffmpeg_check = Command::new(&ffmpeg_path).arg("-version").output();
    let ffprobe_check = Command::new(&ffprobe_path).arg("-version").output();

    match (ffmpeg_check, ffprobe_check) {
        (Ok(ffmpeg_output), Ok(ffprobe_output)) => {
            let ffmpeg_available = ffmpeg_output.status.success();
            let ffprobe_available = ffprobe_output.status.success();

            if !ffmpeg_available || !ffprobe_available {
                println!("❌ FFmpeg availability check failed");
            }

            Ok(ffmpeg_available && ffprobe_available)
        }
        _ => {
            println!("❌ Failed to execute FFmpeg commands");
            Ok(false)
        }
    }
}
