"use client";

import { useEffect, useRef } from "react";
import { useEditor } from "@craftjs/core";

type NodeShape = {
  data?: {
    parent?: string;
    isCanvas?: boolean;
    displayName?: string;
    props?: Record<string, unknown>;
  };
};

type DropPoint = {
  clientX: number;
  clientY: number;
};

const MAX_RETRY_FRAMES = 24;
const LAYOUT_LIKE_TYPES = new Set(["Page", "Viewport", "Section", "Container", "Row", "Column", "Frame"]);
const SNAP_THRESHOLD = 16;
const GRID_SIZE = 8;

function selectedToIds(raw: unknown): string[] {
  if (Array.isArray(raw)) return raw;
  if (raw instanceof Set) return Array.from(raw);
  if (raw && typeof raw === "object") return Object.keys(raw as Record<string, unknown>);
  return [];
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

function isSupportedSource(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null;
  if (!el) return false;

  const source = el.closest("[data-drag-source='component'], [data-drag-source='asset']") as HTMLElement | null;
  if (!source) return false;

  if (source.getAttribute("data-component-new-page") === "true") return false;
  return true;
}

function snapToGrid(value: number): number {
  return Math.round(value / GRID_SIZE) * GRID_SIZE;
}

export function FreeDropPlacementHandler() {
  const { actions, query } = useEditor();
  const preDragNodeIdsRef = useRef<Set<string>>(new Set());
  const isTrackingRef = useRef(false);
  const dropPointRef = useRef<DropPoint | null>(null);

  useEffect(() => {
    const beginTracking = () => {
      const nodes = (query.getState()?.nodes ?? {}) as Record<string, NodeShape>;
      preDragNodeIdsRef.current = new Set(Object.keys(nodes));
      dropPointRef.current = null;
      isTrackingRef.current = true;
    };

    const stopTracking = () => {
      preDragNodeIdsRef.current.clear();
      dropPointRef.current = null;
      isTrackingRef.current = false;
    };

    const enforcePlacement = (attempt = 0) => {
      if (!isTrackingRef.current) return;

      const state = query.getState();
      const nodes = (state?.nodes ?? {}) as Record<string, NodeShape>;
      const preIds = preDragNodeIdsRef.current;
      const newIds = Object.keys(nodes).filter((id) => !preIds.has(id));

      if (newIds.length === 0) {
        if (attempt < MAX_RETRY_FRAMES) {
          requestAnimationFrame(() => enforcePlacement(attempt + 1));
          return;
        }
        stopTracking();
        return;
      }

      const newIdSet = new Set(newIds);
      const rootNewIds = newIds.filter((id) => {
        const parentId = nodes[id]?.data?.parent;
        if (!parentId || parentId === "ROOT") return false;
        return !newIdSet.has(parentId);
      });

      const idsToPlace = rootNewIds.length > 0
        ? rootNewIds
        : selectedToIds(state?.events?.selected).filter((id) => {
            const parentId = nodes[id]?.data?.parent;
            if (!parentId || parentId === "ROOT") return false;
            return !newIdSet.has(parentId);
          });

      if (idsToPlace.length === 0) {
        stopTracking();
        return;
      }

      const dropPoint = dropPointRef.current;

      idsToPlace.forEach((nodeId) => {
        const parentId = nodes[nodeId]?.data?.parent;
        if (!parentId || parentId === "ROOT") return;

        const displayName = nodes[nodeId]?.data?.displayName ?? "";
        const isLayoutLike = LAYOUT_LIKE_TYPES.has(displayName);

        let left = 0;
        let top = 0;
        let parentLogicalWidth = 0;
        let parentLogicalHeight = 0;
        let nodeLogicalWidth = 0;
        let nodeLogicalHeight = 0;

        try {
          const parentDom = query.node(parentId).get()?.dom ?? null;
          if (dropPoint && parentDom) {
            const rect = parentDom.getBoundingClientRect();
            const { scaleX, scaleY } = getRenderedScale(parentDom);
            parentLogicalWidth = parentDom.clientWidth || parentDom.offsetWidth || 0;
            parentLogicalHeight = parentDom.clientHeight || parentDom.offsetHeight || 0;
            left = Math.max(0, Math.round((dropPoint.clientX - rect.left) / scaleX));
            top = Math.max(0, Math.round((dropPoint.clientY - rect.top) / scaleY));
          }
        } catch {
          // keep defaults
        }

        try {
          const nodeDom = query.node(nodeId).get()?.dom ?? null;
          nodeLogicalWidth = nodeDom?.clientWidth || nodeDom?.offsetWidth || 0;
          nodeLogicalHeight = nodeDom?.clientHeight || nodeDom?.offsetHeight || 0;
        } catch {
          // ignore
        }

        const siblingSnapX: number[] = [0];
        const siblingSnapY: number[] = [0];

        if (parentLogicalWidth > 0 && nodeLogicalWidth > 0) {
          siblingSnapX.push(Math.max(0, parentLogicalWidth - nodeLogicalWidth));
        }
        if (parentLogicalHeight > 0 && nodeLogicalHeight > 0) {
          siblingSnapY.push(Math.max(0, parentLogicalHeight - nodeLogicalHeight));
        }

        const siblingIds = Object.keys(nodes).filter((id) => id !== nodeId && nodes[id]?.data?.parent === parentId);
        siblingIds.forEach((id) => {
          try {
            const siblingDom = query.node(id).get()?.dom ?? null;
            const parentDom = query.node(parentId).get()?.dom ?? null;
            if (!siblingDom || !parentDom) return;
            const siblingRect = siblingDom.getBoundingClientRect();
            const parentRect = parentDom.getBoundingClientRect();
            const { scaleX, scaleY } = getRenderedScale(parentDom);

            const siblingLeft = (siblingRect.left - parentRect.left) / scaleX;
            const siblingTop = (siblingRect.top - parentRect.top) / scaleY;
            const siblingWidth = siblingDom.clientWidth || siblingDom.offsetWidth || 0;
            const siblingHeight = siblingDom.clientHeight || siblingDom.offsetHeight || 0;
            const siblingRight = siblingLeft + siblingWidth;
            const siblingBottom = siblingTop + siblingHeight;

            siblingSnapX.push(Math.round(siblingLeft));
            siblingSnapX.push(Math.round(siblingRight));
            siblingSnapY.push(Math.round(siblingTop));
            siblingSnapY.push(Math.round(siblingBottom));
          } catch {
            // ignore sibling that cannot be measured
          }
        });

        let snappedLeft = left;
        let snappedTop = top;

        let bestXDistance = SNAP_THRESHOLD + 1;
        for (const candidate of siblingSnapX) {
          const distance = Math.abs(candidate - left);
          if (distance < bestXDistance) {
            bestXDistance = distance;
            snappedLeft = candidate;
          }
        }
        if (bestXDistance > SNAP_THRESHOLD) {
          snappedLeft = snapToGrid(left);
        }

        let bestYDistance = SNAP_THRESHOLD + 1;
        for (const candidate of siblingSnapY) {
          const distance = Math.abs(candidate - top);
          if (distance < bestYDistance) {
            bestYDistance = distance;
            snappedTop = candidate;
          }
        }
        if (bestYDistance > SNAP_THRESHOLD) {
          snappedTop = snapToGrid(top);
        }

        left = Math.max(0, snappedLeft);
        top = Math.max(0, snappedTop);

        actions.setProp(parentId, (parentProps: Record<string, unknown>) => {
          const position = String(parentProps.position ?? "static");
          if (!position || position === "static") {
            parentProps.position = "relative";
          }
        });

        actions.setProp(nodeId, (props: Record<string, unknown>) => {
          if (isLayoutLike) {
            props.position = "relative";
            props.left = "auto";
            props.top = "auto";
            props.right = "auto";
            props.bottom = "auto";
          } else {
            props.position = "absolute";
            props.left = `${left}px`;
            props.top = `${top}px`;
          }
          props.marginTop = 0;
          props.marginLeft = 0;

          if (isLayoutLike) {
            const rawWidth = props.width;
            if (typeof rawWidth === "number") {
              if (parentLogicalWidth > 0 && rawWidth > parentLogicalWidth) {
                props.width = "100%";
              }
            } else if (typeof rawWidth === "string") {
              const normalized = rawWidth.trim().toLowerCase();
              if (normalized.endsWith("px")) {
                const widthNum = Number(normalized.slice(0, -2));
                if (Number.isFinite(widthNum) && parentLogicalWidth > 0 && widthNum > parentLogicalWidth) {
                  props.width = "100%";
                }
              }
            } else if (rawWidth == null) {
              props.width = "100%";
            }
          }

          if (!isLayoutLike) {
            if (props.right == null) props.right = "auto";
            if (props.bottom == null) props.bottom = "auto";
          }
        });
      });

      stopTracking();
    };

    const handleDragStart = (event: DragEvent) => {
      if (!isSupportedSource(event.target)) return;
      beginTracking();
    };

    const handleMouseDown = (event: MouseEvent) => {
      if (!isSupportedSource(event.target)) return;
      beginTracking();
    };

    const handleDrop = (event: DragEvent) => {
      if (!isTrackingRef.current) return;
      dropPointRef.current = {
        clientX: event.clientX,
        clientY: event.clientY,
      };
      requestAnimationFrame(() => enforcePlacement(0));
      setTimeout(() => enforcePlacement(0), 80);
      setTimeout(() => enforcePlacement(0), 180);
      setTimeout(() => enforcePlacement(0), 320);
    };

    const handleDragEnd = () => {
      if (!isTrackingRef.current) return;
      setTimeout(() => enforcePlacement(0), 0);
      setTimeout(() => enforcePlacement(0), 120);
    };

    document.addEventListener("dragstart", handleDragStart, true);
    document.addEventListener("mousedown", handleMouseDown, true);
    document.addEventListener("drop", handleDrop, true);
    document.addEventListener("dragend", handleDragEnd, true);

    return () => {
      document.removeEventListener("dragstart", handleDragStart, true);
      document.removeEventListener("mousedown", handleMouseDown, true);
      document.removeEventListener("drop", handleDrop, true);
      document.removeEventListener("dragend", handleDragEnd, true);
      stopTracking();
    };
  }, [actions, query]);

  return null;
}
