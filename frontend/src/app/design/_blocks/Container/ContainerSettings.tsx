import React from "react";
import { useNode } from "@craftjs/core";

export const ContainerSettings = () => {
  const { background, padding, actions: { setProp } } = useNode(node => ({
    background: node.data.props.background,
    padding: node.data.props.padding
  }));

  return (
    <div className="flex flex-col gap-4 text-sm">
      <div>
        <label className="block mb-2 text-brand-light">Background Color</label>
        <input
          type="color"
          value={background}
          onChange={(e) => setProp((props: any) => props.background = e.target.value)}
          className="w-full h-10 cursor-pointer rounded-lg border border-brand-medium bg-transparent p-1"
        />
      </div>
      <div>
        <label className="block mb-2 text-brand-light">Padding ({padding}px)</label>
        <input
          type="range" value={padding || 0} step={5} min={0} max={100}
          onChange={(e) => setProp((props: any) => props.padding = Number(e.target.value))}
          className="w-full accent-brand-light"
        />
      </div>
    </div>
  );
};
