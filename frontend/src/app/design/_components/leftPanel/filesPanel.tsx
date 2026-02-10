import React, { useState, useEffect, useCallback } from "react";
import ReactDOM from "react-dom";
import { useEditor } from "@craftjs/core";
import {
  ChevronRight,
  ChevronDown,
  Box,
  Type,
  Layout,
  Image as ImageIcon,
  MousePointer2,
  Copy,
  Trash2,
} from "lucide-react";

/** Node types that cannot be deleted or duplicated */
const PROTECTED = new Set(["Viewport"]);

export const FilesPanel = () => {
  const { nodes, actions, query, selected } = useEditor((state) => ({
    nodes: state.nodes,
    selected: state.events.selected,
  }));

  // ── Context menu state ────────────────────────────────────
  const [contextMenu, setContextMenu] = useState<{
    nodeId: string;
    x: number;
    y: number;
  } | null>(null);

  // Close context menu on any click or right-click elsewhere, or Escape
  useEffect(() => {
    if (!contextMenu) return;

    const close = () => setContextMenu(null);
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };

    window.addEventListener("click", close);
    window.addEventListener("contextmenu", close);
    window.addEventListener("keydown", handleKey);
    return () => {
      window.removeEventListener("click", close);
      window.removeEventListener("contextmenu", close);
      window.removeEventListener("keydown", handleKey);
    };
  }, [contextMenu]);

  // ── Context menu actions ──────────────────────────────────
  const handleSelect = useCallback(
    (nodeId: string) => {
      actions.selectNode(nodeId);
      setContextMenu(null);
    },
    [actions]
  );

  const handleDuplicate = useCallback(
    (nodeId: string) => {
      try {
        const node = query.node(nodeId).get();
        const parentId = node.data.parent;
        if (!parentId) return;

        // Get the full subtree for the node
        const tree = query.node(nodeId).toNodeTree();
        actions.addNodeTree(tree, parentId);
      } catch {
        // node might be invalid
      }
      setContextMenu(null);
    },
    [actions, query]
  );

  const handleDelete = useCallback(
    (nodeId: string) => {
      try {
        if (nodeId === "ROOT") return;
        const node = query.node(nodeId).get();
        if (PROTECTED.has(node.data.displayName)) return;
        if (!query.node(nodeId).isDeletable()) return;
        actions.delete(nodeId);
      } catch {
        // node might already be gone
      }
      setContextMenu(null);
    },
    [actions, query]
  );

  // ── Check if a node can be modified (not ROOT / Viewport) ─
  const isProtected = (nodeId: string): boolean => {
    if (nodeId === "ROOT") return true;
    const node = nodes[nodeId];
    if (!node) return true;
    return PROTECTED.has(node.data.displayName || "");
  };

  // ── Layer tree item ───────────────────────────────────────
  const LayerItem = ({ nodeId, depth = 0 }: { nodeId: string; depth?: number }) => {
    const [expanded, setExpanded] = useState(true);
    const node = nodes[nodeId];

    if (!node) return null;

    const isSelected = selected.has(nodeId);
    const hasChildren = node.data.nodes && node.data.nodes.length > 0;

    // Determine icon based on node type
    let Icon = Box;
    const name = node.data.displayName || node.data.name || "";

    if (name === "Text") Icon = Type;
    else if (name === "Container") Icon = Layout;
    else if (name === "Image") Icon = ImageIcon;

    const toggleExpansion = (e: React.MouseEvent) => {
      e.stopPropagation();
      setExpanded(!expanded);
    };

    const openContextMenu = (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setContextMenu({ nodeId, x: e.clientX, y: e.clientY });
    };

    return (
      <div className="flex flex-col gap-1 select-none">
        <div
          onClick={(e) => {
            e.stopPropagation();
            actions.selectNode(nodeId);
          }}
          onContextMenu={openContextMenu}
          className={`
            group flex items-center gap-2 py-1 px-1 rounded-md cursor-pointer transition-colors relative
            ${isSelected ? "bg-blue-400/20 text-brand-lighter" : "text-brand-light hover:bg-brand-medium/20 hover:text-brand-lighter"}
          `}
          style={{ paddingLeft: `${depth * 10 + 5}px` }}
        >
          {/* Expansion Toggle */}
          <div
            className={`
              p-1 rounded-md hover:bg-white/10 cursor-pointer mr-1
              ${!hasChildren ? "opacity-0 pointer-events-none" : "opacity-100"}
            `}
            onClick={toggleExpansion}
          >
            {expanded ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </div>

          <Icon className="w-4 h-4 opacity-70 shrink-0" />
          <span className="text-sm font-medium truncate flex-1">
            {name || "Node"}
          </span>
        </div>

        {/* Children */}
        {hasChildren && expanded && (
          <div className="flex flex-col gap-1">
            {node.data.nodes.map((childId) => (
              <LayerItem key={childId} nodeId={childId} depth={depth + 1} />
            ))}
          </div>
        )}
      </div>
    );
  };

  // ── Context menu portal ───────────────────────────────────
  const ContextMenuPortal = () => {
    if (!contextMenu) return null;

    const nodeProtected = isProtected(contextMenu.nodeId);
    const nodeName = nodes[contextMenu.nodeId]?.data.displayName || "Node";

    return ReactDOM.createPortal(
      <div
        className="fixed z-9999 min-w-[160px] bg-brand-darker border border-white/10 rounded-lg shadow-2xl py-1 text-sm"
        style={{ left: contextMenu.x, top: contextMenu.y }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-3 py-1.5 text-[10px] uppercase tracking-wider text-brand-light/50 font-semibold border-b border-white/5">
          {nodeName}
        </div>

        {/* Select */}
        <button
          onClick={() => handleSelect(contextMenu.nodeId)}
          className="flex items-center gap-2 w-full px-3 py-1.5 text-brand-lighter hover:bg-white/10 transition-colors cursor-pointer"
        >
          <MousePointer2 className="w-3.5 h-3.5" />
          Select
        </button>

        {/* Duplicate */}
        <button
          onClick={() => !nodeProtected && handleDuplicate(contextMenu.nodeId)}
          disabled={nodeProtected}
          className={`flex items-center gap-2 w-full px-3 py-1.5 transition-colors ${
            nodeProtected
              ? "text-brand-light/30 cursor-not-allowed"
              : "text-brand-lighter hover:bg-white/10 cursor-pointer"
          }`}
        >
          <Copy className="w-3.5 h-3.5" />
          Duplicate
        </button>

        {/* Divider */}
        <div className="border-t border-white/5 my-0.5" />

        {/* Delete */}
        <button
          onClick={() => !nodeProtected && handleDelete(contextMenu.nodeId)}
          disabled={nodeProtected}
          className={`flex items-center gap-2 w-full px-3 py-1.5 transition-colors ${
            nodeProtected
              ? "text-brand-light/30 cursor-not-allowed"
              : "text-red-400 hover:bg-red-500/10 cursor-pointer"
          }`}
        >
          <Trash2 className="w-3.5 h-3.5" />
          Delete
        </button>
      </div>,
      document.body
    );
  };

  return (
    <div className="flex flex-col gap-0.5 mt-2 overflow-x-hidden">
      <LayerItem nodeId="ROOT" />
      <ContextMenuPortal />
    </div>
  );
};
