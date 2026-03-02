/**
 * Shared canvas actions: duplicate, copy/paste/cut, group/ungroup.
 * Used by KeyboardShortcuts and filesPanel for Figma-like UX.
 */

/** Minimal query/actions types to avoid @craftjs/core internal type dependency */
type EditorQuery = {
  serialize: () => string;
  getState: () => any;
  node: (id: string) => any;
};
type EditorActions = {
  deserialize: (json: string) => void;
  selectNode: (id?: any) => void;
  delete: (id: any) => void;
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
      actions.deserialize(JSON.stringify(data));
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
}

let clipboardRef: ClipboardEntry | null = null;

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
    const parentNode = data[targetParentId];
    const newSiblings = [...parentNode.nodes];
    newSiblings.splice(atIndex, 0, ...rootIds);
    parentNode.nodes = newSiblings;

    actions.deserialize(JSON.stringify(data));
    actions.selectNode(rootIds.length === 1 ? rootIds[0] : rootIds);
    return rootIds;
  } catch (e) {
    console.warn("pasteClipboard failed:", e);
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
    actions.selectNode(null);
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

    const containerNode: CraftRawNode = {
      type: { resolvedName: "Container" },
      isCanvas: true,
      props: { padding: 12, background: "transparent" },
      displayName: "Container",
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
      }
    }
    containerNode.nodes = newContainerChildren;
    siblings.splice(firstIndex, 0, containerId);
    parentNode.nodes = siblings;

    actions.deserialize(JSON.stringify(data));
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

    for (const childId of children) {
      if (data[childId]) data[childId].parent = parentId;
    }
    delete data[containerId];

    actions.deserialize(JSON.stringify(data));
    actions.selectNode(children.length === 1 ? children[0] : children);
    return children;
  } catch (e) {
    console.warn("ungroupSelection failed:", e);
    return [];
  }
}
