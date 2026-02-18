"use client";

import { useEffect, useRef } from "react";
import { useEditor } from "@craftjs/core";

const DRAG_THRESHOLD = 3;

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
 * Figma-style smooth drag: click on a node and drag to move.
 * Uses requestAnimationFrame for buttery-smooth updates.
 */
export const FigmaStyleDragHandler = () => {
  const { actions, query } = useEditor();
  const actionsRef = useRef(actions);
  const queryRef = useRef(query);
  const rafRef = useRef<number>(0);
  const dragRef = useRef<{
    startX: number;
    startY: number;
    lastX: number;
    lastY: number;
    committed: boolean;
    zoom: number;
    nodeMargins: Array<{ id: string; marginTop: number; marginLeft: number }>;
    fallbackNodeId: string | null;
    dirty: boolean;
  } | null>(null);

  useEffect(() => {
    actionsRef.current = actions;
    queryRef.current = query;
  }, [actions, query]);

  useEffect(() => {
    const tick = () => {
      const d = dragRef.current;
      if (!d || !d.committed || !d.dirty) {
        rafRef.current = requestAnimationFrame(tick);
        return;
      }

      d.dirty = false;
      const dx = (d.lastX - d.startX) / d.zoom;
      const dy = (d.lastY - d.startY) / d.zoom;

      if (!Number.isFinite(dx) || !Number.isFinite(dy)) {
        rafRef.current = requestAnimationFrame(tick);
        return;
      }

      if (Math.abs(dx) < 0.001 && Math.abs(dy) < 0.001) {
        rafRef.current = requestAnimationFrame(tick);
        return;
      }

      d.nodeMargins.forEach(({ id, marginTop, marginLeft }) => {
        const nextTop = marginTop + dy;
        const nextLeft = marginLeft + dx;
        if (!Number.isFinite(nextTop) || !Number.isFinite(nextLeft)) return;
        actionsRef.current.setProp(id, (props: Record<string, unknown>) => {
          if (props.marginTop === nextTop && props.marginLeft === nextLeft) return;
          props.marginTop = nextTop;
          props.marginLeft = nextLeft;
        });
      });

      d.startX = d.lastX;
      d.startY = d.lastY;
      d.nodeMargins = d.nodeMargins.map((n) => ({
        ...n,
        marginTop: n.marginTop + dy,
        marginLeft: n.marginLeft + dx,
      }));

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);

    const handleMouseDown = (e: MouseEvent) => {
      if (e.button !== 0) return;
      const target = e.target as HTMLElement | null;
      if (!target) return;

      if (target.closest("INPUT") || target.closest("TEXTAREA") || target.closest("SELECT") || target.closest("[contenteditable=true]")) return;
      if (document.body.dataset.spacePan === "true") return;
      if (target.closest("[data-panel]") && !target.closest("[data-panel='resize-overlay']")) return;
      if (target.closest("[data-resize-handle]")) return;

      const onNode = target.closest("[data-node-id]") as HTMLElement | null;
      const onOverlay = target.closest("[data-panel='resize-overlay']");
      const nodeIdFromTarget = onNode?.getAttribute("data-node-id") ?? null;

      const state = queryRef.current.getState();
      const nodesMap = state.nodes;
      const exists = (id: string) => !!id && id !== "ROOT" && !!nodesMap[id];

      if (nodeIdFromTarget && exists(nodeIdFromTarget)) {
        dragRef.current = {
          startX: e.clientX,
          startY: e.clientY,
          lastX: e.clientX,
          lastY: e.clientY,
          committed: false,
          zoom: 1,
          nodeMargins: [],
          fallbackNodeId: nodeIdFromTarget,
          dirty: false,
        };
        return;
      }
      if (onOverlay) {
        const ids = selectedToIds(state.events.selected).filter(exists);
        if (ids.length > 0) {
          dragRef.current = {
            startX: e.clientX,
            startY: e.clientY,
            lastX: e.clientX,
            lastY: e.clientY,
            committed: false,
            zoom: 1,
            nodeMargins: [],
            fallbackNodeId: null,
            dirty: false,
          };
        }
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      const d = dragRef.current;
      if (!d) return;

      d.lastX = e.clientX;
      d.lastY = e.clientY;

      if (!d.committed) {
        const dx = d.lastX - d.startX;
        const dy = d.lastY - d.startY;
        if (Math.sqrt(dx * dx + dy * dy) < DRAG_THRESHOLD) return;

        const state = queryRef.current.getState();
        let ids = selectedToIds(state.events.selected).filter((id) => id && id !== "ROOT" && state.nodes[id]);
        if (ids.length === 0 && d.fallbackNodeId && state.nodes[d.fallbackNodeId]) {
          ids = [d.fallbackNodeId];
        }
        if (ids.length === 0) {
          dragRef.current = null;
          return;
        }
        let firstDom: HTMLElement | null = null;
        try { firstDom = queryRef.current.node(ids[0]).get()?.dom ?? null; } catch { /* ignore */ }

        document.body.style.userSelect = "none";
        document.body.style.cursor = "grabbing";

        d.committed = true;
        d.zoom = getEffectiveZoom(firstDom);
        d.nodeMargins = ids.map((id) => {
          const props = state.nodes[id]?.data?.props ?? {};
          return {
            id,
            marginTop: typeof props.marginTop === "number" ? props.marginTop : 0,
            marginLeft: typeof props.marginLeft === "number" ? props.marginLeft : 0,
          };
        });
      }

      d.dirty = true;
    };

    const handleMouseUp = () => {
      const d = dragRef.current;
      if (d?.committed) {
        d.nodeMargins.forEach(({ id, marginTop, marginLeft }) => {
          const roundedTop = Math.round(marginTop);
          const roundedLeft = Math.round(marginLeft);
          actionsRef.current.setProp(id, (props: Record<string, unknown>) => {
            if (props.marginTop !== roundedTop) {
              props.marginTop = roundedTop;
            }
            if (props.marginLeft !== roundedLeft) {
              props.marginLeft = roundedLeft;
            }
          });
        });
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
      }
      dragRef.current = null;
    };

    document.addEventListener("mousedown", handleMouseDown, true);
    document.addEventListener("mousemove", handleMouseMove, true);
    document.addEventListener("mouseup", handleMouseUp, true);
    return () => {
      cancelAnimationFrame(rafRef.current);
      document.removeEventListener("mousedown", handleMouseDown, true);
      document.removeEventListener("mousemove", handleMouseMove, true);
      document.removeEventListener("mouseup", handleMouseUp, true);
    };
  }, []);

  return null;
};
