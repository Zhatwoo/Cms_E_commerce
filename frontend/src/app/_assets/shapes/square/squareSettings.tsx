import React from "react";
import { useNode } from "@craftjs/core";
import { DesignSection } from "@/app/design/_components/rightPanel/settings/DesignSection";

export const SquareSettings = () => {
  const {
    actions: { setProp },
    width,
    height,
    color,
    size,
    background,
    borderColor,
    borderWidth,
    borderStyle,
    boxShadow,
    opacity,
    overflow,
    cursor,
  } = useNode((node) => ({
    width: node.data.props.width,
    height: node.data.props.height,
    color: node.data.props.color,
    size: node.data.props.size,
    background: node.data.props.background,
    borderColor: node.data.props.borderColor,
    borderWidth: node.data.props.borderWidth,
    borderStyle: node.data.props.borderStyle,
    boxShadow: node.data.props.boxShadow,
    opacity: node.data.props.opacity,
    overflow: node.data.props.overflow,
    cursor: node.data.props.cursor,
  }));

  return (
    <div className="flex flex-col pb-4">
      <DesignSection title="Appearance">
        <div>
          <label className="block text-sm mb-1">Color</label>
          <input
            type="color"
            value={color}
            onChange={e => setProp((props: { color: string }) => { props.color = e.target.value; })}
            className="w-12 h-8 border rounded"
          />
        </div>
      </DesignSection>
      <DesignSection title="Size">
        <div>
          <label className="block text-sm mb-1">Size</label>
          <input
            type="number"
            min={20}
            max={200}
            value={size}
            onChange={e => setProp((props: { size: number }) => { props.size = parseInt(e.target.value, 10); })}
            className="w-20 border rounded px-2"
          />
        </div>
      </DesignSection>
      <DesignSection title="Width & Height">
        <div className="flex gap-2">
          <div className="flex-1">
            <label className="block text-sm mb-1">Width</label>
            <input
              type="number"
              value={Number.isNaN(width) ? "" : width}
              min={10}
              max={1000}
              onChange={e => setProp((props: any) => props.width = parseInt(e.target.value, 10))}
              className="border rounded px-2 py-1 w-full"
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm mb-1">Height</label>
            <input
              type="number"
              value={Number.isNaN(height) ? "" : height}
              min={10}
              max={1000}
              onChange={e => setProp((props: any) => props.height = parseInt(e.target.value, 10))}
              className="border rounded px-2 py-1 w-full"
            />
          </div>
        </div>
      </DesignSection>
    </div>
  );
};

export default SquareSettings;
