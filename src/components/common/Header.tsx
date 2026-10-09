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
                    onClick={() => setStudentView("search")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                      studentView === "search" || studentView === "match_details"
                        ? "bg-emerald-50 text-emerald-800 border border-emerald-200/70"
                        : "text-stone-600 hover:text-stone-900 hover:bg-stone-100/70"
                    }`}
                  >
                    Find My Item
                  </button>
                  <button
                    onClick={() => setStudentView("reports")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                      studentView === "reports"
                        ? "bg-emerald-50 text-emerald-800 border border-emerald-200/70"
                        : "text-stone-600 hover:text-stone-900 hover:bg-stone-100/70"
                    }`}
                  >
                    My Reports
                  </button>
                  <button
                    onClick={() => setStudentView("claims")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                      studentView === "claims" || studentView === "claim_tracking"
                        ? "bg-emerald-50 text-emerald-800 border border-emerald-200/70"
                        : "text-stone-600 hover:text-stone-900 hover:bg-stone-100/70"
                    }`}
                  >
                    My Claims
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
                    LGU Dashboard
                  </button>
                  <button
                    onClick={() => setStaffView("found_items")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                      staffView === "found_items"
                        ? "bg-emerald-50 text-emerald-800 border border-emerald-200/70"
                        : "text-stone-600 hover:text-stone-900 hover:bg-stone-100/70"
                    }`}
                  >
                    Found Inventory
                  </button>
                  <button
                    onClick={() => setStaffView("claim_requests")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                      staffView === "claim_requests"
                        ? "bg-emerald-50 text-emerald-800 border border-emerald-200/70"
                        : "text-stone-600 hover:text-stone-900 hover:bg-stone-100/70"
                    }`}
                  >
                    Claim Verification
                  </button>
                  <button
                    onClick={() => setStaffView("claim_requests")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                      staffView === "claim_requests"
                        ? "bg-emerald-50 text-emerald-800 border border-emerald-200/70"
                        : "text-stone-600 hover:text-stone-900 hover:bg-stone-100/70"
                    }`}
                  >
                    LGU Handover
                  </button>
                  <button
                    onClick={() => setStaffView("audit_logs")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                      staffView === "audit_logs"
                        ? "bg-emerald-50 text-emerald-800 border border-emerald-200/70"
                        : "text-stone-600 hover:text-stone-900 hover:bg-stone-100/70"
                    }`}
                  >
                    Audit Logs
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

            {/* Role Switcher Pill */}
            <div className="flex items-center bg-stone-100 p-0.5 sm:p-1 rounded-xl border border-stone-200">
              <button
                onClick={() => setRole("student")}
                className={`flex items-center space-x-1 px-2 sm:px-2.5 py-1 rounded-lg text-[11px] sm:text-xs font-semibold transition-all ${
                  role === "student"
                    ? "bg-white text-emerald-900 shadow-2xs"
                    : "text-stone-600 hover:text-stone-900"
                }`}
                title="Switch to Citizen Portal"
              >
                <User className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                <span>Citizen</span>
              </button>
              <button
                onClick={() => setRole("staff")}
                className={`flex items-center space-x-1 px-2 sm:px-2.5 py-1 rounded-lg text-[11px] sm:text-xs font-semibold transition-all ${
                  role === "staff"
                    ? "bg-emerald-800 text-white shadow-2xs"
                    : "text-stone-600 hover:text-stone-900"
                }`}
                title="Switch to LGU Officer Portal"
              >
                <Shield className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                <span>LGU</span>
              </button>
            </div>
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
                <button
                  onClick={() => setStudentView("search")}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap ${
                    studentView === "search" ? "bg-emerald-100 text-emerald-900" : "text-stone-600"
                  }`}
                >
                  Find My Item
                </button>
                <button
                  onClick={() => setStudentView("reports")}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap ${
                    studentView === "reports" ? "bg-emerald-100 text-emerald-900" : "text-stone-600"
                  }`}
                >
                  My Reports
                </button>
                <button
                  onClick={() => setStudentView("claims")}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap ${
                    studentView === "claims" ? "bg-emerald-100 text-emerald-900" : "text-stone-600"
                  }`}
                >
                  My Claims
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
                  LGU Dashboard
                </button>
                <button
                  onClick={() => setStaffView("found_items")}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap ${
                    staffView === "found_items" ? "bg-emerald-100 text-emerald-900" : "text-stone-600"
                  }`}
                >
                  Found Items
                </button>
                <button
                  onClick={() => setStaffView("claim_requests")}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap ${
                    staffView === "claim_requests" ? "bg-emerald-100 text-emerald-900" : "text-stone-600"
                  }`}
                >
                  Claims
                </button>
                <button
                  onClick={() => setStaffView("claim_requests")}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap ${
                    staffView === "claim_requests" ? "bg-emerald-100 text-emerald-900" : "text-stone-600"
                  }`}
                >
                  LGU Handover
                </button>
                <button
                  onClick={() => setStaffView("audit_logs")}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap ${
                    staffView === "audit_logs" ? "bg-emerald-100 text-emerald-900" : "text-stone-600"
                  }`}
                >
                  Audit Logs
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </header>
  );
};
