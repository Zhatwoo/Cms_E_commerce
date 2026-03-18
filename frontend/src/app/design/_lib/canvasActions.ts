/**
 * Shared canvas actions: duplicate, copy/paste/cut, group/ungroup.
 * Used by KeyboardShortcuts, filesPanel, and CanvasContextMenu for Figma-like UX.
 */

import React from "react";
import type { NodeSelector } from "@craftjs/core";

/** Minimal query/actions types to avoid @craftjs/core internal type dependency */
type EditorQuery = {
  serialize: () => string;
  getState: () => { nodes: Record<string, any>; events?: { selected?: unknown } };
  node: (id: string) => { get: () => { data?: { parent?: string | null; displayName?: string }; dom?: HTMLElement | null } | null; isDeletable: () => boolean };
};

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

function getNodePositionFallback(node: CraftRawNode | undefined): { left: number; top: number; width: number; height: number } | null {
  if (!node) return null;
  const props = node.props ?? {};
  const left = parsePxValue(props.left);
  const top = parsePxValue(props.top);
  const width = parsePxValue(props.width);
  const height = parsePxValue(props.height);
  return { left, top, width, height };
}
type EditorActions = {
  deserialize: (json: string) => void;
  selectNode: (nodeIdSelector?: NodeSelector) => void;
  delete: (id: string | string[]) => void;
  move?: (nodeId: string, parentId: string, index: number) => void;
};

const PROTECTED = new Set(["Viewport", "ROOT"]);

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

type CraftData = Record<string, CraftRawNode>;

function canonicalResolvedName(rawName: unknown): string {
  const name = typeof rawName === "string" ? rawName.trim() : "";
  if (!name) return "Container";
  const lowered = name.toLowerCase();
  if (lowered === "image") return "Image";
  if (lowered === "text") return "Text";
  if (lowered === "container" || lowered === "group") return "Container";
  if (lowered === "page") return "Page";
  if (lowered === "viewport") return "Viewport";
  if (lowered.includes("image")) return "Image";
  if (lowered.includes("text")) return "Text";
  if (lowered.includes("container") || lowered.includes("group")) return "Container";
  if (lowered.includes("page")) return "Page";
  if (lowered.includes("viewport")) return "Viewport";
  return name;
}

/**
 * Craft.js can serialize in two shapes:
 * 1) Storage: { id: { type, nodes, props, displayName, parent, ... } }
 * 2) State:   { id: { type, data: { nodes, props, displayName, parent, ... } } }
 * Normalize to flat shape so duplicate/paste work correctly.
 */
function normalizeParsedToFlat(parsed: Record<string, unknown>): CraftData {
  const result: CraftData = {};
  for (const [id, value] of Object.entries(parsed)) {
    if (!value || typeof value !== "object") continue;
    const v = value as Record<string, unknown>;
    const data = v.data as Record<string, unknown> | undefined;
    const typeObj = (v.type as { resolvedName?: string }) || (data?.type as { resolvedName?: string });
    const resolvedName =
      (typeof typeObj?.resolvedName === "string" ? typeObj.resolvedName : null) ??
      (typeof data?.displayName === "string" ? data.displayName : null) ??
      (typeof v.displayName === "string" ? v.displayName : null) ??
      "Unknown";
    const nodes = (data?.nodes ?? v.nodes) as string[] | undefined;
    const props = (data?.props ?? v.props) as Record<string, unknown> | undefined;
    const parent = (data?.parent ?? v.parent) as string | undefined;
    result[id] = {
      type: { resolvedName },
      isCanvas: (v.isCanvas as boolean) ?? false,
      props: props ?? {},
      displayName: (data?.displayName as string) ?? (v.displayName as string) ?? resolvedName,
      custom: (v.custom as Record<string, unknown>) ?? {},
      parent,
      hidden: (v.hidden as boolean) ?? false,
      nodes: Array.isArray(nodes) ? nodes : [],
      linkedNodes: ((data?.linkedNodes ?? v.linkedNodes) as Record<string, string>) ?? {},
    };
  }
  return result;
}

function sanitizeCraftData(data: CraftData): CraftData {
  Object.keys(data).forEach((id) => {
    const node = data[id];
    if (!node || typeof node !== "object") return;
    const currentName = node?.type?.resolvedName;
    const canonical = canonicalResolvedName(currentName);
    if (!node.type || typeof node.type !== "object") {
      node.type = { resolvedName: canonical };
    } else {
      node.type.resolvedName = canonical;
    }
    node.displayName = canonical;
    if (!Array.isArray(node.nodes)) node.nodes = [];
  });
  return data;
}

