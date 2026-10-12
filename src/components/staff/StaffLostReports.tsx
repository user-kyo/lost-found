import React, { useState } from "react";
import { useApp } from "../../context/AppContext";
import { 
  FileText, 
  Search, 
  Filter, 
  Sparkles, 
  User, 
  Calendar, 
  ChevronRight,
  ArrowRight
} from "lucide-react";

export const StaffLostReports: React.FC = () => {
  const { lostReports, setStaffView, setSelectedReport } = useApp();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const filteredReports = lostReports.filter(r => {
    const matchesSearch = (
      r.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.studentId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.rawDescription.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.id.toLowerCase().includes(searchQuery.toLowerCase())
    );
    const matchesStatus = statusFilter === "all" || r.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs text-stone-500 mb-1">
            <button onClick={() => setStaffView("dashboard")} className="hover:text-blue-800">LGU Dashboard</button>
            <span>/</span>
            <span className="text-stone-900 font-semibold">Citizen Lost Reports</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight">
            Citizen Lost Reports Catalog
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 mt-0.5">
            Incoming reports filed by citizens and processed by NLP entity extraction.
          </p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white border border-stone-200/80 rounded-2xl p-4 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search report ID, student name, description..."
            className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl border border-stone-200 bg-stone-50/50 text-stone-800 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-700"
          />
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl border border-stone-200 bg-stone-50/50 text-stone-700 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-700"
          >
            <option value="all">All Report Statuses ({lostReports.length})</option>
            <option value="submitted">Submitted</option>
            <option value="analyzing">Analyzing NLP</option>
            <option value="matched">Matches Found</option>
            <option value="claim_submitted">Claim Submitted</option>
            <option value="resolved">Resolved</option>
          </select>
        </div>
      </div>

      {/* Reports Grid */}
      <div className="space-y-4">
        {filteredReports.map((report) => (
          <div
            key={report.id}
            className="bg-white border border-stone-200/80 rounded-2xl p-5 sm:p-6 shadow-2xs hover:shadow-xs transition-all space-y-4"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-100">
              <div className="flex items-center space-x-2.5">
                <span className="font-mono text-xs font-bold text-stone-900 bg-stone-100 px-2 py-0.5 rounded-md">
                  #{report.id}
                </span>
                <span className="text-xs font-bold text-stone-800">
                  {report.studentName} ({report.studentId})
                </span>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                  report.status === "matched"
                    ? "bg-blue-100 text-blue-800"
                    : report.status === "claim_submitted"
                    ? "bg-amber-100 text-amber-800"
                    : "bg-stone-100 text-stone-700"
                }`}>
                  {report.status.replace(/_/g, " ")}
                </span>
              </div>

              <span className="text-xs text-stone-400">
                Filed: {report.lostDate} in {report.estimatedLocation}
              </span>
            </div>

            <p className="text-xs text-stone-700 font-medium bg-stone-50 p-3 rounded-xl border border-stone-200/60 leading-relaxed">
              "{report.rawDescription}"
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-stone-50/50 p-3 rounded-xl border border-stone-200/50">
              <div>
                <span className="text-stone-400 text-[10px] uppercase font-bold block">Type</span>
                <span className="font-semibold text-stone-800">{report.extractedAttributes.itemType}</span>
              </div>
              <div>
                <span className="text-stone-400 text-[10px] uppercase font-bold block">Color</span>
                <span className="font-semibold text-stone-800">{report.extractedAttributes.color}</span>
              </div>
              <div>
                <span className="text-stone-400 text-[10px] uppercase font-bold block">Brand</span>
                <span className="font-semibold text-stone-800">{report.extractedAttributes.brand}</span>
              </div>
              <div>
                <span className="text-stone-400 text-[10px] uppercase font-bold block">NLP Confidence</span>
                <span className="font-semibold text-blue-800">{report.extractedAttributes.confidence}</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <div className="text-xs text-stone-500">
                Contact: {report.email} • {report.phone}
              </div>

              <button
                onClick={() => setStaffView("ai_matches")}
                className="px-3 py-1.5 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-bold transition-colors flex items-center space-x-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>View AI Candidate Matches</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
