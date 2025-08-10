//! File metadata extraction functionality using FFprobe into JSON format.

use crate::path;
use crate::types::FileMetadata;
use std::path::Path;
use std::process::Command;

// Extracts metadata from a media file using FFprobe.
#[tauri::command]
pub async fn extract_file_metadata(file_path: String) -> Result<FileMetadata, String> {
    println!("🔍 Extracting metadata for: {}", file_path);

    if !Path::new(&file_path).exists() {
        return Err(format!("File does not exist: {}", file_path));
    }

    let ffprobe_path = path::ffprobe_path();

    let output = Command::new(&ffprobe_path)
        .args(&[
            "-v",
            "quiet",
            "-print_format",
            "json",
            "-show_format",
            "-show_streams",
            &file_path,
        ])
        .output()
        .map_err(|e| format!("Failed to execute ffprobe: {}", e))?;

    if !output.status.success() {
        let error = String::from_utf8_lossy(&output.stderr);
        return Err(format!("FFprobe failed: {}", error));
    }

    let json_output = String::from_utf8_lossy(&output.stdout);
    let json_value: serde_json::Value = serde_json::from_str(&json_output)
        .map_err(|e| format!("Failed to parse ffprobe output: {}", e))?;

    Ok(parse_metadata_from_json(&json_value))
}

/// Parses metadata from FFprobe JSON output.
fn parse_metadata_from_json(json_value: &serde_json::Value) -> FileMetadata {
    let mut metadata = FileMetadata {
        dimensions: None,
        duration: None,
        bitrate: None,
        codec: None,
        format: None,
        size: None,
    };

    // Extract format info
    if let Some(format) = json_value.get("format") {
        if let Some(duration) = format.get("duration").and_then(|d| d.as_str()) {
            if let Ok(dur_f) = duration.parse::<f64>() {
                let minutes = (dur_f / 60.0) as u32;
                let seconds = (dur_f % 60.0) as u32;
                metadata.duration = Some(format!("{}:{:02}", minutes, seconds));
            }
        }

        if let Some(bitrate) = format.get("bit_rate").and_then(|b| b.as_str()) {
            if let Ok(br) = bitrate.parse::<u64>() {
                metadata.bitrate = Some(format!("{} kbps", br / 1000));
            }
        }

        if let Some(format_name) = format.get("format_name").and_then(|f| f.as_str()) {
            metadata.format = Some(format_name.to_string());
        }

        if let Some(size) = format.get("size").and_then(|s| s.as_str()) {
            if let Ok(size_u64) = size.parse::<u64>() {
                metadata.size = Some(size_u64);
            }
        }
    }

    // Extract stream info (video dimensions, codec)
    if let Some(streams) = json_value.get("streams").and_then(|s| s.as_array()) {
        for stream in streams {
            if let Some(codec_type) = stream.get("codec_type").and_then(|ct| ct.as_str()) {
                if codec_type == "video" {
                    if let (Some(width), Some(height)) = (
                        stream.get("width").and_then(|w| w.as_u64()),
                        stream.get("height").and_then(|h| h.as_u64()),
                    ) {
                        metadata.dimensions = Some(format!("{}x{}", width, height));
                    }

                    if let Some(codec_name) = stream.get("codec_name").and_then(|cn| cn.as_str()) {
                        metadata.codec = Some(codec_name.to_string());
                    }
                    break;
                }
            }
        }
    }

    metadata
}
