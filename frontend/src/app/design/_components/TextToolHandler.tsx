"use client";

import React, { useEffect, useRef, useState } from "react";
import ReactDOM from "react-dom";
import { useEditor } from "@craftjs/core";
import { useCanvasTool } from "./CanvasToolContext";
import { useInlineTextEdit } from "./InlineTextEditContext";
import { Text } from "../_designComponents/Text/Text";

const DRAG_THRESHOLD = 8;
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

const CANVAS_DISPLAY_NAMES = new Set(["Page", "Viewport", "Container", "Section", "Row", "Column", "Frame", "Button"]);

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

export const TextToolHandler = () => {
    const { actions, query } = useEditor();
    const { activeTool } = useCanvasTool();
    const { setEditingTextNodeId } = useInlineTextEdit();

    const [previewRect, setPreviewRect] = useState<PreviewRect | null>(null);
    const [previewHost, setPreviewHost] = useState<HTMLElement | null>(null);
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
            setPreviewHost(null);
            delete document.body.dataset[TEXT_ADDING_FLAG];
        };

        const handleMouseDown = (e: MouseEvent) => {
            if (activeToolRef.current !== "text") return;
            if (e.button !== 0) return;

            const target = e.target as HTMLElement | null;
            if (!target) return;

            if (target.closest("[data-panel]")) return;
            const canvasContainer = target.closest("[data-canvas-container]") as HTMLElement | null;
            if (!canvasContainer) return;
            if (document.body.dataset.spacePan === "true") return;

            // Block Craft.js internal handlers and all other handlers from processing this click
            e.stopPropagation();
            e.preventDefault();

            const nodeEl = target.closest("[data-node-id]") as HTMLElement | null;
            const clickedNodeId = nodeEl?.getAttribute("data-node-id") || null;
            const nodes = queryRef.current.getState().nodes as Record<string, any>;
            let targetNodeId = resolveCanvasTargetId(clickedNodeId, nodes);

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
            setPreviewHost(canvasContainer);
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
            if (!dragState || !dragState.active) {
                clearState();
                return;
            }

            const didDrag = dragState.hasDragged;
            if (!didDrag) {
                clearState();
                return;
            }
            const left = didDrag ? Math.min(dragState.startX, dragState.currentX) : e.clientX;
            const top = didDrag ? Math.min(dragState.startY, dragState.currentY) : e.clientY;
            const width = didDrag ? Math.max(Math.abs(dragState.currentX - dragState.startX), 150) : 220;
            const height = didDrag ? Math.abs(dragState.currentY - dragState.startY) : 0;

            if (dragState.targetNodeId) {
                try {
                    const state = queryRef.current.getState();
                    const normalizedTargetId = resolveCanvasTargetId(dragState.targetNodeId, state.nodes as Record<string, any>) ?? dragState.targetNodeId;
                    const parentNode = state.nodes[normalizedTargetId];
                    const parentProps = (parentNode?.data?.props ?? {}) as Record<string, unknown>;
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
                        finalWidth = Math.max(150, Math.round(width / scaleX));
                        finalHeight = Math.max(0, Math.round(height / scaleY));
                    }

                    const parentDisplay = String(parentProps.display ?? "").toLowerCase();
                    const parentFlexDirection = String(parentProps.flexDirection ?? "column").toLowerCase();
                    const parentPosition = String(parentProps.position ?? "static").toLowerCase();
                    const parentIsFreeform = parentProps.isFreeform === true;
                    const parentIsFlexOrGrid = parentDisplay === "flex" || parentDisplay === "grid";
                    const parentIsPositioned =
                        parentPosition === "relative" ||
                        parentPosition === "absolute" ||
                        parentPosition === "fixed" ||
                        parentPosition === "sticky";
                    const shouldUseAbsolute = parentIsFreeform || (!parentIsFlexOrGrid && parentIsPositioned);

                    const flowWidth = !shouldUseAbsolute ? `${finalWidth}px` : undefined;

                    const tree = queryRef.current.parseReactElement(
                        <Text
                            text="Type something..."
                            fontSize={18}
                            position={shouldUseAbsolute ? "absolute" : "relative"}
                            left={shouldUseAbsolute ? `${finalLeft}px` : "auto"}
                            top={shouldUseAbsolute ? `${finalTop}px` : "auto"}
                            width={shouldUseAbsolute ? `${finalWidth}px` : flowWidth}
                            height={shouldUseAbsolute && finalHeight > 20 ? `${finalHeight}px` : undefined}
                        />
                    ).toNodeTree();

                    (actionsRef.current as any).addNodeTree(tree, normalizedTargetId);

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

    if (!previewRect || !previewHost) return null;
    const hostRect = previewHost.getBoundingClientRect();
    const relativeLeft = previewRect.left - hostRect.left + previewHost.scrollLeft;
    const relativeTop = previewRect.top - hostRect.top + previewHost.scrollTop;

    return typeof document !== "undefined"
        ? ReactDOM.createPortal(
            <div
                data-panel="text-tool-preview"
                style={{
                    position: "absolute",
                    left: relativeLeft,
                    top: relativeTop,
                    width: previewRect.width,
                    height: previewRect.height,
                    border: "1px dashed #3b82f6",
                    backgroundColor: "rgba(59, 130, 246, 0.06)",
                    pointerEvents: "none",
                    zIndex: 10000,
                    borderRadius: 2,
                }}
            />,
            previewHost
        )
        : null;
};
