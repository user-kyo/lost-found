import React, { createContext, useContext, useState, useEffect } from "react";
import {
  UserRole,
  FoundItem,
  LostReport,
  ClaimRequest,
  StorageBoxUnit,
  AuditLogEntry,
  AppNotification,
  AIMatchResult
} from "../types";
import {
  INITIAL_FOUND_ITEMS,
  INITIAL_LOST_REPORTS,
  INITIAL_CLAIMS,
  INITIAL_STORAGE_BOXES,
  INITIAL_AUDIT_LOGS,
  INITIAL_NOTIFICATIONS
} from "../data/mockData";

export type StudentNavView = "home" | "report" | "search" | "reports" | "claims" | "match_details" | "claim_request" | "claim_tracking";
export type StaffNavView = "dashboard" | "found_items" | "lost_reports" | "ai_matches" | "claim_requests" | "storage_box" | "audit_logs";
export type ScreenMode = "desktop" | "mobile";

interface AppContextType {
  role: UserRole;
  setRole: (role: UserRole) => void;
  studentView: StudentNavView;
  setStudentView: (view: StudentNavView) => void;
  staffView: StaffNavView;
  setStaffView: (view: StaffNavView) => void;
  screenMode: ScreenMode;
  setScreenMode: (mode: ScreenMode) => void;
  
  // Data
  foundItems: FoundItem[];
  lostReports: LostReport[];
  claims: ClaimRequest[];
  storageBoxes: StorageBoxUnit[];
  auditLogs: AuditLogEntry[];
  notifications: AppNotification[];

  // Active Selections
  selectedItem: FoundItem | null;
  setSelectedItem: (item: FoundItem | null) => void;
  selectedClaim: ClaimRequest | null;
  setSelectedClaim: (claim: ClaimRequest | null) => void;
  activeMatchResults: AIMatchResult[];
  setActiveMatchResults: (results: AIMatchResult[]) => void;
  lastSubmittedReport: LostReport | null;
  setLastSubmittedReport: (report: LostReport | null) => void;

  // Actions
  addNewLostReport: (report: Omit<LostReport, "id" | "createdAt">) => LostReport;
  registerFoundItem: (itemData: Omit<FoundItem, "id" | "createdAt" | "qrCodeData">) => FoundItem;
  submitClaimRequest: (claimData: Omit<ClaimRequest, "id" | "submittedDate" | "status">) => ClaimRequest;
  approveClaim: (claimId: string, staffName: string) => void;
  rejectClaim: (claimId: string, reason: string, staffName: string) => void;
  requestClaimInfo: (claimId: string, message: string) => void;
  verifyRFIDAndRelease: (claimId: string, staffName: string) => boolean;
  unlockStorageSlot: (boxId: string, slotId: string, staffName: string) => void;
  lockStorageSlot: (boxId: string, slotId: string) => void;
  toggleMasterBoxLock: (boxId: string) => void;
  markNotificationRead: (notifId: string) => void;
  markAllNotificationsRead: () => void;

  // Modals & Drawers
  isRegisterModalOpen: boolean;
  setIsRegisterModalOpen: (open: boolean) => void;
  isVerifyModalOpen: boolean;
  setIsVerifyModalOpen: (open: boolean) => void;
  isScannerModalOpen: boolean;
  setIsScannerModalOpen: (open: boolean) => void;
  isNotifDrawerOpen: boolean;
  setIsNotifDrawerOpen: (open: boolean) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [role, setRole] = useState<UserRole>("student");
  const [studentView, setStudentView] = useState<StudentNavView>("home");
  const [staffView, setStaffView] = useState<StaffNavView>("dashboard");
  const [screenMode, setScreenMode] = useState<ScreenMode>("desktop");

  // Persistent or initial state
  const [foundItems, setFoundItems] = useState<FoundItem[]>(() => {
    const saved = localStorage.getItem("slf_found_items");
    return saved ? JSON.parse(saved) : INITIAL_FOUND_ITEMS;
  });

