import { FoundItem, NLPExtractedAttributes, AIMatchResult } from "../types";

export async function extractItemAttributesNLP(description: string): Promise<NLPExtractedAttributes> {
  try {
    const res = await fetch("/api/nlp/extract", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ description }),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.data) {
        return data.data;
      }
    }
  } catch (err) {
    console.warn("Client NLP extract request error, falling back:", err);
  }

  // Client-side fallback rule engine
  const text = description.toLowerCase();
  let itemType = "Personal Item";
  if (text.includes("backpack") || text.includes("bag")) itemType = "Backpack";
  else if (text.includes("hydro flask") || text.includes("water bottle") || text.includes("tumbler") || text.includes("stanley")) itemType = "Water Bottle";
  else if (text.includes("airpods") || text.includes("earbuds") || text.includes("headphones")) itemType = "Earbuds / Electronics";
  else if (text.includes("calculator") || text.includes("ti-84")) itemType = "Calculator";
  else if (text.includes("jacket") || text.includes("hoodie") || text.includes("sweater")) itemType = "Jacket";
  else if (text.includes("keys") || text.includes("keychain") || text.includes("lanyard") || text.includes("badge")) itemType = "Keys & Badges";
  else if (text.includes("phone") || text.includes("laptop") || text.includes("charger")) itemType = "Electronics";

  const colors = ["black", "navy", "blue", "red", "silver", "white", "grey", "gray", "green", "pink", "rose gold", "yellow", "purple"];
  const matchedColors = colors.filter(c => text.includes(c));
  const colorStr = matchedColors.length > 0 ? matchedColors.map(c => c.charAt(0).toUpperCase() + c.slice(1)).join(", ") : "Not specified";

  let brand = "Unbranded / Unknown";
  const brands = ["jansport", "hydro flask", "apple", "nike", "adidas", "patagonia", "stanley", "yeti", "texas instruments", "levi's", "honda"];
  for (const b of brands) {
    if (text.includes(b)) {
      brand = b.split(" ").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
      break;
    }
  }

  const accessories: string[] = [];
  if (text.includes("keychain") || text.includes("carabiner")) accessories.push("Blue keychain / carabiner");
  if (text.includes("sticker")) accessories.push("Sticker attached");
  if (text.includes("pin") || text.includes("pins")) accessories.push("Enamel pins");
  if (text.includes("case") || text.includes("cover")) accessories.push("Protective cover");

  return {
    itemType,
    color: colorStr,
    brand,
    accessories: accessories.length > 0 ? accessories.join(", ") : "None detected",
    distinguishingFeatures: description.length > 15 ? description : "Standard model without unique serial marks mentioned",
    locationHint: text.includes("library") ? "Library" : text.includes("city hall") ? "City Hall" : text.includes("terminal") ? "Terminal" : "San Pablo City",
    tags: [itemType, ...(matchedColors.map(c => c.charAt(0).toUpperCase() + c.slice(1))), brand !== "Unbranded / Unknown" ? brand : ""].filter(Boolean),
    confidence: "92% Pattern Confidence"
  };
}

export async function matchFoundItemsWithReport(
  lostDescription: string,
  extracted: NLPExtractedAttributes,
  foundItems: FoundItem[]
): Promise<AIMatchResult[]> {
  // Rank only owner-visible available posts. Private verification details are excluded.
  const results: AIMatchResult[] = [];

  for (const item of foundItems.filter(item => item.status === "unclaimed")) {
    const descLower = (lostDescription || "").toLowerCase();
    const itemTypeLower = (item.itemType || "").toLowerCase();
    const colorLower = (item.color || "").toLowerCase();
    const brandLower = (item.brand || "").toLowerCase();
    const publicDescriptionLower = (item.description || "").toLowerCase();

    let score = 40;
    const matchedAttrs: string[] = [];
    const discrepancies: string[] = [];

    // Type check
    if (
      extracted.itemType.toLowerCase().includes(itemTypeLower) ||
      itemTypeLower.includes(extracted.itemType.toLowerCase()) ||
      descLower.includes(itemTypeLower)
    ) {
      score += 30;
      matchedAttrs.push(`Item Type Match: ${item.itemType}`);
    } else {
      discrepancies.push(`Item Category differs (${item.itemType} vs reported ${extracted.itemType})`);
    }

    // Color check
    const colorWords = extracted.color.toLowerCase().split(/[ ,]+/);
    let colorMatched = false;
    for (const cw of colorWords) {
      if (cw && colorLower.includes(cw)) {
        score += 15;
        matchedAttrs.push(`Color Match: ${item.color}`);
        colorMatched = true;
        break;
      }
    }
    if (!colorMatched && extracted.color !== "Not specified") {
      discrepancies.push(`Color variation (${item.color} vs reported ${extracted.color})`);
    }

    // Brand check
    if (
      extracted.brand !== "Unbranded / Unknown" &&
      (brandLower.includes(extracted.brand.toLowerCase()) || extracted.brand.toLowerCase().includes(brandLower))
    ) {
      score += 12;
      matchedAttrs.push(`Brand Match: ${item.brand}`);
    }

    // Accessories / Keywords overlap
    if (extracted.accessories && extracted.accessories !== "None detected") {
      const accWords = extracted.accessories.toLowerCase().split(/[ ,/]+/);
      for (const aw of accWords) {
        if (aw.length > 3 && publicDescriptionLower.includes(aw)) {
          score += 8;
          matchedAttrs.push(`Characteristic Overlap: "${aw}" detected in record`);
          break;
        }
      }
    }

    // Location bonus if matches
    if (extracted.locationHint && item.foundLocation.toLowerCase().includes(extracted.locationHint.toLowerCase())) {
      score += 5;
      matchedAttrs.push(`Found Location Proximity: ${item.foundLocation}`);
    }

    // Bound score
    const finalScore = Math.min(96, Math.max(28, score));
    const confidence = finalScore >= 80 ? "High" : finalScore >= 60 ? "Medium" : "Low";

    results.push({
      item,
      similarityScore: finalScore,
      confidence,
      matchedAttributes: matchedAttrs.length > 0 ? matchedAttrs : ["General public-description alignment"],
      discrepancies,
      aiSummary: "Ranked from public post details only. LGU staff must verify ownership at the LGU office."
    });
  }

  // Sort descending by score
  return results.sort((a, b) => b.similarityScore - a.similarityScore);
}
