export type UserRole = 
  | "student" 
  | "guidance_encoder" 
  | "system_admin"
  | "claimant"
  | "staff"
  | "admin";

export interface User {
  id: string;
  role: UserRole;
  userType?: "student" | "faculty" | "staff" | "guidance" | "admin" | string;
  schoolId?: string;
  fullName: string;
  email: string;
  phone?: string;
  token?: string;
}

// Canonical strict status transition flow: received -> verified -> published -> claim_pending -> released
export type ItemStatus = 
  | "received"
  | "verified"
  | "published"
  | "claim_pending"
  | "released"
  // Disposition terminal statuses
  | "donated"
  | "disposed"
  | "turned_over"
  // Legacy compatibility aliases
  | "available" 
  | "pending_review" 
  | "unclaimed" 
  | "ready_for_retrieval" 
  | "claimed" 
  | "archived" 
  | "returned" 
  | "merged" 
  | "rejected";

export type ItemCondition = "Brand New" | "Good" | "Fair" | "Damaged" | "Heavily Worn";

export type EstimatedValueBand = 
  | "Low (< ₱500)" 
  | "Medium (₱500 - ₱2,000)" 
  | "High (₱2,000 - ₱10,000)" 
  | "Valuable (> ₱10,000)";

export type SpecialHandlingType = 
  | "Standard" 
  | "High-Value Electronics" 
  | "Cash / Currency" 
  | "Official ID / Documents" 
  | "Fragile / Perishable";

export type FinderAffiliation = 
  | "Student" 
  | "Faculty" 
  | "Staff" 
  | "Visitor" 
  | "Security Personnel" 
  | "Janitorial / Facilities" 
  | "Other";

export type ClaimStatus = "pending_review" | "under_verification" | "identity_verified" | "approved" | "ready_for_retrieval" | "released" | "rejected" | "submitted" | "chat_open" | "completed" | "cancelled" | "no_show";

export type SlotStatus = "available" | "occupied" | "reserved" | "maintenance";

export interface NLPExtractedAttributes {
  itemType: string;
  color: string;
  brand: string;
  accessories: string;
  distinguishingFeatures: string;
  locationHint?: string;
  tags: string[];
  confidence?: string;
}

export interface FoundItem {
  id: string; // e.g. "LF-2026-0042"
  title: string;
  itemType?: string;
  category: string;
  description: string;
  color: string;
  brand: string;
  
  // Intake Form details
  condition?: ItemCondition | string;
  estimatedValueBand?: EstimatedValueBand | string;
  specialHandlingType?: SpecialHandlingType | string;
  storageLocation?: string;
  
  // Manually captured finder information (since finders do not have accounts)
  finderName?: string;
  finderContact?: string;
  finderType?: FinderAffiliation | string;
  finderNotes?: string;

  identifyingCharacteristics?: string;
  foundLocation?: string;
  locationFound?: string;
  foundDate?: string;
  surrenderedBy: string;
  storageBoxId?: string; // "BOX-A" | "BOX-B"
  storageSlotId?: string; // "A1", "B2", etc.
  status: ItemStatus;
  imageUrl?: string;
  qrCodeData?: string;
  claimedBy?: {
    name: string;
    citizenId?: string;
    studentId?: string;
    claimDate: string;
    claimId: string;
  };
  createdAt: string;
  verifiedAt?: string;
  verifiedBy?: string;
  publishedAt?: string;
  releasedAt?: string;
  
  // New High-Priority Database Schema Fields
  control_no?: string;
  controlNo?: string;
  received_at?: string;
  receivedAt?: string;
  received_by?: string;
  receivedBy?: string;
  finder_id?: string;
  finderId?: string;
  special_handling_type?: string;
  storage_location?: string;
  school_holding_end_date?: string;
  schoolHoldingEndDate?: string;
  city_publication_date?: string;
  cityPublicationDate?: string;
  earliest_award_date?: string;
  earliestAwardDate?: string;
  final_disposition?: string;
  finalDisposition?: string;

  // Holding Period Clocks & Disposition Case
  holdingClocks?: HoldingClockInfo;
  dispositionCase?: DispositionCase;
  documents?: ScannedDocumentRecord[];
  statusHistory?: ItemStatusHistoryEntry[];
}

