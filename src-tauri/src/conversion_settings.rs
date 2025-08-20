use anyhow::{anyhow, Result};
use std::process::Command;

#[derive(Debug, Clone)]
pub struct FormatConfig {
    pub video_codec: &'static str,
    pub audio_codec: Option<&'static str>,
    pub preset: Option<&'static str>,
    pub crf: Option<&'static str>,
    pub bitrate: Option<&'static str>,
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
    }
}

/// Get format configuration for a specific format and quality combination
pub fn get_format_config(format: &str, quality: &str) -> Result<FormatConfig> {
    let config = match format {
        "mp4" => get_mp4_config(quality),
        "webm" => get_webm_config(quality),
        "avi" => get_avi_config(),
        "mov" => get_mov_config(),
        _ => {
            return Err(anyhow!(
                "Unsupported output format: '{}'. Supported formats: mp4, webm, avi, mov",
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
        },
        "medium" => FormatConfig {
            video_codec: "libx264",
            audio_codec: Some("aac"),
            preset: Some("medium"),
            crf: Some("23"),
            bitrate: None,
        },
        "low" => FormatConfig {
            video_codec: "libx264",
            audio_codec: Some("aac"),
            preset: Some("fast"),
            crf: Some("28"),
            bitrate: None,
        },
        _ => {
            // Default to medium quality for unknown quality settings
            FormatConfig {
                video_codec: "libx264",
                audio_codec: Some("aac"),
                preset: Some("medium"),
                crf: Some("23"),
                bitrate: None,
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
        },
        "medium" => FormatConfig {
            video_codec: "libvpx-vp9",
            audio_codec: Some("libopus"),
            preset: None,
            crf: None,
            bitrate: Some("1M"),
        },
        "low" => FormatConfig {
            video_codec: "libvpx-vp9",
            audio_codec: Some("libopus"),
            preset: None,
            crf: None,
            bitrate: Some("500k"),
        },
        _ => {
            // Default to medium quality for unknown quality settings
            FormatConfig {
                video_codec: "libvpx-vp9",
                audio_codec: Some("libopus"),
                preset: None,
                crf: None,
                bitrate: Some("1M"),
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
    }
}
