"use client";

import { useEffect, useRef } from "react";
import { useEditor } from "@craftjs/core";

const DRAGGING_ATTR = "data-dragging";
const EDITOR_DRAGGING_FLAG = "editorDragging";
const EDITOR_DROP_COMMIT_FLAG = "editorDropCommit";

type MoveMode = "margin" | "offset";

type DragNodeState = {
  id: string;
  moveMode: MoveMode;
  marginTop: number;
  marginLeft: number;
  top: number;
  left: number;
};

function getEffectiveZoom(el: HTMLElement | null): number {
  if (!el) return 1;
  let zoom = 1;
  let current: HTMLElement | null = el;
  while (current) {
    const zoomText = window.getComputedStyle(current).zoom;
    const parsed = parseFloat(zoomText);
    if (Number.isFinite(parsed) && parsed > 0) {
      zoom *= parsed;
    }
    current = current.parentElement;
  }
  return zoom > 0.01 ? zoom : 1;
}

function selectedToIds(raw: unknown): string[] {
  if (Array.isArray(raw)) return raw;
  if (raw instanceof Set) return Array.from(raw);
  if (raw && typeof raw === "object") return Object.keys(raw as Record<string, unknown>);
  return [];
}

function parsePxOrAuto(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    if (value.trim() === "" || value === "auto") return 0;
    const n = parseFloat(value.replace("px", ""));
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
}

function parseNumberOrZero(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  const parsed = parseFloat(String(value ?? "0"));
  return Number.isFinite(parsed) ? parsed : 0;
}

function setDraggingStyle(doms: HTMLElement[], on: boolean) {
  for (const dom of doms) {
    if (on) {
      dom.setAttribute(DRAGGING_ATTR, "true");
    } else {
      dom.removeAttribute(DRAGGING_ATTR);
    }
  }
}

function setDragPreview(doms: HTMLElement[], x: number, y: number) {
  for (const dom of doms) {
    dom.style.setProperty("translate", `${x}px ${y}px`);
    dom.style.willChange = "translate";
  }
}

function clearDragPreview(doms: HTMLElement[]) {
  for (const dom of doms) {
    dom.style.removeProperty("translate");
    dom.style.willChange = "";
  }
}

function getDraggedDoms(
  ids: string[],
  queryNode: (id: string) => { get: () => { dom: HTMLElement | null } | null }
): HTMLElement[] {
  const doms: HTMLElement[] = [];
  for (const id of ids) {
    try {
      const dom = queryNode(id).get()?.dom;
      if (dom) doms.push(dom);
    } catch {}
  }
  return doms;
}

