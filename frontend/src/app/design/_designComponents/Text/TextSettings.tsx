import React from "react";
import { useNode } from "@craftjs/core";
import { DesignSection } from "../../_components/rightPanel/settings/DesignSection";
import { TransformGroup } from "../../_components/rightPanel/settings/TransformGroup";
import { TypographyGroup } from "../../_components/rightPanel/settings/TypographyGroup";
import { SizePositionGroup } from "../../_components/rightPanel/settings/SizePositionGroup";
import { EffectsGroup } from "../../_components/rightPanel/settings/EffectsGroup";
import { PositionGroup } from "../../_components/rightPanel/settings/PositionGroup";
import type { TextProps, SetProp } from "../../_types/components";

export const TextSettings = () => {
  const {
    text,
    fontSize, fontFamily, fontWeight, fontStyle, lineHeight, letterSpacing, textAlign, textTransform, color,
    width, height,
    margin, marginTop, marginBottom, marginLeft, marginRight,
    padding, paddingTop, paddingBottom, paddingLeft, paddingRight,
    opacity, boxShadow,
    rotation, flipHorizontal, flipVertical,
    position, display, zIndex, top, right, bottom, left, editorVisibility,
    previewEditable,
    isCodeBlock,
    codeLanguage,
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
    width: node.data.props.width,
    height: node.data.props.height,
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
    isCodeBlock: node.data.props.isCodeBlock,
    codeLanguage: node.data.props.codeLanguage,
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
    previewEditable: node.data.props.previewEditable,
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
  const safeText = typeof text === "string" ? text : "";

  return (
    <div className="flex flex-col pb-4">
      <DesignSection title="Transform">
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

      <DesignSection title="Content">
        <textarea
          value={safeText}
          onChange={(e) => typedSetProp((props) => { props.text = e.target.value; })}
          placeholder={isCodeBlock ? "Type your code here..." : "Type your text here..."}
          className={`w-full bg-[var(--builder-surface-2)] p-2 rounded-lg text-[var(--builder-text)] focus:border-[var(--builder-accent)] focus:outline-none resize-y min-h-[40px] ${isCodeBlock ? "font-mono text-[12px]" : ""}`}
        />
        {isCodeBlock && (
          <p className="text-[10px] text-[var(--builder-text-muted)] mt-1">
            Code block mode {codeLanguage ? `(${codeLanguage})` : ""}.
          </p>
        )}
        <div className="mt-3 flex items-center gap-2">
          <input
            type="checkbox"
            checked={Boolean(previewEditable)}
            onChange={(e) => typedSetProp((props) => { props.previewEditable = e.target.checked; })}
            className="accent-[var(--builder-accent)] cursor-pointer"
          />
          <span className="text-[12px] text-[var(--builder-text)]">Allow input in Preview</span>
        </div>
        <p className="text-[10px] text-[var(--builder-text-muted)] mt-1">
          Lets users type into this text block on the Preview page only.
        </p>
      </DesignSection>

      <DesignSection title="Size & Spacing">
        <SizePositionGroup
          width={width ?? "fit-content"}
          height={height ?? "fit-content"}
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

      <DesignSection title="Effects" defaultOpen={false}>
        <EffectsGroup
          opacity={opacity}
          boxShadow={boxShadow}
          setProp={typedSetProp}
        />
      </DesignSection>

    </div>
  );
};
