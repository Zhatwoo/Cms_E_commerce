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

function parsePx(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const n = parseFloat(value.replace("px", "").trim());
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
}

const OFFSET_MOVE_TYPES = new Set(["Image", "Text", "Icon", "Button", "Circle", "Square", "Triangle"]);

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
    nodeMargins: Array<{
      id: string;
      marginTop: number;
      marginLeft: number;
      mode: "margin" | "offset";
      top: number;
      left: number;
    }>;
    fallbackNodeId: string | null;
    dirty: boolean;
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

      d.nodeMargins.forEach((entry) => {
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
      d.nodeMargins = d.nodeMargins.map((n) => ({
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

      setDraggingStyle(draggedDomsRef.current, true);
      document.body.dataset[EDITOR_DRAGGING_FLAG] = "true";

      document.body.style.userSelect = "none";
      document.body.style.cursor = "grabbing";

      const onNode = target.closest("[data-node-id]") as HTMLElement | null;
      const nodeIdFromTarget = onNode?.getAttribute("data-node-id") ?? null;

      const state = queryRef.current.getState();
      const nodesMap = state.nodes;
      const exists = (id: string) => !!id && id !== "ROOT" && !!nodesMap[id];

      if (nodeIdFromTarget && exists(nodeIdFromTarget)) {
        const node = nodesMap[nodeIdFromTarget];
        const locked = node?.data?.props?.locked === true;
        if (locked) return;
        dragRef.current = {
          startX: e.clientX, startY: e.clientY,
          lastX: e.clientX, lastY: e.clientY,
          committed: false, zoom: 1,
          nodeMargins: [], fallbackNodeId: nodeIdFromTarget, dirty: false,
        };
        return;
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
        ids = ids.filter((id) => state.nodes[id]?.data?.props?.locked !== true);
        if (ids.length === 0) { dragRef.current = null; return; }

        let firstDom: HTMLElement | null = null;
        try { firstDom = queryRef.current.node(ids[0]).get()?.dom ?? null; } catch { /* ignore */ }

        document.body.style.userSelect = "none";
        document.body.style.cursor = "grabbing";

        d.committed = true;
        d.zoom = getEffectiveZoom(firstDom);
        d.nodeMargins = ids.map((id) => {
          const props = state.nodes[id]?.data?.props ?? {};
          const displayName = state.nodes[id]?.data?.displayName as string | undefined;
          const position = (props.position as string) ?? "static";
          const useOffset =
            (position === "absolute" || position === "relative" || position === "fixed") ||
            (displayName && OFFSET_MOVE_TYPES.has(displayName));
          return {
            id,
            marginTop: typeof props.marginTop === "number" ? props.marginTop : 0,
            marginLeft: typeof props.marginLeft === "number" ? props.marginLeft : 0,
            mode: useOffset ? "offset" : "margin",
            top: parsePx(props.top),
            left: parsePx(props.left),
          };
        });

        draggedDomsRef.current = getDraggedDoms(ids, queryRef.current.node);
        setDraggingStyle(draggedDomsRef.current, true);
      }

      d.dirty = true;
      if (d.committed && !rafRef.current && processDragRef.current) {
        rafRef.current = requestAnimationFrame(processDragRef.current);
      }
    };

    const handleMouseUp = () => {
      const d = dragRef.current;
      if (!d) return;

      const totalDx = (d.lastX - d.startX) / d.zoom;
      const totalDy = (d.lastY - d.startY) / d.zoom;

      document.body.dataset[EDITOR_DROP_COMMIT_FLAG] = "true";

      if (d.committed) {
        const state = queryRef.current.getState();
        const nodes = state.nodes as NodesMap;
        const ids = d.nodeMargins.map((n) => n.id);
        const currentParentId = nodes[ids[0]]?.data?.parent ?? null;

        const doms = getDraggedDoms(ids, queryRef.current.node);
        const dropTargetId = getDropTargetAt(d.lastX, d.lastY, nodes, ids, doms);

        if (
          dropTargetId &&
          dropTargetId !== currentParentId &&
          ids.every((id) => canAcceptNode(nodes, dropTargetId, id))
        ) {
          try {
            const insertIndex = computeInsertIndex(dropTargetId, d.lastX, d.lastY, nodes, ids, queryRef.current.node);

            ids.forEach((nodeId, i) => {
              actionsRef.current.move(nodeId, dropTargetId, insertIndex + i);
            });

            ids.forEach((id) => {
              actionsRef.current.setProp(id, (props: Record<string, unknown>) => {
                props.marginTop = 0;
                props.marginLeft = 0;
                props.top = "0px";
                props.left = "0px";
              });
            });
          } catch {
            d.nodeMargins.forEach((entry) => {
              const { id, mode, marginTop, marginLeft, top, left } = entry;
              actionsRef.current.setProp(id, (props: Record<string, unknown>) => {
                if (mode === "offset") {
                  props.top = `${Math.round(top)}px`;
                  props.left = `${Math.round(left)}px`;
                } else {
                  props.marginTop = Math.round(marginTop);
                  props.marginLeft = Math.round(marginLeft);
                }
              });
            });
          }
        } else {
          d.nodeMargins.forEach((entry) => {
            const { id, mode, marginTop, marginLeft, top, left } = entry;
            actionsRef.current.setProp(id, (props: Record<string, unknown>) => {
              if (mode === "offset") {
                props.top = `${Math.round(top)}px`;
                props.left = `${Math.round(left)}px`;
              } else {
                props.marginTop = Math.round(marginTop);
                props.marginLeft = Math.round(marginLeft);
              }
            });
          });
        }
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
    // Do NOT end drag on document mouseleave — keep tracking when cursor moves
    // outside canvas (panels or window edge); only end on mouseup or window blur
    return () => {
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
