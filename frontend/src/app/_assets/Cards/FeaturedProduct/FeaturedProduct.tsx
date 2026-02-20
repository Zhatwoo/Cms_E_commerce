"use client";

import React from "react";
import { Element } from "@craftjs/core";
import { Container } from "../../../design/_designComponents/Container/Container";
import { Text } from "../../../design/_designComponents/Text/Text";
import { Image } from "../../../design/_designComponents/Image/Image";
import { Button } from "../../../design/_designComponents/Button/Button";
import { TemplateEntry } from "../../_types";

const createFeaturedItem = (badge: string, badgeColor: string) =>
	React.createElement(
		Element as any,
		{
			is: Container as any,
			background: "transparent",
			display: "flex",
			flexDirection: "column",
			alignItems: "center",
			justifyContent: "flex-start",
			gap: 10,
			canvas: true,
		},
		React.createElement(
			Element as any,
			{
				is: Container as any,
				background: "transparent",
				borderWidth: 10,
				borderColor: "#d1d5db",
				borderStyle: "solid",
				borderRadius: 6,
				overflow: "hidden",
				position: "relative",
				width: "100%",
				height: "245px",
				canvas: true,
			},
			React.createElement(Element as any, {
				is: Image as any,
				src: "https://images.unsplash.com/photo-1556228578-8c89e6adf883?auto=format&fit=crop&w=1200&q=80",
				alt: "Featured product image",
				width: "100%",
				height: "100%",
				objectFit: "cover",
				borderRadius: 6,
				allowUpload: true,
			}),
			React.createElement(
				Element as any,
				{
					is: Container as any,
					position: "absolute",
					top: "8px",
					left: "10px",
					background: badgeColor,
					borderRadius: 999,
					paddingTop: 6,
					paddingRight: 12,
					paddingBottom: 6,
					paddingLeft: 12,
					width: "auto",
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
					canvas: true,
				},
				React.createElement(Text as any, {
					text: badge,
					fontSize: 12,
					fontWeight: "500",
					color: "#ffffff",
				})
			)
		),
		React.createElement(Text as any, {
			text: "Product Name",
			fontSize: 18,
			fontWeight: "700",
			textAlign: "center",
			color: "#111827",
		}),
		React.createElement(Text as any, {
			text: "₱ 1,000",
			fontSize: 16,
			fontWeight: "500",
			textAlign: "center",
			color: "#111827",
		}),
		React.createElement(Button as any, {
			label: "Add to Cart",
			backgroundColor: "#d4d4d8",
			textColor: "#111827",
			fontSize: 12,
			fontWeight: "600",
			borderWidth: 1,
			borderColor: "#737373",
			borderRadius: 4,
			paddingTop: 10,
			paddingRight: 34,
			paddingBottom: 10,
			paddingLeft: 34,
			marginTop: 10,
		})
	);

export const FeaturedProduct: TemplateEntry = {
	label: "Featured Product",
	description: "Three featured products with badges, price, and add to cart button",
	preview: "🏷️",
	element: React.createElement(
		Element as any,
		{
			is: Container as any,
			background: "#d4d4d8",
			paddingTop: 24,
			paddingRight: 20,
			paddingBottom: 24,
			paddingLeft: 20,
			display: "grid",
			gridTemplateColumns: "1fr 1fr 1fr",
			gridGap: 28,
			alignItems: "start",
			justifyContent: "stretch",
			canvas: true,
		},
		createFeaturedItem("New Arrival", "#ef4444"),
		createFeaturedItem("Best Seller", "#eab308"),
		createFeaturedItem("Editor's Pick", "#1d4ed8")
	),
	category: "card",
};
