import React, { useEffect, useRef } from "react";
import { useEditor, useNode } from "@craftjs/core";
import { BannerSettings } from "./bannerSettings";
import type { ContainerProps, TypographyProps } from "../../_types/components";

export interface BannerProps extends ContainerProps, TypographyProps {
	text?: string;
}

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
	text = "FLASH SALE: Up to 70% off - Use code SAVE70",
	fontFamily = "Outfit",
	fontWeight = "700",
	fontStyle = "normal",
	fontSize = 13,
	lineHeight = 1.2,
	letterSpacing = 0,
	textAlign = "center",
	textTransform = "none",
	color = "#ffffff",
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
	position = "relative",
	top = "auto",
	right = "auto",
	bottom = "auto",
	left = "auto",
	zIndex = 0,
	customClassName = "",
	children,
	}: BannerProps) => {
	const {
		actions,
		query,
	} = useEditor();
	const {
		id,
		connectors: { connect, drag },
		childNodeIds,
	} = useNode((node) => ({
		childNodeIds: node.data.nodes,
	}));
	const migratedLegacyChildrenRef = useRef(false);

	useEffect(() => {
		if (migratedLegacyChildrenRef.current) return;
		if (!Array.isArray(childNodeIds) || childNodeIds.length !== 1) return;

		const [childId] = childNodeIds;
		let childNode: ReturnType<ReturnType<typeof query.node>["get"]>;
		try {
			childNode = query.node(childId).get();
		} catch {
			return;
		}

		const childDisplayName = String(childNode?.data?.displayName ?? "").toLowerCase();
		if (!childDisplayName.includes("text")) return;

		const childProps = (childNode?.data?.props ?? {}) as { text?: unknown };
		const childText = typeof childProps.text === "string" ? childProps.text : "";

		actions.setProp(id, (props: BannerProps) => {
			if (!props.text || props.text === "FLASH SALE: Up to 70% off - Use code SAVE70") {
				props.text = childText || "FLASH SALE: Up to 70% off - Use code SAVE70";
			}
		});
		actions.delete(childId);
		migratedLegacyChildrenRef.current = true;
	}, [actions, childNodeIds, id, query]);

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
	const resolvedFontSize = Number.isFinite(Number(fontSize)) ? Number(fontSize) : 13;
	const fluidFontMin = Math.max(10, Math.round(resolvedFontSize * 0.8));
	const fluidFontCqw = Math.max(0.1, resolvedFontSize / 12).toFixed(2);
	const hasLegacyChildren = React.Children.count(children) > 0;
	const resolvedText = typeof text === "string" ? text : "FLASH SALE: Up to 70% off - Use code SAVE70";
	const resolvedLineHeight = typeof lineHeight === "number" ? lineHeight : (lineHeight || 1.2);
	const resolvedLetterSpacing = typeof letterSpacing === "number" ? `${letterSpacing}px` : letterSpacing;

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
				background,
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
				position,
				top: position !== "static" ? top : undefined,
				right: position !== "static" ? right : undefined,
				bottom: position !== "static" ? bottom : undefined,
				left: position !== "static" ? left : undefined,
				zIndex: zIndex !== 0 ? zIndex : undefined,
				transform: rotation ? `rotate(${rotation}deg)` : undefined,
			}}
		>
			{hasLegacyChildren ? children : (
				<span
					data-banner-text="true"
					style={{
						display: "block",
						width: "100%",
						margin: 0,
						padding: 0,
						fontFamily,
						fontWeight,
						fontStyle,
						fontSize: `clamp(${fluidFontMin}px, ${fluidFontCqw}cqw, ${resolvedFontSize}px)`,
						lineHeight: resolvedLineHeight,
						letterSpacing: resolvedLetterSpacing,
						textAlign,
						textTransform,
						color,
						whiteSpace: "nowrap",
						overflow: "hidden",
						textOverflow: "ellipsis",
						userSelect: "none",
					}}
				>
					{resolvedText}
				</span>
			)}
		</div>
	);
};

export const BannerDefaultProps: Partial<BannerProps> = {
	text: "FLASH SALE: Up to 70% off - Use code SAVE70",
	fontFamily: "Outfit",
	fontWeight: "700",
	fontStyle: "normal",
	fontSize: 13,
	lineHeight: 1.2,
	letterSpacing: 0,
	textAlign: "center",
	textTransform: "none",
	color: "#ffffff",
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
		canMoveIn: () => false,
	},
	related: {
		settings: BannerSettings,
	},
};
