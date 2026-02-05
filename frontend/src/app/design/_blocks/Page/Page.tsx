import React from "react";
import { useNode } from "@craftjs/core";

export const Page = ({ children, width = "800px", height = "auto" }: { children?: React.ReactNode; width?: string; height?: string }) => {
  const { connectors: { connect, drag } } = useNode();

  return (
    <div
      ref={(ref) => {
        if (ref) connect(drag(ref));
      }}
      className="bg-white rounded-lg shadow-xl relative min-h-[600px] transition-all"
      style={{
        width: width,
        height: height === "auto" ? "auto" : height,
        minHeight: "800px"
      }}
    >
      <div className="absolute -top-8 left-0 text-white font-bold text-2xl opacity-50 select-none">
        Page Name
      </div>
      {children}
    </div>
  );
};

export const PageDefaultProps = {
  width: "1000px",
  height: "auto"
};

Page.craft = {
  displayName: "Page",
  props: PageDefaultProps,
  rules: {
    canDrag: () => true, // Allow dragging pages? Ideally yes, to reorder.
  }
};
