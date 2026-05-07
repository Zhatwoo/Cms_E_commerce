"use client";

import React, { useState, useCallback } from "react";
import { useNode } from "@craftjs/core";
import type { Node, NodeHelper } from "@craftjs/core";
import { PageSettings } from "./PageSettings";
import type { PageProps } from "../../_types";

// Global mouse tracker for safe zone enforcement in Craft.js rules
const mousePos = { x: 0, y: 0 };
if (typeof window !== "undefined") {
  window.addEventListener("mousemove", (e) => {
    mousePos.x = e.clientX;
    mousePos.y = e.clientY;
  }, { passive: true });
}
import { slugFromName } from "../../_lib/slug";

export const Page = ({
  children,
  width = "1440px",
  height = "900px",
  background = "#ffffff",
  backgroundImage = "",
  backgroundSize = "cover",
  backgroundPosition = "center",
  backgroundRepeat = "no-repeat",
  backgroundOverlay = "",
  pageRotation = 0,
  canvasX = 0,
  canvasY = 0,
  pageName = "",
  flexDirection = "column",
  flexWrap = "nowrap",
  alignItems = "flex-start",
  justifyContent = "flex-start",
  gap = 0,
  display = "block",
  isFreeform = true,
  editorVisibility = "auto",
  justifyItems = "stretch",
  alignContent = "flex-start",
}: PageProps) => {
  const { id, connectors: { connect, drag }, actions: { setProp } } = useNode();
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(pageName || "");

  const handleBlur = useCallback(() => {
    setEditing(false);
    const trimmed = editValue.trim();
    const slug = slugFromName(trimmed);
    setProp((props: Record<string, unknown>) => {
      props.pageName = trimmed;
      props.pageSlug = slug;
    });
  }, [editValue, setProp]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        (e.target as HTMLInputElement).blur();
      }
      if (e.key === "Escape") {
        setEditValue(pageName);
        setEditing(false);
      }
    },
    [pageName]
  );

  // Robust width parsing for Craft.js props
  const parseW = (val: any) => {
    if (typeof val === "number") return val;
    if (typeof val === "string") return parseInt(val.replace(/[^\d]/g, ""));
    return 1440;
  };

  const w = parseW(width);
  const isMobile = w > 0 && w <= 640;
  const isTablet = w > 640 && w <= 1100; // Expanded tablet range for safety

  const effectiveDisplay =
    editorVisibility === "hide"
      ? "none"
      : editorVisibility === "show" && display === "none"
        ? "block"
        : display;

  return (
    <div
      data-node-id={id}
      data-page-node="true"
      ref={ref => { if (ref) connect(ref); }}
      className={`no-scrollbar rounded-lg shadow-xl relative transition-[outline] duration-150 ${isMobile ? "is-mobile-view" : ""} ${isTablet ? "is-tablet-view" : ""}`}
      style={{
        position: "absolute",
        left: `${canvasX}px`,
        top: `${canvasY}px`,
        width,
        height: height === "auto" ? "auto" : height,
        minHeight: height === "auto" ? "900px" : height,
        background: (() => {
          if (backgroundImage && backgroundImage.trim()) {
            const overlayLayer = backgroundOverlay && backgroundOverlay !== "transparent"
              ? `linear-gradient(${backgroundOverlay}, ${backgroundOverlay}), `
              : "";
            const imageLayer = `url(${backgroundImage}) ${backgroundPosition} / ${backgroundSize} ${backgroundRepeat}`;
            return `${overlayLayer}${imageLayer}${background ? `, ${background}` : ""}`;
          }
          return background;
        })(),
        overflowX: height === "auto" ? "visible" : "hidden",
        overflowY: height === "auto" ? "visible" : "hidden",
        transform: Number.isFinite(pageRotation) && pageRotation !== 0 ? `rotate(${pageRotation}deg)` : undefined,
        transformOrigin: "center center",
        transition: "transform 220ms ease-out, width 220ms ease-out",
        containerType: "inline-size",
        contain: "layout style",
      }}
    >
      <style dangerouslySetInnerHTML={{
        __html: `
          ${isMobile ? `
            [data-page-node].is-mobile-view .frame-responsive-inner,
            [data-page-node].is-mobile-view .frame-fluid {
              display: flex !important;
              flex-direction: column !important;
              align-items: stretch !important;
              justify-content: flex-start !important;
              width: 100% !important;
              padding: 0 !important;
              margin: 0 !important;
              background-color: transparent !important;
            }
            /* UNIVERSAL HAMMER: Force every child to be a full-width block */
            .is-mobile-view .frame-responsive-inner > *,
            .is-mobile-view [data-node-id],
            .is-mobile-view img,
            .is-mobile-view video,
            .is-mobile-view [style*="position: absolute"],
            .is-mobile-view [style*="position:absolute"] {
              display: block !important;
              width: 100% !important;
              min-width: 100% !important;
              max-width: 100% !important;
              position: relative !important;
              left: 0 !important;
              right: 0 !important;
              top: 0 !important;
              bottom: 0 !important;
              transform: none !important;
              margin: 10px 0 !important;
              padding: 0 !important;
              float: none !important;
            }
            .is-mobile-view [data-layout="row"] {
              flex-direction: column !important;
              display: flex !important;
            }
          ` : ""}
          ${isTablet ? `
            [data-page-node].is-tablet-view .frame-responsive-inner,
            [data-page-node].is-tablet-view .frame-fluid {
              display: flex !important;
              flex-direction: column !important;
              align-items: stretch !important;
              width: 100% !important;
            }
            .is-tablet-view .frame-responsive-inner > *,
            .is-tablet-view [data-node-id],
            .is-tablet-view img,
            .is-tablet-view video,
            .is-tablet-view [style*="position: absolute"],
            .is-tablet-view [style*="position:absolute"] {
              width: 100% !important;
              max-width: 100% !important;
              min-width: 0 !important;
              position: relative !important;
              left: 0 !important;
              top: 0 !important;
              transform: none !important;
              margin: 10px 0 !important;
            }
            .is-tablet-view [data-layout="row"] {
              flex-wrap: wrap !important;
              gap: 20px !important;
              display: flex !important;
              flex-direction: row !important;
              align-items: stretch !important;
              width: 100% !important;
            }
            .is-tablet-view [data-layout="row"] > * {
              flex: 1 1 300px !important;
              min-width: 300px !important;
              max-width: 100% !important;
              width: 100% !important;
            }
          ` : ""}
        `
      }} />
      <div 
        className={`frame-responsive-inner frame-fluid h-full w-full ${isMobile ? "frame-mobile" : ""} ${isTablet ? "frame-tablet" : ""}`}
        style={{
          display: isFreeform ? "block" : effectiveDisplay,
          flexDirection: !isFreeform && (effectiveDisplay === "flex" || effectiveDisplay === "inline-flex") ? flexDirection : undefined,
          flexWrap: !isFreeform && (effectiveDisplay === "flex" || effectiveDisplay === "inline-flex") ? flexWrap : undefined,
          alignItems: !isFreeform && (effectiveDisplay === "flex" || effectiveDisplay === "inline-flex") ? alignItems : undefined,
          justifyContent: !isFreeform && (effectiveDisplay === "flex" || effectiveDisplay === "inline-flex") ? justifyContent : undefined,
          gridTemplateColumns: !isFreeform && effectiveDisplay === "grid" ? gridTemplateColumns : undefined,
          gridTemplateRows: !isFreeform && effectiveDisplay === "grid" ? gridTemplateRows : undefined,
          gridGap: !isFreeform && effectiveDisplay === "grid" ? `${gridGap}px` : undefined,
          gridColumnGap: !isFreeform && effectiveDisplay === "grid" ? (gridColumnGap !== undefined ? `${gridColumnGap}px` : undefined) : undefined,
          gridRowGap: !isFreeform && effectiveDisplay === "grid" ? (gridRowGap !== undefined ? `${gridRowGap}px` : undefined) : undefined,
          gridAutoRows: !isFreeform && effectiveDisplay === "grid" ? gridAutoRows : undefined,
          gridAutoFlow: !isFreeform && effectiveDisplay === "grid" ? gridAutoFlow : undefined,
          justifyItems: !isFreeform && effectiveDisplay === "grid" ? justifyItems : undefined,
          alignContent: !isFreeform && effectiveDisplay === "grid" ? alignContent : undefined,
          gap: !isFreeform && (effectiveDisplay === "flex" || effectiveDisplay === "inline-flex") ? `${gap}px` : undefined,
        }}
      >
        {/* Page Name Label - Hidden on Mobile/Tablet */}
        {!isMobile && !isTablet && (
          <div
            data-page-name-label="true"
            data-page-drag-handle="true"
            ref={(ref) => { if (ref) drag(ref); }}
            className="absolute -top-10 left-0 font-bold text-3xl opacity-60 select-none min-w-[120px] cursor-move flex items-center gap-2"
            style={{ color: "var(--builder-text, #EDE9FF)" }}>
            {editing ? (
              <input
                value={editValue}
                placeholder="Page Name"
                onChange={(e) => setEditValue(e.target.value)}
                onBlur={handleBlur}
                onKeyDown={handleKeyDown}
                autoFocus
                className="rounded px-2 py-0.5 text-lg focus:outline-none w-full max-w-[240px]"
                style={{
                  background: "var(--builder-surface-2, rgba(30,30,30,0.9))",
                  border: "1px solid var(--builder-border-mid, rgba(138,92,246,0.3))",
                  color: "var(--builder-text, #EDE9FF)",
                }}
                data-panel="page-name-edit"
              />
            ) : (
              <span
                onDoubleClick={(e) => {
                  e.stopPropagation();
                  setEditValue(pageName);
                  setEditing(true);
                }}
                className="cursor-text hover:opacity-80"
              >
                {editValue.trim() === "" ? <span className="opacity-50">Page Name</span> : editValue}
              </span>
            )}
          </div>
        )}
      {children}
      </div>
    </div>
  );
};

