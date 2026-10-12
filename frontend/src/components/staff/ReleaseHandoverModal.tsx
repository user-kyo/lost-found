import React, { useState, useEffect } from "react";
import { useApp } from "../../context/AppContext";
import { 
  X, 
  Handshake, 
  ShieldCheck, 
  CheckCircle2, 
  Calendar, 
  Clock, 
  User, 
  CreditCard, 
  FileCheck, 
  Award, 
  Printer, 
  BadgeCheck, 
  ExternalLink,
  Phone,
  Mail,
  AlertCircle
} from "lucide-react";
import { ReleaseHandoverRecord } from "../../types";

interface ReleaseHandoverModalProps {
  claim: any;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (releaseRecord: ReleaseHandoverRecord) => void;
  viewReceiptOnly?: boolean;
}

export const ReleaseHandoverModal: React.FC<ReleaseHandoverModalProps> = ({
  claim,
  isOpen,
  onClose,
  onSuccess,
  viewReceiptOnly = false
}) => {
  const { user, verifyRFIDAndRelease } = useApp();

  const [recipientName, setRecipientName] = useState("");
  const [recipientSchoolId, setRecipientSchoolId] = useState("");
  const [recipientContact, setRecipientContact] = useState("");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [recipientType, setRecipientType] = useState<string>("Actual Owner");
  
  const [idTypePresented, setIdTypePresented] = useState<string>("University Student ID");
  const [idNumber, setIdNumber] = useState<string>("");
  
  const [releaseDateTime, setReleaseDateTime] = useState<string>(new Date().toISOString());
  const [approvingStaffMember, setApprovingStaffMember] = useState<string>("");
  
  const [acknowledgmentConfirmed, setAcknowledgmentConfirmed] = useState<boolean>(false);
  const [typedSignature, setTypedSignature] = useState<string>("");
  const [staffRemarks, setStaffRemarks] = useState<string>("Physical item inspected and verified in person against recorded clues at Guidance Desk.");

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [showReceiptView, setShowReceiptView] = useState<boolean>(viewReceiptOnly);
  const [completedRecord, setCompletedRecord] = useState<ReleaseHandoverRecord | null>(null);

  useEffect(() => {
    if (claim) {
      const defaultName = claim.recipientName || claim.claimantName || claim.claimant?.fullName || claim.owner?.fullName || "";
      const defaultId = claim.recipientSchoolId || claim.claimantId || claim.claimant?.schoolId || "";
      const defaultPhone = claim.recipientContact || claim.contactPhone || claim.claimant?.phone || "";
      const defaultEmail = claim.contactEmail || claim.claimant?.email || "";

      setRecipientName(defaultName);
      setRecipientSchoolId(defaultId);
      setRecipientContact(defaultPhone);
      setRecipientEmail(defaultEmail);
      setApprovingStaffMember(user?.fullName || "Clara Reyes (Guidance Encoder)");
      setReleaseDateTime(new Date().toISOString());
      setTypedSignature(defaultName);
      setAcknowledgmentConfirmed(true);

      // If claim was already released and has a releaseRecord
      if (claim.releaseRecord || claim.handovers?.[0]) {
        let rec = claim.releaseRecord;
        if (!rec && claim.handovers?.[0]?.notes) {
          try { rec = JSON.parse(claim.handovers[0].notes); } catch {}
        }
        if (rec) {
          setCompletedRecord(rec);
          if (viewReceiptOnly) setShowReceiptView(true);
        }
      }
    }
  }, [claim, user, viewReceiptOnly]);

  if (!isOpen || !claim) return null;

  const handleReleaseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!acknowledgmentConfirmed) {
      alert("Please check the Acknowledgment of Receipt box to certify physical handover.");
      return;
    }
    if (!idNumber.trim()) {
      alert("Please provide the ID Number / Reference of the physical ID presented.");
      return;
    }

    setIsSubmitting(true);

    const payload: ReleaseHandoverRecord = {
      claimId: claim.id,
      postId: claim.postId || claim.itemId,
      recipientName,
      recipientSchoolId,
      recipientContact,
      recipientEmail,
      recipientType,
      idTypePresented,
      idNumber,
      releaseDateTime: new Date().toISOString(),
      approvingStaffMember: approvingStaffMember || user?.fullName || "Guidance Officer",
      approvingStaffId: user?.id,
      acknowledgmentOfReceipt: {
        confirmed: true,
        statement: `I, ${recipientName}, acknowledge that I have physically received the item in satisfactory condition from the School Guidance Office.`,
        signedAt: new Date().toISOString()
      },
      verificationSummary: `Physical item verified at Guidance Desk. Presented ${idTypePresented} #${idNumber}. Approved by ${approvingStaffMember}.`,
      staffNotes: staffRemarks
    };

    try {
      // Send to backend API
      if (user?.token) {
        const res = await fetch(`/api/admin/claims/${claim.id}/release`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${user.token}`
          },
          body: JSON.stringify(payload)
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => null);
          throw new Error(errData?.error || "Failed to log item release on server.");
        }
      }

      // Update client context
      verifyRFIDAndRelease(claim.id, approvingStaffMember || user?.fullName || "Guidance Officer", payload);
      setCompletedRecord(payload);
      setShowReceiptView(true);

      if (onSuccess) {
        onSuccess(payload);
      }
    } catch (err: any) {
      console.error(err);
      alert(err.message || "An error occurred while logging the handover.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const itemTitle = claim.post?.publicDescription?.slice(0, 45) || claim.post?.title || `${claim.post?.color || ''} ${claim.post?.category || 'Found Item'}`;

  return (
    <div className="fixed inset-0 z-[120] bg-stone-950/75 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-[2.5rem] shadow-2xl max-w-2xl w-full my-auto overflow-hidden border border-stone-200/90 animate-in zoom-in-95 duration-200 text-stone-800">
        
        {/* Top Header */}
        <div className="bg-gradient-to-r from-stone-900 via-stone-850 to-blue-950 text-white p-6 sm:p-7 relative">
          <button
            onClick={onClose}
            className="absolute top-6 right-6 p-2 rounded-xl bg-white/10 hover:bg-white/20 text-stone-300 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center space-x-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-300">
              <Handshake className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-blue-400">
                Official Custody Handover • Stage 5
              </span>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                {showReceiptView ? "Release & Handover Certificate" : "Item Release & Verification Form"}
              </h2>
            </div>
          </div>
          <p className="text-xs text-stone-300 font-medium">
            Guidance Office physical property release protocol for claim #{claim.id}
          </p>
        </div>

        {/* Content Body */}
        {showReceiptView && completedRecord ? (
          /* Official Printable Receipt Certificate View */
          <div className="p-6 sm:p-8 space-y-6 max-h-[80vh] overflow-y-auto">
            {/* Certificate Header Banner */}
            <div className="text-center p-6 rounded-3xl bg-emerald-50/60 border border-emerald-200/80 space-y-2">
              <div className="w-12 h-12 bg-emerald-600 text-white rounded-2xl flex items-center justify-center mx-auto shadow-md shadow-emerald-600/20">
                <BadgeCheck className="w-7 h-7" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-800 block">
                Certificate of Property Release & Handover
              </span>
              <h3 className="text-xl font-black text-stone-900">Official Turnover Completed</h3>
              <p className="text-xs text-stone-600 max-w-md mx-auto">
                Item #{completedRecord.postId} has been officially released to its verified recipient. The status is permanently marked as <strong className="text-stone-900">Released (Final)</strong>.
              </p>
            </div>

            {/* Structured Receipt Summary Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200/80 space-y-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-stone-400 block">Recipient Information</span>
                <p className="font-extrabold text-stone-900 text-sm">{completedRecord.recipientName}</p>
                <p className="text-stone-600">ID Number: <strong>{completedRecord.recipientSchoolId}</strong></p>
                <p className="text-stone-600">Capacity: <strong>{completedRecord.recipientType}</strong></p>
                {completedRecord.recipientContact && <p className="text-stone-600">Contact: {completedRecord.recipientContact}</p>}
              </div>

              <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200/80 space-y-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-stone-400 block">Identity Presented & Verified</span>
                <p className="font-extrabold text-stone-900 text-sm">{completedRecord.idTypePresented}</p>
                <p className="text-stone-600">ID / License Reference: <strong className="font-mono">{completedRecord.idNumber}</strong></p>
                <p className="text-stone-600">Inspection: <span className="text-emerald-700 font-bold">Physical ID Verified</span></p>
              </div>

              <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200/80 space-y-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-stone-400 block">Release Authorization</span>
                <p className="font-extrabold text-stone-900 text-sm">{completedRecord.approvingStaffMember}</p>
                <p className="text-stone-600">Release Timestamp: <strong className="font-mono">{new Date(completedRecord.releaseDateTime).toLocaleString()}</strong></p>
                <p className="text-stone-600">Station: <strong>School Guidance Office Desk</strong></p>
              </div>

              <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200/80 space-y-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-stone-400 block">Acknowledgment of Receipt</span>
                <div className="flex items-center space-x-1.5 text-emerald-800 font-extrabold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Certified & Acknowledged</span>
                </div>
                <p className="text-stone-500 text-[11px] italic">
                  "{completedRecord.acknowledgmentOfReceipt.statement}"
                </p>
              </div>
            </div>

            {completedRecord.staffNotes && (
              <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200 text-xs text-stone-600">
                <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block mb-0.5">Staff Handover Notes</span>
                <p>{completedRecord.staffNotes}</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-stone-100">
              <span className="text-[11px] text-stone-400 font-mono">
                Log Reference: {completedRecord.claimId} • Post #{completedRecord.postId}
              </span>
              <div className="flex items-center space-x-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={handlePrint}
                  className="px-4 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-colors"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print Receipt</span>
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2.5 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* Official Form for Staff to Record Release Details */
          <form onSubmit={handleReleaseSubmit} className="p-6 sm:p-8 space-y-6 max-h-[80vh] overflow-y-auto">
            {/* Target Item Pill */}
            <div className="p-3.5 rounded-2xl bg-blue-50/60 border border-blue-200/80 flex items-center justify-between text-xs">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-800 text-white flex items-center justify-center font-bold text-xs">
                  LF
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase text-blue-800 tracking-wider">Item for Handover</span>
                  <p className="font-extrabold text-stone-900">{itemTitle}</p>
                </div>
              </div>
              <span className="font-mono text-[11px] bg-white px-2 py-1 rounded-md border border-blue-200 font-bold text-blue-900">
                #{claim.postId || claim.itemId}
              </span>
            </div>

            {/* Section 1: Recipient's Details */}
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <User className="w-4 h-4 text-blue-700" />
                <h4 className="text-xs font-black uppercase tracking-wider text-stone-900">
                  1. Recipient's Details
                </h4>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-[11px] font-bold text-stone-600 mb-1">
                    Recipient Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={recipientName}
                    onChange={(e) => setRecipientName(e.target.value)}
                    placeholder="e.g. Juan Dela Cruz"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-600 text-stone-900 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-stone-600 mb-1">
                    Student ID / School Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={recipientSchoolId}
                    onChange={(e) => setRecipientSchoolId(e.target.value)}
                    placeholder="e.g. 2024-00101"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-600 text-stone-900 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-stone-600 mb-1">
                    Recipient Contact Phone
                  </label>
                  <input
                    type="text"
                    value={recipientContact}
                    onChange={(e) => setRecipientContact(e.target.value)}
                    placeholder="e.g. 0917-123-4567"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-600 text-stone-900 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-stone-600 mb-1">
                    Recipient Capacity / Relationship
                  </label>
                  <select
                    value={recipientType}
                    onChange={(e) => setRecipientType(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-600 text-stone-900 font-medium"
                  >
                    <option value="Actual Owner">Actual Owner (Student / Staff)</option>
                    <option value="Authorized Representative">Authorized Representative</option>
                    <option value="Parent / Legal Guardian">Parent / Legal Guardian</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Section 2: ID Presented */}
            <div className="space-y-3 pt-2 border-t border-stone-100">
              <div className="flex items-center space-x-2">
                <CreditCard className="w-4 h-4 text-blue-700" />
                <h4 className="text-xs font-black uppercase tracking-wider text-stone-900">
                  2. Physical ID Presented
                </h4>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-[11px] font-bold text-stone-600 mb-1">
                    ID Type Presented <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={idTypePresented}
                    onChange={(e) => setIdTypePresented(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-600 text-stone-900 font-medium"
                  >
                    <option value="University Student ID">University Student ID Card</option>
                    <option value="National ID (PhilSys)">Philippine National ID (PhilSys)</option>
                    <option value="Driver's License">Driver's License (LTO)</option>
                    <option value="Passport">Passport</option>
                    <option value="PRC Professional ID">PRC Professional ID</option>
                    <option value="Postal ID">Postal ID</option>
                    <option value="Faculty / Employee ID">Faculty / Employee ID</option>
                    <option value="Other Valid Government ID">Other Valid Government ID</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-stone-600 mb-1">
                    ID Number / Card Serial <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={idNumber}
                    onChange={(e) => setIdNumber(e.target.value)}
                    placeholder="e.g. 2024-00101 or DL-N01-23-456789"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-600 text-stone-900 font-medium font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Section 3: Release Date/Time & Approving Staff */}
            <div className="space-y-3 pt-2 border-t border-stone-100">
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4 text-blue-700" />
                <h4 className="text-xs font-black uppercase tracking-wider text-stone-900">
                  3. Release Date/Time & Approving Officer
                </h4>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-[11px] font-bold text-stone-600 mb-1">
                    Approving Guidance Staff Member <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={approvingStaffMember}
                    onChange={(e) => setApprovingStaffMember(e.target.value)}
                    placeholder="e.g. Clara Reyes (Guidance Encoder)"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-600 text-stone-900 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-stone-600 mb-1">
                    Release Timestamp
                  </label>
                  <div className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 bg-stone-100 text-stone-700 font-mono text-[11px] flex items-center justify-between">
                    <span>{new Date(releaseDateTime).toLocaleString()}</span>
                    <span className="text-[10px] bg-stone-200 px-1.5 py-0.5 rounded text-stone-600 font-bold">Auto-Logged</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Section 4: Acknowledgment of Receipt */}
            <div className="space-y-3 pt-2 border-t border-stone-100">
              <div className="flex items-center space-x-2">
                <FileCheck className="w-4 h-4 text-emerald-700" />
                <h4 className="text-xs font-black uppercase tracking-wider text-stone-900">
                  4. Acknowledgment of Receipt
                </h4>
              </div>

              <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 space-y-3 text-xs">
                <p className="text-stone-700 leading-relaxed text-[11px] italic">
                  "I hereby acknowledge and certify that I have physically inspected and received the surrendered item described above in satisfactory condition from the School Guidance Office. I confirm that all verification criteria were fulfilled and that I am the rightful owner or authorized recipient."
                </p>

                <label className="flex items-start space-x-2.5 cursor-pointer pt-1">
                  <input
                    type="checkbox"
                    required
                    checked={acknowledgmentConfirmed}
                    onChange={(e) => setAcknowledgmentConfirmed(e.target.checked)}
                    className="w-4 h-4 mt-0.5 text-blue-600 rounded-sm border-stone-300 focus:ring-blue-500"
                  />
                  <span className="font-bold text-stone-900 leading-tight">
                    Recipient has inspected the item in person and confirmed physical receipt
                  </span>
                </label>

                <div className="pt-2 border-t border-emerald-200/60">
                  <label className="block text-[11px] font-bold text-stone-700 mb-1">
                    Recipient Signature / Sign-Off Name:
                  </label>
                  <input
                    type="text"
                    required
                    value={typedSignature}
                    onChange={(e) => setTypedSignature(e.target.value)}
                    placeholder="Type recipient full name as electronic acknowledgment"
                    className="w-full px-3 py-2 rounded-xl border border-emerald-200 bg-white text-stone-900 font-serif italic text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-stone-600 mb-1">
                  Staff Verification Remarks (Optional)
                </label>
                <input
                  type="text"
                  value={staffRemarks}
                  onChange={(e) => setStaffRemarks(e.target.value)}
                  placeholder="e.g. Verified keychain and serial code matching notes"
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-stone-200 bg-stone-50 focus:bg-white text-stone-800"
                />
              </div>
            </div>

            {/* Bottom Form Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-end space-y-2 sm:space-y-0 sm:space-x-3 pt-4 border-t border-stone-100">
              <button
                type="button"
                onClick={onClose}
                className="w-full sm:w-auto px-5 py-3 text-stone-600 hover:bg-stone-100 rounded-xl text-xs font-bold transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full sm:w-auto px-7 py-3 bg-gradient-to-r from-blue-800 to-indigo-800 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold flex items-center justify-center space-x-2 shadow-lg shadow-blue-800/30 transition-all active:scale-98 disabled:opacity-50"
              >
                <Handshake className="w-4 h-4" />
                <span>{isSubmitting ? "Logging Handover..." : "Confirm Official Release & Log Handover"}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
