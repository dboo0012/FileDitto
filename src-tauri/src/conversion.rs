//! File conversion functionality using FFmpeg.

use crate::metadata::get_file_duration;
use crate::path;
use crate::types::{ConversionOptions, ConversionProgress, ConversionResult, ConversionState};
use anyhow::{anyhow, Result};
use std::path::Path;
use std::process::{Command, Stdio};
use std::time::Instant;
use tauri::{AppHandle, Emitter, Manager};
use uuid::Uuid;

/// Initiates a file conversion operation.
#[tauri::command]
pub async fn convert_file(
    file_path: String,
    output_path: String,
    options: ConversionOptions,
    app_handle: AppHandle,
) -> Result<String, String> {
    let conversion_id = Uuid::new_v4().to_string();

    println!(
        "🚀 Starting conversion: {} -> {} (Process ID: {})",
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

/// Gets the current progress of a conversion operation.
#[tauri::command]
pub async fn get_conversion_progress(
    conversion_id: String,
    app_handle: AppHandle,
) -> Option<ConversionProgress> {
    let state: ConversionState = app_handle.state::<ConversionState>().inner().clone();
    let conversions = state.lock().unwrap();
    conversions.get(&conversion_id).cloned()
}

/// Cancels an ongoing conversion operation.
#[tauri::command]
pub async fn cancel_conversion(
    conversion_id: String,
    app_handle: AppHandle,
) -> Result<bool, String> {
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

/// Performs the actual file conversion using FFmpeg.
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
    apply_format_settings(&mut cmd, options)?;

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
        monitor_conversion_progress(
            stderr,
            state.clone(),
            conversion_id,
            app_handle.clone(),
            total_duration,
        )
        .await;
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
    update_final_progress(state, conversion_id, app_handle).await;

    Ok(output_path.to_string())
}

/// Applies format-specific FFmpeg settings based on the conversion options.
fn apply_format_settings(cmd: &mut Command, options: &ConversionOptions) -> Result<()> {
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
    Ok(())
}

/// Monitors FFmpeg progress output and updates conversion state.
async fn monitor_conversion_progress(
    stderr: std::process::ChildStderr,
    state: ConversionState,
    conversion_id: &str,
    app_handle: AppHandle,
    total_duration: f64,
) {
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

            if let Some(_time) = time_str {
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
        let _start_time = Instant::now();

        for line in reader.lines() {
            if let Ok(line) = line {
                if let Some(captures) = regex.captures(&line) {
                    if let Some(time_match) = captures.get(1) {
                        if let Ok(time_microseconds) = time_match.as_str().parse::<u64>() {
                            let current_time = time_microseconds as f64 / 1_000_000.0;
                            if total_duration > 0.0 {
                                let progress = (current_time / total_duration * 100.0).min(99.0);
                                update_progress(progress, Some(format!("{:.1}s", current_time)));
                            }
                        }
                    }
                }
            }
        }
    });
}

/// Updates the conversion state to indicate final completion.
async fn update_final_progress(state: ConversionState, conversion_id: &str, app_handle: AppHandle) {
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
