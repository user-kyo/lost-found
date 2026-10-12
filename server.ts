import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

dotenv.config();

const prisma = new PrismaClient();
// Backward compatibility bridge for renamed Prisma models
(prisma as any).post = (prisma as any).item;
(prisma as any).postPrivateDetail = (prisma as any).itemPrivateDetail;
(prisma as any).postFlag = (prisma as any).itemFlag;
(prisma as any).handoverLog = (prisma as any).release;

const JWT_SECRET = process.env.JWT_SECRET || "balikhub-super-secret-key-2026";

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "10mb" }));

// Lazy Gemini AI client
let aiClient: GoogleGenAI | null = null;
function getAIClient(): GoogleGenAI | null {
  if (!aiClient && process.env.GEMINI_API_KEY) {
    aiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// Fallback rule-based NLP extraction if Gemini/Python is offline
function ruleBasedExtract(description: string) {
  const text = description.toLowerCase();
  
  const itemTypes = [
    { type: "Phone / Smartphone", keys: ["iphone", "samsung", "phone", "cellphone", "android", "xiaomi", "oppo", "vivo", "realme", "cp"] },
    { type: "Laptop / Tablet", keys: ["laptop", "macbook", "ipad", "tablet", "notebook", "lenovo", "asus", "dell", "hp", "acer"] },
    { type: "Bag / Backpack", keys: ["bag", "backpack", "tote", "handbag", "pouch", "jansport", "knapsack", "duffel"] },
    { type: "Wallet / Purse", keys: ["wallet", "purse", "pitaka", "coin purse", "billfold"] },
    { type: "Water Bottle / Tumbler", keys: ["tumbler", "bottle", "hydroflask", "aquaflask", "thermos", "stanley", "flask", "water bottle"] },
    { type: "Keys / ID / Badge", keys: ["keys", "key", "susi", "id", "badge", "lanyard", "license", "card"] },
    { type: "Earphones / Audio", keys: ["airpods", "earbuds", "earphones", "headphones", "headset"] },
    { type: "Apparel / Jacket", keys: ["jacket", "hoodie", "cap", "hat", "umbrella", "payong", "sweater"] }
  ];

  let itemType = "";
  for (const item of itemTypes) {
    if (item.keys.some(k => text.includes(k))) {
      itemType = item.type;
      break;
    }
  }

  const colors = ["black", "white", "blue", "red", "green", "brown", "pink", "purple", "gray", "silver", "gold", "yellow", "orange", "beige", "navy", "mint"];
  const foundColors = colors.filter(c => text.includes(c)).map(c => c.charAt(0).toUpperCase() + c.slice(1));

  const brands = ["apple", "samsung", "jansport", "hydroflask", "aquaflask", "nike", "adidas", "bellroy", "sony", "stanley", "casio", "asus", "lenovo", "dell", "acer", "hp"];
  let foundBrand = "";
  for (const b of brands) {
    if (text.includes(b)) {
      foundBrand = b.charAt(0).toUpperCase() + b.slice(1);
      break;
    }
  }

  const accessories: string[] = [];
  if (text.includes("keychain") || text.includes("key ring")) accessories.push("Keychain");
  if (text.includes("sticker") || text.includes("stickers")) accessories.push("Sticker(s)");
  if (text.includes("strap")) accessories.push("Shoulder Strap");
  if (text.includes("case") || text.includes("cover")) accessories.push("Protective Case");
  if (text.includes("lanyard")) accessories.push("Lanyard attached");
  if (text.includes("scratch") || text.includes("dent") || text.includes("initials")) accessories.push("Distinguishing mark / wear");

  return {
    itemType: itemType || "Unspecified Item",
    color: foundColors.length > 0 ? foundColors.join(", ") : "Not specified",
    brand: foundBrand || "Unbranded / Unknown",
    accessories: accessories.length > 0 ? accessories.join(", ") : "None mentioned",
    distinguishingFeatures: text.length > 20 ? description : "Standard item",
    locationHint: "Guidance Office Custody",
    confidence: "High (Lexical Preprocessed)",
    tags: [itemType, ...(foundColors), foundBrand, ...accessories].filter(Boolean)
  };
}

// Sensitive Details Scanner (prevents serial numbers/passcodes from being published in public description)
function checkSensitiveDetails(text: string) {
  const flags = [];
  const lower = text.toLowerCase();
  
  if (/\d{6,}/.test(text)) {
    flags.push("Contains 6 or more consecutive digits (possible ID/serial number).");
  }
  const words = text.split(/\s+/);
  for (const word of words) {
    if (word.length >= 8 && /[a-zA-Z]/.test(word) && /\d/.test(word)) {
      flags.push(`Contains long alphanumeric token: ${word} (possible serial/IMEI).`);
      break;
    }
  }

  const keywords = ['serial', 'imei', 'passcode', 'pin', 'id number', 'student no', 'password', 'license no'];
  for (const kw of keywords) {
    if (lower.includes(kw)) {
      flags.push(`Contains private verification keyword: '${kw}'.`);
    }
  }
  return flags;
}

// -------------------------------------------------------------
// Authentication & Role-Based Access Control (RBAC)
// -------------------------------------------------------------
export type UserRole = 
  | "student"           // Student seeking lost property / submitting claims
  | "guidance_encoder"  // Guidance personnel: records items, processes claims, approves publication, releases
  | "system_admin"      // Technical administration & full oversight
  | "claimant";         // Backward-compatible alias for student

const generateToken = (userId: string, role: string) => {
  return jwt.sign({ userId, role }, JWT_SECRET, { expiresIn: '7d' });
};

// Middleware: Authenticate JWT
const authenticate = (req: any, res: any, next: any) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: "Unauthorized: Missing authentication token" });
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
};

// Middleware: Role-based access control enforcement
const requireRoles = (...allowedRoles: UserRole[]) => {
  return (req: any, res: any, next: any) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        error: `Forbidden: role '${req.user?.role}' does not have permission. Allowed: [${allowedRoles.join(', ')}]` 
      });
    }
    next();
  };
};

// -------------------------------------------------------------
// Health Check
// -------------------------------------------------------------
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// -------------------------------------------------------------
// Auth Routes
// -------------------------------------------------------------

// Student Self-Registration
app.post("/api/auth/register", async (req, res) => {
  try {
    const { fullName, email, schoolId, phone, password } = req.body;
    
    if (!fullName || !email || !password) {
      return res.status(400).json({ error: "Full name, school email, and password are required" });
    }

    if (!schoolId && !email.includes("@")) {
      return res.status(400).json({ error: "A valid student ID number or school email is required to register" });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: "An account with this email already exists" });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    
    // Server-side enforcement: Public registration strictly creates "student" role
    const user = await prisma.user.create({
      data: {
        role: "student",
        userType: "student",
        schoolId: schoolId || null,
        fullName,
        email,
        phone,
        passwordHash,
      }
    });

    const token = generateToken(user.id, user.role);
    res.json({ 
      token, 
      user: { 
        id: user.id, 
        fullName: user.fullName, 
        role: user.role, 
        userType: user.userType, 
        schoolId: user.schoolId, 
        email: user.email 
      } 
    });
  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({ error: "Failed to register account" });
  }
});

// Login for all roles
app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const token = generateToken(user.id, user.role);
    res.json({ 
      token, 
      user: { 
        id: user.id, 
        fullName: user.fullName, 
        role: user.role, 
        userType: user.userType, 
        schoolId: user.schoolId, 
        email: user.email 
      } 
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Failed to login" });
  }
});

// Current User Profile
app.get("/api/auth/me", authenticate, async (req: any, res: any) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user.userId } });
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json({ 
      user: { 
        id: user.id, 
        fullName: user.fullName, 
        role: user.role, 
        userType: user.userType, 
        schoolId: user.schoolId, 
        email: user.email 
      } 
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch user profile" });
  }
});

// Configurable school holding period (in days, default 60 days)
let globalSchoolHoldingDays = 60;

