"use client";

import React, { useEffect, useState, useRef } from "react";
import { useNode, useEditor } from "@craftjs/core";
import { listProducts, type ApiProduct } from "@/lib/api";
import { useDesignProject } from "../../_context/DesignProjectContext";
import { ProductSliderSettings } from "./ProductSliderSettings";
import { ProductImageOverlays } from "../productOverlays";

export type ProductSliderSourceMode = "auto" | "manual";

export interface ProductSliderProps {
  position?: string;
  top?: string;
  left?: string;
  right?: string;
  bottom?: string;
  zIndex?: number;

  // Product source
  productSourceMode?: ProductSliderSourceMode;
  selectedProductIds?: string[];

  // General
  showTitle?: boolean;
  title?: string;
  titleFontSize?: number;
  titleColor?: string;
  titleAlign?: "left" | "center" | "right";

  // Layout
  background?: string;
  width?: string;
  paddingTop?: number;
  paddingBottom?: number;
  paddingLeft?: number;
  paddingRight?: number;
  gap?: number;
  cardWidth?: number;
  imageHeight?: number;
  cardBorderRadius?: number;
  cardBackground?: string;
  cardBorderColor?: string;

  // Product card display toggles
  showProductName?: boolean;
  showPrice?: boolean;
  showDivider?: boolean;
  showDiscountBadge?: boolean;
  showRibbon?: boolean;
  ribbonText?: string;
  ribbonColor?: string;
  showDescription?: boolean;

  // Add to Cart section
  showAddToCart?: boolean;
  buttonLabel?: string;
  buttonBackground?: string;
  buttonTextColor?: string;
  buttonBorderRadius?: number;
  showQuickView?: boolean;
}

const formatPrice = (price: number) =>
  new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" }).format(price);