/** Normalize selection to string[] */
export function selectedToIds(selected: unknown): string[] {
  if (Array.isArray(selected)) return selected.filter((id) => id && id !== "ROOT");
  if (selected instanceof Set) return Array.from(selected).filter((id) => id && id !== "ROOT");
  if (selected && typeof selected === "object") return Object.keys(selected).filter((id) => id && id !== "ROOT");
  return [];
}

function getChildIds(node: CraftRawNode | null | undefined): string[] {
  if (!node || !Array.isArray(node.nodes)) return [];
  return node.nodes;
}

function generateId(existingIds: Set<string>): string {
  let id = "";
  do {
    id = Math.random().toString(36).slice(2, 11);
  } while (existingIds.has(id));
  existingIds.add(id);
  return id;
}

/** Clone subtree in serialized data; returns new root id. */
function cloneSubtree(
  data: CraftData,
  sourceId: string,
  newParentId: string,
  existingIds: Set<string>
): string | null {
  const sourceNode = data[sourceId];
  if (!sourceNode) return null;
  const newId = generateId(existingIds);
  const childIds = getChildIds(sourceNode);
  const clonedNode: CraftRawNode = {
    ...sourceNode,
    parent: newParentId,
    nodes: [],
  };
  for (const childId of childIds) {
    const clonedChildId = cloneSubtree(data, childId, newId, existingIds);
    if (clonedChildId) clonedNode.nodes.push(clonedChildId);
  }
  data[newId] = clonedNode;
  return newId;
}

/** Duplicate one or more nodes (each clone inserted after its original). */
export function duplicateNodes(
  actions: EditorActions,
  query: EditorQuery,
  nodeIds: string[]
): string[] {
  if (nodeIds.length === 0) return [];
  try {
    const serialized = query.serialize();
    const parsed = JSON.parse(serialized) as Record<string, unknown>;
    const data = normalizeParsedToFlat(parsed);
    const existingIds = new Set(Object.keys(data));
    const clonedIds: string[] = [];

    for (const nodeId of nodeIds) {
      const original = data[nodeId];
      if (!original || PROTECTED.has(original.displayName)) continue;
      const parentId = original.parent;
      if (!parentId || !data[parentId]) continue;

      const clonedRootId = cloneSubtree(data, nodeId, parentId, existingIds);
      if (!clonedRootId) continue;
      clonedIds.push(clonedRootId);

      const parentNode = data[parentId];
      const siblings = [...getChildIds(parentNode)];
      const index = siblings.indexOf(nodeId);
      const insertIndex = index === -1 ? siblings.length : index + 1;
      siblings.splice(insertIndex, 0, clonedRootId);
      parentNode.nodes = siblings;
    }

    if (clonedIds.length > 0) {
      actions.deserialize(JSON.stringify(sanitizeCraftData(data)));
      actions.selectNode(clonedIds.length === 1 ? clonedIds[0] : clonedIds);
      return clonedIds;
    }
  } catch (e) {
    console.warn("duplicateNodes failed:", e);
  }
  return [];
}

// ─── Clipboard (in-memory, survives re-renders) ─────────────────────────────

export interface ClipboardEntry {
  nodeIds: string[];
  nodes: CraftData; // id -> node (with new ids already applied when pasted)
  sourceParentsByRoot: Record<string, string | undefined>;
}

let clipboardRef: ClipboardEntry | null = null;

function isPageNode(node: CraftRawNode | undefined): boolean {
  return Boolean(node && node.displayName === "Page");
}

function isViewportNode(node: CraftRawNode | undefined): boolean {
  return Boolean(node && node.displayName === "Viewport");
}

function firstPageUnder(data: CraftData, parentId: string | undefined): string | null {
  if (!parentId || !data[parentId]) return null;
  const children = getChildIds(data[parentId]);
  for (const id of children) {
    if (isPageNode(data[id])) return id;
  }
  return null;
}