// Helper to compute School Holding Clocks and Statutory 6-Month Period
function calculateHoldingClocks(post: any, intakeMeta: any) {
  const receivedAtDate = post.received_at ? new Date(post.received_at) : (post.dateFound ? new Date(post.dateFound) : (post.createdAt ? new Date(post.createdAt) : new Date()));
  const schoolHoldingPeriodDays = Number(intakeMeta?.schoolHoldingPeriodDays) || globalSchoolHoldingDays;
  
  // School holding deadline = received_at + schoolHoldingPeriodDays
  const schoolHoldingDeadline = post.school_holding_end_date ? new Date(post.school_holding_end_date) : new Date(receivedAtDate.getTime() + schoolHoldingPeriodDays * 24 * 60 * 60 * 1000);
  const now = new Date();
  
  const msPerDay = 1000 * 60 * 60 * 24;
  const schoolDaysElapsed = Math.max(0, Math.floor((now.getTime() - receivedAtDate.getTime()) / msPerDay));
  const schoolDaysRemaining = Math.max(0, Math.ceil((schoolHoldingDeadline.getTime() - now.getTime()) / msPerDay));
  const isSchoolHoldingLapsed = now.getTime() >= schoolHoldingDeadline.getTime();

  // Statutory period: earliest_award_date = city_publication_date + 6 months
  let cityPublicationDate: string | null = null;
  let earliestAwardDate: Date | null = null;
  let isStatutoryPeriodElapsed = false;
  let statutoryDaysRemaining = 180;
  let statutoryDaysElapsed = 0;

  if (post.city_publication_date || post.status === "published" || post.reviewedAt || post.status === "claim_pending" || post.status === "released" || post.status === "donated" || post.status === "disposed" || post.status === "turned_over") {
    const pubDate = post.city_publication_date ? new Date(post.city_publication_date) : (post.reviewedAt ? new Date(post.reviewedAt) : (post.createdAt ? new Date(post.createdAt) : receivedAtDate));
    cityPublicationDate = pubDate.toISOString();
    
    // Add 6 calendar months
    earliestAwardDate = post.earliest_award_date ? new Date(post.earliest_award_date) : new Date(pubDate);
    if (!post.earliest_award_date) {
      earliestAwardDate.setMonth(earliestAwardDate.getMonth() + 6);
    }
    
    statutoryDaysElapsed = Math.max(0, Math.floor((now.getTime() - pubDate.getTime()) / msPerDay));
    statutoryDaysRemaining = Math.max(0, Math.ceil((earliestAwardDate.getTime() - now.getTime()) / msPerDay));
    isStatutoryPeriodElapsed = now.getTime() >= earliestAwardDate.getTime();
  }

  let holdingStatus: "within_school_period" | "school_period_lapsed" | "statutory_award_eligible" = "within_school_period";
  if (isStatutoryPeriodElapsed) {
    holdingStatus = "statutory_award_eligible";
  } else if (isSchoolHoldingLapsed) {
    holdingStatus = "school_period_lapsed";
  }

  return {
    receivedAt: receivedAtDate.toISOString(),
    schoolHoldingPeriodDays,
    schoolHoldingDeadline: schoolHoldingDeadline.toISOString(),
    isSchoolHoldingLapsed,
    schoolDaysRemaining,
    schoolDaysElapsed,
    cityPublicationDate: cityPublicationDate || undefined,
    earliestAwardDate: earliestAwardDate ? earliestAwardDate.toISOString() : undefined,
    isStatutoryPeriodElapsed,
    statutoryDaysRemaining,
    statutoryDaysElapsed,
    holdingStatus
  };
}

// Helper to unpack structured intake metadata from privateDetails and new fields
function formatPostWithIntake(post: any) {
  let intakeMeta: any = {};
  if (post.privateDetails?.details) {
    try {
      intakeMeta = JSON.parse(post.privateDetails.details);
    } catch {
      intakeMeta = { privateVerificationDetails: post.privateDetails.details };
    }
  }

  const holdingClocks = calculateHoldingClocks(post, intakeMeta);

  const controlNo = post.control_no || post.controlNo || intakeMeta.controlNo || `CTRL-${post.id ? post.id.slice(0, 8).toUpperCase() : '2026'}`;
  const receivedAt = post.received_at ? new Date(post.received_at).toISOString() : (post.dateFound ? new Date(post.dateFound).toISOString() : (post.createdAt ? new Date(post.createdAt).toISOString() : new Date().toISOString()));
  const specialHandling = post.special_handling_type || intakeMeta.specialHandlingType || "Standard";
  const storageLoc = post.storage_location || intakeMeta.storageLocation || "Guidance Custody";
  const schoolHoldingEnd = post.school_holding_end_date ? new Date(post.school_holding_end_date).toISOString() : holdingClocks.schoolHoldingDeadline;
  const cityPubDate = post.city_publication_date ? new Date(post.city_publication_date).toISOString() : holdingClocks.cityPublicationDate;
  const earliestAward = post.earliest_award_date ? new Date(post.earliest_award_date).toISOString() : holdingClocks.earliestAwardDate;
  const finalDisp = post.final_disposition || intakeMeta.targetDisposition || null;

  return {
    ...post,
    title: post.publicDescription?.slice(0, 50) || `${post.color || ''} ${post.category || 'Found Item'}`,
    description: post.publicDescription,
    locationFound: post.areaFound,
    condition: intakeMeta.condition || "Good",
    estimatedValueBand: intakeMeta.estimatedValueBand || "Medium (₱500 - ₱2,000)",
    specialHandlingType: specialHandling,
    special_handling_type: specialHandling,
    storageLocation: storageLoc,
    storage_location: storageLoc,
    
    // New high-priority database schema fields (dual compatibility)
    control_no: controlNo,
    controlNo: controlNo,
    received_at: receivedAt,
    receivedAt: receivedAt,
    received_by: post.received_by || post.encoderId,
    receivedBy: post.received_by || post.encoderId,
    finder_id: post.finder_id || (post.finder ? post.finder.id : null),
    finderId: post.finder_id || (post.finder ? post.finder.id : null),
    school_holding_end_date: schoolHoldingEnd,
    schoolHoldingEndDate: schoolHoldingEnd,
    city_publication_date: cityPubDate,
    cityPublicationDate: cityPubDate,
    earliest_award_date: earliestAward,
    earliestAwardDate: earliestAward,
    final_disposition: finalDisp,
    finalDisposition: finalDisp,

    // Finder details
    finderName: post.finder?.name || intakeMeta.finderName || post.encoder?.fullName || "Turned in to Guidance Office",
    finderContact: post.finder?.contactNumber || intakeMeta.finderContact || "Recorded at Desk",
    finderType: post.finder?.type || intakeMeta.finderType || "Surrendered by Citizen",
    finderNotes: post.finder?.notes || intakeMeta.finderNotes || "",
    privateVerificationNotes: intakeMeta.privateVerificationDetails || (typeof post.privateDetails?.details === "string" ? post.privateDetails.details : ""),
    holdingClocks,
    dispositionCase: post.dispositionCase || intakeMeta.dispositionCase || null
  };
}

// -------------------------------------------------------------
// Item Intake & Management Routes (Guidance Personnel / Staff Only)
// -------------------------------------------------------------

// Record a Surrendered Found Item via Staff Intake Form (Initial Status: received)
const handleItemIntake = async (req: any, res: any) => {
  try {
    const { 
      category, 
      color, 
      publicDescription, 
      description,
      dateFound, 
      areaFound, 
      locationFound,
      condition,
      estimatedValueBand,
      specialHandlingType,
      storageLocation,
      finderName,
      finderContact,
      finderType,
      finderNotes,
      control_no,
      controlNo,
      received_at,
      receivedAt,
      privateDetails, 
      imageUrl 
    } = req.body;
    
    const resolvedDescription = publicDescription || description;
    const resolvedArea = areaFound || locationFound;

    if (!category || !resolvedDescription || !resolvedArea) {
      return res.status(400).json({ error: "Category, description, and location found are required for intake" });
    }

    // 1. If finder details provided, securely store in finders table
    let finderId: string | null = null;
    if (finderName) {
      const createdFinder = await prisma.finder.create({
        data: {
          name: finderName,
          type: finderType || "visitor",
          contactNumber: finderContact || null,
          notes: finderNotes || null
        }
      });
      finderId = createdFinder.id;
    }

    const generatedControlNo = control_no || controlNo || `CTRL-${new Date().getFullYear()}-${String(Math.floor(1000 + Math.random() * 9000))}`;
    const receivedAtDate = received_at || receivedAt ? new Date(received_at || receivedAt) : (dateFound ? new Date(dateFound) : new Date());
    const schoolHoldingEndDate = new Date(receivedAtDate.getTime() + globalSchoolHoldingDays * 86400000);

    // Package extended intake attributes into privateDetails record
    const intakeMetadata = {
      condition: condition || "Good",
      estimatedValueBand: estimatedValueBand || "Medium (₱500 - ₱2,000)",
      specialHandlingType: specialHandlingType || "Standard",
      storageLocation: storageLocation || "Guidance Custody",
      finderName: finderName || "Anonymous Finder",
      finderContact: finderContact || "Not provided",
      finderType: finderType || "Visitor",
      finderNotes: finderNotes || "",
      controlNo: generatedControlNo,
      privateVerificationDetails: privateDetails || "None provided"
    };

    // Strict Status Model: Newly recorded intake items start as "received"
    const item = await prisma.item.create({
      data: {
        control_no: generatedControlNo,
        received_at: receivedAtDate,
        received_by: req.user.userId,
        finder_id: finderId,
        special_handling_type: specialHandlingType || "Standard",
        storage_location: storageLocation || "Guidance Custody",
        school_holding_end_date: schoolHoldingEndDate,
        encoderId: req.user.userId,
        category,
        color: color || "Unspecified",
        publicDescription: resolvedDescription,
        dateFound: dateFound ? new Date(dateFound) : new Date(),
        areaFound: resolvedArea,
        imageUrl,
        status: "received", // Strict flow: received -> verified -> published -> claim_pending -> released
        privateDetails: {
          create: {
            details: JSON.stringify(intakeMetadata)
          }
        }
      },
      include: { privateDetails: true, encoder: { select: { fullName: true, email: true } }, finder: true }
    });

    // Audit status history: Initial status logged
    await prisma.itemStatusHistory.create({
      data: {
        itemId: item.id,
        fromStatus: null,
        toStatus: "received",
        changedBy: req.user.userId,
        reason: "Item surrendered to Guidance Office and intake logged"
      }
    });

    // Run Rule-Based Sensitive Flags Check on public description
    const sensitiveFlags = checkSensitiveDetails(resolvedDescription);
    for (const detail of sensitiveFlags) {
      await prisma.itemFlag.create({
        data: {
          itemId: item.id,
          type: "sensitive",
          detail
        }
      });
    }

    res.json({ 
      success: true, 
      post: formatPostWithIntake(item), 
      item: formatPostWithIntake(item),
      flagsTriggered: sensitiveFlags.length 
    });
  } catch (error) {
    console.error("Create intake item error:", error);
    res.status(500).json({ error: "Failed to record item intake" });
  }
};

