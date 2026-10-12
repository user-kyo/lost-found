import express from "express";
import fs from "fs";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import {
  validateItemTransition,
  validateClaimTransition,
  verifyFileSignature,
  recordAuditLog
} from "./transitions.js";

dotenv.config();

const prisma = new PrismaClient();
// Backward compatibility bridge for renamed Prisma models
(prisma as any).post = (prisma as any).item;
(prisma as any).postPrivateDetail = (prisma as any).itemPrivateDetail;
(prisma as any).postFlag = (prisma as any).itemFlag;
(prisma as any).handoverLog = (prisma as any).release;

const JWT_SECRET = process.env.JWT_SECRET || "balikhub-super-secret-key-2026";

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

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

// Bilingual Lexicon (Filipino / Taglish / English)
const bilingualLexicon: Map<string, Set<string>> = new Map();

function initBilingualLexicon() {
  try {
    const csvCandidates = [
      path.resolve(process.cwd(), "backend", "data", "lexicon_fil_en.csv"),
      path.resolve(process.cwd(), "data", "lexicon_fil_en.csv")
    ];
    const csvPath = csvCandidates.find(p => fs.existsSync(p));
    if (csvPath) {
      const content = fs.readFileSync(csvPath, "utf-8");

      const lines = content.split(/\r?\n/);
      for (const line of lines) {
        const parts = line.trim().split(",");
        if (parts.length >= 2 && parts[0] !== "surface") {
          const surface = parts[0].toLowerCase().trim();
          const canonical = parts[1].toLowerCase().trim();
          if (surface && canonical) {
            if (!bilingualLexicon.has(surface)) bilingualLexicon.set(surface, new Set());
            bilingualLexicon.get(surface)!.add(canonical);

            if (!bilingualLexicon.has(canonical)) bilingualLexicon.set(canonical, new Set());
            bilingualLexicon.get(canonical)!.add(surface);
          }
        }
      }
    }
  } catch (err) {
    console.warn("Failed to read bilingual lexicon CSV:", err);
  }

  // Baseline core mappings
  const corePairs: [string, string][] = [
    ["pitaka", "wallet"], ["susi", "key"], ["payong", "umbrella"],
    ["relo", "watch"], ["orasan", "watch"], ["salamin", "eyeglasses"],
    ["sapatos", "shoes"], ["tsinelas", "slippers"], ["selpon", "phone"],
    ["cellphone", "phone"], ["cp", "phone"], ["itim", "black"],
    ["puti", "white"], ["pula", "red"], ["asul", "blue"], ["berde", "green"],
    ["dilaw", "yellow"], ["kayumanggi", "brown"], ["abo", "gray"],
    ["balat", "leather"], ["plastik", "plastic"], ["tela", "cloth"],
    ["blk", "black"], ["wht", "white"]
  ];
  for (const [surf, can] of corePairs) {
    if (!bilingualLexicon.has(surf)) bilingualLexicon.set(surf, new Set());
    bilingualLexicon.get(surf)!.add(can);
    if (!bilingualLexicon.has(can)) bilingualLexicon.set(can, new Set());
    bilingualLexicon.get(can)!.add(surf);
  }
}
initBilingualLexicon();

const NLP_STOP_WORDS = new Set([
  "ang", "ng", "sa", "na", "ko", "ako", "ay", "mga", "po", "opo",
  "yung", "yun", "ito", "iyon", "ni", "kay", "nasa", "mo",
  "lost", "found", "missing", "nawala", "nakita",
  "the", "is", "at", "which", "on", "a", "an", "and", "or", "in", "of", "for", "to", "with"
]);

function tokenizeQuery(text: string): string[] {
  if (!text) return [];
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(t => t.length >= 2 && !NLP_STOP_WORDS.has(t));
}

function expandSearchTokens(tokens: string[]): Set<string> {
  const expanded = new Set<string>();
  for (const t of tokens) {
    expanded.add(t);
    const synonyms = bilingualLexicon.get(t);
    if (synonyms) {
      synonyms.forEach(s => expanded.add(s));
    }
  }
  return expanded;
}

// Fallback weighted bilingual lexical ranking
function lexicalRankPosts(query: string, availablePosts: any[]) {
  const rawTokens = tokenizeQuery(query);
  const searchTerms = expandSearchTokens(rawTokens);

  if (searchTerms.size === 0) {
    return availablePosts.map(post => ({
      ...post,
      score: 0,
      similarityScore: 0,
      confidence: "Low",
      matchedAttributes: [],
      item: post,
      id: post.id
    }));
  }

  const scored = availablePosts.map(post => {
    const categoryTokens = tokenizeQuery(post.category || post.itemType || "");
    const colorTokens = tokenizeQuery(post.color || "");
    const descTokens = tokenizeQuery(`${post.publicDescription || ""} ${post.title || ""} ${post.description || ""}`);
    const areaTokens = tokenizeQuery(post.areaFound || post.locationFound || post.storageLocation || "");
    const otherTokens = tokenizeQuery(`${post.brand || ""} ${post.condition || ""}`);

    let totalPoints = 0;
    const matchedAttributes: string[] = [];

    // 1. Category match (weight: 35)
    let categoryMatched = false;
    for (const term of searchTerms) {
      if (categoryTokens.includes(term) || categoryTokens.some(ct => ct.includes(term) || term.includes(ct))) {
        categoryMatched = true;
        break;
      }
    }
    if (categoryMatched) {
      totalPoints += 35;
      matchedAttributes.push("Category / Item Type");
    }

    // 2. Color match (weight: 25)
    let colorMatched = false;
    for (const term of searchTerms) {
      if (colorTokens.includes(term) || colorTokens.some(ct => ct.includes(term) || term.includes(ct))) {
        colorMatched = true;
        break;
      }
    }
    if (colorMatched) {
      totalPoints += 25;
      matchedAttributes.push("Color");
    }

    // 3. Area Found / Location (weight: 15)
    let areaMatched = false;
    for (const term of searchTerms) {
      if (areaTokens.includes(term) || areaTokens.some(at => at.includes(term) || term.includes(at))) {
        areaMatched = true;
        break;
      }
    }
    if (areaMatched) {
      totalPoints += 15;
      matchedAttributes.push("Area / Location");
    }

    // 4. Description / Title tokens (weight: up to 20)
    let descHits = 0;
    for (const term of searchTerms) {
      if (descTokens.includes(term) || descTokens.some(dt => dt.includes(term) || term.includes(dt))) {
        descHits++;
      }
    }
    if (descHits > 0) {
      const descScore = Math.min(20, descHits * 10);
      totalPoints += descScore;
      matchedAttributes.push(`Description match (${descHits} term${descHits > 1 ? "s" : ""})`);
    }

    // 5. Brand / Condition (weight: 10)
    let brandMatched = false;
    for (const term of searchTerms) {
      if (otherTokens.includes(term)) {
        brandMatched = true;
        break;
      }
    }
    if (brandMatched) {
      totalPoints += 10;
      matchedAttributes.push("Brand / Condition");
    }

    const similarityScore = Math.min(100, Math.round(totalPoints));
    let confidence = "Low";
    if (similarityScore >= 60) confidence = "High";
    else if (similarityScore >= 30) confidence = "Medium";

    return {
      ...post,
      score: similarityScore,
      similarityScore,
      confidence,
      matchedAttributes,
      item: post,
      id: post.id
    };
  });

  return scored.sort((a, b) => b.similarityScore - a.similarityScore);
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
  | "claimant"            // Public item search, own claims, and claim-status viewing
  | "guidance_encoder"   // Item intake, editing, initial verification, claim processing, document preparation
  | "guidance_head"      // Publication approval, formal claim approval, release authorization, disposition approval
  | "school_administrator" // Read-only reports and authorized statistics
  | "system_admin"       // Technical configuration and account management without operational approval privileges
  | "student";           // Backward-compatible alias for claimant

export const normalizeRole = (role?: string): string => {
  if (!role) return "";
  const r = role.toLowerCase().trim();
  if (r === "student" || r === "claimant" || r === "citizen") return "claimant";
  if (r === "guidance_encoder" || r === "encoder") return "guidance_encoder";
  if (r === "guidance_head" || r === "head") return "guidance_head";
  if (r === "school_administrator" || r === "schooladmin" || r === "school_admin") return "school_administrator";
  if (r === "system_admin" || r === "admin" || r === "sysadmin") return "system_admin";
  return r;
};

export const isStaffUser = (user?: any): boolean => {
  if (!user?.role) return false;
  const normalized = normalizeRole(user.role);
  return ["guidance_encoder", "guidance_head", "school_administrator", "system_admin"].includes(normalized);
};

const generateToken = (userId: string, role: string) => {
  return jwt.sign({ userId, role: normalizeRole(role) }, JWT_SECRET, { expiresIn: '7d' });
};

// Middleware: Authenticate JWT
const authenticate = (req: any, res: any, next: any) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: "Unauthorized: Missing authentication token" });
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    decoded.role = normalizeRole(decoded.role);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
};

