"use client";

import { useEffect, useRef } from "react";
import { useEditor } from "@craftjs/core";

type DropPoint = {
  clientX: number;
  clientY: number;
  ts: number;
};

function resolveViewportId(nodes: Record<string, any>): string | null {
  const rootNode = nodes?.ROOT;
  const frameRootId = rootNode?.data?.nodes?.[0] ?? null;
  const frameRoot = frameRootId ? nodes?.[frameRootId] : null;
  const viewportId = frameRoot?.data?.nodes?.[0] ?? null;
  if (viewportId && nodes?.[viewportId]?.data?.displayName === "Viewport") {
    return viewportId;
  }
  const fallback = Object.keys(nodes ?? {}).find((id) => nodes?.[id]?.data?.displayName === "Viewport");
  return fallback ?? null;
}

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
  return fallback;
}

export const NewPageDropPlacementHandler = () => {
  const { actions, query } = useEditor();
  const armedDragRef = useRef(false);
  const movedDuringDragRef = useRef(false);
  const preDropPageIdsRef = useRef<Set<string>>(new Set());
  const lastDropPointRef = useRef<DropPoint | null>(null);
  const lastPointerRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const placeDroppedPage = () => {
    try {
      const drop = lastDropPointRef.current;
      if (!drop || Date.now() - drop.ts > 2000) {
        lastDropPointRef.current = null;
        return;
      }

      const state = query.getState();
      if (!state) {
        console.error("placeDroppedPage: invalid editor state", state);
        lastDropPointRef.current = null;
        return;
      }
      const nodes = state.nodes ?? {};
      const viewportId = resolveViewportId(nodes);
      if (!viewportId) {
        lastDropPointRef.current = null;
        return;
      }

      const viewportChildren = Array.isArray(nodes[viewportId]?.data?.nodes)
        ? (nodes[viewportId].data.nodes as string[])
        : [];

      const currentPageIds = viewportChildren.filter((id) => nodes[id]?.data?.displayName === "Page");
      const preDrop = preDropPageIdsRef.current;
      const newPageIds = currentPageIds.filter((id) => !preDrop.has(id));

      const desktopRoot = document.querySelector("[data-viewport-desktop]") as HTMLElement | null;
      if (!desktopRoot) return;

      const rect = desktopRoot.getBoundingClientRect();
      const zoom = getEffectiveZoom(desktopRoot);

      if (newPageIds.length > 0) {
        newPageIds.forEach((pageId, index) => {
          const canvasX = Math.round((drop.clientX - rect.left) / zoom + index * 36);
          const canvasY = Math.round((drop.clientY - rect.top) / zoom + index * 36);

          actions.setProp(pageId, (props: Record<string, unknown>) => {
            props.canvasX = canvasX;
            props.canvasY = canvasY;
          });
        });

        lastDropPointRef.current = null;
        preDropPageIdsRef.current = new Set(currentPageIds);
        return;
      }

      // Fallback: if Craft drag-create didn't create a page node, create one directly at drop point
      const pageCount = currentPageIds.length;
      const pageNum = pageCount + 1;
      const pageId = `page-${Date.now()}`;
      const pageName = `Page ${pageNum}`;
      const PAGE_WIDTH = 1920;
      const PAGE_HEIGHT = 1200;
      const canvasX = Math.round((drop.clientX - rect.left) / zoom);
      const canvasY = Math.round((drop.clientY - rect.top) / zoom);

      const tree = {
        rootNodeId: pageId,
        nodes: {
          [pageId]: {
            id: pageId,
            type: { resolvedName: "Page" },
            isCanvas: true,
            props: {
              pageName,
              width: `${PAGE_WIDTH}px`,
              height: `${PAGE_HEIGHT}px`,
              background: "#E6E6E9",
              canvasX,
              canvasY,
            },
            displayName: "Page",
            nodes: [],
            linkedNodes: {},
            custom: {},
            hidden: false,
          },
        },
      };

      try {
        // Build a full serialized editor snapshot from current state, insert the new page node
        let snapshot: Record<string, any> | null = null;
        try {
          const serialized = (query as any).serialize ? (query as any).serialize() : null;
          snapshot = serialized ? JSON.parse(serialized) : null;
        } catch (e) {
          snapshot = null;
        }

        if (snapshot && typeof snapshot === "object") {
          // Find viewport id in serialized snapshot
          const serializedViewportId = Object.keys(snapshot).find((id) => {
            const n = snapshot[id] as any;
            return (n?.displayName === "Viewport") || (n?.data?.displayName === "Viewport");
          });

          if (serializedViewportId) {
            // Insert node into snapshot and add to viewport children
            snapshot[pageId] = {
              type: { resolvedName: "Page" },
              isCanvas: true,
              props: {
                pageName,
                width: `${PAGE_WIDTH}px`,
                height: `${PAGE_HEIGHT}px`,
                background: "#E6E6E9",
                canvasX,
                canvasY,
              },
              displayName: "Page",
              custom: {},
              parent: serializedViewportId,
              hidden: false,
              nodes: [],
              linkedNodes: {},
            };

            // Ensure viewport nodes array exists and append
            const vp = snapshot[serializedViewportId] as any;
            if (!Array.isArray(vp.nodes)) vp.nodes = [];
            vp.nodes = [...vp.nodes, pageId];

            actions.deserialize(JSON.stringify(snapshot));
            requestAnimationFrame(() => {
              try {
                actions.setProp(pageId, (props: Record<string, unknown>) => {
                  props.canvasX = canvasX;
                  props.canvasY = canvasY;
                });
                actions.selectNode(pageId);
              } catch {
                // Ignore if node not available yet in this frame
              }
            });
            preDropPageIdsRef.current = new Set([...currentPageIds, pageId]);
          } else {
            // Fallback to previous lightweight tree if we couldn't find serialized viewport
            actions.deserialize(JSON.stringify(tree));
            preDropPageIdsRef.current = new Set([...currentPageIds, pageId]);
          }
        } else {
          // No snapshot available — use direct deserialize of minimal tree
          actions.deserialize(JSON.stringify(tree));
          preDropPageIdsRef.current = new Set([...currentPageIds, pageId]);
        }
      } catch (error) {
        console.error("Failed to insert dropped page:", error);
      }

      lastDropPointRef.current = null;
    } catch (err) {
      console.error("placeDroppedPage unexpected error:", err, { drop: lastDropPointRef.current });
      lastDropPointRef.current = null;
    }
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
      dragStartRef.current = { x: e.clientX, y: e.clientY };
      const isNewPageDragStart = !!target.closest("[data-component-new-page='true']");
      armedDragRef.current = isNewPageDragStart;
      movedDuringDragRef.current = false;

      if (!isNewPageDragStart) return;

      const state = query.getState();
      const nodes = state.nodes ?? {};
      const viewportId = resolveViewportId(nodes);
      const viewportChildren = (viewportId && Array.isArray(nodes[viewportId]?.data?.nodes))
        ? (nodes[viewportId].data.nodes as string[])
        : [];
      const pageIds = viewportChildren.filter((id) => nodes[id]?.data?.displayName === "Page");
      preDropPageIdsRef.current = new Set(pageIds);
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!armedDragRef.current) return;
      lastPointerRef.current = { x: e.clientX, y: e.clientY };
      const dx = e.clientX - dragStartRef.current.x;
      const dy = e.clientY - dragStartRef.current.y;
      if ((dx * dx + dy * dy) > 36) {
        movedDuringDragRef.current = true;
      }
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (armedDragRef.current && movedDuringDragRef.current) {
        const pointer = {
          x: e.clientX || lastPointerRef.current.x,
          y: e.clientY || lastPointerRef.current.y,
        };
        lastDropPointRef.current = {
          clientX: pointer.x,
          clientY: pointer.y,
          ts: Date.now(),
        };

        placeDroppedPage();
        schedulePlacementRetry();
      }
      armedDragRef.current = false;
      movedDuringDragRef.current = false;
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
