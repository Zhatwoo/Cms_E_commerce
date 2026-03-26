/**
 * Serializer: Transforms raw Craft.js JSON into a clean, editor-agnostic format.
 *
 * This is the boundary layer between the editor (Craft.js) and the rest of the
 * system (database, renderer). When Craft.js is replaced with dnd-kit or another
 * editor, only this file and its counterpart (deserializer) need to change.
 */

import type { BuilderDocument, CleanNode, CodeFile, ComponentType, PageNode } from "../_types/schema";
import { DEFAULT_ANIMATION } from "../_types/animation";
import { DEFAULT_PROTOTYPE } from "../_types/prototype";

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

function getResolvedType(node: CraftRawNode | null | undefined): string {
  const resolved = (node?.type?.resolvedName ?? "").trim();
  const display = (node?.displayName ?? "").trim();
  if (!resolved) return display;

  const generic = resolved.toLowerCase();
  // Craft may serialize wrapper nodes as "Element" while displayName carries the real component type.
  if ((generic === "element" || generic === "canvas" || generic === "unknown") && display) {
    return display;
  }

  return resolved;
}

function normalizeComponentType(rawType: unknown): ComponentType {
  const name = typeof rawType === "string" ? rawType.trim() : "";
  const lowered = name.toLowerCase();
  if (!lowered) return "Container";
  if (lowered === "tabcontent" || lowered === "tab content") return "TabContent";
  if (lowered.includes("tabcontent")) return "TabContent";
  if (lowered === "tabs") return "Tabs";
  if (lowered.includes("tabs")) return "Tabs";
  if (lowered === "text" || lowered.includes("text")) return "Text";
  if (lowered === "image" || lowered.includes("image")) return "Image";
  if (lowered === "video" || lowered.includes("video")) return "Video";
  if (lowered === "button" || lowered.includes("button")) return "Button";
  if (lowered === "divider" || lowered.includes("divider")) return "Divider";
  if (lowered === "section" || lowered.includes("section")) return "Section";
  if (lowered === "row" || lowered.includes("row")) return "Row";
  if (lowered === "column" || lowered.includes("column")) return "Column";
  if (lowered === "icon" || lowered.includes("icon")) return "Icon";
  if (lowered === "spacer" || lowered.includes("spacer")) return "Spacer";
  if (lowered === "pagination" || lowered.includes("pagination")) return "Pagination";
  if (lowered === "badge" || lowered.includes("badge")) return "Badge";
  if (lowered === "profilelogin" || lowered === "profile login" || lowered === "profile-login" || lowered.includes("profilelogin")) return "ProfileLogin";
  if (lowered === "circle" || lowered.includes("circle")) return "Circle";
  if (lowered === "square" || lowered.includes("square")) return "Square";
  if (lowered === "triangle" || lowered.includes("triangle")) return "Triangle";
  if (lowered === "rating" || lowered.includes("rating")) return "Rating";
  if (lowered === "banner" || lowered.includes("banner")) return "Banner";
  if (lowered === "accordion" || lowered.includes("accordion")) return "Accordion";
  if (lowered === "importedblock" || lowered === "imported block" || lowered.includes("imported")) return "ImportedBlock";
  if (lowered === "container" || lowered.includes("container")) return "Container";
  return "Container";
}

function isType(node: CraftRawNode | null | undefined, typeName: string): boolean {
  return getResolvedType(node).toLowerCase() === typeName.toLowerCase();
}

function isPageOrViewport(node: CraftRawNode | null | undefined): boolean {
  const t = getResolvedType(node).toLowerCase();
  return t === "page" || t === "viewport";
}

/**
 * Craft.js can serialize in two shapes:
 * 1) Storage shape: { id: { type: { resolvedName }, nodes, props, ... } }
 * 2) State shape:   { id: { type: ComponentRef, data: { nodes, props, displayName, ... } } }
 * Normalize to shape 1 so findPageIdsFromRaw and the rest of the serializer work.
 */
