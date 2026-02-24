"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import ReactDOM from "react-dom";
import { useEditor } from "@craftjs/core";
import { usePrototypeTabActive } from "./PrototypeTabContext";
import type { PrototypeConfig } from "../_types/prototype";

interface Line {
  sourceNodeId: string;
  targetPageNodeId: string;
  sourceRect: DOMRect;
  targetRect: DOMRect;
}

export const PrototypeFlowLines = () => {
  const isPrototypeTabActive = usePrototypeTabActive();
  const [lines, setLines] = useState<Line[]>([]);
  const [mounted, setMounted] = useState(false);
  const rafRef = useRef<number>(0);
  const { query } = useEditor();

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  const computeLines = useCallback(() => {
    try {
      const state = query.getState();
      const nodes = state.nodes ?? {};

      // Build slug -> page node ID map
      const slugMap: Record<string, string> = {};
      for (const [nodeId, node] of Object.entries(nodes)) {
        if (node?.data?.displayName !== "Page") continue;
        const slug = (node.data.props?.pageSlug as string) ?? "page";
        slugMap[slug] = nodeId;
      }

      // Find all navigateTo interactions
      const next: Line[] = [];
      for (const [nodeId, node] of Object.entries(nodes)) {
        const props = node?.data?.props ?? {};
        const proto = props.prototype as PrototypeConfig | undefined;
        if (!proto?.interactions?.length) continue;
        for (const interaction of proto.interactions) {
          if (interaction.action !== "navigateTo" || !interaction.destination) continue;
          const pageNodeId = slugMap[interaction.destination];
          if (!pageNodeId) continue;
          const sourceEl = document.querySelector(`[data-node-id="${nodeId}"]`) as HTMLElement | null;
          const targetEl = document.querySelector(`[data-node-id="${pageNodeId}"]`) as HTMLElement | null;
          if (!sourceEl || !targetEl) continue;
          next.push({
            sourceNodeId: nodeId,
            targetPageNodeId: pageNodeId,
            sourceRect: sourceEl.getBoundingClientRect(),
            targetRect: targetEl.getBoundingClientRect(),
          });
        }
      }
      setLines(next);
    } catch {
      setLines([]);
    }
  }, [query]);

  useEffect(() => {
    if (!mounted || !isPrototypeTabActive) {
      setLines([]);
      return;
    }

    computeLines();
    const scrollUpdate = () => {
      rafRef.current = requestAnimationFrame(computeLines);
    };
    window.addEventListener("scroll", scrollUpdate, true);
    window.addEventListener("resize", scrollUpdate);
    const interval = setInterval(computeLines, 200);

    return () => {
      window.removeEventListener("scroll", scrollUpdate, true);
      window.removeEventListener("resize", scrollUpdate);
      clearInterval(interval);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [mounted, isPrototypeTabActive, computeLines]);

  if (!mounted || !isPrototypeTabActive || lines.length === 0) return null;

  return ReactDOM.createPortal(
    <div
      data-panel="prototype-flow-lines"
      className="fixed inset-0 pointer-events-none z-40"
      aria-hidden
    >
      <svg className="absolute inset-0 w-full h-full" style={{ overflow: "visible" }}>
        <defs>
          <marker
            id="prototype-arrowhead"
            markerWidth="10"
            markerHeight="7"
            refX="9"
            refY="3.5"
            orient="auto"
          >
            <polygon points="0 0, 10 3.5, 0 7" fill="rgb(59, 130, 246)" />
          </marker>
        </defs>
        {lines.map((line, i) => {
          const sourceCenterX = line.sourceRect.left + line.sourceRect.width / 2;
          const sourceCenterY = line.sourceRect.top + line.sourceRect.height / 2;
          const targetCenterX = line.targetRect.left + line.targetRect.width / 2;
          const targetCenterY = line.targetRect.top + line.targetRect.height / 2;

          const direction = targetCenterX >= sourceCenterX ? 1 : -1;

          // Route from side edges (not center) to reduce overlap across page content.
          const sx = direction > 0 ? line.sourceRect.right : line.sourceRect.left;
          const sy = sourceCenterY;
          const tx = direction > 0 ? line.targetRect.left : line.targetRect.right;
          const ty = targetCenterY;

          const dx = Math.abs(tx - sx);
          const dy = Math.abs(ty - sy);
          const horizontalCurve = Math.max(120, Math.min(340, dx * 0.45));
          const verticalBend = Math.max(40, Math.min(180, dy * 0.25));

          const c1x = sx + direction * horizontalCurve;
          const c2x = tx - direction * horizontalCurve;
          const c1y = sy - verticalBend;
          const c2y = ty + verticalBend;

          const path = `M ${sx} ${sy} C ${c1x} ${c1y}, ${c2x} ${c2y}, ${tx} ${ty}`;
          return (
            <path
              key={i}
              d={path}
              fill="none"
              stroke="rgb(59, 130, 246)"
              strokeWidth="2"
              strokeDasharray="4 4"
              markerEnd="url(#prototype-arrowhead)"
            />
          );
        })}
      </svg>
    </div>,
    document.body
  );
};
