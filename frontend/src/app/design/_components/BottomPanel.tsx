"use client";

import React from "react";
import { useEditor } from "@craftjs/core";
import { MousePointer2, Hand, Maximize2, Undo2, Redo2, Type, Square as SquareIcon, Circle as CircleIcon, Triangle as TriangleIcon, Shapes } from "lucide-react";
import { useCanvasTool } from "./CanvasToolContext";

export type CanvasTool = "move" | "hand" | "text" | "shape";
export type ShapeType = "Square" | "Circle" | "Triangle";

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
      // nothing to redo
    }
  };

  const statusTone =
    saveStatus === "saving"
      ? "text-yellow-300 border-yellow-400/30 bg-yellow-500/10"
      : saveStatus === "saved"
        ? "text-green-300 border-green-400/30 bg-green-500/10"
        : "text-red-300 border-red-400/30 bg-red-500/10";

  const statusLabel =
    saveStatus === "saving"
      ? "Saving..."
      : saveStatus === "saved"
        ? "Saved"
        : saveError || "Save failed";

  const { activeShape, setActiveShape } = useCanvasTool();
  const [showShapesMenu, setShowShapesMenu] = React.useState(false);

  const SHAPES: Array<{ type: ShapeType; icon: React.ReactNode; label: string }> = [
    { type: "Square", icon: <SquareIcon className="w-4 h-4" />, label: "Square" },
    { type: "Circle", icon: <CircleIcon className="w-4 h-4" />, label: "Circle" },
    { type: "Triangle", icon: <TriangleIcon className="w-4 h-4" />, label: "Triangle" },
  ];

  return (
    <div data-panel="bottom-tools" className="absolute bottom-16 left-1/2 -translate-x-1/2 z-[9999] pointer-events-none flex flex-col items-center gap-2">
      <div
        className="pointer-events-auto flex items-center rounded-2xl bg-brand-dark/90 backdrop-blur-md border border-white/10 shadow-[0_10px_30px_rgba(0,0,0,0.35)] px-1.5 py-1.5 gap-1"
      >
        <button
          type="button"
          onClick={() => onToolChange("move")}
          className={`h-9 w-9 grid place-items-center rounded-lg transition-colors ${activeTool === "move"
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
          className={`h-9 w-9 grid place-items-center rounded-lg transition-colors ${activeTool === "hand"
            ? "bg-blue-500/25 text-blue-300"
            : "text-white/70 hover:text-white hover:bg-white/[0.08]"
            }`}
          title="Hand – Pan the canvas"
        >
          <Hand className="w-4 h-4" strokeWidth={1.8} />
        </button>
        <button
          type="button"
          onClick={() => onToolChange("text")}
          className={`h-9 w-9 grid place-items-center rounded-lg transition-colors ${activeTool === "text"
            ? "bg-blue-500/25 text-blue-300"
            : "text-white/70 hover:text-white hover:bg-white/[0.08]"
            }`}
          title="Text – Click and drag to add text"
        >
          <Type className="w-4 h-4" strokeWidth={1.8} />
        </button>
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              if (activeTool === "shape") {
                setShowShapesMenu(!showShapesMenu);
              } else {
                onToolChange("shape");
                setShowShapesMenu(true);
              }
            }}
            className={`h-9 w-9 grid place-items-center rounded-lg transition-colors ${activeTool === "shape"
              ? "bg-blue-500/25 text-blue-300"
              : "text-white/70 hover:text-white hover:bg-white/[0.08]"
              }`}
            title="Shapes – Click to choose, then drag to add"
          >
            <Shapes className="w-4 h-4" strokeWidth={1.8} />
          </button>
          {showShapesMenu && (
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-brand-dark/95 border border-white/10 rounded-xl shadow-xl p-1 flex flex-col min-w-[120px] backdrop-blur-md">
              {SHAPES.map((s) => (
                <button
                  key={s.type}
                  type="button"
                  onClick={() => {
                    setActiveShape(s.type);
                    onToolChange("shape");
                    setShowShapesMenu(false);
                  }}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs transition-colors ${activeShape === s.type && activeTool === "shape"
                    ? "bg-blue-500/20 text-blue-300"
                    : "text-white/70 hover:text-white hover:bg-white/10"
                    }`}
                >
                  {s.icon}
                  {s.label}
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="w-px h-5 bg-white/15 rounded-full mx-0.5" aria-hidden />
        <button
          type="button"
          onClick={handleUndo}
          disabled={!canUndo}
          className="h-9 w-9 grid place-items-center rounded-lg transition-colors text-white/70 hover:text-white hover:bg-white/[0.08] disabled:opacity-40 disabled:pointer-events-none"
          title="Undo (Ctrl+Z)"
        >
          <Undo2 className="w-4 h-4" strokeWidth={1.8} />
        </button>
        <button
          type="button"
          onClick={handleRedo}
          disabled={!canRedo}
          className="h-9 w-9 grid place-items-center rounded-lg transition-colors text-white/70 hover:text-white hover:bg-white/[0.08] disabled:opacity-40 disabled:pointer-events-none"
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
                className="h-9 w-9 grid place-items-center rounded-lg transition-colors text-white/70 hover:text-white hover:bg-white/[0.08]"
                title="Fit canvas in view"
              >
                <Maximize2 className="w-4 h-4" strokeWidth={1.8} />
              </button>
            )}
            {onScaleChange && (
              <button
                type="button"
                onClick={() => onScaleChange(1)}
                className={`min-w-[2.75rem] px-2 h-9 rounded-lg transition-colors text-[11px] font-medium ${is100 ? "bg-blue-500/25 text-blue-300" : "text-white/70 hover:text-white hover:bg-white/[0.08]"
                  }`}
                title="Zoom to 100%"
              >
                100%
              </button>
            )}
          </>
        )}
      </div>

      <div className="pointer-events-none flex items-center gap-2">
        {showHints && (
          <span className="pointer-events-auto rounded-full border border-white/10 bg-brand-dark/70 px-3 py-1 text-[10px] text-brand-light/85 backdrop-blur-sm">
            G Move • H Hand • T Text • S Shapes • Hold Space
          </span>
        )}
        {saveStatus !== "idle" && (
          <span className={`pointer-events-auto rounded-full border px-3 py-1 text-[10px] backdrop-blur-sm ${statusTone}`}>
            {statusLabel}
          </span>
        )}
      </div>
    </div>
  );
};
