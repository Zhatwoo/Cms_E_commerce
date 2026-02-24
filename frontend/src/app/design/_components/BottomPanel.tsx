"use client";

import React from "react";
import { useEditor } from "@craftjs/core";
import { MousePointer2, Hand, Maximize2, Undo2, Redo2 } from "lucide-react";

export type CanvasTool = "move" | "hand";

interface BottomPanelProps {
  activeTool: CanvasTool;
  onToolChange: (tool: CanvasTool) => void;
  showHints?: boolean;
  saveStatus?: "idle" | "saving" | "saved" | "error";
  saveError?: string | null;
  onResetData?: () => void;
  /** Zoom: fit canvas in view */
  onZoomFit?: () => void;
  /** Zoom: current scale (e.g. 1 = 100%) */
  scale?: number;
  /** Zoom: set scale (e.g. 1 for 100%) */
  onScaleChange?: (scale: number) => void;
}

export const BottomPanel: React.FC<BottomPanelProps> = ({
  activeTool,
  onToolChange,
  showHints = true,
  saveStatus = "idle",
  saveError = null,
  onResetData,
  onZoomFit,
  scale = 1,
  onScaleChange,
}) => {
  const { actions } = useEditor();
  const showZoom = onZoomFit != null || onScaleChange != null;
  const is100 = scale >= 0.98 && scale <= 1.02;
  const canUndo = Boolean(actions?.history?.undo);
  const canRedo = Boolean(actions?.history?.redo);

  const handleUndo = () => {
    try {
      actions?.history?.undo?.();
    } catch {
      // nothing to undo
    }
  };

  const handleRedo = () => {
    try {
      actions?.history?.redo?.();
    } catch {
      
    }
  };

  return (
    <div data-panel="bottom-tools" className="absolute bottom-0 left-0 right-0 z-50 pointer-events-none flex flex-col items-center">
      {/* Floating bar: tools + optional zoom */}
      <div
        className="pointer-events-auto flex items-center rounded-xl bg-[#2a2a2e]/95 backdrop-blur-md border border-white/[0.08] shadow-[0_4px_24px_rgba(0,0,0,0.4)] mb-3 px-1 py-1.5 gap-0.5"
        style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.06)" }}
      >
        <button
          type="button"
          onClick={() => onToolChange("move")}
          className={`p-2.5 rounded-lg transition-colors ${
            activeTool === "move"
              ? "bg-blue-500/25 text-blue-300"
              : "text-white/70 hover:text-white hover:bg-white/[0.08]"
          }`}
          title="Move – Select and move elements"
        >
          <MousePointer2 className="w-4 h-4" strokeWidth={1.8} />
        </button>
        <button
          type="button"
          onClick={() => onToolChange("hand")}
          className={`p-2.5 rounded-lg transition-colors ${
            activeTool === "hand"
              ? "bg-blue-500/25 text-blue-300"
              : "text-white/70 hover:text-white hover:bg-white/[0.08]"
          }`}
          title="Hand – Pan the canvas"
        >
          <Hand className="w-4 h-4" strokeWidth={1.8} />
        </button>
        <div className="w-px h-5 bg-white/15 rounded-full mx-0.5" aria-hidden />
        <button
          type="button"
          onClick={handleUndo}
          disabled={!canUndo}
          className="p-2.5 rounded-lg transition-colors text-white/70 hover:text-white hover:bg-white/[0.08] disabled:opacity-40 disabled:pointer-events-none"
          title="Undo (Ctrl+Z)"
        >
          <Undo2 className="w-4 h-4" strokeWidth={1.8} />
        </button>
        <button
          type="button"
          onClick={handleRedo}
          disabled={!canRedo}
          className="p-2.5 rounded-lg transition-colors text-white/70 hover:text-white hover:bg-white/[0.08] disabled:opacity-40 disabled:pointer-events-none"
          title="Redo (Ctrl+Shift+Z)"
        >
          <Redo2 className="w-4 h-4" strokeWidth={1.8} />
        </button>
        {showZoom && (
          <>
            <div className="w-px h-5 bg-white/15 rounded-full mx-0.5" aria-hidden />
            {onZoomFit && (
              <button
                type="button"
                onClick={onZoomFit}
                className="p-2.5 rounded-lg transition-colors text-white/70 hover:text-white hover:bg-white/[0.08]"
                title="Fit canvas in view"
              >
                <Maximize2 className="w-4 h-4" strokeWidth={1.8} />
              </button>
            )}
            {onScaleChange && (
              <button
                type="button"
                onClick={() => onScaleChange(1)}
                className={`min-w-[2.5rem] px-2 py-2 rounded-lg transition-colors text-[11px] font-medium ${
                  is100 ? "bg-blue-500/25 text-blue-300" : "text-white/70 hover:text-white hover:bg-white/[0.08]"
                }`}
                title="Zoom to 100%"
              >
                100%
              </button>
            )}
          </>
        )}
      </div>

      {/* Subtle footer: hints + save + reset (optional) */}
      <div className="pointer-events-auto w-full flex items-center justify-between px-4 py-1.5 min-h-8 bg-brand-dark/60 backdrop-blur-sm border-t border-white/5">
        {showHints ? (
          <div className="flex items-center gap-3 text-[11px] text-brand-lighter/80">
            <span>Ctrl + Scroll to zoom</span>
            <span className="hidden md:inline">Ctrl / ⌘ + Click to multi-select</span>
          </div>
        ) : (
          <div />
        )}
        <div className="flex items-center gap-3">
          {saveStatus !== "idle" && (
            <span
              className={`text-[11px] ${
                saveStatus === "saving"
                  ? "text-yellow-400"
                  : saveStatus === "saved"
                    ? "text-green-400"
                    : "text-red-400"
              }`}
            >
              {saveStatus === "saving"
                ? "Saving..."
                : saveStatus === "saved"
                  ? "Saved"
                  : saveError
                    ? saveError
                    : "Save failed"}
            </span>
          )}
          {onResetData && (
            <button
              type="button"
              onClick={onResetData}
              className="text-[11px] text-red-400/90 hover:text-red-300 transition-colors"
              title="Reset data"
            >
              Reset data
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
