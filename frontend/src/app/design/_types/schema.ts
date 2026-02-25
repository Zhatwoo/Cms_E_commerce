/**
 * Clean document schema for the web builder.
 *
 * This is the editor-agnostic format that gets saved to the database
 * and consumed by the renderer. It is independent of Craft.js or any
 * other editor framework.
 *
 * Design principles:
 * 1. Only store non-default prop values (compact)
 * 2. No editor-specific state (isCanvas, linkedNodes, etc.)
 * 3. Versioned for future migration
 * 4. Flat node map for efficient lookup + ordered children for rendering
 */

// ─── Document Root ──────────────────────────────────────────────────────────

// ─── Code / Assets ──────────────────────────────────────────────────────────

export type FileType = "tsx" | "css" | "json";

export interface CodeFile {
  id: string;
  name: string;
  type: FileType;
  content: string;
}

/** The top-level document that gets saved to the database. */
export interface BuilderDocument {
  /** Schema version for future migration. */
  version: number;
  /** Pages in this document. */
  pages: PageNode[];
  /** Flat map of all nodes keyed by unique ID. */
  nodes: Record<string, CleanNode>;
  /** Optional project-wide files (assets, custom components, global styles). */
  files?: CodeFile[];
}

// ─── Page ───────────────────────────────────────────────────────────────────

/** A page within the document. Pages are top-level and own child nodes. */
export interface PageNode {
  /** Unique page ID. */
  id: string;
  /** Display name (e.g. "About Us"). */
  name?: string;
  /** URL path segment (e.g. "about-us"). */
  slug?: string;
  /** Page props (width, height, background, etc.) */
  props: Record<string, unknown>;
  /** Ordered array of direct child node IDs. */
  children: string[];
}

// ─── Node ───────────────────────────────────────────────────────────────────

/** Supported component types in the builder. */
export type ComponentType =
  | "Container"
  | "Text"
  | "Image"
  | "Button"
  | "Divider"
  | "Section"
  | "Row"
  | "Column"
  | "Icon"
  | "Frame"
  | "Circle"
  | "Square"
  | "Triangle";

/** A single node in the document. */
export interface CleanNode {
  /** Component type (e.g., "Container", "Text"). */
  type: ComponentType;
  /** Only non-default props are stored. */
  props: Record<string, unknown>;
  /** Ordered array of direct child node IDs. Empty array for leaf nodes. */
  children: string[];
}

// ─── Constants ──────────────────────────────────────────────────────────────

/** Current schema version. Increment when the format changes. */
export const SCHEMA_VERSION = 2;
