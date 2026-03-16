"use client";

import { useEffect, useRef } from "react";
import { useEditor } from "@craftjs/core";
import {
  selectedToIds,
  duplicateNodes,
  copySelection,
  pasteClipboard,
  pasteToReplaceSelection,
  cutSelection,
  groupSelection,
  ungroupSelection,
  getClipboard,
} from "../_lib/canvasActions";

const STORAGE_KEY = "craftjs_preview_json";

/** Node types that should never be deleted via keyboard shortcut */
const PROTECTED = new Set(["Viewport"]);

const NUDGE_PX = 1;
const BIG_NUDGE_PX = 10;

/** Returns true if the event target is an input, textarea, select, or contenteditable */
const isEditableTarget = (target: EventTarget | null) => {
  if (!target || !(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  return (
    target.isContentEditable ||
    tag === "INPUT" ||
    tag === "TEXTAREA" ||
    tag === "SELECT"
  );
};

function parsePx(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const n = parseFloat(value.replace("px", ""));
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
}

// ── Web-clipboard image paste helpers ────────────────────────────────────────

const IMAGE_URL_EXT_RE = /\.(png|jpe?g|gif|webp|bmp|svg)(\?.*)?$/i;

const isLikelyImageUrl = (value: string): boolean => {
  const text = value.trim();
  if (!text) return false;
  if (text.startsWith("data:image/")) return true;
  try {
    const parsed = new URL(text);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return false;
    return (
      IMAGE_URL_EXT_RE.test(parsed.pathname) ||
      /image|img|photo|cdn/i.test(parsed.hostname + parsed.pathname)
    );
  } catch {
    return false;
  }
};

function extractImageUrlFromHtml(html: string): string | null {
  const match = html.match(/<img[^>]+src=["']([^"']+)["']/i);
  if (!match?.[1]) return null;
  const src = match[1].trim();
  return isLikelyImageUrl(src) ? src : null;
}

async function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(new Error("Failed to read clipboard image"));
    reader.readAsDataURL(file);
  });
}

/** Calculate the rendered scale of a DOM element (to handle CSS transforms / zoom). */
function getRenderedScale(el: HTMLElement): { scaleX: number; scaleY: number } {
  const rect = el.getBoundingClientRect();
  const baseW = el.offsetWidth || el.clientWidth || 0;
  const baseH = el.offsetHeight || el.clientHeight || 0;
  const scaleX = baseW > 0 ? rect.width / baseW : 1;
  const scaleY = baseH > 0 ? rect.height / baseH : 1;
  return {
    scaleX: Number.isFinite(scaleX) && scaleX > 0.01 ? scaleX : 1,
    scaleY: Number.isFinite(scaleY) && scaleY > 0.01 ? scaleY : 1,
  };
}

/**
 * Given a Craft node ID, walk up the tree until we find a Page node.
 * Returns the Page node ID, or null if none found.
 */
function resolvePageId(
  startId: string | null,
  nodes: Record<string, any>
): string | null {
  let current = startId;
  const visited = new Set<string>();
  while (current && !visited.has(current)) {
    visited.add(current);
    if (String(nodes[current]?.data?.displayName ?? "") === "Page") return current;
    const parent = nodes[current]?.data?.parent;
    current = typeof parent === "string" ? parent : null;
  }
  return null;
}

