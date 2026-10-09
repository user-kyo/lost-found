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

// Fallback rule-based NLP extraction if Gemini is offline or without API key
function ruleBasedExtract(description: string) {
  const text = description.toLowerCase();
  
  // Item type detection
  let itemType = "Personal Item";
  const types: Record<string, string[]> = {
    "Backpack": ["backpack", "bag", "rucksack", "knapsack", "tote", "duffel"],
    "Water Bottle": ["hydro flask", "water bottle", "flask", "tumbler", "yeti", "thermos", "stanley"],
    "Electronics": ["airpods", "earbuds", "headphones", "phone", "iphone", "ipad", "tablet", "laptop", "macbook", "charger", "calculator", "ti-84", "casio"],
    "Apparel": ["jacket", "hoodie", "sweater", "coat", "hat", "cap", "scarf", "gloves", "glasses", "sunglasses"],
    "Keys & Cards": ["keys", "keychain", "id card", "badge", "wallet", "purse", "lanyard"],
    "Stationery / Books": ["notebook", "binder", "textbook", "pencil case", "folder", "book", "planner"]
  };

  for (const [category, keywords] of Object.entries(types)) {
    for (const kw of keywords) {
      if (text.includes(kw)) {
        itemType = kw.charAt(0).toUpperCase() + kw.slice(1);
        break;
      }
    }
    if (itemType !== "Personal Item") break;
  }

  // Color detection
  const colors = ["black", "blue", "navy", "red", "silver", "gray", "grey", "white", "green", "yellow", "pink", "purple", "orange", "gold", "teal", "maroon", "beige"];
  const foundColors: string[] = [];
  for (const c of colors) {
    if (new RegExp(`\\b${c}\\b`, "i").test(text)) {
      foundColors.push(c.charAt(0).toUpperCase() + c.slice(1));
    }
  }

  // Brand detection
  const brands = ["jansport", "hydro flask", "apple", "nike", "adidas", "north face", "patagonia", "stanley", "yeti", "sony", "samsung", "herschel", "casio", "texas instruments", "lululemon", "champion", "under armour", "anker"];
  let foundBrand = "";
  for (const b of brands) {
    if (text.includes(b)) {
      foundBrand = b.split(" ").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
      break;
    }
  }

  // Accessory / marks detection
  const accessories: string[] = [];
  if (text.includes("keychain") || text.includes("key ring")) accessories.push("Keychain");
  if (text.includes("sticker") || text.includes("stickers")) accessories.push("Sticker(s)");
  if (text.includes("strap")) accessories.push("Shoulder Strap");
  if (text.includes("case") || text.includes("cover")) accessories.push("Protective Case");
  if (text.includes("lanyard")) accessories.push("Lanyard attached");
  if (text.includes("scratch") || text.includes("dent") || text.includes("initials")) accessories.push("Distinguishing mark / wear");

  // Location detection
  const locations = ["library", "city hall", "plaza", "terminal", "lgu office", "public market", "barangay hall", "park"];
  let locationHint = "";
  for (const loc of locations) {
    if (text.includes(loc)) {
      locationHint = loc.charAt(0).toUpperCase() + loc.slice(1);
      break;
    }
  }

  return {
    itemType: itemType || "Unspecified Item",
    color: foundColors.length > 0 ? foundColors.join(", ") : "Not specified",
    brand: foundBrand || "Unbranded / Unknown",
    accessories: accessories.length > 0 ? accessories.join(", ") : "None mentioned",
    distinguishingFeatures: text.length > 20 ? description : "Standard model without unique serial marks mentioned",
    locationHint: locationHint || "San Pablo City area",
    confidence: "High (Pattern Extracted)",
    tags: [itemType, ...(foundColors), foundBrand, ...accessories].filter(Boolean)
  };
}

// API Routes
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// --- Auth Routes ---
const generateToken = (userId: string, role: string) => {
  return jwt.sign({ userId, role }, JWT_SECRET, { expiresIn: '7d' });
};

// Middleware to verify token (we can use this for protected routes later)
const authenticate = (req: any, res: any, next: any) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid token" });
  }
};

app.post("/api/auth/register", async (req, res) => {
  try {
    const { role, fullName, email, phone, password, idType, idLast4 } = req.body;
    
    // Check if email exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: "Email already exists" });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    
    const user = await prisma.user.create({
      data: {
        role: role || "owner",
        fullName,
        email,
        phone,
        passwordHash,
        idType: role === "citizen" ? idType : null,
        idLast4: role === "citizen" ? idLast4 : null,
      }
    });

    const token = generateToken(user.id, user.role);
    res.json({ token, user: { id: user.id, fullName: user.fullName, role: user.role, email: user.email } });
  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({ error: "Failed to register" });
  }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = generateToken(user.id, user.role);
    res.json({ token, user: { id: user.id, fullName: user.fullName, role: user.role, email: user.email } });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Failed to login" });
  }
});

