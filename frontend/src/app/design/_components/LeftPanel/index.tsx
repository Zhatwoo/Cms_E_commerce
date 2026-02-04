import React from "react";
import { useEditor, Element } from "@craftjs/core";
import { Container } from "../../_blocks/Container/Container";
import { Text } from "../../_blocks/Text/Text";

export const LeftPanel = () => {
  const { connectors } = useEditor();

  return (
    <div className="w-80 bg-brand-dark m-4 rounded-3xl p-6 flex flex-col gap-4 h-[calc(100vh-2rem)] shadow-xl overflow-y-auto">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-white font-bold text-lg">Inspire</h3>
        <span className="text-brand-light">icon</span>
      </div>

      <div className="mb-4">
        <label className="text-brand-light text-xs uppercase tracking-wider font-semibold mb-2 block">Project Title:</label>
        <div className="flex gap-2 mb-4 border-b border-brand-medium pb-2">
          <button className="text-white border-b-2 border-white pb-1">Components</button>
          <button className="text-brand-light pb-1">Assets</button>
        </div>
        <div className="relative">
          <input
            type="text"
            placeholder="Search Assets"
            className="w-full bg-transparent border border-brand-medium rounded-lg p-2 text-sm text-white focus:outline-none focus:border-brand-light"
          />
          <span className="absolute right-3 top-2.5 text-brand-light">🔍</span>
        </div>
      </div>

      <div className="flex flex-col gap-4 overflow-y-auto pr-2">
        {/* Draggable Button for Container */}
        <div className="flex flex-col gap-2">
          <div
            ref={(ref) => {
              if (ref) connectors.create(ref, <Element is={Container} background="#27272a" padding={20} canvas />);
            }}
            className="bg-brand-white/5 p-4 rounded-xl hover:bg-brand-white/10 transition cursor-move border border-brand-medium/30 group"
          >
            <div className="h-20 bg-brand-medium/20 rounded-lg mb-2 border border-dashed border-brand-medium/50 flex items-center justify-center text-brand-light text-xs">
              Container Preview
            </div>
            <span className="text-sm text-brand-lighter font-medium">Container Block</span>
          </div>

          {/* Draggable Button for Text */}
          <div
            ref={(ref) => {
              if (ref) connectors.create(ref, <Text text="New Text" fontSize={16} />);
            }}
            className="bg-brand-white/5 p-4 rounded-xl hover:bg-brand-white/10 transition cursor-move border border-brand-medium/30 group"
          >
            <div className="h-20 bg-brand-medium/20 rounded-lg mb-2 border border-dashed border-brand-medium/50 flex items-center justify-center text-brand-light text-xs">
              Text Preview
            </div>
            <span className="text-sm text-brand-lighter font-medium">Text Block</span>
          </div>
        </div>
      </div>
    </div>
  );
};
