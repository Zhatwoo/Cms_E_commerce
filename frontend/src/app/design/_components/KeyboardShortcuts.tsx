import { useEffect } from "react";
import { useEditor } from "@craftjs/core";

const STORAGE_KEY = "craftjs_preview_json";

/** Node types that should never be deleted via keyboard shortcut */
const PROTECTED = new Set(["Viewport"]);

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

/** Normalize Craft.js selected (Set, array, or plain object) to string[] */
function selectedToIds(selected: unknown): string[] {
  if (Array.isArray(selected)) return selected.filter((id) => id && id !== "ROOT");
  if (selected instanceof Set) return Array.from(selected).filter((id) => id && id !== "ROOT");
  if (selected && typeof selected === "object") return Object.keys(selected).filter((id) => id && id !== "ROOT");
  return [];
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
          actions.selectNode(null);
        } catch {
          // ignore
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
