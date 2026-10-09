import React, { useState, useEffect } from "react";
import { useApp } from "../../context/AppContext";
import { AIMatchResult, FoundItem } from "../../types";
import { matchFoundItemsWithReport } from "../../services/nlpService";
import { 
  Sparkles, 
  ShieldAlert, 
  MapPin, 
  Calendar, 
  Tag, 
  ArrowRight, 
  Filter, 
  Search, 
  CheckCircle2, 
  Info,
  ChevronRight,
  Check
} from "lucide-react";

export const AIMatchResults: React.FC = () => {
  const { 
    foundItems, 
    lastSubmittedReport, 
    activeMatchResults, 
    setActiveMatchResults, 
    setSelectedItem, 
    setStudentView 
  } = useApp();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(false);

  // If no match results yet, calculate on mount using last report or default
  useEffect(() => {
    if (activeMatchResults.length === 0 && lastSubmittedReport) {
      setIsLoading(true);
      matchFoundItemsWithReport(
        lastSubmittedReport.rawDescription,
        lastSubmittedReport.extractedAttributes,
        foundItems
      ).then(results => {
        setActiveMatchResults(results);
        setIsLoading(false);
      });
    }
  }, [lastSubmittedReport, foundItems, activeMatchResults.length, setActiveMatchResults]);

  // Display items: either activeMatchResults or mapped from foundItems
  const displayResults: AIMatchResult[] = activeMatchResults.length > 0
    ? activeMatchResults
    : foundItems.map(item => ({
        item,
        similarityScore: 70,
        confidence: "Medium",
        matchedAttributes: [`${item.itemType} in inventory`, `${item.color} color`],
        discrepancies: [],
        aiSummary: "Found item in municipal inventory matching general category."
      }));

  const filtered = displayResults.filter(({ item }) => {
    const matchesQuery = (
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.itemType.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.color.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.foundLocation.toLowerCase().includes(searchQuery.toLowerCase())
    );
    const matchesCategory = selectedCategory === "all" || item.category === selectedCategory;
    return matchesQuery && matchesCategory;
  });

  const handleSelectMatch = (item: FoundItem) => {
    setSelectedItem(item);
    setStudentView("match_details");
  };

  return (
    <div className="w-full space-y-6">
      {/* Header Breadcrumb */}
      <div>
        <div className="flex items-center space-x-2 text-xs text-stone-500 mb-2">
          <button onClick={() => setStudentView("home")} className="hover:text-emerald-800">Home</button>
          <span>/</span>
          <button onClick={() => setStudentView("report")} className="hover:text-emerald-800">Report</button>
          <span>/</span>
          <span className="text-stone-900 font-semibold">Possible Matches</span>
        </div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight">
              Possible Matches
            </h1>
            <p className="text-sm text-stone-500 mt-1">
              We ranked approved public posts that may match your description.
            </p>
          </div>

          <button
            onClick={() => setStudentView("report")}
            className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold rounded-xl transition-colors self-start md:self-auto flex items-center space-x-1.5 border border-stone-200"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span>Refine Lost Description</span>
          </button>
        </div>
      </div>

      {/* Transparent Disclaimer Banner */}
      <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-start space-x-3">
        <ShieldAlert className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
        <div className="text-xs text-amber-900 leading-relaxed">
          <span className="font-bold">Important Notice: </span>
          Matches are suggestions only. Scores are hidden from claimants and final ownership must be verified by authorized LGU staff at the LGU office.
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-stone-200 rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search items, colors, brands..."
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-stone-200 focus:outline-hidden focus:ring-2 focus:ring-emerald-700 bg-stone-50/50"
          />
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto overflow-x-auto">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl border border-stone-200 bg-white text-stone-700 focus:outline-hidden focus:ring-2 focus:ring-emerald-700"
          >
            <option value="all">All Categories</option>
            <option value="Bags & Backpacks">Bags & Backpacks</option>
            <option value="Bottles & Containers">Bottles & Containers</option>
            <option value="Electronics">Electronics</option>
            <option value="Apparel & Accessories">Apparel & Accessories</option>
            <option value="Keys & Badges">Keys & Badges</option>
          </select>

          <span className="text-xs text-stone-400 whitespace-nowrap">
            {filtered.length} candidate(s)
          </span>
        </div>
      </div>

      {/* Results Grid */}
      {isLoading ? (
        <div className="py-16 text-center text-stone-400 text-sm">
          <Sparkles className="w-8 h-8 mx-auto mb-2 text-emerald-800 animate-spin" />
          <p>Ranking approved public found-item posts...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white border border-stone-200 rounded-3xl p-12 text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-stone-100 text-stone-400 flex items-center justify-center mx-auto">
            <Search className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-stone-800">No matching items found</h3>
          <p className="text-xs text-stone-500 max-w-md mx-auto">
            No surrendered items match this criteria yet. Your lost report remains active and staff will be notified if a matching item is registered.
          </p>
          <button
            onClick={() => setStudentView("report")}
            className="px-5 py-2 bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-xs hover:bg-emerald-900"
          >
            Update Report Details
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map(({ item, matchedAttributes }, index) => {
            return (
              <div
                key={item.id}
                className="bg-white border border-stone-200 hover:border-emerald-700 rounded-3xl overflow-hidden shadow-2xs hover:shadow-md transition-all flex flex-col justify-between group"
              >
                <div>
                  {/* Photo & Match Badge Container */}
                  <div className="relative aspect-4/3 bg-stone-100 overflow-hidden">
                    <img
                      src={item.imageUrl}
                      alt={item.title}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    
                    {/* Owner-visible rank only */}
                    <div className="absolute top-3 left-3">
                      <div className="px-3 py-1 rounded-full text-xs font-bold flex items-center space-x-1.5 shadow-md backdrop-blur-md bg-emerald-800/90 text-white">
                        <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                        <span>Rank #{index + 1}</span>
                      </div>
                    </div>

                    {/* Status Badge */}
                    <div className="absolute top-3 right-3">
                      <span className="px-2 py-0.5 rounded-md bg-white/90 backdrop-blur-xs text-[10px] font-bold text-stone-700 shadow-xs uppercase">
                        {item.status.replace("_", " ")}
                      </span>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-5 space-y-3">
                    <div>
                      <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">
                        {item.category} • #{item.id}
                      </span>
                      <h3 className="text-base font-bold text-stone-900 group-hover:text-emerald-800 transition-colors">
                        {item.title}
                      </h3>
                      <p className="text-xs text-stone-600 mt-1 line-clamp-2 leading-relaxed">
                        {item.description}
                      </p>
                    </div>

                    {/* Matching Attributes Pill Checklist */}
                    <div className="pt-2 border-t border-stone-100">
                      <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block mb-1.5">
                        Public Clues
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {matchedAttributes.slice(0, 3).map((attr, i) => (
                          <span
                            key={i}
                            className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-900 text-[11px] font-semibold border border-emerald-200"
                          >
                            <Check className="w-3 h-3 text-emerald-700" />
                            <span>{attr.replace("✓ ", "")}</span>
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Found Meta details */}
                    <div className="space-y-1 text-xs text-stone-600 pt-1">
                      <div className="flex items-center space-x-1.5 text-[11px] text-stone-500">
                        <MapPin className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                        <span className="truncate">Found: {item.foundLocation}</span>
                      </div>
                      <div className="flex items-center space-x-1.5 text-[11px] text-stone-500">
                        <Calendar className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                        <span>Date Logged: {item.foundDate}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card CTA */}
                <div className="p-5 pt-0">
                  <button
                    onClick={() => handleSelectMatch(item)}
                    className="w-full py-2.5 px-4 bg-emerald-50 hover:bg-emerald-800 text-emerald-900 hover:text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center space-x-1.5 shadow-2xs group-hover:bg-emerald-800 group-hover:text-white"
                  >
                    <span>This Might Be My Item</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
