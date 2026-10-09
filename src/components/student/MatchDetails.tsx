import React, { useState } from "react";
import { useApp } from "../../context/AppContext";
import { 
  ArrowLeft, 
  ShieldCheck, 
  CheckCircle2, 
  FileText,
  ArrowRight,
  MapPin
} from "lucide-react";

export const MatchDetails: React.FC = () => {
  const { 
    selectedItem, 
    lastSubmittedReport, 
    setStudentView
  } = useApp();

  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);

  if (!selectedItem) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-4">
        <p className="text-stone-500 text-sm">No item selected.</p>
        <button
          onClick={() => setStudentView("search")}
          className="px-4 py-2 bg-emerald-800 text-white rounded-xl text-xs font-semibold"
        >
          Return to Matches
        </button>
      </div>
    );
  }

  const userDesc = lastSubmittedReport?.rawDescription || "Black Jansport backpack with blue keychain attached to the front pocket.";
  const userAttributes = lastSubmittedReport?.extractedAttributes;

  const handleProceedToClaim = () => {
    setIsConfirmModalOpen(false);
    setStudentView("claim_request");
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6 sm:space-y-8">
      {/* Top Breadcrumbs & Back */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setStudentView("search")}
          className="inline-flex items-center space-x-1.5 text-xs font-bold text-stone-600 hover:text-emerald-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Possible Matches</span>
        </button>

        <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-md bg-stone-100 text-stone-800 border border-stone-200">
          Catalog ID: #{selectedItem.id}
        </span>
      </div>

      {/* Main Grid: Left Column Large Photo & Quick Specs, Right Column Comparison & Action */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column (5 Cols): Image & Public Details */}
        <div className="lg:col-span-5 space-y-4">
          <div className="relative rounded-3xl overflow-hidden bg-stone-100 border border-stone-200 shadow-sm aspect-square">
            <img
              src={selectedItem.imageUrl}
              alt={selectedItem.title}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />

            <div className="absolute bottom-4 left-4 right-4">
              <div className="p-3 rounded-xl bg-stone-900/85 backdrop-blur-md text-white border border-white/10 text-xs flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <MapPin className="w-4 h-4 text-emerald-400" />
                  <div>
                    <p className="font-bold text-[11px]">Found in San Pablo City</p>
                    <p className="text-[10px] text-stone-300">{selectedItem.foundLocation || selectedItem.areaFound}</p>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 text-[10px] font-bold">
                  PUBLIC POST
                </span>
              </div>
            </div>
          </div>

          {/* Quick Item Specs */}
          <div className="bg-white border border-stone-200 rounded-2xl p-4 shadow-2xs space-y-2.5 text-xs">
            <div className="flex items-center justify-between py-1 border-b border-stone-100">
              <span className="text-stone-500 font-medium">Category</span>
              <span className="font-bold text-stone-800">{selectedItem.category}</span>
            </div>
            <div className="flex items-center justify-between py-1 border-b border-stone-100">
              <span className="text-stone-500 font-medium">Brand</span>
              <span className="font-bold text-stone-800">{selectedItem.brand || "Not specified"}</span>
            </div>
            <div className="flex items-center justify-between py-1 border-b border-stone-100">
              <span className="text-stone-500 font-medium">Color Palette</span>
              <span className="font-bold text-stone-800">{selectedItem.color}</span>
            </div>
            <div className="flex items-center justify-between py-1 border-b border-stone-100">
              <span className="text-stone-500 font-medium">Found Location</span>
              <span className="font-bold text-stone-800">{selectedItem.foundLocation || selectedItem.areaFound}</span>
            </div>
            <div className="flex items-center justify-between py-1">
              <span className="text-stone-500 font-medium">Date Registered</span>
              <span className="font-bold text-stone-800">{selectedItem.foundDate || (selectedItem.dateFound ? new Date(selectedItem.dateFound).toLocaleDateString() : 'N/A')}</span>
            </div>
          </div>
        </div>

        {/* Right Column (7 Cols): Comprehensive Comparison, Matching Attributes, CTA */}
        <div className="lg:col-span-7 space-y-6">
          <div>
            <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">
              Item Match Details
            </span>
            <h1 className="text-2xl font-extrabold text-stone-900 mt-1">
              {selectedItem.title || `${selectedItem.color} ${selectedItem.category}`}
            </h1>
            <p className="text-xs text-stone-500 mt-1">
              Surrendered by {selectedItem.surrenderedBy || "Anonymous"} on {selectedItem.foundDate || (selectedItem.dateFound ? new Date(selectedItem.dateFound).toLocaleDateString() : 'N/A')}
            </p>
          </div>

          {/* Visual Comparison Section: Your Description vs. Found Item */}
          <div className="bg-white border border-stone-200 rounded-3xl p-6 shadow-xs space-y-5">
            <h3 className="text-sm font-bold text-stone-900 flex items-center justify-between pb-3 border-b border-stone-100">
              <span>Visual Attribute Comparison</span>
              <span className="text-[11px] font-normal text-stone-500">Your Report vs. Found Record</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Left Box: Your Description */}
              <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-2">
                <div className="flex items-center space-x-1.5 text-xs font-bold text-stone-900">
                  <FileText className="w-3.5 h-3.5 text-emerald-800" />
                  <span>Your Description</span>
                </div>
                <p className="text-xs text-stone-700 italic leading-relaxed">
                  "{userDesc}"
                </p>
                {userAttributes && (
                  <div className="pt-2 text-[11px] space-y-1 text-stone-600 border-t border-stone-200">
                    <p><span className="font-semibold text-stone-900">Type:</span> {userAttributes.itemType}</p>
                    <p><span className="font-semibold text-stone-900">Color:</span> {userAttributes.color}</p>
                    <p><span className="font-semibold text-stone-900">Brand:</span> {userAttributes.brand}</p>
                    <p><span className="font-semibold text-stone-900">Accessories:</span> {userAttributes.accessories}</p>
                  </div>
                )}
              </div>

              {/* Right Box: Found Item Record */}
              <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-2">
                <div className="flex items-center space-x-1.5 text-xs font-bold text-stone-900">
                  <MapPin className="w-3.5 h-3.5 text-stone-600" />
                  <span>Found Item Public Post</span>
                </div>
                <p className="text-xs text-stone-700 leading-relaxed">
                  {selectedItem.description || selectedItem.publicDescription}
                </p>
                <div className="pt-2 text-[11px] space-y-1 text-stone-600 border-t border-stone-200">
                  <p><span className="font-semibold text-stone-900">Type:</span> {selectedItem.itemType}</p>
                  <p><span className="font-semibold text-stone-900">Color:</span> {selectedItem.color}</p>
                  <p><span className="font-semibold text-stone-900">Brand:</span> {selectedItem.brand}</p>
                  <p><span className="font-semibold text-stone-900">Found Area:</span> {selectedItem.foundLocation || selectedItem.areaFound}</p>
                </div>
              </div>
            </div>

            {/* Confirmed Overlap Checklist */}
            <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 space-y-2">
              <span className="text-xs font-bold text-emerald-900 block">
                Public Similarity Clues
              </span>
              <ul className="space-y-1.5 text-xs text-emerald-800">
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                  <span><strong>{selectedItem.color} color profile</strong> directly aligns with your report</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                  <span><strong>{selectedItem.brand} brand</strong> matches citizen loss statement</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                  <span><strong>Public description:</strong> {selectedItem.description || selectedItem.publicDescription}</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Verification Protocol Notice */}
          <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 flex items-start space-x-3 text-xs text-stone-600 leading-relaxed">
            <ShieldCheck className="w-5 h-5 text-emerald-800 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-stone-900">Next Step: </span>
              If this matches your lost item, submit a claim request. You will be asked to provide identifying proof during LGU verification, without receiving hints from private finder details.
            </div>
          </div>

          {/* Action CTA */}
          <div className="pt-2">
            <button
              onClick={() => setIsConfirmModalOpen(true)}
              className="w-full py-3.5 px-6 bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-sm rounded-2xl shadow-md hover:shadow-lg transition-all flex items-center justify-center space-x-2 active:scale-98"
            >
              <span>Request Item Verification</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Confirmation Dialog Before Submitting Claim */}
      {isConfirmModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-stone-200 space-y-5">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-800 flex items-center justify-center mx-auto">
              <ShieldCheck className="w-6 h-6" />
            </div>

            <div className="text-center space-y-2">
              <h3 className="text-lg font-bold text-stone-900">
                Ready to Request Verification?
              </h3>
              <p className="text-xs text-stone-500 leading-relaxed">
                Submitting a claim initiates municipal officer ownership verification for <strong>{selectedItem.title || `${selectedItem.color} ${selectedItem.category}`} (#{selectedItem.id})</strong>. Handover can happen only at the LGU office after staff approval.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 leading-relaxed">
              <span className="font-bold">Reminder: </span>
              The ranking is advisory, not proof of ownership. Bring a valid ID and be ready to answer staff questions without hints.
            </div>

            <div className="flex items-center space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setIsConfirmModalOpen(false)}
                className="w-1/2 py-2.5 px-4 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold rounded-xl transition-colors"
              >
                Go Back
              </button>
              <button
                type="button"
                onClick={handleProceedToClaim}
                className="w-1/2 py-2.5 px-4 bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center justify-center space-x-1"
              >
                <span>Continue to Claim Form</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