app.get("/api/auth/me", authenticate, async (req: any, res: any) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user.userId } });
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json({ user: { id: user.id, fullName: user.fullName, role: user.role, email: user.email } });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch user" });
  }
});

// --- Finder Post Routes ---

// Sensitive Details Checker (Section 6.4)
function checkSensitiveDetails(text: string) {
  const flags = [];
  const lower = text.toLowerCase();
  
  if (/\d{6,}/.test(text)) {
    flags.push("Contains 6 or more consecutive digits (possible ID/phone).");
  }
  // Check for alphanumeric strings of 8+ characters mixing letters and digits
  const words = text.split(/\s+/);
  for (const word of words) {
    if (word.length >= 8 && /[a-zA-Z]/.test(word) && /\d/.test(word)) {
      flags.push(`Contains long alphanumeric string: ${word} (possible serial number).`);
      break;
    }
  }

  const keywords = ['serial', 'imei', 'plate', 'id no', 'license no', 'card no', 'account', 'name is', 'owned by'];
  for (const kw of keywords) {
    if (lower.includes(kw)) {
      flags.push(`Contains sensitive keyword: '${kw}'.`);
    }
  }
  return flags;
}

app.post("/api/posts", authenticate, async (req: any, res: any) => {
  if (!["citizen", "finder", "owner"].includes(req.user.role)) {
    return res.status(403).json({ error: "Only citizens can create posts" });
  }

  try {
    const { category, color, publicDescription, dateFound, areaFound, privateDetails, imageUrl } = req.body;
    
    // Create post
    const post = await prisma.post.create({
      data: {
        finderId: req.user.userId,
        category,
        color,
        publicDescription,
        dateFound: new Date(dateFound),
        areaFound,
        imageUrl,
        status: "pending_review",
        privateDetails: {
          create: {
            details: privateDetails
          }
        }
      }
    });

    // Run Rule-Based Sensitive Flags Check
    const sensitiveFlags = checkSensitiveDetails(publicDescription);
    for (const detail of sensitiveFlags) {
      await prisma.postFlag.create({
        data: {
          postId: post.id,
          type: "sensitive",
          detail
        }
      });
    }

    // [TODO] Call Python Backend here later for Duplicate Flagging

    res.json({ success: true, post, flagsTriggered: sensitiveFlags.length });
  } catch (error) {
    console.error("Create post error:", error);
    res.status(500).json({ error: "Failed to create post" });
  }
});

app.get("/api/posts/mine", authenticate, async (req: any, res: any) => {
  try {
    const posts = await prisma.post.findMany({
      where: { finderId: req.user.userId },
      include: { privateDetails: true, flags: true }
    });
    res.json(posts);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch posts" });
  }
});

// --- Owner Search Routes ---

app.post("/api/search", authenticate, async (req: any, res: any) => {
  if (!["citizen", "finder", "owner"].includes(req.user.role)) {
    return res.status(403).json({ error: "Only citizens can perform searches" });
  }

  const { query } = req.body;
  if (!query) return res.status(400).json({ error: "Missing query" });

  try {
    // 1. Fetch available posts from DB (Only public fields as per Section 2.1)
    const availablePosts = await prisma.post.findMany({
      where: { status: "available" },
      select: {
        id: true,
        category: true,
        color: true,
        publicDescription: true,
        dateFound: true,
        areaFound: true
      }
    });

    // Log the search
    await prisma.searchLog.create({
      data: {
        userId: req.user.userId,
        queryText: query,
        resultCount: availablePosts.length // Wil update when Python ranking is added
      }
    });

    // Call Python Backend here to rank 'availablePosts' using TF-IDF 
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
      console.error("Python NLP search failed, falling back to unranked", err);
    }

    // Temporarily returning unranked available posts if Python fails
    res.json(availablePosts);
  } catch (error) {
    console.error("Search error:", error);
    res.status(500).json({ error: "Failed to search" });
  }
});

// --- Admin Routes ---

app.get("/api/admin/review-queue", authenticate, async (req: any, res: any) => {
  if (req.user.role !== "admin") return res.status(403).json({ error: "Forbidden" });

  try {
    const queue = await prisma.post.findMany({
      where: { status: "pending_review" },
      include: { privateDetails: true, flags: true, finder: { select: { fullName: true } } }
    });
    res.json(queue);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch queue" });
  }
});

