//! FFmpeg availability checking and utilities.

use crate::path;
use std::process::Command;

#[cfg(target_os = "windows")]
use std::os::windows::process::CommandExt;

/// Checks if FFmpeg and FFprobe are available and working.
#[tauri::command]
pub async fn check_ffmpeg_availability() -> Result<bool, String> {
    let ffmpeg_path = path::ffmpeg_path();
    let ffprobe_path = path::ffprobe_path();

    #[cfg(target_os = "windows")]
    use windows_sys::Win32::System::Threading::CREATE_NO_WINDOW;

    let mut ffmpeg_cmd = Command::new(&ffmpeg_path);
    ffmpeg_cmd.arg("-version");
    #[cfg(target_os = "windows")]
    ffmpeg_cmd.creation_flags(CREATE_NO_WINDOW);
    let ffmpeg_check = ffmpeg_cmd.output();

    let mut ffprobe_cmd = Command::new(&ffprobe_path);
    ffprobe_cmd.arg("-version");
    #[cfg(target_os = "windows")]
    ffprobe_cmd.creation_flags(CREATE_NO_WINDOW);
    let ffprobe_check = ffprobe_cmd.output();

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
