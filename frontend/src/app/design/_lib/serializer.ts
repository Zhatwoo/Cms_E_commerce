/**
 * Serializer: Transforms raw Craft.js JSON into a clean, editor-agnostic format.
 *
 * This is the boundary layer between the editor (Craft.js) and the rest of the
 * system (database, renderer). When Craft.js is replaced with dnd-kit or another
 * editor, only this file and its counterpart (deserializer) need to change.
 */

import type { BuilderDocument, CleanNode, ComponentType, PageNode, SCHEMA_VERSION } from "../_types/schema";

// ─── Craft.js Raw Types ─────────────────────────────────────────────────────

interface CraftRawNode {
  type: { resolvedName: string };
  isCanvas: boolean;
  props: Record<string, unknown>;
  displayName: string;
  custom: Record<string, unknown>;
  parent?: string;
  hidden: boolean;
  nodes: string[];
  linkedNodes: Record<string, string>;
}

type CraftRawDocument = Record<string, CraftRawNode>;

// ─── Default Props Registry ─────────────────────────────────────────────────
// Maps component type → default props. Used to strip values that match defaults.
// IMPORTANT: Keep in sync with each component's DefaultProps export.

const COMPONENT_DEFAULTS: Record<string, Record<string, unknown>> = {
  Container: {
    background: "#27272a",
    padding: 20,
    paddingTop: 20,
    paddingRight: 20,
    paddingBottom: 20,
    paddingLeft: 20,
    margin: 0,
    marginTop: 0,
    marginRight: 0,
    marginBottom: 0,
    marginLeft: 0,
    width: "100%",
    height: "auto",
    backgroundImage: "",
    backgroundSize: "cover",
    backgroundPosition: "center",
    backgroundRepeat: "no-repeat",
    backgroundOverlay: "",
    borderRadius: 0,
    borderColor: "transparent",
    borderWidth: 0,
    borderStyle: "solid",
    flexDirection: "column",
    flexWrap: "nowrap",
    alignItems: "flex-start",
    justifyContent: "flex-start",
    gap: 0,
    gridTemplateColumns: "1fr 1fr",
    gridTemplateRows: "auto",
    gridGap: 0,
    gridColumnGap: 0,
    gridRowGap: 0,
    gridAutoRows: "auto",
    gridAutoFlow: "row",
    position: "static",
    display: "flex",
    zIndex: 0,
    top: "auto",
    right: "auto",
    bottom: "auto",
    left: "auto",
    boxShadow: "none",
    opacity: 1,
    overflow: "visible",
    cursor: "default",
  },
  Text: {
    text: "Edit me!",
    fontSize: 16,
    fontFamily: "Inter",
    fontWeight: "400",
    lineHeight: 1.5,
    letterSpacing: 0,
    textAlign: "left",
    textTransform: "none",
    color: "#000000",
    margin: 0,
    marginTop: 0,
    marginRight: 0,
    marginBottom: 0,
    marginLeft: 0,
    padding: 0,
    paddingTop: 0,
    paddingRight: 0,
    paddingBottom: 0,
    paddingLeft: 0,
    opacity: 1,
    boxShadow: "none",
  },
  Image: {
    src: "https://placehold.co/600x400/27272a/a1a1aa?text=Image",
    alt: "Image",
    objectFit: "cover",
    width: "100%",
    height: "auto",
    borderRadius: 0,
    padding: 0,
    paddingTop: 0,
    paddingRight: 0,
    paddingBottom: 0,
    paddingLeft: 0,
    margin: 0,
    marginTop: 0,
    marginRight: 0,
    marginBottom: 0,
    marginLeft: 0,
    opacity: 1,
    boxShadow: "none",
  },
  Button: {
    label: "Button",
    link: "",
    variant: "primary",
    fontSize: 14,
    fontWeight: "500",
    fontFamily: "Inter",
    borderRadius: 8,
    width: "auto",
    height: "auto",
    paddingTop: 10,
    paddingBottom: 10,
    paddingLeft: 24,
    paddingRight: 24,
    margin: 0,
    marginTop: 0,
    marginRight: 0,
    marginBottom: 0,
    marginLeft: 0,
    opacity: 1,
    boxShadow: "none",
  },
  Divider: {
    dividerStyle: "solid",
    color: "#4a4a4a",
    thickness: 1,
    width: "100%",
    marginTop: 8,
    marginBottom: 8,
  },
  Section: {
    background: "transparent",
    padding: 40,
    paddingTop: 40,
    paddingRight: 40,
    paddingBottom: 40,
    paddingLeft: 40,
    margin: 0,
    marginTop: 0,
    marginRight: 0,
    marginBottom: 0,
    marginLeft: 0,
    width: "100%",
    height: "auto",
    backgroundImage: "",
    backgroundSize: "cover",
    backgroundPosition: "center",
    backgroundRepeat: "no-repeat",
    backgroundOverlay: "",
    borderRadius: 0,
    borderColor: "transparent",
    borderWidth: 0,
    borderStyle: "solid",
    flexDirection: "column",
    flexWrap: "nowrap",
    alignItems: "center",
    justifyContent: "flex-start",
    gap: 0,
    boxShadow: "none",
    opacity: 1,
    overflow: "visible",
  },
  Row: {
    background: "transparent",
    padding: 0,
    paddingTop: 0,
    paddingRight: 0,
    paddingBottom: 0,
    paddingLeft: 0,
    margin: 0,
    marginTop: 0,
    marginRight: 0,
    marginBottom: 0,
    marginLeft: 0,
    width: "100%",
    height: "auto",
    borderRadius: 0,
    borderColor: "transparent",
    borderWidth: 0,
    borderStyle: "solid",
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "stretch",
    justifyContent: "flex-start",
    gap: 16,
    boxShadow: "none",
    opacity: 1,
    overflow: "visible",
  },
  Column: {
    background: "transparent",
    padding: 12,
    paddingTop: 12,
    paddingRight: 12,
    paddingBottom: 12,
    paddingLeft: 12,
    margin: 0,
    marginTop: 0,
    marginRight: 0,
    marginBottom: 0,
    marginLeft: 0,
    width: "auto",
    height: "auto",
    borderRadius: 0,
    borderColor: "transparent",
    borderWidth: 0,
    borderStyle: "solid",
    flexDirection: "column",
    flexWrap: "nowrap",
    alignItems: "flex-start",
    justifyContent: "flex-start",
    gap: 8,
    boxShadow: "none",
    opacity: 1,
    overflow: "visible",
  },
  Page: {
    width: "1000px",
    height: "auto",
    background: "#ffffff",
  },
};

