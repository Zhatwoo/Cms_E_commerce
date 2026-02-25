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
  width = "1920px",
  height = "1200px",
  background = "#ffffff",
  canvasX = 0,
  canvasY = 0,
  pageName = "Page Name",
}: PageProps) => {
  const { id, connectors: { connect, drag }, actions: { setProp } } = useNode();
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(pageName);

  const handleBlur = useCallback(() => {
    setEditing(false);
    const trimmed = editValue.trim() || "Page Name";
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
      ref={(ref) => {
        if (ref) connect(drag(ref));
      }}
      className="rounded-lg shadow-xl relative min-h-[600px] transition-[outline] duration-150"
      style={{
        position: "absolute",
        left: `${canvasX}px`,
        top: `${canvasY}px`,
        width,
        height: height === "auto" ? "auto" : height,
        minHeight: "800px",
        backgroundColor: background,
      }}
    >
      <div className="absolute -top-8 left-0 text-brand-lighter font-bold text-2xl opacity-50 select-none min-w-[120px]">
        {editing ? (
          <input
            type="text"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            autoFocus
            className="bg-brand-dark/90 border border-brand-medium rounded px-2 py-0.5 text-lg text-brand-lighter focus:outline-none focus:border-blue-500 w-full max-w-[240px]"
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
            {pageName}
          </span>
        )}
      </div>
      {children}
    </div>
  );
};

export const PageDefaultProps: Partial<PageProps> = {
  width: "1920px",
  height: "1200px",
  background: "#E6E6E9",
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
