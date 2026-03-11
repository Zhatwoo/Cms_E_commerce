"use client";

import React, { createContext, useContext, useState } from "react";
import type { CanvasTool, ShapeType } from "./BottomPanel";

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

    return (
        <CanvasToolContext.Provider
            value={{
                activeTool: value,
                setActiveTool: onToolChange,
                activeShape,
                setActiveShape
            }}
        >
            {children}
        </CanvasToolContext.Provider>
    );
};
