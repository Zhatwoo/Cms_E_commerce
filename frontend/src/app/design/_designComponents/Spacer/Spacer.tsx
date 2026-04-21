import React, { useEffect } from "react";
import { useNode, useEditor } from "@craftjs/core";
import { SpacerSettings } from "./SpacerSettings";
import type { SpacerProps } from "../../_types/components";

function fluidSpace(value: number, min = 0): string {
    if (!Number.isFinite(value) || value <= 0) return `${value || 0}px`;
    const preferred = Math.max(0.1, value / 12);
    const floor = Math.max(min, Math.round(value * 0.45));
    return `clamp(${floor}px, ${preferred.toFixed(2)}cqw, ${value}px)`;
}

export const Spacer = ({
    width = "100%",
    height = "20px",
    padding = 0,
    paddingTop,
    paddingRight,
    paddingBottom,
    paddingLeft,
    margin = 0,
    marginTop,
    marginRight,
    marginBottom,
    marginLeft,
    rotation = 0,
    flipHorizontal = false,
    flipVertical = false,
    position = "static",
    display = "block",
    zIndex = 0,
    alignSelf = "auto",
    top = "auto",
    right = "auto",
    bottom = "auto",
    left = "auto",
    editorVisibility = "auto",
    visibility = "visible",
    customClassName = "",
    background = "transparent",
    borderRadius = 0,
    radiusTopLeft,
    radiusTopRight,
    radiusBottomRight,
    radiusBottomLeft,
    borderWidth = 0,
    borderColor = "transparent",
    borderStyle = "solid",
    opacity = 1,
    boxShadow = "none",
    overflow = "visible",
    cursor = "default",
    isFreeform,
}: SpacerProps) => {
    const { id, connectors: { connect, drag } } = useNode();

    // Resolve spacing
    const p = typeof padding === "number" ? padding : 0;
    const pt = paddingTop ?? p;
    const pr = paddingRight ?? p;
    const pb = paddingBottom ?? p;
    const pl = paddingLeft ?? p;

    const m = typeof margin === "number" ? margin : 0;
    const mt = marginTop ?? m;
    const mr = marginRight ?? m;
    const mb = marginBottom ?? m;
    const ml = marginLeft ?? m;

    // Resolve border radius
    const br = borderRadius || 0;
    const rtl = radiusTopLeft ?? br;
    const rtr = radiusTopRight ?? br;
    const rbr = radiusBottomRight ?? br;
    const rbl = radiusBottomLeft ?? br;

    const effectiveDisplay = isFreeform
        ? "block"
        : editorVisibility === "hide"
            ? "none"
            : editorVisibility === "show" && display === "none"
                ? "block"
                : display;

    return (
        <div
            ref={(ref) => {
                if (ref) connect(drag(ref));
            }}
            data-node-id={id}
            data-fluid-space="true"
            className={`relative group ${borderWidth === 0 ? "border border-dashed border-brand-medium/10 hover:border-brand-medium/30" : ""} transition-colors ${customClassName}`}
            style={{
                width,
                height: fluidSpace(height as any),
                paddingTop: fluidSpace(pt),
                paddingRight: fluidSpace(pr),
                paddingBottom: fluidSpace(pb),
                paddingLeft: fluidSpace(pl),
                marginTop: fluidSpace(mt),
                marginRight: fluidSpace(mr),
                marginBottom: fluidSpace(mb),
                marginLeft: fluidSpace(ml),
                display: effectiveDisplay,
                position,
                alignSelf,
                zIndex: zIndex !== 0 ? zIndex : undefined,
                top: position !== "static" ? top : undefined,
                right: position !== "static" ? right : undefined,
                bottom: position !== "static" ? bottom : undefined,
                left: position !== "static" ? left : undefined,
                background,
                borderTopLeftRadius: `${rtl}px`,
                borderTopRightRadius: `${rtr}px`,
                borderBottomRightRadius: `${rbr}px`,
                borderBottomLeftRadius: `${rbl}px`,
                borderWidth: `${borderWidth}px`,
                borderColor,
                borderStyle,
                opacity,
                boxShadow,
                overflow,
                cursor,
                visibility: visibility === "hidden" ? "hidden" : "visible",
                transform: [rotation ? `rotate(${rotation}deg)` : null, flipHorizontal ? "scaleX(-1)" : null, flipVertical ? "scaleY(-1)" : null].filter(Boolean).join(" ") || undefined,
            }}
        >
            <div className="w-full h-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-brand-medium/5">
                <span className="text-[10px] text-brand-medium uppercase font-bold tracking-widest pointer-events-none">Spacer</span>
            </div>
        </div>
    );
};

export const SpacerDefaultProps: Partial<SpacerProps> = {
    width: "100%",
    height: "20px",
    padding: 0,
    margin: 0,
    background: "transparent",
    opacity: 1,
};

Spacer.craft = {
    displayName: "Spacer",
    props: SpacerDefaultProps,
    rules: {
        canMoveIn: () => false,
    },
    related: {
        settings: SpacerSettings,
    },
};
