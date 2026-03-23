"use client";

import { useEffect, useRef } from "react";
import { useEditor } from "@craftjs/core";

type Point = { x: number; y: number };
type MoveMode = "absolute" | "page-canvas";

const MOVE_THRESHOLD_PX = 6;
const MAX_RETRY_FRAMES = 20;
const MAX_COLUMNS_PER_ROW = 5;
const FLOW_LAYOUT_TYPES = new Set(["Row", "Section", "Container", "Viewport", "Tab Content", "TabContent"]);
const FLOW_PARENT_DISPLAY_NAMES = new Set(["Section", "Container", "Row", "Column", "Frame", "Tab Content", "TabContent"]);
const FREEFORM_PARENT_DISPLAY_NAMES = new Set(["Page", "Viewport"]);
const HORIZONTAL_COLUMN_PARENTS = new Set(["Row", "Section", "Container", "Column", "Tab Content", "TabContent"]);
const DROP_TARGET_CANVAS_TYPES = new Set(["Page", "Viewport", "Section", "Container", "Row", "Column", "Frame", "Tab Content", "TabContent"]);
const BLOCKED_DROP_TYPES = new Set(["Accordion"]);

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

function getRenderedScale(el: HTMLElement | null): { scaleX: number; scaleY: number } {
  if (!el) return { scaleX: 1, scaleY: 1 };

  const rect = el.getBoundingClientRect();
  const baseWidth = el.offsetWidth || el.clientWidth || 0;
  const baseHeight = el.offsetHeight || el.clientHeight || 0;

  const scaleX = baseWidth > 0 ? rect.width / baseWidth : 1;
  const scaleY = baseHeight > 0 ? rect.height / baseHeight : 1;

  return {
    scaleX: Number.isFinite(scaleX) && scaleX > 0.01 ? scaleX : 1,
    scaleY: Number.isFinite(scaleY) && scaleY > 0.01 ? scaleY : 1,
  };
}

function getMoveMode(displayName: string | undefined): MoveMode {
  if (displayName === "Page") return "page-canvas";
  return "absolute";
}

