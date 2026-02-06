import React from "react";
import { useEditor, Element } from "@craftjs/core";
import { Container } from "../../_blocks/Container/Container";
import { Text } from "../../_blocks/Text/Text";
import { Page } from "../../_blocks/Page/Page";

export const ComponentsPanel = () => {
  const { connectors } = useEditor();

  return (
    <div className="relative">
      <div className="flex flex-col gap-2">
        {/* Draggable Button for Page */}
        <div
          ref={(ref) => {
            if (ref) connectors.create(ref, <Element is={Page} canvas />);
          }}
          className="bg-brand-white/5 p-4 rounded-xl hover:bg-brand-white/10 transition cursor-move border border-brand-medium/30 group"
        >
          <div className="h-20 bg-white rounded-lg mb-2 border border-dashed border-brand-medium/50 flex items-center justify-center text-brand-black text-xs shadow-sm">
            Page Preview
          </div>
          <span className="text-sm text-brand-lighter font-medium">New Page</span>
        </div>

        {/* Draggable Button for Container */}
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
  );
};