export const PageDefaultProps: Partial<PageProps> = {
  width: "1440px",
  height: "auto",
  background: "#ffffff",
  backgroundImage: "",
  backgroundSize: "cover",
  backgroundPosition: "center",
  backgroundRepeat: "no-repeat",
  backgroundOverlay: "",
  pageRotation: 0,
  canvasX: 0,
  canvasY: 0,
  pageName: "",
  flexDirection: "column",
  flexWrap: "nowrap",
  alignItems: "flex-start",
  justifyContent: "flex-start",
  gap: 0,
  display: "block",
  isFreeform: true,
  editorVisibility: "auto",
  gridTemplateColumns: "1fr 1fr",
  gridTemplateRows: "auto",
  gridGap: 0,
  gridColumnGap: 0,
  gridRowGap: 0,
  gridAutoRows: "auto",
  gridAutoFlow: "row",
  justifyItems: "stretch",
  alignContent: "flex-start",
};

Page.craft = {
  displayName: "Page",
  props: PageDefaultProps,
  rules: {
    canDrag: () => true,
    canMoveIn: (incomingNodes: Node[], currentNode: Node, helper: NodeHelper) => {
      // 1. SAFE ZONE ENFORCEMENT: Block insertion if mouse is outside the page (for fixed height)
      if (currentNode.data.props.height !== "auto") {
        try {
          const dom = helper(currentNode.id).get().dom;
          if (dom) {
            const rect = dom.getBoundingClientRect();
            // Add a small 10px buffer for better UX
            const buffer = 10;
            if (
              mousePos.x < rect.left - buffer || 
              mousePos.x > rect.right + buffer || 
              mousePos.y < rect.top - buffer || 
              mousePos.y > rect.bottom + buffer
            ) {
              return false;
            }
          }
        } catch (e) {
          // Fallback if DOM is not ready
        }
      }

      // 2. Prevent nesting Pages or Viewports
      for (const node of incomingNodes) {
        if (node.data.displayName === "Page" || node.data.displayName === "Viewport") return false;
      }
      return true;
    },
  },
  related: {
    settings: PageSettings,
  },
};