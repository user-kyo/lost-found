import React, { useState } from "react";
import { useApp } from "../../context/AppContext";
import { 
  FileText, 
  ShieldCheck, 
  Clock, 
  ChevronRight, 
  Sparkles, 
  Search, 
  PlusCircle, 
  CheckCircle2, 
  AlertCircle
} from "lucide-react";

interface Props {
  initialTab?: "reports" | "claims";
}

export const MyReportsAndClaims: React.FC<Props> = ({ initialTab = "reports" }) => {
  const { 
    lostReports, 
    claims, 
    foundItems, 
    setStudentView, 
    setSelectedClaim, 
    setSelectedItem 
  } = useApp();

  const [activeTab, setActiveTab] = useState<"reports" | "claims">(initialTab);

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight">
            My Activity & Records
          </h1>
          <p className="text-sm text-stone-500 mt-1">
            Track your submitted lost-item reports and claim verification statuses.
          </p>
        </div>

        <button
          onClick={() => setStudentView("report")}
          className="px-4 py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center space-x-1.5 self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4" />
          <span>New Lost Report</span>
        </button>
      </div>

      {/* Tab Switcher */}
      <div className="flex items-center space-x-2 border-b border-stone-200">
        <button
          onClick={() => setActiveTab("reports")}
          className={`pb-3 px-3 text-xs font-bold border-b-2 transition-all flex items-center space-x-2 ${
            activeTab === "reports"
              ? "border-emerald-800 text-emerald-800"
              : "border-transparent text-stone-500 hover:text-stone-900"
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>My Lost Reports ({lostReports.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("claims")}
          className={`pb-3 px-3 text-xs font-bold border-b-2 transition-all flex items-center space-x-2 ${
            activeTab === "claims"
              ? "border-emerald-800 text-emerald-800"
              : "border-transparent text-stone-500 hover:text-stone-900"
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>My Claim Requests ({claims.length})</span>
        </button>
      </div>

      {/* Content Area */}
      {activeTab === "reports" ? (
        <div className="space-y-4">
          {lostReports.length === 0 ? (
            <div className="bg-white border border-stone-200 rounded-3xl p-12 text-center text-stone-400 space-y-3">
              <FileText className="w-8 h-8 mx-auto text-stone-300" />
              <p className="text-sm font-bold text-stone-800">No lost item reports found</p>
              <button
                onClick={() => setStudentView("report")}
                className="px-4 py-2 bg-emerald-800 text-white rounded-xl text-xs font-bold"
              >
                Report an Item Now
              </button>
            </div>
          ) : (
            lostReports.map((report) => (
              <div
                key={report.id}
                className="bg-white border border-stone-200 rounded-2xl p-5 sm:p-6 shadow-2xs hover:shadow-xs transition-all space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-100">
                  <div className="flex items-center space-x-2.5">
                    <span className="font-mono text-xs font-bold text-stone-900 bg-stone-100 px-2 py-0.5 rounded-md border border-stone-200">
                      #{report.id}
                    </span>
                    <span className="text-xs font-bold text-emerald-800">
                      {report.extractedAttributes.itemType}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 uppercase">
                      {report.status.replace("_", " ")}
                    </span>
                  </div>
                  <span className="text-xs text-stone-400">
                    Logged: {new Date(report.createdAt).toLocaleDateString()}
                  </span>
                </div>

                <div className="space-y-2">
                  <p className="text-xs text-stone-700 leading-relaxed italic">
                    "{report.rawDescription}"
                  </p>
                  
                  <div className="flex flex-wrap gap-2 pt-1">
                    <span className="px-2.5 py-1 rounded-lg bg-stone-100 text-[11px] text-stone-700 font-semibold border border-stone-200">
                      Color: {report.extractedAttributes.color}
                    </span>
                    <span className="px-2.5 py-1 rounded-lg bg-stone-100 text-[11px] text-stone-700 font-semibold border border-stone-200">
                      Brand: {report.extractedAttributes.brand}
                    </span>
                    <span className="px-2.5 py-1 rounded-lg bg-stone-100 text-[11px] text-stone-700 font-semibold border border-stone-200">
                      Est. Location: {report.estimatedLocation}
                    </span>
                  </div>
                </div>

                <div className="pt-3 border-t border-stone-100 flex items-center justify-between">
                  <div className="text-xs text-stone-500 flex items-center space-x-1">
                    <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                    <span>AI NLP Item Matching active in background</span>
                  </div>

                  <button
                    onClick={() => {
                      setStudentView("search");
                    }}
                    className="px-3.5 py-1.5 bg-emerald-50 hover:bg-emerald-800 text-emerald-900 hover:text-white rounded-xl text-xs font-bold transition-colors flex items-center space-x-1 border border-emerald-200/60"
                  >
                    <span>View Possible Matches</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {claims.length === 0 ? (
            <div className="bg-white border border-stone-200 rounded-3xl p-12 text-center text-stone-400 space-y-3">
              <ShieldCheck className="w-8 h-8 mx-auto text-stone-300" />
              <p className="text-sm font-bold text-stone-800">No active claim requests</p>
              <button
                onClick={() => setStudentView("search")}
                className="px-4 py-2 bg-emerald-800 text-white rounded-xl text-xs font-bold"
              >
                Browse Found Posts
              </button>
            </div>
          ) : (
            claims.map((claim) => {
              const item = foundItems.find(i => i.id === claim.itemId);

              return (
                <div
                  key={claim.id}
                  className="bg-white border border-stone-200 rounded-2xl p-5 sm:p-6 shadow-2xs hover:shadow-xs transition-all space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-100">
                    <div className="flex items-center space-x-2.5">
                      <span className="font-mono text-xs font-bold text-stone-900 bg-stone-100 px-2 py-0.5 rounded-md border border-stone-200">
                        Claim #{claim.id}
                      </span>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        claim.status === "ready_for_retrieval"
                          ? "bg-emerald-100 text-emerald-800 animate-pulse"
                          : claim.status === "approved"
                          ? "bg-stone-200 text-stone-800"
                          : claim.status === "released"
                          ? "bg-stone-100 text-stone-700"
                          : claim.status === "rejected"
                          ? "bg-red-100 text-red-800"
                          : "bg-amber-100 text-amber-800"
                      }`}>
                        {claim.status.replace(/_/g, " ")}
                      </span>
                    </div>

                    <span className="text-xs text-stone-400">
                      Submitted: {new Date(claim.submittedDate).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="flex items-start space-x-4">
                    {item && (
                      <img
                        src={item.imageUrl}
                        alt={item.title}
                        referrerPolicy="no-referrer"
                        className="w-16 h-16 rounded-xl object-cover border border-stone-200 shrink-0"
                      />
                    )}
                    <div className="flex-1 min-w-0 space-y-1">
                      <h4 className="text-sm font-bold text-stone-900">
                        {item?.title || `Item #${claim.itemId}`}
                      </h4>
                      <p className="text-xs text-stone-500">
                        Handover venue: San Pablo City LGU Office
                      </p>
                      <p className="text-xs text-stone-700 line-clamp-1">
                        Proof: {claim.proofOfOwnership}
                      </p>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-stone-100 flex items-center justify-between">
                    <span className="text-xs text-stone-500">
                      {claim.status === "ready_for_retrieval"
                        ? "Approved • Coordinate LGU office handover"
                        : "LGU desk officers reviewing ownership proof"}
                    </span>

                    <button
                      onClick={() => {
                        setSelectedClaim(claim);
                        setStudentView("claim_tracking");
                      }}
                      className="px-3.5 py-1.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-bold transition-colors flex items-center space-x-1"
                    >
                      <span>Track Progress</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};