function normalizeCraftRaw(parsed: Record<string, unknown>): CraftRawDocument {
  const result: Record<string, CraftRawNode> = {};
  for (const [id, value] of Object.entries(parsed)) {
    if (!value || typeof value !== 'object') continue;
    const v = value as Record<string, unknown>;
    const data = v.data as Record<string, unknown> | undefined;
    const typeObj = (v.type as { resolvedName?: string }) || (data?.type as { resolvedName?: string });
    const resolvedName = typeObj?.resolvedName ?? (data?.displayName as string) ?? (v.displayName as string) ?? 'Unknown';
    const nodes = (data?.nodes ?? v.nodes) as string[] | undefined;
    const props = (data?.props ?? v.props) as Record<string, unknown> | undefined;
    const linkedNodes = (data?.linkedNodes ?? v.linkedNodes) as Record<string, string> | undefined;
    const normalizedLinkedNodes: Record<string, string> = {};
    if (linkedNodes && typeof linkedNodes === "object") {
      for (const [slot, targetId] of Object.entries(linkedNodes)) {
        if (typeof targetId === "string" && targetId.trim()) {
          normalizedLinkedNodes[slot] = targetId;
        }
      }
    }
    result[id] = {
      type: { resolvedName },
      isCanvas: (v.isCanvas as boolean) ?? false,
      props: props ?? {},
      displayName: (data?.displayName as string) ?? (v.displayName as string) ?? resolvedName,
      custom: (v.custom as Record<string, unknown>) ?? {},
      parent: (data?.parent ?? v.parent) as string | undefined,
      hidden: (v.hidden as boolean) ?? false,
      nodes: Array.isArray(nodes) ? nodes : [],
      linkedNodes: normalizedLinkedNodes,
    };
  }
  return result as CraftRawDocument;
}

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
    height: "240px",
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
    width: "fit-content",
    height: "fit-content",
    fontSize: 16,
    fontFamily: "Inter",
    fontWeight: "400",
    fontStyle: "normal",
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
    previewEditable: false,
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
  Icon: {
    iconType: "home",
    size: 24,
    color: "currentColor",
    width: "auto",
    height: "auto",
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
    link: "",
  },
  Circle: {
    color: "#10b981",
    width: "200px",
    height: "200px",
    background: undefined,
    borderColor: "transparent",
    borderWidth: 0,
    borderStyle: "solid",
    boxShadow: "none",
    opacity: 1,
    overflow: "visible",
    cursor: "default",
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
    position: "relative",
    display: "flex",
    zIndex: 0,
    top: "auto",
    right: "auto",
    bottom: "auto",
    left: "auto",
  },
  Square: {
    color: "#e74c3c",
    width: "200px",
    height: "200px",
    background: "#e74c3c",
    borderColor: "transparent",
    borderWidth: 0,
    borderStyle: "solid",
    boxShadow: "none",
    opacity: 1,
    overflow: "visible",
    cursor: "default",
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
    position: "relative",
    display: "flex",
    zIndex: 0,
    top: "auto",
    right: "auto",
    bottom: "auto",
    left: "auto",
  },
  Triangle: {
    color: "#3498db",
    width: "200px",
    height: "200px",
    background: "#3498db",
    borderColor: "transparent",
    borderWidth: 0,
    borderStyle: "solid",
    boxShadow: "none",
    opacity: 1,
    overflow: "visible",
    cursor: "default",
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
    position: "relative",
    display: "flex",
    zIndex: 0,
    top: "auto",
    right: "auto",
    bottom: "auto",
    left: "auto",
  },
  Page: {
    width: "1920px",
    height: "1200px",
    background: "#ffffff",
    canvasX: 0,
    canvasY: 0,
    pageName: "",
    pageSlug: "page",
  },
  ImportedBlock: {
    blockName: "Imported",
    blockCss: "",
    blockHtml: "<div>Empty</div>",
  },
  ProfileLogin: {
    text: "Login",
    fontSize: 34,
    fontFamily: "EB Garamond",
    fontWeight: "500",
    fontStyle: "normal",
    lineHeight: 1.22,
    letterSpacing: 0,
    color: "#000000",
    iconColor: "#000000",
    arrowSize: 20,
    avatarSrc: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=96&h=96&fit=crop&crop=face",
    avatarSize: 34,
    width: "220px",
    height: "fit-content",
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-start",
    gap: 10,
    background: "transparent",
    paddingTop: 8,
    paddingRight: 14,
    paddingBottom: 8,
    paddingLeft: 12,
    marginTop: 0,
    marginRight: 0,
    marginBottom: 0,
    marginLeft: 0,
    borderRadius: 0,
    borderColor: "transparent",
    borderWidth: 0,
    borderStyle: "solid",
    boxShadow: "none",
    opacity: 1,
    overflow: "visible",
    position: "relative",
    top: "auto",
    right: "auto",
    bottom: "auto",
    left: "auto",
    zIndex: 0,
    rotation: 0,
    customClassName: "",
  },
  Accordion: {
    items: [],
  },
};

// ─── Props that are shorthand / redundant ────────────────────────────────────
// These are always stripped because individual values (paddingTop, etc.) are
// the source of truth. The shorthand only existed as a Craft.js rendering fallback.

const SHORTHAND_PROPS = new Set(["padding", "margin"]);

