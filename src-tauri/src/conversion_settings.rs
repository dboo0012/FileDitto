use anyhow::{anyhow, Result};
use std::process::Command;

#[derive(Debug, Clone)]
pub struct FormatConfig {
    pub video_codec: &'static str,
    pub audio_codec: Option<&'static str>,
    pub preset: Option<&'static str>,
    pub crf: Option<&'static str>,
    pub bitrate: Option<&'static str>,
    // Add image-specific settings
    pub quality: Option<&'static str>,
    pub compression: Option<&'static str>,
}

impl FormatConfig {
    /// Apply this configuration to an FFmpeg command
    pub fn apply_to_command(&self, cmd: &mut Command) {
        // Apply video codec
        cmd.args(&["-c:v", self.video_codec]);

        // Apply audio codec if specified
        if let Some(audio_codec) = self.audio_codec {
            cmd.args(&["-c:a", audio_codec]);
        }

        // Apply preset if specified
        if let Some(preset) = self.preset {
            cmd.args(&["-preset", preset]);
        }

        // Apply CRF if specified
        if let Some(crf) = self.crf {
            cmd.args(&["-crf", crf]);
        }

        // Apply bitrate if specified
        if let Some(bitrate) = self.bitrate {
            cmd.args(&["-b:v", bitrate]);
        }

        // Apply image quality if specified
        if let Some(quality) = self.quality {
            cmd.args(&["-q:v", quality]);
        }

        // Apply compression if specified
        if let Some(compression) = self.compression {
            cmd.args(&["-compression_level", compression]);
        }
    }
}

/// Get format configuration for a specific format and quality combination
pub fn get_format_config(format: &str, quality: &str) -> Result<FormatConfig> {
    let config = match format {
        // Video formats
        "mp4" => get_mp4_config(quality),
        "webm" => get_webm_config(quality),
        "avi" => get_avi_config(),
        "mov" => get_mov_config(),
        
        // Image formats
        "jpeg" => get_jpeg_config(quality),
        "png" => get_png_config(quality),
        "webp" => get_webp_config(quality),
        "bmp" => get_bmp_config(),
        "tiff" => get_tiff_config(quality),
        
        _ => {
            return Err(anyhow!(
                "Unsupported output format: '{}'. Supported formats: mp4, webm, avi, mov, jpeg, png, webp, bmp, tiff",
                format
            ))
        }
    };

    Ok(config)
}

/// Get MP4 format configuration based on quality
fn get_mp4_config(quality: &str) -> FormatConfig {
    match quality {
        "high" => FormatConfig {
            video_codec: "libx264",
            audio_codec: Some("aac"),
            preset: Some("slow"),
            crf: Some("18"),
            bitrate: None,
            quality: None,
            compression: None,
        },
        "medium" => FormatConfig {
            video_codec: "libx264",
            audio_codec: Some("aac"),
            preset: Some("medium"),
            crf: Some("23"),
            bitrate: None,
            quality: None,
            compression: None,
        },
        "low" => FormatConfig {
            video_codec: "libx264",
            audio_codec: Some("aac"),
            preset: Some("fast"),
            crf: Some("28"),
            bitrate: None,
            quality: None,
            compression: None,
        },
        _ => {
            // Default to medium quality for unknown quality settings
            FormatConfig {
                video_codec: "libx264",
                audio_codec: Some("aac"),
                preset: Some("medium"),
                crf: Some("23"),
                bitrate: None,
                quality: None,
                compression: None,
            }
        }
    }
}

/// Get WebM format configuration based on quality
fn get_webm_config(quality: &str) -> FormatConfig {
    match quality {
        "high" => FormatConfig {
            video_codec: "libvpx-vp9",
            audio_codec: Some("libopus"),
            preset: None,
            crf: None,
            bitrate: Some("2M"),
            quality: None,
            compression: None,
        },
        "medium" => FormatConfig {
            video_codec: "libvpx-vp9",
            audio_codec: Some("libopus"),
            preset: None,
            crf: None,
            bitrate: Some("1M"),
            quality: None,
            compression: None,
        },
        "low" => FormatConfig {
            video_codec: "libvpx-vp9",
            audio_codec: Some("libopus"),
            preset: None,
            crf: None,
            bitrate: Some("500k"),
            quality: None,
            compression: None,
        },
        _ => {
            // Default to medium quality for unknown quality settings
            FormatConfig {
                video_codec: "libvpx-vp9",
                audio_codec: Some("libopus"),
                preset: None,
                crf: None,
                bitrate: Some("1M"),
                quality: None,
                compression: None,
            }
        }
    }
}

