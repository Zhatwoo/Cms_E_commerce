import React from "react";
import { useNode } from "@craftjs/core";
import { PageSettings } from "./PageSettings";
import type { PageProps } from "../../_types";

export const Page = ({
  children,
  width = "1000px",
  height = "auto",
  background = "#ffffff",
}: PageProps) => {
  const { connectors: { connect, drag } } = useNode();

  return (
    <div
      ref={(ref) => {
        if (ref) connect(drag(ref));
      }}
      className="rounded-lg shadow-xl relative min-h-[600px] transition-all"
      style={{
        width,
        height: height === "auto" ? "auto" : height,
        minHeight: "800px",
        backgroundColor: background,
      }}
    >
      <div className="absolute -top-8 left-0 text-white font-bold text-2xl opacity-50 select-none">
        Page Name
      </div>
      {children}
    </div>
  );
};

export const PageDefaultProps: Partial<PageProps> = {
  width: "1000px",
  height: "auto",
  background: "#ffffff",
};

Page.craft = {
  displayName: "Page",
  props: PageDefaultProps,
  rules: {
    canDrag: () => true,
  },
  related: {
    settings: PageSettings,
  },
};
