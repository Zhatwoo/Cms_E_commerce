/**
 * Shared canvas actions: duplicate, copy/paste/cut, group/ungroup.
 * Used by KeyboardShortcuts and filesPanel for Figma-like UX.
 */

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
  if (lowered === "container") return "Container";
  if (lowered === "page") return "Page";
  if (lowered === "viewport") return "Viewport";
  if (lowered.includes("image")) return "Image";
  if (lowered.includes("text")) return "Text";
  if (lowered.includes("container")) return "Container";
  if (lowered.includes("page")) return "Page";
  if (lowered.includes("viewport")) return "Viewport";
  return name;
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
    const data: CraftData = JSON.parse(serialized);
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
    const full: CraftData = JSON.parse(serialized);
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
    const data: CraftData = JSON.parse(serialized);
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

/** Recursively collect all descendant ids. */
function getDescendantIds(data: CraftData, nodeId: string): string[] {
  const node = data[nodeId];
  if (!node) return [];
  const out: string[] = [nodeId];
  for (const c of getChildIds(node)) out.push(...getDescendantIds(data, c));
  return out;
}

/** Group selected nodes (same parent) into a new Container. Returns new container id or null. */
export function groupSelection(
  actions: EditorActions,
  query: EditorQuery,
  nodeIds: string[]
): string | null {
  if (nodeIds.length === 0) return null;
  try {
    const state = query.getState();
    const parentId = state.nodes[nodeIds[0]]?.data?.parent as string | undefined;
    if (!parentId || !state.nodes[parentId]) return null;
    for (const id of nodeIds) {
      if ((state.nodes[id]?.data?.parent as string) !== parentId) return null;
    }

    const serialized = query.serialize();
    const data: CraftData = JSON.parse(serialized);
    const existingIds = new Set(Object.keys(data));
    const containerId = generateId(existingIds);

    const parentNode = data[parentId];
    const siblings = [...getChildIds(parentNode)];
    const firstIndex = siblings.indexOf(nodeIds[0]);
    if (firstIndex === -1) return null;

    let minLeft = Infinity, minTop = Infinity, maxRight = -Infinity, maxBottom = -Infinity;
    let hasDOM = false;
    let parentScaleX = 1, parentScaleY = 1;
    let parentRect: DOMRect | null = null;
    let parentDom: HTMLElement | null = null;

    try {
      parentDom = query.node(parentId).get()?.dom ?? null;
      if (parentDom) {
        parentRect = parentDom.getBoundingClientRect();
        const pw = parentDom.offsetWidth || 1;
        const ph = parentDom.offsetHeight || 1;
        parentScaleX = parentRect.width / pw;
        parentScaleY = parentRect.height / ph;
        if (!Number.isFinite(parentScaleX) || parentScaleX < 0.01) parentScaleX = 1;
        if (!Number.isFinite(parentScaleY) || parentScaleY < 0.01) parentScaleY = 1;
      }
    } catch { }

    const childRects = new Map<string, DOMRect>();
    for (const id of nodeIds) {
      try {
        const dom = query.node(id).get()?.dom;
        if (dom) {
          const rect = dom.getBoundingClientRect();
          childRects.set(id, rect);
          minLeft = Math.min(minLeft, rect.left);
          minTop = Math.min(minTop, rect.top);
          maxRight = Math.max(maxRight, rect.right);
          maxBottom = Math.max(maxBottom, rect.bottom);
          hasDOM = true;
        }
      } catch { }
    }

    let groupLeft = 0;
    let groupTop = 0;
    let groupWidth: string | number = "auto";
    let groupHeight: string | number = "auto";

    if (hasDOM && parentRect) {
      groupLeft = Math.round((minLeft - parentRect.left) / parentScaleX);
      groupTop = Math.round((minTop - parentRect.top) / parentScaleY);
      groupWidth = Math.round((maxRight - minLeft) / parentScaleX);
      groupHeight = Math.round((maxBottom - minTop) / parentScaleY);
    }

    const containerNode: CraftRawNode = {
      type: { resolvedName: "Container" },
      isCanvas: true,
      props: { 
        padding: 0, 
        background: "transparent",
        position: "absolute",
        top: `${groupTop}px`,
        left: `${groupLeft}px`,
        width: typeof groupWidth === "number" ? `${groupWidth}px` : groupWidth,
        height: typeof groupHeight === "number" ? `${groupHeight}px` : groupHeight,
      },
      displayName: "Group",
      custom: {},
      parent: parentId,
      hidden: false,
      nodes: [],
      linkedNodes: {},
    };
    data[containerId] = containerNode;

    const toMove = nodeIds.filter((id) => data[id]);
    const newContainerChildren: string[] = [];
    for (const id of toMove) {
      const idx = siblings.indexOf(id);
      if (idx !== -1) {
        siblings.splice(idx, 1);
        newContainerChildren.push(id);
        data[id].parent = containerId;

        const props = data[id].props ?? {};
        if (hasDOM && childRects.has(id)) {
           const r = childRects.get(id)!;
           const childLeft = Math.round((r.left - minLeft) / parentScaleX);
           const childTop = Math.round((r.top - minTop) / parentScaleY);
           props.position = "absolute";
           props.left = `${childLeft}px`;
           props.top = `${childTop}px`;
           props.marginTop = 0;
           props.marginLeft = 0;
           props.right = "auto";
           props.bottom = "auto";
        } else {
           const oldLeft = parsePxValue(props.left);
           const oldTop = parsePxValue(props.top);
           props.left = `${oldLeft - groupLeft}px`;
           props.top = `${oldTop - groupTop}px`;
        }
        data[id].props = props;
      }
    }
    containerNode.nodes = newContainerChildren;
    siblings.splice(firstIndex, 0, containerId);
    parentNode.nodes = siblings;

    actions.deserialize(JSON.stringify(sanitizeCraftData(data)));
    actions.selectNode(containerId);
    return containerId;
  } catch (e) {
    console.warn("groupSelection failed:", e);
    return null;
  }
}

