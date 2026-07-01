"use client";

import React from "react";

type ProductImageOverlaysProps = {
  frameWidth?: number;
  showDiscountBadge?: boolean;
  hasDiscount?: boolean;
  discountPct?: number;
  showRibbon?: boolean;
  ribbonText?: string;
  ribbonColor?: string;
};

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const getOverlayMetrics = (frameWidth?: number) => {
  const baseWidth = Number.isFinite(frameWidth) && frameWidth && frameWidth > 0 ? frameWidth : 240;

  return {
    inset: clamp(Math.round(baseWidth * 0.033), 8, 12),
    gap: clamp(Math.round(baseWidth * 0.025), 6, 10),
    badgeFontSize: clamp(Math.round(baseWidth * 0.046), 10, 12),
    badgePadY: clamp(Math.round(baseWidth * 0.01), 3, 4),
    badgePadX: clamp(Math.round(baseWidth * 0.03), 8, 10),
    ribbonFontSize: clamp(Math.round(baseWidth * 0.05), 11, 13),
    ribbonPadY: clamp(Math.round(baseWidth * 0.0125), 4, 5),
    ribbonPadRight: clamp(Math.round(baseWidth * 0.04), 10, 12),
    ribbonPadLeft: clamp(Math.round(baseWidth * 0.055), 14, 16),
    ribbonNotch: clamp(Math.round(baseWidth * 0.03), 8, 10),
  };
};

export function ProductImageOverlays({
  frameWidth,
  showDiscountBadge = false,
  hasDiscount = false,
  discountPct = 0,
  showRibbon = false,
  ribbonText = "Sale",
  ribbonColor = "#ef4444",
}: ProductImageOverlaysProps) {
  const shouldShowDiscountBadge = showDiscountBadge && hasDiscount;
  const shouldShowRibbon = showRibbon && ribbonText.trim().length > 0;

  if (!shouldShowDiscountBadge && !shouldShowRibbon) return null;

  const metrics = getOverlayMetrics(frameWidth);

  return (
    <>
      {shouldShowDiscountBadge && (
        <span
          style={{
            position: "absolute",
            top: metrics.inset,
            left: metrics.inset,
            zIndex: 2,
            pointerEvents: "none",
            background: "#1e293b",
            color: "#fff",
            fontSize: metrics.badgeFontSize,
            fontWeight: 700,
            padding: `${metrics.badgePadY}px ${metrics.badgePadX}px`,
            borderRadius: 4,
            lineHeight: 1.35,
            whiteSpace: "nowrap",
          }}
        >
          {discountPct}% Off
        </span>
      )}
      {shouldShowRibbon && (
        <div
          style={{
            position: "absolute",
            top: metrics.inset,
            right: 0,
            zIndex: 2,
            pointerEvents: "none",
            maxWidth: `calc(100% - ${(metrics.inset * 2) + metrics.gap}px)`,
            background: ribbonColor,
            color: "#fff",
            fontSize: metrics.ribbonFontSize,
            fontWeight: 700,
            padding: `${metrics.ribbonPadY}px ${metrics.ribbonPadRight}px ${metrics.ribbonPadY}px ${metrics.ribbonPadLeft}px`,
            clipPath: `polygon(${metrics.ribbonNotch}px 0, 100% 0, 100% 100%, ${metrics.ribbonNotch}px 100%, 0 50%)`,
            letterSpacing: "0.02em",
            lineHeight: 1.3,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {ribbonText}
        </div>
      )}
    </>
  );
}
