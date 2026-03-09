import * as React from "react";
import { useRef, useState, useEffect, useLayoutEffect, useCallback, startTransition } from "react";
import { Editor, Frame, Element, useEditor } from "@craftjs/core";
import { PanelLeft, PanelRight } from "lucide-react";
import { RenderBlocks } from "../_designComponents";
import { Frame as FrameComponentFromFile } from "../_designComponents/Frame/Frame";
import { LeftPanel } from "./leftPanel";
import { RightPanel } from "./rightPanel";
import { TopPanel, type DevicePreset } from "./TopPanel";
import { BottomPanel, type CanvasTool } from "./BottomPanel";
import { FloatingMobilePreview } from "./FloatingMobilePreview";
import { CanvasToolProvider } from "./CanvasToolContext";
import { Container } from "../_designComponents/Container/Container";
import { Text } from "../_designComponents/Text/Text";
import { Page } from "../_designComponents/Page/Page";
import { Viewport } from "../_designComponents/Viewport/Viewport";
import { Section } from "../_designComponents/Section/Section";
import { Image } from "../_designComponents/Image/Image";
import { Button } from "../_designComponents/Button/Button";
import { RenderNode } from "./RenderNode";
import { KeyboardShortcuts } from "./KeyboardShortcuts";
import { CanvasSelectionHandler } from "./CanvasSelectionHandler";
import { BoxSelectionHandler } from "./BoxSelectionHandler";
import { FigmaStyleDragHandler } from "./FigmaStyleDragHandler";
import { FreeDropPlacementHandler } from "./FreeDropPlacementHandler";
import { MarqueeSelectionHandler } from "./MarqueeSelectionHandler";
import { TextToolHandler } from "./TextToolHandler";
import { ShapeToolHandler } from "./ShapeToolHandler";
import { TransformModeProvider } from "./TransformModeContext";
import { InlineTextEditProvider } from "./InlineTextEditContext";
import { DoubleClickTransformHandler } from "./DoubleClickTransformHandler";
import { CanvasContextMenu } from "./CanvasContextMenu";
import { CanvasDropGuide } from "./CanvasDropGuide";
import { PrototypeTabProvider } from "./PrototypeTabContext";
import { PrototypeFlowLines } from "./PrototypeFlowLines";
import { NewPageDropPlacementHandler } from "./NewPageDropPlacementHandler";
import { HeaderFooterDropPlacementHandler } from "./HeaderFooterDropPlacementHandler";
import PanelDropFreePlacementHandler from "./PanelDropFreePlacementHandler";
import { ScrollToSelectedHandler } from "./ScrollToSelectedHandler";
import type { TabId } from "./rightPanel";
import { autoSavePage, getDraft, deleteDraft } from "../_lib/pageApi";
import { serializeCraftToClean, deserializeCleanToCraft } from "../_lib/serializer";
import { useAlert } from "@/app/m_dashboard/components/context/alert-context";
import { Circle } from "../../_assets/shapes/circle/circle";
import { Square } from "../../_assets/shapes/square/square";
import { Triangle } from "../../_assets/shapes/triangle/triangle";
import { CRAFT_RESOLVER } from "./craftResolver";
import {
  MIN_SCALE,
  MAX_SCALE,
  DEFAULT_SCALE,
  ZOOM_STEP,
  ZOOM_SENSITIVITY,
} from "./zoomConstants";

/**
 * React Error Boundary to catch rendering errors in Frame component
 */
class FrameErrorBoundary extends React.Component<
  { children: React.ReactNode; onError: () => void },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode; onError: () => void }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('❌ FrameErrorBoundary caught error:', error, errorInfo);
    this.props.onError();
  }

  render() {
    if (this.state.hasError) {
      return <DeferredFrame data={EMPTY_FRAME_DATA} />;
    }

    return this.props.children;
  }
}

const STORAGE_KEY_PREFIX = "craftjs_preview_json";
const PERSISTENT_STORAGE_KEY_PREFIX = "craftjs_preview_persist";
const UI_STATE_KEY_PREFIX = "craftjs_editor_ui";

// These must match the Viewport constants for proper page positioning
const PAGE_GRID_ORIGIN_X = 30000;
const PAGE_GRID_ORIGIN_Y = 30000;
const PAGE_BASE_WIDTH = 1920;
const PAGE_BASE_HEIGHT = 1200;

const EMPTY_FRAME_DATA = JSON.stringify({
  ROOT: {
    type: { resolvedName: "Viewport" },
    isCanvas: true,
    props: {},
    displayName: "Viewport",
    custom: {},
    hidden: false,
    nodes: ["page-1"],
    linkedNodes: {},
  },
  "page-1": {
    type: { resolvedName: "Page" },
    isCanvas: true,
    props: {
      pageName: "Page 1",
      pageSlug: "page-0",
      canvasX: PAGE_GRID_ORIGIN_X,
      canvasY: PAGE_GRID_ORIGIN_Y,
      height: "1200px",
      background: "#ffffff"
    },
    displayName: "Page",
    custom: {},
    parent: "ROOT",
    hidden: false,
    nodes: [],
    linkedNodes: {},
  },
});

const SAFE_CONTAINER: React.ComponentType<any> =
  (typeof Container === "function" ? Container : null) ??
  ((props: any) => React.createElement("div", props, props?.children));

const VALIDATOR_RESOLVER: Record<string, React.ComponentType<any>> = {
  ...RenderBlocks,
  ...CRAFT_RESOLVER,
  Container: SAFE_CONTAINER,
  container: SAFE_CONTAINER,
  Button: (typeof Button === "function" ? Button : null) ?? SAFE_CONTAINER,
  button: (typeof Button === "function" ? Button : null) ?? SAFE_CONTAINER,
  Text: Text || SAFE_CONTAINER,
  text: Text || SAFE_CONTAINER,
  Image: Image || SAFE_CONTAINER,
  image: Image || SAFE_CONTAINER,
  Page: Page || SAFE_CONTAINER,
  page: Page || SAFE_CONTAINER,
  Viewport: Viewport || SAFE_CONTAINER,
  viewport: Viewport || SAFE_CONTAINER,
};

const VALIDATOR_CANONICAL_NAME_BY_LOWER = new Map<string, string>();
for (const key of Object.keys(VALIDATOR_RESOLVER)) {
  const lowered = key.toLowerCase();
  if (!VALIDATOR_CANONICAL_NAME_BY_LOWER.has(lowered)) {
    VALIDATOR_CANONICAL_NAME_BY_LOWER.set(lowered, key);
  }
}

function normalizeResolvedName(rawName: unknown): string {
  const name = typeof rawName === "string" ? rawName.trim() : "";
  if (!name) return "Container";
  return VALIDATOR_CANONICAL_NAME_BY_LOWER.get(name.toLowerCase()) ?? "Container";
}

function withResolverFallback<T extends Record<string, React.ComponentType>>(base: T): T {
  return new Proxy(base, {
    get(target, prop, receiver) {
      const direct = Reflect.get(target, prop, receiver);
      if (direct) return direct;
      if (typeof prop !== "string") return direct;

      const normalized = prop.trim().toLowerCase();
      const resolved =
        Reflect.get(target, prop.trim(), receiver) ||
        Reflect.get(target, normalized, receiver) ||
        Reflect.get(target, VALIDATOR_CANONICAL_NAME_BY_LOWER.get(normalized) ?? "", receiver);

      return resolved || target.Container || SAFE_CONTAINER;
    },
  }) as T;
}

function getStorageKey(projectId: string) {
  return `${STORAGE_KEY_PREFIX}_${projectId}`;
}

function getPersistentStorageKey(projectId: string) {
  return `${PERSISTENT_STORAGE_KEY_PREFIX}_${projectId}`;
}

function isQuotaError(error: unknown): boolean {
  return (
    error instanceof DOMException &&
    (error.code === 22 || error.code === 1014 || error.name === "QuotaExceededError" || error.name === "NS_ERROR_DOM_QUOTA_REACHED")
  );
}

