import React, { useState, useEffect } from "react";
import { useApp } from "../../context/AppContext";
import { ShieldCheck, Package, RefreshCw, Search, LayoutDashboard } from "lucide-react";

export const AdminInventory: React.FC = () => {
  const { user } = useApp();
  const [inventory, setInventory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchInventory = () => {
    setLoading(true);
    fetch("/api/admin/inventory", {
      headers: { "Authorization": `Bearer ${user?.token}` }
    })
    .then(res => res.json())
    .then(data => {
      setInventory(data);
      setLoading(false);
    })
    .catch(err => {
      console.error(err);
      setLoading(false);
    });
  };

  useEffect(() => {
    fetchInventory();
  }, [user?.token]);

  return (
    <div className="w-full space-y-6 sm:space-y-8 animate-in fade-in duration-700 pb-8 relative">
      {/* Header Section */}
      <div className="relative overflow-hidden rounded-[2rem] bg-stone-950 text-white p-8 sm:p-10 shadow-2xl border border-stone-800/60 group">
        <div className="absolute top-0 right-0 -mt-20 -mr-20 w-96 h-96 bg-amber-600/20 rounded-full blur-[80px] pointer-events-none group-hover:bg-amber-500/30 transition-all duration-700" />
        <div className="absolute bottom-0 left-1/4 -mb-20 w-80 h-80 bg-orange-600/20 rounded-full blur-[80px] pointer-events-none group-hover:bg-orange-500/30 transition-all duration-700" />
        
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 relative z-10">
          <div>
            <div className="inline-flex items-center space-x-2 px-3 py-1 mb-4 rounded-full bg-white/5 backdrop-blur-md border border-white/10 text-xs font-semibold text-amber-300 shadow-inner">
              <Package className="w-4 h-4 text-amber-400" />
              <span>LGU Storage</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white via-amber-100 to-stone-400 tracking-tight">
              Active Inventory
            </h1>
            <p className="text-stone-300/80 text-sm sm:text-base mt-2 max-w-xl font-medium">
              View all approved found items that are currently available for claiming.
            </p>
          </div>
          <button
            onClick={fetchInventory}
            disabled={loading}
            className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-2xl text-sm font-bold flex items-center space-x-2 transition-all backdrop-blur-md border border-white/10 shadow-lg active:scale-95 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh Inventory</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center flex flex-col items-center justify-center animate-pulse">
          <div className="w-16 h-16 rounded-full bg-amber-100/50 flex items-center justify-center mb-4">
             <Package className="w-8 h-8 text-amber-500 animate-pulse" />
          </div>
          <p className="text-stone-500 font-medium">Loading inventory...</p>
        </div>
      ) : inventory.length === 0 ? (
        <div className="bg-white/70 backdrop-blur-xl border border-stone-200/80 rounded-[2rem] p-16 text-center space-y-6 shadow-sm flex flex-col items-center justify-center">
          <div className="w-24 h-24 rounded-full bg-stone-50 flex items-center justify-center mx-auto shadow-inner border border-stone-100">
            <Package className="w-10 h-10 text-stone-300" />
          </div>
          <div>
            <h3 className="text-2xl font-extrabold text-stone-900">No Items Available</h3>
            <p className="text-base text-stone-500 max-w-md mx-auto mt-2 font-medium">
              The LGU inventory is currently empty.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {inventory.map(post => (
            <div key={post.id} className="bg-white/80 backdrop-blur-xl border border-stone-200/80 hover:border-amber-300 rounded-[2rem] shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col group">
              <div className="relative aspect-video bg-stone-100 flex items-center justify-center overflow-hidden border-b border-stone-100">
                {post.imageUrl ? (
                  <img src={post.imageUrl} alt={post.category} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                ) : (
                  <Search className="w-8 h-8 text-stone-300 group-hover:scale-110 transition-transform duration-700" />
                )}
                <div className="absolute top-4 right-4 px-3 py-1.5 bg-white/90 backdrop-blur-md rounded-xl text-[10px] font-extrabold text-stone-700 uppercase shadow-lg tracking-widest border border-white/20">
                  AVAILABLE
                </div>
              </div>
              <div className="p-6 flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-3">
                  <span className="text-[10px] font-bold text-amber-800 uppercase tracking-widest bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-100">#{post.id.slice(-6)}</span>
                  <span className="text-[10px] text-stone-500 font-medium">{new Date(post.createdAt).toLocaleDateString()}</span>
                </div>
                <h3 className="text-lg font-extrabold text-stone-900 capitalize mb-2">{post.title || `${post.color} ${post.category}`}</h3>
                <p className="text-sm text-stone-600 line-clamp-2 first-letter:capitalize mb-6 font-medium leading-relaxed">{post.publicDescription}</p>
                
                <div className="mt-auto pt-5 border-t border-stone-100/80">
                  <div className="flex items-center justify-between text-[11px] text-stone-500 font-medium mb-1.5">
                    <span>Found by:</span>
                    <span className="font-bold text-stone-700">{post.finder?.fullName || 'Unknown'}</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-stone-500 font-medium">
                    <span>Location:</span>
                    <span className="capitalize font-bold text-stone-700">{post.areaFound || 'Unknown'}</span>
                  </div>
                  {post.claims && post.claims.length > 0 && (
                    <div className="mt-4 px-4 py-2.5 bg-gradient-to-r from-amber-50 to-orange-50 text-amber-800 rounded-xl text-[11px] font-extrabold text-center border border-amber-200/60 shadow-inner tracking-wide uppercase">
                      {post.claims.length} Claim Request(s)
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
