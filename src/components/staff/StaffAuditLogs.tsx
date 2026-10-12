import React, { useState } from "react";
import { useApp } from "../../context/AppContext";
import { 
  Activity, 
  Search, 
  Filter, 
  Calendar, 
  User, 
  HardDrive, 
  ShieldCheck, 
  Download,
  CheckCircle2,
  AlertTriangle
} from "lucide-react";

export const StaffAuditLogs: React.FC = () => {
  const { auditLogs, setStaffView } = useApp();

  const [searchQuery, setSearchQuery] = useState("");
  const [actionFilter, setActionFilter] = useState<string>("all");

  const filteredLogs = auditLogs.filter(log => {
    const matchesSearch = (
      log.user.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.details.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (log.itemId && log.itemId.toLowerCase().includes(searchQuery.toLowerCase()))
    );
    const matchesAction = actionFilter === "all" || log.action === actionFilter;
    return matchesSearch && matchesAction;
  });

  const handleExportCSV = () => {
    const headers = "ID,Timestamp,User,Role,Action,Details,Device,Result\n";
    const rows = filteredLogs.map(l => `"${l.id}","${l.timestamp}","${l.user}","${l.role}","${l.action}","${l.details}","${l.device}","${l.result}"`).join("\n");
    const blob = new Blob([headers + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `audit_logs_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  };

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs text-stone-500 mb-1">
            <button onClick={() => setStaffView("dashboard")} className="hover:text-blue-800">LGU Dashboard</button>
            <span>/</span>
            <span className="text-stone-900 font-semibold">Security & Audit Logs</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight">
            Security & Operational Audit Trail
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 mt-0.5">
            Immutable system logs of item registrations, claim decisions, citizen verifications, and door unlocks.
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          className="px-4 py-2.5 bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center space-x-1.5 self-start sm:self-auto"
        >
          <Download className="w-4 h-4" />
          <span>Export CSV Log</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white border border-stone-200/80 rounded-2xl p-4 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by staff name, student ID, item..."
            className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl border border-stone-200 bg-stone-50/50 text-stone-800 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-700"
          />
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl border border-stone-200 bg-stone-50/50 text-stone-700 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-700"
          >
            <option value="all">All Operational Events ({auditLogs.length})</option>
            <option value="ITEM_REGISTERED">Item Registered</option>
            <option value="CLAIM_SUBMITTED">Claim Submitted</option>
            <option value="CLAIM_APPROVED">Claim Approved</option>
            <option value="CLAIM_REJECTED">Claim Rejected</option>
            <option value="ITEM_RELEASED">Item Released</option>
            <option value="DOOR_UNLOCKED">Door Unlocked</option>
            <option value="SLOT_ASSIGNED">Slot Assigned</option>
          </select>
        </div>
      </div>

      {/* Logs Container: Desktop Table vs Mobile Cards */}
      {/* Desktop Table View */}
      <div className="hidden md:block bg-white border border-stone-200/80 rounded-2xl overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-100/70 border-b border-stone-200/80 text-stone-600 font-semibold">
              <tr>
                <th className="px-4 py-3.5">Log Reference & Time</th>
                <th className="px-4 py-3.5">Actor / User</th>
                <th className="px-4 py-3.5">Action Event</th>
                <th className="px-4 py-3.5">Details & Target Entity</th>
                <th className="px-4 py-3.5">Terminal / Device</th>
                <th className="px-4 py-3.5 text-right">Result</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 text-stone-700">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-stone-400">
                    No log entries match the selected filters.
                  </td>
                </tr>
              ) : (
                filteredLogs.map(log => (
                  <tr key={log.id} className="hover:bg-stone-50/80 transition-colors">
                    <td className="px-4 py-3.5">
                      <span className="font-mono font-bold text-stone-900 block">{log.id}</span>
                      <span className="text-[11px] text-stone-400 font-mono mt-0.5">{log.timestamp}</span>
                    </td>

                    <td className="px-4 py-3.5">
                      <p className="font-semibold text-stone-800">{log.user}</p>
                      <p className="text-[11px] text-stone-400">{log.role}</p>
                    </td>

                    <td className="px-4 py-3.5">
                      <span className="px-2 py-0.5 rounded-md bg-stone-100 border border-stone-200 text-[11px] font-bold text-stone-800 uppercase tracking-wider font-mono">
                        {log.action.replace(/_/g, " ")}
                      </span>
                    </td>

                    <td className="px-4 py-3.5 max-w-xs">
                      <p className="text-stone-700 leading-relaxed font-medium line-clamp-2">{log.details}</p>
                      {log.itemId && (
                        <span className="text-[10px] font-mono text-blue-800 font-bold mt-1 inline-block">
                          Ref: #{log.itemId}
                        </span>
                      )}
                    </td>

                    <td className="px-4 py-3.5 text-stone-500 font-mono text-[11px]">
                      {log.device || "Kiosk Console"}
                    </td>

                    <td className="px-4 py-3.5 text-right">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        log.result === "Success"
                          ? "bg-blue-100 text-blue-800"
                          : log.result === "Rejected"
                          ? "bg-red-100 text-red-800"
                          : "bg-amber-100 text-amber-800"
                      }`}>
                        {log.result}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Card Deck View */}
      <div className="md:hidden space-y-3">
        {filteredLogs.length === 0 ? (
          <div className="bg-white border border-stone-200/80 rounded-2xl p-8 text-center text-stone-400 text-xs">
            No log entries match the selected filters.
          </div>
        ) : (
          filteredLogs.map(log => (
            <div key={log.id} className="bg-white border border-stone-200/80 rounded-2xl p-4 shadow-2xs space-y-2.5 text-xs">
              <div className="flex items-center justify-between gap-2 border-b border-stone-100 pb-2">
                <div className="flex items-center space-x-2">
                  <span className="font-mono font-bold text-stone-900 bg-stone-100 px-2 py-0.5 rounded text-[11px]">
                    {log.id}
                  </span>
                  <span className="text-[10px] text-stone-400 font-mono">
                    {log.timestamp}
                  </span>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  log.result === "Success"
                    ? "bg-blue-100 text-blue-800"
                    : log.result === "Rejected"
                    ? "bg-red-100 text-red-800"
                    : "bg-amber-100 text-amber-800"
                }`}>
                  {log.result}
                </span>
              </div>

              <div>
                <div className="flex items-center justify-between gap-2">
                  <span className="px-2 py-0.5 rounded-md bg-stone-100 border border-stone-200 text-[10px] font-bold text-stone-800 uppercase tracking-wider font-mono">
                    {log.action.replace(/_/g, " ")}
                  </span>
                  <span className="text-[11px] font-semibold text-stone-700">
                    {log.user} ({log.role})
                  </span>
                </div>
                <p className="text-stone-700 leading-relaxed font-medium mt-1.5 break-words">
                  {log.details}
                </p>
              </div>

              <div className="flex items-center justify-between text-[10px] text-stone-400 pt-1 border-t border-stone-100">
                <span>Device: {log.device || "Kiosk Console"}</span>
                {log.itemId && (
                  <span className="font-mono text-blue-800 font-bold">
                    Ref: #{log.itemId}
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
