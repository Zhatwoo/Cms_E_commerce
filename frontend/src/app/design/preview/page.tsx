"use client";

import React, { useEffect, useMemo, useRef, useState, Suspense } from "react";
import { ArrowLeft, Copy, Check, Download, Layers, Braces, Save, Globe, Upload, Monitor, Tablet, Smartphone, Lock, X, RotateCw } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Editor, Frame } from "@craftjs/core";
import { deserializeCleanToCraft, serializeCraftToClean } from "../_lib/serializer";
import { parseContentToCleanDoc } from "../_lib/contentParser";
import { migratePublishedContent } from "../_lib/contentMigration";
import { autoSavePage, getDraft } from "../_lib/pageApi";
import { WebPreview } from "../_lib/webRenderer";
import { PREVIEW_MOBILE_BREAKPOINT, PREVIEW_TABLET_BREAKPOINT, PREVIEW_MOBILE_VIEWPORT_WIDTH, PREVIEW_TABLET_VIEWPORT_WIDTH } from "../_lib/viewportConstants";
import { CRAFT_RESOLVER } from "../_components/craftResolver";
import {
  Diamond,
  Heart,
  Trapezoid,
  Pentagon,
  Hexagon,
  Heptagon,
  Octagon,
  Nonagon,
  Decagon,
  Parallelogram,
  Kite,
} from "../../_assets/shapes/additional_shapes";
import { templateService } from "@/lib/templateService";
import { useAlert } from "@/app/m_dashboard/components/context/alert-context";
import { apiFetch, getProject, getSchedule, getStoredUser, publishProject, schedulePublish, updateProject, getMyDomains, getMe, uploadMediaApi, listProducts, type Project, type ApiProduct } from "@/lib/api";
import { getSubdomainSiteUrl } from "@/lib/siteUrls";
import { getLimits } from "@/lib/subscriptionLimits";
import html2canvas from "html2canvas";

const DEFAULT_PROJECT_ID = "Leb2oTDdXU3Jh2wdW1sI";
const STORAGE_KEY_PREFIX = "craftjs_preview_json";
const PERSISTENT_STORAGE_KEY_PREFIX = "craftjs_preview_persist";

function looksLikeCraftRawSnapshot(value: string): boolean {
  try {
    const parsed = JSON.parse(value);
    return Boolean(parsed && typeof parsed === "object" && "ROOT" in parsed);
  } catch {
    return false;
  }
}

function looksLikeCleanDocSnapshot(value: string): boolean {
  try {
    const parsed = JSON.parse(value);
    return Boolean(
      parsed &&
      typeof parsed === "object" &&
      "version" in parsed &&
      "pages" in parsed &&
      "nodes" in parsed
    );
  } catch {
    return false;
  }
}

