import React from "react";
import dittoLogo from "/ditto.png";
import { useUpdater } from "../hooks/useUpdater";

interface AppHeaderProps {
  ffmpegAvailable: boolean | null;
  onOpenSettings: () => void;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  ffmpegAvailable,
}) => {
  const { status, progress, checkForUpdates, errorMessage } = useUpdater();

  const showUpdateIndicator = status === "checking" || status === "downloading";
  const showReadyIndicator = status === "ready";

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
                void checkForUpdates();
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
        {status === "error" && errorMessage && (
          <div className="mt-2 text-xs text-red-700 bg-red-50 border border-red-100 rounded-md px-3 py-1.5">
            {errorMessage}
          </div>
        )}
      </div>
    </header>
  );
};
