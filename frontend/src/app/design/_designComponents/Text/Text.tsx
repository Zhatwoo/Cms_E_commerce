import React, { useEffect, useRef } from "react";
import { useNode } from "@craftjs/core";
import { TextSettings } from "./TextSettings";
import { useInlineTextEdit } from "../../_components/InlineTextEditContext";
import type { TextProps } from "../../_types/components";

export const Text = ({
  text,
  fontSize = 16,
  fontFamily = "Inter",
  fontWeight = "400",
  fontStyle = "normal",
  lineHeight = 1.5,
  letterSpacing = 0,
  textAlign = "left",
  textTransform = "none",
  color = "#ffffff",
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
  rotation = 0,
  flipHorizontal = false,
  flipVertical = false,
  customClassName = "",
}: TextProps & { width?: string; height?: string }) => {
  const { id, connectors: { connect, drag }, actions } = useNode();
  const { editingTextNodeId, setEditingTextNodeId } = useInlineTextEdit();
  const isEditing = editingTextNodeId === id;
  const editRef = useRef<HTMLDivElement | null>(null);

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

  const baseStyle: React.CSSProperties = {
    fontSize: `${fontSize}px`,
    fontFamily,
    fontWeight,
    fontStyle: fontStyle || "normal",
    lineHeight,
    letterSpacing: `${letterSpacing}px`,
    textAlign,
    textTransform,
    color,
    position,
    display,
    zIndex,
    top: position !== "static" ? top : undefined,
    right: position !== "static" ? right : undefined,
    bottom: position !== "static" ? bottom : undefined,
    left: position !== "static" ? left : undefined,
    width: width || undefined,
    height: height || undefined,
    overflow: height ? "hidden" : undefined,
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
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      editRef.current?.blur();
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
      data-node-id={id}
      ref={(ref) => {
        if (ref) connect(drag(ref));
      }}
      className={`hover:outline hover:outline-blue-500 cursor-pointer ${customClassName}`}
      style={baseStyle}
    >
      {isEditing ? (
        <div
          data-inline-text-edit
          ref={editRef}
          contentEditable
          suppressContentEditableWarning
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          style={{
            outline: "none",
            minHeight: "1em",
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
          }}
        >
          {text}
        </div>
      ) : (
        text
      )}
    </div>
  );
};

export const TextDefaultProps: Partial<TextProps> = {
  text: "Edit me!",
  fontSize: 16,
  fontFamily: "Inter",
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
