import { FoundItem, LostReport, ClaimRequest, StorageBoxUnit, StorageSlot, AuditLogEntry, AppNotification } from "../types";

export const INITIAL_FOUND_ITEMS: FoundItem[] = [
  {
    id: "LF-2026-0012",
    createdAt: new Date(Date.now() - 100000000).toISOString(),
    title: "Black iPhone 13 Pro",
    category: "Electronics",
    color: "Black",
    brand: "Apple",
    description: "Found a black iPhone 13 Pro with a blue silicone case near the City Hall waiting lounge. It has a slight crack on the screen protector.",
    locationFound: "City Hall Waiting Lounge",
    storageBoxId: "BOX-A",
    storageSlotId: "SLOT-1",
    status: "available",
    surrenderedBy: "Juan Dela Cruz",
    qrCodeData: "LF-2026-0012|BOX-A-SLOT-1|Apple-Black",
    imageUrl: "https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?auto=format&fit=crop&w=400&q=80"
  },
  {
    id: "LF-2026-0015",
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    title: "Brown Leather Wallet",
    category: "Wallet/Purse",
    color: "Brown",
    brand: "Bellroy",
    description: "Brown leather wallet found at the jeepney stop along Taft Avenue. Contains transit cards but no IDs.",
    locationFound: "Taft Avenue Jeepney Stop",
    storageBoxId: "BOX-A",
    storageSlotId: "SLOT-2",
    status: "available",
    surrenderedBy: "Maria Clara",
    qrCodeData: "LF-2026-0015|BOX-A-SLOT-2|Bellroy-Brown",
    imageUrl: "https://images.unsplash.com/photo-1627123424574-724758594e93?auto=format&fit=crop&w=400&q=80"
  },
  {
    id: "LF-2026-0020",
    createdAt: new Date(Date.now() - 400000000).toISOString(),
    title: "Keys with Red Carabiner",
    category: "Keys",
    color: "Silver",
    brand: "Generic",
    description: "A bunch of 3 keys attached to a bright red carabiner left at the Public Library.",
    locationFound: "Public Library",
    storageBoxId: "BOX-B",
    storageSlotId: "SLOT-1",
    status: "available",
    surrenderedBy: "Admin Staff",
    qrCodeData: "LF-2026-0020|BOX-B-SLOT-1|Generic-Silver"
  },
  {
    id: "LF-2026-0025",
    createdAt: new Date(Date.now() - 10000000).toISOString(),
    title: "Blue Hydro Flask",
    category: "Tumbler/Bottle",
    color: "Blue",
    brand: "Hydro Flask",
    description: "A 32oz blue Hydro Flask with a few stickers on it, found in the park.",
    locationFound: "City Park Bench",
    storageBoxId: "BOX-A",
    storageSlotId: "SLOT-3",
    status: "available",
    surrenderedBy: "John Doe",
    qrCodeData: "LF-2026-0025|BOX-A-SLOT-3|Hydro Flask-Blue"
  },
  {
    id: "LF-2026-0030",
    createdAt: new Date(Date.now() - 2000000).toISOString(),
    title: "Reading Glasses",
    category: "Accessories",
    color: "Black",
    brand: "Ray-Ban",
    description: "Black frame reading glasses in a brown case.",
    locationFound: "Community Center",
    storageBoxId: "BOX-B",
    storageSlotId: "SLOT-2",
    status: "available",
    surrenderedBy: "Jane Smith",
    qrCodeData: "LF-2026-0030|BOX-B-SLOT-2|Ray-Ban-Black"
  }
];

