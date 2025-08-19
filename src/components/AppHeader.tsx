import React from "react";
import { Settings } from "lucide-react";
import dittoLogo from "../../public/ditto.png";

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
            {ffmpegAvailable && (
              <span className="ml-3 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                FFmpeg Online
              </span>
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
