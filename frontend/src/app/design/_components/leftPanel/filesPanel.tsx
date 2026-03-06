import React, { useState, useEffect, useCallback, useRef, useTransition } from "react";
import ReactDOM from "react-dom";
import { useEditor } from "@craftjs/core";
import {
  ChevronDown,
  Box,
  Type,
  Layout,
  Image as ImageIcon,
  MousePointer2,
  Copy,
  Trash2,
  Group,
  Ungroup,
  Eye,
  EyeOff,
  Lock,
  LockOpen,
} from "lucide-react";
import { duplicateNodes, groupSelection, ungroupSelection, selectedToIds } from "../../_lib/canvasActions";
import { useCanvasTool } from "../CanvasToolContext";

/** Node types that cannot be deleted, duplicated, or dragged */
const PROTECTED = new Set(["Viewport"]);
const UNDRAGGABLE = new Set(["ROOT", "Viewport", "Page"]);

/** Display names that accept drop "inside" (canvas containers). */
const CANVAS_CONTAINERS = new Set(["Viewport", "Page", "Section", "Row", "Column", "Container", "Frame"]);

/** Get ordered child node IDs from a node (Craft state or serialized shape). */
function getChildIds(node: Record<string, unknown> | null | undefined): string[] {
  if (!node || typeof node !== "object") return [];
  const fromData = (node.data as Record<string, unknown>)?.nodes;
  if (Array.isArray(fromData)) return fromData as string[];
  if (Array.isArray(node.nodes)) return node.nodes as string[];
  return [];
}

/** Check if nodeId is in the current selection (Set or array). */
function isNodeSelected(selected: Set<string> | string[] | unknown, nodeId: string): boolean {
  if (selected instanceof Set) return selected.has(nodeId);
  if (Array.isArray(selected)) return selected.includes(nodeId);
  return false;
}

/** Collect all descendant IDs of a node (to prevent circular drops). */
function getDescendantIds(nodeId: string, nodes: Record<string, any>): Set<string> {
  const result = new Set<string>();
  const stack = [nodeId];
  while (stack.length) {
    const id = stack.pop()!;
    result.add(id);
    const children = getChildIds(nodes[id] as Record<string, unknown>);
    for (const c of children) {
      if (!result.has(c)) stack.push(c);
    }
  }
  return result;
}

// ─── Drag types ────────────────────────────────────────────────────────────

interface DragState {
  nodeId: string;
  parentId: string;
  startX: number;
  startY: number;
  activated: boolean;
}

interface DropTarget {
  nodeId: string;
  parentId: string;
  zone: "above" | "inside" | "below";
}

const DEADZONE = 4;
const AUTO_EXPAND_DELAY = 600;