  const [lostReports, setLostReports] = useState<LostReport[]>(() => {
    const saved = localStorage.getItem("slf_lost_reports");
    return saved ? JSON.parse(saved) : INITIAL_LOST_REPORTS;
  });

  const [claims, setClaims] = useState<ClaimRequest[]>(() => {
    const saved = localStorage.getItem("slf_claims");
    return saved ? JSON.parse(saved) : INITIAL_CLAIMS;
  });

  const [storageBoxes, setStorageBoxes] = useState<StorageBoxUnit[]>(() => {
    const saved = localStorage.getItem("slf_storage_boxes");
    return saved ? JSON.parse(saved) : INITIAL_STORAGE_BOXES;
  });

  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>(() => {
    const saved = localStorage.getItem("slf_audit_logs");
    return saved ? JSON.parse(saved) : INITIAL_AUDIT_LOGS;
  });

  const [notifications, setNotifications] = useState<AppNotification[]>(() => {
    const saved = localStorage.getItem("slf_notifications");
    return saved ? JSON.parse(saved) : INITIAL_NOTIFICATIONS;
  });

  const [selectedItem, setSelectedItem] = useState<FoundItem | null>(INITIAL_FOUND_ITEMS[0]);
  const [selectedClaim, setSelectedClaim] = useState<ClaimRequest | null>(INITIAL_CLAIMS[0]);
  const [activeMatchResults, setActiveMatchResults] = useState<AIMatchResult[]>([]);
  const [lastSubmittedReport, setLastSubmittedReport] = useState<LostReport | null>(INITIAL_LOST_REPORTS[0]);

