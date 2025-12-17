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
}

const isTauriEnvironment = (): boolean => {
  return typeof window !== "undefined" && "__TAURI__" in window;
};

export const useUpdater = (): UseUpdaterState => {
  const [status, setStatus] = useState<UpdaterStatus>("idle");
  const [progress, setProgress] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const runUpdateCheck = useCallback(async () => {
    if (!isTauriEnvironment()) {
      return;
    }

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
        if (event.event === "Progress") {
          setProgress(event.downloadedBytes / event.contentLength);
        }
      });

      setStatus("ready");
    } catch (error) {
      console.error("Updater error", error);
      setStatus("error");
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to check for updates"
      );
    }
  }, []);

  useEffect(() => {
    // Background check on app start
    void runUpdateCheck();
  }, [runUpdateCheck]);

  return {
    status,
    progress,
    errorMessage,
    checkForUpdates: runUpdateCheck,
  };
};
