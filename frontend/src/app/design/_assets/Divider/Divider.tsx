import React from "react";
import { useNode } from "@craftjs/core";
import { DividerSettings } from "./DividerSettings";
import type { DividerProps } from "../../_types/components";

export const Divider = ({
  dividerStyle = "solid",
  color = "#4a4a4a",
  thickness = 1,
  width = "100%",
  marginTop = 8,
  marginBottom = 8,
}: DividerProps) => {
  const { connectors: { connect, drag } } = useNode();

  return (
    <hr
      ref={(ref) => { if (ref) connect(drag(ref)); }}
      style={{
        width,
        borderTopStyle: dividerStyle,
        borderTopColor: color,
        borderTopWidth: `${thickness}px`,
        borderBottom: "none",
        borderLeft: "none",
        borderRight: "none",
        marginTop: `${marginTop}px`,
        marginBottom: `${marginBottom}px`,
      }}
      className="hover:outline hover:outline-blue-500 cursor-pointer"
    />
  );
};

export const DividerDefaultProps: Partial<DividerProps> = {
  dividerStyle: "solid",
  color: "#4a4a4a",
  thickness: 1,
  width: "100%",
  marginTop: 8,
  marginBottom: 8,
};

Divider.craft = {
  displayName: "Divider",
  props: DividerDefaultProps,
  related: {
    settings: DividerSettings,
  },
};
