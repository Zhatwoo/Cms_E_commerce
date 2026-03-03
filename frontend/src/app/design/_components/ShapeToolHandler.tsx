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

export const ShapeToolHandler = () => {
    const { actions, query } = useEditor();
    const { activeTool, activeShape } = useCanvasTool();

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
            let targetNodeId = nodeEl?.getAttribute("data-node-id") || null;

            if (!targetNodeId || targetNodeId === "ROOT") {
                const nodes = queryRef.current.getState().nodes;
                const firstPage = Object.keys(nodes).find(id => nodes[id].data.displayName === "Page");
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
                    const targetDom = queryRef.current.node(dragState.targetNodeId).get()?.dom;
                    let finalLeft = left;
                    let finalTop = top;

                    if (targetDom) {
                        const rect = targetDom.getBoundingClientRect();
                        finalLeft = (left - rect.left);
                        finalTop = (top - rect.top);
                    }

                    let shapeElement;
                    const commonProps = {
                        position: "absolute" as const,
                        left: `${finalLeft}px`,
                        top: `${finalTop}px`,
                        width: `${width}px`,
                        height: `${height}px`,
                    };

                    if (activeShapeRef.current === "Circle") {
                        shapeElement = <Circle {...commonProps} />;
                    } else if (activeShapeRef.current === "Triangle") {
                        shapeElement = <Triangle {...commonProps} />;
                    } else {
                        shapeElement = <Square {...commonProps} />;
                    }

                    const tree = queryRef.current.parseReactElement(shapeElement).toNodeTree();

                    (actionsRef.current as any).addNodeTree(tree, dragState.targetNodeId);

                    setTimeout(() => {
                        actionsRef.current.selectNode(tree.rootNodeId);
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
    }, []);

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