function resolveDestinationPageForNonPagePaste(
  data: CraftData,
  targetParentId: string,
  atIndex: number
): string | null {
  const targetParent = data[targetParentId];
  if (isPageNode(targetParent)) return targetParentId;

  if (targetParentId === "ROOT") {
    const rootChildren = getChildIds(data.ROOT);
    const inferredIndex = Math.max(0, Math.min(rootChildren.length - 1, atIndex - 1));
    const inferredNodeId = rootChildren[inferredIndex];
    if (inferredNodeId && isPageNode(data[inferredNodeId])) {
      return inferredNodeId;
    }

    const firstDirectPage = firstPageUnder(data, "ROOT");
    if (firstDirectPage) return firstDirectPage;

    const viewportId = rootChildren.find((id) => isViewportNode(data[id]));
    if (viewportId) {
      const firstViewportPage = firstPageUnder(data, viewportId);
      if (firstViewportPage) return firstViewportPage;
    }
  }

  if (isViewportNode(targetParent)) {
    return firstPageUnder(data, targetParentId);
  }

  return null;
}

export function getClipboard(): ClipboardEntry | null {
  return clipboardRef;
}

/** Copy selected subtrees to clipboard (Craft JSON, ROOT stripped). */
export function copySelection(
  query: EditorQuery,
  nodeIds: string[]
): void {
  if (nodeIds.length === 0) return;
  try {
    const serialized = query.serialize();
    const parsed = JSON.parse(serialized) as Record<string, unknown>;
    const full = normalizeParsedToFlat(parsed);
    const nodeIdsSet = new Set(nodeIds);
    const collectIds = (id: string): string[] => {
      const node = full[id];
      if (!node) return [];
      const out = [id];
      for (const c of getChildIds(node)) out.push(...collectIds(c));
      return out;
    };
    const allIds: string[] = [];
    for (const id of nodeIds) allIds.push(...collectIds(id));
    const uniqueIds = [...new Set(allIds)];

    const existingIds = new Set<string>(uniqueIds);
    const data: CraftData = {};
    const idMap = new Map<string, string>(); // oldId -> newId

    for (const oldId of uniqueIds) {
      const newId = generateId(existingIds);
      idMap.set(oldId, newId);
    }

    for (const oldId of uniqueIds) {
      const node = full[oldId];
      if (!node) continue;
      const newId = idMap.get(oldId)!;
      const newParent = node.parent ? idMap.get(node.parent) ?? node.parent : undefined;
      const newChildIds = getChildIds(node).map((c) => idMap.get(c) ?? c);
      data[newId] = {
        ...node,
        parent: newParent,
        nodes: newChildIds,
      };
    }

    clipboardRef = {
      nodeIds: nodeIds.map((id) => idMap.get(id)!).filter(Boolean),
      nodes: data,
      sourceParentsByRoot: Object.fromEntries(
        nodeIds.map((oldId) => [idMap.get(oldId)!, full[oldId]?.parent])
      ),
    };
  } catch (e) {
    console.warn("copySelection failed:", e);
    clipboardRef = null;
  }
}

