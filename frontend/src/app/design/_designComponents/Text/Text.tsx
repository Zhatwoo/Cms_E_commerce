import React, { useEffect, useRef } from "react";
import { useNode, useEditor } from "@craftjs/core";
import { TextSettings } from "./TextSettings";
import { useInlineTextEdit } from "../../_components/InlineTextEditContext";
import type { TextProps } from "../../_types/components";

const NEW_TEXT_PLACEHOLDER = "Type something...";

function normalizeTextValue(value: string): string {
  return value.replace(/\u00a0/g, " ").replace(/\s+/g, " ").trim();
}

function stripSeedPlaceholder(value: string): string {
  if (!value) return value;
  return value.split(NEW_TEXT_PLACEHOLDER).join("").replace(/^\s+/, "");
}

function shouldStripPlaceholder(value: string): boolean {
  const normalized = normalizeTextValue(value);
  if (!normalized) return false;
  if (!value.includes(NEW_TEXT_PLACEHOLDER)) return false;
  return normalized !== normalizeTextValue(NEW_TEXT_PLACEHOLDER);
}

function isPlaceholderOnly(value: string): boolean {
  return normalizeTextValue(value) === normalizeTextValue(NEW_TEXT_PLACEHOLDER);
}

function fluidSpace(value: number, min = 0): string {
  if (!Number.isFinite(value) || value <= 0) return `${value || 0}px`;
  const preferred = Math.max(0.1, value / 12);
  const floor = Math.max(min, Math.round(value * 0.45));
  return `clamp(${floor}px, ${preferred.toFixed(2)}cqw, ${value}px)`;
}