export const ProductSlider = ({
  position = "relative",
  top,
  left,
  right,
  bottom,
  zIndex,
  productSourceMode = "auto",
  selectedProductIds = [],
  showTitle = true,
  title = "Our Products",
  titleFontSize = 28,
  titleColor = "#111827",
  titleAlign = "center",
  background = "#f9fafb",
  width = "100%",
  paddingTop = 48,
  paddingBottom = 48,
  paddingLeft = 0,
  paddingRight = 0,
  gap = 18,
  cardWidth = 240,
  imageHeight = 220,
  cardBorderRadius = 8,
  cardBackground = "#ffffff",
  cardBorderColor = "#e5e7eb",
  showProductName = true,
  showPrice = true,
  showDivider = false,
  showDiscountBadge = true,
  showRibbon = false,
  ribbonText = "Sale",
  ribbonColor = "#ef4444",
  showDescription = false,
  showAddToCart = true,
  buttonLabel = "Add to Cart",
  buttonBackground = "#111827",
  buttonTextColor = "#ffffff",
  buttonBorderRadius = 6,
  showQuickView = false,
}: ProductSliderProps) => {
  const { id, connectors: { connect, drag } } = useNode();
  const { enabled } = useEditor((s) => ({ enabled: s.options.enabled }));
  const { projectSubdomain } = useDesignProject();

  const [products, setProducts] = useState<ApiProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);

  // Track container width for responsive card sizing (use offsetWidth = full element width)
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      setContainerWidth(el.offsetWidth);
    });
    ro.observe(el);
    setContainerWidth(el.offsetWidth);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    listProducts({ subdomain: projectSubdomain ?? undefined, status: "active", limit: 500 })
      .then((res) => { if (!cancelled) setProducts(res.items ?? []); })
      .catch(() => { if (!cancelled) setProducts([]); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [projectSubdomain]);

  const displayedProducts = React.useMemo(() => {
    if (productSourceMode !== "manual") return products;

    const selectedIds = (Array.isArray(selectedProductIds) ? selectedProductIds : [])
      .map((id) => String(id || "").trim())
      .filter(Boolean);

    if (selectedIds.length === 0) return [];

    const productById = new Map(products.map((product) => [String(product.id), product]));
    return selectedIds
      .map((id) => productById.get(id))
      .filter((product): product is ApiProduct => Boolean(product));
  }, [productSourceMode, products, selectedProductIds]);

  // Responsive card count & width: fills full inner width at every breakpoint
  const responsiveCardWidth = (() => {
    if (containerWidth <= 0) return cardWidth;
    // containerWidth = offsetWidth (full element width including padding)
    // inner = content area after subtracting left+right padding
    const inner = Math.max(0, containerWidth - paddingLeft - paddingRight);
    let targetCount: number;
    if (inner <= 480)       targetCount = 1;   // phone
    else if (inner <= 768)  targetCount = 2;   // tablet portrait
    else if (inner <= 1024) targetCount = 3;   // tablet landscape
    else if (inner <= 1440) targetCount = 4;   // laptop
    else                    targetCount = 5;   // desktop 1920+
    const visibleCount = Math.max(1, Math.min(targetCount, displayedProducts.length || targetCount));
    return Math.floor((inner - gap * (visibleCount - 1)) / visibleCount);
  })();

  // Scale image height proportionally with card width (maintain ~1:1.1 aspect ratio)
  const responsiveImageHeight = containerWidth <= 0
    ? imageHeight
    : Math.round(responsiveCardWidth * (imageHeight / Math.max(cardWidth, 1)));

  const isEmpty = !loading && displayedProducts.length === 0;

  const isFluidWidth = typeof width === "string" && width.trim().endsWith("%");

  return (
    <div
      ref={(ref) => { if (ref) { connect(drag(ref)); (containerRef as React.MutableRefObject<HTMLDivElement | null>).current = ref; } }}
      data-node-id={id}
      style={{
        width,
        minWidth: isFluidWidth ? width : undefined,
        maxWidth: "100%",
        display: "block",
        alignSelf: isFluidWidth ? "stretch" : undefined,
        background,
        paddingTop,
        paddingBottom,
        paddingLeft,
        paddingRight,
        boxSizing: "border-box",
        position: position as React.CSSProperties["position"],
        top: top ?? undefined,
        left: left ?? undefined,
        right: right ?? undefined,
        bottom: bottom ?? undefined,
        zIndex: zIndex ?? undefined,
      }}
    >
      {/* Title */}
      {showTitle && (
        <h2 style={{ fontSize: titleFontSize, fontWeight: 700, color: titleColor, textAlign: titleAlign, marginBottom: gap, marginTop: 0, paddingLeft: 24, paddingRight: 24 }}>
          {title}
        </h2>
      )}

      {/* Loading skeletons */}
      {loading && (
        <div style={{ display: "flex", gap, overflowX: "auto", paddingBottom: 8 }}>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} style={{ minWidth: responsiveCardWidth, height: responsiveImageHeight + 120, borderRadius: cardBorderRadius, background: "#e5e7eb", flexShrink: 0 }} />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && isEmpty && enabled && (
        <div style={{ border: "2px dashed #d1d5db", borderRadius: 8, padding: 32, textAlign: "center", color: "#9ca3af", fontSize: 14 }}>
          {productSourceMode === "manual"
            ? (selectedProductIds.length > 0
              ? "Selected products are not active or no longer available."
              : "No products selected yet. Open Product Slider settings and add products to display.")
            : "No active products found. Add products in your dashboard to see them here."}
        </div>
      )}

      {/* Slider */}
      {!loading && !isEmpty && (
        <div style={{ display: "flex", gap, overflowX: "hidden", paddingBottom: 4, flexWrap: "nowrap" }}>
          {displayedProducts.map((product) => {
            const image = product.images?.[0] ?? "";
            const price = product.finalPrice ?? product.price ?? 0;
            const compareAt = product.compareAtPrice;
            const hasDiscount = !!compareAt && compareAt > price;
            const discountPct = hasDiscount ? Math.round(((compareAt! - price) / compareAt!) * 100) : 0;

            return (
              <div key={product.id} style={{
                minWidth: responsiveCardWidth, maxWidth: responsiveCardWidth, flexShrink: 0,
                background: cardBackground, borderRadius: cardBorderRadius,
                border: `1px solid ${cardBorderColor}`,
                display: "flex", flexDirection: "column", overflow: "hidden",
                position: "relative",
              }}>
                {/* Image */}
                <div style={{ position: "relative", width: "100%", height: responsiveImageHeight, flexShrink: 0 }}>
                  {image ? (
                    <img src={image} alt={product.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    <div style={{ width: "100%", height: "100%", background: "#f3f4f6", display: "flex", alignItems: "center", justifyContent: "center", color: "#9ca3af", fontSize: 12 }}>
                      No image
                    </div>
                  )}
                  <ProductImageOverlays
                    frameWidth={responsiveCardWidth}
                    showDiscountBadge={showDiscountBadge}
                    hasDiscount={hasDiscount}
                    discountPct={discountPct}
                    showRibbon={showRibbon}
                    ribbonText={ribbonText}
                    ribbonColor={ribbonColor}
                  />
                  {/* Quick view */}
                  {showQuickView && (
                    <button type="button" style={{
                      position: "absolute", bottom: 8, left: "50%", transform: "translateX(-50%)",
                      background: "rgba(255,255,255,0.92)", color: "#111827", border: "none",
                      borderRadius: 4, fontSize: 11, fontWeight: 600, padding: "4px 12px", cursor: "pointer",
                      whiteSpace: "nowrap",
                    }}>
                      Quick View
                    </button>
                  )}
                </div>

                {/* Card body */}
                <div style={{ padding: "12px 12px 14px", display: "flex", flexDirection: "column", gap: 4, flex: 1 }}>
                  {showProductName && (
                    <p style={{ fontSize: 14, fontWeight: 700, color: "#111827", margin: 0, lineHeight: 1.4 }}>
                      {product.name}
                    </p>
                  )}
                  {showDivider && <hr style={{ border: "none", borderTop: "1px solid #e5e7eb", margin: "4px 0" }} />}
                  {showDescription && product.description && (
                    <p style={{ fontSize: 12, color: "#6b7280", margin: 0, lineHeight: 1.4, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                      {product.description}
                    </p>
                  )}
                  {showPrice && (
                    <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                      <span style={{ fontSize: 14, fontWeight: 600, color: "#111827" }}>{formatPrice(price)}</span>
                      {hasDiscount && (
                        <span style={{ fontSize: 12, color: "#9ca3af", textDecoration: "line-through" }}>{formatPrice(compareAt!)}</span>
                      )}
                    </div>
                  )}
                  {showAddToCart && (
                    <button type="button" style={{
                      marginTop: "auto", paddingTop: 4, width: "100%", padding: "8px 0",
                      background: buttonBackground, color: buttonTextColor,
                      border: "none", borderRadius: buttonBorderRadius,
                      fontSize: 13, fontWeight: 600, cursor: "pointer",
                    }}>
                      {buttonLabel}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

ProductSlider.craft = {
  displayName: "Product Slider",
  props: {
    position: "relative", top: "auto", left: "auto", right: "auto", bottom: "auto",
    productSourceMode: "auto",
    selectedProductIds: [],
    showTitle: true, title: "Our Products", titleFontSize: 28, titleColor: "#111827", titleAlign: "center",
    background: "#f9fafb", width: "100%",
    paddingTop: 48, paddingBottom: 48, paddingLeft: 0, paddingRight: 0,
    gap: 18, cardWidth: 240, imageHeight: 220, cardBorderRadius: 8,
    cardBackground: "#ffffff", cardBorderColor: "#e5e7eb",
    showProductName: true, showPrice: true, showDivider: false,
    showDiscountBadge: true, showRibbon: false, ribbonText: "Sale", ribbonColor: "#ef4444",
    showDescription: false,
    showAddToCart: true, buttonLabel: "Add to Cart",
    buttonBackground: "#111827", buttonTextColor: "#ffffff", buttonBorderRadius: 6,
    showQuickView: false,
    zIndex: undefined,
  },
  custom: { isPrebuiltBlock: true },
  related: { settings: ProductSliderSettings },
  rules: { canDrag: () => true, canDrop: () => true, canMoveIn: () => false },
  isCanvas: false,
};
