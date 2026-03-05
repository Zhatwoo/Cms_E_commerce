"use client";

import { useEffect, useRef } from "react";
import { useEditor } from "@craftjs/core";
import { useCanvasTool } from "./CanvasToolContext";

const DRAGGING_ATTR = "data-dragging";

type NodesMap = Record<string, { data?: { parent?: string; isCanvas?: boolean; displayName?: string } }>

const CANVAS_DISPLAY_NAMES = new Set([
  "Page",
  "Viewport",
  "Container",
  "Section",
  "Row",
  "Column",
  "Frame",
  "Button",
]);
const EDITOR_DRAGGING_FLAG = "editorDragging";
const EDITOR_DROP_COMMIT_FLAG = "editorDropCommit";
const MULTI_DRAG_LOCK_FLAG = "multiDragLock";
const BOX_SELECTING_FLAG = "boxSelecting";
const BOX_SELECTING_INTENT_FLAG = "boxSelectingIntent";


type MoveMode = "margin" | "offset";

type DragNodeState = {
  id: string;
  mode: MoveMode;
  parentId?: string;
  needsAbsolute: boolean;
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

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

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

function getDropTargetAt(
  clientX: number,
  clientY: number,
  nodes: NodesMap,
  excludeIds: string[],
  _doms: HTMLElement[]
): string | null {
  const exclude = new Set(excludeIds);
  const elements = document.elementsFromPoint(clientX, clientY) as HTMLElement[];
  for (const el of elements) {
    const withNode = el.closest("[data-node-id]") as HTMLElement | null;
    if (!withNode) continue;
    const id = withNode.getAttribute("data-node-id");
    if (!id || exclude.has(id)) continue;
    const node = nodes[id];
    if (!node?.data) continue;
    if (node.data.isCanvas) return id;
    if (node.data.displayName && CANVAS_DISPLAY_NAMES.has(node.data.displayName)) return id;
  }
  return null;
}

/**
 * Finds the most specific (deepest) node-id in the element's ancestor chain.
 * This ensures we get the actual clicked element, not a parent container.
 */
function findDeepestNodeId(element: HTMLElement | null): string | null {
  if (!element) return null;

  // Check if element itself has data-node-id
  const selfId = element.getAttribute("data-node-id");
  if (selfId) return selfId;

  // Walk up the tree and collect all node-ids
  const nodeIds: Array<{ id: string; element: HTMLElement }> = [];
  let current: HTMLElement | null = element;

  while (current && current !== document.body) {
    const id = current.getAttribute("data-node-id");
    if (id) {
      nodeIds.push({ id, element: current });
    }
    current = current.parentElement;
  }

  // Return the first (deepest) node-id found
  return nodeIds.length > 0 ? nodeIds[0].id : null;
}

function canAcceptNode(nodes: NodesMap, _targetId: string, _nodeId: string): boolean {
  return true;
}

function computeInsertIndex(
  _targetId: string,
  _clientX: number,
  _clientY: number,
  nodes: NodesMap,
  ids: string[],
  _queryNode: (id: string) => { get: () => { dom: HTMLElement | null } | null }
): number {
  return 0;
}

export const FigmaStyleDragHandler = () => {
  const { actions, query } = useEditor();
  const actionsRef = useRef(actions);
  const queryRef = useRef(query);

  const rafRef = useRef<number>(0);
  const processDragRef = useRef<(() => void) | null>(null);
  const draggedDomsRef = useRef<HTMLElement[]>([]);
  const dropTargetHighlightRef = useRef<HTMLElement | null>(null);
  const insertIndicatorRef = useRef<HTMLElement | null>(null);
  const { activeTool } = useCanvasTool();


  const dragRef = useRef<{
    startX: number;
    startY: number;
    lastX: number;
    lastY: number;
    zoom: number;
    committed: boolean;

    nodeMargins: DragNodeState[];
    fallbackNodeId: string | null;
    selectionSnapshotIds: string[];
    clickedWasInSelection: boolean;
    preferMultiDrag: boolean;
    dirty: boolean;
  } | null>(null);

  useEffect(() => {
    actionsRef.current = actions;
    queryRef.current = query;
  }, [actions, query]);

  useEffect(() => {
    const tick = () => {
      rafRef.current = 0;
      const d = dragRef.current;
      if (!d || !d.committed || !d.dirty) return;
      const dx = (d.lastX - d.startX) / d.zoom;
      const dy = (d.lastY - d.startY) / d.zoom;
      setDragPreview(draggedDomsRef.current, dx, dy);
      d.dirty = false;
    };
    processDragRef.current = tick;
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = 0;
      processDragRef.current = null;
    };
  }, []);

  useEffect(() => {
    const MIN_VISIBLE_PX = 0;
    const MARGIN_MIN = -1200;
    const MARGIN_MAX = 2400;

    const getOffsetBounds = (nodeId: string) => {
      try {
        const dom = queryRef.current.node(nodeId).get()?.dom ?? null;
        if (!dom) return null;

        const parent = (dom.offsetParent as HTMLElement | null) ?? dom.parentElement;
        if (!parent) return null;

        const nodeRect = dom.getBoundingClientRect();
        const parentRect = parent.getBoundingClientRect();
        if (!Number.isFinite(nodeRect.width) || !Number.isFinite(nodeRect.height)) return null;
        if (!Number.isFinite(parentRect.width) || !Number.isFinite(parentRect.height)) return null;

        const minLeft = 0;
        const minTop = 0;
        const maxLeftRaw = Math.round(parentRect.width - nodeRect.width - MIN_VISIBLE_PX);
        const maxTopRaw = Math.round(parentRect.height - nodeRect.height - MIN_VISIBLE_PX);

        const maxLeft = Math.max(minLeft, maxLeftRaw);
        const maxTop = Math.max(minTop, maxTopRaw);

        return { minLeft, maxLeft, minTop, maxTop };
      } catch {
        return null;
      }
    };

    const getMarginBounds = (nodeId: string, baseMarginTop: number, baseMarginLeft: number) => {
      try {
        const dom = queryRef.current.node(nodeId).get()?.dom ?? null;
        if (!dom) return null;

        const parent = dom.parentElement;
        if (!parent) return null;

        const nodeRect = dom.getBoundingClientRect();
        const parentRect = parent.getBoundingClientRect();

        const minDeltaX = Math.round(parentRect.left + MIN_VISIBLE_PX - nodeRect.left);
        const maxDeltaX = Math.round(parentRect.right - MIN_VISIBLE_PX - nodeRect.right);
        const minDeltaY = Math.round(parentRect.top + MIN_VISIBLE_PX - nodeRect.top);
        const maxDeltaY = Math.round(parentRect.bottom - MIN_VISIBLE_PX - nodeRect.bottom);

        const minMarginLeft = baseMarginLeft + minDeltaX;
        const maxMarginLeft = baseMarginLeft + maxDeltaX;
        const minMarginTop = baseMarginTop + minDeltaY;
        const maxMarginTop = baseMarginTop + maxDeltaY;

        return {
          minMarginLeft: Math.min(minMarginLeft, maxMarginLeft),
          maxMarginLeft: Math.max(minMarginLeft, maxMarginLeft),
          minMarginTop: Math.min(minMarginTop, maxMarginTop),
          maxMarginTop: Math.max(minMarginTop, maxMarginTop),
        };
      } catch {
        return null;
      }
    };

    const applyBoundedMove = (
      entry: DragNodeState,
      dx: number,
      dy: number,
      props: Record<string, unknown>
    ) => {
      const { id, mode, marginTop, marginLeft, top, left } = entry;

      if (mode === "offset") {
        const rawTop = Math.round(top + dy);
        const rawLeft = Math.round(left + dx);
        const bounds = getOffsetBounds(id);

        if (bounds) {
          props.top = `${clamp(rawTop, bounds.minTop, bounds.maxTop)}px`;
          props.left = `${clamp(rawLeft, bounds.minLeft, bounds.maxLeft)}px`;
        } else {
          props.top = `${rawTop}px`;
          props.left = `${rawLeft}px`;
        }
        return;
      }

      const rawMarginTop = Math.round(marginTop + dy);
      const rawMarginLeft = Math.round(marginLeft + dx);
      const bounds = getMarginBounds(id, marginTop, marginLeft);

      if (bounds) {
        const topMin = Math.max(MARGIN_MIN, bounds.minMarginTop);
        const topMax = Math.min(MARGIN_MAX, bounds.maxMarginTop);
        const leftMin = Math.max(MARGIN_MIN, bounds.minMarginLeft);
        const leftMax = Math.min(MARGIN_MAX, bounds.maxMarginLeft);

        props.marginTop = clamp(rawMarginTop, topMin, Math.max(topMin, topMax));
        props.marginLeft = clamp(rawMarginLeft, leftMin, Math.max(leftMin, leftMax));
        return;
      }

      props.marginTop = clamp(rawMarginTop, MARGIN_MIN, MARGIN_MAX);
      props.marginLeft = clamp(rawMarginLeft, MARGIN_MIN, MARGIN_MAX);
    };

    const handleMouseDown = (e: MouseEvent) => {
      if (e.button !== 0) return;
      const target = e.target as HTMLElement | null;
      if (!target) return;

      if (document.body.dataset[BOX_SELECTING_FLAG] === "true") return;
      if (document.body.dataset[BOX_SELECTING_INTENT_FLAG] === "true") return;

      // Hand/Text tool: do not start dragging elements
      if (activeTool === "hand" || activeTool === "text") return;

      if (target.closest("INPUT") || target.closest("TEXTAREA") || target.closest("SELECT") || target.closest("[contenteditable=true]")) return;
      if (document.body.dataset.spacePan === "true") return;
      if (target.closest("[data-panel]") && !target.closest("[data-panel='resize-overlay']")) return;
      if (target.closest("[data-resize-handle]")) return;

      const state = queryRef.current.getState();
      const nodesMap = state.nodes as Record<string, { data?: { props?: { locked?: boolean } } }>;
      const exists = (id: string) => !!id && id !== "ROOT" && !!nodesMap[id];

      const selectedIdsAtMouseDown = selectedToIds(state.events.selected).filter((id) => id && id !== "ROOT" && !!state.nodes[id]);
      // Find the most specific (deepest) node-id in the element path
      let nodeIdFromTarget = findDeepestNodeId(target);
      if (!nodeIdFromTarget && target.closest("[data-panel='resize-overlay']") && selectedIdsAtMouseDown.length > 0) {
        nodeIdFromTarget = selectedIdsAtMouseDown[0] ?? null;
      }

      if (!nodeIdFromTarget || !exists(nodeIdFromTarget)) {
        return;
      }

      const node = nodesMap[nodeIdFromTarget];
      const locked = node?.data?.props?.locked === true;
      if (locked) return;

      const clickedWasInSelection = selectedIdsAtMouseDown.includes(nodeIdFromTarget);
      const preferMultiDrag = e.shiftKey || e.ctrlKey || e.metaKey;

      if (clickedWasInSelection && selectedIdsAtMouseDown.length > 1 && preferMultiDrag) {
        if (e.cancelable) e.preventDefault();
        e.stopPropagation();
        if (typeof e.stopImmediatePropagation === "function") {
          e.stopImmediatePropagation();
        }
        document.body.dataset[MULTI_DRAG_LOCK_FLAG] = "true";
      }

      dragRef.current = {
        startX: e.clientX,
        startY: e.clientY,
        lastX: e.clientX,
        lastY: e.clientY,
        zoom: 1,
        nodeMargins: [],
        fallbackNodeId: nodeIdFromTarget,
        selectionSnapshotIds: selectedIdsAtMouseDown,
        clickedWasInSelection,
        preferMultiDrag,
        committed: false,
        dirty: false,
      };
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (document.body.dataset[BOX_SELECTING_FLAG] === "true") {
        dragRef.current = null;
        document.body.style.userSelect = "";
        document.body.style.cursor = "";
        clearDragPreview(draggedDomsRef.current);
        setDraggingStyle(draggedDomsRef.current, false);
        draggedDomsRef.current = [];
        return;
      }

      if (document.body.dataset[BOX_SELECTING_INTENT_FLAG] === "true") {
        dragRef.current = null;
        document.body.style.userSelect = "";
        document.body.style.cursor = "";
        clearDragPreview(draggedDomsRef.current);
        setDraggingStyle(draggedDomsRef.current, false);
        draggedDomsRef.current = [];
        return;
      }

      const d = dragRef.current;
      if (!d) return;

      // Fail-safe: if left button is no longer pressed but mouseup was missed,
      // force drag cleanup so element doesn't keep following the cursor.
      if ((e.buttons & 1) === 0) {
        handleMouseUp();
        return;
      }

      // Hand tool: cancel any ongoing drag
      if (activeTool === "hand") {
        dragRef.current = null;
        document.body.style.userSelect = "";
        document.body.style.cursor = "";
        setDraggingStyle(draggedDomsRef.current, false);
        draggedDomsRef.current = [];
        return;
      }

      d.lastX = e.clientX;
      d.lastY = e.clientY;

      if (!d.committed) {
        const dx = d.lastX - d.startX;
        const dy = d.lastY - d.startY;
        const dragThreshold = 5;
        if (Math.sqrt(dx * dx + dy * dy) < dragThreshold) return;

        // Before committing, verify the cursor is NOT over a panel.
        // This handles cases where a resize handle or selection overlay is rendered
        // on top of the config panel — the drag should be cancelled, not committed.
        const elemsAtCursor = document.elementsFromPoint(d.lastX, d.lastY);
        const overPanel = elemsAtCursor.some(
          (el) => (el as HTMLElement).closest?.("[data-panel]")
        );
        if (overPanel) {
          dragRef.current = null;
          return;
        }

        const state = queryRef.current.getState();
        let ids = selectedToIds(state.events.selected).filter((id) => id && id !== "ROOT" && state.nodes[id]);

        if (d.preferMultiDrag && d.clickedWasInSelection && d.selectionSnapshotIds.length > 1) {
          const snapshotValid = d.selectionSnapshotIds.filter((id) => id && id !== "ROOT" && state.nodes[id]);
          if (snapshotValid.length > 1) {
            ids = snapshotValid;
            try {
              actionsRef.current.selectNode(snapshotValid);
            } catch {
              // ignore
            }
          }
        }

        // If we clicked on a specific node and it's not in the selection, use the clicked node
        // This prevents dragging parent containers when clicking on child elements
        if (d.fallbackNodeId && state.nodes[d.fallbackNodeId]) {
          const clickedNodeId = d.fallbackNodeId;
          const clickedNodeInSelection = ids.includes(clickedNodeId);

          // If clicked node is not in selection, prioritize the clicked node
          // This ensures we drag the actual clicked element, not a parent container
          if (!clickedNodeInSelection && ids.length > 0) {
            // Check if clicked node is a descendant of any selected node
            const isDescendant = ids.some((selectedId) => {
              let current: string | undefined = clickedNodeId;
              while (current && current !== "ROOT") {
                const node = state.nodes[current];
                const parentId = node?.data?.parent as string | undefined;
                if (parentId === selectedId) return true;
                current = parentId;
              }
              return false;
            });

            // If clicked node is a descendant, use the clicked node instead
            if (isDescendant) {
              ids = [clickedNodeId];
            }
          } else if (ids.length === 0) {
            // No selection, use clicked node
            ids = [clickedNodeId];
          }
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
          const position = (props.position as string) ?? "static";

          let top = parsePxOrAuto(props.top);
          let left = parsePxOrAuto(props.left);

          if (position !== "absolute") {
            try {
              const dom = queryRef.current.node(id).get()?.dom ?? null;
              const parent = (dom?.offsetParent as HTMLElement | null) ?? dom?.parentElement ?? null;
              if (dom && parent) {
                const rect = dom.getBoundingClientRect();
                const parentRect = parent.getBoundingClientRect();
                top = Math.round(rect.top - parentRect.top);
                left = Math.round(rect.left - parentRect.left);
              }
            } catch {
              // ignore and keep parsed top/left
            }
          }

          return {
            id,
            parentId: state.nodes[id]?.data?.parent as string | undefined,
            needsAbsolute: position !== "absolute",
            marginTop: parseNumberOrZero(props.marginTop),
            marginLeft: parseNumberOrZero(props.marginLeft),
            mode: "offset",
            top,
            left,
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
      if (!d) {
        // Always clear any stray drag styles on mouseup
        clearDragPreview(draggedDomsRef.current);
        setDraggingStyle(draggedDomsRef.current, false);
        draggedDomsRef.current = [];
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
        return;
      }

      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = 0;
      }

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
            const nodes = queryRef.current?.getState()?.nodes ?? {};
            const dx = (d.lastX - d.startX) / d.zoom;
            const dy = (d.lastY - d.startY) / d.zoom;

            d.nodeMargins.filter((e) => e.id && nodes[e.id]).forEach((entry) => {
              const { id } = entry;
              actionsRef.current.setProp(id, (props: Record<string, unknown>) => {
                applyBoundedMove(entry, dx, dy, props);
              });
            });
          }
        } else {
          const nodes = queryRef.current?.getState()?.nodes ?? {};
          const dx = (d.lastX - d.startX) / d.zoom;
          const dy = (d.lastY - d.startY) / d.zoom;

          d.nodeMargins.filter((e) => e.id && nodes[e.id]).forEach((entry) => {
            const { id } = entry;

            if (entry.needsAbsolute && entry.parentId && nodes[entry.parentId]) {
              actionsRef.current.setProp(entry.parentId, (parentProps: Record<string, unknown>) => {
                const parentPosition = String(parentProps.position ?? "static");
                if (!parentPosition || parentPosition === "static") {
                  parentProps.position = "relative";
                }
              });
            }

            actionsRef.current.setProp(id, (props: Record<string, unknown>) => {
              if (entry.needsAbsolute) {
                props.position = "absolute";
                if (props.right == null) props.right = "auto";
                if (props.bottom == null) props.bottom = "auto";
              }
              applyBoundedMove(entry, dx, dy, props);
            });
          });
        }

        const validMovedIds = ids.filter((id) => !!queryRef.current?.getState()?.nodes?.[id]);
        if (validMovedIds.length > 1) {
          try {
            actionsRef.current.selectNode(validMovedIds);
          } catch {
            // ignore
          }
        }
      }

      // Always reset cursor, selection, and drag styles on mouseup
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      delete document.body.dataset[EDITOR_DRAGGING_FLAG];
      delete document.body.dataset[EDITOR_DROP_COMMIT_FLAG];
      delete document.body.dataset[MULTI_DRAG_LOCK_FLAG];
      clearDragPreview(draggedDomsRef.current);
      setDraggingStyle(draggedDomsRef.current, false);
      draggedDomsRef.current = [];
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
      delete document.body.dataset[MULTI_DRAG_LOCK_FLAG];
      document.body.style.cursor = "";
      document.body.style.userSelect = "";

      document.removeEventListener("mousedown", handleMouseDown, true);
      document.removeEventListener("mousemove", handleMouseMove, true);
      document.removeEventListener("mouseup", handleMouseUp, true);
      window.removeEventListener("mouseup", handleMouseUp, true);
      window.removeEventListener("blur", handleMouseUp, true);
    };
  }, [activeTool]);

  // Separate blocker effect: when hand tool is active, stop all dragstart and
  // node-targeted mousedown events from bubbling to Craft.js' internal handlers.
  useEffect(() => {
    if (activeTool !== "hand") return;

    const blockDrag = (e: Event) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      // Block if inside canvas (not in a panel)
      if (target.closest("[data-panel]")) return;
      if (target.closest("[data-canvas-container]") || target.closest("[data-node-id]")) {
        e.stopPropagation();
        if (e.type === "dragstart") e.preventDefault();
      }
    };

    document.addEventListener("dragstart", blockDrag, true);
    return () => {
      document.removeEventListener("dragstart", blockDrag, true);
    };
  }, [activeTool]);

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
