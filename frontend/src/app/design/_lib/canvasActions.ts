/**
 * Shared canvas actions: duplicate, copy/paste/cut, group/ungroup.
 * Used by KeyboardShortcuts, filesPanel, and CanvasContextMenu.
 */

import React from "react";
import type { NodeSelector } from "@craftjs/core";

// ─── Types ───────────────────────────────────────────────────────────────────

type EditorQuery = {
  serialize: () => string;
  getState: () => { nodes: Record<string, any>; events?: { selected?: unknown } };
  node: (id: string) => {
    get: () => { data?: { parent?: string | null; displayName?: string }; dom?: HTMLElement | null } | null;
    isDeletable: () => boolean;
    toNodeTree: () => any;
  };
  parseReactElement?: (el: React.ReactElement) => { toNodeTree: () => any };
};

type EditorActions = {
  deserialize: (json: string) => void;
  selectNode: (nodeIdSelector?: NodeSelector) => void;
  delete: (id: string | string[]) => void;
  move?: (nodeId: string, parentId: string, index: number) => void;
  setProp?: (id: string, cb: (props: Record<string, unknown>) => void) => void;
  addNodeTree?: (tree: any, parentId: string, index?: number) => void;
};

type CraftRawNode = {
  type: { resolvedName: string };
  isCanvas?: boolean;
  props: Record<string, unknown>;
  displayName: string;
  custom?: Record<string, unknown>;
  parent?: string;
  hidden?: boolean;
  nodes: string[];
  linkedNodes?: Record<string, string>;
};

const PROTECTED = new Set(["Viewport", "ROOT"]);

const CANVAS_DISPLAY_NAMES = new Set([
  "Page", "Section", "Container", "Row", "Column", "Frame",
  "Viewport", "Tab Content", "TabContent", "Banner",
]);

// ─── Utilities ───────────────────────────────────────────────────────────────

export function selectedToIds(selected: unknown): string[] {
  if (Array.isArray(selected)) return selected.filter((id) => id && id !== "ROOT");
  if (selected instanceof Set) return Array.from(selected).filter((id) => id && id !== "ROOT");
  if (selected && typeof selected === "object") return Object.keys(selected).filter((id) => id && id !== "ROOT");
  return [];
}

function parsePxValue(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const n = parseFloat(value.replace("px", ""));
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
}

function getRenderedScale(el: HTMLElement | null): { scaleX: number; scaleY: number } {
  if (!el) return { scaleX: 1, scaleY: 1 };
  const rect = el.getBoundingClientRect();
  const baseWidth = el.offsetWidth || el.clientWidth || 0;
  const baseHeight = el.offsetHeight || el.clientHeight || 0;
  const scaleX = baseWidth > 0 ? rect.width / baseWidth : 1;
  const scaleY = baseHeight > 0 ? rect.height / baseHeight : 1;
  return {
    scaleX: Number.isFinite(scaleX) && scaleX > 0.01 ? scaleX : 1,
    scaleY: Number.isFinite(scaleY) && scaleY > 0.01 ? scaleY : 1,
  };
}

function getNodePositionFallback(node: any): { left: number; top: number; width: number; height: number } | null {
  if (!node) return null;
  const props = node.props ?? node.data?.props ?? {};
  return {
    left: parsePxValue(props.left),
    top: parsePxValue(props.top),
    width: parsePxValue(props.width),
    height: parsePxValue(props.height),
  };
}

/** Generate a unique random ID not in existingIds. Adds it to the set. */
function generateId(existingIds: Set<string>): string {
  let id = "";
  do { id = Math.random().toString(36).slice(2, 11); } while (existingIds.has(id));
  existingIds.add(id);
  return id;
}

/** Find the Page node ID from the canvas tree. */
function findPageId(nodes: Record<string, any>): string | null {
  // ROOT is the Viewport — its direct children are Pages
  const viewportKids: string[] = nodes.ROOT?.data?.nodes ?? [];
  const page = viewportKids.find((id) => nodes[id]?.data?.displayName === "Page");
  return page ?? viewportKids[0] ?? null;
}