/** Paste clipboard into parent at index; returns pasted root ids. */
export function pasteClipboard(
  actions: EditorActions,
  query: EditorQuery,
  options?: { parentId?: string; atIndex?: number }
): string[] {
  const clip = clipboardRef;
  if (!clip || clip.nodeIds.length === 0) return [];

  try {
    const serialized = query.serialize();
    const parsed = JSON.parse(serialized) as Record<string, unknown>;
    const data = normalizeParsedToFlat(parsed);
    const existingIds = new Set(Object.keys(data));

    let targetParentId = options?.parentId;
    let atIndex = options?.atIndex ?? -1;

    if (!targetParentId || !data[targetParentId]) {
      const root = data.ROOT;
      const viewportId = root && Array.isArray(root.nodes) ? root.nodes[0] : null;
      if (viewportId && data[viewportId]) {
        const viewportKids = getChildIds(data[viewportId]);
        const firstPageId = viewportKids[0];
        if (firstPageId && data[firstPageId]) {
          const pageKids = getChildIds(data[firstPageId]);
          const firstContainerId = pageKids[0];
          targetParentId = firstContainerId && data[firstContainerId] ? firstContainerId : firstPageId;
          atIndex = targetParentId === firstPageId ? 0 : getChildIds(data[targetParentId]).length;
        } else {
          targetParentId = viewportId;
          atIndex = 0;
        }
      } else {
        targetParentId = viewportId ?? "ROOT";
        atIndex = 0;
      }
    }

    if (!targetParentId || !data[targetParentId]) return [];

    const clipRootNames = clip.nodeIds
      .map((id) => clip.nodes[id]?.displayName)
      .filter((name): name is string => typeof name === "string");
    const hasPageClipboardRoot = clipRootNames.some((name) => name === "Page");
    if (!hasPageClipboardRoot) {
      const resolvedPageId = resolveDestinationPageForNonPagePaste(data, targetParentId, atIndex);
      if (resolvedPageId && data[resolvedPageId]) {
        targetParentId = resolvedPageId;
        atIndex = getChildIds(data[targetParentId]).length;
      }
    }

    if (!targetParentId || !data[targetParentId]) return [];

    const idMap = new Map<string, string>();
    for (const oldId of Object.keys(clip.nodes)) {
      const newId = generateId(existingIds);
      idMap.set(oldId, newId);
    }

    const targetChildren = getChildIds(data[targetParentId]);
    if (atIndex < 0) atIndex = targetChildren.length;

    for (const [oldId, node] of Object.entries(clip.nodes)) {
      const newId = idMap.get(oldId)!;
      const newParent = node.parent ? idMap.get(node.parent) ?? node.parent : undefined;
      const newChildIds = node.nodes.map((c) => idMap.get(c) ?? c);
      data[newId] = {
        ...node,
        parent: newParent,
        nodes: newChildIds,
      };
    }

    const rootIds = clip.nodeIds.map((id) => idMap.get(id)!).filter(Boolean);
    for (const rootId of rootIds) {
      const rootNode = data[rootId];
      if (rootNode) {
        rootNode.parent = targetParentId;
      }
    }

    const parentNode = data[targetParentId];
    const newSiblings = [...parentNode.nodes];
    newSiblings.splice(atIndex, 0, ...rootIds);
    parentNode.nodes = newSiblings;

    actions.deserialize(JSON.stringify(sanitizeCraftData(data)));
    actions.selectNode(rootIds.length === 1 ? rootIds[0] : rootIds);
    return rootIds;
  } catch (e) {
    console.warn("pasteClipboard failed:", e);
    return [];
  }
}

