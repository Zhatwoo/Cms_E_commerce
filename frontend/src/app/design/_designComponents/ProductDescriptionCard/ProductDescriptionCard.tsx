"use client";

import { useEffect, useState } from "react";
import { useNode, useEditor } from "@craftjs/core";
import { getProduct, listProducts, type ApiProduct } from "@/lib/api";
import { useDesignProject } from "../../_context/DesignProjectContext";
import { ProductDescriptionCardSettings } from "./ProductDescriptionCardSettings";

export type LayoutStyle = "image-left-1" | "image-left-2" | "image-right" | "close-up";

export interface ProductDescriptionCardProps {
  boundProductId?: string;

  // Position
  position?: string;
  top?: string;
  left?: string;
  right?: string;
  bottom?: string;
  zIndex?: number;

  // Layout
  layoutStyle?: LayoutStyle;   // image-left-1 | image-left-2 | image-right | close-up
  stretchFullWidth?: boolean;
  width?: string;
  imageRatio?: number;         // 0.3–0.7, fraction of width for image column

  // Card appearance
  cardBackground?: string;
  cardBorderColor?: string;
  cardBorderWidth?: number;
  cardBorderRadius?: number;
  cardShadow?: string;
  contentPadding?: number;

  // What's displayed
  showProductName?: boolean;
  showDivider?: boolean;
  showPrice?: boolean;
  showComparePrice?: boolean;
  showDiscountName?: boolean;
  showDescription?: boolean;
  descriptionLines?: number;
  showSku?: boolean;
  showStock?: boolean;
  showAddToCart?: boolean;
  showQuantitySelector?: boolean;

  // Text styles
  nameFontSize?: number;
  nameColor?: string;
  nameFontWeight?: string;
  descriptionFontSize?: number;
  descriptionColor?: string;
  priceFontSize?: number;
  priceColor?: string;

  // Button
  buttonLabel?: string;
  buttonBackground?: string;
  buttonTextColor?: string;
  buttonBorderRadius?: number;
  buttonBorderColor?: string;
  buttonBorderWidth?: number;
  buttonFontSize?: number;
  buttonFullWidth?: boolean;
}

const formatPrice = (price: number) =>
  new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" }).format(price);

