import React from "react";
import { useNode } from "@craftjs/core";
import { DesignSection } from "../../_components/rightPanel/settings/DesignSection";
import { SizePositionGroup } from "../../_components/rightPanel/settings/SizePositionGroup";
import { EffectsGroup } from "../../_components/rightPanel/settings/EffectsGroup";
import { NumericInput } from "../../_components/rightPanel/settings/inputs/NumericInput";
import { ColorPicker } from "../../_components/rightPanel/settings/inputs/ColorPicker";
import type { IconProps, SetProp } from "../../_types/components";

export const IconSettings = () => {
  const {
    iconType,
    size,
    color,
    link,
    width,
    height,
    paddingLeft,
    paddingRight,
    paddingTop,
    paddingBottom,
    marginLeft,
    marginRight,
    marginTop,
    marginBottom,
    opacity,
    actions: { setProp },
  } = useNode((node) => ({
    iconType: node.data.props.iconType,
    size: node.data.props.size,
    color: node.data.props.color,
    link: node.data.props.link,
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
    opacity: node.data.props.opacity,
  }));

  const typedSetProp = setProp as SetProp<IconProps>;

  return (
    <div className="flex flex-col pb-4">
      <DesignSection title="Icon">
        <div className="flex flex-col gap-3">
          {/* Size */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-brand-lighter">Size</label>
            <NumericInput
              value={size ?? 24}
              onChange={(val) =>
                typedSetProp((props) => {
                  props.size = val;
                })
              }
              min={8}
              max={256}
              unit="px"
            />
          </div>

          {/* Color */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-brand-lighter">Color</label>
            <ColorPicker
              value={color || "#ffffff"}
              onChange={(val) => typedSetProp((props) => { props.color = val; })}
              className="w-full"
            />
          </div>

          {/* Link URL */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-brand-lighter">Link URL</label>
            <input
              type="text"
              value={link}
              onChange={(e) =>
                typedSetProp((props) => {
                  props.link = e.target.value;
                })
              }
              placeholder="https://..."
              className="w-full bg-brand-black border border-brand-medium/30 rounded-md text-xs text-brand-lighter p-2 focus:outline-none focus:border-brand-light"
            />
          </div>
        </div>
      </DesignSection>

      <SizePositionGroup
        width={width as string}
        height={height as string}
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

      <EffectsGroup opacity={opacity} setProp={typedSetProp} />
    </div>
  );
};
