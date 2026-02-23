"use client";

import { useEffect } from "react";
import { useEditor } from "@craftjs/core";
import { useTransformMode } from "./TransformModeContext";
import { useInlineTextEdit } from "./InlineTextEditContext";

/**
 * Double-click on a component/asset → enter transform mode (resize from corners + rotate).
 * Double-click on Text → start inline text editing (Figma-like).
 * Click outside (or on another node) → exit transform mode.
 */
export function DoubleClickTransformHandler() {
  const { actions, query } = useEditor();
  const { transformModeNodeId, setTransformModeNodeId } = useTransformMode();
  const { setEditingTextNodeId } = useInlineTextEdit();

  useEffect(() => {
    const handleDblClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      if (target.closest("[data-panel]")) return;
      const nodeEl = target.closest("[data-node-id]") as HTMLElement | null;
      const nodeId = nodeEl?.getAttribute("data-node-id") ?? null;
      if (nodeId && nodeId !== "ROOT") {
        try {
          const displayName = query.node(nodeId).get()?.data?.displayName as string | undefined;
          if (displayName === "Text") {
            actions.selectNode(nodeId);
            setEditingTextNodeId(nodeId);
            setTransformModeNodeId(null);
            return;
          }
          actions.selectNode(nodeId);
          setTransformModeNodeId(nodeId);
          setEditingTextNodeId(null);
        } catch {
          // ignore
        }
      }
    };

    const handleMouseDown = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      const onOverlay = target.closest("[data-panel='resize-overlay']");
      const onNode = target.closest("[data-node-id]") as HTMLElement | null;
      const clickedNodeId = onNode?.getAttribute("data-node-id") ?? null;
      if (onOverlay || clickedNodeId === transformModeNodeId) return;
      setTransformModeNodeId(null);
      if (!target.closest("[data-inline-text-edit]")) {
        setEditingTextNodeId(null);
      }
    };

    document.addEventListener("dblclick", handleDblClick, true);
    document.addEventListener("mousedown", handleMouseDown, true);
    return () => {
      document.removeEventListener("dblclick", handleDblClick, true);
      document.removeEventListener("mousedown", handleMouseDown, true);
    };
  }, [actions, query, transformModeNodeId, setTransformModeNodeId, setEditingTextNodeId]);

  return null;
}
