import React, { useState } from "react";
import { useApp } from "../../context/AppContext";
import { ClaimRequest } from "../../types";
import { 
  ShieldCheck, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  User, 
  Search, 
  HardDrive, 
  ChevronRight, 
  Sparkles,
  Lock,
  QrCode,
  Filter
} from "lucide-react";

export const StaffClaimRequests: React.FC = () => {
  const { 
    claims, 
    foundItems, 
    setSelectedClaim, 
    setIsVerifyModalOpen,
    setIsScannerModalOpen, 
    setStaffView 
  } = useApp();

  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredClaims = claims.filter(c => {
    const matchesStatus = statusFilter === "all" || c.status === statusFilter;
    const matchesSearch = (
      c.claimantName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.claimantId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.itemId.toLowerCase().includes(searchQuery.toLowerCase())
    );
    return matchesStatus && matchesSearch;
  });

  const handleOpenVerify = (claim: ClaimRequest) => {
    setSelectedClaim(claim);
    setIsVerifyModalOpen(true);
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-stone-900 tracking-tight">
            Review Queue
          </h1>
          <p className="text-sm md:text-base text-stone-500 mt-2 max-w-2xl">
            Review citizen ownership proofs, inspect stored items, and authorize smart locker retrieval passes.
          </p>
        </div>

        <button
          onClick={() => setIsScannerModalOpen(true)}
          className="px-5 py-3 bg-stone-900 hover:bg-stone-800 text-white text-sm font-bold rounded-2xl shadow-sm transition-all flex items-center justify-center space-x-2 w-full md:w-auto active:scale-95"
        >
          <QrCode className="w-5 h-5" />
          <span>Launch Kiosk</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white/70 backdrop-blur-md border border-stone-200/50 rounded-[2rem] p-4 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-96">
          <Search className="w-5 h-5 text-stone-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search claimant, ID, item #..."
            className="w-full pl-11 pr-4 py-3 text-sm rounded-2xl border-none bg-stone-100/50 text-stone-800 placeholder:text-stone-400 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-stone-900 transition-all shadow-inner"
          />
        </div>

        <div className="flex items-center space-x-2 w-full md:w-auto">
          <div className="relative w-full md:w-auto">
            <Filter className="w-4 h-4 text-stone-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full md:w-auto pl-10 pr-10 py-3 text-sm font-medium rounded-2xl border-none bg-stone-100/50 text-stone-700 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-stone-900 appearance-none cursor-pointer transition-all shadow-inner"
            >
              <option value="all">All Claims ({claims.length})</option>
              <option value="pending_review">Pending Review</option>
              <option value="under_verification">Under Verification</option>
              <option value="ready_for_retrieval">Ready for Retrieval</option>
              <option value="released">Released & Closed</option>
              <option value="rejected">Rejected</option>
            </select>
            <ChevronRight className="w-4 h-4 text-stone-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none rotate-90" />
          </div>
        </div>
      </div>

      {/* Claim Requests List */}
      <div className="space-y-4">
        {filteredClaims.length === 0 ? (
          <div className="bg-white/50 backdrop-blur-sm border border-stone-200/50 rounded-[2rem] p-16 text-center text-stone-400 flex flex-col items-center justify-center">
            <div className="w-20 h-20 bg-stone-100 rounded-full flex items-center justify-center mb-6 shadow-inner">
              <ShieldCheck className="w-10 h-10 text-stone-300" />
            </div>
            <h3 className="text-xl font-bold text-stone-700 mb-2">No claims found</h3>
            <p className="text-sm text-stone-500 max-w-md">
              There are no claims matching your current filter criteria.
            </p>
          </div>
        ) : (
          filteredClaims.map((claim) => {
            const item = foundItems.find(i => i.id === claim.itemId);
            const isPending = claim.status === "pending_review" || claim.status === "under_verification";

            return (
              <div
                key={claim.id}
                className="group bg-white/70 backdrop-blur-md border border-stone-200/50 rounded-[2rem] p-6 md:p-8 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col md:flex-row gap-6 relative overflow-hidden"
              >
                {/* Left Side: Item Visual */}
                <div className="shrink-0 flex flex-col items-center justify-center space-y-3">
                  {item ? (
                    <div className="w-24 h-24 md:w-32 md:h-32 rounded-3xl overflow-hidden shadow-inner border border-stone-200/50">
                      <img
                        src={item.imageUrl}
                        alt={item.title}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                  ) : (
                    <div className="w-24 h-24 md:w-32 md:h-32 rounded-3xl bg-stone-100 flex items-center justify-center shadow-inner border border-stone-200/50">
                      <Package className="w-8 h-8 text-stone-300" />
                    </div>
                  )}
                  
                  {isPending ? (
                    <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-200 w-full text-center">
                      Action Required
                    </span>
                  ) : (
                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider w-full text-center ${
                      claim.status === "ready_for_retrieval"
                        ? "bg-blue-100 text-blue-800 border border-blue-200"
                        : claim.status === "released"
                        ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                        : claim.status === "rejected"
                        ? "bg-red-100 text-red-800 border border-red-200"
                        : "bg-stone-100 text-stone-700"
                    }`}>
                      {claim.status.replace(/_/g, " ")}
                    </span>
                  )}
                </div>

                {/* Right Side: Details & Actions */}
                <div className="flex-1 flex flex-col justify-between">
                  <div className="space-y-4">
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="text-xs font-bold text-stone-400 bg-stone-100 px-2 py-0.5 rounded-md">
                            #{claim.id.split('-')[0]}
                          </span>
                          <span className="text-xs text-stone-500 font-medium">
                            {new Date(claim.submittedDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                          </span>
                        </div>
                        <h3 className="text-xl font-bold text-stone-900 leading-tight">
                          {claim.claimantName}
                        </h3>
                        <p className="text-sm text-stone-500 mt-1 flex items-center">
                          <User className="w-4 h-4 mr-1.5" />
                          ID: {claim.claimantId}
                        </p>
                      </div>
                      
                      {item && (
                        <div className="bg-stone-50 rounded-2xl p-3 border border-stone-200/50 text-right w-full md:w-auto">
                          <p className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Target Item</p>
                          <p className="text-sm font-bold text-stone-900 truncate max-w-[150px]">{item.title}</p>
                          <p className="text-xs text-stone-500">{item.storageBoxId} • {item.storageSlotId}</p>
                        </div>
                      )}
                    </div>

                    <div className="bg-stone-50 rounded-2xl p-4 border border-stone-200/50">
                      <p className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-2">Submitted Proof</p>
                      <p className="text-sm text-stone-800 font-medium italic">
                        "{claim.proofOfOwnership}"
                      </p>
                    </div>
                  </div>

                  {/* Actions & Meta */}
                  <div className="mt-6 flex flex-col md:flex-row md:items-center justify-between gap-4 pt-4 border-t border-stone-100/80">
                    <div className="flex items-center gap-4 text-xs">
                      {claim.retrievalCode && (
                        <div className="flex items-center text-amber-700 bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-200/50 font-bold">
                          <Lock className="w-3.5 h-3.5 mr-1.5" />
                          Pass: {claim.retrievalCode}
                        </div>
                      )}
                      <div className="flex items-center text-stone-500 font-medium">
                        <Sparkles className="w-3.5 h-3.5 text-blue-500 mr-1.5" />
                        Match Score: <span className="font-bold text-stone-800 ml-1">{claim.similarityScore}%</span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleOpenVerify(claim)}
                      className={`px-6 py-3 rounded-2xl text-sm font-bold transition-all flex items-center justify-center space-x-2 active:scale-95 ${
                        isPending 
                          ? "bg-blue-600 hover:bg-blue-700 text-white shadow-sm" 
                          : "bg-stone-100 hover:bg-stone-200 text-stone-800"
                      }`}
                    >
                      <span>{isPending ? "Review Claim" : "View Details"}</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

