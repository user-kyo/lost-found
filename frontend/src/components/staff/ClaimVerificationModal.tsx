import React, { useState } from "react";
import { useApp } from "../../context/AppContext";
import { 
  X, 
  ShieldCheck, 
  CheckCircle2, 
  XCircle, 
  HelpCircle, 
  Sparkles, 
  HardDrive, 
  Lock, 
  Unlock, 
  User, 
  Phone, 
  Mail, 
  QrCode 
} from "lucide-react";

export const ClaimVerificationModal: React.FC = () => {
  const { 
    isVerifyModalOpen, 
    setIsVerifyModalOpen, 
    selectedClaim, 
    setSelectedClaim, 
    foundItems, 
    approveClaim, 
    rejectClaim 
  } = useApp();

  const [staffNotes, setStaffNotes] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [activeTab, setActiveTab] = useState<"review" | "reject">("review");

  if (!isVerifyModalOpen || !selectedClaim) return null;

  const item = foundItems.find(i => i.id === selectedClaim.itemId);

  const handleApprove = () => {
    approveClaim(selectedClaim.id, "LGU Desk Officer");
    setIsVerifyModalOpen(false);
    setSelectedClaim(null);
  };

  const handleReject = () => {
    if (!rejectionReason.trim()) return;
    rejectClaim(selectedClaim.id, rejectionReason, "LGU Desk Officer");
    setIsVerifyModalOpen(false);
    setSelectedClaim(null);
  };

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs overflow-y-auto animate-in fade-in">
      <div className="bg-white rounded-[2rem] max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-stone-200 my-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-stone-100">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center font-bold">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-lg font-bold text-stone-900">Claim Verification Review</h2>
                <span className="font-mono text-xs bg-stone-100 px-2 py-0.5 rounded text-stone-700">
                  #{selectedClaim.id}
                </span>
              </div>
              <p className="text-xs text-stone-500">Cross-reference citizen proof with locked municipal item characteristics</p>
            </div>
          </div>

          <button
            onClick={() => {
              setIsVerifyModalOpen(false);
              setSelectedClaim(null);
            }}
            className="p-2 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Comparison Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          {/* Target Found Item Card */}
          <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500 block">
              Physical Item in Locker ({item?.storageBoxId} - Slot {item?.storageSlotId})
            </span>
            {item && (
              <div className="space-y-2">
                <img
                  src={item.imageUrl}
                  alt={item.title}
                  referrerPolicy="no-referrer"
                  className="w-full h-32 object-cover rounded-xl border border-stone-200"
                />
                <div>
                  <h4 className="font-bold text-stone-900 text-sm">{item.title}</h4>
                  <p className="text-stone-600 mt-1">{item.identifyingCharacteristics}</p>
                </div>
                <div className="pt-2 text-[11px] text-stone-500 space-y-0.5">
                  <p>Brand: <strong>{item.brand}</strong> • Color: <strong>{item.color}</strong></p>
                  <p>Found at: <strong>{item.foundLocation}</strong> ({item.foundDate})</p>
                </div>
              </div>
            )}
          </div>

          {/* Student Submitted Proof Card */}
          <div className="p-4 rounded-2xl bg-blue-50/50 border border-blue-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-800">
                Claimant Stated Proof
              </span>
              <span className="px-2 py-0.5 rounded-md bg-blue-800 text-white font-bold text-[10px]">
                {selectedClaim.similarityScore}% AI Vector Score
              </span>
            </div>

            <div className="space-y-2 text-stone-800">
              <div className="bg-white/80 p-3 rounded-xl border border-blue-100 space-y-1">
                <span className="text-[10px] font-bold text-stone-400 uppercase block">Proof of Ownership Description:</span>
                <p className="font-semibold text-stone-900 leading-relaxed">
                  "{selectedClaim.proofOfOwnership}"
                </p>
              </div>

              <div className="p-2.5 bg-white/80 rounded-xl border border-blue-100 space-y-1 text-[11px]">
                <p>Claimant: <strong>{selectedClaim.claimantName}</strong> ({selectedClaim.claimantId})</p>
                <p>Email: <strong>{selectedClaim.contactEmail}</strong></p>
                <p>Phone: <strong>{selectedClaim.contactPhone}</strong></p>
              </div>
            </div>
          </div>
        </div>

        {/* Decision Forms */}
        {selectedClaim.status === "ready_for_retrieval" ? (
          <div className="p-4 rounded-2xl bg-blue-100 text-blue-900 space-y-2 text-xs text-center">
            <CheckCircle2 className="w-6 h-6 mx-auto text-blue-700" />
            <p className="font-bold">This claim was already APPROVED and authorized for smart locker release.</p>
            <p className="text-[11px] font-mono">Retrieval Pass Code: <strong>{selectedClaim.retrievalCode}</strong></p>
          </div>
        ) : (
          <div className="space-y-4 pt-2">
            {activeTab === "review" ? (
              <div className="space-y-3">
                <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200 text-xs text-stone-600">
                  <p className="font-bold text-stone-800 mb-0.5">Authorization Effect:</p>
                  <p>Approving will generate a 1-time secure retrieval pass (<strong>LF-RET-XXXX</strong>) and notify citizen {selectedClaim.claimantName}. The smart locker door solenoid will be primed for ID verification or QR scan.</p>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <button
                    type="button"
                    onClick={() => setActiveTab("reject")}
                    className="px-4 py-2.5 text-red-700 hover:bg-red-50 rounded-xl text-xs font-bold transition-colors"
                  >
                    Reject Claim with Reason
                  </button>

                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => setIsVerifyModalOpen(false)}
                      className="px-4 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold rounded-xl text-xs"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleApprove}
                      className="px-5 py-2.5 bg-blue-800 hover:bg-blue-900 text-white font-bold rounded-xl text-xs shadow-xs transition-colors flex items-center space-x-1.5"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Approve Claim & Issue Retrieval Code</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3 text-xs">
                <div className="space-y-1">
                  <label className="font-bold text-stone-800">Reason for Rejection *</label>
                  <textarea
                    rows={2}
                    required
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="e.g., Description of internal contents did not match AP Chem binder inside the backpack."
                    className="w-full px-3.5 py-2 rounded-xl border border-stone-200 bg-stone-50 text-stone-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-red-600"
                  />
                </div>

                <div className="flex items-center justify-between pt-2">
                  <button
                    type="button"
                    onClick={() => setActiveTab("review")}
                    className="px-4 py-2 text-stone-600 hover:bg-stone-100 rounded-xl text-xs font-bold"
                  >
                    Back to Review
                  </button>

                  <button
                    type="button"
                    onClick={handleReject}
                    className="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-xs shadow-xs transition-colors"
                  >
                    Confirm Rejection
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
