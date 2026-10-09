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
  initialTab?: "reports" | "claims" | "found_items";
}

export const MyReportsAndClaims: React.FC<Props> = ({ initialTab = "reports" }) => {
  const { 
    lostReports, 
    claims, 
    foundItems, 
    setStudentView, 
    setSelectedClaim, 
    setSelectedItem,
    user
  } = useApp();

  const [activeTab, setActiveTab] = useState<"reports" | "claims" | "found_items">(initialTab);
  const [myFoundItems, setMyFoundItems] = useState<any[]>([]);
  const [myClaims, setMyClaims] = useState<any[]>([]);
  const [loadingFoundItems, setLoadingFoundItems] = useState(false);
  const [loadingClaims, setLoadingClaims] = useState(false);

  React.useEffect(() => {
    if (activeTab === "found_items" && user?.token) {
      setLoadingFoundItems(true);
      fetch("/api/posts/mine", {
        headers: { "Authorization": `Bearer ${user.token}` }
      })
      .then(res => res.json())
      .then(data => setMyFoundItems(data))
      .catch(err => console.error("Failed to fetch found items", err))
      .finally(() => setLoadingFoundItems(false));
    }
  }, [activeTab, user?.token]);

  React.useEffect(() => {
    if (activeTab === "claims" && user?.token) {
      setLoadingClaims(true);
      fetch("/api/claims/mine", {
        headers: { "Authorization": `Bearer ${user.token}` }
      })
      .then(res => res.json())
      .then(data => setMyClaims(data))
      .catch(err => console.error("Failed to fetch my claims", err))
      .finally(() => setLoadingClaims(false));
    }
  }, [activeTab, user?.token]);

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

        <div className="flex gap-2">
          <button
            onClick={() => setStudentView("report")}
            className="px-4 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold rounded-xl transition-colors flex items-center space-x-1.5"
          >
            <Sparkles className="w-4 h-4" />
            <span className="hidden sm:inline">Lost Report</span>
          </button>
          <button
            onClick={() => setStudentView("report_found")}
            className="px-4 py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center space-x-1.5"
          >
            <PlusCircle className="w-4 h-4" />
            <span className="hidden sm:inline">Found Item</span>
          </button>
        </div>
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
          <span>My Claim Requests</span>
        </button>

        <button
          onClick={() => setActiveTab("found_items")}
          className={`pb-3 px-3 text-xs font-bold border-b-2 transition-all flex items-center space-x-2 ${
            activeTab === "found_items"
              ? "border-emerald-800 text-emerald-800"
              : "border-transparent text-stone-500 hover:text-stone-900"
          }`}
        >
          <PlusCircle className="w-4 h-4" />
          <span>My Found Items</span>
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
      ) : activeTab === "claims" ? (
        <div className="space-y-4">
          {loadingClaims ? (
            <div className="p-12 text-center text-stone-500 font-semibold">Loading your claims...</div>
          ) : myClaims.length === 0 ? (
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
            myClaims.map((claim) => {
              const item = claim.post; // We include { post: true } in the backend response now

              return (
                <div
                  key={claim.id}
                  className="bg-white border border-stone-200 rounded-2xl p-5 sm:p-6 shadow-2xs hover:shadow-xs transition-all space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-100">
                    <div className="flex items-center space-x-2.5">
                      <span className="font-mono text-xs font-bold text-stone-900 bg-stone-100 px-2 py-0.5 rounded-md border border-stone-200">
                        Claim #{claim.id.slice(-6)}
                      </span>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        claim.status === "approved"
                          ? "bg-emerald-100 text-emerald-800 animate-pulse"
                          : claim.status === "released" || claim.status === "completed"
                          ? "bg-stone-200 text-stone-800"
                          : claim.status === "rejected"
                          ? "bg-red-100 text-red-800"
                          : "bg-amber-100 text-amber-800"
                      }`}>
                        {claim.status.replace(/_/g, " ")}
                      </span>
                    </div>

                    <span className="text-xs text-stone-400">
                      Submitted: {new Date(claim.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="flex items-start space-x-4">
                    {item && (
                      <div className="flex-1 min-w-0 space-y-1">
                        <h4 className="text-sm font-bold text-stone-900">
                          {item.category} - {item.color}
                        </h4>
                        <p className="text-xs text-stone-500">
                          Found at {item.areaFound}
                        </p>
                        <p className="text-xs text-stone-700 line-clamp-1 italic mt-2">
                          Note: "{claim.ownerNote}"
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="pt-3 border-t border-stone-100 flex items-center justify-between">
                    <span className="text-xs text-stone-500">
                      {claim.status === "approved"
                        ? "Approved • Ready for Meetup"
                        : claim.status === "released" || claim.status === "completed"
                        ? "Item has been successfully returned!"
                        : "Waiting for finder/LGU to review your claim"}
                    </span>

                    <button
                      onClick={() => {
                        setSelectedClaim(claim);
                        setStudentView("claim_tracking");
                      }}
                      className="px-3.5 py-1.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-bold transition-colors flex items-center space-x-1"
                    >
                      <span>{claim.status === "released" || claim.status === "completed" ? "View Details" : "Track Progress"}</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {loadingFoundItems ? (
            <div className="p-12 text-center text-stone-500 font-semibold">Loading your submitted items...</div>
          ) : myFoundItems.length === 0 ? (
            <div className="bg-white border border-stone-200 rounded-3xl p-12 text-center text-stone-400 space-y-3">
              <PlusCircle className="w-8 h-8 mx-auto text-stone-300" />
              <p className="text-sm font-bold text-stone-800">You haven't submitted any found items</p>
              <button
                onClick={() => setStudentView("report_found")}
                className="px-4 py-2 bg-emerald-800 text-white rounded-xl text-xs font-bold"
              >
                Submit Found Item
              </button>
            </div>
          ) : (
            myFoundItems.map((item: any) => (
              <div
                key={item.id}
                className="bg-white border border-stone-200 rounded-2xl p-5 sm:p-6 shadow-2xs hover:shadow-xs transition-all space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-100">
                  <div className="flex items-center space-x-2.5">
                    <span className="font-mono text-xs font-bold text-stone-900 bg-stone-100 px-2 py-0.5 rounded-md border border-stone-200">
                      ID: {item.id.slice(-6)}
                    </span>
                    <span className="text-xs font-bold text-emerald-800">
                      {item.category} ({item.color})
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      item.status === 'pending_review' ? 'bg-amber-100 text-amber-800' :
                      item.status === 'available' ? 'bg-emerald-100 text-emerald-800' :
                      item.status === 'rejected' ? 'bg-red-100 text-red-800' : 'bg-stone-100'
                    }`}>
                      {item.status.replace("_", " ")}
                    </span>
                  </div>
                  <span className="text-xs text-stone-400">
                    Found on {new Date(item.dateFound).toLocaleDateString()} at {item.areaFound}
                  </span>
                </div>

                <div className="space-y-3">
                  <div>
                    <h5 className="text-[10px] font-bold text-stone-400 uppercase tracking-wider mb-1">Public Description</h5>
                    <p className="text-xs text-stone-700">{item.publicDescription}</p>
                  </div>
                  
                  {item.privateDetails?.details && (
                    <div className="p-3 bg-stone-50 rounded-xl border border-stone-100">
                      <h5 className="text-[10px] font-bold text-stone-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3" /> Private Details (Hidden from Public)
                      </h5>
                      <p className="text-xs text-stone-600">{item.privateDetails.details}</p>
                    </div>
                  )}

                  {item.flags && item.flags.length > 0 && (
                    <div className="p-3 bg-red-50 rounded-xl border border-red-100">
                      <h5 className="text-[10px] font-bold text-red-700 uppercase tracking-wider mb-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" /> Auto-Flagged by System
                      </h5>
                      <ul className="list-disc pl-4 space-y-1">
                        {item.flags.map((flag: any) => (
                          <li key={flag.id} className="text-xs text-red-600">{flag.detail}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};
