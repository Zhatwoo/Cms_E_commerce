   "use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNode } from "@craftjs/core";
import { AccordionSettings } from "./AccordionSettings";
import type { PositionProps, AccordionProps, AccordionItem } from "../../_types/components";

const DEFAULT_ITEMS: AccordionItem[] = [
  { title: "What is this?", content: "This is the content of the first accordion item. Click the header to expand or collapse.", mediaType: "none", mediaUrl: "" },
  { title: "How does it work?", content: "Users click on a header to reveal or hide the content below it.", mediaType: "none", mediaUrl: "" },
  { title: "Can I customize it?", content: "Yes! You can change colors, font sizes, border styles, items, and more from the settings panel.", mediaType: "none", mediaUrl: "" },
];

function hexToRgba(hex: string | undefined, alpha: number): string {
  if (!hex) return `rgba(148, 163, 184, ${alpha})`;
  const raw = hex.trim().replace("#", "");
  if (raw.length !== 6) return `rgba(148, 163, 184, ${alpha})`;
  const r = Number.parseInt(raw.slice(0, 2), 16);
  const g = Number.parseInt(raw.slice(2, 4), 16);
  const b = Number.parseInt(raw.slice(4, 6), 16);
  if ([r, g, b].some((v) => Number.isNaN(v))) return `rgba(148, 163, 184, ${alpha})`;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function fluidSpace(value: number, min = 0): string {
  if (!Number.isFinite(value) || value <= 0) return `${value || 0}px`;
  const preferred = Math.max(0.1, value / 12);
  const floor = Math.max(min, Math.round(value * 0.45));
  return `clamp(${floor}px, ${preferred.toFixed(2)}cqw, ${value}px)`;
}

export const Accordion = ({
  items = DEFAULT_ITEMS,
  stylePreset = "wix",
  editorPreviewMode = "normal",
  allowMultiple = false,
  allowCollapseAll = true,
  defaultOpenIndex = 0,
  animationDurationMs = 280,
  width = "100%",
  minHeight = 0,
  marginTop = 0,
  marginRight = 0,
  marginBottom = 0,
  marginLeft = 0,
  borderRadius = 8,
  backgroundColor = "transparent",
  headerBg = "#1e1e2e",
  headerTextColor = "#e2e8f0",
  headerFontSize = 14,
  headerFontWeight = "600",
  headerFontStyle = "normal",
  headerLetterSpacing = "0.01em",
  headerLineHeight = 1.3,
  headerTextAlign = "left",
  headerTextTransform = "none",
  headerTextDecoration = "none",
  contentBg = "#12121c",
  contentTextColor = "#a0aec0",
  contentFontSize = 13,
  contentFontWeight = "400",
  contentFontStyle = "normal",
  contentLetterSpacing = 0,
  contentLineHeight = "1.6",
  contentTextAlign = "left",
  contentTextTransform = "none",
  contentTextDecoration = "none",
  fontFamily = "Outfit",
  borderColor = "#2d2d44",
  borderWidth = 1,
  iconColor = "#94a3b8",
  position = "relative",
  top = "auto",
  right = "auto",
  bottom = "auto",
  left = "auto",
  zIndex = 0,
  display,
  editorVisibility = "auto",
}: AccordionProps) => {
  const { id, connectors: { connect } } = useNode();
  const hostRef = useRef<HTMLDivElement | null>(null);
  const contentPanelRefs = useRef<Record<number, HTMLDivElement | null>>({});
  const [contentHeights, setContentHeights] = useState<Record<number, number>>({});
  const safeDuration = Number.isFinite(animationDurationMs) ? Math.max(80, Math.min(1200, animationDurationMs)) : 280;
  const safeItems = useMemo(
    () => (items ?? DEFAULT_ITEMS).filter((item) => item && typeof item.title === "string" && typeof item.content === "string"),
    [items]
  );
  const normalizedDefault = Number.isFinite(defaultOpenIndex) ? Math.max(0, Math.floor(defaultOpenIndex)) : 0;
  const clampedDefaultIndex = safeItems.length > 0 ? Math.min(normalizedDefault, safeItems.length - 1) : 0;
  const [openIndexes, setOpenIndexes] = useState<number[]>(safeItems.length > 0 ? [clampedDefaultIndex] : []);
  const edgeGlow = hexToRgba(iconColor, 0.26);
  const contentGlow = hexToRgba(contentTextColor, 0.12);
  const isWix = stylePreset === "wix";
  const effectiveDisplay =
    editorVisibility === "hide"
      ? "none"
      : editorVisibility === "show" && display === "none"
        ? "flex"
        : (display ?? "flex");

  // Keep open state valid and responsive when settings are edited (items/default index/modes).
  useEffect(() => {
    if (editorPreviewMode === "expand-all") {
      setOpenIndexes(safeItems.map((_, idx) => idx));
      return;
    }
    if (editorPreviewMode === "collapse-all") {
      setOpenIndexes([]);
      return;
    }

    setOpenIndexes((prev) => {
      const deduped = Array.from(new Set(prev.filter((idx) => idx >= 0 && idx < safeItems.length)));
      const fallback = safeItems.length > 0 ? [clampedDefaultIndex] : [];
      let next = deduped.length > 0 ? deduped : fallback;

      if (!allowMultiple && next.length > 1) {
        next = [next[0]];
      }
      if (!allowCollapseAll && safeItems.length > 0 && next.length === 0) {
        next = [clampedDefaultIndex];
      }

      return next;
    });
  }, [safeItems.length, clampedDefaultIndex, allowMultiple, allowCollapseAll, editorPreviewMode, safeItems]);

  // Resize preview may leave inline height constraints on the host DOM node.
  // Always normalize Accordion back to content-driven height.
  useEffect(() => {
    const el = hostRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.removeProperty("min-height");
    el.style.removeProperty("max-height");
  }, [width, openIndexes, safeItems.length]);

  const fluidHeaderFontSize = `clamp(${Math.max(10, Math.round(headerFontSize * 0.8))}px, ${(headerFontSize / 12).toFixed(2)}cqw, ${headerFontSize}px)`;
  const fluidContentFontSize = `clamp(${Math.max(10, Math.round(contentFontSize * 0.8))}px, ${(contentFontSize / 12).toFixed(2)}cqw, ${contentFontSize}px)`;

  useEffect(() => {
    const updateHeights = () => {
      const next: Record<number, number> = {};
      safeItems.forEach((_, idx) => {
        const panel = contentPanelRefs.current[idx];
        next[idx] = panel ? panel.scrollHeight : 0;
      });
      setContentHeights(next);
    };

    updateHeights();

    const ro = new ResizeObserver(updateHeights);
    if (hostRef.current) ro.observe(hostRef.current);
    safeItems.forEach((_, idx) => {
      const panel = contentPanelRefs.current[idx];
      if (panel) ro.observe(panel);
    });

    return () => ro.disconnect();
  }, [safeItems, openIndexes, contentFontSize, headerFontSize, width]);

  const swallowPointer = (e: React.SyntheticEvent) => {
    e.stopPropagation();
  };

  const toggle = (index: number) => {
    if (allowMultiple) {
      setOpenIndexes((prev) =>
        prev.includes(index)
          ? (allowCollapseAll ? prev.filter((i) => i !== index) : prev)
          : [...prev, index]
      );
    } else {
      setOpenIndexes((prev) => {
        const alreadyOpen = prev.includes(index);
        if (alreadyOpen) {
          return allowCollapseAll ? [] : prev;
        }
        return [index];
      });
    }
  };

  const isOpen = (index: number) => openIndexes.includes(index);

  return (
    <div
      ref={(ref) => {
        if (!ref) return;
        hostRef.current = ref;
        connect(ref);
      }}
      data-node-id={id}
      data-fluid-text="true"
      data-fluid-space="true"
      data-drop-block="true"
      data-drop-block-type="Accordion"
      style={{
        width,
        height: "auto",
        minHeight: minHeight > 0 ? `${minHeight}px` : undefined,
        alignSelf: "flex-start",
        backgroundColor,
        marginTop: fluidSpace(marginTop),
        marginRight: fluidSpace(marginRight),
        marginBottom: fluidSpace(marginBottom),
        marginLeft: fluidSpace(marginLeft),
        borderRadius: `${borderRadius}px`,
        overflow: "hidden",
        cursor: "pointer",
        display: effectiveDisplay,
        flexDirection: "column",
        gap: isWix ? "0px" : "10px",
        border: isWix ? `${borderWidth}px solid ${borderColor}` : undefined,
        position,
        top: position !== "static" ? top : undefined,
        right: position !== "static" ? right : undefined,
        bottom: position !== "static" ? bottom : undefined,
        left: position !== "static" ? left : undefined,
        zIndex: zIndex !== 0 ? zIndex : undefined,
        containerType: "inline-size",
      }}
    >
      {safeItems.map((item, index) => {
        const open = isOpen(index);
        const mediaType = item.mediaType ?? "none";
        const mediaUrl = (item.mediaUrl ?? "").trim();
        const previewText = (item.content ?? "").trim();
        const previewLine = previewText.length > 70 ? `${previewText.slice(0, 70)}...` : previewText;
        const mediaLabel = mediaType === "none" ? "" : (mediaType === "image" ? "Image" : "Video");
        const itemRadius = Math.max(0, borderRadius);
        const isLast = index === safeItems.length - 1;

        return (
          <div
            key={index}
            style={{
              borderColor,
              borderWidth: `${borderWidth}px`,
              borderStyle: "solid",
              borderRadius: isWix ? "0px" : `${itemRadius}px`,
              position: "relative",
              display: "flex",
              flexDirection: "column",
              zIndex: open ? 1 : 0,
              overflow: "hidden",
              boxShadow: isWix
                ? "none"
                : (open
                  ? `0 12px 30px -20px ${edgeGlow}, 0 1px 0 ${hexToRgba(borderColor, 0.45)} inset`
                  : `0 8px 20px -24px ${contentGlow}`),
              transition: `box-shadow ${Math.max(150, safeDuration - 70)}ms ease, border-color ${Math.max(150, safeDuration - 80)}ms ease`,
              borderLeft: isWix ? "none" : undefined,
              borderRight: isWix ? "none" : undefined,
              borderTop: isWix && index > 0 ? "none" : undefined,
              borderBottom: isWix && !isLast ? `1px solid ${hexToRgba(borderColor, 0.65)}` : undefined,
            }}
          >
            {/* Header */}
            <button
              type="button"
              data-canvas-interactive="true"
              draggable={false}
              onDragStart={(e) => e.preventDefault()}
              onPointerDownCapture={swallowPointer}
              onPointerDown={swallowPointer}
              onMouseDown={swallowPointer}
              onTouchStart={swallowPointer}
              onClick={(e) => {
                e.stopPropagation();
                toggle(index);
              }}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "12px",
                padding: isWix ? "14px 14px" : "13px 16px",
                backgroundColor: headerBg,
                color: headerTextColor,
                fontSize: fluidHeaderFontSize,
                fontWeight: headerFontWeight,
                fontFamily,
                fontStyle: headerFontStyle ?? "normal",
                letterSpacing: headerLetterSpacing ?? "0.01em",
                lineHeight: headerLineHeight ?? 1.3,
                textAlign: headerTextAlign ?? "left",
                textTransform: headerTextTransform ?? "none",
                textDecoration: headerTextDecoration ?? "none",
                cursor: "pointer",
                border: "none",
                outline: "none",
              }}
            >
              <span style={{ flex: 1, lineHeight: "inherit", display: "flex", alignItems: "center", gap: "10px", minWidth: 0 }}>
                {isWix && (
                  <span aria-hidden="true" style={{ width: "10px", display: "inline-flex", justifyContent: "center", opacity: 0.6, flexShrink: 0 }}>
                    <svg width="8" height="16" viewBox="0 0 8 16" fill="none">
                      <circle cx="2" cy="3" r="1" fill={hexToRgba(iconColor, 0.8)} />
                      <circle cx="6" cy="3" r="1" fill={hexToRgba(iconColor, 0.8)} />
                      <circle cx="2" cy="8" r="1" fill={hexToRgba(iconColor, 0.8)} />
                      <circle cx="6" cy="8" r="1" fill={hexToRgba(iconColor, 0.8)} />
                      <circle cx="2" cy="13" r="1" fill={hexToRgba(iconColor, 0.8)} />
                      <circle cx="6" cy="13" r="1" fill={hexToRgba(iconColor, 0.8)} />
                    </svg>
                  </span>
                )}
                <span style={{ display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", minWidth: 0, textDecoration: "inherit" }}>{item.title}</span>
                {!isWix && (
                  <span
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      marginTop: "3px",
                      fontSize: `calc(${fluidHeaderFontSize} - 3px)`,
                      color: hexToRgba(headerTextColor, 0.62),
                      fontWeight: 500,
                    }}
                  >
                    <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "100%" }}>
                      {previewLine || "No content yet"}
                    </span>
                    {mediaLabel && (
                      <span
                        style={{
                          border: `1px solid ${hexToRgba(iconColor, 0.35)}`,
                          background: hexToRgba(iconColor, 0.14),
                          color: hexToRgba(iconColor, 0.95),
                          borderRadius: "999px",
                          padding: "1px 6px",
                          fontSize: `calc(${fluidHeaderFontSize} - 5px)`,
                          lineHeight: 1.4,
                          flexShrink: 0,
                        }}
                      >
                        {mediaLabel}
                      </span>
                    )}
                  </span>
                )}
              </span>
              <span
                style={{
                  width: isWix ? "22px" : "24px",
                  height: isWix ? "22px" : "24px",
                  borderRadius: "999px",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: isWix ? "transparent" : hexToRgba(iconColor, open ? 0.18 : 0.1),
                  border: isWix ? `1px solid ${hexToRgba(iconColor, 0.35)}` : `1px solid ${hexToRgba(iconColor, open ? 0.35 : 0.2)}`,
                  transition: `transform ${Math.max(150, safeDuration - 80)}ms ease, background-color ${Math.max(150, safeDuration - 80)}ms ease`,
                  transform: open ? "translateY(-1px)" : "translateY(0px)",
                  flexShrink: 0,
                }}
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke={iconColor}
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{
                    transition: `transform ${Math.max(150, safeDuration - 80)}ms ease`,
                    transform: open ? "rotate(180deg)" : "rotate(0deg)",
                  }}
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </span>
              {isWix && (
                <span
                  aria-hidden="true"
                  style={{
                    width: "22px",
                    height: "22px",
                    borderRadius: "999px",
                    border: `1px solid ${hexToRgba(iconColor, 0.35)}`,
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: hexToRgba(iconColor, 0.95),
                    fontSize: "12px",
                    lineHeight: 1,
                    flexShrink: 0,
                  }}
                >
                  ...
                </span>
              )}
            </button>

            {/* Content */}
            <div
              style={{
                overflow: "hidden",
                maxHeight: open ? `${contentHeights[index] ?? 0}px` : "0px",
                transition: `max-height ${safeDuration}ms ease, opacity ${Math.max(120, safeDuration - 80)}ms ease`,
                opacity: open ? 1 : 0,
              }}
            >
              <div
                data-canvas-interactive="true"
                ref={(el) => {
                  contentPanelRefs.current[index] = el;
                }}
                style={{
                  backgroundColor: contentBg,
                  color: contentTextColor,
                  fontSize: fluidContentFontSize,
                  fontWeight: contentFontWeight ?? "400",
                  fontFamily,
                  fontStyle: contentFontStyle ?? "normal",
                  letterSpacing: contentLetterSpacing ?? 0,
                  lineHeight: contentLineHeight ?? "1.6",
                  textAlign: contentTextAlign ?? "left",
                  textTransform: contentTextTransform ?? "none",
                  textDecoration: contentTextDecoration ?? "none",
                  borderTop: `1px solid ${hexToRgba(borderColor, 0.45)}`,
                }}
              >
                {/* Text content — padded */}
                <div style={{ padding: isWix ? "10px 44px 10px" : "10px 16px 10px", textDecoration: "inherit" }}>{item.content}</div>
                {mediaType !== "none" && mediaUrl && (
                  <div style={{ padding: isWix ? "0 44px 10px" : "0 16px 10px" }}>
                    {mediaType === "image"
                      ? <img src={mediaUrl} alt={item.title} style={{ width: "100%", maxWidth: 280, height: "auto", aspectRatio: "14 / 9", objectFit: "cover", borderRadius: 6, display: "block" }} />
                      : <video src={mediaUrl} controls style={{ width: "100%", maxWidth: 280, height: "auto", aspectRatio: "14 / 9", borderRadius: 6, display: "block" }} />
                    }
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export const AccordionDefaultProps: Partial<AccordionProps> = {
  items: DEFAULT_ITEMS,
  stylePreset: "wix",
  editorPreviewMode: "normal",
  allowMultiple: false,
  allowCollapseAll: true,
  defaultOpenIndex: 0,
  animationDurationMs: 280,
  width: "100%",
  marginTop: 0,
  marginRight: 0,
  marginBottom: 16,
  marginLeft: 0,
  borderRadius: 8,
  backgroundColor: "#f4f7fc",
  headerBg: "#f8fbff",
  headerTextColor: "#10213f",
  headerFontSize: 14,
  headerFontWeight: "600",
  contentBg: "#ffffff",
  contentTextColor: "#334155",
  contentFontSize: 13,
  borderColor: "#d4dfef",
  borderWidth: 1,
  iconColor: "#4a89ff",
};

Accordion.craft = {
  displayName: "Accordion",
  props: AccordionDefaultProps,
  rules: {
    canMoveIn: () => false,
  },
  related: {
    settings: AccordionSettings,
  },
};
