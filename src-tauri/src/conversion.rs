//! File conversion functionality using FFmpeg.

use crate::conversion_settings;
use crate::path;
use crate::types::{
    ConversionOptions, ConversionProgress, ConversionResult, ConversionState, ProcessHandles,
};
use anyhow::{anyhow, Result};
use std::path::Path;
use std::process::{Command, Stdio};
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
                output_path: Some(output_path.clone()),
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
    println!("🛑 Cancelling conversion: {}", &conversion_id[..8]);

    // Update status to cancelling first and get output path for cleanup
    let output_path_for_cleanup: Option<String>;
    let state: ConversionState = app_handle.state::<ConversionState>().inner().clone();
    {
        let mut conversions = state.lock().unwrap();
        if let Some(progress) = conversions.get_mut(&conversion_id) {
            progress.status = "Cancelling".to_string();
            output_path_for_cleanup = progress.output_path.clone();
            println!(
                "📊 Updated status to 'Cancelling' for conversion: {}",
                &conversion_id[..8]
            );
            let _ = app_handle.emit("conversion_progress", progress.clone());
        } else {
            return Err("Conversion not found".to_string());
        }
    }

    // Kill the actual FFmpeg process using OS kill commands
    let process_handles: ProcessHandles = app_handle.state::<ProcessHandles>().inner().clone();
    {
        let mut handles = process_handles.lock().unwrap();
        if let Some(process_id) = handles.remove(&conversion_id) {
            #[cfg(target_os = "windows")]
            {
                use std::process::Command;
                match Command::new("taskkill")
                    .args(&["/F", "/PID", &process_id.to_string()])
                    .output()
                {
                    Ok(output) => {
                        if output.status.success() {
                            println!(
                                "✅ FFmpeg process killed successfully for conversion: {}",
                                &conversion_id[..8]
                            );

                            // Clean up partial output file
                            if let Some(output_path) = &output_path_for_cleanup {
                                if Path::new(output_path).exists() {
                                    match std::fs::remove_file(output_path) {
                                        Ok(_) => {
                                            println!(
                                                "🧹 Removed partial output file: {}",
                                                output_path
                                            );
                                        }
                                        Err(e) => {
                                            println!(
                                                "⚠️ Failed to remove partial output file: {} - {}",
                                                output_path, e
                                            );
                                        }
                                    }
                                } else {
                                    println!("ℹ️ No partial output file to clean up");
                                }
                            }

                            Ok(true)
                        } else {
                            let error = String::from_utf8_lossy(&output.stderr);
                            println!("❌ Failed to kill FFmpeg process: {}", error);
                            Err(format!("Failed to kill process: {}", error))
                        }
                    }
                    Err(e) => {
                        println!("❌ Failed to execute taskkill: {}", e);
                        Err(format!("Failed to execute taskkill: {}", e))
                    }
                }
            }
            #[cfg(not(target_os = "windows"))]
            {
                use std::process::Command;
                match Command::new("kill")
                    .args(&["-9", &process_id.to_string()])
                    .output()
                {
                    Ok(output) => {
                        if output.status.success() {
                            println!(
                                "✅ FFmpeg process killed successfully for conversion: {}",
                                &conversion_id[..8]
                            );

                            // Clean up partial output file
                            if let Some(output_path) = &output_path_for_cleanup {
                                if Path::new(output_path).exists() {
                                    match std::fs::remove_file(output_path) {
                                        Ok(_) => {
                                            println!(
                                                "🧹 Removed partial output file: {}",
                                                output_path
                                            );
                                        }
                                        Err(e) => {
                                            println!(
                                                "⚠️ Failed to remove partial output file: {} - {}",
                                                output_path, e
                                            );
                                        }
                                    }
                                } else {
                                    println!("ℹ️ No partial output file to clean up");
                                }
                            }

                            Ok(true)
                        } else {
                            let error = String::from_utf8_lossy(&output.stderr);
                            println!("❌ Failed to kill FFmpeg process: {}", error);
                            Err(format!("Failed to kill process: {}", error))
                        }
                    }
                    Err(e) => {
                        println!("❌ Failed to execute kill: {}", e);
                        Err(format!("Failed to execute kill: {}", e))
                    }
                }
            }
        } else {
            println!(
                "⚠️ Process not found or already completed for conversion: {}",
                &conversion_id[..8]
            );
            // Still return Ok(true) since the conversion is effectively "cancelled"
            Ok(true)
        }
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

    let ffmpeg_path = path::ffmpeg_path();
    println!("🔧 Using FFmpeg path: {}", ffmpeg_path.display());

    // Determine if this is an image conversion
    let is_image_conversion = is_image_format(&options.output_format);

    // Build FFmpeg command based on output format
    let mut cmd = Command::new(&ffmpeg_path);
    cmd.args(&["-y", "-i", input_path]);

    if is_image_conversion {
        // Apply image-specific settings
        println!("🖼️ Applying image settings for: {}", options.output_format);
        apply_image_settings(&mut cmd, options)?;
    } else {
        // Apply format-specific arguments for video/audio
        println!("🎬 Applying format settings for: {}", options.output_format);
        apply_format_settings(&mut cmd, options)?;
    }

    // Add metadata preservation option
    if !options.preserve_metadata {
        cmd.args(&["-map_metadata", "-1"]);
        println!("🔄 Metadata preservation: disabled");
    } else {
        println!("🔄 Metadata preservation: enabled");
    }

    cmd.arg(output_path);
    cmd.stdout(Stdio::piped()).stderr(Stdio::piped());

    // Log the complete command being executed
    let command_str = format!("{:?}", cmd);
    println!("🚀 Executing FFmpeg command: {}", command_str);

    // Start FFmpeg process
    let child = cmd.spawn().map_err(|e| {
        let error_msg = format!("Failed to start FFmpeg process: {}", e);
        println!("❌ {}", error_msg);
        println!("💡 Check if FFmpeg is properly installed and accessible");
        anyhow!(error_msg)
    })?;

    // Store process ID for potential cancellation
    let process_id = child.id();
    let process_handles: ProcessHandles = app_handle.state::<ProcessHandles>().inner().clone();
    {
        let mut handles = process_handles.lock().unwrap();
        handles.insert(conversion_id.to_string(), process_id);
    }

    // Update status to converting
    {
        let mut conversions = state.lock().unwrap();
        if let Some(conv) = conversions.get_mut(conversion_id) {
            conv.status = "Converting".to_string();
            let _ = app_handle.emit("conversion_progress", conv.clone());
        }
    }

    // Wait for FFmpeg process to complete
    println!("⏳ Waiting for FFmpeg process to complete...");

    let output = child.wait_with_output().map_err(|e| {
        let error_msg = format!("FFmpeg process failed to complete: {}", e);
        println!("❌ {}", error_msg);
        anyhow!(error_msg)
    })?;

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

    // Remove completed conversion from tracking
    {
        let mut conversions = state.lock().unwrap();
        conversions.remove(conversion_id);
    }

    // Remove process handle from tracking
    {
        let process_handles: ProcessHandles = app_handle.state::<ProcessHandles>().inner().clone();
        let mut handles = process_handles.lock().unwrap();
        handles.remove(conversion_id);
    }

    Ok(output_path.to_string())
}

