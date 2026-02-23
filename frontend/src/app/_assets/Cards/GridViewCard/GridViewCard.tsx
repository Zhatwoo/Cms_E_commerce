"use client";

import React from "react";
import { Element } from "@craftjs/core";
import { Container } from "../../../design/_designComponents/Container/Container";
import { Text } from "../../../design/_designComponents/Text/Text";
import { Image } from "../../../design/_designComponents/Image/Image";
import { Button } from "../../../design/_designComponents/Button/Button";
import { TemplateEntry } from "../../_types";

const createGridProductItem = (name: string, price: string, imageText: string) =>
	React.createElement(
		Element as any,
		{
			is: Container as any,
			background: "#ffffff",
			borderWidth: 10,
			borderColor: "#d1d5db",
			borderStyle: "solid",
			display: "flex",
			flexDirection: "column",
			alignItems: "center",
			justifyContent: "flex-start",
			gap: 10,
			padding: 12,
			borderRadius: 6,
			canvas: true,
		},
		React.createElement(
			Element as any,
			{
				is: Container as any,
				background: "transparent",
				position: "relative",
				width: "100%",
				height: "200px",
				canvas: true,
			},
			React.createElement(Element as any, {
				is: Image as any,
				src: `https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=600&q=80&text=${encodeURIComponent(imageText)}`,
				alt: name,
				width: "100%",
				height: "100%",
				objectFit: "cover",
				borderRadius: 4,
				allowUpload: true,
			}),
			React.createElement(
				Element as any,
				{
					is: Container as any,
					position: "absolute",
					top: "8px",
					left: "10px",
					background: "#1e293b",
					borderRadius: 3,
					paddingTop: 5,
					paddingRight: 10,
					paddingBottom: 5,
					paddingLeft: 10,
					width: "auto",
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
					canvas: true,
				},
				React.createElement(Text as any, {
					text: "↩ 50% Off",
					fontSize: 11,
					fontWeight: "600",
					color: "#ffffff",
				})
			)
		),
		React.createElement(Text as any, {
			text: name,
			fontSize: 14,
			fontWeight: "700",
			marginTop: 8,
			textAlign: "center",
			color: "#111827",
		}),
		React.createElement(Text as any, {
			text: price,
			fontSize: 13,
			fontWeight: "500",
			marginTop: 4,
			textAlign: "center",
			color: "#111827",
		}),
		React.createElement(Button as any, {
			label: "Add to Cart",
			backgroundColor: "#ffffff",
			textColor: "#111827",
			fontSize: 12,
			fontWeight: "600",
			borderWidth: 1,
			borderColor: "#111827",
			borderRadius: 3,
			paddingTop: 8,
			paddingRight: 20,
			paddingBottom: 8,
			paddingLeft: 20,
			marginTop: 8,
		})
	);

export const GridViewCard: TemplateEntry = {
	label: "Products Grid View",
	description: "Rows and columns layout with product image, name, price, and rating",
	preview: "🧩",
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
			gap: 12,
			canvas: true,
		},
		React.createElement(
			Element as any,
			{
				is: Container as any,
				background: "transparent",
				display: "grid",
				gridTemplateColumns: "1fr 1fr 1fr 1fr",
				gridGap: 10,
				alignItems: "stretch",
				justifyContent: "stretch",
				canvas: true,
			},
			createGridProductItem("Product Name", "₱ 1,000", "Bottle"),
			createGridProductItem("Product Name", "₱ 1,000", "Bottle"),
			createGridProductItem("Product Name", "₱ 1,000", "Bottle"),
			createGridProductItem("Product Name", "₱ 1,000", "Bottle")
		)
	),
	category: "card",
};