const DEFAULT_ANIMATION_JSON = JSON.stringify(DEFAULT_ANIMATION);
const DEFAULT_PROTOTYPE_JSON = JSON.stringify(DEFAULT_PROTOTYPE);

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

    // Deep compare animation objects — only keep if non-default
    if (key === "animation") {
      if (value && JSON.stringify(value) !== DEFAULT_ANIMATION_JSON) {
        cleaned[key] = value;
      }
      continue;
    }

    // Deep compare prototype — only keep if non-default
    if (key === "prototype") {
      if (value && JSON.stringify(value) !== DEFAULT_PROTOTYPE_JSON) {
        cleaned[key] = value;
      }
      continue;
    }

    // Keep props that differ from defaults
    if (!(key in defaults) || defaults[key] !== value) {
      cleaned[key] = value;
    }
  }

  return cleaned;
}

/**
 * Finds the Viewport node's child IDs (page IDs) from the raw Craft tree.
 * Handles: ROOT -> Viewport -> Pages, ROOT (as Viewport) -> Pages, or ROOT -> X -> Viewport -> Pages.
 * Fallback: if no Viewport found, collect all Page nodes reachable from ROOT (BFS order).
 */
function findPageIdsFromRaw(raw: CraftRawDocument): string[] {
  const rootNode = raw["ROOT"];
  if (!rootNode || !Array.isArray(rootNode.nodes)) return [];

  if (isType(rootNode, "Viewport")) {
    return rootNode.nodes;
  }

  const firstChildId = rootNode.nodes[0];
  const firstChild = firstChildId ? raw[firstChildId] : null;
  if (isType(firstChild, "Viewport")) {
    return firstChild?.nodes ?? [];
  }

  // Walk tree from ROOT to find Viewport (e.g. ROOT -> Frame -> Viewport -> Pages)
  const stack: string[] = [...rootNode.nodes];
  while (stack.length > 0) {
    const id = stack.pop()!;
    const node = raw[id];
    if (!node) continue;
    if (isType(node, "Viewport")) {
      return node.nodes ?? [];
    }
    if (Array.isArray(node.nodes) && node.nodes.length > 0) {
      stack.push(...node.nodes);
    }
  }

  // Fallback: collect all Page nodes reachable from ROOT (BFS order)
  const pageIds: string[] = [];
  const queue: string[] = [...rootNode.nodes];
  const seen = new Set<string>(['ROOT']);
  while (queue.length > 0) {
    const id = queue.shift()!;
    if (seen.has(id)) continue;
    seen.add(id);
    const node = raw[id];
    if (!node) continue;
    if (isType(node, "Page")) {
      pageIds.push(id);
    }
    if (Array.isArray(node.nodes)) {
      queue.push(...node.nodes);
    }
  }
  return pageIds;
}

/**
 * Transforms raw Craft.js serialized JSON into a clean BuilderDocument.
 *
 * @param rawJson - The JSON string from `query.serialize()`
 * @returns A clean, editor-agnostic BuilderDocument
 */
