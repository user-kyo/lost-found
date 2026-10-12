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
    <div className="w-full space-y-8 sm:space-y-12 animate-in fade-in duration-700">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-[2rem] bg-stone-950 text-white p-8 sm:p-12 shadow-2xl border border-stone-800/60 group">
        <div className="absolute top-0 right-0 -mt-20 -mr-20 w-96 h-96 bg-blue-600/20 rounded-full blur-[80px] pointer-events-none group-hover:bg-blue-500/30 transition-all duration-700" />
        <div className="absolute bottom-0 left-1/4 -mb-20 w-80 h-80 bg-indigo-600/20 rounded-full blur-[80px] pointer-events-none group-hover:bg-indigo-500/30 transition-all duration-700" />

        <div className="relative z-10 max-w-2xl space-y-6">
          <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-white/5 backdrop-blur-md border border-white/10 text-xs font-semibold text-blue-300 shadow-inner">
            <Sparkles className="w-4 h-4 text-blue-400 animate-pulse" />
            <span>AI-Powered Natural Language Matching</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white via-blue-100 to-stone-400 leading-tight">
            Find what you lost. <br className="hidden sm:block" />
            <span className="text-blue-400">Faster than ever.</span>
          </h1>

          <p className="text-stone-300/80 text-base sm:text-lg leading-relaxed max-w-xl font-medium">
            Simply describe what you lost in plain text. Our AI will instantly scan the city's verified found items and connect you with the LGU office.
          </p>

          <div className="pt-4 flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <button
              onClick={() => setStudentView("report")}
              className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-base rounded-2xl shadow-[0_0_40px_-10px_rgba(79,70,229,0.5)] transition-all duration-300 flex items-center justify-center space-x-2 hover:-translate-y-1"
            >
              <Search className="w-5 h-5 text-blue-100" />
              <span>Report a Lost Item</span>
            </button>
            <button
              onClick={() => setStudentView("reports")}
              className="w-full sm:w-auto px-8 py-4 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-semibold text-base rounded-2xl backdrop-blur-md transition-all duration-300 flex items-center justify-center hover:-translate-y-1"
            >
              Track Existing Claims
            </button>
          </div>
        </div>
      </div>

      {/* Stats / Quick Info */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Active Reports", value: lostReports.length, icon: FileText, color: "blue" },
          { label: "Claims in Progress", value: activeClaims.length, icon: ShieldCheck, color: "indigo" },
          { label: "Resolved Cases", value: claims.filter(c => c.status === "released").length, icon: Sparkles, color: "emerald" },
          { label: "Verified Handovers", value: "LGU Office", icon: MapPin, color: "stone" }
        ].map((stat, i) => (
          <div key={i} className="bg-white rounded-3xl p-5 border border-stone-100 shadow-sm hover:shadow-md transition-shadow duration-300 flex flex-col items-start justify-between relative overflow-hidden">
            <div className={`w-10 h-10 rounded-2xl bg-${stat.color}-50 text-${stat.color}-600 flex items-center justify-center mb-4`}>
              <stat.icon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-bold text-stone-400 uppercase tracking-wider mb-1">{stat.label}</p>
              <p className="text-xl font-extrabold text-stone-900">{stat.value}</p>
            </div>
            <div className={`absolute -bottom-4 -right-4 w-20 h-20 bg-${stat.color}-50 rounded-full blur-2xl opacity-50 pointer-events-none`} />
          </div>
        ))}
      </div>

      {/* Dashboard Section */}
      <div className={`grid gap-6 ${isMobile ? "grid-cols-1" : "grid-cols-1 lg:grid-cols-3"}`}>
        {/* Left 2 Cols: Active Report status */}
        <div className={`${isMobile ? "" : "lg:col-span-2"} bg-white rounded-[2rem] p-6 sm:p-8 shadow-sm border border-stone-100 flex flex-col`}>
          <div className="flex items-center justify-between pb-6 border-b border-stone-100">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                <FileText className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-stone-900">Recent Lost Report</h3>
                <p className="text-xs font-medium text-stone-500">Track your most recent inquiry</p>
              </div>
            </div>
            <button 
              onClick={() => setStudentView("reports")}
              className="group text-sm font-semibold text-blue-600 hover:text-blue-700 flex items-center bg-blue-50 px-4 py-2 rounded-xl transition-all"
            >
              <span>View All</span>
              <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          <div className="flex-1 flex flex-col justify-center mt-6">
            {recentReport ? (
              <div className="group relative p-6 rounded-2xl bg-stone-50/50 border border-stone-200 hover:border-blue-300 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer" onClick={() => setStudentView("search")}>
                <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl pointer-events-none" />
                
                <div className="relative flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <span className="px-3 py-1 rounded-lg text-xs font-bold tracking-wide bg-amber-100 text-amber-800 border border-amber-200 shadow-sm">
                        {recentReport.status.replace("_", " ").toUpperCase()}
                      </span>
                      <span className="text-sm font-mono font-bold text-stone-400">
                        #{recentReport.id}
                      </span>
                    </div>
                    
                    <div>
                      <h4 className="text-lg font-bold text-stone-900 group-hover:text-blue-900 transition-colors">
                        {recentReport.extractedAttributes.color} {recentReport.extractedAttributes.brand} {recentReport.extractedAttributes.itemType}
                      </h4>
                      <p className="text-sm text-stone-500 mt-1 flex items-center">
                        <MapPin className="w-3.5 h-3.5 mr-1 text-stone-400" />
                        Lost near {recentReport.estimatedLocation} on {recentReport.lostDate}
                      </p>
                    </div>
                  </div>

                  <div className="shrink-0">
                    <button className="w-full sm:w-auto px-5 py-2.5 bg-white border-2 border-blue-100 hover:border-blue-600 text-blue-700 rounded-xl text-sm font-bold shadow-sm transition-all flex items-center justify-center space-x-2">
                      <Search className="w-4 h-4" />
                      <span>Check AI Matches</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-16 h-16 bg-stone-100 rounded-full flex items-center justify-center mb-4">
                  <FileText className="w-6 h-6 text-stone-300" />
                </div>
                <h4 className="text-stone-900 font-bold text-lg">No active reports</h4>
                <p className="text-stone-500 text-sm mt-1 max-w-xs">You haven't reported any lost items recently. If you lost something, report it now to start tracking.</p>
                <button onClick={() => setStudentView("report")} className="mt-6 text-sm font-bold text-blue-600 hover:text-blue-700">
                  + Create a new report
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right Col: Active Claims Tracking Snippet */}
        <div className="bg-gradient-to-b from-indigo-950 to-blue-950 rounded-[2rem] p-6 sm:p-8 shadow-lg text-white flex flex-col relative overflow-hidden">
          <div className="absolute top-0 right-0 w-40 h-40 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="relative z-10">
            <div className="flex items-center space-x-3 pb-6 border-b border-white/10">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/20 backdrop-blur-sm border border-indigo-500/30 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5 text-indigo-300" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Active Claims</h3>
                <p className="text-xs font-medium text-indigo-200/70">{activeClaims.length} items in progress</p>
              </div>
            </div>

            <div className="mt-6 space-y-4">
              {activeClaims.length > 0 ? (
                activeClaims.slice(0, 3).map((claim) => (
                  <div
                    key={claim.id}
                    onClick={() => {
                      setSelectedClaim(claim);
                      setStudentView("claim_tracking");
                    }}
                    className="group p-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 backdrop-blur-sm transition-all cursor-pointer flex flex-col justify-between"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-mono font-bold text-indigo-200">#{claim.id}</span>
                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center space-x-1.5 ${
                        claim.status === "ready_for_retrieval"
                          ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                          : claim.status === "approved"
                          ? "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                          : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                      }`}>
                        {claim.status === "ready_for_retrieval" && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />}
                        <span>{claim.status.replace("_", " ").toUpperCase()}</span>
                      </span>
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <p className="text-sm text-white font-medium group-hover:text-blue-200 transition-colors truncate pr-4">
                        Target Item: #{claim.itemId}
                      </p>
                      <ArrowRight className="w-4 h-4 text-indigo-400 group-hover:translate-x-1 transition-transform shrink-0" />
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-10 text-center text-indigo-200/50 flex flex-col items-center">
                  <ShieldCheck className="w-8 h-8 mb-3 opacity-20" />
                  <p className="text-sm font-medium">No retrieval claims in progress.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
