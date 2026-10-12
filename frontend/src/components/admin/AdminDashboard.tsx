import React, { useState, useEffect } from "react";
import { useApp } from "../../context/AppContext";
import { 
  ShieldCheck, 
  AlertCircle, 
  Check, 
  X, 
  ShieldAlert, 
  RefreshCw, 
  LayoutDashboard, 
  Package, 
  MapPin, 
  HardDrive, 
  Tag, 
  Layers, 
  DollarSign, 
  User, 
  ArrowRight,
  PlusCircle,
  Eye,
  CheckCircle2,
  Share2
} from "lucide-react";

export const AdminDashboard: React.FC = () => {
  const { 
    user, 
    foundItems, 
    verifyFoundItem, 
    publishFoundItem,
    setIsRegisterModalOpen 
  } = useApp();

  const [queue, setQueue] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<"all" | "received" | "verified">("all");
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  const fetchQueue = () => {
    setLoading(true);
    // If user has token, fetch real queue from server
    if (user?.token) {
      fetch("/api/admin/review-queue", {
        headers: { "Authorization": `Bearer ${user.token}` }
      })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setQueue(data);
          setLoading(false);
          return;
        }
        // Fallback to local items in received / verified status
        loadFromContext();
      })
      .catch(() => loadFromContext());
    } else {
      loadFromContext();
    }
  };

  const loadFromContext = () => {
    const pendingItems = foundItems.filter(item => 
      item.status === "received" || item.status === "verified" || item.status === "pending_review"
    );
    setQueue(pendingItems);
    setLoading(false);
  };

  useEffect(() => {
    fetchQueue();
  }, [foundItems, user?.token]);

  const handleVerify = async (itemId: string) => {
    try {
      if (user?.token) {
        await fetch(`/api/admin/posts/${itemId}/verify`, {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            "Authorization": `Bearer ${user.token}` 
          },
          body: JSON.stringify({ note: "Verified physical characteristics & custody at Guidance Desk" })
        });
      }
      verifyFoundItem(itemId, user?.fullName || "Guidance Officer");
      setFeedbackMsg(`Item #${itemId} successfully verified! Now ready for publication.`);
      setTimeout(() => setFeedbackMsg(null), 3500);
    } catch (e) {
      verifyFoundItem(itemId, user?.fullName || "Guidance Officer");
    }
  };

  const handlePublish = async (itemId: string) => {
    try {
      if (user?.token) {
        await fetch(`/api/admin/posts/${itemId}/publish`, {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            "Authorization": `Bearer ${user.token}` 
          },
          body: JSON.stringify({ note: "Approved and published to public student feed" })
        });
      }
      publishFoundItem(itemId, user?.fullName || "Guidance Officer");
      setFeedbackMsg(`Item #${itemId} is now live and published in student search!`);
      setTimeout(() => setFeedbackMsg(null), 3500);
    } catch (e) {
      publishFoundItem(itemId, user?.fullName || "Guidance Officer");
    }
  };

  const filteredQueue = queue.filter(item => {
    if (filterStatus === "all") return true;
    if (filterStatus === "received") return item.status === "received" || item.status === "pending_review";
    if (filterStatus === "verified") return item.status === "verified";
    return true;
  });

  return (
    <div className="w-full space-y-6 sm:space-y-8 animate-in fade-in duration-500 pb-8">
      {/* Header Section */}
      <div className="relative overflow-hidden rounded-[2.5rem] bg-stone-950 text-white p-8 sm:p-10 shadow-2xl border border-stone-800/60 group">
        <div className="absolute top-0 right-0 -mt-20 -mr-20 w-96 h-96 bg-blue-600/20 rounded-full blur-[80px] pointer-events-none group-hover:bg-blue-500/30 transition-all duration-700" />
        <div className="absolute bottom-0 left-1/4 -mb-20 w-80 h-80 bg-indigo-600/20 rounded-full blur-[80px] pointer-events-none group-hover:bg-indigo-500/30 transition-all duration-700" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center space-x-2 px-3 py-1 mb-4 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-xs font-bold text-blue-300 uppercase tracking-widest shadow-inner">
              <ShieldCheck className="w-4 h-4 text-blue-400" />
              <span>Guidance Personnel Console</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white via-blue-100 to-stone-400 tracking-tight">
              Intake & Verification Queue
            </h1>
            <p className="text-stone-300/80 text-sm sm:text-base mt-2 max-w-2xl font-medium leading-relaxed">
              Supervise surrendered property. Verify custody, inspect condition, and approve items through the strict status workflow:
              <span className="font-bold text-white block mt-1">
                Received ➔ Verified ➔ Published ➔ Claim Pending ➔ Released
              </span>
            </p>
          </div>
          
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              onClick={() => setIsRegisterModalOpen(true)}
              className="px-5 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-2xl text-xs sm:text-sm font-bold flex items-center justify-center space-x-2 shadow-lg shadow-blue-600/30 transition-all active:scale-95"
            >
              <PlusCircle className="w-4 h-4" />
              <span>+ Record New Intake</span>
            </button>
            <button
              onClick={fetchQueue}
              disabled={loading}
              className="px-4 py-3.5 bg-white/10 hover:bg-white/20 text-white rounded-2xl text-xs sm:text-sm font-bold flex items-center justify-center space-x-2 backdrop-blur-md transition-all border border-white/10 active:scale-95 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-blue-300" : "text-blue-200"}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>
      </div>

      {/* Lifecycle Flow Ribbon */}
      <div className="bg-white/80 backdrop-blur-md border border-stone-200/80 rounded-2xl p-4 shadow-xs">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
          <div className="font-bold text-stone-700 flex items-center gap-2">
            <Layers className="w-4 h-4 text-blue-700" />
            <span>Strict Status Model:</span>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 text-[11px] font-bold">
            <span className="px-3 py-1 rounded-xl bg-amber-100 text-amber-900 border border-amber-300">
              1. Received
            </span>
            <ArrowRight className="w-3.5 h-3.5 text-stone-400" />
            <span className="px-3 py-1 rounded-xl bg-blue-100 text-blue-900 border border-blue-300">
              2. Verified
            </span>
            <ArrowRight className="w-3.5 h-3.5 text-stone-400" />
            <span className="px-3 py-1 rounded-xl bg-emerald-100 text-emerald-900 border border-emerald-300">
              3. Published
            </span>
            <ArrowRight className="w-3.5 h-3.5 text-stone-400" />
            <span className="px-3 py-1 rounded-xl bg-purple-100 text-purple-900 border border-purple-300">
              4. Claim Pending
            </span>
            <ArrowRight className="w-3.5 h-3.5 text-stone-400" />
            <span className="px-3 py-1 rounded-xl bg-stone-900 text-white border border-stone-800">
              5. Released (Final)
            </span>
          </div>
        </div>
      </div>

      {feedbackMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-bold rounded-2xl flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{feedbackMsg}</span>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center space-x-2 border-b border-stone-200 pb-3">
        <button
          onClick={() => setFilterStatus("all")}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all ${
            filterStatus === "all"
              ? "bg-stone-900 text-white shadow-xs"
              : "bg-white text-stone-600 hover:bg-stone-100 border border-stone-200"
          }`}
        >
          All Queue ({queue.length})
        </button>
        <button
          onClick={() => setFilterStatus("received")}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all ${
            filterStatus === "received"
              ? "bg-amber-600 text-white shadow-xs"
              : "bg-white text-stone-600 hover:bg-stone-100 border border-stone-200"
          }`}
        >
          Pending Verification ({queue.filter(i => i.status === "received" || i.status === "pending_review").length})
        </button>
        <button
          onClick={() => setFilterStatus("verified")}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all ${
            filterStatus === "verified"
              ? "bg-blue-700 text-white shadow-xs"
              : "bg-white text-stone-600 hover:bg-stone-100 border border-stone-200"
          }`}
        >
          Ready to Publish ({queue.filter(i => i.status === "verified").length})
        </button>
      </div>

      {loading ? (
        <div className="py-20 text-center flex flex-col items-center justify-center animate-pulse">
          <div className="w-16 h-16 rounded-full bg-blue-100/50 flex items-center justify-center mb-4">
             <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
          </div>
          <p className="text-stone-500 font-medium">Checking intake queue...</p>
        </div>
      ) : filteredQueue.length === 0 ? (
        <div className="bg-white/70 backdrop-blur-xl border border-stone-200/80 rounded-[2.5rem] p-16 text-center space-y-6 shadow-xs flex flex-col items-center justify-center">
          <div className="w-20 h-20 rounded-full bg-stone-100 flex items-center justify-center mx-auto shadow-inner border border-stone-200">
            <CheckCircle2 className="w-10 h-10 text-emerald-600" />
          </div>
          <div>
            <h3 className="text-2xl font-extrabold text-stone-900">All Queue Items Processed!</h3>
            <p className="text-sm text-stone-500 max-w-md mx-auto mt-2 font-medium">
              No items currently require intake verification or publication approval.
            </p>
          </div>
          <button
            onClick={() => setIsRegisterModalOpen(true)}
            className="px-6 py-3 bg-stone-900 text-white text-xs font-bold rounded-xl hover:bg-stone-800 transition-all shadow-sm"
          >
            + Record New Surrendered Item
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {filteredQueue.map(item => {
            const isReceived = item.status === "received" || item.status === "pending_review";
            const isVerified = item.status === "verified";

            return (
              <div 
                key={item.id} 
                className="bg-white/80 backdrop-blur-xl border border-stone-200/80 hover:border-blue-300 rounded-[2.5rem] shadow-sm hover:shadow-xl transition-all duration-300 p-6 sm:p-8 space-y-6 group"
              >
                {/* Item Top Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-stone-100 pb-4 gap-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="font-mono font-bold text-stone-500 text-xs bg-stone-100 px-2.5 py-1 rounded-lg">
                      #{item.id}
                    </span>
                    <h3 className="text-xl font-extrabold text-stone-900">
                      {item.title || `${item.color} ${item.category}`}
                    </h3>

                    {/* Status Badge */}
                    <span className={`px-3 py-1 rounded-xl text-[10px] font-extrabold uppercase tracking-widest shadow-2xs border ${
                      isReceived 
                        ? "bg-amber-50 text-amber-800 border-amber-300"
                        : isVerified
                        ? "bg-blue-50 text-blue-800 border-blue-300"
                        : "bg-emerald-50 text-emerald-800 border-emerald-300"
                    }`}>
                      Stage: {item.status?.replace("_", " ")}
                    </span>
                  </div>

                  <div className="text-xs text-stone-500 sm:text-right font-medium">
                    <span>Intake Date: {new Date(item.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>

                {/* Intake Metadata Pills */}
                <div className="flex flex-wrap gap-2 text-xs">
                  <span className="px-3 py-1 rounded-xl bg-stone-100 text-stone-800 font-bold border border-stone-200 flex items-center gap-1.5">
                    <Layers className="w-3 h-3 text-stone-600" />
                    Condition: <strong className="text-stone-900">{item.condition || "Good"}</strong>
                  </span>

                  <span className="px-3 py-1 rounded-xl bg-emerald-50 text-emerald-800 font-bold border border-emerald-200 flex items-center gap-1.5">
                    <DollarSign className="w-3 h-3 text-emerald-600" />
                    Value: <strong className="text-emerald-900">{item.estimatedValueBand || "Medium"}</strong>
                  </span>

                  <span className="px-3 py-1 rounded-xl bg-purple-50 text-purple-800 font-bold border border-purple-200 flex items-center gap-1.5">
                    <ShieldCheck className="w-3 h-3 text-purple-600" />
                    Handling: <strong className="text-purple-900">{item.specialHandlingType || "Standard"}</strong>
                  </span>

                  <span className="px-3 py-1 rounded-xl bg-blue-50 text-blue-800 font-bold border border-blue-200 flex items-center gap-1.5">
                    <HardDrive className="w-3 h-3 text-blue-600" />
                    Storage: <strong className="text-blue-900">{item.storageLocation || (item.storageBoxId ? `${item.storageBoxId}:${item.storageSlotId}` : "Custody")}</strong>
                  </span>

                  <span className="px-3 py-1 rounded-xl bg-stone-50 text-stone-700 font-medium border border-stone-200 flex items-center gap-1.5">
                    <MapPin className="w-3 h-3 text-stone-500" />
                    Found at: <strong>{item.locationFound || item.areaFound || "Campus"}</strong>
                  </span>
                </div>

                {/* Content Comparison Cards */}
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Public Description */}
                  <div className="space-y-2">
                    <h4 className="text-[11px] font-extrabold text-stone-500 uppercase tracking-widest flex items-center gap-1.5">
                      <Eye className="w-3.5 h-3.5 text-blue-600" /> Public Description (Live in Search)
                    </h4>
                    <div className="text-sm text-stone-800 bg-stone-50 p-4 rounded-2xl border border-stone-200 leading-relaxed font-medium">
                      {item.publicDescription || item.description}
                    </div>
                  </div>

                  {/* Private Details (Confidential) */}
                  <div className="space-y-2">
                    <h4 className="text-[11px] font-extrabold text-indigo-700 uppercase tracking-widest flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" /> Private Verification Clues (Staff Eyes Only)
                    </h4>
                    <div className="text-sm text-indigo-950 bg-indigo-50/70 p-4 rounded-2xl border border-indigo-200/80 leading-relaxed font-medium">
                      {item.privateVerificationNotes || item.privateDetails?.details || item.identifyingCharacteristics || "No private details logged."}
                    </div>
                  </div>
                </div>

                {/* Finder Information Bar (Captured Manually) */}
                <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div className="flex items-center space-x-2 text-amber-900 font-medium">
                    <User className="w-4 h-4 text-amber-700 shrink-0" />
                    <span>
                      Finder (Manual Intake): <strong className="font-bold">{item.finderName || item.surrenderedBy || "Anonymous Finder"}</strong>
                      {item.finderType && <span className="text-amber-700 ml-1">({item.finderType})</span>}
                      {item.finderContact && <span className="text-stone-500 ml-2">• Contact: {item.finderContact}</span>}
                    </span>
                  </div>
                  {item.finderNotes && (
                    <span className="text-amber-800/90 italic text-[11px]">
                      Notes: {item.finderNotes}
                    </span>
                  )}
                </div>

                {/* Action Bar */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-stone-100">
                  <div className="text-xs text-stone-500 font-medium">
                    {isReceived && "Action needed: Inspect item physically & verify custody."}
                    {isVerified && "Verified! Next step: Publish to student search."}
                  </div>

                  <div className="flex items-center space-x-3 w-full sm:w-auto">
                    {isReceived && (
                      <button
                        onClick={() => handleVerify(item.id)}
                        className="w-full sm:w-auto px-6 py-3 bg-blue-700 hover:bg-blue-800 text-white rounded-xl text-xs font-bold flex items-center justify-center space-x-2 shadow-md shadow-blue-700/20 transition-all active:scale-95"
                      >
                        <ShieldCheck className="w-4 h-4" />
                        <span>Verify Physical Item (Step 2)</span>
                      </button>
                    )}

                    {isVerified && (
                      <button
                        onClick={() => handlePublish(item.id)}
                        className="w-full sm:w-auto px-6 py-3 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold flex items-center justify-center space-x-2 shadow-md shadow-emerald-700/20 transition-all active:scale-95"
                      >
                        <Share2 className="w-4 h-4" />
                        <span>Approve & Publish to Feed (Step 3)</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
