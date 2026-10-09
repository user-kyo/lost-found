import React from "react";
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
  ArrowRightLeft
} from "lucide-react";

export const Header: React.FC = () => {
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
  const isOnline = storageBoxes.every(b => b.isOnline);
  const isMobileLayout = screenMode === "mobile";

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-stone-200/80 shadow-2xs">
      <div className={`${isMobileLayout ? "w-full px-3 py-2" : "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"}`}>
        <div className="flex items-center justify-between h-14 sm:h-16">
          {/* Logo & School/Civic Branding */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            <button 
              onClick={() => {
                if (role === "student") setStudentView("home");
                else setStaffView("dashboard");
              }}
              className="flex items-center space-x-2 sm:space-x-3 text-left group focus:outline-hidden"
            >
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-emerald-800 flex items-center justify-center text-white shadow-xs group-hover:bg-emerald-900 transition-colors">
                <Shield className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div>
                <div className="flex items-center space-x-1.5">
                  <span className="font-extrabold text-stone-900 text-sm sm:text-base tracking-tight group-hover:text-emerald-800 transition-colors">
                    BalikHub
                  </span>
                  <span className="inline-flex items-center px-1.5 py-0.2 rounded-sm text-[9px] sm:text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                    LGU
                  </span>
                </div>
                {!isMobileLayout && (
                  <p className="text-xs text-stone-500 hidden sm:block">
                    Citizen & LGU Property Recovery Network
                  </p>
                )}
              </div>
            </button>
          </div>

          {/* Center Navigation - For Desktop Mode Only */}
          {!isMobileLayout && (
            <nav className="hidden md:flex items-center space-x-1">
              {role === "student" ? (
                <>
                  <button
                    onClick={() => setStudentView("home")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                      studentView === "home"
                        ? "bg-emerald-50 text-emerald-800 border border-emerald-200/70"
                        : "text-stone-600 hover:text-stone-900 hover:bg-stone-100/70"
                    }`}
                  >
                    Citizen Home
                  </button>
                  <button
                    onClick={() => setStudentView("report")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center space-x-1.5 ${
                      studentView === "report"
                        ? "bg-emerald-50 text-emerald-800 border border-emerald-200/70"
                        : "text-stone-600 hover:text-stone-900 hover:bg-stone-100/70"
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                    <span>Report Lost Item</span>
                  </button>
                  <button
                    onClick={() => setStudentView("report_found")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center space-x-1.5 ${
                      studentView === "report_found"
                        ? "bg-emerald-50 text-emerald-800 border border-emerald-200/70"
                        : "text-stone-600 hover:text-stone-900 hover:bg-stone-100/70"
                    }`}
                  >
                    <PlusCircle className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Report Found Item</span>
                  </button>
                  {/* Find My Item removed to prevent catalog browsing scams */}
                  <button
                    onClick={() => setStudentView("reports")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                      studentView === "reports" || studentView === "claims" || studentView === "claim_tracking"
                        ? "bg-emerald-50 text-emerald-800 border border-emerald-200/70"
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
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                      staffView === "dashboard"
                        ? "bg-emerald-50 text-emerald-800 border border-emerald-200/70"
                        : "text-stone-600 hover:text-stone-900 hover:bg-stone-100/70"
                    }`}
                  >
                    LGU Review Queue
                  </button>
                  <button
                    onClick={() => setStaffView("claims")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                      staffView === "claims" || staffView === "claim_requests"
                        ? "bg-emerald-50 text-emerald-800 border border-emerald-200/70"
                        : "text-stone-600 hover:text-stone-900 hover:bg-stone-100/70"
                    }`}
                  >
                    LGU Claims & Handover
                  </button>
                </>
              )}
            </nav>
          )}

          {/* Right Header Actions: Role Switcher & Notification Bell */}
          <div className="flex items-center space-x-1.5 sm:space-x-3">
            {/* Quick Action Button for Staff on Desktop */}
            {!isMobileLayout && role === "staff" && (
              <div className="hidden sm:flex items-center space-x-1.5">
                <button
                  onClick={() => setIsRegisterModalOpen(true)}
                  className="px-2.5 py-1.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-lg text-xs font-semibold flex items-center space-x-1 shadow-2xs transition-colors"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>Register Item</span>
                </button>
              </div>
            )}

            {/* Notification Bell */}
            <button
              onClick={() => setIsNotifDrawerOpen(true)}
              className="relative p-1.5 sm:p-2 text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-lg transition-colors focus:outline-hidden"
              title="Notifications"
            >
              <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-0.5 right-0.5 w-3.5 h-3.5 sm:w-4 sm:h-4 bg-amber-600 text-white font-bold text-[9px] sm:text-[10px] rounded-full flex items-center justify-center ring-2 ring-white">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Logout Button */}
            <button
              onClick={() => logout()}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg text-[11px] sm:text-xs font-semibold transition-all border border-stone-200"
              title="Sign Out"
            >
              <User className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sign Out ({user?.fullName})</span>
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
                    studentView === "home" ? "bg-emerald-100 text-emerald-900" : "text-stone-600"
                  }`}
                >
                  Citizen Home
                </button>
                <button
                  onClick={() => setStudentView("report")}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap ${
                    studentView === "report" ? "bg-emerald-100 text-emerald-900" : "text-stone-600"
                  }`}
                >
                  Report Lost Item
                </button>
                {/* Find My Item removed */}
                <button
                  onClick={() => setStudentView("reports")}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap ${
                    studentView === "reports" || studentView === "claims" || studentView === "claim_tracking" ? "bg-emerald-100 text-emerald-900" : "text-stone-600"
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
                    staffView === "dashboard" ? "bg-emerald-100 text-emerald-900" : "text-stone-600"
                  }`}
                >
                  LGU Review Queue
                </button>
                <button
                  onClick={() => setStaffView("claims")}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap ${
                    staffView === "claims" || staffView === "claim_requests" ? "bg-emerald-100 text-emerald-900" : "text-stone-600"
                  }`}
                >
                  LGU Claims
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </header>
  );
};
