"use client";

import React from "react";
import { Element, useNode } from "@craftjs/core";
import { ChevronRight } from "../../Icon/ChevronRight/ChevronRight";
import { TemplateEntry } from "../../_types";
import { ProfileLoginSettings } from "./ProfileLoginSettings";

export interface ProfileLoginNodeProps {
  text?: string;
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: string;
  fontStyle?: string;
  lineHeight?: number | string;
  letterSpacing?: number | string;
  textAlign?: "left" | "center" | "right" | "justify";
  textTransform?: "none" | "uppercase" | "lowercase" | "capitalize";
  color?: string;
  iconColor?: string;
  arrowSize?: number;
  avatarSrc?: string;
  avatarSize?: number;
  width?: string | number;
  height?: string | number;
  display?: "inline-flex" | "flex" | "block";
  alignItems?: "flex-start" | "center" | "flex-end" | "stretch";
  justifyContent?: "flex-start" | "center" | "flex-end" | "space-between" | "space-around";
  gap?: number;
  padding?: number;
  paddingTop?: number;
  paddingRight?: number;
  paddingBottom?: number;
  paddingLeft?: number;
  margin?: number;
  marginTop?: number;
  marginRight?: number;
  marginBottom?: number;
  marginLeft?: number;
  background?: string;
  borderRadius?: number;
  borderColor?: string;
  borderWidth?: number;
  borderStyle?: string;
  boxShadow?: string;
  opacity?: number;
  overflow?: string;
  position?: "static" | "relative" | "absolute" | "fixed" | "sticky";
  top?: string;
  right?: string;
  bottom?: string;
  left?: string;
  zIndex?: number;
  rotation?: number;
  customClassName?: string;
}

export const ProfileLoginNode = ({
  text = "Login",
  fontSize = 18,
  fontFamily = "Outfit",
  fontWeight = "400",
  fontStyle = "normal",
  lineHeight = 1.5,
  letterSpacing = 0,
  textAlign = "left",
  textTransform = "none",
  color = "#000000",
  iconColor = "#000000",
  arrowSize = 20,
  avatarSrc = "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=96&h=96&fit=crop&crop=face",
  avatarSize = 34,
  width = "220px",
  height = "fit-content",
  display = "flex",
  alignItems = "center",
  justifyContent = "flex-start",
  gap = 10,
  padding = 0,
  paddingTop,
  paddingRight,
  paddingBottom,
  paddingLeft,
  margin = 0,
  marginTop,
  marginRight,
  marginBottom,
  marginLeft,
  background = "transparent",
  borderRadius = 0,
  borderColor = "transparent",
  borderWidth = 0,
  borderStyle = "solid",
  boxShadow = "none",
  opacity = 1,
  overflow = "visible",
  position = "relative",
  top = "auto",
  right = "auto",
  bottom = "auto",
  left = "auto",
  zIndex = 0,
  rotation = 0,
  customClassName = "",
}: ProfileLoginNodeProps) => {
  const {
    connectors: { connect, drag },
  } = useNode();

  const p = typeof padding === "number" ? padding : 0;
  const pt = paddingTop ?? p;
  const pr = paddingRight ?? p;
  const pb = paddingBottom ?? p;
  const pl = paddingLeft ?? p;

  const m = typeof margin === "number" ? margin : 0;
  const mt = marginTop ?? m;
  const mr = marginRight ?? m;
  const mb = marginBottom ?? m;
  const ml = marginLeft ?? m;

  const safeLineHeight = typeof lineHeight === "number" ? Math.max(1.1, lineHeight) : lineHeight;
  const resolvedFontSize = typeof fontSize === "number" ? fontSize : 34;
  const resolvedWidth = typeof width === "number" ? `${width}px` : width;
  const resolvedHeight = typeof height === "number" ? `${height}px` : height;

  return (
    <div
      ref={(ref) => {
        if (ref) connect(drag(ref));
      }}
      className={customClassName}
      style={{
        display: display === "inline-flex" ? "flex" : display,
        alignItems,
        justifyContent,
        gap: `${gap || 0}px`,
        backgroundColor: background,
        paddingTop: `${pt}px`,
        paddingRight: `${pr}px`,
        paddingBottom: `${pb}px`,
        paddingLeft: `${pl}px`,
        marginTop: `${mt}px`,
        marginRight: `${mr}px`,
        marginBottom: `${mb}px`,
        marginLeft: `${ml}px`,
        borderRadius: `${borderRadius}px`,
        border: borderWidth > 0 ? `${borderWidth}px ${borderStyle} ${borderColor}` : "none",
        boxShadow,
        opacity,
        overflow,
        position,
        top: position !== "static" ? top : undefined,
        right: position !== "static" ? right : undefined,
        bottom: position !== "static" ? bottom : undefined,
        left: position !== "static" ? left : undefined,
        zIndex: zIndex !== 0 ? zIndex : undefined,
        transform: rotation ? `rotate(${rotation}deg)` : undefined,
        cursor: "pointer",
        width: resolvedWidth,
        minWidth: 0,
        height: resolvedHeight,
        boxSizing: "border-box",
        whiteSpace: "nowrap",
        flexWrap: "nowrap",
      }}
    >
      <img
        src={avatarSrc}
        alt="Profile"
        style={{
          width: `${avatarSize}px`,
          height: `${avatarSize}px`,
          borderRadius: "999px",
          objectFit: "cover",
          backgroundColor: "#d1d5db",
          flexShrink: 0,
        }}
      />

      <span
        style={{
          display: "block",
          margin: 0,
          padding: 0,
          fontFamily,
          fontWeight,
          fontStyle,
          fontSize: `${resolvedFontSize}px`,
          lineHeight: safeLineHeight,
          letterSpacing: typeof letterSpacing === "number" ? letterSpacing : 0,
          textAlign,
          textTransform,
          color,
          whiteSpace: "nowrap",
          overflow: "visible",
          userSelect: "none",
        }}
      >
        {text}
      </span>

      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          width: `${arrowSize}px`,
          height: `${arrowSize}px`,
          marginLeft: "auto",
          transform: "rotate(90deg)",
          color: iconColor,
          flexShrink: 0,
        }}
      >
        <ChevronRight size={arrowSize} />
      </div>
    </div>
  );
};

ProfileLoginNode.craft = {
  displayName: "ProfileLogin",
  rules: {
    canMoveIn: () => false,
  },
  related: {
    settings: ProfileLoginSettings,
  },
};

export const ProfileLogin: TemplateEntry = {
  label: "Login Bar",
  description: "Profile login asset with clean single-node layers",
  preview: "👤 Login",
  category: "header",
  element: React.createElement(
    Element as any,
    {
      is: ProfileLoginNode as any,
      text: "Login",
      fontSize: 18,
      fontFamily: "Outfit",
      fontWeight: "400",
      fontStyle: "normal",
      lineHeight: 1.5,
      letterSpacing: 0,
      textAlign: "left",
      textTransform: "none",
      color: "#000000",
      iconColor: "#000000",
      arrowSize: 20,
      avatarSize: 34,
      avatarSrc: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=96&h=96&fit=crop&crop=face",
      width: "220px",
      height: "fit-content",
      gap: 10,
      background: "transparent",
      paddingTop: 8,
      paddingRight: 14,
      paddingBottom: 8,
      paddingLeft: 12,
    }
  ),
};
