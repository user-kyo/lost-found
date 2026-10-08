import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

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
    "Keys & Cards": ["keys", "keychain", "id card", "student id", "badge", "wallet", "purse", "lanyard"],
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
  const locations = ["library", "cafeteria", "gym", "auditorium", "room 204", "science lab", "hallway", "bleachers", "field", "computer lab", "bus stop", "locker room", "parking lot", "quad"];
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
    locationHint: locationHint || "Unknown campus area",
    confidence: "High (Pattern Extracted)",
    tags: [itemType, ...(foundColors), foundBrand, ...accessories].filter(Boolean)
  };
}

// API Routes
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
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
    aiSummary: "The TF-IDF server could not be reached. Physical verification required."
  });
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
    console.log(`Smart Lost & Found Server running on port ${PORT}`);
  });
}

setupApp();