export function serializeCraftToClean(rawJson: string, files?: CodeFile[]): BuilderDocument {
  const parsed = JSON.parse(rawJson) as Record<string, unknown>;
  const raw = normalizeCraftRaw(parsed);

  const rootNode = raw["ROOT"];
  if (!rootNode) {
    throw new Error("Invalid Craft.js JSON: missing ROOT node");
  }

  const pages: PageNode[] = [];
  const nodes: Record<string, CleanNode> = {};

  const pageIds = findPageIdsFromRaw(raw);

  // Backward compatibility: some drafts may have components directly under ROOT/Viewport
  // without explicit Page nodes. Build a synthetic single page so preview/save won't be empty.
  if (pageIds.length === 0) {
    const rootChildren = Array.isArray(rootNode.nodes) ? rootNode.nodes : [];
    const validChildren = rootChildren.filter((id) => {
      const child = raw[id];
      return !!child && !isPageOrViewport(child);
    });

    if (validChildren.length > 0) {
      const syntheticPageId = "page-root";
      pages.push({
        id: syntheticPageId,
        name: "Page 1",
        slug: "page-0",
        props: cleanProps("Page", {}),
        children: validChildren,
      });
      processChildren(validChildren, raw, nodes);

      return {
        version: 2,
        pages,
        nodes,
        files,
      };
    }
  }

  pageIds.forEach((pageId, index) => {
    const pageRaw = raw[pageId];
    if (!pageRaw || !isType(pageRaw, "Page")) {
      console.warn('⚠️ Serializer: Skipping node that is not a Page:', pageId);
      return;
    }

    const pageProps = pageRaw.props ?? {};
    // If pageProps.pageName is an empty string, keep it empty
    const name = typeof pageProps.pageName === 'string' ? pageProps.pageName : `Page ${index + 1}`;
    const slug = (pageProps.pageSlug as string) ?? `page-${index}`;

    const pageLinkedChildIds = pageRaw.linkedNodes
      ? Object.values(pageRaw.linkedNodes).filter((childId) => typeof childId === "string")
      : [];
    const validChildren = [...(pageRaw.nodes ?? []), ...pageLinkedChildIds].filter((childId) => {
      const child = raw[childId];
      return !!child && !isPageOrViewport(child);
    });

    pages.push({
      id: pageId,
      name,
      slug,
      props: cleanProps("Page", pageRaw.props),
      children: validChildren,
    });

    processChildren(validChildren, raw, nodes);
  });

  return {
    version: 2,
    pages,
    nodes,
    files,
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
    if (!rawNode) {
      console.warn(`⚠️ Serializer: Node ID ${id} not found in raw data!`);
      continue;
    }

    // Already processed (shared node)
    if (nodes[id]) continue;

    const type = normalizeComponentType(getResolvedType(rawNode));

    const linkedChildIds = rawNode.linkedNodes
      ? Object.values(rawNode.linkedNodes).filter((linkedId) => typeof linkedId === "string")
      : [];
    const combinedChildIds = [...(rawNode.nodes ?? []), ...linkedChildIds].filter((childId) => {
      const child = raw[childId];
      return !!child && !isPageOrViewport(child);
    });

    nodes[id] = {
      type,
      props: cleanProps(type, rawNode.props),
      children: combinedChildIds,
    };

    // Recurse into children
    if (combinedChildIds.length > 0) {
      processChildren(combinedChildIds, raw, nodes);
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

  // Reconstruct Pages (backward compat: name/slug default from index)
  doc.pages.forEach((page, index) => {
    const defaults = COMPONENT_DEFAULTS["Page"] ?? {};
    const name = (page.props?.pageName as string) ?? page.name ?? `Page ${index + 1}`;
    const slug = (page.props?.pageSlug as string) ?? page.slug ?? `page-${index}`;
    const validChildren = page.children ?? [];
    craft[page.id] = {
      type: { resolvedName: "Page" },
      isCanvas: true,
      props: { ...defaults, ...page.props, pageName: name, pageSlug: slug },
      displayName: "Page",
      custom: {},
      parent: "ROOT",
      hidden: false,
      nodes: validChildren,
      linkedNodes: {},
    };

    // Reconstruct child nodes
    reconstructChildren(page.children, page.id, doc.nodes, craft);
  });

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
    if (!cleanNode) {
      console.warn(`⚠️ Node ${parentId} references missing child node: ${id}`);
      continue;
    }

    // Already reconstructed
    if (craft[id]) continue;

    // Validate that the node has a type
    if (!cleanNode.type) {
      console.error(`❌ Node ${id} is missing required 'type' property. Skipping.`);
      continue;
    }

    const defaults = COMPONENT_DEFAULTS[cleanNode.type] ?? {};
    const canvasTypes = new Set([
      "Container",
      "Section",
      "Row",
      "Column",
      "Button",
      "Circle",
      "Square",
      "Triangle",
      // Complex layout / wrapper components that host other blocks
      "Tabs",
      "TabContent",
    ]);

    // Validate and filter children to only include existing nodes
    const validChildren = (cleanNode.children || []).filter((childId) => {
      const exists = !!nodes[childId];
      if (!exists) {
        console.warn(`⚠️ Node ${id} references missing child node: ${childId}`);
      }
      return exists;
    });

    const baseProps = { ...defaults, ...cleanNode.props };

    // Tabs uses nested canvases via Craft's linkedNodes (e.g. tab-content-tab-xxx).
    // IMPORTANT: use the tab's stored content id when it looks like a canvas id,
    // to preserve legacy drafts that used custom ids. Fallback to tab-content-${tab.id}.
    const isTabs = cleanNode.type === "Tabs";
    const tabs = (isTabs ? (baseProps as any).tabs : null) as Array<{ id?: string; content?: unknown }> | null;
    const linkedNodes: Record<string, string> = {};
    if (isTabs && Array.isArray(tabs)) {
      for (const t of tabs) {
        const tabId = (t?.id ?? "").toString();
        if (!tabId) continue;
        const maybeContent = typeof t?.content === "string" ? t.content.trim() : "";
        const canvasId =
          maybeContent && (maybeContent.startsWith("tab-content-") || maybeContent.startsWith("tab-content"))
            ? maybeContent
            : `tab-content-${tabId}`;
        if (nodes[canvasId]) {
          linkedNodes[canvasId] = canvasId;
        }
      }
    }

    craft[id] = {
      type: { resolvedName: cleanNode.type },
      isCanvas: canvasTypes.has(cleanNode.type),
      props: baseProps,
      displayName: cleanNode.type,
      custom: {},
      parent: parentId,
      hidden: false,
      // For Tabs, tab content canvases must be linkedNodes (not direct children).
      nodes: isTabs ? [] : validChildren,
      linkedNodes: isTabs ? linkedNodes : {},
    };

    // Recurse
    if (validChildren.length > 0) {
      reconstructChildren(validChildren, id, nodes, craft);
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