// Middleware: Optional JWT authentication (populates req.user if valid token provided)
const authenticateOptional = (req: any, _res: any, next: any) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    req.user = null;
    return next();
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    decoded.role = normalizeRole(decoded.role);
    req.user = decoded;
  } catch (err) {
    req.user = null;
  }
  next();
};

// Middleware: Role-based access control enforcement
const requireRoles = (...allowedRoles: string[]) => {
  return (req: any, res: any, next: any) => {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized: Missing authentication token" });
    }
    const userRole = normalizeRole(req.user.role);
    const normalizedAllowed = allowedRoles.map(r => normalizeRole(r));
    if (!normalizedAllowed.includes(userRole)) {
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

// Database-backed school holding period configuration & Guidance Office Policies
let cachedSchoolHoldingDays = 45;
let cachedConfigProvisional = false;

const DEFAULT_IDENTITY_VERIFICATION_POLICY = {
  policyCode: "LC-GO-IVP-2026.1",
  title: "Laguna College Guidance Office Identity Verification Procedures",
  authority: "Guidance Office & Office of Student Affairs",
  approvedBy: "Dr. Maria Elena Santos, Guidance Head",
  approvalStatus: "approved",
  effectiveDate: "2026-10-12",
  acceptableCredentials: [
    {
      type: "School ID Card",
      priority: "Primary",
      mandatory: false,
      notes: "Active Laguna College Student ID or Faculty/Staff RFID Card"
    },
    {
      type: "Government Issued Photo ID",
      priority: "Secondary",
      mandatory: false,
      notes: "PhilID, Driver's License, Philippine Passport, UMID, Postal ID, or Voter's ID"
    },
    {
      type: "Official Certificate of Enrollment with Photo",
      priority: "Tertiary",
      mandatory: false,
      notes: "Current semester Laguna College Registration / Assessment Form accompanied by supporting ID"
    }
  ],
  verificationProcedure: [
    {
      step: 1,
      title: "Physical Credential Inspection",
      description: "Match photo, full name, and school ID number against claimant registration."
    },
    {
      step: 2,
      title: "Private Ownership Corroboration",
      description: "Verify non-public identifiers (serial numbers, device unlock, internal stickers, contents) withheld from public bulletin."
    },
    {
      step: 3,
      title: "Item Joint Inspection",
      description: "Present item to claimant in Guidance custody; confirm condition matches intake log."
    },
    {
      step: 4,
      title: "Release Receipt and Acknowledgment",
      description: "Record recipient name, ID type, ID number, contact info, relationship/type, and signature."
    }
  ],
  safeguards: {
    disallowUnverifiedRelease: true,
    requireApprovedClaimFirst: true,
    requirePhotoIdLog: true,
    proxyAuthorizationRule: "Written endorsement + photocopy of owner valid ID required for proxy retrieval"
  }
};

const DEFAULT_UNCLAIMED_ITEMS_RULES = {
  ruleCode: "LC-GO-UIDR-2026.1",
  title: "Laguna College Guidance Board Rules for Unclaimed Items",
  authority: "Guidance Board & Operational Custody",
  approvedBy: "Dr. Maria Elena Santos, Guidance Head",
  approvalStatus: "approved",
  schoolHoldingPeriodDays: 45,
  statutoryMonths: 6,
  minimumSchoolDaysInCustody: 45,
  description: "Administrative policy governing custody, holding period, and disposition of unclaimed items in Guidance Office custody.",
  mandatoryDocumentChecklist: [
    { key: "physical_inventory_audit", label: "Physical Inventory Audit", description: "Audit item condition and confirm physical presence in secure custody." },
    { key: "claim_absence_certified", label: "Certification of No Active Claims", description: "Certify that zero verified or approved claims are pending for this property." },
    { key: "notice_posted", label: "Impending Disposition Notice", description: "Public bulletin notice posted for required notice window." },
    { key: "recipient_identified", label: "Recipient Designation", description: "Designate vetted partner charity, school outreach, or civic body." },
    { key: "property_affidavit_attached", label: "Guidance Custody Affidavit", description: "Execution of official property disposition affidavit signed by custodian." }
  ],
  statutorySeparation: "Internal school holding period (45 school days) applies administratively. Civil code 6-month statutory retention applies to high-value goods before municipal or civic turnover.",
  dispositionStreams: [
    {
      targetDisposition: "donated",
      eligibleItems: "Clothing, bags, non-perishable school supplies, general items in serviceable condition",
      beneficiary: "DepEd Student Welfare Foundation / Laguna College Student Outreach",
      requiresGuidanceHeadApproval: true
    },
    {
      targetDisposition: "turned_over",
      eligibleItems: "High-value electronics, legal/official documents, jewelry, currency",
      beneficiary: "San Pablo City Police / Barangay Civic Custody / LGU",
      requiresGuidanceHeadApproval: true
    },
    {
      targetDisposition: "disposed",
      eligibleItems: "Perishable foods, damaged or unsanitary items, broken zero-value remnants",
      method: "Sanitary campus facilities disposal",
      requiresGuidanceHeadApproval: true
    }
  ],
  authorization: {
    approvalRole: "guidance_head",
    executionRole: "guidance_head",
    reportingRoles: ["school_administrator", "system_admin"]
  }
};

async function syncHoldingConfigFromDb() {
  try {
    const config = await prisma.systemConfiguration.findUnique({
      where: { key: "school_holding_days" }
    });
    if (config) {
      cachedSchoolHoldingDays = parseInt(config.value, 10) || 45;
      cachedConfigProvisional = config.isProvisional;
    } else {
      // Initialize authoritative default (45 school days approved by Guidance Office)
      await prisma.systemConfiguration.create({
        data: {
          key: "school_holding_days",
          value: "45",
          description: "Approved school holding period by Guidance Office",
          isProvisional: false
        }
      });
      cachedSchoolHoldingDays = 45;
      cachedConfigProvisional = false;
    }

    // Seed Guidance Office Identity Verification Policy if not present
    const idPolicy = await prisma.systemConfiguration.findUnique({
      where: { key: "identity_verification_policy" }
    });
    if (!idPolicy) {
      await prisma.systemConfiguration.create({
        data: {
          key: "identity_verification_policy",
          value: JSON.stringify(DEFAULT_IDENTITY_VERIFICATION_POLICY),
          description: "Laguna College Guidance Office Approved Identity Verification Procedures (LC-GO-IVP-2026.1)",
          isProvisional: false,
          updatedBy: "13b85d0f-c484-47ed-8f7b-ea80ffd019bc"
        }
      });
    }

    // Seed Guidance Office Unclaimed Items Rules if not present
    const unclaimedRules = await prisma.systemConfiguration.findUnique({
      where: { key: "unclaimed_items_disposition_rules" }
    });
    if (!unclaimedRules) {
      await prisma.systemConfiguration.create({
        data: {
          key: "unclaimed_items_disposition_rules",
          value: JSON.stringify(DEFAULT_UNCLAIMED_ITEMS_RULES),
          description: "Laguna College Guidance Board Approved Rules for Unclaimed Items (LC-GO-UIDR-2026.1)",
          isProvisional: false,
          updatedBy: "13b85d0f-c484-47ed-8f7b-ea80ffd019bc"
        }
      });
    }
  } catch (err) {
    // Retain safe authoritative default 45
  }
}
// Initialize config on boot
syncHoldingConfigFromDb();


// Helper to compute School Holding Clocks and Statutory 6-Month Period
function calculateHoldingClocks(post: any, intakeMeta: any) {
  const receivedAtDate = post.received_at ? new Date(post.received_at) : (post.dateFound ? new Date(post.dateFound) : (post.createdAt ? new Date(post.createdAt) : new Date()));
  const schoolHoldingPeriodDays = Number(intakeMeta?.schoolHoldingPeriodDays) || cachedSchoolHoldingDays;
  
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

// Sanitized item formatter for claimants & public searches (Phase 2 Data Protection)
// Strictly EXCLUDES finder contact, finder notes, private verification notes, storage locations, and restricted metadata.
function formatPublicItem(post: any) {
  let intakeMeta: any = {};
  if (post.privateDetails?.details) {
    try {
      intakeMeta = JSON.parse(post.privateDetails.details);
    } catch {
      intakeMeta = { privateVerificationDetails: post.privateDetails.details };
    }
  }

  const controlNo = post.control_no || post.controlNo || intakeMeta.controlNo || `CTRL-${post.id ? post.id.slice(0, 8).toUpperCase() : '2026'}`;
  const title = post.publicDescription?.slice(0, 50) || `${post.color || ''} ${post.category || 'Found Item'}`;
  const receivedAt = post.received_at 
    ? new Date(post.received_at).toISOString() 
    : (post.dateFound ? new Date(post.dateFound).toISOString() : (post.createdAt ? new Date(post.createdAt).toISOString() : new Date().toISOString()));

  return {
    id: post.id,
    control_no: controlNo,
    controlNo: controlNo,
    title,
    category: post.category,
    color: post.color,
    publicDescription: post.publicDescription,
    description: post.publicDescription,
    dateFound: post.dateFound,
    areaFound: post.areaFound,
    locationFound: post.areaFound,
    condition: intakeMeta.condition || post.condition || "Good",
    imageUrl: post.imageUrl || null,
    status: post.status === "available" ? "published" : post.status,
    createdAt: post.createdAt,
    received_at: receivedAt,
    receivedAt: receivedAt
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
    const schoolHoldingEndDate = new Date(receivedAtDate.getTime() + cachedSchoolHoldingDays * 86400000);

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

    // Record persistent audit log (Task 4)
    await recordAuditLog(prisma, {
      actorId: req.user.userId,
      action: "intake_created",
      entity: "items",
      entityId: item.id,
      metadata: {
        category: item.category,
        control_no: item.control_no,
        status: item.status
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

app.post("/api/posts", authenticate, requireRoles("guidance_encoder", "guidance_head"), handleItemIntake);
app.post("/api/items", authenticate, requireRoles("guidance_encoder", "guidance_head"), handleItemIntake);

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

app.put("/api/posts/:id", authenticate, requireRoles("guidance_encoder", "guidance_head"), handleItemUpdate);
app.put("/api/items/:id", authenticate, requireRoles("guidance_encoder", "guidance_head"), handleItemUpdate);

// Verification Step: received -> verified
const handleItemVerify = async (req: any, res: any) => {
  const { id } = req.params;
  const { note } = req.body;

  try {
    const item = await prisma.item.findUnique({ where: { id } });
    if (!item) return res.status(404).json({ error: "Item not found" });

    // Enforce centralized transition validation
    const transition = validateItemTransition(item, "verified", {
      userId: req.user.userId,
      role: req.user.role
    });
    if (!transition.allowed) {
      return res.status(transition.statusCode).json({ error: transition.error });
    }

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

    // Record persistent audit log
    await recordAuditLog(prisma, {
      actorId: req.user.userId,
      action: "item_verified",
      entity: "items",
      entityId: id,
      metadata: { fromStatus: item.status, toStatus: "verified", note }
    });

    res.json({ success: true, post: formatPostWithIntake(updated), item: formatPostWithIntake(updated) });
  } catch (error) {
    console.error("Verify item error:", error);
    res.status(500).json({ error: "Failed to verify item" });
  }
};

app.post("/api/admin/posts/:id/verify", authenticate, requireRoles("guidance_encoder", "guidance_head"), handleItemVerify);
app.post("/api/admin/items/:id/verify", authenticate, requireRoles("guidance_encoder", "guidance_head"), handleItemVerify);

// Publication Step: verified -> published (or direct approve)
const handleItemPublish = async (req: any, res: any) => {
  const { id } = req.params;
  const { note } = req.body;

  try {
    const item = await prisma.item.findUnique({ where: { id } });
    if (!item) return res.status(404).json({ error: "Item not found" });

    // Enforce centralized transition validation (Prerequisite: intake verification must be completed first!)
    const transition = validateItemTransition(item, "published", {
      userId: req.user.userId,
      role: req.user.role
    });
    if (!transition.allowed) {
      return res.status(transition.statusCode).json({ error: transition.error });
    }

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
        fromStatus: item.status,
        toStatus: "published",
        changedBy: req.user.userId,
        reason: note || "Item approved and published to student feed"
      }
    });

    // Record persistent audit log
    await recordAuditLog(prisma, {
      actorId: req.user.userId,
      action: "item_published",
      entity: "items",
      entityId: id,
      metadata: { fromStatus: item.status, toStatus: "published", note }
    });

    res.json({ success: true, post: formatPostWithIntake(updated), item: formatPostWithIntake(updated) });
  } catch (error) {
    console.error("Publish item error:", error);
    res.status(500).json({ error: "Failed to publish item" });
  }
};

app.post("/api/admin/posts/:id/publish", authenticate, requireRoles("guidance_head"), handleItemPublish);
app.post("/api/admin/items/:id/publish", authenticate, requireRoles("guidance_head"), handleItemPublish);

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

app.get("/api/admin/review-queue", authenticate, requireRoles("guidance_encoder", "guidance_head"), handleReviewQueue);
app.get("/api/admin/items/review-queue", authenticate, requireRoles("guidance_encoder", "guidance_head"), handleReviewQueue);

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

app.get("/api/admin/inventory", authenticate, requireRoles("guidance_encoder", "guidance_head", "school_administrator", "system_admin"), handleInventory);
app.get("/api/admin/items/inventory", authenticate, requireRoles("guidance_encoder", "guidance_head", "school_administrator", "system_admin"), handleInventory);

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

    // Enforce centralized transition validation (rejects unverified publication, unauthorized roles, etc.)
    const transition = validateItemTransition(existing, newStatus, {
      userId: req.user.userId,
      role: req.user.role
    });
    if (!transition.allowed) {
      return res.status(transition.statusCode).json({ error: transition.error });
    }

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

    // Record persistent audit log
    await recordAuditLog(prisma, {
      actorId: req.user.userId,
      action: action === "reject" ? "item_rejected" : "item_published",
      entity: "items",
      entityId: id,
      metadata: { fromStatus: existing.status, toStatus: newStatus, note }
    });

    res.json({ success: true, post: formatPostWithIntake(item), item: formatPostWithIntake(item) });
  } catch (error) {
    console.error("Review item error:", error);
    res.status(500).json({ error: "Failed to review item" });
  }
};

app.post("/api/admin/posts/:id/review", authenticate, requireRoles("guidance_head"), handleItemReview);
app.post("/api/admin/items/:id/review", authenticate, requireRoles("guidance_head"), handleItemReview);

// -------------------------------------------------------------
// Holding Period & Unclaimed Item Disposition Workflow
// -------------------------------------------------------------

// Get Holding Period Configuration (Database-Backed & Non-Destructive, Task 3)
app.get("/api/admin/holding-config", authenticate, requireRoles("guidance_encoder", "guidance_head", "system_admin", "school_administrator"), async (_req: any, res: any) => {
  let config = await prisma.systemConfiguration.findUnique({
    where: { key: "school_holding_days" }
  });
  if (!config) {
    config = await prisma.systemConfiguration.create({
      data: {
        key: "school_holding_days",
        value: "45",
        description: "Approved school holding period by Guidance Office",
        isProvisional: false
      }
    });
  }
  cachedSchoolHoldingDays = parseInt(config.value, 10) || 45;
  cachedConfigProvisional = config.isProvisional;

  res.json({
    schoolHoldingDays: cachedSchoolHoldingDays,
    isProvisional: config.isProvisional,
    description: config.description || "Approved school holding period by Guidance Office",
    updatedAt: config.updatedAt,
    updatedBy: config.updatedBy,
    statutoryMonths: 6,
    notice: "The internal school holding period is an administrative timeline and does not automatically satisfy statutory publication, civic notice, or legal property disposition requirements under civil law.",
    guidancePoliciesApproved: true,
    identityVerificationApproved: true,
    unclaimedRulesApproved: true
  });
});

// Update Configurable School Holding Period (Database-Backed with History & Audit, Task 3)
app.put("/api/admin/holding-config", authenticate, requireRoles("guidance_head", "system_admin"), async (req: any, res: any) => {
  const { schoolHoldingDays, isProvisional, note } = req.body;
  if (!schoolHoldingDays || isNaN(Number(schoolHoldingDays)) || Number(schoolHoldingDays) <= 0) {
    return res.status(400).json({ error: "schoolHoldingDays must be a positive integer." });
  }

  const newDays = Number(schoolHoldingDays);
  const prevDays = cachedSchoolHoldingDays;

  // Persist into database system_configurations table
  const updated = await prisma.systemConfiguration.upsert({
    where: { key: "school_holding_days" },
    update: {
      value: String(newDays),
      isProvisional: isProvisional !== undefined ? Boolean(isProvisional) : false,
      updatedBy: req.user.userId,
      description: isProvisional ? "Provisional school holding period" : "Approved school holding period by Guidance Office"
    },
    create: {
      key: "school_holding_days",
      value: String(newDays),
      isProvisional: isProvisional !== undefined ? Boolean(isProvisional) : false,
      updatedBy: req.user.userId,
      description: isProvisional ? "Provisional school holding period" : "Approved school holding period by Guidance Office"
    }
  });

  // Record non-destructive configuration update history
  await prisma.configurationHistory.create({
    data: {
      configKey: "school_holding_days",
      previousValue: String(prevDays),
      newValue: String(newDays),
      changedBy: req.user.userId,
      note: note || `Holding period adjusted from ${prevDays} to ${newDays} days.`
    }
  });

  // Record persistent audit log
  await recordAuditLog(prisma, {
    actorId: req.user.userId,
    action: "config_updated",
    entity: "system_configurations",
    entityId: "school_holding_days",
    metadata: { previousValue: prevDays, newValue: newDays, isProvisional: updated.isProvisional, note }
  });

  cachedSchoolHoldingDays = newDays;
  cachedConfigProvisional = updated.isProvisional;

  res.json({ 
    success: true, 
    schoolHoldingDays: cachedSchoolHoldingDays,
    isProvisional: updated.isProvisional,
    message: `School holding period updated to ${cachedSchoolHoldingDays} days.`
  });
});

// Get Guidance Office Approved Policies & Procedures
app.get("/api/admin/guidance-policies", authenticateOptional, async (_req: any, res: any) => {
  try {
    const idPolicyRecord = await prisma.systemConfiguration.findUnique({
      where: { key: "identity_verification_policy" }
    });
    const unclaimedRulesRecord = await prisma.systemConfiguration.findUnique({
      where: { key: "unclaimed_items_disposition_rules" }
    });

    const identityVerificationPolicy = idPolicyRecord ? JSON.parse(idPolicyRecord.value) : DEFAULT_IDENTITY_VERIFICATION_POLICY;
    const unclaimedItemsDispositionRules = unclaimedRulesRecord ? JSON.parse(unclaimedRulesRecord.value) : DEFAULT_UNCLAIMED_ITEMS_RULES;

    res.json({
      success: true,
      identityVerificationPolicy,
      unclaimedItemsDispositionRules,
      holdingPeriodDays: cachedSchoolHoldingDays,
      holdingPeriodProvisional: cachedConfigProvisional,
      approvalAuthority: "Laguna College Guidance Board & Guidance Head",
      lastUpdated: idPolicyRecord?.updatedAt || new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch guidance policies" });
  }
});

// Update / Re-approve Guidance Office Policies (Guidance Head only)
app.put("/api/admin/guidance-policies", authenticate, requireRoles("guidance_head", "system_admin"), async (req: any, res: any) => {
  const { identityVerificationPolicy, unclaimedItemsDispositionRules, note } = req.body;

  try {
    if (identityVerificationPolicy) {
      await prisma.systemConfiguration.upsert({
        where: { key: "identity_verification_policy" },
        update: {
          value: JSON.stringify(identityVerificationPolicy),
          isProvisional: false,
          updatedBy: req.user.userId,
          description: "Laguna College Guidance Office Approved Identity Verification Procedures (LC-GO-IVP-2026.1)"
        },
        create: {
          key: "identity_verification_policy",
          value: JSON.stringify(identityVerificationPolicy),
          isProvisional: false,
          updatedBy: req.user.userId,
          description: "Laguna College Guidance Office Approved Identity Verification Procedures (LC-GO-IVP-2026.1)"
        }
      });
    }

    if (unclaimedItemsDispositionRules) {
      await prisma.systemConfiguration.upsert({
        where: { key: "unclaimed_items_disposition_rules" },
        update: {
          value: JSON.stringify(unclaimedItemsDispositionRules),
          isProvisional: false,
          updatedBy: req.user.userId,
          description: "Laguna College Guidance Board Approved Rules for Unclaimed Items (LC-GO-UIDR-2026.1)"
        },
        create: {
          key: "unclaimed_items_disposition_rules",
          value: JSON.stringify(unclaimedItemsDispositionRules),
          isProvisional: false,
          updatedBy: req.user.userId,
          description: "Laguna College Guidance Board Approved Rules for Unclaimed Items (LC-GO-UIDR-2026.1)"
        }
      });
    }

    await recordAuditLog(prisma, {
      actorId: req.user.userId,
      action: "guidance_policies_updated",
      entity: "system_configurations",
      entityId: "guidance_policies",
      metadata: { note: note || "Guidance Office operational policies re-authorized" }
    });

    res.json({
      success: true,
      message: "Guidance Office procedures and rules updated successfully."
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to update guidance policies" });
  }
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

app.post("/api/admin/posts/:id/disposition-case", authenticate, requireRoles("guidance_encoder", "guidance_head"), handleCreateDispositionCase);
app.post("/api/admin/items/:id/disposition-case", authenticate, requireRoles("guidance_encoder", "guidance_head"), handleCreateDispositionCase);

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

app.put("/api/admin/posts/:id/disposition-case/checklist", authenticate, requireRoles("guidance_encoder", "guidance_head"), handleUpdateChecklist);
app.put("/api/admin/items/:id/disposition-case/checklist", authenticate, requireRoles("guidance_encoder", "guidance_head"), handleUpdateChecklist);

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

app.post("/api/admin/posts/:id/disposition-case/approve", authenticate, requireRoles("guidance_head"), handleApproveDispositionCase);
app.post("/api/admin/items/:id/disposition-case/approve", authenticate, requireRoles("guidance_head"), handleApproveDispositionCase);

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

app.post("/api/admin/posts/:id/dispose", authenticate, requireRoles("guidance_head"), handleExecuteDisposition);
app.post("/api/admin/items/:id/dispose", authenticate, requireRoles("guidance_head"), handleExecuteDisposition);

// -------------------------------------------------------------
// Public Feed & Search Routes (Claimants & Guidance Personnel)
// -------------------------------------------------------------

// Get Available Published Items (Public fields ONLY, NEVER private verification details)
const handleAvailableItems = async (req: any, res: any) => {
  try {
    const isStaff = isStaffUser(req.user);
    const items = await prisma.item.findMany({
      where: { status: { in: ["published", "available"] } },
      include: {
        privateDetails: isStaff,
        finder: isStaff
      },
      orderBy: { createdAt: "desc" }
    });
    if (isStaff) {
      return res.json(items.map(formatPostWithIntake));
    }
    res.json(items.map(formatPublicItem));
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch available items" });
  }
};

app.get("/api/posts/available", authenticateOptional, handleAvailableItems);
app.get("/api/items/available", authenticateOptional, handleAvailableItems);

// Search Published Items using Natural Language Matcher
app.post("/api/search", authenticateOptional, async (req: any, res: any) => {
  const { query } = req.body;
  if (!query) return res.status(400).json({ error: "Search query is required" });

  try {
    // 1. Fetch published items from DB (Public fields ONLY)
    const availableItemsRaw = await prisma.item.findMany({
      where: { status: { in: ["published", "available"] } }
    });

    const availablePosts = availableItemsRaw.map(post => formatPublicItem(post));

    // Log the search query if user is authenticated
    if (req.user?.userId) {
      await prisma.searchLog.create({
        data: {
          userId: req.user.userId,
          queryText: query,
          resultCount: availablePosts.length
        }
      });
    }

    // 2. Query Python TF-IDF Ranking Service
    try {
      const pyResponse = await fetch("http://127.0.0.1:8000/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, availablePosts })
      });
      if (pyResponse.ok) {
        const rankedMatches = await pyResponse.json();
        if (Array.isArray(rankedMatches) && rankedMatches.length > 0) {
          const normalized = rankedMatches.map((m: any) => ({
            ...(m.item || {}),
            ...m,
            item: m.item || m
          }));
          return res.json(normalized);
        }
      }
    } catch (err) {
      console.warn("Python NLP search server unreachable, using fallback ranker");
    }



    // Fallback weighted bilingual lexical ranking
    const ranked = lexicalRankPosts(query, availablePosts);
    res.json(ranked);
  } catch (error) {
    console.error("Search error:", error);
    res.status(500).json({ error: "Failed to search items" });
  }
});

// NLP Preprocessing / Attribute Extraction Endpoint
app.post("/api/nlp/extract", authenticateOptional, async (req: any, res: any) => {
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

// NLP Match Similarity Analysis Endpoint
app.post("/api/nlp/match-analyze", authenticateOptional, async (req: any, res: any) => {
  const { lostDescription, lostAttributes, foundItem } = req.body;
  if (!foundItem) return res.status(400).json({ error: "foundItem is required" });

  try {
    const pyResponse = await fetch("http://127.0.0.1:8000/api/match-analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lostDescription, lostAttributes, foundItem })
    });
    if (pyResponse.ok) {
      return res.json(await pyResponse.json());
    }
  } catch (err) {
    // Python unreachable, fallback to Node bilingual lexical matcher
  }

  // Fallback bilingual evaluation
  const query = `${lostDescription || ""} ${Object.values(lostAttributes || {}).join(" ")}`;
  const ranked = lexicalRankPosts(query, [foundItem]);
  const score = ranked[0]?.similarityScore || 0;
  const confidence = ranked[0]?.confidence || "Low";
  const matchedAttributes = ranked[0]?.matchedAttributes || ["General lexical overlap"];

  res.json({
    similarityScore: score,
    confidence,
    matchedAttributes,
    discrepancies: ["Private verification details are excluded from matching"],
    aiSummary: "Bilingual lexical fallback analyzed claimant description against found item. Guidance Office verification is mandatory."
  });
});


// Get Specific Item Details
const handleGetItemById = async (req: any, res: any) => {
  const { id } = req.params;
  try {
    const isStaff = isStaffUser(req.user);
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

    // Public view hides private details completely (Phase 2 Data Protection)
    if (!isStaff) {
      return res.json(formatPublicItem(item));
    }

    res.json(formatPostWithIntake(item));
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch item" });
  }
};

app.get("/api/posts/:id", authenticateOptional, handleGetItemById);
app.get("/api/items/:id", authenticateOptional, handleGetItemById);

// Get All Public Posts / Items
const handleGetAllItems = async (req: any, res: any) => {
  try {
    const isStaff = isStaffUser(req.user);
    const items = await prisma.item.findMany({
      where: { status: { in: ["published", "available"] } },
      include: { 
        privateDetails: isStaff, 
        finder: isStaff 
      },
      orderBy: { createdAt: "desc" }
    });
    if (isStaff) {
      return res.json(items.map(formatPostWithIntake));
    }
    res.json(items.map(formatPublicItem));
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch items" });
  }
};

app.get("/api/posts", authenticateOptional, handleGetAllItems);
app.get("/api/items", authenticateOptional, handleGetAllItems);

// -------------------------------------------------------------
// Claims & Verification Workflow
// -------------------------------------------------------------

// Student Submits Claim Request (Limit: One active claim per item, Atomic Concurrency Protected)
app.post("/api/claims", authenticate, requireRoles("student", "claimant"), async (req: any, res: any) => {
  const { postId, itemId, proofDetails, ownerNote, proofDescription } = req.body;
  const resolvedItemId = itemId || postId;
  const resolvedProof = proofDetails || ownerNote || proofDescription;
  if (!resolvedItemId || !resolvedProof) {
    return res.status(400).json({ error: "Item ID and proof of ownership details are required" });
  }
  
  try {
    const result = await prisma.$transaction(async (tx) => {
      const item = await tx.item.findUnique({ where: { id: resolvedItemId } });
      if (!item) {
        throw { statusCode: 404, message: "Item not found" };
      }

      // Check transition eligibility using centralized validator
      const transition = validateItemTransition(item, "claim_pending", {
        userId: req.user.userId,
        role: req.user.role
      });
      if (!transition.allowed) {
        throw { statusCode: transition.statusCode, message: transition.error };
      }

      // Strict Limit: Only one active claim per item (status claim_pending)
      const existingActiveClaim = await tx.claim.findFirst({
        where: {
          itemId: resolvedItemId,
          status: { in: ["submitted", "under_verification", "approved"] }
        }
      });
      if (existingActiveClaim) {
        throw {
          statusCode: 409,
          message: "An active claim is already pending verification for this item. Only one active claim per item is permitted at a time."
        };
      }

      // Atomic conditional update on item status (ensures exactly 1 concurrent claim succeeds)
      const updateResult = await tx.item.updateMany({
        where: {
          id: resolvedItemId,
          status: { in: ["published", "available"] }
        },
        data: { status: "claim_pending" }
      });

      if (updateResult.count === 0) {
        throw {
          statusCode: 409,
          message: "Concurrency conflict: Item was claimed or updated by a simultaneous request. Only one active claim per item is permitted."
        };
      }

      const claim = await tx.claim.create({
        data: {
          itemId: resolvedItemId,
          claimantId: req.user.userId,
          status: "submitted",
          proofDetails: resolvedProof
        }
      });

      await tx.itemStatusHistory.create({
        data: {
          itemId: resolvedItemId,
          fromStatus: item.status,
          toStatus: "claim_pending",
          changedBy: req.user.userId,
          reason: "Claim submitted by student"
        }
      });

      const updatedItem = await tx.item.findUnique({ where: { id: resolvedItemId } });
      return { claim, updatedItem };
    });

    // Record persistent audit log
    await recordAuditLog(prisma, {
      actorId: req.user.userId,
      action: "claim_submitted",
      entity: "claims",
      entityId: result.claim.id,
      metadata: { itemId: resolvedItemId }
    });

    res.json({ success: true, claim: result.claim, post: result.updatedItem, item: result.updatedItem });
  } catch (error: any) {
    if (error?.statusCode) {
      return res.status(error.statusCode).json({ error: error.message });
    }
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

// View Specific Claim Details (Claimant can view own claim; Staff can view for verification)
app.get("/api/claims/:id", authenticate, async (req: any, res: any) => {
  const { id } = req.params;
  try {
    const isStaff = isStaffUser(req.user);
    const claim = await prisma.claim.findUnique({
      where: { id },
      include: {
        item: {
          include: {
            privateDetails: isStaff,
            finder: isStaff
          }
        },
        claimant: {
          select: { fullName: true, email: true, schoolId: true, phone: isStaff }
        },
        verifications: isStaff,
        releases: isStaff
      }
    });

    if (!claim) return res.status(404).json({ error: "Claim not found" });

    // If claimant, enforce ownership check
    if (!isStaff) {
      if (claim.claimantId !== req.user.userId) {
        return res.status(403).json({ error: "Forbidden: You are not authorized to view this claim." });
      }
      return res.json({
        ...claim,
        postId: claim.itemId,
        post: formatPublicItem(claim.item),
        item: formatPublicItem(claim.item)
      });
    }

    res.json({
      ...claim,
      postId: claim.itemId,
      post: formatPostWithIntake(claim.item),
      item: formatPostWithIntake(claim.item)
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch claim" });
  }
});

// Guidance Personnel View All Claims Queue
app.get("/api/admin/claims", authenticate, requireRoles("guidance_encoder", "guidance_head"), async (req: any, res: any) => {
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

// Process Claim / Verify Proof Interview (Guidance Encoder & Guidance Head)
app.post("/api/admin/claims/:id/process", authenticate, requireRoles("guidance_encoder", "guidance_head"), async (req: any, res: any) => {
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

// Approve or Reject Claim (Guidance Head ONLY)
app.post("/api/admin/claims/:id/decision", authenticate, requireRoles("guidance_head"), async (req: any, res: any) => {
  const { id } = req.params;
  const { action, rejectReason, verificationNotes } = req.body; // "approve" or "reject"

  try {
    const claim = await prisma.claim.findUnique({ where: { id }, include: { item: true } });
    if (!claim) return res.status(404).json({ error: "Claim not found" });

    const targetClaimStatus = action === "approve" ? "approved" : action === "reject" ? "rejected" : null;
    if (!targetClaimStatus) {
      return res.status(400).json({ error: "Invalid action. Must be 'approve' or 'reject'" });
    }

    // Centralized transition validation
    const claimTransition = validateClaimTransition(claim, targetClaimStatus, {
      userId: req.user.userId,
      role: req.user.role
    });
    if (!claimTransition.allowed) {
      return res.status(claimTransition.statusCode).json({ error: claimTransition.error });
    }

    await prisma.$transaction(async (tx) => {
      if (action === "approve") {
        await tx.claim.update({
          where: { id },
          data: {
            status: "approved",
            decidedBy: req.user.userId,
            decidedAt: new Date()
          }
        });

        // Store claim verification record
        await tx.claimVerification.create({
          data: {
            claimId: id,
            verifiedBy: req.user.userId,
            status: "passed",
            notes: verificationNotes || "Claim verified and approved for physical release by Guidance personnel"
          }
        });
      } else if (action === "reject") {
        await tx.claim.update({
          where: { id },
          data: {
            status: "rejected",
            rejectReason: rejectReason || "Proof does not match verification details",
            decidedBy: req.user.userId,
            decidedAt: new Date()
          }
        });

        // Record failed verification in claim_verifications
        await tx.claimVerification.create({
          data: {
            claimId: id,
            verifiedBy: req.user.userId,
            status: "failed",
            notes: rejectReason || "Proof did not match private verification characteristics"
          }
        });

        // Strict status transition rule: claim_pending -> published
        await tx.item.update({
          where: { id: claim.itemId },
          data: { status: "published" }
        });

        // Record audit status history for reversion
        await tx.itemStatusHistory.create({
          data: {
            itemId: claim.itemId,
            fromStatus: "claim_pending",
            toStatus: "published",
            changedBy: req.user.userId,
            reason: `Claim rejected (${rejectReason || 'Proof mismatch'}); item returned to published catalog`
          }
        });
      }
    });

    // Persistent audit log
    await recordAuditLog(prisma, {
      actorId: req.user.userId,
      action: action === "approve" ? "claim_approved" : "claim_rejected",
      entity: "claims",
      entityId: id,
      metadata: {
        itemId: claim.itemId,
        action,
        notes: action === "approve" ? verificationNotes : rejectReason
      }
    });

    res.json({
      success: true,
      message: action === "approve" 
        ? "Claim approved for physical release" 
        : "Claim rejected; item reverted to published catalog"
    });
  } catch (error: any) {
    if (error?.statusCode) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    console.error("Claim decision error:", error);
    res.status(500).json({ error: "Failed to execute claim decision" });
  }
});

// Official Physical Handover & Release (Guidance Head Authorization ONLY)
// Atomic concurrency protected against duplicate or concurrent releases
app.post("/api/admin/claims/:id/release", authenticate, requireRoles("guidance_head"), async (req: any, res: any) => {
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

    // Enforce centralized transition validation on claim (must be 'approved')
    const claimTransition = validateClaimTransition(claim, "released", {
      userId: req.user.userId,
      role: req.user.role
    });
    if (!claimTransition.allowed) {
      return res.status(claimTransition.statusCode).json({ error: claimTransition.error });
    }

    // Enforce centralized transition validation on item (must be 'claim_pending' with approved claim)
    const itemTransition = validateItemTransition(claim.item, "released", {
      userId: req.user.userId,
      role: req.user.role
    }, { claim });
    if (!itemTransition.allowed) {
      return res.status(itemTransition.statusCode).json({ error: itemTransition.error });
    }

    // Identity and ownership verification check: ID credentials must be presented
    const resolvedIdType = idTypePresented || "School ID Card";
    const resolvedIdNumber = idNumber || (claim.claimant?.schoolId ? `School ID ${claim.claimant.schoolId}` : null);
    if (!resolvedIdNumber) {
      return res.status(400).json({
        error: "Prerequisite violation: Valid identity verification (ID card number / presented credential) is required to execute physical property release."
      });
    }

    // Atomic transaction: Prevent double release under concurrency
    const result = await prisma.$transaction(async (tx) => {
      // 1. Atomic conditional update on Item
      const itemUpdate = await tx.item.updateMany({
        where: { id: claim.itemId, status: "claim_pending" },
        data: { status: "released" }
      });
      if (itemUpdate.count === 0) {
        throw {
          statusCode: 409,
          message: "Concurrency conflict: Item has already been released or is no longer in claim_pending status."
        };
      }

      // 2. Atomic conditional update on Claim
      const claimUpdate = await tx.claim.updateMany({
        where: { id: claim.id, status: "approved" },
        data: { status: "released" }
      });
      if (claimUpdate.count === 0) {
        throw {
          statusCode: 409,
          message: "Concurrency conflict: Claim has already been released or is no longer in approved status."
        };
      }

      // Fetch approving staff name
      const staffUser = await tx.user.findUnique({ where: { id: req.user.userId } });
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
        idTypePresented: resolvedIdType,
        idNumber: resolvedIdNumber,
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

      // Format clear textual verification summary for database record
      const summaryText = `Physical release to ${releaseRecord.recipientName} (${releaseRecord.recipientSchoolId}). ID Presented: ${releaseRecord.idTypePresented} (#${releaseRecord.idNumber}). Approved by: ${releaseRecord.approvingStaffMember} at ${new Date(releaseRecord.releaseDateTime).toLocaleString()}. Acknowledgment: ${releaseRecord.acknowledgmentOfReceipt.confirmed ? "CONFIRMED & SIGNED" : "PENDING"}.`;

      // Create official Release entry in releases table
      const log = await tx.release.create({
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

      // Record audit status history
      await tx.itemStatusHistory.create({
        data: {
          itemId: claim.itemId,
          fromStatus: "claim_pending",
          toStatus: "released",
          changedBy: req.user.userId,
          reason: `Item officially released to ${releaseRecord.recipientName} (${releaseRecord.recipientSchoolId})`
        }
      });

      // Save digital scanned waiver record in documents table
      await tx.document.create({
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

      const updatedItem = await tx.item.findUnique({ where: { id: claim.itemId } });
      return { log, releaseRecord, updatedItem };
    });

    // Record persistent audit log
    await recordAuditLog(prisma, {
      actorId: req.user.userId,
      action: "item_released",
      entity: "releases",
      entityId: result.log.id,
      metadata: {
        claimId: claim.id,
        itemId: claim.itemId,
        recipientName: result.releaseRecord.recipientName,
        recipientSchoolId: result.releaseRecord.recipientSchoolId,
        idPresented: `${resolvedIdType}: ${resolvedIdNumber}`
      }
    });

    res.json({ 
      success: true, 
      log: result.log, 
      releaseRecord: result.releaseRecord, 
      post: formatPostWithIntake(result.updatedItem),
      item: formatPostWithIntake(result.updatedItem) 
    });
  } catch (error: any) {
    if (error?.statusCode) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    console.error("Release item error:", error);
    res.status(500).json({ error: "Failed to log item release" });
  }
});

// View Specific Claim Handover Log / Release Record
app.get("/api/admin/claims/:id/handover", authenticate, requireRoles("guidance_encoder", "guidance_head", "system_admin", "school_administrator"), async (req: any, res: any) => {
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

// View All Official Releases (Guidance Staff, Admin, School Administrator)
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

app.get("/api/admin/handovers", authenticate, requireRoles("guidance_encoder", "guidance_head", "system_admin", "school_administrator"), handleGetReleases);
app.get("/api/admin/releases", authenticate, requireRoles("guidance_encoder", "guidance_head", "system_admin", "school_administrator"), handleGetReleases);

// -------------------------------------------------------------
// New Dedicated Schema Endpoints (Finders, Documents, History, Verifications)
// -------------------------------------------------------------

// List All Finders (Guidance Office Personnel Only)
app.get("/api/finders", authenticate, requireRoles("guidance_encoder", "guidance_head"), async (_req: any, res: any) => {
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

// Create Finder Record Manually (Guidance Personnel Only - Finders do not have accounts)
app.post("/api/finders", authenticate, requireRoles("guidance_encoder", "guidance_head"), async (req: any, res: any) => {
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

app.get("/api/items/:id/history", authenticate, requireRoles("guidance_encoder", "guidance_head", "system_admin", "school_administrator"), handleGetItemHistory);
app.get("/api/posts/:id/history", authenticate, requireRoles("guidance_encoder", "guidance_head", "system_admin", "school_administrator"), handleGetItemHistory);

// Get Scanned Documents for Item (Staff Only)
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

app.get("/api/items/:id/documents", authenticate, requireRoles("guidance_encoder", "guidance_head", "system_admin", "school_administrator"), handleGetItemDocuments);
app.get("/api/posts/:id/documents", authenticate, requireRoles("guidance_encoder", "guidance_head", "system_admin", "school_administrator"), handleGetItemDocuments);

// Allowed document upload parameters (Phase 2 File Security)
const ALLOWED_DOCUMENT_MIME_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp"
];
const MAX_DOCUMENT_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

// Upload / Attach Scanned Document (Guidance Encoder & Guidance Head, Task 5)
const handleUploadItemDocument = async (req: any, res: any) => {
  const targetItemId = req.params?.id || req.body.itemId || req.body.id;
  const { documentType, fileName, fileSize, mimeType, claimId, releaseId, dispositionCaseId } = req.body;
  const targetFileUrl = req.body.fileUrl || req.body.fileBase64;

  // Validate declared MIME type
  const targetMime = (mimeType || "application/pdf").toLowerCase();
  if (!ALLOWED_DOCUMENT_MIME_TYPES.includes(targetMime)) {
    return res.status(400).json({ 
      error: `Invalid file type '${targetMime}'. Permitted document types: PDF (application/pdf), JPEG (image/jpeg), PNG (image/png), WebP (image/webp).` 
    });
  }

  // Validate File Size
  if (fileSize && (Number(fileSize) > MAX_DOCUMENT_FILE_SIZE || isNaN(Number(fileSize)))) {
    return res.status(400).json({ 
      error: `File size exceeds the permitted limit of 5MB (${MAX_DOCUMENT_FILE_SIZE} bytes).` 
    });
  }

  if (!fileName || !targetFileUrl) {
    return res.status(400).json({ error: "fileName and fileUrl are required" });
  }

  if (!targetItemId) {
    return res.status(400).json({ error: "itemId is required" });
  }

  // Task 5: Deep binary header signature verification (checks magic bytes, actively blocks disguised .exe/.elf)
  const sigResult = verifyFileSignature(targetFileUrl, targetMime);
  if (!sigResult.valid) {
    return res.status(400).json({ error: sigResult.error });
  }

  try {
    const doc = await prisma.document.create({
      data: {
        itemId: targetItemId,
        claimId: claimId || null,
        releaseId: releaseId || null,
        dispositionCaseId: dispositionCaseId || null,
        documentType: documentType || "release_waiver",
        fileName,
        fileUrl: targetFileUrl,
        fileSize: fileSize ? Number(fileSize) : null,
        mimeType: targetMime,
        uploadedBy: req.user.userId
      }
    });

    // Record persistent audit log
    await recordAuditLog(prisma, {
      actorId: req.user.userId,
      action: "document_uploaded",
      entity: "documents",
      entityId: doc.id,
      metadata: {
        itemId: targetItemId,
        fileName,
        mimeType: targetMime,
        documentType: doc.documentType
      }
    });

    res.json({ success: true, document: doc });
  } catch (error) {
    res.status(500).json({ error: "Failed to upload document" });
  }
};

app.post("/api/documents", authenticate, requireRoles("guidance_encoder", "guidance_head"), handleUploadItemDocument);
app.post("/api/items/:id/documents", authenticate, requireRoles("guidance_encoder", "guidance_head"), handleUploadItemDocument);
app.post("/api/posts/:id/documents", authenticate, requireRoles("guidance_encoder", "guidance_head"), handleUploadItemDocument);

// Get Specific Document Record (Staff Only)
app.get("/api/documents/:id", authenticate, requireRoles("guidance_encoder", "guidance_head", "system_admin", "school_administrator"), async (req: any, res: any) => {
  const { id } = req.params;
  try {
    const document = await prisma.document.findUnique({
      where: { id },
      include: {
        uploader: { select: { fullName: true, role: true } },
        item: { select: { id: true, control_no: true, category: true } }
      }
    });
    if (!document) return res.status(404).json({ error: "Document not found" });
    res.json(document);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch document" });
  }
});

// Delete Document Record (Guidance Head & System Admin ONLY, Task 5)
app.delete("/api/documents/:id", authenticate, requireRoles("guidance_head", "system_admin"), async (req: any, res: any) => {
  const { id } = req.params;
  try {
    const document = await prisma.document.findUnique({ where: { id } });
    if (!document) return res.status(404).json({ error: "Document not found" });

    await prisma.document.delete({ where: { id } });

    // Record persistent audit log
    await recordAuditLog(prisma, {
      actorId: req.user.userId,
      action: "document_deleted",
      entity: "documents",
      entityId: id,
      metadata: {
        fileName: document.fileName,
        itemId: document.itemId,
        documentType: document.documentType
      }
    });

    res.json({ success: true, message: "Document deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete document" });
  }
});

// Query Audit Logs (Read-Only, Restricted to Authorized Staff, Task 4)
app.get("/api/admin/audit-logs", authenticate, requireRoles("guidance_head", "school_administrator", "system_admin"), async (req: any, res: any) => {
  const { entity, action, limit = 50, offset = 0 } = req.query;
  try {
    const where: any = {};
    if (entity) where.entity = String(entity);
    if (action) where.action = String(action);

    const [total, logs] = await Promise.all([
      prisma.auditLog.count({ where }),
      prisma.auditLog.findMany({
        where,
        take: Math.min(100, Math.max(1, Number(limit))),
        skip: Math.max(0, Number(offset)),
        orderBy: { createdAt: "desc" },
        include: {
          actor: {
            select: { id: true, fullName: true, email: true, role: true }
          }
        }
      })
    ]);

    res.json({
      total,
      limit: Number(limit),
      offset: Number(offset),
      logs
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch audit logs" });
  }
});

// Get Claim Verifications (Guidance Personnel & System Admin Only)
app.get("/api/claims/:id/verifications", authenticate, requireRoles("guidance_encoder", "guidance_head", "system_admin"), async (req: any, res: any) => {
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

// Add Claim Verification Check (Guidance Personnel Only)
app.post("/api/claims/:id/verifications", authenticate, requireRoles("guidance_encoder", "guidance_head"), async (req: any, res: any) => {
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

// Reports Summary (School Administrator Read-Only, Guidance Head, Guidance Encoder, System Admin)
app.get("/api/admin/reports/summary", authenticate, requireRoles("school_administrator", "guidance_head", "guidance_encoder", "system_admin"), async (_req: any, res: any) => {
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
      totalItems,
      availableItems,
      pendingReviewItems,
      returnedItems,
      disposedItems,
      totalClaims,
      activeClaims,
      completedHandovers,
      recoveryRatePercent: totalItems > 0 ? Math.round((returnedItems / totalItems) * 100) : 0,
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
      configFile: path.resolve(process.cwd(), "vite.config.ts"),
      root: path.resolve(process.cwd(), "frontend"),
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
