import * as React from "react";
import { useRef, useState, useEffect, useLayoutEffect, useCallback } from "react";
import { Editor, Frame, Element } from "@craftjs/core";
import { RenderBlocks } from "../_designComponents";
import { LeftPanel } from "./leftPanel";
import { RightPanel } from "./rightPanel";
import { Container } from "../_designComponents/Container/Container";
import { Text } from "../_designComponents/Text/Text";
import { Page } from "../_designComponents/Page/Page";
import { Viewport } from "../_designComponents/Viewport/Viewport";
import { Section } from "../_designComponents/Section/Section";
import { Button } from "../_designComponents/Button/Button";
import { RenderNode } from "./RenderNode";
import { KeyboardShortcuts } from "./KeyboardShortcuts";
import { autoSavePage, getDraft, deleteDraft } from "../_lib/pageApi";
import { serializeCraftToClean, deserializeCleanToCraft } from "../_lib/serializer";
import { useAlert } from "@/app/m_dashboard/components/context/alert-context";

const STORAGE_KEY_PREFIX = "craftjs_preview_json";
function getStorageKey(projectId: string) {
  return `${STORAGE_KEY_PREFIX}_${projectId}`;
}

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

type EditorShellProps = {
  projectId: string;
};

/** Editor Shell */
export const EditorShell = ({ projectId }: EditorShellProps) => {
  const { showAlert, showConfirm } = useAlert();
  const containerRef = useRef<HTMLDivElement>(null);
  const zoomAnchorRef = useRef<{
    x: number;
    y: number;
    prevScale: number;
    nextScale: number;
  } | null>(null);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isPanning, setIsPanning] = useState(false);
  const [isSpacePressed, setIsSpacePressed] = useState(false);
  const [scale, setScale] = useState(1);
  const [initialJson, setInitialJson] = useState<string | null | undefined>(undefined);
  const [panelsReady, setPanelsReady] = useState(false);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');

  /** Returns true if the event target is an input, textarea, select, or contenteditable */
  const isEditableTarget = (target: EventTarget | null) => {
    if (!target || !(target instanceof HTMLElement)) return false;
    const tag = target.tagName;
    return target.isContentEditable || tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";
  };

  // Handle Zoom (zoom-to-cursor)
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        e.stopPropagation();

        const zoomSensitivity = 0.001;
        const delta = -e.deltaY * zoomSensitivity;
        const rect = container.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        setScale((prevScale) => {
          const newScale = Math.min(Math.max(prevScale + delta, 0.3), 3);
          if (newScale !== prevScale) {
            zoomAnchorRef.current = { x, y, prevScale, nextScale: newScale };
          }
          return newScale;
        });
      }
    };

    container.addEventListener("wheel", handleWheel, { passive: false });

    return () => {
      container.removeEventListener("wheel", handleWheel);
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

  // Center canvas on mount
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const centerCanvas = () => {
      const x = (container.scrollWidth - container.clientWidth) / 2;
      const y = (container.scrollHeight - container.clientHeight) / 2;
      container.scrollLeft = x;
      container.scrollTop = y;
    };

    const id = requestAnimationFrame(centerCanvas);
    return () => cancelAnimationFrame(id);
  }, []);

  // Handle Panning Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        if (isEditableTarget(e.target)) return;
        // Prevent default spacebar scrolling behavior
        if (e.target === document.body) {
          e.preventDefault();
        }

        if (!isSpacePressed) {
          setIsSpacePressed(true);
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        setIsSpacePressed(false);
        setIsPanning(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [isSpacePressed]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (isSpacePressed || e.button === 1) { // Space or Middle Click
      setIsPanning(true);
      e.preventDefault();
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning && containerRef.current) {
      containerRef.current.scrollLeft -= e.movementX;
      containerRef.current.scrollTop -= e.movementY;
    }
  };

  // Track if editor is fully loaded to prevent stale closure issues
  const isReadyRef = useRef(false);

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

        // Try localStorage per-project so Start from Scratch gets blank canvas
        const storageKey = getStorageKey(projectId);
        const sessionSaved = localStorage.getItem(storageKey);

        // Try to load from database
        console.log('📡 Calling getDraft()...');
        const result = await getDraft(projectId);
        console.log('📡 getDraft result:', result);

        let contentToLoad: string | null = null;

        // 1. Check Database
        if (result.success && result.data && result.data.content) {
          try {
            let content = result.data.content;

            // If it's a BuilderDocument (clean format), we need to deserialize it
            if (content.version !== undefined && content.pages && content.nodes) {
              const nodesCount = Object.keys(content.nodes).length;
              console.log(`✨ Data is CLEAN format (version: ${content.version}), ${nodesCount} nodes found. Deserializing...`);
              content = deserializeCleanToCraft(content);
            } else if (typeof content === 'object') {
              console.log('ℹ️ Data is OBJECT format but not recognized as CLEAN. Stringifying...');
              content = JSON.stringify(content);
            }

            const parsed = JSON.parse(content);
            if (parsed && parsed.ROOT) {
              console.log(`✅ Loaded valid draft from DB (${Object.keys(parsed).length} internal nodes)`);
              contentToLoad = content;
              // Sync to localStorage (per-project)
              localStorage.setItem(storageKey, contentToLoad!);
            }
          } catch (e) {
            console.error('Failed to parse draft content:', e);
          }
        }

        // 2. Check LocalStorage (fallback for this project only)
        if (!contentToLoad && sessionSaved) {
          try {
            const parsed = JSON.parse(sessionSaved);
            if (parsed && parsed.ROOT) {
              console.log('✅ Loaded valid draft from localStorage (this project)');
              contentToLoad = sessionSaved;
            }
          } catch (e) {
            localStorage.removeItem(storageKey);
          }
        }

        if (!contentToLoad) {
          console.log('⚠️ No saved data found, expecting default');
        }

        setInitialJson(contentToLoad);

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
  }, [projectId]);

  // Defer panel rendering to avoid React setState-during-render warning
  useEffect(() => {
    if (initialJson === undefined) return;
    const id = requestAnimationFrame(() => setPanelsReady(true));
    return () => cancelAnimationFrame(id);
  }, [initialJson]);

  // Handle Delete Data
  const handleDeleteData = async () => {
    if (!projectId) return;
    const confirmed = await showConfirm("Are you sure you want to delete your progress? This cannot be undone.");
    if (!confirmed) return;

    console.log('🗑️ Deleting draft...');
    const result = await deleteDraft(projectId);

    if (result.success) {
      console.log('✅ Draft deleted');
      localStorage.removeItem(getStorageKey(projectId));
      location.reload(); // Reload to reset editorstate
    } else {
      showAlert('Failed to delete draft: ' + (result.error || 'Unknown error'));
    }
  };

  // Auto-save editor state to database (debounced)
  const handleNodesChange = useCallback(
    (query: { serialize: () => string }) => {
      // Check Ref instead of State to avoid stale closure
      if (!isReadyRef.current) {
        // console.log('🛑 Aborting save: Editor not yet ready');
        return;
      }

      // console.log('🖱️ handleNodesChange triggered! Saving...');

      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);

      // Defer state update to avoid 'Cannot update a component while rendering a different component'
      Promise.resolve().then(() => setSaveStatus('saving'));

      saveTimerRef.current = setTimeout(async () => {
        try {
          const next = query.serialize();
          const parsed = JSON.parse(next);
          if (!parsed?.ROOT) return;

          console.log('🔄 Serializing to CLEAN format...');
          const cleanCode = serializeCraftToClean(next);

          console.log('🔄 Auto-save executing (Clean Code)...');

          // Save to localStorage per-project so other projects stay untouched
          localStorage.setItem(getStorageKey(projectId), next);

          // Save CLEAN CODE to database (only when projectId is set)
          if (projectId) {
            const result = await autoSavePage(JSON.stringify(cleanCode), projectId);

            if (result.success) {
              setSaveStatus('saved');
              setTimeout(() => setSaveStatus('idle'), 2000);
            } else {
              console.warn('Auto-save warning:', result.error);
              setSaveStatus('error');
            }
          }
        } catch (error) {
          console.error('Auto-save error:', error);
          setSaveStatus('error');
        }
      }, 2000); // Debounce 2s
    },
    [projectId]
  );

  // Clean up debounce timer on unmount
  useEffect(() => {
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, []);

  const resolver = {
    ...RenderBlocks,
  } as any;

  // Debug: list resolver keys so we can confirm components are registered at runtime
  if (typeof window !== "undefined") {
    try {
      // Delay slightly so logs are clearer in console
      setTimeout(() => {
        // eslint-disable-next-line no-console
        console.log("[EditorShell] resolver keys:", Object.keys(resolver));

        // If there is saved initial JSON, attempt to parse and list component types used so we can identify missing resolver entries
        try {
          if (initialJson) {
            const parsed = typeof initialJson === 'string' ? JSON.parse(initialJson) : initialJson;
            const nodeTypes = new Set<string>();
            if (parsed && parsed.nodes) {
              Object.values(parsed.nodes as any).forEach((n: any) => {
                try {
                  const display = n?.data?.displayName || n?.data?.name || (n?.data?.type && (typeof n.data.type === 'string' ? n.data.type : n.data.type?.name));
                  if (display) nodeTypes.add(display);
                } catch (e) {
                  // ignore
                }
              });
            }
            const resolverKeys = Object.keys(resolver);
            const missing = [...nodeTypes].filter((t) => !resolverKeys.includes(t) && !resolverKeys.includes((t || '').replace(/\s+/g, '')));
            // eslint-disable-next-line no-console
            console.log('[EditorShell] Serialized node types:', [...nodeTypes]);
            // eslint-disable-next-line no-console
            console.log('[EditorShell] Missing resolver types:', missing);
          }
        } catch (err) {
          // eslint-disable-next-line no-console
          console.warn('[EditorShell] failed to parse initialJson for debug', err);
        }
      }, 50);
    } catch (e) {
      // ignore
    }
  }

  return (
    <div className="h-screen bg-brand-black text-brand-lighter overflow-hidden font-sans relative">
      <Editor
        resolver={resolver}
        onRender={RenderNode}
        onNodesChange={handleNodesChange}
      >
        <KeyboardShortcuts />
        {/* Canvas Area (Background) */}
        <div
          ref={containerRef}
          className="absolute inset-0 overflow-auto bg-brand-darker"
          style={{ cursor: isSpacePressed ? (isPanning ? 'grabbing' : 'grab') : 'default' }}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onMouseMove={handleMouseMove}
        >
          {/* Inner Content - Infinite Canvas */}
          <div
            className="min-w-[200vw] min-h-[200vh] flex items-center justify-center p-40"
            style={{ zoom: scale }}
          >
            {initialJson === undefined ? null : initialJson ? (
              <Frame data={initialJson} />
            ) : (
              <Frame>
                <Element is={Viewport} canvas>
                  {/* Single empty page as starting point */}
                  <Element is={Page} canvas>
                    <Element is={Container} padding={40} background="#ffffff" canvas>
                    </Element>
                  </Element>
                </Element>
              </Frame>
            )}
          </div>
        </div>
        {/* Floating Panels */}
        {/* Left Panel */}
        {panelsReady && (
          <div className="absolute top-4 left-4 z-50 h-[calc(100vh-2rem)] pointer-events-none">
            <div className="pointer-events-auto h-full">
              <LeftPanel />
            </div>
          </div>
        )}
        {/* Right Panel */}
        {panelsReady && (
          <div className="absolute top-4 right-4 z-50 h-[calc(100vh-2rem)] pointer-events-none">
            <div className="pointer-events-auto h-full">
              <RightPanel projectId={projectId} />
            </div>
          </div>
        )}
        {/* Canvas Controls Overlay: ito yung nasa baba :> */}
        <div className="absolute bottom-4 right-100 bg-brand-dark/80 backdrop-blur p-1 rounded-lg text-xs text-brand-lighter pointer-events-none z-50 border border-white/10">
          <div className="flex gap-4 items-center">
            <span>{Math.round(scale * 100)}%</span>
            <span>Space + Drag to Pan</span>
            <span>Ctrl + Scroll to Zoom</span>
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
                    '⚠ Save failed'}
              </span>
            )}
          </div>
        </div>
      </Editor>
    </div>
  );
};