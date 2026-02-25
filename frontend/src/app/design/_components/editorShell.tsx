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
import { CanvasToolProvider } from "./CanvasToolContext";
import { Container } from "../_designComponents/Container/Container";
import { Text } from "../_designComponents/Text/Text";
import { Page } from "../_designComponents/Page/Page";
import { Viewport } from "../_designComponents/Viewport/Viewport";
import { Section } from "../_designComponents/Section/Section";
import { Button } from "../_designComponents/Button/Button";
import { RenderNode } from "./RenderNode";
import { KeyboardShortcuts } from "./KeyboardShortcuts";
import { CanvasSelectionHandler } from "./CanvasSelectionHandler";
import { FigmaStyleDragHandler } from "./FigmaStyleDragHandler";
import { BoxSelectionHandler } from "./BoxSelectionHandler";
import { TransformModeProvider } from "./TransformModeContext";
import { InlineTextEditProvider } from "./InlineTextEditContext";
import { DoubleClickTransformHandler } from "./DoubleClickTransformHandler";
import { CanvasContextMenu } from "./CanvasContextMenu";
import { PrototypeTabProvider } from "./PrototypeTabContext";
import { PrototypeFlowLines } from "./PrototypeFlowLines";
import { NewPageDropPlacementHandler } from "./NewPageDropPlacementHandler";
import type { TabId } from "./rightPanel";
import { autoSavePage, getDraft, deleteDraft } from "../_lib/pageApi";
import { serializeCraftToClean, deserializeCleanToCraft } from "../_lib/serializer";
import { useAlert } from "@/app/m_dashboard/components/context/alert-context";
import { Circle } from "../../_assets/shapes/circle/circle";
import { Square } from "../../_assets/shapes/square/square";
import { Triangle } from "../../_assets/shapes/triangle/triangle";
import { CRAFT_RESOLVER } from "./craftResolver";

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
      return (
        <Frame>
          <Element is={Viewport} canvas>
            <Element is={Page} canvas>
              <Element is={Container} padding={40} background="#ffffff" canvas>
              </Element>
            </Element>
          </Element>
        </Frame>
      );
    }

    return this.props.children;
  }
}

const STORAGE_KEY_PREFIX = "craftjs_preview_json";

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
    props: { pageName: "Page 1", pageSlug: "page-0" },
    displayName: "Page",
    custom: {},
    parent: "ROOT",
    hidden: false,
    nodes: ["container-1"],
    linkedNodes: {},
  },
  "container-1": {
    type: { resolvedName: "Container" },
    isCanvas: true,
    props: { padding: 40, background: "#ffffff" },
    displayName: "Container",
    custom: {},
    parent: "page-1",
    hidden: false,
    nodes: [],
    linkedNodes: {},
  },
});
function getStorageKey(projectId: string) {
  return `${STORAGE_KEY_PREFIX}_${projectId}`;
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

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

type EditorShellProps = {
  projectId: string;
  pageId?: string | null;
};

const MIN_SCALE = 0.01;
const MAX_SCALE = 3;
const ZOOM_SENSITIVITY = 0.003;
const INFINITE_CANVAS_WIDTH_VW = 2000;
const INFINITE_CANVAS_HEIGHT_VH = 2000;
const INFINITE_CANVAS_PADDING_PX = 6000;

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
 * Deep validation function that walks through the entire Craft.js node tree
 * and ensures all node references are valid.
 */
function validateCraftData(jsonString: string): { valid: boolean; data?: string } {
  try {
    const parsed = JSON.parse(jsonString);
    
    console.log('🔍 Validation: Starting with', Object.keys(parsed).length, 'nodes');
    
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
        console.warn(`⚠️ Node ${id} is not an object:`, typeof node);
        invalidNodes.push(id);
        return false;
      }
      
      // Must have type property
      if (!node.type) {
        console.warn(`⚠️ Node ${id} is missing 'type' property`);
        invalidNodes.push(id);
        return false;
      }
      
      // type must have resolvedName
      if (!node.type.resolvedName) {
        console.warn(`⚠️ Node ${id} type is missing 'resolvedName' property`);
        invalidNodes.push(id);
        return false;
      }

      // Must have nodes array (even if empty)
      if (!Array.isArray(node.nodes)) {
        console.warn(`⚠️ Node ${id} is missing 'nodes' array`);
        // Try to fix it
        node.nodes = [];
      }

      return true;
    }));

    if (invalidNodes.length > 0) {
      console.warn(`⚠️ Found ${invalidNodes.length} invalid nodes:`, invalidNodes);
    }

    console.log(`🔍 Validation: Found ${validNodeIds.size} valid nodes out of ${allNodeIds.length} total`);

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
            console.warn(`⚠️ Removing invalid reference: ${nodeId} -> ${childId}`);
            hasInvalidRefs = true;
            removedRefsCount++;
            return false;
          }
          return true;
        });
        
        if (node.nodes.length !== originalLength) {
          console.log(`🔧 Cleaned ${nodeId}: ${originalLength} -> ${node.nodes.length} children`);
        }

        // Recursively clean children
        node.nodes.forEach((childId: string) => cleanNodeRefs(childId, visited));
      }

      // Clean linkedNodes if present
      if (node.linkedNodes && typeof node.linkedNodes === 'object') {
        for (const [key, linkedId] of Object.entries(node.linkedNodes)) {
          if (typeof linkedId === 'string' && !validNodeIds.has(linkedId)) {
            console.warn(`⚠️ Removing invalid linkedNode: ${nodeId}.${key} -> ${linkedId}`);
            delete node.linkedNodes[key];
            hasInvalidRefs = true;
            removedRefsCount++;
          }
        }
      }
    }

    // Start validation from ROOT
    cleanNodeRefs('ROOT');

    if (hasInvalidRefs) {
      console.log(`🔧 Data cleaned - removed ${removedRefsCount} invalid references`);
    }

    // Remove invalid nodes from the parsed object
    invalidNodes.forEach(id => {
      delete parsed[id];
    });

    const finalJson = JSON.stringify(parsed);
    console.log(`✅ Validation complete. Final data has ${Object.keys(parsed).length} nodes`);
    
    return { valid: true, data: finalJson };
  } catch (error) {
    console.error('❌ Validation error:', error);
    return { valid: false };
  }
}

