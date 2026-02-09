import React from "react";
import { useNode } from "@craftjs/core";
import { SettingsSection } from "../../_components/rightPanel/settings/SettingsSection";
import { AutoLayoutGroup } from "../../_components/rightPanel/settings/AutoLayoutGroup";
import { GridLayoutGroup } from "../../_components/rightPanel/settings/GridLayoutGroup";
import { SizePositionGroup } from "../../_components/rightPanel/settings/SizePositionGroup";
import { AppearanceGroup } from "../../_components/rightPanel/settings/AppearanceGroup";
import { PositionGroup } from "../../_components/rightPanel/settings/PositionGroup";
import { EffectsGroup } from "../../_components/rightPanel/settings/EffectsGroup";
import type { ContainerProps, SetProp } from "../../_types/components";

export const ContainerSettings = () => {
  const {
    background,
    paddingLeft, paddingRight, paddingTop, paddingBottom,
    marginLeft, marginRight, marginTop, marginBottom,
    width, height,
    backgroundImage, backgroundSize, backgroundPosition, backgroundRepeat, backgroundOverlay,
    borderRadius, radiusTopLeft, radiusTopRight, radiusBottomRight, radiusBottomLeft,
    borderColor, borderWidth, borderStyle,
    flexDirection, flexWrap,
    alignItems, justifyContent,
    gap,
    gridTemplateColumns, gridTemplateRows, gridGap, gridColumnGap, gridRowGap, gridAutoRows, gridAutoFlow,
    position, display, zIndex, top, right, bottom, left,
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
    gridTemplateColumns: node.data.props.gridTemplateColumns,
    gridTemplateRows: node.data.props.gridTemplateRows,
    gridGap: node.data.props.gridGap,
    gridColumnGap: node.data.props.gridColumnGap,
    gridRowGap: node.data.props.gridRowGap,
    gridAutoRows: node.data.props.gridAutoRows,
    gridAutoFlow: node.data.props.gridAutoFlow,
    position: node.data.props.position,
    display: node.data.props.display,
    zIndex: node.data.props.zIndex,
    top: node.data.props.top,
    right: node.data.props.right,
    bottom: node.data.props.bottom,
    left: node.data.props.left,
    boxShadow: node.data.props.boxShadow,
    opacity: node.data.props.opacity,
    overflow: node.data.props.overflow,
    cursor: node.data.props.cursor
  }));

  const typedSetProp = setProp as SetProp<ContainerProps>;

  return (
    <div className="flex flex-col pb-4">
      {display === "grid" ? (
        <SettingsSection title="Grid Layout">
          <GridLayoutGroup
            gridTemplateColumns={gridTemplateColumns}
            gridTemplateRows={gridTemplateRows}
            gridGap={gridGap}
            gridColumnGap={gridColumnGap}
            gridRowGap={gridRowGap}
            gridAutoRows={gridAutoRows}
            gridAutoFlow={gridAutoFlow}
            setProp={typedSetProp}
          />
        </SettingsSection>
      ) : display === "flex" ? (
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
      ) : null}

      <SettingsSection title="Size & Position">
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

      <SettingsSection title="Position & Display" defaultOpen={false}>
        <PositionGroup
          position={position}
          display={display}
          zIndex={zIndex}
          top={top}
          right={right}
          bottom={bottom}
          left={left}
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
          cursor={cursor}
          setProp={typedSetProp}
        />
      </SettingsSection>
    </div>
  );
};
