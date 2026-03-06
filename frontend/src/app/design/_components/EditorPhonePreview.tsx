"use client";

import React, { useRef, useState, useCallback, useEffect } from "react";
import { createPortal } from "react-dom";
import { useEditor } from "@craftjs/core";
import { serializeCraftToClean } from "../_lib/serializer";
import { WebPreview } from "../_lib/webRenderer";
import { PREVIEW_MOBILE_BREAKPOINT } from "../_lib/viewportConstants";
import type { BuilderDocument } from "../_types/schema";
import { Smartphone, Circle, ChevronDown } from "lucide-react";

const SCREEN_BORDER_RADIUS = 36;
const BEZEL = 44;
const DRAG_AREA_EXTRA = 100;

export type PhoneModel = {
  id: string;
  name: string;
  width: number;
  height: number;
};

export const PHONE_MODELS: PhoneModel[] = [
  { id: "iphone-15-pro-max", name: "iPhone 15 Pro Max", width: 430, height: 932 },
  { id: "iphone-15-pro", name: "iPhone 15 Pro", width: 393, height: 852 },
  { id: "iphone-15", name: "iPhone 15 / 14", width: 390, height: 844 },
  { id: "iphone-14", name: "iPhone 14", width: 390, height: 844 },
  { id: "iphone-se", name: "iPhone SE", width: 375, height: 667 },
  { id: "samsung-s24-ultra", name: "Samsung S24 Ultra", width: 412, height: 915 },
  { id: "samsung-s24", name: "Samsung Galaxy S24", width: 360, height: 780 },
  { id: "pixel-8-pro", name: "Pixel 8 Pro", width: 412, height: 915 },
  { id: "pixel-8", name: "Pixel 8", width: 412, height: 915 },
  { id: "pixel-7a", name: "Pixel 7a", width: 412, height: 915 },
  { id: "oneplus-12", name: "OnePlus 12", width: 412, height: 919 },
  { id: "galaxy-z-fold", name: "Galaxy Z Fold (cover)", width: 280, height: 653 },
];

const DEFAULT_PHONE = PHONE_MODELS[4]; // iPhone SE 375x667

/**
 * Floating phone: pick a device size from dropdown, see how the design looks on that phone. Real-time, draggable.
 */
