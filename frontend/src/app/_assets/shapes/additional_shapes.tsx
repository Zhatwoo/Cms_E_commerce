"use client";

import React from "react";
import { useNode } from "@craftjs/core";
import { ShapeSettings } from "./shared/ShapeSettings";
import type { RectangleProps } from "@/app/design/_types/components";

// Shared Base for all additional shapes
const GenericShapeEditor = ({
  displayName,
  clipPath,
  points, // for SVG outline
  d, // for SVG path outline (smooth curves)
  props,
}: {
  displayName: string;
  clipPath: string;
  points?: string;
  d?: string;
  props: RectangleProps;
}) => {
  const { connectors: { connect, drag }, id } = useNode();
  
  const p = props || {};
  const {
    color = "#8b5cf6",
    width = "200px",
    height = "200px",
    background,
    backgroundImage,
    backgroundOverlay,
    borderColor = "transparent",
    borderWidth = 0,
    borderStyle = "solid",
    rotation = 0,
    opacity = 1,
    position = "relative",
    top = "auto",
    left = "auto",
    right = "auto",
    bottom = "auto",
    zIndex = 0,
    display = "flex",
    margin = 0,
    marginTop,
    marginRight,
    marginBottom,
    marginLeft,
    padding = 0,
    paddingTop,
    paddingRight,
    paddingBottom,
    paddingLeft,
    children,
  } = p;

  const wCss = typeof width === "number" ? `${width}px` : (width || "200px");
  const hCss = typeof height === "number" ? `${height}px` : (height || "200px");
  const fillColor = background || color;

  const mVal = typeof margin === "number" ? margin : 0;
  const mt = marginTop ?? mVal;
  const mr = marginRight ?? mVal;
  const mb = marginBottom ?? mVal;
  const ml = marginLeft ?? mVal;

  const pVal = typeof padding === "number" ? padding : 0;
  const pt = paddingTop ?? pVal;
  const pr = paddingRight ?? pVal;
  const pb = paddingBottom ?? pVal;
  const pl = paddingLeft ?? pVal;

  const finalClip = clipPath || "none";
  
  const maskStyle = d ? {
    maskImage: `url("data:image/svg+xml;utf8,${encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' preserveAspectRatio='none'><path d='${d}'/></svg>`)}")`,
    WebkitMaskImage: `url("data:image/svg+xml;utf8,${encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' preserveAspectRatio='none'><path d='${d}'/></svg>`)}")`,
    maskSize: "100% 100%",
    WebkitMaskSize: "100% 100%",
  } : {
    clipPath: finalClip,
    WebkitClipPath: finalClip,
  };

  return (
    <div
      ref={(ref) => { if (ref) connect(drag(ref)); }}
      data-node-id={id}
      style={{
        width: wCss,
        height: hCss,
        minWidth: wCss,
        minHeight: hCss,
        position,
        top: position !== "static" ? top : undefined,
        left: position !== "static" ? left : undefined,
        right: position !== "static" ? right : undefined,
        bottom: position !== "static" ? bottom : undefined,
        zIndex: zIndex !== 0 ? zIndex : undefined,
        display,
        alignItems: "center",
        justifyContent: "center",
        opacity,
        transform: rotation ? `rotate(${rotation}deg)` : undefined,
        margin: `${mt}px ${mr}px ${mb}px ${ml}px`,
        padding: `${pt}px ${pr}px ${pb}px ${pl}px`,
      }}
      className="hover:outline hover:outline-blue-500"
    >
      {/* Border Layer (SVG) */}
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          zIndex: 1,
          pointerEvents: "none",
        }}
      >
        {points && (
           <polygon
            points={points}
            fill="transparent"
            stroke={borderColor}
            strokeWidth={borderWidth * 2} // multiplier because of 100x100 viewBox
            strokeDasharray={borderStyle === "dashed" ? "6,6" : borderStyle === "dotted" ? "3,3" : undefined}
          />
        )}
        {d && (
           <path
            d={d}
            fill="transparent"
            stroke={borderColor}
            strokeWidth={borderWidth * 2}
            strokeDasharray={borderStyle === "dashed" ? "6,6" : borderStyle === "dotted" ? "3,3" : undefined}
          />
        )}
      </svg>
      
      {/* Fill Layer (clip-path) */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 1,
          ...maskStyle,
          backgroundColor: fillColor,
          backgroundImage: backgroundImage
            ? backgroundOverlay
              ? `linear-gradient(${backgroundOverlay}, ${backgroundOverlay}), url(${backgroundImage})`
              : `url(${backgroundImage})`
            : undefined,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />
      
      {/* Children Layer */}
      <div
        style={{
          position: "relative",
          zIndex: 3,
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          ...maskStyle,
          overflow: "hidden",
        }}
      >
        {children}
      </div>
    </div>
  );
};

