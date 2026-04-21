/* eslint-disable */
"use client";

import React, { useMemo, useState } from "react";
import { useEditor, useNode } from "@craftjs/core";
import { AccordionSettings } from "./AccordionSettings";
import type { AccordionItem, AccordionOption, AccordionProps } from "../../_types/components";
import type { Interaction } from "../../_types/prototype";

const DEFAULT_ITEMS: AccordionItem[] = [
  {
    header: "Text V",
    options: [{ label: "Option 1" }, { label: "Option 2" }],
  },
];

function normalizeOption(option: string | AccordionOption | undefined, index: number): AccordionOption {
  if (typeof option === "string") {
    return { label: option.trim() || `Option ${index + 1}` };
  }

  const label = typeof option?.label === "string" && option.label.trim() ? option.label.trim() : `Option ${index + 1}`;
  return {
    label,
    interactions: Array.isArray(option?.interactions) ? option.interactions : [],
  };
}

function normalizeItem(item: AccordionItem | undefined, index: number): AccordionItem {
  const header = typeof item?.header === "string" && item.header.trim()
    ? item.header.trim()
    : (typeof item?.title === "string" && item.title.trim() ? item.title.trim() : `Dropdown ${index + 1}`);

  const legacyOptions = Array.isArray(item?.options)
    ? item.options
    : typeof item?.content === "string"
      ? item.content.split(/\r?\n/).map((line) => line.trim()).filter(Boolean)
      : [];

  const options = legacyOptions.length > 0
    ? legacyOptions.map((option, optionIndex) => normalizeOption(option, optionIndex))
    : [{ label: "Option 1" }];

  return { header, options };
}

function normalizeItems(items: AccordionItem[] | undefined): AccordionItem[] {
  return (Array.isArray(items) ? items : []).map((item, index) => normalizeItem(item, index));
}