function safeSessionGet(key: string): string | null {
  try {
    if (typeof window === "undefined" || !window.sessionStorage) return null;
    return window.sessionStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSessionSet(key: string, value: string): void {
  try {
    if (typeof window === "undefined" || !window.sessionStorage) return;
    window.sessionStorage.setItem(key, value);
  } catch (error) {
    if (isQuotaError(error)) {
      console.warn("SessionStorage quota exceeded, skipping save:", key);
    } else {
      console.warn("Failed to save to sessionStorage:", error);
    }
  }
}

function safeSessionRemove(key: string): void {
  try {
    if (typeof window === "undefined" || !window.sessionStorage) return;
    window.sessionStorage.removeItem(key);
  } catch {
    // Ignore errors when removing
  }
}

function safeLocalGet(key: string): string | null {
  try {
    if (typeof window === "undefined" || !window.localStorage) return null;
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeLocalSet(key: string, value: string): void {
  try {
    if (typeof window === "undefined" || !window.localStorage) return;
    window.localStorage.setItem(key, value);
  } catch (error) {
    if (isQuotaError(error)) {
      console.warn("LocalStorage quota exceeded, skipping save:", key);
    }
  }
}

function safeLocalRemove(key: string): void {
  try {
    if (typeof window === "undefined" || !window.localStorage) return;
    window.localStorage.removeItem(key);
  } catch {
    // Ignore errors when removing
  }
}

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

type EditorShellProps = {
  projectId: string;
  pageId?: string | null;
};

const LEFT_PANEL_DEFAULT_WIDTH = 320;
const RIGHT_PANEL_DEFAULT_WIDTH = 420;
const MIN_PANEL_WIDTH = 200;
const MAX_PANEL_WIDTH = 600;
const MIN_CANVAS_VIEWPORT_WIDTH = 760;
const TOP_PANEL_HEIGHT_PX = 48;
const INFINITE_CANVAS_WIDTH_VW = 4000;
const INFINITE_CANVAS_HEIGHT_VH = 4000;
const INFINITE_CANVAS_PADDING_PX = 30000;

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

const clampScale = (value: unknown, fallback: number = DEFAULT_SCALE): number => {
  const numeric = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(numeric)) return Math.min(MAX_SCALE, Math.max(MIN_SCALE, fallback));
  return Math.min(MAX_SCALE, Math.max(MIN_SCALE, numeric));
};

/**
 * Deep validation function that walks through the entire Craft.js node tree
 * and ensures all node references are valid.
 */
function validateCraftData(jsonString: string): { valid: boolean; data?: string } {
  try {
    const parsed = JSON.parse(jsonString);

    // Must have ROOT
    if (!parsed || !parsed.ROOT) {
      console.error('❌ Validation failed: Missing ROOT node');
      return { valid: false };
    }

    // ROOT must have basic structure
    if (!parsed.ROOT.type || !parsed.ROOT.type.resolvedName) {
      console.error('❌ Validation failed: ROOT missing type.resolvedName');
      return { valid: false };
    }

    if (!Array.isArray(parsed.ROOT.nodes)) {
      console.error('❌ Validation failed: ROOT.nodes is not an array');
      return { valid: false };
    }

    // Collect all valid nodes - be VERY strict about what makes a node valid
    const allNodeIds = Object.keys(parsed);
    const invalidNodes: string[] = [];
    const validNodeIds = new Set(allNodeIds.filter(id => {
      const node = parsed[id];

      // Must be an object
      if (!node || typeof node !== 'object') {
        invalidNodes.push(id);
        return false;
      }

      // Must have type property
      if (!node.type) {
        invalidNodes.push(id);
        return false;
      }

      const resolvedName = normalizeResolvedName(
        typeof node.type === "string" ? node.type : node.type?.resolvedName
      );
      if (typeof node.type === "string") {
        node.type = { resolvedName };
      } else {
        node.type.resolvedName = resolvedName;
      }

      // Must have nodes array (even if empty)
      if (!Array.isArray(node.nodes)) {
        // Try to fix it
        node.nodes = [];
      }

      return true;
    }));

    // If too many invalid nodes, abort
    if (invalidNodes.length > allNodeIds.length * 0.5) {
      console.error(`❌ Too many invalid nodes (${invalidNodes.length}/${allNodeIds.length}). Data is too corrupted.`);
      return { valid: false };
    }

    // Recursively validate and clean all node references
    let hasInvalidRefs = false;
    let removedRefsCount = 0;

    function cleanNodeRefs(nodeId: string, visited = new Set<string>()): void {
      if (visited.has(nodeId)) return; // Prevent infinite loops
      visited.add(nodeId);

      const node = parsed[nodeId];
      if (!node) return;

      // Clean the nodes array
      if (Array.isArray(node.nodes)) {
        const originalLength = node.nodes.length;
        node.nodes = node.nodes.filter((childId: string) => {
          if (!validNodeIds.has(childId)) {
            hasInvalidRefs = true;
            removedRefsCount++;
            return false;
          }
          return true;
        });

        if (node.nodes.length !== originalLength) {
          hasInvalidRefs = true;
        }

        // Recursively clean children
        node.nodes.forEach((childId: string) => cleanNodeRefs(childId, visited));
      }

      // Clean linkedNodes if present
      if (node.linkedNodes && typeof node.linkedNodes === 'object') {
        for (const [key, linkedId] of Object.entries(node.linkedNodes)) {
          if (typeof linkedId === 'string' && !validNodeIds.has(linkedId)) {
            delete node.linkedNodes[key];
            hasInvalidRefs = true;
            removedRefsCount++;
          }
        }
      }
    }

    // Start validation from ROOT
    cleanNodeRefs('ROOT');

    // Remove invalid nodes from the parsed object
    invalidNodes.forEach(id => {
      delete parsed[id];
    });

    // Final pass: ensure every node type resolves to an existing canonical resolver key.
    Object.keys(parsed).forEach((id) => {
      const node = parsed[id];
      if (!node || typeof node !== "object") return;
      const canonical = normalizeResolvedName(
        typeof node.type === "string" ? node.type : node.type?.resolvedName
      );
      if (typeof node.type === "string") {
        node.type = { resolvedName: canonical };
      } else if (node.type && typeof node.type === "object") {
        node.type.resolvedName = canonical;
      } else {
        node.type = { resolvedName: canonical };
      }
      node.displayName = canonical;
    });

    const finalJson = JSON.stringify(parsed);

    if (hasInvalidRefs && removedRefsCount > 0) {
      console.warn(`Editor data cleaned: removed ${removedRefsCount} invalid references.`);
    }

    return { valid: true, data: finalJson };
  } catch (error) {
    console.error('❌ Validation error:', error);
    return { valid: false };
  }
}

function prepareFrameData(jsonString: string): { valid: boolean; data?: string } {
  // Always run through validator so component type names are canonicalized
  // against resolver keys (e.g. Image/image/Text/text) before Frame mount.
  return validateCraftData(jsonString);
}

// Suppress known @craftjs/core React 19 compatibility warnings.
// Safe to remove once craftjs releases a stable React 19 compatible version (0.3.x+).
if (typeof window !== "undefined") {
  const win = window as Window & {
    __craftConsoleErrorPatched__?: boolean;
    __craftOriginalConsoleError__?: typeof console.error;
  };
  if (!win.__craftConsoleErrorPatched__) {
    const originalError = win.__craftOriginalConsoleError__ ?? console.error.bind(console);
    win.__craftOriginalConsoleError__ = originalError;
    console.error = (...args: unknown[]) => {
      if (typeof args[0] === "string") {
        // React 19 removed element.ref access — craftjs still uses old API internally
        if (args[0].includes("Accessing element.ref was removed")) return;
        // craftjs store updates trigger setState during Frame render in React 19 concurrent mode
        if (args[0].includes("Cannot update a component") && args[0].includes("while rendering a different component")) return;
      }
      originalError(...args);
    };
    win.__craftConsoleErrorPatched__ = true;
  }
}

/**
 * Renders Frame only after the first commit (via useEffect), so Craft's store updates
 * happen in a separate commit and don't trigger "Cannot update Ee while rendering De".
 */
const DeferredFrame = ({ data, onMounted }: { data: string; onMounted?: () => void }) => {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    let done = false;
    const markMounted = () => {
      if (done) return;
      done = true;
      setMounted(true);
    };
    const id = requestAnimationFrame(markMounted);
    const fallback = window.setTimeout(markMounted, 220);
    return () => {
      cancelAnimationFrame(id);
      window.clearTimeout(fallback);
    };
  }, []);

  useEffect(() => {
    if (!mounted || !onMounted) return;
    const id = requestAnimationFrame(() => onMounted());
    return () => cancelAnimationFrame(id);
  }, [mounted, onMounted]);

  if (!mounted) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-brand-light">Loading editor...</div>
      </div>
    );
  }
  return <Frame data={data} />;
};

/**
 * SafeFrame component that catches Frame rendering errors and falls back to empty canvas.
 * Calls onFrameMounted after the Frame has committed, so panels that use useEditor()
 * (e.g. FilesPanel) can mount in the next tick and avoid "setState during render" from Craft.js.
 * Defers mounting <Frame data={...} /> to a separate commit so Craft.js deserialize doesn't
 * update the store while SafeFrame (or EditorShell) is still rendering.
 */
