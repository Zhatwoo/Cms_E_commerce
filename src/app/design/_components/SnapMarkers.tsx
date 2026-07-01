"use client";

import React from "react";
import { useSnapGuides } from "./CanvasToolContext";

export const SnapMarkers = () => {
    const { snapGuides } = useSnapGuides();

    if (!snapGuides || snapGuides.length === 0) return null;

    return (
        <div 
            style={{
                position: "fixed",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                pointerEvents: "none",
                zIndex: 9999,
            }}
        >
            {snapGuides.map((guide, i) => {
                const isVertical = guide.type === "vertical";
                const isHorizontal = guide.type === "horizontal";
                const isRect = guide.type === "rect";
                
                if (isRect && guide.rect) {
                    return (
                        <div
                            key={i}
                            style={{
                                position: "absolute",
                                border: "1px solid #3b82f6",
                                left: guide.rect.left,
                                top: guide.rect.top,
                                width: guide.rect.width,
                                height: guide.rect.height,
                                boxSizing: "border-box",
                                boxShadow: "0 0 0 1px rgba(59, 130, 246, 0.3)",
                            }}
                        />
                    );
                }

                if ((isVertical || isHorizontal) && guide.pos !== undefined && guide.start !== undefined && guide.end !== undefined) {
                    return (
                        <div
                            key={i}
                            style={{
                                position: "absolute",
                                backgroundColor: "#FF4D6D",
                                ...(isVertical ? {
                                    left: guide.pos,
                                    top: guide.start,
                                    height: guide.end - guide.start,
                                    width: 1,
                                } : {
                                    top: guide.pos,
                                    left: guide.start,
                                    width: guide.end - guide.start,
                                    height: 1,
                                })
                            }}
                        />
                    );
                }

                return null;
            })}

        </div>
    );
};
