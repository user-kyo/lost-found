import React, { useState } from "react";
import { useApp } from "../../context/AppContext";
import { FoundItem } from "../../types";
import { 
  Search, 
  Filter, 
  PlusCircle, 
  HardDrive, 
  MapPin, 
  Calendar, 
  Tag, 
  QrCode, 
  CheckCircle2, 
  Clock, 
  ExternalLink,
  ChevronRight,
  Sparkles
} from "lucide-react";

export const StaffFoundInventory: React.FC = () => {
  const { 
    foundItems, 
    setIsRegisterModalOpen, 
    setSelectedItem, 
    setIsVerifyModalOpen,
    setSelectedClaim,
    claims,
    setStaffView 
  } = useApp();

  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [boxFilter, setBoxFilter] = useState<string>("all");
  const [selectedQrItem, setSelectedQrItem] = useState<FoundItem | null>(null);

  const filteredItems = foundItems.filter(item => {
    const matchesSearch = (
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.color.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.foundLocation.toLowerCase().includes(searchQuery.toLowerCase())
    );
    const matchesCat = categoryFilter === "all" || item.category === categoryFilter;
    const matchesStatus = statusFilter === "all" || item.status === statusFilter;
    const matchesBox = boxFilter === "all" || item.storageBoxId === boxFilter;

    return matchesSearch && matchesCat && matchesStatus && matchesBox;
  });

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs text-stone-500 mb-1">
            <button onClick={() => setStaffView("dashboard")} className="hover:text-blue-800">LGU Dashboard</button>
            <span>/</span>
            <span className="text-stone-900 font-semibold">Found Inventory</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight">
            Found Items Inventory
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 mt-0.5">
            Catalog of surrendered items stored across municipal smart locker compartments.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => setIsRegisterModalOpen(true)}
            className="px-4 py-2.5 bg-blue-800 hover:bg-blue-900 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center space-x-1.5 active:scale-98"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Register New Item</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white border border-stone-200/80 rounded-2xl p-4 shadow-2xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search ID, title, brand, color..."
              className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl border border-stone-200 bg-stone-50/50 text-stone-800 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-700"
            />
          </div>

          <div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-stone-200 bg-stone-50/50 text-stone-700 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-700"
            >
              <option value="all">All Categories</option>
              <option value="Bags & Backpacks">Bags & Backpacks</option>
              <option value="Bottles & Containers">Bottles & Containers</option>
              <option value="Electronics">Electronics</option>
              <option value="Apparel & Accessories">Apparel & Accessories</option>
              <option value="Keys & Badges">Keys & Badges</option>
            </select>
          </div>

          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-stone-200 bg-stone-50/50 text-stone-700 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-700"
            >
              <option value="all">All Item Statuses</option>
              <option value="unclaimed">Unclaimed</option>
              <option value="claim_pending">Claim Pending</option>
              <option value="ready_for_retrieval">Ready for Retrieval</option>
              <option value="claimed">Claimed & Released</option>
            </select>
          </div>

          <div>
            <select
              value={boxFilter}
              onChange={(e) => setBoxFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-stone-200 bg-stone-50/50 text-stone-700 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-700"
            >
              <option value="all">All Storage Lockers</option>
              <option value="BOX-A">Unit A (City Hall Lobby)</option>
              <option value="BOX-B">Unit B (Community Center)</option>
            </select>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-stone-500 pt-1 border-t border-stone-100">
          <span>Showing {filteredItems.length} of {foundItems.length} cataloged items</span>
          <span className="text-blue-700 font-medium">Auto-synced with IoT Smart Lockers</span>
        </div>
      </div>

      {/* Inventory Container: Desktop Table vs Mobile Cards */}
      {/* Desktop Table View */}
      <div className="hidden md:block bg-white border border-stone-200/80 rounded-2xl overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-100/70 border-b border-stone-200/80 text-stone-600 font-semibold">
              <tr>
                <th className="px-4 py-3.5">Item & Photo</th>
                <th className="px-4 py-3.5">Category / Brand</th>
                <th className="px-4 py-3.5">Locker Compartment</th>
                <th className="px-4 py-3.5">Found Location & Date</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-4 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 text-stone-700">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-stone-400">
                    No items match the selected filter criteria.
                  </td>
                </tr>
              ) : (
                filteredItems.map(item => {
                  const relatedClaim = claims.find(c => c.itemId === item.id);

                  return (
                    <tr key={item.id} className="hover:bg-stone-50/80 transition-colors">
                      {/* Item & Photo */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center space-x-3">
                          <img
                            src={item.imageUrl}
                            alt={item.title}
                            referrerPolicy="no-referrer"
                            className="w-12 h-12 rounded-xl object-cover border border-stone-200 shrink-0"
                          />
                          <div>
                            <div className="flex items-center space-x-2">
                              <span className="font-mono font-bold text-stone-900">{item.id}</span>
                            </div>
                            <p className="font-bold text-stone-900 mt-0.5 line-clamp-1">{item.title}</p>
                            <p className="text-[11px] text-stone-500 line-clamp-1">{item.identifyingCharacteristics}</p>
                          </div>
                        </div>
                      </td>

                      {/* Category / Brand */}
                      <td className="px-4 py-3.5">
                        <p className="font-semibold text-stone-800">{item.category}</p>
                        <p className="text-[11px] text-stone-500">{item.brand} • {item.color}</p>
                      </td>

                      {/* Locker Compartment */}
                      <td className="px-4 py-3.5">
                        <div className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-stone-100 border border-stone-200 text-stone-800 font-semibold font-mono text-[11px]">
                          <HardDrive className="w-3.5 h-3.5 text-blue-700" />
                          <span>{item.storageBoxId} : {item.storageSlotId}</span>
                        </div>
                      </td>

                      {/* Found Location & Date */}
                      <td className="px-4 py-3.5">
                        <p className="text-stone-800 font-medium truncate max-w-[180px]">{item.foundLocation}</p>
                        <p className="text-[11px] text-stone-400">{item.foundDate} by {item.surrenderedBy.replace("Staff: ", "")}</p>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3.5">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          item.status === "unclaimed"
                            ? "bg-stone-100 text-stone-700 border border-stone-200"
                            : item.status === "claim_pending"
                            ? "bg-amber-100 text-amber-800 border border-amber-200"
                            : item.status === "ready_for_retrieval"
                            ? "bg-blue-100 text-blue-800 border border-blue-200 animate-pulse"
                            : "bg-stone-200 text-stone-600"
                        }`}>
                          {item.status.replace(/_/g, " ")}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3.5 text-right">
                        <div className="flex items-center justify-end space-x-1.5">
                          <button
                            onClick={() => setSelectedQrItem(item)}
                            title="View QR Label Code"
                            className="p-1.5 rounded-lg text-stone-500 hover:text-stone-800 hover:bg-stone-100 transition-colors"
                          >
                            <QrCode className="w-4 h-4" />
                          </button>

                          {relatedClaim && item.status === "claim_pending" && (
                            <button
                              onClick={() => {
                                setSelectedClaim(relatedClaim);
                                setIsVerifyModalOpen(true);
                              }}
                              className="px-2.5 py-1 bg-blue-800 hover:bg-blue-900 text-white rounded-lg text-[11px] font-semibold transition-colors shadow-2xs"
                            >
                              Verify
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Card Deck View */}
      <div className="md:hidden space-y-3">
        {filteredItems.length === 0 ? (
          <div className="bg-white border border-stone-200/80 rounded-2xl p-8 text-center text-stone-400">
            No items match the selected filter criteria.
          </div>
        ) : (
          filteredItems.map(item => {
            const relatedClaim = claims.find(c => c.itemId === item.id);

            return (
              <div key={item.id} className="bg-white border border-stone-200/80 rounded-2xl p-4 shadow-2xs space-y-3">
                <div className="flex items-start space-x-3">
                  <img
                    src={item.imageUrl}
                    alt={item.title}
                    referrerPolicy="no-referrer"
                    className="w-16 h-16 rounded-xl object-cover border border-stone-200 shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-mono font-bold text-xs text-stone-900">{item.id}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                        item.status === "unclaimed"
                          ? "bg-stone-100 text-stone-700 border border-stone-200"
                          : item.status === "claim_pending"
                          ? "bg-amber-100 text-amber-800 border border-amber-200"
                          : item.status === "ready_for_retrieval"
                          ? "bg-blue-100 text-blue-800 border border-blue-200"
                          : "bg-stone-200 text-stone-600"
                      }`}>
                        {item.status.replace(/_/g, " ")}
                      </span>
                    </div>
                    <h4 className="font-bold text-stone-900 text-sm truncate mt-0.5">{item.title}</h4>
                    <p className="text-[11px] text-stone-500 line-clamp-1">{item.brand} • {item.color}</p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 text-xs pt-2 border-t border-stone-100">
                  <div className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-md bg-stone-100 font-mono text-[11px] text-stone-700">
                    <HardDrive className="w-3 h-3 text-blue-700" />
                    <span>{item.storageBoxId}:{item.storageSlotId}</span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setSelectedQrItem(item)}
                      className="px-2.5 py-1 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg text-xs font-semibold flex items-center space-x-1"
                    >
                      <QrCode className="w-3.5 h-3.5" />
                      <span>QR</span>
                    </button>
                    {relatedClaim && item.status === "claim_pending" && (
                      <button
                        onClick={() => {
                          setSelectedClaim(relatedClaim);
                          setIsVerifyModalOpen(true);
                        }}
                        className="px-3 py-1 bg-blue-800 text-white rounded-lg text-xs font-semibold shadow-xs"
                      >
                        Verify Claim
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* QR Code Label Inspection Modal */}
      {selectedQrItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-sm w-full shadow-2xl border border-stone-200 space-y-4 text-center">
            <div className="w-10 h-10 rounded-xl bg-stone-100 text-stone-800 flex items-center justify-center mx-auto">
              <QrCode className="w-5 h-5" />
            </div>

            <div>
              <span className="text-[10px] font-bold text-blue-800 uppercase tracking-wider">Storage Barcode & Label</span>
              <h3 className="text-base font-bold text-stone-900 mt-0.5">{selectedQrItem.title}</h3>
              <p className="text-xs text-stone-500 font-mono">ID: {selectedQrItem.id}</p>
            </div>

            {/* Generated QR Placeholder Container */}
            <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 flex flex-col items-center justify-center space-y-2">
              <div className="w-40 h-40 bg-white border border-stone-300 rounded-xl p-2 flex items-center justify-center shadow-inner">
                {/* SVG QR Code Simulation */}
                <div className="w-36 h-36 bg-stone-900 rounded-lg p-2 flex flex-col justify-between">
                  <div className="flex justify-between">
                    <div className="w-8 h-8 bg-white border-4 border-stone-900 flex items-center justify-center">
                      <div className="w-3 h-3 bg-stone-900" />
                    </div>
                    <div className="w-8 h-8 bg-white border-4 border-stone-900 flex items-center justify-center">
                      <div className="w-3 h-3 bg-stone-900" />
                    </div>
                  </div>
                  <div className="flex justify-center items-center">
                    <span className="text-[9px] font-mono font-bold text-stone-100 bg-stone-800 px-1 py-0.5 rounded">
                      {selectedQrItem.storageSlotId}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <div className="w-8 h-8 bg-white border-4 border-stone-900 flex items-center justify-center">
                      <div className="w-3 h-3 bg-stone-900" />
                    </div>
                    <div className="w-8 h-8 bg-white p-1 flex items-center justify-center">
                      <div className="w-4 h-4 bg-stone-900 rounded-xs" />
                    </div>
                  </div>
                </div>
              </div>
              <span className="text-[10px] font-mono text-stone-500 truncate max-w-[220px]">
                {selectedQrItem.qrCodeData}
              </span>
            </div>

            <div className="text-xs text-stone-600 bg-amber-50 p-2.5 rounded-xl border border-amber-200">
              Locker Box <strong>{selectedQrItem.storageBoxId}</strong> • Slot <strong>{selectedQrItem.storageSlotId}</strong>
            </div>

            <button
              onClick={() => setSelectedQrItem(null)}
              className="w-full py-2.5 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-bold"
            >
              Close Label
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
