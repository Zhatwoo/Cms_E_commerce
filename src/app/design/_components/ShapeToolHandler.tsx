"use client";

import React, { useEffect, useRef, useState } from "react";
import ReactDOM from "react-dom";
import { useEditor } from "@craftjs/core";
import { useCanvasTool } from "./CanvasToolContext";
import { Circle } from "../../_assets/shapes/circle/circle";
import { Square } from "../../_assets/shapes/square/square";
import { Triangle } from "../../_assets/shapes/triangle/triangle";

const DRAG_THRESHOLD = 5;
const SHAPE_ADDING_FLAG = "shapeAdding";

type DragState = {
    active: boolean;
    startX: number;
    startY: number;
    currentX: number;
    currentY: number;
    targetNodeId: string | null;
    hasDragged: boolean;
};

type PreviewRect = {
    left: number;
    top: number;
    width: number;
    height: number;
};

const CANVAS_DISPLAY_NAMES = new Set(["Page", "Viewport", "Container", "Section", "Row", "Column", "Frame", "Button", "Tab Content"]);

function isCanvasNode(nodes: Record<string, any>, nodeId: string | null): nodeId is string {
    if (!nodeId) return false;
    const node = nodes[nodeId];
    if (!node?.data) return false;
    if (node.data.isCanvas) return true;
    const displayName = String(node.data.displayName ?? "");
    return CANVAS_DISPLAY_NAMES.has(displayName);
}

function resolveCanvasTargetId(startId: string | null, nodes: Record<string, any>): string | null {
    let current = startId;
    const visited = new Set<string>();
    while (current && !visited.has(current)) {
        visited.add(current);
        if (isCanvasNode(nodes, current)) return current;
        const parent = nodes[current]?.data?.parent;
        current = typeof parent === "string" ? parent : null;
    }
    return null;
}

function resolvePageTargetId(startId: string | null, nodes: Record<string, any>): string | null {
    let current = startId;
    const visited = new Set<string>();
    while (current && !visited.has(current)) {
        visited.add(current);
        const node = nodes[current];
        if (String(node?.data?.displayName ?? "") === "Page") return current;
        const parent = node?.data?.parent;
        current = typeof parent === "string" ? parent : null;
    }
    const firstPage = Object.keys(nodes).find((id) => String(nodes[id]?.data?.displayName ?? "") === "Page");
    return firstPage ?? null;
}

function getRenderedScale(el: HTMLElement | null): { scaleX: number; scaleY: number } {
    if (!el) return { scaleX: 1, scaleY: 1 };
    const rect = el.getBoundingClientRect();
    const baseWidth = el.offsetWidth || el.clientWidth || 0;
    const baseHeight = el.offsetHeight || el.clientHeight || 0;
    const scaleX = baseWidth > 0 ? rect.width / baseWidth : 1;
    const scaleY = baseHeight > 0 ? rect.height / baseHeight : 1;
    return {
        scaleX: Number.isFinite(scaleX) && scaleX > 0.01 ? scaleX : 1,
        scaleY: Number.isFinite(scaleY) && scaleY > 0.01 ? scaleY : 1,
    };
}

