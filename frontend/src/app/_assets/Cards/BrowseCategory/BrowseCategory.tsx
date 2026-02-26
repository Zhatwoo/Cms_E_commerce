"use client";

import React from "react";
import { Element } from "@craftjs/core";
import { Container } from "../../../design/_designComponents/Container/Container";
import { Text } from "../../../design/_designComponents/Text/Text";
import { Image } from "../../../design/_designComponents/Image/Image";
import { Button } from "../../../design/_designComponents/Button/Button";
import { TemplateEntry } from "../../_types";


// Layout grid definition to match the screenshot
const categories = [
	{
		label: "Featured",
		tag: "Featured",
		img: "/img/featured-makeup.png",
		badgeColor: "#ffc107",
		title: "Browse Featured products",
		gridArea: "featured"
	},
	{
		label: "Women's Apparel",
		img: "/img/women-apparel.png",
		title: "Women's Apparel",
		gridArea: "women"
	},
	{
		label: "Men's Apparel",
		img: "/img/men-apparel.png",
		title: "Men's Apparel",
		gridArea: "men"
	},
	{
		label: "Kids' Apparel",
		img: "/img/kids-apparel.png",
		title: "Kids' Apparel",
		gridArea: "kids"
	},
	{
		label: "Accessories",
		img: "/img/accessories.png",
		title: "Accessories",
		gridArea: "accessories"
	},
	{
		label: "New",
		tag: "New",
		img: "/img/new-products.png",
		badgeColor: "#ffc107",
		title: "Browse New products",
		gridArea: "new"
	},
	{
		label: "Sale",
		tag: "Sale",
		img: "/img/sale.png",
		badgeColor: "#ffc107",
		title: "Great Deals 50% OFF",
		gridArea: "sale"
	},
	{
		label: "Trending",
		tag: "Trending",
		img: "/img/trending-products.png",
		badgeColor: "#ffc107",
		title: "Browse Trending products",
		gridArea: "trending"
	},
	{
		label: "Shoes",
		img: "/img/shoes.png",
		title: "Shoes",
		gridArea: "shoes"
	},
	{
		label: "Electronics",
		img: "/img/electronics.png",
		title: "Electronics",
		gridArea: "electronics"
	},
	{
		label: "Top Picks",
		tag: "Top Picks",
		img: "/img/top-picks.png",
		badgeColor: "#ffc107",
		title: "Browse Top Picked products",
		gridArea: "topPicks"
	},
];

// Grid template areas to match the screenshot
const gridTemplate = `
	"featured featured women men"
	"kids accessories new new"
	"sale trending trending shoes"
	"electronics topPicks topPicks topPicks"
`;

export const BrowseCategory: TemplateEntry = {
	label: "Browse Category",
	description: "E-commerce browse category panel with badges and images",
	preview: "🗂️",
	element: React.createElement(
		Element,
		{
			is: Container,
			background: "#f5f5f5",
			paddingTop: 24,
			paddingRight: 24,
			paddingBottom: 40,
			paddingLeft: 24,
			borderRadius: 12,
			boxShadow: "0 2px 8px rgba(0,0,0,0.07)",
			borderWidth: 1,
			borderColor: "#f9fafb",
			borderStyle: "solid",
			canvas: true,
			display: "flex",
			flexDirection: "column",
			alignItems: "flex-start",
			justifyContent: "flex-start",
			width: "100%",
		},
		// Header
		React.createElement(
			Element,
			{
				is: Container,
				display: "flex",
				flexDirection: "row",
				alignItems: "center",
				justifyContent: "center",
				width: "100%",
				marginBottom: 20,
				canvas: true,
			},
			React.createElement(Text, {
				text: "Browse Categories",
				fontSize: 24,
				fontWeight: "700",
				color: "#fff",
				background: "#393939",
				width: "100%",
				paddingTop: 12,
				paddingBottom: 12,
				borderRadius: 6,
				textAlign: "center",
				marginBottom: 0,
			})
		),
		// Grid
		React.createElement(
			Element,
			{
				is: Container,
				display: "grid",
				gridTemplateColumns: "repeat(4, 1fr)",
				gridTemplateRows: "repeat(4, 180px)",
				gridTemplateAreas: gridTemplate,
				gap: 18,
				width: "100%",
				canvas: true,
				alignItems: "stretch",
				justifyItems: "stretch",
				background: "transparent",
			},
			...categories.map((cat) => {
				return React.createElement(
					Element,
					{
						is: Container,
						background: "linear-gradient(120deg, #fff, #bfc2c7 90%)",
						borderRadius: 12,
						boxShadow: "0 2px 8px rgba(0,0,0,0.07)",
						display: "flex",
						flexDirection: "column",
						alignItems: "flex-start",
						justifyContent: "flex-end",
						paddingTop: 18,
						paddingRight: 18,
						paddingBottom: 24,
						paddingLeft: 18,
						position: "relative",
						overflow: "hidden",
						gridArea: cat.gridArea,
						canvas: true,
					},
					cat.tag && React.createElement(
						Element,
						{
							is: Container,
							position: "absolute",
							top: 12,
							left: 12,
							background: cat.badgeColor || "#ffc107",
							borderRadius: 6,
							paddingTop: 2,
							paddingRight: 10,
							paddingBottom: 2,
							paddingLeft: 10,
							width: "auto",
							display: "flex",
							alignItems: "center",
							justifyContent: "center",
							zIndex: 3,
							canvas: true,
						},
						React.createElement(Text, {
							text: cat.tag,
							fontSize: 14,
							fontWeight: "700",
							color: "#222",
						})
					),
					React.createElement(
						Element,
						{
							is: Container,
							position: "absolute",
							right: 12,
							bottom: 24,
							zIndex: 1,
							background: "transparent",
							canvas: true,
						},
						React.createElement(Image, {
							src: cat.img,
							alt: cat.label,
							width: 120,
							height: 120,
							objectFit: "contain",
							borderRadius: 0,
						})
					),
					React.createElement(Text, {
						text: cat.title,
						fontSize: 22,
						fontWeight: "700",
						color: "#fff",
						marginBottom: 12,
						zIndex: 2,
					}),
					React.createElement(Button, {
						label: "Browse",
						backgroundColor: "#fff",
						textColor: "#393939",
						fontSize: 16,
						fontWeight: "600",
						borderWidth: 0,
						borderRadius: 18,
						paddingTop: 6,
						paddingRight: 18,
						paddingBottom: 6,
						paddingLeft: 18,
						marginTop: 6,
						zIndex: 2,
					})
				);
			})
		)
	),
	category: "card",
};