app.post("/api/posts", authenticate, requireRoles("guidance_encoder", "system_admin", "staff" as any, "admin" as any), handleItemIntake);
app.post("/api/items", authenticate, requireRoles("guidance_encoder", "system_admin", "staff" as any, "admin" as any), handleItemIntake);

// Edit Item Details (Staff Only)
const handleItemUpdate = async (req: any, res: any) => {
  const { id } = req.params;
  const { 
    category, 
    color, 
    publicDescription, 
    description,
    areaFound, 
    locationFound,
    dateFound, 
    condition,
    estimatedValueBand,
    specialHandlingType,
    storageLocation,
    finderName,
    finderContact,
    finderType,
    finderNotes,
    privateDetails, 
    imageUrl 
  } = req.body;

  try {
    const existing = await prisma.item.findUnique({ where: { id }, include: { privateDetails: true, finder: true } });
    if (!existing) return res.status(404).json({ error: "Item not found" });

    let existingMeta: any = {};
    if (existing.privateDetails?.details) {
      try { existingMeta = JSON.parse(existing.privateDetails.details); } catch { /* ignore */ }
    }

    // Update finder record if linked
    if (existing.finder_id && (finderName || finderContact || finderType || finderNotes !== undefined)) {
      await prisma.finder.update({
        where: { id: existing.finder_id },
        data: {
          name: finderName || undefined,
          contactNumber: finderContact !== undefined ? finderContact : undefined,
          type: finderType || undefined,
          notes: finderNotes !== undefined ? finderNotes : undefined
        }
      });
    }

    const updatedMeta = {
      ...existingMeta,
      condition: condition || existingMeta.condition,
      estimatedValueBand: estimatedValueBand || existingMeta.estimatedValueBand,
      specialHandlingType: specialHandlingType || existingMeta.specialHandlingType,
      storageLocation: storageLocation || existingMeta.storageLocation,
      finderName: finderName || existingMeta.finderName,
      finderContact: finderContact || existingMeta.finderContact,
      finderType: finderType || existingMeta.finderType,
      finderNotes: finderNotes !== undefined ? finderNotes : existingMeta.finderNotes,
      privateVerificationDetails: privateDetails !== undefined ? privateDetails : existingMeta.privateVerificationDetails
    };

    const updatedItem = await prisma.item.update({
      where: { id },
      data: {
        category,
        color,
        publicDescription: publicDescription || description,
        areaFound: areaFound || locationFound,
        imageUrl,
        dateFound: dateFound ? new Date(dateFound) : undefined,
        special_handling_type: specialHandlingType || undefined,
        storage_location: storageLocation || undefined
      },
      include: { privateDetails: true, encoder: { select: { fullName: true } }, finder: true }
    });

    await prisma.itemPrivateDetail.upsert({
      where: { itemId: id },
      update: { details: JSON.stringify(updatedMeta) },
      create: { itemId: id, details: JSON.stringify(updatedMeta) }
    });

    res.json({ success: true, post: formatPostWithIntake(updatedItem), item: formatPostWithIntake(updatedItem) });
  } catch (error) {
    console.error("Update item error:", error);
    res.status(500).json({ error: "Failed to update item" });
  }
};

app.put("/api/posts/:id", authenticate, requireRoles("guidance_encoder", "system_admin", "staff" as any, "admin" as any), handleItemUpdate);
app.put("/api/items/:id", authenticate, requireRoles("guidance_encoder", "system_admin", "staff" as any, "admin" as any), handleItemUpdate);

// Verification Step: received -> verified
const handleItemVerify = async (req: any, res: any) => {
  const { id } = req.params;
  const { note } = req.body;

  try {
    const item = await prisma.item.findUnique({ where: { id } });
    if (!item) return res.status(404).json({ error: "Item not found" });

    const updated = await prisma.item.update({
      where: { id },
      data: {
        status: "verified",
        reviewedBy: req.user.userId,
        reviewedAt: new Date()
      },
      include: { privateDetails: true, encoder: { select: { fullName: true } }, finder: true }
    });

    await prisma.reviewAction.create({
      data: {
        itemId: id,
        adminId: req.user.userId,
        action: "verify",
        note: note || "Physical item verified by Guidance Officer"
      }
    });

    // Record audit status history
    await prisma.itemStatusHistory.create({
      data: {
        itemId: id,
        fromStatus: item.status,
        toStatus: "verified",
        changedBy: req.user.userId,
        reason: note || "Physical item verified by Guidance Officer"
      }
    });

    res.json({ success: true, post: formatPostWithIntake(updated), item: formatPostWithIntake(updated) });
  } catch (error) {
    console.error("Verify item error:", error);
    res.status(500).json({ error: "Failed to verify item" });
  }
};

app.post("/api/admin/posts/:id/verify", authenticate, requireRoles("guidance_encoder", "system_admin", "staff" as any, "admin" as any), handleItemVerify);
app.post("/api/admin/items/:id/verify", authenticate, requireRoles("guidance_encoder", "system_admin", "staff" as any, "admin" as any), handleItemVerify);

// Publication Step: verified -> published (or direct approve)
const handleItemPublish = async (req: any, res: any) => {
  const { id } = req.params;
  const { note } = req.body;

  try {
    const pubDate = new Date();
    const awardDate = new Date(pubDate);
    awardDate.setMonth(awardDate.getMonth() + 6);

    const updated = await prisma.item.update({
      where: { id },
      data: {
        status: "published",
        reviewedBy: req.user.userId,
        reviewedAt: pubDate,
        city_publication_date: pubDate,
        earliest_award_date: awardDate
      },
      include: { privateDetails: true, encoder: { select: { fullName: true } }, finder: true }
    });

    await prisma.reviewAction.create({
      data: {
        itemId: id,
        adminId: req.user.userId,
        action: "publish",
        note: note || "Item approved and published to student feed"
      }
    });

    // Record audit status history
    await prisma.itemStatusHistory.create({
      data: {
        itemId: id,
        fromStatus: "verified",
        toStatus: "published",
        changedBy: req.user.userId,
        reason: note || "Item approved and published to student feed"
      }
    });

    res.json({ success: true, post: formatPostWithIntake(updated), item: formatPostWithIntake(updated) });
  } catch (error) {
    console.error("Publish item error:", error);
    res.status(500).json({ error: "Failed to publish item" });
  }
};

app.post("/api/admin/posts/:id/publish", authenticate, requireRoles("guidance_encoder", "system_admin", "staff" as any, "admin" as any), handleItemPublish);
app.post("/api/admin/items/:id/publish", authenticate, requireRoles("guidance_encoder", "system_admin", "staff" as any, "admin" as any), handleItemPublish);

// Review Queue: Items in received, verified, or pending_review
const handleReviewQueue = async (req: any, res: any) => {
  try {
    const queue = await prisma.item.findMany({
      where: { 
        status: { in: ["received", "verified", "pending_review"] } 
      },
      include: { 
        privateDetails: true, 
        flags: true, 
        encoder: { select: { fullName: true, email: true } },
        finder: true 
      },
      orderBy: { createdAt: "desc" }
    });
    res.json(queue.map(formatPostWithIntake));
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch review queue" });
  }
};

app.get("/api/admin/review-queue", authenticate, requireRoles("guidance_encoder", "system_admin", "staff" as any, "admin" as any), handleReviewQueue);
app.get("/api/admin/items/review-queue", authenticate, requireRoles("guidance_encoder", "system_admin", "staff" as any, "admin" as any), handleReviewQueue);

// Active Guidance Inventory
const handleInventory = async (req: any, res: any) => {
  try {
    const inventory = await prisma.item.findMany({
      include: { 
        privateDetails: true, 
        flags: true, 
        encoder: { select: { fullName: true } }, 
        claims: true,
        finder: true,
        dispositionCase: true 
      },
      orderBy: { createdAt: "desc" }
    });
    res.json(inventory.map(formatPostWithIntake));
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch inventory" });
  }
};

app.get("/api/admin/inventory", authenticate, requireRoles("guidance_encoder", "system_admin", "staff" as any, "admin" as any), handleInventory);
app.get("/api/admin/items/inventory", authenticate, requireRoles("guidance_encoder", "system_admin", "staff" as any, "admin" as any), handleInventory);

// Publication Approval: Approve (published) / Reject
const handleItemReview = async (req: any, res: any) => {
  const { id } = req.params;
  const { action, note } = req.body; // "approve" | "publish" | "reject"

  try {
    const newStatus = (action === "approve" || action === "publish") 
      ? "published" 
      : action === "reject" 
      ? "rejected" 
      : null;
      
    if (!newStatus) return res.status(400).json({ error: "Invalid action. Must be 'approve', 'publish', or 'reject'" });

    const existing = await prisma.item.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: "Item not found" });

    const pubDate = new Date();
    const awardDate = new Date(pubDate);
    awardDate.setMonth(awardDate.getMonth() + 6);

    const item = await prisma.item.update({
      where: { id },
      data: {
        status: newStatus,
        reviewedBy: req.user.userId,
        reviewedAt: pubDate,
        city_publication_date: newStatus === "published" ? pubDate : undefined,
        earliest_award_date: newStatus === "published" ? awardDate : undefined
      },
      include: { privateDetails: true, encoder: { select: { fullName: true } }, finder: true }
    });

    await prisma.reviewAction.create({
      data: {
        itemId: id,
        adminId: req.user.userId,
        action,
        note: note || `Publication ${action}d by Guidance Staff`
      }
    });

    await prisma.itemStatusHistory.create({
      data: {
        itemId: id,
        fromStatus: existing.status,
        toStatus: newStatus,
        changedBy: req.user.userId,
        reason: note || `Publication ${action}d by Guidance Staff`
      }
    });

    res.json({ success: true, post: formatPostWithIntake(item), item: formatPostWithIntake(item) });
  } catch (error) {
    console.error("Review item error:", error);
    res.status(500).json({ error: "Failed to review item" });
  }
};

