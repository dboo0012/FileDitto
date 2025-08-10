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

// Main conversion process
#[tauri::command]
pub async fn convert_file(
    file_path: String,
    output_path: String,
    options: ConversionOptions,
    app_handle: AppHandle,
) -> Result<String, String> {
    // Generate a unique conversion ID
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

// Performs the actual file conversion using FFmpeg.
async fn perform_conversion(
    input_path: &str,
    output_path: &str,
    options: &ConversionOptions,
    conversion_id: &str,
    state: ConversionState,
    app_handle: AppHandle,
) -> Result<String> {
    println!(
        "🔍 Starting conversion process for ID: {}",
        &conversion_id[..8]
    );
    println!("📁 Input file: {}", input_path);
    println!("📁 Output file: {}", output_path);
    println!("⚙️ Options: {:?}", options);

    // Validate input file exists
    if !Path::new(input_path).exists() {
        let error_msg = format!("Input file does not exist: {}", input_path);
        println!("❌ {}", error_msg);
        return Err(anyhow!(error_msg));
    }

    // Get file duration for progress calculation
    let total_duration = get_file_duration(input_path).unwrap_or(0.0);
    println!("⏱️ File duration: {:.2}s", total_duration);

    let ffmpeg_path = path::ffmpeg_path();
    println!("🔧 Using FFmpeg path: {}", ffmpeg_path.display());

    // Build FFmpeg command based on output format
    let mut cmd = Command::new(&ffmpeg_path);
    cmd.args(&["-y", "-i", input_path]);

    // Add format-specific arguments
    println!("🎬 Applying format settings for: {}", options.output_format);
    apply_format_settings(&mut cmd, options)?;

    // Add metadata preservation option
    if !options.preserve_metadata {
        cmd.args(&["-map_metadata", "-1"]);
        println!("🔄 Metadata preservation: disabled");
    } else {
        println!("🔄 Metadata preservation: enabled");
    }

    // Add progress reporting
    cmd.args(&["-progress", "pipe:2"]);
    cmd.arg(output_path);

    cmd.stdout(Stdio::piped()).stderr(Stdio::piped());

    // Log the complete command being executed
    let command_str = format!("{:?}", cmd);
    println!("🚀 Executing FFmpeg command: {}", command_str);

    // Also log the actual CLI command for debugging
    // let mut cli_command = vec![ffmpeg_path.to_string_lossy().to_string()];
    // cli_command.extend(cmd.get_args().map(|arg| arg.to_string_lossy().to_string()));
    // let cli_string = cli_command.join(" ");
    // println!("🔧 Actual CLI command: {}", cli_string);

    // Start FFmpeg process
    let mut child = cmd.spawn().map_err(|e| {
        let error_msg = format!("Failed to start FFmpeg process: {}", e);
        println!("❌ {}", error_msg);
        println!("💡 Check if FFmpeg is properly installed and accessible");
        anyhow!(error_msg)
    })?;

    // Monitor progress and get handle to wait for completion
    let progress_handle = if let Some(stderr) = child.stderr.take() {
        Some(
            monitor_conversion_progress(
                stderr,
                state.clone(),
                conversion_id,
                app_handle.clone(),
                total_duration,
            )
            .await,
        )
    } else {
        println!("⚠️ No stderr available for progress monitoring");
        None
    };

    // Wait for FFmpeg process to complete
    println!("⏳ Waiting for FFmpeg process to complete...");
    let output = child.wait_with_output().map_err(|e| {
        let error_msg = format!("FFmpeg process failed to complete: {}", e);
        println!("❌ {}", error_msg);
        anyhow!(error_msg)
    })?;

    // Wait for progress monitoring to complete
    if let Some(handle) = progress_handle {
        println!("⏳ Waiting for progress monitoring to finish...");
        if let Err(e) = handle.await {
            println!("⚠️ Progress monitoring task failed: {}", e);
        } else {
            println!("✅ Progress monitoring completed successfully");
        }
    }

    println!(
        "🎯 FFmpeg process completed with exit code: {:?}",
        output.status.code()
    );

    if !output.status.success() {
        let stderr_output = String::from_utf8_lossy(&output.stderr);
        let stdout_output = String::from_utf8_lossy(&output.stdout);

        println!("❌ FFmpeg conversion failed!");
        println!("📊 Exit code: {:?}", output.status.code());
        println!("📄 STDERR output:\n{}", stderr_output);
        println!("📄 STDOUT output:\n{}", stdout_output);

        // Try to provide more specific error context
        let error_context = if stderr_output.contains("No such file or directory") {
            "Input file not found or inaccessible"
        } else if stderr_output.contains("Permission denied") {
            "Permission denied - check file/directory permissions"
        } else if stderr_output.contains("Invalid argument") {
            "Invalid FFmpeg arguments or unsupported codec"
        } else if stderr_output.contains("Conversion failed") {
            "FFmpeg codec conversion failed"
        } else if stderr_output.contains("Unknown encoder") {
            "Unsupported encoder for this format"
        } else {
            "General FFmpeg error"
        };

        println!("💡 Error context: {}", error_context);

        return Err(anyhow!(
            "FFmpeg conversion failed: {} - {}",
            error_context,
            stderr_output.trim()
        ));
    }

    // Verify output file was created successfully
    let output_file = Path::new(output_path);
    if !output_file.exists() {
        let error_msg = format!("Output file was not created: {}", output_path);
        println!("❌ {}", error_msg);
        return Err(anyhow!(error_msg));
    }

    let file_size = output_file.metadata().map(|m| m.len()).unwrap_or(0);

    if file_size == 0 {
        let error_msg = format!("Output file is empty: {}", output_path);
        println!("❌ {}", error_msg);
        return Err(anyhow!(error_msg));
    }

    println!(
        "✅ Conversion completed successfully: {} ({} bytes)",
        output_file
            .file_name()
            .unwrap_or_default()
            .to_string_lossy(),
        file_size
    );
    println!("📁 Output file location: {}", output_path);

    // Ensure final completion state is set (in case progress monitoring didn't catch completion signal)
    println!("🏁 Setting final completion state...");
    {
        let mut conversions = state.lock().unwrap();
        if let Some(conv) = conversions.get_mut(conversion_id) {
            conv.progress = 100.0;
            conv.status = "Completed".to_string();
            conv.eta = None;
            conv.speed = None;
            println!(
                "✅ Final completion: Progress = {:.1}%, Status = {}",
                conv.progress, conv.status
            );
            let _ = app_handle.emit("conversion_progress", conv.clone());
        }
    }

    Ok(output_path.to_string())
}

/// Applies format-specific FFmpeg settings based on the conversion options.
fn apply_format_settings(cmd: &mut Command, options: &ConversionOptions) -> Result<()> {
    println!(
        "🎨 Configuring format settings for: {}",
        options.output_format
    );

    match options.output_format.as_str() {
        "mp4" => {
            cmd.args(&["-c:v", "libx264"]);
            let (preset, crf) = match options.quality.as_str() {
                "high" => {
                    println!("📈 MP4 Quality: High (preset=slow, crf=18)");
                    ("slow", "18")
                }
                "medium" => {
                    println!("📊 MP4 Quality: Medium (preset=medium, crf=23)");
                    ("medium", "23")
                }
                "low" => {
                    println!("📉 MP4 Quality: Low (preset=fast, crf=28)");
                    ("fast", "28")
                }
                _ => {
                    println!(
                        "⚠️ Unknown quality '{}', defaulting to medium",
                        options.quality
                    );
                    ("medium", "23")
                }
            };
            cmd.args(&["-preset", preset, "-crf", crf]);
        }
        "webm" => {
            cmd.args(&["-c:v", "libvpx-vp9"]);
            let bitrate = match options.quality.as_str() {
                "high" => {
                    println!("📈 WebM Quality: High (bitrate=2M)");
                    "2M"
                }
                "medium" => {
                    println!("📊 WebM Quality: Medium (bitrate=1M)");
                    "1M"
                }
                "low" => {
                    println!("📉 WebM Quality: Low (bitrate=500k)");
                    "500k"
                }
                _ => {
                    println!(
                        "⚠️ Unknown quality '{}', defaulting to medium",
                        options.quality
                    );
                    "1M"
                }
            };
            cmd.args(&["-b:v", bitrate]);
        }
        "avi" => {
            println!("🎬 AVI: Using libx264 video codec and AAC audio codec");
            cmd.args(&["-c:v", "libx264", "-c:a", "aac"]);
        }
        "mov" => {
            println!("🎬 MOV: Using libx264 video codec and AAC audio codec");
            cmd.args(&["-c:v", "libx264", "-c:a", "aac"]);
        }
        _ => {
            let error_msg = format!(
                "Unsupported output format: '{}'. Supported formats: mp4, webm, avi, mov",
                options.output_format
            );
            println!("❌ {}", error_msg);
            return Err(anyhow!(error_msg));
        }
    }

    println!("✅ Format settings applied successfully");
    Ok(())
}

/// Monitors FFmpeg progress output and updates conversion state.
/// Returns a JoinHandle that can be awaited to ensure monitoring completes.
async fn monitor_conversion_progress(
    stderr: std::process::ChildStderr,
    state: ConversionState,
    conversion_id: &str,
    app_handle: AppHandle,
    total_duration: f64,
) -> tokio::task::JoinHandle<()> {
    let state_clone = state.clone();
    let conversion_id = conversion_id.to_string();
    let app_handle_clone = app_handle.clone();

    tokio::spawn(async move {
        use std::io::{BufRead, BufReader};
        use std::sync::atomic::{AtomicBool, Ordering};
        use std::sync::Arc;

        let reader = BufReader::new(stderr);
        let time_regex = regex::Regex::new(r"out_time_ms=(\d+)").unwrap();
        let end_regex = regex::Regex::new(r"progress=end").unwrap();
        let start_time = Instant::now();
        let mut progress_lines_count = 0;
        let mut last_progress = 0.0;
        let conversion_completed = Arc::new(AtomicBool::new(false));

        println!(
            "📊 Starting progress monitoring for conversion {}",
            &conversion_id[..8]
        );

        for line in reader.lines() {
            if let Ok(line) = line {
                // Log first few lines for debugging
                if progress_lines_count < 10 {
                    println!("📊 FFmpeg output line: {}", line.trim());
                }
                progress_lines_count += 1;

                // Check for FFmpeg completion signal
                if end_regex.is_match(&line) {
                    println!(
                        "✅ FFmpeg reported completion (progress=end) for {}",
                        &conversion_id[..8]
                    );
                    conversion_completed.store(true, Ordering::Relaxed);

                    // Set final completion state
                    {
                        let mut conversions = state_clone.lock().unwrap();
                        if let Some(conv) = conversions.get_mut(&conversion_id) {
                            conv.progress = 100.0;
                            conv.status = "Completed".to_string();
                            conv.eta = None;
                            conv.speed = None;
                            println!("🎯 Progress monitoring: Set final completion to 100%");
                            let _ = app_handle_clone.emit("conversion_progress", conv.clone());
                        }
                    }
                    break;
                }

                // Parse time-based progress (only if not completed)
                if !conversion_completed.load(Ordering::Relaxed) {
                    if let Some(captures) = time_regex.captures(&line) {
                        if let Some(time_match) = captures.get(1) {
                            if let Ok(time_microseconds) = time_match.as_str().parse::<u64>() {
                                let current_time = time_microseconds as f64 / 1_000_000.0;
                                if total_duration > 0.0 {
                                    // Allow progress to reach 99.5% but not 100% (reserved for completion signal)
                                    let progress =
                                        (current_time / total_duration * 100.0).min(99.5);

                                    // Only update if progress increased significantly (reduce spam)
                                    if progress > last_progress + 1.0 {
                                        last_progress = progress;

                                        // Calculate ETA and speed
                                        let elapsed_seconds = start_time.elapsed().as_secs_f64();
                                        let remaining_time = if progress > 0.0 {
                                            (total_duration - current_time).max(0.0)
                                        } else {
                                            total_duration
                                        };
                                        let speed = if elapsed_seconds > 0.0 {
                                            current_time / elapsed_seconds
                                        } else {
                                            1.0
                                        };

                                        // Log progress updates every 5%
                                        if (progress as i32) % 5 == 0 && progress > 0.0 {
                                            println!(
                                                "📈 Progress: {:.1}% ({:.1}s / {:.1}s) - Speed: {:.2}x - ETA: {:.0}s",
                                                progress, current_time, total_duration, speed, remaining_time
                                            );
                                        }

                                        // Update conversion state
                                        {
                                            let mut conversions = state_clone.lock().unwrap();
                                            if let Some(conv) = conversions.get_mut(&conversion_id)
                                            {
                                                conv.progress = progress as f32;
                                                conv.status = "Converting".to_string();
                                                conv.eta = Some(format!("{:.0}s", remaining_time));
                                                conv.speed = Some(format!("{:.2}x", speed));
                                                let _ = app_handle_clone
                                                    .emit("conversion_progress", conv.clone());
                                            }
                                        }
                                    }
                                } else {
                                    println!("⚠️ Cannot calculate progress: total_duration is 0");
                                }
                            }
                        }
                    }
                }
            } else if let Err(e) = line {
                println!("⚠️ Error reading FFmpeg output line: {}", e);
                break;
            }
        }

        let elapsed = start_time.elapsed();
        println!(
            "📊 Progress monitoring completed for {}. Lines: {}, Duration: {:.2}s, Final progress: {:.1}%, Completed: {}",
            &conversion_id[..8],
            progress_lines_count,
            elapsed.as_secs_f64(),
            last_progress,
            conversion_completed.load(Ordering::Relaxed)
        );
    })
}
