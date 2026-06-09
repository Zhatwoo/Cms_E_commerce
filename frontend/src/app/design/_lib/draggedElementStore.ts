// Lightweight store for the React element being dragged from the components panel.
// Used by PanelDropFreePlacementHandler as a fallback when Craft.js's internal
// HTML5 DnD doesn't register a valid drop target (e.g. fast drags).
import type { ReactElement } from "react";

let _element: ReactElement | null = null;

/** Called on dragstart in the components panel to capture what's being dragged. */
export function setDraggedElement(el: ReactElement | null) {
  _element = el;
}

/** Retrieve the currently-dragged element (if any). */
export function getDraggedElement(): ReactElement | null {
  return _element;
}

/** Clear after drop (success or failure). */
export function clearDraggedElement() {
  _element = null;
}
