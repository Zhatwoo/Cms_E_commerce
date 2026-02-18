import React from "react";
import { useNode } from "@craftjs/core";
import { DesignSection } from "@/app/design/_components/rightPanel/settings/DesignSection";
import { SizePositionGroup } from "@/app/design/_components/rightPanel/settings/SizePositionGroup";
import { AppearanceGroup } from "@/app/design/_components/rightPanel/settings/AppearanceGroup";
import { PositionGroup } from "@/app/design/_components/rightPanel/settings/PositionGroup";
import { EffectsGroup } from "@/app/design/_components/rightPanel/settings/EffectsGroup";
import type { CircleProps, SetProp } from "@/app/design/_types/components";

export const ShapeSettings = () => {
  const {
    width,
    height,
    paddingLeft, paddingRight, paddingTop, paddingBottom,
    marginLeft, marginRight, marginTop, marginBottom,
    background,
    borderColor, borderWidth, borderStyle,
    radiusTopLeft, radiusTopRight, radiusBottomRight, radiusBottomLeft,
    position, display, zIndex, top, right, bottom, left, editorVisibility,
    boxShadow, opacity, overflow, cursor,
    actions: { setProp },
  } = useNode((node) => ({
    width: node.data.props.width,
    height: node.data.props.height,
    paddingLeft: node.data.props.paddingLeft,
    paddingRight: node.data.props.paddingRight,
    paddingTop: node.data.props.paddingTop,
    paddingBottom: node.data.props.paddingBottom,
    marginLeft: node.data.props.marginLeft,
    marginRight: node.data.props.marginRight,
    marginTop: node.data.props.marginTop,
    marginBottom: node.data.props.marginBottom,
    background: node.data.props.background,
    borderColor: node.data.props.borderColor,
    borderWidth: node.data.props.borderWidth,
    borderStyle: node.data.props.borderStyle,
    radiusTopLeft: node.data.props.radiusTopLeft,
    radiusTopRight: node.data.props.radiusTopRight,
    radiusBottomRight: node.data.props.radiusBottomRight,
    radiusBottomLeft: node.data.props.radiusBottomLeft,
    position: node.data.props.position,
    display: node.data.props.display,
    zIndex: node.data.props.zIndex,
    top: node.data.props.top,
    right: node.data.props.right,
    bottom: node.data.props.bottom,
    left: node.data.props.left,
    editorVisibility: node.data.props.editorVisibility,
    boxShadow: node.data.props.boxShadow,
    opacity: node.data.props.opacity,
    overflow: node.data.props.overflow,
    cursor: node.data.props.cursor,
  }));

  const typedSetProp = setProp as SetProp<CircleProps>;

  return (
    <div className="flex flex-col pb-4">
      <DesignSection title="Size & Position">
        <SizePositionGroup
          width={typeof width === "number" ? `${width}px` : width}
          height={typeof height === "number" ? `${height}px` : height}
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

      <DesignSection title="Position & Display" defaultOpen={false}>
        <PositionGroup
          position={position}
          display={display}
          zIndex={zIndex}
          top={top}
          right={right}
          bottom={bottom}
          left={left}
          editorVisibility={editorVisibility}
          setProp={typedSetProp}
        />
      </DesignSection>

      <DesignSection title="Appearance">
        <AppearanceGroup
          background={background}
          borderColor={borderColor}
          borderWidth={borderWidth}
          borderStyle={borderStyle}
          radiusTopLeft={radiusTopLeft}
          radiusTopRight={radiusTopRight}
          radiusBottomRight={radiusBottomRight}
          radiusBottomLeft={radiusBottomLeft}
          setProp={typedSetProp}
        />
      </DesignSection>

      <DesignSection title="Effects" defaultOpen={false}>
        <EffectsGroup
          opacity={opacity}
          boxShadow={boxShadow}
          overflow={overflow}
          cursor={cursor}
          setProp={typedSetProp}
        />
      </DesignSection>
    </div>
  );
};

