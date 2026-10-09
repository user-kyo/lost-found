import React from "react";
import { useApp } from "../../context/AppContext";
import { 
  Sparkles, 
  Search, 
  FileText, 
  ShieldCheck, 
  ArrowRight, 
  MapPin, 
  Info,
  ChevronRight
} from "lucide-react";

export const StudentHome: React.FC = () => {
  const { setStudentView, lostReports, claims, setSelectedClaim, foundItems, screenMode } = useApp();
  
  const isMobile = screenMode === "mobile";
  const activeClaims = claims.filter(c => c.status !== "released" && c.status !== "rejected");
  const recentReport = lostReports[0];

  return (
    <div className="w-full space-y-6 sm:space-y-8">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-linear-to-br from-stone-900 via-stone-850 to-emerald-950 text-white p-5 sm:p-10 shadow-xl border border-stone-800">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-12 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-2xl space-y-4">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-semibold text-amber-300">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>AI-Powered Natural Language Item Matching</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-tight">
            Recover lost property across the city.
          </h1>

          <p className="text-stone-300 text-sm sm:text-base leading-relaxed">
            Describe what you misplaced in plain words or with your voice. BalikHub ranks approved finder posts and routes verified handovers through the LGU office.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-3">
            <button
              onClick={() => setStudentView("report")}
              className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-sm rounded-xl shadow-md transition-all flex items-center space-x-2 active:scale-98"
            >
              <Sparkles className="w-4 h-4 text-white" />
              <span>Report a Lost Item</span>
            </button>
            <button
              onClick={() => setStudentView("search")}
              className="px-5 py-2.5 bg-white/10 hover:bg-white/20 text-stone-100 font-semibold text-sm rounded-xl backdrop-blur-xs border border-white/20 transition-all flex items-center space-x-2"
            >
              <Search className="w-4 h-4 text-stone-300" />
              <span>Search Found Posts</span>
            </button>
          </div>
        </div>
      </div>

      {/* Two Prominent Action Cards */}
      <div className={`grid gap-6 ${isMobile ? "grid-cols-1" : "grid-cols-1 md:grid-cols-2"}`}>
        {/* Action Card 1: Report Lost Item */}
        <div 
          onClick={() => setStudentView("report")}
          className="group relative bg-white border border-stone-200/90 hover:border-emerald-700 rounded-3xl p-6 sm:p-8 shadow-2xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
        >
          <div className="space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100/80 text-emerald-800 flex items-center justify-center group-hover:bg-emerald-800 group-hover:text-white transition-colors shadow-2xs">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-stone-900 group-hover:text-emerald-800 transition-colors">
                Report a Lost Item
              </h3>
              <p className="text-stone-600 text-sm mt-1.5 leading-relaxed">
                Provide a quick voice or text description. The matcher accepts English, Filipino, and Taglish, including common misspellings.
              </p>
            </div>
          </div>
          <div className="mt-6 pt-4 border-t border-stone-100 flex items-center text-sm font-bold text-emerald-800 group-hover:text-emerald-900">
            <span>Start guided description</span>
            <ArrowRight className="w-4 h-4 ml-1.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* Action Card 2: Search for My Lost Item */}
        <div 
          onClick={() => setStudentView("search")}
          className="group relative bg-white border border-stone-200/90 hover:border-amber-600 rounded-3xl p-6 sm:p-8 shadow-2xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
        >
          <div className="space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-100/80 text-amber-800 flex items-center justify-center group-hover:bg-amber-600 group-hover:text-white transition-colors shadow-2xs">
              <Search className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-stone-900 group-hover:text-amber-700 transition-colors">
                Search Found Item Catalog
              </h3>
              <p className="text-stone-600 text-sm mt-1.5 leading-relaxed">
                Browse approved public found-item posts. Filter by category, location found, and date.
              </p>
            </div>
          </div>
          <div className="mt-6 pt-4 border-t border-stone-100 flex items-center text-sm font-bold text-amber-700 group-hover:text-amber-800">
            <span>Browse current items ({foundItems.filter(i => i.status !== 'claimed').length} available)</span>
            <ArrowRight className="w-4 h-4 ml-1.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
      </div>

      {/* 4-Step Process Guide */}
      <div className="bg-stone-100/80 border border-stone-200/80 rounded-3xl p-6 sm:p-8">
        <div className="max-w-xl mb-6">
          <h3 className="text-lg font-bold text-stone-900">How BalikHub Works</h3>
          <p className="text-xs sm:text-sm text-stone-600 mt-1">
            A transparent 4-stage flow combining lexical matching with LGU desk verification and office handover.
          </p>
        </div>

        <div className={`grid gap-4 ${isMobile ? "grid-cols-1" : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"}`}>
          <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-2xs relative">
            <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center justify-center mb-3">
              1
            </div>
            <h4 className="text-sm font-bold text-stone-900">Describe Your Item</h4>
            <p className="text-xs text-stone-500 mt-1 leading-relaxed">
              Use voice or text. Mention public clues like item type, color, date, and area found.
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-2xs relative">
            <div className="w-7 h-7 rounded-lg bg-stone-100 text-stone-800 font-bold text-xs flex items-center justify-center mb-3">
              2
            </div>
            <h4 className="text-sm font-bold text-stone-900">System Ranks Candidates</h4>
            <p className="text-xs text-stone-500 mt-1 leading-relaxed">
              TF-IDF ranks approved public posts without showing scores to claimants.
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-2xs relative">
            <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-800 font-bold text-xs flex items-center justify-center mb-3">
              3
            </div>
            <h4 className="text-sm font-bold text-stone-900">LGU Verifies Proof</h4>
            <p className="text-xs text-stone-500 mt-1 leading-relaxed">
              Designated LGU officers review your claim against registered intake records.
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-2xs relative">
            <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center justify-center mb-3">
              4
            </div>
            <h4 className="text-sm font-bold text-stone-900">Handover at LGU Office</h4>
            <p className="text-xs text-stone-500 mt-1 leading-relaxed">
              Meet the finder at the LGU office after staff verifies ownership and identity.
            </p>
          </div>
        </div>
      </div>

      {/* User's Recent Status Section */}
      <div className={`grid gap-6 ${isMobile ? "grid-cols-1" : "grid-cols-1 lg:grid-cols-3"}`}>
        {/* Left 2 Cols: Active Report status */}
        <div className={`${isMobile ? "" : "lg:col-span-2"} bg-white border border-stone-200/80 rounded-3xl p-6 sm:p-7 shadow-xs`}>
          <div className="flex items-center justify-between pb-4 border-b border-stone-100">
            <div className="flex items-center space-x-2">
              <FileText className="w-5 h-5 text-emerald-800" />
              <h3 className="text-sm font-bold text-stone-900">Your Active Lost Report</h3>
            </div>
            <button 
              onClick={() => setStudentView("reports")}
              className="text-xs font-bold text-emerald-800 hover:text-emerald-950 flex items-center"
            >
              <span>View all reports</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {recentReport ? (
            <div className="mt-4 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-4 rounded-2xl bg-stone-50 border border-stone-200">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-mono font-bold text-stone-900">
                      Report #{recentReport.id}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                      {recentReport.status.replace("_", " ").toUpperCase()}
                    </span>
                  </div>
                  <p className="text-xs text-stone-800 mt-1 font-semibold">
                    {recentReport.extractedAttributes.itemType} • {recentReport.extractedAttributes.color} • {recentReport.extractedAttributes.brand}
                  </p>
                  <p className="text-[11px] text-stone-500 mt-0.5">
                    Reported: {recentReport.lostDate} in {recentReport.estimatedLocation}
                  </p>
                </div>

                <div className="shrink-0 flex items-center space-x-2">
                  <button
                    onClick={() => {
                      setStudentView("search");
                    }}
                    className="px-3.5 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-bold shadow-2xs transition-colors"
                  >
                    View Possible Matches
                  </button>
                </div>
              </div>

              <div className="flex items-center space-x-2 text-xs text-stone-500 px-1">
                <Info className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                <span>BalikHub is monitoring newly approved found-item posts.</span>
              </div>
            </div>
          ) : (
            <div className="py-8 text-center text-stone-400 text-xs">
              No active lost reports. Click "Report Lost Item" above if you misplaced something.
            </div>
          )}
        </div>

        {/* Right Col: Active Claims Tracking Snippet */}
        <div className="bg-white border border-stone-200/80 rounded-3xl p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-stone-100">
              <div className="flex items-center space-x-2">
                <ShieldCheck className="w-5 h-5 text-amber-600" />
                <h3 className="text-sm font-bold text-stone-900">Active Claims ({activeClaims.length})</h3>
              </div>
            </div>

            <div className="mt-4 space-y-3">
              {activeClaims.length > 0 ? (
                activeClaims.slice(0, 2).map((claim) => (
                  <div
                    key={claim.id}
                    onClick={() => {
                      setSelectedClaim(claim);
                      setStudentView("claim_tracking");
                    }}
                    className="p-3.5 rounded-2xl border border-stone-200 bg-stone-50 hover:bg-emerald-50/40 hover:border-emerald-200 transition-all cursor-pointer"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-bold text-stone-900">{claim.id}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        claim.status === "ready_for_retrieval"
                          ? "bg-emerald-100 text-emerald-800 animate-pulse"
                          : claim.status === "approved"
                          ? "bg-stone-200 text-stone-800"
                          : "bg-amber-100 text-amber-800"
                      }`}>
                        {claim.status.replace("_", " ")}
                      </span>
                    </div>
                    <p className="text-xs text-stone-700 mt-1 line-clamp-1 font-medium">
                      Target Item: #{claim.itemId}
                    </p>
                    <div className="mt-2 flex items-center justify-between text-[11px] text-emerald-800 font-bold">
                      <span>Track retrieval status</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-6 text-center text-stone-400 text-xs">
                  No active retrieval claims in progress.
                </div>
              )}
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-stone-100 text-[11px] text-stone-500 flex items-center space-x-1.5">
            <MapPin className="w-3.5 h-3.5 text-emerald-800" />
            <span>Verified handovers happen at the San Pablo City LGU office.</span>
          </div>
        </div>
      </div>
    </div>
  );
};
