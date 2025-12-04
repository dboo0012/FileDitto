use anyhow::{anyhow, Result};
use std::process::Command;

use crate::types::{AudioQualityOptions, ImageQualityOptions, VideoQualityOptions};

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
        cmd.args(["-c:v", self.video_codec]);

        // Apply audio codec if specified
        if let Some(audio_codec) = self.audio_codec {
            cmd.args(["-c:a", audio_codec]);
        }

        // Apply preset if specified
        if let Some(preset) = self.preset {
            cmd.args(["-preset", preset]);
        }

        // Apply CRF if specified
        if let Some(crf) = self.crf {
            cmd.args(["-crf", crf]);
        }

        // Apply bitrate if specified
        if let Some(bitrate) = self.bitrate {
            cmd.args(["-b:v", bitrate]);
        }

        // Apply image quality if specified
        if let Some(quality) = self.quality {
            cmd.args(["-q:v", quality]);
        }

        // Apply compression if specified
        if let Some(compression) = self.compression {
            cmd.args(["-compression_level", compression]);
        }
    }
}

/// Apply custom video settings to FFmpeg command
pub fn apply_custom_video_settings(
    cmd: &mut Command,
    settings: &VideoQualityOptions,
    output_format: &str,
) {
    // Apply video encoder
    let codec = match settings.encoder.as_str() {
        "h264" => "libx264",
        "h265" => "libx265",
        "av1" => {
            if output_format == "webm" {
                "libaom-av1"
            } else {
                "libsvtav1"
            }
        }
        "vp9" => "libvpx-vp9",
        _ => "libx264",
    };
    cmd.args(["-c:v", codec]);

    // Apply encoding preset based on encoder
    let preset = match settings.encoder.as_str() {
        "h264" | "h265" => {
            // Map quality (1-100) to preset
            // Higher quality = slower preset
            if settings.quality >= 80 {
                Some("slow")
            } else if settings.quality >= 50 {
                Some("medium")
            } else {
                Some("fast")
            }
        }
        _ => None,
    };
    if let Some(p) = preset {
        cmd.args(["-preset", p]);
    }

    // Apply CRF/quality based on encoder and quality setting
    // Quality 1-100 maps to CRF (lower CRF = higher quality)
    // CRF range: 0-51 for x264/x265, we use 15-35 range
    let crf = 35 - ((settings.quality as f32 / 100.0) * 20.0) as i32;
    let crf_str = crf.to_string();

    match settings.encoder.as_str() {
        "h264" | "h265" => {
            cmd.args(["-crf", &crf_str]);
        }
        "vp9" => {
            // VP9 uses b:v for quality control
            let bitrate = format!("{}k", 500 + (settings.quality * 45)); // 500k to 5M
            cmd.args(["-b:v", &bitrate]);
            cmd.args(["-crf", &crf_str]);
        }
        "av1" => {
            // AV1 uses crf similar to x264/x265
            cmd.args(["-crf", &crf_str]);
        }
        _ => {}
    }

    // Apply resolution if not "original"
    if settings.resolution != "original" {
        let scale = match settings.resolution.as_str() {
            "480p" => "scale=-2:480",
            "720p" => "scale=-2:720",
            "1080p" => "scale=-2:1080",
            "1440p" => "scale=-2:1440",
            "2160p" => "scale=-2:2160",
            _ => "",
        };
        if !scale.is_empty() {
            cmd.args(["-vf", scale]);
        }
    }

    // Apply frame rate if not "original"
    if settings.frame_rate != "original" {
        cmd.args(["-r", &settings.frame_rate]);
    }

    // Apply audio codec based on format
    match output_format {
        "mp4" | "mov" | "mkv" => {
            cmd.args(["-c:a", "aac"]);
            cmd.args(["-b:a", "192k"]);
        }
        "webm" => {
            cmd.args(["-c:a", "libopus"]);
            cmd.args(["-b:a", "128k"]);
        }
        "avi" => {
            cmd.args(["-c:a", "mp3"]);
            cmd.args(["-b:a", "192k"]);
        }
        _ => {}
    }
}