function isBlockedDropPoint(point: Point, newSet: Set<string>, query: ReturnType<typeof useEditor>["query"]): boolean {
  try {
    const elems = document.elementsFromPoint(point.x, point.y) as HTMLElement[];
    for (const el of elems) {
      const explicitBlocker = el.closest("[data-drop-block='true']") as HTMLElement | null;
      if (explicitBlocker) {
        const blockerNodeId = explicitBlocker.getAttribute("data-node-id");
        if (!blockerNodeId || !newSet.has(blockerNodeId)) return true;
      }

      const withNode = el.closest("[data-node-id]") as HTMLElement | null;
      if (!withNode) continue;
      const nodeId = withNode.getAttribute("data-node-id");
      if (!nodeId || newSet.has(nodeId)) continue;
      const node = (query.getState()?.nodes ?? {})[nodeId] as { data?: { displayName?: string } } | undefined;
      const displayName = node?.data?.displayName;
      if (displayName && BLOCKED_DROP_TYPES.has(displayName)) return true;
    }
  } catch {
    return false;
  }

  return false;
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

      if (isBlockedDropPoint(pointerRef.current, newSet, query)) {
        rootNewIds.forEach((id) => {
          try {
            actions.delete(id);
          } catch {
            // ignore best-effort cleanup
          }
        });
        reset();
        return;
      }

      let forcedDropTargetId: string | null = null;
      let fallbackPageId: string | null = null;
      try {
        const elems = document.elementsFromPoint(pointerRef.current.x, pointerRef.current.y) as HTMLElement[];
        const latestState = query.getState();
        const latestNodes = (latestState?.nodes ?? {}) as Record<string, { data?: { displayName?: string } }>;
        const resolveDisplayName = (id: string | null): string => {
          if (!id) return "";
          return String(latestNodes[id]?.data?.displayName ?? "");
        };
        const selectedRaw = latestState?.events?.selected;
        const selectedIds = Array.isArray(selectedRaw)
          ? selectedRaw
          : selectedRaw instanceof Set
            ? Array.from(selectedRaw)
            : selectedRaw && typeof selectedRaw === "object"
              ? Object.keys(selectedRaw)
              : [];

        for (const id of selectedIds) {
          const name = resolveDisplayName(typeof id === "string" ? id : null);
          if (name === "Page") {
            fallbackPageId = id as string;
            break;
          }
        }
        if (!fallbackPageId) {
          const pageId = Object.keys(latestNodes).find((id) => latestNodes[id]?.data?.displayName === "Page");
          if (pageId) fallbackPageId = pageId;
        }
        const findPageUnderCursor = () => {
          for (const el of elems) {
            const withNode = el.closest("[data-node-id]") as HTMLElement | null;
            if (!withNode) continue;
            const id = withNode.getAttribute("data-node-id");
            if (!id || newSet.has(id)) continue;
            if (resolveDisplayName(id) === "Page") return id;
          }
          return null;
        };

        const pageUnderCursor = findPageUnderCursor();
        if (pageUnderCursor) {
          forcedDropTargetId = pageUnderCursor;
        }

        for (const el of elems) {
          const withNode = el.closest("[data-node-id]") as HTMLElement | null;
          if (!withNode) continue;
          const id = withNode.getAttribute("data-node-id");
          if (!id || newSet.has(id)) continue;
          const node = (query.getState()?.nodes ?? {})[id] as { data?: { isCanvas?: boolean; displayName?: string } } | undefined;
          const displayName = node?.data?.displayName;
          const isCanvas = node?.data?.isCanvas === true;
          if (!forcedDropTargetId && (isCanvas || (displayName && DROP_TARGET_CANVAS_TYPES.has(displayName)) || displayName === "Tab Content" || displayName === "TabContent")) {
            forcedDropTargetId = id;
            break;
          }
        }
      } catch {
        forcedDropTargetId = null;
      }

      if (!forcedDropTargetId) {
        try {
          const latestState = query.getState();
          const latestNodes = (latestState?.nodes ?? {}) as Record<string, { data?: { parent?: string; isCanvas?: boolean; displayName?: string } }>;
          const selectedRaw = latestState?.events?.selected;
          const selectedIds = Array.isArray(selectedRaw)
            ? selectedRaw
            : selectedRaw instanceof Set
              ? Array.from(selectedRaw)
              : selectedRaw && typeof selectedRaw === "object"
                ? Object.keys(selectedRaw)
                : [];

          const resolveCanvasAncestor = (startId: string | null): string | null => {
            let current = startId;
            const visited = new Set<string>();
            while (current && !visited.has(current)) {
              visited.add(current);
              const node = latestNodes[current];
              if (!node) return null;
              const displayName = node.data?.displayName;
              const isCanvas = node.data?.isCanvas === true;
              if (isCanvas || (displayName && DROP_TARGET_CANVAS_TYPES.has(displayName))) {
                return current;
              }
              const parentId = node.data?.parent;
              current = typeof parentId === "string" ? parentId : null;
            }
            return null;
          };

          for (const id of selectedIds) {
            const target = resolveCanvasAncestor(typeof id === "string" ? id : null);
            if (target) {
              forcedDropTargetId = target;
              break;
            }
          }

          if (!forcedDropTargetId) {
            const pageId = Object.keys(latestNodes).find((id) => latestNodes[id]?.data?.displayName === "Page");
            if (pageId) forcedDropTargetId = pageId;
          }

          if (!forcedDropTargetId) {
            const viewportId = Object.keys(latestNodes).find((id) => latestNodes[id]?.data?.displayName === "Viewport");
            if (viewportId) forcedDropTargetId = viewportId;
          }
        } catch {
          forcedDropTargetId = null;
        }
      }

      if (forcedDropTargetId) {
        const latestState = query.getState();
        const latestNodes = (latestState?.nodes ?? {}) as Record<string, { data?: { parent?: string; nodes?: string[]; displayName?: string; props?: Record<string, unknown> } }>;
        const resolveChildIds = (targetId: string): string[] => {
          const node = latestNodes[targetId];
          const fromNodes = (node?.data?.nodes as string[] | undefined) ?? [];
          if (fromNodes.length > 0) return fromNodes;
          return Object.keys(latestNodes).filter((id) => latestNodes[id]?.data?.parent === targetId);
        };

        const computeFlowInsertIndex = (targetId: string, newSet: Set<string>): number | null => {
          try {
            const targetDom = query.node(targetId).get()?.dom ?? null;
            if (!targetDom) return null;
            const childIds = resolveChildIds(targetId).filter((id) => !newSet.has(id));
            if (childIds.length === 0) return 0;
            const style = window.getComputedStyle(targetDom);
            const isRow = (style.display ?? "").includes("flex") && String(style.flexDirection ?? "").startsWith("row");
            const cursor = isRow ? pointerRef.current.x : pointerRef.current.y;
            for (let i = 0; i < childIds.length; i++) {
              const childDom = query.node(childIds[i]).get()?.dom ?? null;
              if (!childDom) continue;
              const rect = childDom.getBoundingClientRect();
              const midpoint = isRow ? rect.left + rect.width / 2 : rect.top + rect.height / 2;
              if (cursor <= midpoint) return i;
            }
            return childIds.length;
          } catch {
            return null;
          }
        };

        const newRootDisplayNames = rootNewIds.map((id) => latestNodes[id]?.data?.displayName ?? "");
        const anyNewSection = newRootDisplayNames.some((name) => name === "Section");
        let resolvedTargetId = forcedDropTargetId;
        let preferredInsertIndex: number | null = null;

        if (anyNewSection) {
          const dropTargetName = latestNodes[forcedDropTargetId]?.data?.displayName ?? "";
          if (dropTargetName === "Section") {
            const parentId = latestNodes[forcedDropTargetId]?.data?.parent;
            if (parentId) {
              resolvedTargetId = parentId;
              const siblings = resolveChildIds(parentId).filter((id) => !newSet.has(id));
              const dropIndex = siblings.indexOf(forcedDropTargetId);
              if (dropIndex >= 0) {
                const dropDom = query.node(forcedDropTargetId).get()?.dom ?? null;
                if (dropDom) {
                  const rect = dropDom.getBoundingClientRect();
                  preferredInsertIndex = pointerRef.current.y < rect.top + rect.height / 2
                    ? dropIndex
                    : dropIndex + 1;
                } else {
                  preferredInsertIndex = dropIndex + 1;
                }
              }
            }
          }
        }

        rootNewIds.forEach((id, idx) => {
          const currentParent = latestNodes[id]?.data?.parent;
          if (!currentParent) return;
          const nodeName = (latestNodes as any)[id]?.data?.displayName as string | undefined;
          const targetName = (latestNodes as any)[resolvedTargetId]?.data?.displayName as string | undefined;
          const targetId =
            targetName === "Viewport" && nodeName !== "Page" && fallbackPageId
              ? fallbackPageId
              : resolvedTargetId;
          const targetNodes = (latestNodes[targetId]?.data?.nodes as string[] | undefined) ?? [];
          let insertAt = targetNodes.length;

          if (preferredInsertIndex != null && targetId === resolvedTargetId) {
            insertAt = preferredInsertIndex;
          } else {
            const targetDisplayName = latestNodes[targetId]?.data?.displayName ?? "";
            const targetProps = (latestNodes[targetId]?.data?.props ?? {}) as Record<string, unknown>;
            const targetDisplay = String(targetProps.display ?? "").toLowerCase();
            const isFlowTarget =
              targetDisplay === "flex" ||
              targetDisplay === "grid" ||
              FLOW_PARENT_DISPLAY_NAMES.has(targetDisplayName) ||
              targetDisplayName === "Page";
            const isLayoutRoot = FLOW_LAYOUT_TYPES.has(nodeName ?? "");
            if (isFlowTarget && isLayoutRoot) {
              const computed = computeFlowInsertIndex(targetId, newSet);
              if (computed != null) insertAt = computed;
            }
          }

          try {
            actions.move(id, targetId as string, insertAt + idx);
          } catch {
            // ignore move failures and continue with best-effort placement
          }
        });
      }

      for (const nodeId of rootNewIds) {
        try {
          const latest = query.getState();
          const latestNodes = (latest?.nodes ?? {}) as Record<string, { data?: { parent?: string; displayName?: string; nodes?: string[]; props?: Record<string, unknown> } }>;
          let parentId = latestNodes[nodeId]?.data?.parent;
          if (!parentId) continue;
          const nodeDisplayName = latestNodes[nodeId]?.data?.displayName;
          const parentDisplayName = latestNodes[parentId]?.data?.displayName;
          if (parentDisplayName === "Viewport" && nodeDisplayName !== "Page" && (fallbackPageId || forcedDropTargetId)) {
            const nextParent = fallbackPageId || forcedDropTargetId;
            if (nextParent) {
              try {
                const insertAt = ((latestNodes[nextParent]?.data?.nodes as string[] | undefined) ?? []).length;
                actions.move(nodeId, nextParent, insertAt);
                parentId = nextParent;
              } catch {
                // ignore
              }
            }
          }

          const parentDom = query.node(parentId).get()?.dom ?? null;
          const nodeDom = query.node(nodeId).get()?.dom ?? null;
          if (!parentDom || !nodeDom) continue;

          const parentRect = parentDom.getBoundingClientRect();
          const nodeRect = nodeDom.getBoundingClientRect();

          const { scaleX, scaleY } = getRenderedScale(parentDom);
          const parentLogicalWidth = parentDom.clientWidth || parentDom.offsetWidth || 0;
          const parentLogicalHeight = parentDom.clientHeight || parentDom.offsetHeight || 0;
          const nodeLogicalWidth = nodeRect.width / scaleX;
          const nodeLogicalHeight = nodeRect.height / scaleY;

          // Use the exact cursor drop point (top-left anchoring), not centered placement.
          const rawLeft = (pointerRef.current.x - parentRect.left) / scaleX;
          const rawTop = (pointerRef.current.y - parentRect.top) / scaleY;

          const maxLeft = Math.max(0, parentLogicalWidth - nodeLogicalWidth);
          const maxTop = Math.max(0, parentLogicalHeight - nodeLogicalHeight);
          const finalLeft = Math.round(clamp(rawLeft, 0, maxLeft));
          const finalTop = Math.round(clamp(rawTop, 0, maxTop));

          const displayName = latestNodes[nodeId]?.data?.displayName;
          const parentProps = (latestNodes[parentId]?.data?.props ?? {}) as Record<string, unknown>;
          const parentDisplay = String(parentProps.display ?? "").toLowerCase();
          const parentFreeformPref = parentProps.isFreeform;
          const parentIsFlexParent =
            parentDisplay === "flex" ||
            parentDisplay === "grid" ||
            (!!parentDisplayName && FLOW_PARENT_DISPLAY_NAMES.has(parentDisplayName));
          const parentIsFreeform =
            parentFreeformPref === true ||
            (!parentIsFlexParent && !!parentDisplayName && FREEFORM_PARENT_DISPLAY_NAMES.has(parentDisplayName));
          const forceFlowInFreeform =
            !!displayName &&
            FLOW_LAYOUT_TYPES.has(displayName) &&
            !!parentDisplayName &&
            FREEFORM_PARENT_DISPLAY_NAMES.has(parentDisplayName);
          const allowFreeformLayout = parentFreeformPref !== false;
          const forceFlowPlacement =
            parentDisplayName === "Tab Content" || parentDisplayName === "TabContent";
          const shouldImageFillParent =
            displayName === "Image" && (parentDisplayName === "Section" || parentDisplayName === "Tab Content" || parentDisplayName === "TabContent");
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

          if (displayName && FLOW_LAYOUT_TYPES.has(displayName) && !allowFreeformLayout) {
            continue;
          }

          const moveMode = getMoveMode(displayName);
          if (moveMode === "page-canvas") {
            actions.setProp(nodeId, (props: Record<string, unknown>) => {
              props.canvasX = finalLeft;
              props.canvasY = finalTop;
            });
          } else {
            actions.setProp(nodeId, (props: Record<string, unknown>) => {
              // Tab panels should keep normal flow; don't apply pixel offsets that can push nodes outside.
              if (forceFlowPlacement || !allowFreeformLayout || forceFlowInFreeform) {
                props.position = "relative";
                props.left = "auto";
                props.top = "auto";
                props.right = "auto";
                props.bottom = "auto";
                if (!forceFlowInFreeform) {
                  props.marginTop = 0;
                  props.marginLeft = 0;
                }

                if (shouldImageFillParent) {
                  props.width = "100%";
                  props.height = "100%";
                  props.maxWidth = "100%";
                  props.maxHeight = "100%";
                  props.minWidth = 0;
                  props.minHeight = 0;
                  if (!props.objectFit) props.objectFit = "cover";
                }
                return;
              }

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
