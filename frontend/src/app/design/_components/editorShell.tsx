import React, { useRef, useState, useEffect } from "react";
import { Editor, Frame, Element } from "@craftjs/core";
import { RenderBlocks } from "../_assets";
import { LeftPanel } from "./leftPanel";
import { RightPanel } from "./rightPanel";
import { Container } from "../_assets/Container/Container";
import { Text } from "../_assets/Text/Text";
import { Page } from "../_assets/Page/Page";
import { Viewport } from "../_assets/Viewport/Viewport";
import { RenderNode } from "./RenderNode";

export const EditorShell = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPanning, setIsPanning] = useState(false);
  const [isSpacePressed, setIsSpacePressed] = useState(false);
  const [scale, setScale] = useState(1);

  // Handle Zoom
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        e.stopPropagation();

        const zoomSensitivity = 0.001;
        const delta = -e.deltaY * zoomSensitivity;

        setScale(prevScale => {
          const newScale = prevScale + delta;
          return Math.min(Math.max(newScale, 0.2), 3); // Limit zoom between 0.2x and 3x
        });
      }
    };

    container.addEventListener("wheel", handleWheel, { passive: false });

    return () => {
      container.removeEventListener("wheel", handleWheel);
    };
  }, []);

  // Handle Panning Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space") {
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

  return (
    <div className="h-screen bg-brand-black text-white overflow-hidden font-sans relative">
      <Editor
        resolver={RenderBlocks}
        onRender={RenderNode}
      >
        {/* Canvas Area (Background) */}
        <div
          ref={containerRef}
          className="absolute inset-0 overflow-auto bg-brand-dark"
          style={{ cursor: isSpacePressed ? (isPanning ? 'grabbing' : 'grab') : 'default' }}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onMouseMove={handleMouseMove}
        >
          {/* Inner Content - Infinite Canvas */}
          <div
            className="min-w-[200vw] min-h-[200vh] flex items-center justify-center p-40 transform-origin-center transition-transform duration-75 ease-out"
            style={{
              transform: `scale(${scale})`,
              transformOrigin: 'center center' // Zooming from center is simpler for now
            }}
          >
            <Frame>
              <Element is={Viewport} canvas>
                {/* Page 1 */}
                <Element is={Page} canvas>
                  <Element is={Container} padding={40} background="#ffffff" canvas>
                    <Text text="Page 1" fontSize={32} />
                    <Text text="Subtitle here" fontSize={16} />
                  </Element>
                </Element>

                {/* Page 2 */}
                <Element is={Page} canvas>
                  <Element is={Container} padding={40} background="#ffffff" canvas>
                    <Text text="Page 2" fontSize={32} />
                  </Element>
                </Element>
              </Element>
            </Frame>
          </div>
        </div>

        {/* Floating Panels */}
        {/* Left Panel */}
        <div className="absolute top-4 left-4 z-50 h-[calc(100vh-2rem)] pointer-events-none">
          <div className="pointer-events-auto h-full">
            <LeftPanel />
          </div>
        </div>

        {/* Right Panel */}
        <div className="absolute top-4 right-4 z-50 h-[calc(100vh-2rem)] pointer-events-none">
          <div className="pointer-events-auto h-full">
            <RightPanel />
          </div>
        </div>

        {/* Canvas Controls Overlay */}
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
