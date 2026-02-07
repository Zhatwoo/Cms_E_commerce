import React from "react";
import { useNode } from "@craftjs/core";
import { SettingsSection } from "../../_components/rightPanel/settings/SettingsSection";
import { SizePositionGroup } from "../../_components/rightPanel/settings/SizePositionGroup";
import { AppearanceGroup } from "../../_components/rightPanel/settings/AppearanceGroup";
import { EffectsGroup } from "../../_components/rightPanel/settings/EffectsGroup";
import type { ImageProps, SetProp } from "../../_types/components";

export const ImageSettings = () => {
  const {
    src, alt, objectFit,
    width, height,
    borderRadius, radiusTopLeft, radiusTopRight, radiusBottomRight, radiusBottomLeft,
    paddingLeft, paddingRight, paddingTop, paddingBottom,
    marginLeft, marginRight, marginTop, marginBottom,
    opacity, boxShadow,
    actions: { setProp }
  } = useNode(node => ({
    src: node.data.props.src,
    alt: node.data.props.alt,
    objectFit: node.data.props.objectFit,
    width: node.data.props.width,
    height: node.data.props.height,
    borderRadius: node.data.props.borderRadius,
    radiusTopLeft: node.data.props.radiusTopLeft,
    radiusTopRight: node.data.props.radiusTopRight,
    radiusBottomRight: node.data.props.radiusBottomRight,
    radiusBottomLeft: node.data.props.radiusBottomLeft,
    paddingLeft: node.data.props.paddingLeft,
    paddingRight: node.data.props.paddingRight,
    paddingTop: node.data.props.paddingTop,
    paddingBottom: node.data.props.paddingBottom,
    marginLeft: node.data.props.marginLeft,
    marginRight: node.data.props.marginRight,
    marginTop: node.data.props.marginTop,
    marginBottom: node.data.props.marginBottom,
    opacity: node.data.props.opacity,
    boxShadow: node.data.props.boxShadow,
  }));

  const typedSetProp = setProp as SetProp<ImageProps>;

  return (
    <div className="flex flex-col pb-4">
      <SettingsSection title="Image">
        <div className="flex flex-col gap-3">
          {/* Source URL */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-brand-lighter uppercase">Source URL</label>
            <input
              type="text"
              value={src}
              onChange={(e) => typedSetProp((props) => { props.src = e.target.value; })}
              placeholder="https://example.com/image.jpg"
              className="w-full bg-brand-black border border-brand-medium/30 rounded-md text-xs text-white p-2 focus:outline-none focus:border-brand-light"
            />
          </div>

          {/* Alt Text */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-brand-lighter uppercase">Alt Text</label>
            <input
              type="text"
              value={alt}
              onChange={(e) => typedSetProp((props) => { props.alt = e.target.value; })}
              placeholder="Describe the image"
              className="w-full bg-brand-black border border-brand-medium/30 rounded-md text-xs text-white p-2 focus:outline-none focus:border-brand-light"
            />
          </div>

          {/* Object Fit */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-brand-lighter uppercase">Object Fit</label>
            <select
              value={objectFit}
              onChange={(e) => typedSetProp((props) => {
                props.objectFit = e.target.value as ImageProps["objectFit"];
              })}
              className="w-full bg-brand-black border border-brand-medium/30 rounded-md text-xs text-white p-1.5 focus:outline-none"
            >
              <option value="cover">Cover</option>
              <option value="contain">Contain</option>
              <option value="fill">Fill</option>
              <option value="none">None</option>
              <option value="scale-down">Scale Down</option>
            </select>
          </div>
        </div>
      </SettingsSection>

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

      <SettingsSection title="Corners">
        <AppearanceGroup
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
          setProp={typedSetProp}
        />
      </SettingsSection>
    </div>
  );
};