app.post("/api/admin/posts/:id/:action", authenticate, async (req: any, res: any) => {
  if (req.user.role !== "admin") return res.status(403).json({ error: "Forbidden" });
  
  const { id, action } = req.params; // action can be: approve, reject, merge
  const { note } = req.body;

  try {
    const newStatus = action === "approve" ? "available" : action === "reject" ? "rejected" : null;
    if (!newStatus) return res.status(400).json({ error: "Invalid action" });

    const post = await prisma.post.update({
      where: { id },
      data: {
        status: newStatus,
        reviewedBy: req.user.userId,
        reviewedAt: new Date()
      }
    });

    await prisma.reviewAction.create({
      data: {
        postId: id,
        adminId: req.user.userId,
        action,
        note
      }
    });

    // [TODO] If newStatus is 'available', notify Python backend to rebuild TF-IDF matrix (Section 13)

    res.json({ success: true, post });
  } catch (error) {
    console.error("Admin review error:", error);
    res.status(500).json({ error: "Failed to process review" });
  }
});

// NLP Attribute Extraction Route
app.post("/api/nlp/extract", async (req, res) => {
  const { description } = req.body;
  if (!description || typeof description !== "string") {
    res.status(400).json({ error: "Missing description" });
    return;
  }

  try {
    const pyResponse = await fetch("http://127.0.0.1:8000/api/extract", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ description })
    });
    
    if (pyResponse.ok) {
      const data = await pyResponse.json();
      res.json(data);
      return;
    }
  } catch (error) {
    console.error("Failed to connect to Python TF-IDF backend, falling back:", error);
  }

  const fallback = ruleBasedExtract(description);
  res.json({ success: true, source: "rule_engine_fallback", data: fallback });
});

// Advanced Match Scoring & Breakdown Endpoint
app.post("/api/nlp/match-analyze", async (req, res) => {
  const { lostDescription, lostAttributes, foundItem } = req.body;
  if (!foundItem) {
    res.status(400).json({ error: "Missing found item details" });
    return;
  }

  try {
    const pyResponse = await fetch("http://127.0.0.1:8000/api/match-analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lostDescription, lostAttributes, foundItem })
    });
    
    if (pyResponse.ok) {
      const data = await pyResponse.json();
      res.json(data);
      return;
    }
  } catch (error) {
    console.error("Failed to connect to Python TF-IDF backend for matching:", error);
  }

  // Fallback
  res.json({
    similarityScore: 50,
    confidence: "Medium",
    matchedAttributes: ["Fallback match calculation used"],
    discrepancies: ["Python TF-IDF server unreachable"],
    aiSummary: "The TF-IDF server could not be reached. LGU office verification is required."
  });
});

// --- Claim Routes ---

app.post("/api/claims", authenticate, async (req: any, res: any) => {
  if (!["citizen", "owner", "finder"].includes(req.user.role)) {
    return res.status(403).json({ error: "Only citizens can submit claims" });
  }
  
  const { postId, ownerNote } = req.body;
  
  try {
    const claim = await prisma.claim.create({
      data: {
        postId,
        ownerId: req.user.userId,
        status: "submitted",
        ownerNote,
        chatThreads: {
          create: {
            status: "open"
          }
        }
      },
      include: { chatThreads: true }
    });

    // Mark post as claim_pending
    await prisma.post.update({
      where: { id: postId },
      data: { status: "claim_pending" }
    });

    res.json({ success: true, claim });
  } catch (error) {
    console.error("Submit claim error:", error);
    res.status(500).json({ error: "Failed to submit claim" });
  }
});

app.get("/api/claims/mine", authenticate, async (req: any, res: any) => {
  try {
    const claims = await prisma.claim.findMany({
      where: { ownerId: req.user.userId },
      include: {
        post: true,
      },
      orderBy: { createdAt: "desc" }
    });
    res.json(claims);
  } catch (error) {
    console.error("Fetch my claims error:", error);
    res.status(500).json({ error: "Failed to fetch claims" });
  }
});

app.get("/api/admin/claims", authenticate, async (req: any, res: any) => {
  if (req.user.role !== "admin") return res.status(403).json({ error: "Forbidden" });

  try {
    const claims = await prisma.claim.findMany({
      include: {
        post: { include: { privateDetails: true } },
        owner: { select: { fullName: true, email: true } },
        chatThreads: true
      },
      orderBy: { createdAt: "desc" }
    });
    res.json(claims);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch claims" });
  }
});

