import React from "react";
import { useApp } from "../../context/AppContext";
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  ShieldCheck,
  MapPin,
  AlertCircle,
  XCircle,
  UserCheck,
  Key
} from "lucide-react";
import { ChatWidget } from "../common/ChatWidget";

export const ClaimStatusTracker: React.FC = () => {
  const { selectedClaim, foundItems, setStudentView, setRole, setStaffView, setIsVerifyModalOpen, user } = useApp();

  if (!selectedClaim) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-4">
        <p className="text-stone-500 text-sm">No claim selected for tracking.</p>
        <button
          onClick={() => setStudentView("claims")}
          className="px-4 py-2 bg-emerald-800 text-white rounded-xl text-xs font-semibold"
        >
          View My Claims
        </button>
      </div>
    );
  }

  const item = foundItems.find(i => i.id === selectedClaim.itemId);

  const TIMELINE_STEPS = [
    { key: "submitted", label: "Claim Submitted", desc: "Submitted by citizen & logged" },
    { key: "review", label: "Under LGU Review", desc: "Desk officers inspecting proofs" },
    { key: "identity", label: "Identity Verified", desc: "Claimant credentials matched" },
    { key: "approved", label: "Claim Approved", desc: "Ownership confirmed" },
    { key: "retrieval", label: "Meetup", desc: "Coordinate meetup location" },
    { key: "released", label: "Returned", desc: "Handover logged by staff" }
  ];

  const getStepStatus = (stepIndex: number) => {
    if (selectedClaim.status === "rejected") {
      if (stepIndex === 0) return "completed";
      if (stepIndex === 1) return "failed";
      return "upcoming";
    }

    let currentIndex = 0;
    switch (selectedClaim.status) {
      case "pending_review": currentIndex = 1; break;
      case "under_verification": currentIndex = 1; break;
      case "identity_verified": currentIndex = 2; break;
      case "approved": currentIndex = 3; break;
      case "ready_for_retrieval": currentIndex = 4; break;
      case "released": currentIndex = 5; break;
      default: currentIndex = 1;
    }

    if (stepIndex < currentIndex) return "completed";
    if (stepIndex === currentIndex) return "active";
    return "upcoming";
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 sm:space-y-8">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setStudentView("claims")}
          className="inline-flex items-center space-x-1.5 text-xs font-bold text-stone-600 hover:text-emerald-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to All Claims</span>
        </button>

        <div className="flex items-center space-x-2">
          <span className="text-xs text-stone-400 font-mono">Claim Reference:</span>
          <span className="text-xs font-bold text-stone-900 font-mono px-2 py-0.5 rounded-md bg-stone-100 border border-stone-200">
            {selectedClaim.id}
          </span>
        </div>
      </div>

      {/* Main Status Header Card */}
      <div className="bg-white border border-stone-200 rounded-3xl p-4 sm:p-8 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-stone-100">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${selectedClaim.status === "ready_for_retrieval"
                  ? "bg-emerald-100 text-emerald-800 animate-pulse"
                  : selectedClaim.status === "released"
                    ? "bg-stone-100 text-stone-700"
                    : selectedClaim.status === "rejected"
                      ? "bg-red-100 text-red-800"
                      : "bg-amber-100 text-amber-800"
                }`}>
                {selectedClaim.status.replace(/_/g, " ")}
              </span>
              <span className="text-xs text-stone-400">
                Submitted {new Date(selectedClaim.submittedDate).toLocaleDateString()}
              </span>
            </div>

            <h1 className="text-lg sm:text-2xl font-extrabold text-stone-900 mt-2 break-words">
              Claim for {item?.title || `Item #${selectedClaim.itemId}`}
            </h1>
            <p className="text-xs text-stone-500 mt-0.5 truncate">
              Claimant: {selectedClaim.claimantName} ({selectedClaim.claimantId})
            </p>
          </div>

          {/* Quick LGU Verification Shortcut for Testing */}
          <div className="shrink-0 flex items-center space-x-2">
            <button
              onClick={() => {
                setRole("staff");
                setStaffView("claim_requests");
                setIsVerifyModalOpen(true);
              }}
              className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold rounded-xl transition-colors flex items-center space-x-1 border border-stone-200"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-800" />
              <span>LGU Verification View</span>
            </button>
          </div>
        </div>

        {/* 6-Stage Timeline */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-stone-900">Claim Progress Tracker</h3>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 sm:gap-3">
            {TIMELINE_STEPS.map((step, idx) => {
              const status = getStepStatus(idx);

              return (
                <div
                  key={step.key}
                  className={`p-3 rounded-2xl border transition-all flex flex-col justify-between min-w-0 ${status === "completed"
                      ? "bg-emerald-50/70 border-emerald-200"
                      : status === "active"
                        ? "bg-amber-50 border-amber-300 ring-2 ring-amber-100"
                        : status === "failed"
                          ? "bg-red-50 border-red-200"
                          : "bg-stone-50 border-stone-200/60 opacity-60"
                    }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] font-bold text-stone-400">0{idx + 1}</span>
                      {status === "completed" && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700 shrink-0" />}
                      {status === "active" && <Clock className="w-3.5 h-3.5 text-amber-700 animate-spin shrink-0" />}
                      {status === "failed" && <XCircle className="w-3.5 h-3.5 text-red-600 shrink-0" />}
                      {status === "upcoming" && <span className="w-2 h-2 rounded-full bg-stone-300 shrink-0" />}
                    </div>
                    <p className={`text-[11px] sm:text-xs font-bold leading-tight ${status === "completed"
                        ? "text-emerald-900"
                        : status === "active"
                          ? "text-amber-900"
                          : status === "failed"
                            ? "text-red-900"
                            : "text-stone-600"
                      }`}>
                      {step.label}
                    </p>
                  </div>
                  <p className="text-[9px] sm:text-[10px] text-stone-500 mt-2 leading-tight break-words">
                    {step.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Ready for LGU Handover */}
        {(selectedClaim.status === "ready_for_retrieval" || selectedClaim.status === "approved") && (
          <div className="p-4 sm:p-6 rounded-3xl bg-linear-to-br from-stone-900 via-stone-850 to-emerald-950 text-white shadow-xl space-y-4 border border-stone-800">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/10">
              <div className="flex items-center space-x-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-amber-600 text-white flex items-center justify-center font-bold shadow-md shrink-0">
                  <Key className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm sm:text-base font-extrabold text-white truncate">Meetup Coordination</h3>
                  <p className="text-xs text-stone-300 truncate">
                    Use the chat to arrange a safe meetup at the LGU Office or an external location.
                  </p>
                </div>
              </div>

              <span className="bg-white/10 px-3 py-1.5 rounded-xl border border-white/10 text-xs text-amber-200 font-bold">
                Pending Handover
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-2">
              <div className="bg-white/5 p-3 rounded-xl border border-white/10">
                <span className="text-stone-300 text-[10px] uppercase font-bold block mb-1 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> Option A: LGU Office (Recommended)
                </span>
                <p className="text-stone-300 leading-tight">Meet at the LGU desk. Staff will verify IDs and safely log the official transaction.</p>
              </div>

              <div className="bg-white/5 p-3 rounded-xl border border-white/10">
                <span className="text-stone-300 text-[10px] uppercase font-bold block mb-1">
                  Option B: External Location
                </span>
                <p className="text-stone-300 leading-tight">Meet independently. Please be safe and meet in a public, well-lit area.</p>
              </div>
            </div>
          </div>
        )}

        {/* Claim Review Details */}
        <div className="p-5 rounded-2xl bg-stone-50 border border-stone-200 space-y-3 text-xs">
          <h4 className="font-bold text-stone-900 flex items-center space-x-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-800" />
            <span>Submitted Ownership Verification Record</span>
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-stone-600">
            <div>
              <span className="text-stone-400 block text-[11px] font-semibold">Provided Proof of Ownership:</span>
              <p className="font-medium text-stone-800 mt-0.5">{selectedClaim.ownerNote}</p>
            </div>
          </div>
        </div>

        {/* Action button to mark as returned externally */}
        {(selectedClaim.status === "ready_for_retrieval" || selectedClaim.status === "approved" || selectedClaim.status === "submitted" || selectedClaim.status === "chat_open") && (
          <div className="pt-2 flex justify-end">
            <button 
              onClick={async () => {
                if(confirm("Are you sure you want to mark this item as successfully returned externally? This will close the claim.")) {
                  const res = await fetch(`/api/claims/${selectedClaim.id}/complete-external`, {
                    method: "POST",
                    headers: { "Authorization": `Bearer ${user?.token}` }
                  });
                  
                  if (res.ok) {
                    alert("Claim marked as returned!");
                    window.location.reload();
                  } else {
                    alert("Failed to update status. Please try again.");
                  }
                }
              }}
              className="px-4 py-2 bg-stone-800 text-white text-xs font-bold rounded-lg shadow-sm hover:bg-stone-900 transition-colors"
            >
              Mark as Returned (Met Externally)
            </button>
          </div>
        )}

        {/* Chat Widget */}
        <div className="pt-4 mt-4 border-t border-stone-100">
          <ChatWidget claimId={selectedClaim.id} />
        </div>
      </div>
    </div>
  );
};