export const ProductDescriptionCard = ({
  boundProductId,
  position = "absolute", top = "0px", left = "0px", right, bottom, zIndex,
  layoutStyle = "image-left-1",
  stretchFullWidth = false,
  width = "680px",
  imageRatio = 0.5,
  cardBackground = "#ffffff",
  cardBorderColor = "#e5e7eb",
  cardBorderWidth = 1,
  cardBorderRadius = 12,
  cardShadow = "0 4px 20px rgba(0,0,0,0.08)",
  contentPadding = 32,
  showProductName = true,
  showDivider = true,
  showPrice = true,
  showComparePrice = true,
  showDiscountName = true,
  showDescription = true,
  descriptionLines = 6,
  showSku = false,
  showStock = false,
  showAddToCart = true,
  showQuantitySelector = false,
  nameFontSize = 22,
  nameColor = "#0f172a",
  nameFontWeight = "700",
  descriptionFontSize = 14,
  descriptionColor = "#6b7280",
  priceFontSize = 20,
  priceColor = "#0f172a",
  buttonLabel = "View Details",
  buttonBackground = "transparent",
  buttonTextColor = "#0f172a",
  buttonBorderRadius = 6,
  buttonBorderColor = "#0f172a",
  buttonBorderWidth = 1,
  buttonFontSize = 14,
  buttonFullWidth = true,
}: ProductDescriptionCardProps) => {
  const { id, connectors: { connect, drag } } = useNode();
  const { enabled } = useEditor((s) => ({ enabled: s.options.enabled }));
  const { projectSubdomain } = useDesignProject();

  const [product, setProduct] = useState<ApiProduct | null>(null);
  const [loading, setLoading] = useState(!!boundProductId);
  const [qty, setQty] = useState(1);

  useEffect(() => {
    if (!boundProductId) { setProduct(null); setLoading(false); return; }
    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        const direct = await getProduct(boundProductId);
        if (!cancelled && direct.data) {
          setProduct(direct.data);
          setLoading(false);
          return;
        }
      } catch {
        // Fall back to the storefront list below.
      }

      try {
        const res = await listProducts({ subdomain: projectSubdomain ?? undefined });
        if (!cancelled) setProduct(res.items?.find((p) => p.id === boundProductId) ?? null);
      } catch {
        if (!cancelled) setProduct(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [boundProductId, projectSubdomain]);

  const isCloseUp = layoutStyle === "close-up";
  const imageOnRight = layoutStyle === "image-right";
  const imgPct = `${Math.round(imageRatio * 100)}%`;
  const contentPct = `${Math.round((1 - imageRatio) * 100)}%`;

  const cardStyle: React.CSSProperties = {
    width: stretchFullWidth ? "100%" : width,
    background: cardBackground,
    border: `${cardBorderWidth}px solid ${cardBorderColor}`,
    borderRadius: cardBorderRadius,
    boxShadow: cardShadow,
    overflow: "hidden",
    boxSizing: "border-box",
    display: isCloseUp ? "block" : "flex",
    flexDirection: imageOnRight ? "row-reverse" : "row",
    position: position as any,
    top: top ?? undefined, left: left ?? undefined,
    right: right ?? undefined, bottom: bottom ?? undefined,
    zIndex: zIndex ?? undefined,
    minHeight: isCloseUp ? undefined : 320,
  };

  const image = product?.images?.[0] ?? "";
  const price = product ? (product.finalPrice ?? product.price ?? 0) : 0;
  const compareAt = product?.compareAtPrice;
  const hasDiscount = !!compareAt && compareAt > price;
  const discountPct = hasDiscount ? Math.round(((compareAt! - price) / compareAt!) * 100) : 0;
  const isInStock = (product?.availableStock ?? product?.stock ?? 1) > 0;

  // ── Placeholder ──────────────────────────────────────────────────────────
  if (!boundProductId || loading || !product) {
    return (
      <div ref={(ref) => { if (ref) connect(drag(ref)); }} data-node-id={id} style={cardStyle}>
        {/* Image placeholder */}
        <div style={{
          width: isCloseUp ? "100%" : imgPct,
          height: isCloseUp ? 280 : "auto",
          minHeight: isCloseUp ? undefined : 320,
          background: "#f3f4f6",
          display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center", gap: 8,
          flexShrink: 0,
        }}>
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="1.5">
            <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/>
          </svg>
          {enabled && <span style={{ fontSize: 11, color: "#9ca3af" }}>{loading ? "Loading…" : "No product bound"}</span>}
        </div>
        {/* Content placeholder */}
        {!isCloseUp && (
          <div style={{ flex: 1, padding: contentPadding, display: "flex", flexDirection: "column", gap: 12, justifyContent: "center" }}>
            <div style={{ height: 22, background: "#e5e7eb", borderRadius: 4, width: "80%" }} />
            <div style={{ height: 2, background: "#f3f4f6", borderRadius: 1 }} />
            <div style={{ height: 14, background: "#f3f4f6", borderRadius: 3 }} />
            <div style={{ height: 14, background: "#f3f4f6", borderRadius: 3, width: "90%" }} />
            <div style={{ height: 14, background: "#f3f4f6", borderRadius: 3, width: "75%" }} />
            <div style={{ height: 24, background: "#e5e7eb", borderRadius: 3, width: "30%", marginTop: 8 }} />
            {showAddToCart && <div style={{ height: 42, background: "#e5e7eb", borderRadius: buttonBorderRadius, marginTop: 4 }} />}
          </div>
        )}
      </div>
    );
  }

  // ── Image column ─────────────────────────────────────────────────────────
  const imageCol = (
    <div style={{
      width: isCloseUp ? "100%" : imgPct,
      height: isCloseUp ? 320 : "auto",
      flexShrink: 0,
      position: "relative",
      overflow: "hidden",
    }}>
      {image ? (
        <img src={image} alt={product.name} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", minHeight: isCloseUp ? 320 : 320 }} />
      ) : (
        <div style={{ width: "100%", height: "100%", minHeight: 320, background: "#f3f4f6", display: "flex", alignItems: "center", justifyContent: "center", color: "#9ca3af", fontSize: 12 }}>No image</div>
      )}
      {showDiscountName && hasDiscount && (
        <span style={{ position: "absolute", top: 12, left: 12, background: "#dc2626", color: "#fff", fontSize: 11, fontWeight: 700, padding: "3px 8px", borderRadius: 4 }}>
          {discountPct}% Off
        </span>
      )}
    </div>
  );

  // ── Content column ───────────────────────────────────────────────────────
  const contentCol = !isCloseUp ? (
    <div style={{
      width: contentPct, padding: contentPadding,
      display: "flex", flexDirection: "column",
      justifyContent: "center", gap: 10, flex: 1,
    }}>
      {showProductName && (
        <h2 style={{ fontSize: nameFontSize, fontWeight: nameFontWeight, color: nameColor, margin: 0, lineHeight: 1.3 }}>
          {product.name}
        </h2>
      )}
      {showDivider && <hr style={{ border: "none", borderTop: "2px solid #e5e7eb", margin: "2px 0", width: 40 }} />}
      {showDescription && product.description && (
        <p style={{
          fontSize: descriptionFontSize, color: descriptionColor, margin: 0, lineHeight: 1.7,
          display: "-webkit-box", WebkitLineClamp: descriptionLines,
          WebkitBoxOrient: "vertical", overflow: "hidden",
        }}>
          {product.description}
        </p>
      )}
      {showSku && product.sku && (
        <p style={{ fontSize: 11, color: "#9ca3af", margin: 0 }}>SKU: {product.sku}</p>
      )}
      {showPrice && (
        <div style={{ display: "flex", alignItems: "baseline", gap: 8, flexWrap: "wrap", marginTop: 4 }}>
          <span style={{ fontSize: priceFontSize, fontWeight: 700, color: priceColor }}>{formatPrice(price)}</span>
          {showComparePrice && hasDiscount && (
            <span style={{ fontSize: priceFontSize - 4, color: "#9ca3af", textDecoration: "line-through" }}>{formatPrice(compareAt!)}</span>
          )}
        </div>
      )}
      {showStock && (
        <span style={{ fontSize: 12, fontWeight: 600, color: isInStock ? "#16a34a" : "#dc2626" }}>
          {isInStock ? "In Stock" : "Out of Stock"}
        </span>
      )}
      {showAddToCart && (
        <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 8 }}>
          {showQuantitySelector && (
            <div style={{ display: "flex", alignItems: "center", border: "1px solid #e5e7eb", borderRadius: 6, overflow: "hidden", flexShrink: 0 }}>
              <button type="button" onClick={() => setQty(q => Math.max(1, q - 1))} style={{ width: 32, height: 40, background: "#f9fafb", border: "none", cursor: "pointer", fontSize: 16, color: "#374151" }}>−</button>
              <span style={{ width: 36, textAlign: "center", fontSize: 13, fontWeight: 600, color: "#111827" }}>{qty}</span>
              <button type="button" onClick={() => setQty(q => q + 1)} style={{ width: 32, height: 40, background: "#f9fafb", border: "none", cursor: "pointer", fontSize: 16, color: "#374151" }}>+</button>
            </div>
          )}
          <button type="button" style={{
            flex: buttonFullWidth ? 1 : undefined,
            padding: "11px 24px",
            background: buttonBackground, color: buttonTextColor,
            border: `${buttonBorderWidth}px solid ${buttonBorderColor}`,
            borderRadius: buttonBorderRadius, fontSize: buttonFontSize,
            fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap",
          }}>
            {buttonLabel}
          </button>
        </div>
      )}
    </div>
  ) : null;

  return (
    <div ref={(ref) => { if (ref) connect(drag(ref)); }} data-node-id={id} style={cardStyle}>
      {imageCol}
      {contentCol}
    </div>
  );
};

