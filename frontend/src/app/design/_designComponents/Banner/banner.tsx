import React from "react";
import { useNode } from "@craftjs/core";
import type { Node } from "@craftjs/core";
import { BannerSettings } from "./bannerSettings";
import type { ContainerProps } from "../../_types/components";

function fluidSpace(value: number, min = 0): string {
	if (!Number.isFinite(value) || value <= 0) return `${value || 0}px`;
	const preferred = Math.max(0.1, value / 12);
	const floor = Math.max(min, Math.round(value * 0.45));
	return `clamp(${floor}px, ${preferred.toFixed(2)}cqw, ${value}px)`;
}

/**
 * Banner - row-like container intended for promo / announcement strips.
 */
export const Banner = ({
	background = "#ef4444",
	padding = 12,
	paddingTop,
	paddingRight,
	paddingBottom,
	paddingLeft,
	margin = 0,
	marginTop,
	marginRight,
	marginBottom,
	marginLeft,
	width = "100%",
	height = "42px",
	borderRadius = 0,
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
}: ContainerProps) => {
	const {
		id,
		connectors: { connect, drag },
		childCount,
	} = useNode((node) => ({
		childCount: node.data.nodes.length,
	}));

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
				minWidth: 0,
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
			{children}
			{childCount === 0 && (
				<div className="text-white/80 text-xs tracking-wide uppercase">Drop text here</div>
			)}
		</div>
	);
};

export const BannerDefaultProps: Partial<ContainerProps> = {
	background: "#ef4444",
	padding: 12,
	margin: 0,
	width: "100%",
	height: "42px",
	borderRadius: 0,
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

Banner.craft = {
	displayName: "Banner",
	props: BannerDefaultProps,
	rules: {
		canMoveIn: (incomingNodes: Node[]) =>
			incomingNodes.every((node) => {
				const name = node.data.displayName;
				return name !== "Page" && name !== "Viewport";
			}),
	},
	related: {
		settings: BannerSettings,
	},
};