app.post("/api/admin/claims/:id/:action", authenticate, async (req: any, res: any) => {
  if (req.user.role !== "admin") return res.status(403).json({ error: "Forbidden" });
  
  const { id, action } = req.params; 
  // action can be: approve (starts chat/handover), reject, complete (handover done)
  
  try {
    const claim = await prisma.claim.findUnique({ where: { id }, include: { post: true } });
    if (!claim) return res.status(404).json({ error: "Claim not found" });

    let newStatus = claim.status;
    let postStatus = undefined;

    if (action === "approve") {
      newStatus = "approved"; // Meaning approved to proceed to handover
    } else if (action === "reject") {
      newStatus = "rejected";
      postStatus = "available"; // Post goes back to search
    } else if (action === "complete") {
      newStatus = "completed";
      postStatus = "returned"; // Handover complete
      
      // We should log handover
      const { claimantIdType, questionsAsked, result, notes } = req.body;
      const post = await prisma.post.findUnique({ where: { id: claim.postId }});
      if (post) {
        await prisma.handoverLog.create({
          data: {
            claimId: claim.id,
            postId: claim.postId,
            adminId: req.user.userId,
            claimantName: req.body.claimantName || "Unknown",
            claimantIdType: claimantIdType || "ID",
            finderId: post.finderId,
            questionsAsked: questionsAsked || "Standard check",
            result: result || "Success",
            notes: notes
          }
        });
      }
    }

    await prisma.claim.update({
      where: { id },
      data: { 
        status: newStatus,
        decidedBy: req.user.userId,
        decidedAt: new Date()
      }
    });

    if (postStatus) {
      await prisma.post.update({
        where: { id: claim.postId },
        data: { status: postStatus }
      });
    }

    res.json({ success: true });
  } catch (error) {
    console.error("Admin claim action error:", error);
    res.status(500).json({ error: "Failed to process claim" });
  }
});

// --- Chat Routes ---

app.get("/api/claims/:id/chat", authenticate, async (req: any, res: any) => {
  const { id } = req.params;
  try {
    const claim = await prisma.claim.findUnique({
      where: { id },
      include: {
        post: true,
        chatThreads: {
          include: {
            messages: {
              include: { sender: { select: { fullName: true, role: true } } },
              orderBy: { createdAt: "asc" }
            }
          }
        }
      }
    });

    if (!claim) return res.status(404).json({ error: "Claim not found" });

    // Access control: Only owner, finder, or admin can view
    const isOwner = claim.ownerId === req.user.userId;
    const isFinder = claim.post.finderId === req.user.userId;
    const isAdmin = req.user.role === "admin";

    if (!isOwner && !isFinder && !isAdmin) {
      return res.status(403).json({ error: "Forbidden" });
    }

    const thread = claim.chatThreads[0];
    res.json(thread);
  } catch (error) {
    console.error("Fetch chat error:", error);
    res.status(500).json({ error: "Failed to fetch chat" });
  }
});

app.post("/api/claims/:id/complete-external", authenticate, async (req: any, res: any) => {
  const { id } = req.params;
  
  try {
    const claim = await prisma.claim.findUnique({ where: { id }, include: { post: true } });
    if (!claim) return res.status(404).json({ error: "Claim not found" });

    // Mark claim as released
    const updatedClaim = await prisma.claim.update({
      where: { id },
      data: { status: "released" }
    });

    await prisma.post.update({
      where: { id: claim.postId },
      data: { status: "returned" }
    });

    // Close any associated open chat threads
    await prisma.chatThread.updateMany({
      where: { claimId: claim.id, status: "open" },
      data: { status: "closed" }
    });

    // Create a mock handover log to fulfill schema requirements
    await prisma.handoverLog.create({
      data: {
        claimId: claim.id,
        postId: claim.postId,
        adminId: req.user.userId,
        claimantName: "External Meetup Confirmed",
        claimantIdType: "N/A",
        finderId: claim.post?.finderId || req.user.userId, // We need to make sure we have finderId. Let's assume it was fetched, or we fallback
        questionsAsked: "N/A - External Independent Meetup",
        result: "Success",
        notes: "Item returned via external independent meetup. Confirmed by user."
      }
    });

    res.json({ success: true, updatedClaim });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/chats/:threadId/messages", authenticate, async (req: any, res: any) => {
  const { threadId } = req.params;
  const { body, imageUrl } = req.body;

  try {
    const message = await prisma.chatMessage.create({
      data: {
        threadId,
        senderId: req.user.userId,
        body,
        imageUrl,
        isStaff: req.user.role === "admin"
      },
      include: {
        sender: { select: { fullName: true, role: true } }
      }
    });
    res.json({ success: true, message });
  } catch (error) {
    console.error("Send message error:", error);
    res.status(500).json({ error: "Failed to send message" });
  }
});

// Vite / Static Files handler
async function setupApp() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
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
    console.log(`BalikHub Lost & Found Server running on port ${PORT}`);
  });
}

setupApp();
