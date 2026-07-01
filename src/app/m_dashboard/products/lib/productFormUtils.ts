/**
 * Shared types and pure utility functions used by ProductAddModal
 * and ProductEditModal.
 *
 * Lifted out of productAddModal.tsx so the edit modal does not have
 * to transitively pull in the full add-modal component (~1.9k LOC)
 * just to use a handful of helpers.
 */

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface VariantOption {
  id: string;
  name: string;
  priceAdjustment: number;
  image?: string;
}

export interface Variant {
  id: string;
  name: string;
  pricingMode: "modifier" | "override";
  options: VariantOption[];
}

export interface ProductImage {
  id: string;
  src: string;
  file?: File;
}

export type VariantStockMap = Record<string, number>;
export type VariantPriceMap = Record<string, number>;

export interface FormData {
  name: string;
  sku: string;
  category: string;
  subcategory: string;
  description: string;
  status: "active" | "inactive" | "draft";
  price: number;
  costPrice: number;
  discount: number;
  images: string[];
  stock: number;
  lowStockThreshold: number;
  trackInventory: boolean;
  inventoryStatus: "in_stock" | "out_of_stock";
  hasVariants: boolean;
  variants: Variant[];
  variantStocks: VariantStockMap;
  variantPrices: VariantPriceMap;
}

export const MAX_VARIANTS = 2;

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================
// Pure, side-effect-free utility functions for:
// - ID generation and validation
// - Image source validation (data URIs, https, blobs, relative paths)
// - Variant combination generation (cartesian product)
// - SKU auto-generation from product names
// - HSV/Hex color conversion for the color picker
// - Color name to hex mapping

export const uid = () => Math.random().toString(36).substr(2, 9);

export function isImageSource(value: string): boolean {
  const v = (value || "").trim();
  if (!v) return false;
  if (/^data:image\/[a-zA-Z0-9.+-]+;base64,/i.test(v)) return true;
  if (/^https?:\/\//i.test(v)) return true;
  if (v.startsWith("blob:")) return true;
  if (v.startsWith("/")) return true;
  return false;
}

export function cartesian<T>(arrays: T[][]): T[][] {
  return arrays.reduce<T[][]>(
    (acc, curr) => acc.flatMap((a) => curr.map((b) => [...a, b])),
    [[]]
  );
}

export function buildVariantStockKey(parts: Array<{ variantId: string; optionId: string }>): string {
  return parts
    .map((part) => `${part.variantId}:${part.optionId}`)
    .join("__");
}

export function generateAutoSku(name?: string): string {
  const cleaned = String(name || "")
    .toUpperCase()
    .replace(/[^A-Z0-9\s-]/g, " ")
    .trim();
  const prefix = cleaned
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 3)
    .map((chunk) => chunk.slice(0, 3))
    .join("")
    .slice(0, 9) || "ITEM";
  const suffix = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}-${suffix}`;
}

export function hsvToHex(h: number, s: number, v: number, clamp: (value: number, min: number, max: number) => number): string {
  const hh = ((h % 360) + 360) % 360;
  const sat = clamp(s, 0, 100) / 100;
  const val = clamp(v, 0, 100) / 100;

  const chroma = val * sat;
  const x = chroma * (1 - Math.abs(((hh / 60) % 2) - 1));
  const m = val - chroma;

  let r = 0;
  let g = 0;
  let b = 0;

  if (hh < 60) {
    r = chroma; g = x; b = 0;
  } else if (hh < 120) {
    r = x; g = chroma; b = 0;
  } else if (hh < 180) {
    r = 0; g = chroma; b = x;
  } else if (hh < 240) {
    r = 0; g = x; b = chroma;
  } else if (hh < 300) {
    r = x; g = 0; b = chroma;
  } else {
    r = chroma; g = 0; b = x;
  }

  const toHex = (channel: number) => Math.round((channel + m) * 255).toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
}

export function hexToHsv(hex: string, normalizeHexFn: (value: string) => string | null): { h: number; s: number; v: number } | null {
  const normalized = normalizeHexFn(hex);
  if (!normalized) return null;

  const r = parseInt(normalized.slice(1, 3), 16) / 255;
  const g = parseInt(normalized.slice(3, 5), 16) / 255;
  const b = parseInt(normalized.slice(5, 7), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;

  let h = 0;
  if (delta !== 0) {
    if (max === r) h = 60 * (((g - b) / delta) % 6);
    else if (max === g) h = 60 * ((b - r) / delta + 2);
    else h = 60 * ((r - g) / delta + 4);
  }
  if (h < 0) h += 360;

  const s = max === 0 ? 0 : (delta / max) * 100;
  const v = max * 100;

  return { h: Math.round(h), s: Math.round(s), v: Math.round(v) };
}

export function normalizeHex(value: string): string | null {
  const v = value.trim();
  if (/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(v)) {
    if (v.length === 4) {
      return `#${v[1]}${v[1]}${v[2]}${v[2]}${v[3]}${v[3]}`.toUpperCase();
    }
    return v.toUpperCase();
  }
  return null;
}

export function colorToBg(name: string): string {
  const v = name.trim();
  if (/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(v)) return v;
  const map: Record<string, string> = {
    white: "#DBD5D5",
    red: "#F62424",
    black: "#1F2937",
    blue: "#3B82F6",
    green: "#22C55E",
    yellow: "#FACC15",
    pink: "#EC4899",
    purple: "#A855F7",
    gray: "#9CA3AF",
  };
  return map[v.toLowerCase()] || "#DBD5D5";
}

export function isTextOnlyVariantName(variantName: string): boolean {
  const normalizedName = variantName.trim().toLowerCase();
  return normalizedName === "size" || normalizedName === "frequency";
}
