"use client";

import { useEffect, useRef } from "react";
import { useEditor } from "@craftjs/core";

const DRAGGING_ATTR = "data-dragging";
const EDITOR_DRAGGING_FLAG = "editorDragging";
const EDITOR_DROP_COMMIT_FLAG = "editorDropCommit";
const DRAG_THRESHOLD = 5;

type MoveMode = "margin" | "offset";

type DragNodeState = {
  id: string;
  mode: MoveMode;
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
    const zoomText = window.getComputedStyle(current).getPropertyValue("zoom");
    const parsed = parseFloat(zoomText);
    if (Number.isFinite(parsed) && parsed > 0) {
      zoom *= parsed;
    }
    current = current.parentElement;
  }
  return zoom > 0.01 ? zoom : 1;
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

const OFFSET_MOVE_TYPES = new Set(["Image", "Text", "Icon", "Button", "Circle", "Square", "Triangle"]);

function selectedToIds(raw: unknown): string[] {
  if (Array.isArray(raw)) return raw;
  if (raw instanceof Set) return Array.from(raw);
  if (raw && typeof raw === "object") return Object.keys(raw as Record<string, unknown>);
  return [];
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
    } catch {
      // ignore
    }
  }
  return doms;
}

export const FigmaStyleDragHandler = () => {
  const { actions, query } = useEditor();

  const actionsRef = useRef(actions);
  const queryRef = useRef(query);
  const rafRef = useRef<number>(0);
  const processDragRef = useRef<(() => void) | null>(null);

  const draggedDomsRef = useRef<HTMLElement[]>([]);

  const dragRef = useRef<{
    startX: number;
    startY: number;
    lastX: number;
    lastY: number;
    zoom: number;
    nodeMargins: DragNodeState[];
    fallbackNodeId: string | null;
    committed: boolean;
    dirty: boolean;
  } | null>(null);

  useEffect(() => {
    actionsRef.current = actions;
    queryRef.current = query;
  }, [actions, query]);

  useEffect(() => {
    const tick = () => {
      const d = dragRef.current;
      if (!d || !d.committed) {
        rafRef.current = 0;
        return;
      }

      const dx = (d.lastX - d.startX) / d.zoom;
      const dy = (d.lastY - d.startY) / d.zoom;
      d.dirty = false;

      if (dx === 0 && dy === 0) {
        rafRef.current = 0;
        return;
      }

      const nodes = queryRef.current?.getState()?.nodes ?? {};
      const validEntries = d.nodeMargins.filter((entry) => entry.id && nodes[entry.id]);
      setDragPreview(draggedDomsRef.current, d.lastX - d.startX, d.lastY - d.startY);
      validEntries.forEach((entry) => {
        const { id, mode, marginTop, marginLeft, top, left } = entry;
        actionsRef.current.setProp(id, (props: Record<string, unknown>) => {
          if (mode === "offset") {
            props.top = `${top + dy}px`;
            props.left = `${left + dx}px`;
          } else {
            props.marginTop = marginTop + dy;
            props.marginLeft = marginLeft + dx;
          }
        });
      });

      d.startX = d.lastX;
      d.startY = d.lastY;
      d.nodeMargins = validEntries.map((n) => ({
        ...n,
        marginTop: n.marginTop + dy,
        marginLeft: n.marginLeft + dx,
        top: n.top + dy,
        left: n.left + dx,
      }));

      if (d.dirty) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        rafRef.current = 0;
      }
    };

    processDragRef.current = tick;

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

      if (document.body.dataset.spacePan === "true") {
        return;
      }

      const onNode = target.closest("[data-node-id]") as HTMLElement | null;
      const nodeIdFromTarget = onNode?.getAttribute("data-node-id") ?? null;

      const state = queryRef.current.getState();
      const nodesMap = state.nodes as Record<string, { data?: { props?: { locked?: boolean } } }>;
      const exists = (id: string) => !!id && id !== "ROOT" && !!nodesMap[id];

      if (!nodeIdFromTarget || !exists(nodeIdFromTarget)) {
        return;
      }

      const node = nodesMap[nodeIdFromTarget];
      const locked = node?.data?.props?.locked === true;
      if (locked) return;

      dragRef.current = {
        startX: e.clientX,
        startY: e.clientY,
        lastX: e.clientX,
        lastY: e.clientY,
        zoom: 1,
        nodeMargins: [],
        fallbackNodeId: nodeIdFromTarget,
        committed: false,
        dirty: false,
      };
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
        ids = ids.filter((id) => state.nodes[id]?.data?.props?.locked !== true);
        if (ids.length === 0) {
          dragRef.current = null;
          return;
        }

        let firstDom: HTMLElement | null = null;
        try {
          firstDom = queryRef.current.node(ids[0]).get()?.dom ?? null;
        } catch {
          // ignore
        }

        d.committed = true;
        d.zoom = getEffectiveZoom(firstDom);
        d.nodeMargins = ids.map((id): DragNodeState => {
          const props = state.nodes[id]?.data?.props ?? {};
          const displayName = state.nodes[id]?.data?.displayName as string | undefined;
          const position = (props.position as string) ?? "static";
          const useOffset =
            (position === "absolute" || position === "relative" || position === "fixed") ||
            (displayName && OFFSET_MOVE_TYPES.has(displayName));
          return {
            id,
            marginTop: parseNumberOrZero(props.marginTop),
            marginLeft: parseNumberOrZero(props.marginLeft),
            mode: useOffset ? "offset" : "margin",
            top: parsePxOrAuto(props.top),
            left: parsePxOrAuto(props.left),
          };
        });

        draggedDomsRef.current = getDraggedDoms(ids, queryRef.current.node);
        setDraggingStyle(draggedDomsRef.current, true);
        document.body.dataset[EDITOR_DRAGGING_FLAG] = "true";
        document.body.style.userSelect = "none";
        document.body.style.cursor = "grabbing";
      }

      d.dirty = true;
      if (d.committed && !rafRef.current && processDragRef.current) {
        rafRef.current = requestAnimationFrame(processDragRef.current);
      }
    };

    const handleMouseUp = () => {
      const d = dragRef.current;
      if (!d) return;

      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = 0;
      }

      document.body.dataset[EDITOR_DROP_COMMIT_FLAG] = "true";

      if (d.committed) {
        clearDragPreview(draggedDomsRef.current);
        setDraggingStyle(draggedDomsRef.current, false);
        draggedDomsRef.current = [];

        delete document.body.dataset[EDITOR_DRAGGING_FLAG];
        delete document.body.dataset[EDITOR_DROP_COMMIT_FLAG];
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
      }

      dragRef.current = null;
    };

    document.addEventListener("mousedown", handleMouseDown, true);
    document.addEventListener("mousemove", handleMouseMove, true);
    document.addEventListener("mouseup", handleMouseUp, true);
    window.addEventListener("mouseup", handleMouseUp, true);
    window.addEventListener("blur", handleMouseUp, true);

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = 0;
      }
      clearDragPreview(draggedDomsRef.current);
      setDraggingStyle(draggedDomsRef.current, false);
      draggedDomsRef.current = [];
      delete document.body.dataset[EDITOR_DRAGGING_FLAG];
      delete document.body.dataset[EDITOR_DROP_COMMIT_FLAG];
      document.body.style.cursor = "";
      document.body.style.userSelect = "";

      document.removeEventListener("mousedown", handleMouseDown, true);
      document.removeEventListener("mousemove", handleMouseMove, true);
      document.removeEventListener("mouseup", handleMouseUp, true);
      window.removeEventListener("mouseup", handleMouseUp, true);
      window.removeEventListener("blur", handleMouseUp, true);
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
