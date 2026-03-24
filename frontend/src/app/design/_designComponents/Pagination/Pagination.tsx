import * as React from "react";
import { useNode } from "@craftjs/core";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { PaginationSettings } from "./PaginationSettings";
import type { PaginationProps } from "../../_types/components";

function fluidSpace(value: number, min = 0): string {
    if (!Number.isFinite(value) || value <= 0) return `${value || 0}px`;
    const preferred = Math.max(0.1, value / 12);
    const floor = Math.max(min, Math.round(value * 0.45));
    return `clamp(${floor}px, ${preferred.toFixed(2)}cqw, ${value}px)`;
}

export const Pagination = ({
    totalItems = 50,
    itemsPerPage = 10,
    currentPage = 1,
    type = "numbers",
    activeColor = "#3b82f6", // brand-blue
    buttonVariant = "outline",
    gap = 8,
    prevText = "Prev",
    nextText = "Next",
    showIcons = true,
    width = "auto",
    height = "auto",
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
    color = "#a1a1aa", // text color
    fontSize = 14,
    fontWeight = "400",
    textAlign = "center",
    // Appearance props
    background = "transparent",
    borderRadius = 6,
    radiusTopLeft,
    radiusTopRight,
    radiusBottomRight,
    radiusBottomLeft,
    borderWidth = 1,
    borderColor = "#3f3f46", // zinc-700 / brand-medium/30
    borderStyle = "solid",
    opacity = 1,
    boxShadow = "none",
    overflow = "visible",
    cursor = "default",
    position = "relative",
    top = "auto",
    right = "auto",
    bottom = "auto",
    left = "auto",
    zIndex = 0,
    display,
    editorVisibility = "auto",
    rotation = 0,
    flipHorizontal = false,
    flipVertical = false,
}: PaginationProps) => {
    const { connectors: { connect, drag } } = useNode();
    const id = useNode((node) => node.id);

    const totalPages = Math.ceil(totalItems / itemsPerPage);

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
    const fluidFontSize = `clamp(${Math.max(10, Math.round(fontSize * 0.8))}px, ${(fontSize / 16 * 2.1).toFixed(2)}cqw, ${fontSize}px)`;

    const effectiveDisplay =
        editorVisibility === "hide"
            ? "none"
            : editorVisibility === "show" && display === "none"
                ? "inline-flex"
                : (display ?? "inline-flex");

    const transformStyle =
        [
            rotation ? `rotate(${rotation}deg)` : null,
            flipHorizontal ? "scaleX(-1)" : null,
            flipVertical ? "scaleY(-1)" : null,
        ]
            .filter(Boolean)
            .join(" ") || undefined;

    // Render logic for different types
    const renderContent = () => {
        if (type === "load-more") {
            return (
                <button
                    className="px-6 py-2 transition-all active:scale-95 hover:bg-brand-medium/10 font-medium"
                    style={{
                        fontSize: fluidFontSize,
                        fontWeight,
                        color,
                        backgroundColor: background,
                        borderWidth: `${borderWidth}px`,
                        borderColor,
                        borderStyle,
                        borderTopLeftRadius: `${rtl}px`,
                        borderTopRightRadius: `${rtr}px`,
                        borderBottomRightRadius: `${rbr}px`,
                        borderBottomLeftRadius: `${rbl}px`,
                    }}
                >
                    Load More
                </button>
            );
        }

        const buttonStyle: React.CSSProperties = {
            fontSize: fluidFontSize,
            fontWeight,
            color,
            backgroundColor: background,
            borderWidth: `${borderWidth}px`,
            borderColor,
            borderStyle,
            borderTopLeftRadius: `${rtl}px`,
            borderTopRightRadius: `${rtr}px`,
            borderBottomRightRadius: `${rbr}px`,
            borderBottomLeftRadius: `${rbl}px`,
        };

        return (
            <div className="flex items-center flex-wrap justify-center" style={{ gap: fluidSpace(gap, 4) }}>
                {/* Previous Button */}
                <button
                    className="flex items-center gap-1 p-2 hover:bg-brand-medium/10 disabled:opacity-30 disabled:pointer-events-none transition-colors"
                    style={buttonStyle}
                >
                    {showIcons && <ChevronLeft className="w-4 h-4" />}
                    {prevText && <span>{prevText}</span>}
                </button>

                {/* Page Numbers */}
                {type === "numbers" && (
                    <div className="flex items-center flex-wrap justify-center" style={{ gap: fluidSpace(gap, 4) }}>
                        {[1, 2, 3, "...", totalPages].map((page, i) => {
                            const actualIsActive = page === currentPage;

                            return (
                                <button
                                    key={i}
                                    className={`w-9 h-9 flex items-center justify-center transition-all ${actualIsActive ? "text-white shadow-lg" : "hover:bg-brand-medium/10"
                                        }`}
                                    style={{
                                        ...buttonStyle,
                                        backgroundColor: actualIsActive ? activeColor : background,
                                        borderColor: actualIsActive ? activeColor : borderColor,
                                        fontWeight: actualIsActive ? "700" : fontWeight,
                                        color: actualIsActive ? "#fff" : color,
                                    }}
                                >
                                    {page}
                                </button>
                            );
                        })}
                    </div>
                )}

                {/* Next Button */}
                <button
                    className="flex items-center gap-1 p-2 hover:bg-brand-medium/10 disabled:opacity-30 disabled:pointer-events-none transition-colors"
                    style={buttonStyle}
                >
                    {nextText && <span>{nextText}</span>}
                    {showIcons && <ChevronRight className="w-4 h-4" />}
                </button>
            </div>
        );
    };

    return (
        <div
            ref={(ref) => {
                if (ref) connect(drag(ref));
            }}
            data-node-id={id}
            data-fluid-text="true"
            data-fluid-space="true"
            className="inline-flex"
            style={{
                width,
                height,
                paddingTop: fluidSpace(pt),
                paddingRight: fluidSpace(pr),
                paddingBottom: fluidSpace(pb),
                paddingLeft: fluidSpace(pl),
                marginTop: fluidSpace(mt),
                marginRight: fluidSpace(mr),
                marginBottom: fluidSpace(mb),
                marginLeft: fluidSpace(ml),
                justifyContent: textAlign === "center" ? "center" : textAlign === "right" ? "flex-end" : "flex-start",
                position,
                top: position !== "static" ? top : undefined,
                right: position !== "static" ? right : undefined,
                bottom: position !== "static" ? bottom : undefined,
                left: position !== "static" ? left : undefined,
                zIndex: zIndex !== 0 ? zIndex : undefined,
                display: display ?? "inline-flex",
            }}
        >
            {renderContent()}
        </div>
    );
};

export const PaginationDefaultProps: Partial<PaginationProps> = {
    totalItems: 50,
    itemsPerPage: 10,
    currentPage: 1,
    type: "numbers",
    activeColor: "#3b82f6",
    buttonVariant: "outline",
    gap: 8,
    fontSize: 14,
    fontWeight: "400",
    textAlign: "center",
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#3f3f46",
    background: "transparent",
};

Pagination.craft = {
    displayName: "Pagination",
    props: PaginationDefaultProps,
    related: {
        settings: PaginationSettings,
    },
};
