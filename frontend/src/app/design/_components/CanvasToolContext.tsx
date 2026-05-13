import React, { createContext, useContext, useMemo, useState } from "react";
import type { CanvasTool, ShapeType } from "./BottomPanel";
import { SnapGuide } from "./snapUtils";

/* ── Tool context (low-frequency updates) ──────────────────────── */

type CanvasToolContextValue = {
    activeTool: CanvasTool;
    setActiveTool: (tool: CanvasTool) => void;
    activeShape: ShapeType;
    setActiveShape: (shape: ShapeType) => void;
};

const CanvasToolContext = createContext<CanvasToolContextValue | null>(null);

export const useCanvasTool = () => {
    const ctx = useContext(CanvasToolContext);
    if (!ctx) throw new Error("useCanvasTool must be used within CanvasToolProvider");
    return ctx;
};

/* ── Snap-guides context (high-frequency updates) ──────────────── */

/**
 * Snap guides are written on every drag frame. Keeping them in the
 * main tool context caused all 14 useCanvasTool consumers to
 * re-render once per frame during a drag (BottomPanel, drag/resize
 * handlers, panels…). Hoist them into their own context so only
 * SnapMarkers and the drag handler subscribe.
 */
type SnapGuidesContextValue = {
    snapGuides: SnapGuide[];
    setSnapGuides: (guides: SnapGuide[]) => void;
};

const SnapGuidesContext = createContext<SnapGuidesContextValue | null>(null);

export const useSnapGuides = () => {
    const ctx = useContext(SnapGuidesContext);
    if (!ctx) throw new Error("useSnapGuides must be used within CanvasToolProvider");
    return ctx;
};

/* ── Provider ──────────────────────────────────────────────────── */

export const CanvasToolProvider = ({
    children,
    value,
    onToolChange
}: {
    children: React.ReactNode;
    value: CanvasTool;
    onToolChange: (tool: CanvasTool) => void;
}) => {
    const [activeShape, setActiveShape] = useState<ShapeType>("Square");
    const [snapGuides, setSnapGuides] = useState<SnapGuide[]>([]);

    // Memoize each context value so consumers don't re-render unless
    // their slice actually changed.
    const toolValue = useMemo<CanvasToolContextValue>(
        () => ({
            activeTool: value,
            setActiveTool: onToolChange,
            activeShape,
            setActiveShape,
        }),
        [value, onToolChange, activeShape]
    );

    const snapValue = useMemo<SnapGuidesContextValue>(
        () => ({ snapGuides, setSnapGuides }),
        [snapGuides]
    );

    return (
        <CanvasToolContext.Provider value={toolValue}>
            <SnapGuidesContext.Provider value={snapValue}>
                {children}
            </SnapGuidesContext.Provider>
        </CanvasToolContext.Provider>
    );
};
