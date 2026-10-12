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
  CheckCircle2
} from "lucide-react";

export const RegisterFoundItemModal: React.FC = () => {
  const { 
    isRegisterModalOpen, 
    setIsRegisterModalOpen, 
    registerFoundItem, 
    storageBoxes 
  } = useApp();

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Bags & Backpacks");
  const [itemType, setItemType] = useState("Backpack");
  const [color, setColor] = useState("Black");
  const [brand, setBrand] = useState("");
  const [identifyingCharacteristics, setIdentifyingCharacteristics] = useState("");
  const [foundLocation, setFoundLocation] = useState("City Public Library - 1st Floor");
  const [surrenderedBy, setSurrenderedBy] = useState("LGU Desk Officer: Marcus Vance");
  const [storageBoxId, setStorageBoxId] = useState("BOX-A");
  const [storageSlotId, setStorageSlotId] = useState("A1");
  const [imageUrl, setImageUrl] = useState("https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=800&q=80");

  if (!isRegisterModalOpen) return null;

  const currentBox = storageBoxes.find(b => b.id === storageBoxId) || storageBoxes[0];
  const availableSlots = currentBox?.slots.filter(s => s.status === "available") || [];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    registerFoundItem({
      title,
      category,
      itemType: itemType || category,
      description: `${color} ${brand} ${itemType}. ${identifyingCharacteristics}`,
      color,
      brand: brand || "Unbranded",
      identifyingCharacteristics: identifyingCharacteristics || "Standard item with normal wear",
      foundLocation,
      foundDate: new Date().toISOString().slice(0, 10),
      surrenderedBy,
      storageBoxId,
      storageSlotId: storageSlotId || (availableSlots[0]?.id || "A1"),
      imageUrl
    });

    setIsRegisterModalOpen(false);
  };

  const sampleImages = [
    { label: "Backpack", url: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=800&q=80" },
    { label: "Bottle", url: "https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&w=800&q=80" },
    { label: "Earbuds", url: "https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?auto=format&fit=crop&w=800&q=80" },
    { label: "Calculator", url: "https://images.unsplash.com/photo-1594980596870-8aa52a78d8cd?auto=format&fit=crop&w=800&q=80" },
    { label: "Jacket", url: "https://images.unsplash.com/photo-1576995853123-5a10305d93c0?auto=format&fit=crop&w=800&q=80" },
    { label: "Keys", url: "https://images.unsplash.com/photo-1582139329536-e7284fece509?auto=format&fit=crop&w=800&q=80" }
  ];

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/40 backdrop-blur-md overflow-y-auto animate-in fade-in duration-300">
      <div className="bg-white rounded-[2rem] max-w-2xl w-full shadow-2xl overflow-hidden my-auto flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="relative p-6 sm:p-8 bg-gradient-to-br from-indigo-600 via-blue-600 to-sky-500 text-white overflow-hidden shrink-0">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
          <div className="absolute top-0 right-0 p-4">
            <button
              onClick={() => setIsRegisterModalOpen(false)}
              className="p-2 rounded-full bg-white/10 hover:bg-white/25 text-white backdrop-blur-sm transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="relative flex items-center space-x-4">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shadow-inner border border-white/30">
              <Package className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold tracking-tight">Register Found Item</h2>
            </div>
          </div>
        </div>

        {/* Form Body */}
        <div className="p-6 sm:p-8 overflow-y-auto custom-scrollbar">
          <form id="register-found-item-form" onSubmit={handleSubmit} className="space-y-6">
            
            {/* Basic Info Section */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 uppercase tracking-wider">
                <Tag className="w-4 h-4 text-blue-600" />
                Item Details
              </h3>
              
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-600 ml-1">Item Title / Headline <span className="text-red-500">*</span></label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <AlignLeft className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g., Midnight Blue Fjallraven Kanken Backpack"
                    className="w-full pl-10 pr-4 py-3 rounded-2xl border-0 ring-1 ring-slate-200 bg-slate-50/50 text-slate-900 text-sm focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all shadow-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-600 ml-1">Category</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Package className="w-4 h-4" />
                    </div>
                    <select
                      value={category}
                      onChange={(e) => {
                        setCategory(e.target.value);
                        setItemType(e.target.value);
                      }}
                      className="w-full pl-10 pr-4 py-3 rounded-2xl border-0 ring-1 ring-slate-200 bg-slate-50/50 text-slate-800 text-sm focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all shadow-sm appearance-none"
                    >
                      <option value="Bags & Backpacks">Bags & Backpacks</option>
                      <option value="Bottles & Containers">Bottles & Containers</option>
                      <option value="Electronics">Electronics</option>
                      <option value="Apparel & Accessories">Apparel & Accessories</option>
                      <option value="Keys & Badges">Keys & Badges</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-600 ml-1">Brand / Maker</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Tag className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      value={brand}
                      onChange={(e) => setBrand(e.target.value)}
                      placeholder="e.g., Apple, Nike..."
                      className="w-full pl-10 pr-4 py-3 rounded-2xl border-0 ring-1 ring-slate-200 bg-slate-50/50 text-slate-900 text-sm focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all shadow-sm"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-600 ml-1">Primary Color</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Palette className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      value={color}
                      onChange={(e) => setColor(e.target.value)}
                      placeholder="e.g., Matte Black, Navy Blue..."
                      className="w-full pl-10 pr-4 py-3 rounded-2xl border-0 ring-1 ring-slate-200 bg-slate-50/50 text-slate-900 text-sm focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all shadow-sm"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-600 ml-1">Turned in by</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <UserCircle className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      value={surrenderedBy}
                      onChange={(e) => setSurrenderedBy(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 rounded-2xl border-0 ring-1 ring-slate-200 bg-slate-50/50 text-slate-900 text-sm focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all shadow-sm"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-600 ml-1">Found Location</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={foundLocation}
                    onChange={(e) => setFoundLocation(e.target.value)}
                    placeholder="e.g., City Hall South Wing"
                    className="w-full pl-10 pr-4 py-3 rounded-2xl border-0 ring-1 ring-slate-200 bg-slate-50/50 text-slate-900 text-sm focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all shadow-sm"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-600 ml-1">Unique Identifying Characteristics</label>
                <textarea
                  rows={2}
                  value={identifyingCharacteristics}
                  onChange={(e) => setIdentifyingCharacteristics(e.target.value)}
                  placeholder="e.g., Blue carabiner keychain, sticker on base..."
                  className="w-full p-4 rounded-2xl border-0 ring-1 ring-slate-200 bg-slate-50/50 text-slate-900 text-sm focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all shadow-sm resize-none custom-scrollbar"
                />
              </div>
            </div>

            {/* Storage Locker Compartment Assignment */}
            <div className="pt-2">
              <div className="p-5 rounded-[1.5rem] bg-gradient-to-br from-slate-50 to-slate-100 ring-1 ring-slate-200 space-y-4 shadow-inner">
                <div className="flex items-center space-x-2.5">
                  <div className="p-1.5 bg-blue-100 text-blue-700 rounded-lg">
                    <HardDrive className="w-4 h-4" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-800 tracking-tight">IoT Smart Locker Assignment</h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[11px] text-slate-500 font-bold uppercase tracking-wider block ml-1">Target Locker Unit:</label>
                    <select
                      value={storageBoxId}
                      onChange={(e) => {
                        setStorageBoxId(e.target.value);
                        const b = storageBoxes.find(box => box.id === e.target.value);
                        const openSlot = b?.slots.find(s => s.status === "available");
                        setStorageSlotId(openSlot?.id || "A1");
                      }}
                      className="w-full px-4 py-2.5 text-sm font-medium rounded-xl border-0 ring-1 ring-slate-200 bg-white focus:ring-2 focus:ring-blue-600 transition-shadow appearance-none"
                    >
                      <option value="BOX-A">LGU Locker Unit A (City Hall)</option>
                      <option value="BOX-B">LGU Locker Unit B (Community Center)</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] text-slate-500 font-bold uppercase tracking-wider block ml-1">Compartment:</label>
                    <select
                      value={storageSlotId}
                      onChange={(e) => setStorageSlotId(e.target.value)}
                      className="w-full px-4 py-2.5 text-sm font-medium rounded-xl border-0 ring-1 ring-slate-200 bg-white focus:ring-2 focus:ring-blue-600 transition-shadow appearance-none"
                    >
                      {availableSlots.length === 0 ? (
                        <option value="">No available slots</option>
                      ) : (
                        availableSlots.map(s => (
                          <option key={s.id} value={s.id}>
                            Slot {s.id} (Row {s.row}, Col {s.col}) - Ready
                          </option>
                        ))
                      )}
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Photo Presets */}
            <div className="space-y-3 pt-2">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 uppercase tracking-wider">
                <Camera className="w-4 h-4 text-blue-600" />
                Asset Photo
              </h3>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                {sampleImages.map(img => (
                  <button
                    type="button"
                    key={img.label}
                    onClick={() => setImageUrl(img.url)}
                    className={`relative group aspect-square rounded-2xl overflow-hidden ring-2 transition-all duration-300 ${
                      imageUrl === img.url
                        ? "ring-blue-600 ring-offset-2 scale-95"
                        : "ring-transparent hover:ring-slate-300"
                    }`}
                  >
                    <img 
                      src={img.url} 
                      alt={img.label} 
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-2">
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

          </form>
        </div>

        {/* Footer */}
        <div className="p-5 sm:p-6 bg-slate-50 border-t border-slate-100 flex items-center justify-end space-x-3 shrink-0">
          <button
            type="button"
            onClick={() => setIsRegisterModalOpen(false)}
            className="px-5 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-sm font-bold rounded-xl transition-colors shadow-sm"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="register-found-item-form"
            className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-sm font-bold rounded-xl shadow-lg shadow-blue-600/20 transition-all hover:shadow-blue-600/40 active:scale-95"
          >
            Report Item
          </button>
        </div>
      </div>
    </div>
  );
};

