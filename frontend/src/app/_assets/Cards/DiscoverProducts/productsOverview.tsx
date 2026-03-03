/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React from "react";
import { Element } from "@craftjs/core";
import { Container } from "../../../design/_designComponents/Container/Container";
import { Text } from "../../../design/_designComponents/Text/Text";
import { Image } from "../../../design/_designComponents/Image/Image";
import { Button } from "../../../design/_designComponents/Button/Button";
import { Section } from "../../../design/_designComponents/Section/Section";
import { Row } from "../../../design/_designComponents/Row/Row";
import { Column } from "../../../design/_designComponents/Column/Column";
import { TemplateEntry } from "../../_types";

const createDiscoverProductCard = () =>
	React.createElement(
		Element as any,
		{
			is: Container as any,
			canvas: true,
			background: "#ebebee",
			width: "clamp(145px, calc(50% - 10px), 280px)",
			flexShrink: 0,
			borderWidth: 1,
			borderStyle: "solid",
			borderColor: "#a9abb3",
			borderRadius: 8,
			padding: 10,
			paddingTop: 4,
			paddingBottom: 12,
			flexDirection: "column",
			alignItems: "stretch",
			justifyContent: "flex-start",
			gap: 14,
		},

		React.createElement(
			Element as any,
			{
				is: Row as any,
				canvas: true,
				background: "transparent",
				padding: 0,
				width: "100%",
				justifyContent: "flex-end",
				alignItems: "center",
				gap: 6,
			},
			React.createElement(
				Element as any,
				{
					is: Row as any,
					canvas: true,
					background: "transparent",
					padding: 0,
					width: "auto",
					gap: 8,
					alignItems: "center",
					justifyContent: "flex-end",
				},
				React.createElement(Text as any, {
					text: "➦",
					fontSize: 18,
					fontWeight: "700",
					color: "#666770",
					lineHeight: 1,
				}),
				React.createElement(Text as any, {
					text: "♡",
					fontSize: 18,
					fontWeight: "700",
					color: "#666770",
					lineHeight: 1,
				})
			)
		),

		React.createElement(
			Element as any,
			{
				is: Container as any,
				canvas: true,
				background: "linear-gradient(180deg, #f0f0f0 0%, #a8a8aa 100%)",
				width: "100%",
				height: 172,
				borderRadius: 3,
				overflow: "hidden",
				padding: 0,
				gap: 0,
				alignItems: "center",
				justifyContent: "center",
			},
			React.createElement(Image as any, {
				src: "",
				alt: "Product Image",
				width: "100%",
				height: "100%",
				objectFit: "cover",
				allowUpload: true,
			})
		),

		React.createElement(
			Element as any,
			{
				is: Row as any,
				canvas: true,
				background: "transparent",
				padding: 0,
				width: "100%",
				justifyContent: "space-between",
				alignItems: "center",
				gap: 8,
			},
			React.createElement(Text as any, {
				text: "Product Name",
				fontSize: 15,
				fontWeight: "600",
				color: "#3f4045",
				lineHeight: 1,
			}),
			React.createElement(Text as any, {
				text: "P 0.00",
				fontSize: 18,
				fontWeight: "700",
				color: "#16171b",
				lineHeight: 1,
			})
		),

		React.createElement(
			Element as any,
			{
				is: Row as any,
				canvas: true,
				background: "transparent",
				padding: 0,
				width: "100%",
				justifyContent: "flex-start",
				alignItems: "center",
				gap: 4,
				marginTop: -4,
			},
			React.createElement(Text as any, {
				text: "5.0",
				fontSize: 14,
				fontWeight: "500",
				color: "#404145",
				lineHeight: 1,
			}),
			React.createElement(Text as any, {
				text: "★★★★★",
				fontSize: 16,
				fontWeight: "700",
				color: "#f1a700",
				lineHeight: 1,
			})
		),

		React.createElement(
			Element as any,
			{
				is: Row as any,
				canvas: true,
				background: "transparent",
				width: "100%",
				padding: 0,
				justifyContent: "space-between",
				alignItems: "center",
				gap: 8,
			},
			React.createElement(Button as any, {
				label: "Add to Cart",
				backgroundColor: "#e8e8ea",
				textColor: "#2a2b2f",
				fontSize: 14,
				fontWeight: "600",
				borderWidth: 1,
				borderStyle: "solid",
				borderColor: "#8f9199",
				borderRadius: 0,
				padding: 12,
				width: "calc(50% - 4px)",
			}),
			React.createElement(Button as any, {
				label: "Buy Now",
				backgroundColor: "#2f3035",
				textColor: "#f6f7f8",
				fontSize: 14,
				fontWeight: "600",
				borderWidth: 1,
				borderStyle: "solid",
				borderColor: "#2f3035",
				borderRadius: 0,
				padding: 12,
				width: "calc(50% - 4px)",
			})
		)
	);

export const ProductsOverview: TemplateEntry = {
	label: "Discover Products",
	description: "Product discovery layout with two-row cards and side navigation",
	preview: "🧾",
	category: "card",
	element: React.createElement(
		Element as any,
		{
			is: Section as any,
			canvas: true,
			background: "#e5e5e8",
			width: "100%",
			minHeight: "100vh",
			padding: 0,
			flexDirection: "column",
			alignItems: "center",
			justifyContent: "flex-start",
			gap: 0,
		},

		React.createElement(
			Element as any,
			{
				is: Container as any,
				canvas: true,
				background: "#2f3035",
				width: "100%",
				padding: 24,
				paddingTop: 12,
				paddingBottom: 12,
				alignItems: "center",
				justifyContent: "center",
				gap: 0,
			},
			React.createElement(Text as any, {
				text: "Discover Products",
				fontSize: 24,
				fontWeight: "700",
				color: "#f6f7f8",
				lineHeight: 1.1,
			})
		),

		React.createElement(
			Element as any,
			{
				is: Row as any,
				canvas: true,
				background: "transparent",
				width: "100%",
				padding: 8,
				paddingTop: 14,
				paddingBottom: 14,
				justifyContent: "center",
				alignItems: "flex-start",
				gap: 0,
			},
			React.createElement(
				Element as any,
				{
					is: Column as any,
					canvas: true,
					background: "transparent",
					width: "min(100%, 1180px)",
					padding: 0,
					alignItems: "stretch",
					justifyContent: "flex-start",
					gap: 14,
				},
				React.createElement(
					Element as any,
					{
						is: Row as any,
						canvas: true,
						background: "transparent",
						width: "100%",
						padding: 0,
						justifyContent: "center",
						alignItems: "stretch",
						gap: 12,
						flexWrap: "wrap",
					},
					createDiscoverProductCard(),
					createDiscoverProductCard(),
					createDiscoverProductCard(),
					createDiscoverProductCard()
				),
				React.createElement(
					Element as any,
					{
						is: Row as any,
						canvas: true,
						background: "transparent",
						width: "100%",
						padding: 0,
						justifyContent: "center",
						alignItems: "stretch",
						gap: 12,
						flexWrap: "wrap",
					},
					createDiscoverProductCard(),
					createDiscoverProductCard(),
					createDiscoverProductCard(),
					createDiscoverProductCard()
				)
			)
		)
	),
}