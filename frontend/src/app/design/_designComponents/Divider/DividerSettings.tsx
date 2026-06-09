import React from "react";
import { useNode } from "@craftjs/core";
import { DesignSection } from "../../_components/rightPanel/settings/DesignSection";
import { NumericInput } from "../../_components/rightPanel/settings/inputs/NumericInput";
import { ColorPicker } from "../../_components/rightPanel/settings/inputs/ColorPicker";
import { LayoutLayerGroup } from "../../_components/rightPanel/settings/LayoutLayerGroup";
import type { DividerProps, SetProp } from "../../_types/components";

export const DividerSettings = () => {
  const {
    id,
    dividerStyle, color, thickness, width, marginTop, marginBottom,
    position, display, alignSelf, zIndex, top, right, bottom, left, isFreeform, editorVisibility,
    actions: { setProp }
  } = useNode(node => ({
    id: node.id,
    dividerStyle: node.data.props.dividerStyle,
    color: node.data.props.color,
    thickness: node.data.props.thickness,
    width: node.data.props.width,
    marginTop: node.data.props.marginTop,
    marginBottom: node.data.props.marginBottom,
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
  }));

  const typedSetProp = setProp as SetProp<DividerProps>;

  return (
    <div className="flex flex-col pb-4">
      <DesignSection title="Divider">
        <div className="flex flex-col gap-3">
          {/* Style */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-builder-text">Style</label>
            <div className="grid grid-cols-3 gap-1 bg-builder-surface-2 p-1 rounded-lg border border-(--builder-border)">
              {(["solid", "dashed", "dotted"] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => typedSetProp((props) => { props.dividerStyle = s; })}
                  className={`text-[10px] py-1.5 rounded capitalize transition-colors ${dividerStyle === s
                    ? "bg-builder-accent text-black"
                    : "text-builder-text-muted hover:text-builder-text"
                    }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Color */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-builder-text">Color</label>
            <ColorPicker
              value={color || "#4a4a4a"}
              onChange={(val) => typedSetProp((props) => { props.color = val; })}
              className="w-full"
            />
          </div>

          {/* Thickness & Width */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] text-builder-text">Thickness</label>
              <NumericInput
                value={thickness ?? 1}
                onChange={(val) => typedSetProp((props) => { props.thickness = val; })}
                min={1}
                unit="px"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] text-builder-text">Width</label>
              <select
                value={width}
                onChange={(e) => typedSetProp((props) => { props.width = e.target.value; })}
                className="w-full bg-builder-surface-2 border border-(--builder-border) rounded-md text-xs text-builder-text p-1.5 focus:outline-none"
              >
                <option value="100%">Full</option>
                <option value="75%">75%</option>
                <option value="50%">50%</option>
                <option value="25%">25%</option>
              </select>
            </div>
          </div>

          {/* Spacing */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] text-builder-text">Margin Top</label>
              <NumericInput
                value={marginTop ?? 8}
                onChange={(val) => typedSetProp((props) => { props.marginTop = val; })}
                min={0}
                unit="px"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] text-builder-text">Margin Bottom</label>
              <NumericInput
                value={marginBottom ?? 8}
                onChange={(val) => typedSetProp((props) => { props.marginBottom = val; })}
                min={0}
                unit="px"
              />
            </div>
          </div>
        </div>
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
    </div>
  );
};
