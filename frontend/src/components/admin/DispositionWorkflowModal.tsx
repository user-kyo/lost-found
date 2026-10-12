import React, { useState, useEffect } from "react";
import { useApp } from "../../context/AppContext";
import { 
  X, 
  Clock, 
  Calendar, 
  CheckSquare, 
  Square, 
  AlertTriangle, 
  ShieldCheck, 
  Lock, 
  Unlock, 
  FileCheck2, 
  Award, 
  Building2, 
  Trash2, 
  HeartHandshake, 
  Send,
  AlertCircle,
  FileText
} from "lucide-react";
import { FoundItem, DispositionCase, DispositionChecklist } from "../../types";

interface DispositionWorkflowModalProps {
  item: FoundItem;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (updatedItem: any) => void;
}

export const DispositionWorkflowModal: React.FC<DispositionWorkflowModalProps> = ({
  item,
  isOpen,
  onClose,
  onSuccess
}) => {
  const { user } = useApp();

  const [dispositionCase, setDispositionCase] = useState<DispositionCase | null>(null);
  const [loading, setLoading] = useState(true);
  const [targetDisposition, setTargetDisposition] = useState<"donated" | "disposed" | "turned_over">("donated");
  
  // Checklist State
  const [checklist, setChecklist] = useState<DispositionChecklist>({
    physical_inventory_audit: false,
    claim_absence_certified: false,
    notice_posted: false,
    recipient_identified: false,
    property_affidavit_attached: false
  });
  
  // Official Approval State
  const [officialRemarks, setOfficialRemarks] = useState("");
  const [isApproving, setIsApproving] = useState(false);
  
  // Final Execution State
  const [manifestNumber, setManifestNumber] = useState("");
  const [recipientOrg, setRecipientOrg] = useState("DepEd School Community Welfare Outreach");
  const [dispositionNote, setDispositionNote] = useState("");
  const [isExecuting, setIsExecuting] = useState(false);
  
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Initialize or load disposition case
  useEffect(() => {
    if (isOpen && item) {
      loadOrCreateCase();
    }
  }, [isOpen, item]);

  const loadOrCreateCase = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch(`/api/admin/posts/${item.id}/disposition-case`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${user?.token}`
        },
        body: JSON.stringify({ 
          targetDisposition,
          forceOverrideHoldingCheck: true // allows starting case review
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to load disposition case.");
      }

      setDispositionCase(data.dispositionCase);
      if (data.dispositionCase?.checklist) {
        setChecklist(data.dispositionCase.checklist);
      }
      if (data.dispositionCase?.targetDisposition) {
        setTargetDisposition(data.dispositionCase.targetDisposition);
      }
      setManifestNumber(`MNF-${new Date().getFullYear()}-${item.id.slice(0, 4).toUpperCase()}`);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to load disposition case.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !item) return null;

  const clocks = item.holdingClocks;

  // Checklist toggle handler
  const handleToggleChecklist = async (key: keyof DispositionChecklist) => {
    const updated = {
      ...checklist,
      [key]: !checklist[key]
    };
    setChecklist(updated);

    try {
      const res = await fetch(`/api/admin/posts/${item.id}/disposition-case/checklist`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${user?.token}`
        },
        body: JSON.stringify({
          checklist: updated,
          targetDisposition
        })
      });
      const data = await res.json();
      if (res.ok && data.dispositionCase) {
        setDispositionCase(data.dispositionCase);
      }
    } catch (e) {
      console.error("Checklist auto-save error:", e);
    }
  };

  // Official Approval Handler
  const handleApproveCase = async () => {
    setIsApproving(true);
    setErrorMsg(null);
    try {
      const res = await fetch(`/api/admin/posts/${item.id}/disposition-case/approve`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${user?.token}`
        },
        body: JSON.stringify({
          officialRemarks: officialRemarks || "Certified that all retention periods and document criteria have been met."
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Approval rejected by server.");
      }

      setDispositionCase(data.dispositionCase);
      alert("Disposition case officially approved! Ready for final status execution.");
    } catch (err: any) {
      setErrorMsg(err.message || "Approval failed.");
    } finally {
      setIsApproving(false);
    }
  };

  // Execute Final Status Change
  const handleExecuteDisposition = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsExecuting(true);
    setErrorMsg(null);

    try {
      const res = await fetch(`/api/admin/posts/${item.id}/dispose`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${user?.token}`
        },
        body: JSON.stringify({
          targetDisposition,
          manifestNumber,
          recipientOrg,
          dispositionNote: dispositionNote || `Item officially ${targetDisposition} to ${recipientOrg} following Case #${dispositionCase?.caseId} approval.`
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to execute disposition.");
      }

      alert(`Official disposition complete! Item status permanently changed to: ${targetDisposition}.`);
      if (onSuccess) {
        onSuccess(data.post);
      }
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to execute final status change.");
    } finally {
      setIsExecuting(false);
    }
  };

  const completedCount = Object.values(checklist).filter(Boolean).length;
  const isChecklist100 = completedCount === 5;
  const isApproved = Boolean(dispositionCase?.approval?.approved);

  return (
    <div className="fixed inset-0 z-[120] bg-stone-950/75 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-[2.5rem] shadow-2xl max-w-3xl w-full my-auto overflow-hidden border border-stone-200/90 text-stone-800 animate-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-stone-900 via-stone-850 to-amber-950 text-white p-6 sm:p-7 relative">
          <button
            onClick={onClose}
            className="absolute top-6 right-6 p-2 rounded-xl bg-white/10 hover:bg-white/20 text-stone-300 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center space-x-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-amber-300">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-amber-400">
                Retention Compliance & Unclaimed Disposition
              </span>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                Holding Period & Disposition Case
              </h2>
            </div>
          </div>
          <p className="text-xs text-stone-300 font-medium">
            Track school holding clocks, statutory 6-month turnover windows, and authorize final disposition for item #{item.id}
          </p>
        </div>

        {/* Body Content */}
        <div className="p-6 sm:p-8 space-y-6 max-h-[80vh] overflow-y-auto text-xs">
          {errorMsg && (
            <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-800 flex items-start space-x-2.5">
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Action Blocked</p>
                <p className="text-[11px] mt-0.5">{errorMsg}</p>
              </div>
            </div>
          )}

          {/* Item Quick Overview Pill */}
          <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">Item in Custody</span>
              <h3 className="font-extrabold text-stone-900 text-sm mt-0.5">{item.title}</h3>
              <p className="text-stone-500 text-[11px]">{item.category} • {item.color} • Found at: {item.locationFound || item.foundLocation}</p>
            </div>
            <div className="sm:text-right">
              <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">Storage Location</span>
              <span className="font-mono font-bold text-stone-800 bg-white px-2.5 py-1 rounded-lg border border-stone-200 inline-block mt-0.5">
                {item.storageLocation || `${item.storageBoxId || 'OFFICE'} - Slot ${item.storageSlotId || 'A1'}`}
              </span>
            </div>
          </div>

          {/* Section 1: Holding Period Clocks */}
          <div className="space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-stone-900 flex items-center space-x-1.5">
              <Clock className="w-4 h-4 text-amber-600" />
              <span>1. Holding Period Clocks</span>
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* School Holding Clock */}
              <div className={`p-4 rounded-2xl border space-y-2 transition-all ${
                clocks?.isSchoolHoldingLapsed
                  ? "bg-amber-50/70 border-amber-200 text-amber-950"
                  : "bg-blue-50/70 border-blue-200 text-blue-950"
              }`}>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-wider text-stone-500">
                    School Holding Period ({clocks?.schoolHoldingPeriodDays || 60} Days)
                  </span>
                  <span className={`px-2 py-0.5 rounded-full font-extrabold text-[10px] uppercase ${
                    clocks?.isSchoolHoldingLapsed
                      ? "bg-amber-600 text-white"
                      : "bg-blue-600 text-white"
                  }`}>
                    {clocks?.isSchoolHoldingLapsed ? "Holding Lapsed" : "Clock Active"}
                  </span>
                </div>

                <div className="space-y-1">
                  <p className="text-sm font-extrabold">
                    {clocks?.isSchoolHoldingLapsed 
                      ? `Lapsed ${clocks?.schoolDaysElapsed} days after intake`
                      : `${clocks?.schoolDaysRemaining} day(s) remaining`}
                  </p>
                  <p className="text-[11px] text-stone-600">
                    Received: <strong>{clocks?.receivedAt ? new Date(clocks.receivedAt).toLocaleDateString() : 'N/A'}</strong>
                  </p>
                  <p className="text-[11px] text-stone-600">
                    Retention Deadline: <strong>{clocks?.schoolHoldingDeadline ? new Date(clocks.schoolHoldingDeadline).toLocaleDateString() : 'N/A'}</strong>
                  </p>
                </div>
              </div>

              {/* Statutory 6-Month Period Clock */}
              <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 text-stone-900 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-wider text-stone-500">
                    Statutory Period (Publication + 6 Mo.)
                  </span>
                  <span className={`px-2 py-0.5 rounded-full font-extrabold text-[10px] uppercase ${
                    clocks?.isStatutoryPeriodElapsed
                      ? "bg-emerald-600 text-white"
                      : "bg-stone-200 text-stone-700"
                  }`}>
                    {clocks?.isStatutoryPeriodElapsed ? "6-Mo Window Elapsed" : "Statutory Clock Active"}
                  </span>
                </div>

                <div className="space-y-1">
                  <p className="text-sm font-extrabold">
                    Earliest Award Date: {clocks?.earliestAwardDate ? new Date(clocks.earliestAwardDate).toLocaleDateString() : 'Pending Publication'}
                  </p>
                  <p className="text-[11px] text-stone-600">
                    City Publication: <strong>{clocks?.cityPublicationDate ? new Date(clocks.cityPublicationDate).toLocaleDateString() : 'Not published'}</strong>
                  </p>
                  <p className="text-[11px] text-stone-600">
                    Civic Turnover / Finder Award: <strong>{clocks?.isStatutoryPeriodElapsed ? "Eligible" : `${clocks?.statutoryDaysRemaining || 180} days to statutory maturity`}</strong>
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Target Disposition Selection */}
          <div className="space-y-3 pt-2 border-t border-stone-100">
            <h4 className="text-xs font-black uppercase tracking-wider text-stone-900 flex items-center space-x-1.5">
              <Building2 className="w-4 h-4 text-stone-700" />
              <span>2. Intended Disposition Protocol</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { id: "donated", label: "Donated to School Charity", icon: HeartHandshake, desc: "Community welfare & needy students" },
                { id: "disposed", label: "Disposed / Recycled", icon: Trash2, desc: "Damaged, scrap, or broken items" },
                { id: "turned_over", label: "Turned Over to City / Awarded", icon: Building2, desc: "Civil Code Art. 719 statutory turnover" }
              ].map(opt => {
                const Icon = opt.icon;
                const isSelected = targetDisposition === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    disabled={isApproved || dispositionCase?.status === "executed"}
                    onClick={() => setTargetDisposition(opt.id as any)}
                    className={`p-3.5 rounded-2xl border text-left transition-all ${
                      isSelected
                        ? "bg-amber-500/10 border-amber-500 text-stone-900 ring-2 ring-amber-500/20"
                        : "bg-white border-stone-200 text-stone-600 hover:bg-stone-50"
                    }`}
                  >
                    <Icon className={`w-5 h-5 mb-1.5 ${isSelected ? "text-amber-700" : "text-stone-400"}`} />
                    <p className="font-extrabold text-xs">{opt.label}</p>
                    <p className="text-[10px] text-stone-500 mt-0.5">{opt.desc}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 3: Document Checklist (5 Mandatory Criteria) */}
          <div className="space-y-3 pt-2 border-t border-stone-100">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-black uppercase tracking-wider text-stone-900 flex items-center space-x-1.5">
                <FileCheck2 className="w-4 h-4 text-blue-700" />
                <span>3. Mandatory Document Checklist ({completedCount} / 5 Certified)</span>
              </h4>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                isChecklist100 ? "bg-emerald-100 text-emerald-800" : "bg-stone-100 text-stone-600"
              }`}>
                {isChecklist100 ? "Checklist Complete" : "Pending Documents"}
              </span>
            </div>

            {/* Checklist items list */}
            <div className="space-y-2 bg-stone-50/80 p-4 rounded-2xl border border-stone-200/80">
              {[
                { key: "physical_inventory_audit", title: "1. Physical Inventory & Custody Re-Audit", desc: "Physical item confirmed present and intact in assigned Guidance storage custody." },
                { key: "claim_absence_certified", title: "2. Claim Absence Certification", desc: "Certified that no active, pending, contested, or unresolved student claims exist." },
                { key: "notice_posted", title: "3. Public Notice & Retention Compliance", desc: "School holding period concluded and notice of unclaimed property observed." },
                { key: "recipient_identified", title: "4. Receiving Organization / Protocol Specified", desc: "Designated welfare foundation, outreach recipient, or disposal partner confirmed." },
                { key: "property_affidavit_attached", title: "5. Property Affidavit & Manifest Prepared", desc: "Official turnover inventory manifest and non-reclamation affidavit generated." }
              ].map(item => {
                const isChecked = checklist[item.key as keyof DispositionChecklist];
                return (
                  <div
                    key={item.key}
                    onClick={() => !isApproved && handleToggleChecklist(item.key as keyof DispositionChecklist)}
                    className={`flex items-start space-x-3 p-3 rounded-xl border transition-all cursor-pointer ${
                      isChecked
                        ? "bg-emerald-50/70 border-emerald-200 text-emerald-950"
                        : "bg-white border-stone-200/80 text-stone-700 hover:bg-stone-50"
                    } ${isApproved ? "cursor-default" : ""}`}
                  >
                    <div className="mt-0.5 shrink-0">
                      {isChecked ? (
                        <CheckSquare className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <Square className="w-4 h-4 text-stone-400" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="font-extrabold text-xs">{item.title}</p>
                      <p className="text-[11px] text-stone-500 mt-0.5">{item.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section 4: Authorized Official Sign-Off & Approval */}
          <div className="space-y-3 pt-2 border-t border-stone-100">
            <h4 className="text-xs font-black uppercase tracking-wider text-stone-900 flex items-center space-x-1.5">
              <Award className="w-4 h-4 text-indigo-700" />
              <span>4. Authorized Official Approval</span>
            </h4>

            {isApproved ? (
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 space-y-2">
                <div className="flex items-center space-x-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-600" />
                  <span className="font-extrabold text-xs uppercase tracking-wider">
                    Officially Approved for Final Disposition
                  </span>
                </div>
                <p className="text-xs">
                  Approved by: <strong>{dispositionCase?.approval?.approvedBy}</strong> ({dispositionCase?.approval?.approverRole}) on{" "}
                  <strong>{dispositionCase?.approval?.approvedAt ? new Date(dispositionCase.approval.approvedAt).toLocaleString() : ''}</strong>
                </p>
                {dispositionCase?.approval?.officialRemarks && (
                  <p className="text-[11px] italic text-emerald-800">
                    "{dispositionCase.approval.officialRemarks}"
                  </p>
                )}
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-3">
                {!isChecklist100 ? (
                  <div className="flex items-center space-x-2 text-stone-500 text-xs">
                    <Lock className="w-4 h-4 text-stone-400 shrink-0" />
                    <span>
                      Approval is locked until all 5 checklist documents are verified and certified above.
                    </span>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2 text-emerald-700 font-bold text-xs">
                      <Unlock className="w-4 h-4" />
                      <span>Checklist 100% complete. Ready for official administrative sign-off.</span>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-stone-700 mb-1">
                        Official Authorization Remarks
                      </label>
                      <input
                        type="text"
                        value={officialRemarks}
                        onChange={(e) => setOfficialRemarks(e.target.value)}
                        placeholder="e.g. Approved by Guidance Head after statutory holding period review."
                        className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 bg-white text-stone-900 text-xs"
                      />
                    </div>

                    <button
                      type="button"
                      disabled={isApproving}
                      onClick={handleApproveCase}
                      className="px-5 py-2.5 bg-indigo-700 hover:bg-indigo-800 text-white font-bold rounded-xl text-xs transition-all flex items-center space-x-1.5 shadow-sm active:scale-98"
                    >
                      <Award className="w-4 h-4" />
                      <span>{isApproving ? "Approving Case..." : "Sign & Authorize Disposition Case"}</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Section 5: Execute Final Disposition Status Change */}
          <div className="space-y-3 pt-2 border-t border-stone-100">
            <h4 className="text-xs font-black uppercase tracking-wider text-stone-900 flex items-center space-x-1.5">
              <Send className="w-4 h-4 text-stone-800" />
              <span>5. Final Status Execution (Guardrail Protected)</span>
            </h4>

            {dispositionCase?.status === "executed" ? (
              <div className="p-4 rounded-2xl bg-stone-900 text-white space-y-1">
                <p className="font-extrabold text-xs">Disposition Successfully Executed</p>
                <p className="text-[11px] text-stone-300">
                  Item #{item.id} is officially marked as <strong>{item.status}</strong>. Manifest: {dispositionCase.execution?.manifestNumber}
                </p>
              </div>
            ) : (
              <form onSubmit={handleExecuteDisposition} className="space-y-3 p-4 rounded-2xl bg-stone-50 border border-stone-200">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-stone-700 mb-1">
                      Turnover Manifest / Ref # <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={manifestNumber}
                      onChange={(e) => setManifestNumber(e.target.value)}
                      placeholder="e.g. MNF-2026-0042"
                      className="w-full px-3.5 py-2 rounded-xl border border-stone-200 bg-white text-stone-900 text-xs font-mono font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-stone-700 mb-1">
                      Recipient Org / Disposal Partner <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={recipientOrg}
                      onChange={(e) => setRecipientOrg(e.target.value)}
                      placeholder="e.g. School Outreach Charity / City Hall"
                      className="w-full px-3.5 py-2 rounded-xl border border-stone-200 bg-white text-stone-900 text-xs font-medium"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-stone-700 mb-1">
                    Final Turnover Remarks
                  </label>
                  <input
                    type="text"
                    value={dispositionNote}
                    onChange={(e) => setDispositionNote(e.target.value)}
                    placeholder="e.g. Surrendered to DepEd Community Welfare coordinator."
                    className="w-full px-3.5 py-2 rounded-xl border border-stone-200 bg-white text-stone-900 text-xs"
                  />
                </div>

                {/* Final Execution Button: BLOCKED unless approved and checklist complete */}
                <div className="pt-2 flex items-center justify-between">
                  <span className="text-[11px] text-stone-500">
                    Status change will transition post to: <strong className="font-mono text-stone-900 uppercase">{targetDisposition}</strong>
                  </span>

                  <button
                    type="submit"
                    disabled={!isApproved || !isChecklist100 || isExecuting}
                    className={`px-6 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center space-x-1.5 shadow-sm ${
                      isApproved && isChecklist100
                        ? "bg-amber-600 hover:bg-amber-700 text-white shadow-amber-600/30 active:scale-98 cursor-pointer"
                        : "bg-stone-200 text-stone-400 cursor-not-allowed"
                    }`}
                  >
                    <Lock className="w-3.5 h-3.5" />
                    <span>
                      {!isChecklist100
                        ? "Blocked (Incomplete Checklist)"
                        : !isApproved
                        ? "Blocked (Pending Official Approval)"
                        : isExecuting
                        ? "Executing..."
                        : `Execute Final Status: ${targetDisposition.toUpperCase()}`}
                    </span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-6 bg-stone-50 border-t border-stone-100 flex items-center justify-between text-xs">
          <span className="text-stone-400 font-mono text-[11px]">
            Case ID: {dispositionCase?.caseId || 'Pending'} • Status: {dispositionCase?.status || 'Draft'}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 bg-stone-900 text-white rounded-xl text-xs font-bold hover:bg-stone-800 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
