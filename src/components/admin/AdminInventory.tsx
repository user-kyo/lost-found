import React, { useState, useEffect } from "react";
import { useApp } from "../../context/AppContext";
import { ShieldCheck, Package, RefreshCw, Search } from "lucide-react";

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
    <div className="w-full space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-200 uppercase tracking-wider">
              LGU Storage
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight mt-1">
            Active Inventory
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 mt-0.5">
            View all approved found items that are currently available for claiming.
          </p>
        </div>
        <button
          onClick={fetchInventory}
          disabled={loading}
          className="px-4 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-sm font-bold flex items-center space-x-2 transition-colors border border-stone-200 active:scale-95 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          <span>Refresh Inventory</span>
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-stone-500">Loading inventory...</div>
      ) : inventory.length === 0 ? (
        <div className="bg-white border border-stone-200 rounded-3xl p-12 text-center space-y-4">
          <Package className="w-12 h-12 text-stone-300 mx-auto" />
          <h3 className="text-lg font-bold text-stone-800">No Items Available</h3>
          <p className="text-sm text-stone-500">The LGU inventory is currently empty.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {inventory.map(post => (
            <div key={post.id} className="bg-white border border-stone-200 rounded-2xl shadow-sm overflow-hidden flex flex-col group">
              <div className="relative aspect-video bg-stone-100 flex items-center justify-center overflow-hidden">
                {post.imageUrl ? (
                  <img src={post.imageUrl} alt={post.category} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                ) : (
                  <Search className="w-8 h-8 text-stone-300" />
                )}
                <div className="absolute top-2 right-2 px-2 py-0.5 bg-white/90 backdrop-blur-md rounded-md text-[10px] font-bold text-stone-700 uppercase shadow-xs">
                  AVAILABLE
                </div>
              </div>
              <div className="p-5 flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">#{post.id.slice(-6)}</span>
                  <span className="text-[10px] text-stone-500">{new Date(post.createdAt).toLocaleDateString()}</span>
                </div>
                <h3 className="text-base font-bold text-stone-900 capitalize mb-1">{post.title || `${post.color} ${post.category}`}</h3>
                <p className="text-xs text-stone-600 line-clamp-2 first-letter:capitalize mb-4">{post.publicDescription}</p>
                
                <div className="mt-auto pt-4 border-t border-stone-100">
                  <p className="text-[10px] text-stone-500 font-medium">Found by: <span className="font-bold">{post.finder?.fullName || 'Unknown'}</span></p>
                  <p className="text-[10px] text-stone-500 font-medium mt-0.5">Location: <span className="capitalize font-bold">{post.areaFound || 'Unknown'}</span></p>
                  {post.claims && post.claims.length > 0 && (
                    <div className="mt-3 px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-lg text-xs font-bold text-center border border-indigo-100">
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
