import React from "react";
import { useNode } from "@craftjs/core";
import type { Node } from "@craftjs/core";
import { BadgeSettings } from "./badgeSettings";
import type { ContainerProps } from "../../_types/components";

export type BadgeProps = ContainerProps;

function fluidSpace(value: number, min = 0): string {
	if (!Number.isFinite(value) || value <= 0) return `${value || 0}px`;
	const preferred = Math.max(0.1, value / 12);
	const floor = Math.max(min, Math.round(value * 0.45));
	return `clamp(${floor}px, ${preferred.toFixed(2)}cqw, ${value}px)`;
}

export const Badge = ({
	background = "#16a34a",
	padding = 8,
	paddingTop,
	paddingRight,
	paddingBottom,
	paddingLeft,
	margin = 0,
	marginTop,
	marginRight,
	marginBottom,
	marginLeft,
	width = "120px",
	height = "36px",
	borderRadius = 999,
	borderColor = "transparent",
	borderWidth = 0,
	borderStyle = "solid",
	strokePlacement = "mid",
	flexDirection = "row",
	flexWrap = "nowrap",
	alignItems = "center",
	justifyContent = "center",
	gap = 8,
	display = "flex",
	boxShadow = "none",
	opacity = 1,
	overflow = "hidden",
	rotation = 0,
	customClassName = "",
	children,
}: BadgeProps) => {
	const {
		id,
		connectors: { connect, drag },
	} = useNode();

	const p = typeof padding === "number" ? padding : 0;
	const pl = paddingLeft ?? p;
	const pr = paddingRight ?? p;
	const pt = paddingTop ?? p;
	const pb = paddingBottom ?? p;

	const m = typeof margin === "number" ? margin : 0;
	const ml = marginLeft ?? m;
	const mr = marginRight ?? m;
	const mt = marginTop ?? m;
	const mb = marginBottom ?? m;
	const badgeMinWidth = width === "fit-content" ? fluidSpace(pl + pr + 48, 48) : 0;

	return (
		<div
			data-node-id={id}
			data-fluid-space="true"
			data-layout="row"
			ref={(ref) => {
				if (ref) connect(drag(ref));
			}}
			className={customClassName}
			style={{
				backgroundColor: background,
				paddingLeft: fluidSpace(pl, 0),
				paddingRight: fluidSpace(pr, 0),
				paddingTop: fluidSpace(pt, 0),
				paddingBottom: fluidSpace(pb, 0),
				marginLeft: fluidSpace(ml, 0),
				marginRight: fluidSpace(mr, 0),
				marginTop: fluidSpace(mt, 0),
				marginBottom: fluidSpace(mb, 0),
				width,
				height,
				boxSizing: "border-box",
				maxWidth: "100%",
				minWidth: badgeMinWidth,
				borderRadius: `${borderRadius}px`,
				...(strokePlacement === "outside" && borderWidth > 0
					? { border: "none", outline: `${borderWidth}px ${borderStyle} ${borderColor}`, outlineOffset: 0 }
					: { borderWidth: `${borderWidth}px`, borderColor, borderStyle }),
				display,
				containerType: "inline-size",
				flexDirection,
				flexWrap,
				alignItems,
				justifyContent,
				columnGap: fluidSpace(gap, 0),
				rowGap: fluidSpace(gap, 0),
				boxShadow,
				opacity,
				overflow,
				transform: rotation ? `rotate(${rotation}deg)` : undefined,
			}}
		>
			<style>{`[data-node-id="${id}"] > [data-fluid-text="true"] { width: 100% !important; text-align: center; margin: 0 !important; padding-top: 0 !important; padding-bottom: 0 !important; }`}</style>
			{children}
		</div>
	);
};

export const BadgeDefaultProps: Partial<BadgeProps> = {
	background: "#16a34a",
	padding: 8,
	margin: 0,
	width: "120px",
	height: "36px",
	borderRadius: 999,
	borderColor: "transparent",
	borderWidth: 0,
	borderStyle: "solid",
	strokePlacement: "mid",
	flexDirection: "row",
	flexWrap: "nowrap",
	alignItems: "center",
	justifyContent: "center",
	gap: 8,
	display: "flex",
	boxShadow: "none",
	opacity: 1,
	overflow: "hidden",
	rotation: 0,
};

Badge.craft = {
	displayName: "Badge",
	props: BadgeDefaultProps,
	rules: {
		canMoveIn: (incomingNodes: Node[]) =>
			incomingNodes.every((node) => {
				const name = node.data.displayName;
				return name !== "Page" && name !== "Viewport";
			}),
	},
	related: {
		settings: BadgeSettings,
	},
};
