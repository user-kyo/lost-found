import React, { useState, useEffect } from "react";
import { useApp } from "../../context/AppContext";
import { ShieldCheck, MessageSquare, Check, X, FileText, User, Handshake } from "lucide-react";
import { ChatWidget } from "../common/ChatWidget";

export const AdminClaims: React.FC = () => {
  const { user } = useApp();
  const [claims, setClaims] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [handoverModal, setHandoverModal] = useState<any>(null);

  const fetchClaims = () => {
    setLoading(true);
    fetch("/api/admin/claims", {
      headers: { "Authorization": `Bearer ${user?.token}` }
    })
      .then(res => res.json())
      .then(data => {
        setClaims(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchClaims();
  }, [user?.token]);

  const handleAction = async (claimId: string, action: "approve" | "reject") => {
    if (!confirm(`Are you sure you want to ${action} this claim?`)) return;

    try {
      const res = await fetch(`/api/admin/claims/${claimId}/${action}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${user?.token}`
        }
      });
      if (res.ok) {
        alert(`Claim ${action}d successfully!`);
        fetchClaims();
      } else {
        alert("Action failed.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCompleteHandover = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`/api/admin/claims/${handoverModal.claimId}/complete`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${user?.token}`
        },
        body: JSON.stringify(handoverModal)
      });
      if (res.ok) {
        alert(`Handover complete and logged!`);
        setHandoverModal(null);
        fetchClaims();
      } else {
        alert("Action failed.");
      }
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <div className="w-full space-y-6 relative">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-indigo-100 text-indigo-900 border border-indigo-200 uppercase tracking-wider">
              LGU Administrator
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight mt-1">
            Claim Verification & Handover
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 mt-0.5">
            Verify citizen claims against private details. Log physical handovers when claimants arrive at the office.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-stone-500">Loading claims...</div>
      ) : claims.length === 0 ? (
        <div className="bg-white border border-stone-200 rounded-3xl p-12 text-center space-y-4">
          <ShieldCheck className="w-12 h-12 text-stone-300 mx-auto" />
          <h3 className="text-lg font-bold text-stone-800">No active claims</h3>
          <p className="text-sm text-stone-500">All claims have been processed or none have been submitted.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {claims.map(claim => (
            <div key={claim.id} className="bg-white border border-stone-200 rounded-2xl shadow-sm p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                <div className="flex items-center space-x-3">
                  <span className="font-mono font-bold text-stone-500 text-sm">CLAIM #{claim.id.slice(-6)}</span>
                  <h3 className="text-lg font-bold text-stone-900">{claim.post?.category} - {claim.post?.color}</h3>
                  <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${claim.status === "submitted" ? "bg-amber-100 text-amber-800" :
                      claim.status === "approved" ? "bg-blue-100 text-blue-800" :
                        claim.status === "completed" ? "bg-emerald-100 text-emerald-800" :
                          "bg-red-100 text-red-800"
                    }`}>
                    {claim.status.replace("_", " ")}
                  </span>
                </div>
                <div className="text-xs text-stone-500 text-right">
                  <p>Claimant: <span className="font-semibold">{claim.owner?.fullName || 'Unknown'}</span></p>
                  <p>{new Date(claim.createdAt).toLocaleString()}</p>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-stone-400 uppercase tracking-wider">Claimant's Proof of Ownership</h4>
                  <p className="text-sm text-stone-700 bg-stone-50 p-4 rounded-xl border border-stone-200">
                    {claim.ownerNote || "No details provided."}
                  </p>
                </div>
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-stone-400 uppercase tracking-wider flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" /> Finder's Private Details (Truth)
                  </h4>
                  <p className="text-sm text-stone-700 bg-indigo-50 p-4 rounded-xl border border-indigo-100">
                    {claim.post?.privateDetails?.details || "No private details provided by finder."}
                  </p>
                </div>
              </div>

              <div className="pt-4 mt-4 border-t border-stone-100">
                <ChatWidget claimId={claim.id} />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-stone-100">
                {claim.status === "submitted" && (
                  <>
                    <button
                      onClick={() => handleAction(claim.id, "reject")}
                      className="px-6 py-2.5 bg-white border border-red-200 hover:bg-red-50 text-red-700 rounded-xl text-sm font-bold flex items-center space-x-2 transition-colors"
                    >
                      <X className="w-4 h-4" />
                      <span>Reject Claim</span>
                    </button>
                    <button
                      onClick={() => handleAction(claim.id, "approve")}
                      className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold flex items-center space-x-2 shadow-sm transition-colors"
                    >
                      <Check className="w-4 h-4" />
                      <span>Approve Claim</span>
                    </button>
                  </>
                )}
                {claim.status === "approved" && (
                  <button
                    onClick={() => setHandoverModal({ claimId: claim.id, claimantName: claim.owner?.fullName })}
                    className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold flex items-center space-x-2 shadow-sm transition-colors"
                  >
                    <Handshake className="w-4 h-4" />
                    <span>Log Handover</span>
                  </button>
                )}
                {claim.status === "completed" && (
                  <span className="text-sm font-bold text-emerald-700">Handover Completed</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Handover Modal */}
      {handoverModal && (
        <div className="fixed inset-0 z-50 bg-stone-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleCompleteHandover} className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 space-y-4">
            <h2 className="text-xl font-bold text-stone-900 border-b border-stone-100 pb-2">Log Physical Handover</h2>
            <p className="text-xs text-stone-500">Verify the claimant's physical ID at the LGU desk.</p>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">Claimant Name (on ID)</label>
              <input type="text" required value={handoverModal.claimantName} onChange={e => setHandoverModal({ ...handoverModal, claimantName: e.target.value })} className="w-full px-3 py-2 text-sm border border-stone-200 rounded-lg" />
            </div>
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">ID Type Presented</label>
              <select required value={handoverModal.claimantIdType || ""} onChange={e => setHandoverModal({ ...handoverModal, claimantIdType: e.target.value })} className="w-full px-3 py-2 text-sm border border-stone-200 rounded-lg">
                <option value="">Select ID...</option>
                <option value="National ID">National ID</option>
                <option value="Driver's License">Driver's License</option>
                <option value="Passport">Passport</option>
                <option value="Postal ID">Postal ID</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">Verification Questions Asked</label>
              <input type="text" required value={handoverModal.questionsAsked || ""} onChange={e => setHandoverModal({ ...handoverModal, questionsAsked: e.target.value })} placeholder="e.g. Asked what was inside the pocket" className="w-full px-3 py-2 text-sm border border-stone-200 rounded-lg" />
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <button type="button" onClick={() => setHandoverModal(null)} className="px-4 py-2 border border-stone-200 rounded-lg text-sm font-bold">Cancel</button>
              <button type="submit" className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-bold flex items-center gap-1"><Handshake className="w-4 h-4" /> Confirm Handover</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
