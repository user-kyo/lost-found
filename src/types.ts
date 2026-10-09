export type UserRole = "student" | "staff" | "citizen" | "admin";

export interface User {
  id: string;
  role: UserRole;
  fullName: string;
  email: string;
  token?: string;
}

export type ItemStatus = "unclaimed" | "claim_pending" | "verified" | "ready_for_retrieval" | "claimed" | "archived";

export type ClaimStatus = "pending_review" | "under_verification" | "identity_verified" | "approved" | "ready_for_retrieval" | "released" | "rejected";

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
  itemType: string;
  category: "Electronics" | "Bags & Backpacks" | "Apparel & Accessories" | "Bottles & Containers" | "Books & Stationery" | "Keys & Badges" | "Other";
  description: string;
  color: string;
  brand: string;
  identifyingCharacteristics: string;
  foundLocation: string;
  foundDate: string;
  surrenderedBy: string;
  storageBoxId: string; // "BOX-A" | "BOX-B"
  storageSlotId: string; // "A1", "B2", etc.
  status: ItemStatus;
  imageUrl: string;
  qrCodeData: string;
  claimedBy?: {
    name: string;
    citizenId?: string;
    studentId?: string;
    claimDate: string;
    claimId: string;
  };
  createdAt: string;
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
  claimantType: "Resident" | "Citizen" | "Visitor" | "LGU Employee" | "Student" | "Other";
  contactEmail: string;
  contactPhone: string;
  submittedDescription: string;
  proofOfOwnership: string; // e.g. serial number, specific contents, lock code
  supportingImageUrl?: string;
  similarityScore: number;
  status: ClaimStatus;
  submittedDate: string;
  reviewedBy?: string;
  reviewedDate?: string;
  rejectionReason?: string;
  rfidScanned?: boolean;
  retrievalCode?: string;
  releasedDate?: string;
}

export interface StorageSlot {
  id: string; // "A1", "A2", "A3", "B1", "B2", "B3", "C1", "C2", "C3"
  boxId: string; // "BOX-A", "BOX-B"
  row: string;
  col: number;
  status: SlotStatus;
  currentLFId?: string;
  reservedForClaimId?: string;
  isDoorLocked: boolean;
  lastOpenedAt?: string;
}

export interface StorageBoxUnit {
  id: string; // "BOX-A"
  name: string;
  locationName: string; // e.g. "Main Admin Building - East Wing Lobby"
  isOnline: boolean;
  masterLockStatus: "locked" | "unlocked";
  totalSlots: number;
  temperatureCelsius: number;
  lastSyncTime: string;
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