/// Apply custom audio settings to FFmpeg command
pub fn apply_custom_audio_settings(
    cmd: &mut Command,
    settings: &AudioQualityOptions,
    output_format: &str,
) {
    // Apply the appropriate audio codec based on format
    let audio_codec = match output_format {
        "mp3" => "libmp3lame",
        "aac" => "aac",
        "m4a" => "aac",
        "wav" => "pcm_s16le",
        "flac" => "flac",
        "ogg" => "libvorbis",
        "opus" => "libopus",
        _ => "aac",
    };
    cmd.args(["-c:a", audio_codec]);

    // Apply audio bitrate (not applicable to lossless formats)
    match output_format {
        "wav" | "flac" => {
            // Lossless formats don't use bitrate
        }
        _ => {
            let bitrate = format!("{}k", settings.bitrate);
            cmd.args(["-b:a", &bitrate]);
        }
    }

    // Apply sample rate
    let sample_rate = settings.sample_rate.to_string();
    cmd.args(["-ar", &sample_rate]);

    // No video stream for audio-only output
    cmd.args(["-vn"]);
}

/// Apply custom image settings to FFmpeg command
pub fn apply_custom_image_settings(
    cmd: &mut Command,
    settings: &ImageQualityOptions,
    output_format: &str,
) {
    match output_format {
        "jpeg" => {
            // JPEG quality: -q:v 2-31 (lower is better)
            // Map 1-100 to 31-2
            let q = 31 - ((settings.quality as f32 / 100.0) * 29.0) as i32;
            let q = q.clamp(2, 31);
            cmd.args(["-q:v", &q.to_string()]);
        }
        "png" => {
            // PNG compression: 0-9 (higher = more compression)
            // Map 1-100 to 0-9
            let compression = ((settings.quality as f32 / 100.0) * 9.0) as i32;
            let compression = compression.clamp(0, 9);
            cmd.args(["-compression_level", &compression.to_string()]);
        }
        "webp" => {
            // WebP quality: 0-100
            cmd.args(["-quality", &settings.quality.to_string()]);
        }
        "tiff" => {
            // TIFF uses compression method
            cmd.args(["-compression_algo", "lzw"]);
        }
        _ => {}
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
        
        // Audio formats
        "mp3" => get_mp3_config(quality),
        "aac" => get_aac_config(quality),
        "m4a" => get_m4a_config(quality),
        "wav" => get_wav_config(),
        "flac" => get_flac_config(),
        "ogg" => get_ogg_config(quality),
        "opus" => get_opus_config(quality),
        
        // Image formats
        "jpeg" => get_jpeg_config(quality),
        "png" => get_png_config(quality),
        "webp" => get_webp_config(quality),
        "bmp" => get_bmp_config(),
        "tiff" => get_tiff_config(quality),
        
        _ => {
            return Err(anyhow!(
                "Unsupported output format: '{}'. Supported formats: mp4, webm, avi, mov, mp3, aac, m4a, wav, flac, ogg, opus, jpeg, png, webp, bmp, tiff",
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

// Audio format configurations

/// Get MP3 format configuration based on quality
fn get_mp3_config(quality: &str) -> FormatConfig {
    match quality {
        "high" => FormatConfig {
            video_codec: "libmp3lame",
            audio_codec: None,
            preset: None,
            crf: None,
            bitrate: Some("320k"),
            quality: None,
            compression: None,
        },
        "medium" => FormatConfig {
            video_codec: "libmp3lame",
            audio_codec: None,
            preset: None,
            crf: None,
            bitrate: Some("192k"),
            quality: None,
            compression: None,
        },
        "low" => FormatConfig {
            video_codec: "libmp3lame",
            audio_codec: None,
            preset: None,
            crf: None,
            bitrate: Some("128k"),
            quality: None,
            compression: None,
        },
        _ => FormatConfig {
            video_codec: "libmp3lame",
            audio_codec: None,
            preset: None,
            crf: None,
            bitrate: Some("192k"),
            quality: None,
            compression: None,
        },
    }
}

/// Get AAC format configuration based on quality
fn get_aac_config(quality: &str) -> FormatConfig {
    match quality {
        "high" => FormatConfig {
            video_codec: "aac",
            audio_codec: None,
            preset: None,
            crf: None,
            bitrate: Some("256k"),
            quality: None,
            compression: None,
        },
        "medium" => FormatConfig {
            video_codec: "aac",
            audio_codec: None,
            preset: None,
            crf: None,
            bitrate: Some("192k"),
            quality: None,
            compression: None,
        },
        "low" => FormatConfig {
            video_codec: "aac",
            audio_codec: None,
            preset: None,
            crf: None,
            bitrate: Some("128k"),
            quality: None,
            compression: None,
        },
        _ => FormatConfig {
            video_codec: "aac",
            audio_codec: None,
            preset: None,
            crf: None,
            bitrate: Some("192k"),
            quality: None,
            compression: None,
        },
    }
}

/// Get M4A format configuration based on quality
fn get_m4a_config(quality: &str) -> FormatConfig {
    match quality {
        "high" => FormatConfig {
            video_codec: "aac",
            audio_codec: None,
            preset: None,
            crf: None,
            bitrate: Some("256k"),
            quality: None,
            compression: None,
        },
        "medium" => FormatConfig {
            video_codec: "aac",
            audio_codec: None,
            preset: None,
            crf: None,
            bitrate: Some("192k"),
            quality: None,
            compression: None,
        },
        "low" => FormatConfig {
            video_codec: "aac",
            audio_codec: None,
            preset: None,
            crf: None,
            bitrate: Some("128k"),
            quality: None,
            compression: None,
        },
        _ => FormatConfig {
            video_codec: "aac",
            audio_codec: None,
            preset: None,
            crf: None,
            bitrate: Some("192k"),
            quality: None,
            compression: None,
        },
    }
}

/// Get WAV format configuration (lossless, no quality settings)
fn get_wav_config() -> FormatConfig {
    FormatConfig {
        video_codec: "pcm_s16le",
        audio_codec: None,
        preset: None,
        crf: None,
        bitrate: None,
        quality: None,
        compression: None,
    }
}

/// Get FLAC format configuration (lossless, no quality settings)
fn get_flac_config() -> FormatConfig {
    FormatConfig {
        video_codec: "flac",
        audio_codec: None,
        preset: None,
        crf: None,
        bitrate: None,
        quality: None,
        compression: None,
    }
}

/// Get OGG (Vorbis) format configuration based on quality
fn get_ogg_config(quality: &str) -> FormatConfig {
    match quality {
        "high" => FormatConfig {
            video_codec: "libvorbis",
            audio_codec: None,
            preset: None,
            crf: None,
            bitrate: Some("256k"),
            quality: None,
            compression: None,
        },
        "medium" => FormatConfig {
            video_codec: "libvorbis",
            audio_codec: None,
            preset: None,
            crf: None,
            bitrate: Some("192k"),
            quality: None,
            compression: None,
        },
        "low" => FormatConfig {
            video_codec: "libvorbis",
            audio_codec: None,
            preset: None,
            crf: None,
            bitrate: Some("128k"),
            quality: None,
            compression: None,
        },
        _ => FormatConfig {
            video_codec: "libvorbis",
            audio_codec: None,
            preset: None,
            crf: None,
            bitrate: Some("192k"),
            quality: None,
            compression: None,
        },
    }
}

/// Get Opus format configuration based on quality
fn get_opus_config(quality: &str) -> FormatConfig {
    match quality {
        "high" => FormatConfig {
            video_codec: "libopus",
            audio_codec: None,
            preset: None,
            crf: None,
            bitrate: Some("256k"),
            quality: None,
            compression: None,
        },
        "medium" => FormatConfig {
            video_codec: "libopus",
            audio_codec: None,
            preset: None,
            crf: None,
            bitrate: Some("128k"),
            quality: None,
            compression: None,
        },
        "low" => FormatConfig {
            video_codec: "libopus",
            audio_codec: None,
            preset: None,
            crf: None,
            bitrate: Some("96k"),
            quality: None,
            compression: None,
        },
        _ => FormatConfig {
            video_codec: "libopus",
            audio_codec: None,
            preset: None,
            crf: None,
            bitrate: Some("128k"),
            quality: None,
            compression: None,
        },
    }
}