function applyRenderedTextTransform(value: string, transform: TextProps["textTransform"]): string {
  if (!value) return value;
  if (transform === "capitalize") {
    return value
      .toLowerCase()
      .replace(/(^|[\s([{'"`-])([a-z])/g, (_, prefix: string, letter: string) => `${prefix}${letter.toUpperCase()}`);
  }
  return value;
}

export const Text = ({
  text,
  fontSize = 16,
  fontFamily = "Outfit",
  fontWeight = "400",
  fontStyle = "normal",
  lineHeight = 1.5,
  letterSpacing = 0,
  textAlign = "left",
  textTransform = "none",
  color = "#000000",
  position = "relative",
  display = "block",
  zIndex = 2,
  top = "auto",
  right = "auto",
  bottom = "auto",
  left = "auto",
  width,
  height,
  margin = 0,
  marginTop,
  marginBottom,
  marginLeft,
  marginRight,
  padding = 0,
  paddingTop,
  paddingBottom,
  paddingLeft,
  paddingRight,
  opacity = 1,
  boxShadow = "none",
  isCodeBlock = false,
  rotation = 0,
  flipHorizontal = false,
  flipVertical = false,
  customClassName = "",
}: TextProps & { width?: string; height?: string }) => {
  const { id, connectors: { connect, drag }, actions, parentId } = useNode((node) => ({
    parentId: node.data.parent,
  }));
  const { parentDisplay, parentDisplayName } = useEditor((state) => ({
    parentDisplay: parentId ? String(state.nodes[parentId]?.data?.props?.display ?? "") : "",
    parentDisplayName: parentId ? String(state.nodes[parentId]?.data?.displayName ?? "") : "",
  }));
  const { editingTextNodeId, setEditingTextNodeId } = useInlineTextEdit();
  const isEditing = editingTextNodeId === id;
  const resolvedText = typeof text === "string" ? text : "";
  const isSeedPlaceholderText = isPlaceholderOnly(resolvedText);
  const renderedText = applyRenderedTextTransform(resolvedText, textTransform);
  const editRef = useRef<HTMLDivElement | null>(null);
  const didInitEditingRef = useRef(false);
  const pendingTextRef = useRef<string>(resolvedText);
  const lastSyncedTextRef = useRef<string>(resolvedText);
  const syncTimeoutRef = useRef<number | null>(null);
  const isFlowText = position !== "absolute" && position !== "fixed";
  // Row, Column, Section hardcode display:flex in JSX without storing it in props,
  // so we detect them by displayName as well.
  const FLEX_PARENT_TYPES = new Set(["Row", "Column", "Section", "Container", "Frame"]);
  const isFlexOrGridParent =
    parentDisplay === "flex" ||
    parentDisplay === "grid" ||
    FLEX_PARENT_TYPES.has(parentDisplayName);
  const resolvedWidth = width ?? (isFlowText && isFlexOrGridParent ? "100%" : undefined);
  const hasExplicitHeight =
    typeof height === "string" &&
    height.trim() !== "" &&
    height.trim().toLowerCase() !== "auto";
  const fluidFontMin = Math.max(12, Math.round(fontSize * 0.7));
  const fluidFontCqw = ((fontSize / 16) * 2.1).toFixed(2);

  useEffect(() => {
    if (isCodeBlock && isEditing) {
      setEditingTextNodeId(null);
    }
  }, [isCodeBlock, isEditing, setEditingTextNodeId]);

  useEffect(() => {
    if (isEditing && editRef.current && !didInitEditingRef.current) {
      didInitEditingRef.current = true;
      editRef.current.focus();
      editRef.current.innerText = isSeedPlaceholderText ? "" : resolvedText;
      const range = document.createRange();
      range.selectNodeContents(editRef.current);
      range.collapse(false);
      const sel = window.getSelection();
      sel?.removeAllRanges();
      sel?.addRange(range);
      return;
    }

    if (!isEditing) {
      didInitEditingRef.current = false;
    }
  }, [isEditing, isSeedPlaceholderText, resolvedText]);

  useEffect(() => {
    if (!isEditing) {
      pendingTextRef.current = resolvedText;
      lastSyncedTextRef.current = resolvedText;
    }
  }, [isEditing, resolvedText]);

  useEffect(() => {
    return () => {
      if (syncTimeoutRef.current !== null) {
        window.clearTimeout(syncTimeoutRef.current);
      }
    };
  }, []);

  const flushPendingTextSync = (force = false) => {
    const nextText = pendingTextRef.current;
    if (!force && nextText === lastSyncedTextRef.current) return;
    actions.setProp((props: { text?: string }) => {
      props.text = nextText;
    });
    lastSyncedTextRef.current = nextText;
  };

  const m = typeof margin === "number" ? margin : 0;
  const mt = marginTop !== undefined ? marginTop : m;
  const mb = marginBottom !== undefined ? marginBottom : m;
  const ml = marginLeft !== undefined ? marginLeft : m;
  const mr = marginRight !== undefined ? marginRight : m;

  const p = typeof padding === "number" ? padding : 0;
  const pt = paddingTop !== undefined ? paddingTop : p;
  const pb = paddingBottom !== undefined ? paddingBottom : p;
  const pl = paddingLeft !== undefined ? paddingLeft : p;
  const pr = paddingRight !== undefined ? paddingRight : p;

  const baseStyle: React.CSSProperties & Record<string, string | number | undefined> = {
    "--fluid-font-max": isFlowText ? `${fontSize}px` : undefined,
    "--fluid-font-cqw": isFlowText ? `${(fontSize / 16) * 2.4}cqw` : undefined,
    fontSize: isFlowText
      ? `clamp(${fluidFontMin}px, ${fluidFontCqw}cqw, ${fontSize}px)`
      : `${fontSize}px`,
    isolation: "isolate",
    WebkitFontSmoothing: "antialiased",
    fontFamily,
    fontWeight,
    fontStyle: fontStyle || "normal",
    lineHeight,
    letterSpacing: `${letterSpacing}px`,
    textAlign,
    textTransform: textTransform === "capitalize" ? "none" : textTransform,
    color,
    position,
    zIndex,
    top: position !== "static" ? top : undefined,
    right: position !== "static" ? right : undefined,
    bottom: position !== "static" ? bottom : undefined,
    left: position !== "static" ? left : undefined,
    width: resolvedWidth,
    height: hasExplicitHeight ? height : "auto",
    maxWidth: "100%",
    minWidth: 0,
    alignSelf: undefined,
    boxSizing: "border-box",
    minHeight: hasExplicitHeight ? undefined : "min-content",
    overflow: hasExplicitHeight ? "hidden" : "visible",
    whiteSpace: "pre-wrap",
    overflowWrap: "break-word",
    wordBreak: "normal",
    hyphens: "manual",
    display,
    flexShrink: isFlexOrGridParent && isFlowText && !width ? 1 : undefined,
    marginTop: fluidSpace(mt),
    marginBottom: fluidSpace(mb),
    marginLeft: fluidSpace(ml),
    marginRight: fluidSpace(mr),
    paddingTop: fluidSpace(pt),
    paddingBottom: fluidSpace(pb),
    paddingLeft: fluidSpace(pl),
    paddingRight: fluidSpace(pr),
    opacity,
    boxShadow,
    transform: [rotation ? `rotate(${rotation}deg)` : null, flipHorizontal ? "scaleX(-1)" : null, flipVertical ? "scaleY(-1)" : null].filter(Boolean).join(" ") || undefined,
  };

  const handleBlur = () => {
    if (!editRef.current) return;
    const rawText = editRef.current.innerText ?? editRef.current.textContent ?? "";
    const sanitizedText =
      isSeedPlaceholderText || shouldStripPlaceholder(rawText)
        ? stripSeedPlaceholder(rawText)
        : rawText;
    if (syncTimeoutRef.current !== null) {
      window.clearTimeout(syncTimeoutRef.current);
      syncTimeoutRef.current = null;
    }
    pendingTextRef.current = sanitizedText;
    flushPendingTextSync(true);
    setEditingTextNodeId(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isCodeBlock && e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      editRef.current?.blur();
    }
    if (isCodeBlock && e.key === "Tab") {
      e.preventDefault();
      document.execCommand("insertText", false, "  ");
    }
    if (e.key === "Escape") {
      e.preventDefault();
      if (editRef.current) editRef.current.innerText = isSeedPlaceholderText ? "" : resolvedText;
      setEditingTextNodeId(null);
      editRef.current?.blur();
    }
  };

  const handleInput = () => {
    if (!editRef.current) return;
    const currentText = editRef.current.innerText ?? editRef.current.textContent ?? "";
    const shouldSanitize = isSeedPlaceholderText || shouldStripPlaceholder(currentText);
    const sanitizedText = shouldSanitize ? stripSeedPlaceholder(currentText) : currentText;

    if (sanitizedText !== currentText) {
      editRef.current.innerText = sanitizedText;

      const selection = window.getSelection();
      if (selection) {
        const range = document.createRange();
        range.selectNodeContents(editRef.current);
        range.collapse(false);
        selection.removeAllRanges();
        selection.addRange(range);
      }
    }

    pendingTextRef.current = sanitizedText;
    if (syncTimeoutRef.current !== null) {
      return;
    }

    // Keep config panel connected but avoid heavy updates on every keystroke.
    syncTimeoutRef.current = window.setTimeout(() => {
      syncTimeoutRef.current = null;
      flushPendingTextSync();
    }, 80);
  };

  return (
    <div
      data-fluid-text="true"
      data-node-id={id}
      onMouseDown={(e) => {
        if (isEditing) e.preventDefault();
      }}
      onDragStart={(e) => {
        if (isEditing) e.preventDefault();
      }}
      onDoubleClick={(e) => {
        if (isCodeBlock) return;
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
        e.stopPropagation();
        setEditingTextNodeId(id);
      }}
      ref={(ref) => {
        if (ref) connect(drag(ref));
      }}
      className={`${isCodeBlock ? "cursor-default" : isEditing ? "cursor-text" : "cursor-pointer"} ${customClassName}`}
      style={baseStyle}
    >
      {isEditing ? (
        <div
          data-inline-text-edit
          ref={editRef}
          contentEditable
          suppressContentEditableWarning
          onMouseDown={(e) => {
            e.stopPropagation();
          }}
          onClick={(e) => {
            e.stopPropagation();
          }}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          onInput={handleInput}
          style={{
            outline: "none",
            minHeight: "1em",
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
            fontSize: "inherit",
            fontFamily: "inherit",
            fontWeight: "inherit",
            color: "inherit",
            lineHeight: "inherit",
            width: "100%",
          }}
        />
      ) : (
        resolvedText
          ? renderedText
          : <span style={{ opacity: 0.58, display: "inline-block", minWidth: 0 }}>{NEW_TEXT_PLACEHOLDER}</span>
      )}
    </div>
  );
};

export const TextDefaultProps: Partial<TextProps & { width?: string; height?: string }> = {
  text: "",
  fontSize: 16,
  fontFamily: "Outfit",
  fontWeight: "400",
  fontStyle: "normal",
  lineHeight: 1.5,
  letterSpacing: 0,
  textAlign: "left",
  textTransform: "none",
  color: "#000000",
  position: "relative",
  display: "block",
  zIndex: 2,
  top: "auto",
  right: "auto",
  bottom: "auto",
  left: "auto",
  width: "fit-content",
  height: "fit-content",
  margin: 0,
  marginTop: 0,
  marginRight: 0,
  marginBottom: 0,
  marginLeft: 0,
  padding: 0,
  paddingTop: 0,
  paddingRight: 0,
  paddingBottom: 0,
  paddingLeft: 0,
  opacity: 1,
  boxShadow: "none",
  previewEditable: false,
};

Text.craft = {
  displayName: "Text",
  props: TextDefaultProps,
  related: {
    settings: TextSettings
  }
};
