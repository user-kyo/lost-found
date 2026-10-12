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
    <div className="w-full max-w-4xl mx-auto space-y-8 pb-24 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex flex-col gap-2 pt-4 px-4 md:px-0">
        <h1 className="text-3xl md:text-4xl font-extrabold text-stone-900 tracking-tight">
          My Activity
        </h1>
        <p className="text-sm md:text-base text-stone-500 max-w-2xl">
          Track your submitted reports, found items, and claim requests all in one place.
        </p>
      </div>

      {/* Tab Switcher - Segmented Control Style */}
      <div className="px-4 md:px-0">
        <div className="flex p-1.5 bg-stone-100/80 backdrop-blur-md border border-stone-200/50 rounded-3xl w-full overflow-x-auto no-scrollbar shadow-inner">
          <button
            onClick={() => setActiveTab("reports")}
            className={`flex-1 min-w-[120px] py-3 px-3 text-xs md:text-sm font-bold rounded-2xl transition-all flex justify-center items-center space-x-2 ${
              activeTab === "reports"
                ? "bg-white text-stone-900 shadow-sm border border-stone-200/50"
                : "text-stone-500 hover:text-stone-800 hover:bg-stone-200/50"
            }`}
          >
            <FileText className="w-4 h-4 md:w-5 md:h-5" />
            <span>Lost Reports</span>
            {lostReports.length > 0 && (
              <span className={`ml-1.5 px-2 py-0.5 rounded-lg text-[10px] md:text-xs shadow-inner ${activeTab === "reports" ? "bg-stone-100" : "bg-stone-200/50"}`}>
                {lostReports.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab("found_items")}
            className={`flex-1 min-w-[120px] py-3 px-3 text-xs md:text-sm font-bold rounded-2xl transition-all flex justify-center items-center space-x-2 ${
              activeTab === "found_items"
                ? "bg-white text-stone-900 shadow-sm border border-stone-200/50"
                : "text-stone-500 hover:text-stone-800 hover:bg-stone-200/50"
            }`}
          >
            <PlusCircle className="w-4 h-4 md:w-5 md:h-5" />
            <span>Found Items</span>
          </button>

          <button
            onClick={() => setActiveTab("claims")}
            className={`flex-1 min-w-[120px] py-3 px-3 text-xs md:text-sm font-bold rounded-2xl transition-all flex justify-center items-center space-x-2 ${
              activeTab === "claims"
                ? "bg-white text-stone-900 shadow-sm border border-stone-200/50"
                : "text-stone-500 hover:text-stone-800 hover:bg-stone-200/50"
            }`}
          >
            <ShieldCheck className="w-4 h-4 md:w-5 md:h-5" />
            <span>Claims</span>
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="px-4 md:px-0">
        {activeTab === "reports" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            {lostReports.length === 0 ? (
              <div className="md:col-span-2 bg-white/50 backdrop-blur-sm rounded-[2rem] p-12 text-center border border-stone-200/50 shadow-sm flex flex-col items-center justify-center min-h-[300px]">
                <div className="w-20 h-20 bg-stone-100 rounded-full flex items-center justify-center mb-6 shadow-inner">
                  <FileText className="w-10 h-10 text-stone-300" />
                </div>
                <h3 className="text-xl font-bold text-stone-800 mb-2">No lost reports</h3>
                <p className="text-sm text-stone-500 mb-6 max-w-sm">You haven't reported any lost items yet. Let us know if you lose something so we can help you find it.</p>
                <button
                  onClick={() => setStudentView("report")}
                  className="px-6 py-3.5 bg-stone-900 hover:bg-stone-800 text-white rounded-2xl text-sm font-bold transition-all active:scale-95 shadow-md flex items-center space-x-2"
                >
                  <PlusCircle className="w-5 h-5" />
                  <span>Report an Item</span>
                </button>
              </div>
            ) : (
              lostReports.map((report) => (
                <div
                  key={report.id}
                  className="bg-white/70 backdrop-blur-md border border-stone-200/50 rounded-[2rem] p-6 md:p-8 shadow-sm hover:shadow-md transition-all space-y-5 flex flex-col justify-between group"
                >
                  <div>
                    <div className="flex items-start justify-between border-b border-stone-100 pb-4 mb-4">
                      <div className="flex flex-col">
                        <span className="font-mono text-xs font-bold text-stone-400 bg-stone-100 px-2 py-0.5 rounded-md w-fit mb-1.5">
                          #{report.id.slice(0, 8)}
                        </span>
                        <h4 className="text-xl font-bold text-stone-900 capitalize leading-tight">
                          {report.extractedAttributes.itemType || "Unknown Item"}
                        </h4>
                      </div>
                      <div className="flex flex-col items-end text-right">
                        <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 uppercase tracking-wider border border-amber-200">
                          {report.status.replace("_", " ")}
                        </span>
                        <span className="text-xs text-stone-400 mt-2 font-medium">
                          {new Date(report.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <p className="text-sm text-stone-700 leading-relaxed italic bg-stone-50/80 p-4 rounded-2xl border border-stone-200/50 shadow-inner">
                        "{report.rawDescription}"
                      </p>
                      
                      <div className="flex flex-wrap gap-2">
                        {report.extractedAttributes.color && (
                          <span className="px-3 py-1.5 rounded-xl bg-white text-xs text-stone-600 font-medium border border-stone-200/80 shadow-xs">
                            <span className="text-stone-400 mr-1">Color:</span>
                            <span className="text-stone-900 font-bold">{report.extractedAttributes.color}</span>
                          </span>
                        )}
                        {report.extractedAttributes.brand && (
                          <span className="px-3 py-1.5 rounded-xl bg-white text-xs text-stone-600 font-medium border border-stone-200/80 shadow-xs">
                            <span className="text-stone-400 mr-1">Brand:</span>
                            <span className="text-stone-900 font-bold">{report.extractedAttributes.brand}</span>
                          </span>
                        )}
                        {report.estimatedLocation && (
                          <span className="px-3 py-1.5 rounded-xl bg-white text-xs text-stone-600 font-medium border border-stone-200/80 shadow-xs">
                            <span className="text-stone-400 mr-1">Loc:</span>
                            <span className="text-stone-900 font-bold line-clamp-1 max-w-[120px]">{report.estimatedLocation}</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="pt-5 mt-auto flex items-center justify-between">
                    <div className="flex items-center space-x-2 px-3 py-1.5 bg-amber-50 rounded-xl border border-amber-100/50">
                      <Sparkles className="w-4 h-4 text-amber-500 animate-pulse" />
                      <span className="text-xs font-bold text-amber-700">AI Matching</span>
                    </div>

                    <button
                      onClick={() => setStudentView("search")}
                      className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 shadow-sm active:scale-95"
                    >
                      <span>View Matches</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : activeTab === "found_items" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            {loadingFoundItems ? (
              <div className="md:col-span-2 p-12 text-center text-stone-400 font-semibold text-sm">Loading found items...</div>
            ) : myFoundItems.length === 0 ? (
              <div className="md:col-span-2 bg-white/50 backdrop-blur-sm rounded-[2rem] p-12 text-center border border-stone-200/50 shadow-sm flex flex-col items-center justify-center min-h-[300px]">
                <div className="w-20 h-20 bg-stone-100 rounded-full flex items-center justify-center mb-6 shadow-inner">
                  <PlusCircle className="w-10 h-10 text-stone-300" />
                </div>
                <h3 className="text-xl font-bold text-stone-800 mb-2">No found items</h3>
                <p className="text-sm text-stone-500 mb-6 max-w-sm">You haven't submitted any found items yet. Help your community by reporting things you find.</p>
                <button
                  onClick={() => setStudentView("report_found")}
                  className="px-6 py-3.5 bg-stone-900 hover:bg-stone-800 text-white rounded-2xl text-sm font-bold transition-all active:scale-95 shadow-md flex items-center space-x-2"
                >
                  <PlusCircle className="w-5 h-5" />
                  <span>Submit Found Item</span>
                </button>
              </div>
            ) : (
              myFoundItems.map((item: any) => (
                <div
                  key={item.id}
                  className="bg-white/70 backdrop-blur-md border border-stone-200/50 rounded-[2rem] p-6 md:p-8 shadow-sm hover:shadow-md transition-all space-y-5 flex flex-col justify-between group"
                >
                  <div>
                    <div className="flex items-start justify-between border-b border-stone-100 pb-4 mb-4">
                      <div className="flex flex-col">
                        <span className="font-mono text-xs font-bold text-stone-400 bg-stone-100 px-2 py-0.5 rounded-md w-fit mb-1.5">
                          #{item.id.slice(0, 8)}
                        </span>
                        <h4 className="text-xl font-bold text-stone-900 capitalize leading-tight">
                          {item.category}
                        </h4>
                        <span className="text-sm text-stone-500 mt-0.5 font-medium">({item.color})</span>
                      </div>
                      <div className="flex flex-col items-end text-right">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          item.status === 'pending_review' ? 'bg-amber-100 text-amber-800 border border-amber-200' :
                          item.status === 'available' ? 'bg-blue-100 text-blue-800 border border-blue-200' :
                          item.status === 'rejected' ? 'bg-red-100 text-red-800 border border-red-200' : 
                          'bg-stone-100 text-stone-700'
                        }`}>
                          {item.status.replace("_", " ")}
                        </span>
                        <span className="text-xs text-stone-400 mt-2 font-medium">
                          {new Date(item.dateFound).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <h5 className="text-[10px] font-bold text-stone-400 uppercase tracking-wider mb-2 ml-1">Public Description</h5>
                        <p className="text-sm text-stone-700 leading-relaxed bg-stone-50/80 p-4 rounded-2xl border border-stone-200/50 shadow-inner">
                          {item.publicDescription}
                        </p>
                      </div>
                      
                      {item.privateDetails?.details && (
                        <div>
                          <h5 className="text-[10px] font-bold text-stone-400 uppercase tracking-wider mb-2 flex items-center gap-1.5 ml-1">
                            <ShieldCheck className="w-3.5 h-3.5" /> Private Details
                          </h5>
                          <p className="text-sm text-stone-600 bg-stone-100/50 p-4 rounded-2xl border border-stone-200/50 border-dashed shadow-inner">
                            {item.privateDetails.details}
                          </p>
                        </div>
                      )}

                      {item.flags && item.flags.length > 0 && (
                        <div className="p-4 bg-red-50/80 rounded-2xl border border-red-200/50 shadow-inner">
                          <h5 className="text-[10px] font-bold text-red-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                            <AlertCircle className="w-4 h-4" /> System Alerts
                          </h5>
                          <ul className="list-disc pl-5 space-y-1">
                            {item.flags.map((flag: any) => (
                              <li key={flag.id} className="text-sm text-red-600 font-medium">{flag.detail}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>

                  {item.claims && item.claims.length > 0 && (
                    <div className="pt-5 mt-auto">
                      <div className="flex items-center justify-between mb-3">
                        <h5 className="text-[10px] font-bold text-indigo-500 uppercase tracking-wider ml-1">Claim Requests</h5>
                        <span className="text-xs font-bold bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-lg">{item.claims.length}</span>
                      </div>
                      <div className="space-y-2.5">
                        {item.claims.map((claim: any) => (
                          <div key={claim.id} className="flex items-center justify-between bg-indigo-50/70 p-3.5 rounded-2xl border border-indigo-100/80 shadow-sm gap-3">
                              <div className="flex flex-col">
                                <span className="text-[10px] font-mono font-bold text-indigo-400">#{claim.id.slice(0, 6)}</span>
                                <span className="text-sm font-bold text-indigo-900 capitalize mt-0.5">{claim.status.replace(/_/g, " ")}</span>
                              </div>
                              <button 
                                onClick={() => { 
                                  setSelectedClaim(claim); 
                                  setStudentView("claim_tracking"); 
                                }} 
                                className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl font-bold flex items-center space-x-1 transition-colors shadow-sm active:scale-95"
                              >
                                <span>View</span>
                                <ChevronRight className="w-3 h-3" />
                              </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            {loadingClaims ? (
              <div className="md:col-span-2 p-12 text-center text-stone-400 font-semibold text-sm">Loading claims...</div>
            ) : myClaims.length === 0 ? (
              <div className="md:col-span-2 bg-white/50 backdrop-blur-sm rounded-[2rem] p-12 text-center border border-stone-200/50 shadow-sm flex flex-col items-center justify-center min-h-[300px]">
                <div className="w-20 h-20 bg-stone-100 rounded-full flex items-center justify-center mb-6 shadow-inner">
                  <ShieldCheck className="w-10 h-10 text-stone-300" />
                </div>
                <h3 className="text-xl font-bold text-stone-800 mb-2">No claim requests</h3>
                <p className="text-sm text-stone-500 mb-6 max-w-sm">You haven't requested to claim any items. Found something that belongs to you?</p>
                <button
                  onClick={() => setStudentView("search")}
                  className="px-6 py-3.5 bg-stone-900 hover:bg-stone-800 text-white rounded-2xl text-sm font-bold transition-all active:scale-95 shadow-md flex items-center space-x-2"
                >
                  <Search className="w-5 h-5" />
                  <span>Browse Items</span>
                </button>
              </div>
            ) : (
              myClaims.map((claim) => {
                const item = claim.post;
                return (
                  <div
                    key={claim.id}
                    className="bg-white/70 backdrop-blur-md border border-stone-200/50 rounded-[2rem] p-6 md:p-8 shadow-sm hover:shadow-md transition-all space-y-5 flex flex-col justify-between group"
                  >
                    <div>
                      <div className="flex items-start justify-between border-b border-stone-100 pb-4 mb-4">
                        <div className="flex flex-col">
                          <span className="font-mono text-xs font-bold text-stone-400 bg-stone-100 px-2 py-0.5 rounded-md w-fit mb-2">
                            #{claim.id.slice(0, 8)}
                          </span>
                          <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider inline-block w-fit ${
                            claim.status === "approved"
                              ? "bg-blue-100 text-blue-800 border border-blue-200"
                              : claim.status === "released" || claim.status === "completed"
                              ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                              : claim.status === "rejected"
                              ? "bg-red-100 text-red-800 border border-red-200"
                              : "bg-amber-100 text-amber-800 border border-amber-200"
                          }`}>
                            {claim.status.replace(/_/g, " ")}
                          </span>
                        </div>

                        <span className="text-xs text-stone-400 font-medium bg-stone-50 px-2 py-1 rounded-lg">
                          {new Date(claim.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                        </span>
                      </div>

                      {item && (
                        <div className="bg-stone-50/80 p-4 rounded-2xl border border-stone-200/50 shadow-inner space-y-3">
                          <div className="flex justify-between items-start gap-2">
                            <h4 className="text-sm font-bold text-stone-900 leading-tight">
                              {item.category} <span className="text-stone-500 font-medium">({item.color})</span>
                            </h4>
                            <span className="text-[10px] text-stone-500 font-mono bg-white px-2 py-0.5 rounded-md border border-stone-200 shadow-xs shrink-0">
                              #{item.id.slice(0, 4)}
                            </span>
                          </div>
                          <p className="text-xs text-stone-500 flex items-center space-x-1.5">
                            <span className="font-medium">Loc:</span> <span className="font-bold text-stone-700 bg-white px-2 py-0.5 rounded border border-stone-100">{item.areaFound}</span>
                          </p>
                          {claim.ownerNote && (
                            <p className="text-xs text-stone-600 italic border-l-2 border-stone-300 pl-3 pt-1">
                              "{claim.ownerNote}"
                            </p>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="pt-5 mt-auto flex items-center justify-between">
                      <span className="text-xs font-bold text-stone-500 bg-stone-100 px-3 py-1.5 rounded-xl border border-stone-200/50 flex-1 mr-4 line-clamp-1">
                        {claim.status === "approved"
                          ? "Ready for retrieval"
                          : claim.status === "released" || claim.status === "completed"
                          ? "Successfully returned"
                          : "Under staff review"}
                      </span>

                      <button
                        onClick={() => {
                          setSelectedClaim(claim);
                          setStudentView("claim_tracking");
                        }}
                        className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1.5 shadow-sm active:scale-95 shrink-0 ${
                          claim.status === "released" || claim.status === "completed"
                            ? "bg-stone-200 hover:bg-stone-300 text-stone-800"
                            : "bg-stone-900 hover:bg-stone-800 text-white"
                        }`}
                      >
                        <span>{claim.status === "released" || claim.status === "completed" ? "Details" : "Track"}</span>
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
};

