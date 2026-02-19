import { useEffect } from "react";
import { useEditor } from "@craftjs/core";
import {
  selectedToIds,
  duplicateNodes,
  copySelection,
  pasteClipboard,
  cutSelection,
  groupSelection,
  ungroupSelection,
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

/**
 * Render-less component that listens for global keyboard shortcuts.
 * Reads state lazily via query.getState() to avoid reactive re-renders.
 *
 * Must be rendered inside <Editor> so useEditor() is available.
 */
export const KeyboardShortcuts = () => {
  const { actions, query } = useEditor();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const ctrl = e.ctrlKey || e.metaKey;

      // ── Save: Ctrl/Cmd + S ──
      if (ctrl && e.key === "s") {
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
      if (ctrl && !e.shiftKey && e.key === "z") {
        e.preventDefault();
        try {
          if (actions.history?.undo) actions.history.undo();
        } catch {
          // nothing to undo
        }
        return;
      }

      // ── Redo: Ctrl/Cmd + Shift + Z  OR  Ctrl/Cmd + Y ──
      if (ctrl && ((e.shiftKey && e.key === "z") || e.key === "y")) {
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
      if (ctrl && e.key === "d") {
        e.preventDefault();
        const state = query.getState();
        const ids = selectedToIds(state.events.selected);
        if (ids.length > 0) duplicateNodes(actions, query, ids);
        return;
      }

      // ── Copy: Cmd/Ctrl + C ──
      if (ctrl && e.key === "c") {
        e.preventDefault();
        const state = query.getState();
        const ids = selectedToIds(state.events.selected);
        copySelection(query, ids);
        return;
      }

      // ── Cut: Cmd/Ctrl + X ──
      if (ctrl && e.key === "x") {
        e.preventDefault();
        const state = query.getState();
        const ids = selectedToIds(state.events.selected);
        cutSelection(actions, query, ids);
        return;
      }

      // ── Paste: Cmd/Ctrl + V ──
      if (ctrl && e.key === "v") {
        e.preventDefault();
        const state = query.getState();
        const selectedIds = selectedToIds(state.events.selected);
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
        pasteClipboard(actions, query, { parentId, atIndex });
        return;
      }

      // ── Select all: Cmd/Ctrl + A ──
      if (ctrl && e.key === "a") {
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
          if (collect.length > 0) actions.selectNode(collect.length === 1 ? collect[0] : collect);
        } catch {
          // ignore
        }
        return;
      }

      // ── Group: Cmd/Ctrl + G ──
      if (ctrl && !e.shiftKey && e.key === "g") {
        e.preventDefault();
        const state = query.getState();
        const ids = selectedToIds(state.events.selected);
        groupSelection(actions, query, ids);
        return;
      }

      // ── Ungroup: Cmd/Ctrl + Shift + G ──
      if (ctrl && e.shiftKey && e.key === "g") {
        e.preventDefault();
        const state = query.getState();
        const ids = selectedToIds(state.events.selected);
        ungroupSelection(actions, query, ids);
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
        const dx = e.key === "ArrowLeft" ? -step : e.key === "ArrowRight" ? step : 0;
        const dy = e.key === "ArrowUp" ? -step : e.key === "ArrowDown" ? step : 0;
        if (dx === 0 && dy === 0) return;
        e.preventDefault();
        for (const id of ids) {
          try {
            const node = query.node(id).get();
            const props = node?.data?.props ?? {};
            const pos = (props.position as string) ?? "static";
            const hasOffset = pos === "absolute" || pos === "relative" || pos === "fixed";
            if (hasOffset) {
              const top = parsePx(props.top);
              const left = parsePx(props.left);
              actions.setProp(id, (p: Record<string, unknown>) => {
                p.top = `${top + dy}px`;
                p.left = `${left + dx}px`;
              });
            } else {
              const marginTop = typeof props.marginTop === "number" ? props.marginTop : parsePx(props.marginTop);
              const marginLeft = typeof props.marginLeft === "number" ? props.marginLeft : parsePx(props.marginLeft);
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
            actions.delete(deletable.length === 1 ? deletable[0] : deletable);
          }
        } catch {
          // node may already be gone or invalid
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown, true);
    return () => window.removeEventListener("keydown", handleKeyDown, true);
  }, [actions, query]);

  return null;
};