export const FigmaStyleDragHandler = () => {
  const { actions, query } = useEditor();

  const actionsRef = useRef(actions);
  const queryRef = useRef(query);

  const draggedDomsRef = useRef<HTMLElement[]>([]);

  const dragRef = useRef<{
    startX: number;
    startY: number;
    lastX: number;
    lastY: number;
    zoom: number;
    nodeStates: DragNodeState[];
  } | null>(null);

  useEffect(() => {
    actionsRef.current = actions;
    queryRef.current = query;
  }, [actions, query]);

  useEffect(() => {
    const handleMouseDown = (e: MouseEvent) => {
      if (e.button !== 0) return;

      const target = e.target as HTMLElement | null;
      if (!target) return;

      if (
        target.closest("input") ||
        target.closest("textarea") ||
        target.closest("select") ||
        target.closest("[contenteditable=true]") ||
        target.closest("[data-resize-handle]") ||
        target.closest("[data-panel]")
      ) {
        return;
      }

      const nodeEl = target.closest("[data-node-id]") as HTMLElement | null;
      if (!nodeEl) return;

      const nodeId = nodeEl.getAttribute("data-node-id");
      if (!nodeId || nodeId === "ROOT") return;

      const state = queryRef.current.getState();
      let ids = selectedToIds(state.events.selected).filter((id) => id && id !== "ROOT" && !!state.nodes[id]);

      if (!ids.length) ids = [nodeId];

      const offsetMoveTypes = new Set(["Image", "Text", "Icon", "Button", "Circle", "Square", "Triangle"]);
      const nodeStates: DragNodeState[] = ids.map((id) => {
        const props = state.nodes[id]?.data?.props ?? {};
        const displayName = (state.nodes[id]?.data?.displayName ?? "") as string;
        const positioned = props.position === "absolute" || props.position === "fixed" || props.position === "sticky";
        const moveMode: MoveMode = positioned || offsetMoveTypes.has(displayName) ? "offset" : "margin";

        return {
          id,
          moveMode,
          marginTop: parseNumberOrZero(props.marginTop),
          marginLeft: parseNumberOrZero(props.marginLeft),
          top: parsePxOrAuto(props.top),
          left: parsePxOrAuto(props.left),
        };
      });

      draggedDomsRef.current = getDraggedDoms(ids, queryRef.current.node);

      setDraggingStyle(draggedDomsRef.current, true);
      document.body.dataset[EDITOR_DRAGGING_FLAG] = "true";

      document.body.style.userSelect = "none";
      document.body.style.cursor = "grabbing";

      dragRef.current = {
        startX: e.clientX,
        startY: e.clientY,
        lastX: e.clientX,
        lastY: e.clientY,
        zoom: getEffectiveZoom(draggedDomsRef.current[0] ?? null),
        nodeStates,
      };
    };

    const handleMouseMove = (e: MouseEvent) => {
      const d = dragRef.current;
      if (!d) return;

      d.lastX = e.clientX;
      d.lastY = e.clientY;

      const totalDx = (d.lastX - d.startX) / d.zoom;
      const totalDy = (d.lastY - d.startY) / d.zoom;
      setDragPreview(draggedDomsRef.current, totalDx, totalDy);
    };

    const handleMouseUp = () => {
      const d = dragRef.current;
      if (!d) return;

      const totalDx = (d.lastX - d.startX) / d.zoom;
      const totalDy = (d.lastY - d.startY) / d.zoom;
      const currentState = queryRef.current.getState();

      document.body.dataset[EDITOR_DROP_COMMIT_FLAG] = "true";

      d.nodeStates.forEach((node) => {
        if (!currentState.nodes[node.id]) return;
        try {
          actionsRef.current.setProp(node.id, (props: any) => {
            if (node.moveMode === "offset") {
              if (!props.position || props.position === "static") props.position = "relative";
              props.left = `${node.left + totalDx}px`;
              props.top = `${node.top + totalDy}px`;
            } else {
              props.marginLeft = node.marginLeft + totalDx;
              props.marginTop = node.marginTop + totalDy;
            }
          });
        } catch {}
      });

      requestAnimationFrame(() => {
        clearDragPreview(draggedDomsRef.current);
        setDraggingStyle(draggedDomsRef.current, false);
        delete document.body.dataset[EDITOR_DRAGGING_FLAG];
        requestAnimationFrame(() => {
          delete document.body.dataset[EDITOR_DROP_COMMIT_FLAG];
        });
      });

      document.body.style.userSelect = "";
      document.body.style.cursor = "";

      dragRef.current = null;
    };

    document.addEventListener("mousedown", handleMouseDown, true);
    document.addEventListener("mousemove", handleMouseMove, true);
    document.addEventListener("mouseup", handleMouseUp, true);
    window.addEventListener("mouseup", handleMouseUp, true);

    return () => {
      document.removeEventListener("mousedown", handleMouseDown, true);
      document.removeEventListener("mousemove", handleMouseMove, true);
      document.removeEventListener("mouseup", handleMouseUp, true);
      window.removeEventListener("mouseup", handleMouseUp, true);
      delete document.body.dataset[EDITOR_DRAGGING_FLAG];
      delete document.body.dataset[EDITOR_DROP_COMMIT_FLAG];
    };
  }, []);

  return (
    <style>{`
      [${DRAGGING_ATTR}="true"] {
        z-index: 9999 !important;
        backface-visibility: hidden;
        transform-style: preserve-3d;
        transition: none !important;
      }
    `}</style>
  );
};
