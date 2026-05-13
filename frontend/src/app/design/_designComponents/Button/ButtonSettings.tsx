import React from "react";
import { useNode } from "@craftjs/core";
import { DesignSection } from "../../_components/rightPanel/settings/DesignSection";
import { TransformGroup } from "../../_components/rightPanel/settings/TransformGroup";
import { LayoutLayerGroup } from "../../_components/rightPanel/settings/LayoutLayerGroup";
import { SizePositionGroup } from "../../_components/rightPanel/settings/SizePositionGroup";
import { EffectsGroup } from "../../_components/rightPanel/settings/EffectsGroup";
import { NumericInput } from "../../_components/rightPanel/settings/inputs/NumericInput";
import { ColorPicker } from "../../_components/rightPanel/settings/inputs/ColorPicker";
import { TypographyGroup } from "../../_components/rightPanel/settings/TypographyGroup";
import type { ButtonProps, SetProp, TypographyProps } from "../../_types/components";

export const ButtonSettings = () => {
  const {
    id, label, link, variant,
    backgroundColor, textColor,
    fontSize, fontWeight, fontFamily, fontStyle, lineHeight, letterSpacing, textAlign, textTransform, textDecoration, color,
    borderRadius, borderWidth,
    width, height,
    paddingLeft, paddingRight, paddingTop, paddingBottom,
    marginLeft, marginRight, marginTop, marginBottom,
    opacity, boxShadow,
    rotation, flipHorizontal, flipVertical,
    position, display, alignSelf, zIndex, top, right, bottom, left, isFreeform, editorVisibility,
    node,
    actions: { setProp }
  } = useNode(node => ({
    id: node.id,
    label: node.data.props.label,
    link: node.data.props.link,
    variant: node.data.props.variant,
    backgroundColor: node.data.props.backgroundColor,
    textColor: node.data.props.textColor,
    fontSize: node.data.props.fontSize,
    fontWeight: node.data.props.fontWeight,
    fontFamily: node.data.props.fontFamily,
    fontStyle: node.data.props.fontStyle,
    lineHeight: node.data.props.lineHeight,
    letterSpacing: node.data.props.letterSpacing,
    textAlign: node.data.props.textAlign,
    textTransform: node.data.props.textTransform,
    textDecoration: node.data.props.textDecoration,
    color: node.data.props.color,
    borderRadius: node.data.props.borderRadius,
    borderWidth: node.data.props.borderWidth,
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
    boxShadow: node.data.props.boxShadow,
    rotation: node.data.props.rotation,
    flipHorizontal: node.data.props.flipHorizontal,
    flipVertical: node.data.props.flipVertical,
    position: node.data.props.position,
    display: node.data.props.display,
    alignSelf: node.data.props.alignSelf,
    zIndex: node.data.props.zIndex,
    top: node.data.props.top,
    right: node.data.props.right,
    bottom: node.data.props.bottom,
    left: node.data.props.left,
    isFreeform: node.data.props.isFreeform,
    editorVisibility: node.data.props.editorVisibility,
    node,
  }));

  const typedSetProp = setProp as SetProp<ButtonProps>;

  return (
    <div className="flex flex-col pb-4">
      <DesignSection title="Button" defaultOpen={true}>
        <div className="flex flex-col gap-3">
          {/* Label */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-[var(--builder-text)]">Label</label>
            <input
              type="text"
              value={label}
              onChange={(e) => typedSetProp((props) => { props.label = e.target.value; })}
              className="w-full bg-[var(--builder-surface-2)] border border-[var(--builder-border)] rounded-md text-xs text-[var(--builder-text)] p-2 focus:outline-none focus:border-[var(--builder-accent)]"
            />
          </div>

          {/* Link URL */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-[var(--builder-text)]">Link URL</label>
            <input
              type="text"
              value={link}
              onChange={(e) => typedSetProp((props) => { props.link = e.target.value; })}
              placeholder="https://..."
              className="w-full bg-[var(--builder-surface-2)] border border-[var(--builder-border)] rounded-md text-xs text-[var(--builder-text)] p-2 focus:outline-none focus:border-[var(--builder-accent)]"
            />
          </div>

          {/* Variant */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-[var(--builder-text)]">Variant</label>
            <div className="grid grid-cols-5 gap-1 bg-[var(--builder-surface-2)] p-1 rounded-lg border border-[var(--builder-border)]">
              {(["primary", "secondary", "outline", "ghost", "cta"] as const).map((v) => (
                <button
                  key={v}
                  onClick={() => typedSetProp((props) => {
                    props.variant = v;
                    if (v === "cta") {
                      props.borderRadius = 0;
                      props.fontWeight = "700";
                      props.fontSize = 16;
                      props.paddingTop = 8;
                      props.paddingBottom = 8;
                      props.paddingLeft = 22;
                      props.paddingRight = 22;
                    }
                  })}
                  className={`text-[10px] py-1.5 rounded capitalize transition-colors ${variant === v
                    ? "bg-[var(--builder-accent)] text-black"
                    : "text-[var(--builder-text-muted)] hover:text-[var(--builder-text)]"
                    }`}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>
        </div>
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
        <LayoutLayerGroup
          nodeId={id}
          position={position}
          display={display}
          isFreeform={isFreeform}
          alignSelf={alignSelf}
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
        <div className="flex flex-col gap-3">
          {/* Colors */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-[var(--builder-text)]">Background</label>
            <ColorPicker
              value={backgroundColor || "#3b82f6"}
              onChange={(val) => typedSetProp((props) => { props.backgroundColor = val; })}
            />
          </div>

          {/* Border & Radius */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] text-[var(--builder-text)]">Radius</label>
              <NumericInput
                value={borderRadius ?? 8}
                onChange={(val) => typedSetProp((props) => { props.borderRadius = val; })}
                min={0}
                unit="px"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] text-[var(--builder-text)]">Border Width</label>
              <NumericInput
                value={borderWidth ?? 0}
                onChange={(val) => typedSetProp((props) => { props.borderWidth = val; })}
                min={0}
                unit="px"
              />
            </div>
          </div>
        </div>
      </DesignSection>

      <DesignSection title="Typography">
        <TypographyGroup
          fontSize={fontSize}
          fontWeight={fontWeight}
          fontFamily={fontFamily}
          fontStyle={fontStyle}
          lineHeight={lineHeight}
          letterSpacing={letterSpacing}
          textAlign={textAlign}
          textTransform={textTransform}
          textDecoration={textDecoration}
          color={color ?? textColor}
          setProp={typedSetProp as unknown as SetProp<TypographyProps>}
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
