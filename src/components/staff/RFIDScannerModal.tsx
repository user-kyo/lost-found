import React, { useState } from "react";
import { useApp } from "../../context/AppContext";
import { 
  X, 
  QrCode, 
  CreditCard, 
  CheckCircle2, 
  AlertTriangle, 
  Lock, 
  Unlock, 
  HardDrive, 
  Sparkles, 
  ArrowRight,
  ShieldCheck
} from "lucide-react";

export const RFIDScannerModal: React.FC = () => {
  const { 
    isScannerModalOpen, 
    setIsScannerModalOpen, 
    claims, 
    foundItems, 
    releaseClaimedItem,
    unlockStorageSlot 
  } = useApp();

  const [inputCode, setInputCode] = useState("");
  const [scanResult, setScanResult] = useState<{
    status: "idle" | "success" | "error";
    message: string;
    slotId?: string;
    boxId?: string;
    itemTitle?: string;
    claimant?: string;
  }>({ status: "idle", message: "" });

  if (!isScannerModalOpen) return null;

  const handleSimulateBadgeTap = (studentId: string, retrievalCode?: string) => {
    // Find approved claim
    const matchingClaim = claims.find(
      c => (c.claimantId.toLowerCase() === studentId.toLowerCase() || (retrievalCode && c.retrievalCode === retrievalCode)) &&
           (c.status === "ready_for_retrieval" || c.status === "pending_review")
    );

    if (!matchingClaim) {
      setScanResult({
        status: "error",
        message: `No approved retrieval authorization found for credential "${studentId || retrievalCode}". Check verification queue.`
      });
      return;
    }

    const item = foundItems.find(i => i.id === matchingClaim.itemId);
    if (!item) return;

    // Release item
    releaseClaimedItem(matchingClaim.id, "LGU Kiosk Terminal");
    unlockStorageSlot(item.storageBoxId, item.storageSlotId, `Citizen ID: ${matchingClaim.claimantName}`);

    setScanResult({
      status: "success",
      message: `Verified! Locker Solenoid Disengaged. Door for Slot ${item.storageSlotId} opened.`,
      slotId: item.storageSlotId,
      boxId: item.storageBoxId,
      itemTitle: item.title,
      claimant: matchingClaim.claimantName
    });
  };

  const handleSubmitCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputCode.trim()) return;
    handleSimulateBadgeTap("", inputCode.trim().toUpperCase());
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/70 backdrop-blur-xs overflow-y-auto animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-stone-200 my-8 space-y-6 text-center">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-stone-100">
          <div className="flex items-center space-x-2 text-left">
            <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
              <QrCode className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-stone-900">Physical Retrieval Kiosk</h2>
              <p className="text-[11px] text-stone-500">RFID Badge & QR Scanning Station</p>
            </div>
          </div>

          <button
            onClick={() => {
              setIsScannerModalOpen(false);
              setScanResult({ status: "idle", message: "" });
            }}
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scan Animation Container */}
        {scanResult.status === "idle" && (
          <div className="space-y-5">
            <div className="p-6 rounded-3xl bg-stone-900 text-white space-y-4 shadow-inner relative overflow-hidden">
              <div className="w-20 h-20 rounded-2xl bg-amber-400/20 border-2 border-amber-400/80 mx-auto flex items-center justify-center relative">
                <CreditCard className="w-10 h-10 text-amber-400" />
                <div className="absolute inset-x-0 top-0 h-0.5 bg-amber-300 animate-pulse shadow-[0_0_8px_#f59e0b]" />
              </div>

              <div>
                <p className="text-xs font-bold text-amber-400 uppercase tracking-wider">Locker Reader Ready</p>
                <p className="text-sm font-semibold text-stone-200 mt-0.5">
                  Tap Citizen RFID / Resident ID or Scan QR Pass
                </p>
              </div>
            </div>

            {/* Quick Demo Badge Tappers */}
            <div className="space-y-2 text-left">
              <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider block">
                Simulate Citizen Credential Tap:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <button
                  onClick={() => handleSimulateBadgeTap("CTZ-2026-4402", "LF-RET-9412")}
                  className="p-3 rounded-xl border border-stone-200 hover:border-blue-700 bg-stone-50 hover:bg-blue-50 text-left transition-all space-y-0.5"
                >
                  <p className="font-bold text-stone-900">Alex Hayes</p>
                  <p className="text-[10px] text-stone-500">CTZ-2026-4402 (AirPods)</p>
                  <span className="inline-block text-[10px] text-blue-800 font-semibold bg-blue-100/70 px-1.5 py-0.5 rounded">
                    Ready in BOX-A: C1
                  </span>
                </button>

                <button
                  onClick={() => handleSimulateBadgeTap("CTZ-2026-8941")}
                  className="p-3 rounded-xl border border-stone-200 hover:border-blue-700 bg-stone-50 hover:bg-blue-50 text-left transition-all space-y-0.5"
                >
                  <p className="font-bold text-stone-900">Maya Lin</p>
                  <p className="text-[10px] text-stone-500">CTZ-2026-8941 (Backpack)</p>
                  <span className="inline-block text-[10px] text-amber-800 font-semibold bg-amber-100/70 px-1.5 py-0.5 rounded">
                    Target in BOX-A: B3
                  </span>
                </button>
              </div>
            </div>

            {/* Manual Code Input */}
            <form onSubmit={handleSubmitCode} className="space-y-2 text-left pt-2 border-t border-stone-100">
              <label className="text-xs font-bold text-stone-700 block">Or Enter Retrieval Pass Code Manually:</label>
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={inputCode}
                  onChange={(e) => setInputCode(e.target.value)}
                  placeholder="e.g., LF-RET-9412"
                  className="flex-1 px-3.5 py-2 text-xs rounded-xl border border-stone-200 font-mono text-stone-900 uppercase"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-800 hover:bg-blue-900 text-white rounded-xl text-xs font-bold"
                >
                  Verify
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Success State */}
        {scanResult.status === "success" && (
          <div className="space-y-5 py-2">
            <div className="w-16 h-16 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center mx-auto animate-bounce">
              <Unlock className="w-8 h-8" />
            </div>

            <div>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 uppercase">
                Lock Disengaged
              </span>
              <h3 className="text-xl font-black text-stone-900 mt-2">
                Compartment {scanResult.slotId} Unlocked!
              </h3>
              <p className="text-xs text-stone-600 mt-1 max-w-sm mx-auto">
                {scanResult.message}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 text-xs text-left space-y-1">
              <p>Claimant: <strong className="text-stone-900">{scanResult.claimant}</strong></p>
              <p>Item: <strong className="text-stone-900">{scanResult.itemTitle}</strong></p>
              <p>Locker Unit: <strong className="text-stone-900">{scanResult.boxId}</strong> • Slot: <strong className="text-stone-900">{scanResult.slotId}</strong></p>
            </div>

            <button
              onClick={() => {
                setScanResult({ status: "idle", message: "" });
                setIsScannerModalOpen(false);
              }}
              className="w-full py-2.5 bg-blue-800 hover:bg-blue-900 text-white font-bold text-xs rounded-xl shadow-xs"
            >
              Finish Retrieval Session
            </button>
          </div>
        )}

        {/* Error State */}
        {scanResult.status === "error" && (
          <div className="space-y-4 py-2">
            <div className="w-14 h-14 rounded-full bg-red-100 text-red-700 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-7 h-7" />
            </div>

            <div>
              <h3 className="text-base font-bold text-stone-900">Authorization Failed</h3>
              <p className="text-xs text-stone-600 mt-1">
                {scanResult.message}
              </p>
            </div>

            <button
              onClick={() => setScanResult({ status: "idle", message: "" })}
              className="w-full py-2.5 bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs rounded-xl"
            >
              Try Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