/// Applies format-specific FFmpeg settings based on the conversion options.
fn apply_format_settings(cmd: &mut Command, options: &ConversionOptions) -> Result<()> {
    println!(
        "🎨 Configuring format settings for: {}",
        options.output_format
    );

    let config = conversion_settings::get_format_config(&options.output_format, &options.quality)?;

    config.apply_to_command(cmd);

    println!(
        "📊 Quality: {} for format: {}",
        options.quality, options.output_format
    );
    println!("✅ Format settings applied successfully");

    Ok(())
}

/// Check if the given format is an image format
fn is_image_format(format: &str) -> bool {
    matches!(format, "jpeg" | "png" | "webp" | "bmp" | "tiff")
}

/// Applies image-specific FFmpeg settings based on the conversion options
fn apply_image_settings(cmd: &mut Command, options: &ConversionOptions) -> Result<()> {
    println!(
        "🖼️ Configuring image settings for: {}",
        options.output_format
    );

    let config = conversion_settings::get_format_config(&options.output_format, &options.quality)?;

    // For images, we need to specify that we want only one frame
    cmd.args(&["-vframes", "1"]);

    // Apply the format configuration
    config.apply_to_command(cmd);

    // Add format-specific optimizations
    match options.output_format.as_str() {
        "jpeg" => {
            // JPEG-specific optimizations
            cmd.args(&["-pix_fmt", "yuvj420p"]);
        }
        "png" => {
            // PNG-specific optimizations
            cmd.args(&["-pix_fmt", "rgba"]);
        }
        "webp" => {
            // WebP-specific optimizations
            cmd.args(&["-pix_fmt", "yuva420p"]);
        }
        "bmp" => {
            // BMP-specific optimizations
            cmd.args(&["-pix_fmt", "bgr24"]);
        }
        "tiff" => {
            // TIFF-specific optimizations
            cmd.args(&["-pix_fmt", "rgb24"]);
        }
        _ => {}
    }

    println!(
        "📊 Quality: {} for format: {}",
        options.quality, options.output_format
    );
    println!("✅ Image settings applied successfully");

    Ok(())
}
