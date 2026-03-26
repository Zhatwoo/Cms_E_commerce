"use client";

import React, { useEffect, useState } from "react";
import { useNode, useEditor } from "@craftjs/core";
import { listProducts, type ApiProduct } from "@/lib/api";
import { useDesignProject } from "../../_context/DesignProjectContext";
import { ProductSliderSettings } from "./ProductSliderSettings";

export interface ProductSliderProps {
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
  showTitle = true,
  title = "Our Products",
  titleFontSize = 28,
  titleColor = "#111827",
  titleAlign = "center",
  background = "#f9fafb",
  width = "100%",
  paddingTop = 48,
  paddingBottom = 48,
  paddingLeft = 24,
  paddingRight = 24,
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

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    listProducts({ subdomain: projectSubdomain ?? undefined, status: "active" })
      .then((res) => { if (!cancelled) setProducts(res.items ?? []); })
      .catch(() => { if (!cancelled) setProducts([]); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [projectSubdomain]);

  const isEmpty = !loading && products.length === 0;

  return (
    <div
      ref={(ref) => { if (ref) connect(drag(ref)); }}
      data-node-id={id}
      style={{ width, background, paddingTop, paddingBottom, paddingLeft, paddingRight, boxSizing: "border-box" }}
    >
      {/* Title */}
      {showTitle && (
        <h2 style={{ fontSize: titleFontSize, fontWeight: 700, color: titleColor, textAlign: titleAlign, marginBottom: gap, marginTop: 0 }}>
          {title}
        </h2>
      )}

      {/* Loading skeletons */}
      {loading && (
        <div style={{ display: "flex", gap, overflowX: "auto", paddingBottom: 8 }}>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} style={{ minWidth: cardWidth, height: imageHeight + 120, borderRadius: cardBorderRadius, background: "#e5e7eb", flexShrink: 0 }} />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && isEmpty && enabled && (
        <div style={{ border: "2px dashed #d1d5db", borderRadius: 8, padding: 32, textAlign: "center", color: "#9ca3af", fontSize: 14 }}>
          No active products found. Add products in your dashboard to see them here.
        </div>
      )}

      {/* Slider */}
      {!loading && !isEmpty && (
        <div style={{ display: "flex", gap, overflowX: "auto", paddingBottom: 8, scrollSnapType: "x mandatory" }}>
          {products.map((product) => {
            const image = product.images?.[0] ?? "";
            const price = product.finalPrice ?? product.price ?? 0;
            const compareAt = product.compareAtPrice;
            const hasDiscount = !!compareAt && compareAt > price;
            const discountPct = hasDiscount ? Math.round(((compareAt! - price) / compareAt!) * 100) : 0;

            return (
              <div key={product.id} style={{
                minWidth: cardWidth, maxWidth: cardWidth, flexShrink: 0,
                background: cardBackground, borderRadius: cardBorderRadius,
                border: `1px solid ${cardBorderColor}`,
                display: "flex", flexDirection: "column", overflow: "hidden",
                scrollSnapAlign: "start", position: "relative",
              }}>
                {/* Ribbon — right side of image, arrow points right */}
                {showRibbon && (
                  <div style={{
                    position: "absolute", top: 8, right: -2, zIndex: 1,
                    background: ribbonColor, color: "#fff",
                    fontSize: 12, fontWeight: 700, padding: "4px 14px 4px 10px",
                    clipPath: "polygon(0 0, calc(100% - 8px) 0, 100% 50%, calc(100% - 8px) 100%, 0 100%)",
                    letterSpacing: "0.02em",
                  }}>
                    {ribbonText}
                  </div>
                )}

                {/* Image */}
                <div style={{ position: "relative", width: "100%", height: imageHeight, flexShrink: 0 }}>
                  {image ? (
                    <img src={image} alt={product.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    <div style={{ width: "100%", height: "100%", background: "#f3f4f6", display: "flex", alignItems: "center", justifyContent: "center", color: "#9ca3af", fontSize: 12 }}>
                      No image
                    </div>
                  )}
                  {/* Discount badge */}
                  {showDiscountBadge && hasDiscount && (
                    <span style={{ position: "absolute", top: 8, left: 8, background: "#1e293b", color: "#fff", fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 4 }}>
                      {discountPct}% Off
                    </span>
                  )}
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
    showTitle: true, title: "Our Products", titleFontSize: 28, titleColor: "#111827", titleAlign: "center",
    background: "#f9fafb", width: "100%",
    paddingTop: 48, paddingBottom: 48, paddingLeft: 24, paddingRight: 24,
    gap: 18, cardWidth: 240, imageHeight: 220, cardBorderRadius: 8,
    cardBackground: "#ffffff", cardBorderColor: "#e5e7eb",
    showProductName: true, showPrice: true, showDivider: false,
    showDiscountBadge: true, showRibbon: false, ribbonText: "Sale", ribbonColor: "#ef4444",
    showDescription: false,
    showAddToCart: true, buttonLabel: "Add to Cart",
    buttonBackground: "#111827", buttonTextColor: "#ffffff", buttonBorderRadius: 6,
    showQuickView: false,
  },
  related: { settings: ProductSliderSettings },
  rules: { canDrag: () => true, canDrop: () => true, canMoveIn: () => false },
  isCanvas: false,
};
