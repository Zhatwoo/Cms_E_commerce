import React from "react";
import { Editor, Frame, Element } from "@craftjs/core";
import { RenderBlocks } from "../_blocks";
import { LeftPanel } from "./LeftPanel";
import { RightPanel } from "./RightPanel";
import { Container } from "../_blocks/Container/Container";
import { Text } from "../_blocks/Text/Text";
import { RenderNode } from "./RenderNode";

export const EditorShell = () => {
  return (
    <div className="h-screen bg-brand-black text-white flex overflow-hidden font-sans">
      <Editor
        resolver={RenderBlocks}
        onRender={RenderNode}
      >
        <LeftPanel />

        <div className="flex-1 bg-brand-black p-8 flex justify-center overflow-y-auto">
          {/* Visual wrapper for the "Page" (The white box in the middle) */}
          <div className="w-full max-w-[1000px] min-h-[800px] bg-black rounded shadow-2xl overflow-hidden ring-1 ring-zinc-800 relative">

            <Frame>
              <Element is={Container} padding={40} background="#000000" canvas>
                <Text text="Welcome to your new site!" fontSize={32} />
                <Element is={Container} padding={20} background="#333333" canvas>
                </Element>
              </Element>
            </Frame>

          </div>
        </div>

        <RightPanel />
      </Editor>
    </div>
  );
};
