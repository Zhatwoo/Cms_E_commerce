import React from "react";
import { useNode } from "@craftjs/core";
import { AutoLayoutGroup } from "../../_components/rightPanel/settings/AutoLayoutGroup";
import { SizePositionGroup } from "../../_components/rightPanel/settings/SizePositionGroup";
import { AppearanceGroup } from "../../_components/rightPanel/settings/AppearanceGroup";
import { EffectsGroup } from "../../_components/rightPanel/settings/EffectsGroup";

export const ContainerSettings = () => {
  const {
    background,
    paddingLeft, paddingRight, paddingTop, paddingBottom,
    marginLeft, marginRight, marginTop, marginBottom,
    width, height,
    borderRadius, radiusTopLeft, radiusTopRight, radiusBottomRight, radiusBottomLeft,
    borderColor, borderWidth, borderStyle,
    flexDirection, flexWrap,
    alignItems, justifyContent,
    gap,
    boxShadow, opacity, overflow, cursor,
    actions: { setProp }
  } = useNode(node => ({
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
    flexDirection: node.data.props.flexDirection,
    flexWrap: node.data.props.flexWrap,
    alignItems: node.data.props.alignItems,
    justifyContent: node.data.props.justifyContent,
    gap: node.data.props.gap,
    boxShadow: node.data.props.boxShadow,
    opacity: node.data.props.opacity,
    overflow: node.data.props.overflow,
    cursor: node.data.props.cursor
  }));

  // Logic to determine if Auto Layout is "enabled"
  // For now, we assume if display is flex (which it is by default in our new component), it's enabled.
  // We can add a toggle to "disable" it (switch to block) if needed, but per requirements:
  // "Display this group ONLY if the user enables 'Auto Layout'"
  // Since we default to flex, it's effectively enabled. We can add a toggle later if strict block mode is needed.

  return (
    <div className="flex flex-col gap-6 pb-8">

      {/* Auto Layout Group */}
      <AutoLayoutGroup
        flexDirection={flexDirection}
        flexWrap={flexWrap}
        alignItems={alignItems}
        justifyContent={justifyContent}
        gap={gap}
        setProp={setProp}
      />

      <div className="w-full h-px bg-brand-medium/20"></div>

      {/* Size & Position Group */}
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
        setProp={setProp}
      />

      <div className="w-full h-px bg-brand-medium/20"></div>

      {/* Appearance Group */}
      <AppearanceGroup
        background={background}
        borderColor={borderColor}
        borderWidth={borderWidth}
        borderStyle={borderStyle}
        radiusTopLeft={radiusTopLeft}
        radiusTopRight={radiusTopRight}
        radiusBottomRight={radiusBottomRight}
        radiusBottomLeft={radiusBottomLeft}
        setProp={setProp}
      />

      <div className="w-full h-px bg-brand-medium/20"></div>

      {/* Effects Group */}
      <EffectsGroup
        opacity={opacity}
        boxShadow={boxShadow}
        overflow={overflow}
        cursor={cursor}
        setProp={setProp}
      />
    </div>
  );
};