/** Walk up from nodeId to find the nearest canvas-capable ancestor (inclusive). */
function findNearestCanvas(nodeId: string, nodes: Record<string, any>): string | null {
  let curr: string | null = nodeId;
  while (curr && curr !== "ROOT") {
    const node: any = nodes[curr];
    if (!node) break;
    const dn: string = node.data?.displayName ?? "";
    const isCanvas: boolean = node.data?.isCanvas ?? false;
    if (isCanvas || CANVAS_DISPLAY_NAMES.has(dn)) return curr;
    curr = node.data?.parent ?? null;
  }
  return null;
}

// ─── Subtree extraction & ID remapping ───────────────────────────────────────

/**
 * Extract a clean, serializable snapshot of a subtree.
 * Uses query.serialize() + JSON to get the fully serialized form (resolvedName strings),
 * then filters to just the subtree nodes.
 * This is the safest approach — it uses CraftJS's own serialization path.
 */
function extractSubtree(rootId: string, liveNodes: Record<string, any>, _query: EditorQuery): Record<string, any> {
  const result: Record<string, any> = {};
  const visit = (id: string) => {
    if (!liveNodes[id] || result[id]) return;
    const n = liveNodes[id];
    const d = n.data ?? {};

    // Determine isCanvas correctly:
    // 1. If the component's craft config explicitly sets isCanvas, use that
    // 2. Otherwise, only treat as canvas if it actually has child nodes in the tree
    //    (avoids Button added with <Element canvas> being treated as a canvas on paste)
    const componentType = d.type;
    const craftIsCanvas: boolean | undefined = typeof componentType === "function"
      ? (componentType as any).craft?.isCanvas
      : undefined;
    const hasChildren = Array.isArray(d.nodes) && d.nodes.length > 0;
    const hasLinkedNodes = d.linkedNodes && Object.keys(d.linkedNodes).length > 0;
    const isCanvas = craftIsCanvas !== undefined
      ? craftIsCanvas
      : (hasChildren || hasLinkedNodes ? (d.isCanvas ?? false) : false);

    result[id] = {
      id,
      data: {
        type: d.type,
        isCanvas,
        props: JSON.parse(JSON.stringify(d.props ?? {})),
        displayName: d.displayName ?? "",
        custom: d.custom ? { ...d.custom } : {},
        hidden: d.hidden ?? false,
        nodes: Array.isArray(d.nodes) ? [...d.nodes] : [],
        linkedNodes: d.linkedNodes ? { ...d.linkedNodes } : {},
        parent: d.parent ?? null,
        name: d.name ?? d.displayName ?? "",
      },
    };
    (result[id].data.nodes as string[]).forEach(visit);
    Object.values(result[id].data.linkedNodes as Record<string, string>).forEach((lid) => {
      if (typeof lid === "string") visit(lid);
    });
  };
  visit(rootId);
  return result;
}

/**
 * Remap every node ID in a live-node subtree snapshot to fresh unique IDs.
 * Input/output nodes have shape: { id, data: { type (fn), props, nodes, linkedNodes, ... } }
 */
