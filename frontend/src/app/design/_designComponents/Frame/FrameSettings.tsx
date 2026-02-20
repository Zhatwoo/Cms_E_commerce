import React from "react";
import { useNode } from "@craftjs/core";
import { DesignSection } from "../../_components/rightPanel/settings/DesignSection";
import { SizePositionGroup } from "../../_components/rightPanel/settings/SizePositionGroup";
import { InteractionGroup } from "../../_components/rightPanel/settings/InteractionGroup";
import { NumericInput } from "../../_components/rightPanel/settings/inputs/NumericInput";
import type { FrameProps, SetProp } from "../../_types/components";

export const FrameSettings = () => {
  const {
    referenceWidth,
    referenceHeight,
    fitMode,
    width,
    height,
    minHeight,
    paddingLeft,
    paddingRight,
    paddingTop,
    paddingBottom,
    marginLeft,
    marginRight,
    marginTop,
    marginBottom,
    toggleTarget,
    triggerAction,
    collapsibleKey,
    defaultOpen,
    defaultOpenMobile,
    defaultOpenDesktop,
    showOn,
    mobileBreakpoint,
    actions: { setProp },
  } = useNode((node) => ({
    referenceWidth: node.data.props.referenceWidth,
    referenceHeight: node.data.props.referenceHeight,
    fitMode: node.data.props.fitMode,
    width: node.data.props.width,
    height: node.data.props.height,
    minHeight: node.data.props.minHeight,
    paddingLeft: node.data.props.paddingLeft,
    paddingRight: node.data.props.paddingRight,
    paddingTop: node.data.props.paddingTop,
    paddingBottom: node.data.props.paddingBottom,
    marginLeft: node.data.props.marginLeft,
    marginRight: node.data.props.marginRight,
    marginTop: node.data.props.marginTop,
    marginBottom: node.data.props.marginBottom,
    toggleTarget: node.data.props.toggleTarget,
    triggerAction: node.data.props.triggerAction,
    collapsibleKey: node.data.props.collapsibleKey,
    defaultOpen: node.data.props.defaultOpen,
    defaultOpenMobile: node.data.props.defaultOpenMobile,
    defaultOpenDesktop: node.data.props.defaultOpenDesktop,
    showOn: node.data.props.showOn,
    mobileBreakpoint: node.data.props.mobileBreakpoint,
  }));

  const typedSetProp = setProp as SetProp<FrameProps>;

  return (
    <div className="flex flex-col pb-4">
      <DesignSection title="Responsive Frame">
        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] text-brand-lighter block mb-1">Reference width (px)</label>
              <NumericInput
                value={referenceWidth ?? 1440}
                onChange={(v) => typedSetProp((p) => { p.referenceWidth = v; })}
                min={320}
                max={3840}
                step={10}
                unit="px"
              />
            </div>
            <div>
              <label className="text-[10px] text-brand-lighter block mb-1">Reference height (px)</label>
              <NumericInput
                value={referenceHeight ?? 900}
                onChange={(v) => typedSetProp((p) => { p.referenceHeight = v; })}
                min={200}
                max={2160}
                step={10}
                unit="px"
              />
            </div>
          </div>
          <div>
            <label className="text-[10px] text-brand-lighter block mb-1">Fit mode</label>
            <select
              value={fitMode ?? "contain"}
              onChange={(e) => typedSetProp((p) => { p.fitMode = e.target.value as FrameProps["fitMode"]; })}
              className="w-full bg-brand-medium-dark border border-brand-medium/30 rounded-md text-xs text-brand-lighter p-2 focus:outline-none"
            >
              <option value="contain">Contain</option>
              <option value="cover">Cover</option>
              <option value="width">Width</option>
              <option value="fluid">Fluid</option>
            </select>
          </div>
          <div>
            <label className="text-[10px] text-brand-lighter block mb-1">Min height</label>
            <input
              type="text"
              value={minHeight ?? "400px"}
              onChange={(e) => typedSetProp((p) => { p.minHeight = e.target.value || "400px"; })}
              placeholder="400px or 50vh"
              className="w-full bg-brand-medium-dark border border-brand-medium/30 rounded-md text-xs text-brand-lighter p-2 focus:outline-none"
            />
          </div>
        </div>
      </DesignSection>

      <DesignSection title="Size & Spacing">
        <SizePositionGroup
          width={width}
          height={minHeight ?? height}
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
