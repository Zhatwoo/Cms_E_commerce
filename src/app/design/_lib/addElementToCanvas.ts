// Adds a React element from a left-panel source onto the canvas, programmatically.
// Used as a reliable click-to-add fallback alongside drag-and-drop.
import React from "react";

type CraftNode = { data?: { displayName?: string; isCanvas?: boolean; parent?: string | null } };
type CraftQuery = {
  getState: () => { nodes?: Record<string, CraftNode>; events?: { selected?: unknown } };
  parseReactElement: (el: React.ReactElement) => { toNodeTree: () => unknown };
};

// Loose action surface: Craft's actual types vary by version, and we only need
// these methods. Cast at the call site keeps the helper widely compatible.
type CraftActions = Record<string, unknown>;

const CANVAS_DISPLAY_NAMES = new Set([
  "Page",
  "Viewport",
  "Section",
  "Container",
  "Row",
  "Column",
  "Frame",
  "Tab Content",
  "TabContent",
]);

function selectedToIds(raw: unknown): string[] {
  if (Array.isArray(raw)) return raw.filter((v) => typeof v === "string");
  if (raw instanceof Set) return Array.from(raw).filter((v) => typeof v === "string") as string[];
  if (raw && typeof raw === "object") return Object.keys(raw as Record<string, unknown>);
  return [];
}

function findCanvasAncestor(
  nodes: Record<string, CraftNode>,
  startId: string | null
): string | null {
  let current = startId;
  const visited = new Set<string>();
  while (current && !visited.has(current)) {
    visited.add(current);
    if (current === "ROOT") return null;
    const node = nodes[current];
    if (!node) return null;
    const displayName = node.data?.displayName ?? "";
    if (node.data?.isCanvas === true || CANVAS_DISPLAY_NAMES.has(displayName)) return current;
    current = node.data?.parent ?? null;
  }
  return null;
}

export function addElementToCanvas(
  query: CraftQuery,
  actions: CraftActions,
  element: React.ReactElement
): boolean {
  try {
    const state = query.getState();
    const nodes: Record<string, CraftNode> = (state.nodes ?? {}) as Record<string, CraftNode>;

    let targetId: string | null = null;

    // Prefer a selected canvas-like node so clicked items land where the user is focused.
    const selectedIds = selectedToIds(state.events?.selected);
    for (const id of selectedIds) {
      const candidate = findCanvasAncestor(nodes, id);
      if (candidate) {
        targetId = candidate;
        break;
      }
    }

    // Fall back to the first Page, then the first Viewport.
    if (!targetId) {
      const pageId = Object.keys(nodes).find((id) => nodes[id]?.data?.displayName === "Page");
      if (pageId) targetId = pageId;
    }
    if (!targetId) {
      const viewportId = Object.keys(nodes).find((id) => nodes[id]?.data?.displayName === "Viewport");
      if (viewportId) targetId = viewportId;
    }
    if (!targetId) return false;

    const nodeTree = query.parseReactElement(element).toNodeTree() as { rootNodeId?: string; root?: string };
    const newId = nodeTree.rootNodeId ?? nodeTree.root;

    const a = actions as { addNodeTree?: (t: unknown, p: string) => void; add?: (t: unknown, p: string) => void; selectNode?: (id: string) => void };
    if (typeof a.addNodeTree === "function") {
      a.addNodeTree(nodeTree, targetId);
    } else if (typeof a.add === "function") {
      a.add(nodeTree, targetId);
    } else {
      return false;
    }

    if (newId && typeof a.selectNode === "function") {
      setTimeout(() => {
        try { a.selectNode?.(newId); } catch { /* noop */ }
      }, 50);
    }
    return true;
  } catch {
    return false;
  }
}
