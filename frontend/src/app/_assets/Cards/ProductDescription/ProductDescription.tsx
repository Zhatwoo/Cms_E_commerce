"use client";

import React from "react";
import { Element } from "@craftjs/core";
import { Container } from "../../../design/_designComponents/Container/Container";
import { Text } from "../../../design/_designComponents/Text/Text";
import { Image } from "../../../design/_designComponents/Image/Image";
import { TemplateEntry } from "../../_types";

const createProductDescriptionItem = () =>
	React.createElement(
		Element as any,
		{
			is: Container as any,
			background: "#ffffff",
			borderWidth: 10,
			borderColor: "#d1d5db",
			borderStyle: "solid",
			borderRadius: 4,
			overflow: "hidden",
			display: "flex",
			flexDirection: "column",
			alignItems: "stretch",
			justifyContent: "flex-start",
			canvas: true,
		},
		React.createElement(Element as any, {
			is: Image as any,
			src: "https://images.unsplash.com/photo-1556228578-8c89e6adf883?auto=format&fit=crop&w=1200&q=80",
			alt: "Product image",
			width: "100%",
			height: "270px",
			objectFit: "cover",
			allowUpload: true,
		}),
		React.createElement(
			Element as any,
			{
				is: Container as any,
				background: "transparent",
				paddingTop: 8,
				paddingRight: 8,
				paddingBottom: 8,
				paddingLeft: 8,
				display: "flex",
				flexDirection: "column",
				alignItems: "stretch",
				justifyContent: "flex-start",
				gap: 6,
				canvas: true,
			},
			React.createElement(Text as any, {
				text: "Lorum ipsum dolor sit amet, consectet",
				fontSize: 30,
				lineHeight: 1.25,
				fontWeight: "500",
				color: "#111827",
			}),
			React.createElement(Text as any, {
				text: "₱ 2,000",
				fontSize: 30,
				lineHeight: 1,
				fontWeight: "700",
				marginTop: 4,
				textAlign: "right",
				color: "#111827",
			})
		)
	);

export const ProductDescription: TemplateEntry = {
	label: "Product Description",
	description: "Four-column product description cards with image and price",
	preview: "🧴",
	element: React.createElement(
		Element as any,
		{
			is: Container as any,
			background: "#d4d4d8",
			padding: 16,
			borderRadius: 0,
			display: "flex",
			flexDirection: "column",
			alignItems: "stretch",
			justifyContent: "flex-start",
			canvas: true,
		},
		React.createElement(
			Element as any,
			{
				is: Container as any,
				background: "transparent",
				display: "grid",
				gridTemplateColumns: "1fr 1fr",
				gridGap: 28,
				alignItems: "stretch",
				justifyContent: "stretch",
				canvas: true,
			},
			createProductDescriptionItem(),
			createProductDescriptionItem()
		)
	),
	category: "card",
};