app.post("/api/admin/posts/:id/review", authenticate, requireRoles("guidance_encoder", "system_admin", "staff" as any, "admin" as any), handleItemReview);
app.post("/api/admin/items/:id/review", authenticate, requireRoles("guidance_encoder", "system_admin", "staff" as any, "admin" as any), handleItemReview);

// -------------------------------------------------------------
// Holding Period & Unclaimed Item Disposition Workflow
// -------------------------------------------------------------

// Get Holding Period Configuration
app.get("/api/admin/holding-config", authenticate, requireRoles("guidance_encoder", "system_admin", "staff" as any, "admin" as any), async (_req: any, res: any) => {
  res.json({
    schoolHoldingDays: globalSchoolHoldingDays,
    statutoryMonths: 6,
    description: "School holding period tracks time from received_at. Statutory period tracks earliest finder award / civic turnover (city_publication_date + 6 months)."
  });
});

// Update Configurable School Holding Period
app.put("/api/admin/holding-config", authenticate, requireRoles("guidance_encoder", "system_admin", "admin" as any), async (req: any, res: any) => {
  const { schoolHoldingDays } = req.body;
  if (!schoolHoldingDays || isNaN(Number(schoolHoldingDays)) || Number(schoolHoldingDays) <= 0) {
    return res.status(400).json({ error: "schoolHoldingDays must be a positive integer." });
  }
  globalSchoolHoldingDays = Number(schoolHoldingDays);
  res.json({ 
    success: true, 
    schoolHoldingDays: globalSchoolHoldingDays,
    message: `School holding period updated to ${globalSchoolHoldingDays} days.`
  });
});

// Create or Fetch a Disposition Case when holding period lapses
const handleCreateDispositionCase = async (req: any, res: any) => {
  const { id } = req.params;
  const { targetDisposition, forceOverrideHoldingCheck } = req.body;

  try {
    const item = await prisma.item.findUnique({
      where: { id },
      include: { privateDetails: true, encoder: { select: { fullName: true } }, finder: true, dispositionCase: true }
    });
    if (!item) return res.status(404).json({ error: "Item not found" });

    // Guardrail: item cannot be in claim_pending or released
    if (item.status === "claim_pending") {
      return res.status(400).json({ error: "Cannot create disposition case: Item currently has an active pending claim." });
    }
    if (item.status === "released") {
      return res.status(400).json({ error: "Cannot create disposition case: Item was already claimed and released to its owner." });
    }

    let intakeMeta: any = {};
    if (item.privateDetails?.details) {
      try { intakeMeta = JSON.parse(item.privateDetails.details); } catch {}
    }

    const clocks = calculateHoldingClocks(item, intakeMeta);

    // If case already exists in DB or metadata, return it
    if (item.dispositionCase || intakeMeta.dispositionCase) {
      const activeCase = item.dispositionCase ? {
        caseId: `DISP-${item.id.slice(0, 6).toUpperCase()}`,
        postId: item.id,
        itemId: item.id,
        targetDisposition: item.dispositionCase.targetDisposition,
        status: item.dispositionCase.status,
        checklistCompleted: item.dispositionCase.checklistCompleted,
        checklist: JSON.parse(item.dispositionCase.checklist || "{}"),
        holdingClockSnapshot: clocks,
        approval: {
          approved: item.dispositionCase.status === "approved" || item.dispositionCase.status === "executed",
          approvedBy: item.dispositionCase.approvedBy,
          approvedAt: item.dispositionCase.approvedAt?.toISOString(),
          officialRemarks: item.dispositionCase.approvalNotes
        },
        execution: item.dispositionCase.executedAt ? {
          executed: true,
          executedBy: item.dispositionCase.executedBy,
          executedAt: item.dispositionCase.executedAt.toISOString(),
          manifestNumber: item.dispositionCase.manifestNumber,
          recipientOrg: item.dispositionCase.recipientOrg,
          dispositionRemarks: item.dispositionCase.disposalMethod
        } : null
      } : intakeMeta.dispositionCase;

      return res.json({ 
        success: true, 
        dispositionCase: activeCase, 
        holdingClocks: clocks 
      });
    }

    // Notice if holding period has not yet lapsed
    if (!clocks.isSchoolHoldingLapsed && !forceOverrideHoldingCheck) {
      return res.status(400).json({ 
        error: `School holding period has not yet lapsed. ${clocks.schoolDaysRemaining} day(s) remaining until holding period expires on ${new Date(clocks.schoolHoldingDeadline).toLocaleDateString()}.`,
        holdingClocks: clocks
      });
    }

    const caseId = `DISP-${new Date().getFullYear()}-${item.id.slice(0, 6).toUpperCase()}`;
    const initialChecklist = {
      physical_inventory_audit: false,
      claim_absence_certified: false,
      notice_posted: false,
      recipient_identified: false,
      property_affidavit_attached: false
    };

    const newCase = {
      caseId,
      postId: item.id,
      itemId: item.id,
      itemTitle: item.publicDescription?.slice(0, 50) || `${item.color} ${item.category}`,
      targetDisposition: targetDisposition || "donated",
      status: "pending_documentation",
      createdAt: new Date().toISOString(),
      initiatedBy: req.user.fullName || "Guidance Personnel",
      holdingClockSnapshot: clocks,
      checklist: initialChecklist,
      checklistCompleted: false,
      approval: {
        approved: false,
        approvedBy: null,
        approverRole: null,
        approvedAt: null,
        officialRemarks: null
      },
      execution: null
    };

    // Persist in disposition_cases table
    await prisma.dispositionCase.upsert({
      where: { itemId: item.id },
      create: {
        itemId: item.id,
        targetDisposition: targetDisposition || "donated",
        status: "draft",
        checklistCompleted: false,
        checklist: JSON.stringify(initialChecklist),
        holdingClockSnapshot: JSON.stringify(clocks)
      },
      update: {
        holdingClockSnapshot: JSON.stringify(clocks),
        targetDisposition: targetDisposition || "donated"
      }
    });

    intakeMeta.dispositionCase = newCase;

    await prisma.itemPrivateDetail.upsert({
      where: { itemId: item.id },
      update: { details: JSON.stringify(intakeMeta) },
      create: { itemId: item.id, details: JSON.stringify(intakeMeta) }
    });

    res.json({ success: true, dispositionCase: newCase, holdingClocks: clocks });
  } catch (error) {
    console.error("Create disposition case error:", error);
    res.status(500).json({ error: "Failed to create disposition case" });
  }
};

app.post("/api/admin/posts/:id/disposition-case", authenticate, requireRoles("guidance_encoder", "system_admin", "staff" as any, "admin" as any), handleCreateDispositionCase);
app.post("/api/admin/items/:id/disposition-case", authenticate, requireRoles("guidance_encoder", "system_admin", "staff" as any, "admin" as any), handleCreateDispositionCase);

// Update Document Checklist for Disposition Case
const handleUpdateChecklist = async (req: any, res: any) => {
  const { id } = req.params;
  const { checklist, targetDisposition, checklistNotes } = req.body;

  try {
    const item = await prisma.item.findUnique({
      where: { id },
      include: { privateDetails: true, dispositionCase: true }
    });
    if (!item) return res.status(404).json({ error: "Item not found" });

    let intakeMeta: any = {};
    if (item.privateDetails?.details) {
      try { intakeMeta = JSON.parse(item.privateDetails.details); } catch {}
    }

    if (!intakeMeta.dispositionCase && !item.dispositionCase) {
      return res.status(404).json({ error: "No disposition case found for this item. Initiate a case first." });
    }

    const currentCase = intakeMeta.dispositionCase || {
      caseId: `DISP-${item.id.slice(0, 6).toUpperCase()}`,
      postId: item.id,
      itemId: item.id,
      targetDisposition: item.dispositionCase?.targetDisposition || "donated",
      status: item.dispositionCase?.status || "pending_documentation",
      checklistCompleted: item.dispositionCase?.checklistCompleted || false,
      checklist: JSON.parse(item.dispositionCase?.checklist || "{}")
    };

    if (currentCase.status === "executed") {
      return res.status(400).json({ error: "Disposition case has already been executed." });
    }

    // Merge checklist items
    const updatedChecklist = {
      ...currentCase.checklist,
      ...(checklist || {})
    };

    // Evaluate completeness of all 5 mandatory checklist items
    const isComplete = Boolean(
      updatedChecklist.physical_inventory_audit &&
      updatedChecklist.claim_absence_certified &&
      updatedChecklist.notice_posted &&
      updatedChecklist.recipient_identified &&
      updatedChecklist.property_affidavit_attached
    );

    currentCase.checklist = updatedChecklist;
    currentCase.checklistCompleted = isComplete;
    if (checklistNotes) currentCase.checklistNotes = checklistNotes;
    if (targetDisposition) currentCase.targetDisposition = targetDisposition;

    // Status transitions
    if (isComplete && !currentCase.approval?.approved) {
      currentCase.status = "pending_approval";
    } else if (!isComplete && !currentCase.approval?.approved) {
      currentCase.status = "pending_documentation";
    }

    // Update DB record
    await prisma.dispositionCase.upsert({
      where: { itemId: item.id },
      create: {
        itemId: item.id,
        targetDisposition: targetDisposition || currentCase.targetDisposition || "donated",
        status: isComplete ? "pending_approval" : "draft",
        checklistCompleted: isComplete,
        checklist: JSON.stringify(updatedChecklist)
      },
      update: {
        checklist: JSON.stringify(updatedChecklist),
        checklistCompleted: isComplete,
        status: isComplete ? "pending_approval" : "draft",
        targetDisposition: targetDisposition || currentCase.targetDisposition || undefined
      }
    });

    intakeMeta.dispositionCase = currentCase;

    await prisma.itemPrivateDetail.update({
      where: { itemId: item.id },
      data: { details: JSON.stringify(intakeMeta) }
    });

    res.json({ success: true, dispositionCase: currentCase });
  } catch (error) {
    console.error("Update checklist error:", error);
    res.status(500).json({ error: "Failed to update disposition checklist" });
  }
};

