//! Type definitions for the FFmpeg conversion application.

use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::{Arc, Mutex};

// Re-export settings types for easier access
pub use crate::settings::{OutputPathMode, OutputPathSettings, UserSettings};

/// Metadata information extracted from media files.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FileMetadata {
    pub dimensions: Option<String>,
    pub duration: Option<String>,
    pub bitrate: Option<String>,
    pub codec: Option<String>,
    pub format: Option<String>,
    pub size: Option<u64>,
}

/// Video quality settings for custom conversion.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VideoQualityOptions {
    pub encoder: String,
    pub resolution: String,
    pub frame_rate: String,
    pub quality: i32,
}

/// Audio quality settings for custom conversion.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AudioQualityOptions {
    pub bitrate: i32,
    pub sample_rate: i32,
}

/// Image quality settings for custom conversion.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ImageQualityOptions {
    pub quality: i32,
}

/// Custom quality settings union.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CustomQualityOptions {
    pub video: Option<VideoQualityOptions>,
    pub audio: Option<AudioQualityOptions>,
    pub image: Option<ImageQualityOptions>,
}

/// Options for file conversion operations.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ConversionOptions {
    pub output_format: String,
    pub quality: String,
    pub output_dir: Option<String>,
    pub preserve_metadata: bool,
    pub custom_settings: Option<CustomQualityOptions>,
}

/// Progress information for ongoing conversions.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ConversionProgress {
    pub id: String,
    pub progress: f32,
    pub status: String,
    pub current_file: String,
    pub output_path: Option<String>,
    pub eta: Option<String>,
    pub speed: Option<String>,
}

/// Result of a completed conversion operation.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ConversionResult {
    pub id: String,
    pub success: bool,
    pub output_path: Option<String>,
    pub error: Option<String>,
}

/// Global state for tracking active conversions.
pub type ConversionState = Arc<Mutex<HashMap<String, ConversionProgress>>>;

/// Global state for tracking active conversion process IDs for cancellation.
pub type ProcessHandles = Arc<Mutex<HashMap<String, u32>>>;
