"use client";

import { useEffect, useRef } from "react";
import { useEditor } from "@craftjs/core";

const DRAG_THRESHOLD = 4;

function getEffectiveZoom(el: HTMLElement | null): number {
  if (!el) return 1;
  const ow = el.offsetWidth;
  if (!ow) return 1;
  const bw = el.getBoundingClientRect().width;
  const z = bw / ow;
  return z > 0.01 ? z : 1;
}

function selectedToIds(raw: unknown): string[] {
  if (Array.isArray(raw)) return raw;
  if (raw instanceof Set) return Array.from(raw);
  if (raw && typeof raw === "object") return Object.keys(raw as Record<string, unknown>);
  return [];
}

/**
 * Figma-style: click on a node (or selected overlay) and drag to move — no second click.
 * Does not run when space is pressed (pan) or when mousedown was on a resize handle.
 */
export const FigmaStyleDragHandler = () => {
  const { actions, query } = useEditor();
  const dragRef = useRef<{
    startX: number;
    startY: number;
    committed: boolean;
    zoom: number;
    nodeMargins: Array<{ id: string; marginTop: number; marginLeft: number }>;
    /** Node we mousedowned on (in case selection not updated yet) */
    fallbackNodeId: string | null;
  } | null>(null);

  useEffect(() => {
    const handleMouseDown = (e: MouseEvent) => {
      if (e.button !== 0) return;
      const target = e.target as HTMLElement | null;
      if (!target) return;

      if (target.closest("INPUT") || target.closest("TEXTAREA") || target.closest("SELECT") || target.closest("[contenteditable=true]")) return;
      if (document.body.dataset.spacePan === "true") return;
      if (target.closest("[data-panel]") && !target.closest("[data-panel='resize-overlay']")) return;

      const onResizeHandle = !!target.closest("[data-resize-handle]");
      const onNode = target.closest("[data-node-id]") as HTMLElement | null;
      const onOverlay = target.closest("[data-panel='resize-overlay']");
      const nodeIdFromTarget = onNode?.getAttribute("data-node-id") ?? null;

      if (onResizeHandle) return;

      const state = query.getState();
      const nodesMap = state.nodes;
      const exists = (id: string) => !!id && id !== "ROOT" && !!nodesMap[id];

      if (nodeIdFromTarget && exists(nodeIdFromTarget)) {
        dragRef.current = {
          startX: e.clientX,
          startY: e.clientY,
          committed: false,
          zoom: 1,
          nodeMargins: [],
          fallbackNodeId: nodeIdFromTarget,
        };
        return;
      }
      if (onOverlay) {
        const ids = selectedToIds(state.events.selected).filter(exists);
        if (ids.length > 0) {
          dragRef.current = {
            startX: e.clientX,
            startY: e.clientY,
            committed: false,
            zoom: 1,
            nodeMargins: [],
            fallbackNodeId: null,
          };
        }
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      const d = dragRef.current;
      if (!d) return;

      const dx = e.clientX - d.startX;
      const dy = e.clientY - d.startY;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (!d.committed) {
        if (distance < DRAG_THRESHOLD) return;
        const state = query.getState();
        let ids = selectedToIds(state.events.selected).filter((id) => id && id !== "ROOT" && state.nodes[id]);
        if (ids.length === 0 && d.fallbackNodeId && state.nodes[d.fallbackNodeId]) {
          ids = [d.fallbackNodeId];
        }
        if (ids.length === 0) {
          dragRef.current = null;
          return;
        }
        let firstDom: HTMLElement | null = null;
        try {
          firstDom = query.node(ids[0]).get()?.dom ?? null;
        } catch {
          // node may not exist or have dom yet
        }
        const zoom = getEffectiveZoom(firstDom);
        const nodeMargins = ids.map((id) => {
          const props = state.nodes[id]?.data?.props ?? {};
          const marginTop = typeof props.marginTop === "number" ? props.marginTop : 0;
          const marginLeft = typeof props.marginLeft === "number" ? props.marginLeft : 0;
          return { id, marginTop, marginLeft };
        });
        dragRef.current = {
          ...d,
          committed: true,
          zoom,
          nodeMargins,
        };
      }

      const zoom = dragRef.current.zoom;
      const rDx = dx / zoom;
      const rDy = dy / zoom;

      dragRef.current.nodeMargins.forEach(({ id, marginTop, marginLeft }) => {
        actions.setProp(id, (props: Record<string, unknown>) => {
          props.marginTop = Math.round(marginTop + rDy);
          props.marginLeft = Math.round(marginLeft + rDx);
        });
      });

      dragRef.current.startX = e.clientX;
      dragRef.current.startY = e.clientY;
      dragRef.current.nodeMargins = dragRef.current.nodeMargins.map((n) => ({
        ...n,
        marginTop: Math.round(n.marginTop + rDy),
        marginLeft: Math.round(n.marginLeft + rDx),
      }));
    };

    const handleMouseUp = () => {
      dragRef.current = null;
    };

    document.addEventListener("mousedown", handleMouseDown, true);
    document.addEventListener("mousemove", handleMouseMove, true);
    document.addEventListener("mouseup", handleMouseUp, true);
    return () => {
      document.removeEventListener("mousedown", handleMouseDown, true);
      document.removeEventListener("mousemove", handleMouseMove, true);
      document.removeEventListener("mouseup", handleMouseUp, true);
    };
  }, [actions, query]);

  return null;
}
