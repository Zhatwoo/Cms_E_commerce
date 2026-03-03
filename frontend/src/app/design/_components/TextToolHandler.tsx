"use client";

import React, { useEffect, useRef, useState } from "react";
import ReactDOM from "react-dom";
import { useEditor } from "@craftjs/core";
import { useCanvasTool } from "./CanvasToolContext";
import { useInlineTextEdit } from "./InlineTextEditContext";
import { Text } from "../_designComponents/Text/Text";

const DRAG_THRESHOLD = 5;
const TEXT_ADDING_FLAG = "textAdding";

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

export const TextToolHandler = () => {
    const { actions, query } = useEditor();
    const activeTool = useCanvasTool();
    const { setEditingTextNodeId } = useInlineTextEdit();

    const [previewRect, setPreviewRect] = useState<PreviewRect | null>(null);
    const dragRef = useRef<DragState | null>(null);

    const actionsRef = useRef(actions);
    const queryRef = useRef(query);
    const activeToolRef = useRef(activeTool);

    useEffect(() => {
        actionsRef.current = actions;
        queryRef.current = query;
    }, [actions, query]);

    useEffect(() => {
        activeToolRef.current = activeTool;
    }, [activeTool]);

    useEffect(() => {
        const clearState = () => {
            dragRef.current = null;
            setPreviewRect(null);
            delete document.body.dataset[TEXT_ADDING_FLAG];
        };

        const handleMouseDown = (e: MouseEvent) => {
            if (activeToolRef.current !== "text") return;
            if (e.button !== 0) return;

            const target = e.target as HTMLElement | null;
            if (!target) return;

            if (target.closest("[data-panel]")) return;
            if (!target.closest("[data-canvas-container]")) return;

            // Block Craft.js internal handlers and all other handlers from processing this click
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
            document.body.dataset[TEXT_ADDING_FLAG] = "true";

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
            const width = Math.max(Math.abs(dragState.currentX - dragState.startX), 150);
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

                    const tree = queryRef.current.parseReactElement(
                        <Text
                            text="Type something..."
                            fontSize={18}
                            position="absolute"
                            left={`${finalLeft}px`}
                            top={`${finalTop}px`}
                            width={`${width}px`}
                            height={height > 20 ? `${height}px` : undefined}
                        />
                    ).toNodeTree();

                    (actionsRef.current as any).addNodeTree(tree, dragState.targetNodeId);

                    setTimeout(() => {
                        actionsRef.current.selectNode(tree.rootNodeId);
                        setEditingTextNodeId(tree.rootNodeId);
                    }, 50);

                } catch (error) {
                    console.error("Failed to add text node:", error);
                }
            }

            clearState();
        };

        // Block Craft.js drag connector from processing canvas clicks when text tool is active
        const handleClick = (e: MouseEvent) => {
            if (activeToolRef.current !== "text") return;
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
    }, [setEditingTextNodeId]);

    if (!previewRect) return null;

    return typeof document !== "undefined"
        ? ReactDOM.createPortal(
            <div
                data-panel="text-tool-preview"
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
                    borderRadius: 2,
                }}
            />,
            document.body
        )
        : null;
};
