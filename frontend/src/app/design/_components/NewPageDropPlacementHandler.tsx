"use client";

import { useEffect, useRef } from "react";
import { useEditor } from "@craftjs/core";

type DropPoint = {
  clientX: number;
  clientY: number;
  ts: number;
};

function getCanvasScale(desktopRoot: HTMLElement | null): number {
  if (!desktopRoot) return 1;
  const rect = desktopRoot.getBoundingClientRect();
  const sx = desktopRoot.offsetWidth > 0 ? rect.width / desktopRoot.offsetWidth : 1;
  const sy = desktopRoot.offsetHeight > 0 ? rect.height / desktopRoot.offsetHeight : 1;
  const scale = Number.isFinite(sx) && Number.isFinite(sy) ? (sx + sy) / 2 : 1;
  return scale > 0.01 ? scale : 1;
}

function toPx(value: unknown, fallback: number): number {
  if (typeof value === "number" && Number.isFinite(value) && value > 0) return value;
  if (typeof value === "string") {
    const parsed = parseFloat(value.replace("px", "").trim());
    if (Number.isFinite(parsed) && parsed > 0) return parsed;
  }
  return fallback;
}

export const NewPageDropPlacementHandler = () => {
  const { actions, query } = useEditor();
  const armedDragRef = useRef(false);
  const preDropPageIdsRef = useRef<Set<string>>(new Set());
  const lastDropPointRef = useRef<DropPoint | null>(null);
  const lastPointerRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const previewElRef = useRef<HTMLDivElement | null>(null);

  const hidePreview = () => {
    const el = previewElRef.current;
    if (!el) return;
    el.style.display = "none";
  };

  const ensurePreview = () => {
    if (previewElRef.current) return previewElRef.current;
    const el = document.createElement("div");
    el.dataset.panel = "new-page-preview";
    el.style.position = "fixed";
    el.style.left = "0px";
    el.style.top = "0px";
    el.style.width = "0px";
    el.style.height = "0px";
    el.style.border = "2px solid #3b82f6";
    el.style.background = "rgba(59, 130, 246, 0.08)";
    el.style.pointerEvents = "none";
    el.style.zIndex = "10000";
    el.style.display = "none";
    document.body.appendChild(el);
    previewElRef.current = el;
    return el;
  };

  const getViewportAndPages = () => {
    const state = query.getState();
    const nodes = state.nodes ?? {};
    const root = nodes.ROOT;
    let viewportId = root?.data?.nodes?.[0] as string | undefined;
    if (!viewportId || nodes[viewportId]?.data?.displayName !== "Viewport") {
      viewportId = Object.keys(nodes).find((id) => nodes[id]?.data?.displayName === "Viewport");
    }
    if (!viewportId) return { nodes, viewportId: null as string | null, pageIds: [] as string[] };

    const viewportChildren = Array.isArray(nodes[viewportId]?.data?.nodes)
      ? (nodes[viewportId].data.nodes as string[])
      : [];
    const pageIds = viewportChildren.filter((id) => nodes[id]?.data?.displayName === "Page");
    return { nodes, viewportId, pageIds };
  };

  const getNewPageSize = () => {
    const { nodes, pageIds } = getViewportAndPages();
    const templatePage = pageIds[0] ? nodes[pageIds[0]] : null;
    const width = toPx(templatePage?.data?.props?.width, 1440);
    const height = toPx(templatePage?.data?.props?.height, 900);
    return { width, height };
  };

  const updatePreviewAt = (clientX: number, clientY: number) => {
    const preview = ensurePreview();
    const canvasContainer = document.querySelector("[data-canvas-container]") as HTMLElement | null;
    const desktopRoot = document.querySelector("[data-viewport-desktop]") as HTMLElement | null;
    if (!canvasContainer || !desktopRoot) {
      hidePreview();
      return;
    }

    const containerRect = canvasContainer.getBoundingClientRect();
    const insideCanvas =
      clientX >= containerRect.left &&
      clientX <= containerRect.right &&
      clientY >= containerRect.top &&
      clientY <= containerRect.bottom;

    if (!insideCanvas) {
      hidePreview();
      return;
    }

    const scale = getCanvasScale(desktopRoot);
    const pageSize = getNewPageSize();

    preview.style.display = "block";
    preview.style.left = `${clientX}px`;
    preview.style.top = `${clientY}px`;
    preview.style.width = `${Math.max(8, Math.round(pageSize.width * scale))}px`;
    preview.style.height = `${Math.max(8, Math.round(pageSize.height * scale))}px`;
  };

  const placeDroppedPage = () => {
    const drop = lastDropPointRef.current;
    if (!drop || Date.now() - drop.ts > 2000) {
      lastDropPointRef.current = null;
      return;
    }

    const { nodes, viewportId, pageIds: currentPageIds } = getViewportAndPages();
    if (!viewportId) return;
    const preDrop = preDropPageIdsRef.current;
    const newPageIds = currentPageIds.filter((id) => !preDrop.has(id));
    if (newPageIds.length === 0) return;

    const desktopRoot = document.querySelector("[data-viewport-desktop]") as HTMLElement | null;
    if (!desktopRoot) return;

    const rect = desktopRoot.getBoundingClientRect();
    const scale = getCanvasScale(desktopRoot);

    newPageIds.forEach((pageId) => {
      const canvasX = Math.round((drop.clientX - rect.left) / scale);
      const canvasY = Math.round((drop.clientY - rect.top) / scale);

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
      if (isNewPageDragStart) {
        updatePreviewAt(e.clientX, e.clientY);
      } else {
        hidePreview();
      }

      if (!isNewPageDragStart) return;

      const { pageIds } = getViewportAndPages();
      preDropPageIdsRef.current = new Set(pageIds);
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!armedDragRef.current) return;
      lastPointerRef.current = { x: e.clientX, y: e.clientY };
      updatePreviewAt(e.clientX, e.clientY);
    };

    const handleDragOver = (e: DragEvent) => {
      if (!armedDragRef.current) return;
      const x = e.clientX || lastPointerRef.current.x;
      const y = e.clientY || lastPointerRef.current.y;
      lastPointerRef.current = { x, y };
      updatePreviewAt(x, y);
    };

    const handleDrop = (e: DragEvent) => {
      if (!armedDragRef.current) return;

      const pointer = {
        x: e.clientX || lastPointerRef.current.x,
        y: e.clientY || lastPointerRef.current.y,
      };

      const canvasContainer = document.querySelector("[data-canvas-container]") as HTMLElement | null;
      const canvasRect = canvasContainer?.getBoundingClientRect();
      const droppedOnCanvas = !!canvasRect &&
        pointer.x >= canvasRect.left &&
        pointer.x <= canvasRect.right &&
        pointer.y >= canvasRect.top &&
        pointer.y <= canvasRect.bottom;

      if (!droppedOnCanvas) {
        armedDragRef.current = false;
        hidePreview();
        return;
      }

      lastDropPointRef.current = {
        clientX: pointer.x,
        clientY: pointer.y,
        ts: Date.now(),
      };

      placeDroppedPage();
      schedulePlacementRetry();
      armedDragRef.current = false;
      hidePreview();
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (armedDragRef.current) {
        const pointer = {
          x: e.clientX || lastPointerRef.current.x,
          y: e.clientY || lastPointerRef.current.y,
        };
        const canvasContainer = document.querySelector("[data-canvas-container]") as HTMLElement | null;
        const canvasRect = canvasContainer?.getBoundingClientRect();
        const droppedOnCanvas = !!canvasRect &&
          pointer.x >= canvasRect.left &&
          pointer.x <= canvasRect.right &&
          pointer.y >= canvasRect.top &&
          pointer.y <= canvasRect.bottom;

        if (!droppedOnCanvas) {
          armedDragRef.current = false;
          hidePreview();
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
      hidePreview();
    };

    const handleWindowBlur = () => {
      armedDragRef.current = false;
      hidePreview();
    };

    const handleDragEnd = () => {
      armedDragRef.current = false;
      hidePreview();
    };

    document.addEventListener("mousedown", handleMouseDown, true);
    document.addEventListener("mousemove", handleMouseMove, true);
    document.addEventListener("mouseup", handleMouseUp, true);
    document.addEventListener("dragover", handleDragOver, true);
    document.addEventListener("drop", handleDrop, true);
    window.addEventListener("blur", handleWindowBlur);
    document.addEventListener("dragend", handleDragEnd, true);
    return () => {
      document.removeEventListener("mousedown", handleMouseDown, true);
      document.removeEventListener("mousemove", handleMouseMove, true);
      document.removeEventListener("mouseup", handleMouseUp, true);
      document.removeEventListener("dragover", handleDragOver, true);
      document.removeEventListener("drop", handleDrop, true);
      window.removeEventListener("blur", handleWindowBlur);
      document.removeEventListener("dragend", handleDragEnd, true);
      const el = previewElRef.current;
      if (el?.parentElement) el.parentElement.removeChild(el);
      previewElRef.current = null;
    };
  }, [query]);

  return null;
};