app.put("/api/admin/posts/:id/disposition-case/checklist", authenticate, requireRoles("guidance_encoder", "system_admin", "staff" as any, "admin" as any), handleUpdateChecklist);
app.put("/api/admin/items/:id/disposition-case/checklist", authenticate, requireRoles("guidance_encoder", "system_admin", "staff" as any, "admin" as any), handleUpdateChecklist);

// Authorized Official Sign-Off & Approval
const handleApproveDispositionCase = async (req: any, res: any) => {
  const { id } = req.params;
  const { officialRemarks } = req.body;

  try {
    const item = await prisma.item.findUnique({
      where: { id },
      include: { privateDetails: true, dispositionCase: true }
    });
    if (!item) return res.status(404).json({ error: "Item not found" });

    let intakeMeta: any = {};
    if (item.privateDetails?.details) {
      try { intakeMeta = JSON.parse(item.privateDetails.details); } catch {}
    }

    if (!intakeMeta.dispositionCase && !item.dispositionCase) {
      return res.status(404).json({ error: "No disposition case found for this item." });
    }

    const currentCase = intakeMeta.dispositionCase || {
      caseId: `DISP-${item.id.slice(0, 6).toUpperCase()}`,
      postId: item.id,
      itemId: item.id,
      checklistCompleted: item.dispositionCase?.checklistCompleted
    };

    // Strict Rule: Block approval if checklist is incomplete!
    if (!currentCase.checklistCompleted) {
      return res.status(400).json({ 
        error: "Cannot approve disposition case: Document checklist is incomplete. All 5 mandatory items (physical audit, claim absence, notice posted, recipient identified, property affidavit) must be certified first." 
      });
    }

    // Set official approval
    const staffUser = await prisma.user.findUnique({ where: { id: req.user.userId } });
    const approverName = staffUser?.fullName || "Guidance Head";

    currentCase.approval = {
      approved: true,
      approvedBy: approverName,
      approverRole: staffUser?.role || "Authorized Official",
      approvedAt: new Date().toISOString(),
      officialRemarks: officialRemarks || "Authorized and approved for final property disposition in accordance with school custody policy."
    };
    currentCase.status = "approved";

    // Update disposition_cases table
    await prisma.dispositionCase.update({
      where: { itemId: item.id },
      data: {
        status: "approved",
        approvedBy: req.user.userId,
        approvedAt: new Date(),
        approvalNotes: officialRemarks || "Authorized and approved for final property disposition in accordance with school custody policy."
      }
    });

    intakeMeta.dispositionCase = currentCase;

    await prisma.itemPrivateDetail.update({
      where: { itemId: item.id },
      data: { details: JSON.stringify(intakeMeta) }
    });

    await prisma.reviewAction.create({
      data: {
        itemId: item.id,
        adminId: req.user.userId,
        action: "disposition_approved",
        note: `Disposition Case #${currentCase.caseId} approved by ${approverName}: ${officialRemarks || 'All checklist requirements satisfied.'}`
      }
    });

    res.json({ success: true, dispositionCase: currentCase });
  } catch (error) {
    console.error("Approve disposition error:", error);
    res.status(500).json({ error: "Failed to approve disposition case" });
  }
};

app.post("/api/admin/posts/:id/disposition-case/approve", authenticate, requireRoles("guidance_encoder", "system_admin", "admin" as any), handleApproveDispositionCase);
app.post("/api/admin/items/:id/disposition-case/approve", authenticate, requireRoles("guidance_encoder", "system_admin", "admin" as any), handleApproveDispositionCase);

// Final Execution: Change item status to donated, disposed, or turned_over
const handleExecuteDisposition = async (req: any, res: any) => {
  const { id } = req.params;
  const { 
    targetDisposition, // "donated" | "disposed" | "turned_over"
    manifestNumber, 
    recipientOrg, 
    dispositionNote 
  } = req.body;

  try {
    const item = await prisma.item.findUnique({
      where: { id },
      include: { privateDetails: true, encoder: { select: { fullName: true } }, dispositionCase: true }
    });
    if (!item) return res.status(404).json({ error: "Item not found" });

    // Item cannot be released or claim_pending
    if (item.status === "claim_pending") {
      return res.status(400).json({ error: "Disposition blocked: Item has an active claim pending." });
    }
    if (item.status === "released") {
      return res.status(400).json({ error: "Disposition blocked: Item has already been released to its recipient." });
    }

    let intakeMeta: any = {};
    if (item.privateDetails?.details) {
      try { intakeMeta = JSON.parse(item.privateDetails.details); } catch {}
    }

    const currentCase = intakeMeta.dispositionCase || (item.dispositionCase ? {
      caseId: `DISP-${item.id.slice(0, 6).toUpperCase()}`,
      postId: item.id,
      itemId: item.id,
      checklistCompleted: item.dispositionCase.checklistCompleted,
      approval: { approved: item.dispositionCase.status === "approved" || Boolean(item.dispositionCase.approvedAt) }
    } : null);

    // 1. Check case existence
    if (!currentCase) {
      return res.status(400).json({ 
        error: "Disposition blocked: No disposition case exists for this item. A disposition case must be initiated after the holding period lapses." 
      });
    }

    // 2. Check checklist completeness
    if (!currentCase.checklistCompleted) {
      return res.status(400).json({ 
        error: `Disposition blocked: Document checklist is incomplete on Case #${currentCase.caseId}. All 5 required documents must be certified before final disposition.` 
      });
    }

    // 3. Check authorized official approval
    if (!currentCase.approval?.approved) {
      return res.status(403).json({ 
        error: `Disposition blocked: Final status change requires official approval from an authorized Guidance / Administrative official for Case #${currentCase.caseId}.` 
      });
    }

    // Canonical final status: "donated" | "disposed" | "turned_over"
    const finalStatus = targetDisposition || currentCase.targetDisposition || "disposed";
    const staffUser = await prisma.user.findUnique({ where: { id: req.user.userId } });
    const executorName = staffUser?.fullName || "Guidance Personnel";

    // Record execution in case
    currentCase.execution = {
      executed: true,
      executedBy: executorName,
      executedAt: new Date().toISOString(),
      manifestNumber: manifestNumber || `MNF-${new Date().getFullYear()}-${item.id.slice(0, 4).toUpperCase()}`,
      recipientOrg: recipientOrg || "Designated Welfare Outreach / Recycling",
      dispositionRemarks: dispositionNote || "Physical turnover completed following holding period expiration and official approval."
    };
    currentCase.status = "executed";
    intakeMeta.dispositionCase = currentCase;

    // Update item status strictly to terminal disposition status
    const updatedItem = await prisma.item.update({
      where: { id },
      data: {
        status: finalStatus,
        final_disposition: finalStatus,
        dispositionNote: dispositionNote || `Final disposition executed via Case #${currentCase.caseId}: ${finalStatus} to ${recipientOrg || 'Outreach'}`,
        reviewedBy: req.user.userId,
        reviewedAt: new Date()
      },
      include: { privateDetails: true, encoder: { select: { fullName: true } }, finder: true }
    });

    // Update disposition_cases table
    await prisma.dispositionCase.update({
      where: { itemId: item.id },
      data: {
        status: "executed",
        executedBy: req.user.userId,
        executedAt: new Date(),
        manifestNumber: currentCase.execution.manifestNumber,
        recipientOrg: currentCase.execution.recipientOrg,
        disposalMethod: finalStatus
      }
    });

    // Audit status history
    await prisma.itemStatusHistory.create({
      data: {
        itemId: item.id,
        fromStatus: item.status,
        toStatus: finalStatus,
        changedBy: req.user.userId,
        reason: `Final disposition executed: ${finalStatus}`
      }
    });

    // Store scanned disposition manifest document
    await prisma.document.create({
      data: {
        itemId: item.id,
        dispositionCaseId: item.id,
        documentType: "disposition_affidavit",
        fileName: `Disposition_Manifest_${currentCase.execution.manifestNumber}.pdf`,
        fileUrl: `/api/documents/manifest/${item.id}`,
        fileSize: 204800,
        mimeType: "application/pdf",
        uploadedBy: req.user.userId
      }
    });

    await prisma.itemPrivateDetail.update({
      where: { itemId: item.id },
      data: { details: JSON.stringify(intakeMeta) }
    });

    await prisma.reviewAction.create({
      data: {
        itemId: id,
        adminId: req.user.userId,
        action: finalStatus,
        note: `Disposition executed (${finalStatus}). Case #${currentCase.caseId} approved by ${currentCase.approval?.approvedBy || 'Official'}.`
      }
    });

    res.json({ 
      success: true, 
      post: formatPostWithIntake(updatedItem),
      item: formatPostWithIntake(updatedItem),
      dispositionCase: currentCase
    });
  } catch (error) {
    console.error("Execute disposition error:", error);
    res.status(500).json({ error: "Failed to record disposition" });
  }
};

