import React from "react";
import { useNode } from "@craftjs/core";
import { DesignSection } from "../../_components/rightPanel/settings/DesignSection";
import { AutoLayoutGroup } from "../../_components/rightPanel/settings/AutoLayoutGroup";
import { TransformGroup } from "../../_components/rightPanel/settings/TransformGroup";
import { PositionGroup } from "../../_components/rightPanel/settings/PositionGroup";
import { SizePositionGroup } from "../../_components/rightPanel/settings/SizePositionGroup";
import { AppearanceGroup } from "../../_components/rightPanel/settings/AppearanceGroup";
import { EffectsGroup } from "../../_components/rightPanel/settings/EffectsGroup";
import type { ContainerProps, SetProp } from "../../_types/components";

export const ColumnSettings = () => {
  const {
    background,
    paddingLeft, paddingRight, paddingTop, paddingBottom,
    marginLeft, marginRight, marginTop, marginBottom,
    width, height,
    borderRadius, radiusTopLeft, radiusTopRight, radiusBottomRight, radiusBottomLeft,
    borderColor, borderWidth, borderStyle, strokePlacement,
    flexDirection, flexWrap, alignItems, justifyContent, gap,
    boxShadow, opacity, overflow,
    rotation, flipHorizontal, flipVertical,
    position, display, zIndex, top, right, bottom, left, editorVisibility,
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
    boxShadow: node.data.props.boxShadow,
    opacity: node.data.props.opacity,
    overflow: node.data.props.overflow,
    rotation: node.data.props.rotation,
    flipHorizontal: node.data.props.flipHorizontal,
    flipVertical: node.data.props.flipVertical,
    position: node.data.props.position,
    display: node.data.props.display,
    zIndex: node.data.props.zIndex,
    top: node.data.props.top,
    right: node.data.props.right,
    bottom: node.data.props.bottom,
    left: node.data.props.left,
    editorVisibility: node.data.props.editorVisibility,
  }));

  const typedSetProp = setProp as SetProp<ContainerProps>;

  return (
    <div className="flex flex-col pb-4">
      <DesignSection title="Auto Layout">
        <AutoLayoutGroup
          flexDirection={flexDirection}
          flexWrap={flexWrap}
          alignItems={alignItems}
          justifyContent={justifyContent}
          gap={gap}
          setProp={typedSetProp}
        />
      </DesignSection>

      <DesignSection title="Transform" defaultOpen={false}>
        <TransformGroup
          rotation={rotation}
          flipHorizontal={flipHorizontal}
          flipVertical={flipVertical}
          setProp={typedSetProp}
        />
      </DesignSection>

      <DesignSection title="Layout & Layer" defaultOpen={false}>
        <PositionGroup
          position={position}
          display={display}
          zIndex={zIndex}
          top={top}
          right={right}
          bottom={bottom}
          left={left}
          editorVisibility={editorVisibility}
          setProp={typedSetProp as any}
        />
      </DesignSection>

      <DesignSection title="Size & Spacing">
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
          setProp={typedSetProp}
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
