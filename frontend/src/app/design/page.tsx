"use client"; // Required for Next.js App Router

import React from "react";
import { Editor, Frame, Element, useNode, useEditor } from "@craftjs/core";

// COMPONENTS CONFIG
interface ContainerProps {
  background?: string;
  padding?: number;
  children?: React.ReactNode;
}

// CONTAINER COMPONENT
const Container = ({ background, padding = 20, children }: ContainerProps) => {
  const { connectors: { connect, drag } } = useNode();
  return (
    <div
      ref={(ref) => {
        if (ref) connect(drag(ref));
      }}
      className="min-h-[100px] border border-dashed border-zinc-700 transition-all hover:border-blue-500"
      style={{ background: background, padding: `${padding}px` }}
    >
      {children}
    </div>
  );
};

// TEXT COMPONENT CONFIG
interface TextComponentProps {
  text: string;
  fontSize?: number;
  isActive?: boolean;
}

// TEXT COMPONENT
const TextComponent = ({ text, fontSize }: TextComponentProps) => {
  const { connectors: { connect, drag }, actions: { setProp } } = useNode();
  return (
    <div
      ref={(ref) => {
        if (ref) connect(drag(ref));
      }}
      onClick={() => setProp((props: TextComponentProps) => (props.isActive = true))} // Example of interaction
      style={{ fontSize: `${fontSize}px` }}
      className="p-2 hover:outline hover:outline-blue-500 cursor-pointer"
    >
      {text}
    </div>
  );
};

// CONTAINER COMPONENT CONFIG
Container.craft = {
  displayName: "Container",
  props: { background: "#27272a", padding: 20 },
  related: { settings: ContainerSettings }
};

// TEXT COMPONENT CONFIG
TextComponent.craft = {
  displayName: "Text",
  props: { text: "Edit me!", fontSize: 16 },
  related: { settings: TextSettings }
};

// RIGHT SIDEBAR (PROPERTIES)
function ContainerSettings() {
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
}

// TEXT COMPONENT CONFIG
function TextSettings() {
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
}

/// LEFT SIDEBAR (TOOLBOX)
const Toolbox = () => {
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
              if (ref) connectors.create(ref, <TextComponent text="New Text" fontSize={16} />);
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

/// RIGHT SIDEBAR (Configuration)
const RightSidebar = () => {
  const { selected } = useEditor((state) => {
    // Determine which node is currently selected
    const [currentNodeId] = state.events.selected;
    let selected;

    if (currentNodeId) {
      selected = {
        id: currentNodeId,
        name: state.nodes[currentNodeId].data.displayName,
        settings: state.nodes[currentNodeId].related && state.nodes[currentNodeId].related.settings,
      };
    }

    return { selected };
  });

  return (
    <div className="w-80 bg-brand-dark m-4 rounded-3xl p-6 h-[calc(100vh-2rem)] shadow-xl overflow-y-auto">
      <div className="flex items-center justify-between mb-6">
        <span className="text-brand-light">icon</span>
        <h3 className="text-white font-bold text-lg">Configs</h3>
        <span className="text-brand-light">▶</span>
      </div>

      {selected ? (
        <div>
          <div className="mb-6">
            <div className="bg-brand-medium/20 p-2 rounded-lg text-center border border-brand-medium/30">
              <span className="text-brand-lighter font-medium text-sm">{selected.name}</span>
            </div>
          </div>

          <div className="flex gap-2 mb-6 border-b border-brand-medium pb-2">
            <button className="flex-1 text-center text-white border-b-2 border-white pb-1 text-sm">Alignment</button>
            <button className="flex-1 text-center text-brand-light pb-1 text-sm">Animation</button>
          </div>

          {/* Render the specific settings component for the selected item */}
          <div className="space-y-6">
            {selected.settings && React.createElement(selected.settings)}
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center h-64 text-brand-light opacity-50">
          <p className="text-sm">Select an element to edit</p>
        </div>
      )}
    </div>
  );
};


// MAIN PAGE
export default function DesignPage() {
  return (
    <div className="h-screen bg-brand-black text-white flex overflow-hidden font-sans">
      {/* 
        The Editor Provider wraps the whole builder.
        "resolver" tells Craft which components exist in the system.
      */}
      <Editor resolver={{ Container, TextComponent }}>

        {/* LEFT: Toolbox */}
        <Toolbox />

        {/* MIDDLE: Canvas Area */}
        <div className="flex-1 bg-brand-black p-8 flex justify-center overflow-y-auto">
          {/* Visual wrapper for the "Page" (The white box in the middle) */}
          <div className="w-full max-w-[1000px] min-h-[800px] bg-black rounded shadow-2xl overflow-hidden ring-1 ring-zinc-800">

            {/* The Actual Craft.js Canvas */}
            <Frame>
              <Element is={Container} padding={40} background="#000000" canvas>
                <TextComponent text="Welcome to your new site!" fontSize={32} />
                <Element is={Container} padding={20} background="#333333" canvas>
                </Element>
              </Element>
            </Frame>

          </div>
        </div>

        {/* RIGHT: Settings */}
        <RightSidebar />

      </Editor>
    </div>
  );
}