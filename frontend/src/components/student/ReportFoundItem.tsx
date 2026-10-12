import React from "react";
import { useApp } from "../../context/AppContext";
import { 
  PackageSearch, 
  MapPin, 
  Clock, 
  ShieldCheck, 
  FileText, 
  CheckCircle2, 
  AlertTriangle,
  ArrowRight,
  Search
} from "lucide-react";

export const ReportFoundItem: React.FC = () => {
  const { setStudentView } = useApp();

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 sm:space-y-8 animate-in fade-in duration-700 pb-8 relative">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-[2rem] bg-stone-950 text-white p-8 sm:p-10 shadow-2xl border border-stone-800/60 group">
        <div className="absolute top-0 right-0 -mt-20 -mr-20 w-96 h-96 bg-blue-600/20 rounded-full blur-[80px] pointer-events-none group-hover:bg-blue-500/30 transition-all duration-700" />
        <div className="absolute bottom-0 left-1/4 -mb-20 w-80 h-80 bg-indigo-600/20 rounded-full blur-[80px] pointer-events-none group-hover:bg-indigo-500/30 transition-all duration-700" />
        
        <div className="relative z-10">
          <div className="inline-flex items-center space-x-2 px-3 py-1 mb-4 rounded-full bg-white/5 backdrop-blur-md border border-white/10 text-xs font-semibold text-blue-300 shadow-inner">
            <PackageSearch className="w-4 h-4 text-blue-400" />
            <span>Official Campus Protocol</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white via-blue-100 to-stone-400 tracking-tight">
            Surrender a Found Item
          </h1>
          <p className="text-stone-300/80 text-sm sm:text-base mt-2 max-w-2xl font-medium leading-relaxed">
            Found property on campus must be surrendered directly to the Guidance Office. In compliance with school property custody rules, students do not maintain online finder accounts or self-publish found listings.
          </p>
        </div>
      </div>

      {/* Primary Office Location Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-6 bg-white rounded-3xl border border-stone-200/80 shadow-xs flex items-start space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-700 shrink-0">
            <MapPin className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-stone-400">Physical Office</h3>
            <p className="text-base font-extrabold text-stone-900 mt-0.5">Guidance Office</p>
            <p className="text-xs text-stone-500 mt-1 font-medium">Administration Bldg, Room 102</p>
          </div>
        </div>

        <div className="p-6 bg-white rounded-3xl border border-stone-200/80 shadow-xs flex items-start space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700 shrink-0">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-stone-400">Office Hours</h3>
            <p className="text-base font-extrabold text-stone-900 mt-0.5">Mon – Fri, 8:00 AM – 5:00 PM</p>
            <p className="text-xs text-stone-500 mt-1 font-medium">Regular school days (except holidays)</p>
          </div>
        </div>

        <div className="p-6 bg-white rounded-3xl border border-stone-200/80 shadow-xs flex items-start space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700 shrink-0">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-stone-400">Chain of Custody</h3>
            <p className="text-base font-extrabold text-stone-900 mt-0.5">Official Verification</p>
            <p className="text-xs text-stone-500 mt-1 font-medium">Protected storage &amp; logged intake</p>
          </div>
        </div>
      </div>

      {/* Step by Step Turnover Process */}
      <div className="bg-white/90 backdrop-blur-xl rounded-[2rem] p-6 sm:p-8 shadow-sm border border-stone-200/80 space-y-6">
        <div>
          <h2 className="text-xl font-extrabold text-stone-900">
            Guidance Office Turnover Procedure
          </h2>
          <p className="text-sm text-stone-500 mt-1">
            Follow these standard steps when you find an unattended item on campus:
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-5 rounded-2xl bg-stone-50 border border-stone-200/70 space-y-2">
            <div className="flex items-center space-x-2 text-blue-700 font-bold text-sm">
              <span className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-xs">1</span>
              <span>Surrender in Person</span>
            </div>
            <p className="text-xs text-stone-600 leading-relaxed">
              Bring the unattended property to Administration Bldg Room 102 as soon as reasonably possible.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-stone-50 border border-stone-200/70 space-y-2">
            <div className="flex items-center space-x-2 text-blue-700 font-bold text-sm">
              <span className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-xs">2</span>
              <span>Guidance Intake Logging</span>
            </div>
            <p className="text-xs text-stone-600 leading-relaxed">
              A Guidance Encoder records the item category, discovery location, date/time, and initial condition assessment.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-stone-50 border border-stone-200/70 space-y-2">
            <div className="flex items-center space-x-2 text-blue-700 font-bold text-sm">
              <span className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-xs">3</span>
              <span>Private Verification Recording</span>
            </div>
            <p className="text-xs text-stone-600 leading-relaxed">
              Identifying details (serial numbers, distinctive marks, contents) are cataloged privately to evaluate future claims.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-stone-50 border border-stone-200/70 space-y-2">
            <div className="flex items-center space-x-2 text-blue-700 font-bold text-sm">
              <span className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-xs">4</span>
              <span>Head Approval &amp; Publishing</span>
            </div>
            <p className="text-xs text-stone-600 leading-relaxed">
              The Guidance Head reviews and approves the item for public listing, allowing the rightful owner to search and claim.
            </p>
          </div>
        </div>

        {/* Advisory Box */}
        <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200/70 text-xs text-amber-900 flex items-start space-x-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold">Why can't students post found items directly?</p>
            <p className="text-amber-800 leading-relaxed">
              Direct peer-to-peer exchange of lost campus property increases the risk of erroneous handovers, harassment, and unverified possession. Centralizing intake through the Guidance Office ensures strict privacy, impartial verification, and full institutional accountability.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-stone-100">
          <button
            onClick={() => setStudentView("home")}
            className="w-full sm:w-auto px-6 py-3 bg-blue-700 hover:bg-blue-800 text-white rounded-2xl font-bold text-xs flex items-center justify-center space-x-2 transition-all shadow-md active:scale-[0.98]"
          >
            <Search className="w-4 h-4" />
            <span>Search Found Property Directory</span>
          </button>
          <button
            onClick={() => setStudentView("report")}
            className="w-full sm:w-auto px-6 py-3 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-2xl font-bold text-xs flex items-center justify-center space-x-2 transition-all border border-stone-200"
          >
            <span>Lost an item instead? Report Lost</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
