import React from "react";
import { useApp, ScreenMode } from "../../context/AppContext";
import { Monitor, Smartphone, Sparkles, Shield, User } from "lucide-react";

export const DeviceFrameSwitcher: React.FC = () => {
  const { screenMode, setScreenMode, role } = useApp();

  return (
    <aside
      aria-label="Screen View Mode Switcher"
      className="bg-stone-900 text-stone-100 border-b border-stone-800 text-xs py-2 px-3 sm:px-6 select-none sticky top-0 z-50 shadow-md"
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        {/* Left: Current Active Portal Info */}
        <div className="flex items-center space-x-2 min-w-0">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0"></div>
          <div className="flex items-center space-x-1.5 truncate text-[11px] sm:text-xs">
            <span className="font-bold text-stone-200">BalikHub</span>
            <span className="text-stone-500">•</span>
            <span className="text-emerald-400 font-semibold flex items-center space-x-1">
              {role === "student" ? (
                <>
                  <User className="w-3 h-3 inline shrink-0" />
                  <span>Citizen Portal</span>
                </>
              ) : (
                <>
                  <Shield className="w-3 h-3 inline shrink-0" />
                  <span>LGU Officer Portal</span>
                </>
              )}
            </span>
          </div>
        </div>

        {/* Right: Screen View Mode Toggle (Desktop vs Mobile) */}
        <div className="flex items-center space-x-2 shrink-0">
          <span className="text-[11px] text-stone-400 font-medium hidden sm:inline">Layout View:</span>
          <div className="flex items-center bg-stone-800 p-0.5 rounded-lg border border-stone-700">
            <button
              onClick={() => setScreenMode("desktop")}
              className={`flex items-center space-x-1.5 px-3 py-1 rounded-md text-xs font-semibold transition-all ${
                screenMode === "desktop"
                  ? "bg-emerald-700 text-white shadow-xs"
                  : "text-stone-400 hover:text-stone-200 hover:bg-stone-700/50"
              }`}
              title="Switch to full-width Desktop layout"
            >
              <Monitor className="w-3.5 h-3.5" />
              <span>Desktop View</span>
            </button>

            <button
              onClick={() => setScreenMode("mobile")}
              className={`flex items-center space-x-1.5 px-3 py-1 rounded-md text-xs font-semibold transition-all ${
                screenMode === "mobile"
                  ? "bg-emerald-700 text-white shadow-xs"
                  : "text-stone-400 hover:text-stone-200 hover:bg-stone-700/50"
              }`}
              title="Switch to streamlined Mobile layout with bottom navigation"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Mobile View</span>
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
};
