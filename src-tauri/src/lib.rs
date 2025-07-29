use anyhow::{anyhow, Result};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::path::Path;
use std::process::{Command, Stdio};
use std::sync::{Arc, Mutex};
use std::time::Instant;
use tauri::{AppHandle, Emitter, Manager};
use uuid::Uuid;

mod path;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FileMetadata {
    pub dimensions: Option<String>,
    pub duration: Option<String>,
    pub bitrate: Option<String>,
    pub codec: Option<String>,
    pub format: Option<String>,
    pub size: Option<u64>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ConversionOptions {
    pub output_format: String,
    pub quality: String,
    pub output_dir: Option<String>,
    pub preserve_metadata: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ConversionProgress {
    pub id: String,
    pub progress: f32,
    pub status: String,
    pub current_file: String,
    pub eta: Option<String>,
    pub speed: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ConversionResult {
    pub id: String,
    pub success: bool,
    pub output_path: Option<String>,
    pub error: Option<String>,
}

// Global state for tracking conversions
type ConversionState = Arc<Mutex<HashMap<String, ConversionProgress>>>;

#[tauri::command]
async fn extract_file_metadata(file_path: String) -> Result<FileMetadata, String> {
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

    // Extract metadata from JSON
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

    Ok(metadata)
}

#[tauri::command]
async fn convert_file(
    file_path: String,
    output_path: String,
    options: ConversionOptions,
    app_handle: AppHandle,
) -> Result<String, String> {
    let conversion_id = Uuid::new_v4().to_string();

    println!(
        "🚀 Starting conversion: {} -> {} (ID: {})",
        Path::new(&file_path)
            .file_name()
            .unwrap_or_default()
            .to_string_lossy(),
        Path::new(&output_path)
            .file_name()
            .unwrap_or_default()
            .to_string_lossy(),
        &conversion_id[..8]
    );

    // Initialize conversion state
    let state: ConversionState = app_handle.state::<ConversionState>().inner().clone();
    {
        let mut conversions = state.lock().unwrap();
        conversions.insert(
            conversion_id.clone(),
            ConversionProgress {
                id: conversion_id.clone(),
                progress: 0.0,
                status: "Starting".to_string(),
                current_file: file_path.clone(),
                eta: None,
                speed: None,
            },
        );
    }

    let conversion_id_clone = conversion_id.clone();
    let app_handle_clone = app_handle.clone();
    let app_handle_for_conversion = app_handle.clone();

    // Spawn conversion task
    tokio::spawn(async move {
        let result = perform_conversion(
            &file_path,
            &output_path,
            &options,
            &conversion_id_clone,
            state,
            app_handle_for_conversion,
        )
        .await;

        // Emit final result
        let conversion_result = ConversionResult {
            id: conversion_id_clone.clone(),
            success: result.is_ok(),
            output_path: result.as_ref().ok().cloned(),
            error: result.as_ref().err().map(|e| e.to_string()),
        };

        let _ = app_handle_clone.emit("conversion_complete", conversion_result);
    });

    Ok(conversion_id)
}

async fn perform_conversion(
    input_path: &str,
    output_path: &str,
    options: &ConversionOptions,
    conversion_id: &str,
    state: ConversionState,
    app_handle: AppHandle,
) -> Result<String> {
    // Get file duration for progress calculation
    let total_duration = get_file_duration(input_path).unwrap_or(0.0);

    let ffmpeg_path = path::ffmpeg_path();

    // Build FFmpeg command based on output format
    let mut cmd = Command::new(&ffmpeg_path);
    cmd.args(&["-y", "-i", input_path]);

    // Add format-specific arguments
    match options.output_format.as_str() {
        "mp4" => {
            cmd.args(&["-c:v", "libx264"]);
            match options.quality.as_str() {
                "high" => cmd.args(&["-preset", "slow", "-crf", "18"]),
                "medium" => cmd.args(&["-preset", "medium", "-crf", "23"]),
                "low" => cmd.args(&["-preset", "fast", "-crf", "28"]),
                _ => cmd.args(&["-preset", "medium", "-crf", "23"]),
            };
        }
        "webm" => {
            cmd.args(&["-c:v", "libvpx-vp9"]);
            match options.quality.as_str() {
                "high" => cmd.args(&["-b:v", "2M"]),
                "medium" => cmd.args(&["-b:v", "1M"]),
                "low" => cmd.args(&["-b:v", "500k"]),
                _ => cmd.args(&["-b:v", "1M"]),
            };
        }
        "avi" => {
            cmd.args(&["-c:v", "libx264", "-c:a", "aac"]);
        }
        "mov" => {
            cmd.args(&["-c:v", "libx264", "-c:a", "aac"]);
        }
        _ => {
            return Err(anyhow!(
                "Unsupported output format: {}",
                options.output_format
            ));
        }
    }

    // Add metadata preservation option
    if !options.preserve_metadata {
        cmd.args(&["-map_metadata", "-1"]);
    }

    // Add progress reporting
    cmd.args(&["-progress", "pipe:2"]);
    cmd.arg(output_path);

    cmd.stdout(Stdio::piped()).stderr(Stdio::piped());

    // Start FFmpeg process
    let mut child = cmd.spawn().map_err(|e| {
        println!("❌ Failed to start FFmpeg: {}", e);
        anyhow!("Failed to start FFmpeg: {}", e)
    })?;

    // Monitor progress
    if let Some(stderr) = child.stderr.take() {
        let state_clone = state.clone();
        let conversion_id = conversion_id.to_string();
        let app_handle_clone = app_handle.clone();

        let update_progress = move |progress: f64, time_str: Option<String>| {
            let mut conversions = state_clone.lock().unwrap();
            if let Some(conv) = conversions.get_mut(&conversion_id) {
                conv.progress = progress as f32;
                conv.status = if progress >= 100.0 {
                    "Completed"
                } else {
                    "Converting"
                }
                .to_string();

                if let Some(time) = time_str {
                    if total_duration > 0.0 {
                        let remaining = total_duration * (100.0 - progress) / 100.0;
                        conv.eta = Some(format!("{:.0}s", remaining));
                        conv.speed = Some(format!(
                            "{}x",
                            progress / 100.0 * total_duration / remaining.max(1.0)
                        ));
                    }
                }

                let _ = app_handle_clone.emit("conversion_progress", conv.clone());
            }
        };

        tokio::spawn(async move {
            use std::io::{BufRead, BufReader};

            let reader = BufReader::new(stderr);
            let regex = regex::Regex::new(r"out_time_ms=(\d+)").unwrap();
            let start_time = Instant::now();

            for line in reader.lines() {
                if let Ok(line) = line {
                    if let Some(captures) = regex.captures(&line) {
                        if let Some(time_match) = captures.get(1) {
                            if let Ok(time_microseconds) = time_match.as_str().parse::<u64>() {
                                let current_time = time_microseconds as f64 / 1_000_000.0;
                                if total_duration > 0.0 {
                                    let progress =
                                        (current_time / total_duration * 100.0).min(99.0);
                                    update_progress(
                                        progress,
                                        Some(format!("{:.1}s", current_time)),
                                    );
                                }
                            }
                        }
                    }
                }
            }
        });
    }

    // Wait for completion
    let output = child
        .wait_with_output()
        .map_err(|e| anyhow!("FFmpeg process failed: {}", e))?;

    if !output.status.success() {
        let error = String::from_utf8_lossy(&output.stderr);
        return Err(anyhow!("FFmpeg conversion failed: {}", error));
    }

    println!(
        "✅ Conversion completed: {}",
        Path::new(output_path)
            .file_name()
            .unwrap_or_default()
            .to_string_lossy()
    );

    // Final completion update
    {
        let mut conversions = state.lock().unwrap();
        if let Some(conv) = conversions.get_mut(conversion_id) {
            conv.progress = 100.0;
            conv.status = "Completed".to_string();
            conv.eta = None;
            conv.speed = None;
        }
        let _ = app_handle.emit(
            "conversion_progress",
            conversions.get(conversion_id).unwrap().clone(),
        );
    }

    Ok(output_path.to_string())
}

fn get_file_duration(file_path: &str) -> Result<f64> {
    let ffprobe_path = path::ffprobe_path();
    let output = Command::new(&ffprobe_path)
        .args(&[
            "-v",
            "quiet",
            "-show_entries",
            "format=duration",
            "-of",
            "csv=p=0",
            file_path,
        ])
        .output()?;

    let duration_str = String::from_utf8(output.stdout)?;
    duration_str
        .trim()
        .parse::<f64>()
        .map_err(|e| anyhow!("Failed to parse duration: {}", e))
}

#[tauri::command]
async fn get_conversion_progress(
    conversion_id: String,
    app_handle: AppHandle,
) -> Option<ConversionProgress> {
    let state: ConversionState = app_handle.state::<ConversionState>().inner().clone();
    let conversions = state.lock().unwrap();
    conversions.get(&conversion_id).cloned()
}

#[tauri::command]
async fn cancel_conversion(conversion_id: String, app_handle: AppHandle) -> Result<bool, String> {
    let state: ConversionState = app_handle.state::<ConversionState>().inner().clone();
    let mut conversions = state.lock().unwrap();

    if let Some(progress) = conversions.get_mut(&conversion_id) {
        progress.status = "Cancelled".to_string();
        // TODO: Kill the actual FFmpeg process (requires storing process handles)
        Ok(true)
    } else {
        Err("Conversion not found".to_string())
    }
}

#[tauri::command]
async fn check_ffmpeg_availability() -> Result<bool, String> {
    let ffmpeg_path = path::ffmpeg_path();
    let ffprobe_path = path::ffprobe_path();

    let ffmpeg_check = Command::new(&ffmpeg_path).args(&["-version"]).output();
    let ffprobe_check = Command::new(&ffprobe_path).args(&["-version"]).output();

    match (ffmpeg_check, ffprobe_check) {
        (Ok(ffmpeg_output), Ok(ffprobe_output)) => {
            let ffmpeg_success = ffmpeg_output.status.success();
            let ffprobe_success = ffprobe_output.status.success();

            if !(ffmpeg_success && ffprobe_success) {
                println!("❌ FFmpeg availability check failed");
            }

            Ok(ffmpeg_success && ffprobe_success)
        }
        _ => {
            println!("❌ Failed to execute FFmpeg commands");
            Ok(false)
        }
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let conversion_state: ConversionState = Arc::new(Mutex::new(HashMap::new()));

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_shell::init())
        .manage(conversion_state)
        .invoke_handler(tauri::generate_handler![
            extract_file_metadata,
            convert_file,
            get_conversion_progress,
            cancel_conversion,
            check_ffmpeg_availability
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
