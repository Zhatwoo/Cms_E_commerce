import React from "react";
import { useNode } from "@craftjs/core";
import { SettingsSection } from "../../_components/rightPanel/settings/SettingsSection";
import { TypographyGroup } from "../../_components/rightPanel/settings/TypographyGroup";
import { SizePositionGroup } from "../../_components/rightPanel/settings/SizePositionGroup";
import { EffectsGroup } from "../../_components/rightPanel/settings/EffectsGroup";
import type { TextProps, SetProp } from "../../_types/components";

export const TextSettings = () => {
  const {
    text,
    fontSize, fontFamily, fontWeight, lineHeight, letterSpacing, textAlign, textTransform, color,
    margin, marginTop, marginBottom, marginLeft, marginRight,
    padding, paddingTop, paddingBottom, paddingLeft, paddingRight,
    opacity, boxShadow,
    actions: { setProp }
  } = useNode(node => ({
    text: node.data.props.text,
    fontSize: node.data.props.fontSize,
    fontFamily: node.data.props.fontFamily,
    fontWeight: node.data.props.fontWeight,
    lineHeight: node.data.props.lineHeight,
    letterSpacing: node.data.props.letterSpacing,
    textAlign: node.data.props.textAlign,
    textTransform: node.data.props.textTransform,
    color: node.data.props.color,
    margin: node.data.props.margin,
    marginTop: node.data.props.marginTop,
    marginBottom: node.data.props.marginBottom,
    marginLeft: node.data.props.marginLeft,
    marginRight: node.data.props.marginRight,
    padding: node.data.props.padding,
    paddingTop: node.data.props.paddingTop,
    paddingBottom: node.data.props.paddingBottom,
    paddingLeft: node.data.props.paddingLeft,
    paddingRight: node.data.props.paddingRight,
    opacity: node.data.props.opacity,
    boxShadow: node.data.props.boxShadow
  }));

  const typedSetProp = setProp as SetProp<TextProps>;

  return (
    <div className="flex flex-col pb-4">
      <SettingsSection title="Content">
        <textarea
          value={text}
          onChange={(e) => typedSetProp((props) => { props.text = e.target.value; })}
          className="w-full bg-brand-medium-dark p-2 rounded-lg text-brand-lighter focus:border-brand-light focus:outline-none resize-y min-h-[40px]"
        />
      </SettingsSection>

      <SettingsSection title="Typography">
        <TypographyGroup
          fontFamily={fontFamily}
          fontWeight={fontWeight}
          fontSize={fontSize}
          lineHeight={lineHeight}
          letterSpacing={letterSpacing}
          textAlign={textAlign}
          textTransform={textTransform}
          color={color}
          setProp={typedSetProp}
        />
      </SettingsSection>

      <SettingsSection title="Size & Position">
        <SizePositionGroup
          width="auto"
          height="auto"
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
