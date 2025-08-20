import React from "react";
import { Settings } from "lucide-react";
import dittoLogo from "/ditto.png";

interface AppHeaderProps {
  ffmpegAvailable: boolean | null;
  onOpenSettings: () => void;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  ffmpegAvailable,
  onOpenSettings,
}) => {
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
          <button
            onClick={onOpenSettings}
            className="flex items-center px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
          >
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </button>
        </div>
      </div>
    </header>
  );
};