function remapSubtreeIds(
  rootId: string,
  nodes: Record<string, any>,
  existingIds: Set<string>
): { newRootId: string; remappedNodes: Record<string, any> } {
  // 1. Map every node ID → new node ID
  const nodeIdMap = new Map<string, string>();
  const collectNodeIds = (id: string) => {
    if (!nodes[id] || nodeIdMap.has(id)) return;
    nodeIdMap.set(id, generateId(existingIds));
    (nodes[id].data?.nodes ?? []).forEach(collectNodeIds);
    Object.values(nodes[id].data?.linkedNodes ?? {}).forEach((lid) => {
      if (typeof lid === "string" && nodes[lid]) collectNodeIds(lid);
    });
  };
  collectNodeIds(rootId);

  // 2. Map Tabs prop IDs → new IDs
  const tabIdMap = new Map<string, string>();
  const slotKeyMap = new Map<string, string>();
  for (const oldId of nodeIdMap.keys()) {
    const n = nodes[oldId];
    if (!n) continue;
    const tabs: Array<{ id: string; content?: string }> = n.data?.props?.tabs ?? [];
    for (const tab of tabs) {
      if (typeof tab.id !== "string" || tabIdMap.has(tab.id)) continue;
      const newTabId = `tab-${generateId(existingIds)}`;
      tabIdMap.set(tab.id, newTabId);
      const oldSlot = tab.content ?? `tab-content-${tab.id}`;
      slotKeyMap.set(oldSlot, `tab-content-${newTabId}`);
    }
  }

  const remap = (v: string): string =>
    nodeIdMap.get(v) ?? tabIdMap.get(v) ?? slotKeyMap.get(v) ?? v;

  const patchProps = (props: Record<string, any>): Record<string, any> => {
    const out: Record<string, any> = { ...props };
    if (typeof out.activeTabId === "string") out.activeTabId = remap(out.activeTabId);
    if (Array.isArray(out.tabs)) {
      out.tabs = out.tabs.map((tab: any) => ({
        ...tab,
        id: typeof tab.id === "string" ? remap(tab.id) : tab.id,
        content: typeof tab.content === "string" ? remap(tab.content) : tab.content,
      }));
    }
    return out;
  };

  // 3. Build remapped nodes — keep { id, data: {...} } shape, preserve component fn in type
  const remappedNodes: Record<string, any> = {};
  for (const [oldId, newId] of nodeIdMap.entries()) {
    const n = nodes[oldId];
    if (!n) continue;
    const d = n.data ?? {};
    remappedNodes[newId] = {
      id: newId,
      data: {
        type: d.type,                                        // preserve component function
        isCanvas: d.isCanvas ?? false,
        props: patchProps(d.props ?? {}),
        displayName: d.displayName ?? "",
        name: d.name ?? d.displayName ?? "",
        custom: d.custom ?? {},
        hidden: d.hidden ?? false,
        nodes: (d.nodes ?? []).map((cid: string) => nodeIdMap.get(cid) ?? cid),
        linkedNodes: Object.fromEntries(
          Object.entries(d.linkedNodes ?? {}).map(([k, v]) => [
            slotKeyMap.get(k) ?? k,
            nodeIdMap.get(v as string) ?? v,
          ])
        ),
        parent: d.parent && nodeIdMap.has(d.parent) ? nodeIdMap.get(d.parent) : d.parent,
      },
    };
  }

  return { newRootId: nodeIdMap.get(rootId) ?? rootId, remappedNodes };
}

// ─── Duplicate ───────────────────────────────────────────────────────────────

/** Duplicate nodes in-place (inserted right after the originals). */
export function duplicateNodes(
  actions: EditorActions,
  query: EditorQuery,
  nodeIds: string[]
): string[] {
  if (nodeIds.length === 0) return [];
  const newRootIds: string[] = [];
  try {
    const state = query.getState();
    const existingIds = new Set(Object.keys(state.nodes));

    // Sort by sibling order so duplicates appear in the right sequence
    const sorted = [...nodeIds].sort((a, b) => {
      const pa = state.nodes[a]?.data?.parent;
      const pb = state.nodes[b]?.data?.parent;
      if (pa !== pb) return 0;
      const sibs: string[] = state.nodes[pa]?.data?.nodes ?? [];
      return sibs.indexOf(a) - sibs.indexOf(b);
    });

    for (const nodeId of sorted) {
      const node = state.nodes[nodeId];
      if (!node || PROTECTED.has(node.data?.displayName)) continue;
      const parentId: string = node.data?.parent;
      if (!parentId || !state.nodes[parentId]) continue;

      const sibs: string[] = state.nodes[parentId].data?.nodes ?? [];
      const insertIndex = sibs.indexOf(nodeId) + 1; // right after original

      const subtree = extractSubtree(nodeId, state.nodes, query);
      const { newRootId, remappedNodes } = remapSubtreeIds(nodeId, subtree, existingIds);

      // remappedNodes are already in { id, data: { type (fn), ... } } shape
      (actions as any).addNodeTree({ rootNodeId: newRootId, nodes: remappedNodes }, parentId, insertIndex);
      newRootIds.push(newRootId);
    }
  } catch (e) {
    console.warn("[duplicateNodes] failed:", e);
  }
  return newRootIds;
}

