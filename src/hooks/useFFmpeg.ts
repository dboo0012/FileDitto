import { useState, useEffect } from 'react';

export const useFFmpeg = () => {
  const [ffmpegAvailable, setFFmpegAvailable] = useState<boolean | null>(null);

  const checkFFmpegAvailability = async () => {
    try {
      // const available = await TauriAPI.checkFFmpegAvailability();
      setFFmpegAvailable(true);
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
