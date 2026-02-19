"use client";

import { useEffect, useRef } from "react";
import { useEditor } from "@craftjs/core";

const DRAG_THRESHOLD = 3;

const CANVAS_TYPES = new Set([
  "Container",
  "Section",
  "Row",
  "Column",
  "Circle",
  "Square",
  "Triangle",
  "Page",
]);

const DROP_TARGET_ATTR = "data-drop-target";
const DRAGGING_ATTR = "data-dragging";

type NodesMap = Record<string, { data?: { displayName?: string; parent?: string | null; nodes?: string[] }; id?: string; dom?: HTMLElement | null }>;

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

function isCanvasNode(nodes: NodesMap, id: string): boolean {
  const node = nodes[id];
  if (!node?.data?.displayName) return false;
  return CANVAS_TYPES.has(node.data.displayName);
}

function canAcceptNode(nodes: NodesMap, targetId: string, movedNodeId: string): boolean {
  const target = nodes[targetId];
  const moved = nodes[movedNodeId];
  if (!target || !moved) return false;
  const targetDisplay = target.data?.displayName ?? "";
  const movedDisplay = moved.data?.displayName ?? "";
  if (targetDisplay === "Viewport" && movedDisplay !== "Page") return false;
  return true;
}

function getDescendantIds(nodes: NodesMap, rootIds: string[]): Set<string> {
  const out = new Set<string>();
  const stack = [...rootIds];
  while (stack.length > 0) {
    const id = stack.pop()!;
    const childIds = nodes[id]?.data?.nodes ?? [];
    for (const childId of childIds) {
      out.add(childId);
      stack.push(childId);
    }
  }
  return out;
}

/**
 * Find the DEEPEST (innermost) valid drop-target canvas under the cursor.
 * elementsFromPoint returns front-to-back, so the first valid canvas is deepest.
 * Temporarily hides dragged DOMs so they don't block hit detection.
 */
function getDropTargetAt(
  clientX: number,
  clientY: number,
  nodes: NodesMap,
  draggedIds: string[],
  draggedDoms: HTMLElement[]
): string | null {
  const origPointerEvents: string[] = [];
  for (const dom of draggedDoms) {
    origPointerEvents.push(dom.style.pointerEvents);
    dom.style.pointerEvents = "none";
  }

  const elements = document.elementsFromPoint(clientX, clientY);

  for (let i = 0; i < draggedDoms.length; i++) {
    draggedDoms[i].style.pointerEvents = origPointerEvents[i];
  }

  const descendantSet = getDescendantIds(nodes, draggedIds);
  const draggedSet = new Set(draggedIds);

  for (const el of elements) {
    const nodeId = (el as HTMLElement).getAttribute?.("data-node-id");
    if (!nodeId || nodeId === "ROOT" || !nodes[nodeId]) continue;
    if (draggedSet.has(nodeId) || descendantSet.has(nodeId)) continue;
    if (!isCanvasNode(nodes, nodeId)) continue;

    const canAccept = draggedIds.every((id) => canAcceptNode(nodes, nodeId, id));
    if (!canAccept) continue;

    return nodeId;
  }
  return null;
}

function computeInsertIndex(
  dropTargetId: string,
  clientX: number,
  clientY: number,
  nodes: NodesMap,
  draggedIds: string[],
  queryNode: (id: string) => { get: () => { dom: HTMLElement | null } | null }
): number {
  const childIds = (nodes[dropTargetId]?.data?.nodes ?? []).filter(
    (cid) => !draggedIds.includes(cid)
  );
  if (childIds.length === 0) return 0;

  const isRow = (() => {
    const parentDom = (() => {
      try { return queryNode(dropTargetId).get()?.dom; } catch { return null; }
    })();
    if (!parentDom) return false;
    const style = getComputedStyle(parentDom);
    return style.flexDirection === "row" || style.flexDirection === "row-reverse";
  })();

  for (let i = 0; i < childIds.length; i++) {
    let childDom: HTMLElement | null = null;
    try { childDom = queryNode(childIds[i]).get()?.dom ?? null; } catch { continue; }
    if (!childDom) continue;
    const rect = childDom.getBoundingClientRect();
    const midY = rect.top + rect.height / 2;
    const midX = rect.left + rect.width / 2;
    if (isRow ? clientX < midX : clientY < midY) {
      return i;
    }
  }
  return childIds.length;
}

function clearDropTargetHighlight(ref: React.MutableRefObject<HTMLElement | null>) {
  if (ref.current) {
    ref.current.removeAttribute(DROP_TARGET_ATTR);
    ref.current = null;
  }
}