export interface FinderRecord {
  id: string;
  name: string;
  type?: string;
  schoolId?: string;
  contactNumber?: string;
  email?: string;
  department?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ItemStatusHistoryEntry {
  id: string;
  itemId: string;
  fromStatus?: string | null;
  toStatus: string;
  changedBy: string;
  changerName?: string;
  reason?: string;
  notes?: string;
  createdAt: string;
}

export interface ScannedDocumentRecord {
  id: string;
  itemId?: string;
  claimId?: string;
  releaseId?: string;
  dispositionCaseId?: string;
  documentType: "release_waiver" | "proof_of_ownership" | "id_scan" | "disposition_affidavit" | "intake_receipt" | string;
  fileName: string;
  fileUrl: string;
  fileSize?: number;
  mimeType?: string;
  uploadedBy: string;
  uploaderName?: string;
  uploadedAt: string;
}

export interface ClaimVerificationRecord {
  id: string;
  claimId: string;
  verifiedBy: string;
  verifierName?: string;
  verificationType?: string;
  questionsAnswers?: string;
  idTypePresented?: string;
  idNumberLast4?: string;
  status: "passed" | "failed" | "pending";
  notes?: string;
  verifiedAt: string;
}

export interface LostReport {
  id: string; // e.g. "REP-2026-018"
  studentName: string; // Citizen/Reporter name
  studentId: string; // Citizen/Resident ID number
  email: string;
  phone: string;
  rawDescription: string;
  extractedAttributes: NLPExtractedAttributes;
  lostDate: string;
  estimatedLocation: string;
  status: "active" | "matched" | "claim_submitted" | "resolved" | "cancelled";
  matchedItemIds: string[];
  createdAt: string;
}

export interface ClaimRequest {
  id: string; // e.g. "CLM-2026-0089"
  itemId: string;
  lostReportId?: string;
  claimantName: string;
  claimantId: string;
  claimantEmail?: string;
  claimantPhone?: string;
  claimantType?: "Resident" | "Citizen" | "Visitor" | "LGU Employee" | "Student" | "Other" | string;
  contactEmail?: string;
  contactPhone?: string;
  submittedDescription?: string;
  proofOfOwnership?: string; // e.g. serial number, specific contents, lock code
  proofDescription?: string;
  proofImageUrl?: string;
  supportingImageUrl?: string;
  similarityScore?: number;
  status: ClaimStatus;
  submittedDate: string;
  reviewedBy?: string;
  reviewedDate?: string;
  rejectionReason?: string;
  rfidScanned?: boolean;
  retrievalCode?: string;
  releasedDate?: string;
  releaseRecord?: ReleaseHandoverRecord;
}

export interface ReleaseHandoverRecord {
  id?: string;
  claimId: string;
  postId?: string;
  recipientName: string;
  recipientSchoolId: string;
  recipientContact?: string;
  recipientEmail?: string;
  recipientType?: string; // "Actual Owner" | "Authorized Representative" | "Guardian"
  idTypePresented: string; // "University Student ID" | "Government ID / Driver's License" | "PhilSys National ID" | "PRC ID" | "Passport" | "Faculty/Staff ID" | "Other Valid ID"
  idNumber: string;
  releaseDateTime: string; // ISO string
  approvingStaffMember: string; // Staff full name
  approvingStaffId?: string;
  acknowledgmentOfReceipt: {
    confirmed: boolean;
    statement: string;
    signedAt?: string;
  };
  verificationSummary?: string;
  staffNotes?: string;
}

export interface HoldingClockInfo {
  receivedAt: string; // ISO string
  schoolHoldingPeriodDays: number; // Configurable days, e.g. 60
  schoolHoldingDeadline: string; // ISO string
  isSchoolHoldingLapsed: boolean;
  schoolDaysRemaining: number;
  schoolDaysElapsed: number;
  
  cityPublicationDate?: string; // ISO string
  earliestAwardDate?: string; // cityPublicationDate + 6 months
  isStatutoryPeriodElapsed: boolean;
  statutoryDaysRemaining: number;
  statutoryDaysElapsed: number;
  
  holdingStatus: "within_school_period" | "school_period_lapsed" | "statutory_award_eligible";
}

export interface DispositionChecklist {
  physical_inventory_audit: boolean; // Physical inventory presence & condition verified in storage
  claim_absence_certified: boolean; // Certified no active or pending claims exist
  notice_posted: boolean; // Public notice of unclaimed status posted / statutory period observed
  recipient_identified: boolean; // Designated receiving organization (e.g. charity/welfare) or disposal protocol identified
  property_affidavit_attached: boolean; // Official property disposition manifest & affidavit prepared
}

export interface DispositionCase {
  caseId: string; // e.g. "DISP-2026-0042"
  postId: string;
  itemTitle?: string;
  targetDisposition: "donated" | "disposed" | "turned_over";
  status: "draft" | "pending_documentation" | "pending_approval" | "approved" | "executed" | "cancelled";
  createdAt: string;
  initiatedBy: string;
  holdingClockSnapshot: HoldingClockInfo;
  checklist: DispositionChecklist;
  checklistNotes?: Record<string, string>;
  checklistCompleted: boolean;
  approval?: {
    approved: boolean;
    approvedBy?: string;
    approverRole?: string;
    approvedAt?: string;
    officialRemarks?: string;
  };
  execution?: {
    executed: boolean;
    executedBy?: string;
    executedAt?: string;
    manifestNumber?: string;
    recipientOrg?: string;
    dispositionRemarks?: string;
  };
}

export interface StorageSlot {
  id: string; // "A1", "A2", "A3", "B1", "B2", "B3", "C1", "C2", "C3"
  boxId?: string; // "BOX-A", "BOX-B"
  row?: string;
  col?: number;
  status: SlotStatus;
  currentLFId?: string;
  reservedForClaimId?: string;
  isDoorLocked: boolean;
  lastOpenedAt?: string;
}

export interface StorageBoxUnit {
  id: string; // "BOX-A"
  name?: string;
  status?: string;
  location?: string;
  locationName?: string; // e.g. "Main Admin Building - East Wing Lobby"
  isOnline?: boolean;
  masterLockStatus: "locked" | "unlocked";
  totalSlots?: number;
  temperatureCelsius?: number;
  lastSyncTime?: string;
  slots: StorageSlot[];
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  user: string;
  role: string;
  action: "REPORT_CREATED" | "ITEM_REGISTERED" | "CLAIM_SUBMITTED" | "CLAIM_APPROVED" | "CLAIM_REJECTED" | "RFID_VERIFIED" | "DOOR_UNLOCKED" | "ITEM_RELEASED" | "SLOT_ASSIGNED";
  itemId?: string;
  claimId?: string;
  details: string;
  device?: string;
  result: "Success" | "Flagged" | "Rejected" | "Pending";
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  type: "match_found" | "claim_update" | "staff_action" | "system_alert";
  recipientRole: "student" | "staff" | "all";
  actionUrl?: string;
  relatedItemId?: string;
  relatedClaimId?: string;
}

export interface AIMatchResult {
  item: FoundItem;
  similarityScore: number;
  confidence: "High" | "Medium" | "Low";
  matchedAttributes: string[];
  discrepancies: string[];
  aiSummary: string;
}
