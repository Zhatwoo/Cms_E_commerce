"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useNode } from "@craftjs/core";
import { AccordionSettings } from "./AccordionSettings";

export interface AccordionItem {
  title: string;
  content: string;
  mediaType?: "none" | "image" | "video";
  mediaUrl?: string;
}

export interface AccordionProps {
  items?: AccordionItem[];
  stylePreset?: "classic" | "wix";
  editorPreviewMode?: "normal" | "expand-all" | "collapse-all";
  allowMultiple?: boolean;
  allowCollapseAll?: boolean;
  defaultOpenIndex?: number;
  animationDurationMs?: number;
  // Container
  width?: string;
  marginTop?: number;
  marginRight?: number;
  marginBottom?: number;
  marginLeft?: number;
  borderRadius?: number;
  // Header row
  backgroundColor?: string;
  headerBg?: string;
  headerTextColor?: string;
  headerFontSize?: number;
  headerFontWeight?: string;
  // Content panel
  contentBg?: string;
  contentTextColor?: string;
  contentFontSize?: number;
  // Border
  borderColor?: string;
  borderWidth?: number;
  // Icon
  iconColor?: string;
}

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

export const Accordion = ({
  items = DEFAULT_ITEMS,
  stylePreset = "wix",
  editorPreviewMode = "normal",
  allowMultiple = false,
  allowCollapseAll = true,
  defaultOpenIndex = 0,
  animationDurationMs = 280,
  width = "100%",
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
  contentBg = "#12121c",
  contentTextColor = "#a0aec0",
  contentFontSize = 13,
  borderColor = "#2d2d44",
  borderWidth = 1,
  iconColor = "#94a3b8",
}: AccordionProps) => {
  const { id, connectors: { connect } } = useNode();
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
      data-node-id={id}
      ref={(ref) => { if (ref) connect(ref); }}
      style={{
        width,
        backgroundColor,
        marginTop: `${marginTop}px`,
        marginRight: `${marginRight}px`,
        marginBottom: `${marginBottom}px`,
        marginLeft: `${marginLeft}px`,
        borderRadius: `${borderRadius}px`,
        overflow: "hidden",
        cursor: "pointer",
        display: "flex",
        flexDirection: "column",
        gap: isWix ? "0px" : "10px",
        border: isWix ? `${borderWidth}px solid ${borderColor}` : undefined,
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
                fontSize: `${headerFontSize}px`,
                fontWeight: headerFontWeight,
                cursor: "pointer",
                textAlign: "left",
                border: "none",
                outline: "none",
                letterSpacing: "0.01em",
              }}
            >
              <span style={{ flex: 1, lineHeight: 1.3, display: "flex", alignItems: "center", gap: "10px", minWidth: 0 }}>
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
                <span style={{ display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", minWidth: 0 }}>{item.title}</span>
                {!isWix && (
                  <span
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      marginTop: "3px",
                      fontSize: `${Math.max(10, headerFontSize - 3)}px`,
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
                          fontSize: `${Math.max(9, headerFontSize - 5)}px`,
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
                maxHeight: open ? "900px" : "0px",
                transition: `max-height ${safeDuration}ms ease, opacity ${Math.max(120, safeDuration - 80)}ms ease`,
                opacity: open ? 1 : 0,
              }}
            >
              <div
                data-canvas-interactive="true"
                style={{
                  padding: isWix ? "0 44px 14px" : "0 16px 14px",
                  backgroundColor: contentBg,
                  color: contentTextColor,
                  fontSize: `${contentFontSize}px`,
                  lineHeight: "1.6",
                  borderTop: `1px solid ${hexToRgba(borderColor, 0.45)}`,
                }}
              >
                <div style={{ paddingTop: "10px" }}>{item.content}</div>
                {mediaType !== "none" && (
                  mediaUrl ? (
                    <div data-canvas-interactive="true" style={{ marginTop: "10px" }}>
                      {mediaType === "image" ? (
                        <img
                          src={mediaUrl}
                          alt={item.title || "Accordion image"}
                          style={{
                            width: "100%",
                            maxWidth: "100%",
                            borderRadius: "8px",
                            display: "block",
                          }}
                        />
                      ) : (
                        <video
                          src={mediaUrl}
                          controls
                          preload="metadata"
                          style={{
                            width: "100%",
                            maxWidth: "100%",
                            borderRadius: "8px",
                            display: "block",
                          }}
                        />
                      )}
                    </div>
                  ) : (
                    <div
                      style={{
                        marginTop: "10px",
                        padding: "8px 10px",
                        borderRadius: "8px",
                        border: `1px dashed ${hexToRgba(iconColor, 0.35)}`,
                        color: hexToRgba(contentTextColor, 0.78),
                        fontSize: `${Math.max(11, contentFontSize - 1)}px`,
                      }}
                    >
                      {mediaType === "image" ? "Add an image URL in Configs to preview media here." : "Add a video URL in Configs to preview media here."}
                    </div>
                  )
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
  related: {
    settings: AccordionSettings,
  },
};
