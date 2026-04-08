/**
 * Smart category grouping that intelligently clusters related product subcategories
 * by pattern matching and semantic understanding, not just exact text matching.
 */

type CategoryPattern = {
  patterns: RegExp[];
  groupName: string;
  priority?: number;
};

type Audience = "men" | "women" | "kids" | "baby" | "unisex" | "general";

function normalizeCategoryText(input: string): string {
  return String(input || "")
    .toLowerCase()
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9\s'/-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function detectAudience(normalized: string): Audience {
  if (/\b(baby|infant|toddler)\b/.test(normalized)) return "baby";
  if (/\b(kid|kids|boy|boys|girl|girls|children|child)\b/.test(normalized)) return "kids";
  if (/\b(unisex)\b/.test(normalized)) return "unisex";
  if (/\b(women|woman|ladies|lady|female|womens|women's)\b/.test(normalized)) return "women";
  if (/\b(men|man|mens|men's|male|gent)\b/.test(normalized)) return "men";
  return "general";
}

function labelWithAudience(audience: Audience, bucket: string): string {
  if (audience === "men") return `Men's ${bucket}`;
  if (audience === "women") return `Women's ${bucket}`;
  if (audience === "kids") return `Kids ${bucket}`;
  if (audience === "baby") return `Baby ${bucket}`;
  if (audience === "unisex") return `Unisex ${bucket}`;
  return bucket;
}

function matchAny(normalized: string, patterns: RegExp[]): boolean {
  return patterns.some((pattern) => pattern.test(normalized));
}

function classifyClothingCategory(raw: string): string | null {
  const normalized = normalizeCategoryText(raw);
  if (!normalized) return null;

  const clothingContext = /\b(apparel|clothing|wear|wears|fashion|outfit|garment|shirt|top|bottom|jacket|hoodie|dress|skirt|innerwear|underwear|lingerie|polo|tee|t-shirt|t shirt)\b/;
  if (!clothingContext.test(normalized)) return null;

  const audience = detectAudience(normalized);

  if (matchAny(normalized, [/\b(underwear|innerwear|bra|brief|boxer|panty|panties|intimate|lingerie|undergarment)\b/])) {
    return labelWithAudience(audience, "Innerwear");
  }

  if (matchAny(normalized, [/\b(jacket|hoodie|coat|blazer|outerwear|parka|windbreaker|cardigan|sweater|knitwear|pullover)\b/])) {
    return labelWithAudience(audience, "Outerwear");
  }

  if (matchAny(normalized, [/\b(pants?|jeans?|trousers?|shorts?|skirts?|leggings?|joggers?|chinos?|cargo)\b/])) {
    return labelWithAudience(audience, "Bottoms");
  }

  if (matchAny(normalized, [/\b(shirt|shirts|polo|polos|tee|tees|t-shirt|t shirts?|blouse|blouses|top|tops|long sleeve|long sleeves|sweat)\b/])) {
    return labelWithAudience(audience, "Tops");
  }

  if (matchAny(normalized, [/\b(sock|socks|shoe|shoes|sneaker|sneakers|boot|boots|heel|heels|sandal|sandals|footwear)\b/])) {
    return labelWithAudience(audience, "Footwear");
  }

  if (matchAny(normalized, [/\b(accessory|accessories|bag|bags|cap|caps|hat|hats|belt|belts|scarf|scarves|glove|gloves)\b/])) {
    return labelWithAudience(audience, "Accessories");
  }

  if (audience === "kids" || audience === "baby") {
    return "Kids & Baby Clothing";
  }

  return labelWithAudience(audience, "Apparel");
}

const SMART_CATEGORY_MAPPINGS: CategoryPattern[] = [
  // === CLOTHING - MENSWEAR ===
  {
    patterns: [
      /men['']?s?\s+(apparel\s+)?[-–]?\s*(polo|shirt|dress\s+shirt|casual\s+shirt|button[\s-]?up|oxford|formal|blouse|top|tee|t[\s-]?shirt)/i,
      /men['']?s?\s+apparel\s+[-–]?\s*(polo|shirt|dress|casual|button|oxford|formal|blouse|top|tee)/i,
    ],
    groupName: "Men's Tops",
    priority: 15,
  },
  {
    patterns: [
      /men['']?s?\s+(apparel\s+)?[-–]?\s*(jeans|trousers|chinos|pants?|shorts?|cargo|joggers?|sweatpants?|bottom)/i,
      /men['']?s?\s+apparel\s+[-–]?\s*(jeans|trouser|chino|pant|short|cargo|jogger|sweatpant|bottom)/i,
    ],
    groupName: "Men's Bottoms",
    priority: 15,
  },
  {
    patterns: [
      /men['']?s?\s+(apparel\s+)?[-–]?\s*(hoodie|sweater|cardigan|pullover|blazer|jacket|coat|vest|outerwear)/i,
      /men['']?s?\s+apparel\s+[-–]?\s*(hoodie|sweater|cardigan|pullover|blazer|jacket|coat|vest)/i,
    ],
    groupName: "Men's Outerwear",
    priority: 15,
  },
  {
    patterns: [
      /men['']?s?\s+(apparel\s+)?[-–]?\s*(sock|shoe|sneaker|boot|loafer|slipper|footwear)/i,
      /men['']?s?\s+apparel\s+[-–]?\s*(sock|shoe|sneaker|boot|loafer|slipper)/i,
    ],
    groupName: "Men's Footwear",
    priority: 15,
  },

  // === CLOTHING - WOMENSWEAR ===
  {
    patterns: [
      /women['']?s?\s+(apparel\s+)?[-–]?\s*(polo|blouse|shirt|top|casual|button[\s-]?up|formal|dress\s+shirt|tee|t[\s-]?shirt)/i,
      /women['']?s?\s+apparel\s+[-–]?\s*(polo|blouse|shirt|top|casual|button|formal|dress|tee)/i,
    ],
    groupName: "Women's Tops",
    priority: 15,
  },
  {
    patterns: [
      /women['']?s?\s+(apparel\s+)?[-–]?\s*(jeans|trousers|chinos|pants?|shorts?|skirt|leggings?|joggers?|sweatpants?|bottom)/i,
      /women['']?s?\s+apparel\s+[-–]?\s*(jeans|trouser|chino|pant|short|skirt|legging|jogger|sweatpant|bottom)/i,
    ],
    groupName: "Women's Bottoms",
    priority: 15,
  },
  {
    patterns: [
      /women['']?s?\s+(apparel\s+)?[-–]?\s*(hoodie|sweater|cardigan|pullover|blazer|jacket|coat|vest|kimono|outerwear)/i,
      /women['']?s?\s+apparel\s+[-–]?\s*(hoodie|sweater|cardigan|pullover|blazer|jacket|coat|vest|kimono)/i,
    ],
    groupName: "Women's Outerwear",
    priority: 15,
  },
  {
    patterns: [
      /women['']?s?\s+(apparel\s+)?[-–]?\s*(sock|shoe|sneaker|boot|loafer|heel|sandal|slipper|footwear)/i,
      /women['']?s?\s+apparel\s+[-–]?\s*(sock|shoe|sneaker|boot|loafer|heel|sandal|slipper)/i,
    ],
    groupName: "Women's Footwear",
    priority: 15,
  },

  // === CLOTHING - UNISEX/GENERAL ===
  {
    patterns: [/unisex\s+(apparel\s+)?[-–]?\s*(hoodie|sweater|sweatshirt|t[\s-]?shirt)/i],
    groupName: "Unisex Basics",
    priority: 14,
  },
  {
    patterns: [/kids?\s+(?:&\s+baby\s+)?clothing|kids?\s+clothing|kids?\s+apparel|baby\s+clothing/i],
    groupName: "Kids & Baby Clothing",
    priority: 14,
  },
  {
    patterns: [/accessory|accessories|hat|cap|beanie|scarf|gloves|belt|bag|backpack/i],
    groupName: "Accessories",
    priority: 10,
  },
  {
    patterns: [/underwear|socks|hosiery|intimates|bra|boxer|brief|undergarment/i],
    groupName: "Undergarments",
    priority: 10,
  },
  {
    patterns: [/sleepwear|pajama|nightgown|robe/i],
    groupName: "Sleepwear",
    priority: 10,
  },
  {
    patterns: [/lingerie|intimates/i],
    groupName: "Lingerie",
    priority: 10,
  },

  // === COMPUTERS - STORAGE ===
  {
    patterns: [/ssd|nvme|solid[\s-]?state|flash|nand|m\.2|2\.5[\s-]?inch\s+ssd|3\.5[\s-]?inch\s+ssd/i],
    groupName: "Storage - SSD",
    priority: 12,
  },
  {
    patterns: [/hdd|hard\s+drive|mechanical|7200\s+rpm|5400\s+rpm|3\.5[\s-]?inch|2\.5[\s-]?inch.*hdd/i],
    groupName: "Storage - HDD",
    priority: 12,
  },
  {
    patterns: [/storage|drive|hard\s+drive|disk|external|portable.*storage/i],
    groupName: "Storage Devices",
    priority: 11,
  },

  // === COMPUTERS - MEMORY ===
  {
    patterns: [/ram|memory|ddr4|ddr5|ddr3|dimm|sodimm|computer\s+memory/i],
    groupName: "Memory",
    priority: 12,
  },

  // === COMPUTERS - PROCESSORS ===
  {
    patterns: [/cpu|processor|intel|amd|ryzen|core|threadripper|xeon|epyc/i],
    groupName: "Processors",
    priority: 12,
  },

  // === COMPUTERS - MOTHERBOARDS ===
  {
    patterns: [/motherboard|mainboard|socket|am4|lga|z590|z690|b550|b450/i],
    groupName: "Motherboards",
    priority: 12,
  },

  // === COMPUTERS - GPU ===
  {
    patterns: [/graphics?\s+card|gpu|geforce|rtx|gtx|radeon|rx|vram|video\s+card/i],
    groupName: "Graphics Cards",
    priority: 12,
  },

  // === COMPUTERS - POWER & COOLING ===
  {
    patterns: [/power\s+supply|psu|watts?|modular|semi[\s-]?modular|bronze|gold|platinum|power\s+unit/i],
    groupName: "Power Supplies",
    priority: 11,
  },
  {
    patterns: [/cooler|heatsink|cooling|cpu\s+cooler|tower|liquid|aio|fan|thermal/i],
    groupName: "Cooling",
    priority: 11,
  },

  // === COMPUTERS - CASES ===
  {
    patterns: [/case|chassis|tower|mid[\s-]?tower|full[\s-]?tower|itx|atx|micro[\s-]?atx/i],
    groupName: "Cases",
    priority: 11,
  },

  // === COMPUTERS - PERIPHERALS ===
  {
    patterns: [/keyboard|mouse|monitor|display|headset|headphone|speaker|webcam|microphone|input|output|peripheral/i],
    groupName: "Peripherals",
    priority: 11,
  },

  // === GENERAL CATCH-ALLS ===
  {
    patterns: [/component|part|computer|pc|system|hardware/i],
    groupName: "Components",
    priority: 5,
  },
];

/**
 * Maps a raw subcategory to a smart grouped category name.
 * Uses pattern matching to intelligently group related items.
 *
 * @param subcategory Raw subcategory name from product
 * @returns Grouped category name, or original if no match
 */
export function mapToSmartCategory(subcategory: string): string {
  if (!subcategory || !subcategory.trim()) return "";

  const clothingCategory = classifyClothingCategory(subcategory);
  if (clothingCategory) return clothingCategory;

  const normalizedSubcategory = normalizeCategoryText(subcategory);

  // Sort by priority (higher first) to ensure best matches win
  const sorted = [...SMART_CATEGORY_MAPPINGS].sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));

  for (const { patterns, groupName } of sorted) {
    for (const pattern of patterns) {
      if (pattern.test(normalizedSubcategory)) {
        return groupName;
      }
    }
  }

  // Fallback: return original if no pattern matches
  return subcategory;
}

/**
 * Takes a list of raw subcategories and applies smart grouping.
 * Returns an organized list of smart category names with deduplication.
 *
 * @param subcategories Array of raw subcategory names
 * @returns Array of smart grouped category names (deduplicated)
 */
export function smartGroupCategories(subcategories: string[]): string[] {
  const grouped = new Map<string, number>();

  // Map each subcategory to its smart group and track count
  for (const sub of subcategories) {
    const smartCat = mapToSmartCategory(sub);
    if (smartCat) {
      grouped.set(smartCat, (grouped.get(smartCat) ?? 0) + 1);
    }
  }

  // Return deduplicated list in order of appearance
  return Array.from(grouped.keys());
}
