"use client";

import { useEffect } from "react";
import { useEditor } from "@craftjs/core";
import { useTransformMode } from "./TransformModeContext";

/**
 * Double-click on a component/asset → enter transform mode (resize from corners + rotate).
 * Click outside (or on another node) → exit transform mode.
 */
export function DoubleClickTransformHandler() {
  const { actions } = useEditor();
  const { transformModeNodeId, setTransformModeNodeId } = useTransformMode();

  useEffect(() => {
    const handleDblClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      if (target.closest("[data-panel]")) return;
      const nodeEl = target.closest("[data-node-id]") as HTMLElement | null;
      const nodeId = nodeEl?.getAttribute("data-node-id") ?? null;
      if (nodeId && nodeId !== "ROOT") {
        try {
          actions.selectNode(nodeId);
          setTransformModeNodeId(nodeId);
        } catch {
          // ignore
        }
      }
    };

    const handleMouseDown = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target || !transformModeNodeId) return;
      const onOverlay = target.closest("[data-panel='resize-overlay']");
      const onNode = target.closest("[data-node-id]") as HTMLElement | null;
      const clickedNodeId = onNode?.getAttribute("data-node-id") ?? null;
      if (onOverlay || clickedNodeId === transformModeNodeId) return;
      setTransformModeNodeId(null);
    };

    document.addEventListener("dblclick", handleDblClick, true);
    document.addEventListener("mousedown", handleMouseDown, true);
    return () => {
      document.removeEventListener("dblclick", handleDblClick, true);
      document.removeEventListener("mousedown", handleMouseDown, true);
    };
  }, [actions, transformModeNodeId, setTransformModeNodeId]);

  return null;
}
