"use client";

import { useEffect, useRef } from "react";
import { useEditor } from "@craftjs/core";
import { filterLeafSelectionIds } from "../_lib/canvasActions";

type HeaderFooterCategory = "header" | "footer";

type NodeShape = {
  data?: {
    parent?: string;
    nodes?: string[];
    displayName?: string;
  };
};

const MAX_RETRY_FRAMES = 28;

function normalizeCategory(raw: string | null | undefined): HeaderFooterCategory | null {
  if (!raw) return null;
  const lower = raw.toLowerCase();
  if (lower === "header" || lower === "footer") return lower;
  return null;
}

function selectedToIds(raw: unknown): string[] {
  if (Array.isArray(raw)) return raw;
  if (raw instanceof Set) return Array.from(raw);
  if (raw && typeof raw === "object") return Object.keys(raw as Record<string, unknown>);
  return [];
}

function findAncestorByDisplayName(
  nodes: Record<string, NodeShape>,
  startId: string | undefined,
  targetDisplayName: string
): string | null {
  let current = startId;
  while (current && current !== "ROOT") {
    const display = nodes[current]?.data?.displayName;
    if (display === targetDisplayName) return current;
    current = nodes[current]?.data?.parent;
  }
  return null;
}

export function HeaderFooterDropPlacementHandler() {
  const { actions, query } = useEditor();
  const activeCategoryRef = useRef<HeaderFooterCategory | null>(null);
  const preDragNodeIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const beginTracking = (category: HeaderFooterCategory) => {
      activeCategoryRef.current = category;
      const nodes = (query.getState()?.nodes ?? {}) as Record<string, NodeShape>;
      preDragNodeIdsRef.current = new Set(Object.keys(nodes));
    };

    const resetTracking = () => {
      activeCategoryRef.current = null;
      preDragNodeIdsRef.current.clear();
    };

    const toElement = (target: EventTarget | null): Element | null => {
      if (target instanceof Element) return target;
      if (target instanceof Node) return target.parentElement;
      return null;
    };

    const resolveCategoryFromDragStart = (target: EventTarget | null): HeaderFooterCategory | null => {
      const el = toElement(target);
      const fromAttr = normalizeCategory(el?.closest("[data-asset-category]")?.getAttribute("data-asset-category"));
      if (fromAttr) return fromAttr;
      return normalizeCategory(document.body.dataset.assetDragCategory);
    };

    const resolveCategoryFromPointerDown = (target: EventTarget | null): HeaderFooterCategory | null => {
      const el = toElement(target);
      const source = el?.closest("[data-drag-source='asset'][data-asset-category]") as HTMLElement | null;
      if (!source) return null;
      return normalizeCategory(source.getAttribute("data-asset-category"));
    };

    const enforcePlacement = (category: HeaderFooterCategory, attempt = 0) => {
      const state = query.getState();
      const nodes = (state?.nodes ?? {}) as Record<string, NodeShape>;
      const preIds = preDragNodeIdsRef.current;
      const allIds = Object.keys(nodes);
      const newIds = allIds.filter((id) => !preIds.has(id));

      if (newIds.length === 0) {
        if (attempt < MAX_RETRY_FRAMES) {
          requestAnimationFrame(() => enforcePlacement(category, attempt + 1));
          return;
        }

        const selectedIds = filterLeafSelectionIds(selectedToIds(state?.events?.selected), nodes as any);
        const selectedRootIds = selectedIds.filter((id) => {
          const parentId = nodes[id]?.data?.parent;
          if (!parentId || parentId === "ROOT") return false;
          return !selectedIds.includes(parentId);
        });

        if (selectedRootIds.length === 0) {
          resetTracking();
          return;
        }

        const syntheticNewIds = selectedRootIds;
        syntheticNewIds.forEach((id) => {
          if (!preIds.has(id)) {
            // keep as genuinely new when possible
          }
        });

        // Continue through shared flow using selected roots as fallback candidates
        const rootsToMove = [...selectedRootIds];

        rootsToMove.forEach((nodeId) => {
          const initialParentId = nodes[nodeId]?.data?.parent;
          if (!initialParentId) return;

          let targetParentId = initialParentId;

          if (category === "footer") {
            const pageAncestorId = findAncestorByDisplayName(nodes, initialParentId, "Page");
            if (pageAncestorId && pageAncestorId !== initialParentId) {
              const latestBeforeMove = (query.getState()?.nodes ?? {}) as Record<string, NodeShape>;
              const pageChildren = Array.isArray(latestBeforeMove[pageAncestorId]?.data?.nodes)
                ? (latestBeforeMove[pageAncestorId]?.data?.nodes as string[])
                : [];
              const toPageIndex = pageChildren.length;
              try {
                actions.move(nodeId, pageAncestorId, toPageIndex);
                targetParentId = pageAncestorId;
              } catch {
                targetParentId = initialParentId;
              }
            }
          }

          const currentState = query.getState();
          const currentNodes = (currentState?.nodes ?? {}) as Record<string, NodeShape>;
          const siblings = Array.isArray(currentNodes[targetParentId]?.data?.nodes)
            ? (currentNodes[targetParentId]?.data?.nodes as string[])
            : [];

          if (siblings.length > 0) {
            const desiredIndex = category === "header" ? 0 : siblings.length - 1;
            if (siblings[desiredIndex] !== nodeId) {
              try {
                actions.move(nodeId, targetParentId, desiredIndex);
              } catch {
                // no-op
              }
            }
          }

          if (category === "footer") {
            const latestNodes = (query.getState()?.nodes ?? {}) as Record<string, NodeShape>;
            const latestParentId = latestNodes[nodeId]?.data?.parent;
            const parentDisplayName = latestParentId ? latestNodes[latestParentId]?.data?.displayName : undefined;
            if (parentDisplayName === "Page") {
              try {
                actions.setProp(nodeId, (props: Record<string, unknown>) => {
                  props.position = "absolute";
                  props.left = "0px";
                  props.right = "auto";
                  props.top = "auto";
                  props.bottom = "0px";
                  props.width = "100%";
                  props.marginTop = 0;
                  props.marginBottom = 0;
                });
              } catch {
                // ignore
              }
            }
          }
        });

        resetTracking();
        return;
      }

      const newIdSet = new Set(newIds);
      const newRootIds = newIds.filter((id) => {
        const parentId = nodes[id]?.data?.parent;
        if (!parentId || parentId === "ROOT") return false;
        return !newIdSet.has(parentId);
      });

      const rootsToMove = [...newRootIds];

      if (rootsToMove.length === 0) {
        const selectedIds = filterLeafSelectionIds(selectedToIds(state?.events?.selected), nodes as any);
        const selectedRootIds = selectedIds.filter((id) => {
          const parentId = nodes[id]?.data?.parent;
          if (!parentId || parentId === "ROOT") return false;
          return !selectedIds.includes(parentId);
        });
        rootsToMove.push(...selectedRootIds);
      }

      if (rootsToMove.length === 0) {
        resetTracking();
        return;
      }

      rootsToMove.forEach((nodeId) => {
        const initialParentId = nodes[nodeId]?.data?.parent;
        if (!initialParentId) return;

        let targetParentId = initialParentId;

        if (category === "footer") {
          const pageAncestorId = findAncestorByDisplayName(nodes, initialParentId, "Page");
          if (pageAncestorId && pageAncestorId !== initialParentId) {
            const latestBeforeMove = (query.getState()?.nodes ?? {}) as Record<string, NodeShape>;
            const pageChildren = Array.isArray(latestBeforeMove[pageAncestorId]?.data?.nodes)
              ? (latestBeforeMove[pageAncestorId]?.data?.nodes as string[])
              : [];
            const toPageIndex = pageChildren.length;
            try {
              actions.move(nodeId, pageAncestorId, toPageIndex);
              targetParentId = pageAncestorId;
            } catch {
              targetParentId = initialParentId;
            }
          }
        }

        const currentState = query.getState();
        const currentNodes = (currentState?.nodes ?? {}) as Record<string, NodeShape>;
        const siblings = Array.isArray(currentNodes[targetParentId]?.data?.nodes)
          ? (currentNodes[targetParentId]?.data?.nodes as string[])
          : [];

        if (siblings.length > 0) {
          const desiredIndex = category === "header" ? 0 : siblings.length - 1;
          if (siblings[desiredIndex] !== nodeId) {
            try {
              actions.move(nodeId, targetParentId, desiredIndex);
            } catch {
              // no-op: if Craft rejects move, keep default placement
            }
          }
        }

        if (category === "footer") {
          const latestNodes = (query.getState()?.nodes ?? {}) as Record<string, NodeShape>;
          const latestParentId = latestNodes[nodeId]?.data?.parent;
          const parentDisplayName = latestParentId ? latestNodes[latestParentId]?.data?.displayName : undefined;
          if (parentDisplayName === "Page") {
            try {
              actions.setProp(nodeId, (props: Record<string, unknown>) => {
                props.position = "absolute";
                props.left = "0px";
                props.right = "auto";
                props.top = "auto";
                props.bottom = "0px";
                props.width = "100%";
                props.marginTop = 0;
                props.marginBottom = 0;
              });
            } catch {
              // ignore if node type does not support these props
            }
          }
        }
      });

      resetTracking();
    };

    const handleDragStart = (event: DragEvent) => {
      const category = resolveCategoryFromDragStart(event.target);
      if (!category) return;
      beginTracking(category);
    };

    const handlePointerDown = (event: MouseEvent) => {
      const category = resolveCategoryFromPointerDown(event.target);
      if (!category) return;
      beginTracking(category);
    };

    const handleDrop = () => {
      const category = activeCategoryRef.current;
      if (!category) return;
      requestAnimationFrame(() => enforcePlacement(category));
      setTimeout(() => enforcePlacement(category), 80);
      setTimeout(() => enforcePlacement(category), 180);
      setTimeout(() => enforcePlacement(category), 320);
    };

    const handleDragEnd = () => {
      if (!activeCategoryRef.current) return;
      setTimeout(() => {
        const category = activeCategoryRef.current;
        if (!category) return;
        enforcePlacement(category);
        setTimeout(() => enforcePlacement(category), 120);
      }, 0);
    };

    document.addEventListener("dragstart", handleDragStart, true);
    document.addEventListener("mousedown", handlePointerDown, true);
    document.addEventListener("drop", handleDrop, true);
    document.addEventListener("dragend", handleDragEnd, true);

    return () => {
      document.removeEventListener("dragstart", handleDragStart, true);
      document.removeEventListener("mousedown", handlePointerDown, true);
      document.removeEventListener("drop", handleDrop, true);
      document.removeEventListener("dragend", handleDragEnd, true);
      resetTracking();
    };
  }, [actions, query]);

  return null;
}
