/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React from "react";
import { Element } from "@craftjs/core";
import { Container } from "../../../design/_designComponents/Container/Container";
import { Row } from "../../../design/_designComponents/Row/Row";
import { Column } from "../../../design/_designComponents/Column/Column";
import { Text } from "../../../design/_designComponents/Text/Text";
import { Image } from "../../../design/_designComponents/Image/Image";
import { Icon } from "../../../design/_designComponents/Icon/Icon";
import { TemplateEntry } from "../../_types";

export const HeaderWithSearch: TemplateEntry = {
	label: "Header With Search",
	description: "Three-column header with nav, centered image, and right icons",
	preview: "Hdr",
	element: React.createElement(
		Element as any,
		{
			is: Container as any,
			canvas: true,
			display: "flex",
			background: "#ffffff",
			width: "100%",
			height: "52px",
			paddingTop: 0,
			paddingRight: 0,
			paddingBottom: 0,
			paddingLeft: 0,
			flexDirection: "row",
			alignItems: "center",
			justifyContent: "center",
			overflow: "hidden",
		},
		React.createElement(
			Element as any,
			{
				is: Row as any,
				canvas: true,
				background: "transparent",
				width: "100%",
				height: "100%",
				minHeight: "100%",
				paddingTop: 6,
				paddingRight: 50,
				paddingBottom: 6,
				paddingLeft: 16,
				gap: 18,
				flexWrap: "wrap",
				alignItems: "center",
				justifyContent: "space-between",
			},
			React.createElement(
				Element as any,
				{
					is: Column as any,
					canvas: true,
					customClassName: "min-h-0",
					background: "transparent",
					width: "33.33%",
					height: "100%",
					padding: 0,
					flexDirection: "row",
					alignItems: "center",
					justifyContent: "flex-start",
					gap: 26,
				},
				React.createElement(Text as any, {
					text: "Home",
					width: "auto",
					fontSize: 13,
					fontWeight: "700",
					color: "#111111",
				}),
				React.createElement(Text as any, {
					text: "About",
					width: "auto",
					fontSize: 13,
					fontWeight: "700",
					color: "#111111",
				}),
				React.createElement(Text as any, {
					text: "Contact",
					width: "auto",
					fontSize: 13,
					fontWeight: "700",
					color: "#111111",
				})
			),
			React.createElement(
				Element as any,
				{
					is: Column as any,
					canvas: true,
					customClassName: "min-h-0",
					background: "transparent",
					width: "33.33%",
					height: "100%",
					padding: 0,
					flexDirection: "column",
					alignItems: "center",
					justifyContent: "center",
				},
				React.createElement(Image as any, {
					src: "",
					alt: "Image",
					width: "46px",
					height: "32px",
					objectFit: "cover",
					allowUpload: true,
				})
			),
			React.createElement(
				Element as any,
				{
					is: Column as any,
					canvas: true,
					customClassName: "min-h-0",
					background: "transparent",
					width: "33.33%",
					height: "100%",
					padding: 0,
					flexDirection: "row",
					alignItems: "center",
					justifyContent: "flex-end",
					gap: 16,
				},
				React.createElement(Icon as any, {
					iconType: "search",
					size: 24,
					color: "#111111",
				}),
				React.createElement(Icon as any, {
					iconType: "bell",
					size: 24,
					color: "#111111",
				})
			)
		)
	),
	category: "header",
};
