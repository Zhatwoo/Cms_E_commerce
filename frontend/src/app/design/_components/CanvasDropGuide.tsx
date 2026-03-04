"use client";

import { useEffect, useRef } from "react";
import { useEditor } from "@craftjs/core";

const CANDIDATE_CANVAS_TYPES = new Set(["Page", "Container", "Section", "Row", "Column", "Frame", "Viewport"]);

export function CanvasDropGuide() {
  const { query } = useEditor();
  const activeRef = useRef(false);
  const boxRef = useRef<HTMLDivElement | null>(null);
  const ghostRef = useRef<HTMLDivElement | null>(null);
  const badgeRef = useRef<HTMLDivElement | null>(null);

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

      if (!ghostRef.current) {
        const ghost = document.createElement("div");
        ghost.style.position = "fixed";
        ghost.style.pointerEvents = "none";
        ghost.style.height = "40px";
        ghost.style.background = "rgba(59,130,246,0.15)";
        ghost.style.border = "2px dashed #3b82f6";
        ghost.style.borderRadius = "4px";
        ghost.style.boxSizing = "border-box";
        ghost.style.zIndex = "120001";
        ghost.style.display = "none";
        ghostRef.current = ghost;
        document.body.appendChild(ghost);
      }

      if (!badgeRef.current) {
        const badge = document.createElement("div");
        badge.style.position = "fixed";
        badge.style.pointerEvents = "none";
        badge.style.padding = "2px 6px";
        badge.style.borderRadius = "999px";
        badge.style.background = "#3b82f6";
        badge.style.color = "#ffffff";
        badge.style.fontSize = "10px";
        badge.style.fontWeight = "600";
        badge.style.lineHeight = "1.2";
        badge.style.zIndex = "120002";
        badge.style.display = "none";
        badge.textContent = "Drop here";
        badgeRef.current = badge;
        document.body.appendChild(badge);
      }
    };

    const hideGuide = () => {
      if (boxRef.current) boxRef.current.style.display = "none";
      if (ghostRef.current) ghostRef.current.style.display = "none";
      if (badgeRef.current) badgeRef.current.style.display = "none";
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
      const ghost = ghostRef.current;
      const badge = badgeRef.current;
      if (!box || !ghost || !badge) return;

      const rect = targetEl.getBoundingClientRect();
      box.style.display = "block";
      box.style.left = `${rect.left}px`;
      box.style.top = `${rect.top}px`;
      box.style.width = `${rect.width}px`;
      box.style.height = `${rect.height}px`;

      const targetChildren = Array.from(targetEl.children)
        .filter((child): child is HTMLElement => child instanceof HTMLElement)
        .filter((child) => {
          const childRect = child.getBoundingClientRect();
          return childRect.height > 0.5 && childRect.width > 0.5;
        });

      ghost.style.display = "block";
      badge.style.display = "block";

      if (targetChildren.length === 0) {
        ghost.style.left = `${rect.left}px`;
        ghost.style.top = `${rect.top}px`;
        ghost.style.width = `${rect.width}px`;
        ghost.style.height = `${Math.max(40, rect.height)}px`;

        badge.style.left = `${rect.left + 6}px`;
        badge.style.top = `${rect.top + 6}px`;
        return;
      }

      let insertY = targetChildren[0].getBoundingClientRect().top;
      let foundSlot = false;

      for (const child of targetChildren) {
        const childRect = child.getBoundingClientRect();
        const midpoint = childRect.top + childRect.height / 2;
        if (clientY <= midpoint) {
          insertY = childRect.top;
          foundSlot = true;
          break;
        }
      }

      if (!foundSlot) {
        const lastRect = targetChildren[targetChildren.length - 1].getBoundingClientRect();
        insertY = lastRect.bottom;
      }

      ghost.style.left = `${rect.left}px`;
      ghost.style.top = `${insertY - 20}px`;
      ghost.style.width = `${rect.width}px`;
      ghost.style.height = "40px";

      badge.style.left = `${rect.left + 6}px`;
      badge.style.top = `${insertY - 18}px`;
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
      if (ghostRef.current?.parentElement) ghostRef.current.parentElement.removeChild(ghostRef.current);
      if (badgeRef.current?.parentElement) badgeRef.current.parentElement.removeChild(badgeRef.current);
      boxRef.current = null;
      ghostRef.current = null;
      badgeRef.current = null;
    };
  }, [query]);

  return null;
}
