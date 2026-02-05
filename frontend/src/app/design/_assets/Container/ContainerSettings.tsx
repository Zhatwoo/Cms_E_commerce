import React from "react";
import { useNode } from "@craftjs/core";
import { AlignmentControl } from "../../_components/common/controls/AlignmentControl";
import { LayoutControl } from "../../_components/common/controls/LayoutControl";
import { DesignControl } from "../../_components/common/controls/DesignControl";

export const ContainerSettings = () => {
  const {
    background,
    paddingLeft, paddingRight, paddingTop, paddingBottom,
    width, height,
    borderRadius,
    borderColor, borderWidth,
    flexDirection, flexWrap,
    alignItems, justifyContent,
    gap,
    actions: { setProp }
  } = useNode(node => ({
    background: node.data.props.background,
    paddingLeft: node.data.props.paddingLeft,
    paddingRight: node.data.props.paddingRight,
    paddingTop: node.data.props.paddingTop,
    paddingBottom: node.data.props.paddingBottom,
    width: node.data.props.width,
    height: node.data.props.height,
    borderRadius: node.data.props.borderRadius,
    borderColor: node.data.props.borderColor,
    borderWidth: node.data.props.borderWidth,
    flexDirection: node.data.props.flexDirection,
    flexWrap: node.data.props.flexWrap,
    alignItems: node.data.props.alignItems,
    justifyContent: node.data.props.justifyContent,
    gap: node.data.props.gap
  }));

  return (
    <div className="flex flex-col gap-6">
      <AlignmentControl
        flexDirection={flexDirection}
        alignItems={alignItems}
        justifyContent={justifyContent}
        setProp={setProp}
      />

      <div className="w-full h-px bg-brand-medium/20"></div>

      <LayoutControl
        width={width}
        height={height}
        paddingLeft={paddingLeft}
        paddingRight={paddingRight}
        paddingTop={paddingTop}
        paddingBottom={paddingBottom}
        borderRadius={borderRadius}
        flexDirection={flexDirection}
        flexWrap={flexWrap}
        setProp={setProp}
      />

      <div className="w-full h-px bg-brand-medium/20"></div>

      <DesignControl
        background={background}
        borderColor={borderColor}
        borderWidth={borderWidth}
        setProp={setProp}
      />
    </div>
  );
};
