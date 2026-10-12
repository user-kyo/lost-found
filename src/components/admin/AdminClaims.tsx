import React, { useState, useEffect } from "react";
import { useApp } from "../../context/AppContext";
import { ShieldCheck, MessageSquare, Check, X, FileText, User, Handshake, LayoutDashboard } from "lucide-react";
import { ChatWidget } from "../common/ChatWidget";

export const AdminClaims: React.FC = () => {
  const { user, claims, setClaims } = useApp();
  const [localClaims, setLocalClaims] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [handoverModal, setHandoverModal] = useState<any>(null);

  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => {
      // Map global claims to the local display format
      const displayClaims = claims.map(c => ({
        ...c,
        post: { category: "Lost Item", color: "Unknown", privateDetails: { details: c.proofDescription } },
        owner: { fullName: c.claimantName }
      }));
      setLocalClaims(displayClaims);
      setLoading(false);
    }, 600);
    return () => clearTimeout(timer);
  }, [claims]);

  const handleAction = (claimId: string, action: "approve" | "reject") => {
    if (!confirm(`Are you sure you want to ${action} this claim?`)) return;

    // We can just update local claims for demonstration
    setLocalClaims(prev => prev.map(c => 
      c.id === claimId ? { ...c, status: action === 'approve' ? 'approved' : 'rejected' } : c
    ));
    alert(`Claim ${action}d successfully!`);
  };

  const handleCompleteHandover = (e: React.FormEvent) => {
    e.preventDefault();
    setLocalClaims(prev => prev.map(c => 
      c.id === handoverModal.claimId ? { ...c, status: 'completed' } : c
    ));
    alert(`Handover complete and logged!`);
    setHandoverModal(null);
  }

  return (
    <div className="w-full space-y-6 sm:space-y-8 animate-in fade-in duration-700 pb-8 relative">
      {/* Header Section */}
      <div className="relative overflow-hidden rounded-[2rem] bg-stone-950 text-white p-8 sm:p-10 shadow-2xl border border-stone-800/60 group">
        <div className="absolute top-0 right-0 -mt-20 -mr-20 w-96 h-96 bg-indigo-600/20 rounded-full blur-[80px] pointer-events-none group-hover:bg-indigo-500/30 transition-all duration-700" />
        <div className="absolute bottom-0 left-1/4 -mb-20 w-80 h-80 bg-blue-600/20 rounded-full blur-[80px] pointer-events-none group-hover:bg-blue-500/30 transition-all duration-700" />
        
        <div className="relative z-10">
          <div className="inline-flex items-center space-x-2 px-3 py-1 mb-4 rounded-full bg-white/5 backdrop-blur-md border border-white/10 text-xs font-semibold text-indigo-300 shadow-inner">
            <ShieldCheck className="w-4 h-4 text-indigo-400" />
            <span>LGU Administrator</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white via-indigo-100 to-stone-400 tracking-tight">
            Claim Verification & Handover
          </h1>
          <p className="text-stone-300/80 text-sm sm:text-base mt-2 max-w-xl font-medium">
            Verify citizen claims against private details. Log physical handovers when claimants arrive at the office.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center flex flex-col items-center justify-center animate-pulse">
          <div className="w-16 h-16 rounded-full bg-indigo-100/50 flex items-center justify-center mb-4">
             <ShieldCheck className="w-8 h-8 text-indigo-500 animate-pulse" />
          </div>
          <p className="text-stone-500 font-medium">Loading claims...</p>
        </div>
      ) : localClaims.length === 0 ? (
        <div className="bg-white/70 backdrop-blur-xl border border-stone-200/80 rounded-[2rem] p-16 text-center space-y-6 shadow-sm flex flex-col items-center justify-center">
          <div className="w-24 h-24 rounded-full bg-stone-50 flex items-center justify-center mx-auto shadow-inner border border-stone-100">
            <ShieldCheck className="w-10 h-10 text-stone-300" />
          </div>
          <div>
            <h3 className="text-2xl font-extrabold text-stone-900">No Active Claims</h3>
            <p className="text-base text-stone-500 max-w-md mx-auto mt-2 font-medium">
              All claims have been processed or none have been submitted yet.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {localClaims.map(claim => (
            <div key={claim.id} className="bg-white/80 backdrop-blur-xl border border-stone-200/80 hover:border-indigo-300 rounded-[2rem] shadow-sm hover:shadow-xl transition-all duration-300 p-6 sm:p-8 space-y-6 group">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-stone-100 pb-4 gap-4">
                <div className="flex items-center space-x-3">
                  <span className="font-mono font-bold text-stone-400 text-sm bg-stone-100 px-2 py-1 rounded-lg">CLAIM #{claim.id.slice(-6)}</span>
                  <h3 className="text-xl font-extrabold text-stone-900">{claim.post?.category} - {claim.post?.color}</h3>
                  <span className={`px-3 py-1.5 rounded-xl text-[10px] font-extrabold uppercase tracking-widest shadow-xs border ${
                    claim.status === "submitted" ? "bg-amber-50 text-amber-700 border-amber-200/60" :
                    claim.status === "approved" ? "bg-blue-50 text-blue-700 border-blue-200/60" :
                    claim.status === "completed" ? "bg-emerald-50 text-emerald-700 border-emerald-200/60" :
                    "bg-red-50 text-red-700 border-red-200/60"
                  }`}>
                    {claim.status.replace("_", " ")}
                  </span>
                </div>
                <div className="text-xs text-stone-500 sm:text-right flex flex-col gap-1 bg-stone-50 p-2 sm:p-0 sm:bg-transparent rounded-lg">
                  <p>Claimant: <span className="font-semibold text-stone-700">{claim.owner?.fullName || 'Unknown'}</span></p>
                  <p className="font-mono text-[11px]">{new Date(claim.createdAt).toLocaleString()}</p>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <h4 className="text-[11px] font-extrabold text-stone-400 uppercase tracking-widest">Claimant's Proof of Ownership</h4>
                  <div className="text-sm text-stone-700 bg-stone-50/80 p-5 rounded-2xl border border-stone-200/60 shadow-inner leading-relaxed">
                    {claim.ownerNote || <span className="text-stone-400 italic">No details provided.</span>}
                  </div>
                </div>
                <div className="space-y-3">
                  <h4 className="text-[11px] font-extrabold text-indigo-400 uppercase tracking-widest flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5" /> Finder's Private Details (Truth)
                  </h4>
                  <div className="text-sm text-indigo-900 bg-indigo-50/60 p-5 rounded-2xl border border-indigo-200/60 shadow-inner leading-relaxed">
                    {claim.post?.privateDetails?.details || <span className="text-indigo-400 italic">No private details provided by finder.</span>}
                  </div>
                </div>
              </div>

              <div className="pt-4 mt-4 border-t border-stone-100">
                <ChatWidget claimId={claim.id} />
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-end space-y-3 sm:space-y-0 sm:space-x-4 pt-6 border-t border-stone-100">
                {claim.status === "submitted" && (
                  <>
                    <button
                      onClick={() => handleAction(claim.id, "reject")}
                      className="w-full sm:w-auto px-6 py-3.5 bg-white border-2 border-red-100 hover:border-red-300 hover:bg-red-50 text-red-700 rounded-2xl text-sm font-bold flex items-center justify-center space-x-2 transition-all active:scale-[0.98]"
                    >
                      <X className="w-5 h-5" />
                      <span>Reject Claim</span>
                    </button>
                    <button
                      onClick={() => handleAction(claim.id, "approve")}
                      className="w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white rounded-2xl text-sm font-bold flex items-center justify-center space-x-2 shadow-[0_0_20px_-5px_rgba(79,70,229,0.4)] transition-all active:scale-[0.98]"
                    >
                      <Check className="w-5 h-5 text-indigo-200" />
                      <span>Approve Claim</span>
                    </button>
                  </>
                )}
                {claim.status === "approved" && (
                  <button
                    onClick={() => setHandoverModal({ claimId: claim.id, claimantName: claim.owner?.fullName })}
                    className="w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-2xl text-sm font-bold flex items-center justify-center space-x-2 shadow-[0_0_20px_-5px_rgba(37,99,235,0.4)] transition-all active:scale-[0.98]"
                  >
                    <Handshake className="w-5 h-5 text-blue-200" />
                    <span>Log Handover</span>
                  </button>
                )}
                {claim.status === "completed" && (
                  <div className="px-5 py-2.5 bg-emerald-50 text-emerald-700 rounded-2xl border border-emerald-200/60 text-sm font-bold flex items-center shadow-sm">
                    <Check className="w-4 h-4 mr-1.5" />
                    Handover Completed
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Handover Modal */}
      {handoverModal && (
        <div className="fixed inset-0 z-[100] bg-stone-900/60 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <form onSubmit={handleCompleteHandover} className="bg-white rounded-[2rem] shadow-2xl max-w-lg w-full p-8 space-y-6 animate-in zoom-in-95 duration-200 border border-stone-200">
            <div>
              <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-4 border border-blue-100">
                <Handshake className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-extrabold text-stone-900">Log Physical Handover</h2>
              <p className="text-sm text-stone-500 mt-1 font-medium">Verify the claimant's physical ID at the LGU desk.</p>
            </div>

            <div className="space-y-4 pt-4 border-t border-stone-100">
              <div>
                <label className="block text-xs font-bold text-stone-500 mb-1.5 uppercase tracking-wider ml-1">Claimant Name (on ID)</label>
                <input type="text" required value={handoverModal.claimantName} onChange={e => setHandoverModal({ ...handoverModal, claimantName: e.target.value })} className="w-full px-4 py-3 text-sm rounded-2xl border-2 border-stone-100 focus:border-blue-600 focus:bg-white bg-stone-50 outline-hidden transition-all shadow-inner" />
              </div>
              <div>
                <label className="block text-xs font-bold text-stone-500 mb-1.5 uppercase tracking-wider ml-1">ID Type Presented</label>
                <select required value={handoverModal.claimantIdType || ""} onChange={e => setHandoverModal({ ...handoverModal, claimantIdType: e.target.value })} className="w-full px-4 py-3 text-sm rounded-2xl border-2 border-stone-100 focus:border-blue-600 focus:bg-white bg-stone-50 outline-hidden transition-all shadow-inner font-medium">
                  <option value="">Select ID...</option>
                  <option value="National ID">National ID</option>
                  <option value="Driver's License">Driver's License</option>
                  <option value="Passport">Passport</option>
                  <option value="Postal ID">Postal ID</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-stone-500 mb-1.5 uppercase tracking-wider ml-1">Verification Questions Asked</label>
                <input type="text" required value={handoverModal.questionsAsked || ""} onChange={e => setHandoverModal({ ...handoverModal, questionsAsked: e.target.value })} placeholder="e.g. Asked what was inside the pocket" className="w-full px-4 py-3 text-sm rounded-2xl border-2 border-stone-100 focus:border-blue-600 focus:bg-white bg-stone-50 outline-hidden transition-all shadow-inner" />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-3 pt-6">
              <button type="button" onClick={() => setHandoverModal(null)} className="w-full sm:w-auto px-6 py-3.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-2xl text-sm font-bold transition-colors">Cancel</button>
              <button type="submit" className="w-full sm:w-auto px-8 py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-sm font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20 active:scale-[0.98] transition-all"><Handshake className="w-5 h-5" /> <span>Confirm Handover</span></button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