// ─── Clipboard ───────────────────────────────────────────────────────────────

export interface ClipboardEntry {
  nodeIds: string[];
  /** Flat map of id → clean node snapshot (no live refs) */
  nodes: Record<string, any>;
  sourceParentsByRoot: Record<string, string | undefined>;
}

let clipboardRef: ClipboardEntry | null = null;

export function getClipboard(): ClipboardEntry | null {
  return clipboardRef;
}

/** Copy selected nodes to the in-memory clipboard. */
export function copySelection(query: EditorQuery, nodeIds: string[]): void {
  if (nodeIds.length === 0) return;
  try {
    const state = query.getState();
    const allNodes: Record<string, any> = {};
    const rootIds: string[] = [];
    const sourceParents: Record<string, string | undefined> = {};

    for (const id of nodeIds) {
      const node = state.nodes[id];
      if (!node) continue;
      Object.assign(allNodes, extractSubtree(id, state.nodes, query));
      rootIds.push(id);
      sourceParents[id] = node.data?.parent;
    }

    clipboardRef = { nodeIds: rootIds, nodes: allNodes, sourceParentsByRoot: sourceParents };
  } catch (e) {
    console.warn("[copySelection] failed:", e);
    clipboardRef = null;
  }
}

/** Cut = copy then delete. */
export function cutSelection(actions: EditorActions, query: EditorQuery, nodeIds: string[]): void {
  copySelection(query, nodeIds);
  if (nodeIds.length === 0) return;
  try {
    const state = query.getState();
    const deletable = nodeIds.filter((id) => {
      if (!state.nodes[id] || PROTECTED.has(state.nodes[id]?.data?.displayName)) return false;
      try { return query.node(id).isDeletable(); } catch { return false; }
    });
    if (deletable.length > 0) actions.delete(deletable.length === 1 ? deletable[0] : deletable);
    actions.selectNode();
  } catch (e) {
    console.warn("[cutSelection] failed:", e);
  }
}

// ─── Paste ───────────────────────────────────────────────────────────────────

/**
 * Resolve the best canvas parent to paste into, given an optional hint node.
 *
 * Strategy:
 *  1. If hintId is a canvas node → paste into it (append).
 *  2. If hintId is a non-canvas node → paste into its nearest canvas ancestor
 *     (sibling after hintId).
 *  3. No hint → paste into the Page (append).
 */
function resolvePasteTarget(
  nodes: Record<string, any>,
  hintId?: string
): { parentId: string; atIndex: number } | null {
  if (hintId && nodes[hintId]) {
    // Try the hint node itself first (if it's a canvas)
    const canvas = findNearestCanvas(hintId, nodes);
    if (canvas && nodes[canvas]) {
      const kids: string[] = nodes[canvas].data?.nodes ?? [];
      // If hint IS the canvas, append inside it
      if (canvas === hintId) return { parentId: canvas, atIndex: kids.length };
      // Otherwise insert after hintId inside the canvas
      const idx = kids.indexOf(hintId);
      return { parentId: canvas, atIndex: idx === -1 ? kids.length : idx + 1 };
    }
  }

  // Fall back to the Page
  const pageId = findPageId(nodes);
  if (pageId && nodes[pageId]) {
    const kids: string[] = nodes[pageId].data?.nodes ?? [];
    return { parentId: pageId, atIndex: kids.length };
  }

  return null;
}

