import React from "react";
import { useNode } from "@craftjs/core";
import { ContainerSettings } from "./ContainerSettings";

interface ContainerProps {
  background?: string;
  padding?: number;
  children?: React.ReactNode;
}

export const Container = ({ background, padding = 20, children }: ContainerProps) => {
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

export const ContainerDefaultProps = {
  background: "#27272a",
  padding: 20
};

Container.craft = {
  displayName: "Container",
  props: ContainerDefaultProps,
  related: {
    settings: ContainerSettings
  }
};
