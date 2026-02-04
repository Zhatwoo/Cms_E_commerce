import React from "react";
import { useNode } from "@craftjs/core";

export const TextSettings = () => {
  const { text, fontSize, actions: { setProp } } = useNode(node => ({
    text: node.data.props.text,
    fontSize: node.data.props.fontSize
  }));

  return (
    <div className="flex flex-col gap-4 text-sm">
      <div>
        <label className="block mb-2 text-brand-light">Text Content</label>
        <input
          type="text"
          value={text}
          onChange={(e) => setProp((props: any) => props.text = e.target.value)}
          className="w-full bg-brand-black border border-brand-medium p-2 rounded-lg text-white focus:border-brand-light focus:outline-none"
        />
      </div>
      <div>
        <label className="block mb-2 text-brand-light">Font Size ({fontSize}px)</label>
        <input
          type="range" value={fontSize || 16} step={1} min={10} max={50}
          onChange={(e) => setProp((props: any) => props.fontSize = Number(e.target.value))}
          className="w-full accent-brand-light"
        />
      </div>
    </div>
  );
};
