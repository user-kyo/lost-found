import React from "react";
import { useApp } from "../../context/AppContext";
import { 
  Home, 
  PlusCircle, 
  Search, 
  FileText, 
  CheckCircle2, 
  LayoutDashboard, 
  Package, 
  ShieldCheck, 
  Bell,
  Settings
} from "lucide-react";

export const MobileNavBar: React.FC = () => {
  const { 
    role, 
    studentView, 
    setStudentView, 
    staffView, 
    setStaffView,
    claims,
    lostReports,
    notifications,
    setIsNotifDrawerOpen,
    setIsRegisterModalOpen
  } = useApp();

  const unreadCount = notifications.filter(n => !n.read && (n.recipientRole === role || n.recipientRole === "all")).length;
  const pendingClaimsCount = claims.filter(c => c.status === "pending_review").length;
  const activeReportsCount = lostReports.filter(r => r.status === "pending_match" || r.status === "matched").length;

  return (
    <div className="sticky bottom-0 z-40 bg-white/80 backdrop-blur-xl border-t border-stone-200/50 shadow-[0_-4px_20px_-10px_rgba(0,0,0,0.1)] px-2 py-2 sm:py-3 transition-all duration-300">
      {role === "student" ? (
        /* Citizen Mobile Navigation */
        <nav aria-label="Citizen Mobile Navigation" className="grid grid-cols-4 items-center max-w-lg mx-auto">
          {/* 1. Home */}
          <button
            onClick={() => setStudentView("home")}
            className={`flex flex-col items-center justify-center py-2 transition-all duration-300 ${
              studentView === "home"
                ? "text-blue-600"
                : "text-stone-400 hover:text-stone-600"
            }`}
          >
            <div className={`relative p-2 rounded-xl transition-all duration-300 ${studentView === "home" ? "bg-blue-50" : "hover:bg-stone-50"}`}>
              <Home className={`w-6 h-6 ${studentView === "home" ? "stroke-[2.5]" : "stroke-2"}`} />
            </div>
          </button>

          {/* 2. Find / Search removed */}

          {/* 3. Action: Report Item */}
          <button
            onClick={() => setStudentView("report")}
            className={`flex flex-col items-center justify-center py-2 transition-all duration-300 ${
              studentView === "report"
                ? "text-blue-600"
                : "text-stone-400 hover:text-stone-600"
            }`}
          >
            <div className={`relative p-2 rounded-xl transition-all duration-300 ${studentView === "report" ? "bg-blue-50" : "hover:bg-stone-50"}`}>
              <PlusCircle className={`w-6 h-6 ${studentView === "report" ? "stroke-[2.5]" : "stroke-2"}`} />
            </div>
          </button>

          {/* 4. My Activity (Reports & Claims) */}
          <button
            onClick={() => setStudentView("reports")}
            className={`flex flex-col items-center justify-center py-2 transition-all duration-300 relative ${
              studentView === "reports" || studentView === "claims" || studentView === "claim_tracking"
                ? "text-blue-600"
                : "text-stone-400 hover:text-stone-600"
            }`}
          >
            <div className={`relative p-2 rounded-xl transition-all duration-300 ${studentView === "reports" || studentView === "claims" || studentView === "claim_tracking" ? "bg-blue-50" : "hover:bg-stone-50"}`}>
              <FileText className={`w-6 h-6 ${studentView === "reports" || studentView === "claims" || studentView === "claim_tracking" ? "stroke-[2.5]" : "stroke-2"}`} />
              {activeReportsCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-blue-600 text-white font-bold text-[10px] rounded-full flex items-center justify-center ring-2 ring-white shadow-sm">
                  {activeReportsCount}
                </span>
              )}
            </div>
          </button>

          {/* 5. Settings */}
          <button
            onClick={() => setStudentView("settings")}
            className={`flex flex-col items-center justify-center py-2 transition-all duration-300 ${
              studentView === "settings"
                ? "text-blue-600"
                : "text-stone-400 hover:text-stone-600"
            }`}
          >
            <div className={`relative p-2 rounded-xl transition-all duration-300 ${studentView === "settings" ? "bg-blue-50" : "hover:bg-stone-50"}`}>
              <Settings className={`w-6 h-6 ${studentView === "settings" ? "stroke-[2.5]" : "stroke-2"}`} />
            </div>
          </button>
        </nav>
      ) : (
        /* LGU Officer Mobile Navigation */
        <nav aria-label="LGU Officer Mobile Navigation" className="grid grid-cols-5 items-center max-w-lg mx-auto">
          {/* 1. Dashboard */}
          <button
            onClick={() => setStaffView("dashboard")}
            className={`flex flex-col items-center justify-center py-2 transition-all duration-300 ${
              staffView === "dashboard"
                ? "text-blue-600"
                : "text-stone-400 hover:text-stone-600"
            }`}
          >
            <div className={`relative p-2 rounded-xl transition-all duration-300 ${staffView === "dashboard" ? "bg-blue-50" : "hover:bg-stone-50"}`}>
              <LayoutDashboard className={`w-6 h-6 ${staffView === "dashboard" ? "stroke-[2.5]" : "stroke-2"}`} />
            </div>
          </button>

          {/* 2. Inventory */}
          <button
            onClick={() => setStaffView("found_items")}
            className={`flex flex-col items-center justify-center py-2 transition-all duration-300 ${
              staffView === "found_items"
                ? "text-blue-600"
                : "text-stone-400 hover:text-stone-600"
            }`}
          >
            <div className={`relative p-2 rounded-xl transition-all duration-300 ${staffView === "found_items" ? "bg-blue-50" : "hover:bg-stone-50"}`}>
              <Package className={`w-6 h-6 ${staffView === "found_items" ? "stroke-[2.5]" : "stroke-2"}`} />
            </div>
          </button>

          {/* 3. Intake */}
          <button
            onClick={() => setIsRegisterModalOpen(true)}
            className="flex flex-col items-center justify-center py-2 transition-all duration-300 text-stone-400 hover:text-stone-600"
          >
            <div className="relative p-2 rounded-xl transition-all duration-300 hover:bg-stone-50">
              <PlusCircle className="w-6 h-6 stroke-2" />
            </div>
          </button>

          {/* 4. Claims Verification */}
          <button
            onClick={() => setStaffView("claim_requests")}
            className={`flex flex-col items-center justify-center py-2 transition-all duration-300 relative ${
              staffView === "claim_requests"
                ? "text-blue-600"
                : "text-stone-400 hover:text-stone-600"
            }`}
          >
            <div className={`relative p-2 rounded-xl transition-all duration-300 ${staffView === "claim_requests" ? "bg-blue-50" : "hover:bg-stone-50"}`}>
              <ShieldCheck className={`w-6 h-6 ${staffView === "claim_requests" ? "stroke-[2.5]" : "stroke-2"}`} />
              {pendingClaimsCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-amber-500 text-white font-bold text-[10px] rounded-full flex items-center justify-center ring-2 ring-white shadow-sm">
                  {pendingClaimsCount}
                </span>
              )}
            </div>
          </button>

          {/* 5. Settings */}
          <button
            onClick={() => setStaffView("settings")}
            className={`flex flex-col items-center justify-center py-2 transition-all duration-300 ${
              staffView === "settings"
                ? "text-blue-600"
                : "text-stone-400 hover:text-stone-600"
            }`}
          >
            <div className={`relative p-2 rounded-xl transition-all duration-300 ${staffView === "settings" ? "bg-blue-50" : "hover:bg-stone-50"}`}>
              <Settings className={`w-6 h-6 ${staffView === "settings" ? "stroke-[2.5]" : "stroke-2"}`} />
            </div>
          </button>
        </nav>
      )}
    </div>
  );
};
