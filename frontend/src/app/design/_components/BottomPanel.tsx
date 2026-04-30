"use client";

import React from "react";
import { useEditor } from "@craftjs/core";
import {
  MousePointer2,
  Hand,
  Maximize2,
  Undo2,
  Redo2,
  Type,
  Square as SquareIcon,
  Circle as CircleIcon,
  Triangle as TriangleIcon,
  Shapes,
  ZoomIn,
  ZoomOut,
  RotateCw,
  MessageSquare,
  ChevronDown,
} from "lucide-react";
import { useCanvasTool } from "./CanvasToolContext";
import { DesignTooltip } from "./DesignTooltip";
import { useComments } from "../_context/CommentsContext";

export type CanvasTool = "move" | "hand" | "text" | "shape" | "comment";
export type ShapeType = "Square" | "Circle" | "Triangle";

interface BottomPanelProps {
  activeTool: CanvasTool;
  onToolChange: (tool: CanvasTool) => void;
  selectedShape?: ShapeType;
  onShapeChange?: (shape: ShapeType) => void;
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
  onRotateCanvas?: () => void;
  permission?: "owner" | "editor" | "viewer";
}

export const BottomPanel: React.FC<BottomPanelProps> = ({
  activeTool,
  onToolChange,
  selectedShape = "Square",
  onShapeChange,
  showHints = true,
  saveStatus = "idle",
  saveError = null,
  onResetData,
  onZoomFit,
  scale = 1,
  onScaleChange,
  onRotateCanvas,
  permission = "editor",
}) => {
  const { actions, query } = useEditor();
  const { setCommentMode, isCommentMode } = useComments();
  const [isShapesPickerOpen, setIsShapesPickerOpen] = React.useState(false);
  const shapesPickerRef = React.useRef<HTMLDivElement | null>(null);
  const showZoom = onZoomFit != null || onScaleChange != null;
  const is100 = scale >= 0.98 && scale <= 1.02;
  const canUndo = Boolean(actions?.history?.undo);
  const canRedo = Boolean(actions?.history?.redo);

  React.useEffect(() => {
    if (activeTool !== "shape") {
      setIsShapesPickerOpen(false);
    }

    // Automatically turn comment mode on/off based on the active tool
    if (activeTool === "comment") {
      setCommentMode(true);
    } else {
      setCommentMode(false);
    }
  }, [activeTool, setCommentMode]);

  React.useEffect(() => {
    const handleOutside = (event: MouseEvent) => {
      if (!isShapesPickerOpen) return;
      const target = event.target as Node | null;
      if (shapesPickerRef.current && target && !shapesPickerRef.current.contains(target)) {
        setIsShapesPickerOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [isShapesPickerOpen]);

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

  const handleRotateCanvas = () => {
    if (permission === "viewer") return;
    try {
      const state = query.getState();
      const nodes = state.nodes ?? {};

      const findPageAncestor = (nodeId: string | null | undefined): string | null => {
        if (!nodeId) return null;
        let cursor: string | null = nodeId;
        const seen = new Set<string>();

        while (cursor && !seen.has(cursor)) {
          seen.add(cursor);
          const node = nodes[cursor] as any;
          if (!node) return null;
          if (node?.data?.displayName === "Page") return cursor;
          const parentId = node?.data?.parent ?? node?.parent;
          cursor = parentId;
        }
        return null;
      };

      const targetId = findPageAncestor(state?.events?.selected?.size > 0 ? Array.from(state.events.selected)[0] : null)
        ?? Object.keys(nodes).find(id => nodes[id].data.displayName === 'Page');

      if (!targetId) return;

      actions.setProp(targetId, (props: any) => {
        props.pageRotation = ((props.pageRotation ?? 0) + 90) % 360;
      });

      onRotateCanvas?.();
    } catch (e) {
      console.error("Rotate failed", e);
    }
  };

  const statusTone =
    saveStatus === "saving"
      ? "text-[var(--builder-status-saving)] border-yellow-400/30 bg-yellow-500/10"
      : saveStatus === "saved"
        ? "text-[var(--builder-status-saved)] border-green-400/30 bg-green-500/10"
        : "text-[var(--builder-status-error)] border-red-400/30 bg-red-500/10";

  const statusLabel =
    saveStatus === "saving"
      ? "Saving..."
      : saveStatus === "saved"
        ? "Saved"
        : saveError || "Save failed";

  const { activeShape, setActiveShape } = useCanvasTool();
  const [showShapesMenu, setShowShapesMenu] = React.useState(false);
  const [showViewMenu, setShowViewMenu] = React.useState(false);
  const [showSelectionMenu, setShowSelectionMenu] = React.useState(false);

  const SELECTION_TOOLS = [
    { type: "move" as const, icon: <MousePointer2 className="w-4 h-4" strokeWidth={1.8} />, label: "Move", shortcut: "V" },
    { type: "hand" as const, icon: <Hand className="w-4 h-4" strokeWidth={1.8} />, label: "Hand", shortcut: "H" },
  ];

  const SHAPES: Array<{ type: ShapeType; icon: React.ReactNode; label: string }> = [
    { type: "Square", icon: <SquareIcon className="w-4 h-4" />, label: "Square" },
    { type: "Circle", icon: <CircleIcon className="w-4 h-4" />, label: "Circle" },
    { type: "Triangle", icon: <TriangleIcon className="w-4 h-4" />, label: "Triangle" },
  ];

  const selectionMenuRef = React.useRef<HTMLDivElement>(null);
  const shapesMenuRef = React.useRef<HTMLDivElement>(null);
  const viewMenuRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (selectionMenuRef.current && !selectionMenuRef.current.contains(event.target as Node)) {
        setShowSelectionMenu(false);
      }
      if (shapesMenuRef.current && !shapesMenuRef.current.contains(event.target as Node)) {
        setShowShapesMenu(false);
      }
      if (viewMenuRef.current && !viewMenuRef.current.contains(event.target as Node)) {
        setShowViewMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div data-panel="bottom-tools" className="absolute bottom-16 left-1/2 -translate-x-1/2 z-[9999] pointer-events-none flex flex-col items-center gap-2">
      <div
        className="pointer-events-auto flex items-center rounded-2xl backdrop-blur-md border border-[var(--builder-border)] shadow-[0_10px_30px_rgba(0,0,0,0.35)] px-1.5 py-1.5 gap-1"
        style={{ background: "color-mix(in srgb, var(--builder-surface) 90%, transparent)" }}
      >
        <div className="relative group/selection" ref={selectionMenuRef}>
          <DesignTooltip content={activeTool === "hand" ? "Hand (H)" : "Move (V)"} position="top">
            <button
              type="button"
              onClick={() => setShowSelectionMenu(!showSelectionMenu)}
              className={`h-9 flex items-center gap-1.5 px-2.5 rounded-lg transition-all ${activeTool === "move" || activeTool === "hand"
                ? "bg-blue-500/20 text-[var(--builder-active-text)] shadow-[0_0_15px_rgba(59,130,246,0.1)] border border-blue-500/20"
                : "text-[var(--builder-text-muted)] hover:text-[var(--builder-text)] hover:bg-[var(--builder-surface-2)] border border-transparent"
                }`}
            >
              <div className="flex items-center justify-center">
                {activeTool === "hand" ? (
                  <Hand className="w-4 h-4" strokeWidth={2} />
                ) : (
                  <MousePointer2 className="w-4 h-4" strokeWidth={2} />
                )}
              </div>
              <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${showSelectionMenu ? "rotate-180" : "opacity-60"}`} />
            </button>
          </DesignTooltip>

          {showSelectionMenu && (
            <div className="absolute bottom-full left-0 mb-2 bg-[var(--builder-surface-2)]/95 border border-[var(--builder-border)] rounded-xl shadow-2xl p-1 flex flex-col min-w-[140px] backdrop-blur-md z-[100]">
              {SELECTION_TOOLS.map((tool) => (
                <button
                  key={tool.type}
                  type="button"
                  disabled={permission === "viewer" && tool.type === "move"}
                  onClick={() => {
                    if (permission === "viewer" && tool.type === "move") return;
                    onToolChange(tool.type);
                    setShowSelectionMenu(false);
                  }}
                  className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-colors ${activeTool === tool.type
                    ? "bg-blue-500/10 text-[var(--builder-active-text)] font-bold"
                    : (permission === "viewer" && tool.type === "move")
                      ? "text-[var(--builder-text-faint)] cursor-not-allowed"
                      : "text-[var(--builder-text-muted)] hover:text-[var(--builder-text)] hover:bg-[var(--builder-surface-3)]"
                    }`}
                >
                  <div className="flex items-center gap-2">
                    {tool.icon}
                    <span>{tool.label} {permission === "viewer" && tool.type === "move" && "(Owner Only)"}</span>
                  </div>
                  <span className="text-[10px] opacity-30 font-medium">{tool.shortcut}</span>
                </button>
              ))}
            </div>
          )}
        </div>
        <DesignTooltip content={permission === "viewer" ? "Text tool disabled" : "Text (T)"} position="top">
          <button
            type="button"
            onClick={() => onToolChange("text")}
            disabled={permission === "viewer"}
            className={`h-9 w-9 grid place-items-center rounded-lg transition-colors ${activeTool === "text"
              ? "bg-blue-500/25 text-[var(--builder-active-text)]"
              : "text-[var(--builder-text-muted)] hover:text-[var(--builder-text)] hover:bg-[var(--builder-surface-2)]"
              } ${permission === "viewer" ? "opacity-40 cursor-not-allowed" : ""}`}
          >
            <Type className="w-4 h-4" strokeWidth={1.8} />
          </button>
        </DesignTooltip>
        <div className="relative group/shapes" ref={shapesMenuRef}>
          <DesignTooltip content={permission === "viewer" ? "Shape tools disabled" : "Shapes (S)"} position="top">
            <button
              type="button"
              onClick={() => {
                if (permission === "viewer") return;
                if (activeTool === "shape") {
                  setShowShapesMenu(!showShapesMenu);
                } else {
                  onToolChange("shape");
                  setShowShapesMenu(true);
                }
              }}
              disabled={permission === "viewer"}
              className={`h-9 flex items-center gap-1.5 px-2.5 rounded-lg transition-all ${activeTool === "shape"
                ? "bg-blue-500/20 text-[var(--builder-active-text)] shadow-[0_0_15px_rgba(59,130,246,0.1)] border border-blue-500/20"
                : "text-[var(--builder-text-muted)] hover:text-[var(--builder-text)] hover:bg-[var(--builder-surface-2)] border border-transparent"
                } ${permission === "viewer" ? "opacity-40 cursor-not-allowed" : ""}`}
            >
              <Shapes className="w-4 h-4" strokeWidth={1.8} />
              <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${showShapesMenu ? "rotate-180" : "opacity-60"}`} />
            </button>
          </DesignTooltip>
          {showShapesMenu && (
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-[var(--builder-surface-2)]/95 border border-[var(--builder-border)] rounded-xl shadow-xl p-1 flex flex-col min-w-[120px] backdrop-blur-md">
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
                    ? "bg-blue-500/20 text-[var(--builder-active-text)]"
                    : "text-[var(--builder-text-muted)] hover:text-[var(--builder-text)] hover:bg-[var(--builder-surface-3)]"
                    }`}
                >
                  {s.icon}
                  {s.label}
                </button>
              ))}
            </div>
          )}
        </div>
        <DesignTooltip content="Comments (C)" position="top">
          <button
            type="button"
            onClick={() => {
              if (activeTool === "comment") {
                onToolChange("move");
              } else {
                onToolChange("comment");
              }
            }}
            className={`h-9 w-9 grid place-items-center rounded-lg transition-colors ${activeTool === "comment"
              ? "bg-amber-500/20 text-[var(--builder-accent)] shadow-[0_0_15px_rgba(245,158,11,0.1)] border border-amber-500/20"
              : "text-[var(--builder-text-muted)] hover:text-[var(--builder-text)] hover:bg-[var(--builder-surface-2)] border border-transparent"
              }`}
          >
            <MessageSquare className="w-4 h-4" strokeWidth={1.8} />
          </button>
        </DesignTooltip>
        <div className="w-px h-5 bg-[var(--builder-border-mid)] rounded-full mx-0.5" aria-hidden />
        <DesignTooltip content="Undo (Ctrl+Z)" position="top">
          <button
            type="button"
            onClick={handleUndo}
            disabled={!canUndo}
            className="h-9 w-9 grid place-items-center rounded-lg transition-colors text-[var(--builder-text-muted)] hover:text-[var(--builder-text)] hover:bg-[var(--builder-surface-2)] disabled:opacity-40 disabled:pointer-events-none"
          >
            <Undo2 className="w-4 h-4" strokeWidth={1.8} />
          </button>
        </DesignTooltip>
        <DesignTooltip content="Redo (Ctrl+Shift+Z)" position="top">
          <button
            type="button"
            onClick={handleRedo}
            disabled={!canRedo}
            className="h-9 w-9 grid place-items-center rounded-lg transition-colors text-[var(--builder-text-muted)] hover:text-[var(--builder-text)] hover:bg-[var(--builder-surface-2)] disabled:opacity-40 disabled:pointer-events-none"
          >
            <Redo2 className="w-4 h-4" strokeWidth={1.8} />
          </button>
        </DesignTooltip>

        <div className="w-px h-5 bg-[var(--builder-border-mid)] rounded-full mx-0.5" aria-hidden />

        <div className="relative" ref={viewMenuRef}>
          <DesignTooltip content="Zoom & View Options" position="top">
            <button
              type="button"
              onClick={() => setShowViewMenu(!showViewMenu)}
              className={`flex items-center gap-1.5 px-3 h-9 rounded-lg transition-all ${showViewMenu || is100
                ? "bg-blue-500/20 text-[var(--builder-active-text)] shadow-[0_0_15px_rgba(59,130,246,0.1)] border border-blue-500/20"
                : "text-[var(--builder-text-muted)] hover:text-[var(--builder-text)] hover:bg-[var(--builder-surface-2)] border border-transparent"
                }`}
            >
              <span>{Math.round(scale * 100)}%</span>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${showViewMenu ? "rotate-180" : ""}`} />
            </button>
          </DesignTooltip>

          {showViewMenu && (
            <div className="absolute bottom-full right-0 mb-2 bg-[var(--builder-surface-2)]/95 border border-[var(--builder-border)] rounded-xl shadow-2xl p-1 flex flex-col min-w-[180px] backdrop-blur-xl z-[100]">
              <div className="px-3 py-1.5 border-b border-[var(--builder-border)] mb-1">
                <span className="text-[10px] uppercase tracking-widest font-black text-[var(--builder-text-faint)]">Zoom</span>
              </div>

              {[0.5, 0.75, 1, 1.5, 2].map((zoom) => (
                <button
                  key={zoom}
                  onClick={() => {
                    onScaleChange?.(zoom);
                    setShowViewMenu(false);
                  }}
                  className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-colors ${Math.abs(scale - zoom) < 0.01 ? "bg-blue-500/20 text-[var(--builder-active-text)] font-bold" : "text-[var(--builder-text-muted)] hover:text-[var(--builder-text)] hover:bg-[var(--builder-surface-3)]"}`}
                >
                  <span>{Math.round(zoom * 100)}%</span>
                </button>
              ))}

              <div className="h-px bg-[var(--builder-border)] my-1" />

              <button
                onClick={() => {
                  onZoomFit?.();
                  setShowViewMenu(false);
                }}
                className="flex items-center justify-between px-3 py-2 rounded-lg text-xs text-[var(--builder-text-muted)] hover:text-[var(--builder-text)] hover:bg-[var(--builder-surface-3)] transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Maximize2 className="w-3.5 h-3.5 opacity-50" />
                  <span>Fit to Canvas</span>
                </div>
                <span className="text-[10px] opacity-30 font-medium">Shift+1</span>
              </button>

              <button
                onClick={() => {
                  onRotateCanvas?.();
                  setShowViewMenu(false);
                }}
                className="flex items-center justify-between px-3 py-2 rounded-lg text-xs text-[var(--builder-text-muted)] hover:text-[var(--builder-text)] hover:bg-[var(--builder-surface-3)] transition-colors"
              >
                <div className="flex items-center gap-2">
                  <RotateCw className="w-3.5 h-3.5 opacity-50" />
                  <span>Rotate Canvas</span>
                </div>
                <span className="text-[10px] opacity-30 font-medium">90°</span>
              </button>
            </div>
          )}
        </div>

      </div>

      <div className="pointer-events-none flex items-center gap-2">
        {showHints && (
          <span className="pointer-events-auto rounded-full border border-transparent px-3 py-1 text-[10px] text-[var(--builder-text-muted)] backdrop-blur-sm opacity-85"
            style={{ background: "color-mix(in srgb, var(--builder-surface) 70%, transparent)" }}>
            G Move • H Hand • T Text • S Shapes • Hold Space
          </span>
        )}
        {saveStatus !== "idle" && (
          <span className={`pointer-events-auto rounded-full border px-3 py-1 text-[10px] backdrop-blur-sm ${statusTone}`}>
            {statusLabel}
          </span>
        )}
        {permission === "viewer" && (
          <span className="pointer-events-auto rounded-full border border-red-500/30 bg-red-500/10 px-3 py-1 text-[10px] text-[var(--builder-status-error)] backdrop-blur-sm font-bold animate-pulse">
            View-only Mode: Access Restricted
          </span>
        )}
      </div>
    </div>
  );
};
