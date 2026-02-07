import React from "react";
import { useNode } from "@craftjs/core";
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
};

export const Button = ({
  label = "Button",
  link = "",
  variant = "primary",
  backgroundColor,
  textColor,
  fontSize = 14,
  fontWeight = "500",
  fontFamily = "Inter",
  borderRadius = 8,
  borderColor,
  borderWidth,
  width = "auto",
  height = "auto",
  padding = 0,
  paddingTop = 10,
  paddingBottom = 10,
  paddingLeft = 24,
  paddingRight = 24,
  margin = 0,
  marginTop,
  marginRight,
  marginBottom,
  marginLeft,
  opacity = 1,
  boxShadow = "none",
}: ButtonProps) => {
  const { connectors: { connect, drag } } = useNode();

  // Resolve variant defaults (user overrides take priority)
  const variantStyle = VARIANT_STYLES[variant ?? "primary"];
  const bg = backgroundColor ?? variantStyle.bg;
  const txt = textColor ?? variantStyle.text;
  const bc = borderColor ?? variantStyle.border;
  const bw = borderWidth ?? variantStyle.borderWidth;

  // Resolve spacing
  const m = typeof margin === "number" ? margin : 0;
  const mt = marginTop ?? m;
  const mr = marginRight ?? m;
  const mb = marginBottom ?? m;
  const ml = marginLeft ?? m;

  return (
    <button
      ref={(ref) => { if (ref) connect(drag(ref)); }}
      style={{
        backgroundColor: bg,
        color: txt,
        fontSize: `${fontSize}px`,
        fontWeight,
        fontFamily,
        borderRadius: `${borderRadius}px`,
        borderColor: bc,
        borderWidth: `${bw}px`,
        borderStyle: bw > 0 ? "solid" : "none",
        width,
        height,
        paddingTop: `${paddingTop}px`,
        paddingBottom: `${paddingBottom}px`,
        paddingLeft: `${paddingLeft}px`,
        paddingRight: `${paddingRight}px`,
        marginTop: `${mt}px`,
        marginRight: `${mr}px`,
        marginBottom: `${mb}px`,
        marginLeft: `${ml}px`,
        opacity,
        boxShadow,
        cursor: "pointer",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        transition: "background-color 0.15s, opacity 0.15s",
      }}
      className="hover:outline hover:outline-blue-500"
    >
      {label}
    </button>
  );
};

export const ButtonDefaultProps: Partial<ButtonProps> = {
  label: "Button",
  link: "",
  variant: "primary",
  fontSize: 14,
  fontWeight: "500",
  fontFamily: "Inter",
  borderRadius: 8,
  width: "auto",
  height: "auto",
  paddingTop: 10,
  paddingBottom: 10,
  paddingLeft: 24,
  paddingRight: 24,
  margin: 0,
  opacity: 1,
  boxShadow: "none",
};

Button.craft = {
  displayName: "Button",
  props: ButtonDefaultProps,
  related: {
    settings: ButtonSettings,
  },
};
