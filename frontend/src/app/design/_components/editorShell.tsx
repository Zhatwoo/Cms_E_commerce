import React, { useRef, useState, useEffect, useLayoutEffect, useCallback } from "react";
import { Editor, Frame, Element } from "@craftjs/core";
import { RenderBlocks } from "../_assets";
import { LeftPanel } from "./leftPanel";
import { RightPanel } from "./rightPanel";
import { Container } from "../_assets/Container/Container";
import { Text } from "../_assets/Text/Text";
import { Page } from "../_assets/Page/Page";
import { Viewport } from "../_assets/Viewport/Viewport";
import { RenderNode } from "./RenderNode";
import { KeyboardShortcuts } from "./KeyboardShortcuts";

const STORAGE_KEY = "craftjs_preview_json";

/** Editor Shell */
export const EditorShell = () => {
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

  // Restore saved editor state from sessionStorage on mount
  useEffect(() => {
    const saved = sessionStorage.getItem(STORAGE_KEY);
    if (!saved) {
      setInitialJson(null);
      return;
    }

    try {
      const parsed = JSON.parse(saved);
      const isValid =
        parsed &&
        typeof parsed === "object" &&
        parsed.ROOT &&
        parsed.ROOT.type; // confirms it's a Craft.js serialized node

      if (!isValid) {
        sessionStorage.removeItem(STORAGE_KEY);
        setInitialJson(null);
        return;
      }

      setInitialJson(saved);
    } catch {
      sessionStorage.removeItem(STORAGE_KEY);
      setInitialJson(null);
    }
  }, []);

  // Defer panel rendering to avoid React setState-during-render warning
  useEffect(() => {
    if (initialJson === undefined) return;
    const id = requestAnimationFrame(() => setPanelsReady(true));
    return () => cancelAnimationFrame(id);
  }, [initialJson]);

  // Auto-save editor state to sessionStorage (debounced)
  const handleNodesChange = useCallback(
    (query: { serialize: () => string }) => {
      if (initialJson === undefined) return;
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(() => {
        try {
          const next = query.serialize();
          const parsed = JSON.parse(next);
          if (!parsed?.ROOT) return;
          sessionStorage.setItem(STORAGE_KEY, next);
        } catch {
          // Ignore storage errors (quota, private mode, etc.)
        }
      }, 500);
    },
    [initialJson]
  );

  // Clean up debounce timer on unmount
  useEffect(() => {
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, []);

  return (
    <div className="h-screen bg-brand-black text-brand-lighter overflow-hidden font-sans relative">
      <Editor
        resolver={RenderBlocks}
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
              <RightPanel />
            </div>
          </div>
        )}

        {/* Canvas Controls Overlay: ito yung nasa baba :> */}
        <div className="absolute bottom-4 right-100 bg-brand-dark/80 backdrop-blur p-1 rounded-lg text-xs text-brand-lighter pointer-events-none z-50 border border-white/10">
          <div className="flex gap-4">
            <span>{Math.round(scale * 100)}%</span>
            <span>Space + Drag to Pan</span>
            <span>Ctrl + Scroll to Zoom</span>
          </div>
        </div>

      </Editor>
    </div>
  );
};