export const FilesPanel = () => {
  const { nodes, actions, query, selected } = useEditor((state) => ({
    nodes: state.nodes,
    selected: state.events.selected,
  }));
  const { activeTool } = useCanvasTool();

  const [isPending, startTransition] = useTransition();

  // ── Refs for stable access in event handlers ─
  const nodesRef = useRef(nodes);
  nodesRef.current = nodes;
  const actionsRef = useRef(actions);
  actionsRef.current = actions;
  const queryRef = useRef(query);
  queryRef.current = query;
  const selectedRef = useRef(selected);
  selectedRef.current = selected;

  // ── Drag state (refs to avoid re-renders during drag) ─
  const dragRef = useRef<DragState | null>(null);
  const dropTargetRef = useRef<DropTarget | null>(null);
  const ghostRef = useRef<HTMLDivElement | null>(null);
  const indicatorRef = useRef<HTMLDivElement | null>(null);
  const autoExpandTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const autoExpandTargetRef = useRef<string | null>(null);

  // Expansion state lifted to parent so we can auto-expand during drag
  const [expandedMap, setExpandedMap] = useState<Record<string, boolean>>({});
  const expandedMapRef = useRef(expandedMap);
  expandedMapRef.current = expandedMap;

  const toggleExpanded = useCallback((nodeId: string) => {
    setExpandedMap((prev) => ({ ...prev, [nodeId]: !isExpanded(nodeId, prev) }));
  }, []);

  function isExpanded(nodeId: string, map: Record<string, boolean>): boolean {
    return map[nodeId] !== false; // default expanded
  }

  // ── Scroll selected layer into view (Figma-like) ─
  useEffect(() => {
    const ids = selectedToIds(selected);
    if (ids.length === 0) return;
    const firstId = ids[0];
    if (!firstId) return;
    const row = document.querySelector(`[data-layer-id="${firstId}"]`) as HTMLElement | null;
    if (row) row.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [selected]);

  // ── Context menu state ─
  const [contextMenu, setContextMenu] = useState<{
    nodeId: string;
    x: number;
    y: number;
    parentId?: string;
    siblingIndex?: number;
    siblingCount?: number;
  } | null>(null);

  useEffect(() => {
    if (!contextMenu) return;
    const close = (e?: MouseEvent) => {
      const target = e?.target as HTMLElement | null;
      if (target?.closest?.("[data-context-menu]")) return;
      setContextMenu(null);
    };
    const handleClick = (e: MouseEvent) => close(e);
    const handleContextMenu = (e: MouseEvent) => close(e);
    const handleKey = (e: KeyboardEvent) => { if (e.key === "Escape") setContextMenu(null); };
    window.addEventListener("click", handleClick, true);
    window.addEventListener("contextmenu", handleContextMenu, true);
    window.addEventListener("keydown", handleKey, true);
    return () => {
      window.removeEventListener("click", handleClick, true);
      window.removeEventListener("contextmenu", handleContextMenu, true);
      window.removeEventListener("keydown", handleKey, true);
    };
  }, [contextMenu]);

  // ── Context menu actions ──────────────────────────────────
  const handleSelect = useCallback(
    (nodeId: string) => {
      startTransition(() => {
        actions.selectNode(nodeId);
        setContextMenu(null);
      });
    },
    [actions, startTransition]
  );

  const handleDuplicate = useCallback(
    (nodeId: string) => {
      duplicateNodes(actions as any, query as any, [nodeId]);
      setContextMenu(null);
    },
    [actions, query, startTransition]
  );

  const handleGroup = useCallback(() => {
    const ids = selectedToIds(selected);
    if (ids.length >= 1) groupSelection(actions as any, query as any, ids);
    setContextMenu(null);
  }, [actions, query, selected]);

  const handleUngroup = useCallback(() => {
    const ids = selectedToIds(selected);
    if (ids.length === 1) ungroupSelection(actions as any, query as any, ids);
    setContextMenu(null);
  }, [actions, query, selected]);

  const handleDelete = useCallback(
    (nodeId: string) => {
      startTransition(() => {
        try {
          if (nodeId === "ROOT") return;
          const node = query.node(nodeId).get();
          if (PROTECTED.has(node.data.displayName)) return;
          if (!query.node(nodeId).isDeletable()) return;
          actions.delete(nodeId);
        } catch { /* node might already be gone */ }
        setContextMenu(null);
      });
    },
    [actions, query, startTransition]
  );

  const isProtected = (nodeId: string): boolean => {
    if (nodeId === "ROOT") return true;
    const node = nodes[nodeId];
    if (!node) return true;
    return PROTECTED.has(node.data.displayName || "");
  };

  // ── Drag helpers ──────────────────────────────────────────

  function clearGhost() {
    if (ghostRef.current) {
      ghostRef.current.remove();
      ghostRef.current = null;
    }
  }

  function clearIndicator() {
    if (indicatorRef.current) {
      indicatorRef.current.remove();
      indicatorRef.current = null;
    }
    // Also remove any "inside" highlights
    document.querySelectorAll("[data-layer-drop-inside]").forEach((el) => {
      el.removeAttribute("data-layer-drop-inside");
      (el as HTMLElement).style.outline = "";
    });
  }

  function clearAutoExpandTimer() {
    if (autoExpandTimerRef.current) {
      clearTimeout(autoExpandTimerRef.current);
      autoExpandTimerRef.current = null;
    }
    autoExpandTargetRef.current = null;
  }

  function cleanup() {
    dragRef.current = null;
    dropTargetRef.current = null;
    clearGhost();
    clearIndicator();
    clearAutoExpandTimer();
    document.body.style.cursor = "";
    document.body.style.userSelect = "";
  }

  function createGhost(sourceEl: HTMLElement, x: number, y: number) {
    const ghost = document.createElement("div");
    ghost.style.position = "fixed";
    ghost.style.zIndex = "99999";
    ghost.style.pointerEvents = "none";
    ghost.style.opacity = "0.8";
    ghost.style.transform = "scale(0.95)";
    ghost.style.transition = "transform 0.1s ease";
    ghost.style.background = "rgba(30,30,30,0.9)";
    ghost.style.borderRadius = "8px";
    ghost.style.padding = "4px 10px";
    ghost.style.fontSize = "13px";
    ghost.style.color = "#e4e4e7";
    ghost.style.border = "1px solid rgba(255,255,255,0.15)";
    ghost.style.boxShadow = "0 8px 24px rgba(0,0,0,0.4)";
    ghost.style.whiteSpace = "nowrap";
    ghost.style.maxWidth = "220px";
    ghost.style.overflow = "hidden";
    ghost.style.textOverflow = "ellipsis";

    // Extract the text content from the row
    const nameSpan = sourceEl.querySelector("span");
    ghost.textContent = nameSpan?.textContent || "Layer";

    // Count selected nodes for multi-drag badge
    const sel = selectedRef.current;
    const selArr = sel instanceof Set ? Array.from(sel) : Array.isArray(sel) ? sel : [];
    if (selArr.length > 1 && selArr.includes(dragRef.current?.nodeId ?? "")) {
      const badge = document.createElement("span");
      badge.style.marginLeft = "6px";
      badge.style.background = "#3b82f6";
      badge.style.color = "#fff";
      badge.style.borderRadius = "4px";
      badge.style.padding = "1px 5px";
      badge.style.fontSize = "11px";
      badge.style.fontWeight = "600";
      badge.textContent = String(selArr.length);
      ghost.appendChild(badge);
    }

    ghost.style.left = `${x + 12}px`;
    ghost.style.top = `${y - 10}px`;
    document.body.appendChild(ghost);
    ghostRef.current = ghost;
  }

  function showLineIndicator(rect: DOMRect, zone: "above" | "below", depth: number) {
    clearIndicator();
    const line = document.createElement("div");
    line.style.position = "fixed";
    line.style.zIndex = "99998";
    line.style.pointerEvents = "none";
    line.style.height = "2px";
    line.style.background = "#3b82f6";
    line.style.borderRadius = "1px";
    const indent = depth * 10 + 5;
    line.style.left = `${rect.left + indent}px`;
    line.style.width = `${rect.width - indent}px`;
    line.style.top = zone === "above" ? `${rect.top}px` : `${rect.bottom}px`;

    // Small circle on the left edge
    const dot = document.createElement("div");
    dot.style.position = "absolute";
    dot.style.left = "-3px";
    dot.style.top = "-3px";
    dot.style.width = "8px";
    dot.style.height = "8px";
    dot.style.borderRadius = "50%";
    dot.style.background = "#3b82f6";
    line.appendChild(dot);

    document.body.appendChild(line);
    indicatorRef.current = line;
  }

  function showInsideIndicator(rowEl: HTMLElement) {
    clearIndicator();
    rowEl.setAttribute("data-layer-drop-inside", "true");
    rowEl.style.outline = "2px solid rgba(59,130,246,0.5)";
    rowEl.style.outlineOffset = "-2px";
    rowEl.style.borderRadius = "6px";
  }

  // ── Mouse event handlers ──────────────────────────────────

  function handleLayerMouseDown(
    e: React.MouseEvent,
    nodeId: string,
    parentId: string | undefined
  ) {
    // Only left-click
    if (e.button !== 0) return;
    // Hand tool = pan only, no layer reordering
    if (activeTool === "hand") return;
    // Don't drag protected nodes
    if (UNDRAGGABLE.has(nodeId)) return;
    const node = nodesRef.current[nodeId];
    if (!node) return;
    const displayName = node.data?.displayName || "";
    if (UNDRAGGABLE.has(displayName)) return;
    // Don't initiate drag from chevron clicks
    const target = e.target as HTMLElement;
    if (target.closest("[data-layer-expand]")) return;

    e.preventDefault();

    dragRef.current = {
      nodeId,
      parentId: parentId || "",
      startX: e.clientX,
      startY: e.clientY,
      activated: false,
    };
  }

  useEffect(() => {
    function handleMouseMove(e: MouseEvent) {
      const drag = dragRef.current;
      if (!drag) return;

      // Deadzone check
      if (!drag.activated) {
        const dx = Math.abs(e.clientX - drag.startX);
        const dy = Math.abs(e.clientY - drag.startY);
        if (dx < DEADZONE && dy < DEADZONE) return;
        drag.activated = true;
        document.body.style.cursor = "grabbing";
        document.body.style.userSelect = "none";

        // Create ghost from the original row element
        const srcRow = document.querySelector(`[data-layer-id="${drag.nodeId}"]`) as HTMLElement | null;
        if (srcRow) createGhost(srcRow, e.clientX, e.clientY);
      }

      // Move ghost
      if (ghostRef.current) {
        ghostRef.current.style.left = `${e.clientX + 12}px`;
        ghostRef.current.style.top = `${e.clientY - 10}px`;
      }

      // Find the row under cursor
      const els = document.elementsFromPoint(e.clientX, e.clientY);
      let targetRow: HTMLElement | null = null;
      for (const el of els) {
        const row = (el as HTMLElement).closest("[data-layer-id]") as HTMLElement | null;
        if (row) { targetRow = row; break; }
      }

      if (!targetRow) {
        clearIndicator();
        clearAutoExpandTimer();
        dropTargetRef.current = null;
        return;
      }

      const targetNodeId = targetRow.getAttribute("data-layer-id")!;
      const targetParentId = targetRow.getAttribute("data-layer-parent") || "";
      const targetDepth = parseInt(targetRow.getAttribute("data-layer-depth") || "0", 10);

      // Don't drop onto self or descendants
      const descendants = getDescendantIds(drag.nodeId, nodesRef.current);
      if (descendants.has(targetNodeId)) {
        clearIndicator();
        clearAutoExpandTimer();
        dropTargetRef.current = null;
        return;
      }

      // Compute zone
      const rect = targetRow.getBoundingClientRect();
      const relY = e.clientY - rect.top;
      const fraction = relY / rect.height;

      let zone: "above" | "inside" | "below";
      if (fraction < 0.25) {
        zone = "above";
      } else if (fraction > 0.75) {
        zone = "below";
      } else {
        // "inside" only valid for canvas containers
        const targetNode = nodesRef.current[targetNodeId];
        const displayName = targetNode?.data?.displayName as string | undefined;
        if (displayName && CANVAS_CONTAINERS.has(displayName)) {
          zone = "inside";
        } else {
          zone = fraction < 0.5 ? "above" : "below";
        }
      }

      // Also prevent dropping above/below ROOT or Viewport
      if (UNDRAGGABLE.has(targetNodeId) && zone !== "inside") {
        const targetNode = nodesRef.current[targetNodeId];
        const displayName = targetNode?.data?.displayName as string | undefined;
        if (displayName && CANVAS_CONTAINERS.has(displayName)) {
          zone = "inside";
        } else {
          clearIndicator();
          dropTargetRef.current = null;
          return;
        }
      }

      dropTargetRef.current = { nodeId: targetNodeId, parentId: targetParentId, zone };

      // Visual indicator
      if (zone === "inside") {
        showInsideIndicator(targetRow);

        // Auto-expand collapsed containers after delay
        if (!isExpanded(targetNodeId, expandedMapRef.current)) {
          if (autoExpandTargetRef.current !== targetNodeId) {
            clearAutoExpandTimer();
            autoExpandTargetRef.current = targetNodeId;
            autoExpandTimerRef.current = setTimeout(() => {
              setExpandedMap((prev) => ({ ...prev, [targetNodeId]: true }));
              autoExpandTargetRef.current = null;
            }, AUTO_EXPAND_DELAY);
          }
        }
      } else {
        showLineIndicator(rect, zone, targetDepth);
        clearAutoExpandTimer();
      }
    }

    function handleMouseUp() {
      const drag = dragRef.current;
      const drop = dropTargetRef.current;

      if (!drag || !drag.activated || !drop) {
        cleanup();
        return;
      }

      try {
        const currentNodes = nodesRef.current;
        const a = actionsRef.current;

        // Determine which nodes to move
        const sel = selectedRef.current;
        const selArr = sel instanceof Set ? Array.from(sel) : Array.isArray(sel) ? sel : [];
        const movingIds = selArr.length > 1 && selArr.includes(drag.nodeId)
          ? selArr.filter((id) => !UNDRAGGABLE.has(id) && !UNDRAGGABLE.has(currentNodes[id]?.data?.displayName || ""))
          : [drag.nodeId];

        if (drop.zone === "inside") {
          // Drop into the target as last child
          const targetChildren = getChildIds(currentNodes[drop.nodeId] as Record<string, unknown>);
          movingIds.forEach((id, i) => {
            try { a.move(id, drop.nodeId, targetChildren.length + i); } catch { /* ignore */ }
          });
        } else {
          // Drop above or below the target sibling
          const parentId = drop.parentId;
          if (!parentId) { cleanup(); return; }
          const parentChildren = getChildIds(currentNodes[parentId] as Record<string, unknown>);
          let baseIndex = parentChildren.indexOf(drop.nodeId);
          if (baseIndex === -1) baseIndex = parentChildren.length;
          if (drop.zone === "below") baseIndex += 1;

          movingIds.forEach((id, i) => {
            try { a.move(id, parentId, baseIndex + i); } catch { /* ignore */ }
          });
        }
      } catch (err) {
        console.warn("Layer drag-drop failed:", err);
      }

      cleanup();
    }

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && dragRef.current) {
        cleanup();
      }
    }

    document.addEventListener("mousemove", handleMouseMove, true);
    document.addEventListener("mouseup", handleMouseUp, true);
    document.addEventListener("keydown", handleKeyDown, true);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove, true);
      document.removeEventListener("mouseup", handleMouseUp, true);
      document.removeEventListener("keydown", handleKeyDown, true);
      cleanup();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Layer tree item ─
  const LayerItem = ({
    nodeId,
    depth = 0,
    parentId,
    siblingIndex = 0,
    siblingCount = 1,
  }: {
    nodeId: string;
    depth?: number;
    parentId?: string;
    siblingIndex?: number;
    siblingCount?: number;
  }) => {
    const node = nodes[nodeId];
    if (!node) return null;

    const expanded = isExpanded(nodeId, expandedMap);
    const childIds = getChildIds(node as Record<string, unknown>);
    const isSel = isNodeSelected(selected, nodeId);
    const hasChildren = childIds.length > 0;
    const props = (node.data?.props ?? {}) as Record<string, unknown>;
    const visibility = (props.visibility as string | undefined) ?? "visible";
    const locked = (props.locked as boolean | undefined) ?? false;

    let Icon = Box;
    const name = node.data.displayName || node.data.name || "";
    if (name === "Text") Icon = Type;
    else if (name === "Container") Icon = Layout;
    else if (name === "Image") Icon = ImageIcon;

    const openContextMenu = (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setContextMenu({ nodeId, x: e.clientX, y: e.clientY, parentId, siblingIndex, siblingCount });
    };

    return (
      <div className="flex flex-col gap-0 select-none relative">
        <div
          data-layer-id={nodeId}
          data-layer-parent={parentId || ""}
          data-layer-index={siblingIndex}
          data-layer-depth={depth}
          onMouseDown={(e) => handleLayerMouseDown(e, nodeId, parentId)}
          onClick={(e) => {
            if (dragRef.current?.activated) return;
            e.stopPropagation();
            const isMulti = e.ctrlKey || e.metaKey;
            startTransition(() => {
              if (isMulti) {
                const selArr = selected instanceof Set ? Array.from(selected) : Array.isArray(selected) ? selected : [];
                const next = new Set(selArr);
                if (next.has(nodeId)) next.delete(nodeId);
                else next.add(nodeId);
                actions.selectNode(next.size === 0 ? undefined : Array.from(next));
              } else {
                actions.selectNode(nodeId);
                // Scroll canvas to center the selected node, accounting for zoom/transform
                try {
                  const selectedNode = query.node(nodeId).get();
                  const selectedDisplayName = selectedNode?.data?.displayName ?? "";
                  let dom = selectedNode?.dom ?? null;

                  if (selectedDisplayName === "Viewport") {
                    const firstPageDom = document.querySelector<HTMLElement>("[data-viewport-desktop] [data-page-node='true']");
                    if (firstPageDom) {
                      dom = firstPageDom;
                    }
                  }

                  if (dom) {
                    const container = document.querySelector("[data-canvas-container]") as HTMLElement | null;
                    if (container) {
                      // getBoundingClientRect gives viewport-coords (already zoom-adjusted)
                      const nodeRect = dom.getBoundingClientRect();
                      const containerRect = container.getBoundingClientRect();

                      // Center of the node in viewport coords
                      const nodeCenterX = nodeRect.left + nodeRect.width / 2;
                      const nodeCenterY = nodeRect.top + nodeRect.height / 2;

                      // How far the center is from the container's center
                      const containerCenterX = containerRect.left + containerRect.width / 2;
                      const containerCenterY = containerRect.top + containerRect.height / 2;

                      // Delta to shift the scroll so the node is centered
                      const scrollDx = nodeCenterX - containerCenterX;
                      const scrollDy = nodeCenterY - containerCenterY;

                      container.scrollBy({ left: scrollDx, top: scrollDy, behavior: "smooth" });
                    } else {
                      // fallback
                      dom.scrollIntoView({ block: "nearest", inline: "nearest", behavior: "smooth" });
                    }
                  }
                } catch {
                  // node may not have a DOM yet
                }
              }
            });
          }}
          onContextMenu={openContextMenu}
          className={`
            group flex items-center gap-1 py-2 px-1 rounded-lg transition-colors relative
            ${isSel ? "bg-blue-400/20 text-white" : "text-white/80 hover:bg-brand-medium/20 hover:text-white"}
            cursor-pointer
          `}
          style={{ paddingLeft: `${depth * 10 + 5}px` }}
        >
          {/* Expansion Toggle */}
          <div
            data-layer-expand
            className={`
              p-1 rounded-md hover:bg-white/10 cursor-pointer shrink-0
              ${!hasChildren ? "opacity-0 pointer-events-none" : "opacity-100"}
            `}
            onClick={(e) => { e.stopPropagation(); toggleExpanded(nodeId); }}
            style={{ WebkitUserDrag: "none" } as React.CSSProperties}
          >
            <ChevronDown className={`w-4 h-4 layer-item-chevron ${expanded ? "expanded" : "collapsed"}`} />
          </div>

          <Icon className="w-4 h-4 opacity-70 shrink-0" style={{ WebkitUserDrag: "none" } as React.CSSProperties} />
          <span className="text-sm font-medium truncate flex-1 min-w-0">
            {name || "Node"}
          </span>
          {/* Visibility and Lock toggles (visible on hover or when selected) */}
          <div className={`flex items-center gap-0 shrink-0 ${isSel ? "opacity-100" : "opacity-0 group-hover:opacity-100"} transition-opacity`}>
            <button
              type="button"
              title={visibility === "hidden" ? "Show" : "Hide"}
              onClick={(e) => {
                e.stopPropagation();
                const next = visibility === "hidden" ? "visible" : "hidden";
                try {
                  actions.setProp(nodeId, (p: Record<string, unknown>) => { p.visibility = next; });
                } catch { /* skip */ }
              }}
              className={`p-1 rounded transition-colors ${visibility === "hidden" ? "text-brand-light" : "text-brand-medium hover:text-brand-lighter"}`}
            >
              {visibility === "hidden" ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
            <button
              type="button"
              title={locked ? "Unlock" : "Lock"}
              onClick={(e) => {
                e.stopPropagation();
                const next = !locked;
                try {
                  actions.setProp(nodeId, (p: Record<string, unknown>) => { p.locked = next; });
                } catch { /* skip */ }
              }}
              className={`p-1 rounded transition-colors ${locked ? "text-brand-light" : "text-brand-medium hover:text-brand-lighter"}`}
            >
              {locked ? <Lock size={14} /> : <LockOpen size={14} />}
            </button>
          </div>
        </div>

        {/* Children */}
        {hasChildren && (
          <div className={`layer-children-container ${expanded ? "expanded" : "collapsed"}`}>
            <div className="flex flex-col gap-1">
              {childIds.map((childId, index) => (
                <LayerItem
                  key={`${nodeId}-${childId}-${index}`}
                  nodeId={childId}
                  depth={depth + 1}
                  parentId={nodeId}
                  siblingIndex={index}
                  siblingCount={childIds.length}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  // ── Context menu portal ───────────────────────────────────
  const ContextMenuPortal = () => {
    if (!contextMenu) return null;
    const gap = 8;
    const viewportWidth = typeof window !== "undefined" ? window.innerWidth : 0;
    const viewportHeight = typeof window !== "undefined" ? window.innerHeight : 0;
    const estimatedMenuWidth = 220;
    const estimatedMenuHeight = 280;
    const openToLeft = contextMenu.x + estimatedMenuWidth > viewportWidth - gap;
    const openUpward = contextMenu.y + estimatedMenuHeight > viewportHeight - gap;

    const menuStyle: React.CSSProperties = {
      ...(openToLeft
        ? { right: Math.max(gap, viewportWidth - contextMenu.x) }
        : { left: Math.max(gap, contextMenu.x) }),
      ...(openUpward
        ? { bottom: Math.max(gap, viewportHeight - contextMenu.y) }
        : { top: Math.max(gap, contextMenu.y) }),
    };

    const nodeProtected = isProtected(contextMenu.nodeId);
    const nodeName = nodes[contextMenu.nodeId]?.data.displayName || "Node";
    const selectedIds = selectedToIds(selected);
    const canGroup = selectedIds.length >= 1;
    const canUngroup = selectedIds.length === 1 && (nodes[selectedIds[0]!]?.data?.displayName === "Container" || nodes[selectedIds[0]!]?.data?.displayName === "Group");

    return ReactDOM.createPortal(
      <div
        data-context-menu
        className="fixed z-[10050] min-w-[160px] max-h-[calc(100vh-16px)] overflow-y-auto bg-brand-darker border border-white/10 rounded-lg shadow-2xl px-2.5 py-1 text-sm"
        style={menuStyle}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-3 py-1.5 text-[10px] uppercase tracking-wider text-white/50 font-semibold border-b border-white/5">
          {nodeName}
        </div>
        <button
          onClick={() => handleSelect(contextMenu.nodeId)}
          className="flex items-center gap-2 w-full px-3 py-1.5 text-white hover:bg-white/10 transition-colors cursor-pointer"
        >
          <MousePointer2 className="w-3.5 h-3.5" />
          Select
        </button>
        <button
          onClick={() => !nodeProtected && handleDuplicate(contextMenu.nodeId)}
          disabled={nodeProtected}
          className={`flex items-center gap-2 w-full px-3 py-1.5 transition-colors ${nodeProtected ? "text-brand-light/30 cursor-not-allowed" : "text-brand-lighter hover:bg-white/10 cursor-pointer"
            }`}
        >
          <Copy className="w-3.5 h-3.5" />
          Duplicate
        </button>
        <button
          onClick={() => canGroup && handleGroup()}
          disabled={!canGroup}
          className={`flex items-center gap-2 w-full px-3 py-1.5 transition-colors ${!canGroup ? "text-brand-light/30 cursor-not-allowed" : "text-brand-lighter hover:bg-white/10 cursor-pointer"
            }`}
        >
          <Group className="w-3.5 h-3.5" />
          Group
        </button>
        <button
          onClick={() => canUngroup && handleUngroup()}
          disabled={!canUngroup}
          className={`flex items-center gap-2 w-full px-3 py-1.5 transition-colors ${!canUngroup ? "text-brand-light/30 cursor-not-allowed" : "text-brand-lighter hover:bg-white/10 cursor-pointer"
            }`}
        >
          <Ungroup className="w-3.5 h-3.5" />
          Ungroup
        </button>
        <div className="border-t border-white/5 my-0.5" />
        <button
          onClick={() => !nodeProtected && handleDelete(contextMenu.nodeId)}
          disabled={nodeProtected}
          className={`flex items-center gap-2 w-full px-3 py-1.5 transition-colors ${nodeProtected ? "text-brand-light/30 cursor-not-allowed" : "text-red-400 hover:bg-red-500/10 cursor-pointer"
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
