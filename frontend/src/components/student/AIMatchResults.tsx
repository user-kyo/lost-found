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
    setActiveMatchResults, 
    setSelectedItem, 
    setStudentView,
    user
  } = useApp();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(false);
  const [serverMatches, setServerMatches] = useState<AIMatchResult[]>([]);

  // Fetch real NLP-ranked search results from the Node/Python backend
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      const q = searchQuery.trim() || (lastSubmittedReport?.rawDescription || "lost item");
      
      setIsLoading(true);
      fetch("/api/search", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${user?.token}`
        },
        body: JSON.stringify({ query: q })
      })
      .then(res => res.json())
      .then(data => {
        // if data is just unranked posts, we map them. If it's ranked objects, we use them.
        if (Array.isArray(data)) {
          const formatted = data.map((d: any) => {
            const actualItem = d.item || d.record || d;
            const simScore = d.similarityScore !== undefined ? d.similarityScore : 70;
            
            return {
              item: actualItem,
              similarityScore: simScore,
              confidence: simScore > 50 ? "High" : "Medium",
              matchedAttributes: d.matchedAttributes || ["Category match"],
              discrepancies: d.discrepancies || [],
              aiSummary: d.aiSummary || (d.similarityScore !== undefined ? "Ranked by Hybrid TF-IDF AI Engine" : "Unranked item")
            };
          });
          setServerMatches(formatted);
        }
      })
      .catch(err => console.error("Search API failed", err))
      .finally(() => setIsLoading(false));
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, lastSubmittedReport, user?.token]);

  const filtered = serverMatches.filter(({ item }) => {
    if (!item) return false;
    const matchesCategory = selectedCategory === "all" || item.category === selectedCategory;
    return matchesCategory;
  });

  const handleSelectMatch = (item: FoundItem) => {
    setSelectedItem(item);
    setStudentView("match_details");
  };

  return (
    <div className="w-full space-y-6">
      {/* Header Breadcrumb */}
      <div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight">
              Browse Found Items
            </h1>
            <p className="text-sm text-stone-500 mt-1 font-medium">
              Search and filter through all items reported as found.
            </p>
          </div>
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
      <div className="bg-white/70 backdrop-blur-xl border border-stone-200/80 rounded-[2rem] p-5 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-96">
          <Search className="w-5 h-5 text-stone-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search items, colors, brands..."
            className="w-full pl-11 pr-4 py-3 text-sm rounded-2xl border-2 border-transparent focus:outline-hidden focus:border-amber-400 bg-white shadow-inner transition-all"
          />
        </div>

        <div className="flex items-center space-x-3 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-4 py-3 text-sm rounded-2xl border-2 border-transparent bg-white shadow-inner text-stone-700 focus:outline-hidden focus:border-amber-400 transition-all font-medium"
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
          <Sparkles className="w-8 h-8 mx-auto mb-2 text-blue-800 animate-spin" />
          <p>Ranking approved public found-item posts...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white border border-stone-200/80 rounded-[2rem] p-12 text-center space-y-5 shadow-sm">
          <div className="w-16 h-16 rounded-full bg-stone-100 text-stone-400 flex items-center justify-center mx-auto shadow-inner">
            <Search className="w-8 h-8 text-stone-500" />
          </div>
          <div>
            <h3 className="text-xl font-extrabold text-stone-900">No items found</h3>
            <p className="text-sm text-stone-500 max-w-md mx-auto mt-2 font-medium">
              We couldn't find any items matching your search criteria. Try adjusting your filters or checking back later.
            </p>
          </div>
          <button
            onClick={() => {
              setSearchQuery("");
              setSelectedCategory("all");
            }}
            className="px-6 py-3 bg-stone-900 text-white rounded-xl text-sm font-bold shadow-md hover:bg-stone-800 transition-colors"
          >
            Clear Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map(({ item, matchedAttributes }, index) => {
            return (
              <div
                key={item.id}
                className="bg-white border border-stone-200/60 hover:border-amber-300 rounded-[2rem] overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between group"
              >
                <div>
                  {/* Photo & Match Badge Container */}
                  <div className="relative aspect-4/3 bg-stone-100 overflow-hidden flex items-center justify-center">
                    {item.imageUrl ? (
                      <img
                        src={item.imageUrl}
                        alt={item.title || "Found Item"}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="text-stone-300 group-hover:scale-110 transition-transform duration-500">
                        <Search className="w-12 h-12" />
                      </div>
                    )}
                    
                    {/* Owner-visible rank only */}
                    <div className="absolute top-4 left-4">
                      <div className="px-3 py-1.5 rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-md backdrop-blur-md bg-stone-900/80 text-white border border-white/10">
                        <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                        <span>Rank #{index + 1}</span>
                      </div>
                    </div>

                    {/* Status Badge */}
                    <div className="absolute top-4 right-4">
                      <span className="px-3 py-1.5 rounded-xl bg-white/90 backdrop-blur-md text-[10px] font-extrabold text-stone-800 shadow-md uppercase tracking-wider">
                        {item.status ? item.status.replace("_", " ") : "AVAILABLE"}
                      </span>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-6 space-y-4">
                    <div>
                      <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider bg-amber-50 px-2 py-1 rounded-lg">
                        {item.category}
                      </span>
                      <h3 className="text-lg font-extrabold text-stone-900 group-hover:text-amber-600 transition-colors capitalize mt-3">
                        {item.title || `${item.color} ${item.category}`}
                      </h3>
                      <p className="text-sm text-stone-500 mt-1.5 line-clamp-2 leading-relaxed first-letter:capitalize font-medium">
                        {item.publicDescription || item.description}
                      </p>
                    </div>

                    {/* Matching Attributes Pill Checklist */}
                    <div className="pt-3 border-t border-stone-100">
                      <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block mb-1.5">
                        Public Clues
                      </span>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {matchedAttributes.slice(0, 3).map((attr, i) => (
                          <span
                            key={i}
                            className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-stone-100 text-stone-700 text-[11px] font-bold border border-stone-200/60"
                          >
                            <Check className="w-3.5 h-3.5 text-amber-500" />
                            <span>{attr.replace("✓ ", "")}</span>
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Found Meta details */}
                    <div className="space-y-2 text-xs text-stone-500 pt-2 font-medium">
                      <div className="flex items-center space-x-2">
                        <MapPin className="w-4 h-4 text-stone-400 shrink-0" />
                        <span className="truncate capitalize">Found: {item.areaFound || item.foundLocation}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-4 h-4 text-stone-400 shrink-0" />
                        <span>Date Logged: {item.dateFound ? new Date(item.dateFound).toLocaleDateString() : item.foundDate}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card CTA */}
                <div className="p-6 pt-0">
                  <button
                    onClick={() => handleSelectMatch(item)}
                    className="w-full py-3 px-4 bg-stone-100 hover:bg-stone-900 text-stone-900 hover:text-white text-sm font-extrabold rounded-2xl transition-all flex items-center justify-center space-x-2 group-hover:bg-amber-400 group-hover:text-stone-900 shadow-sm"
                  >
                    <span>View Item Details</span>
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