/** Paste an external image source (url/data-url) as an Image node. */
export function pasteExternalImage(
  actions: EditorActions,
  query: EditorQuery,
  src: string,
  options?: { parentId?: string; atIndex?: number }
): string | null {
  if (typeof src !== "string" || src.trim().length === 0) return null;

  try {
    const state = query.getState();
    const fallback = resolvePasteTargetForExternal(state);
    const parentId = options?.parentId ?? fallback.parentId;
    const atIndex = options?.atIndex ?? fallback.atIndex;
    if (!parentId || !state.nodes[parentId]) return null;

    const nodeId = `image-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const tree = {
      rootNodeId: nodeId,
      nodes: {
        [nodeId]: {
          type: { resolvedName: "Image" },
          isCanvas: false,
          props: {
            src: src.trim(),
            alt: "Pasted Image",
            objectFit: "cover",
            width: "320px",
            height: "220px",
            _autoFitInTabs: false,
          },
          displayName: "Image",
          nodes: [],
          linkedNodes: {},
          custom: {},
          hidden: false,
        },
      },
    };

    const addNodeTree = (actions as unknown as {
      addNodeTree?: (tree: any, parentId?: string, index?: number) => void;
    }).addNodeTree;

    if (typeof addNodeTree !== "function") return null;
    addNodeTree(tree, parentId, atIndex);
    actions.selectNode(nodeId);
    return nodeId;
  } catch (e) {
    console.warn("pasteExternalImage failed:", e);
    return null;
  }
}

function resolvePasteTargetForExternal(state: { nodes: Record<string, any>; events?: { selected?: unknown } }): {
  parentId?: string;
  atIndex?: number;
} {
  const selectedIds = selectedToIds(state.events?.selected);
  let parentId: string | undefined;
  let atIndex: number | undefined;

  if (selectedIds.length > 0) {
    const firstId = selectedIds[0];
    const lastId = selectedIds[selectedIds.length - 1];
    const firstNode = state.nodes[firstId];
    const lastNode = state.nodes[lastId];
    parentId = firstNode?.data?.parent as string | undefined;
    if (parentId && state.nodes[parentId]) {
      const siblings = (state.nodes[parentId]?.data?.nodes as string[]) ?? [];
      const lastIndex = siblings.indexOf(lastId);
      atIndex = lastIndex === -1 ? siblings.length : lastIndex + 1;
    }
  }

  if (!parentId || !state.nodes[parentId]) {
    const root = state.nodes.ROOT;
    const viewportId = root?.data?.nodes?.[0] as string | undefined;
    if (viewportId && state.nodes[viewportId]) {
      const viewportKids = (state.nodes[viewportId]?.data?.nodes as string[]) ?? [];
      const firstPageId = viewportKids[0];
      if (firstPageId && state.nodes[firstPageId]) {
        const pageKids = (state.nodes[firstPageId]?.data?.nodes as string[]) ?? [];
        const firstContainerId = pageKids[0];
        parentId = firstContainerId && state.nodes[firstContainerId] ? firstContainerId : firstPageId;
        atIndex =
          parentId === firstPageId
            ? 0
            : ((state.nodes[parentId]?.data?.nodes as string[]) ?? []).length;
      } else {
        parentId = viewportId;
        atIndex = 0;
      }
    }
  }

  return { parentId, atIndex };
}

// ─── Group / Ungroup (Figma-style) ──────────────────────────────────────────

const UNGROUPABLE_TYPES = new Set([
  "Container", "Section", "Row", "Column", "Banner", "Frame",
]);

/**
 * Group selected nodes into a new Container.
 * Uses native Craft.js parseReactElement + addNodeTree + move.
 * `containerComponent` must be the Container React component,
 * `elementComponent` must be Craft.js `Element`.
 */
export function groupSelection(
  actions: EditorActions & {
    addNodeTree: (tree: any, parentId: string, index?: number) => void;
    setProp: (id: string, cb: (props: Record<string, unknown>) => void) => void;
  },
  query: EditorQuery & {
    parseReactElement: (el: React.ReactElement) => { toNodeTree: () => any };
  },
  nodeIds: string[],
  containerComponent: React.ComponentType<any>,
  elementComponent: React.ComponentType<any>,
): string | null {
  if (nodeIds.length < 2) return null;
  try {
    const state = query.getState();
    const parentId = state.nodes[nodeIds[0]]?.data?.parent as string | undefined;
    if (!parentId || !state.nodes[parentId]) return null;

    const allSameParent = nodeIds.every(
      (id) => (state.nodes[id]?.data?.parent as string) === parentId,
    );
    if (!allSameParent) return null;

    const siblings = (state.nodes[parentId]?.data?.nodes as string[]) ?? [];
    const indices = nodeIds.map((id) => siblings.indexOf(id)).filter((i) => i >= 0);
    if (indices.length === 0) return null;
    const insertIndex = Math.min(...indices);

    const parentNode = state.nodes[parentId];
    const parentDisplayName = parentNode?.data?.displayName as string | undefined;
    const parentProps = (parentNode?.data?.props ?? {}) as Record<string, unknown>;
    const parentDisplay = String(parentProps.display ?? "").toLowerCase();
    const parentIsFlexOrGrid = parentDisplay === "flex" || parentDisplay === "grid";
    const parentIsFreeform =
      parentProps.isFreeform === true ||
      parentDisplayName === "Page" ||
      parentDisplayName === "Viewport" ||
      (!parentIsFlexOrGrid && parentDisplayName === "Frame");

    const parentDom = query.node(parentId).get()?.dom ?? null;
    const parentRect = parentDom?.getBoundingClientRect() ?? null;
    const parentScale = getRenderedScale(parentDom);

    const nodeOffsets = new Map<string, { left: number; top: number }>();
    let minLeft = Number.POSITIVE_INFINITY;
    let minTop = Number.POSITIVE_INFINITY;
    let maxRight = Number.NEGATIVE_INFINITY;
    let maxBottom = Number.NEGATIVE_INFINITY;

    if (parentIsFreeform && parentRect) {
      nodeIds.forEach((id) => {
        const nodeDom = query.node(id).get()?.dom ?? null;
        if (nodeDom) {
          const rect = nodeDom.getBoundingClientRect();
          const left = (rect.left - parentRect.left) / parentScale.scaleX;
          const top = (rect.top - parentRect.top) / parentScale.scaleY;
          const width = rect.width / parentScale.scaleX;
          const height = rect.height / parentScale.scaleY;
          nodeOffsets.set(id, { left, top });
          minLeft = Math.min(minLeft, left);
          minTop = Math.min(minTop, top);
          maxRight = Math.max(maxRight, left + width);
          maxBottom = Math.max(maxBottom, top + height);
          return;
        }

        const fallback = getNodePositionFallback(state.nodes[id]?.data as CraftRawNode | undefined);
        if (fallback) {
          const left = fallback.left;
          const top = fallback.top;
          const width = fallback.width;
          const height = fallback.height;
          nodeOffsets.set(id, { left, top });
          minLeft = Math.min(minLeft, left);
          minTop = Math.min(minTop, top);
          maxRight = Math.max(maxRight, left + width);
          maxBottom = Math.max(maxBottom, top + height);
        }
      });
    }

    const groupEl = React.createElement(
      elementComponent,
      {
        is: containerComponent,
        canvas: true,
        background: "transparent",
        padding: 0,
        width: "fit-content",
        height: "fit-content",
        display: parentIsFreeform ? "block" : "flex",
        flexDirection: parentIsFreeform ? undefined : "column",
        position: "relative",
      },
    );

    const tree = query.parseReactElement(groupEl).toNodeTree();
    const groupNodeId: string = tree.rootNodeId;

    actions.addNodeTree(tree, parentId, insertIndex);

    const sorted = [...nodeIds].sort(
      (a, b) => siblings.indexOf(a) - siblings.indexOf(b),
    );
    for (let i = 0; i < sorted.length; i++) {
      try {
        if (actions.move) actions.move(sorted[i], groupNodeId, i);
      } catch {
        /* skip */
      }
    }

    if (parentIsFreeform && nodeOffsets.size > 0 && Number.isFinite(minLeft) && Number.isFinite(minTop)) {
      const width = Math.max(1, Math.round(maxRight - minLeft));
      const height = Math.max(1, Math.round(maxBottom - minTop));
      const left = Math.round(minLeft);
      const top = Math.round(minTop);

      actions.setProp(groupNodeId, (props: Record<string, unknown>) => {
        props.position = "relative";
        props.top = `${top}px`;
        props.left = `${left}px`;
        props.right = "auto";
        props.bottom = "auto";
        props.width = `${width}px`;
        props.height = `${height}px`;
        props.display = "block";
        props.padding = 0;
        props.paddingTop = 0;
        props.paddingRight = 0;
        props.paddingBottom = 0;
        props.paddingLeft = 0;
        props.marginTop = 0;
        props.marginRight = 0;
        props.marginBottom = 0;
        props.marginLeft = 0;
      });

      sorted.forEach((id) => {
        const offset = nodeOffsets.get(id);
        if (!offset) return;
        const nextLeft = Math.round(offset.left - minLeft);
        const nextTop = Math.round(offset.top - minTop);
        actions.setProp(id, (props: Record<string, unknown>) => {
          props.position = "absolute";
          props.left = `${nextLeft}px`;
          props.top = `${nextTop}px`;
          props.right = "auto";
          props.bottom = "auto";
          props.marginTop = 0;
          props.marginLeft = 0;
        });
      });
    }

    actions.selectNode(groupNodeId);
    return groupNodeId;
  } catch (e) {
    console.warn("groupSelection failed:", e);
    return null;
  }
}

/**
 * Ungroup: move children of the selected container out to its parent,
 * preserving order, then delete the empty container.
 */
export function ungroupSelection(
  actions: EditorActions & {
    setProp: (id: string, cb: (props: Record<string, unknown>) => void) => void;
  },
  query: EditorQuery,
  nodeIds: string[],
): string[] {
  if (nodeIds.length !== 1) return [];
  const groupId = nodeIds[0];
  try {
    const state = query.getState();
    const groupNode = state.nodes[groupId];
    if (!groupNode) return [];

    const displayName = groupNode.data?.displayName as string | undefined;
    if (!displayName || !UNGROUPABLE_TYPES.has(displayName)) return [];

    const parentId = groupNode.data?.parent as string | undefined;
    if (!parentId || !state.nodes[parentId]) return [];

    const childIds = (groupNode.data?.nodes as string[]) ?? [];
    if (childIds.length === 0) return [];

    const parentNode = state.nodes[parentId];
    const parentProps = (parentNode?.data?.props ?? {}) as Record<string, unknown>;
    const groupProps = (groupNode.data?.props ?? {}) as Record<string, unknown>;
    const groupLeft = parsePxValue(groupProps.left);
    const groupTop = parsePxValue(groupProps.top);

    const parentDom = query.node(parentId).get()?.dom ?? null;
    const parentRect = parentDom?.getBoundingClientRect() ?? null;
    const parentScale = getRenderedScale(parentDom);

    const childPositions = new Map<string, { left: number; top: number }>();
    if (parentRect) {
      childIds.forEach((id) => {
        const childDom = query.node(id).get()?.dom ?? null;
        if (childDom) {
          const rect = childDom.getBoundingClientRect();
          const left = (rect.left - parentRect.left) / parentScale.scaleX;
          const top = (rect.top - parentRect.top) / parentScale.scaleY;
          childPositions.set(id, { left, top });
          return;
        }

        const childNode = state.nodes[id];
        const childProps = (childNode?.data?.props ?? {}) as Record<string, unknown>;
        const childLeft = parsePxValue(childProps.left);
        const childTop = parsePxValue(childProps.top);
        childPositions.set(id, { left: groupLeft + childLeft, top: groupTop + childTop });
      });
    }

    const parentSiblings = (state.nodes[parentId]?.data?.nodes as string[]) ?? [];
    let insertIndex = parentSiblings.indexOf(groupId);
    if (insertIndex < 0) insertIndex = parentSiblings.length;

    const movedIds: string[] = [];
    for (let i = 0; i < childIds.length; i++) {
      try {
        if (actions.move) {
          actions.move(childIds[i], parentId, insertIndex + i);
          movedIds.push(childIds[i]);
        }
      } catch {
        /* skip */
      }
    }

    if (movedIds.length > 0 && childPositions.size > 0) {
      actions.setProp(parentId, (props: Record<string, unknown>) => {
        const parentPosition = String(props.position ?? "static");
        if (!parentPosition || parentPosition === "static") {
          props.position = "relative";
        }
      });

      movedIds.forEach((id) => {
        const pos = childPositions.get(id);
        if (!pos) return;
        actions.setProp(id, (props: Record<string, unknown>) => {
          props.position = "absolute";
          props.left = `${Math.round(pos.left)}px`;
          props.top = `${Math.round(pos.top)}px`;
          props.right = "auto";
          props.bottom = "auto";
          props.marginTop = 0;
          props.marginRight = 0;
          props.marginBottom = 0;
          props.marginLeft = 0;
        });
      });
    }

    try {
      actions.delete(groupId);
    } catch {
      /* skip */
    }

    if (movedIds.length > 0) {
      actions.selectNode(movedIds.length === 1 ? movedIds[0] : movedIds);
    }
    return movedIds;
  } catch (e) {
    console.warn("ungroupSelection failed:", e);
    return [];
  }
}

/** Cut = copy then delete selected. */
export function cutSelection(
  actions: EditorActions,
  query: EditorQuery,
  nodeIds: string[]
): void {
  copySelection(query, nodeIds);
  if (nodeIds.length === 0) return;
  try {
    const state = query.getState();
    const deletable: string[] = [];
    for (const id of nodeIds) {
      if (!state.nodes[id] || PROTECTED.has(state.nodes[id]?.data?.displayName as string)) continue;
      if (!query.node(id).isDeletable()) continue;
      deletable.push(id);
    }
    if (deletable.length > 0) actions.delete(deletable.length === 1 ? deletable[0] : deletable);
    actions.selectNode();
  } catch (e) {
    console.warn("cutSelection failed:", e);
  }
}

/** Paste from clipboard and replace the selected node(s). Uses first selected node's parent and index. */
export function pasteToReplaceSelection(
  actions: EditorActions,
  query: EditorQuery,
  nodeIds: string[]
): string[] {
  if (nodeIds.length === 0) return [];
  const state = query.getState();
  const firstId = nodeIds[0]!;
  const firstNode = state.nodes[firstId];
  if (!firstNode) return [];
  const parentId = firstNode.data?.parent as string | undefined;
  if (!parentId || !state.nodes[parentId]) return [];
  const siblings = (state.nodes[parentId]?.data?.nodes as string[]) ?? [];
  const atIndex = siblings.indexOf(firstId);
  if (atIndex === -1) return [];
  const pasted = pasteClipboard(actions, query, { parentId, atIndex });
  if (pasted.length === 0) return [];
  const deletable: string[] = [];
  for (const id of nodeIds) {
    if (!state.nodes[id] || PROTECTED.has(state.nodes[id]?.data?.displayName as string)) continue;
    try {
      if (query.node(id).isDeletable()) deletable.push(id);
    } catch {
      // skip
    }
  }
  if (deletable.length > 0) actions.delete(deletable.length === 1 ? deletable[0] : deletable);
  return pasted;
}
