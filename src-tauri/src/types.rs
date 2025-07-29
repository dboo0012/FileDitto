//! Type definitions for the FFmpeg conversion application.

use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::{Arc, Mutex};

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

/// Options for file conversion operations.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ConversionOptions {
    pub output_format: String,
    pub quality: String,
    pub output_dir: Option<String>,
    pub preserve_metadata: bool,
}

/// Progress information for ongoing conversions.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ConversionProgress {
    pub id: String,
    pub progress: f32,
    pub status: String,
    pub current_file: String,
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
