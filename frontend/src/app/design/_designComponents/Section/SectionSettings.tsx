import React from "react";
import { useNode } from "@craftjs/core";
import { DesignSection } from "../../_components/rightPanel/settings/DesignSection";
import { AutoLayoutGroup } from "../../_components/rightPanel/settings/AutoLayoutGroup";
import { SizePositionGroup } from "../../_components/rightPanel/settings/SizePositionGroup";
import { AppearanceGroup } from "../../_components/rightPanel/settings/AppearanceGroup";
import { PositionGroup } from "../../_components/rightPanel/settings/PositionGroup";
import { EffectsGroup } from "../../_components/rightPanel/settings/EffectsGroup";
import { TransformGroup } from "../../_components/rightPanel/settings/TransformGroup";
import { ProductBindingGroup } from "../../_components/rightPanel/settings/ProductBindingGroup";
import type { SectionProps, SetProp } from "../../_types/components";

export const SectionSettings = () => {
  const {
    background,
    paddingLeft, paddingRight, paddingTop, paddingBottom,
    marginLeft, marginRight, marginTop, marginBottom,
    width, height,
    backgroundImage, backgroundSize, backgroundPosition, backgroundRepeat, backgroundOverlay, backgroundVideo,
    radiusTopLeft, radiusTopRight, radiusBottomRight, radiusBottomLeft,
    borderColor, borderWidth, borderStyle, strokePlacement,
    flexDirection, flexWrap, alignItems, justifyContent, gap,
    contentWidth, contentMaxWidth,
    boxShadow, opacity, overflow,
    position, display, zIndex, top, right, bottom, left, editorVisibility,
    rotation, flipHorizontal, flipVertical,
    productId,
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
    backgroundVideo: node.data.props.backgroundVideo,
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
    contentWidth: node.data.props.contentWidth,
    contentMaxWidth: node.data.props.contentMaxWidth,
    boxShadow: node.data.props.boxShadow,
    opacity: node.data.props.opacity,
    overflow: node.data.props.overflow,
    position: node.data.props.position,
    display: node.data.props.display,
    zIndex: node.data.props.zIndex,
    top: node.data.props.top,
    right: node.data.props.right,
    bottom: node.data.props.bottom,
    left: node.data.props.left,
    editorVisibility: node.data.props.editorVisibility,
    rotation: node.data.props.rotation,
    flipHorizontal: node.data.props.flipHorizontal,
    flipVertical: node.data.props.flipVertical,
    productId: node.data.props.productId,
  }));

  const typedSetProp = setProp as SetProp<SectionProps>;

  return (
    <div className="flex flex-col pb-4">
      <DesignSection title="Section" defaultOpen={true}>
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-[var(--builder-text)]">Content Width</label>
            <select
              value={contentWidth || "constrained"}
              onChange={(e) =>
                typedSetProp((props) => {
                  props.contentWidth = e.target.value as SectionProps["contentWidth"];
                })
              }
              className="w-full bg-[var(--builder-surface-2)] border border-[var(--builder-border)] rounded-md text-xs text-[var(--builder-text)] p-2 focus:outline-none focus:border-[var(--builder-accent)]"
            >
              <option value="constrained">Constrained</option>
              <option value="full">Full Width</option>
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-[var(--builder-text)]">Max Content Width</label>
            <input
              type="text"
              value={contentMaxWidth || "1200px"}
              onChange={(e) =>
                typedSetProp((props) => {
                  props.contentMaxWidth = e.target.value;
                })
              }
              placeholder="1200px"
              disabled={(contentWidth || "constrained") === "full"}
              className="w-full bg-[var(--builder-surface-2)] border border-[var(--builder-border)] rounded-md text-xs text-[var(--builder-text)] p-2 focus:outline-none focus:border-[var(--builder-accent)] disabled:opacity-50"
            />
          </div>
        </div>
      </DesignSection>

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
          rotation={rotation ?? 0}
          flipHorizontal={flipHorizontal ?? false}
          flipVertical={flipVertical ?? false}
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
          backgroundImage={backgroundImage}
          backgroundSize={backgroundSize}
          backgroundPosition={backgroundPosition}
          backgroundRepeat={backgroundRepeat}
          backgroundOverlay={backgroundOverlay}
          backgroundVideo={backgroundVideo}
          borderColor={borderColor}
          borderWidth={borderWidth}
          borderStyle={borderStyle}
          strokePlacement={strokePlacement}
          radiusTopLeft={radiusTopLeft}
          radiusTopRight={radiusTopRight}
          radiusBottomRight={radiusBottomRight}
          radiusBottomLeft={radiusBottomLeft}
          enableMediaFillModes
          setProp={typedSetProp}
        />
      </DesignSection>

      <DesignSection title="Product Binding" defaultOpen={false}>
        <ProductBindingGroup
          productId={productId}
          onChange={(newId) => {
            typedSetProp((props) => {
              props.productId = newId;
            });
          }}
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