app.post("/api/admin/posts/:id/dispose", authenticate, requireRoles("guidance_encoder", "system_admin", "staff" as any, "admin" as any), handleExecuteDisposition);
app.post("/api/admin/items/:id/dispose", authenticate, requireRoles("guidance_encoder", "system_admin", "staff" as any, "admin" as any), handleExecuteDisposition);

// -------------------------------------------------------------
// Public Feed & Search Routes (Claimants & Guidance Personnel)
// -------------------------------------------------------------

// Get Available Published Items (Public fields ONLY, NEVER private verification details)
const handleAvailableItems = async (_req: any, res: any) => {
  try {
    const items = await prisma.item.findMany({
      where: { status: { in: ["published", "available"] } },
      include: {
        privateDetails: true,
        finder: true
      },
      orderBy: { createdAt: "desc" }
    });
    // Return sanitized public items with condition and storage location
    const sanitized = items.map(post => {
      const formatted = formatPostWithIntake(post);
      return {
        id: formatted.id,
        control_no: formatted.control_no,
        controlNo: formatted.controlNo,
        title: formatted.title,
        category: formatted.category,
        color: formatted.color,
        publicDescription: formatted.publicDescription,
        description: formatted.publicDescription,
        dateFound: formatted.dateFound,
        areaFound: formatted.areaFound,
        locationFound: formatted.areaFound,
        condition: formatted.condition,
        storageLocation: formatted.storageLocation,
        storage_location: formatted.storage_location,
        specialHandlingType: formatted.specialHandlingType,
        special_handling_type: formatted.special_handling_type,
        imageUrl: formatted.imageUrl,
        status: formatted.status,
        createdAt: formatted.createdAt,
        received_at: formatted.received_at,
        receivedAt: formatted.receivedAt
      };
    });
    res.json(sanitized);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch available items" });
  }
};

app.get("/api/posts/available", authenticate, handleAvailableItems);
app.get("/api/items/available", authenticate, handleAvailableItems);

// Search Published Items using Natural Language Matcher
app.post("/api/search", authenticate, async (req: any, res: any) => {
  const { query } = req.body;
  if (!query) return res.status(400).json({ error: "Search query is required" });

  try {
    // 1. Fetch published items from DB (Only public fields)
    const availableItemsRaw = await prisma.item.findMany({
      where: { status: { in: ["published", "available"] } },
      include: {
        privateDetails: true,
        finder: true
      }
    });

    const availablePosts = availableItemsRaw.map(post => {
      const formatted = formatPostWithIntake(post);
      return {
        id: formatted.id,
        control_no: formatted.control_no,
        controlNo: formatted.controlNo,
        title: formatted.title,
        category: formatted.category,
        color: formatted.color,
        publicDescription: formatted.publicDescription,
        description: formatted.publicDescription,
        dateFound: formatted.dateFound,
        areaFound: formatted.areaFound,
        locationFound: formatted.areaFound,
        condition: formatted.condition,
        storageLocation: formatted.storageLocation,
        storage_location: formatted.storage_location,
        imageUrl: formatted.imageUrl,
        status: formatted.status
      };
    });

    // Log the search query
    await prisma.searchLog.create({
      data: {
        userId: req.user.userId,
        queryText: query,
        resultCount: availablePosts.length
      }
    });

    // 2. Query Python TF-IDF Ranking Service
    try {
      const pyResponse = await fetch("http://127.0.0.1:8000/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, availablePosts })
      });
      if (pyResponse.ok) {
        const rankedMatches = await pyResponse.json();
        return res.json(rankedMatches);
      }
    } catch (err) {
      console.warn("Python NLP search server unreachable, using fallback ranker");
    }

    // Fallback simple keyword ranking
    const queryLower = query.toLowerCase();
    const ranked = availablePosts.map(post => {
      const text = `${post.category} ${post.color} ${post.publicDescription} ${post.areaFound} ${post.condition}`.toLowerCase();
      let matchCount = 0;
      queryLower.split(/\s+/).forEach((word: string) => {
        if (word.length > 2 && text.includes(word)) matchCount++;
      });
      return { ...post, score: matchCount };
    }).sort((a, b) => b.score - a.score);

    res.json(ranked);
  } catch (error) {
    console.error("Search error:", error);
    res.status(500).json({ error: "Failed to search items" });
  }
});

// NLP Preprocessing / Attribute Extraction Endpoint
app.post("/api/nlp/extract", authenticate, async (req: any, res: any) => {
  const { description } = req.body;
  if (!description) return res.status(400).json({ error: "Description is required" });

  try {
    const pyResponse = await fetch("http://127.0.0.1:8000/api/extract", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ description })
    });
    if (pyResponse.ok) {
      const pyData = await pyResponse.json();
      return res.json(pyData);
    }
  } catch (e) {
    // fallback
  }

  const fallback = ruleBasedExtract(description);
  res.json({ success: true, source: "node_lexical_fallback", data: fallback });
});

// Get Specific Item Details
const handleGetItemById = async (req: any, res: any) => {
  const { id } = req.params;
  try {
    const isStaff = ["guidance_encoder", "system_admin", "admin", "staff"].includes(req.user?.role);
    const item = await prisma.item.findUnique({
      where: { id },
      include: {
        privateDetails: isStaff,
        flags: isStaff,
        encoder: isStaff ? { select: { fullName: true, email: true } } : undefined,
        finder: isStaff,
        dispositionCase: isStaff,
        statusHistory: isStaff ? { orderBy: { createdAt: "desc" }, include: { changer: { select: { fullName: true, role: true } } } } : false,
        documents: isStaff
      }
    });

    if (!item) return res.status(404).json({ error: "Item not found" });

    // Public view hides private details completely
    if (!isStaff) {
      const formatted = formatPostWithIntake(item);
      return res.json({
        id: formatted.id,
        control_no: formatted.control_no,
        controlNo: formatted.controlNo,
        title: formatted.title,
        category: formatted.category,
        color: formatted.color,
        publicDescription: formatted.publicDescription,
        description: formatted.publicDescription,
        dateFound: formatted.dateFound,
        areaFound: formatted.areaFound,
        locationFound: formatted.areaFound,
        condition: formatted.condition,
        storageLocation: formatted.storageLocation,
        storage_location: formatted.storage_location,
        specialHandlingType: formatted.specialHandlingType,
        special_handling_type: formatted.special_handling_type,
        imageUrl: formatted.imageUrl,
        status: formatted.status,
        createdAt: formatted.createdAt,
        received_at: formatted.received_at,
        receivedAt: formatted.receivedAt
      });
    }

    res.json(formatPostWithIntake(item));
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch item" });
  }
};

app.get("/api/posts/:id", authenticate, handleGetItemById);
app.get("/api/items/:id", authenticate, handleGetItemById);

// Get All Public Posts / Items
const handleGetAllItems = async (_req: any, res: any) => {
  try {
    const items = await prisma.item.findMany({
      where: { status: { in: ["published", "available"] } },
      include: { privateDetails: true, finder: true },
      orderBy: { createdAt: "desc" }
    });
    res.json(items.map(formatPostWithIntake));
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch items" });
  }
};

app.get("/api/posts", authenticate, handleGetAllItems);
app.get("/api/items", authenticate, handleGetAllItems);

// -------------------------------------------------------------
// Claims & Verification Workflow
// -------------------------------------------------------------

// Student Submits Claim Request (Limit: One active claim per item)
app.post("/api/claims", authenticate, requireRoles("student", "claimant"), async (req: any, res: any) => {
  const { postId, itemId, proofDetails, ownerNote } = req.body;
  const resolvedItemId = itemId || postId;
  const resolvedProof = proofDetails || ownerNote;
  if (!resolvedItemId || !resolvedProof) {
    return res.status(400).json({ error: "Item ID and proof of ownership details are required" });
  }
  
  try {
    const item = await prisma.item.findUnique({ where: { id: resolvedItemId } });
    if (!item) return res.status(404).json({ error: "Item not found" });

    // Enforce status constraints
    if (item.status === "released") {
      return res.status(400).json({ error: "This item has already been released to its recipient and is no longer claimable." });
    }
    if (item.status === "claim_pending") {
      return res.status(409).json({ 
        error: "An active claim is already pending verification for this item. System limits to one active claim per item." 
      });
    }
    if (item.status !== "published" && item.status !== "available") {
      return res.status(400).json({ error: `This item is currently in '${item.status}' stage and not yet published for claiming.` });
    }

    // Strict Limit: Only one active claim per item (status claim_pending)
    const existingActiveClaim = await prisma.claim.findFirst({
      where: {
        itemId: resolvedItemId,
        status: { in: ["submitted", "under_verification", "approved"] }
      }
    });

    if (existingActiveClaim) {
      return res.status(409).json({ 
        error: "An active claim is already pending verification for this item. Only one active claim per item is permitted at a time." 
      });
    }

    const claim = await prisma.claim.create({
      data: {
        itemId: resolvedItemId,
        claimantId: req.user.userId,
        status: "submitted",
        proofDetails: resolvedProof
      }
    });

    // Strict status transition: published -> claim_pending
    const updatedItem = await prisma.item.update({
      where: { id: resolvedItemId },
      data: { status: "claim_pending" }
    });

    // Record audit status history
    await prisma.itemStatusHistory.create({
      data: {
        itemId: resolvedItemId,
        fromStatus: item.status,
        toStatus: "claim_pending",
        changedBy: req.user.userId,
        reason: "Claim submitted by student"
      }
    });

    res.json({ success: true, claim, post: updatedItem, item: updatedItem });
  } catch (error) {
    console.error("Submit claim error:", error);
    res.status(500).json({ error: "Failed to submit claim" });
  }
});