export const INITIAL_LOST_REPORTS: LostReport[] = [
  {
    id: "REP-2026-105",
    createdAt: new Date(Date.now() - 150000000).toISOString(),
    studentName: "Pedro Penduko",
    studentId: "102934",
    email: "pedro@example.com",
    phone: "09123456789",
    rawDescription: "I lost my black iPhone 13 Pro with a blue case near City Hall.",
    extractedAttributes: {
      itemType: "Smartphone",
      color: "Black",
      brand: "Apple",
      accessories: "Blue silicone case",
      distinguishingFeatures: "Crack on screen protector",
      tags: ["Phone", "Apple", "Black", "Blue Case"]
    },
    lostDate: new Date(Date.now() - 180000000).toISOString(),
    estimatedLocation: "City Hall Area",
    status: "active",
    matchedItemIds: ["LF-2026-0012"]
  },
  {
    id: "REP-2026-106",
    createdAt: new Date(Date.now() - 50000000).toISOString(),
    studentName: "Anna Liza",
    studentId: "204857",
    email: "anna@example.com",
    phone: "09987654321",
    rawDescription: "Lost a blue Hydro Flask at the park this morning. It has some stickers.",
    extractedAttributes: {
      itemType: "Tumbler/Bottle",
      color: "Blue",
      brand: "Hydro Flask",
      accessories: "Stickers",
      distinguishingFeatures: "32oz size",
      tags: ["Bottle", "Hydro Flask", "Blue", "Stickers"]
    },
    lostDate: new Date(Date.now() - 55000000).toISOString(),
    estimatedLocation: "City Park",
    status: "active",
    matchedItemIds: ["LF-2026-0025"]
  }
];

export const INITIAL_CLAIMS: ClaimRequest[] = [
  {
    id: "CLM-2026-001",
    itemId: "LF-2026-0020",
    claimantName: "Mark Reyes",
    claimantId: "987654",
    claimantEmail: "mark@example.com",
    claimantPhone: "09112233445",
    proofDescription: "I have the other spare key that looks exactly like these.",
    proofImageUrl: "",
    status: "pending_review",
    submittedDate: new Date(Date.now() - 5000000).toISOString()
  }
];

export const INITIAL_STORAGE_BOXES: StorageBoxUnit[] = [
  {
    id: "BOX-A",
    location: "City Hall Lobby",
    status: "online",
    masterLockStatus: "locked",
    slots: [
      { id: "SLOT-1", status: "occupied", currentLFId: "LF-2026-0012", isDoorLocked: true },
      { id: "SLOT-2", status: "occupied", currentLFId: "LF-2026-0015", isDoorLocked: true },
      { id: "SLOT-3", status: "occupied", currentLFId: "LF-2026-0025", isDoorLocked: true },
      { id: "SLOT-4", status: "available", isDoorLocked: true },
    ]
  },
  {
    id: "BOX-B",
    location: "Public Library Entrance",
    status: "online",
    masterLockStatus: "locked",
    slots: [
      { id: "SLOT-1", status: "reserved", currentLFId: "LF-2026-0020", isDoorLocked: true, reservedForClaimId: "CLM-2026-001" },
      { id: "SLOT-2", status: "occupied", currentLFId: "LF-2026-0030", isDoorLocked: true },
      { id: "SLOT-3", status: "available", isDoorLocked: true },
      { id: "SLOT-4", status: "available", isDoorLocked: true },
    ]
  }
];

export const INITIAL_AUDIT_LOGS: AuditLogEntry[] = [
  {
    id: "LOG-2026-0001",
    timestamp: new Date(Date.now() - 100000000).toISOString().replace("T", " ").slice(0, 16),
    user: "Juan Dela Cruz",
    role: "Citizen",
    action: "ITEM_REGISTERED",
    itemId: "LF-2026-0012",
    details: "Cataloged Black iPhone 13 Pro.",
    device: "Citizen Portal",
    result: "Success"
  }
];

export const INITIAL_NOTIFICATIONS: AppNotification[] = [
  {
    id: "NOTIF-2026-001",
    title: "New Match Found",
    message: "A potential match for your lost iPhone 13 Pro has been found.",
    type: "match_found",
    timestamp: "2 hours ago",
    read: false,
    recipientRole: "student",
    relatedItemId: "LF-2026-0012"
  }
];
