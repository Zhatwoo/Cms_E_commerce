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

/**
 * Render-less component that listens for global keyboard shortcuts
 * and maps them to Craft.js editor actions.
 *
 * Must be rendered inside <Editor> so useEditor() is available.
 */
export const KeyboardShortcuts = () => {
  const { actions, query, selected } = useEditor((state) => ({
    selected: state.events.selected,
  }));

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const ctrl = e.ctrlKey || e.metaKey;

      // ── Save: Ctrl/Cmd + S (works even when focused on inputs) ──
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

      if (isEditableTarget(e.target)) return;

      // ── Undo: Ctrl/Cmd + Z ──
      if (ctrl && !e.shiftKey && e.key === "z") {
        e.preventDefault();
        try {
          actions.history.undo();
        } catch {
          // nothing to undo
        }
        return;
      }

      // ── Redo: Ctrl/Cmd + Shift + Z  OR  Ctrl/Cmd + Y ──
      if (ctrl && ((e.shiftKey && e.key === "z") || e.key === "y")) {
        e.preventDefault();
        try {
          actions.history.redo();
        } catch {
          // nothing to redo
        }
        return;
      }

      // ── Delete: Backspace or Delete key ──
      if (e.key === "Backspace" || e.key === "Delete") {
        e.preventDefault();

        const [selectedId] = selected;
        if (!selectedId || selectedId === "ROOT") return;

        try {
          // Guard: don't delete protected node types
          const node = query.node(selectedId).get();
          if (PROTECTED.has(node.data.displayName)) return;

          // Guard: Craft.js built-in deletability check
          if (!query.node(selectedId).isDeletable()) return;

          actions.delete(selectedId);
        } catch {
          // node may already be gone or invalid
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [actions, query, selected]);

  return null;
};