export const ShapeToolHandler = () => {
    const { actions, query } = useEditor();
    const { activeTool, activeShape, setActiveTool } = useCanvasTool();

    const [previewRect, setPreviewRect] = useState<PreviewRect | null>(null);
    const dragRef = useRef<DragState | null>(null);

    const actionsRef = useRef(actions);
    const queryRef = useRef(query);
    const activeToolRef = useRef(activeTool);
    const activeShapeRef = useRef(activeShape);

    useEffect(() => {
        actionsRef.current = actions;
        queryRef.current = query;
    }, [actions, query]);

    useEffect(() => {
        activeToolRef.current = activeTool;
        activeShapeRef.current = activeShape;
    }, [activeTool, activeShape]);

    useEffect(() => {
        const clearState = () => {
            dragRef.current = null;
            setPreviewRect(null);
            delete document.body.dataset[SHAPE_ADDING_FLAG];
        };

        const handleMouseDown = (e: MouseEvent) => {
            if (activeToolRef.current !== "shape") return;
            if (e.button !== 0) return;

            const target = e.target as HTMLElement | null;
            if (!target) return;

            if (target.closest("[data-panel]")) return;
            if (!target.closest("[data-canvas-container]")) return;
            if (document.body.dataset.spacePan === "true") return;

            e.stopPropagation();
            e.preventDefault();

            const nodeEl = target.closest("[data-node-id]") as HTMLElement | null;
            const clickedNodeId = nodeEl?.getAttribute("data-node-id") || null;
            const nodes = queryRef.current.getState().nodes as Record<string, any>;
            let targetNodeId = resolvePageTargetId(clickedNodeId, nodes) ?? resolveCanvasTargetId(clickedNodeId, nodes);

            if (!targetNodeId || targetNodeId === "ROOT") {
                const firstPage = Object.keys(nodes).find(id => String(nodes[id]?.data?.displayName ?? "") === "Page");
                targetNodeId = firstPage || "ROOT";
            }

            dragRef.current = {
                active: true,
                startX: e.clientX,
                startY: e.clientY,
                currentX: e.clientX,
                currentY: e.clientY,
                targetNodeId,
                hasDragged: false,
            };
        };

        const handleMouseMove = (e: MouseEvent) => {
            const dragState = dragRef.current;
            if (!dragState || !dragState.active) return;

            dragState.currentX = e.clientX;
            dragState.currentY = e.clientY;

            const distance = Math.hypot(dragState.currentX - dragState.startX, dragState.currentY - dragState.startY);
            if (distance < DRAG_THRESHOLD) return;

            dragState.hasDragged = true;
            document.body.dataset[SHAPE_ADDING_FLAG] = "true";

            setPreviewRect({
                left: Math.min(dragState.startX, dragState.currentX),
                top: Math.min(dragState.startY, dragState.currentY),
                width: Math.abs(dragState.currentX - dragState.startX),
                height: Math.abs(dragState.currentY - dragState.startY),
            });
        };

        const handleMouseUp = (e: MouseEvent) => {
            const dragState = dragRef.current;
            if (!dragState || !dragState.active || !dragState.hasDragged) {
                clearState();
                return;
            }

            const left = Math.min(dragState.startX, dragState.currentX);
            const top = Math.min(dragState.startY, dragState.currentY);
            const width = Math.abs(dragState.currentX - dragState.startX);
            const height = Math.abs(dragState.currentY - dragState.startY);

            if (dragState.targetNodeId) {
                try {
                    const state = queryRef.current.getState();
                    const normalizedTargetId =
                        resolvePageTargetId(dragState.targetNodeId, state.nodes as Record<string, any>) ??
                        resolveCanvasTargetId(dragState.targetNodeId, state.nodes as Record<string, any>) ??
                        dragState.targetNodeId;
                    const targetDom = queryRef.current.node(normalizedTargetId).get()?.dom;
                    let finalLeft = left;
                    let finalTop = top;
                    let finalWidth = width;
                    let finalHeight = height;

                    if (targetDom) {
                        const rect = targetDom.getBoundingClientRect();
                        const { scaleX, scaleY } = getRenderedScale(targetDom);
                        finalLeft = Math.max(0, Math.round((left - rect.left) / scaleX));
                        finalTop = Math.max(0, Math.round((top - rect.top) / scaleY));
                        finalWidth = Math.max(12, Math.round(width / scaleX));
                        finalHeight = Math.max(12, Math.round(height / scaleY));
                    }

                    let shapeElement;
                    const commonProps = {
                        position: "absolute" as const,
                        left: `${finalLeft}px`,
                        top: `${finalTop}px`,
                        width: `${finalWidth}px`,
                        height: `${finalHeight}px`,
                    };

                    if (activeShapeRef.current === "Circle") {
                        shapeElement = <Circle {...commonProps} />;
                    } else if (activeShapeRef.current === "Triangle") {
                        shapeElement = <Triangle {...commonProps} />;
                    } else {
                        shapeElement = <Square {...commonProps} />;
                    }

                    const tree = queryRef.current.parseReactElement(shapeElement).toNodeTree();

                    (actionsRef.current as any).addNodeTree(tree, normalizedTargetId);

                    setTimeout(() => {
                        actionsRef.current.selectNode(tree.rootNodeId);
                        // One-shot shape tool: return to cursor tool after placing one shape.
                        setActiveTool("move");
                    }, 50);

                } catch (error) {
                    console.error("Failed to add shape node:", error);
                }
            }

            clearState();
        };

        const handleClick = (e: MouseEvent) => {
            if (activeToolRef.current !== "shape") return;
            const target = e.target as HTMLElement | null;
            if (!target) return;
            if (target.closest("[data-panel]")) return;
            if (target.closest("[data-canvas-container]")) {
                e.stopPropagation();
                e.preventDefault();
            }
        };

        document.addEventListener("mousedown", handleMouseDown, true);
        document.addEventListener("mousemove", handleMouseMove, true);
        document.addEventListener("mouseup", handleMouseUp, true);
        document.addEventListener("click", handleClick, true);

        return () => {
            document.removeEventListener("mousedown", handleMouseDown, true);
            document.removeEventListener("mousemove", handleMouseMove, true);
            document.removeEventListener("mouseup", handleMouseUp, true);
            document.removeEventListener("click", handleClick, true);
            clearState();
        };
    }, [setActiveTool]);

    if (!previewRect) return null;

    return typeof document !== "undefined"
        ? ReactDOM.createPortal(
            <div
                data-panel="shape-tool-preview"
                style={{
                    position: "fixed",
                    left: previewRect.left,
                    top: previewRect.top,
                    width: previewRect.width,
                    height: previewRect.height,
                    border: "1px solid #3b82f6",
                    backgroundColor: "rgba(59, 130, 246, 0.1)",
                    pointerEvents: "none",
                    zIndex: 10000,
                    borderRadius: activeShape === "Circle" ? "50%" : 2,
                }}
            />,
            document.body
        )
        : null;
};
