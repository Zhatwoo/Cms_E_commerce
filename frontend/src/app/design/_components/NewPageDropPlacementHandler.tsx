"use client";

import { useEffect, useRef } from "react";
import { useEditor } from "@craftjs/core";

type DropPoint = {
  clientX: number;
  clientY: number;
  ts: number;
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

export const NewPageDropPlacementHandler = () => {
  const { actions, query } = useEditor();
  const armedDragRef = useRef(false);
  const preDropPageIdsRef = useRef<Set<string>>(new Set());
  const lastDropPointRef = useRef<DropPoint | null>(null);
  const lastPointerRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const placeDroppedPage = () => {
    const drop = lastDropPointRef.current;
    if (!drop || Date.now() - drop.ts > 2000) {
      lastDropPointRef.current = null;
      return;
    }

    const state = query.getState();
    const nodes = state.nodes ?? {};
    const root = nodes.ROOT;
    let viewportId = root?.data?.nodes?.[0] as string | undefined;

    if (!viewportId || nodes[viewportId]?.data?.displayName !== "Viewport") {
      viewportId = Object.keys(nodes).find((id) => nodes[id]?.data?.displayName === "Viewport");
    }

    if (!viewportId) return;

    const viewportChildren = Array.isArray(nodes[viewportId]?.data?.nodes)
      ? (nodes[viewportId].data.nodes as string[])
      : [];

    const currentPageIds = viewportChildren.filter((id) => nodes[id]?.data?.displayName === "Page");
    const preDrop = preDropPageIdsRef.current;
    const newPageIds = currentPageIds.filter((id) => !preDrop.has(id));
    if (newPageIds.length === 0) return;

    const desktopRoot = document.querySelector("[data-viewport-desktop]") as HTMLElement | null;
    if (!desktopRoot) return;

    const rect = desktopRoot.getBoundingClientRect();
    const zoom = getEffectiveZoom(desktopRoot);

    newPageIds.forEach((pageId, index) => {
      const canvasX = Math.max(0, Math.round((drop.clientX - rect.left) / zoom + index * 36));
      const canvasY = Math.max(0, Math.round((drop.clientY - rect.top) / zoom + index * 36));

      actions.setProp(pageId, (props: Record<string, unknown>) => {
        props.canvasX = canvasX;
        props.canvasY = canvasY;
      });
    });

    lastDropPointRef.current = null;
    preDropPageIdsRef.current = new Set(currentPageIds);
  };

  const schedulePlacementRetry = () => {
    let attempts = 0;
    const maxAttempts = 20;

    const tick = () => {
      attempts += 1;
      const before = lastDropPointRef.current;
      placeDroppedPage();
      const after = lastDropPointRef.current;

      const done = before !== null && after === null;
      if (done || attempts >= maxAttempts) return;

      requestAnimationFrame(tick);
    };

    requestAnimationFrame(tick);
  };

  useEffect(() => {
    const handleMouseDown = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      lastPointerRef.current = { x: e.clientX, y: e.clientY };
      const isNewPageDragStart = !!target.closest("[data-component-new-page='true']");
      armedDragRef.current = isNewPageDragStart;

      if (!isNewPageDragStart) return;

      const state = query.getState();
      const nodes = state.nodes ?? {};
      const root = nodes.ROOT;
      let viewportId = root?.data?.nodes?.[0] as string | undefined;
      if (!viewportId || nodes[viewportId]?.data?.displayName !== "Viewport") {
        viewportId = Object.keys(nodes).find((id) => nodes[id]?.data?.displayName === "Viewport");
      }
      const viewportChildren = (viewportId && Array.isArray(nodes[viewportId]?.data?.nodes))
        ? (nodes[viewportId].data.nodes as string[])
        : [];
      const pageIds = viewportChildren.filter((id) => nodes[id]?.data?.displayName === "Page");
      preDropPageIdsRef.current = new Set(pageIds);
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!armedDragRef.current) return;
      lastPointerRef.current = { x: e.clientX, y: e.clientY };
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (armedDragRef.current) {
        const pointer = {
          x: e.clientX || lastPointerRef.current.x,
          y: e.clientY || lastPointerRef.current.y,
        };
        const canvasContainer = document.querySelector("[data-canvas-container]") as HTMLElement | null;
        const rect = canvasContainer?.getBoundingClientRect();
        const droppedOnCanvas = !!rect &&
          pointer.x >= rect.left &&
          pointer.x <= rect.right &&
          pointer.y >= rect.top &&
          pointer.y <= rect.bottom;

        if (!droppedOnCanvas) {
          armedDragRef.current = false;
          return;
        }

        lastDropPointRef.current = {
          clientX: pointer.x,
          clientY: pointer.y,
          ts: Date.now(),
        };

        placeDroppedPage();
        schedulePlacementRetry();
      }
      armedDragRef.current = false;
    };

    document.addEventListener("mousedown", handleMouseDown, true);
    document.addEventListener("mousemove", handleMouseMove, true);
    document.addEventListener("mouseup", handleMouseUp, true);
    return () => {
      document.removeEventListener("mousedown", handleMouseDown, true);
      document.removeEventListener("mousemove", handleMouseMove, true);
      document.removeEventListener("mouseup", handleMouseUp, true);
    };
  }, [query]);

  return null;
};