function resolvePasteTarget(state: {
  nodes: Record<string, any>;
  events?: { selected?: unknown };
}) {
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
        parentId =
          firstContainerId && state.nodes[firstContainerId]
            ? firstContainerId
            : firstPageId;
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

/**
 * Render-less component that listens for global keyboard shortcuts.
 * Reads state lazily via query.getState() to avoid reactive re-renders.
 *
 * Must be rendered inside <Editor> so useEditor() is available.
 */
export const KeyboardShortcuts = () => {
  const { actions, query } = useEditor();

  // Track the latest mouse position so paste lands under the cursor.
  const lastMousePos = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const trackMouse = (e: MouseEvent) => {
      lastMousePos.current = { x: e.clientX, y: e.clientY };
    };
    window.addEventListener("mousemove", trackMouse, true);
    return () => window.removeEventListener("mousemove", trackMouse, true);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const ctrl = e.ctrlKey || e.metaKey;
      const key = typeof e.key === "string" ? e.key.toLowerCase() : "";

      // ── Save: Ctrl/Cmd + S ──
      if (ctrl && key === "s") {
        e.preventDefault();
        try {
          const json = query.serialize();
          sessionStorage.setItem(STORAGE_KEY, json);
        } catch {
          // storage error
        }
        return;
      }

      // Don't intercept shortcuts when typing in inputs
      if (isEditableTarget(e.target)) return;

      // ── Undo: Ctrl/Cmd + Z ──
      if (ctrl && !e.shiftKey && key === "z") {
        e.preventDefault();
        try {
          if (actions.history?.undo) actions.history.undo();
        } catch {
          // nothing to undo
        }
        return;
      }

      // ── Redo: Ctrl/Cmd + Shift + Z  OR  Ctrl/Cmd + Y ──
      if (ctrl && ((e.shiftKey && key === "z") || key === "y")) {
        e.preventDefault();
        try {
          if (actions.history?.redo) actions.history.redo();
        } catch {
          // nothing to redo
        }
        return;
      }

      // ── Deselect: Escape ──
      if (e.key === "Escape") {
        e.preventDefault();
        try {
          actions.selectNode(undefined);
        } catch {
          // ignore
        }
        return;
      }

      // ── Duplicate: Cmd/Ctrl + D ──
      if (ctrl && key === "d") {
        e.preventDefault();
        const state = query.getState();
        const ids = selectedToIds(state.events.selected);
        if (ids.length > 0) duplicateNodes(actions as any, query as any, ids);
        return;
      }

      // ── Copy: Cmd/Ctrl + C ──
      if (ctrl && key === "c") {
        e.preventDefault();
        const state = query.getState();
        const ids = selectedToIds(state.events.selected);
        copySelection(query as any, ids);
        return;
      }

      // ── Cut: Cmd/Ctrl + X ──
      if (ctrl && key === "x") {
        e.preventDefault();
        const state = query.getState();
        const ids = selectedToIds(state.events.selected);
        cutSelection(actions as any, query as any, ids);
        return;
      }

      // ── Paste: Cmd/Ctrl + V ──
      if (ctrl && key === "v") {
        const clip = getClipboard();
        if (clip && clip.nodeIds.length > 0) {
          e.preventDefault();
          const state = query.getState();
          const selectedIds = selectedToIds(state.events.selected);
          let parentId: string | undefined;
          let atIndex: number | undefined;
          if (selectedIds.length > 0) {
            const firstId = selectedIds[0];
            const lastId = selectedIds[selectedIds.length - 1]!;
            const firstNode = state.nodes[firstId];
            const lastNode = state.nodes[lastId];
            parentId = firstNode?.data?.parent as string | undefined;
            if (parentId && state.nodes[parentId]) {
              const siblings = (state.nodes[parentId]?.data?.nodes as string[]) ?? [];
              const lastIndex = siblings.indexOf(lastId);
              atIndex = lastIndex === -1 ? siblings.length : lastIndex + 1;
            }
          }
          pasteClipboard(actions as any, query as any, { parentId, atIndex });
        }
        return;
      }

      // ── Select all: Cmd/Ctrl + A ──
      if (ctrl && key === "a") {
        e.preventDefault();
        try {
          const state = query.getState();
          const root = state.nodes.ROOT;
          const viewportId = root?.data?.nodes?.[0];
          if (!viewportId || !state.nodes[viewportId]) return;
          const collect: string[] = [];
          const walk = (id: string) => {
            if (id !== "ROOT" && id !== viewportId) collect.push(id);
            const kids = (state.nodes[id]?.data?.nodes as string[]) ?? [];
            kids.forEach(walk);
          };
          walk(viewportId);
          if (collect.length > 0)
            actions.selectNode(collect.length === 1 ? collect[0] : collect);
        } catch {
          // ignore
        }
        return;
      }

      // ── Group: Cmd/Ctrl + G ──
      if (ctrl && !e.shiftKey && key === "g") {
        e.preventDefault();
        const state = query.getState();
        const ids = selectedToIds(state.events.selected);
        groupSelection(actions as any, query as any, ids);
        return;
      }

      // ── Ungroup: Cmd/Ctrl + Shift + G ──
      if (ctrl && e.shiftKey && key === "g") {
        e.preventDefault();
        const state = query.getState();
        const ids = selectedToIds(state.events.selected);
        ungroupSelection(actions as any, query as any, ids);
        return;
      }

      // ── Paste to replace: Shift + Cmd/Ctrl + R ──
      if (ctrl && e.shiftKey && key === "r") {
        e.preventDefault();
        const state = query.getState();
        const ids = selectedToIds(state.events.selected);
        const clip = getClipboard();
        if (ids.length === 1 && clip && clip.nodeIds.length > 0) {
          pasteToReplaceSelection(actions as any, query as any, ids);
        }
        return;
      }

      // ── Bring to front: ] ──
      if (!ctrl && !e.shiftKey && e.key === "]") {
        e.preventDefault();
        let state = query.getState();
        const ids = selectedToIds(state.events.selected);
        if (ids.length === 0 || !actions.move) return;
        const parentId = state.nodes[ids[0]]?.data?.parent as string | undefined;
        if (!parentId || !state.nodes[parentId]) return;
        const allSameParent = ids.every(
          (id) => (state.nodes[id]?.data?.parent as string) === parentId
        );
        if (!allSameParent) return;
        const siblings = (state.nodes[parentId]?.data?.nodes as string[]) ?? [];
        const sorted = [...ids].sort(
          (a, b) => siblings.indexOf(a) - siblings.indexOf(b)
        );
        for (const id of sorted) {
          try {
            state = query.getState();
            const sibs = (state.nodes[parentId]?.data?.nodes as string[]) ?? [];
            const lastIndex = sibs.length - 1;
            const idx = sibs.indexOf(id);
            if (idx >= 0 && idx !== lastIndex) actions.move(id, parentId, lastIndex);
          } catch {
            /* skip */
          }
        }
        return;
      }

      // ── Send to back: [ ──
      if (!ctrl && !e.shiftKey && e.key === "[") {
        e.preventDefault();
        let state = query.getState();
        const ids = selectedToIds(state.events.selected);
        if (ids.length === 0 || !actions.move) return;
        const parentId = state.nodes[ids[0]]?.data?.parent as string | undefined;
        if (!parentId || !state.nodes[parentId]) return;
        const allSameParent = ids.every(
          (id) => (state.nodes[id]?.data?.parent as string) === parentId
        );
        if (!allSameParent) return;
        const siblings = (state.nodes[parentId]?.data?.nodes as string[]) ?? [];
        const sorted = [...ids].sort(
          (a, b) => siblings.indexOf(a) - siblings.indexOf(b)
        );
        for (let i = 0; i < sorted.length; i++) {
          try {
            state = query.getState();
            const sibs = (state.nodes[parentId]?.data?.nodes as string[]) ?? [];
            const currentIndex = sibs.indexOf(sorted[i]!);
            if (currentIndex >= 0 && currentIndex !== i)
              actions.move(sorted[i]!, parentId, i);
          } catch {
            /* skip */
          }
        }
        return;
      }

      // ── Show/Hide: Shift + Cmd/Ctrl + H ──
      if (ctrl && e.shiftKey && key === "h") {
        e.preventDefault();
        const state = query.getState();
        const ids = selectedToIds(state.events.selected);
        if (ids.length === 0) return;
        const firstProps = state.nodes[ids[0]]?.data?.props as
          | Record<string, unknown>
          | undefined;
        const next = firstProps?.visibility === "hidden" ? "visible" : "hidden";
        ids.forEach((id) => {
          try {
            actions.setProp(id, (p: Record<string, unknown>) => {
              p.visibility = next;
            });
          } catch {
            /* skip */
          }
        });
        return;
      }

      // ── Lock/Unlock: Shift + Cmd/Ctrl + L ──
      if (ctrl && e.shiftKey && key === "l") {
        e.preventDefault();
        const state = query.getState();
        const ids = selectedToIds(state.events.selected);
        if (ids.length === 0) return;
        const firstProps = state.nodes[ids[0]]?.data?.props as
          | Record<string, unknown>
          | undefined;
        const next = !(firstProps?.locked as boolean);
        ids.forEach((id) => {
          try {
            actions.setProp(id, (p: Record<string, unknown>) => {
              p.locked = next;
            });
          } catch {
            /* skip */
          }
        });
        return;
      }

      // ── Flip horizontal: Shift + H (no Cmd to avoid conflict with Hide) ──
      if (!ctrl && e.shiftKey && key === "h") {
        e.preventDefault();
        const state = query.getState();
        const ids = selectedToIds(state.events.selected);
        if (ids.length === 0) return;
        ids.forEach((id) => {
          try {
            actions.setProp(id, (p: Record<string, unknown>) => {
              p.flipHorizontal = !(p.flipHorizontal as boolean);
            });
          } catch {
            /* skip */
          }
        });
        return;
      }

      // ── Flip vertical: Shift + V ──
      if (!ctrl && e.shiftKey && key === "v") {
        e.preventDefault();
        const state = query.getState();
        const ids = selectedToIds(state.events.selected);
        if (ids.length === 0) return;
        ids.forEach((id) => {
          try {
            actions.setProp(id, (p: Record<string, unknown>) => {
              p.flipVertical = !(p.flipVertical as boolean);
            });
          } catch {
            /* skip */
          }
        });
        return;
      }

      // ── Select inside: Enter ──
      if (!ctrl && !e.shiftKey && e.key === "Enter") {
        const state = query.getState();
        const ids = selectedToIds(state.events.selected);
        if (ids.length !== 1) return;
        const node = state.nodes[ids[0]];
        const children = (node?.data?.nodes as string[]) ?? [];
        if (children.length > 0) {
          e.preventDefault();
          actions.selectNode(children[0]);
        }
        return;
      }

      // ── Select parent: Cmd/Ctrl + Enter ──
      if (ctrl && e.key === "Enter") {
        e.preventDefault();
        const state = query.getState();
        const ids = selectedToIds(state.events.selected);
        if (ids.length !== 1) return;
        const parentId = state.nodes[ids[0]]?.data?.parent as string | undefined;
        if (parentId && parentId !== "ROOT" && state.nodes[parentId]) {
          actions.selectNode(parentId);
        }
        return;
      }

      // ── Arrow nudge ──
      if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(e.key)) {
        const state = query.getState();
        const ids = selectedToIds(state.events.selected);
        if (ids.length === 0) return;
        const step = e.shiftKey ? BIG_NUDGE_PX : NUDGE_PX;
        const dx =
          e.key === "ArrowLeft" ? -step : e.key === "ArrowRight" ? step : 0;
        const dy =
          e.key === "ArrowUp" ? -step : e.key === "ArrowDown" ? step : 0;
        if (dx === 0 && dy === 0) return;
        e.preventDefault();
        for (const id of ids) {
          try {
            const node = query.node(id).get();
            const props = node?.data?.props ?? {};
            const pos = (props.position as string) ?? "static";
            const hasOffset =
              pos === "absolute" || pos === "relative" || pos === "fixed";
            if (hasOffset) {
              const top = parsePx(props.top);
              const left = parsePx(props.left);
              actions.setProp(id, (p: Record<string, unknown>) => {
                p.top = `${top + dy}px`;
                p.left = `${left + dx}px`;
              });
            } else {
              const marginTop =
                typeof props.marginTop === "number"
                  ? props.marginTop
                  : parsePx(props.marginTop);
              const marginLeft =
                typeof props.marginLeft === "number"
                  ? props.marginLeft
                  : parsePx(props.marginLeft);
              actions.setProp(id, (p: Record<string, unknown>) => {
                p.marginTop = marginTop + dy;
                p.marginLeft = marginLeft + dx;
              });
            }
          } catch {
            // skip node
          }
        }
        return;
      }

      // ── Tool Switch: G (Move), H (Hand), T (Text) ──
      if (!ctrl && !e.shiftKey) {
        if (key === "g") {
          e.preventDefault();
          const btn = document.querySelector('button[title*="Move"]');
          if (btn instanceof HTMLElement) btn.click();
          return;
        }
        if (key === "h") {
          e.preventDefault();
          const btn = document.querySelector('button[title*="Hand"]');
          if (btn instanceof HTMLElement) btn.click();
          return;
        }
        if (key === "t") {
          e.preventDefault();
          const btn = document.querySelector('button[title*="Text"]');
          if (btn instanceof HTMLElement) btn.click();
          return;
        }
      }

      // ── Delete: Backspace or Delete key (all selected nodes) ──
      if (e.key === "Backspace" || e.key === "Delete") {
        e.preventDefault();

        const state = query.getState();
        const idsToDelete = selectedToIds(state.events.selected);
        if (idsToDelete.length === 0) return;

        try {
          const deletable: string[] = [];
          for (const id of idsToDelete) {
            try {
              if (!state.nodes[id]) continue;
              const node = query.node(id).get();
              if (PROTECTED.has(node?.data?.displayName)) continue;
              if (!query.node(id).isDeletable()) continue;
              deletable.push(id);
            } catch {
              // node may not exist
            }
          }
          if (deletable.length > 0) {
            actions.delete(
              deletable.length === 1 ? deletable[0] : deletable
            );
          }
        } catch {
          // node may already be gone or invalid
        }
      }
    };

    // ── Paste handler ─────────────────────────────────────────────────────────
    // Handles both OS-clipboard web images and internal canvas clipboard.
    // Images are placed at the cursor position (absolute) inside the Page that is
    // currently under the mouse pointer.
    const handlePaste = (e: ClipboardEvent) => {
      if (isEditableTarget(e.target)) return;

      const data = e.clipboardData;
      if (!data) return;

      const items = Array.from(data.items ?? []);
      const imageItem = items.find((item) => item.type.startsWith("image/"));
      const imageFile = imageItem?.getAsFile() ?? null;
      const text = (data.getData("text/plain") || "").trim();
      const html = data.getData("text/html") || "";
      const imageUrlFromText = isLikelyImageUrl(text) ? text : null;
      const imageUrlFromHtml = imageUrlFromText
        ? null
        : extractImageUrlFromHtml(html);

      // ── No OS image: try internal canvas clipboard ──
      if (!imageFile && !imageUrlFromText && !imageUrlFromHtml) {
        const clip = getClipboard();
        if (!clip || clip.nodeIds.length === 0) return;
        e.preventDefault();
        const state = query.getState();
        const { parentId, atIndex } = resolvePasteTarget(state);
        pasteClipboard(actions as any, query as any, { parentId, atIndex });
        return;
      }

      // ── OS clipboard has image content ──
      e.preventDefault();

      (async () => {
        try {
          const src =
            imageUrlFromText ||
            imageUrlFromHtml ||
            (imageFile ? await fileToDataUrl(imageFile) : "");
          if (!src) return;

          const IMG_W = 320;
          const IMG_H = 220;

          const state = query.getState();
          const nodes = state.nodes as Record<string, any>;

          // Resolve which Page node the cursor is currently over.
          const { x, y } = lastMousePos.current;
          const elUnderCursor = document.elementFromPoint(x, y) as HTMLElement | null;
          const nodeEl = elUnderCursor?.closest("[data-node-id]") as HTMLElement | null;
          const hitNodeId = nodeEl?.getAttribute("data-node-id") ?? null;
          const pageId = resolvePageId(hitNodeId, nodes) ??
            Object.keys(nodes).find(
              (id) => String(nodes[id]?.data?.displayName ?? "") === "Page"
            ) ??
            null;

          // Calculate absolute position inside the page (matching ShapeToolHandler).
          let imageLeft: number | undefined;
          let imageTop: number | undefined;
          let targetParentId: string | undefined;

          if (pageId) {
            targetParentId = pageId;
            try {
              const pageDom = (query.node(pageId).get() as any)?.dom as HTMLElement | null;
              if (pageDom) {
                const rect = pageDom.getBoundingClientRect();
                const { scaleX, scaleY } = getRenderedScale(pageDom);
                imageLeft = Math.max(
                  0,
                  Math.round((x - rect.left) / scaleX) - IMG_W / 2
                );
                imageTop = Math.max(
                  0,
                  Math.round((y - rect.top) / scaleY) - IMG_H / 2
                );
              }
            } catch {
              // DOM not available yet; fall through to flow placement
            }
          }

          if (!targetParentId) {
            const fallback = resolvePasteTarget(state);
            targetParentId = fallback.parentId;
          }
          if (!targetParentId) return;

          const nodeId = `image-${Date.now()}-${Math.random()
            .toString(36)
            .slice(2, 8)}`;

          const imageProps: Record<string, unknown> = {
            src,
            alt: imageFile?.name || "Pasted Image",
            objectFit: "cover",
            width: `${IMG_W}px`,
            height: `${IMG_H}px`,
            _autoFitInTabs: false,
          };

          // Only apply absolute positioning when we successfully hit a Page.
          if (imageLeft !== undefined && imageTop !== undefined) {
            imageProps.position = "absolute";
            imageProps.left = `${imageLeft}px`;
            imageProps.top = `${imageTop}px`;
          }

          const tree = {
            rootNodeId: nodeId,
            nodes: {
              [nodeId]: {
                type: { resolvedName: "Image" },
                isCanvas: false,
                props: imageProps,
                displayName: "Image",
                nodes: [],
                linkedNodes: {},
                custom: {},
                hidden: false,
              },
            },
          };

          const maybeAddNodeTree = (actions as any).addNodeTree as
            | ((tree: any, parentId?: string, index?: number) => void)
            | undefined;

          if (typeof maybeAddNodeTree !== "function") {
            console.warn(
              "Clipboard image paste skipped: addNodeTree is unavailable"
            );
            return;
          }

          maybeAddNodeTree(tree, targetParentId);
          actions.selectNode(nodeId);
        } catch (error) {
          console.warn("Clipboard image paste failed:", error);
        }
      })();
    };

    window.addEventListener("keydown", handleKeyDown, true);
    window.addEventListener("paste", handlePaste, true);
    return () => {
      window.removeEventListener("keydown", handleKeyDown, true);
      window.removeEventListener("paste", handlePaste, true);
    };
  }, [actions, query]);

  return null;
};
