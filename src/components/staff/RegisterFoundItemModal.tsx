import React, { useState } from "react";
import { useApp } from "../../context/AppContext";
import { 
  X, 
  Package, 
  HardDrive, 
  MapPin, 
  Tag, 
  UserCircle, 
  Palette,
  AlignLeft,
  Camera,
  CheckCircle2,
  ShieldCheck,
  AlertTriangle,
  Clock,
  Sparkles,
  Info,
  DollarSign,
  Layers,
  FileText,
  Phone,
  UserCheck
} from "lucide-react";
import { 
  ItemCondition, 
  EstimatedValueBand, 
  SpecialHandlingType, 
  FinderAffiliation 
} from "../../types";

export const RegisterFoundItemModal: React.FC = () => {
  const { 
    isRegisterModalOpen, 
    setIsRegisterModalOpen, 
    registerFoundItem, 
    storageBoxes,
    user
  } = useApp();

  // Basic Information
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Electronics / Gadgets");
  const [color, setColor] = useState("Black");
  const [brand, setBrand] = useState("");
  const [publicDescription, setPublicDescription] = useState("");
  const [locationFound, setLocationFound] = useState("Main Library 2nd Floor Study Area");
  const [dateFound, setDateFound] = useState(new Date().toISOString().slice(0, 10));

  // Required Item Details
  const [condition, setCondition] = useState<ItemCondition>("Good");
  const [estimatedValueBand, setEstimatedValueBand] = useState<EstimatedValueBand>("Medium (₱500 - ₱2,000)");
  const [specialHandlingType, setSpecialHandlingType] = useState<SpecialHandlingType>("Standard");
  
  // Storage Location (Smart locker or custom office storage)
  const [storageType, setStorageType] = useState<"locker" | "custom">("locker");
  const [storageBoxId, setStorageBoxId] = useState("BOX-A");
  const [storageSlotId, setStorageSlotId] = useState("A1");
  const [customStorageLocation, setCustomStorageLocation] = useState("Guidance Office Vault - Shelf 1");

  // Manual Finder Information (Captured manually since finders do not have accounts)
  const [finderName, setFinderName] = useState("");
  const [finderContact, setFinderContact] = useState("");
  const [finderType, setFinderType] = useState<FinderAffiliation>("Student");
  const [finderSchoolId, setFinderSchoolId] = useState("");
  const [finderNotes, setFinderNotes] = useState("");

  // Private Verification Traits (Hidden from claimants)
  const [privateDetails, setPrivateDetails] = useState("");

  // Asset Photo
  const [imageUrl, setImageUrl] = useState("https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=800&q=80");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isRegisterModalOpen) return null;

  const currentBox = storageBoxes.find(b => b.id === storageBoxId) || storageBoxes[0];
  const availableSlots = currentBox?.slots.filter(s => s.status === "available") || [];

  const sampleImages = [
    { label: "Backpack", url: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=800&q=80" },
    { label: "Phone", url: "https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?auto=format&fit=crop&w=800&q=80" },
    { label: "Bottle", url: "https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&w=800&q=80" },
    { label: "Earbuds", url: "https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?auto=format&fit=crop&w=800&q=80" },
    { label: "Wallet", url: "https://images.unsplash.com/photo-1627123424574-724758594e93?auto=format&fit=crop&w=800&q=80" },
    { label: "Keys", url: "https://images.unsplash.com/photo-1582139329536-e7284fece509?auto=format&fit=crop&w=800&q=80" }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !publicDescription.trim() || !locationFound.trim()) {
      setError("Please complete all required fields (Headline, Public Description, and Location Found).");
      return;
    }

    if (!finderName.trim()) {
      setError("Please capture the finder's name manually (finders do not have system accounts).");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const resolvedStorageLocation = storageType === "locker" 
      ? `${storageBoxId} - Slot ${storageSlotId || (availableSlots[0]?.id || "A1")}`
      : customStorageLocation;

    const payload = {
      title,
      category,
      color: color || "Unspecified",
      brand: brand || "Unbranded",
      description: publicDescription,
      publicDescription,
      condition,
      estimatedValueBand,
      specialHandlingType,
      storageLocation: resolvedStorageLocation,
      locationFound,
      foundLocation: locationFound,
      foundDate: dateFound,
      storageBoxId: storageType === "locker" ? storageBoxId : undefined,
      storageSlotId: storageType === "locker" ? (storageSlotId || availableSlots[0]?.id || "A1") : undefined,
      surrenderedBy: `${finderType}: ${finderName}`,
      finderName,
      finderContact: finderContact || "Not provided",
      finderType,
      finderNotes: finderNotes + (finderSchoolId ? ` (ID: ${finderSchoolId})` : ""),
      identifyingCharacteristics: privateDetails || "None provided",
      privateDetails: privateDetails || "None provided",
      imageUrl,
      status: "received" as const // Strict status transition starts at "received"
    };

    try {
      // Sync with server if token is present
      if (user?.token) {
        await fetch("/api/posts", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${user.token}`
          },
          body: JSON.stringify(payload)
        });
      }

      // Update client AppContext state immediately
      registerFoundItem(payload);
      setIsRegisterModalOpen(false);
    } catch (err: any) {
      console.warn("Server intake sync note (local state will update):", err);
      registerFoundItem(payload);
      setIsRegisterModalOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-stone-950/70 backdrop-blur-md overflow-y-auto animate-in fade-in duration-300">
      <div className="bg-white rounded-[2.5rem] max-w-3xl w-full shadow-2xl border border-stone-200 overflow-hidden my-auto flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="relative p-6 sm:p-8 bg-gradient-to-br from-stone-900 via-stone-900 to-blue-950 text-white overflow-hidden shrink-0">
          <div className="absolute top-0 right-0 p-4 z-10">
            <button
              onClick={() => setIsRegisterModalOpen(false)}
              className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-md transition-all active:scale-95"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <div className="relative flex items-start space-x-4">
            <div className="w-14 h-14 rounded-2xl bg-blue-600/30 border border-blue-400/30 backdrop-blur-md flex items-center justify-center shadow-inner shrink-0 text-blue-300">
              <Package className="w-7 h-7" />
            </div>
            <div className="pr-10">
              <div className="inline-flex items-center space-x-2 px-3 py-1 mb-2 rounded-full bg-white/10 border border-white/15 text-[11px] font-bold text-blue-300 uppercase tracking-widest">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
                <span>Staff-Only Intake Desk</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Found-Item Intake Form</h2>
              <p className="text-stone-300/90 text-xs sm:text-sm mt-1 font-medium leading-relaxed">
                Record surrendered items, verify physical condition, valuation band, and capture finder details manually.
              </p>
            </div>
          </div>
        </div>

        {/* Form Body */}
        <div className="p-6 sm:p-8 overflow-y-auto custom-scrollbar space-y-8">
          {error && (
            <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-2.5 animate-in fade-in">
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form id="intake-form" onSubmit={handleSubmit} className="space-y-8">
            
            {/* Section 1: Item Identification */}
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-stone-100 pb-2">
                <h3 className="text-xs font-extrabold text-stone-900 flex items-center gap-2 uppercase tracking-wider">
                  <Tag className="w-4 h-4 text-blue-600" />
                  1. Item Description & Characteristics
                </h3>
                <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                  Initial Status: Received
                </span>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-stone-700 ml-1">
                  Item Title / Headline <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                    <AlignLeft className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g., Midnight Blue Fjallraven Kanken Backpack"
                    className="w-full pl-10 pr-4 py-3 rounded-2xl border border-stone-200 bg-stone-50/60 text-stone-900 text-sm focus:border-blue-600 focus:bg-white focus:outline-hidden transition-all shadow-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-stone-700 ml-1">Category <span className="text-red-500">*</span></label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-2xl border border-stone-200 bg-stone-50/60 text-stone-800 text-sm focus:border-blue-600 focus:bg-white focus:outline-hidden transition-all shadow-xs appearance-none font-medium"
                  >
                    <option value="Electronics / Gadgets">Electronics / Gadgets</option>
                    <option value="Bags, Backpacks & Wallets">Bags, Backpacks & Wallets</option>
                    <option value="Tumblers, Bottles & Containers">Tumblers, Bottles & Containers</option>
                    <option value="Apparel, Jackets & Eyewear">Apparel, Jackets & Eyewear</option>
                    <option value="Identification, Cards & Badges">Identification, Cards & Badges</option>
                    <option value="Keys & Keychains">Keys & Keychains</option>
                    <option value="Books, Notebooks & Documents">Books, Notebooks & Documents</option>
                    <option value="Other Miscellaneous">Other Miscellaneous</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-stone-700 ml-1">Primary Color</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-400">
                      <Palette className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      value={color}
                      onChange={(e) => setColor(e.target.value)}
                      placeholder="e.g., Matte Black, Navy"
                      className="w-full pl-9 pr-3.5 py-2.5 rounded-2xl border border-stone-200 bg-stone-50/60 text-stone-800 text-sm focus:border-blue-600 focus:bg-white focus:outline-hidden transition-all shadow-xs font-medium"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-stone-700 ml-1">Brand / Maker</label>
                  <input
                    type="text"
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                    placeholder="e.g., Apple, Jansport, Hydro Flask"
                    className="w-full px-3.5 py-2.5 rounded-2xl border border-stone-200 bg-stone-50/60 text-stone-800 text-sm focus:border-blue-600 focus:bg-white focus:outline-hidden transition-all shadow-xs font-medium"
                  />
                </div>
              </div>

              {/* Physical Condition & Location Found */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-stone-700 ml-1 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-blue-600" />
                    Physical Condition <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={condition}
                    onChange={(e) => setCondition(e.target.value as ItemCondition)}
                    className="w-full px-3.5 py-2.5 rounded-2xl border border-stone-200 bg-stone-50/60 text-stone-800 text-sm focus:border-blue-600 focus:bg-white focus:outline-hidden transition-all shadow-xs appearance-none font-medium"
                  >
                    <option value="Brand New">Brand New (Pristine / Unused)</option>
                    <option value="Good">Good (Normal wear, fully functional)</option>
                    <option value="Fair">Fair (Noticeable scratches / signs of use)</option>
                    <option value="Damaged">Damaged (Cracked screen / torn seam)</option>
                    <option value="Heavily Worn">Heavily Worn / Broken parts</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-stone-700 ml-1 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-blue-600" />
                    Location Found <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={locationFound}
                    onChange={(e) => setLocationFound(e.target.value)}
                    placeholder="e.g., Science Bldg 3rd Flr Rm 302"
                    className="w-full px-3.5 py-2.5 rounded-2xl border border-stone-200 bg-stone-50/60 text-stone-800 text-sm focus:border-blue-600 focus:bg-white focus:outline-hidden transition-all shadow-xs font-medium"
                  />
                </div>
              </div>

              {/* Public Description */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-stone-700 ml-1">
                  Public Description <span className="text-red-500">*</span>
                  <span className="text-[11px] text-stone-400 font-normal ml-2">
                    (Visible in student search — do not include serial numbers or sensitive passcodes here!)
                  </span>
                </label>
                <textarea
                  rows={2}
                  required
                  value={publicDescription}
                  onChange={(e) => setPublicDescription(e.target.value)}
                  placeholder="e.g., Midnight blue backpack with white zipper pulls and carabiner keychain on side strap."
                  className="w-full p-3.5 rounded-2xl border border-stone-200 bg-stone-50/60 text-stone-800 text-sm focus:border-blue-600 focus:bg-white focus:outline-hidden transition-all shadow-xs resize-none"
                />
              </div>
            </div>

            {/* Section 2: Valuation, Handling & Custody Location */}
            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between border-b border-stone-100 pb-2">
                <h3 className="text-xs font-extrabold text-stone-900 flex items-center gap-2 uppercase tracking-wider">
                  <DollarSign className="w-4 h-4 text-emerald-600" />
                  2. Valuation, Handling & Custody Storage
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-stone-700 ml-1">Estimated Value Band <span className="text-red-500">*</span></label>
                  <select
                    value={estimatedValueBand}
                    onChange={(e) => setEstimatedValueBand(e.target.value as EstimatedValueBand)}
                    className="w-full px-3.5 py-2.5 rounded-2xl border border-stone-200 bg-stone-50/60 text-stone-800 text-sm focus:border-blue-600 focus:bg-white focus:outline-hidden transition-all shadow-xs font-medium appearance-none"
                  >
                    <option value="Low (< ₱500)">Low (&lt; ₱500) — Minor accessories, notebooks</option>
                    <option value="Medium (₱500 - ₱2,000)">Medium (₱500 - ₱2,000) — Tumblers, wallets, apparel</option>
                    <option value="High (₱2,000 - ₱10,000)">High (₱2,000 - ₱10,000) — Smartwatches, calculators, cash</option>
                    <option value="Valuable (> ₱10,000)">Valuable (&gt; ₱10,000) — Laptops, smartphones, jewelry</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-stone-700 ml-1">Special-Handling Protocol <span className="text-red-500">*</span></label>
                  <select
                    value={specialHandlingType}
                    onChange={(e) => setSpecialHandlingType(e.target.value as SpecialHandlingType)}
                    className="w-full px-3.5 py-2.5 rounded-2xl border border-stone-200 bg-stone-50/60 text-stone-800 text-sm focus:border-blue-600 focus:bg-white focus:outline-hidden transition-all shadow-xs font-medium appearance-none"
                  >
                    <option value="Standard">Standard (General custody)</option>
                    <option value="High-Value Electronics">High-Value Electronics (Requires safe / locker)</option>
                    <option value="Cash / Currency">Cash / Currency (Requires dual staff count log)</option>
                    <option value="Official ID / Documents">Official ID / Documents (Restricted release check)</option>
                    <option value="Fragile / Perishable">Fragile / Perishable (Time-limited retention)</option>
                  </select>
                </div>
              </div>

              {/* Storage Assignment */}
              <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-extrabold text-stone-900 flex items-center gap-2 uppercase tracking-wider">
                    <HardDrive className="w-4 h-4 text-blue-600" />
                    Storage Custody Assignment <span className="text-red-500">*</span>
                  </label>
                  <div className="flex items-center bg-stone-200/60 p-0.5 rounded-xl text-xs font-bold">
                    <button
                      type="button"
                      onClick={() => setStorageType("locker")}
                      className={`px-3 py-1 rounded-lg transition-all ${
                        storageType === "locker" ? "bg-white text-stone-900 shadow-xs" : "text-stone-500"
                      }`}
                    >
                      Smart Locker
                    </button>
                    <button
                      type="button"
                      onClick={() => setStorageType("custom")}
                      className={`px-3 py-1 rounded-lg transition-all ${
                        storageType === "custom" ? "bg-white text-stone-900 shadow-xs" : "text-stone-500"
                      }`}
                    >
                      Office Vault / Shelf
                    </button>
                  </div>
                </div>

                {storageType === "locker" ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div>
                      <span className="text-[11px] font-bold text-stone-500 block mb-1">Target Locker Unit:</span>
                      <select
                        value={storageBoxId}
                        onChange={(e) => {
                          setStorageBoxId(e.target.value);
                          const b = storageBoxes.find(box => box.id === e.target.value);
                          const openSlot = b?.slots.find(s => s.status === "available");
                          setStorageSlotId(openSlot?.id || "A1");
                        }}
                        className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-stone-200 bg-white"
                      >
                        <option value="BOX-A">Unit A (Guidance Lobby Locker)</option>
                        <option value="BOX-B">Unit B (Community Center Locker)</option>
                      </select>
                    </div>
                    <div>
                      <span className="text-[11px] font-bold text-stone-500 block mb-1">Compartment Slot:</span>
                      <select
                        value={storageSlotId}
                        onChange={(e) => setStorageSlotId(e.target.value)}
                        className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-stone-200 bg-white"
                      >
                        {availableSlots.length === 0 ? (
                          <option value="A1">Slot A1 (Ready)</option>
                        ) : (
                          availableSlots.map(s => (
                            <option key={s.id} value={s.id}>
                              Slot {s.id} (Row {s.row || '1'}, Col {s.col || '1'}) — Available
                            </option>
                          ))
                        )}
                      </select>
                    </div>
                  </div>
                ) : (
                  <div>
                    <span className="text-[11px] font-bold text-stone-500 block mb-1">Specific Storage Description:</span>
                    <input
                      type="text"
                      value={customStorageLocation}
                      onChange={(e) => setCustomStorageLocation(e.target.value)}
                      placeholder="e.g., Guidance Office Vault Shelf 2, Cabinet A-3"
                      className="w-full px-3.5 py-2 text-xs font-medium rounded-xl border border-stone-200 bg-white"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Section 3: Manual Finder Information Capture */}
            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between border-b border-stone-100 pb-2">
                <div>
                  <h3 className="text-xs font-extrabold text-stone-900 flex items-center gap-2 uppercase tracking-wider">
                    <UserCircle className="w-4 h-4 text-indigo-600" />
                    3. Finder Information (Captured Manually)
                  </h3>
                  <p className="text-[11px] text-stone-500 font-medium mt-0.5">
                    Finders no longer have system accounts. Record their identity details for guidance records.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-stone-700 ml-1">Finder Full Name <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    required
                    value={finderName}
                    onChange={(e) => setFinderName(e.target.value)}
                    placeholder="e.g., Juan Dela Cruz"
                    className="w-full px-3.5 py-2.5 rounded-2xl border border-stone-200 bg-stone-50/60 text-stone-800 text-sm focus:border-blue-600 focus:bg-white focus:outline-hidden transition-all shadow-xs font-medium"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-stone-700 ml-1">Contact Phone / Email</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-400">
                      <Phone className="w-3.5 h-3.5" />
                    </div>
                    <input
                      type="text"
                      value={finderContact}
                      onChange={(e) => setFinderContact(e.target.value)}
                      placeholder="e.g., 0917-123-4567"
                      className="w-full pl-9 pr-3.5 py-2.5 rounded-2xl border border-stone-200 bg-stone-50/60 text-stone-800 text-sm focus:border-blue-600 focus:bg-white focus:outline-hidden transition-all shadow-xs font-medium"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-stone-700 ml-1">Affiliation / Role</label>
                  <select
                    value={finderType}
                    onChange={(e) => setFinderType(e.target.value as FinderAffiliation)}
                    className="w-full px-3.5 py-2.5 rounded-2xl border border-stone-200 bg-stone-50/60 text-stone-800 text-sm focus:border-blue-600 focus:bg-white focus:outline-hidden transition-all shadow-xs font-medium appearance-none"
                  >
                    <option value="Student">Student</option>
                    <option value="Faculty">Faculty Member</option>
                    <option value="Staff">University / Guidance Staff</option>
                    <option value="Visitor">Visitor / Citizen</option>
                    <option value="Security Personnel">Campus Security Personnel</option>
                    <option value="Janitorial / Facilities">Janitorial / Maintenance</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-stone-700 ml-1">Finder School ID / Badge # (Optional)</label>
                  <input
                    type="text"
                    value={finderSchoolId}
                    onChange={(e) => setFinderSchoolId(e.target.value)}
                    placeholder="e.g., 2024-00101 or EMP-882"
                    className="w-full px-3.5 py-2.5 rounded-2xl border border-stone-200 bg-stone-50/60 text-stone-800 text-sm focus:border-blue-600 focus:bg-white focus:outline-hidden transition-all shadow-xs font-medium"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-stone-700 ml-1">Finder Surrender Circumstances / Notes</label>
                  <input
                    type="text"
                    value={finderNotes}
                    onChange={(e) => setFinderNotes(e.target.value)}
                    placeholder="e.g., Found under lecture hall desk after 5 PM dismissal"
                    className="w-full px-3.5 py-2.5 rounded-2xl border border-stone-200 bg-stone-50/60 text-stone-800 text-sm focus:border-blue-600 focus:bg-white focus:outline-hidden transition-all shadow-xs font-medium"
                  />
                </div>
              </div>
            </div>

            {/* Section 4: Private Verification Details & Asset Photo */}
            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between border-b border-stone-100 pb-2">
                <div>
                  <h3 className="text-xs font-extrabold text-stone-900 flex items-center gap-2 uppercase tracking-wider">
                    <ShieldCheck className="w-4 h-4 text-blue-700" />
                    4. Private Verification Clues (Staff Eyes Only)
                  </h3>
                  <p className="text-[11px] text-stone-500 font-medium mt-0.5">
                    Used during in-person owner interviews. Never exposed on public endpoints or student feeds.
                  </p>
                </div>
              </div>

              <div className="space-y-1.5">
                <textarea
                  rows={2}
                  value={privateDetails}
                  onChange={(e) => setPrivateDetails(e.target.value)}
                  placeholder="e.g., Serial # C02X1234, engraving 'To Bianca with love', lock screen photo of a golden retriever, 3 receipts inside back pocket."
                  className="w-full p-3.5 rounded-2xl border border-indigo-200 bg-indigo-50/40 text-indigo-950 text-sm focus:border-indigo-600 focus:bg-white focus:outline-hidden transition-all shadow-xs resize-none font-medium"
                />
              </div>

              {/* Photo Presets */}
              <div className="space-y-2 pt-1">
                <label className="text-xs font-bold text-stone-700 ml-1 flex items-center gap-1.5">
                  <Camera className="w-3.5 h-3.5 text-stone-600" />
                  Asset Image Preset / URL
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5">
                  {sampleImages.map(img => (
                    <button
                      type="button"
                      key={img.label}
                      onClick={() => setImageUrl(img.url)}
                      className={`relative group aspect-square rounded-2xl overflow-hidden ring-2 transition-all duration-200 ${
                        imageUrl === img.url
                          ? "ring-blue-600 ring-offset-2 scale-95"
                          : "ring-transparent hover:ring-stone-300"
                      }`}
                    >
                      <img 
                        src={img.url} 
                        alt={img.label} 
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" 
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-1.5">
                        <span className="text-[10px] font-semibold text-white truncate text-center">{img.label}</span>
                      </div>
                      {imageUrl === img.url && (
                        <div className="absolute top-1.5 right-1.5 bg-blue-600 text-white rounded-full p-0.5 shadow-sm">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>

          </form>
        </div>

        {/* Footer */}
        <div className="p-5 sm:p-6 bg-stone-50 border-t border-stone-200/80 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-2 text-xs text-stone-500 font-medium">
            <Info className="w-4 h-4 text-blue-600 shrink-0" />
            <span>Strict flow: Item will be recorded with status <strong>received</strong></span>
          </div>

          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={() => setIsRegisterModalOpen(false)}
              className="px-5 py-2.5 bg-white border border-stone-200 hover:bg-stone-100 text-stone-700 text-sm font-bold rounded-xl transition-colors shadow-xs active:scale-95"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="intake-form"
              disabled={isSubmitting}
              className="px-6 py-2.5 bg-gradient-to-r from-blue-700 to-indigo-700 hover:from-blue-800 hover:to-indigo-800 text-white text-sm font-bold rounded-xl shadow-lg shadow-blue-700/20 transition-all hover:shadow-blue-700/40 active:scale-95 disabled:opacity-50 flex items-center gap-2"
            >
              <Package className="w-4 h-4" />
              <span>{isSubmitting ? "Recording Intake..." : "Submit Intake Entry"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