ProductDescriptionCard.craft = {
  displayName: "Product Description Card",
  props: {
    boundProductId: undefined,
    position: "absolute", top: "0px", left: "0px",
    layoutStyle: "image-left-1",
    stretchFullWidth: false,
    width: "680px",
    imageRatio: 0.5,
    cardBackground: "#ffffff", cardBorderColor: "#e5e7eb",
    cardBorderWidth: 1, cardBorderRadius: 12,
    cardShadow: "0 4px 20px rgba(0,0,0,0.08)",
    contentPadding: 32,
    showProductName: true, showDivider: true,
    showPrice: true, showComparePrice: true, showDiscountName: true,
    showDescription: true, descriptionLines: 6,
    showSku: false, showStock: false,
    showAddToCart: true, showQuantitySelector: false,
    nameFontSize: 22, nameColor: "#0f172a", nameFontWeight: "700",
    descriptionFontSize: 14, descriptionColor: "#6b7280",
    priceFontSize: 20, priceColor: "#0f172a",
    buttonLabel: "View Details",
    buttonBackground: "transparent", buttonTextColor: "#0f172a",
    buttonBorderRadius: 6, buttonBorderColor: "#0f172a",
    buttonBorderWidth: 1, buttonFontSize: 14, buttonFullWidth: true,
  },
  custom: {},
  related: { settings: ProductDescriptionCardSettings },
  rules: { canDrag: () => true, canDrop: () => true, canMoveIn: () => false },
  isCanvas: false,
};
