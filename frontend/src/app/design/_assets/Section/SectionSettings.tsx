import React from "react";
import { useNode } from "@craftjs/core";
import { SettingsSection } from "../../_components/rightPanel/settings/SettingsSection";
import { AutoLayoutGroup } from "../../_components/rightPanel/settings/AutoLayoutGroup";
import { SizePositionGroup } from "../../_components/rightPanel/settings/SizePositionGroup";
import { AppearanceGroup } from "../../_components/rightPanel/settings/AppearanceGroup";
import { EffectsGroup } from "../../_components/rightPanel/settings/EffectsGroup";
import type { ContainerProps, SetProp } from "../../_types/components";

export const SectionSettings = () => {
  const {
    background,
    paddingLeft, paddingRight, paddingTop, paddingBottom,
    marginLeft, marginRight, marginTop, marginBottom,
    width, height,
    backgroundImage, backgroundSize, backgroundPosition, backgroundRepeat, backgroundOverlay,
    borderRadius, radiusTopLeft, radiusTopRight, radiusBottomRight, radiusBottomLeft,
    borderColor, borderWidth, borderStyle,
    flexDirection, flexWrap, alignItems, justifyContent, gap,
    boxShadow, opacity, overflow,
    actions: { setProp },
  } = useNode((node) => ({
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
    backgroundImage: node.data.props.backgroundImage,
    backgroundSize: node.data.props.backgroundSize,
    backgroundPosition: node.data.props.backgroundPosition,
    backgroundRepeat: node.data.props.backgroundRepeat,
    backgroundOverlay: node.data.props.backgroundOverlay,
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
  }));

  const typedSetProp = setProp as SetProp<ContainerProps>;

  return (
    <div className="flex flex-col pb-4">
      <SettingsSection title="Auto Layout">
        <AutoLayoutGroup
          flexDirection={flexDirection}
          flexWrap={flexWrap}
          alignItems={alignItems}
          justifyContent={justifyContent}
          gap={gap}
          setProp={typedSetProp}
        />
      </SettingsSection>

      <SettingsSection title="Size & Spacing">
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
      </SettingsSection>

      <SettingsSection title="Appearance">
        <AppearanceGroup
          background={background}
          backgroundImage={backgroundImage}
          backgroundSize={backgroundSize}
          backgroundPosition={backgroundPosition}
          backgroundRepeat={backgroundRepeat}
          backgroundOverlay={backgroundOverlay}
          borderColor={borderColor}
          borderWidth={borderWidth}
          borderStyle={borderStyle}
          radiusTopLeft={radiusTopLeft}
          radiusTopRight={radiusTopRight}
          radiusBottomRight={radiusBottomRight}
          radiusBottomLeft={radiusBottomLeft}
          setProp={typedSetProp}
        />
      </SettingsSection>

      <SettingsSection title="Effects" defaultOpen={false}>
        <EffectsGroup
          opacity={opacity}
          boxShadow={boxShadow}
          overflow={overflow}
          setProp={typedSetProp}
        />
      </SettingsSection>
    </div>
  );
};
