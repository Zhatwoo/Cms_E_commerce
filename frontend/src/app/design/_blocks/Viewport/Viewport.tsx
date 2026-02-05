import React from "react";
import { useNode } from "@craftjs/core";

export const Viewport = ({ children }: { children?: React.ReactNode }) => {
  const { connectors: { connect, drag } } = useNode();

  return (
    <div
      ref={(ref) => {
        if (ref) connect(drag(ref));
      }}
      className="flex gap-16 p-20 min-w-max min-h-max"
    >
      {children}
    </div>
  );
};

Viewport.craft = {
  displayName: "Viewport",
  rules: {
    canMoveIn: (incomingNodes: any) => incomingNodes.every((node: any) => node.data.type.craft.displayName === "Page"),
  }
};
