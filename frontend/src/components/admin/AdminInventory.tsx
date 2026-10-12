import React, { useState, useEffect } from "react";
import { useApp } from "../../context/AppContext";
import { 
  Package, 
  RefreshCw, 
  Search, 
  PlusCircle, 
  Layers, 
  DollarSign, 
  HardDrive, 
  MapPin, 
  User, 
  ShieldCheck, 
  Filter,
  Clock,
  FileText
} from "lucide-react";
import { ItemStatus } from "../../types";
import { DispositionWorkflowModal } from "./DispositionWorkflowModal";

export const AdminInventory: React.FC = () => {
  const { user, foundItems, setIsRegisterModalOpen } = useApp();
  const [inventory, setInventory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedDispositionItem, setSelectedDispositionItem] = useState<any>(null);

  const fetchInventory = () => {
    setLoading(true);
    if (user?.token) {
      fetch("/api/admin/inventory", {
        headers: { "Authorization": `Bearer ${user.token}` }
      })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setInventory(data);
          setLoading(false);
          return;
        }
        loadFromContext();
      })
      .catch(() => loadFromContext());
    } else {
      loadFromContext();
    }
  };

  const loadFromContext = () => {
    setInventory(foundItems);
    setLoading(false);
  };

  useEffect(() => {
    fetchInventory();
  }, [user?.token, foundItems]);

  const filteredItems = inventory.filter(item => {
    const status = (item.status === "available" ? "published" : item.status) || "published";
    const matchesStatus = statusFilter === "all"
      ? true
      : statusFilter === "holding_lapsed"
      ? Boolean(item.holdingClocks?.isSchoolHoldingLapsed && !["released", "donated", "disposed", "turned_over"].includes(status))
      : status === statusFilter;
    const matchesSearch = (
      (item.title || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.category || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.publicDescription || item.description || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.locationFound || item.areaFound || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.id || "").toLowerCase().includes(searchQuery.toLowerCase())
    );
    return matchesStatus && matchesSearch;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "received":
      case "pending_review":
        return { label: "Received", classes: "bg-amber-100 text-amber-900 border-amber-300" };
      case "verified":
        return { label: "Verified", classes: "bg-blue-100 text-blue-900 border-blue-300" };
      case "published":
      case "available":
        return { label: "Published", classes: "bg-emerald-100 text-emerald-900 border-emerald-300" };
      case "claim_pending":
        return { label: "Claim Pending", classes: "bg-purple-100 text-purple-900 border-purple-300 animate-pulse" };
      case "released":
      case "returned":
        return { label: "Released (Final)", classes: "bg-stone-900 text-white border-stone-800" };
      case "donated":
        return { label: "Donated (Outreach)", classes: "bg-teal-100 text-teal-900 border-teal-300" };
      case "disposed":
        return { label: "Disposed / Recycled", classes: "bg-stone-800 text-stone-200 border-stone-700" };
      case "turned_over":
        return { label: "Turned Over (City)", classes: "bg-indigo-100 text-indigo-900 border-indigo-300" };
      default:
        return { label: status?.replace("_", " "), classes: "bg-stone-100 text-stone-700 border-stone-300" };
    }
  };

  return (
    <div className="w-full space-y-6 sm:space-y-8 animate-in fade-in duration-500 pb-8 relative">
      {/* Header Section */}
      <div className="relative overflow-hidden rounded-[2.5rem] bg-stone-950 text-white p-8 sm:p-10 shadow-2xl border border-stone-800/60 group">
        <div className="absolute top-0 right-0 -mt-20 -mr-20 w-96 h-96 bg-amber-600/20 rounded-full blur-[80px] pointer-events-none group-hover:bg-amber-500/30 transition-all duration-700" />
        <div className="absolute bottom-0 left-1/4 -mb-20 w-80 h-80 bg-orange-600/20 rounded-full blur-[80px] pointer-events-none group-hover:bg-orange-500/30 transition-all duration-700" />
        
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 relative z-10">
          <div>
            <div className="inline-flex items-center space-x-2 px-3 py-1 mb-4 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-xs font-bold text-amber-300 uppercase tracking-widest shadow-inner">
              <Package className="w-4 h-4 text-amber-400" />
              <span>Guidance Storage Custody</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white via-amber-100 to-stone-400 tracking-tight">
              Found-Item Inventory
            </h1>
            <p className="text-stone-300/80 text-sm sm:text-base mt-2 max-w-xl font-medium leading-relaxed">
              Complete catalog across all lifecycle stages: Received, Verified, Published, Claim Pending, and Released.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setIsRegisterModalOpen(true)}
              className="px-5 py-3 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white rounded-2xl text-xs sm:text-sm font-bold flex items-center space-x-2 shadow-lg shadow-amber-600/30 transition-all active:scale-95"
            >
              <PlusCircle className="w-4 h-4" />
              <span>+ Record New Intake</span>
            </button>
            <button
              onClick={fetchInventory}
              disabled={loading}
              className="px-4 py-3 bg-white/10 hover:bg-white/20 text-white rounded-2xl text-xs sm:text-sm font-bold flex items-center space-x-2 transition-all backdrop-blur-md border border-white/10 active:scale-95 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white/80 backdrop-blur-md border border-stone-200/80 rounded-2xl p-4 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search headline, ID, category, location..."
            className="w-full pl-9 pr-3.5 py-2.5 text-xs rounded-xl border border-stone-200 bg-stone-50/50 text-stone-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-500 transition-all"
          />
        </div>

        {/* Status Filters */}
        <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
          <span className="text-xs font-bold text-stone-500 mr-1 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" /> Stage:
          </span>
          {[
            { id: "all", label: "All" },
            { id: "received", label: "Received" },
            { id: "verified", label: "Verified" },
            { id: "published", label: "Published" },
            { id: "claim_pending", label: "Claim Pending" },
            { id: "holding_lapsed", label: "🚨 Holding Lapsed" },
            { id: "released", label: "Released" },
            { id: "donated", label: "Donated" },
            { id: "disposed", label: "Disposed" },
            { id: "turned_over", label: "Turned Over" }
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setStatusFilter(f.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all ${
                statusFilter === f.id
                  ? "bg-amber-600 text-white shadow-2xs"
                  : "bg-stone-100 hover:bg-stone-200 text-stone-700"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center flex flex-col items-center justify-center animate-pulse">
          <div className="w-16 h-16 rounded-full bg-amber-100/50 flex items-center justify-center mb-4">
             <Package className="w-8 h-8 text-amber-500 animate-pulse" />
          </div>
          <p className="text-stone-500 font-medium">Loading inventory...</p>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="bg-white/70 backdrop-blur-xl border border-stone-200/80 rounded-[2.5rem] p-16 text-center space-y-6 shadow-xs flex flex-col items-center justify-center">
          <div className="w-20 h-20 rounded-full bg-stone-100 flex items-center justify-center mx-auto shadow-inner border border-stone-200">
            <Package className="w-10 h-10 text-stone-300" />
          </div>
          <div>
            <h3 className="text-2xl font-extrabold text-stone-900">No Matching Items Found</h3>
            <p className="text-sm text-stone-500 max-w-md mx-auto mt-2 font-medium">
              No items in custody match the selected stage filter or search keyword.
            </p>
          </div>
          <button
            onClick={() => setStatusFilter("all")}
            className="px-5 py-2.5 bg-stone-900 text-white text-xs font-bold rounded-xl hover:bg-stone-800 transition-all shadow-xs"
          >
            Show All Items
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map(post => {
            const rawStatus = post.status === "available" ? "published" : post.status;
            const badge = getStatusBadge(rawStatus);

            return (
              <div 
                key={post.id} 
                className="bg-white/80 backdrop-blur-xl border border-stone-200/80 hover:border-amber-300 rounded-[2.5rem] shadow-xs hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col group"
              >
                {/* Photo & Status Badge */}
                <div className="relative aspect-video bg-stone-100 flex items-center justify-center overflow-hidden border-b border-stone-100">
                  {post.imageUrl ? (
                    <img 
                      src={post.imageUrl} 
                      alt={post.category} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                    />
                  ) : (
                    <Package className="w-10 h-10 text-stone-300" />
                  )}
                  <div className={`absolute top-4 right-4 px-3 py-1 rounded-xl text-[10px] font-extrabold uppercase shadow-sm tracking-widest border ${badge.classes}`}>
                    {badge.label}
                  </div>
                </div>

                {/* Details */}
                <div className="p-6 flex-1 flex flex-col space-y-4">
                  <div>
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-[10px] font-bold text-amber-800 uppercase tracking-widest bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
                        #{post.id}
                      </span>
                      <span className="text-[10px] text-stone-500 font-medium">
                        {new Date(post.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    <h3 className="text-lg font-extrabold text-stone-900 leading-snug">
                      {post.title || `${post.color} ${post.category}`}
                    </h3>
                    <p className="text-xs text-stone-600 line-clamp-2 mt-1.5 font-medium leading-relaxed">
                      {post.publicDescription || post.description}
                    </p>
                  </div>

                  {/* Intake Attribute Tags */}
                  <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                    <div className="p-2 rounded-xl bg-stone-50 border border-stone-200">
                      <span className="text-stone-400 block text-[9px] uppercase font-bold">Condition</span>
                      <strong className="text-stone-800">{post.condition || "Good"}</strong>
                    </div>

                    <div className="p-2 rounded-xl bg-emerald-50/60 border border-emerald-200">
                      <span className="text-emerald-700 block text-[9px] uppercase font-bold">Value Band</span>
                      <strong className="text-emerald-900 truncate block">{post.estimatedValueBand?.split(" ")[0] || "Medium"}</strong>
                    </div>

                    <div className="p-2 rounded-xl bg-purple-50/60 border border-purple-200">
                      <span className="text-purple-700 block text-[9px] uppercase font-bold">Special Handling</span>
                      <strong className="text-purple-900 truncate block">{post.specialHandlingType || "Standard"}</strong>
                    </div>

                    <div className="p-2 rounded-xl bg-blue-50/60 border border-blue-200">
                      <span className="text-blue-700 block text-[9px] uppercase font-bold">Storage Custody</span>
                      <strong className="text-blue-900 truncate block">{post.storageLocation || (post.storageBoxId ? `${post.storageBoxId}:${post.storageSlotId}` : "Vault")}</strong>
                    </div>
                  </div>

                  {/* Finder / Custody Meta Footer */}
                  <div className="mt-auto pt-4 border-t border-stone-100 text-xs space-y-1.5">
                    <div className="flex items-center justify-between text-stone-500 font-medium">
                      <span>Finder (Manual Intake):</span>
                      <span className="font-bold text-stone-800">{post.finderName || post.surrenderedBy || "Anonymous Finder"}</span>
                    </div>
                    <div className="flex items-center justify-between text-stone-500 font-medium">
                      <span>Location Found:</span>
                      <span className="font-bold text-stone-800 truncate max-w-[150px]">{post.locationFound || post.areaFound || "Campus"}</span>
                    </div>
                    {post.claims && post.claims.length > 0 && (
                      <div className="mt-2 px-3 py-1.5 bg-purple-50 text-purple-900 rounded-xl text-[10px] font-extrabold text-center border border-purple-200 uppercase tracking-wider">
                        {post.claims.length} Claim Request(s) Logged
                      </div>
                    )}

                    {/* Holding Clocks Badge & Action */}
                    {post.holdingClocks && (
                      <div className="mt-2 pt-2 border-t border-stone-100 space-y-1.5">
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="text-stone-400 font-bold uppercase flex items-center gap-1">
                            <Clock className="w-3 h-3 text-stone-400" /> School Holding:
                          </span>
                          <span className={`font-extrabold px-2 py-0.5 rounded-md ${
                            post.holdingClocks.isSchoolHoldingLapsed
                              ? "bg-amber-100 text-amber-900 font-bold animate-pulse"
                              : "bg-blue-50 text-blue-800"
                          }`}>
                            {post.holdingClocks.isSchoolHoldingLapsed ? "Holding Lapsed" : `${post.holdingClocks.schoolDaysRemaining}d left`}
                          </span>
                        </div>

                        {post.holdingClocks.earliestAwardDate && (
                          <div className="flex items-center justify-between text-[10px] text-stone-500">
                            <span>Statutory 6-Mo:</span>
                            <span className="font-mono">{new Date(post.holdingClocks.earliestAwardDate).toLocaleDateString()}</span>
                          </div>
                        )}

                        {!["released", "donated", "disposed", "turned_over"].includes(rawStatus) && (
                          <button
                            type="button"
                            onClick={() => setSelectedDispositionItem(post)}
                            className="w-full mt-2 py-2 px-3 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-[11px] font-bold flex items-center justify-center space-x-1.5 transition-all shadow-xs"
                          >
                            <Clock className="w-3.5 h-3.5 text-amber-400" />
                            <span>{post.holdingClocks.isSchoolHoldingLapsed ? "Manage Disposition Case" : "View Clocks & Checklist"}</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Disposition Workflow Modal */}
      {selectedDispositionItem && (
        <DispositionWorkflowModal
          item={selectedDispositionItem}
          isOpen={!!selectedDispositionItem}
          onClose={() => setSelectedDispositionItem(null)}
          onSuccess={(updated) => {
            setInventory(prev => prev.map(i => i.id === updated.id ? updated : i));
          }}
        />
      )}
    </div>
  );
};
