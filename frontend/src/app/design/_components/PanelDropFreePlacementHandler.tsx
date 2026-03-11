"use client";

import { useEffect, useRef } from "react";
import { useEditor } from "@craftjs/core";

type Point = { x: number; y: number };
type MoveMode = "margin" | "offset" | "page-canvas";

const MOVE_THRESHOLD_PX = 6;
const MAX_RETRY_FRAMES = 20;
const MAX_COLUMNS_PER_ROW = 5;
const FLOW_LAYOUT_TYPES = new Set(["Row", "Section", "Container", "Viewport"]);
const HORIZONTAL_COLUMN_PARENTS = new Set(["Row", "Section", "Container", "Column"]);
const DROP_TARGET_CANVAS_TYPES = new Set(["Page", "Viewport", "Section", "Container", "Row", "Column", "Frame"]);

function isPanelSource(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null;
  if (!el) return false;
  const source = el.closest("[data-drag-source='asset'], [data-drag-source='component'], [data-drag-source='imported']") as HTMLElement | null;
  if (!source) return false;
  if (source.closest("[data-component-new-page='true']")) return false;
  return source.getAttribute("data-component-new-page") !== "true";
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function parsePxOrNumber(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = parseFloat(value.replace("px", "").trim());
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

function getMoveMode(displayName: string | undefined): MoveMode {
  if (displayName === "Page") return "page-canvas";
  const offsetMoveTypes = new Set(["Image", "Text", "Icon", "Button", "Circle", "Square", "Triangle"]);
  if (displayName && offsetMoveTypes.has(displayName)) return "offset";
  return "margin";
}

export function PanelDropFreePlacementHandler() {
  const { actions, query } = useEditor();

  const activeRef = useRef(false);
  const movedRef = useRef(false);
  const startRef = useRef<Point>({ x: 0, y: 0 });
  const pointerRef = useRef<Point>({ x: 0, y: 0 });
  const preDropNodeIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const reset = () => {
      activeRef.current = false;
      movedRef.current = false;
      preDropNodeIdsRef.current.clear();
    };

    const begin = (point: Point) => {
      const state = query.getState();
      preDropNodeIdsRef.current = new Set(Object.keys(state?.nodes ?? {}));
      startRef.current = point;
      pointerRef.current = point;
      movedRef.current = false;
      activeRef.current = true;
    };

    const trackMove = (point: Point) => {
      if (!activeRef.current) return;
      pointerRef.current = point;
      const dx = point.x - startRef.current.x;
      const dy = point.y - startRef.current.y;
      if ((dx * dx + dy * dy) >= MOVE_THRESHOLD_PX * MOVE_THRESHOLD_PX) {
        movedRef.current = true;
      }
    };

    const placeNewNodesAtPointer = (attempt = 0) => {
      if (!activeRef.current) return;
      const state = query.getState();
      const nodes = (state?.nodes ?? {}) as Record<string, { data?: { parent?: string; displayName?: string } }>;
      const currentIds = Object.keys(nodes);
      const preDrop = preDropNodeIdsRef.current;
      const newIds = currentIds.filter((id) => !preDrop.has(id));

      if (newIds.length === 0) {
        if (attempt < MAX_RETRY_FRAMES) {
          requestAnimationFrame(() => placeNewNodesAtPointer(attempt + 1));
        } else {
          reset();
        }
        return;
      }

      const newSet = new Set(newIds);
      const rootNewIds = newIds.filter((id) => {
        const parentId = nodes[id]?.data?.parent;
        return !parentId || !newSet.has(parentId);
      });

      let forcedDropTargetId: string | null = null;
      try {
        const elems = document.elementsFromPoint(pointerRef.current.x, pointerRef.current.y) as HTMLElement[];
        for (const el of elems) {
          const withNode = el.closest("[data-node-id]") as HTMLElement | null;
          if (!withNode) continue;
          const id = withNode.getAttribute("data-node-id");
          if (!id || newSet.has(id)) continue;
          const node = (query.getState()?.nodes ?? {})[id] as { data?: { isCanvas?: boolean; displayName?: string } } | undefined;
          const displayName = node?.data?.displayName;
          const isCanvas = node?.data?.isCanvas === true;
          if (isCanvas || (displayName && DROP_TARGET_CANVAS_TYPES.has(displayName))) {
            forcedDropTargetId = id;
            break;
          }
        }
      } catch {
        forcedDropTargetId = null;
      }

      if (forcedDropTargetId) {
        const latestState = query.getState();
        const latestNodes = (latestState?.nodes ?? {}) as Record<string, { data?: { parent?: string; nodes?: string[] } }>;
        const insertAt = ((latestNodes[forcedDropTargetId]?.data?.nodes as string[] | undefined) ?? []).length;
        rootNewIds.forEach((id, idx) => {
          const currentParent = latestNodes[id]?.data?.parent;
          if (!currentParent || currentParent === forcedDropTargetId) return;
          try {
            actions.move(id, forcedDropTargetId as string, insertAt + idx);
          } catch {
            // ignore move failures and continue with best-effort placement
          }
        });
      }

      for (const nodeId of rootNewIds) {
        try {
          const latest = query.getState();
          const latestNodes = (latest?.nodes ?? {}) as Record<string, { data?: { parent?: string; displayName?: string; nodes?: string[] } }>;
          const parentId = latestNodes[nodeId]?.data?.parent;
          if (!parentId) continue;

          const parentDom = query.node(parentId).get()?.dom ?? null;
          const nodeDom = query.node(nodeId).get()?.dom ?? null;
          if (!parentDom || !nodeDom) continue;

          const parentRect = parentDom.getBoundingClientRect();
          const nodeRect = nodeDom.getBoundingClientRect();

          const rawLeft = pointerRef.current.x - parentRect.left - nodeRect.width / 2;
          const rawTop = pointerRef.current.y - parentRect.top - nodeRect.height / 2;

          const maxLeft = Math.max(0, parentRect.width - nodeRect.width);
          const maxTop = Math.max(0, parentRect.height - nodeRect.height);
          const finalLeft = Math.round(clamp(rawLeft, 0, maxLeft));
          const finalTop = Math.round(clamp(rawTop, 0, maxTop));

          const displayName = latestNodes[nodeId]?.data?.displayName;
          const parentDisplayName = latestNodes[parentId]?.data?.displayName;
          const shouldImageFillParent =
            displayName === "Image" && parentDisplayName === "Section";
          if (displayName === "Column") {
            if (parentDisplayName && HORIZONTAL_COLUMN_PARENTS.has(parentDisplayName)) {
              actions.setProp(parentId, (props: Record<string, unknown>) => {
                props.flexDirection = "row";
                props.flexWrap = "wrap";
                props.alignItems = "stretch";
                props.justifyContent = "flex-start";
              });
            }

            const siblingIds = latestNodes[parentId]?.data?.nodes ?? [];
            const columnIds = siblingIds.filter((id) => latestNodes[id]?.data?.displayName === "Column");

            if (columnIds.length > MAX_COLUMNS_PER_ROW) {
              actions.delete(nodeId);
              continue;
            }

            for (const columnId of columnIds) {
              actions.setProp(columnId, (props: Record<string, unknown>) => {
                props.position = "relative";
                props.top = "0px";
                props.left = "0px";
                props.right = "auto";
                props.bottom = "auto";
                props.marginTop = 0;
                props.marginLeft = 0;
              });
            }

            continue;
          }

          if (displayName && FLOW_LAYOUT_TYPES.has(displayName)) {
            continue;
          }

          const moveMode = getMoveMode(displayName);
          if (moveMode === "page-canvas") {
            actions.setProp(nodeId, (props: Record<string, unknown>) => {
              props.canvasX = finalLeft;
              props.canvasY = finalTop;
            });
          } else if (moveMode === "offset") {
            actions.setProp(nodeId, (props: Record<string, unknown>) => {
              const currentLeft = parsePxOrNumber(props.left);
              const currentTop = parsePxOrNumber(props.top);
              const nextLeft = Math.round(currentLeft + (finalLeft - (nodeRect.left - parentRect.left)));
              const nextTop = Math.round(currentTop + (finalTop - (nodeRect.top - parentRect.top)));

              props.position = props.position && props.position !== "static" ? props.position : "relative";
              props.left = `${nextLeft}px`;
              props.top = `${nextTop}px`;
              props.right = "auto";
              props.bottom = "auto";
              props.marginTop = 0;
              props.marginLeft = 0;

              if (shouldImageFillParent) {
                props.width = "100%";
                props.height = "100%";
                props.maxWidth = "100%";
                props.maxHeight = "100%";
                props.minWidth = 0;
                props.minHeight = 0;
                if (!props.objectFit) props.objectFit = "cover";
              }
            });
          } else {
            actions.setProp(nodeId, (props: Record<string, unknown>) => {
              const currentML = parsePxOrNumber(props.marginLeft);
              const currentMT = parsePxOrNumber(props.marginTop);
              const rawNextML = Math.round(currentML + (finalLeft - (nodeRect.left - parentRect.left)));
              const rawNextMT = Math.round(currentMT + (finalTop - (nodeRect.top - parentRect.top)));

              const nextML = parentDisplayName === "Section" ? Math.max(0, rawNextML) : rawNextML;
              const nextMT = parentDisplayName === "Section" ? Math.max(0, rawNextMT) : rawNextMT;

              props.marginLeft = nextML;
              props.marginTop = nextMT;

              if (shouldImageFillParent) {
                props.width = "100%";
                props.height = "100%";
                props.maxWidth = "100%";
                props.maxHeight = "100%";
                props.minWidth = 0;
                props.minHeight = 0;
                if (!props.objectFit) props.objectFit = "cover";
              }
            });
          }
        } catch {
          // ignore individual placement failures
        }
      }

      const selectableNewIds = rootNewIds.filter((id) => !!query.getState()?.nodes?.[id]);
      if (selectableNewIds.length > 0) {
        try {
          actions.selectNode(selectableNewIds.length === 1 ? selectableNewIds[0] : selectableNewIds);
        } catch {
          // ignore selection failures
        }
      }

      reset();
    };

    const handleMouseDown = (event: MouseEvent) => {
      if (!isPanelSource(event.target)) return;
      begin({ x: event.clientX, y: event.clientY });
    };

    const handleDragStart = (event: DragEvent) => {
      if (!isPanelSource(event.target)) return;
      begin({ x: event.clientX, y: event.clientY });
    };

    const handleMouseMove = (event: MouseEvent) => {
      trackMove({ x: event.clientX, y: event.clientY });
    };

    const handleDragOver = (event: DragEvent) => {
      trackMove({ x: event.clientX, y: event.clientY });
    };

    const handleDrop = (event: DragEvent) => {
      if (!activeRef.current) return;
      trackMove({ x: event.clientX, y: event.clientY });
      if (!movedRef.current) {
        reset();
        return;
      }
      requestAnimationFrame(() => placeNewNodesAtPointer());
    };

    const handleDragEnd = () => {
      if (!activeRef.current) return;
      if (!movedRef.current) {
        reset();
        return;
      }
      requestAnimationFrame(() => placeNewNodesAtPointer());
    };

    const handleBlur = () => reset();

    document.addEventListener("mousedown", handleMouseDown, true);
    document.addEventListener("dragstart", handleDragStart, true);
    document.addEventListener("mousemove", handleMouseMove, true);
    document.addEventListener("dragover", handleDragOver, true);
    document.addEventListener("drop", handleDrop, true);
    document.addEventListener("dragend", handleDragEnd, true);
    window.addEventListener("blur", handleBlur);

    return () => {
      document.removeEventListener("mousedown", handleMouseDown, true);
      document.removeEventListener("dragstart", handleDragStart, true);
      document.removeEventListener("mousemove", handleMouseMove, true);
      document.removeEventListener("dragover", handleDragOver, true);
      document.removeEventListener("drop", handleDrop, true);
      document.removeEventListener("dragend", handleDragEnd, true);
      window.removeEventListener("blur", handleBlur);
      reset();
    };
  }, [actions, query]);

  return null;
}

export default PanelDropFreePlacementHandler;