/**
 * Renders Frame only after the first commit (via useEffect), so Craft's store updates
 * happen in a separate commit and don't trigger "Cannot update Ee while rendering De".
 */
const DeferredFrame = ({ data, onMounted }: { data: string; onMounted?: () => void }) => {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
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

  useEffect(() => {
    setFrameDataToShow(null);
    setIsReady(false);
    setCanRenderFrame(false);
    mountedSignalSentRef.current = false;

    // Reset error state when data changes
    setHasErrorBoundaryError(false);

    // Validate and prepare data for rendering
    if (data) {
      console.log('🔍 SafeFrame: Validating data before render...');
      const validation = validateCraftData(data);

      if (validation.valid && validation.data) {
        console.log('✅ SafeFrame: Data is valid, preparing to render');
        setRenderData(validation.data);
      } else {
        console.error('❌ SafeFrame: Data validation failed, using empty canvas');
        setRenderData(null);
        onError?.();
      }
    } else {
      setRenderData(null);
    }

    // Use a small delay to ensure validation completes
    const id = requestAnimationFrame(() => setIsReady(true));
    return () => cancelAnimationFrame(id);
  }, [data, onError]);

  // Defer Frame render to next tick so Craft.js store updates don't run during this component's render
  // (avoids "Cannot update a component while rendering a different component").
  useEffect(() => {
    if (!isReady) return;
    const id = requestAnimationFrame(() => setCanRenderFrame(true));
    return () => cancelAnimationFrame(id);
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

/** Editor Shell */
export const EditorShell = ({ projectId, pageId: initialPageId }: EditorShellProps) => {
  const { showAlert, showConfirm } = useAlert();
  const [currentPageId, setCurrentPageId] = useState<string | null>(initialPageId ?? null);
  const [pages, setPages] = useState<Array<{ id: string; name: string }>>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const zoomAnchorRef = useRef<{
    x: number;
    y: number;
    prevScale: number;
    nextScale: number;
  } | null>(null);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const errorCleanupDoneRef = useRef(false); // Track if we've already cleaned up
  const [isPanning, setIsPanning] = useState(false);
  const [scale, setScale] = useState(1);
  const [initialJson, setInitialJson] = useState<string | null | undefined>(undefined);
  const [panelsReady, setPanelsReady] = useState(false);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [saveError, setSaveError] = useState<string | null>(null);
  const [leftPanelOpen, setLeftPanelOpen] = useState(false);
  const [rightPanelOpen, setRightPanelOpen] = useState(true);
  const [rightPanelTab, setRightPanelTab] = useState<TabId>("design");
  const [canvasWidth, setCanvasWidth] = useState(1440);
  const [canvasHeight, setCanvasHeight] = useState(900);
  const [canvasRotation, setCanvasRotation] = useState(0);
  const [activeTool, setActiveTool] = useState<CanvasTool>("move");
  const [frameReady, setFrameReady] = useState(false);
  const [showDualView, setShowDualView] = useState(false);
  const [suppressDropIndicator, setSuppressDropIndicator] = useState(false);
  const [dropIndicatorPulse, setDropIndicatorPulse] = useState(false);
  const hasInitialCenteringRef = useRef(false);
  const infiniteCanvasWidthVw = INFINITE_CANVAS_WIDTH_VW;
  const infiniteCanvasHeightVh = INFINITE_CANVAS_HEIGHT_VH;
  const infiniteCanvasPaddingPx = INFINITE_CANVAS_PADDING_PX;
  // Cleanup corrupted data when error boundary triggers
  const handleFrameError = useCallback(async () => {
    if (errorCleanupDoneRef.current) return;
    errorCleanupDoneRef.current = true;

    console.error('❌ Frame rendering failed. Cleaning up corrupted data...');
    
    // Clear from localStorage
    const storageKey = getStorageKey(projectId);
    localStorage.removeItem(storageKey);
    
    // Clear from database
    if (projectId) {
      try {
        await deleteDraft(projectId);
        console.log('✅ Corrupted data cleared from database');
      } catch (error) {
        console.error('Failed to clear corrupted data:', error);
      }
    }

    // Reset to empty canvas
    setInitialJson(null);
  }, [projectId]);

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
        if (pageTabs.length > 0 && !currentPageId) {
          setCurrentPageId(pageTabs[0].id);
        }
      }
    } catch {
      // Silently fail for non-multipage documents
    }
  }, [currentPageId]);

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
      localStorage.setItem(storageKey, updated);
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
      localStorage.setItem(storageKey, updated);
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
        localStorage.setItem(storageKey, updated);
        loadPages(updated);
        setInitialJson(updated);
      }
    } catch (error) {
      console.error("Failed to rename page:", error);
      showAlert("Failed to rename page", "error");
    }
  }, [initialJson, projectId, loadPages, showAlert]);

  // Handle Zoom (zoom-to-cursor)
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      if (!(e.ctrlKey || e.metaKey)) return;

      const container = containerRef.current;
      if (!container) return;

      const rect = container.getBoundingClientRect();
      const isInsideCanvas =
        e.clientX >= rect.left &&
        e.clientX <= rect.right &&
        e.clientY >= rect.top &&
        e.clientY <= rect.bottom;

      if (!isInsideCanvas) return;

      if (e.cancelable) {
        e.preventDefault();
      }
      e.stopPropagation();

      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      setScale((prevScale) => {
        const step = -e.deltaY * ZOOM_SENSITIVITY * Math.max(prevScale, MIN_SCALE);
        const newScale = Math.min(MAX_SCALE, Math.max(prevScale + step, MIN_SCALE));
        if (newScale !== prevScale) {
          zoomAnchorRef.current = { x, y, prevScale, nextScale: newScale };
        }
        return newScale;
      });
    };

    window.addEventListener("wheel", handleWheel, { passive: false, capture: true });

    return () => {
      window.removeEventListener("wheel", handleWheel, { capture: true });
    };
  }, []);

  // Adjust scroll position after zoom to keep cursor point stationary
  useLayoutEffect(() => {
    const anchor = zoomAnchorRef.current;
    const container = containerRef.current;
    if (!anchor || !container) return;

    const { x, y, prevScale, nextScale } = anchor;
    const contentX = (container.scrollLeft + x) / prevScale;
    const contentY = (container.scrollTop + y) / prevScale;

    container.scrollLeft = contentX * nextScale - x;
    container.scrollTop = contentY * nextScale - y;

    zoomAnchorRef.current = null;
  }, [scale]);

  // Center canvas after frame is ready so panning has room on both sides
  useEffect(() => {
    if (!frameReady || hasInitialCenteringRef.current) return;
    const container = containerRef.current;
    if (!container) return;

    const centerCanvas = () => {
      const x = (container.scrollWidth - container.clientWidth) / 2;
      const y = (container.scrollHeight - container.clientHeight) / 2;
      container.scrollLeft = x;
      container.scrollTop = y;
      hasInitialCenteringRef.current = true;
    };

    const id = requestAnimationFrame(centerCanvas);
    return () => cancelAnimationFrame(id);
  }, [frameReady]);

  // Handle canvas rotation
  const handleRotateCanvas = useCallback(() => {
    setCanvasRotation((prev) => (prev + 90) % 360);
  }, []);

  // Handle fit to canvas
  const handleFitToCanvas = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    // Reset zoom to fit content
    const contentWidth = canvasWidth;
    const contentHeight = canvasHeight;
    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;

    const scaleX = (containerWidth * 0.9) / contentWidth;
    const scaleY = (containerHeight * 0.9) / contentHeight;
    const newScale = Math.min(scaleX, scaleY, 1);

    setScale(Math.max(newScale, MIN_SCALE));

    // Center the canvas
    setTimeout(() => {
      if (container) {
        const x = (container.scrollWidth - container.clientWidth) / 2;
        const y = (container.scrollHeight - container.clientHeight) / 2;
        container.scrollLeft = x;
        container.scrollTop = y;
      }
    }, 100);
  }, [canvasWidth, canvasHeight]);

  const handleScaleChange = useCallback((nextScale: number) => {
    const clampedScale = Math.min(MAX_SCALE, Math.max(nextScale, MIN_SCALE));

    setScale((prevScale) => {
      if (prevScale === clampedScale) return prevScale;

      const container = containerRef.current;
      if (container) {
        zoomAnchorRef.current = {
          x: container.clientWidth / 2,
          y: container.clientHeight / 2,
          prevScale,
          nextScale: clampedScale,
        };
      }

      return clampedScale;
    });
  }, []);

  // Handle device preset selection - only width changes; preserve page height so it doesn't reset
  const handleDevicePresetSelect = useCallback((preset: DevicePreset) => {
    setCanvasWidth(preset.width);
    // Do not set canvasHeight so existing page height is preserved when switching device sizes
    setTimeout(() => {
      handleFitToCanvas();
    }, 100);
  }, [handleFitToCanvas]);

  // Handle add button (open left panel)
  const handleAddButton = useCallback(() => {
    setLeftPanelOpen(true);
  }, []);

  const handleMouseDown = (e: React.MouseEvent) => {
    // Only Hand tool can pan canvas
    if (activeTool === "hand") {
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
      containerRef.current.scrollLeft -= e.movementX;
      containerRef.current.scrollTop -= e.movementY;
    }
  };

  useEffect(() => {
    const handleToolShortcut = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey || event.altKey) return;
      if (isEditableTarget(event.target)) return;

      const key = event.key.toLowerCase();

      if (key === "h") {
        event.preventDefault();
        setActiveTool("hand");
        return;
      }

      if (key === "g") {
        event.preventDefault();
        setActiveTool("move");
      }
    };

    window.addEventListener("keydown", handleToolShortcut);
    return () => window.removeEventListener("keydown", handleToolShortcut);
  }, []);

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

  // Restore saved editor state from database on mount
  useEffect(() => {
    if (!projectId) {
      setInitialJson(null);
      isReadyRef.current = true;
      return;
    }

    async function loadDraft() {
      try {
        console.log('📥 loadDraft starting...', projectId);

        // Try sessionStorage per-project (no localStorage — auth/drafts in cookies or session only)
        const storageKey = getStorageKey(projectId);
        const sessionSaved = safeSessionGet(storageKey);

        // Try to load from database
        console.log('📡 Calling getDraft()...');
        const result = await getDraft(projectId);
        console.log('📡 getDraft result:', result);

        let contentToLoad: string | null = null;

        const normalizeToCraftJson = (input: unknown): string | null => {
          try {
            if (input == null) return null;

            let content: string;

            if (typeof input === "string") {
              content = input;
            } else if (
              typeof input === "object" &&
              (input as { version?: unknown; pages?: unknown; nodes?: unknown }).version !== undefined &&
              Array.isArray((input as { pages?: unknown[] }).pages) &&
              typeof (input as { nodes?: unknown }).nodes === "object"
            ) {
              content = deserializeCleanToCraft(input as Parameters<typeof deserializeCleanToCraft>[0]);
            } else {
              content = JSON.stringify(input);
            }

            const parsedMaybeClean = JSON.parse(content);
            if (
              parsedMaybeClean &&
              parsedMaybeClean.version !== undefined &&
              Array.isArray(parsedMaybeClean.pages) &&
              parsedMaybeClean.nodes &&
              typeof parsedMaybeClean.nodes === "object"
            ) {
              content = deserializeCleanToCraft(parsedMaybeClean);
            }

            const parsedCraft = JSON.parse(content);
            if (parsedCraft && parsedCraft.ROOT && Array.isArray(parsedCraft.ROOT.nodes)) {
              return content;
            }

            return null;
          } catch {
            return null;
          }
        };

        // 1. Check sessionStorage first to preserve latest unsaved/preview snapshot
        if (sessionSaved) {
          const normalized = normalizeToCraftJson(sessionSaved);
          if (normalized) {
            console.log('✅ Loaded valid draft from session (this project)');
            contentToLoad = normalized;
            if (normalized !== sessionSaved) {
              safeSessionSet(storageKey, normalized);
            }
          } else {
            console.warn('⚠️ Invalid draft structure in session. Clearing session cache for this project.');
            safeSessionRemove(storageKey);
          }
        }

        // 2. Check Database (fallback)
        if (!contentToLoad && result.success && result.data && result.data.content) {
          const normalized = normalizeToCraftJson(result.data.content);
          if (normalized) {
            try {
              const parsed = JSON.parse(normalized);
              console.log(`✅ Loaded valid draft from DB (${Object.keys(parsed).length} internal nodes)`);
            } catch {
              console.log('✅ Loaded valid draft from DB');
            }
            contentToLoad = normalized;
            safeSessionSet(storageKey, normalized);
          } else {
            console.warn('⚠️ Invalid draft structure in DB. Clearing invalid draft...');
            await deleteDraft(projectId);
          }
        }

        // 3. Legacy: check unprefixed key (e.g. template loaded before navigation)
        if (!contentToLoad && storageKey !== STORAGE_KEY_PREFIX) {
          const legacySaved = safeSessionGet(STORAGE_KEY_PREFIX);
          if (legacySaved) {
            const normalized = normalizeToCraftJson(legacySaved);
            if (normalized) {
              console.log('✅ Loaded valid draft from legacy session key, syncing to project key');
              contentToLoad = normalized;
              safeSessionSet(storageKey, normalized);
              safeSessionRemove(STORAGE_KEY_PREFIX);
            } else {
              safeSessionRemove(STORAGE_KEY_PREFIX);
            }
          }
        }

        if (!contentToLoad) {
          console.log('⚠️ No saved data found, expecting default');
        }

        setInitialJson(contentToLoad);
        if (contentToLoad) {
          loadPages(contentToLoad);
        }

        // IMPORTANT: Mark as ready immediately via Ref to avoid stale closures
        // passing "undefined" to handleNodesChange
        isReadyRef.current = true;
        console.log('✅ Editor marked as READY via Ref');

      } catch (error) {
        console.error('❌ loadDraft Unexpected Error:', error);
        setInitialJson(null);
        isReadyRef.current = true; // Allow editing even if load failed
      }
    }

    loadDraft();
  }, [projectId, loadPages]);

  // Defer panel rendering to avoid React setState-during-render warning
  useEffect(() => {
    if (initialJson === undefined) return;
    const id = requestAnimationFrame(() => setPanelsReady(true));
    return () => cancelAnimationFrame(id);
  }, [initialJson]);

  // Hide Craft drop indicator only when dragging the special New Page source item
  useEffect(() => {
    const handleMouseDown = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      const isNewPageSource = !!target?.closest("[data-component-new-page='true']");
      if (isNewPageSource) {
        setSuppressDropIndicator(true);
      }
    };

    const clearSuppression = () => {
      setSuppressDropIndicator(false);
    };

    document.addEventListener("mousedown", handleMouseDown, true);
    document.addEventListener("mouseup", clearSuppression, true);
    document.addEventListener("dragend", clearSuppression, true);

    return () => {
      document.removeEventListener("mousedown", handleMouseDown, true);
      document.removeEventListener("mouseup", clearSuppression, true);
      document.removeEventListener("dragend", clearSuppression, true);
    };
  }, []);

  // Animate green drop line while dragging (except when suppressed for New Page)
  useEffect(() => {
    const interval = window.setInterval(() => {
      const isDragging = document.body.dataset.editorDragging === "true";
      if (!isDragging || suppressDropIndicator) {
        setDropIndicatorPulse(false);
        return;
      }
      setDropIndicatorPulse((prev) => !prev);
    }, 180);

    return () => window.clearInterval(interval);
  }, [suppressDropIndicator]);

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

  // Auto-save editor state to database (debounced)
  const handleNodesChange = useCallback(
    (query: { serialize: () => string }) => {
      if (
        document.body.dataset.editorDragging === "true" ||
        document.body.dataset.editorDropCommit === "true"
      ) {
        if (saveTimerRef.current) {
          clearTimeout(saveTimerRef.current);
          saveTimerRef.current = null;
        }
        return;
      }

      // Check Ref instead of State to avoid stale closure
      if (!isReadyRef.current) {
        // console.log('🛑 Aborting save: Editor not yet ready');
        return;
      }

      // console.log('🖱️ handleNodesChange triggered! Saving...');

      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);

      // Defer state update to avoid 'Cannot update a component while rendering a different component'
      Promise.resolve().then(() => { setSaveStatus('saving'); setSaveError(null); });

      saveTimerRef.current = setTimeout(async () => {
        try {
          const next = query.serialize();
          const parsed = JSON.parse(next);
          if (!parsed?.ROOT) return;

          let cleanCode;
          try {
            cleanCode = serializeCraftToClean(next);
          } catch (serializeError) {
            console.warn('Auto-save: serializeCraftToClean failed, saving raw to session for preview:', serializeError);
            if (projectId && typeof window !== 'undefined' && window.sessionStorage) {
              const key = `${STORAGE_KEY_PREFIX}_${projectId}`;
              try {
                window.sessionStorage.setItem(key, next);
                window.sessionStorage.setItem(STORAGE_KEY_PREFIX, next);
              } catch (e) {
                // ignore quota
              }
            }
            setSaveStatus('error');
            setSaveError('Serialization failed');
            return;
          }

          const snapshot = JSON.stringify(cleanCode);

          // Always write to sessionStorage so Preview shows latest (even before DB save)
          if (projectId && typeof window !== 'undefined' && window.sessionStorage) {
            try {
              const key = `${STORAGE_KEY_PREFIX}_${projectId}`;
              window.sessionStorage.setItem(key, snapshot);
              window.sessionStorage.setItem(STORAGE_KEY_PREFIX, snapshot);
            } catch (e) {
              if (!isQuotaError(e)) console.warn('Auto-save: sessionStorage write failed', e);
            }
          }

          // Save CLEAN CODE to database (only when projectId is set)
          if (projectId) {
            const result = await autoSavePage(snapshot, projectId);

            if (result.success) {
              setSaveStatus('saved');
              setSaveError(null);
              setTimeout(() => setSaveStatus('idle'), 2000);
            } else {
              console.warn('Auto-save warning:', result.error);
              setSaveStatus('error');
              setSaveError(result.error || 'Save failed');
            }
          }
        } catch (error) {
          console.error('Auto-save error:', error);
          setSaveStatus('error');
          setSaveError(error instanceof Error ? error.message : 'Network or serialization error');
        }
      }, 1500); // Debounce 1.5s
    },
    [projectId]
  );

  // Clean up debounce timer on unmount
  useEffect(() => {
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, []);

  /** Only pass to Frame if data is valid Craft format and every node type exists in resolver */
  const resolverRef = useRef<Record<string, React.ComponentType>>({});

  const resolver: Record<string, React.ComponentType> = React.useMemo(() => {
    const FrameForResolver: React.ComponentType =
      (typeof FrameComponentFromFile === "function" ? FrameComponentFromFile : null) ??
      (typeof RenderBlocks?.Frame === "function" ? RenderBlocks.Frame : null) ??
      CRAFT_RESOLVER.Frame ??
      Container;

    const base: Record<string, any> = {
      ...RenderBlocks,
      ...CRAFT_RESOLVER,
      Text: Text || Container,
      text: Text || Container,
      Circle: Circle || Container,
      Square: Square || Container,
      Triangle: Triangle || Container,
      circle: Circle || Container,
      square: Square || Container,
      triangle: Triangle || Container,
    };
    // Force Frame to always exist; Craft looks up by "Frame" and sometimes "frame"
    base.Frame = FrameForResolver;
    base.frame = FrameForResolver;
    // Ensure Page and Viewport always in resolver (serialized drafts reference these by type)
    base.Page = CRAFT_RESOLVER.Page ?? Page;
    base.page = CRAFT_RESOLVER.Page ?? Page;
    base.Viewport = CRAFT_RESOLVER.Viewport ?? Viewport;
    base.viewport = CRAFT_RESOLVER.Viewport ?? Viewport;
    return base;
  }, []);

  resolverRef.current = resolver;
  const validFrameData = React.useMemo(() => {
    if (initialJson === undefined || initialJson === null || initialJson === "") return null;
    try {
      const parsed = typeof initialJson === "string" ? JSON.parse(initialJson) : initialJson;
      if (!parsed || typeof parsed !== "object" || !parsed.ROOT || !Array.isArray(parsed.ROOT?.nodes)) return null;
      const resolverKeys = Object.keys(resolverRef.current);
      const keys = new Set(resolverKeys);

      const canonicalByLower = new Map<string, string>();
      for (const key of resolverKeys) {
        canonicalByLower.set(key.toLowerCase(), key);
      }

      const allIds = new Set(Object.keys(parsed));
      const CANVAS_TYPES = new Set(["Frame", "Container", "Section", "Row", "Column", "Page", "Viewport", "Button"]);

      for (const id of Object.keys(parsed)) {
        const node = parsed[id] as Record<string, unknown> | null;
        if (!node || typeof node !== "object") continue;
        const t = node.type;
        const rawName = ((typeof t === "string" ? t : (t as { resolvedName?: string })?.resolvedName) ?? "").toString().trim();
        if (!rawName) return null;

        if (!keys.has(rawName)) {
          const normalized = canonicalByLower.get(rawName.toLowerCase());
          if (normalized) {
            node.type = { resolvedName: normalized };
            node.displayName = normalized;
          } else {
            node.type = { resolvedName: "Container" };
            node.displayName = "Container";
          }
        }

        if (CANVAS_TYPES.has(rawName)) {
          node.isCanvas = true;
          if (typeof node.data === "object" && node.data !== null) {
            (node.data as Record<string, unknown>).isCanvas = true;
          }
        }

        const childIds = Array.isArray(node.nodes) ? node.nodes : [];
        const validChildIds = childIds.filter((cid: string) => allIds.has(cid));
        node.nodes = validChildIds;
      }
      return JSON.stringify(parsed);
    } catch {
      return null;
    }
  }, [initialJson]);

  // Debug: list resolver keys after mount (must run in useEffect to avoid setState-during-render)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const t = setTimeout(() => {
      try {
        const res = resolverRef.current;
        // eslint-disable-next-line no-console
        console.log("[EditorShell] resolver keys:", Object.keys(res));
        if (initialJson) {
          const parsed = typeof initialJson === "string" ? JSON.parse(initialJson) : initialJson;
          const nodeTypes = new Set<string>();
          if (parsed && parsed.nodes) {
            Object.values(parsed.nodes as Record<string, unknown>).forEach((n: unknown) => {
              try {
                const node = n as { data?: { displayName?: string; name?: string; type?: string | { name?: string } } };
                const display = node?.data?.displayName ?? node?.data?.name ?? (typeof node?.data?.type === "string" ? node.data.type : node?.data?.type?.name);
                if (display) nodeTypes.add(display);
              } catch {
                // ignore
              }
            });
          }
          const resolverKeys = Object.keys(res);
          const missing = [...nodeTypes].filter((typeName) => !resolverKeys.includes(typeName) && !resolverKeys.includes((typeName || "").replace(/\s+/g, "")));
          // eslint-disable-next-line no-console
          console.log("[EditorShell] Serialized node types:", [...nodeTypes]);
          // eslint-disable-next-line no-console
          console.log("[EditorShell] Missing resolver types:", missing);
        }
      } catch (err) {
        // eslint-disable-next-line no-console
        console.warn("[EditorShell] failed to parse initialJson for debug", err);
      }
    }, 50);
    return () => clearTimeout(t);
  }, [initialJson]);

  return (
    <div className="h-screen bg-brand-black text-brand-lighter overflow-hidden font-sans relative">
      <Editor
        resolver={resolver}
        indicator={{
          success: suppressDropIndicator ? "transparent" : (dropIndicatorPulse ? "#4ade80" : "#22c55e"),
          error: "#ef4444",
          thickness: suppressDropIndicator ? 0 : (dropIndicatorPulse ? 4 : 2),
          transition: "all 140ms ease-out",
        }}
        onRender={RenderNode}
        onNodesChange={(query) => requestAnimationFrame(() => handleNodesChange(query))}
      >
        <PrototypeTabProvider isActive={rightPanelTab === "prototype"}>
        <CanvasToolProvider value={activeTool}>
        <TransformModeProvider>
        <InlineTextEditProvider>
          <KeyboardShortcuts />
          <CanvasSelectionHandler />
          <CanvasContextMenu />
          <FigmaStyleDragHandler />
          <NewPageDropPlacementHandler />
          <BoxSelectionHandler />
          <DoubleClickTransformHandler />
          <PrototypeFlowLines />
          {/* Top Panel */}
          {panelsReady && (
            <TopPanel
              scale={scale}
              onScaleChange={handleScaleChange}
              onRotateCanvas={handleRotateCanvas}
              onFitToCanvas={handleFitToCanvas}
              onAddButton={handleAddButton}
              canvasWidth={canvasWidth}
              canvasHeight={canvasHeight}
              onDevicePresetSelect={handleDevicePresetSelect}
              showDualView={showDualView}
              onDualViewToggle={() => setShowDualView((v) => !v)}
            />
          )}
          {/* Canvas Area (Background) — when dual view: leave room for phone preview on the right */}
        <div
          ref={containerRef}
          data-canvas-container
          className={`absolute inset-0 overflow-auto bg-brand-darker canvas-scroll-container ${activeTool === "hand" ? "canvas-hand-tool" : ""} ${activeTool === "hand" && isPanning ? "canvas-hand-panning" : ""}`}
          style={{
            cursor:
              activeTool === "hand"
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
          {/* Inner Content - Infinite Canvas */}
          <div
            className="flex items-center justify-center"
            style={{
              minWidth: `${infiniteCanvasWidthVw}vw`,
              minHeight: `${infiniteCanvasHeightVh}vh`,
              padding: `${infiniteCanvasPaddingPx}px`,
              transformOrigin: "top left",
              transform:
                canvasRotation !== 0
                  ? `scale(${scale}) rotate(${canvasRotation}deg)`
                  : `scale(${scale})`,
            }}
          >
            {initialJson === undefined ? null : (
              <SafeFrame
                data={validFrameData ?? initialJson}
                onError={handleFrameError}
                onFrameMounted={() => {
                  setFrameReady((prev) => (prev ? prev : true));
                }}
              />
            )}
          </div>
        </div>
        {/* Floating Panels */}
        {/* Left Panel */}
        {panelsReady && (
          <div>
            {/* Left Panel */}
            <div className="absolute top-14 left-4 z-50 h-[calc(100vh-3.5rem)] w-80 flex items-start pointer-events-none">
              <div
                className="h-full w-80 flex items-start pointer-events-auto"
              >
                <div className="h-full w-80 overflow-hidden shrink-0 pointer-events-none">
                  <div
                    className={`h-full w-80 origin-left transition-[transform,opacity] duration-300 ease-out will-change-transform ${
                      leftPanelOpen
                        ? 'translate-x-0 scale-100 opacity-100 pointer-events-auto'
                        : '-translate-x-full scale-90 opacity-0 pointer-events-none'
                    }`}
                  >
                    <LeftPanel onToggle={() => setLeftPanelOpen(false)} frameReady={frameReady} />
                  </div>
                </div>
                <button
                  onClick={() => setLeftPanelOpen((open) => !open)}
                  className={`absolute left-0 top-0 p-3 bg-brand-dark/75 backdrop-blur-lg rounded-3xl border border-white/10 hover:bg-brand-medium/40 transition-[opacity,transform] duration-300 ease-out cursor-pointer active:scale-110 ${
                    leftPanelOpen ? 'opacity-0 pointer-events-none scale-95' : 'opacity-100 pointer-events-auto scale-100'
                  }`}
                  title={leftPanelOpen ? "Hide left panel" : "Show left panel"}
                >
                  <PanelLeft className="w-5 h-5 text-brand-light" />
                </button>
              </div>
            </div>
          </div>
        )}
        {/* Right Panel */}
        {panelsReady && (
          <div className="absolute top-14 right-4 z-50 h-[calc(100vh-3.5rem)] flex items-start pointer-events-none">
            <div className="h-full flex items-start justify-end pointer-events-auto">
              <div
                className={`h-full origin-right transition-[transform,opacity] duration-300 ease-out will-change-transform ${
                  rightPanelOpen
                    ? 'translate-x-0 scale-100 opacity-100 pointer-events-auto'
                    : 'translate-x-full scale-90 opacity-0 pointer-events-none'
                }`}
              >
                <RightPanel
                  projectId={projectId}
                  activeTab={rightPanelTab}
                  setActiveTab={setRightPanelTab}
                  frameReady={frameReady}
                  onClose={() => setRightPanelOpen(false)}
                />
              </div>
              <button
                onClick={() => setRightPanelOpen((open) => !open)}
                className={`absolute right-0 top-0 p-3 bg-brand-dark/75 backdrop-blur-lg rounded-3xl border border-white/10 hover:bg-brand-medium/40 transition-[opacity,transform] duration-300 ease-out cursor-pointer active:scale-110 ${
                  rightPanelOpen ? 'opacity-0 pointer-events-none scale-95' : 'opacity-100 pointer-events-auto scale-100'
                }`}
                title={rightPanelOpen ? "Hide right panel" : "Show Configs panel"}
              >
                <PanelRight className="w-5 h-5 text-brand-light" />
              </button>
            </div>
          </div>
        )}
        {/* Bottom Panel: Move, Hand, Zoom fit & 100% */}
        {panelsReady && (
          <BottomPanel
            activeTool={activeTool}
            onToolChange={setActiveTool}
            showHints={true}
            saveStatus={saveStatus}
            saveError={saveError}
            onResetData={handleDeleteData}
            onZoomFit={handleFitToCanvas}
            scale={scale}
            onScaleChange={handleScaleChange}
          />
        )}
        {/* Canvas Controls Overlay: ito yung nasa baba :> */}
        <div data-panel="canvas-controls" className="absolute bottom-4 right-100 bg-brand-dark/80 backdrop-blur p-1 rounded-lg text-xs text-brand-lighter pointer-events-none z-50 border border-white/10">
          <div className="flex gap-4 items-center">
            <span>{Math.round(scale * 100)}%</span>
            <span>Hand Tool + Drag to Pan</span>
            <span>Ctrl + Scroll to Zoom</span>
            <span>Ctrl (Win) / ⌘ Cmd (Mac) + Click to multi-select</span>
            {/* Delete Button */}
            <button
              onClick={handleDeleteData}
              className="pointer-events-auto text-red-400 hover:text-red-300 transition-colors ml-2"
              title="Delete stored data and reset"
            >
              🗑️ Reset Data
            </button>
            {saveStatus !== 'idle' && (
              <span className={`${saveStatus === 'saving' ? 'text-yellow-400' :
                saveStatus === 'saved' ? 'text-green-400' :
                  'text-red-400'
                }`}>
                {saveStatus === 'saving' ? '💾 Saving...' :
                  saveStatus === 'saved' ? '✓ Saved' :
                    saveError ? `⚠ Save failed: ${saveError}` : '⚠ Save failed'}
              </span>
            )}
          </div>
        </div>
        </InlineTextEditProvider>
        </TransformModeProvider>
        </CanvasToolProvider>
        </PrototypeTabProvider>
      </Editor>
    </div>
  );
};
    