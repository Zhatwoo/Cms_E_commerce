import React, { useEffect } from "react";
import { useNode, useEditor } from "@craftjs/core";
import { SpacerSettings } from "./SpacerSettings";
import type { SpacerProps } from "../../_types/components";

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
}: SpacerProps) => {
    const { connectors: { connect, drag } } = useNode();

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

    const effectiveDisplay =
        editorVisibility === "hide"
            ? "none"
            : editorVisibility === "show" && display === "none"
                ? "block"
                : display;

    return (
        <div
            ref={(ref) => {
                if (ref) connect(drag(ref));
            }}
            className={`relative group ${borderWidth === 0 ? "border border-dashed border-brand-medium/10 hover:border-brand-medium/30" : ""} transition-colors ${customClassName}`}
            style={{
                width,
                height,
                paddingTop: `${pt}px`,
                paddingRight: `${pr}px`,
                paddingBottom: `${pb}px`,
                paddingLeft: `${pl}px`,
                marginTop: `${mt}px`,
                marginRight: `${mr}px`,
                marginBottom: `${mb}px`,
                marginLeft: `${ml}px`,
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
                position,
                display: effectiveDisplay,
                zIndex: zIndex !== 0 ? zIndex : undefined,
                top: position !== "static" ? top : undefined,
                right: position !== "static" ? right : undefined,
                bottom: position !== "static" ? bottom : undefined,
                left: position !== "static" ? left : undefined,
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
