import React, { useState, useEffect } from "react";
import { useApp } from "../../context/AppContext";
import { ShieldCheck, AlertCircle, Check, X, ShieldAlert, RefreshCw, LayoutDashboard } from "lucide-react";

export const AdminDashboard: React.FC = () => {
  const { user, foundItems, setFoundItems } = useApp();
  const [queue, setQueue] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Mocking a network delay for the queue
    setLoading(true);
    const timer = setTimeout(() => {
      // For demonstration, we'll consider items with status "available" as pending review
      // in a real app, they would have a "pending_review" status first.
      const pendingItems = foundItems.map(item => ({
        id: item.id,
        category: item.category,
        color: item.color,
        createdAt: item.createdAt,
        finder: { fullName: item.surrenderedBy },
        publicDescription: item.description,
        privateDetails: { details: item.brand ? `Brand is ${item.brand}. Has some specific markings.` : 'No private details provided.' },
        flags: item.description.toLowerCase().includes('iphone') ? [{ id: 1, detail: 'Contains potentially sensitive brand/model information' }] : []
      }));
      setQueue(pendingItems.slice(0, 2)); // Just show a couple for the queue
      setLoading(false);
    }, 800);
    return () => clearTimeout(timer);
  }, [foundItems]);

  const handleAction = (postId: string, action: "approve" | "reject") => {
    if (!confirm(`Are you sure you want to ${action} this post?`)) return;
    
    // Optimistic UI update
    setQueue(prev => prev.filter(item => item.id !== postId));
    alert(`Post ${action}d successfully!`);
  };

  return (
    <div className="w-full space-y-6 sm:space-y-8 animate-in fade-in duration-700 pb-8">
      {/* Header Section */}
      <div className="relative overflow-hidden rounded-[2rem] bg-stone-950 text-white p-8 sm:p-10 shadow-2xl border border-stone-800/60 group">
        <div className="absolute top-0 right-0 -mt-20 -mr-20 w-96 h-96 bg-indigo-600/20 rounded-full blur-[80px] pointer-events-none group-hover:bg-indigo-500/30 transition-all duration-700" />
        <div className="absolute bottom-0 left-1/4 -mb-20 w-80 h-80 bg-blue-600/20 rounded-full blur-[80px] pointer-events-none group-hover:bg-blue-500/30 transition-all duration-700" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center space-x-2 px-3 py-1 mb-4 rounded-full bg-white/5 backdrop-blur-md border border-white/10 text-xs font-semibold text-indigo-300 shadow-inner">
              <ShieldCheck className="w-4 h-4 text-indigo-400" />
              <span>LGU Administrator</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white via-indigo-100 to-stone-400 tracking-tight">
              Review Queue
            </h1>
            <p className="text-stone-300/80 text-sm sm:text-base mt-2 max-w-xl font-medium">
              Review newly submitted found items. Check for sensitive details before approving to public search.
            </p>
          </div>
          
          <button
            onClick={() => setLoading(true)}
            disabled={loading}
            className="px-6 py-3.5 bg-white/10 hover:bg-white/20 text-white rounded-2xl text-sm font-bold flex items-center justify-center space-x-2 backdrop-blur-md transition-all border border-white/10 active:scale-95 disabled:opacity-50 shrink-0 shadow-lg"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-indigo-300" : "text-indigo-200"}`} />
            <span>Refresh Queue</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center flex flex-col items-center justify-center animate-pulse">
          <div className="w-16 h-16 rounded-full bg-indigo-100/50 flex items-center justify-center mb-4">
             <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin" />
          </div>
          <p className="text-stone-500 font-medium">Loading queue items...</p>
        </div>
      ) : queue.length === 0 ? (
        <div className="bg-white/70 backdrop-blur-xl border border-stone-200/80 rounded-[2rem] p-16 text-center space-y-6 shadow-sm flex flex-col items-center justify-center">
          <div className="w-24 h-24 rounded-full bg-stone-50 flex items-center justify-center mx-auto shadow-inner border border-stone-100">
            <LayoutDashboard className="w-10 h-10 text-stone-300" />
          </div>
          <div>
            <h3 className="text-2xl font-extrabold text-stone-900">Queue is Empty</h3>
            <p className="text-base text-stone-500 max-w-md mx-auto mt-2 font-medium">
              All submitted posts have been reviewed! Excellent work keeping the portal clean.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {queue.map(post => (
            <div key={post.id} className="bg-white/80 backdrop-blur-xl border border-stone-200/80 hover:border-indigo-300 rounded-[2rem] shadow-sm hover:shadow-xl transition-all duration-300 p-6 sm:p-8 space-y-6 group">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-stone-100 pb-4 gap-4">
                <div className="flex items-center space-x-3">
                  <span className="font-mono font-bold text-stone-400 text-sm bg-stone-100 px-2 py-1 rounded-lg">#{post.id.slice(-6)}</span>
                  <h3 className="text-xl font-extrabold text-stone-900">{post.category} - {post.color}</h3>
                  <span className="px-3 py-1.5 rounded-xl bg-amber-50 text-amber-700 border border-amber-200/60 text-[10px] font-extrabold uppercase tracking-widest shadow-xs">
                    Pending Review
                  </span>
                </div>
                <div className="text-xs text-stone-500 sm:text-right flex flex-col gap-1 bg-stone-50 p-2 sm:p-0 sm:bg-transparent rounded-lg">
                  <p>Submitted by: <span className="font-semibold text-stone-700">{post.finder?.fullName || 'Unknown'}</span></p>
                  <p className="font-mono text-[11px]">{new Date(post.createdAt).toLocaleString()}</p>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <h4 className="text-[11px] font-extrabold text-stone-400 uppercase tracking-widest">Public Description</h4>
                  <div className="text-sm text-stone-700 bg-stone-50/80 p-5 rounded-2xl border border-stone-200/60 shadow-inner leading-relaxed">
                    {post.publicDescription}
                  </div>
                </div>
                <div className="space-y-3">
                  <h4 className="text-[11px] font-extrabold text-indigo-400 uppercase tracking-widest flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5" /> Private Details (Hidden)
                  </h4>
                  <div className="text-sm text-indigo-900 bg-indigo-50/60 p-5 rounded-2xl border border-indigo-200/60 shadow-inner leading-relaxed">
                    {post.privateDetails?.details || <span className="text-indigo-400 italic">No private details provided.</span>}
                  </div>
                </div>
              </div>

              {post.flags && post.flags.length > 0 && (
                <div className="p-5 bg-red-50/80 backdrop-blur-sm rounded-2xl border border-red-200/60 space-y-3 shadow-inner">
                  <h4 className="text-xs font-extrabold text-red-800 flex items-center gap-1.5 uppercase tracking-widest">
                    <ShieldAlert className="w-4 h-4" /> Sensitive Content Flags
                  </h4>
                  <ul className="list-disc pl-5 space-y-1.5">
                    {post.flags.map((flag: any) => (
                      <li key={flag.id} className="text-sm text-red-700 font-medium">{flag.detail}</li>
                    ))}
                  </ul>
                  <p className="text-xs text-red-600/80 mt-2 font-medium">
                    Review the public description. If it contains serial numbers, IDs, or full names, reject the post and tell the user to put them in the private section!
                  </p>
                </div>
              )}

              <div className="flex flex-col sm:flex-row items-center justify-end space-y-3 sm:space-y-0 sm:space-x-4 pt-4 border-t border-stone-100">
                <button
                  onClick={() => handleAction(post.id, "reject")}
                  className="w-full sm:w-auto px-6 py-3.5 bg-white border-2 border-red-100 hover:border-red-300 hover:bg-red-50 text-red-700 rounded-2xl text-sm font-bold flex items-center justify-center space-x-2 transition-all active:scale-[0.98]"
                >
                  <X className="w-5 h-5" />
                  <span>Reject Post</span>
                </button>
                <button
                  onClick={() => handleAction(post.id, "approve")}
                  className="w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white rounded-2xl text-sm font-bold flex items-center justify-center space-x-2 shadow-[0_0_20px_-5px_rgba(79,70,229,0.4)] transition-all active:scale-[0.98]"
                >
                  <Check className="w-5 h-5 text-indigo-200" />
                  <span>Approve & Publish</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