const SafeFrame = ({
  data,
  onError,
  onFrameMounted,
}: {
  data: string | null;
  onError?: () => void;
  onFrameMounted?: () => void;
}) => {
  const [renderData, setRenderData] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [canRenderFrame, setCanRenderFrame] = useState(false);
  /** Deferred data so Frame mounts in next commit — avoids "Cannot update component while rendering another" */
  const [frameDataToShow, setFrameDataToShow] = useState<string | null>(null);
  const [hasErrorBoundaryError, setHasErrorBoundaryError] = useState(false);
  const mountedSignalSentRef = useRef(false);
  const validationCacheRef = useRef<{ input: string; output: string | null; valid: boolean } | null>(null);

  useEffect(() => {
    setFrameDataToShow(null);
    setIsReady(false);
    setCanRenderFrame(false);
    mountedSignalSentRef.current = false;

    // Reset error state when data changes
    setHasErrorBoundaryError(false);

    // Validate and prepare data for rendering
    if (data) {
      const cached = validationCacheRef.current;
      if (cached && cached.input === data) {
        if (cached.valid && cached.output) {
          setRenderData(cached.output);
        } else {
          setRenderData(null);
          onError?.();
        }
      } else {
        const validation = prepareFrameData(data);
        validationCacheRef.current = {
          input: data,
          output: validation.data ?? null,
          valid: Boolean(validation.valid && validation.data),
        };
        if (validation.valid && validation.data) {
          setRenderData(validation.data);
        } else {
          setRenderData(null);
          onError?.();
        }
      }
    } else {
      validationCacheRef.current = null;
      setRenderData(null);
    }

    // Use RAF + timeout fallback so new projects never get stuck in loading gate
    let done = false;
    const markReady = () => {
      if (done) return;
      done = true;
      setIsReady(true);
    };
    const id = requestAnimationFrame(markReady);
    const fallback = window.setTimeout(markReady, 80);
    return () => {
      cancelAnimationFrame(id);
      window.clearTimeout(fallback);
    };
  }, [data, onError]);

  // Defer Frame render to next tick so Craft.js store updates don't run during this component's render
  // (avoids "Cannot update a component while rendering a different component").
  useEffect(() => {
    if (!isReady) return;
    let done = false;
    const allowRender = () => {
      if (done) return;
      done = true;
      setCanRenderFrame(true);
    };
    const id = requestAnimationFrame(allowRender);
    const fallback = window.setTimeout(allowRender, 80);
    return () => {
      cancelAnimationFrame(id);
      window.clearTimeout(fallback);
    };
  }, [isReady]);

  // Defer actual Frame mount to a later macrotask + low-priority update so Craft deserialize
  // never runs during another component's render (avoids "Cannot update Ee while rendering De").
  useEffect(() => {
    if (!canRenderFrame || hasErrorBoundaryError) return;
    const t = setTimeout(() => {
      startTransition(() => {
        setFrameDataToShow(renderData);
      });
    }, 0);
    return () => clearTimeout(t);
  }, [canRenderFrame, hasErrorBoundaryError, renderData]);

  const handleDeferredFrameMounted = useCallback(() => {
    if (!onFrameMounted || mountedSignalSentRef.current) return;
    mountedSignalSentRef.current = true;
    onFrameMounted();
  }, [onFrameMounted]);

  const handleError = useCallback(() => {
    console.error('❌ SafeFrame: Error boundary triggered, falling back to empty canvas');
    setHasErrorBoundaryError(true);
    setRenderData(null);
    setFrameDataToShow(null);
    onError?.();
    // Defer so we don't trigger EditorShell setState during error boundary update
    if (onFrameMounted) {
      requestAnimationFrame(() => requestAnimationFrame(onFrameMounted));
    }
  }, [onError, onFrameMounted]);

  if (!isReady) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-brand-light">Loading editor...</div>
      </div>
    );
  }

  if (!canRenderFrame) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-brand-light">Loading editor...</div>
      </div>
    );
  }

  if (hasErrorBoundaryError || !renderData) {
    return <DeferredFrame data={EMPTY_FRAME_DATA} onMounted={handleDeferredFrameMounted} />;
  }

  // Only mount Frame with data in a separate commit (frameDataToShow set in useEffect)
  // so Craft.js deserialize doesn't cause "setState while rendering" in sibling/parent.
  if (frameDataToShow === null) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-brand-light">Loading editor...</div>
      </div>
    );
  }

  return (
    <FrameErrorBoundary onError={handleError}>
      <DeferredFrame data={frameDataToShow} onMounted={handleDeferredFrameMounted} />
    </FrameErrorBoundary>
  );
};

/**
 * Internal component to capture the Craft query object reliably.
 * Must be a child of <Editor />.
 */
const QueryStasher = ({ onQuery }: { onQuery: (query: any) => void }) => {
  const { query } = useEditor();
  useEffect(() => {
    onQuery(query);
  }, [query, onQuery]);
  return null;
};

