import React from "react";
import { useNode } from "@craftjs/core";
import { TextSettings } from "./TextSettings";
import type { TextProps } from "../../_types/components";

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
  boxShadow = "none"
}: TextProps) => {
  const { connectors: { connect, drag } } = useNode();

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
        boxShadow
      }}
      className="hover:outline hover:outline-blue-500 cursor-pointer"
    >
      {text}
    </div>
  );
};

export const TextDefaultProps: Partial<TextProps> = {
  text: "Edit me!",
  fontSize: 16,
  fontFamily: "Inter",
  fontWeight: "400",
  lineHeight: 1.5,
  letterSpacing: 0,
  textAlign: "left",
  textTransform: "none",
  color: "#000000",
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
  boxShadow: "none"
};

Text.craft = {
  displayName: "Text",
  props: TextDefaultProps,
  related: {
    settings: TextSettings
  }
};
