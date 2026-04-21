"use client";

import React from "react";
import { Element, useNode } from "@craftjs/core";
import { Text } from "../../../design/_designComponents/Text/Text";
import { Image } from "../../../design/_designComponents/Image/Image";
import { Container } from "../../../design/_designComponents/Container/Container";
import { TemplateEntry } from "../../_types";

// Layout-accurate wrapper for the Team Member Card in the web renderer/canvas.
const toCssValue = (value: unknown): string | undefined => {
  if (value == null) return undefined;
  if (typeof value === "number" && Number.isFinite(value)) return `${value}px`;
  const text = String(value).trim();
  return text ? text : undefined;
};

export const TeamMemberCardCanvas = ({
  paddingTop,
  paddingRight,
  paddingBottom,
  paddingLeft,
  background,
  borderRadius,
  boxShadow,
  width,
  height,
  gap,
  borderWidth,
  borderColor,
  borderStyle,
  position,
  top,
  right,
  bottom,
  left,
  zIndex,
  alignSelf,
  rotation,
  customClassName,
  className,
  children,
}: any) => {
  const {
    id,
    connectors: { connect, drag },
  } = useNode();

  const bw = typeof borderWidth === "number" ? borderWidth : 1;
  const bs = borderStyle || "solid";
  const bc = borderColor || "#e5e7eb";
  const border = bw > 0 ? `${bw}px ${bs} ${bc}` : "none";
  
  const resolvedClassName = `${(customClassName || "").trim()} ${(className || "").trim()}`.trim() || undefined;

  const parsePx = (v: unknown, fallback: number): string => {
    if (typeof v === "number") return `${v}px`;
    if (typeof v === "string" && v.trim().endsWith("px")) return v.trim();
    if (typeof v === "string" && !isNaN(Number(v.trim()))) return `${v.trim()}px`;
    return `${fallback}px`;
  };

  const resolvedWidth = parsePx(width, 240);
  const gapPx = typeof gap === "number" ? gap : 12;

  const canvasPosition = (position as React.CSSProperties["position"]) || "relative";

  return (
    <div
      ref={(ref) => {
        if (ref) connect(drag(ref));
      }}
      data-node-id={id}
      className={resolvedClassName}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "flex-start",
        width: resolvedWidth,
        height: toCssValue(height) || "auto",
        background: background || "#ffffff",
        paddingTop: parsePx(paddingTop, 16),
        paddingRight: parsePx(paddingRight, 12),
        paddingBottom: parsePx(paddingBottom, 16),
        paddingLeft: parsePx(paddingLeft, 12),
        borderRadius: typeof borderRadius === "number" ? `${borderRadius}px` : String(borderRadius || 12),
        boxShadow: boxShadow || "0 4px 6px rgba(0, 0, 0, 0.1)",
        border: border,
        gap: `${gapPx}px`,
        boxSizing: "border-box",
        position: canvasPosition,
        top: canvasPosition !== "static" ? toCssValue(top) : undefined,
        right: canvasPosition !== "static" ? toCssValue(right) : undefined,
        bottom: canvasPosition !== "static" ? toCssValue(bottom) : undefined,
        left: canvasPosition !== "static" ? toCssValue(left) : undefined,
        zIndex: zIndex as any,
        alignSelf: alignSelf as any,
        transform: rotation ? `rotate(${rotation}deg)` : undefined,
        overflow: "hidden",
      }}
    >
      {children}
    </div>
  );
};

(TeamMemberCardCanvas as any).craft = {
  displayName: "Team Member Card",
};

export const TeamMemberCard: TemplateEntry = {
  label: "Team Member Card",
  description: "Profile card for team members",
  preview: "👥",
  category: "card",
  element: React.createElement(
    Element,
    {
      is: TeamMemberCardCanvas,
      canvas: true,
      background: "#ffffff",
      width: "240px",
      height: "auto",
      paddingTop: 16,
      paddingBottom: 16,
      paddingLeft: 12,
      paddingRight: 12,
      borderRadius: 12,
      boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
      borderWidth: 1,
      borderColor: "#e5e7eb",
      borderStyle: "solid",
      gap: 12,
    },
    React.createElement(Image as any, {
      src: "",
      alt: "Team Member Avatar",
      width: "80px",
      height: "80px",
      objectFit: "cover",
      borderRadius: 50,
      marginBottom: 0,
      marginTop: 0,
    }),
    React.createElement(Text as any, {
      text: "John Doe",
      fontSize: 16,
      fontWeight: "700",
      color: "#1e293b",
      textAlign: "center",
      width: "auto",
      marginTop: 0,
      marginBottom: 0,
    }),
    React.createElement(Text as any, {
      text: "Web Developer",
      fontSize: 13,
      fontWeight: "600",
      color: "#3b82f6",
      textAlign: "center",
      width: "auto",
      marginTop: 0,
      marginBottom: 0,
    }),
    React.createElement(Text as any, {
      text: "Passionate about creating beautiful websites.",
      fontSize: 12,
      fontWeight: "400",
      color: "#64748b",
      textAlign: "center",
      width: "auto",
      lineHeight: 1.6,
      marginTop: 0,
      marginBottom: 0,
    })
  ),
};

export default TeamMemberCard;