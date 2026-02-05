import React from "react";
import { useNode } from "@craftjs/core";
import { TextSettings } from "./TextSettings";

interface TextProps {
  text: string;
  fontSize?: number;
}

export const Text = ({ text, fontSize }: TextProps) => {
  const { connectors: { connect, drag }, actions: { setProp } } = useNode();
  return (
    <div
      ref={(ref) => {
        if (ref) connect(drag(ref));
      }}
      // We can remove the onClick logic here since RenderNode can handle selection, 
      // but keeping basic interactivity if needed. 
      // For now, let's keep it simple.
      style={{ fontSize: `${fontSize}px` }}
      className="p-2 hover:outline hover:outline-blue-500 cursor-pointer"
    >
      {text}
    </div>
  );
};

export const TextDefaultProps = {
  text: "Edit me!",
  fontSize: 16
};

Text.craft = {
  displayName: "Text",
  props: TextDefaultProps,
  related: {
    settings: TextSettings
  }
};