/** Editor Shell */
export const EditorShell = ({ projectId, pageId: initialPageId }: EditorShellProps) => {
  const { showAlert, showConfirm } = useAlert();
  const [currentPageId, setCurrentPageId] = useState<string | null>(initialPageId ?? null);
  const [pages, setPages] = useState<Array<{ id: string; name: string }>>([]);
  const [projectFiles, setProjectFiles] = useState<any[]>([]);
  const lastQueryRef = useRef<{ serialize: () => string } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const previousScaleRef = useRef(1);
  const wheelZoomDeltaRef = useRef(0);
  const wheelZoomRafRef = useRef<number | null>(null);
  const wheelZoomAnchorRef = useRef<{ x: number; y: number } | null>(null);
  const wheelZoomingRef = useRef(false);
  const lastWheelZoomAtRef = useRef(0);
  const manualCameraControlUntilRef = useRef(0);
  const hasAutoCenteredAfterFrameReadyRef = useRef(false);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSnapshotRef = useRef<string | null>(null);
  const lastSavedRawRef = useRef<string | null>(null);
  const editorQueryRef = useRef<{ serialize: () => string } | null>(null);
  const errorCleanupDoneRef = useRef(false);
  const [isPanning, setIsPanning] = useState(false);
  const [isSpacePressed, setIsSpacePressed] = useState(false);
  const [scale, setScale] = useState(DEFAULT_SCALE);
  const [initialJson, setInitialJson] = useState<string | null | undefined>(undefined);
  const [panelsReady, setPanelsReady] = useState(false);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [saveError, setSaveError] = useState<string | null>(null);
  const [leftPanelOpen, setLeftPanelOpen] = useState(true);
  const [rightPanelOpen, setRightPanelOpen] = useState(true);
  const [leftPanelWidth, setLeftPanelWidth] = useState(LEFT_PANEL_DEFAULT_WIDTH);
  const [rightPanelWidth, setRightPanelWidth] = useState(RIGHT_PANEL_DEFAULT_WIDTH);
  const [rightPanelTab, setRightPanelTab] = useState<TabId>("design");
  const [canvasWidth, setCanvasWidth] = useState(1440);
  const [canvasHeight, setCanvasHeight] = useState(900);
  const [activeTool, setActiveTool] = useState<CanvasTool>("move");
  const [frameReady, setFrameReady] = useState(false);
  const [showDualView, setShowDualView] = useState(false);
  const hasInitialCenteringRef = useRef(false);
  const hasForcedRightPanelOpenRef = useRef(false);
  const saveStatusRef = useRef(saveStatus);
  const panelDragRef = useRef<{
    side: "left" | "right";
    startX: number;
    startWidth: number;
  } | null>(null);
  const [isPanelDragging, setIsPanelDragging] = useState(false);

  const handleToolChange = useCallback((tool: CanvasTool) => {
    setActiveTool(tool);

    // Keep hand cursor state from getting stuck after explicit tool switches.
    if (tool !== "hand") {
      setIsPanning(false);
      setIsSpacePressed(false);
      document.body.removeAttribute("data-canvas-pan");
      document.body.removeAttribute("data-space-pan");
    }
  }, []);

  const startPanelDrag = useCallback((side: "left" | "right", event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    const startWidth = side === "left" ? leftPanelWidth : rightPanelWidth;
    panelDragRef.current = { side, startX: event.clientX, startWidth };
    setIsPanelDragging(true);
  }, [leftPanelWidth, rightPanelWidth]);

  useEffect(() => {
    if (!isPanelDragging || !panelDragRef.current) return;
    const onMove = (e: MouseEvent) => {
      const state = panelDragRef.current;
      if (!state) return;
      const delta = state.side === "left" ? e.clientX - state.startX : state.startX - e.clientX;
      const nextWidth = Math.min(MAX_PANEL_WIDTH, Math.max(MIN_PANEL_WIDTH, state.startWidth + delta));
      if (state.side === "left") setLeftPanelWidth(nextWidth);
      else setRightPanelWidth(nextWidth);
      panelDragRef.current = { ...state, startX: e.clientX, startWidth: nextWidth };
    };
    const onUp = () => {
      panelDragRef.current = null;
      setIsPanelDragging(false);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [isPanelDragging]);

  // Sync saveStatus to ref for safe use in beforeunload effect
  useEffect(() => {
    saveStatusRef.current = saveStatus;
  }, [saveStatus]);

  // Per-project UI state key so zoom, panels, and last page persist across reloads
  const uiStateStorageKey = React.useMemo(
    () => (projectId ? `${UI_STATE_KEY_PREFIX}_${projectId}` : UI_STATE_KEY_PREFIX),
    [projectId]
  );
  // Cleanup corrupted data when error boundary triggers
  const handleFrameError = useCallback(async () => {
    if (errorCleanupDoneRef.current) return;
    errorCleanupDoneRef.current = true;

    // Clear per-project storage keys (sessionStorage + legacy localStorage)
    const storageKey = getStorageKey(projectId);
    try {
      if (typeof window !== "undefined") {
        // Clear from localStorage (older code paths may have used this)
        window.localStorage?.removeItem(storageKey);
      } else {
        // Fallback for environments where window is not defined
        localStorage.removeItem(storageKey);
      }
    } catch {
      // Ignore storage cleanup errors
    }

    // Also clear any cached snapshots from sessionStorage so we don't keep re-loading
    safeSessionRemove(storageKey);
    if (storageKey !== STORAGE_KEY_PREFIX) {
      // Legacy/unscoped key used before per-project keys were introduced
      safeSessionRemove(STORAGE_KEY_PREFIX);
    }

    // Clear from database
    if (projectId) {
      try {
        await deleteDraft(projectId);
      } catch {
        // Ignore cleanup errors
      }

      safeLocalRemove(getPersistentStorageKey(projectId));
    }

    // Reset to empty canvas
    setInitialJson(null);
  }, [projectId]);

  // Restore basic UI state (zoom, panels, selected page) on mount for smoother reloads
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.sessionStorage.getItem(uiStateStorageKey);
      if (!raw) return;
      const parsed = JSON.parse(raw) as {
        scale?: number;
        cameraX?: number;
        cameraY?: number;
        leftPanelOpen?: boolean;
        rightPanelOpen?: boolean;
        rightPanelTab?: TabId;
        currentPageId?: string | null;
        showDualView?: boolean;
      };

      if (typeof parsed.scale === "number") {
        setScale((prev) => {
          const next = clampScale(parsed.scale, prev);
          return prev === next ? prev : next;
        });
      }
      if (typeof parsed.leftPanelOpen === "boolean") setLeftPanelOpen(parsed.leftPanelOpen);
      if (typeof parsed.rightPanelOpen === "boolean") setRightPanelOpen(parsed.rightPanelOpen);
      if (parsed.rightPanelTab) setRightPanelTab(parsed.rightPanelTab);
      if (typeof parsed.showDualView === "boolean") setShowDualView(parsed.showDualView);
      if (parsed.currentPageId) setCurrentPageId(parsed.currentPageId);
    } catch {
      // Ignore bad UI state and let defaults win
    }
  }, [uiStateStorageKey]);

  // Persist basic UI state so it survives full page refreshes and dev reloads
  useEffect(() => {
    if (typeof window === "undefined") return;
    const payload = JSON.stringify({
      scale,
      leftPanelOpen,
      rightPanelOpen,
      rightPanelTab,
      currentPageId,
      showDualView,
    });
    try {
      window.sessionStorage.setItem(uiStateStorageKey, payload);
    } catch {
      // Ignore UI state persistence errors
    }
  }, [scale, leftPanelOpen, rightPanelOpen, rightPanelTab, currentPageId, showDualView, uiStateStorageKey]);

  // Fail-safe: ensure right panel is visible at least once after panels mount.
  // Prevents stale hidden state from making the panel appear missing.
  useEffect(() => {
    if (!panelsReady || hasForcedRightPanelOpenRef.current) return;
    hasForcedRightPanelOpenRef.current = true;
    setRightPanelOpen(true);
  }, [panelsReady]);

  // Load pages from document
  const loadPages = useCallback((content: string) => {
    try {
      const parsed = JSON.parse(content);
      if (parsed.version !== undefined && parsed.pages && Array.isArray(parsed.pages)) {
        const pageTabs = (parsed.pages as Array<{ id: string; name?: string }>).map((p) => ({
          id: p.id,
          name: p.name || `Page ${parsed.pages.indexOf(p) + 1}`,
        }));
        setPages(pageTabs);
        if (pageTabs.length > 0) {
          setCurrentPageId((prev) => prev || pageTabs[0].id);
        }
      }
    } catch {
      // Silently fail for non-multipage documents
    }
  }, []);

  const handleAddPage = useCallback(() => {
    if (!initialJson) return;
    try {
      const id = `page-${Date.now()}`;
      const newPage = {
        id,
        name: `Page ${pages.length + 1}`,
        props: { width: "100%", height: "auto" },
        children: [],
      };
      const parsed = JSON.parse(initialJson);
      if (!Array.isArray(parsed.pages)) parsed.pages = [];
      parsed.pages.push(newPage);
      const updated = JSON.stringify(parsed);
      const storageKey = getStorageKey(projectId);
      // Save to sessionStorage for persistence across refreshes
      safeSessionSet(storageKey, updated);
      // Optionally, also save to localStorage for backup (uncomment if needed)
      // localStorage.setItem(storageKey, updated);
      loadPages(updated);
      setCurrentPageId(id);
      setInitialJson(updated);
    } catch (error) {
      console.error("Failed to add page:", error);
      showAlert("Failed to add page", "error");
    }
  }, [initialJson, pages, projectId, loadPages, showAlert]);

  /** Sync pages list when a new page is added to the canvas via Craft (Add Page button / FAB) */
  const handlePageAdded = useCallback((id: string, name: string) => {
    setPages((prev) => [...prev, { id, name }]);
    setCurrentPageId(id);
  }, []);

  const handleSelectPage = useCallback((pageId: string) => {
    setCurrentPageId(pageId);
  }, []);

  const handleDeletePage = useCallback((pageId: string) => {
    if (!initialJson || pages.length <= 1) return;
    try {
      const parsed = JSON.parse(initialJson);
      parsed.pages = (parsed.pages || []).filter((p: any) => p.id !== pageId);
      const updated = JSON.stringify(parsed);
      const storageKey = getStorageKey(projectId);
      safeSessionSet(storageKey, updated);
      loadPages(updated);
      if (currentPageId === pageId && parsed.pages.length > 0) {
        setCurrentPageId(parsed.pages[0].id);
      }
      setInitialJson(updated);
    } catch (error) {
      console.error("Failed to delete page:", error);
      showAlert("Failed to delete page", "error");
    }
  }, [initialJson, currentPageId, pages, projectId, loadPages, showAlert]);

  const handleRenamePage = useCallback((pageId: string, newName: string) => {
    if (!initialJson) return;
    try {
      const parsed = JSON.parse(initialJson);
      const page = (parsed.pages || []).find((p: any) => p.id === pageId);
      if (page) {
        page.name = newName;
        const updated = JSON.stringify(parsed);
        const storageKey = getStorageKey(projectId);
        safeSessionSet(storageKey, updated);
        loadPages(updated);
        setInitialJson(updated);
      }
    } catch (error) {
      console.error("Failed to rename page:", error);
      showAlert("Failed to rename page", "error");
    }
  }, [initialJson, projectId, loadPages, showAlert]);

  const mousePosRef = useRef({ x: 0, y: 0 });

  // Figma-style zoom: Ctrl+wheel zooms anchored to cursor; plain wheel pans via native scroll.
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      // Detect if the target is inside our builder root to avoid intercepting other components
      const targetEl = e.target instanceof HTMLElement ? e.target : null;
      if (!targetEl || !targetEl.closest("[data-web-builder-root]")) return;

      if (!(e.ctrlKey || e.metaKey)) return;
      if (isEditableTarget(e.target)) return;
      if (e.target instanceof HTMLElement && e.target.closest("[data-panel]")) return;

      const container = containerRef.current;
      if (!container) return;

      const rect = container.getBoundingClientRect();
      const isInsideCanvas =
        e.clientX >= rect.left &&
        e.clientX <= rect.right &&
        e.clientY >= rect.top &&
        e.clientY <= rect.bottom;

      if (!isInsideCanvas) return;

      mousePosRef.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
      wheelZoomAnchorRef.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
      lastWheelZoomAtRef.current = Date.now();
      manualCameraControlUntilRef.current = Date.now() + 5000;

      if (e.cancelable) {
        e.preventDefault();
      }
      e.stopPropagation();

      let deltaY = e.deltaY;
      if (e.deltaMode === WheelEvent.DOM_DELTA_LINE) {
        deltaY *= 16;
      } else if (e.deltaMode === WheelEvent.DOM_DELTA_PAGE) {
        deltaY *= container.clientHeight;
      }

      const normalizedDelta = Math.max(-240, Math.min(240, deltaY));
      wheelZoomDeltaRef.current += normalizedDelta;

      if (wheelZoomRafRef.current !== null) return;

      wheelZoomRafRef.current = requestAnimationFrame(() => {
        wheelZoomRafRef.current = null;
        const frameDelta = wheelZoomDeltaRef.current;
        wheelZoomDeltaRef.current = 0;

        if (Math.abs(frameDelta) < 0.01) return;

        wheelZoomingRef.current = true;
        setScale((prevScale) => {
          const safePrev = clampScale(prevScale, previousScaleRef.current || 1);
          const zoomFactor = Math.exp(-frameDelta * ZOOM_SENSITIVITY);
          if (!Number.isFinite(zoomFactor) || zoomFactor <= 0) {
            return safePrev;
          }
          const nextScale = safePrev * zoomFactor;
          return clampScale(nextScale, safePrev);
        });
      });
    };

    window.addEventListener("wheel", handleWheel, { passive: false, capture: true });

    return () => {
      if (wheelZoomRafRef.current !== null) {
        cancelAnimationFrame(wheelZoomRafRef.current);
        wheelZoomRafRef.current = null;
      }
      wheelZoomDeltaRef.current = 0;
      window.removeEventListener("wheel", handleWheel, { capture: true });
    };
  }, []);

  // Update mouse position for anchoring
  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      const container = containerRef.current;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      mousePosRef.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    };
    window.addEventListener("mousemove", handleGlobalMouseMove);
    return () => window.removeEventListener("mousemove", handleGlobalMouseMove);
  }, []);

  // Keep anchor point stationary while zooming
  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) {
      previousScaleRef.current = clampScale(scale, previousScaleRef.current || 1);
      wheelZoomingRef.current = false;
      return;
    }

    const prevScale = clampScale(previousScaleRef.current, scale || 1);
    const nextScale = clampScale(scale, prevScale);
    if (prevScale === nextScale) {
      previousScaleRef.current = nextScale;
      wheelZoomingRef.current = false;
      return;
    }

    if (container.clientWidth <= 0 || container.clientHeight <= 0) {
      previousScaleRef.current = nextScale;
      wheelZoomingRef.current = false;
      return;
    }

    // Anchor point: Use current mouse coordinates relative to container
    const wheelAnchor = wheelZoomingRef.current ? wheelZoomAnchorRef.current : null;
    const anchorX = Math.min(container.clientWidth, Math.max(0, wheelAnchor?.x ?? mousePosRef.current.x));
    const anchorY = Math.min(container.clientHeight, Math.max(0, wheelAnchor?.y ?? mousePosRef.current.y));

    const contentX = (container.scrollLeft + anchorX) / prevScale;
    const contentY = (container.scrollTop + anchorY) / prevScale;

    if (!Number.isFinite(contentX) || !Number.isFinite(contentY)) {
      previousScaleRef.current = nextScale;
      wheelZoomingRef.current = false;
      return;
    }

    const nextScrollLeft = contentX * nextScale - anchorX;
    const nextScrollTop = contentY * nextScale - anchorY;

    const maxScrollLeft = Math.max(0, container.scrollWidth - container.clientWidth);
    const maxScrollTop = Math.max(0, container.scrollHeight - container.clientHeight);

    container.scrollLeft = Math.min(maxScrollLeft, Math.max(0, nextScrollLeft));
    container.scrollTop = Math.min(maxScrollTop, Math.max(0, nextScrollTop));
    previousScaleRef.current = nextScale;
    wheelZoomingRef.current = false;
  }, [scale]);

  // Keyboard zoom handles: Ctrl+/Ctrl-/Ctrl+0
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const ctrl = e.ctrlKey || e.metaKey;
      if (!ctrl) return;
      if (isEditableTarget(e.target)) return;

      const key = e.key;
      const isZoomIn = key === "+" || key === "=" || e.code === "NumpadAdd";
      const isZoomOut = key === "-" || key === "_" || e.code === "NumpadSubtract";
      const isZoomReset = key === "0" || e.code === "Digit0" || e.code === "Numpad0";
      if (!isZoomIn && !isZoomOut && !isZoomReset) return;

      if (e.cancelable) e.preventDefault();
      e.stopPropagation();

      if (isZoomReset) {
        setScale(1);
      } else {
        setScale((prev) => clampScale(isZoomIn ? prev + ZOOM_STEP : prev - ZOOM_STEP, prev));
      }
    };

    window.addEventListener("keydown", handleKeyDown, { capture: true });
    return () => window.removeEventListener("keydown", handleKeyDown, { capture: true });
  }, []);

  // Center camera so that a given world-space point appears at viewport center
  const centerOnWorldPoint = useCallback((worldX: number, worldY: number, zoom?: number) => {
    const container = containerRef.current;
    if (!container) return;
    const z = zoom ?? scale;
    const vw = container.clientWidth / 2;
    const vh = container.clientHeight / 2;

    // We want the viewport center to correspond to the world point
    // worldX * z + offsetX = vw  => offsetX = vw - worldX * z
    // In our scroll system, scrollLeft = INFINITE_CANVAS_PADDING_PX + worldX*z - viewportCenter
    // wait, actually simplified:
    container.scrollLeft = worldX * z - vw;
    container.scrollTop = worldY * z - vh;
  }, [scale]);

  // Center camera on the current page element
  const centerCanvasInView = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    const pageEl =
      (currentPageId
        ? container.querySelector<HTMLElement>(
          `[data-viewport-desktop] [data-page-node="true"][data-node-id="${currentPageId}"]`
        ) ?? container.querySelector<HTMLElement>(
          `[data-page-node="true"][data-node-id="${currentPageId}"]`
        )
        : null) ??
      container.querySelector<HTMLElement>('[data-viewport-desktop] [data-page-node="true"]') ??
      container.querySelector<HTMLElement>('[data-page-node="true"]');

    if (pageEl) {
      const contRect = container.getBoundingClientRect();
      const pageRect = pageEl.getBoundingClientRect();

      const pageCenterX = container.scrollLeft + (pageRect.left - contRect.left) + pageRect.width / 2;
      const pageCenterY = container.scrollTop + (pageRect.top - contRect.top) + pageRect.height / 2;

      container.scrollLeft = pageCenterX - container.clientWidth / 2;
      container.scrollTop = pageCenterY - container.clientHeight / 2;
    } else {
      // Fallback: center of the "infinite" area roughly where origin is
      centerOnWorldPoint(INFINITE_CANVAS_PADDING_PX + PAGE_BASE_WIDTH / 2, INFINITE_CANVAS_PADDING_PX + PAGE_BASE_HEIGHT / 2);
    }
  }, [currentPageId, centerOnWorldPoint]);

  // Center immediately on first mount
  useLayoutEffect(() => {
    if (hasInitialCenteringRef.current) return;
    const rafId = requestAnimationFrame(() => {
      centerOnWorldPoint(
        PAGE_GRID_ORIGIN_X + PAGE_BASE_WIDTH / 2,
        PAGE_GRID_ORIGIN_Y + PAGE_BASE_HEIGHT / 2,
      );
      hasInitialCenteringRef.current = true;
    });
    return () => cancelAnimationFrame(rafId);
  }, [centerOnWorldPoint]);

  // Re-center after frame loads so the page is visible
  useEffect(() => {
    if (!frameReady) return;
    if (hasAutoCenteredAfterFrameReadyRef.current) return;
    hasAutoCenteredAfterFrameReadyRef.current = true;

    const centerIfNotRecentWheelZoom = () => {
      if (Date.now() < manualCameraControlUntilRef.current) return;
      if (Date.now() - lastWheelZoomAtRef.current < 350) return;
      centerCanvasInView();
    };

    const raf = requestAnimationFrame(() => centerIfNotRecentWheelZoom());
    const t1 = window.setTimeout(() => centerIfNotRecentWheelZoom(), 300);
    const t2 = window.setTimeout(() => centerIfNotRecentWheelZoom(), 800);
    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, [frameReady, initialJson, centerCanvasInView]);

  // Listen for center-on-node events from ScrollToSelectedHandler / FloatingMobilePreview
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleCenterOnNode = (e: Event) => {
      if (Date.now() < manualCameraControlUntilRef.current) return;
      if (Date.now() - lastWheelZoomAtRef.current < 250) return;

      const { nodeId } = (e as CustomEvent<{ nodeId: string }>).detail;
      if (!nodeId) return;

      const nodeEl = document.querySelector<HTMLElement>(
        `[data-viewport-desktop] [data-node-id="${nodeId}"]`
      ) ?? document.querySelector<HTMLElement>(`[data-node-id="${nodeId}"]`);
      if (!nodeEl) return;

      const contRect = container.getBoundingClientRect();
      const nodeRect = nodeEl.getBoundingClientRect();

      const nodeCenterX = container.scrollLeft + (nodeRect.left - contRect.left) + nodeRect.width / 2;
      const nodeCenterY = container.scrollTop + (nodeRect.top - contRect.top) + nodeRect.height / 2;

      container.scrollLeft = nodeCenterX - container.clientWidth / 2;
      container.scrollTop = nodeCenterY - container.clientHeight / 2;
    };

    container.addEventListener("center-on-node", handleCenterOnNode);
    return () => container.removeEventListener("center-on-node", handleCenterOnNode);
  }, []);

  // Handle canvas rotation
  const handleRotateCanvas = useCallback(() => {
    // Rotation is handled per-page in TopPanel; keep callback for API compatibility.
  }, []);

  // Handle fit to canvas: zoom so page fits with 10% margin, then center
  const handleFitToCanvas = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    const contentWidth = canvasWidth;
    const contentHeight = canvasHeight;
    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;
    if (
      !Number.isFinite(contentWidth) || !Number.isFinite(contentHeight) ||
      contentWidth <= 0 || contentHeight <= 0 ||
      containerWidth <= 0 || containerHeight <= 0
    ) return;

    const scaleX = (containerWidth * 0.9) / contentWidth;
    const scaleY = (containerHeight * 0.9) / contentHeight;
    const newScale = clampScale(Math.min(scaleX, scaleY, 1), 1);

    const pageEl =
      (currentPageId
        ? container.querySelector<HTMLElement>(
          `[data-viewport-desktop] [data-page-node="true"][data-node-id="${currentPageId}"]`
        ) ?? container.querySelector<HTMLElement>(
          `[data-page-node="true"][data-node-id="${currentPageId}"]`
        )
        : null) ??
      container.querySelector<HTMLElement>('[data-viewport-desktop] [data-page-node="true"]') ??
      container.querySelector<HTMLElement>('[data-page-node="true"]');

    let worldCX = PAGE_GRID_ORIGIN_X + PAGE_BASE_WIDTH / 2;
    let worldCY = PAGE_GRID_ORIGIN_Y + PAGE_BASE_HEIGHT / 2;

    if (pageEl) {
      const contRect = container.getBoundingClientRect();
      const pageRect = pageEl.getBoundingClientRect();
      const pageCenterX = container.scrollLeft + (pageRect.left - contRect.left) + pageRect.width / 2;
      const pageCenterY = container.scrollTop + (pageRect.top - contRect.top) + pageRect.height / 2;

      setScale(newScale);
      setTimeout(() => {
        if (containerRef.current) {
          containerRef.current.scrollLeft = pageCenterX - containerRef.current.clientWidth / 2;
          containerRef.current.scrollTop = pageCenterY - containerRef.current.clientHeight / 2;
        }
      }, 1);
    } else {
      setScale(newScale);
      centerOnWorldPoint(INFINITE_CANVAS_PADDING_PX + PAGE_BASE_WIDTH / 2, INFINITE_CANVAS_PADDING_PX + PAGE_BASE_HEIGHT / 2, newScale);
    }
  }, [canvasWidth, canvasHeight, scale, currentPageId, centerOnWorldPoint]);

  const handleScaleChange = useCallback((nextScale: number) => {
    setScale((prev) => clampScale(nextScale, prev));
  }, []);

  // Handle device preset selection - only width changes; preserve page height so it doesn't reset
  const handleDevicePresetSelect = useCallback((preset: DevicePreset) => {
    setCanvasWidth(preset.width);
    // Do not set canvasHeight so existing page height is preserved when switching device sizes
    setTimeout(() => {
      handleFitToCanvas();
    }, 100);
  }, [handleFitToCanvas]);

  const isSpacePanActive = isSpacePressed;
  const canPanWithPointerDrag = activeTool === "hand" || isSpacePanActive;

  const handleMouseDown = (e: React.MouseEvent) => {
    if (canPanWithPointerDrag) {
      setIsPanning(true);
      document.body.dataset.canvasPan = "true";
      e.preventDefault();
      e.stopPropagation(); // Prevent Craft.js from handling drag events
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
    document.body.removeAttribute("data-canvas-pan");
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning && containerRef.current) {
      manualCameraControlUntilRef.current = Date.now() + 5000;
      containerRef.current.scrollLeft -= e.movementX;
      containerRef.current.scrollTop -= e.movementY;
    }
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.code !== "Space") return;
      if (event.ctrlKey || event.metaKey || event.altKey) return;
      if (isEditableTarget(event.target)) return;

      event.preventDefault();
      setIsSpacePressed(true);
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      if (event.code !== "Space") return;
      setIsSpacePressed(false);
    };

    const handleWindowBlur = () => {
      setIsSpacePressed(false);
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    window.addEventListener("blur", handleWindowBlur);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      window.removeEventListener("blur", handleWindowBlur);
    };
  }, [activeTool]);

  useEffect(() => {
    if (isSpacePanActive) {
      document.body.dataset.spacePan = "true";
      return;
    }
    document.body.removeAttribute("data-space-pan");
  }, [isSpacePanActive]);

  useEffect(() => {
    if (activeTool === "move" && !isSpacePanActive && isPanning) {
      setIsPanning(false);
      document.body.removeAttribute("data-canvas-pan");
    }
  }, [activeTool, isSpacePanActive, isPanning]);

  useEffect(() => {
    const stopPan = () => {
      setIsPanning(false);
      document.body.removeAttribute("data-canvas-pan");
    };

    window.addEventListener("mouseup", stopPan, true);
    window.addEventListener("blur", stopPan);
    return () => {
      window.removeEventListener("mouseup", stopPan, true);
      window.removeEventListener("blur", stopPan);
    };
  }, []);

  useEffect(() => {
    const handleToolShortcut = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey || event.altKey) return;
      if (isEditableTarget(event.target)) return;

      const key = event.key.toLowerCase();

      if (key === "h") {
        event.preventDefault();
        handleToolChange("hand");
        return;
      }

      if (key === "g") {
        event.preventDefault();
        handleToolChange("move");
      }
    };

    window.addEventListener("keydown", handleToolShortcut);
    return () => window.removeEventListener("keydown", handleToolShortcut);
  }, [handleToolChange]);

  // Track if editor is fully loaded to prevent stale closure issues
  const isReadyRef = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const storageProto = Object.getPrototypeOf(window.sessionStorage) as Storage;
    const originalSetItem = storageProto.setItem;

    storageProto.setItem = function (this: Storage, key: string, value: string) {
      if (typeof key === "string" && key.startsWith(STORAGE_KEY_PREFIX)) {
        try {
          return originalSetItem.call(this, key, value);
        } catch (error) {
          if (isQuotaError(error)) {
            console.warn("Skipped sessionStorage write for oversized craft preview payload:", key);
            return;
          }
          throw error;
        }
      }

      return originalSetItem.call(this, key, value);
    };

    return () => {
      storageProto.setItem = originalSetItem;
    };
  }, []);

  // One-time migration: clear legacy draft data from localStorage (now using sessionStorage only)
  useEffect(() => {
    if (typeof window === "undefined" || !window.localStorage) return;
    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < window.localStorage.length; i++) {
        const k = window.localStorage.key(i);
        if (k && (k.startsWith(STORAGE_KEY_PREFIX) || k.startsWith("webbuilder_pages"))) {
          keysToRemove.push(k);
        }
      }
      keysToRemove.forEach((k) => window.localStorage.removeItem(k));
    } catch {
      // Ignore migration errors
    }
  }, []);

  // Restore saved editor state from database on mount
  useEffect(() => {
    hasInitialCenteringRef.current = false;
    hasAutoCenteredAfterFrameReadyRef.current = false;
    manualCameraControlUntilRef.current = 0;
    lastWheelZoomAtRef.current = 0;
    wheelZoomAnchorRef.current = null;
    wheelZoomingRef.current = false;
    setFrameReady(false);
    setPanelsReady(false);

    if (!projectId) {
      setInitialJson(null);
      isReadyRef.current = true;
      return;
    }

    async function loadDraft() {
      try {
        // Try sessionStorage per-project (no localStorage — auth/drafts in cookies or session only)
        const storageKey = getStorageKey(projectId);
        const sessionSaved = safeSessionGet(storageKey);
        const persistentKey = getPersistentStorageKey(projectId);
        const persistentSaved = safeLocalGet(persistentKey);

        let contentToLoad: string | null = null;

        const applyLoadedContent = (content: string | null) => {
          setInitialJson(content);
          if (!content) return;
          loadPages(content);
          try {
            const parsed = JSON.parse(content);
            if (parsed.files) {
              setProjectFiles(parsed.files);
            }
          } catch (e) {
            console.warn('Failed to parse files from initialJson', e);
          }
        };

        const normalizeToCraftJson = (input: unknown): string | null => {
          try {
            if (input == null) return null;
            if (typeof input === "string") {
              const parsed = JSON.parse(input);
              if (parsed && parsed.ROOT && Array.isArray(parsed.ROOT.nodes)) {
                const validated = validateCraftData(input);
                return validated.valid && validated.data ? validated.data : null;
              }
              if (
                parsed &&
                parsed.version !== undefined &&
                Array.isArray(parsed.pages) &&
                parsed.nodes &&
                typeof parsed.nodes === "object"
              ) {
                const craftJson = deserializeCleanToCraft(parsed as Parameters<typeof deserializeCleanToCraft>[0]);
                const validated = validateCraftData(craftJson);
                return validated.valid && validated.data ? validated.data : null;
              }
              return null;
            }

            if (typeof input === "object") {
              const obj = input as {
                ROOT?: { nodes?: unknown[] };
                version?: unknown;
                pages?: unknown[];
                nodes?: unknown;
              };

              if (obj.ROOT && Array.isArray(obj.ROOT.nodes)) {
                const craftJson = JSON.stringify(obj);
                const validated = validateCraftData(craftJson);
                return validated.valid && validated.data ? validated.data : null;
              }

              if (obj.version !== undefined && Array.isArray(obj.pages) && obj.nodes && typeof obj.nodes === "object") {
                const craftJson = deserializeCleanToCraft(obj as Parameters<typeof deserializeCleanToCraft>[0]);
                const validated = validateCraftData(craftJson);
                return validated.valid && validated.data ? validated.data : null;
              }
            }

            return null;
          } catch {
            return null;
          }
        };

        // 1. Check sessionStorage first to preserve latest unsaved/preview snapshot
        // Apply immediately so existing projects open without waiting for DB/network.
        if (sessionSaved) {
          const normalized = normalizeToCraftJson(sessionSaved);
          if (normalized) {
            contentToLoad = normalized;
            if (normalized !== sessionSaved) {
              safeSessionSet(storageKey, normalized);
            }
            safeLocalSet(persistentKey, normalized);
            applyLoadedContent(contentToLoad);
          } else {
            console.warn('⚠️ Invalid draft structure in session. Clearing session cache for this project.');
            safeSessionRemove(storageKey);
          }
        }

        // 2. Check persistent local cache when session cache is unavailable
        if (!contentToLoad && persistentSaved) {
          const normalized = normalizeToCraftJson(persistentSaved);
          if (normalized) {
            contentToLoad = normalized;
            safeSessionSet(storageKey, normalized);
            if (normalized !== persistentSaved) {
              safeLocalSet(persistentKey, normalized);
            }
            applyLoadedContent(contentToLoad);
          } else {
            safeLocalRemove(persistentKey);
          }
        }

        // 3. Try to load from database
        const result = await getDraft(projectId);

        // 4. Check Database (fallback)
        if (!contentToLoad && result.success && result.data && result.data.content) {
          const normalized = normalizeToCraftJson(result.data.content);
          if (normalized) {
            contentToLoad = normalized;
            safeSessionSet(storageKey, normalized);
            safeLocalSet(persistentKey, normalized);
            applyLoadedContent(contentToLoad);
          } else {
            console.warn('⚠️ Invalid draft structure in DB. Clearing invalid draft...');
            await deleteDraft(projectId);
          }
        }

        // Legacy global fallback intentionally disabled to avoid cross-project draft bleed.

        if (!contentToLoad) {
          applyLoadedContent(null);
        }

        // IMPORTANT: Mark as ready immediately via Ref to avoid stale closures
        isReadyRef.current = true;

      } catch {
        setInitialJson(null);
        isReadyRef.current = true; // Allow editing even if load failed
      }
    }

    loadDraft();
  }, [projectId, loadPages]);

  // Defer panel rendering until Frame has mounted to avoid setState-during-render warnings
  useEffect(() => {
    if (!frameReady) {
      setPanelsReady(false);
      return;
    }
    const id = requestAnimationFrame(() => setPanelsReady(true));
    return () => cancelAnimationFrame(id);
  }, [frameReady]);

  // Hide Craft drop indicator only when dragging the special New Page source item
  useEffect(() => {
    let clearTimer: number | null = null;

    const activateSuppression = () => {
      if (clearTimer !== null) {
        window.clearTimeout(clearTimer);
        clearTimer = null;
      }
      document.body.dataset.newPageDragActive = "true";
    };

    const clearSuppression = (delayMs = 900) => {
      if (clearTimer !== null) {
        window.clearTimeout(clearTimer);
      }
      clearTimer = window.setTimeout(() => {
        delete document.body.dataset.newPageDragActive;
        clearTimer = null;
      }, delayMs);
    };

    const handleMouseDown = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      const isNewPageSource = !!target?.closest("[data-component-new-page='true']");
      if (isNewPageSource) {
        activateSuppression();
      }
    };

    const handleDragStart = (event: DragEvent) => {
      const target = event.target as HTMLElement | null;
      const startedFromNewPage =
        !!target?.closest("[data-component-new-page='true']") ||
        document.body.dataset.newPageDragActive === "true";
      if (startedFromNewPage) {
        activateSuppression();
      }
    };

    const handleDropOrDragEnd = () => {
      if (document.body.dataset.newPageDragActive === "true") {
        clearSuppression(1000);
      }
    };

    const handleWindowBlur = () => {
      if (clearTimer !== null) {
        window.clearTimeout(clearTimer);
      }
      delete document.body.dataset.newPageDragActive;
      clearTimer = null;
    };

    document.addEventListener("mousedown", handleMouseDown, true);
    document.addEventListener("dragstart", handleDragStart, true);
    document.addEventListener("drop", handleDropOrDragEnd, true);
    document.addEventListener("dragend", handleDropOrDragEnd, true);
    window.addEventListener("blur", handleWindowBlur);

    return () => {
      if (clearTimer !== null) {
        window.clearTimeout(clearTimer);
      }
      delete document.body.dataset.newPageDragActive;
      document.removeEventListener("mousedown", handleMouseDown, true);
      document.removeEventListener("dragstart", handleDragStart, true);
      document.removeEventListener("drop", handleDropOrDragEnd, true);
      document.removeEventListener("dragend", handleDropOrDragEnd, true);
      window.removeEventListener("blur", handleWindowBlur);
    };
  }, []);

  // Handle Delete Data
  const handleDeleteData = async () => {
    if (!projectId) return;
    const confirmed = await showConfirm("Are you sure you want to delete your progress? This cannot be undone.");
    if (!confirmed) return;

    console.log('🗑️ Deleting draft...');
    const result = await deleteDraft(projectId);

    if (result.success) {
      console.log('✅ Draft deleted');
      safeSessionRemove(getStorageKey(projectId));
      location.reload(); // Reload to reset editorstate
    } else {
      showAlert('Failed to delete draft: ' + (result.error || 'Unknown error'));
    }
  };

  /**
   * Immediately serialize the current editor state to sessionStorage.
   * Returns the clean snapshot string, or null on failure.
   */
  const mirrorToSession = useCallback(
    (query: { serialize: () => string }): string | null => {
      try {
        const next = query.serialize();
        if (next === lastSavedRawRef.current) return lastSnapshotRef.current;
        const parsed = JSON.parse(next);
        if (!parsed?.ROOT) return null;

        lastSavedRawRef.current = next;

        let snapshot: string | null = null;
        try {
          snapshot = JSON.stringify(serializeCraftToClean(next));
        } catch {
          snapshot = null;
        }

        const toStore = snapshot ?? next;
        if (typeof window !== "undefined" && window.sessionStorage && projectId) {
          try {
            const key = `${STORAGE_KEY_PREFIX}_${projectId}`;
            window.sessionStorage.setItem(key, toStore);
          } catch (e) {
            if (!isQuotaError(e)) console.warn("Auto-save: sessionStorage write failed", e);
          }
        }

        if (projectId) {
          safeLocalSet(getPersistentStorageKey(projectId), toStore);
        }

        if (snapshot) lastSnapshotRef.current = snapshot;
        return snapshot;
      } catch {
        return null;
      }
    },
    [projectId],
  );

  const dbSaveInFlightRef = useRef(false);
  const dbSavePendingRef = useRef(false);

  const flushToDb = useCallback(async () => {
    const snapshot = lastSnapshotRef.current;
    if (!snapshot || !projectId) {
      setSaveStatus("idle");
      return;
    }
    if (dbSaveInFlightRef.current) {
      dbSavePendingRef.current = true;
      return;
    }
    dbSaveInFlightRef.current = true;
    try {
      const result = await autoSavePage(snapshot, projectId);
      if (result.success) {
        setSaveStatus("saved");
        setSaveError(null);
        setTimeout(() => setSaveStatus("idle"), 1200);
      } else {
        console.warn("Auto-save warning:", result.error);
        setSaveStatus("error");
        setSaveError(result.error || "Save failed");
      }
    } catch (error) {
      console.error("Auto-save error:", error);
      setSaveStatus("error");
      setSaveError(error instanceof Error ? error.message : "Network error");
    } finally {
      dbSaveInFlightRef.current = false;
      if (dbSavePendingRef.current) {
        dbSavePendingRef.current = false;
        flushToDb();
      }
    }
  }, [projectId]);

  // Auto-save: mirror to sessionStorage on every change, save to DB right after
  const handleNodesChange = useCallback(
    (query: { serialize: () => string }) => {
      editorQueryRef.current = query;

      if (!isReadyRef.current) return;

      const isDragging =
        document.body.dataset.editorDragging === "true" ||
        document.body.dataset.editorDropCommit === "true";

      // Always mirror to sessionStorage so refresh never loses work
      mirrorToSession(query);

      // During drag: skip DB write to keep the canvas responsive (drag-end handler will flush)
      if (isDragging) return;

      if (projectId) {
        Promise.resolve().then(() => {
          setSaveStatus("saving");
          setSaveError(null);
        });
      }

      // Save to DB immediately (queued if a save is already in flight)
      flushToDb();
    },
    [projectId, mirrorToSession, flushToDb],
  );

  // After a drag ends, do one final save (positions changed but no further onNodesChange fires)
  useEffect(() => {
    const observer = new MutationObserver((mutations) => {
      for (const m of mutations) {
        if (m.attributeName !== "data-editor-dragging" && m.attributeName !== "data-editor-drop-commit") continue;
        const isDragging =
          document.body.dataset.editorDragging === "true" ||
          document.body.dataset.editorDropCommit === "true";
        if (!isDragging && editorQueryRef.current && isReadyRef.current) {
          handleNodesChange(editorQueryRef.current);
        }
      }
    });
    observer.observe(document.body, { attributes: true, attributeFilter: ["data-editor-dragging", "data-editor-drop-commit"] });
    return () => observer.disconnect();
  }, [handleNodesChange]);

  // Save to sessionStorage right before the tab is closed / refreshed
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (editorQueryRef.current && isReadyRef.current) {
        mirrorToSession(editorQueryRef.current);
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [mirrorToSession]);

  // Clean up on unmount
  useEffect(() => {
    if (projectFiles.length > 0 && lastQueryRef.current) {
      handleNodesChange(lastQueryRef.current);
    }
  }, [projectFiles, handleNodesChange]);

  // Clean up debounce timer and add beforeunload warning
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (saveStatusRef.current === 'saving') {
        const message = "Your changes are still saving. Are you sure you want to leave?";
        e.returnValue = message;
        return message;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, []); // Stable [] array to prevent mismatch

  /** Only pass to Frame if data is valid Craft format and every node type exists in resolver */
  const resolverRef = useRef<Record<string, React.ComponentType>>({});

  const resolver: Record<string, React.ComponentType> = React.useMemo(() => {
    const FrameForResolver: React.ComponentType =
      (typeof FrameComponentFromFile === "function" ? FrameComponentFromFile : null) ??
      (typeof RenderBlocks?.Frame === "function" ? RenderBlocks.Frame : null) ??
      CRAFT_RESOLVER.Frame ??
      SAFE_CONTAINER;

    const base: Record<string, any> = {
      ...RenderBlocks,
      ...CRAFT_RESOLVER,
      Button: (typeof Button === "function" ? Button : null) ?? SAFE_CONTAINER,
      button: (typeof Button === "function" ? Button : null) ?? SAFE_CONTAINER,
      Text: Text || SAFE_CONTAINER,
      text: Text || SAFE_CONTAINER,
      Image: Image || SAFE_CONTAINER,
      image: Image || SAFE_CONTAINER,
      Circle: Circle || SAFE_CONTAINER,
      Square: Square || SAFE_CONTAINER,
      Triangle: Triangle || SAFE_CONTAINER,
      circle: Circle || SAFE_CONTAINER,
      square: Square || SAFE_CONTAINER,
      triangle: Triangle || SAFE_CONTAINER,
    };
    // Force Frame to always exist; Craft looks up by "Frame" and sometimes "frame"
    base.Frame = FrameForResolver;
    base.frame = FrameForResolver;
    // Ensure Container always exists in resolver (serialized nodes often use this)
    // Prefer the locally imported Container component so we never end up with an undefined value
    base.Container = SAFE_CONTAINER;
    base.container = SAFE_CONTAINER;
    // Ensure Page and Viewport always in resolver (serialized drafts reference these by type)
    base.Page = CRAFT_RESOLVER.Page ?? Page ?? SAFE_CONTAINER;
    base.page = CRAFT_RESOLVER.Page ?? Page ?? SAFE_CONTAINER;
    base.Viewport = CRAFT_RESOLVER.Viewport ?? Viewport ?? SAFE_CONTAINER;
    base.viewport = CRAFT_RESOLVER.Viewport ?? Viewport ?? SAFE_CONTAINER;
    base.Image = (typeof Image === "function" ? Image : null) ?? SAFE_CONTAINER;
    base.image = (typeof Image === "function" ? Image : null) ?? SAFE_CONTAINER;
    base.Text = (typeof Text === "function" ? Text : null) ?? SAFE_CONTAINER;
    base.text = (typeof Text === "function" ? Text : null) ?? SAFE_CONTAINER;
    return base;
  }, []);

  resolverRef.current = resolver;
  const validFrameData = React.useMemo(() => {
    if (initialJson === undefined || initialJson === null || initialJson === "") return null;
    try {
      const raw = typeof initialJson === "string" ? initialJson : JSON.stringify(initialJson);
      const validated = validateCraftData(raw);
      return validated.valid && validated.data ? validated.data : null;
    } catch {
      return null;
    }
  }, [initialJson]);

  return (
    <div data-web-builder-root className="h-screen bg-brand-black text-brand-lighter overflow-hidden font-sans relative">
      <style>{`
        div[style*="position: fixed"][style*="z-index: 99999"][style*="border-style: solid"],
        div[style*="position: fixed"][style*="z-index: 99999"][style*="background-color: rgb(98, 196, 98)"],
        div[style*="position: fixed"][style*="z-index: 99999"][style*="background-color: rgba(98, 196, 98"],
        div[style*="position: fixed"][style*="z-index: 99999"][style*="height: 2px"],
        div[style*="position: fixed"][style*="z-index: 99999"][style*="height: 3px"] {
          display: none !important;
          opacity: 0 !important;
          border-width: 0 !important;
          background: transparent !important;
        }
      `}</style>
      <Editor
        resolver={resolver}
        indicator={{
          success: "rgba(0,0,0,0)",
          error: "rgba(0,0,0,0)",
          thickness: 0,
          transition: "none",
          style: {
            display: "none",
          },
        }}
        onRender={RenderNode}
        onNodesChange={(query) => requestAnimationFrame(() => handleNodesChange(query))}
      >
        <QueryStasher onQuery={(q) => { lastQueryRef.current = q; }} />
        <PrototypeTabProvider isActive={rightPanelTab === "prototype"}>
          <CanvasToolProvider value={activeTool} onToolChange={handleToolChange}>
            <TransformModeProvider>
              <InlineTextEditProvider>
                <KeyboardShortcuts />
                <CanvasSelectionHandler />
                <BoxSelectionHandler />
                <ScrollToSelectedHandler />
                <CanvasContextMenu />
                <FigmaStyleDragHandler />
                <FreeDropPlacementHandler />
                <NewPageDropPlacementHandler />
                <HeaderFooterDropPlacementHandler />
                <PanelDropFreePlacementHandler />
                <TextToolHandler />
                <ShapeToolHandler />
                <DoubleClickTransformHandler />
                <PrototypeFlowLines />
                {/* Top Panel */}
                {panelsReady && (
                  <TopPanel
                    scale={scale}
                    onScaleChange={handleScaleChange}
                    onRotateCanvas={handleRotateCanvas}
                    activePageId={currentPageId}
                    onFitToCanvas={handleFitToCanvas}
                    canvasWidth={canvasWidth}
                    canvasHeight={canvasHeight}
                    onDevicePresetSelect={handleDevicePresetSelect}
                    showDualView={showDualView}
                    onDualViewToggle={() => setShowDualView((v) => !v)}
                  />
                )}
                {/* Canvas Area — Infinite Scroll Area */}
                <div
                  ref={containerRef}
                  data-canvas-container
                  className={`absolute inset-0 overflow-auto bg-brand-darker canvas-scroll-container ${canPanWithPointerDrag ? "canvas-hand-tool" : ""} ${canPanWithPointerDrag && isPanning ? "canvas-hand-panning" : ""} ${isPanelDragging ? "transition-none" : "transition-[left,right] duration-300 ease-out"}`}
                  style={{
                    top: `${TOP_PANEL_HEIGHT_PX}px`,
                    left: panelsReady && leftPanelOpen ? `${leftPanelWidth}px` : "0px",
                    right: panelsReady && rightPanelOpen ? `${rightPanelWidth}px` : "0px",
                    bottom: "0px",
                    cursor:
                      canPanWithPointerDrag
                        ? isPanning
                          ? "grabbing"
                          : "grab"
                        : "default",
                  }}
                  onMouseDown={handleMouseDown}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseUp}
                  onMouseMove={handleMouseMove}
                >
                  {initialJson === undefined && (
                    <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center text-brand-light/80">
                      Opening project...
                    </div>
                  )}
                  <div
                    className="flex items-start justify-start relative"
                    style={{
                      minWidth: `${INFINITE_CANVAS_WIDTH_VW}vw`,
                      minHeight: `${INFINITE_CANVAS_HEIGHT_VH}vh`,
                      padding: `${INFINITE_CANVAS_PADDING_PX}px`,
                      boxSizing: "border-box",
                      transformOrigin: "top left",
                      transform: `scale(${scale})`,
                      willChange: "transform",
                    }}
                  >
                    {initialJson === undefined ? null : (
                      <SafeFrame
                        data={validFrameData ?? EMPTY_FRAME_DATA}
                        onError={handleFrameError}
                        onFrameMounted={() => {
                          setFrameReady((prev) => (prev ? prev : true));
                        }}
                      />
                    )}
                  </div>
                </div>
                {/* Docked Panels */}
                {/* Right Panel Reopen Fallback */}
                {panelsReady && !rightPanelOpen && (
                  <button
                    type="button"
                    onClick={() => setRightPanelOpen(true)}
                    className="absolute top-14 right-4 z-[60] p-3 bg-brand-dark/75 backdrop-blur-lg rounded-3xl border border-white/10 hover:bg-brand-medium/40 transition-[opacity,transform] duration-300 ease-out cursor-pointer active:scale-110"
                    title="Show Configs panel"
                  >
                    <PanelRight className="w-5 h-5 text-brand-light" />
                  </button>
                )}
                {/* Left Panel */}
                {panelsReady && (
                  <div
                    className="absolute top-12 left-0 z-50 h-[calc(100vh-3rem)] flex items-start pointer-events-none"
                  >
                    <div
                      className="h-full flex items-start pointer-events-auto relative"
                    >
                      <div
                        onMouseDown={(event) => startPanelDrag("left", event)}
                        className={`absolute top-0 -right-2 h-full w-4 cursor-ew-resize ${leftPanelOpen ? "pointer-events-auto" : "pointer-events-none"}`}
                        data-no-panel-drag="true"
                        aria-hidden
                      />
                      {leftPanelOpen && (
                        <div className="absolute top-0 right-0 h-full w-px bg-white/10 pointer-events-none" aria-hidden />
                      )}
                      <div
                        className={`h-full origin-left ${isPanelDragging ? "transition-none" : "transition-[transform,opacity,width] duration-300 ease-out"} will-change-transform ${leftPanelOpen
                          ? "translate-x-0 opacity-100 pointer-events-auto"
                          : "-translate-x-full opacity-0 pointer-events-none"
                          }`}
                      >
                        <LeftPanel
                          width={leftPanelWidth}
                          frameReady={frameReady}
                          onToggle={() => setLeftPanelOpen(false)}
                        />
                      </div>
                      <button
                        onClick={() => setLeftPanelOpen((open) => !open)}
                        className={`absolute left-4 top-2 p-3 bg-brand-dark/75 backdrop-blur-lg rounded-3xl border border-white/10 hover:bg-brand-medium/40 transition-[opacity,transform] duration-300 ease-out cursor-pointer active:scale-110 ${leftPanelOpen ? "opacity-0 pointer-events-none scale-95" : "opacity-100 pointer-events-auto scale-100"
                          }`}
                        title={leftPanelOpen ? "Hide left panel" : "Show left panel"}
                      >
                        <PanelLeft className="w-5 h-5 text-brand-light" />
                      </button>
                    </div>
                  </div>
                )}
                {/* Right Panel */}
                {panelsReady && (
                  <div
                    className="absolute top-12 right-0 z-50 h-[calc(100vh-3rem)] flex items-start pointer-events-none"
                  >
                    <div
                      className="h-full flex items-start justify-end pointer-events-auto relative"
                    >
                      <div
                        onMouseDown={(event) => startPanelDrag("right", event)}
                        className={`absolute top-0 -left-2 h-full w-4 cursor-ew-resize ${rightPanelOpen ? "pointer-events-auto" : "pointer-events-none"}`}
                        data-no-panel-drag="true"
                        aria-hidden
                      />
                      {rightPanelOpen && (
                        <div className="absolute top-0 left-0 h-full w-px bg-white/10 pointer-events-none" aria-hidden />
                      )}
                      <div
                        className={`h-full origin-right ${isPanelDragging ? "transition-none" : "transition-[transform,opacity,width] duration-300 ease-out"} will-change-transform ${rightPanelOpen
                          ? 'translate-x-0 opacity-100 pointer-events-auto'
                          : 'translate-x-full opacity-0 pointer-events-none'
                          }`}
                      >
                        <RightPanel
                          projectId={projectId}
                          width={rightPanelWidth}
                          activeTab={rightPanelTab}
                          setActiveTab={setRightPanelTab}
                          frameReady={frameReady}
                          onClose={() => setRightPanelOpen(false)}
                        />
                      </div>
                    </div>
                  </div>
                )}
                {/* Bottom Panel: Move, Hand, Zoom fit & 100% */}
                {panelsReady && (
                  <BottomPanel
                    activeTool={activeTool}
                    onToolChange={handleToolChange}
                    showHints={true}
                    saveStatus={saveStatus}
                    saveError={saveError}
                    onResetData={handleDeleteData}
                    onZoomFit={handleFitToCanvas}
                    scale={scale}
                    onScaleChange={handleScaleChange}
                  />
                )}
                {/* Floating Mobile Preview */}
                {panelsReady && (
                  <FloatingMobilePreview
                    isOpen={showDualView}
                    onClose={() => setShowDualView(false)}
                  />
                )}
              </InlineTextEditProvider>
            </TransformModeProvider>
          </CanvasToolProvider>
        </PrototypeTabProvider>
      </Editor>
    </div>
  );
};
