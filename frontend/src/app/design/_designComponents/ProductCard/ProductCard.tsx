"use client";

import { useEffect, useMemo, useState } from "react";
import { useNode, useEditor } from "@craftjs/core";
import { getProduct, listProducts, type ApiProduct } from "@/lib/api";
import { useDesignProject } from "../../_context/DesignProjectContext";
import { ProductCardSettings } from "./ProductCardSettings";
import { ProductImageOverlays } from "../productOverlays";
export interface ProductCardProps {
  // Product binding
  boundProductId?: string;

  // Position (for canvas drag)
  position?: string;
  top?: string;
  left?: string;
  right?: string;
  bottom?: string;
  zIndex?: number;

  // Layout toggles
  showImage?: boolean;
  showProductName?: boolean;
  showPrice?: boolean;
  showDescription?: boolean;
  showDivider?: boolean;
  showDiscountBadge?: boolean;
  showRibbon?: boolean;
  ribbonText?: string;
  ribbonColor?: string;
  showAddToCart?: boolean;
  showQuickView?: boolean;
  imageHeight?: number;
  imageObjectFit?: "cover" | "contain" | "fill";

  // Card design
  width?: string;
  cardBackground?: string;
  cardBorderColor?: string;
  cardBorderWidth?: number;
  cardBorderRadius?: number;
  cardPadding?: number;
  cardShadow?: string;

  // Text design
  nameFontSize?: number;
  nameColor?: string;
  nameFontWeight?: string;
  priceFontSize?: number;
  priceColor?: string;
  descriptionFontSize?: number;
  descriptionColor?: string;
  descriptionLines?: number;

  // Button design
  buttonLabel?: string;
  buttonBackground?: string;
  buttonTextColor?: string;
  buttonBorderRadius?: number;
  buttonBorderColor?: string;
  buttonBorderWidth?: number;
  buttonFontSize?: number;
}

const formatPrice = (price: number) =>
  new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" }).format(price);

const parsePixelWidth = (value?: string) => {
  if (!value) return undefined;
  const match = value.trim().match(/^([0-9]+(?:\.[0-9]+)?)px$/i);
  return match ? Number.parseFloat(match[1]) : undefined;
};

