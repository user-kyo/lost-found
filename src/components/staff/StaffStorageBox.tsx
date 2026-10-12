import React, { useState } from "react";
import { useApp } from "../../context/AppContext";
import { StorageSlot, StorageBoxUnit } from "../../types";
import { 
  HardDrive, 
  Lock, 
  Unlock, 
  Thermometer, 
  Wifi, 
  RefreshCw, 
  CheckCircle2, 
  AlertTriangle, 
  QrCode, 
  Sparkles,
  Info,
  ShieldCheck,
  User
} from "lucide-react";

export const StaffStorageBox: React.FC = () => {
  const { 
    storageBoxes, 
    foundItems, 
    claims, 
    unlockStorageSlot, 
    lockStorageSlot, 
    toggleMasterBoxLock,
    setIsScannerModalOpen,
    setStaffView 
  } = useApp();

  const [selectedBoxId, setSelectedBoxId] = useState<string>("BOX-A");
  const [selectedSlot, setSelectedSlot] = useState<StorageSlot | null>(null);
  const [staffName, setStaffName] = useState("LGU Desk Officer");

  const currentBox = storageBoxes.find(b => b.id === selectedBoxId) || storageBoxes[0];
  const occupiedCount = currentBox.slots.filter(s => s.status !== "available").length;
  const availableCount = currentBox.slots.filter(s => s.status === "available").length;

  const currentSlotItem = selectedSlot?.currentLFId 
    ? foundItems.find(i => i.id === selectedSlot.currentLFId)
    : null;

  const currentSlotClaim = selectedSlot?.reservedForClaimId
    ? claims.find(c => c.id === selectedSlot.reservedForClaimId)
    : null;

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs text-stone-500 mb-1">
            <button onClick={() => setStaffView("dashboard")} className="hover:text-blue-800">LGU Dashboard</button>
            <span>/</span>
            <span className="text-stone-900 font-semibold">Physical Storage Unit Control</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight">
            Connected Smart Storage Lockers
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 mt-0.5">
            Real-time municipal IoT locker telemetry, electronic compartment locks, and badge scanner controllers.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsScannerModalOpen(true)}
            className="px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center space-x-1.5 active:scale-98"
          >
            <QrCode className="w-4 h-4" />
            <span>Launch RFID Kiosk Station</span>
          </button>
        </div>
      </div>

      {/* Locker Selector Tabs & IoT Health Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (8 Cols): Compartment Visualizer */}
        <div className="lg:col-span-8 space-y-6">
          {/* Locker Switcher Bar */}
          <div className="bg-white border border-stone-200/80 rounded-2xl p-4 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center space-x-2 w-full sm:w-auto">
              {storageBoxes.map(box => (
                <button
                  key={box.id}
                  onClick={() => {
                    setSelectedBoxId(box.id);
                    setSelectedSlot(null);
                  }}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 ${
                    selectedBoxId === box.id
                      ? "bg-blue-800 text-white shadow-xs"
                      : "bg-stone-100 text-stone-700 hover:bg-stone-200"
                  }`}
                >
                  <HardDrive className="w-3.5 h-3.5" />
                  <span>{box.name}</span>
                </button>
              ))}
            </div>

            <div className="flex items-center space-x-3 text-xs">
              <div className="flex items-center space-x-1 text-blue-700 font-semibold">
                <Wifi className="w-3.5 h-3.5" />
                <span>Online</span>
              </div>
              <span className="text-stone-300">|</span>
              <div className="flex items-center space-x-1 text-stone-600">
                <Thermometer className="w-3.5 h-3.5 text-amber-600" />
                <span>{currentBox.temperatureCelsius}°C</span>
              </div>
            </div>
          </div>

          {/* Compartment Grid Visualizer */}
          <div className="bg-white border border-stone-200/80 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-stone-100">
              <div>
                <h3 className="text-base font-bold text-stone-900 flex items-center space-x-2">
                  <span>{currentBox.name} — Hardware Grid</span>
                  <span className="text-xs text-stone-400 font-normal">({currentBox.locationName})</span>
                </h3>
                <p className="text-xs text-stone-500 mt-0.5">
                  Click any compartment to inspect stored item or trigger manual override lock.
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => toggleMasterBoxLock(currentBox.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors flex items-center space-x-1.5 ${
                    currentBox.masterLockStatus === "locked"
                      ? "bg-stone-900 text-white border-stone-900 hover:bg-stone-800"
                      : "bg-amber-100 text-amber-900 border-amber-300 hover:bg-amber-200"
                  }`}
                >
                  {currentBox.masterLockStatus === "locked" ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                  <span>{currentBox.masterLockStatus === "locked" ? "Master Locked" : "Master Unlocked"}</span>
                </button>
              </div>
            </div>

            {/* 3x3 Locker Compartment Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-4">
              {currentBox.slots.map((slot) => {
                const item = slot.currentLFId ? foundItems.find(i => i.id === slot.currentLFId) : null;
                const isSelected = selectedSlot?.id === slot.id;

                return (
                  <div
                    key={slot.id}
                    onClick={() => setSelectedSlot(slot)}
                    className={`min-h-[110px] sm:aspect-4/3 rounded-2xl p-2.5 sm:p-4 border-2 transition-all cursor-pointer flex flex-col justify-between relative group ${
                      isSelected
                        ? "border-blue-800 ring-4 ring-blue-100 bg-blue-50/40"
                        : slot.status === "available"
                        ? "border-stone-200 bg-stone-50/60 hover:border-blue-700 hover:bg-blue-50/20"
                        : slot.status === "reserved"
                        ? "border-amber-300 bg-amber-50/50 hover:border-amber-400"
                        : "border-blue-200 bg-blue-50/40 hover:border-blue-400"
                    }`}
                  >
                    {/* Top Row: Slot ID & Lock Icon */}
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs sm:text-sm font-extrabold text-stone-900">
                        Slot {slot.id}
                      </span>
                      <div className="flex items-center space-x-1">
                        {slot.isDoorLocked ? (
                          <Lock className="w-3 sm:w-3.5 h-3 sm:h-3.5 text-stone-400" />
                        ) : (
                          <Unlock className="w-3 sm:w-3.5 h-3 sm:h-3.5 text-blue-600 animate-pulse" />
                        )}
                      </div>
                    </div>

                    {/* Middle: Content Info */}
                    <div className="my-auto text-center py-1">
                      {slot.status === "available" ? (
                        <div className="space-y-0.5">
                          <span className="inline-block w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-blue-500" />
                          <p className="text-[11px] sm:text-xs font-bold text-blue-800">Available</p>
                          <p className="text-[9px] sm:text-[10px] text-stone-400">Empty slot</p>
                        </div>
                      ) : (
                        <div className="space-y-0.5 min-w-0">
                          <span className={`inline-block w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full ${slot.status === "reserved" ? "bg-amber-500" : "bg-blue-600"}`} />
                          <p className="text-[11px] sm:text-xs font-bold text-stone-900 truncate">
                            {item?.title || slot.currentLFId}
                          </p>
                          <p className="text-[9px] sm:text-[10px] text-stone-500 truncate">
                            {item?.brand || "Cataloged"}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Bottom Status Tag */}
                    <div className="flex items-center justify-between text-[9px] sm:text-[10px] pt-1 border-t border-stone-200/50">
                      <span className="font-mono text-stone-400 truncate">
                        {slot.isDoorLocked ? "LOCKED" : "OPEN"}
                      </span>
                      <span className={`font-semibold uppercase truncate ${
                        slot.status === "available" ? "text-blue-700" : slot.status === "reserved" ? "text-amber-700" : "text-stone-700"
                      }`}>
                        {slot.status}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Legend */}
            <div className="flex flex-wrap items-center gap-4 text-xs text-stone-500 pt-2 border-t border-stone-100">
              <div className="flex items-center space-x-1.5">
                <span className="w-3 h-3 rounded-md bg-stone-100 border border-stone-300" />
                <span>Available ({availableCount})</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <span className="w-3 h-3 rounded-md bg-blue-100 border border-blue-300" />
                <span>Occupied ({occupiedCount})</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <span className="w-3 h-3 rounded-md bg-amber-100 border border-amber-300" />
                <span>Reserved for Claim</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (4 Cols): Selected Compartment Inspector */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white border border-stone-200/80 rounded-3xl p-6 shadow-xs space-y-5">
            <div className="pb-3 border-b border-stone-100">
              <h3 className="text-base font-bold text-stone-900">
                Compartment Inspector
              </h3>
              <p className="text-xs text-stone-500">
                {selectedSlot ? `Selected: Compartment ${selectedSlot.id} (${currentBox.id})` : "Select a locker compartment to inspect"}
              </p>
            </div>

            {selectedSlot ? (
              <div className="space-y-4 text-xs">
                <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-sm text-stone-900">
                      Slot {selectedSlot.id}
                    </span>
                    <span className={`px-2 py-0.5 rounded-md font-bold uppercase text-[10px] ${
                      selectedSlot.status === "available"
                        ? "bg-blue-100 text-blue-800"
                        : selectedSlot.status === "reserved"
                        ? "bg-amber-100 text-amber-800"
                        : "bg-stone-200 text-stone-800"
                    }`}>
                      {selectedSlot.status}
                    </span>
                  </div>

                  <div className="pt-2 text-stone-600 space-y-1">
                    <div className="flex justify-between">
                      <span className="text-stone-400">Lock Status:</span>
                      <span className="font-semibold text-stone-900">
                        {selectedSlot.isDoorLocked ? "Locked (Electronic Solenoid Engaged)" : "Unlocked"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-stone-400">Last Actuation:</span>
                      <span className="font-semibold text-stone-900 font-mono">
                        {selectedSlot.lastOpenedAt ? new Date(selectedSlot.lastOpenedAt).toLocaleTimeString() : "System Startup"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Stored Item Details if Occupied */}
                {currentSlotItem && (
                  <div className="p-4 rounded-2xl bg-blue-50/50 border border-blue-200 space-y-3">
                    <div className="flex items-center space-x-3">
                      <img
                        src={currentSlotItem.imageUrl}
                        alt={currentSlotItem.title}
                        referrerPolicy="no-referrer"
                        className="w-12 h-12 rounded-xl object-cover border border-blue-200 shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <span className="text-[10px] font-bold text-blue-800 uppercase block">
                          #{currentSlotItem.id}
                        </span>
                        <p className="font-bold text-stone-900 truncate">
                          {currentSlotItem.title}
                        </p>
                        <p className="text-[11px] text-stone-500 truncate">
                          {currentSlotItem.brand} • {currentSlotItem.color}
                        </p>
                      </div>
                    </div>

                    <p className="text-[11px] text-stone-600 bg-white/80 p-2 rounded-lg leading-relaxed">
                      {currentSlotItem.identifyingCharacteristics}
                    </p>
                  </div>
                )}

                {/* Manual Solenoid Unlock / Lock Action */}
                <div className="pt-2 space-y-2">
                  <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider block">
                    LGU Officer Manual Override
                  </span>

                  {selectedSlot.isDoorLocked ? (
                    <button
                      onClick={() => unlockStorageSlot(currentBox.id, selectedSlot.id, staffName)}
                      className="w-full py-2.5 px-4 bg-blue-800 hover:bg-blue-900 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center space-x-1.5"
                    >
                      <Unlock className="w-4 h-4" />
                      <span>Unlock Slot {selectedSlot.id} Door</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => lockStorageSlot(currentBox.id, selectedSlot.id)}
                      className="w-full py-2.5 px-4 bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center space-x-1.5"
                    >
                      <Lock className="w-4 h-4" />
                      <span>Lock Slot {selectedSlot.id} Door</span>
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="py-12 text-center text-stone-400 text-xs space-y-2">
                <HardDrive className="w-8 h-8 mx-auto text-stone-300" />
                <p>Click any locker slot on the left to inspect sensor telemetry and unlock controls.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
