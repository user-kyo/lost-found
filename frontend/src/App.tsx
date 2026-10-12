import React from "react";
import { AppProvider, useApp } from "./context/AppContext";
import { Header } from "./components/common/Header";
import { Footer } from "./components/common/Footer";
import { NotificationDrawer } from "./components/common/NotificationDrawer";
import { MobileNavBar } from "./components/common/MobileNavBar";
import { DeviceFrameSwitcher } from "./components/common/DeviceFrameSwitcher";
import { SettingsPage } from "./components/common/SettingsPage";

// Student components
import { StudentHome } from "./components/student/StudentHome";
import { ReportLostItem } from "./components/student/ReportLostItem";
import { ReportFoundItem } from "./components/student/ReportFoundItem";
import { AIMatchResults } from "./components/student/AIMatchResults";
import { MatchDetails } from "./components/student/MatchDetails";
import { ClaimRequestForm } from "./components/student/ClaimRequestForm";
import { ClaimStatusTracker } from "./components/student/ClaimStatusTracker";
import { MyReportsAndClaims } from "./components/student/MyReportsAndClaims";
import { ReportsHub } from "./components/student/ReportsHub";

// Staff components
import { StaffDashboard } from "./components/staff/StaffDashboard";
import { StaffFoundInventory } from "./components/staff/StaffFoundInventory";
import { StaffClaimRequests } from "./components/staff/StaffClaimRequests";
import { StaffStorageBox } from "./components/staff/StaffStorageBox";
import { StaffAuditLogs } from "./components/staff/StaffAuditLogs";
import { StaffLostReports } from "./components/staff/StaffLostReports";
import { StaffAIMatches } from "./components/staff/StaffAIMatches";

// Admin components
import { AdminDashboard } from "./components/admin/AdminDashboard";
import { AdminClaims } from "./components/admin/AdminClaims";
import { AdminInventory } from "./components/admin/AdminInventory";

// Auth
import { AuthScreens } from "./components/auth/AuthScreens";

// Modals
import { RegisterFoundItemModal } from "./components/staff/RegisterFoundItemModal";
import { ClaimVerificationModal } from "./components/staff/ClaimVerificationModal";

const AppContent: React.FC = () => {
  const { user, role, studentView, staffView, screenMode } = useApp();

  if (!user) {
    return <AuthScreens />;
  }

  const renderStudentView = () => {
    switch (studentView) {
      case "home":
        return <StudentHome />;
      case "report":
        return <ReportsHub />;
      case "report_lost":
        return <ReportLostItem />;
      case "report_found":
        return <ReportFoundItem />;
      case "search":
        return <AIMatchResults />;
      case "match_details":
        return <MatchDetails />;
      case "claim_request":
        return <ClaimRequestForm />;
      case "claim_tracking":
        return <ClaimStatusTracker />;
      case "reports":
        return <MyReportsAndClaims initialTab="reports" />;
      case "claims":
        return <MyReportsAndClaims initialTab="claims" />;
      case "settings":
        return <SettingsPage />;
      default:
        return <StudentHome />;
    }
  };

  const renderStaffView = () => {
    switch (staffView) {
      case "dashboard":
        return <AdminDashboard />;
      case "found_items":
        return <AdminInventory />;
      case "claims":
      case "claim_requests":
        return <AdminClaims />;
      case "settings":
        return <SettingsPage />;
      default:
        return <AdminDashboard />;
    }
  };

  // Mobile View Layout
  if (screenMode === "mobile") {
    return (
      <div className="min-h-screen bg-stone-200/60 font-sans flex flex-col selection:bg-blue-800 selection:text-white">
        {/* Device Switcher Bar */}
        <DeviceFrameSwitcher />

        {/* Fluid Native Mobile App Container */}
        <div className="flex-1 w-full max-w-md mx-auto bg-stone-50 min-h-screen shadow-2xl border-x border-stone-300 flex flex-col relative">
          {/* Mobile Header */}
          <Header />

          {/* Scrollable Mobile View Content */}
          <main className="flex-1 pb-20 px-4 sm:px-5 pt-4">
            {role === "student" ? renderStudentView() : renderStaffView()}
          </main>

          {/* Sticky Mobile Bottom Navigation Bar */}
          <div className="sticky bottom-0 z-30">
            <MobileNavBar />
          </div>

          {/* Global Modals & Drawers */}
          <NotificationDrawer />
          <RegisterFoundItemModal />
          <ClaimVerificationModal />
        </div>
      </div>
    );
  }

  // Desktop View Layout
  return (
    <div className="min-h-screen bg-stone-50 text-stone-800 flex flex-col font-sans selection:bg-blue-800 selection:text-white">
      {/* Device Mode Switcher Top Bar */}
      <DeviceFrameSwitcher />

      {/* Full Desktop Header */}
      <Header />

      {/* Main Desktop Container */}
      <main className="flex-1 pb-16 pt-6 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8">
        {role === "student" ? renderStudentView() : renderStaffView()}
      </main>

      {/* Desktop Footer */}
      <Footer />

      {/* Global Modals & Drawers */}
      <NotificationDrawer />
      <RegisterFoundItemModal />
      <ClaimVerificationModal />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
