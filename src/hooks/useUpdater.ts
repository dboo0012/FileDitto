import { useEffect, useState, useCallback } from "react";
import { check } from "@tauri-apps/plugin-updater";

export type UpdaterStatus =
  | "idle"
  | "checking"
  | "downloading"
  | "upToDate"
  | "ready"
  | "error";

interface UseUpdaterState {
  status: UpdaterStatus;
  progress: number | null;
  errorMessage: string | null;
  checkForUpdates: () => Promise<void>;
  clearError: () => void;
}

export const useUpdater = (): UseUpdaterState => {
  const [status, setStatus] = useState<UpdaterStatus>("idle");
  const [progress, setProgress] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const runUpdateCheck = useCallback(async () => {
    try {
      setStatus("checking");
      setErrorMessage(null);

      const update = await check();

      if (!update) {
        setStatus("upToDate");
        setProgress(null);
        return;
      }

      setStatus("downloading");

      await update.downloadAndInstall((event) => {
        let contentLength: number | undefined = undefined;
        if (event.event === "Started") {
          contentLength = event.data.contentLength;
        }
        if (event.event === "Progress") {
          setProgress(event.data.chunkLength / (contentLength ?? 0));
        }
      });

      setStatus("ready");
    } catch (error) {
      console.error("Updater error", error);
      setStatus("error");
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Failed to check for updates. Try again later."
      );
    }
  }, []);

  useEffect(() => {
    // Background check on app start
    runUpdateCheck();
  }, [runUpdateCheck]);

  return {
    status,
    progress,
    errorMessage,
    checkForUpdates: runUpdateCheck,
    clearError: () => {
      setErrorMessage(null);
      setProgress(null);
      setStatus("idle");
    },
  };
};
