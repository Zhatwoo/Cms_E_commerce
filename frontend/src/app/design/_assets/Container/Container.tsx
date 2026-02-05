import React from "react";
import { useNode } from "@craftjs/core";
import { ContainerSettings } from "./ContainerSettings";

interface ContainerProps {
  background?: string;
  padding?: number | string; // Allow separate padding
  paddingLeft?: number;
  paddingRight?: number;
  paddingTop?: number;
  paddingBottom?: number;
  width?: string;
  height?: string;
  borderRadius?: number;
  borderColor?: string;
  borderWidth?: number;
  flexDirection?: "row" | "column";
  flexWrap?: "nowrap" | "wrap";
  alignItems?: "flex-start" | "center" | "flex-end" | "stretch";
  justifyContent?: "flex-start" | "center" | "flex-end" | "space-between" | "space-around";
  gap?: number;
  children?: React.ReactNode;
}

export const Container = ({
  background,
  padding = 20,
  paddingLeft,
  paddingRight,
  paddingTop,
  paddingBottom,
  width = "100%",
  height = "auto",
  borderRadius = 0,
  borderColor = "transparent",
  borderWidth = 0,
  flexDirection = "column",
  flexWrap = "nowrap",
  alignItems = "flex-start",
  justifyContent = "flex-start",
  gap = 0,
  children
}: ContainerProps) => {
  const { connectors: { connect, drag } } = useNode();

  // Resolve padding
  const p = typeof padding === 'number' ? padding : 0;
  const pl = paddingLeft !== undefined ? paddingLeft : p;
  const pr = paddingRight !== undefined ? paddingRight : p;
  const pt = paddingTop !== undefined ? paddingTop : p;
  const pb = paddingBottom !== undefined ? paddingBottom : p;

  return (
    <div
      ref={(ref) => {
        if (ref) connect(drag(ref));
      }}
      className="min-h-[50px] transition-all hover:outline hover:outline-blue-500 hover:outline-1"
      style={{
        background,
        paddingLeft: `${pl}px`,
        paddingRight: `${pr}px`,
        paddingTop: `${pt}px`,
        paddingBottom: `${pb}px`,
        width,
        height,
        borderRadius: `${borderRadius}px`,
        border: `${borderWidth}px solid ${borderColor}`,
        display: "flex",
        flexDirection,
        flexWrap,
        alignItems,
        justifyContent,
        gap: `${gap}px`
      }}
    >
      {children}
    </div>
  );
};

export const ContainerDefaultProps = {
  background: "#27272a",
  padding: 20,
  width: "100%",
  height: "auto",
  borderRadius: 0,
  borderColor: "transparent",
  borderWidth: 0,
  flexDirection: "column",
  flexWrap: "nowrap",
  alignItems: "flex-start",
  justifyContent: "flex-start",
  gap: 0
};

Container.craft = {
  displayName: "Container",
  props: ContainerDefaultProps,
  related: {
    settings: ContainerSettings
  }
};
