import React from "react";
import { useNode } from "@craftjs/core";
import { TypographyGroup } from "../../_components/rightPanel/settings/TypographyGroup";
import { SizePositionGroup } from "../../_components/rightPanel/settings/SizePositionGroup";
import { EffectsGroup } from "../../_components/rightPanel/settings/EffectsGroup";

export const TextSettings = () => {
  const {
    text,
    fontSize, fontFamily, fontWeight, lineHeight, letterSpacing, textAlign, textTransform, color,
    margin, marginTop, marginBottom, marginLeft, marginRight,
    padding, paddingTop, paddingBottom, paddingLeft, paddingRight,
    opacity, shadow,
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
    shadow: node.data.props.shadow
  }));

  return (
    <div className="flex flex-col gap-6 pb-8">
      {/* Content Input */}
      <div className="flex flex-col gap-2">
        <label className="text-xs font-semibold text-brand-light uppercase tracking-wider">Content</label>
        <textarea
          value={text}
          onChange={(e) => setProp((props: any) => props.text = e.target.value)}
          className="w-full bg-brand-black border border-brand-medium p-2 rounded-lg text-white focus:border-brand-light focus:outline-none resize-y min-h-[80px]"
        />
      </div>

      <div className="w-full h-px bg-brand-medium/20"></div>

      {/* Typography Group */}
      <TypographyGroup
        fontFamily={fontFamily}
        fontWeight={fontWeight}
        fontSize={fontSize}
        lineHeight={lineHeight}
        letterSpacing={letterSpacing}
        textAlign={textAlign}
        textTransform={textTransform}
        color={color}
        setProp={setProp}
      />

      <div className="w-full h-px bg-brand-medium/20"></div>

      {/* Size & Position Group (Margins/Paddings) */}
      <SizePositionGroup
        // For Text, width/height might be less relevant if it's inline-block, but we pass margins/padding
        width="auto" // Text usually auto width unless blocked
        height="auto"
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

      {/* Effects Group */}
      <EffectsGroup
        opacity={opacity}
        boxShadow={shadow}
        setProp={setProp}
      />
    </div>
  );
};
