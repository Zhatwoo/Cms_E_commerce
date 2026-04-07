import React, { useEffect, useRef } from "react";
import { useEditor, useNode } from "@craftjs/core";
import { BadgeSettings } from "./badgeSettings";
import { useInlineTextEdit } from "../../_components/InlineTextEditContext";
import type { ContainerProps, TypographyProps } from "../../_types/components";

export interface BadgeProps extends ContainerProps, TypographyProps {
	text?: string;
}

function fluidSpace(value: number, min = 0): string {
	if (!Number.isFinite(value) || value <= 0) return `${value || 0}px`;
	const preferred = Math.max(0.1, value / 12);
	const floor = Math.max(min, Math.round(value * 0.45));
	return `clamp(${floor}px, ${preferred.toFixed(2)}cqw, ${value}px)`;
}

export const Badge = ({
	text = "Badge",
	fontFamily = "Outfit",
	fontWeight = "600",
	fontStyle = "normal",
	fontSize = 14,
	lineHeight = 1.2,
	letterSpacing = 0,
	textAlign = "center",
	textTransform = "none",
	color = "#ffffff",
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
	position = "relative",
	top = "auto",
	right = "auto",
	bottom = "auto",
	left = "auto",
	zIndex = 0,
	alignSelf = "auto",
	customClassName = "",
	textDecoration = "none",
	editorVisibility = "auto",
	children,
}: BadgeProps) => {
	const {
		actions,
		query,
	} = useEditor();
	const { editingTextNodeId, setEditingTextNodeId } = useInlineTextEdit();
	const {
		id,
		childNodeIds,
		connectors: { connect, drag },
	} = useNode((node) => ({
		childNodeIds: node.data.nodes,
	}));
	const migratedLegacyChildrenRef = useRef(false);
	const editRef = useRef<HTMLSpanElement | null>(null);
	const didInitEditingRef = useRef(false);
	const pendingTextRef = useRef<string>("");
	const lastSyncedTextRef = useRef<string>("");
	const syncTimeoutRef = useRef<number | null>(null);
	const isEditing = editingTextNodeId === id;

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

		actions.setProp(id, (props: BadgeProps) => {
			if (!props.text || props.text === "Badge") {
				props.text = childText || "Badge";
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
	const badgeMinWidth = width === "fit-content" ? fluidSpace(pl + pr + 48, 48) : 0;
	const resolvedFontSize = Number.isFinite(Number(fontSize)) ? Number(fontSize) : 14;
	const fluidFontMin = Math.max(10, Math.round(resolvedFontSize * 0.8));
	const fluidFontCqw = Math.max(0.1, resolvedFontSize / 12).toFixed(2);
	const hasLegacyChildren = React.Children.count(children) > 0;
	const resolvedText = typeof text === "string" ? text : "Badge";
	const resolvedLineHeight = typeof lineHeight === "number" ? lineHeight : (lineHeight || 1.2);
	const resolvedLetterSpacing = typeof letterSpacing === "number" ? `${letterSpacing}px` : letterSpacing;
	const effectiveDisplay =
		editorVisibility === "hide"
			? "none"
			: editorVisibility === "show" && display === "none"
				? "flex"
				: display;
	const isFlexDisplay = effectiveDisplay === "flex" || effectiveDisplay === "inline-flex";

	useEffect(() => {
		if (hasLegacyChildren && isEditing) {
			setEditingTextNodeId(null);
		}
	}, [hasLegacyChildren, isEditing, setEditingTextNodeId]);

	useEffect(() => {
		if (isEditing && editRef.current && !didInitEditingRef.current) {
			didInitEditingRef.current = true;
			editRef.current.focus();
			editRef.current.innerText = resolvedText;
			const range = document.createRange();
			range.selectNodeContents(editRef.current);
			range.collapse(false);
			const sel = window.getSelection();
			sel?.removeAllRanges();
			sel?.addRange(range);
			return;
		}

		if (!isEditing) {
			didInitEditingRef.current = false;
		}
	}, [isEditing, resolvedText]);

	useEffect(() => {
		if (!isEditing) {
			pendingTextRef.current = resolvedText;
			lastSyncedTextRef.current = resolvedText;
		}
	}, [isEditing, resolvedText]);

	useEffect(() => {
		return () => {
			if (syncTimeoutRef.current !== null) {
				window.clearTimeout(syncTimeoutRef.current);
			}
		};
	}, []);

	const flushPendingTextSync = (force = false) => {
		const nextText = pendingTextRef.current;
		if (!force && nextText === lastSyncedTextRef.current) return;
		actions.setProp(id, (props: BadgeProps) => {
			props.text = nextText;
		});
		lastSyncedTextRef.current = nextText;
	};

	const handleBlur = () => {
		if (!editRef.current) return;
		const nextText = editRef.current.innerText ?? editRef.current.textContent ?? "";
		if (syncTimeoutRef.current !== null) {
			window.clearTimeout(syncTimeoutRef.current);
			syncTimeoutRef.current = null;
		}
		pendingTextRef.current = nextText;
		flushPendingTextSync(true);
		setEditingTextNodeId(null);
	};

	const handleInput = () => {
		if (!editRef.current) return;
		pendingTextRef.current = editRef.current.innerText ?? editRef.current.textContent ?? "";
		if (syncTimeoutRef.current !== null) return;

		syncTimeoutRef.current = window.setTimeout(() => {
			syncTimeoutRef.current = null;
			flushPendingTextSync();
		}, 80);
	};

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === "Enter" && !e.shiftKey) {
			e.preventDefault();
			editRef.current?.blur();
			return;
		}
		if (e.key === "Escape") {
			e.preventDefault();
			if (editRef.current) editRef.current.innerText = resolvedText;
			setEditingTextNodeId(null);
			editRef.current?.blur();
		}
	};

	return (
		<div
			data-node-id={id}
			data-fluid-space="true"
			data-layout="row"
			onMouseDown={(e) => {
				if (isEditing) e.preventDefault();
			}}
			onDragStart={(e) => {
				if (isEditing) e.preventDefault();
			}}
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
				minWidth: badgeMinWidth,
			borderRadius: `${borderRadius}px`,
			...(strokePlacement === "outside" && borderWidth > 0
				? { border: "none", outline: `${borderWidth}px ${borderStyle} ${borderColor}`, outlineOffset: 0 }
				: { borderWidth: `${borderWidth}px`, borderColor, borderStyle }),
			display: effectiveDisplay,
			containerType: "inline-size",
			flexDirection: isFlexDisplay ? flexDirection : undefined,
			flexWrap: isFlexDisplay ? flexWrap : undefined,
			alignItems: isFlexDisplay ? alignItems : undefined,
			justifyContent: isFlexDisplay ? justifyContent : undefined,
			columnGap: isFlexDisplay ? fluidSpace(gap, 0) : undefined,
			rowGap: isFlexDisplay ? fluidSpace(gap, 0) : undefined,
			boxShadow,
			opacity,
			overflow,
			position,
			alignSelf,
			top: position !== "static" ? top : undefined,
			right: position !== "static" ? right : undefined,
			bottom: position !== "static" ? bottom : undefined,
				left: position !== "static" ? left : undefined,
				zIndex: zIndex !== 0 ? zIndex : undefined,
				transform: rotation ? `rotate(${rotation}deg)` : undefined,
			}}
		>
			{hasLegacyChildren ? children : (
				isEditing ? (
					<span
						data-inline-text-edit
						data-badge-text="true"
						ref={editRef}
						contentEditable
						suppressContentEditableWarning
						onMouseDown={(e) => {
							e.stopPropagation();
						}}
						onClick={(e) => {
							e.stopPropagation();
						}}
						onBlur={handleBlur}
						onInput={handleInput}
						onKeyDown={handleKeyDown}
						style={{
							display: "block",
							width: "100%",
							margin: 0,
							padding: 0,
							outline: "none",
							fontFamily,
							fontWeight,
							fontStyle,
							fontSize: `clamp(${fluidFontMin}px, ${fluidFontCqw}cqw, ${resolvedFontSize}px)`,
							lineHeight: resolvedLineHeight,
							letterSpacing: resolvedLetterSpacing,
							textAlign,
							textTransform,
							textDecoration,
							color,
							whiteSpace: "nowrap",
							overflow: "hidden",
							textOverflow: "ellipsis",
							userSelect: "text",
						}}
					/>
				) : (
					<span
						data-badge-text="true"
						onDoubleClick={(e) => {
							if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
							e.stopPropagation();
							setEditingTextNodeId(id);
						}}
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
							textDecoration,
							color,
							whiteSpace: "nowrap",
							overflow: "hidden",
							textOverflow: "ellipsis",
							cursor: "text",
							userSelect: "none",
						}}
					>
						{resolvedText}
					</span>
				)
			)}
		</div>
	);
};

export const BadgeDefaultProps: Partial<BadgeProps> = {
	text: "Badge",
	fontFamily: "Outfit",
	fontWeight: "600",
	fontStyle: "normal",
	fontSize: 14,
	lineHeight: 1.2,
	letterSpacing: 0,
	textAlign: "center",
	textTransform: "none",
	textDecoration: "none",
	color: "#ffffff",
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
		canMoveIn: () => false,
	},
	related: {
		settings: BadgeSettings,
	},
};