function PreviewRoot({ children }: { children?: React.ReactNode }) {
  useEffect(() => {
    // Force GSAP to recalculate all trigger positions once the content is likely rendered
    const timer = setTimeout(() => {
      if (typeof window !== "undefined") {
        gsap.registerPlugin(ScrollTrigger);
        ScrollTrigger.refresh();
      }
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div
      data-preview-root
      className="preview-fadein preview-scroll"
      style={{
        position: "relative",
        width: "100%",
        minHeight: "100%",
        padding: 0,
        margin: 0,
        overflow: "visible",
        background: "transparent",
      }}
    >
      {children}
    </div>
  );
}

const SAFE_PREVIEW_CONTAINER: React.ComponentType<any> =
  (typeof (CRAFT_RESOLVER as Record<string, unknown>).Container === "function"
    ? ((CRAFT_RESOLVER as Record<string, unknown>).Container as React.ComponentType<any>)
    : null) ??
  ((props: any) => React.createElement("div", props, props?.children));

const asComponent = (value: unknown): React.ComponentType<any> =>
  typeof value === "function" ? (value as React.ComponentType<any>) : SAFE_PREVIEW_CONTAINER;

function withResolverFallback<T extends Record<string, React.ComponentType<any>>>(base: T): T {
  const shapes = ["circle", "square", "triangle", "rectangle", "diamond", "heart", "trapezoid", "pentagon", "hexagon", "heptagon", "octagon", "nonagon", "decagon", "parallelogram", "kite"];

  return new Proxy(base, {
    get(target, prop, receiver) {
      const direct = Reflect.get(target, prop, receiver);
      if (direct) return direct;
      if (typeof prop !== "string") return direct;

      const normalized = prop.trim().toLowerCase();

      // Fuzzy shape match for numbered names (e.g. "Heart 1" -> "Heart")
      const fuzzyShape = shapes.find(s => normalized.includes(s));
      if (fuzzyShape) {
        const canonical = fuzzyShape.charAt(0).toUpperCase() + fuzzyShape.slice(1);
        const shapeComp = Reflect.get(target, canonical, receiver) || Reflect.get(target, fuzzyShape, receiver);
        if (shapeComp) return shapeComp;
      }

      const resolved =
        Reflect.get(target, prop.trim(), receiver) ||
        Reflect.get(target, normalized, receiver) ||
        Reflect.get(target, normalized.charAt(0).toUpperCase() + normalized.slice(1), receiver);

      return resolved || target.Container || SAFE_PREVIEW_CONTAINER;
    },
    has(target, prop) {
      if (Reflect.has(target, prop)) return true;
      if (typeof prop !== "string") {
        return Reflect.has(target, "Container") || Reflect.has(target, "container");
      }

      return true;
    },
  }) as T;
}

// Craft validates resolver membership eagerly; ensure PreviewRoot exists as a real key.
const PREVIEW_CRAFT_RESOLVER = withResolverFallback({
  ...CRAFT_RESOLVER,
  ProfileLogin: asComponent((CRAFT_RESOLVER as Record<string, unknown>).ProfileLogin),
  profilelogin: asComponent((CRAFT_RESOLVER as Record<string, unknown>).profilelogin),
  ProfileLoginNode: asComponent((CRAFT_RESOLVER as Record<string, unknown>).ProfileLoginNode ?? (CRAFT_RESOLVER as Record<string, unknown>).ProfileLogin),
  profileloginnode: asComponent((CRAFT_RESOLVER as Record<string, unknown>).profileloginnode ?? (CRAFT_RESOLVER as Record<string, unknown>).profilelogin),
  BooleanField: asComponent((CRAFT_RESOLVER as Record<string, unknown>).BooleanField),
  booleanfield: asComponent((CRAFT_RESOLVER as Record<string, unknown>).booleanfield),
  BOOLEANFIELD: asComponent((CRAFT_RESOLVER as Record<string, unknown>).BOOLEANFIELD),
  "Boolean Field": asComponent((CRAFT_RESOLVER as Record<string, unknown>)["Boolean Field"]),
  "boolean field": asComponent((CRAFT_RESOLVER as Record<string, unknown>)["boolean field"]),
  Checkbox: asComponent((CRAFT_RESOLVER as Record<string, unknown>).Checkbox),
  checkbox: asComponent((CRAFT_RESOLVER as Record<string, unknown>).checkbox),
  CheckBox: asComponent((CRAFT_RESOLVER as Record<string, unknown>).CheckBox),
  Radio: asComponent((CRAFT_RESOLVER as Record<string, unknown>).Radio),
  radio: asComponent((CRAFT_RESOLVER as Record<string, unknown>).radio),
  Diamond: asComponent(Diamond),
  Heart: asComponent(Heart),
  Trapezoid: asComponent(Trapezoid),
  Pentagon: asComponent(Pentagon),
  Hexagon: asComponent(Hexagon),
  Heptagon: asComponent(Heptagon),
  Octagon: asComponent(Octagon),
  Nonagon: asComponent(Nonagon),
  Decagon: asComponent(Decagon),
  Parallelogram: asComponent(Parallelogram),
  Kite: asComponent(Kite),
  PreviewRoot: asComponent(PreviewRoot),
  previewroot: asComponent(PreviewRoot),
  PREVIEWROOT: asComponent(PreviewRoot),
} as typeof CRAFT_RESOLVER & {
  PreviewRoot: typeof PreviewRoot;
  previewroot: typeof PreviewRoot;
  PREVIEWROOT: typeof PreviewRoot;
});

function PreviewRenderNode(props: { render: React.ReactElement }) {
  return props.render;
}

type CraftStorageNode = {
  type: { resolvedName: string };
  isCanvas: boolean;
  props: Record<string, unknown>;
  displayName: string;
  custom: Record<string, unknown>;
  parent?: string;
  hidden: boolean;
  nodes: string[];
  linkedNodes: Record<string, string>;
};

const PREVIEW_CANONICAL_NAME_BY_LOWER = new Map<string, string>();
Object.keys(PREVIEW_CRAFT_RESOLVER as Record<string, unknown>).forEach((k) => {
  const lowered = k.toLowerCase();
  if (!PREVIEW_CANONICAL_NAME_BY_LOWER.has(lowered)) PREVIEW_CANONICAL_NAME_BY_LOWER.set(lowered, k);
});

function canonicalResolvedName(rawName: unknown): string {
  const name = typeof rawName === "string" ? rawName.trim() : "";
  if (!name) return "Container";
  const lowered = name.toLowerCase();
  const exact = PREVIEW_CANONICAL_NAME_BY_LOWER.get(lowered);
  if (exact) return exact;
  if (lowered === "tab content" || lowered.includes("tabcontent")) return "TabContent";
  if (lowered.includes("tabs")) return "Tabs";
  if (lowered.includes("image")) return "Image";
  if (lowered.includes("text")) return "Text";
  if (lowered.includes("button")) return "Button";
  if (lowered.includes("divider")) return "Divider";
  if (lowered.includes("banner")) return "Banner";
  if (lowered.includes("badge")) return "Badge";
  if (lowered.includes("profilelogin") || lowered.includes("profile login") || lowered.includes("profile-login")) return "ProfileLogin";
  if (lowered.includes("pagination")) return "Pagination";
  if (lowered.includes("boolean") || lowered.includes("checkbox") || lowered.includes("radio")) return "BooleanField";
  if (lowered.includes("accordion")) return "Accordion";
  if (lowered.includes("viewport")) return "Viewport";
  if (lowered.includes("page")) return "Page";
  if (lowered.includes("rectangle")) return "Rectangle";
  if (lowered.includes("diamond")) return "Diamond";
  if (lowered.includes("heart")) return "Heart";
  if (lowered.includes("trapezoid")) return "Trapezoid";
  if (lowered.includes("pentagon")) return "Pentagon";
  if (lowered.includes("hexagon")) return "Hexagon";
  if (lowered.includes("heptagon")) return "Heptagon";
  if (lowered.includes("octagon")) return "Octagon";
  if (lowered.includes("nonagon")) return "Nonagon";
  if (lowered.includes("decagon")) return "Decagon";
  if (lowered.includes("parallelogram")) return "Parallelogram";
  if (lowered.includes("kite")) return "Kite";
  return "Container";
}

function validateCraftFrameDataForPreview(jsonString: string): { valid: boolean; data?: string } {
  try {
    const parsed = JSON.parse(jsonString) as Record<string, any>;
    if (!parsed || typeof parsed !== "object" || !parsed.ROOT) return { valid: false };

    const allIds = Object.keys(parsed);
    const invalidNodes: string[] = [];
    const validIds = new Set(
      allIds.filter((id) => {
        const node = parsed[id];
        if (!node || typeof node !== "object") {
          invalidNodes.push(id);
          return false;
        }
        if (!node.type) {
          invalidNodes.push(id);
          return false;
        }
        const resolved =
          typeof node.type === "string"
            ? canonicalResolvedName(node.type)
            : canonicalResolvedName(node.type?.resolvedName);
        node.type = { resolvedName: resolved };
        node.displayName = resolved;
        if (!Array.isArray(node.nodes)) node.nodes = [];
        if (!node.linkedNodes || typeof node.linkedNodes !== "object") node.linkedNodes = {};
        if (!node.props || typeof node.props !== "object") node.props = {};
        if (!node.custom || typeof node.custom !== "object") node.custom = {};
        if (typeof node.hidden !== "boolean") node.hidden = false;
        return true;
      })
    );

    if (invalidNodes.length > allIds.length * 0.5) return { valid: false };

    const visited = new Set<string>();
    const cleanRefs = (id: string) => {
      if (visited.has(id)) return;
      visited.add(id);
      const node = parsed[id];
      if (!node) return;

      if (Array.isArray(node.nodes)) {
        node.nodes = node.nodes.filter((childId: unknown) => typeof childId === "string" && validIds.has(childId));
        node.nodes.forEach((childId: string) => cleanRefs(childId));
      }

      if (node.linkedNodes && typeof node.linkedNodes === "object") {
        for (const [k, v] of Object.entries(node.linkedNodes)) {
          if (typeof v !== "string" || !validIds.has(v)) delete node.linkedNodes[k];
        }
      }
    };

    cleanRefs("ROOT");
    invalidNodes.forEach((id) => delete parsed[id]);

    return { valid: true, data: JSON.stringify(parsed) };
  } catch {
    return { valid: false };
  }
}

function sanitizeCraftStorageDoc(input: Record<string, any>): Record<string, CraftStorageNode> {
  const existing = new Set(Object.keys(input));
  const out: Record<string, CraftStorageNode> = {};

  for (const [id, rawNode] of Object.entries(input)) {
    const n = (rawNode && typeof rawNode === "object") ? (rawNode as any) : {};
    const typeName =
      (n.type && typeof n.type === "object" && typeof n.type.resolvedName === "string" && n.type.resolvedName) ||
      "Container";

    const nodes = Array.isArray(n.nodes) ? (n.nodes as unknown[]).filter((x): x is string => typeof x === "string" && existing.has(x)) : [];
    const linkedNodesObj = (n.linkedNodes && typeof n.linkedNodes === "object") ? (n.linkedNodes as Record<string, unknown>) : {};
    const linkedNodes: Record<string, string> = {};
    for (const [k, v] of Object.entries(linkedNodesObj)) {
      if (typeof v === "string" && existing.has(v)) linkedNodes[k] = v;
    }

    out[id] = {
      type: { resolvedName: String(typeName) },
      isCanvas: Boolean(n.isCanvas),
      props: (n.props && typeof n.props === "object") ? (n.props as Record<string, unknown>) : {},
      displayName: String(n.displayName ?? typeName),
      custom: (n.custom && typeof n.custom === "object") ? (n.custom as Record<string, unknown>) : {},
      parent: typeof n.parent === "string" ? n.parent : undefined,
      hidden: Boolean(n.hidden),
      nodes,
      linkedNodes,
    };
  }

  return out;
}

/**
 * Craft.js can serialize in two shapes:
 * - Storage shape: { id: { type: { resolvedName }, nodes, props, ... } }
 * - State shape:   { id: { type: ComponentRef, data: { nodes, props, displayName, ... } } }
 * Frame expects storage shape. Normalize so preview doesn't crash.
 */
function normalizeCraftToStorageShape(raw: string): string {
  try {
    const parsed = JSON.parse(raw) as Record<string, any>;
    if (!parsed || typeof parsed !== "object") return raw;

    const root = parsed.ROOT;
    const alreadyStorage =
      root &&
      typeof root === "object" &&
      root.type &&
      typeof root.type === "object" &&
      typeof root.type.resolvedName === "string";
    if (alreadyStorage) {
      const sanitized = sanitizeCraftStorageDoc(parsed);
      for (const node of Object.values(sanitized)) {
        const canonicalType = canonicalResolvedName(node.type?.resolvedName);
        node.type = { resolvedName: canonicalType };
        node.displayName = canonicalResolvedName(node.displayName ?? canonicalType);
      }
      const validated = validateCraftFrameDataForPreview(JSON.stringify(sanitized));
      return validated.valid && validated.data ? validated.data : JSON.stringify(sanitized);
    }

    const result: Record<string, CraftStorageNode> = {};
    for (const [id, value] of Object.entries(parsed)) {
      if (!value || typeof value !== "object") continue;
      const v = value as Record<string, any>;
      const data = (v.data && typeof v.data === "object") ? (v.data as Record<string, any>) : undefined;

      const resolvedName =
        (v.type && typeof v.type === "object" && typeof (v.type as any).resolvedName === "string" && (v.type as any).resolvedName) ||
        (data?.type && typeof data.type === "object" && typeof (data.type as any).resolvedName === "string" && (data.type as any).resolvedName) ||
        (data?.displayName as string) ||
        (v.displayName as string) ||
        "Container";

      const nodes = (data?.nodes ?? v.nodes) as unknown;
      const linkedNodes = (data?.linkedNodes ?? v.linkedNodes) as unknown;
      const props = (data?.props ?? v.props) as unknown;

      result[id] = {
        type: { resolvedName: canonicalResolvedName(resolvedName) },
        isCanvas: Boolean(v.isCanvas ?? data?.isCanvas ?? false),
        props: (props && typeof props === "object") ? (props as Record<string, unknown>) : {},
        displayName: canonicalResolvedName(data?.displayName ?? v.displayName ?? resolvedName),
        custom: (v.custom && typeof v.custom === "object") ? (v.custom as Record<string, unknown>) : {},
        parent: (data?.parent ?? v.parent) as string | undefined,
        hidden: Boolean(v.hidden ?? data?.hidden ?? false),
        nodes: Array.isArray(nodes) ? (nodes as string[]) : [],
        linkedNodes:
          linkedNodes && typeof linkedNodes === "object"
            ? Object.fromEntries(
              Object.entries(linkedNodes as Record<string, unknown>)
                .filter(([, vv]) => typeof vv === "string")
                .map(([kk, vv]) => [kk, vv as string])
            )
            : {},
      };
    }

    const validated = validateCraftFrameDataForPreview(JSON.stringify(sanitizeCraftStorageDoc(result)));
    return validated.valid && validated.data ? validated.data : JSON.stringify(sanitizeCraftStorageDoc(result));
  } catch {
    return raw;
  }
}

function normalizeCraftSnapshotForPreview(raw: string, preferredPageSlug?: string): string {
  try {
    const parsed = JSON.parse(raw) as Record<string, any>;
    if (!parsed || typeof parsed !== "object" || !parsed.ROOT) return raw;

    const root = parsed.ROOT as any;
    const rootNodes: string[] = Array.isArray(root.nodes) ? root.nodes : [];

    const resolvePageId = (): string | null => {
      if (!rootNodes.length) return null;
      if (!preferredPageSlug) return rootNodes[0] ?? null;

      for (const id of rootNodes) {
        const n = parsed[id];
        const props = n?.props ?? n?.data?.props ?? {};
        const slug = typeof props.pageSlug === "string" ? props.pageSlug : undefined;
        if (slug && slug === preferredPageSlug) return id;
      }
      return rootNodes[0] ?? null;
    };

    const pageId = resolvePageId();
    if (!pageId) return raw;

    // Convert ROOT into a lightweight preview root so we don't inherit infinite-canvas sizing.
    parsed.ROOT = {
      ...(parsed.ROOT ?? {}),
      type: { resolvedName: "PreviewRoot" },
      displayName: "PreviewRoot",
      props: {},
      nodes: [pageId],
      isCanvas: true,
    };

    // Bring the selected page to (0,0) so it appears immediately in preview.
    const pageNode = parsed[pageId];
    if (pageNode) {
      const nextProps = { ...(pageNode.props ?? {}) };
      nextProps.canvasX = 0;
      nextProps.canvasY = 0;
      parsed[pageId] = {
        ...pageNode,
        parent: "ROOT",
        props: nextProps,
      };
    }

    const validated = validateCraftFrameDataForPreview(JSON.stringify(sanitizeCraftStorageDoc(parsed)));
    return validated.valid && validated.data ? validated.data : JSON.stringify(sanitizeCraftStorageDoc(parsed));
  } catch {
    return raw;
  }
}

/**
 * Readonly renderer that matches the Craft.js canvas exactly.
 * Used in Preview when we have a valid Craft raw snapshot (contains ROOT).
 */
function CraftCanvasPreview({ data }: { data: string }) {
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);

  if (!mounted) return null;

  return (
    <Editor enabled={false} resolver={PREVIEW_CRAFT_RESOLVER} onRender={PreviewRenderNode}>
      <Frame data={data} />
    </Editor>
  );
}

function readPageDimensionsFromCraftSnapshot(
  craftJson: string,
  preferredPageSlug?: string
): { width?: string | number; height?: string | number } | null {
  try {
    const parsed = JSON.parse(craftJson) as Record<string, any>;
    const root = parsed?.ROOT;
    const rootNodes: string[] = Array.isArray(root?.nodes) ? root.nodes : [];
    if (rootNodes.length === 0) return null;

    const pickPageId = (): string | null => {
      if (!preferredPageSlug) return rootNodes[0] ?? null;
      for (const id of rootNodes) {
        const node = parsed[id];
        const props = node?.props ?? {};
        const slug = typeof props.pageSlug === "string" ? props.pageSlug : undefined;
        if (slug && slug === preferredPageSlug) return id;
      }
      return rootNodes[0] ?? null;
    };

    const pageId = pickPageId();
    if (!pageId) return null;
    const pageNode = parsed[pageId];
    const props = (pageNode?.props ?? {}) as Record<string, unknown>;
    return {
      width: props.width as any,
      height: props.height as any,
    };
  } catch {
    return null;
  }
}

type ViewMode = "Web-Preview" | "clean" | "raw";
type PreviewViewport = "desktop" | "tablet" | "mobile";

function PreviewContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const projectId = searchParams.get("projectId") || DEFAULT_PROJECT_ID;
  const initialPageSlug = searchParams.get("page") ?? undefined;
  const { showAlert } = useAlert();
  const [rawJson, setRawJson] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("Web-Preview");
  const [previewViewport, setPreviewViewport] = useState<PreviewViewport>("desktop");
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [loading, setLoading] = useState(true);
  const [templateName, setTemplateName] = useState("");
  const [templateCategory, setTemplateCategory] = useState("Landing Page");
  const [templateDescription, setTemplateDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [showPublishDialog, setShowPublishDialog] = useState(false);
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [publishDomainName, setPublishDomainName] = useState("");
  const [publishDomainError, setPublishDomainError] = useState("");
  const [showPublishedSuccessModal, setShowPublishedSuccessModal] = useState(false);
  const [publishedSubdomain, setPublishedSubdomain] = useState<string | null>(null);
  const [publishMode, setPublishMode] = useState<"now" | "schedule">("now");
  const [scheduledAt, setScheduledAt] = useState("");
  const [scheduleInfo, setScheduleInfo] = useState<{ scheduledAt: string; subdomain: string | null } | null>(null);
  const [scheduling, setScheduling] = useState(false);
  const [project, setProject] = useState<Project | null>(null);
  const [previewProducts, setPreviewProducts] = useState<ApiProduct[]>([]);
  const [previewCart, setPreviewCart] = useState<Array<{ id: string; name: string; price: number; image?: string; quantity: number }>>([]);
  const [previewCartOpen, setPreviewCartOpen] = useState(false);
  const [previewLastAddedAt, setPreviewLastAddedAt] = useState(0);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [selectedPreviewPageSlug, setSelectedPreviewPageSlug] = useState<string | undefined>(initialPageSlug);
  const previewRef = useRef<HTMLDivElement | null>(null);
  const thumbnailCaptureRef = useRef(false);


  useEffect(() => {
    getMe().then((res: any) => {
      if (res.success && res.user) setCurrentUser(res.user);
    });
  }, []);

  const readSessionSnapshot = (targetProjectId: string): string | null => {
    if (typeof window === "undefined") return null;
    try {
      const perProject = window.sessionStorage.getItem(`${STORAGE_KEY_PREFIX}_${targetProjectId}`);
      if (perProject) return perProject;
      return window.sessionStorage.getItem(STORAGE_KEY_PREFIX);
    } catch {
      return null;
    }
  };

  const readPersistentSnapshot = (targetProjectId: string): string | null => {
    if (typeof window === "undefined") return null;
    try {
      return window.localStorage.getItem(`${PERSISTENT_STORAGE_KEY_PREFIX}_${targetProjectId}`);
    } catch {
      return null;
    }
  };

  const readLatestSnapshot = (targetProjectId: string): string | null => {
    const session = readSessionSnapshot(targetProjectId);
    if (session) {
      if (looksLikeCraftRawSnapshot(session)) return session;
      if (looksLikeCleanDocSnapshot(session)) return session;
    }

    const persistent = readPersistentSnapshot(targetProjectId);
    if (persistent) {
      if (looksLikeCraftRawSnapshot(persistent)) return persistent;
      if (looksLikeCleanDocSnapshot(persistent)) return persistent;
    }

    // Ignore invalid cache values; let API draft load next.
    return null;
  };

  /** Fetch published content from the same API the live subdomain uses. */
  const loadPublishedContent = React.useCallback(async (subdomain: string): Promise<string | null> => {
    try {
      const data = await apiFetch<{
        success?: boolean;
        data?: { content?: unknown };
        projectTitle?: string;
      }>(`/api/public/sites/${encodeURIComponent(subdomain.trim().toLowerCase())}?t=${Date.now()}`, {
        method: "GET",
      });
      const content = data?.data?.content;
      if (!content) return null;
      let clean = parseContentToCleanDoc(content);
      if (!clean) return null;
      clean = migratePublishedContent(clean) as any;
      return JSON.stringify(clean);
    } catch {
      return null;
    }
  }, []);

  const clearSnapshotCache = (targetProjectId: string) => {
    if (typeof window === "undefined") return;
    try { window.sessionStorage.removeItem(`${STORAGE_KEY_PREFIX}_${targetProjectId}`); } catch { /* ignore */ }
    try { window.sessionStorage.removeItem(STORAGE_KEY_PREFIX); } catch { /* ignore */ }
    try { window.localStorage.removeItem(`${PERSISTENT_STORAGE_KEY_PREFIX}_${targetProjectId}`); } catch { /* ignore */ }
  };

  const handleRefresh = React.useCallback(async () => {
    setLoading(true);
    try {
      // 1. Try to load the latest snapshot (Session/Local) for instant parity with editor
      const cache = readLatestSnapshot(projectId);
      if (cache) {
        setRawJson(cache);
        setLoading(false);
        return;
      }

      // 2. Try the Draft API (Firestore)
      const result = await getDraft(projectId);
      if (result.success && result.data?.content) {
        const content = result.data.content;
        setRawJson(typeof content === "object" ? JSON.stringify(content) : content);
        setLoading(false);
        return;
      }

      // 3. Fallback to Published Content
      if (project?.subdomain) {
        const published = await loadPublishedContent(project.subdomain);
        if (published) {
          setRawJson(published);
        }
      }
    } catch (e) {
      console.error("Preview refresh error:", e);
    } finally {
      setLoading(false);
    }
  }, [projectId, project?.subdomain, loadPublishedContent]);

  // Fetch project metadata so we know the subdomain
  useEffect(() => {
    let cancelled = false;
    async function loadProject() {
      try {
        const res = await getProject(projectId);
        if (!cancelled && res.success && res.project) setProject(res.project);
      } catch { /* ignore */ }
    }
    loadProject();
    return () => { cancelled = true; };
  }, [projectId]);

  // Main data loader: load published content (same as live subdomain) when available.
  // Depends on `project` so it re-runs once project metadata (with subdomain) arrives.
  useEffect(() => {
    let cancelled = false;

    async function loadData() {
      if (!project) return;
      setLoading(true);
      try {
        // 1. Try local snapshot first (Instant parity with Editor)
        const snapshot = readLatestSnapshot(projectId);
        if (snapshot && !cancelled) {
          setRawJson(snapshot);
          setLoading(false);
          return;
        }

        // 2. Try Draft API
        const timeoutMs = 8000;
        const result = await Promise.race([
          getDraft(projectId),
          new Promise<{ success: false; timeout: true }>((resolve) =>
            window.setTimeout(() => resolve({ success: false, timeout: true }), timeoutMs)
          ),
        ]);

        if (cancelled) return;

        if (result.success && result.data?.content) {
          const content = result.data.content;
          if (typeof content === "object") {
            setRawJson(JSON.stringify(content));
          } else {
            setRawJson(content);
          }
          setLoading(false);
          return;
        }

        // 3. Last fallback: Published Content
        if (project.subdomain) {
          const published = await loadPublishedContent(project.subdomain);
          if (!cancelled && published) {
            setRawJson(published);
          }
        }
      } catch (error) {
        console.error("Preview: Load error:", error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadData();
    return () => { cancelled = true; };
  }, [projectId, project?.subdomain, loadPublishedContent]);

  // Optional sync with published site when tab becomes visible — do NOT replace draft/session preview.
  useEffect(() => {
    const onVisibilityChange = () => {
      if (document.visibilityState !== "visible" || !project?.subdomain) return;
      // User is previewing local/editor snapshot — refetching published overwrites JSON and causes layout jumps.
      const local = readLatestSnapshot(projectId);
      if (local) return;
      loadPublishedContent(project.subdomain).then((published) => {
        if (published) {
          clearSnapshotCache(projectId);
          setRawJson(published);
        }
      });
    };
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => document.removeEventListener("visibilitychange", onVisibilityChange);
  }, [projectId, project?.subdomain, loadPublishedContent]);


  // Fetch products for the preview store context
  useEffect(() => {
    const subdomain = project?.subdomain;
    if (!subdomain) return;
    let active = true;
    listProducts({ subdomain, status: 'active', limit: 100 })
      .then((res) => { if (active && res.success) setPreviewProducts(res.items); })
      .catch(() => {});
    return () => { active = false; };
  }, [project?.subdomain]);

  const previewAddToCart = React.useCallback(
    (product: { id: string; name: string; price: number; image?: string }) => {
      setPreviewCart((prev) => {
        const existing = prev.find((i) => i.id === product.id);
        if (existing) return prev.map((i) => i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i);
        return [...prev, { ...product, quantity: 1 }];
      });
      setPreviewLastAddedAt(Date.now());
    },
    []
  );

  const previewStoreContext = React.useMemo(
    () => previewProducts.length > 0 ? { products: previewProducts, addToCart: previewAddToCart } : null,
    [previewProducts, previewAddToCart]
  );


  // Compute clean document
  const cleanDoc = useMemo(() => {
    if (!rawJson) return null;
    return parseContentToCleanDoc(rawJson);
  }, [rawJson]);

  // Keep preview animation behavior identical to editor canvas.
  const effectiveCleanDoc = useMemo(() => {
    let doc = cleanDoc;
    if (!doc && rawJson && looksLikeCraftRawSnapshot(rawJson)) {
      try {
        doc = serializeCraftToClean(rawJson);
      } catch {
        return null;
      }
    }
    return doc ?? null;
  }, [cleanDoc, rawJson]);

  const craftPreviewData = useMemo(() => {
    if (!rawJson) return null;
    if (!looksLikeCraftRawSnapshot(rawJson)) return null;
    const storage = normalizeCraftToStorageShape(rawJson);
    return normalizeCraftSnapshotForPreview(storage, selectedPreviewPageSlug);
  }, [rawJson, selectedPreviewPageSlug]);

  const craftPageDimensions = useMemo(() => {
    if (!craftPreviewData) return null;
    return readPageDimensionsFromCraftSnapshot(craftPreviewData, selectedPreviewPageSlug);
  }, [craftPreviewData, selectedPreviewPageSlug]);

  const craftDesktopPreviewStyle = useMemo<React.CSSProperties>(() => {
    const fallback: React.CSSProperties = { width: "100%" };

    if (!craftPageDimensions?.width) return fallback;
    const w = craftPageDimensions.width;
    if (typeof w === "number" && Number.isFinite(w) && w > 0) {
      return { width: `${w}px`, minWidth: `${w}px` };
    }
    if (typeof w === "string" && w.trim()) {
      const trimmed = w.trim();
      const lower = trimmed.toLowerCase();
      const isFluid =
        lower.includes("%") ||
        lower.includes("vw") ||
        lower.startsWith("min(") ||
        lower.startsWith("max(") ||
        lower.startsWith("clamp(");
      return isFluid ? { width: trimmed } : { width: trimmed, minWidth: trimmed };
    }
    return fallback;
  }, [craftPageDimensions?.width]);

  const craftDesktopPreviewHeightStyle = useMemo<React.CSSProperties>(() => {
    const h = craftPageDimensions?.height;
    if (!h) return {};
    if (h === "auto") return { height: "auto" };
    if (typeof h === "number" && Number.isFinite(h) && h > 0) return { height: `${h}px` };
    if (typeof h === "string" && h.trim()) return { height: h.trim() };
    return {};
  }, [craftPageDimensions?.height]);

  const cleanJson = useMemo(
    () => (cleanDoc ? JSON.stringify(cleanDoc, null, 2) : null),
    [cleanDoc]
  );

  const previewPages = useMemo(() => {
    // IMPORTANT: use effectiveCleanDoc (same source as WebPreview) so slugs match exactly
    const doc = effectiveCleanDoc;
    if (!doc?.pages?.length) return [] as Array<{ id: string; slug: string; name: string }>;
    // Generic placeholder names used by the editor that should be replaced with numbered labels
    const GENERIC_NAME_PATTERNS = /^(page name|page|untitled|unnamed|new page)$/i;
    return doc.pages.map((page, index) => {
      const pageProps = (page?.props ?? {}) as Record<string, unknown>;
      const id = (page?.id as string) || `page-${index}`;
      const rawName = page?.name ?? pageProps.pageName;
      const name = typeof rawName === "string" && rawName.trim() ? rawName.trim() : `Page ${index + 1}`;
      const rawSlug = page?.slug ?? pageProps.pageSlug;
      const slug = typeof rawSlug === "string" && rawSlug.trim() ? rawSlug.trim() : `page-${index + 1}`;
      return { id, slug, name };
    });
  }, [effectiveCleanDoc]);

  useEffect(() => {
    if (previewPages.length === 0) {
      setSelectedPreviewPageSlug(undefined);
      return;
    }

    const hasSelected = selectedPreviewPageSlug
      ? previewPages.some((p) => p.slug === selectedPreviewPageSlug)
      : false;

    if (!hasSelected) {
      const initialMatch = initialPageSlug
        ? previewPages.find((p) => p.slug === initialPageSlug)
        : undefined;
      setSelectedPreviewPageSlug(initialMatch?.slug ?? previewPages[0]?.slug);
    }
  }, [previewPages, selectedPreviewPageSlug, initialPageSlug]);

  const selectedPreviewPage = useMemo(() => {
    if (previewPages.length === 0) return null;
    return previewPages.find((p) => p.slug === selectedPreviewPageSlug) ?? previewPages[0] ?? null;
  }, [previewPages, selectedPreviewPageSlug]);

  const selectedPreviewPageIndex = useMemo(() => {
    const doc = effectiveCleanDoc;
    if (!doc?.pages?.length) return 0;
    if (!selectedPreviewPage?.slug) return 0;
    const idx = doc.pages.findIndex((p, i) => {
      // Match WebPreview's getPageSlug: page?.slug ?? `page-${index}` (0-based)
      const slug = (p?.slug as string | undefined)?.trim() || `page-${i}`;
      return slug === selectedPreviewPage.slug;
    });
    return idx >= 0 ? idx : 0;
  }, [effectiveCleanDoc, selectedPreviewPage?.slug]);

  const rawFormatted = useMemo(() => {
    if (!rawJson) return null;
    try {
      const parsed = JSON.parse(rawJson);

      // If the data from DB is already CLEAN (BuilderDocument),
      // we must reconstruct the RAW (Craft.js) format for this specific view.
      if (parsed.version !== undefined && parsed.pages && parsed.nodes) {
        const reconstructedRaw = deserializeCleanToCraft(parsed);
        return JSON.stringify(JSON.parse(reconstructedRaw), null, 2);
      }

      return JSON.stringify(parsed, null, 2);
    } catch {
      return rawJson;
    }
  }, [rawJson]);

  const activeJson = viewMode === "clean" ? cleanJson : viewMode === "raw" ? rawFormatted : null;

  const capturePreviewThumbnail = async () => {
    if (thumbnailCaptureRef.current || !previewRef.current || !projectId) return;
    if (viewMode !== "Web-Preview" || loading || !cleanDoc) return;

    thumbnailCaptureRef.current = true;
    try {
      const canvas = await html2canvas(previewRef.current, {
        backgroundColor: "#ffffff",
        scale: 0.7,
        useCORS: true,
      });

      const blob: Blob | null = await new Promise((resolve) => {
        canvas.toBlob((b: Blob | null) => resolve(b), "image/jpeg", 0.85);
      });

      if (!blob) throw new Error("Thumbnail capture failed");

      const file = new File([blob], `preview-${projectId}.jpg`, { type: "image/jpeg" });
      const { url } = await uploadMediaApi(projectId, file, { folder: "images" });

      const updated = await updateProject(projectId, { thumbnail: url });
      if (updated.success) {
        setProject(updated.project);
      }
    } catch (err) {
      console.warn("Preview thumbnail capture failed:", err);
    } finally {
      thumbnailCaptureRef.current = false;
    }
  };

  useEffect(() => {
    thumbnailCaptureRef.current = false;
  }, [projectId]);

  useEffect(() => {
    if (viewMode !== "Web-Preview" || loading || !cleanDoc) return;
    const timeout = setTimeout(() => {
      capturePreviewThumbnail();
    }, 800);
    return () => clearTimeout(timeout);
  }, [viewMode, loading, cleanDoc]);

  // ── Stats ──────────────────────────────────────────
  const rawBytes = rawJson ? new Blob([rawJson]).size : 0;
  const cleanBytes = cleanJson ? new Blob([cleanJson]).size : 0;
  const rawMinBytes = rawJson
    ? new Blob([JSON.stringify(JSON.parse(rawJson))]).size
    : 0;
  const cleanMinBytes = cleanDoc
    ? new Blob([JSON.stringify(cleanDoc)]).size
    : 0;
  const reduction = rawMinBytes
    ? Math.round((1 - cleanMinBytes / rawMinBytes) * 100)
    : 0;

  const rawNodeCount = rawJson
    ? Object.keys(JSON.parse(rawJson)).length
    : 0;
  const cleanNodeCount = cleanDoc
    ? Object.keys(cleanDoc.nodes).length
    : 0;
  const pageCount = cleanDoc ? cleanDoc.pages.length : 0;

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    return `${(bytes / 1024).toFixed(1)} KB`;
  };

  // ── Actions ────────────────────────────────────────
  const handleCopy = async () => {
    if (!activeJson) return;
    await navigator.clipboard.writeText(activeJson);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!activeJson) return;
    const blob = new Blob([activeJson], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `page-${viewMode}-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleSaveTemplate = async () => {
    if (project?.isShared) {
      setShowPermissionModal(true);
      return;
    }
    if (!templateName.trim() || !templateDescription.trim()) {
      showAlert("Please fill in all fields");
      return;
    }

    if (!rawJson) {
      showAlert("No design to save. Edit your page in the design editor first, then open Preview and save as template.");
      return;
    }

    setSaving(true);
    try {
      const template = templateService.saveTemplate(
        templateName.trim(),
        templateCategory,
        templateDescription.trim(),
        rawJson
      );

      if (template) {
        showAlert("Template saved successfully!");
        setShowSaveDialog(false);
        setTemplateName("");
        setTemplateDescription("");
        router.push(projectId ? `/design?projectId=${projectId}` : "/design");
      } else {
        showAlert("Failed to save template. Please try again.");
      }
    } catch (error) {
      console.error("Error saving template:", error);
      showAlert("Error saving template. Please try again.");
    } finally {
      setSaving(false);
    }
  };
  //cjdhv
  const handlePublishClick = async () => {
    const isCollaborator = project?.isShared || (project?.ownerId && currentUser?.id && project.ownerId !== currentUser.id);
    if (isCollaborator) {
      setShowPermissionModal(true);
      return;
    }
    setPublishDomainError("");
    try {
      const res = await getProject(projectId);
      const existingSubdomain = res.success && res.project?.subdomain
        ? String(res.project.subdomain).trim()
        : "";
      setPublishDomainName(existingSubdomain);
    } catch {
      setPublishDomainName("");
    }
    setShowPublishDialog(true);
    setPublishMode("now");
    setScheduleInfo(null);
    if (projectId) {
      getSchedule(projectId).then((r) => {
        if (r.success && r.data) setScheduleInfo(r.data);
      });
    }
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(9, 0, 0, 0);
    setScheduledAt(tomorrow.toISOString().slice(0, 16));
  };

  const isPlanLimitError = (message: string) => {
    const lower = message.toLowerCase();
    return (
      lower.includes("limit reached") ||
      lower.includes("free plan") ||
      lower.includes("allows up to") ||
      lower.includes("upgrade your subscription")
    );
  };

  const handlePublishConfirm = async () => {
    const domain = publishDomainName.trim().toLowerCase();
    if (!domain) {
      setPublishDomainError("Domain name is required.");
      return;
    }
    if (!/^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/.test(domain)) {
      setPublishDomainError("Use only letters, numbers, and hyphens. No spaces or special characters.");
      return;
    }
    if (!projectId) {
      showAlert("No project selected.");
      return;
    }
    setPublishDomainError("");
    setPublishing(true);
    try {
      const docToPublish = cleanDoc ? migratePublishedContent(cleanDoc) : null;
      const snapshot = docToPublish ? JSON.stringify(docToPublish) : null;
      if (snapshot) {
        await autoSavePage(snapshot, projectId);
      }

      const res = await publishProject(projectId, domain, snapshot);
      if (res.success) {
        setShowPublishDialog(false);
        setPublishDomainName("");
        const sub = res.data?.subdomain ?? domain;
        setPublishedSubdomain(sub);
        setShowPublishedSuccessModal(true);
        showAlert(`Published! Your site is live. You can change the domain later in the dashboard.`);
      } else {
        if (res.message?.includes('Limit reached')) {
          showAlert(res.message);
        } else {
          showAlert(res.message || "Publish failed.");
        }
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Publish failed.";
      if (isPlanLimitError(message)) {
        setPublishDomainError(message);
        showAlert(message);
      } else {
        console.error("Publish error:", error);
        showAlert(message);
      }
    } finally {
      setPublishing(false);
    }
  };

  const handleScheduleConfirm = async () => {
    const domain = publishDomainName.trim().toLowerCase();
    if (!domain) {
      setPublishDomainError("Domain name is required.");
      return;
    }
    if (!/^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/.test(domain)) {
      setPublishDomainError("Use only letters, numbers, and hyphens.");
      return;
    }
    if (!scheduledAt) {
      setPublishDomainError("Pick a date and time.");
      return;
    }
    if (!projectId) {
      showAlert("No project selected.");
      return;
    }
    setPublishDomainError("");
    setScheduling(true);
    try {
      const docToPublish = cleanDoc ? migratePublishedContent(cleanDoc) : null;
      const snapshot = docToPublish ? JSON.stringify(docToPublish) : null;
      if (snapshot) {
        await autoSavePage(snapshot, projectId);
      }
      const res = await schedulePublish(projectId, new Date(scheduledAt).toISOString(), domain, snapshot);
      if (res.success) {
        setShowPublishDialog(false);
        setPublishDomainName("");
        setScheduleInfo({ scheduledAt: res.data!.scheduledAt!, subdomain: res.data?.subdomain ?? null });
        showAlert(`Scheduled! Your changes will go live on ${new Date(res.data!.scheduledAt!).toLocaleString()}.`);
      } else {
        showAlert(res.message || "Schedule failed.");
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Schedule failed.";
      if (isPlanLimitError(message)) {
        setPublishDomainError(message);
        showAlert(message);
      } else {
        console.error("Schedule error:", error);
        showAlert(message);
      }
    } finally {
      setScheduling(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0d0d0f] text-brand-lighter font-sans flex flex-col">
      {/* Animations */}
      <style>{`
        .preview-fadein { animation: previewFadeIn 0.5s cubic-bezier(.4,0,.2,1); }
        @keyframes previewFadeIn { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: none; } }
        .preview-scroll { scroll-behavior: smooth; }
        .pv-btn {
          display: flex; align-items: center; gap: 6px;
          padding: 6px 12px; border-radius: 8px; font-size: 13px;
          transition: background 0.15s, color 0.15s, border-color 0.15s;
          border: 1px solid transparent; cursor: pointer;
        }
        .pv-btn:disabled { opacity: 0.45; cursor: not-allowed; }
        .pv-seg-btn {
          display: flex; align-items: center; gap: 5px;
          padding: 5px 11px; border-radius: 6px; font-size: 12.5px;
          transition: background 0.13s, color 0.13s; cursor: pointer; font-weight: 500;
        }
        .pv-seg-btn.active { background: rgba(255,255,255,0.1); color: #f4f4f5; }
        .pv-seg-btn:not(.active) { color: #71717a; }
        .pv-seg-btn:not(.active):hover { color: #d4d4d8; background: rgba(255,255,255,0.05); }
        .device-frame-tablet {
          border-radius: 20px;
          box-shadow: 0 0 0 3px #27272a, 0 0 0 5px #18181b, 0 20px 60px rgba(0,0,0,0.6);
          overflow: hidden;
        }
        .device-frame-mobile {
          border-radius: 36px;
          box-shadow: 0 0 0 4px #27272a, 0 0 0 7px #18181b, 0 24px 64px rgba(0,0,0,0.7);
          overflow: hidden;
        }
        .device-notch {
          height: 28px; background: #18181b;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }
        .device-notch-pill {
          width: 80px; height: 8px; background: #27272a; border-radius: 99px;
        }
        .device-home-bar {
          height: 24px; background: #18181b;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }
        .device-home-pill {
          width: 100px; height: 4px; background: #3f3f46; border-radius: 99px;
        }
        .pv-loading-dot {
          width: 8px; height: 8px; border-radius: 50%; background: #52525b;
          animation: pvDot 1.2s ease-in-out infinite;
        }
        .pv-loading-dot:nth-child(2) { animation-delay: 0.15s; }
        .pv-loading-dot:nth-child(3) { animation-delay: 0.3s; }
        @keyframes pvDot { 0%,80%,100%{transform:scale(0.6);opacity:.4} 40%{transform:scale(1);opacity:1} }
      `}</style>

      {/* ── Toolbar ─────────────────────────────────────────────────── */}
      <div className="sticky top-0 z-50 bg-[#0d0d0f]/95 backdrop-blur-md border-b border-white/[0.07] flex-shrink-0">
        <div className="flex items-center justify-between px-4 h-13 gap-2" style={{ minHeight: 52 }}>

          {/* Left: Nav */}
          <div className="flex items-center gap-1 flex-shrink-0">
            <button
              onClick={() => router.back()}
              className="pv-btn text-zinc-400 hover:text-zinc-100 hover:bg-white/[0.06]"
            >
              <ArrowLeft size={15} />
              <span className="hidden sm:inline">Editor</span>
            </button>
            <button
              onClick={handleRefresh}
              disabled={loading}
              title="Reload from editor or database"
              className="pv-btn text-zinc-400 hover:text-zinc-100 hover:bg-white/[0.06] disabled:opacity-40"
            >
              <RotateCw size={14} className={loading ? "animate-spin" : ""} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>

          {/* Center: Controls */}
          <div className="flex items-center gap-2 flex-1 justify-center flex-wrap">
            {/* Viewport switcher */}
            <div className="flex items-center bg-[#18181b] rounded-lg border border-white/[0.08] p-[3px] gap-[2px]">
              <button onClick={() => setPreviewViewport("desktop")} className={`pv-seg-btn ${previewViewport === "desktop" ? "active" : ""}`} title="Desktop">
                <Monitor size={13} /><span className="hidden md:inline">Desktop</span>
              </button>
              <button onClick={() => setPreviewViewport("tablet")} className={`pv-seg-btn ${previewViewport === "tablet" ? "active" : ""}`} title="Tablet">
                <Tablet size={13} /><span className="hidden md:inline">Tablet</span>
              </button>
              <button onClick={() => setPreviewViewport("mobile")} className={`pv-seg-btn ${previewViewport === "mobile" ? "active" : ""}`} title="Mobile">
                <Smartphone size={13} /><span className="hidden md:inline">Mobile</span>
              </button>
            </div>

            {/* View mode switcher */}
            <div className="flex items-center bg-[#18181b] rounded-lg border border-white/[0.08] p-[3px] gap-[2px]">
              <button onClick={() => setViewMode("Web-Preview")} className={`pv-seg-btn ${viewMode === "Web-Preview" ? "active" : ""}`}>
                <Globe size={13} />Preview
              </button>
              <button onClick={() => setViewMode("clean")} className={`pv-seg-btn ${viewMode === "clean" ? "active" : ""}`}>
                <Layers size={13} />Clean
              </button>
              <button onClick={() => setViewMode("raw")} className={`pv-seg-btn ${viewMode === "raw" ? "active" : ""}`}>
                <Braces size={13} />Raw
              </button>
            </div>

            {/* Page selector — always visible */}
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-zinc-600 font-medium hidden sm:inline">Page</span>
              <select
                value={selectedPreviewPage?.slug ?? ""}
                onChange={(e) => setSelectedPreviewPageSlug(e.target.value || undefined)}
                disabled={previewPages.length === 0}
                className="bg-[#18181b] border border-white/[0.08] rounded-lg px-2.5 py-1.5 text-xs text-zinc-300 focus:outline-none focus:ring-1 focus:ring-white/20 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed min-w-[90px]"
              >
                {previewPages.length === 0
                  ? <option value="">—</option>
                  : previewPages.map((page, idx) => (
                    <option key={page.id || `page-${idx}`} value={page.slug}>{page.name}</option>
                  ))
                }
              </select>
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {viewMode !== "Web-Preview" && activeJson && (
              <>
                <button onClick={handleCopy} className="pv-btn text-zinc-400 hover:text-zinc-100 hover:bg-white/[0.06]">
                  {copied ? <><Check size={13} className="text-emerald-400" /><span className="hidden sm:inline text-emerald-400">Copied</span></> : <><Copy size={13} /><span className="hidden sm:inline">Copy</span></>}
                </button>
                <button onClick={handleDownload} className="pv-btn text-zinc-400 hover:text-zinc-100 hover:bg-white/[0.06]">
                  <Download size={13} /><span className="hidden sm:inline">Download</span>
                </button>
                <div className="w-px h-4 bg-white/10 mx-0.5" />
              </>
            )}
            <button
              onClick={() => {
                const isCollaborator = project?.isShared || (project?.ownerId && currentUser?.id && project.ownerId !== currentUser.id);
                if (isCollaborator) setShowPermissionModal(true);
                else if (project) setShowSaveDialog(true);
              }}
              disabled={loading || !project}
              className="pv-btn bg-emerald-500/10 border-emerald-500/25 text-emerald-400 hover:bg-emerald-500/20"
            >
              <Save size={13} /><span className="hidden sm:inline">Template</span>
            </button>
            <button
              onClick={handlePublishClick}
              disabled={loading || !project}
              className="pv-btn bg-blue-500/15 border-blue-500/30 text-blue-400 hover:bg-blue-500/25"
            >
              <Upload size={13} /><span className="hidden sm:inline">Publish</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── Stats bar ───────────────────────────────────────────────── */}
      {rawJson && (
        <div className="flex items-center justify-center gap-5 px-6 py-1.5 border-b border-white/[0.05] text-[11px] text-zinc-600 flex-wrap bg-[#0d0d0f] flex-shrink-0">
          <span><span className="text-zinc-700">Pages:</span> <span className="text-zinc-500">{pageCount}</span></span>
          <span className="text-zinc-800">·</span>
          <span><span className="text-zinc-700">Nodes:</span> <span className="text-zinc-500">{viewMode === "raw" ? rawNodeCount : cleanNodeCount}</span></span>
          <span className="text-zinc-800">·</span>
          <span className="text-zinc-700">Raw <span className="text-zinc-500">{formatBytes(rawMinBytes)}</span> → Clean <span className="text-emerald-600">{formatBytes(cleanMinBytes)}</span></span>
          {reduction > 0 && <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600">-{reduction}%</span>}
        </div>
      )}

      {/* ── Main content ────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col">
        {loading ? (
          <div className="flex flex-col items-center justify-center flex-1 gap-4 py-32">
            <div className="flex items-center gap-2">
              <div className="pv-loading-dot" /><div className="pv-loading-dot" /><div className="pv-loading-dot" />
            </div>
            <p className="text-sm text-zinc-600">Loading preview…</p>
          </div>
        ) : viewMode === "Web-Preview" ? (
          <div className="flex-1 flex flex-col items-center py-8 px-4 overflow-x-hidden">
            {effectiveCleanDoc ? (
              <>
                {/* Desktop — full width, no device frame */}
                {previewViewport === "desktop" && (
                  <div
                    ref={previewRef}
                    className="w-full min-w-0 preview-fadein bg-white"
                    style={{ ...craftDesktopPreviewStyle, ...craftDesktopPreviewHeightStyle }}
                  >
                    <WebPreview
                      key={`preview-web-desktop-${selectedPreviewPage?.slug ?? "default"}`}
                      doc={effectiveCleanDoc}
                      pageIndex={selectedPreviewPageIndex}
                      initialPageSlug={selectedPreviewPage?.slug ?? initialPageSlug}
                      mobileBreakpoint={PREVIEW_MOBILE_BREAKPOINT}
                      enableFormInputs
                      builderParityMode={true}
                      fillViewport={false}
                      storeContext={previewStoreContext}
                    />
                  </div>
                )}

                {/* Tablet — device frame */}
                {previewViewport === "tablet" && (
                  <div className="flex flex-col items-center gap-3 preview-fadein">
                    <p className="text-xs text-zinc-600 mb-1">{PREVIEW_TABLET_VIEWPORT_WIDTH}px · Tablet</p>
                    <div
                      className="device-frame-tablet flex flex-col bg-white"
                      style={{ width: "100%", maxWidth: `${PREVIEW_TABLET_VIEWPORT_WIDTH}px`, minWidth: "600px" }}
                    >
                      {/* Top bar of tablet */}
                      <div className="flex-shrink-0 h-8 bg-[#18181b] flex items-center justify-between px-4">
                        <div className="flex gap-1.5">
                          <div className="w-2 h-2 rounded-full bg-[#3f3f46]" />
                          <div className="w-2 h-2 rounded-full bg-[#3f3f46]" />
                          <div className="w-2 h-2 rounded-full bg-[#3f3f46]" />
                        </div>
                        <div className="flex-1 mx-8"><div className="h-4 rounded-full bg-[#27272a] w-full" /></div>
                        <div className="w-2 h-2 rounded-full bg-[#3f3f46]" />
                      </div>
                      <div ref={previewRef}>
                        <WebPreview
                          key={`preview-web-tablet-${selectedPreviewPage?.slug ?? "default"}`}
                          doc={effectiveCleanDoc}
                          pageIndex={selectedPreviewPageIndex}
                          initialPageSlug={selectedPreviewPage?.slug ?? initialPageSlug}
                          mobileBreakpoint={PREVIEW_TABLET_BREAKPOINT}
                          enableFormInputs
                          builderParityMode={true}
                          fillViewport
                          storeContext={previewStoreContext}
                          simulatedWidth={PREVIEW_TABLET_VIEWPORT_WIDTH}
                          responsiveViewportWidth={PREVIEW_TABLET_VIEWPORT_WIDTH}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Mobile — device frame */}
                {previewViewport === "mobile" && (
                  <div className="flex flex-col items-center gap-3 preview-fadein">
                    <p className="text-xs text-zinc-600 mb-1">{PREVIEW_MOBILE_VIEWPORT_WIDTH}px · Mobile</p>
                    <div
                      className="device-frame-mobile flex flex-col bg-white"
                      style={{ width: "100%", maxWidth: `${PREVIEW_MOBILE_VIEWPORT_WIDTH}px`, minWidth: "320px" }}
                    >
                      <div className="device-notch"><div className="device-notch-pill" /></div>
                      <div ref={previewRef}>
                        <WebPreview
                          key={`preview-web-mobile-${selectedPreviewPage?.slug ?? "default"}`}
                          doc={effectiveCleanDoc}
                          pageIndex={selectedPreviewPageIndex}
                          initialPageSlug={selectedPreviewPage?.slug ?? initialPageSlug}
                          mobileBreakpoint={PREVIEW_MOBILE_BREAKPOINT}
                          enableFormInputs
                          builderParityMode={true}
                          fillViewport
                          storeContext={previewStoreContext}
                          simulatedWidth={PREVIEW_MOBILE_VIEWPORT_WIDTH}
                          responsiveViewportWidth={PREVIEW_MOBILE_VIEWPORT_WIDTH}
                        />
                      </div>
                      <div className="device-home-bar"><div className="device-home-pill" /></div>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="flex flex-col items-center justify-center flex-1 gap-4 py-32 text-center">
                <div className="w-16 h-16 rounded-2xl bg-white/[0.04] border border-white/10 flex items-center justify-center mb-2">
                  <Globe size={28} className="text-zinc-700" />
                </div>
                <p className="text-sm font-medium text-zinc-400">No page data</p>
                <p className="text-xs text-zinc-600 max-w-xs">Go back to the editor, design your page, then return here to preview it.</p>
                <button onClick={() => router.back()} className="mt-2 pv-btn bg-white/5 border-white/10 hover:bg-white/10 text-zinc-300 text-sm">
                  <ArrowLeft size={14} /> Back to Editor
                </button>
              </div>
            )}
          </div>
        ) : activeJson ? (
          <div className="flex-1 flex flex-col max-w-7xl mx-auto w-full px-6 py-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-zinc-600 font-mono uppercase tracking-widest">{viewMode === "clean" ? "Clean Document" : "Raw CraftJS"}</span>
              <div className="flex items-center gap-2">
                <button onClick={handleCopy} className="pv-btn text-zinc-400 hover:text-zinc-100 hover:bg-white/[0.06] text-xs">
                  {copied ? <><Check size={12} className="text-emerald-400" /> Copied</> : <><Copy size={12} /> Copy</>}
                </button>
                <button onClick={handleDownload} className="pv-btn text-zinc-400 hover:text-zinc-100 hover:bg-white/[0.06] text-xs">
                  <Download size={12} /> Download
                </button>
              </div>
            </div>
            <pre className="flex-1 bg-[#111113] rounded-xl border border-white/[0.08] p-5 text-[12.5px] leading-relaxed overflow-auto font-mono text-zinc-400 whitespace-pre-wrap break-all" style={{ maxHeight: "calc(100vh - 200px)" }}>
              {activeJson}
            </pre>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center flex-1 gap-3 py-32 text-center">
            <div className="w-14 h-14 rounded-2xl bg-white/[0.04] border border-white/10 flex items-center justify-center mb-2">
              <Braces size={24} className="text-zinc-700" />
            </div>
            <p className="text-sm font-medium text-zinc-400">No JSON data found</p>
            <p className="text-xs text-zinc-600">Go back to the editor and press Play to generate output.</p>
          </div>
        )}
      </div>

      {/* Publish confirmation – Publish now or Schedule for a date */}
      {showPublishDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[#1a1a1a] border border-white/10 rounded-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold text-white mb-2">Publish to live domain</h2>
            {scheduleInfo && (
              <p className="text-sm text-amber-400/90 mb-2">
                Already scheduled for {new Date(scheduleInfo.scheduledAt).toLocaleString()}. Setting a new date will replace it.
              </p>
            )}
            <p className="text-sm text-zinc-400 mb-4">
              {publishDomainName.trim()
                ? "Your site will be published at the subdomain URL below. Design your site in the editor first—what you see in Preview is what gets published."
                : "Enter a subdomain to create your live site. Design your site in the editor first—what you see in Preview is what gets published."}
            </p>
            <div className="space-y-2 mb-4">
              <label className="block text-sm font-medium text-gray-300">
                Live domain (subdomain) <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={publishDomainName}
                onChange={(e) => {
                  setPublishDomainName(e.target.value);
                  setPublishDomainError("");
                }}
                placeholder="e.g. mystore → mystore.localhost (dev) or mystore.websitelink (prod)"
                className="w-full px-3 py-2 bg-[#0a0a0a] border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                autoFocus
              />
              <p className="text-xs text-zinc-500">Only letters, numbers, and hyphens.</p>
              {publishDomainName.trim() && (
                <p className="text-xs text-emerald-400/90 mt-1">
                  Your site will be live at: <span className="font-mono font-medium">{getSubdomainSiteUrl(publishDomainName.trim().toLowerCase().replace(/[^a-z0-9-]/g, '') || 'site', typeof window !== 'undefined' ? window.location.origin : null).replace(/^https?:\/\//, '')}</span>
                </p>
              )}
              {publishDomainError && (
                <p className="text-xs text-red-400">{publishDomainError}</p>
              )}
            </div>
            <div className="flex gap-2 mb-4 p-1 bg-[#0a0a0a] rounded-lg">
              <button
                type="button"
                onClick={() => setPublishMode("now")}
                className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${publishMode === "now" ? "bg-blue-600 text-white" : "text-zinc-400 hover:text-white"}`}
              >
                Publish now
              </button>
              <button
                type="button"
                onClick={() => setPublishMode("schedule")}
                className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${publishMode === "schedule" ? "bg-blue-600 text-white" : "text-zinc-400 hover:text-white"}`}
              >
                Schedule for date
              </button>
            </div>
            {publishMode === "schedule" && (
              <div className="space-y-2 mb-4">
                <label className="block text-sm font-medium text-gray-300">
                  When should your edits go live?
                </label>
                <input
                  type="datetime-local"
                  value={scheduledAt}
                  onChange={(e) => setScheduledAt(e.target.value)}
                  min={new Date().toISOString().slice(0, 16)}
                  className="w-full px-3 py-2 bg-[#0a0a0a] border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-zinc-500">Your current draft will go live at this date and time.</p>
              </div>
            )}
            <div className="flex justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={() => {
                  setShowPublishDialog(false);
                  setPublishDomainName("");
                  setPublishDomainError("");
                }}
                className="px-4 py-2 text-sm font-medium text-gray-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              {publishMode === "now" ? (
                <button
                  type="button"
                  onClick={handlePublishConfirm}
                  disabled={publishing}
                  className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {publishing ? "Publishing…" : "Confirm & Publish"}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleScheduleConfirm}
                  disabled={scheduling}
                  className="px-4 py-2 bg-amber-600 text-white text-sm font-medium rounded-lg hover:bg-amber-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {scheduling ? "Scheduling…" : "Set schedule"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {showPublishedSuccessModal && publishedSubdomain && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[#1a1a1a] border border-white/10 rounded-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold text-white mb-2">Your site is now live!</h2>
            <p className="text-sm text-zinc-400 mb-2">Visit your published website:</p>
            <p className="text-sm font-mono font-medium text-emerald-400 mb-5 break-all">
              {typeof window !== 'undefined'
                ? getSubdomainSiteUrl(publishedSubdomain, window.location.origin).replace(/^https?:\/\//, '')
                : `localhost/sites/${publishedSubdomain}`}
            </p>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowPublishedSuccessModal(false);
                  setPublishedSubdomain(null);
                }}
                className="px-4 py-2 text-sm font-medium text-gray-400 hover:text-white transition-colors"
              >
                Keep editing
              </button>
              <button
                type="button"
                onClick={() => {
                  const target = publishedSubdomain;
                  setShowPublishedSuccessModal(false);
                  setPublishedSubdomain(null);
                  const url = getSubdomainSiteUrl(target, typeof window !== 'undefined' ? window.location.origin : null);
                  if (url !== '#') window.location.href = url;
                }}
                className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                Visit live site
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Save Template Dialog */}
      {showSaveDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[#1a1a1a] border border-white/10 rounded-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold text-white mb-4">Save Template</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Template Name *
                </label>
                <input
                  type="text"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  className="w-full px-3 py-2 bg-[#0a0a0a] border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter template name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Category *
                </label>
                <select
                  value={templateCategory}
                  onChange={(e) => setTemplateCategory(e.target.value)}
                  className="w-full px-3 py-2 bg-[#0a0a0a] border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="Landing Page">Landing Page</option>
                  <option value="E-commerce">E-commerce</option>
                  <option value="Blog">Blog</option>
                  <option value="Portfolio">Portfolio</option>
                  <option value="Business">Business</option>
                  <option value="Dashboard">Dashboard</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Description *
                </label>
                <textarea
                  value={templateDescription}
                  onChange={(e) => setTemplateDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-[#0a0a0a] border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  rows={3}
                  placeholder="Describe your template..."
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setShowSaveDialog(false);
                  setTemplateName("");
                  setTemplateDescription("");
                }}
                className="px-4 py-2 text-sm font-medium text-gray-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveTemplate}
                disabled={saving}
                className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? "Saving..." : "Save Template"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Permission Denied Modal */}
      {showPermissionModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-sm bg-[#111] border border-white/10 rounded-2xl p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-red-500/10 rounded-full flex items-center justify-center mb-4">
                <Lock className="w-6 h-6 text-red-500" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Owner Access Required</h3>
              <p className="text-sm text-gray-400 mb-6 leading-relaxed">
                Only the project owner has permission to publish or save templates. Please contact the owner if you need these actions performed.
              </p>
              <button
                onClick={() => setShowPermissionModal(false)}
                className="w-full py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white text-sm font-semibold transition-all active:scale-[0.98]"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Preview Cart FAB */}
      {previewStoreContext && (
        <>
          {previewLastAddedAt > 0 && (
            <div
              key={previewLastAddedAt}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[200] pointer-events-none rounded-2xl bg-black/70 text-white px-10 py-7 shadow-2xl flex flex-col items-center text-center animate-[fadeIn_0.2s_ease-out]"
              aria-hidden
            >
              <span className="text-lg font-semibold">Added to cart</span>
              <svg className="w-8 h-8 mt-2 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          )}
          <button
            type="button"
            onClick={() => setPreviewCartOpen(true)}
            className="fixed bottom-6 right-6 z-[150] flex items-center gap-2 rounded-full bg-emerald-500 px-4 py-3 text-white shadow-lg hover:bg-emerald-600 transition-all"
            aria-label="Open preview cart"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            {previewCart.reduce((s, i) => s + i.quantity, 0) > 0 && (
              <span className="text-sm font-semibold">{previewCart.reduce((s, i) => s + i.quantity, 0)}</span>
            )}
          </button>
          {previewCartOpen && (
            <div className="fixed inset-0 z-[160] flex justify-end" onClick={() => setPreviewCartOpen(false)}>
              <div className="relative w-full max-w-sm bg-white h-full shadow-2xl flex flex-col" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between px-5 py-4 border-b">
                  <span className="font-semibold text-zinc-900 text-lg">Preview Cart</span>
                  <button type="button" onClick={() => setPreviewCartOpen(false)} className="text-zinc-400 hover:text-zinc-700">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
                  {previewCart.length === 0 ? (
                    <p className="text-zinc-500 text-sm text-center mt-8">Your cart is empty.</p>
                  ) : previewCart.map((item) => (
                    <div key={item.id} className="flex items-center gap-3">
                      {item.image && <img src={item.image} alt={item.name} className="w-14 h-14 rounded object-cover border" />}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-zinc-900 text-sm truncate">{item.name}</p>
                        <p className="text-zinc-500 text-xs">₱{item.price.toFixed(2)} × {item.quantity}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setPreviewCart((prev) => prev.filter((i) => i.id !== item.id))}
                        className="text-zinc-400 hover:text-red-500 text-xs"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
                {previewCart.length > 0 && (
                  <div className="px-5 py-4 border-t">
                    <div className="flex justify-between text-sm font-semibold text-zinc-900 mb-3">
                      <span>Total</span>
                      <span>₱{previewCart.reduce((s, i) => s + i.price * i.quantity, 0).toFixed(2)}</span>
                    </div>
                    <p className="text-xs text-zinc-400 text-center">This is a preview — checkout is disabled.</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function PreviewPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center text-zinc-500">Loading...</div>}>
      <PreviewContent />
    </Suspense>
  );
}
