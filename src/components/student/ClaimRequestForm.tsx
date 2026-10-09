import React, { useState } from "react";
import { useApp } from "../../context/AppContext";
import { 
  ArrowLeft, 
  ShieldCheck, 
  Upload, 
  CheckCircle2, 
  AlertTriangle, 
  FileText, 
  User, 
  Mail, 
  Phone, 
  Lock,
  ArrowRight
} from "lucide-react";

export const ClaimRequestForm: React.FC = () => {
  const { 
    user,
    selectedItem, 
    lastSubmittedReport, 
    submitClaimRequest, 
    setStudentView, 
    setSelectedClaim 
  } = useApp();

  const [claimantName, setClaimantName] = useState(lastSubmittedReport?.studentName || "");
  const [claimantId, setClaimantId] = useState(lastSubmittedReport?.studentId || "");
  const [claimantType, setClaimantType] = useState<"Resident" | "Citizen" | "LGU Employee" | "Student" | "Faculty" | "Staff">("Citizen");
  const [contactEmail, setContactEmail] = useState(lastSubmittedReport?.email || "");
  const [contactPhone, setContactPhone] = useState(lastSubmittedReport?.phone || "");
  const [submittedDescription, setSubmittedDescription] = useState(
    lastSubmittedReport?.rawDescription || ""
  );
  const [proofOfOwnership, setProofOfOwnership] = useState("");
  const [supportingImageUrl, setSupportingImageUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!selectedItem) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-4">
        <p className="text-stone-500 text-sm">No item selected for claim.</p>
        <button
          onClick={() => setStudentView("search")}
          className="px-4 py-2 bg-emerald-800 text-white rounded-xl text-xs font-semibold"
        >
          Return to Catalog
        </button>
      </div>
    );
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const submitRealClaim = async () => {
      try {
        const res = await fetch("/api/claims", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${user?.token}`
          },
          body: JSON.stringify({
            postId: selectedItem.id,
            ownerNote: proofOfOwnership + " " + submittedDescription,
          })
        });
        
        if (res.ok) {
          const data = await res.json();
          setSelectedClaim(data.claim);
          setStudentView("claim_tracking");
        } else {
          alert("Failed to submit claim.");
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsSubmitting(false);
      }
    };

    submitRealClaim();
  };

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6 sm:space-y-8">
      {/* Back Button & Header */}
      <div>
        <button
          onClick={() => setStudentView("match_details")}
          className="inline-flex items-center space-x-1.5 text-xs font-bold text-stone-600 hover:text-emerald-800 mb-3 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Match Comparison</span>
        </button>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight">
          Submit Claim Request
        </h1>
        <p className="text-sm text-stone-500 mt-1">
          Provide identification and verifiable proof of ownership for municipal officer review.
        </p>
      </div>

      {/* Selected Item Mini-Card Preview */}
      <div className="bg-stone-50 border border-stone-200 rounded-2xl p-4 sm:p-5 flex items-center space-x-4">
        <img
          src={selectedItem.imageUrl}
          alt={selectedItem.title}
          referrerPolicy="no-referrer"
          className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl object-cover border border-stone-200 shrink-0"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2">
            <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">
              Item #{selectedItem.id}
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
              LGU office verification required
            </span>
          </div>
          <h3 className="text-sm sm:text-base font-bold text-stone-900 truncate mt-0.5">
            {selectedItem.title}
          </h3>
          <p className="text-xs text-stone-600 truncate">
            {selectedItem.color} • {selectedItem.brand} • Found: {selectedItem.foundLocation}
          </p>
        </div>
      </div>

      {/* Mandatory Notice */}
      <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-start space-x-3 text-xs text-amber-900 leading-relaxed">
        <ShieldCheck className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold">Ownership Verification Notice: </span>
          Submitting a claim does not guarantee approval. Authorized LGU staff must verify ownership details manually at the LGU office before handover.
        </div>
      </div>

      {/* Main Form */}
      <form onSubmit={handleSubmit} className="bg-white border border-stone-200 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
        {/* Section 1: Claimant Info */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-stone-900 pb-2 border-b border-stone-100 flex items-center space-x-2">
            <User className="w-4 h-4 text-emerald-800" />
            <span>1. Claimant Information</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Full Name *
              </label>
              <input
                type="text"
                required
                value={claimantName}
                onChange={(e) => setClaimantName(e.target.value)}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-stone-200 focus:ring-2 focus:ring-emerald-700 focus:outline-hidden bg-stone-50/50"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Citizen / Resident ID or Reference *
              </label>
              <input
                type="text"
                required
                value={claimantId}
                onChange={(e) => setClaimantId(e.target.value)}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-stone-200 focus:ring-2 focus:ring-emerald-700 focus:outline-hidden bg-stone-50/50"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Email Address *
              </label>
              <input
                type="email"
                required
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-stone-200 focus:ring-2 focus:ring-emerald-700 focus:outline-hidden bg-stone-50/50"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Contact Phone Number
              </label>
              <input
                type="tel"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-stone-200 focus:ring-2 focus:ring-emerald-700 focus:outline-hidden bg-stone-50/50"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Detailed Proof of Ownership */}
        <div className="space-y-4 pt-2">
          <h3 className="text-sm font-bold text-stone-900 pb-2 border-b border-stone-100 flex items-center space-x-2">
            <Lock className="w-4 h-4 text-emerald-800" />
            <span>2. Verifiable Proof of Ownership</span>
          </h3>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Specific Proof or Internal Contents *
              </label>
              <textarea
                rows={3}
                required
                value={proofOfOwnership}
                onChange={(e) => setProofOfOwnership(e.target.value)}
                placeholder="Describe items inside, serial number digits, lock codes, unique scratch locations, or names written inside..."
                className="w-full rounded-2xl border border-stone-200 p-3.5 text-xs text-stone-800 focus:ring-2 focus:ring-emerald-700 focus:outline-hidden leading-relaxed bg-stone-50/50"
              />
              <p className="text-[11px] text-stone-500 mt-1">
                LGU officers will check these details against the finder/private record and the physical item before approving.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Supporting Photo or Receipt (Optional)
              </label>
              <div className="flex flex-col space-y-3">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        setSupportingImageUrl(reader.result as string);
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-stone-200 focus:ring-2 focus:ring-emerald-700 focus:outline-hidden bg-stone-50/50 file:mr-4 file:py-1.5 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-emerald-50 file:text-emerald-800 hover:file:bg-emerald-100 file:cursor-pointer cursor-pointer"
                />
                {supportingImageUrl && (
                  <div className="relative inline-block self-start">
                    <img src={supportingImageUrl} alt="Preview" className="h-24 rounded-lg object-cover border border-stone-200 shadow-sm" />
                    <button type="button" onClick={() => setSupportingImageUrl("")} className="absolute -top-2 -right-2 bg-stone-800 hover:bg-stone-900 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs shadow-md">×</button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Date Submitted Info */}
        <div className="pt-2 text-xs text-stone-500 flex items-center justify-between">
          <span>Date of Claim: {new Date().toISOString().split("T")[0]}</span>
          <span>Encrypted Submission • BalikHub Security v3</span>
        </div>

        {/* Form Submission */}
        <div className="pt-4 border-t border-stone-100 flex items-center justify-end space-x-3">
          <button
            type="button"
            onClick={() => setStudentView("match_details")}
            className="px-5 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2.5 bg-emerald-800 hover:bg-emerald-900 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center space-x-1.5 active:scale-98"
          >
            <span>{isSubmitting ? "Submitting..." : "Submit Claim Request"}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
};