const GenericPreview = ({ clipPath, d, fillColor }: { clipPath: string; d?: string; fillColor?: string }) => {
  const finalClip = clipPath || "none";
  const maskStyle = d ? {
    maskImage: `url("data:image/svg+xml;utf8,${encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' preserveAspectRatio='none'><path d='${d}'/></svg>`)}")`,
    WebkitMaskImage: `url("data:image/svg+xml;utf8,${encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' preserveAspectRatio='none'><path d='${d}'/></svg>`)}")`,
    maskSize: "100% 100%",
    WebkitMaskSize: "100% 100%",
  } : {
    clipPath: finalClip,
    WebkitClipPath: finalClip,
  };

  return (
    <div style={{ width: "100%", height: "100%", padding: "15%", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div
        style={{
          width: "100%",
          height: "100%",
          backgroundColor: fillColor || "#f43f5e",
          ...maskStyle,
        }}
      />
    </div>
  );
};

// --- 1. Diamond ---
export const Diamond = (props: RectangleProps) => {
  const clip = "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)";
  const pts = "50,0 100,50 50,100 0,50";
  if (props.isPreview) return <GenericPreview clipPath={clip} fillColor={props.background || props.color || "#f43f5e"} />;
  return <GenericShapeEditor displayName="Diamond" clipPath={clip} points={pts} props={props} />;
};
Diamond.craft = {
  displayName: "Diamond",
  props: { color: "#f43f5e", background: "#f43f5e", width: "150px", height: "250px" },
  related: { settings: ShapeSettings },
  canvas: true,
};

// --- 2. Heart ---
export const Heart = (props: RectangleProps) => {
  // Smooth bezier curve for a perfect heart shape matching the preview SVG renderer
  const clip = "none";
  const d = "M 50 90 C 20 70 5 55 5 35 C 5 20 20 10 32 10 C 40 10 47 15 50 22 C 53 15 60 10 68 10 C 80 10 95 20 95 35 C 95 55 80 70 50 90 Z";
  if (props.isPreview) return <GenericPreview clipPath={clip} d={d} fillColor={props.background || props.color || "#e11d48"} />;
  return <GenericShapeEditor displayName="Heart" clipPath={clip} d={d} props={props} />;
};
Heart.craft = {
  displayName: "Heart",
  props: { color: "#e11d48", background: "#e11d48", width: "200px", height: "180px" },
  related: { settings: ShapeSettings },
  canvas: true,
};

// --- 3. Trapezoid ---
export const Trapezoid = (props: RectangleProps) => {
  const clip = "polygon(20% 0%, 80% 0%, 100% 100%, 0% 100%)";
  const pts = "20,0 80,0 100,100 0,100";
  if (props.isPreview) return <GenericPreview clipPath={clip} fillColor={props.background || props.color || "#f59e0b"} />;
  return <GenericShapeEditor displayName="Trapezoid" clipPath={clip} points={pts} props={props} />;
};
Trapezoid.craft = {
  displayName: "Trapezoid",
  props: { color: "#f59e0b", background: "#f59e0b", width: "200px", height: "150px" },
  related: { settings: ShapeSettings },
  canvas: true,
};

// --- 5. Pentagon ---
export const Pentagon = (props: RectangleProps) => {
  const clip = "polygon(50% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%)";
  const pts = "50,0 100,38 82,100 18,100 0,38";
  if (props.isPreview) return <GenericPreview clipPath={clip} fillColor={props.background || props.color || "#14b8a6"} />;
  return <GenericShapeEditor displayName="Pentagon" clipPath={clip} points={pts} props={props} />;
};
Pentagon.craft = {
  displayName: "Pentagon",
  props: { color: "#14b8a6", background: "#14b8a6", width: "200px", height: "200px" },
  related: { settings: ShapeSettings },
  canvas: true,
};

// --- 6. Hexagon ---
export const Hexagon = (props: RectangleProps) => {
  const clip = "polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)";
  const pts = "25,0 75,0 100,50 75,100 25,100 0,50";
  if (props.isPreview) return <GenericPreview clipPath={clip} fillColor={props.background || props.color || "#6366f1"} />;
  return <GenericShapeEditor displayName="Hexagon" clipPath={clip} points={pts} props={props} />;
};
Hexagon.craft = {
  displayName: "Hexagon",
  props: { color: "#6366f1", background: "#6366f1", width: "200px", height: "200px" },
  related: { settings: ShapeSettings },
  canvas: true,
};

// --- 7. Heptagon ---
export const Heptagon = (props: RectangleProps) => {
  const clip = "polygon(50% 0%, 90% 20%, 100% 60%, 75% 100%, 25% 100%, 0% 60%, 10% 20%)";
  const pts = "50,0 90,20 100,60 75,100 25,100 0,60 10,20";
  if (props.isPreview) return <GenericPreview clipPath={clip} fillColor={props.background || props.color || "#a855f7"} />;
  return <GenericShapeEditor displayName="Heptagon" clipPath={clip} points={pts} props={props} />;
};
Heptagon.craft = {
  displayName: "Heptagon",
  props: { color: "#a855f7", background: "#a855f7", width: "200px", height: "200px" },
  related: { settings: ShapeSettings },
  canvas: true,
};

// --- 8. Octagon ---
export const Octagon = (props: RectangleProps) => {
  const clip = "polygon(30% 0%, 70% 0%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0% 70%, 0% 30%)";
  const pts = "30,0 70,0 100,30 100,70 70,100 30,100 0,70 0,30";
  if (props.isPreview) return <GenericPreview clipPath={clip} fillColor={props.background || props.color || "#d946ef"} />;
  return <GenericShapeEditor displayName="Octagon" clipPath={clip} points={pts} props={props} />;
};
Octagon.craft = {
  displayName: "Octagon",
  props: { color: "#d946ef", background: "#d946ef", width: "200px", height: "200px" },
  related: { settings: ShapeSettings },
  canvas: true,
};

// --- 9. Nonagon ---
export const Nonagon = (props: RectangleProps) => {
  const clip = "polygon(50% 0%, 83% 12%, 100% 43%, 94% 78%, 68% 100%, 32% 100%, 6% 78%, 0% 43%, 17% 12%)";
  const pts = "50,0 83,12 100,43 94,78 68,100 32,100 6,78 0,43 17,12";
  if (props.isPreview) return <GenericPreview clipPath={clip} fillColor={props.background || props.color || "#0ea5e9"} />;
  return <GenericShapeEditor displayName="Nonagon" clipPath={clip} points={pts} props={props} />;
};
Nonagon.craft = {
  displayName: "Nonagon",
  props: { color: "#0ea5e9", background: "#0ea5e9", width: "200px", height: "200px" },
  related: { settings: ShapeSettings },
  canvas: true,
};

// --- 10. Decagon ---
export const Decagon = (props: RectangleProps) => {
  const clip = "polygon(50% 0%, 80% 10%, 100% 35%, 100% 65%, 80% 90%, 50% 100%, 20% 90%, 0% 65%, 0% 35%, 20% 10%)";
  const pts = "50,0 80,10 100,35 100,65 80,90 50,100 20,90 0,65 0,35 20,10";
  if (props.isPreview) return <GenericPreview clipPath={clip} fillColor={props.background || props.color || "#22c55e"} />;
  return <GenericShapeEditor displayName="Decagon" clipPath={clip} points={pts} props={props} />;
};
Decagon.craft = {
  displayName: "Decagon",
  props: { color: "#22c55e", background: "#22c55e", width: "200px", height: "200px" },
  related: { settings: ShapeSettings },
  canvas: true,
};

// --- 11. Parallelogram ---
export const Parallelogram = (props: RectangleProps) => {
  const clip = "polygon(25% 0%, 100% 0%, 75% 100%, 0% 100%)";
  const pts = "25,0 100,0 75,100 0,100";
  if (props.isPreview) return <GenericPreview clipPath={clip} fillColor={props.background || props.color || "#f97316"} />;
  return <GenericShapeEditor displayName="Parallelogram" clipPath={clip} points={pts} props={props} />;
};
Parallelogram.craft = {
  displayName: "Parallelogram",
  props: { color: "#f97316", background: "#f97316", width: "300px", height: "150px" },
  related: { settings: ShapeSettings },
  canvas: true,
};

// --- 12. Kite ---
export const Kite = (props: RectangleProps) => {
  const clip = "polygon(50% 0%, 100% 30%, 50% 100%, 0% 30%)";
  const pts = "50,0 100,30 50,100 0,30";
  if (props.isPreview) return <GenericPreview clipPath={clip} fillColor={props.background || props.color || "#ef4444"} />;
  return <GenericShapeEditor displayName="Kite" clipPath={clip} points={pts} props={props} />;
};
Kite.craft = {
  displayName: "Kite",
  props: { color: "#ef4444", background: "#ef4444", width: "200px", height: "300px" },
  related: { settings: ShapeSettings },
  canvas: true,
};
