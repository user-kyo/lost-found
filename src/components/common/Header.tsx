import React, { useState } from "react";
import { useApp } from "../../context/AppContext";
import { 
  Shield, 
  User, 
  Bell, 
  Layers, 
  HardDrive, 
  Search, 
  CheckCircle2, 
  Sparkles, 
  PlusCircle, 
  LogOut
} from "lucide-react";

export const Header: React.FC = () => {
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const { 
    user,
    logout,
    role, 
    setRole, 
    studentView, 
    setStudentView, 
    staffView, 
    setStaffView, 
    notifications, 
    setIsNotifDrawerOpen, 
    setIsRegisterModalOpen, 
    storageBoxes,
    screenMode 
  } = useApp();

  const unreadCount = notifications.filter(n => !n.read && (n.recipientRole === role || n.recipientRole === "all")).length;

  return (
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-stone-200/50 shadow-sm transition-all duration-300">
      <div className="w-full px-3 py-2">
        <div className="flex items-center justify-between h-14">
          {/* Logo */}
          <div className="flex items-center space-x-2">
            <button 
              onClick={() => {
                if (role === "student") setStudentView("home");
                else setStaffView("dashboard");
              }}
              className="flex items-center space-x-2 text-left group focus:outline-hidden"
            >
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shrink-0">
                <Shield className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center space-x-1.5">
                  <span className="font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-stone-900 to-stone-600 text-sm tracking-tight">
                    BalikHub
                  </span>
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[9px] font-bold bg-amber-50 text-amber-600 border border-amber-200/50 uppercase tracking-widest shadow-sm">
                    LGU
                  </span>
                </div>
              </div>
            </button>
          </div>

          {/* Right Header Actions */}
          <div className="flex items-center space-x-2">
            {/* Notification Bell */}
            <button
              onClick={() => setIsNotifDrawerOpen(true)}
              className="relative p-2 text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-lg transition-colors focus:outline-hidden"
              title="Notifications"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-0.5 right-0.5 w-4 h-4 bg-amber-600 text-white font-bold text-[10px] rounded-full flex items-center justify-center ring-2 ring-white">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Logout */}
            <button
              onClick={() => setShowLogoutConfirm(true)}
              className="p-2 text-stone-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-200 shrink-0"
              title="Sign Out"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Logout Confirmation Modal - Constrained to app container */}
      {showLogoutConfirm && (
        <div className="absolute top-0 left-0 w-full h-[100dvh] z-[100] flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-sm animate-in fade-in duration-200" style={{ transform: "translateY(0)" }}>
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-[320px] p-6 overflow-hidden animate-in zoom-in-95 duration-200 border border-stone-100">
            <div className="flex flex-col items-center text-center">
              <div className="w-14 h-14 bg-red-50 text-red-600 rounded-full flex items-center justify-center mb-5 ring-8 ring-red-50/50">
                <LogOut className="w-7 h-7 ml-0.5" />
              </div>
              <h3 className="text-xl font-extrabold text-stone-900 mb-2">Sign Out?</h3>
              <p className="text-sm text-stone-500 mb-6 leading-relaxed">
                Are you sure you want to sign out of your account?
              </p>
              <div className="flex flex-col w-full space-y-2">
                <button
                  onClick={() => {
                    setShowLogoutConfirm(false);
                    logout();
                  }}
                  className="w-full py-3 px-4 rounded-xl bg-red-600 font-bold text-white hover:bg-red-700 transition-colors shadow-sm active:scale-[0.98]"
                >
                  Yes, Sign Out
                </button>
                <button
                  onClick={() => setShowLogoutConfirm(false)}
                  className="w-full py-3 px-4 rounded-xl font-bold text-stone-600 hover:bg-stone-100 transition-colors active:scale-[0.98]"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