/// Get AVI format configuration
fn get_avi_config() -> FormatConfig {
    FormatConfig {
        video_codec: "libx264",
        audio_codec: Some("aac"),
        preset: None,
        crf: None,
        bitrate: None,
        quality: None,
        compression: None,
    }
}

/// Get MOV format configuration
fn get_mov_config() -> FormatConfig {
    FormatConfig {
        video_codec: "libx264",
        audio_codec: Some("aac"),
        preset: None,
        crf: None,
        bitrate: None,
        quality: None,
        compression: None,
    }
}

// Image format configurations

/// Get JPEG format configuration based on quality
fn get_jpeg_config(quality: &str) -> FormatConfig {
    match quality {
        "high" => FormatConfig {
            video_codec: "mjpeg",
            audio_codec: None,
            preset: None,
            crf: None,
            bitrate: None,
            quality: Some("2"),
            compression: None,
        },
        "medium" => FormatConfig {
            video_codec: "mjpeg",
            audio_codec: None,
            preset: None,
            crf: None,
            bitrate: None,
            quality: Some("5"),
            compression: None,
        },
        "low" => FormatConfig {
            video_codec: "mjpeg",
            audio_codec: None,
            preset: None,
            crf: None,
            bitrate: None,
            quality: Some("8"),
            compression: None,
        },
        _ => FormatConfig {
            video_codec: "mjpeg",
            audio_codec: None,
            preset: None,
            crf: None,
            bitrate: None,
            quality: Some("5"),
            compression: None,
        }
    }
}

/// Get PNG format configuration based on quality
fn get_png_config(quality: &str) -> FormatConfig {
    match quality {
        "high" => FormatConfig {
            video_codec: "png",
            audio_codec: None,
            preset: None,
            crf: None,
            bitrate: None,
            quality: None,
            compression: Some("1"),
        },
        "medium" => FormatConfig {
            video_codec: "png",
            audio_codec: None,
            preset: None,
            crf: None,
            bitrate: None,
            quality: None,
            compression: Some("6"),
        },
        "low" => FormatConfig {
            video_codec: "png",
            audio_codec: None,
            preset: None,
            crf: None,
            bitrate: None,
            quality: None,
            compression: Some("9"),
        },
        _ => FormatConfig {
            video_codec: "png",
            audio_codec: None,
            preset: None,
            crf: None,
            bitrate: None,
            quality: None,
            compression: Some("6"),
        }
    }
}

/// Get WebP format configuration based on quality
fn get_webp_config(quality: &str) -> FormatConfig {
    match quality {
        "high" => FormatConfig {
            video_codec: "libwebp",
            audio_codec: None,
            preset: None,
            crf: None,
            bitrate: None,
            quality: Some("90"),
            compression: None,
        },
        "medium" => FormatConfig {
            video_codec: "libwebp",
            audio_codec: None,
            preset: None,
            crf: None,
            bitrate: None,
            quality: Some("75"),
            compression: None,
        },
        "low" => FormatConfig {
            video_codec: "libwebp",
            audio_codec: None,
            preset: None,
            crf: None,
            bitrate: None,
            quality: Some("50"),
            compression: None,
        },
        _ => FormatConfig {
            video_codec: "libwebp",
            audio_codec: None,
            preset: None,
            crf: None,
            bitrate: None,
            quality: Some("75"),
            compression: None,
        }
    }
}

/// Get BMP format configuration
fn get_bmp_config() -> FormatConfig {
    FormatConfig {
        video_codec: "bmp",
        audio_codec: None,
        preset: None,
        crf: None,
        bitrate: None,
        quality: None,
        compression: None,
    }
}

/// Get TIFF format configuration based on quality
fn get_tiff_config(quality: &str) -> FormatConfig {
    match quality {
        "high" => FormatConfig {
            video_codec: "tiff",
            audio_codec: None,
            preset: None,
            crf: None,
            bitrate: None,
            quality: None,
            compression: Some("lzw"),
        },
        _ => FormatConfig {
            video_codec: "tiff",
            audio_codec: None,
            preset: None,
            crf: None,
            bitrate: None,
            quality: None,
            compression: Some("lzw"),
        }
    }
}
