import React from "react";
import { useNode } from "@craftjs/core";
import { TextSettings } from "./TextSettings";

interface TextProps {
  text: string;
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: string;
  lineHeight?: number | string;
  letterSpacing?: number | string;
  textAlign?: "left" | "center" | "right" | "justify";
  textTransform?: "none" | "uppercase" | "lowercase" | "capitalize";
  color?: string;
  margin?: number;
  marginTop?: number;
  marginBottom?: number;
  marginLeft?: number;
  marginRight?: number;
  padding?: number;
  paddingTop?: number;
  paddingBottom?: number;
  paddingLeft?: number;
  paddingRight?: number;
  opacity?: number;
  shadow?: string;
}

export const Text = ({
  text,
  fontSize = 16,
  fontFamily = "Inter",
  fontWeight = "400",
  lineHeight = 1.5,
  letterSpacing = 0,
  textAlign = "left",
  textTransform = "none",
  color = "#ffffff",
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
  shadow = "none"
}: TextProps) => {
  const { connectors: { connect, drag } } = useNode();

  const m = margin;
  const mt = marginTop !== undefined ? marginTop : m;
  const mb = marginBottom !== undefined ? marginBottom : m;
  const ml = marginLeft !== undefined ? marginLeft : m;
  const mr = marginRight !== undefined ? marginRight : m;

  const p = padding;
  const pt = paddingTop !== undefined ? paddingTop : p;
  const pb = paddingBottom !== undefined ? paddingBottom : p;
  const pl = paddingLeft !== undefined ? paddingLeft : p;
  const pr = paddingRight !== undefined ? paddingRight : p;

  return (
    <div
      ref={(ref) => {
        if (ref) connect(drag(ref));
      }}
      style={{
        fontSize: `${fontSize}px`,
        fontFamily,
        fontWeight,
        lineHeight,
        letterSpacing: `${letterSpacing}px`,
        textAlign,
        textTransform,
        color,
        marginTop: `${mt}px`,
        marginBottom: `${mb}px`,
        marginLeft: `${ml}px`,
        marginRight: `${mr}px`,
        paddingTop: `${pt}px`,
        paddingBottom: `${pb}px`,
        paddingLeft: `${pl}px`,
        paddingRight: `${pr}px`,
        opacity,
        boxShadow: shadow
      }}
      className="hover:outline hover:outline-blue-500 cursor-pointer"
    >
      {text}
    </div>
  );
};

export const TextDefaultProps = {
  text: "Edit me!",
  fontSize: 16,
  fontFamily: "Inter",
  fontWeight: "400",
  lineHeight: 1.5,
  letterSpacing: 0,
  textAlign: "left",
  textTransform: "none",
  color: "#ffffff",
  margin: 0,
  padding: 0,
  opacity: 1,
  shadow: "none"
};

Text.craft = {
  displayName: "Text",
  props: TextDefaultProps,
  related: {
    settings: TextSettings
  }
};
