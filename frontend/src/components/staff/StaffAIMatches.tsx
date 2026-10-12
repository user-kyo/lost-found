import React, { useState } from "react";
import { useApp } from "../../context/AppContext";
import { 
  Sparkles, 
  Search, 
  Filter, 
  CheckCircle2, 
  ArrowRight, 
  HardDrive, 
  User, 
  FileText,
  ShieldCheck,
  ChevronRight
} from "lucide-react";

export const StaffAIMatches: React.FC = () => {
  const { 
    lostReports, 
    foundItems, 
    claims, 
    setSelectedClaim, 
    setIsVerifyModalOpen,
    setStaffView 
  } = useApp();

  const [minConfidence, setMinConfidence] = useState<number>(60);
  const [selectedReportId, setSelectedReportId] = useState<string>(lostReports[0]?.id || "");

  const activeReport = lostReports.find(r => r.id === selectedReportId) || lostReports[0];

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center space-x-2 text-xs text-stone-500 mb-1">
          <button onClick={() => setStaffView("dashboard")} className="hover:text-blue-800">LGU Dashboard</button>
          <span>/</span>
          <span className="text-stone-900 font-semibold">AI Match Engine</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight">
          NLP Semantic Matching Engine
        </h1>
        <p className="text-xs sm:text-sm text-stone-500 mt-0.5">
          Inspect attribute vector overlaps between submitted citizen lost reports and municipal inventory.
        </p>
      </div>

      {/* Top Filter Bar */}
      <div className="bg-white border border-stone-200/80 rounded-2xl p-4 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center space-x-3 w-full sm:w-auto">
          <label className="text-xs font-semibold text-stone-700 whitespace-nowrap">Select Lost Report:</label>
          <select
            value={selectedReportId}
            onChange={(e) => setSelectedReportId(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl border border-stone-200 bg-stone-50/50 text-stone-800 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-700"
          >
            {lostReports.map(r => (
              <option key={r.id} value={r.id}>
                #{r.id} - {r.studentName} ({r.extractedAttributes.itemType})
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center space-x-3 text-xs">
          <span className="text-stone-500">Min. Similarity Threshold:</span>
          <span className="font-mono font-bold text-blue-800 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
            {minConfidence}%
          </span>
          <input
            type="range"
            min="40"
            max="95"
            value={minConfidence}
            onChange={(e) => setMinConfidence(Number(e.target.value))}
            className="accent-blue-800"
          />
        </div>
      </div>

      {/* Active Report Header Card */}
      {activeReport && (
        <div className="bg-stone-900 text-stone-100 rounded-3xl p-6 sm:p-7 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-stone-800">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-amber-400 text-stone-900 flex items-center justify-center font-bold">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-mono text-xs text-amber-300 font-bold">REPORT #{activeReport.id}</span>
                  <span className="px-2 py-0.5 rounded-md bg-stone-800 text-stone-300 text-[10px] uppercase font-bold">
                    {activeReport.status.replace(/_/g, " ")}
                  </span>
                </div>
                <h3 className="text-base font-bold text-white mt-0.5">
                  {activeReport.extractedAttributes.itemType} ({activeReport.extractedAttributes.color})
                </h3>
              </div>
            </div>

            <div className="text-right text-xs text-stone-400">
              <p>Claimant: <strong className="text-stone-200">{activeReport.studentName}</strong> ({activeReport.studentId})</p>
              <p className="text-[11px]">Reported: {activeReport.lostDate} in {activeReport.estimatedLocation}</p>
            </div>
          </div>

          <div className="space-y-2 text-xs">
            <p className="text-stone-300 italic leading-relaxed">
              "{activeReport.rawDescription}"
            </p>
            <div className="flex flex-wrap gap-2 pt-1">
              <span className="px-2 py-1 rounded-lg bg-stone-800 text-[11px] text-stone-200 border border-stone-700">
                Brand: {activeReport.extractedAttributes.brand}
              </span>
              <span className="px-2 py-1 rounded-lg bg-stone-800 text-[11px] text-stone-200 border border-stone-700">
                Accessories: {activeReport.extractedAttributes.accessories}
              </span>
              <span className="px-2 py-1 rounded-lg bg-stone-800 text-[11px] text-stone-200 border border-stone-700">
                NLP Confidence: {activeReport.extractedAttributes.confidence}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Candidate Matches Grid */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-stone-900">
          Ranked Inventory Matches for Report #{activeReport?.id}
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {foundItems.map(item => {
            const isTopMatch = item.id === "LF-2026-0042";
            const score = isTopMatch ? 94 : item.itemType === activeReport?.extractedAttributes.itemType ? 72 : 45;

            if (score < minConfidence) return null;

            return (
              <div
                key={item.id}
                className="bg-white border border-stone-200/80 hover:border-blue-700 rounded-3xl overflow-hidden shadow-2xs hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="relative aspect-4/3 bg-stone-100">
                    <img
                      src={item.imageUrl}
                      alt={item.title}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-3 left-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold text-white shadow-md ${
                        score >= 85 ? "bg-blue-800" : "bg-amber-700"
                      }`}>
                        {score}% Vector Overlap
                      </span>
                    </div>
                    <div className="absolute bottom-3 left-3">
                      <span className="px-2.5 py-1 rounded-lg bg-stone-900/85 text-white text-[10px] font-mono font-bold">
                        {item.storageBoxId} • Slot {item.storageSlotId}
                      </span>
                    </div>
                  </div>

                  <div className="p-5 space-y-3">
                    <div>
                      <span className="text-[10px] font-bold text-blue-800 uppercase tracking-wider">
                        #{item.id} • {item.category}
                      </span>
                      <h4 className="text-base font-bold text-stone-900 mt-0.5">{item.title}</h4>
                      <p className="text-xs text-stone-500 mt-1 line-clamp-2">{item.description}</p>
                    </div>

                    <div className="p-2.5 rounded-xl bg-stone-50 border border-stone-200/70 text-[11px] text-stone-600 space-y-1">
                      <div className="flex justify-between">
                        <span>Color:</span>
                        <span className="font-semibold text-stone-800">{item.color}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Brand:</span>
                        <span className="font-semibold text-stone-800">{item.brand}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Found in:</span>
                        <span className="font-semibold text-stone-800 truncate max-w-[150px]">{item.foundLocation}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-5 pt-0">
                  <button
                    onClick={() => {
                      const existingClaim = claims.find(c => c.itemId === item.id);
                      if (existingClaim) {
                        setSelectedClaim(existingClaim);
                        setIsVerifyModalOpen(true);
                      } else {
                        setStaffView("found_items");
                      }
                    }}
                    className="w-full py-2 bg-blue-50 hover:bg-blue-800 text-blue-800 hover:text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center space-x-1"
                  >
                    <span>View Item & Claims</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
