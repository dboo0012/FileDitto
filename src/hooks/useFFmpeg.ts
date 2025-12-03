import { useState, useEffect } from 'react';
import { TauriAPI } from '../utils/tauri';

export const useFFmpeg = () => {
  const [ffmpegAvailable, setFFmpegAvailable] = useState<boolean | null>(null);

  const checkFFmpegAvailability = async () => {
    try {
      const available = await TauriAPI.checkFFmpegAvailability();
      setFFmpegAvailable(available);
    } catch (error) {
      console.error("Error checking FFmpeg:", error);
      setFFmpegAvailable(false);
    }
  };

  useEffect(() => {
    checkFFmpegAvailability();
  }, []);

  return {
    ffmpegAvailable,
    checkFFmpegAvailability,
  };
};