// ─── Props that are shorthand / redundant ────────────────────────────────────
// These are always stripped because individual values (paddingTop, etc.) are
// the source of truth. The shorthand only existed as a Craft.js rendering fallback.

const SHORTHAND_PROPS = new Set(["padding", "margin"]);

// ─── Serializer ──────────────────────────────────────────────────────────────

/**
 * Strips props that match the component's defaults.
 * Only non-default values are kept in the clean output.
 */
function cleanProps(
  type: string,
  rawProps: Record<string, unknown>
): Record<string, unknown> {
  const defaults = COMPONENT_DEFAULTS[type] ?? {};
  const cleaned: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(rawProps)) {
    // Always strip shorthand props (individual values are the source of truth)
    if (SHORTHAND_PROPS.has(key)) continue;

    // Keep props that differ from defaults
    if (!(key in defaults) || defaults[key] !== value) {
      cleaned[key] = value;
    }
  }

  return cleaned;
}

/**
 * Transforms raw Craft.js serialized JSON into a clean BuilderDocument.
 *
 * @param rawJson - The JSON string from `query.serialize()`
 * @returns A clean, editor-agnostic BuilderDocument
 */
export function serializeCraftToClean(rawJson: string): BuilderDocument {
  const raw: CraftRawDocument = JSON.parse(rawJson);

  const rootNode = raw["ROOT"];
  if (!rootNode) {
    throw new Error("Invalid Craft.js JSON: missing ROOT node");
  }

  const pages: PageNode[] = [];
  const nodes: Record<string, CleanNode> = {};

  // ROOT's children are Pages (inside the Viewport)
  const pageIds = rootNode.nodes;

  for (const pageId of pageIds) {
    const pageRaw = raw[pageId];
    if (!pageRaw || pageRaw.type.resolvedName !== "Page") continue;

    // Extract page
    pages.push({
      id: pageId,
      props: cleanProps("Page", pageRaw.props),
      children: pageRaw.nodes,
    });

    // Recursively process all descendant nodes
    processChildren(pageRaw.nodes, raw, nodes);
  }

  return {
    version: 1,
    pages,
    nodes,
  };
}

