import React, { useEffect, useState } from "react";
import dittoLogo from "/ditto.png";
import { useUpdater } from "../hooks/useUpdater";

interface AppHeaderProps {
  ffmpegAvailable: boolean | null;
  onOpenSettings: () => void;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  ffmpegAvailable,
}) => {
  const { status, progress, checkForUpdates, errorMessage, clearError } =
    useUpdater();
  const [isErrorVisible, setIsErrorVisible] = useState(true);

  const showUpdateIndicator = status === "checking" || status === "downloading";
  const showReadyIndicator = status === "ready";

  useEffect(() => {
    if (status === "error" && errorMessage) {
      setIsErrorVisible(true);
    }
  }, [status, errorMessage]);

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <img src={dittoLogo} alt="Ditto" className="h-12 w-12 mr-3" />
            <h1 className="text-xl font-semibold text-gray-900">FileDitto</h1>
            {ffmpegAvailable !== null && (
              <div
                className={`ml-3 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  ffmpegAvailable
                    ? "bg-green-100 text-green-800"
                    : "bg-red-100 text-red-800"
                } relative`}
              >
                {/* Glowing dot indicator */}
                <div className="relative mr-2">
                  {/* Main dot */}
                  <div
                    className={`w-2 h-2 rounded-full ${
                      ffmpegAvailable ? "bg-green-500" : "bg-red-500"
                    }`}
                  ></div>
                  {/* Glowing effects - only for online status */}
                  {ffmpegAvailable && (
                    <>
                      {/* Inner glow */}
                      <div className="absolute inset-0 w-2 h-2 rounded-full bg-green-400 animate-ping opacity-75"></div>
                      {/* Outer glow */}
                      <div className="absolute inset-0 w-2 h-2 rounded-full bg-green-300 animate-pulse opacity-50"></div>
                    </>
                  )}
                </div>
                FFmpeg
              </div>
            )}
          </div>

          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={() => {
                checkForUpdates();
              }}
              className="inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-md border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 transition-colors"
            >
              {showUpdateIndicator && (
                <span className="mr-2 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-3 w-3 rounded-full bg-blue-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500" />
                </span>
              )}
              {status === "checking" && "Checking for updates..."}
              {status === "downloading" &&
                (progress !== null
                  ? `Downloading update (${Math.round(progress * 100)}%)`
                  : "Downloading update...")}
              {showReadyIndicator && "Update ready - restart app"}
              {status === "upToDate" && "You’re up to date"}
              {status === "idle" && "Check for updates"}
              {status === "error" && "Update check failed"}
            </button>
          </div>
        </div>
        {showReadyIndicator && (
          <div className="mt-2 text-xs text-blue-700 bg-blue-50 border border-blue-100 rounded-md px-3 py-1.5">
            An update has been downloaded. Please restart FileDitto to apply it.
          </div>
        )}
        {status === "error" && errorMessage && isErrorVisible && (
          <div className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800 flex items-start justify-between space-x-3">
            <div className="flex items-start space-x-2">
              <span className="inline-flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600 text-xs font-semibold">
                !
              </span>
              <div>
                <p className="font-medium">Update check failed</p>
                <p className="mt-0.5 text-[11px] text-red-700">{errorMessage}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setIsErrorVisible(false);
                clearError();
              }}
              className="ml-2 inline-flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full text-red-500 hover:bg-red-100 hover:text-red-700 transition-colors"
              aria-label="Dismiss update error message"
            >
              <span className="text-sm leading-none">&times;</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