/** Paste clipboard contents into the canvas. */
export function pasteClipboard(
  actions: EditorActions,
  query: EditorQuery,
  options?: { parentId?: string; atIndex?: number }
): string[] {
  const clip = clipboardRef;
  if (!clip || clip.nodeIds.length === 0) return [];

  try {
    const state = query.getState();
    const existingIds = new Set(Object.keys(state.nodes));
    const newRootIds: string[] = [];

    /** Convert remapped nodes to proper CraftJS live nodes with events/rules initialized */
    const toLiveNodes = (remappedNodes: Record<string, any>): Record<string, any> => {
      const live: Record<string, any> = {};
      for (const [nid, n] of Object.entries(remappedNodes)) {
        try {
          // parseFreshNode creates a proper live node with events, rules, dom initialized
          const liveNode = (query as any).parseFreshNode({ id: nid, data: n.data }).toNode();
          live[nid] = liveNode;
        } catch {
          // Fallback: manually add required CraftJS live node fields
          live[nid] = {
            ...n,
            events: { selected: false, dragged: false, hovered: false },
            rules: {
              canDrag: () => true,
              canDrop: () => true,
              canMoveIn: () => true,
              canMoveOut: () => true,
            },
            dom: null,
            related: {},
            _hydrationTimestamp: Date.now(),
          };
        }
      }
      return live;
    };

    /** Collect a subtree from clipboard (nodes have { id, data: {...} } shape) */
    const collectSubtree = (rootId: string): Record<string, any> => {
      const sub: Record<string, any> = {};
      const visit = (id: string) => {
        const n = clip.nodes[id];
        if (!n || sub[id]) return;
        sub[id] = n;
        (n.data?.nodes ?? []).forEach(visit);
        Object.values(n.data?.linkedNodes ?? {}).forEach((lid) => {
          if (typeof lid === "string" && clip.nodes[lid]) visit(lid);
        });
      };
      visit(rootId);
      return sub;
    };

    for (const rootId of clip.nodeIds) {
      const clipRoot = clip.nodes[rootId];
      const isPage = clipRoot?.data?.displayName === "Page" ||
        (typeof clipRoot?.data?.type === "object" && clipRoot?.data?.type?.resolvedName === "Page");

      // ── Page: paste to the right of the original ──────────────────────────
      if (isPage) {
        // ROOT is the Viewport in this canvas structure
        const viewportId = (() => {
          if (state.nodes.ROOT?.data?.displayName === "Viewport") return "ROOT";
          const frameId = state.nodes.ROOT?.data?.nodes?.[0];
          if (!frameId) return null;
          if (state.nodes[frameId]?.data?.displayName === "Viewport") return frameId;
          const vpId = state.nodes[frameId]?.data?.nodes?.[0];
          return vpId && state.nodes[vpId]?.data?.displayName === "Viewport" ? vpId : null;
        })();
        if (!viewportId) continue;

        const subtree = collectSubtree(rootId);
        const { newRootId, remappedNodes } = remapSubtreeIds(rootId, subtree, existingIds);

        // Position: right of source page
        const srcProps = clipRoot.data?.props ?? {};
        const pageW = parseFloat(String(srcProps.width ?? "1440").replace("px", "")) || 1440;
        const srcX = typeof srcProps.canvasX === "number" ? srcProps.canvasX : 100000;
        const srcY = typeof srcProps.canvasY === "number" ? srcProps.canvasY : 100000;
        const newCanvasX = srcX + pageW + 220;
        const newCanvasY = srcY;

        const pageCount = Object.values(state.nodes).filter((n: any) => n?.data?.displayName === "Page").length;
        const rootNode = remappedNodes[newRootId];
        if (rootNode?.data) {
          rootNode.data.props = { ...rootNode.data.props, canvasX: newCanvasX, canvasY: newCanvasY, pageName: `Page ${pageCount + 1}` };
        }

        (actions as any).addNodeTree({ rootNodeId: newRootId, nodes: toLiveNodes(remappedNodes) }, viewportId);
        newRootIds.push(newRootId);
        continue;
      }

      // ── Regular node: paste into nearest canvas parent ────────────────────
      let targetParentId: string;
      let atIndex: number;

      if (options?.parentId && state.nodes[options.parentId]) {
        const resolved = resolvePasteTarget(state.nodes, options.parentId);
        if (!resolved) continue;
        targetParentId = resolved.parentId;
        atIndex = resolved.parentId === options.parentId && options.atIndex !== undefined
          ? options.atIndex : resolved.atIndex;
      } else {
        const resolved = resolvePasteTarget(state.nodes);
        if (!resolved) continue;
        targetParentId = resolved.parentId;
        atIndex = resolved.atIndex;
      }

      if (!state.nodes[targetParentId]) continue;

      const subtree = collectSubtree(rootId);
      const { newRootId, remappedNodes } = remapSubtreeIds(rootId, subtree, existingIds);

      (actions as any).addNodeTree({ rootNodeId: newRootId, nodes: toLiveNodes(remappedNodes) }, targetParentId, atIndex);
      newRootIds.push(newRootId);
    }

    if (newRootIds.length > 0) {
      setTimeout(() => {
        try {
          // Only select if nodes actually exist in state
          const currentState = query.getState();
          const validIds = newRootIds.filter((id) => !!currentState.nodes[id]);
          if (validIds.length > 0) {
            actions.selectNode(validIds.length === 1 ? validIds[0] : validIds);
          }
        } catch { /* ignore */ }
      }, 100);
    }

    return newRootIds;
  } catch (e) {
    console.warn("[pasteClipboard] failed:", e);
    return [];
  }
}