/**
 * Recursively processes child nodes, cleaning each and adding to the nodes map.
 */
function processChildren(
  childIds: string[],
  raw: CraftRawDocument,
  nodes: Record<string, CleanNode>
): void {
  for (const id of childIds) {
    const rawNode = raw[id];
    if (!rawNode) continue;

    // Already processed (shared node)
    if (nodes[id]) continue;

    const type = rawNode.type.resolvedName as ComponentType;

    nodes[id] = {
      type,
      props: cleanProps(type, rawNode.props),
      children: rawNode.nodes,
    };

    // Recurse into children
    if (rawNode.nodes.length > 0) {
      processChildren(rawNode.nodes, raw, nodes);
    }
  }
}

// ─── Deserializer (Clean → Craft.js) ────────────────────────────────────────

/**
 * Transforms a clean BuilderDocument back into Craft.js serialized JSON.
 * Used when loading a saved design back into the editor.
 *
 * @param doc - The clean BuilderDocument
 * @returns A JSON string compatible with `actions.deserialize()`
 */
export function deserializeCleanToCraft(doc: BuilderDocument): string {
  const craft: Record<string, unknown> = {};

  // Reconstruct ROOT (Viewport)
  const pageIds = doc.pages.map((p) => p.id);
  craft["ROOT"] = {
    type: { resolvedName: "Viewport" },
    isCanvas: true,
    props: {},
    displayName: "Viewport",
    custom: {},
    hidden: false,
    nodes: pageIds,
    linkedNodes: {},
  };

  // Reconstruct Pages
  for (const page of doc.pages) {
    const defaults = COMPONENT_DEFAULTS["Page"] ?? {};
    craft[page.id] = {
      type: { resolvedName: "Page" },
      isCanvas: true,
      props: { ...defaults, ...page.props },
      displayName: "Page",
      custom: {},
      parent: "ROOT",
      hidden: false,
      nodes: page.children,
      linkedNodes: {},
    };

    // Reconstruct child nodes
    reconstructChildren(page.children, page.id, doc.nodes, craft);
  }

  return JSON.stringify(craft);
}

/**
 * Recursively reconstructs Craft.js nodes from clean nodes.
 */
function reconstructChildren(
  childIds: string[],
  parentId: string,
  nodes: Record<string, CleanNode>,
  craft: Record<string, unknown>
): void {
  for (const id of childIds) {
    const cleanNode = nodes[id];
    if (!cleanNode) continue;

    // Already reconstructed
    if (craft[id]) continue;

    const defaults = COMPONENT_DEFAULTS[cleanNode.type] ?? {};
    const canvasTypes = new Set([
      "Container",
      "Section",
      "Row",
      "Column",
    ]);

    craft[id] = {
      type: { resolvedName: cleanNode.type },
      isCanvas: canvasTypes.has(cleanNode.type),
      props: { ...defaults, ...cleanNode.props },
      displayName: cleanNode.type,
      custom: {},
      parent: parentId,
      hidden: false,
      nodes: cleanNode.children,
      linkedNodes: {},
    };

    // Recurse
    if (cleanNode.children.length > 0) {
      reconstructChildren(cleanNode.children, id, nodes, craft);
    }
  }
}

// ─── Utilities ───────────────────────────────────────────────────────────────

/** Returns the default props for a given component type. */
export function getComponentDefaults(
  type: string
): Record<string, unknown> {
  return { ...(COMPONENT_DEFAULTS[type] ?? {}) };
}

/** Returns all registered component types. */
export function getRegisteredTypes(): string[] {
  return Object.keys(COMPONENT_DEFAULTS);
}
