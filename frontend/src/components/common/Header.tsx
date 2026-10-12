import React, { useState } from "react";
import { createPortal } from "react-dom";
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
  const isMobileLayout = screenMode === "mobile";

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-xl border-b border-stone-200/70 shadow-xs transition-all duration-300">
      <div className={isMobileLayout ? "w-full px-3 py-2" : "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"}>
        <div className="flex items-center justify-between h-14 sm:h-16">
          {/* Logo & Civic Branding */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            <button 
              onClick={() => {
                if (role === "student") setStudentView("home");
                else setStaffView("dashboard");
              }}
              className="flex items-center space-x-2 sm:space-x-3 text-left group focus:outline-hidden"
            >
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md group-hover:scale-105 transition-transform shrink-0">
                <Shield className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div>
                <div className="flex items-center space-x-1.5">
                  <span className="font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-stone-900 to-stone-700 text-sm sm:text-base tracking-tight">
                    BalikHub
                  </span>
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[9px] sm:text-[10px] font-bold bg-blue-50 text-blue-800 border border-blue-200/60 uppercase tracking-widest shadow-2xs">
                    Guidance
                  </span>
                </div>
                {!isMobileLayout && (
                  <p className="text-[11px] text-stone-500 font-medium hidden sm:block">
                    School Property Custody &amp; Recovery Network
                  </p>
                )}
              </div>
            </button>
          </div>

          {/* Desktop Navigation Links */}
          {!isMobileLayout && (
            <nav className="hidden md:flex items-center space-x-1">
              {role === "student" ? (
                <>
                  <button
                    onClick={() => setStudentView("home")}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                      studentView === "home"
                        ? "bg-blue-50 text-blue-700 font-bold shadow-2xs"
                        : "text-stone-600 hover:text-stone-900 hover:bg-stone-100/70"
                    }`}
                  >
                    Student Home
                  </button>
                  <button
                    onClick={() => setStudentView("report")}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center space-x-1.5 ${
                      studentView === "report" || studentView === "report_lost"
                        ? "bg-blue-50 text-blue-700 font-bold shadow-2xs"
                        : "text-stone-600 hover:text-stone-900 hover:bg-stone-100/70"
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                    <span>Report Lost Item</span>
                  </button>
                  <button
                    onClick={() => setStudentView("report_found")}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center space-x-1.5 ${
                      studentView === "report_found"
                        ? "bg-blue-50 text-blue-700 font-bold shadow-2xs"
                        : "text-stone-600 hover:text-stone-900 hover:bg-stone-100/70"
                    }`}
                  >
                    <PlusCircle className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Surrender Found Item</span>
                  </button>
                  <button
                    onClick={() => setStudentView("reports")}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                      studentView === "reports" || studentView === "claims" || studentView === "claim_tracking"
                        ? "bg-blue-50 text-blue-700 font-bold shadow-2xs"
                        : "text-stone-600 hover:text-stone-900 hover:bg-stone-100/70"
                    }`}
                  >
                    My Activity
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => setStaffView("dashboard")}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                      staffView === "dashboard"
                        ? "bg-blue-50 text-blue-700 font-bold shadow-2xs"
                        : "text-stone-600 hover:text-stone-900 hover:bg-stone-100/70"
                    }`}
                  >
                    Review Queue
                  </button>
                  <button
                    onClick={() => setStaffView("found_items")}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                      staffView === "found_items"
                        ? "bg-blue-50 text-blue-700 font-bold shadow-2xs"
                        : "text-stone-600 hover:text-stone-900 hover:bg-stone-100/70"
                    }`}
                  >
                    Active Inventory
                  </button>
                  <button
                    onClick={() => setStaffView("claims")}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                      staffView === "claims" || staffView === "claim_requests"
                        ? "bg-blue-50 text-blue-700 font-bold shadow-2xs"
                        : "text-stone-600 hover:text-stone-900 hover:bg-stone-100/70"
                    }`}
                  >
                    Claims & Handover
                  </button>
                </>
              )}
            </nav>
          )}

          {/* Right Header Actions */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Staff Quick Action Button on Desktop */}
            {!isMobileLayout && role === "staff" && (
              <button
                onClick={() => setIsRegisterModalOpen(true)}
                className="hidden sm:inline-flex items-center space-x-1.5 px-3 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all active:scale-95"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Register Item</span>
              </button>
            )}

            {/* Notification Bell */}
            <button
              onClick={() => setIsNotifDrawerOpen(true)}
              className="relative p-2 text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-xl transition-colors focus:outline-hidden"
              title="Notifications"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-amber-600 text-white font-bold text-[10px] rounded-full flex items-center justify-center ring-2 ring-white">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* User chip on Desktop */}
            {!isMobileLayout && user && (
              <div className="hidden sm:flex items-center space-x-2 pl-2 border-l border-stone-200">
                <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center">
                  {user.fullName ? user.fullName.charAt(0).toUpperCase() : "U"}
                </div>
                <div className="text-left">
                  <p className="text-xs font-bold text-stone-800 leading-tight max-w-[120px] truncate">{user.fullName}</p>
                  <p className="text-[10px] text-stone-400 capitalize font-medium">
                    {user.role === 'guidance_encoder' ? 'Guidance Encoder' : user.role === 'system_admin' ? 'System Admin' : user.role === 'student' ? 'Student' : (user.role || role)}
                  </p>
                </div>
              </div>
            )}

            {/* Logout */}
            <button
              onClick={() => setShowLogoutConfirm(true)}
              className="p-2 text-stone-600 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors border border-transparent hover:border-red-200 shrink-0"
              title="Sign Out"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Mobile Navigation Sub-Header (Only in Desktop Mode when window is narrow) */}
        {!isMobileLayout && (
          <div className="flex md:hidden overflow-x-auto py-2 border-t border-stone-100 space-x-1 no-scrollbar">
            {role === "student" ? (
              <>
                <button
                  onClick={() => setStudentView("home")}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap ${
                    studentView === "home" ? "bg-blue-50 text-blue-700 font-bold" : "text-stone-600"
                  }`}
                >
                  Student Home
                </button>
                <button
                  onClick={() => setStudentView("report")}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap ${
                    studentView === "report" || studentView === "report_lost" ? "bg-blue-50 text-blue-700 font-bold" : "text-stone-600"
                  }`}
                >
                  Report Lost
                </button>
                <button
                  onClick={() => setStudentView("report_found")}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap ${
                    studentView === "report_found" ? "bg-blue-50 text-blue-700 font-bold" : "text-stone-600"
                  }`}
                >
                  Surrender Found
                </button>
                <button
                  onClick={() => setStudentView("reports")}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap ${
                    studentView === "reports" || studentView === "claims" || studentView === "claim_tracking" ? "bg-blue-50 text-blue-700 font-bold" : "text-stone-600"
                  }`}
                >
                  My Activity
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setStaffView("dashboard")}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap ${
                    staffView === "dashboard" ? "bg-blue-50 text-blue-700 font-bold" : "text-stone-600"
                  }`}
                >
                  Review Queue
                </button>
                <button
                  onClick={() => setStaffView("found_items")}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap ${
                    staffView === "found_items" ? "bg-blue-50 text-blue-700 font-bold" : "text-stone-600"
                  }`}
                >
                  Inventory
                </button>
                <button
                  onClick={() => setStaffView("claims")}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap ${
                    staffView === "claims" || staffView === "claim_requests" ? "bg-blue-50 text-blue-700 font-bold" : "text-stone-600"
                  }`}
                >
                  Claims
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {/* Logout Confirmation Modal - Rendered via Portal to ensure viewport centering */}
      {showLogoutConfirm && typeof document !== "undefined" && createPortal(
        <div 
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setShowLogoutConfirm(false)}
        >
          <div 
            className="bg-white rounded-3xl shadow-2xl w-full max-w-[360px] p-6 sm:p-7 overflow-hidden animate-in zoom-in-95 duration-200 border border-stone-100 relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mb-5 ring-8 ring-red-50/60 shadow-inner">
                <LogOut className="w-8 h-8 ml-0.5" />
              </div>
              <h3 className="text-xl font-extrabold text-stone-900 mb-2">Sign Out?</h3>
              <p className="text-sm text-stone-500 mb-6 leading-relaxed">
                Are you sure you want to sign out of your account? You will need to log back in to submit claims or manage items.
              </p>
              <div className="flex flex-col w-full space-y-2.5">
                <button
                  onClick={() => {
                    setShowLogoutConfirm(false);
                    logout();
                  }}
                  className="w-full py-3 px-4 rounded-xl bg-red-600 hover:bg-red-700 font-bold text-white transition-all shadow-md hover:shadow-lg active:scale-[0.98] cursor-pointer"
                >
                  Yes, Sign Out
                </button>
                <button
                  onClick={() => setShowLogoutConfirm(false)}
                  className="w-full py-3 px-4 rounded-xl font-bold text-stone-600 hover:text-stone-900 hover:bg-stone-100 transition-colors active:scale-[0.98] cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </header>
  );
};

