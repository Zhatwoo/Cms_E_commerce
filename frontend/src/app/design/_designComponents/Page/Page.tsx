"use client";

import React, { useState, useCallback } from "react";
import { useNode } from "@craftjs/core";
import type { Node } from "@craftjs/core";
import { PageSettings } from "./PageSettings";
import type { PageProps } from "../../_types";
import { slugFromName } from "../../_lib/slug";

/** Helper type: (nodeId) => { ancestors(), get() } - used by Craft.js in rules */
type NodeHelper = (nodeId: string) => { ancestors: () => string[]; get: () => Node | null };

export const Page = ({
  children,
  width = "1440px",
  height = "900px",
  background = "#ffffff",
  pageRotation = 0,
  canvasX = 0,
  canvasY = 0,
  pageName = "Page Name",
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

  return (
    <div
      data-node-id={id}
      data-page-node="true"
      ref={ref => { if (ref) connect(ref); }}
      className="rounded-lg shadow-xl relative min-h-[600px] transition-[outline] duration-150"
      style={{
        position: "absolute",
        left: `${canvasX}px`,
        top: `${canvasY}px`,
        width,
        height: height === "auto" ? "auto" : height,
        minHeight: "800px",
        backgroundColor: background,
        overflowX: "hidden",
        overflowY: "visible",
        transform: Number.isFinite(pageRotation) && pageRotation !== 0 ? `rotate(${pageRotation}deg)` : undefined,
        transformOrigin: "center center",
        transition: "transform 220ms ease-out, width 220ms ease-out",
        containerType: "inline-size",
        contain: "layout style",
      }}
    >
      <div className="frame-responsive-inner frame-fluid h-full w-full">
        <div
          data-page-name-label="true"
          data-page-drag-handle="true"
          ref={(ref) => { if (ref) drag(ref); }}
          className="absolute -top-8 left-0 font-bold text-2xl opacity-60 select-none min-w-[120px] cursor-move"
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
        {children}
      </div>
    </div>
  );
};

export const PageDefaultProps: Partial<PageProps> = {
  width: "1440px",
  height: "900px",
  background: "#ffffff",
  pageRotation: 0,
  canvasX: 0,
  canvasY: 0,
  pageName: "Page Name",
};

Page.craft = {
  displayName: "Page",
  props: PageDefaultProps,
  rules: {
    canDrag: () => true,
    canMoveIn: (incomingNodes: Node[], currentNode: Node, helper: NodeHelper) => {
      for (const node of incomingNodes) {
        if (node.data.displayName === "Page" || node.data.displayName === "Viewport") return false;
        try {
          const ancestorIds = helper(node.id).ancestors();
          for (const aid of ancestorIds) {
            const an = helper(aid).get();
            if (an?.data?.displayName === "Page" && aid !== currentNode.id) return false;
          }
        } catch {
          // New node from panel may not be in tree yet — allow
        }
      }
      return true;
    },
  },
  related: {
    settings: PageSettings,
  },
};
