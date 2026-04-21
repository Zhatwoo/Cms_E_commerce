import React from "react";
import { useNode } from "@craftjs/core";
import type { Node } from "@craftjs/core";
import { ButtonSettings } from "./ButtonSettings";
import type { ButtonProps } from "../../_types/components";

const VARIANT_STYLES: Record<NonNullable<ButtonProps["variant"]>, {
  bg: string;
  text: string;
  border: string;
  borderWidth: number;
}> = {
  primary: { bg: "#3b82f6", text: "#ffffff", border: "transparent", borderWidth: 0 },
  secondary: { bg: "#6b7280", text: "#ffffff", border: "transparent", borderWidth: 0 },
  outline: { bg: "transparent", text: "#3b82f6", border: "#3b82f6", borderWidth: 1 },
  ghost: { bg: "transparent", text: "#3b82f6", border: "transparent", borderWidth: 0 },
  cta: { bg: "#000000", text: "#ffffff", border: "transparent", borderWidth: 0 },
};

function fluidSpace(value: number, min = 0): string {
  if (!Number.isFinite(value) || value <= 0) return `${value || 0}px`;
  const preferred = Math.max(0.1, value / 12);
  const floor = Math.max(min, Math.round(value * 0.45));
  return `clamp(${floor}px, ${preferred.toFixed(2)}cqw, ${value}px)`;
}

export const Button = ({
  label,
  text,
  variant = "primary",
  backgroundColor,
  textColor,
  fontSize = 14,
  fontWeight = "500",
  fontFamily = "Outfit",
  borderRadius = 8,
  borderColor,
  borderWidth,
  width = "auto",
  height = "auto",
  padding,
  paddingTop,
  paddingBottom,
  paddingLeft,
  paddingRight,
  margin = 0,
  marginTop,
  marginRight,
  marginBottom,
  marginLeft,
  fontStyle = "normal",
  lineHeight = 1.2,
  letterSpacing = 0,
  textAlign = "center",
  textTransform,
  textDecoration = "none",
  color,
  opacity = 1,
  boxShadow = "none",
  rotation = 0,
  flipHorizontal = false,
  flipVertical = false,
  customClassName = "",
  position = "relative",
  top = "auto",
  right = "auto",
  bottom = "auto",
  left = "auto",
  zIndex = 0,
  alignSelf = "auto",
  display,
  isFreeform,
  children,
}: ButtonProps & { text?: string }) => {
  const { id, connectors: { connect, drag } } = useNode();

  // Resolve variant defaults (user overrides take priority)
  const variantStyle = VARIANT_STYLES[variant ?? "primary"];
  const bg = backgroundColor ?? variantStyle.bg;
  const txt = color ?? textColor ?? variantStyle.text;
  const bc = borderColor ?? variantStyle.border;
  const bw = borderWidth ?? variantStyle.borderWidth;
  const isCta = variant === "cta";
  const fluidFontSize = `clamp(${Math.max(12, Math.round(fontSize * 0.8))}px, ${(fontSize / 12).toFixed(2)}cqw, ${fontSize}px)`;

  // Resolve spacing
  const m = typeof margin === "number" ? margin : 0;
  const mt = marginTop ?? m;
  const mr = marginRight ?? m;
  const mb = marginBottom ?? m;
  const ml = marginLeft ?? m;

  const p = typeof padding === "number" ? padding : undefined;
  const pt = paddingTop ?? p ?? 12;
  const pb = paddingBottom ?? p ?? 12;
  const pl = paddingLeft ?? p ?? 28;
  const pr = paddingRight ?? p ?? 28;
  const resolvedLabel = label ?? text ?? "Button";
  const isAutoWidth = width === "auto";
  const isPercentWidth = typeof width === "string" && width.includes("%");

  return (
    <button
      type="button"
      data-node-id={id}
      data-fluid-button="true"
      data-fluid-space="true"
      ref={(ref) => { if (ref) connect(drag(ref)); }}
      style={{
        backgroundColor: bg,
        color: txt,
        fontSize: fluidFontSize,
        fontWeight,
        fontFamily,
        fontStyle,
        lineHeight,
        letterSpacing: letterSpacing === 0 && isCta ? "0.08em" : letterSpacing,
        textDecoration,
        textTransform: textTransform ?? (isCta ? "uppercase" : undefined),
        borderRadius: `${isCta ? 0 : borderRadius}px`,
        borderColor: bc,
        borderWidth: `${bw}px`,
        borderStyle: bw > 0 ? "solid" : "none",
        width: isAutoWidth ? "fit-content" : width,
        height,
        maxWidth: "100%",
        minWidth: isPercentWidth ? 0 : "max-content",
        flexShrink: isAutoWidth ? 0 : 1,
        containerType: "inline-size",
        paddingTop: fluidSpace(pt, 6),
        paddingBottom: fluidSpace(pb, 6),
        paddingLeft: fluidSpace(pl, 10),
        paddingRight: fluidSpace(pr, 10),
        marginTop: fluidSpace(mt),
        marginRight: fluidSpace(mr),
        marginBottom: fluidSpace(mb),
        marginLeft: fluidSpace(ml),
        opacity,
        boxShadow,
        position,
        alignSelf,
        top: position !== "static" ? top : undefined,
        right: position !== "static" ? right : undefined,
        bottom: position !== "static" ? bottom : undefined,
        left: position !== "static" ? left : undefined,
        zIndex: zIndex !== 0 ? zIndex : undefined,
        transform: [rotation ? `rotate(${rotation}deg)` : null, flipHorizontal ? "scaleX(-1)" : null, flipVertical ? "scaleY(-1)" : null].filter(Boolean).join(" ") || undefined,
        cursor: "pointer",
        display: isFreeform ? "block" : (display ?? "inline-flex"),
        alignItems: "center",
        justifyContent: "center",
        textAlign,
        whiteSpace: "nowrap",
        overflowWrap: "normal",
        wordBreak: "keep-all",
        transition: "background-color 0.15s, opacity 0.15s",
      }}
      className={customClassName}
    >
      {children ?? resolvedLabel}
    </button>
  );
};

export const ButtonDefaultProps: Partial<ButtonProps> = {
  label: "Button",
  link: "",
  variant: "primary",
  fontSize: 14,
  fontWeight: "500",
  fontFamily: "Outfit",
  borderRadius: 8,
  width: "auto",
  height: "auto",
  paddingTop: 12,
  paddingBottom: 12,
  paddingLeft: 28,
  paddingRight: 28,
  margin: 0,
  marginTop: 0,
  marginRight: 0,
  marginBottom: 0,
  marginLeft: 0,
  opacity: 1,
  boxShadow: "none",
};

Button.craft = {
  displayName: "Button",
  props: ButtonDefaultProps,
  rules: {
    canMoveIn: (incomingNodes: Node[]) =>
      incomingNodes.every((node) => node.data.displayName !== "Page"),
  },
  related: {
    settings: ButtonSettings,
  },
};