  // Modal UI Controls
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [isVerifyModalOpen, setIsVerifyModalOpen] = useState(false);
  const [isScannerModalOpen, setIsScannerModalOpen] = useState(false);
  const [isNotifDrawerOpen, setIsNotifDrawerOpen] = useState(false);

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem("slf_found_items", JSON.stringify(foundItems));
  }, [foundItems]);

  useEffect(() => {
    localStorage.setItem("slf_lost_reports", JSON.stringify(lostReports));
  }, [lostReports]);

  useEffect(() => {
    localStorage.setItem("slf_claims", JSON.stringify(claims));
  }, [claims]);

  useEffect(() => {
    localStorage.setItem("slf_storage_boxes", JSON.stringify(storageBoxes));
  }, [storageBoxes]);

  useEffect(() => {
    localStorage.setItem("slf_audit_logs", JSON.stringify(auditLogs));
  }, [auditLogs]);

  useEffect(() => {
    localStorage.setItem("slf_notifications", JSON.stringify(notifications));
  }, [notifications]);

  // Actions
  const addAuditLog = (entry: Omit<AuditLogEntry, "id" | "timestamp">) => {
    const newLog: AuditLogEntry = {
      id: `LOG-${Math.floor(1000 + Math.random() * 9000)}`,
      timestamp: new Date().toISOString().replace("T", " ").slice(0, 16),
      ...entry
    };
    setAuditLogs(prev => [newLog, ...prev]);
  };

  const addNotification = (notif: Omit<AppNotification, "id" | "timestamp" | "read">) => {
    const newNotif: AppNotification = {
      id: `NOTIF-${Date.now().toString().slice(-4)}`,
      timestamp: "Just now",
      read: false,
      ...notif
    };
    setNotifications(prev => [newNotif, ...prev]);
  };

  const addNewLostReport = (reportData: Omit<LostReport, "id" | "createdAt">): LostReport => {
    const id = `REP-2026-${Math.floor(100 + Math.random() * 900)}`;
    const newReport: LostReport = {
      id,
      createdAt: new Date().toISOString(),
      ...reportData
    };
    setLostReports(prev => [newReport, ...prev]);
    setLastSubmittedReport(newReport);

    addAuditLog({
      user: `Citizen: ${reportData.studentName}`,
      role: "Citizen",
      action: "REPORT_CREATED",
      details: `Submitted lost item report for: ${reportData.extractedAttributes.itemType} (${reportData.extractedAttributes.color}).`,
      device: "Citizen Web Portal",
      result: "Success"
    });

    addNotification({
      title: "Lost Property Report Submitted",
      message: `Your report for "${reportData.extractedAttributes.itemType}" is active. LGU inventory matches are being monitored.`,
      type: "match_found",
      recipientRole: "student"
    });

    return newReport;
  };

  const registerFoundItem = (itemData: Omit<FoundItem, "id" | "createdAt" | "qrCodeData">): FoundItem => {
    const id = `LF-2026-${String(Math.floor(45 + Math.random() * 900)).padStart(4, "0")}`;
    const qrCodeData = `${id}|${itemData.storageBoxId}-${itemData.storageSlotId}|${itemData.brand}-${itemData.color}`;
    
    const newItem: FoundItem = {
      id,
      createdAt: new Date().toISOString(),
      qrCodeData,
      ...itemData
    };

    setFoundItems(prev => [newItem, ...prev]);

    // Update storage box slot status to occupied
    setStorageBoxes(prevBoxes => prevBoxes.map(box => {
      if (box.id === itemData.storageBoxId) {
        return {
          ...box,
          slots: box.slots.map(slot => {
            if (slot.id === itemData.storageSlotId) {
              return { ...slot, status: "occupied", currentLFId: id, lastOpenedAt: new Date().toISOString() };
            }
            return slot;
          })
        };
      }
      return box;
    }));

    addAuditLog({
      user: itemData.surrenderedBy,
      role: "LGU Desk Officer",
      action: "ITEM_REGISTERED",
      itemId: id,
      details: `Cataloged ${newItem.title}. Awaiting LGU review before publication.`,
      device: "LGU Intake Station",
      result: "Success"
    });

    addNotification({
      title: "New Item Registered in LGU Storage",
      message: `${newItem.title} registered in ${itemData.storageBoxId} Slot ${itemData.storageSlotId}.`,
      type: "staff_action",
      recipientRole: "staff",
      relatedItemId: id
    });

    return newItem;
  };

  const submitClaimRequest = (claimData: Omit<ClaimRequest, "id" | "submittedDate" | "status">): ClaimRequest => {
    const id = `CLM-2026-${String(Math.floor(90 + Math.random() * 900)).padStart(4, "0")}`;
    const newClaim: ClaimRequest = {
      id,
      submittedDate: new Date().toISOString(),
      status: "pending_review",
      ...claimData
    };

    setClaims(prev => [newClaim, ...prev]);
    setSelectedClaim(newClaim);

    // Update found item status
    setFoundItems(prev => prev.map(item => {
      if (item.id === claimData.itemId) {
        return { ...item, status: "claim_pending" };
      }
      return item;
    }));

    // Update slot status to reserved
    const item = foundItems.find(i => i.id === claimData.itemId);
    if (item) {
      setStorageBoxes(prevBoxes => prevBoxes.map(box => {
        if (box.id === item.storageBoxId) {
          return {
            ...box,
            slots: box.slots.map(slot => {
              if (slot.id === item.storageSlotId) {
                return { ...slot, status: "reserved", reservedForClaimId: id };
              }
              return slot;
            })
          };
        }
        return box;
      }));
    }

    addAuditLog({
      user: `Claimant: ${claimData.claimantName} (${claimData.claimantId})`,
      role: "Citizen",
      action: "CLAIM_SUBMITTED",
      itemId: claimData.itemId,
      claimId: id,
      details: `Submitted claim request for item #${claimData.itemId}.`,
      device: "Citizen Portal",
      result: "Pending"
    });

    addNotification({
      title: "Claim Submitted for LGU Review",
      message: `Your claim for item #${claimData.itemId} has been received. LGU officers will verify ownership details.`,
      type: "claim_update",
      recipientRole: "student",
      relatedClaimId: id
    });

    addNotification({
      title: "New Citizen Claim Awaiting Verification",
      message: `${claimData.claimantName} submitted a claim for ${item?.title || "Found Item"}.`,
      type: "staff_action",
      recipientRole: "staff",
      relatedClaimId: id
    });

    return newClaim;
  };

  const approveClaim = (claimId: string, staffName: string) => {
    const retrievalCode = `LF-RET-${Math.floor(1000 + Math.random() * 9000)}`;
    let targetItemId = "";

    setClaims(prev => prev.map(c => {
      if (c.id === claimId) {
        targetItemId = c.itemId;
        return {
          ...c,
          status: "ready_for_retrieval",
          reviewedBy: staffName,
          reviewedDate: new Date().toISOString(),
          retrievalCode
        };
      }
      return c;
    }));

    if (targetItemId) {
      setFoundItems(prev => prev.map(item => {
        if (item.id === targetItemId) {
          return { ...item, status: "ready_for_retrieval" };
        }
        return item;
      }));
    }

    addAuditLog({
      user: `LGU Officer: ${staffName}`,
      role: "LGU Desk Officer",
      action: "CLAIM_APPROVED",
      itemId: targetItemId,
      claimId,
      details: `Claim approved by ${staffName}. Retrieval code ${retrievalCode} issued.`,
      device: "LGU Admin Console",
      result: "Success"
    });

    addNotification({
      title: "Claim Approved — LGU Handover Required",
      message: "Your claim has been verified. Bring a valid ID and meet the finder at the LGU office for staff-supervised handover.",
      type: "claim_update",
      recipientRole: "student",
      relatedClaimId: claimId
    });
  };

  const rejectClaim = (claimId: string, reason: string, staffName: string) => {
    let targetItemId = "";
    setClaims(prev => prev.map(c => {
      if (c.id === claimId) {
        targetItemId = c.itemId;
        return {
          ...c,
          status: "rejected",
          reviewedBy: staffName,
          reviewedDate: new Date().toISOString(),
          rejectionReason: reason
        };
      }
      return c;
    }));

    if (targetItemId) {
      setFoundItems(prev => prev.map(item => {
        if (item.id === targetItemId) {
          return { ...item, status: "unclaimed" };
        }
        return item;
      }));
    }

    addAuditLog({
      user: `LGU Officer: ${staffName}`,
      role: "LGU Desk Officer",
      action: "CLAIM_REJECTED",
      itemId: targetItemId,
      claimId,
      details: `Claim rejected: "${reason}".`,
      device: "LGU Admin Console",
      result: "Rejected"
    });

    addNotification({
      title: "Claim Verification Notice",
      message: `Your claim for item #${targetItemId} could not be verified: ${reason}`,
      type: "claim_update",
      recipientRole: "student",
      relatedClaimId: claimId
    });
  };

  const requestClaimInfo = (claimId: string, message: string) => {
    setClaims(prev => prev.map(c => {
      if (c.id === claimId) {
        return { ...c, status: "under_verification" };
      }
      return c;
    }));

    addNotification({
      title: "Additional Verification Details Requested",
      message: `LGU officer requested additional proof: "${message}"`,
      type: "claim_update",
      recipientRole: "student",
      relatedClaimId: claimId
    });
  };

  const verifyRFIDAndRelease = (claimId: string, staffName: string): boolean => {
    const claim = claims.find(c => c.id === claimId);
    if (!claim) return false;

    const item = foundItems.find(i => i.id === claim.itemId);
    if (!item) return false;

    // Update claim to released
    setClaims(prev => prev.map(c => {
      if (c.id === claimId) {
        return {
          ...c,
          status: "released",
          rfidScanned: true,
          releasedDate: new Date().toISOString()
        };
      }
      return c;
    }));

    // Update item to claimed
    setFoundItems(prev => prev.map(i => {
      if (i.id === item.id) {
        return {
          ...i,
          status: "claimed",
          claimedBy: {
            name: claim.claimantName,
            studentId: claim.claimantId,
            claimDate: new Date().toISOString(),
            claimId: claim.id
          }
        };
      }
      return i;
    }));

    // Unlock and empty slot in storage box
    setStorageBoxes(prevBoxes => prevBoxes.map(box => {
      if (box.id === item.storageBoxId) {
        return {
          ...box,
          slots: box.slots.map(slot => {
            if (slot.id === item.storageSlotId) {
              return {
                ...slot,
                status: "available",
                currentLFId: undefined,
                reservedForClaimId: undefined,
                isDoorLocked: false,
                lastOpenedAt: new Date().toISOString()
              };
            }
            return slot;
          })
        };
      }
      return box;
    }));

    addAuditLog({
      user: `LGU Officer: ${staffName}`,
      role: "LGU Desk Officer",
      action: "ITEM_RELEASED",
      itemId: item.id,
      claimId: claim.id,
      details: `LGU staff verified ${claim.claimantName} (${claim.claimantId}) and logged the office handover for ${item.title}.`,
      device: "LGU Admin Console",
      result: "Success"
    });

    addNotification({
      title: "Item Retrieved & Case Closed",
      message: `Your item #${item.id} (${item.title}) has been successfully retrieved from Slot ${item.storageSlotId}.`,
      type: "claim_update",
      recipientRole: "student",
      relatedClaimId: claim.id
    });

    return true;
  };

  const unlockStorageSlot = (boxId: string, slotId: string, staffName: string) => {
    setStorageBoxes(prev => prev.map(box => {
      if (box.id === boxId) {
        return {
          ...box,
          slots: box.slots.map(slot => {
            if (slot.id === slotId) {
              return { ...slot, isDoorLocked: false, lastOpenedAt: new Date().toISOString() };
            }
            return slot;
          })
        };
      }
      return box;
    }));

    addAuditLog({
      user: `LGU Staff: ${staffName}`,
      role: "LGU Desk Officer",
      action: "DOOR_UNLOCKED",
      details: `Manual electronic unlock triggered for Storage Unit ${boxId} Slot ${slotId}.`,
      device: "LGU Device Manager",
      result: "Success"
    });
  };

  const lockStorageSlot = (boxId: string, slotId: string) => {
    setStorageBoxes(prev => prev.map(box => {
      if (box.id === boxId) {
        return {
          ...box,
          slots: box.slots.map(slot => {
            if (slot.id === slotId) {
              return { ...slot, isDoorLocked: true };
            }
            return slot;
          })
        };
      }
      return box;
    }));
  };

  const toggleMasterBoxLock = (boxId: string) => {
    setStorageBoxes(prev => prev.map(box => {
      if (box.id === boxId) {
        const nextStatus = box.masterLockStatus === "locked" ? "unlocked" : "locked";
        return {
          ...box,
          masterLockStatus: nextStatus,
          slots: box.slots.map(s => ({ ...s, isDoorLocked: nextStatus === "locked" }))
        };
      }
      return box;
    }));
  };

  const markNotificationRead = (notifId: string) => {
    setNotifications(prev => prev.map(n => n.id === notifId ? { ...n, read: true } : n));
  };

  const markAllNotificationsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  return (
    <AppContext.Provider
      value={{
        role,
        setRole,
        studentView,
        setStudentView,
        staffView,
        setStaffView,
        screenMode,
        setScreenMode,
        foundItems,
        lostReports,
        claims,
        storageBoxes,
        auditLogs,
        notifications,
        selectedItem,
        setSelectedItem,
        selectedClaim,
        setSelectedClaim,
        activeMatchResults,
        setActiveMatchResults,
        lastSubmittedReport,
        setLastSubmittedReport,
        addNewLostReport,
        registerFoundItem,
        submitClaimRequest,
        approveClaim,
        rejectClaim,
        requestClaimInfo,
        verifyRFIDAndRelease,
        unlockStorageSlot,
        lockStorageSlot,
        toggleMasterBoxLock,
        markNotificationRead,
        markAllNotificationsRead,
        isRegisterModalOpen,
        setIsRegisterModalOpen,
        isVerifyModalOpen,
        setIsVerifyModalOpen,
        isScannerModalOpen,
        setIsScannerModalOpen,
        isNotifDrawerOpen,
        setIsNotifDrawerOpen
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
};
