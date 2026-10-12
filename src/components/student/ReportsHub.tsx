import React from "react";
import { useApp } from "../../context/AppContext";
import { FileSearch, Search, MapPin } from "lucide-react";

export const ReportsHub: React.FC = () => {
  const { setStudentView } = useApp();

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6 pb-24 md:pb-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-extrabold text-stone-900 tracking-tight">Report Hub</h1>
        <p className="text-sm md:text-base text-stone-500 font-medium">What would you like to do today?</p>
      </div>

      <div className="grid gap-4">
        {/* Report Lost Item */}
        <button
          onClick={() => setStudentView("report_lost")}
          className="flex items-center p-5 bg-white border border-stone-200/60 rounded-[2rem] shadow-sm hover:shadow-md hover:border-blue-200 hover:bg-blue-50/30 transition-all text-left group"
        >
          <div className="w-14 h-14 rounded-2xl bg-blue-100 flex items-center justify-center text-blue-600 shadow-inner mr-4 group-hover:scale-105 transition-transform">
            <FileSearch className="w-7 h-7" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-extrabold text-stone-900">Report Lost Item</h3>
            <p className="text-sm text-stone-500 font-medium mt-0.5">I lost something and need help finding it.</p>
          </div>
        </button>

        {/* Report Found Item */}
        <button
          onClick={() => setStudentView("report_found")}
          className="flex items-center p-5 bg-white border border-stone-200/60 rounded-[2rem] shadow-sm hover:shadow-md hover:border-emerald-200 hover:bg-emerald-50/30 transition-all text-left group"
        >
          <div className="w-14 h-14 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-600 shadow-inner mr-4 group-hover:scale-105 transition-transform">
            <MapPin className="w-7 h-7" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-extrabold text-stone-900">Report Found Item</h3>
            <p className="text-sm text-stone-500 font-medium mt-0.5">I found something and want to return it.</p>
          </div>
        </button>

        {/* Browse Items */}
        <button
          onClick={() => setStudentView("search")}
          className="flex items-center p-5 bg-white border border-stone-200/60 rounded-[2rem] shadow-sm hover:shadow-md hover:border-amber-200 hover:bg-amber-50/30 transition-all text-left group"
        >
          <div className="w-14 h-14 rounded-2xl bg-amber-100 flex items-center justify-center text-amber-600 shadow-inner mr-4 group-hover:scale-105 transition-transform">
            <Search className="w-7 h-7" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-extrabold text-stone-900">Browse Items</h3>
            <p className="text-sm text-stone-500 font-medium mt-0.5">Look through items reported as found.</p>
          </div>
        </button>
      </div>
    </div>
  );
};
