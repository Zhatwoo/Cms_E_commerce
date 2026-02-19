import React from "react";
import { useNode } from "@craftjs/core";
import { DesignSection } from "../../_components/rightPanel/settings/DesignSection";
import { TransformGroup } from "../../_components/rightPanel/settings/TransformGroup";
import { TypographyGroup } from "../../_components/rightPanel/settings/TypographyGroup";
import { SizePositionGroup } from "../../_components/rightPanel/settings/SizePositionGroup";
import { EffectsGroup } from "../../_components/rightPanel/settings/EffectsGroup";
import { InteractionGroup } from "../../_components/rightPanel/settings/InteractionGroup";
import type { TextProps, SetProp } from "../../_types/components";

export const TextSettings = () => {
  const {
    text,
    fontSize, fontFamily, fontWeight, fontStyle, lineHeight, letterSpacing, textAlign, textTransform, color,
    margin, marginTop, marginBottom, marginLeft, marginRight,
    padding, paddingTop, paddingBottom, paddingLeft, paddingRight,
    opacity, boxShadow,
    rotation, flipHorizontal, flipVertical,
    toggleTarget, triggerAction, collapsibleKey, defaultOpen, defaultOpenMobile, defaultOpenDesktop, showOn, mobileBreakpoint,
    actions: { setProp }
  } = useNode(node => ({
    text: node.data.props.text,
    fontSize: node.data.props.fontSize,
    fontStyle: node.data.props.fontStyle,
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
    boxShadow: node.data.props.boxShadow,
    rotation: node.data.props.rotation,
    flipHorizontal: node.data.props.flipHorizontal,
    flipVertical: node.data.props.flipVertical,
    toggleTarget: node.data.props.toggleTarget,
    triggerAction: node.data.props.triggerAction,
    collapsibleKey: node.data.props.collapsibleKey,
    defaultOpen: node.data.props.defaultOpen,
    defaultOpenMobile: node.data.props.defaultOpenMobile,
    defaultOpenDesktop: node.data.props.defaultOpenDesktop,
    showOn: node.data.props.showOn,
    mobileBreakpoint: node.data.props.mobileBreakpoint
  }));

  const typedSetProp = setProp as SetProp<TextProps>;

  return (
    <div className="flex flex-col pb-4">
      <DesignSection title="Position & Transform">
        <TransformGroup
          rotation={rotation}
          flipHorizontal={flipHorizontal}
          flipVertical={flipVertical}
          setProp={typedSetProp}
        />
      </DesignSection>

      <DesignSection title="Size & Spacing">
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
      </DesignSection>

      <DesignSection title="Typography">
        <TypographyGroup
          fontFamily={fontFamily}
          fontWeight={fontWeight}
          fontStyle={fontStyle}
          fontSize={fontSize}
          lineHeight={lineHeight}
          letterSpacing={letterSpacing}
          textAlign={textAlign}
          textTransform={textTransform}
          color={color}
          setProp={typedSetProp}
        />
      </DesignSection>

      <DesignSection title="Content">
        <textarea
          value={text}
          onChange={(e) => typedSetProp((props) => { props.text = e.target.value; })}
          className="w-full bg-brand-medium-dark p-2 rounded-lg text-brand-lighter focus:border-brand-light focus:outline-none resize-y min-h-[40px]"
        />
      </DesignSection>

      <DesignSection title="Effects" defaultOpen={false}>
        <EffectsGroup
          opacity={opacity}
          boxShadow={boxShadow}
          setProp={typedSetProp}
        />
      </DesignSection>

      <DesignSection title="Interactions" defaultOpen={false}>
        <InteractionGroup
          toggleTarget={toggleTarget}
          triggerAction={triggerAction}
          collapsibleKey={collapsibleKey}
          defaultOpen={defaultOpen}
          defaultOpenMobile={defaultOpenMobile}
          defaultOpenDesktop={defaultOpenDesktop}
          showOn={showOn}
          mobileBreakpoint={mobileBreakpoint}
          setProp={typedSetProp}
        />
      </DesignSection>
    </div>
  );
};