/** Paste clipboard and replace the selected node(s). */
export function pasteToReplaceSelection(
  actions: EditorActions,
  query: EditorQuery,
  nodeIds: string[]
): string[] {
  if (nodeIds.length === 0) return [];
  const state = query.getState();
  const firstNode = state.nodes[nodeIds[0]];
  if (!firstNode) return [];
  const parentId: string = firstNode.data?.parent;
  if (!parentId || !state.nodes[parentId]) return [];
  const siblings: string[] = state.nodes[parentId]?.data?.nodes ?? [];
  const atIndex = siblings.indexOf(nodeIds[0]);
  if (atIndex === -1) return [];

  const pasted = pasteClipboard(actions, query, { parentId, atIndex });
  if (pasted.length === 0) return [];

  const deletable = nodeIds.filter((id) => {
    if (!state.nodes[id] || PROTECTED.has(state.nodes[id]?.data?.displayName)) return false;
    try { return query.node(id).isDeletable(); } catch { return false; }
  });
  if (deletable.length > 0) actions.delete(deletable.length === 1 ? deletable[0] : deletable);
  return pasted;
}

/** Paste an external image URL as an Image node. */
export function pasteExternalImage(
  actions: EditorActions,
  query: EditorQuery,
  src: string,
  options?: { parentId?: string; atIndex?: number }
): string | null {
  if (!src?.trim()) return null;
  try {
    const state = query.getState();
    const resolved = resolvePasteTarget(state.nodes, options?.parentId);
    if (!resolved) return null;
    const parentId = resolved.parentId;
    const atIndex = options?.atIndex ?? resolved.atIndex;

    const nodeId = `img-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    (actions as any).addNodeTree({
      rootNodeId: nodeId,
      nodes: {
        [nodeId]: {
          id: nodeId,
          data: {
            type: { resolvedName: "Image" },
            isCanvas: false,
            props: { src: src.trim(), alt: "Pasted Image", objectFit: "cover", width: "320px", height: "220px" },
            displayName: "Image",
            custom: {},
            hidden: false,
            nodes: [],
            linkedNodes: {},
            parent: null,
          },
        },
      },
    }, parentId, atIndex);
    actions.selectNode(nodeId);
    return nodeId;
  } catch (e) {
    console.warn("[pasteExternalImage] failed:", e);
    return null;
  }
}

// ─── Group / Ungroup ─────────────────────────────────────────────────────────

const UNGROUPABLE_TYPES = new Set(["Container", "Section", "Row", "Column", "Banner", "Frame"]);

export function groupSelection(
  actions: EditorActions & { parseReactElement?: any },
  query: EditorQuery & { parseReactElement?: (el: React.ReactElement) => { toNodeTree: () => any } },
  nodeIds: string[],
  containerComponent: React.ComponentType<any>,
  elementComponent: React.ComponentType<any>,
): string | null {
  if (nodeIds.length < 2) return null;
  try {
    const state = query.getState();
    const parentId: string = state.nodes[nodeIds[0]]?.data?.parent;
    if (!parentId || !state.nodes[parentId]) return null;
    if (!nodeIds.every((id) => state.nodes[id]?.data?.parent === parentId)) return null;

    const siblings: string[] = state.nodes[parentId]?.data?.nodes ?? [];
    const indices = nodeIds.map((id) => siblings.indexOf(id)).filter((i) => i >= 0);
    if (indices.length === 0) return null;
    const insertIndex = Math.min(...indices);

    const parentNode = state.nodes[parentId];
    const parentDisplayName: string = parentNode?.data?.displayName ?? "";
    const parentProps = parentNode?.data?.props ?? {};
    const parentDisplay = String(parentProps.display ?? "").toLowerCase();
    const parentIsFreeform =
      parentDisplayName === "Page" || parentDisplayName === "Viewport" ||
      (parentDisplayName === "Frame" && parentDisplay !== "flex" && parentDisplay !== "grid");

    const parentDom = query.node(parentId).get()?.dom ?? null;
    const parentRect = parentDom?.getBoundingClientRect() ?? null;
    const parentScale = getRenderedScale(parentDom);

    const nodeOffsets = new Map<string, { left: number; top: number }>();
    let minLeft = Infinity, minTop = Infinity, maxRight = -Infinity, maxBottom = -Infinity;

    if (parentIsFreeform && parentRect) {
      nodeIds.forEach((id) => {
        const dom = query.node(id).get()?.dom ?? null;
        if (dom) {
          const r = dom.getBoundingClientRect();
          const left = (r.left - parentRect.left) / parentScale.scaleX;
          const top = (r.top - parentRect.top) / parentScale.scaleY;
          const w = r.width / parentScale.scaleX;
          const h = r.height / parentScale.scaleY;
          nodeOffsets.set(id, { left, top });
          minLeft = Math.min(minLeft, left); minTop = Math.min(minTop, top);
          maxRight = Math.max(maxRight, left + w); maxBottom = Math.max(maxBottom, top + h);
        } else {
          const fb = getNodePositionFallback(state.nodes[id]);
          if (fb) {
            nodeOffsets.set(id, { left: fb.left, top: fb.top });
            minLeft = Math.min(minLeft, fb.left); minTop = Math.min(minTop, fb.top);
            maxRight = Math.max(maxRight, fb.left + fb.width); maxBottom = Math.max(maxBottom, fb.top + fb.height);
          }
        }
      });
    }

    const parseEl = query.parseReactElement ?? (query as any).parseReactElement;
    if (!parseEl) return null;
    const groupEl = React.createElement(elementComponent, {
      is: containerComponent, canvas: true, background: "transparent", padding: 0,
      width: "fit-content", height: "fit-content",
      display: parentIsFreeform ? "block" : "flex",
      flexDirection: parentIsFreeform ? undefined : "column",
      position: "relative",
    });
    const tree = parseEl(groupEl).toNodeTree();
    const groupNodeId: string = tree.rootNodeId;
    (actions as any).addNodeTree(tree, parentId, insertIndex);

    const sorted = [...nodeIds].sort((a, b) => siblings.indexOf(a) - siblings.indexOf(b));
    sorted.forEach((id, i) => { try { actions.move?.(id, groupNodeId, i); } catch { /* skip */ } });

    if (parentIsFreeform && nodeOffsets.size > 0 && isFinite(minLeft) && isFinite(minTop)) {
      const w = Math.max(1, Math.round(maxRight - minLeft));
      const h = Math.max(1, Math.round(maxBottom - minTop));
      actions.setProp?.(groupNodeId, (p) => {
        p.position = "relative"; p.top = `${Math.round(minTop)}px`; p.left = `${Math.round(minLeft)}px`;
        p.right = "auto"; p.bottom = "auto"; p.width = `${w}px`; p.height = `${h}px`;
        p.display = "block"; p.padding = 0; p.paddingTop = 0; p.paddingRight = 0;
        p.paddingBottom = 0; p.paddingLeft = 0; p.marginTop = 0; p.marginRight = 0;
        p.marginBottom = 0; p.marginLeft = 0;
      });
      sorted.forEach((id) => {
        const off = nodeOffsets.get(id);
        if (!off) return;
        actions.setProp?.(id, (p) => {
          p.position = "absolute"; p.left = `${Math.round(off.left - minLeft)}px`;
          p.top = `${Math.round(off.top - minTop)}px`; p.right = "auto"; p.bottom = "auto";
          p.marginTop = 0; p.marginLeft = 0;
        });
      });
    }

    actions.selectNode(groupNodeId);
    return groupNodeId;
  } catch (e) {
    console.warn("[groupSelection] failed:", e);
    return null;
  }
}

export function ungroupSelection(
  actions: EditorActions,
  query: EditorQuery,
  nodeIds: string[]
): string[] {
  if (nodeIds.length !== 1) return [];
  const groupId = nodeIds[0];
  try {
    const state = query.getState();
    const groupNode = state.nodes[groupId];
    if (!groupNode) return [];
    const displayName: string = groupNode.data?.displayName ?? "";
    if (!UNGROUPABLE_TYPES.has(displayName)) return [];
    const parentId: string = groupNode.data?.parent;
    if (!parentId || !state.nodes[parentId]) return [];
    const childIds: string[] = groupNode.data?.nodes ?? [];
    if (childIds.length === 0) return [];

    const groupProps = groupNode.data?.props ?? {};
    const groupLeft = parsePxValue(groupProps.left);
    const groupTop = parsePxValue(groupProps.top);

    const parentDom = query.node(parentId).get()?.dom ?? null;
    const parentRect = parentDom?.getBoundingClientRect() ?? null;
    const parentScale = getRenderedScale(parentDom);
    const childPositions = new Map<string, { left: number; top: number }>();

    if (parentRect) {
      childIds.forEach((id) => {
        const dom = query.node(id).get()?.dom ?? null;
        if (dom) {
          const r = dom.getBoundingClientRect();
          childPositions.set(id, {
            left: (r.left - parentRect.left) / parentScale.scaleX,
            top: (r.top - parentRect.top) / parentScale.scaleY,
          });
        } else {
          const cp = state.nodes[id]?.data?.props ?? {};
          childPositions.set(id, { left: groupLeft + parsePxValue(cp.left), top: groupTop + parsePxValue(cp.top) });
        }
      });
    }

    const parentSibs: string[] = state.nodes[parentId]?.data?.nodes ?? [];
    let insertIndex = parentSibs.indexOf(groupId);
    if (insertIndex < 0) insertIndex = parentSibs.length;

    const movedIds: string[] = [];
    childIds.forEach((id, i) => {
      try { actions.move?.(id, parentId, insertIndex + i); movedIds.push(id); } catch { /* skip */ }
    });

    if (movedIds.length > 0 && childPositions.size > 0) {
      actions.setProp?.(parentId, (p) => { if (!p.position || p.position === "static") p.position = "relative"; });
      movedIds.forEach((id) => {
        const pos = childPositions.get(id);
        if (!pos) return;
        actions.setProp?.(id, (p) => {
          p.position = "absolute"; p.left = `${Math.round(pos.left)}px`; p.top = `${Math.round(pos.top)}px`;
          p.right = "auto"; p.bottom = "auto"; p.marginTop = 0; p.marginRight = 0; p.marginBottom = 0; p.marginLeft = 0;
        });
      });
    }

    try { actions.delete(groupId); } catch { /* skip */ }
    if (movedIds.length > 0) actions.selectNode(movedIds.length === 1 ? movedIds[0] : movedIds);
    return movedIds;
  } catch (e) {
    console.warn("[ungroupSelection] failed:", e);
    return [];
  }
}
