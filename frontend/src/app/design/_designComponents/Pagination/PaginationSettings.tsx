import React from "react";
import { useNode } from "@craftjs/core";
import { DesignSection } from "../../_components/rightPanel/settings/DesignSection";
import { SizePositionGroup } from "../../_components/rightPanel/settings/SizePositionGroup";
import { TypographyGroup } from "../../_components/rightPanel/settings/TypographyGroup";
import { AppearanceGroup } from "../../_components/rightPanel/settings/AppearanceGroup";
import { EffectsGroup } from "../../_components/rightPanel/settings/EffectsGroup";
import type { PaginationProps, SetProp } from "../../_types/components";

export const PaginationSettings = () => {
    const {
        totalItems, itemsPerPage, currentPage, type,
        activeColor, gap, prevText, nextText,
        width, height, fontSize, fontWeight, color, textAlign,
        background, borderRadius, radiusTopLeft, radiusTopRight, radiusBottomRight, radiusBottomLeft,
        borderWidth, borderColor, borderStyle,
        opacity, boxShadow,
        actions: { setProp }
    } = useNode(node => ({
        totalItems: node.data.props.totalItems ?? 50,
        itemsPerPage: node.data.props.itemsPerPage ?? 10,
        currentPage: node.data.props.currentPage ?? 1,
        type: node.data.props.type ?? "numbers",
        activeColor: node.data.props.activeColor ?? "#3b82f6",
        gap: node.data.props.gap ?? 8,
        prevText: node.data.props.prevText ?? "Prev",
        nextText: node.data.props.nextText ?? "Next",
        width: node.data.props.width ?? "auto",
        height: node.data.props.height ?? "auto",
        fontSize: node.data.props.fontSize ?? 14,
        fontWeight: node.data.props.fontWeight ?? "400",
        color: node.data.props.color ?? "#a1a1aa",
        textAlign: node.data.props.textAlign ?? "center",
        background: node.data.props.background ?? "transparent",
        borderRadius: node.data.props.borderRadius ?? 6,
        radiusTopLeft: node.data.props.radiusTopLeft,
        radiusTopRight: node.data.props.radiusTopRight,
        radiusBottomRight: node.data.props.radiusBottomRight,
        radiusBottomLeft: node.data.props.radiusBottomLeft,
        borderWidth: node.data.props.borderWidth ?? 1,
        borderColor: node.data.props.borderColor ?? "#3f3f46",
        borderStyle: node.data.props.borderStyle ?? "solid",
        opacity: node.data.props.opacity ?? 1,
        boxShadow: node.data.props.boxShadow ?? "none",
    }));

    const typedSetProp = setProp as SetProp<PaginationProps>;

    return (
        <div className="flex flex-col pb-4">
            <DesignSection title="Data Logic">
                <div className="flex flex-col gap-3">
                    <div className="flex flex-col gap-1">
                        <label className="text-[10px] text-brand-lighter font-medium">Type</label>
                        <select
                            value={type}
                            onChange={(e) => typedSetProp(p => { p.type = e.target.value as any })}
                            className="w-full bg-brand-medium-dark border border-brand-medium/30 rounded-md text-xs text-brand-lighter p-1.5 focus:outline-none focus:border-brand-blue/50 transition-colors"
                        >
                            <option value="numbers">Numbers</option>
                            <option value="simple">Simple (Back/Next)</option>
                            <option value="load-more">Load More Button</option>
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                        <div className="flex flex-col gap-1">
                            <label className="text-[10px] text-brand-lighter font-medium">Total Items</label>
                            <input
                                type="number"
                                value={totalItems}
                                onChange={(e) => typedSetProp(p => { p.totalItems = Number(e.target.value) })}
                                className="w-full bg-brand-medium-dark border border-brand-medium/30 rounded-md text-xs text-brand-lighter p-1.5 focus:outline-none focus:border-brand-blue/50 transition-colors"
                            />
                        </div>
                        <div className="flex flex-col gap-1">
                            <label className="text-[10px] text-brand-lighter font-medium">Per Page</label>
                            <input
                                type="number"
                                value={itemsPerPage}
                                onChange={(e) => typedSetProp(p => { p.itemsPerPage = Number(e.target.value) })}
                                className="w-full bg-brand-medium-dark border border-brand-medium/30 rounded-md text-xs text-brand-lighter p-1.5 focus:outline-none focus:border-brand-blue/50 transition-colors"
                            />
                        </div>
                        <div className="flex flex-col gap-1">
                            <label className="text-[10px] text-brand-lighter font-medium">Current Page</label>
                            <input
                                type="number"
                                value={currentPage}
                                onChange={(e) => typedSetProp(p => { p.currentPage = Number(e.target.value) })}
                                className="w-full bg-brand-medium-dark border border-brand-medium/30 rounded-md text-xs text-brand-lighter p-1.5 focus:outline-none focus:border-brand-blue/50 transition-colors"
                            />
                        </div>
                    </div>
                </div>
            </DesignSection>

            <DesignSection title="Pagination Colors">
                <div className="flex flex-col gap-3">
                    <div className="flex flex-col gap-1">
                        <label className="text-[10px] text-brand-lighter font-medium">Active Page Color</label>
                        <div className="flex gap-2 items-center">
                            <input
                                type="color"
                                value={activeColor}
                                onChange={(e) => typedSetProp(p => { p.activeColor = e.target.value })}
                                className="w-8 h-8 rounded-lg border border-brand-medium/30 bg-transparent cursor-pointer overflow-hidden p-0"
                            />
                            <input
                                type="text"
                                value={activeColor}
                                onChange={(e) => typedSetProp(p => { p.activeColor = e.target.value })}
                                className="flex-1 bg-brand-medium-dark border border-brand-medium/30 rounded-md text-[11px] text-brand-lighter p-1.5 focus:outline-none focus:border-brand-blue/50 transition-colors"
                            />
                        </div>
                    </div>

                    <div className="flex flex-col gap-1">
                        <label className="text-[10px] text-brand-lighter font-medium">Spacing (Gap)</label>
                        <input
                            type="number"
                            value={gap}
                            onChange={(e) => typedSetProp(p => { p.gap = Number(e.target.value) })}
                            className="w-full bg-brand-medium-dark border border-brand-medium/30 rounded-md text-xs text-brand-lighter p-1.5 focus:outline-none focus:border-brand-blue/50 transition-colors"
                        />
                    </div>
                </div>
            </DesignSection>

            <DesignSection title="Labels & Text">
                <div className="grid grid-cols-2 gap-2 mb-4">
                    <div className="flex flex-col gap-1">
                        <label className="text-[10px] text-brand-lighter font-medium">Prev Label</label>
                        <input
                            type="text"
                            value={prevText}
                            onChange={(e) => typedSetProp(p => { p.prevText = e.target.value })}
                            className="w-full bg-brand-medium-dark border border-brand-medium/30 rounded-md text-xs text-brand-lighter p-1.5 focus:outline-none focus:border-brand-blue/50 transition-colors"
                        />
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="text-[10px] text-brand-lighter font-medium">Next Label</label>
                        <input
                            type="text"
                            value={nextText}
                            onChange={(e) => typedSetProp(p => { p.nextText = e.target.value })}
                            className="w-full bg-brand-medium-dark border border-brand-medium/30 rounded-md text-xs text-brand-lighter p-1.5 focus:outline-none focus:border-brand-blue/50 transition-colors"
                        />
                    </div>
                </div>
                <TypographyGroup
                    fontSize={fontSize}
                    fontWeight={fontWeight}
                    color={color}
                    textAlign={textAlign}
                    setProp={typedSetProp}
                />
            </DesignSection>

            <DesignSection title="Box Appearance" defaultOpen={false}>
                <AppearanceGroup
                    background={background}
                    borderRadius={borderRadius}
                    radiusTopLeft={radiusTopLeft}
                    radiusTopRight={radiusTopRight}
                    radiusBottomRight={radiusBottomRight}
                    radiusBottomLeft={radiusBottomLeft}
                    borderWidth={borderWidth}
                    borderColor={borderColor}
                    borderStyle={borderStyle}
                    setProp={typedSetProp}
                />
            </DesignSection>

            <DesignSection title="Size & Effects" defaultOpen={false}>
                <SizePositionGroup
                    width={width}
                    height={height}
                    setProp={typedSetProp}
                />
                <div className="mt-4">
                    <EffectsGroup
                        opacity={opacity}
                        boxShadow={boxShadow}
                        setProp={typedSetProp as any}
                    />
                </div>
            </DesignSection>
        </div>
    );
};