// Student Views Own Claims
app.get("/api/claims/mine", authenticate, requireRoles("student", "claimant"), async (req: any, res: any) => {
  try {
    const claims = await prisma.claim.findMany({
      where: { claimantId: req.user.userId },
      include: {
        item: {
          select: {
            id: true,
            control_no: true,
            category: true,
            color: true,
            publicDescription: true,
            dateFound: true,
            areaFound: true,
            imageUrl: true,
            status: true
          }
        }
      },
      orderBy: { createdAt: "desc" }
    });
    // Format response to provide both post and item property for client compatibility
    const formattedClaims = claims.map((c: any) => ({
      ...c,
      postId: c.itemId,
      post: c.item
    }));
    res.json(formattedClaims);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch claims" });
  }
});

// Guidance Personnel View All Claims Queue
app.get("/api/admin/claims", authenticate, requireRoles("guidance_encoder", "system_admin"), async (req: any, res: any) => {
  try {
    const claims = await prisma.claim.findMany({
      include: {
        item: { include: { privateDetails: true, finder: true } },
        claimant: { select: { fullName: true, email: true, schoolId: true, userType: true, phone: true } },
        releases: true,
        verifications: true
      },
      orderBy: { createdAt: "desc" }
    });
    const formattedClaims = claims.map((c: any) => ({
      ...c,
      postId: c.itemId,
      post: c.item,
      handovers: c.releases
    }));
    res.json(formattedClaims);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch claims" });
  }
});

// Process Claim / Verify Proof Interview (Guidance Encoder & System Admin)
app.post("/api/admin/claims/:id/process", authenticate, requireRoles("guidance_encoder", "system_admin"), async (req: any, res: any) => {
  const { id } = req.params;
  const { notes, markUnderVerification } = req.body;

  try {
    const claim = await prisma.claim.update({
      where: { id },
      data: {
        status: markUnderVerification ? "under_verification" : undefined,
        processedBy: req.user.userId,
      }
    });

    if (notes) {
      await prisma.claimVerification.create({
        data: {
          claimId: id,
          verifiedBy: req.user.userId,
          status: "pending",
          notes
        }
      });
    }

    res.json({ success: true, claim });
  } catch (error) {
    res.status(500).json({ error: "Failed to update claim processing status" });
  }
});

// Approve or Reject Claim (Guidance Encoder & System Admin)
app.post("/api/admin/claims/:id/decision", authenticate, requireRoles("guidance_encoder", "system_admin", "staff" as any, "admin" as any), async (req: any, res: any) => {
  const { id } = req.params;
  const { action, rejectReason, verificationNotes } = req.body; // "approve" or "reject"

  try {
    const claim = await prisma.claim.findUnique({ where: { id }, include: { item: true } });
    if (!claim) return res.status(404).json({ error: "Claim not found" });

    if (action === "approve") {
      // Approved for physical release at Guidance Office
      await prisma.claim.update({
        where: { id },
        data: {
          status: "approved",
          decidedBy: req.user.userId,
          decidedAt: new Date()
        }
      });

      // Store claim verification record
      await prisma.claimVerification.create({
        data: {
          claimId: id,
          verifiedBy: req.user.userId,
          status: "passed",
          notes: verificationNotes || "Claim verified and approved for physical release by Guidance personnel"
        }
      });

      res.json({ success: true, message: "Claim approved for physical release" });
    } else if (action === "reject") {
      // Rejected: Strictly revert post back to "published" so others can discover & claim it!
      await prisma.claim.update({
        where: { id },
        data: {
          status: "rejected",
          rejectReason: rejectReason || "Proof does not match verification details",
          decidedBy: req.user.userId,
          decidedAt: new Date()
        }
      });

      // Record failed verification in claim_verifications
      await prisma.claimVerification.create({
        data: {
          claimId: id,
          verifiedBy: req.user.userId,
          status: "failed",
          notes: rejectReason || "Proof did not match private verification characteristics"
        }
      });

      // Strict status transition rule: claim_pending -> published
      await prisma.item.update({
        where: { id: claim.itemId },
        data: { status: "published" }
      });

      // Record audit status history for reversion
      await prisma.itemStatusHistory.create({
        data: {
          itemId: claim.itemId,
          fromStatus: "claim_pending",
          toStatus: "published",
          changedBy: req.user.userId,
          reason: `Claim rejected (${rejectReason || 'Proof mismatch'}); item returned to published catalog`
        }
      });

      res.json({ success: true, message: "Claim rejected; item reverted to published catalog" });
    } else {
      res.status(400).json({ error: "Invalid action. Must be 'approve' or 'reject'" });
    }
  } catch (error) {
    console.error("Claim decision error:", error);
    res.status(500).json({ error: "Failed to execute claim decision" });
  }
});

// Official Physical Handover & Release (Guidance Personnel / Staff / Admin)
// Records recipient details, ID presented, release date/time, approving staff, and acknowledgment of receipt
app.post("/api/admin/claims/:id/release", authenticate, requireRoles("guidance_encoder", "system_admin", "staff" as any, "admin" as any), async (req: any, res: any) => {
  const { id } = req.params;
  const { 
    recipientName, 
    claimantName,
    recipientSchoolId, 
    claimantSchoolId,
    recipientContact,
    recipientType,
    idTypePresented,
    idNumber,
    releaseDate,
    approvingStaffName,
    acknowledgmentConfirmed,
    acknowledgmentNote,
    verificationSummary, 
    notes 
  } = req.body;

  try {
    const claim = await prisma.claim.findUnique({ 
      where: { id }, 
      include: { 
        item: { include: { privateDetails: true } }, 
        claimant: true 
      } 
    });
    if (!claim) return res.status(404).json({ error: "Claim not found" });

    // Fetch approving staff name
    const staffUser = await prisma.user.findUnique({ where: { id: req.user.userId } });
    const resolvedStaffName = approvingStaffName || staffUser?.fullName || "Guidance Officer";

    // Structured release record capturing all mandatory requirements
    const releaseRecord = {
      claimId: claim.id,
      postId: claim.itemId,
      itemId: claim.itemId,
      recipientName: recipientName || claimantName || claim.claimant?.fullName || "Unspecified Recipient",
      recipientSchoolId: recipientSchoolId || claimantSchoolId || claim.claimant?.schoolId || "N/A",
      recipientContact: recipientContact || claim.claimant?.phone || claim.claimant?.email || "N/A",
      recipientType: recipientType || "Actual Owner",
      idTypePresented: idTypePresented || "School ID Card",
      idNumber: idNumber || "Verified at Office",
      releaseDateTime: releaseDate ? new Date(releaseDate).toISOString() : new Date().toISOString(),
      approvingStaffMember: resolvedStaffName,
      approvingStaffId: req.user.userId,
      acknowledgmentOfReceipt: {
        confirmed: acknowledgmentConfirmed !== undefined ? Boolean(acknowledgmentConfirmed) : true,
        statement: acknowledgmentNote || "I hereby confirm physical receipt of the described item in satisfactory condition from the School Guidance Office.",
        signedAt: new Date().toISOString()
      },
      verificationSummary: verificationSummary || "Claimant physically inspected item and verified matching identifying details at the Guidance Desk.",
      staffNotes: notes || ""
    };

    // Mark claim released
    await prisma.claim.update({
      where: { id },
      data: { status: "released" }
    });

    // Strict status transition: item status permanently set to "released" (final status)
    const updatedItem = await prisma.item.update({
      where: { id: claim.itemId },
      data: { status: "released" }
    });

    // Record audit status history
    await prisma.itemStatusHistory.create({
      data: {
        itemId: claim.itemId,
        fromStatus: "claim_pending",
        toStatus: "released",
        changedBy: req.user.userId,
        reason: `Item officially released to ${releaseRecord.recipientName} (${releaseRecord.recipientSchoolId})`
      }
    });

    // Format clear textual verification summary for database record
    const summaryText = `Physical release to ${releaseRecord.recipientName} (${releaseRecord.recipientSchoolId}). ID Presented: ${releaseRecord.idTypePresented} (#${releaseRecord.idNumber}). Approved by: ${releaseRecord.approvingStaffMember} at ${new Date(releaseRecord.releaseDateTime).toLocaleString()}. Acknowledgment: ${releaseRecord.acknowledgmentOfReceipt.confirmed ? "CONFIRMED & SIGNED" : "PENDING"}.`;

    // Create official Release entry in releases table
    const log = await prisma.release.create({
      data: {
        claimId: claim.id,
        itemId: claim.itemId,
        officerId: req.user.userId,
        claimantName: releaseRecord.recipientName,
        claimantSchoolId: releaseRecord.recipientSchoolId,
        recipientContact: releaseRecord.recipientContact,
        idTypePresented: releaseRecord.idTypePresented,
        idNumberLast4: releaseRecord.idNumber ? releaseRecord.idNumber.slice(-4) : "0000",
        verificationSummary: summaryText,
        waiverSigned: true,
        acknowledgmentOfReceipt: true,
        notes: JSON.stringify(releaseRecord)
      }
    });

    // Save digital scanned waiver record in documents table
    await prisma.document.create({
      data: {
        itemId: claim.itemId,
        claimId: claim.id,
        releaseId: log.id,
        documentType: "release_waiver",
        fileName: `Release_Waiver_${releaseRecord.recipientSchoolId}_${Date.now()}.pdf`,
        fileUrl: `/api/documents/waiver/${log.id}`,
        fileSize: 153600,
        mimeType: "application/pdf",
        uploadedBy: req.user.userId
      }
    });

    res.json({ 
      success: true, 
      log, 
      releaseRecord, 
      post: formatPostWithIntake(updatedItem),
      item: formatPostWithIntake(updatedItem) 
    });
  } catch (error) {
    console.error("Release item error:", error);
    res.status(500).json({ error: "Failed to log item release" });
  }
});

