import React, { useState, useEffect } from "react";
import { useApp } from "../../context/AppContext";
import { ShieldCheck, AlertCircle, Check, X, ShieldAlert } from "lucide-react";

export const AdminDashboard: React.FC = () => {
  const { user } = useApp();
  const [queue, setQueue] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchQueue = () => {
    setLoading(true);
    fetch("/api/admin/review-queue", {
      headers: { "Authorization": `Bearer ${user?.token}` }
    })
    .then(res => res.json())
    .then(data => {
      setQueue(data);
      setLoading(false);
    })
    .catch(err => {
      console.error(err);
      setLoading(false);
    });
  };

  useEffect(() => {
    fetchQueue();
  }, [user?.token]);

  const handleAction = async (postId: string, action: "approve" | "reject") => {
    if (!confirm(`Are you sure you want to ${action} this post?`)) return;
    
    try {
      const res = await fetch(`/api/admin/posts/${postId}/${action}`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${user?.token}` 
        },
        body: JSON.stringify({ note: `Admin ${action}d via dashboard.` })
      });
      if (res.ok) {
        alert(`Post ${action}d successfully!`);
        fetchQueue();
      } else {
        alert("Action failed.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="w-full space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-indigo-100 text-indigo-900 border border-indigo-200 uppercase tracking-wider">
              LGU Administrator
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight mt-1">
            Review Queue
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 mt-0.5">
            Review newly submitted found items. Check for sensitive details before approving to public search.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-stone-500">Loading queue...</div>
      ) : queue.length === 0 ? (
        <div className="bg-white border border-stone-200 rounded-3xl p-12 text-center space-y-4">
          <ShieldCheck className="w-12 h-12 text-stone-300 mx-auto" />
          <h3 className="text-lg font-bold text-stone-800">Queue is Empty</h3>
          <p className="text-sm text-stone-500">All submitted posts have been reviewed!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {queue.map(post => (
            <div key={post.id} className="bg-white border border-stone-200 rounded-2xl shadow-sm p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                <div className="flex items-center space-x-3">
                  <span className="font-mono font-bold text-stone-500 text-sm">#{post.id.slice(-6)}</span>
                  <h3 className="text-lg font-bold text-stone-900">{post.category} - {post.color}</h3>
                  <span className="px-2 py-1 rounded bg-amber-100 text-amber-800 text-[10px] font-bold uppercase tracking-wider">
                    Pending Review
                  </span>
                </div>
                <div className="text-xs text-stone-500 text-right">
                  <p>Submitted by: <span className="font-semibold">{post.finder?.fullName || 'Unknown'}</span></p>
                  <p>{new Date(post.createdAt).toLocaleString()}</p>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-stone-400 uppercase tracking-wider">Public Description</h4>
                  <p className="text-sm text-stone-700 bg-stone-50 p-4 rounded-xl border border-stone-200">
                    {post.publicDescription}
                  </p>
                </div>
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-stone-400 uppercase tracking-wider flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" /> Private Details (Hidden)
                  </h4>
                  <p className="text-sm text-stone-700 bg-indigo-50 p-4 rounded-xl border border-indigo-100">
                    {post.privateDetails?.details || "No private details provided."}
                  </p>
                </div>
              </div>

              {post.flags && post.flags.length > 0 && (
                <div className="p-4 bg-red-50 rounded-xl border border-red-200 space-y-2">
                  <h4 className="text-xs font-bold text-red-800 flex items-center gap-1 uppercase tracking-wider">
                    <ShieldAlert className="w-4 h-4" /> Sensitive Content Flags
                  </h4>
                  <ul className="list-disc pl-5 space-y-1">
                    {post.flags.map((flag: any) => (
                      <li key={flag.id} className="text-xs text-red-700 font-medium">{flag.detail}</li>
                    ))}
                  </ul>
                  <p className="text-xs text-red-600 mt-2">
                    Review the public description. If it contains serial numbers, IDs, or full names, reject the post and tell the user to put them in the private section!
                  </p>
                </div>
              )}

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-stone-100">
                <button
                  onClick={() => handleAction(post.id, "reject")}
                  className="px-6 py-2.5 bg-white border border-red-200 hover:bg-red-50 text-red-700 rounded-xl text-sm font-bold flex items-center space-x-2 transition-colors"
                >
                  <X className="w-4 h-4" />
                  <span>Reject Post</span>
                </button>
                <button
                  onClick={() => handleAction(post.id, "approve")}
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold flex items-center space-x-2 shadow-sm transition-colors"
                >
                  <Check className="w-4 h-4" />
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