export const ProductCard = ({
  boundProductId,
  position = "absolute",
  top = "0px",
  left = "0px",
  right,
  bottom,
  zIndex,
  showImage = true,
  showProductName = true,
  showPrice = true,
  showDescription = false,
  showDivider = false,
  showDiscountBadge = true,
  showRibbon = false,
  ribbonText = "Sale",
  ribbonColor = "#ef4444",
  showAddToCart = true,
  showQuickView = false,
  imageHeight = 240,
  imageObjectFit = "cover",
  width = "280px",
  cardBackground = "#ffffff",
  cardBorderColor = "#e5e7eb",
  cardBorderWidth = 1,
  cardBorderRadius = 10,
  cardPadding = 12,
  cardShadow = "none",
  nameFontSize = 14,
  nameColor = "#111827",
  nameFontWeight = "700",
  priceFontSize = 14,
  priceColor = "#111827",
  descriptionFontSize = 12,
  descriptionColor = "#6b7280",
  descriptionLines = 2,
  buttonLabel = "Add to Cart",
  buttonBackground = "#111827",
  buttonTextColor = "#ffffff",
  buttonBorderRadius = 6,
  buttonBorderColor = "transparent",
  buttonBorderWidth = 0,
  buttonFontSize = 13,
}: ProductCardProps) => {
  const { id, connectors: { connect, drag } } = useNode();
  const { enabled, query } = useEditor((s) => ({ enabled: s.options.enabled }));
  const { projectSubdomain } = useDesignProject();

  const [products, setProducts] = useState<ApiProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [explicitProduct, setExplicitProduct] = useState<ApiProduct | null>(null);

  const autoBindIndex = useMemo(() => {
    try {
      const state = query.getState();
      const nodes = state.nodes ?? {};
      const allProductCards = Object.entries(nodes)
        .filter(([, node]) => {
          const displayName = String(node?.data?.displayName || "").trim().toLowerCase();
          return displayName === "product card" || displayName === "productcard";
        })
        .map(([nodeId, node]) => {
          const props = (node?.data?.props || {}) as Record<string, unknown>;
          const y = Number(props.canvasY);
          const x = Number(props.canvasX);
          return {
            nodeId,
            y: Number.isFinite(y) ? y : 0,
            x: Number.isFinite(x) ? x : 0,
          };
        })
        .sort((a, b) => {
          if (a.y !== b.y) return a.y - b.y;
          if (a.x !== b.x) return a.x - b.x;
          return a.nodeId.localeCompare(b.nodeId);
        });

      const foundIndex = allProductCards.findIndex((entry) => entry.nodeId === id);
      return foundIndex >= 0 ? foundIndex : 0;
    } catch {
      return 0;
    }
  }, [query, id]);

  const resolvedProductId = useMemo(() => {
    if (boundProductId) return boundProductId;
    if (products.length === 0) return undefined;
    return products[autoBindIndex % products.length]?.id;
  }, [boundProductId, products, autoBindIndex]);

  const product = useMemo(() => {
    if (explicitProduct) return explicitProduct;
    if (!resolvedProductId) return null;
    return products.find((item) => item.id === resolvedProductId) ?? null;
  }, [explicitProduct, products, resolvedProductId]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    if (boundProductId) {
      getProduct(boundProductId)
        .then((res) => {
          if (!cancelled) {
            setExplicitProduct(res.data ?? null);
          }
        })
        .catch(() => {
          if (!cancelled) {
            setExplicitProduct(null);
          }
        });
    } else {
      setExplicitProduct(null);
    }

    listProducts({
      subdomain: projectSubdomain ?? undefined,
      status: "active",
      limit: 100,
      ignoreActiveProjectScope: !!projectSubdomain,
    })
      .then((res) => {
        if (!cancelled) setProducts(res.items ?? []);
      })
      .catch(() => { if (!cancelled) setProducts([]); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [boundProductId, projectSubdomain]);

  const price = product ? (product.finalPrice ?? product.price ?? 0) : 0;
  const compareAt = product?.compareAtPrice;
  const hasDiscount = !!compareAt && compareAt > price;
  const discountPct = hasDiscount ? Math.round(((compareAt! - price) / compareAt!) * 100) : 0;
  const image = product?.images?.[0] ?? "";
  const frameWidth = parsePixelWidth(width);

  // Show placeholder while loading or when no product could be resolved
  if (loading || !product) {
    return (
      <div
        ref={(ref) => { if (ref) connect(drag(ref)); }}
        data-node-id={id}
        style={{
          width, background: cardBackground,
          border: `${cardBorderWidth}px solid ${cardBorderColor}`,
          borderRadius: cardBorderRadius, boxShadow: cardShadow,
          overflow: "hidden", display: "flex", flexDirection: "column",
          boxSizing: "border-box",
          position: position as any,
          top: top ?? undefined,
          left: left ?? undefined,
          right: right ?? undefined,
          bottom: bottom ?? undefined,
          zIndex: zIndex ?? undefined,
        }}
      >
        <div style={{
          height: imageHeight, background: "#f3f4f6",
          display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center", gap: 8,
        }}>
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="1.5">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <path d="M21 15l-5-5L5 21" />
          </svg>
          {enabled && (
            <span style={{ fontSize: 11, color: "#9ca3af", fontWeight: 500 }}>
              {loading ? "Loading product..." : "No product available"}
            </span>
          )}
        </div>
        {/* Placeholder content */}
        <div style={{ padding: cardPadding, display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ height: 14, background: "#e5e7eb", borderRadius: 4, width: "70%" }} />
          <div style={{ height: 12, background: "#e5e7eb", borderRadius: 4, width: "40%" }} />
          {showAddToCart && (
            <div style={{ height: 34, background: "#e5e7eb", borderRadius: buttonBorderRadius, marginTop: 4 }} />
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      ref={(ref) => { if (ref) connect(drag(ref)); }}
      data-node-id={id}
      style={{
        width, background: cardBackground,
        border: `${cardBorderWidth}px solid ${cardBorderColor}`,
        borderRadius: cardBorderRadius, boxShadow: cardShadow,
        overflow: "hidden", display: "flex", flexDirection: "column",
        boxSizing: "border-box",
        position: position as any,
        top: top ?? undefined,
        left: left ?? undefined,
        right: right ?? undefined,
        bottom: bottom ?? undefined,
        zIndex: zIndex ?? undefined,
      }}
    >
      {/* Image */}
      {showImage && (
        <div style={{ position: "relative", width: "100%", height: imageHeight, flexShrink: 0 }}>
          {image ? (
            <img src={image} alt={product!.name} style={{ width: "100%", height: "100%", objectFit: imageObjectFit }} />
          ) : (
            <div style={{ width: "100%", height: "100%", background: "#f3f4f6", display: "flex", alignItems: "center", justifyContent: "center", color: "#9ca3af", fontSize: 12 }}>
              No image
            </div>
          )}
          <ProductImageOverlays
            frameWidth={frameWidth}
            showDiscountBadge={showDiscountBadge}
            hasDiscount={hasDiscount}
            discountPct={discountPct}
            showRibbon={showRibbon}
            ribbonText={ribbonText}
            ribbonColor={ribbonColor}
          />
          {showQuickView && (
            <button type="button" style={{
              position: "absolute", bottom: 8, left: "50%", transform: "translateX(-50%)",
              background: "rgba(255,255,255,0.92)", color: "#111827", border: "none",
              borderRadius: 4, fontSize: 11, fontWeight: 600, padding: "4px 12px", cursor: "pointer",
            }}>
              Quick View
            </button>
          )}
        </div>
      )}

      {/* Body */}
      <div style={{ padding: cardPadding, display: "flex", flexDirection: "column", gap: 6, flex: 1 }}>
        {showProductName && (
          <p style={{ fontSize: nameFontSize, fontWeight: nameFontWeight, color: nameColor, margin: 0, lineHeight: 1.4 }}>
            {product!.name}
          </p>
        )}
        {showDivider && <hr style={{ border: "none", borderTop: "1px solid #e5e7eb", margin: "2px 0" }} />}
        {showDescription && product!.description && (
          <p style={{
            fontSize: descriptionFontSize, color: descriptionColor, margin: 0, lineHeight: 1.5,
            display: "-webkit-box", WebkitLineClamp: descriptionLines,
            WebkitBoxOrient: "vertical", overflow: "hidden",
          }}>
            {product!.description}
          </p>
        )}
        {showPrice && (
          <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
            <span style={{ fontSize: priceFontSize, fontWeight: 600, color: priceColor }}>{formatPrice(price)}</span>
            {hasDiscount && (
              <span style={{ fontSize: priceFontSize - 2, color: "#9ca3af", textDecoration: "line-through" }}>{formatPrice(compareAt!)}</span>
            )}
          </div>
        )}
        {showAddToCart && (
          <button type="button" style={{
            marginTop: "auto", width: "100%", padding: "9px 0",
            background: buttonBackground, color: buttonTextColor,
            border: `${buttonBorderWidth}px solid ${buttonBorderColor}`,
            borderRadius: buttonBorderRadius, fontSize: buttonFontSize,
            fontWeight: 600, cursor: "pointer",
          }}>
            {buttonLabel}
          </button>
        )}
      </div>
    </div>
  );
};

ProductCard.craft = {
  displayName: "Product Card",
  props: {
    boundProductId: undefined,
    position: "absolute", top: "0px", left: "0px",
    showImage: true, showProductName: true, showPrice: true,
    showDescription: false, showDivider: false,
    showDiscountBadge: true, showRibbon: false,
    ribbonText: "Sale", ribbonColor: "#ef4444",
    showAddToCart: true, showQuickView: false,
    imageHeight: 240, imageObjectFit: "cover",
    width: "280px",
    cardBackground: "#ffffff", cardBorderColor: "#e5e7eb",
    cardBorderWidth: 1, cardBorderRadius: 10, cardPadding: 12, cardShadow: "none",
    nameFontSize: 14, nameColor: "#111827", nameFontWeight: "700",
    priceFontSize: 14, priceColor: "#111827",
    descriptionFontSize: 12, descriptionColor: "#6b7280", descriptionLines: 2,
    buttonLabel: "Add to Cart", buttonBackground: "#111827", buttonTextColor: "#ffffff",
    buttonBorderRadius: 6, buttonBorderColor: "transparent", buttonBorderWidth: 0, buttonFontSize: 13,
  },
  custom: {},
  related: { settings: ProductCardSettings },
  rules: { canDrag: () => true, canDrop: () => true, canMoveIn: () => false },
  isCanvas: false,
};
