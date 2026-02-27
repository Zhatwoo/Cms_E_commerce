"use client";

import { useEffect, useRef } from "react";
import { useEditor } from "@craftjs/core";

const CANDIDATE_CANVAS_TYPES = new Set(["Page", "Container", "Section", "Row", "Column", "Frame", "Viewport"]);

export function CanvasDropGuide() {
  const { query } = useEditor();
  const activeRef = useRef(false);
  const boxRef = useRef<HTMLDivElement | null>(null);
  const lineRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const ensureElements = () => {
      if (!boxRef.current) {
        const box = document.createElement("div");
        box.style.position = "fixed";
        box.style.pointerEvents = "none";
        box.style.border = "2px solid #3b82f6";
        box.style.borderRadius = "4px";
        box.style.zIndex = "120000";
        box.style.display = "none";
        box.style.boxSizing = "border-box";
        boxRef.current = box;
        document.body.appendChild(box);
      }

      if (!lineRef.current) {
        const line = document.createElement("div");
        line.style.position = "fixed";
        line.style.pointerEvents = "none";
        line.style.height = "3px";
        line.style.borderRadius = "2px";
        line.style.background = "#3b82f6";
        line.style.boxShadow = "0 0 0 1px rgba(255,255,255,0.2)";
        line.style.zIndex = "120001";
        line.style.display = "none";
        lineRef.current = line;
        document.body.appendChild(line);
      }
    };

    const hideGuide = () => {
      if (boxRef.current) boxRef.current.style.display = "none";
      if (lineRef.current) lineRef.current.style.display = "none";
    };

    const resolveDropTarget = (target: EventTarget | null): HTMLElement | null => {
      const el = target as HTMLElement | null;
      if (!el) return null;
      const nodeEl = el.closest("[data-node-id]") as HTMLElement | null;
      if (!nodeEl) return null;

      const nodeId = nodeEl.getAttribute("data-node-id");
      if (!nodeId || nodeId === "ROOT") return null;

      try {
        const state = query.getState();
        const node = state.nodes[nodeId];
        const displayName = (node?.data?.displayName as string | undefined) ?? "";
        const isCanvas = node?.data?.isCanvas === true;
        if (!isCanvas && !CANDIDATE_CANVAS_TYPES.has(displayName)) return null;
      } catch {
        return null;
      }

      return nodeEl;
    };

    const showGuideFor = (targetEl: HTMLElement, clientY: number) => {
      ensureElements();
      const box = boxRef.current;
      const line = lineRef.current;
      if (!box || !line) return;

      const rect = targetEl.getBoundingClientRect();
      box.style.display = "block";
      box.style.left = `${rect.left}px`;
      box.style.top = `${rect.top}px`;
      box.style.width = `${rect.width}px`;
      box.style.height = `${rect.height}px`;

      const relativeY = clientY - rect.top;
      const placeTop = relativeY <= rect.height * 0.33;
      const placeBottom = relativeY >= rect.height * 0.67;

      if (placeTop || placeBottom) {
        line.style.display = "block";
        line.style.left = `${rect.left}px`;
        line.style.width = `${rect.width}px`;
        line.style.top = `${placeTop ? rect.top : rect.bottom - 1}px`;
      } else {
        line.style.display = "none";
      }
    };

    const handleDragStart = (event: DragEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target) return;

      const fromAsset = !!target.closest("[data-drag-source='asset']");
      const fromComponent = !!target.closest("[data-drag-source='component']") && !target.closest("[data-component-new-page='true']");
      activeRef.current = fromAsset || fromComponent;

      if (!activeRef.current) {
        hideGuide();
      }
    };

    const handleDragOver = (event: DragEvent) => {
      if (!activeRef.current) return;
      const targetEl = resolveDropTarget(event.target);
      if (!targetEl) {
        hideGuide();
        return;
      }

      showGuideFor(targetEl, event.clientY);
    };

    const handleDropOrEnd = () => {
      activeRef.current = false;
      hideGuide();
    };

    document.addEventListener("dragstart", handleDragStart, true);
    document.addEventListener("dragover", handleDragOver, true);
    document.addEventListener("drop", handleDropOrEnd, true);
    document.addEventListener("dragend", handleDropOrEnd, true);
    window.addEventListener("blur", handleDropOrEnd);

    return () => {
      document.removeEventListener("dragstart", handleDragStart, true);
      document.removeEventListener("dragover", handleDragOver, true);
      document.removeEventListener("drop", handleDropOrEnd, true);
      document.removeEventListener("dragend", handleDropOrEnd, true);
      window.removeEventListener("blur", handleDropOrEnd);
      hideGuide();
      if (boxRef.current?.parentElement) boxRef.current.parentElement.removeChild(boxRef.current);
      if (lineRef.current?.parentElement) lineRef.current.parentElement.removeChild(lineRef.current);
      boxRef.current = null;
      lineRef.current = null;
    };
  }, [query]);

  return null;
}