/** Ungroup: selected must be a single Container; its children move to container's parent. */
export function ungroupSelection(
  actions: EditorActions,
  query: EditorQuery,
  nodeIds: string[]
): string[] {
  if (nodeIds.length !== 1) return [];
  const containerId = nodeIds[0];
  try {
    const state = query.getState();
    const node = state.nodes[containerId];
    const displayName = node?.data?.displayName as string | undefined;
    if (displayName !== "Container" && displayName !== "Group") return [];

    const serialized = query.serialize();
    const data: CraftData = JSON.parse(serialized);
    const container = data[containerId];
    if (!container) return [];
    const parentId = container.parent;
    if (!parentId || !data[parentId]) return [];

    const parentNode = data[parentId];
    const siblings = [...getChildIds(parentNode)];
    const containerIndex = siblings.indexOf(containerId);
    if (containerIndex === -1) return [];

    const children = getChildIds(container);
    siblings.splice(containerIndex, 1, ...children);
    parentNode.nodes = siblings;

    const containerLeft = parsePxValue(container.props.left);
    const containerTop = parsePxValue(container.props.top);

    for (const childId of children) {
      const child = data[childId];
      if (child) {
        child.parent = parentId;
        const childLeft = parsePxValue(child.props.left);
        const childTop = parsePxValue(child.props.top);
        child.props.left = `${childLeft + containerLeft}px`;
        child.props.top = `${childTop + containerTop}px`;
      }
    }
    delete data[containerId];

    actions.deserialize(JSON.stringify(sanitizeCraftData(data)));
    actions.selectNode(children.length === 1 ? children[0] : children);
    return children;
  } catch (e) {
    console.warn("ungroupSelection failed:", e);
    return [];
  }
}