export function EditorPhonePreview() {
  const { query } = useEditor();
  useEditor((state) => state.nodes);
  useEditor((state) => state.events.selected);

  const rootRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0, left: 0, top: 0 });
  const [mounted, setMounted] = useState(false);
  const [selectedModel, setSelectedModel] = useState<PhoneModel>(DEFAULT_PHONE);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const screenWidth = selectedModel.width;
  const screenHeight = selectedModel.height;

  useEffect(() => {
    setMounted(typeof document !== "undefined");
  }, []);

  const handleDragHandlePointerDown = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    setDragging(true);
    dragStart.current = { x: e.clientX, y: e.clientY, left: pos.x, top: pos.y };
    rootRef.current?.setPointerCapture(e.pointerId);
  }, [pos]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragging) return;
    e.preventDefault();
    setPos({
      x: dragStart.current.left + (e.clientX - dragStart.current.x),
      y: dragStart.current.top + (e.clientY - dragStart.current.y),
    });
  }, [dragging]);

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    setDragging(false);
    rootRef.current?.releasePointerCapture(e.pointerId);
  }, []);

  let cleanDoc: BuilderDocument | null = null;
  try {
    const raw = query.serialize();
    const doc = serializeCraftToClean(raw);
    if (!doc?.pages?.length) cleanDoc = null;
    else {
      const first = doc.pages[0];
      const pageWidth = `${screenWidth}px`;
      const pageHeight = screenHeight > 0 ? `${screenHeight}px` : "auto";
      if (!first) {
        cleanDoc = doc;
      } else {
        const updatedNodes = { ...doc.nodes };
        for (const id of Object.keys(updatedNodes)) {
          const node = updatedNodes[id];
          if (node?.type === "Frame") {
            updatedNodes[id] = {
              ...node,
              props: { ...node.props, referenceWidth: screenWidth, referenceHeight: screenHeight },
            };
          }
        }
        cleanDoc = {
          ...doc,
          nodes: updatedNodes,
          pages: [
            { ...first, props: { ...first.props, width: pageWidth, height: pageHeight } },
            ...doc.pages.slice(1),
          ],
        };
      }
    }
  } catch {
    cleanDoc = null;
  }

  const hasContent = cleanDoc && cleanDoc.pages?.length;

  const phoneEl = (
    <div
      ref={rootRef}
      className="pointer-events-auto select-none"
      style={{
        position: "fixed",
        bottom: 24,
        right: 24,
        transform: `translate(${pos.x}px, ${pos.y}px)`,
        zIndex: 9999,
      }}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      {/* Phone frame / bezel — drag by grabbing the edge */}
      <div
        data-drag-handle
        onPointerDown={handleDragHandlePointerDown}
        className="flex flex-col items-center rounded-[3rem] bg-neutral-800 shadow-2xl border-10 border-neutral-900 cursor-grab active:cursor-grabbing"
        style={{
          width: screenWidth + BEZEL,
          minHeight: screenHeight + DRAG_AREA_EXTRA,
        }}
      >
        {/* Top bar: Live + phone model dropdown */}
        <div className="flex flex-col items-center pt-1 pb-1 w-full" style={{ minWidth: screenWidth + BEZEL }}>
          <div className="w-24 h-6 bg-neutral-900 rounded-b-2xl shrink-0" />
          <div className="flex items-center justify-between w-full px-2 pt-1">
            <span className="flex items-center gap-1 text-[10px] text-emerald-500">
              <Circle className="w-1.5 h-1.5 fill-current" />
              Live
            </span>
            {/* Phone model dropdown — stop propagation so it stays clickable */}
            <div className="relative flex items-center gap-1.5" style={{ pointerEvents: "auto" }} onPointerDown={(e) => e.stopPropagation()}>
              <button
                type="button"
                onClick={() => setDropdownOpen((o) => !o)}
                className="flex items-center gap-1 rounded bg-neutral-700/80 hover:bg-neutral-600/80 px-2 py-1 text-[10px] text-neutral-200 border border-neutral-600 min-w-0 max-w-30 cursor-pointer"
                title={selectedModel.name}
              >
                <span className="truncate">{selectedModel.name}</span>
                <ChevronDown className={`w-3 h-3 shrink-0 transition-transform ${dropdownOpen ? "rotate-180" : ""}`} />
              </button>
              <span className="text-[9px] text-neutral-500 bg-neutral-800/90 px-1.5 py-0.5 rounded border border-neutral-600 shrink-0" title="Screen size (px)">
                {selectedModel.width}×{selectedModel.height}
              </span>
              {dropdownOpen && (
                <>
                  <div
                    role="button"
                    tabIndex={-1}
                    className="fixed inset-0"
                    style={{ zIndex: 10001 }}
                    aria-label="Close menu"
                    onClick={() => setDropdownOpen(false)}
                    onKeyDown={(e) => e.key === "Escape" && setDropdownOpen(false)}
                  />
                  <div
                    className="absolute right-0 top-full mt-1 py-1 rounded-lg bg-neutral-800 border border-neutral-600 shadow-xl max-h-[240px] overflow-auto min-w-[160px]"
                    style={{ zIndex: 10002 }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {PHONE_MODELS.map((model) => (
                      <button
                        key={model.id}
                        type="button"
                        onClick={() => {
                          setSelectedModel(model);
                          setDropdownOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 text-xs hover:bg-neutral-700 cursor-pointer ${selectedModel.id === model.id ? "bg-neutral-700 text-emerald-400" : "text-neutral-200"}`}
                      >
                        <span className="block truncate">{model.name}</span>
                        <span className="block text-[10px] text-neutral-500">{model.width}×{model.height}</span>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Screen — fixed height, scrollable when content is taller than device */}
        <div
          data-phone-screen
          onPointerDown={(e) => e.stopPropagation()}
          className="bg-white shrink-0 rounded-[14px] shadow-inner touch-auto overflow-y-auto overflow-x-hidden"
          style={{
            width: screenWidth,
            height: screenHeight,
            maxHeight: screenHeight,
            borderRadius: SCREEN_BORDER_RADIUS,
          }}
        >
          {hasContent ? (
            <div className="w-full min-h-full" style={{ borderRadius: SCREEN_BORDER_RADIUS }}>
              <WebPreview doc={cleanDoc!} simulatedWidth={screenWidth} mobileBreakpoint={PREVIEW_MOBILE_BREAKPOINT} builderParityMode />
            </div>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-neutral-400 text-sm p-4">
              <Smartphone className="w-10 h-10 mb-2 opacity-50" />
              <p>No content to preview</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  if (!mounted) return null;
  return createPortal(phoneEl, document.body);
}
