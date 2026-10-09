import React from "react";
import { useApp } from "../../context/AppContext";
import { 
  Package, 
  Clock, 
  ShieldAlert, 
  CheckCircle2, 
  Sparkles, 
  HardDrive, 
  Lock, 
  Unlock, 
  QrCode, 
  PlusCircle, 
  ArrowRight, 
  Activity, 
  Search, 
  TrendingUp, 
  UserCheck, 
  Layers
} from "lucide-react";

export const StaffDashboard: React.FC = () => {
  const { 
    foundItems, 
    claims, 
    lostReports, 
    storageBoxes, 
    auditLogs, 
    setStaffView, 
    setSelectedClaim, 
    setIsVerifyModalOpen, 
    setIsRegisterModalOpen, 
    setIsScannerModalOpen,
    screenMode
  } = useApp();

  const isMobile = screenMode === "mobile";

  const totalFound = foundItems.length;
  const unclaimedCount = foundItems.filter(i => i.status === "unclaimed").length;
  const pendingClaims = claims.filter(c => c.status === "pending_review" || c.status === "under_verification").length;
  const itemsReleased = foundItems.filter(i => i.status === "claimed").length;
  const pendingVerificationCount = claims.filter(c => c.status === "pending_review").length;

  // Calculate box aggregate stats
  const allSlots = storageBoxes.flatMap(b => b.slots);
  const totalSlots = allSlots.length;
  const occupiedSlots = allSlots.filter(s => s.status === "occupied" || s.status === "reserved").length;
  const availableSlots = totalSlots - occupiedSlots;

  return (
    <div className="w-full space-y-6 sm:space-y-8">
      {/* Header & Quick Action Buttons */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-200 uppercase tracking-wider">
              LGU Operations Center
            </span>
            <span className="text-xs text-stone-400">Firmware v3.4.1 Active</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight mt-1">
            Civic Lost-and-Found Management
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 mt-0.5">
            Real-time municipal inventory orchestration, NLP verification queues, and physical smart storage telemetry.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setIsRegisterModalOpen(true)}
            className="px-4 py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center space-x-1.5 active:scale-98"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Register Found Item</span>
          </button>

          <button
            onClick={() => setIsScannerModalOpen(true)}
            className="px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center space-x-1.5 active:scale-98"
          >
            <QrCode className="w-4 h-4" />
            <span>Scan RFID / QR</span>
          </button>
        </div>
      </div>

      {/* 5 KPI Metric Summary Cards */}
      <div className={`grid gap-3 sm:gap-4 ${isMobile ? "grid-cols-2" : "grid-cols-2 sm:grid-cols-3 lg:grid-cols-5"}`}>
        <div className="bg-white p-3.5 sm:p-5 rounded-2xl border border-stone-200 shadow-2xs space-y-1.5 sm:space-y-2 min-w-0">
          <div className="flex items-center justify-between text-stone-400">
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider truncate">Total Found</span>
            <Package className="w-4 h-4 text-emerald-800 shrink-0" />
          </div>
          <p className="text-xl sm:text-2xl font-extrabold text-stone-900">{totalFound}</p>
          <span className="text-[10px] text-stone-500 block truncate">Cataloged in database</span>
        </div>

        <div className="bg-white p-3.5 sm:p-5 rounded-2xl border border-stone-200 shadow-2xs space-y-1.5 sm:space-y-2 min-w-0">
          <div className="flex items-center justify-between text-stone-400">
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider truncate">Unclaimed</span>
            <Clock className="w-4 h-4 text-amber-600 shrink-0" />
          </div>
          <p className="text-xl sm:text-2xl font-extrabold text-amber-700">{unclaimedCount}</p>
          <span className="text-[10px] text-stone-500 block truncate">Awaiting matches</span>
        </div>

        <div className="bg-white p-3.5 sm:p-5 rounded-2xl border border-stone-200 shadow-2xs space-y-1.5 sm:space-y-2 min-w-0">
          <div className="flex items-center justify-between text-stone-400">
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider truncate">Pending Claims</span>
            <ShieldAlert className="w-4 h-4 text-stone-800 shrink-0" />
          </div>
          <p className="text-xl sm:text-2xl font-extrabold text-stone-800">{pendingClaims}</p>
          <span className="text-[10px] text-stone-500 block truncate">Requires staff review</span>
        </div>

        <div className="bg-white p-3.5 sm:p-5 rounded-2xl border border-stone-200 shadow-2xs space-y-1.5 sm:space-y-2 min-w-0">
          <div className="flex items-center justify-between text-stone-400">
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider truncate">Released</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
          </div>
          <p className="text-xl sm:text-2xl font-extrabold text-emerald-800">{itemsReleased + 24}</p>
          <span className="text-[10px] text-stone-500 block truncate">Claimed & retrieved</span>
        </div>

        <div className="bg-white p-3.5 sm:p-5 rounded-2xl border border-stone-200 shadow-2xs space-y-1.5 sm:space-y-2 col-span-2 sm:col-span-1 min-w-0">
          <div className="flex items-center justify-between text-stone-400">
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider truncate">Verification</span>
            <UserCheck className="w-4 h-4 text-emerald-800 shrink-0" />
          </div>
          <p className="text-xl sm:text-2xl font-extrabold text-emerald-900">{pendingVerificationCount}</p>
          <span className="text-[10px] text-stone-500 block truncate">Action required</span>
        </div>
      </div>

      {/* Main Grid: Left 2 Cols (Activity + AI Overview), Right Col (Storage Box Status) */}
      <div className={`grid gap-6 sm:gap-8 ${isMobile ? "grid-cols-1" : "grid-cols-1 lg:grid-cols-12"}`}>
        {/* Left Column (8 Cols): AI Matching Overview + Recent Activity */}
        <div className={`${isMobile ? "" : "lg:col-span-8"} space-y-6 sm:space-y-8 min-w-0`}>
          {/* AI Matching Overview Card */}
          <div className="bg-white border border-stone-200 rounded-3xl p-4 sm:p-7 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-stone-100">
              <div className="flex items-center space-x-2.5 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm sm:text-base font-bold text-stone-900 truncate">AI / NLP Matching Analytics</h3>
                  <p className="text-xs text-stone-500 truncate">Real-time similarity calculations</p>
                </div>
              </div>

              <span className="self-start sm:self-auto px-2.5 py-1 rounded-full text-[10px] sm:text-[11px] font-bold bg-emerald-100 text-emerald-900">
                Live NLP Engine Active
              </span>
            </div>

            <div className={`grid gap-2.5 sm:gap-4 text-xs ${isMobile ? "grid-cols-2" : "grid-cols-2 sm:grid-cols-4"}`}>
              <div className="p-3 rounded-xl bg-stone-50 border border-stone-200 min-w-0">
                <span className="text-stone-400 block text-[9px] sm:text-[10px] uppercase font-bold truncate">Total AI Matches</span>
                <p className="text-lg sm:text-xl font-bold text-stone-900 mt-0.5">28</p>
                <span className="text-[10px] text-stone-500 block truncate">Evaluated pairings</span>
              </div>
              <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200 min-w-0">
                <span className="text-emerald-900 block text-[9px] sm:text-[10px] uppercase font-bold truncate">High Confidence</span>
                <p className="text-lg sm:text-xl font-bold text-emerald-950 mt-0.5">12</p>
                <span className="text-[10px] text-emerald-800 block truncate">&gt;85% correlation</span>
              </div>
              <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200 min-w-0">
                <span className="text-amber-900 block text-[9px] sm:text-[10px] uppercase font-bold truncate">Pending Review</span>
                <p className="text-lg sm:text-xl font-bold text-amber-950 mt-0.5">{pendingClaims}</p>
                <span className="text-[10px] text-amber-800 block truncate">Awaiting review</span>
              </div>
              <div className="p-3 rounded-xl bg-stone-100 border border-stone-200 min-w-0">
                <span className="text-stone-700 block text-[9px] sm:text-[10px] uppercase font-bold truncate">Confirmed</span>
                <p className="text-lg sm:text-xl font-bold text-stone-900 mt-0.5">16</p>
                <span className="text-[10px] text-stone-600 block truncate">100% staff verified</span>
              </div>
            </div>

            {/* Quick Claims Awaiting Review List */}
            {claims.filter(c => c.status === "pending_review").length > 0 && (
              <div className="pt-3 border-t border-stone-100 space-y-3">
                <span className="text-xs font-bold text-stone-900 block">
                  Action Required: Claims Awaiting Immediate Verification
                </span>
                <div className="space-y-2">
                  {claims.filter(c => c.status === "pending_review").slice(0, 2).map((claim) => {
                    const item = foundItems.find(i => i.id === claim.itemId);
                    return (
                      <div
                        key={claim.id}
                        className="p-3 sm:p-3.5 rounded-xl border border-stone-200 bg-stone-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                      >
                        <div className="flex items-center space-x-3 min-w-0">
                          <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-900 flex items-center justify-center font-bold shrink-0">
                            {claim.similarityScore}%
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-bold text-stone-900 truncate">
                              {claim.claimantName} ({claim.claimantId}) → {item?.title || claim.itemId}
                            </p>
                            <p className="text-[11px] text-stone-500 truncate">
                              Proof: {claim.proofOfOwnership}
                            </p>
                          </div>
                        </div>

                        <button
                          onClick={() => {
                            setSelectedClaim(claim);
                            setIsVerifyModalOpen(true);
                          }}
                          className="w-full sm:w-auto shrink-0 px-3.5 py-1.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-lg text-xs font-bold transition-colors shadow-2xs text-center"
                        >
                          Verify Claim
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Recent Activity Feed */}
          <div className="bg-white border border-stone-200 rounded-3xl p-6 sm:p-7 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div className="flex items-center space-x-2">
                <Activity className="w-4 h-4 text-emerald-800" />
                <h3 className="text-base font-bold text-stone-900">Real-Time Operational Activity</h3>
              </div>
              <button
                onClick={() => setStaffView("audit_logs")}
                className="text-xs font-bold text-emerald-800 hover:text-emerald-950"
              >
                View Full Audit Trail
              </button>
            </div>

            <div className="divide-y divide-stone-100">
              {auditLogs.slice(0, 5).map((log) => (
                <div key={log.id} className="py-3 flex items-start space-x-3 text-xs">
                  <div className="w-2 h-2 rounded-full bg-emerald-800 mt-1.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-stone-900">{log.action.replace(/_/g, " ")}</span>
                      <span className="text-[11px] text-stone-400 font-mono">{log.timestamp}</span>
                    </div>
                    <p className="text-stone-600 mt-0.5 text-[11px]">{log.details}</p>
                    <div className="flex items-center space-x-2 mt-1 text-[10px] text-stone-400">
                      <span>{log.user}</span>
                      <span>•</span>
                      <span>Device: {log.device}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column (4 Cols): Physical Smart Storage Box Status */}
        <div className={`${isMobile ? "" : "lg:col-span-4"} space-y-6`}>
          <div className="bg-white border border-stone-200 rounded-3xl p-6 shadow-xs space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div className="flex items-center space-x-2">
                <HardDrive className="w-5 h-5 text-emerald-800" />
                <h3 className="text-base font-bold text-stone-900">Smart Storage Unit</h3>
              </div>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-900">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 mr-1 animate-pulse" />
                Online
              </span>
            </div>

            {/* Storage Box A Widget */}
            <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-stone-900">Locker Box A</h4>
                  <p className="text-[10px] text-stone-500">Main Admin East Lobby</p>
                </div>
                <span className="px-2 py-0.5 rounded-md bg-stone-200 text-stone-800 text-[10px] font-bold">
                  9 Compartments
                </span>
              </div>

              {/* Mini Compartment visualizer */}
              <div className="grid grid-cols-3 gap-1.5 py-1">
                {storageBoxes[0].slots.map(slot => (
                  <div
                    key={slot.id}
                    className={`h-7 rounded-md text-[10px] font-bold flex items-center justify-center border transition-all ${
                      slot.status === "available"
                        ? "bg-emerald-50 border-emerald-300 text-emerald-800"
                        : slot.status === "reserved"
                        ? "bg-amber-50 border-amber-300 text-amber-800"
                        : "bg-stone-200 border-stone-300 text-stone-800"
                    }`}
                  >
                    {slot.id}
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between text-[11px] text-stone-600 pt-1">
                <span>Occupied: 4 slots</span>
                <span className="text-emerald-800 font-bold">Available: 5 slots</span>
              </div>
            </div>

            {/* Storage Box B Widget */}
            <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-stone-900">Locker Box B</h4>
                  <p className="text-[10px] text-stone-500">Athletics & Student Concourse</p>
                </div>
                <span className="px-2 py-0.5 rounded-md bg-stone-200 text-stone-800 text-[10px] font-bold">
                  9 Compartments
                </span>
              </div>

              {/* Mini Compartment visualizer */}
              <div className="grid grid-cols-3 gap-1.5 py-1">
                {storageBoxes[1]?.slots.map(slot => (
                  <div
                    key={slot.id}
                    className={`h-7 rounded-md text-[10px] font-bold flex items-center justify-center border transition-all ${
                      slot.status === "available"
                        ? "bg-emerald-50 border-emerald-300 text-emerald-800"
                        : slot.status === "reserved"
                        ? "bg-amber-50 border-amber-300 text-amber-800"
                        : "bg-stone-200 border-stone-300 text-stone-800"
                    }`}
                  >
                    {slot.id}
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between text-[11px] text-stone-600 pt-1">
                <span>Occupied: 3 slots</span>
                <span className="text-emerald-800 font-bold">Available: 6 slots</span>
              </div>
            </div>

            {/* Hardware Telemetry */}
            <div className="p-3.5 rounded-xl bg-stone-100 border border-stone-200 space-y-1.5 text-xs text-stone-700">
              <div className="flex items-center justify-between">
                <span className="text-stone-500 text-[11px]">System Lock Status:</span>
                <span className="font-bold text-emerald-800 flex items-center space-x-1">
                  <Lock className="w-3 h-3" />
                  <span>All Doors Secured</span>
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-stone-500 text-[11px]">Locker Temp:</span>
                <span className="font-semibold text-stone-800">21.4°C (Optimal)</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-stone-500 text-[11px]">RFID Reader:</span>
                <span className="font-bold text-emerald-800">Ready for Badge Tap</span>
              </div>
            </div>

            {/* CTA */}
            <button
              onClick={() => setStaffView("storage_box")}
              className="w-full py-2.5 px-4 bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center space-x-2"
            >
              <span>Manage Smart Lockers</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