function setDropTargetHighlight(
  nodeId: string | null,
  nodes: NodesMap,
  ref: React.MutableRefObject<HTMLElement | null>
) {
  if (!nodeId) {
    clearDropTargetHighlight(ref);
    return;
  }
  const node = nodes[nodeId] as { dom?: HTMLElement | null } | undefined;
  const dom = node?.dom ?? null;
  if (dom && ref.current !== dom) {
    clearDropTargetHighlight(ref);
    ref.current = dom;
    dom.setAttribute(DROP_TARGET_ATTR, "true");
  } else if (!dom) {
    clearDropTargetHighlight(ref);
  }
}

function clearInsertIndicator(ref: React.MutableRefObject<HTMLElement | null>) {
  if (ref.current) {
    ref.current.remove();
    ref.current = null;
  }
}

function showInsertIndicator(
  dropTargetId: string,
  insertIndex: number,
  nodes: NodesMap,
  draggedIds: string[],
  queryNode: (id: string) => { get: () => { dom: HTMLElement | null } | null },
  ref: React.MutableRefObject<HTMLElement | null>
) {
  clearInsertIndicator(ref);

  const childIds = (nodes[dropTargetId]?.data?.nodes ?? []).filter(
    (cid) => !draggedIds.includes(cid)
  );
  if (childIds.length === 0) return;

  let parentDom: HTMLElement | null = null;
  try { parentDom = queryNode(dropTargetId).get()?.dom ?? null; } catch { /* */ }
  if (!parentDom) return;

  const parentStyle = getComputedStyle(parentDom);
  const isRow = parentStyle.flexDirection === "row" || parentStyle.flexDirection === "row-reverse";

  let lineRect: { x: number; y: number; w: number; h: number } | null = null;

  if (insertIndex <= 0) {
    let firstDom: HTMLElement | null = null;
    try { firstDom = queryNode(childIds[0]).get()?.dom ?? null; } catch { /* */ }
    if (!firstDom) return;
    const r = firstDom.getBoundingClientRect();
    if (isRow) {
      lineRect = { x: r.left - 1, y: r.top, w: 2, h: r.height };
    } else {
      lineRect = { x: r.left, y: r.top - 1, w: r.width, h: 2 };
    }
  } else if (insertIndex >= childIds.length) {
    let lastDom: HTMLElement | null = null;
    try { lastDom = queryNode(childIds[childIds.length - 1]).get()?.dom ?? null; } catch { /* */ }
    if (!lastDom) return;
    const r = lastDom.getBoundingClientRect();
    if (isRow) {
      lineRect = { x: r.right - 1, y: r.top, w: 2, h: r.height };
    } else {
      lineRect = { x: r.left, y: r.bottom - 1, w: r.width, h: 2 };
    }
  } else {
    let prevDom: HTMLElement | null = null;
    let nextDom: HTMLElement | null = null;
    try { prevDom = queryNode(childIds[insertIndex - 1]).get()?.dom ?? null; } catch { /* */ }
    try { nextDom = queryNode(childIds[insertIndex]).get()?.dom ?? null; } catch { /* */ }
    if (!prevDom || !nextDom) return;
    const rp = prevDom.getBoundingClientRect();
    const rn = nextDom.getBoundingClientRect();
    if (isRow) {
      const midX = (rp.right + rn.left) / 2;
      const top = Math.min(rp.top, rn.top);
      const bot = Math.max(rp.bottom, rn.bottom);
      lineRect = { x: midX - 1, y: top, w: 2, h: bot - top };
    } else {
      const midY = (rp.bottom + rn.top) / 2;
      const left = Math.min(rp.left, rn.left);
      const right = Math.max(rp.right, rn.right);
      lineRect = { x: left, y: midY - 1, w: right - left, h: 2 };
    }
  }

  if (!lineRect) return;

  const el = document.createElement("div");
  el.style.cssText = `position:fixed;left:${lineRect.x}px;top:${lineRect.y}px;width:${lineRect.w}px;height:${lineRect.h}px;background:#3b82f6;z-index:99999;pointer-events:none;border-radius:1px;`;
  document.body.appendChild(el);
  ref.current = el;
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

function getDraggedDoms(
  ids: string[],
  queryNode: (id: string) => { get: () => { dom: HTMLElement | null } | null }
): HTMLElement[] {
  const doms: HTMLElement[] = [];
  for (const id of ids) {
    try {
      const dom = queryNode(id).get()?.dom;
      if (dom) doms.push(dom);
    } catch { /* ignore */ }
  }
  return doms;
}

export const FigmaStyleDragHandler = () => {
  const { actions, query } = useEditor();
  const actionsRef = useRef(actions);
  const queryRef = useRef(query);
  actionsRef.current = actions;
  queryRef.current = query;

  const rafRef = useRef<number>(0);
  const processDragRef = useRef<(() => void) | null>(null);
  const dropTargetHighlightRef = useRef<HTMLElement | null>(null);
  const insertIndicatorRef = useRef<HTMLElement | null>(null);
  const draggedDomsRef = useRef<HTMLElement[]>([]);
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
        rafRef.current = 0;
        return;
      }

      d.dirty = false;
      const dx = (d.lastX - d.startX) / d.zoom;
      const dy = (d.lastY - d.startY) / d.zoom;

      if (!Number.isFinite(dx) || !Number.isFinite(dy)) {
        rafRef.current = 0;
        return;
      }

      if (Math.abs(dx) < 0.01 && Math.abs(dy) < 0.01) {
        rafRef.current = 0;
        return;
      }

      d.nodeMargins.forEach(({ id, marginTop, marginLeft }) => {
        actionsRef.current.setProp(id, (props: Record<string, unknown>) => {
          props.marginTop = marginTop + dy;
          props.marginLeft = marginLeft + dx;
        });
      });

      d.startX = d.lastX;
      d.startY = d.lastY;
      d.nodeMargins = d.nodeMargins.map((n) => ({
        ...n,
        marginTop: n.marginTop + dy,
        marginLeft: n.marginLeft + dx,
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

      if (target.closest("INPUT") || target.closest("TEXTAREA") || target.closest("SELECT") || target.closest("[contenteditable=true]")) return;
      if (document.body.dataset.spacePan === "true") return;
      if (target.closest("[data-panel='resize-overlay']")) return;
      if (target.closest("[data-panel]")) return;
      if (target.closest("[data-resize-handle]")) return;

      const onNode = target.closest("[data-node-id]") as HTMLElement | null;
      const nodeIdFromTarget = onNode?.getAttribute("data-node-id") ?? null;

      const state = queryRef.current.getState();
      const nodesMap = state.nodes;
      const exists = (id: string) => !!id && id !== "ROOT" && !!nodesMap[id];

      if (nodeIdFromTarget && exists(nodeIdFromTarget)) {
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
        if (ids.length === 0) { dragRef.current = null; return; }

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
      if (!d) {
        clearDropTargetHighlight(dropTargetHighlightRef);
        clearInsertIndicator(insertIndicatorRef);
        return;
      }
      clearDropTargetHighlight(dropTargetHighlightRef);
      clearInsertIndicator(insertIndicatorRef);
      setDraggingStyle(draggedDomsRef.current, false);
      draggedDomsRef.current = [];
      dragRef.current = null;

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
              });
            });
          } catch {
            d.nodeMargins.forEach(({ id, marginTop, marginLeft }) => {
              actionsRef.current.setProp(id, (props: Record<string, unknown>) => {
                props.marginTop = Math.round(marginTop);
                props.marginLeft = Math.round(marginLeft);
              });
            });
          }
        } else {
          d.nodeMargins.forEach(({ id, marginTop, marginLeft }) => {
            actionsRef.current.setProp(id, (props: Record<string, unknown>) => {
              props.marginTop = Math.round(marginTop);
              props.marginLeft = Math.round(marginLeft);
            });
          });
        }
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
      }
      dragRef.current = null;
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = 0;
      }
    };

    document.addEventListener("mousedown", handleMouseDown, true);
    document.addEventListener("mousemove", handleMouseMove, true);
    document.addEventListener("mouseup", handleMouseUp, true);
    window.addEventListener("mouseup", handleMouseUp, true);
    document.addEventListener("mouseleave", handleMouseUp, true);
    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = 0;
      }
      processDragRef.current = null;
      document.removeEventListener("mousedown", handleMouseDown, true);
      document.removeEventListener("mousemove", handleMouseMove, true);
      document.removeEventListener("mouseup", handleMouseUp, true);
      window.removeEventListener("mouseup", handleMouseUp, true);
      document.removeEventListener("mouseleave", handleMouseUp, true);
    };
  }, []);

  return (
    <style>{`
      [${DROP_TARGET_ATTR}="true"] {
        outline: 2px dashed #3b82f6 !important;
        outline-offset: -2px;
        transition: outline 0.15s ease;
      }
      [${DRAGGING_ATTR}="true"] {
        opacity: 0.7;
        z-index: 9999 !important;
        position: relative;
        box-shadow: 0 8px 32px rgba(59,130,246,0.25), 0 2px 8px rgba(0,0,0,0.15);
        transition: opacity 0.1s ease, box-shadow 0.1s ease;
      }
    `}</style>
  );
};