function hexToRgba(hex: string | undefined, alpha: number): string {
  if (!hex) return `rgba(148, 163, 184, ${alpha})`;
  const raw = hex.trim().replace("#", "");
  if (raw.length !== 6) return `rgba(148, 163, 184, ${alpha})`;
  const r = Number.parseInt(raw.slice(0, 2), 16);
  const g = Number.parseInt(raw.slice(2, 4), 16);
  const b = Number.parseInt(raw.slice(4, 6), 16);
  if ([r, g, b].some((value) => Number.isNaN(value))) return `rgba(148, 163, 184, ${alpha})`;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function isExternalUrl(value: string): boolean {
  return /^(https?:\/\/|mailto:|tel:)/i.test(value.trim());
}

function runAccordionInteraction(interaction: Interaction) {
  const destination = (interaction.destination ?? "").trim();

  if (interaction.action === "back") {
    window.history.back();
    return;
  }

  if (!destination) return;

  if (interaction.action === "openUrl") {
    window.open(destination, "_blank", "noopener");
    return;
  }

  if (interaction.action === "scrollTo") {
    const targetId = destination.startsWith("#") ? destination.slice(1) : destination;
    document.getElementById(targetId)?.scrollIntoView({ behavior: "smooth" });
    return;
  }

  if (interaction.action === "navigateTo") {
    const nextUrl = destination.startsWith("/") || isExternalUrl(destination)
      ? destination
      : `/${destination.replace(/^\/+/, "")}`;
    window.location.assign(nextUrl);
  }
}

export const Accordion = ({
  items = DEFAULT_ITEMS,
  stylePreset = "wix",
  editorPreviewMode = "normal",
  allowMultiple = false,
  allowCollapseAll = true,
  defaultOpenIndex = -1,
  animationDurationMs = 280,
  width = "140px",
  height,
  maxWidth = "100%",
  minHeight = 0,
  marginTop = 0,
  marginRight = 0,
  marginBottom = 0,
  marginLeft = 0,
  borderRadius = 8,
  backgroundColor = "transparent",
  headerTextColor = "#10213f",
  headerFontSize = 14,
  headerFontWeight = "600",
  headerFontStyle = "normal",
  headerLetterSpacing = "0.01em",
  headerLineHeight = 1.3,
  headerTextAlign = "left",
  headerTextTransform = "none",
  headerTextDecoration = "none",
  contentTextColor = "#334155",
  contentFontSize = 13,
  contentFontWeight = "400",
  contentFontStyle = "normal",
  contentLetterSpacing = 0,
  contentLineHeight = "1.6",
  contentTextAlign = "left",
  contentTextTransform = "none",
  contentTextDecoration = "none",
  fontFamily = "Outfit",
  borderColor = "#d4dfef",
  borderWidth = 1,
  iconColor = "#4a89ff",
  iconPosition = "right",
  headerGap = 12,
  headerPaddingX = 12,
  headerPaddingY = 10,
  textOffsetX = 0,
  textOffsetY = 0,
  iconOffsetX = 0,
  iconOffsetY = 0,
  position = "relative",
  top = "auto",
  right = "auto",
  bottom = "auto",
  left = "auto",
  zIndex = 0,
  display,
  isFreeform,
  editorVisibility = "auto",
  alignSelf = "auto",
}: AccordionProps) => {
  const {
    connectors: { connect },
    actions: { setProp },
  } = useNode();
  const { enabled } = useEditor((state) => ({ enabled: state.options.enabled }));
  const [editingCell, setEditingCell] = useState<{ itemIndex: number; optionIndex?: number; field: "header" | "option" } | null>(null);
  const [openIndexes, setOpenIndexes] = useState<number[]>([]);

  const safeItems = useMemo(() => normalizeItems(items), [items]);
  const safeDuration = Number.isFinite(animationDurationMs) ? Math.max(80, Math.min(1200, animationDurationMs)) : 280;
  const isWix = stylePreset === "wix";
  const effectiveDisplay = isFreeform
    ? "block"
    : editorVisibility === "hide"
      ? "none"
      : editorVisibility === "show" && display === "none"
        ? "flex"
        : (display ?? "flex");

  const normalizedDefaultIndex = Number.isFinite(defaultOpenIndex) ? Math.floor(defaultOpenIndex) : -1;
  const defaultIndex = safeItems.length > 0 && normalizedDefaultIndex >= 0
    ? Math.min(normalizedDefaultIndex, safeItems.length - 1)
    : -1;

  React.useEffect(() => {
    setOpenIndexes((current) => {
      const clamped = current.filter((index) => index >= 0 && index < safeItems.length);
      if (clamped.length > 0) return clamped;

      if (editorPreviewMode === "expand-all") {
        return safeItems.map((_, index) => index);
      }

      if (editorPreviewMode === "collapse-all") {
        return [];
      }

      // In editor mode, keep dropdown collapsed by default unless user opens it.
      if (enabled) {
        return [];
      }

      return defaultIndex >= 0 ? [defaultIndex] : [];
    });
  }, [defaultIndex, editorPreviewMode, safeItems, enabled]);

  const hasOpenItems = openIndexes.length > 0;
  const resolvedContainerHeight = hasOpenItems ? (height || "auto") : "auto";

  const toggle = (index: number) => {
    if (allowMultiple) {
      setOpenIndexes((current) => current.includes(index)
        ? (allowCollapseAll ? current.filter((item) => item !== index) : current)
        : [...current, index]);
      return;
    }

    setOpenIndexes((current) => {
      const isOpen = current.includes(index);
      if (isOpen) return allowCollapseAll ? [] : current;
      return [index];
    });
  };

  const swallowPointer = (event: React.SyntheticEvent) => {
    event.stopPropagation();
  };

  const updateHeader = (itemIndex: number, value: string) => {
    setProp((props: AccordionProps) => {
      const next = normalizeItems(props.items ?? safeItems);
      const current = next[itemIndex];
      if (!current) return;
      next[itemIndex] = { ...current, header: value };
      props.items = next;
    });
  };

  const updateOption = (itemIndex: number, optionIndex: number, value: string) => {
    setProp((props: AccordionProps) => {
      const next = normalizeItems(props.items ?? safeItems);
      const current = next[itemIndex];
      const option = current?.options?.[optionIndex];
      if (!current || !option) return;
      const options = [...current.options];
      options[optionIndex] = { ...option, label: value };
      next[itemIndex] = { ...current, options };
      props.items = next;
    });
  };

  const addOption = (itemIndex: number) => {
    setProp((props: AccordionProps) => {
      const next = normalizeItems(props.items ?? safeItems);
      const current = next[itemIndex];
      if (!current) return;
      next[itemIndex] = {
        ...current,
        options: [...current.options, { label: `Option ${current.options.length + 1}` }],
      };
      props.items = next;
    });
  };

  return (
    <div
      ref={connect}
      data-canvas-interactive="true"
      data-drop-block="true"
      data-drop-block-type="Accordion"
      style={{
        width,
        height: resolvedContainerHeight,
        maxWidth,
        minHeight: typeof minHeight === "number" ? (minHeight > 0 ? `${minHeight}px` : undefined) : minHeight,
        alignSelf,
        backgroundColor,
        marginTop: `${marginTop}px`,
        marginRight: `${marginRight}px`,
        marginBottom: `${marginBottom}px`,
        marginLeft: `${marginLeft}px`,
        borderRadius: `${borderRadius}px`,
        overflow: "hidden",
        cursor: "default",
        display: effectiveDisplay,
        flexDirection: "column",
        gap: "8px",
        border: `${borderWidth}px solid ${borderColor}`,
        position,
        top: position !== "static" ? top : undefined,
        right: position !== "static" ? right : undefined,
        bottom: position !== "static" ? bottom : undefined,
        left: position !== "static" ? left : undefined,
        zIndex: zIndex !== 0 ? zIndex : undefined,
        containerType: "inline-size",
      }}
    >
      {safeItems.map((item, itemIndex) => {
        const isOpen = openIndexes.includes(itemIndex);
        return (
          <div key={itemIndex} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <button
              type="button"
              data-canvas-interactive="true"
              draggable={false}
              onPointerDownCapture={swallowPointer}
              onPointerDown={swallowPointer}
              onMouseDown={swallowPointer}
              onTouchStart={swallowPointer}
              onClick={(event) => {
                event.stopPropagation();
                toggle(itemIndex);
              }}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: headerGap,
                padding: `${headerPaddingY}px ${headerPaddingX}px`,
                background: isWix ? "#fff" : "linear-gradient(180deg, #ffffff 0%, #f7f4ff 100%)",
                color: headerTextColor,
                fontSize: `clamp(${Math.max(10, Math.round(headerFontSize * 0.8))}px, ${(headerFontSize / 12).toFixed(2)}cqw, ${headerFontSize}px)`,
                fontWeight: headerFontWeight,
                fontFamily,
                fontStyle: headerFontStyle,
                letterSpacing: headerLetterSpacing,
                lineHeight: headerLineHeight,
                textAlign: headerTextAlign,
                textTransform: headerTextTransform,
                textDecoration: headerTextDecoration,
                border: `1px solid ${hexToRgba(iconColor, 0.18)}`,
                borderRadius: 12,
                outline: "none",
                cursor: "pointer",
              }}
            >
              {iconPosition === "left" && (
                <span
                  aria-hidden="true"
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: 999,
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: hexToRgba(iconColor, 0.12),
                    border: `1px solid ${hexToRgba(iconColor, 0.28)}`,
                    flexShrink: 0,
                    transform: `translate(${iconOffsetX}px, ${iconOffsetY}px)`,
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={iconColor} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ transition: `transform ${safeDuration}ms ease`, transform: isOpen ? "rotate(180deg)" : "rotate(0deg)" }}>
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </span>
              )}
              <span
                contentEditable={enabled && editingCell?.itemIndex === itemIndex && editingCell.field === "header"}
                suppressContentEditableWarning
                onDoubleClick={(event) => {
                  if (!enabled) return;
                  event.stopPropagation();
                  setEditingCell({ itemIndex, field: "header" });
                }}
                onBlur={(event) => {
                  if (editingCell?.itemIndex !== itemIndex || editingCell.field !== "header") return;
                  updateHeader(itemIndex, event.currentTarget.textContent ?? item.header);
                  setEditingCell(null);
                }}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    (event.currentTarget as HTMLElement).blur();
                  }
                }}
                style={{
                  display: "block",
                  minWidth: 0,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  cursor: enabled ? "text" : "default",
                  transform: `translate(${textOffsetX}px, ${textOffsetY}px)`,
                  flex: 1,
                }}
              >
                {item.header}
              </span>
              {iconPosition === "right" && (
                <span
                  aria-hidden="true"
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: 999,
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: hexToRgba(iconColor, 0.12),
                    border: `1px solid ${hexToRgba(iconColor, 0.28)}`,
                    flexShrink: 0,
                    transform: `translate(${iconOffsetX}px, ${iconOffsetY}px)`,
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={iconColor} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ transition: `transform ${safeDuration}ms ease`, transform: isOpen ? "rotate(180deg)" : "rotate(0deg)" }}>
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </span>
              )}
            </button>

            {isOpen && (
              <div style={{ display: "flex", flexDirection: "column", gap: 8, padding: 8, borderRadius: 12, border: `1px solid ${hexToRgba(borderColor, 0.7)}`, backgroundColor: hexToRgba("#ffffff", 0.92) }}>
                {item.options.map((option, optionIndex) => (
                  <button
                    key={`${itemIndex}-${optionIndex}`}
                    type="button"
                    data-canvas-interactive="true"
                    draggable={false}
                    onPointerDownCapture={swallowPointer}
                    onPointerDown={swallowPointer}
                    onMouseDown={swallowPointer}
                    onTouchStart={swallowPointer}
                    onClick={(event) => {
                      event.stopPropagation();
                      (option.interactions ?? []).forEach(runAccordionInteraction);
                    }}
                    style={{
                      width: "100%",
                      textAlign: "left",
                      padding: "8px 10px",
                      borderRadius: 10,
                      border: `1px solid ${hexToRgba(borderColor, 0.5)}`,
                      backgroundColor: hexToRgba("#f8fafc", 0.95),
                      color: contentTextColor,
                      fontSize: contentFontSize,
                      fontWeight: contentFontWeight,
                      fontFamily,
                      fontStyle: contentFontStyle,
                      letterSpacing: contentLetterSpacing,
                      lineHeight: contentLineHeight,
                      textAlign: contentTextAlign,
                      textTransform: contentTextTransform,
                      textDecoration: contentTextDecoration,
                      cursor: "pointer",
                    }}
                  >
                    <span
                      contentEditable={enabled && editingCell?.itemIndex === itemIndex && editingCell?.optionIndex === optionIndex && editingCell.field === "option"}
                      suppressContentEditableWarning
                      onDoubleClick={(event) => {
                        if (!enabled) return;
                        event.stopPropagation();
                        setEditingCell({ itemIndex, optionIndex, field: "option" });
                      }}
                      onBlur={(event) => {
                        if (editingCell?.itemIndex !== itemIndex || editingCell?.optionIndex !== optionIndex || editingCell.field !== "option") return;
                        updateOption(itemIndex, optionIndex, event.currentTarget.textContent ?? option.label);
                        setEditingCell(null);
                      }}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          event.preventDefault();
                          (event.currentTarget as HTMLElement).blur();
                        }
                      }}
                      style={{ display: "block", cursor: enabled ? "text" : "default" }}
                    >
                      {option.label}
                    </span>
                  </button>
                ))}

                {enabled && (
                  <button
                    type="button"
                    data-canvas-interactive="true"
                    draggable={false}
                    onPointerDownCapture={swallowPointer}
                    onPointerDown={swallowPointer}
                    onMouseDown={swallowPointer}
                    onTouchStart={swallowPointer}
                    onClick={(event) => {
                      event.stopPropagation();
                      addOption(itemIndex);
                    }}
                    style={{
                      width: "100%",
                      border: `1px dashed ${hexToRgba(iconColor, 0.32)}`,
                      backgroundColor: hexToRgba(iconColor, 0.06),
                      color: headerTextColor,
                      borderRadius: 10,
                      padding: "8px 10px",
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    + Option
                  </button>
                )}
              </div>
            )}
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
  defaultOpenIndex: -1,
  animationDurationMs: 280,
  width: "140px",
  maxWidth: "100%",
  marginTop: 0,
  marginRight: 0,
  marginBottom: 16,
  marginLeft: 0,
  borderRadius: 10,
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
  iconPosition: "right",
  headerGap: 12,
  headerPaddingX: 12,
  headerPaddingY: 10,
  textOffsetX: 0,
  textOffsetY: 0,
  iconOffsetX: 0,
  iconOffsetY: 0,
  alignSelf: "auto",
  isFreeform: false,
  position: "static",
  display: "block",
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