// View Specific Claim Handover Log / Release Record
app.get("/api/admin/claims/:id/handover", authenticate, requireRoles("guidance_encoder", "system_admin", "staff" as any, "admin" as any), async (req: any, res: any) => {
  const { id } = req.params;
  try {
    const log = await prisma.release.findFirst({
      where: { claimId: id },
      include: {
        officer: { select: { fullName: true, email: true, schoolId: true } },
        claim: { include: { claimant: true } },
        item: { include: { privateDetails: true } },
        documents: true
      }
    });

    if (!log) return res.status(404).json({ error: "No release log found for this claim" });

    let parsedRelease: any = null;
    if (log.notes) {
      try {
        parsedRelease = JSON.parse(log.notes);
      } catch {
        parsedRelease = null;
      }
    }

    res.json({ success: true, log, releaseRecord: parsedRelease, post: (log as any).item });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch handover log" });
  }
});

// View All Official Releases (Guidance Staff & Admin)
const handleGetReleases = async (_req: any, res: any) => {
  try {
    const handovers = await prisma.release.findMany({
      include: {
        officer: { select: { fullName: true, email: true } },
        claim: { select: { id: true, proofDetails: true, claimant: { select: { fullName: true, schoolId: true, email: true, phone: true } } } },
        item: { select: { id: true, control_no: true, category: true, color: true, publicDescription: true, areaFound: true } },
        documents: true
      },
      orderBy: { createdAt: "desc" }
    });

    const formatted = handovers.map((h: any) => {
      let parsed: any = null;
      if (h.notes) {
        try { parsed = JSON.parse(h.notes); } catch { /* ignore */ }
      }
      return {
        ...h,
        post: h.item,
        releaseDetails: parsed
      };
    });

    res.json(formatted);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch handovers" });
  }
};

app.get("/api/admin/handovers", authenticate, requireRoles("guidance_encoder", "system_admin", "staff" as any, "admin" as any), handleGetReleases);
app.get("/api/admin/releases", authenticate, requireRoles("guidance_encoder", "system_admin", "staff" as any, "admin" as any), handleGetReleases);

// -------------------------------------------------------------
// New Dedicated Schema Endpoints (Finders, Documents, History, Verifications)
// -------------------------------------------------------------

// List All Finders
app.get("/api/finders", authenticate, requireRoles("guidance_encoder", "system_admin", "staff" as any, "admin" as any), async (_req: any, res: any) => {
  try {
    const finders = await prisma.finder.findMany({
      include: { items: { select: { id: true, control_no: true, category: true, status: true, dateFound: true } } },
      orderBy: { createdAt: "desc" }
    });
    res.json(finders);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch finders list" });
  }
});

// Create Finder Record Manually (Secure storage without requiring user account)
app.post("/api/finders", authenticate, requireRoles("guidance_encoder", "system_admin", "staff" as any, "admin" as any), async (req: any, res: any) => {
  const { name, type, schoolId, contactNumber, email, department, notes } = req.body;
  if (!name) return res.status(400).json({ error: "Finder name is required" });

  try {
    const finder = await prisma.finder.create({
      data: {
        name,
        type: type || "visitor",
        schoolId: schoolId || null,
        contactNumber: contactNumber || null,
        email: email || null,
        department: department || null,
        notes: notes || null
      }
    });
    res.json({ success: true, finder });
  } catch (error) {
    res.status(500).json({ error: "Failed to create finder record" });
  }
});

// Get Item Status History Audit Trail
const handleGetItemHistory = async (req: any, res: any) => {
  const { id } = req.params;
  try {
    const history = await prisma.itemStatusHistory.findMany({
      where: { itemId: id },
      include: { changer: { select: { fullName: true, role: true, email: true } } },
      orderBy: { createdAt: "desc" }
    });
    res.json(history);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch status history" });
  }
};

app.get("/api/items/:id/history", authenticate, requireRoles("guidance_encoder", "system_admin", "staff" as any, "admin" as any), handleGetItemHistory);
app.get("/api/posts/:id/history", authenticate, requireRoles("guidance_encoder", "system_admin", "staff" as any, "admin" as any), handleGetItemHistory);

// Get Scanned Documents for Item
const handleGetItemDocuments = async (req: any, res: any) => {
  const { id } = req.params;
  try {
    const documents = await prisma.document.findMany({
      where: { itemId: id },
      include: { uploader: { select: { fullName: true, role: true } } },
      orderBy: { uploadedAt: "desc" }
    });
    res.json(documents);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch documents" });
  }
};

app.get("/api/items/:id/documents", authenticate, requireRoles("guidance_encoder", "system_admin", "staff" as any, "admin" as any), handleGetItemDocuments);
app.get("/api/posts/:id/documents", authenticate, requireRoles("guidance_encoder", "system_admin", "staff" as any, "admin" as any), handleGetItemDocuments);

// Upload / Attach Scanned Document (e.g. Scanned Release / Waiver form)
const handleUploadItemDocument = async (req: any, res: any) => {
  const { id } = req.params;
  const { documentType, fileName, fileUrl, fileSize, mimeType, claimId, releaseId, dispositionCaseId } = req.body;

  if (!fileName || !fileUrl) {
    return res.status(400).json({ error: "fileName and fileUrl are required" });
  }

  try {
    const doc = await prisma.document.create({
      data: {
        itemId: id,
        claimId: claimId || null,
        releaseId: releaseId || null,
        dispositionCaseId: dispositionCaseId || null,
        documentType: documentType || "release_waiver",
        fileName,
        fileUrl,
        fileSize: fileSize || null,
        mimeType: mimeType || "application/pdf",
        uploadedBy: req.user.userId
      }
    });
    res.json({ success: true, document: doc });
  } catch (error) {
    res.status(500).json({ error: "Failed to upload document" });
  }
};

app.post("/api/items/:id/documents", authenticate, requireRoles("guidance_encoder", "system_admin", "staff" as any, "admin" as any), handleUploadItemDocument);
app.post("/api/posts/:id/documents", authenticate, requireRoles("guidance_encoder", "system_admin", "staff" as any, "admin" as any), handleUploadItemDocument);

// Get Claim Verifications
app.get("/api/claims/:id/verifications", authenticate, requireRoles("guidance_encoder", "system_admin"), async (req: any, res: any) => {
  const { id } = req.params;
  try {
    const verifications = await prisma.claimVerification.findMany({
      where: { claimId: id },
      include: { verifier: { select: { fullName: true, role: true } } },
      orderBy: { verifiedAt: "desc" }
    });
    res.json(verifications);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch claim verifications" });
  }
});

// Add Claim Verification Check
app.post("/api/claims/:id/verifications", authenticate, requireRoles("guidance_encoder", "system_admin"), async (req: any, res: any) => {
  const { id } = req.params;
  const { verificationType, questionsAnswers, idTypePresented, idNumberLast4, status, notes } = req.body;

  try {
    const v = await prisma.claimVerification.create({
      data: {
        claimId: id,
        verifiedBy: req.user.userId,
        verificationType: verificationType || "interview",
        questionsAnswers: typeof questionsAnswers === "object" ? JSON.stringify(questionsAnswers) : (questionsAnswers || null),
        idTypePresented: idTypePresented || null,
        idNumberLast4: idNumberLast4 || null,
        status: status || "passed",
        notes: notes || null
      }
    });
    res.json({ success: true, verification: v });
  } catch (error) {
    res.status(500).json({ error: "Failed to record claim verification" });
  }
});

// Reports Summary (Guidance Encoder & System Admin)
app.get("/api/admin/reports/summary", authenticate, requireRoles("guidance_encoder", "system_admin"), async (_req: any, res: any) => {
  try {
    const totalItems = await prisma.item.count();
    const availableItems = await prisma.item.count({ where: { status: "published" } });
    const pendingReviewItems = await prisma.item.count({ where: { status: { in: ["received", "verified"] } } });
    const returnedItems = await prisma.item.count({ where: { status: "released" } });
    const disposedItems = await prisma.item.count({ where: { status: { in: ["donated", "disposed", "turned_over"] } } });

    const totalClaims = await prisma.claim.count();
    const activeClaims = await prisma.claim.count({ where: { status: { in: ["submitted", "under_verification", "approved"] } } });
    const completedHandovers = await prisma.release.count();

    const recentHandovers = await prisma.release.findMany({
      take: 10,
      orderBy: { createdAt: "desc" },
      include: { item: true, officer: { select: { fullName: true } } }
    });

    const formattedRecent = recentHandovers.map((h: any) => ({
      ...h,
      post: h.item
    }));

    res.json({
      summary: {
        totalItems,
        availableItems,
        pendingReviewItems,
        returnedItems,
        disposedItems,
        totalClaims,
        activeClaims,
        completedHandovers,
        recoveryRatePercent: totalItems > 0 ? Math.round((returnedItems / totalItems) * 100) : 0
      },
      recentHandovers: formattedRecent
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to generate report summary" });
  }
});

// -------------------------------------------------------------
// Vite Dev Server / Static Asset Handler
// -------------------------------------------------------------
async function setupApp() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true, host: "0.0.0.0" },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`BalikHub School Guidance Lost & Found Server running on port ${PORT}`);
  });
}

setupApp().catch((err) => {
  console.error("Failed to start server:", err);
});
