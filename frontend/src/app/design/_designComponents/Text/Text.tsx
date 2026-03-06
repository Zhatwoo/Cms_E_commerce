import React, { useEffect, useRef } from "react";
import { useNode, useEditor } from "@craftjs/core";
import { TextSettings } from "./TextSettings";
import { useInlineTextEdit } from "../../_components/InlineTextEditContext";
import type { TextProps } from "../../_types/components";

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
  const { parentDisplay, parentDisplayName, parentFlexDirection } = useEditor((state) => ({
    parentDisplay: parentId ? String(state.nodes[parentId]?.data?.props?.display ?? "") : "",
    parentDisplayName: parentId ? String(state.nodes[parentId]?.data?.displayName ?? "") : "",
    parentFlexDirection: parentId ? String(state.nodes[parentId]?.data?.props?.flexDirection ?? "") : "",
  }));
  const { editingTextNodeId, setEditingTextNodeId } = useInlineTextEdit();
  const isEditing = editingTextNodeId === id;
  const editRef = useRef<HTMLDivElement | null>(null);
  const isFlowText = position !== "absolute" && position !== "fixed";
  // Row, Column, Section hardcode display:flex in JSX without storing it in props,
  // so we detect them by displayName as well.
  const FLEX_PARENT_TYPES = new Set(["Row", "Column", "Section", "Container", "Frame"]);
  const isFlexOrGridParent =
    parentDisplay === "flex" ||
    parentDisplay === "grid" ||
    FLEX_PARENT_TYPES.has(parentDisplayName);
  const isRowParent =
    parentDisplayName === "Row" ||
    (parentDisplay === "flex" && parentFlexDirection.toLowerCase().startsWith("row"));
  const resolvedWidth =
    width ?? (isFlowText && isFlexOrGridParent ? "auto" : undefined);
  const hasExplicitHeight =
    typeof height === "string" &&
    height.trim() !== "" &&
    height.trim().toLowerCase() !== "auto";
  const fluidFontMin = Math.max(10, Math.round(fontSize * 0.5));
  const fluidFontCqw = ((fontSize / 16) * 2.4).toFixed(2);

  useEffect(() => {
    if (isCodeBlock && isEditing) {
      setEditingTextNodeId(null);
    }
  }, [isCodeBlock, isEditing, setEditingTextNodeId]);

  useEffect(() => {
    if (isEditing && editRef.current) {
      editRef.current.focus();
      const range = document.createRange();
      range.selectNodeContents(editRef.current);
      const sel = window.getSelection();
      sel?.removeAllRanges();
      sel?.addRange(range);
    }
  }, [isEditing]);

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
    fontFamily,
    fontWeight,
    fontStyle: fontStyle || "normal",
    lineHeight,
    letterSpacing: `${letterSpacing}px`,
    textAlign,
    textTransform,
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
    marginTop: `${mt}px`,
    marginBottom: `${mb}px`,
    marginLeft: `${ml}px`,
    marginRight: `${mr}px`,
    paddingTop: `${pt}px`,
    paddingBottom: `${pb}px`,
    paddingLeft: `${pl}px`,
    paddingRight: `${pr}px`,
    opacity,
    boxShadow,
    transform: [rotation ? `rotate(${rotation}deg)` : null, flipHorizontal ? "scaleX(-1)" : null, flipVertical ? "scaleY(-1)" : null].filter(Boolean).join(" ") || undefined,
  };

  const handleBlur = () => {
    if (!editRef.current) return;
    const newText = editRef.current.innerText ?? editRef.current.textContent ?? "";
    actions.setProp((props: { text?: string }) => { props.text = newText; });
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
      if (editRef.current) editRef.current.innerText = text;
      setEditingTextNodeId(null);
      editRef.current?.blur();
    }
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
        >
          {text}
        </div>
      ) : (
        text || " "
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
  width: undefined,
  height: "auto",
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
