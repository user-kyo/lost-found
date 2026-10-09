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
  MapPin,
  Bell
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
    <div className="sticky bottom-0 z-40 bg-white/95 backdrop-blur-md border-t border-stone-200/90 shadow-lg px-2 py-1.5 transition-all">
      {role === "student" ? (
        /* Citizen Mobile Navigation */
        <nav aria-label="Citizen Mobile Navigation" className="grid grid-cols-5 items-center max-w-lg mx-auto">
          {/* 1. Home */}
          <button
            onClick={() => setStudentView("home")}
            className={`flex flex-col items-center justify-center py-1 rounded-xl transition-colors ${
              studentView === "home"
                ? "text-emerald-800 font-bold"
                : "text-stone-500 hover:text-stone-800"
            }`}
          >
            <Home className={`w-5 h-5 ${studentView === "home" ? "stroke-[2.5]" : "stroke-2"}`} />
            <span className="text-[10px] mt-0.5 tracking-tight">Home</span>
          </button>

          {/* 2. Find / Search */}
          <button
            onClick={() => setStudentView("search")}
            className={`flex flex-col items-center justify-center py-1 rounded-xl transition-colors ${
              studentView === "search" || studentView === "match_details"
                ? "text-emerald-800 font-bold"
                : "text-stone-500 hover:text-stone-800"
            }`}
          >
            <Search className={`w-5 h-5 ${studentView === "search" || studentView === "match_details" ? "stroke-[2.5]" : "stroke-2"}`} />
            <span className="text-[10px] mt-0.5 tracking-tight">Catalog</span>
          </button>

          {/* 3. Center Action: Report Item (Prominent Elevated Button) */}
          <button
            onClick={() => setStudentView("report")}
            className="flex flex-col items-center justify-center -mt-4 group"
          >
            <div className={`w-11 h-11 rounded-full flex items-center justify-center shadow-md transition-transform group-active:scale-95 ${
              studentView === "report"
                ? "bg-emerald-900 text-amber-300 ring-2 ring-emerald-600"
                : "bg-emerald-800 text-white hover:bg-emerald-900"
            }`}>
              <PlusCircle className="w-6 h-6" />
            </div>
            <span className={`text-[10px] mt-0.5 font-bold ${
              studentView === "report" ? "text-emerald-800" : "text-stone-600"
            }`}>
              Report
            </span>
          </button>

          {/* 4. My Activity (Reports & Claims) */}
          <button
            onClick={() => setStudentView("reports")}
            className={`flex flex-col items-center justify-center py-1 rounded-xl transition-colors relative ${
              studentView === "reports" || studentView === "claims" || studentView === "claim_tracking"
                ? "text-emerald-800 font-bold"
                : "text-stone-500 hover:text-stone-800"
            }`}
          >
            <FileText className={`w-5 h-5 ${studentView === "reports" || studentView === "claims" || studentView === "claim_tracking" ? "stroke-[2.5]" : "stroke-2"}`} />
            <span className="text-[10px] mt-0.5 tracking-tight">Activity</span>
            {activeReportsCount > 0 && (
              <span className="absolute top-0 right-3 w-4 h-4 bg-emerald-700 text-white font-bold text-[9px] rounded-full flex items-center justify-center ring-2 ring-white">
                {activeReportsCount}
              </span>
            )}
          </button>

          {/* 5. Alerts */}
          <button
            onClick={() => setIsNotifDrawerOpen(true)}
            className="flex flex-col items-center justify-center py-1 rounded-xl text-stone-500 hover:text-stone-800 relative"
          >
            <Bell className="w-5 h-5 stroke-2" />
            <span className="text-[10px] mt-0.5 tracking-tight">Alerts</span>
            {unreadCount > 0 && (
              <span className="absolute top-0 right-3 w-4 h-4 bg-amber-600 text-white font-bold text-[9px] rounded-full flex items-center justify-center ring-2 ring-white animate-pulse">
                {unreadCount}
              </span>
            )}
          </button>
        </nav>
      ) : (
        /* LGU Officer Mobile Navigation */
        <nav aria-label="LGU Officer Mobile Navigation" className="grid grid-cols-5 items-center max-w-lg mx-auto">
          {/* 1. Dashboard */}
          <button
            onClick={() => setStaffView("dashboard")}
            className={`flex flex-col items-center justify-center py-1 rounded-xl transition-colors ${
              staffView === "dashboard"
                ? "text-emerald-800 font-bold"
                : "text-stone-500 hover:text-stone-800"
            }`}
          >
            <LayoutDashboard className={`w-5 h-5 ${staffView === "dashboard" ? "stroke-[2.5]" : "stroke-2"}`} />
            <span className="text-[10px] mt-0.5 tracking-tight">Dashboard</span>
          </button>

          {/* 2. Inventory */}
          <button
            onClick={() => setStaffView("found_items")}
            className={`flex flex-col items-center justify-center py-1 rounded-xl transition-colors ${
              staffView === "found_items"
                ? "text-emerald-800 font-bold"
                : "text-stone-500 hover:text-stone-800"
            }`}
          >
            <Package className={`w-5 h-5 ${staffView === "found_items" ? "stroke-[2.5]" : "stroke-2"}`} />
            <span className="text-[10px] mt-0.5 tracking-tight">Inventory</span>
          </button>

          {/* 3. Center Action: Intake */}
          <button
            onClick={() => setIsRegisterModalOpen(true)}
            className="flex flex-col items-center justify-center -mt-4 group"
          >
            <div className="w-11 h-11 rounded-full bg-amber-600 text-white flex items-center justify-center shadow-md hover:bg-amber-700 transition-transform group-active:scale-95 ring-2 ring-amber-400">
              <PlusCircle className="w-6 h-6" />
            </div>
            <span className="text-[10px] mt-0.5 font-bold text-amber-900">
              Intake
            </span>
          </button>

          {/* 4. Claims Verification */}
          <button
            onClick={() => setStaffView("claim_requests")}
            className={`flex flex-col items-center justify-center py-1 rounded-xl transition-colors relative ${
              staffView === "claim_requests"
                ? "text-emerald-800 font-bold"
                : "text-stone-500 hover:text-stone-800"
            }`}
          >
            <ShieldCheck className={`w-5 h-5 ${staffView === "claim_requests" ? "stroke-[2.5]" : "stroke-2"}`} />
            <span className="text-[10px] mt-0.5 tracking-tight">Claims</span>
            {pendingClaimsCount > 0 && (
              <span className="absolute top-0 right-3 w-4 h-4 bg-amber-600 text-white font-bold text-[9px] rounded-full flex items-center justify-center ring-2 ring-white">
                {pendingClaimsCount}
              </span>
            )}
          </button>

          {/* 5. LGU Handover */}
          <button
            onClick={() => setStaffView("claim_requests")}
            className={`flex flex-col items-center justify-center py-1 rounded-xl transition-colors ${
              staffView === "claim_requests"
                ? "text-emerald-800 font-bold"
                : "text-stone-500 hover:text-stone-800"
            }`}
          >
            <MapPin className={`w-5 h-5 ${staffView === "claim_requests" ? "stroke-[2.5]" : "stroke-2"}`} />
            <span className="text-[10px] mt-0.5 tracking-tight">Handover</span>
          </button>
        </nav>
      )}
    </div>
  );
};
