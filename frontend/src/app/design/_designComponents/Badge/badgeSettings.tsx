import React from "react";
import { useNode } from "@craftjs/core";
import { DesignSection } from "../../_components/rightPanel/settings/DesignSection";
import { LayoutLayerGroup } from "../../_components/rightPanel/settings/LayoutLayerGroup";
import { SizePositionGroup } from "../../_components/rightPanel/settings/SizePositionGroup";
import { AppearanceGroup } from "../../_components/rightPanel/settings/AppearanceGroup";
import { EffectsGroup } from "../../_components/rightPanel/settings/EffectsGroup";
import { TypographyGroup } from "../../_components/rightPanel/settings/TypographyGroup";
import type { SetProp, TypographyProps } from "../../_types/components";
import type { BadgeProps } from "./badge";

export const BadgeSettings = () => {
  const {
    id,
    text,
    fontFamily,
    fontWeight,
    fontStyle,
    fontSize,
    lineHeight,
    letterSpacing,
    textAlign,
    textTransform,
    textDecoration,
    color,
    background,
    paddingLeft,
    paddingRight,
    paddingTop,
    paddingBottom,
    marginLeft,
    marginRight,
    marginTop,
    marginBottom,
    width,
    height,
    borderRadius,
    radiusTopLeft,
    radiusTopRight,
    radiusBottomRight,
    radiusBottomLeft,
    borderColor,
    borderWidth,
    borderStyle,
    strokePlacement,
    flexDirection,
    flexWrap,
    alignItems,
    justifyContent,
    gap,
    position,
    display,
    isFreeform,
    alignSelf,
    zIndex,
    top,
    right,
    bottom,
    left,
    editorVisibility,
    boxShadow,
    opacity,
    overflow,
    actions: { setProp },
  } = useNode((node) => ({
    id: node.id,
    text: node.data.props.text,
    fontFamily: node.data.props.fontFamily,
    fontWeight: node.data.props.fontWeight,
    fontStyle: node.data.props.fontStyle,
    fontSize: node.data.props.fontSize,
    lineHeight: node.data.props.lineHeight,
    letterSpacing: node.data.props.letterSpacing,
    textAlign: node.data.props.textAlign,
    textTransform: node.data.props.textTransform,
    textDecoration: node.data.props.textDecoration,
    color: node.data.props.color,
    background: node.data.props.background,
    paddingLeft: node.data.props.paddingLeft,
    paddingRight: node.data.props.paddingRight,
    paddingTop: node.data.props.paddingTop,
    paddingBottom: node.data.props.paddingBottom,
    marginLeft: node.data.props.marginLeft,
    marginRight: node.data.props.marginRight,
    marginTop: node.data.props.marginTop,
    marginBottom: node.data.props.marginBottom,
    width: node.data.props.width,
    height: node.data.props.height,
    borderRadius: node.data.props.borderRadius,
    radiusTopLeft: node.data.props.radiusTopLeft,
    radiusTopRight: node.data.props.radiusTopRight,
    radiusBottomRight: node.data.props.radiusBottomRight,
    radiusBottomLeft: node.data.props.radiusBottomLeft,
    borderColor: node.data.props.borderColor,
    borderWidth: node.data.props.borderWidth,
    borderStyle: node.data.props.borderStyle,
    strokePlacement: node.data.props.strokePlacement,
    flexDirection: node.data.props.flexDirection,
    flexWrap: node.data.props.flexWrap,
    alignItems: node.data.props.alignItems,
    justifyContent: node.data.props.justifyContent,
    gap: node.data.props.gap,
    position: node.data.props.position,
    display: node.data.props.display,
    isFreeform: node.data.props.isFreeform,
    alignSelf: node.data.props.alignSelf,
    zIndex: node.data.props.zIndex,
    top: node.data.props.top,
    right: node.data.props.right,
    bottom: node.data.props.bottom,
    left: node.data.props.left,
    editorVisibility: node.data.props.editorVisibility,
    boxShadow: node.data.props.boxShadow,
    opacity: node.data.props.opacity,
    overflow: node.data.props.overflow,
  }));

  const typedSetProp = setProp as SetProp<BadgeProps>;

  return (
    <div className="flex flex-col pb-4">
      <DesignSection title="Badge" defaultOpen={true}>
        <div className="flex flex-col gap-1">
          <label className="text-[10px] text-[var(--builder-text)]">Label</label>
          <input
            type="text"
            value={typeof text === "string" ? text : ""}
            onChange={(e) => typedSetProp((props) => { props.text = e.target.value; })}
            className="w-full bg-[var(--builder-surface-2)] border border-[var(--builder-border)] rounded-md text-xs text-[var(--builder-text)] p-2 focus:outline-none focus:border-[var(--builder-accent)]"
          />
        </div>
      </DesignSection>

      <DesignSection title="Layout & Layer" defaultOpen={false}>
        <LayoutLayerGroup
          nodeId={id}
          position={position}
          display={display}
          isFreeform={isFreeform}
          alignSelf={alignSelf}
          zIndex={zIndex}
          top={top}
          right={right}
          bottom={bottom}
          left={left}
          editorVisibility={editorVisibility}
          flexDirection={flexDirection}
          flexWrap={flexWrap}
          alignItems={alignItems}
          justifyContent={justifyContent}
          gap={gap}
          setProp={typedSetProp as any}
        />
      </DesignSection>

      <DesignSection title="Size & Spacing">
        <div className="flex flex-col gap-3">
          <SizePositionGroup
            width={width}
            height={height}
            paddingLeft={paddingLeft}
            paddingRight={paddingRight}
            paddingTop={paddingTop}
            paddingBottom={paddingBottom}
            marginLeft={marginLeft}
            marginRight={marginRight}
            marginTop={marginTop}
            marginBottom={marginBottom}
            setProp={typedSetProp}
          />
        </div>
      </DesignSection>

      <DesignSection title="Appearance">
        <AppearanceGroup
          background={background}
          borderColor={borderColor}
          borderWidth={borderWidth}
          borderStyle={borderStyle}
          strokePlacement={strokePlacement}
          radiusTopLeft={radiusTopLeft}
          radiusTopRight={radiusTopRight}
          radiusBottomRight={radiusBottomRight}
          radiusBottomLeft={radiusBottomLeft}
          enableMediaFillModes={true}
          borderRadius={borderRadius}
          setProp={typedSetProp}
        />
      </DesignSection>

      <DesignSection title="Typography">
        <TypographyGroup
          fontFamily={fontFamily}
          fontWeight={fontWeight}
          fontStyle={fontStyle}
          fontSize={fontSize}
          lineHeight={lineHeight}
          letterSpacing={letterSpacing}
          textAlign={textAlign}
          textTransform={textTransform}
          textDecoration={textDecoration}
          color={color}
          setProp={typedSetProp as unknown as SetProp<TypographyProps>}
        />
      </DesignSection>

      <DesignSection title="Effects" defaultOpen={false}>
        <EffectsGroup
          opacity={opacity}
          boxShadow={boxShadow}
          overflow={overflow}
          setProp={typedSetProp}
        />
      </DesignSection>
    </div>
  );
};
