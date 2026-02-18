"use client";

import React from "react";
import { Element } from "@craftjs/core";
import { Container } from "../../../design/_designComponents/Container/Container";
import { Text } from "../../../design/_designComponents/Text/Text";
import { Button } from "../../../design/_designComponents/Button/Button";
import { Section } from "../../../design/_designComponents/Section/Section";
import { Row } from "../../../design/_designComponents/Row/Row";
import { Column } from "../../../design/_designComponents/Column/Column";
import { TemplateEntry } from "../../_types";

export const AddToCart: TemplateEntry = {
	label: "Add To Cart",
	description: "Landscape cart form with quantity selector, remove item, and coupon",
	preview: "🛒",
	element: React.createElement(
		Element as any,
		{ is: Section as any, background: "#f8fafc", padding: 24, canvas: true },
		React.createElement(
			Element as any,
			{ is: Container as any, background: "#ffffff", padding: 16, maxWidth: "1040px", borderRadius: 16, canvas: true },
			React.createElement(
				Element as any,
				{ is: Row as any, canvas: true, flexWrap: "wrap", alignItems: "stretch", gap: 16 },
				React.createElement(
					Element as any,
					{ is: Column as any, width: "62%", padding: 20, canvas: true },
					React.createElement(Text as any, { text: "Your Cart", fontSize: 28, fontWeight: "bold", color: "#1e293b", marginBottom: 6 }),
					React.createElement(Text as any, { text: "Review your selected product before checkout", fontSize: 14, color: "#64748b", marginBottom: 18 }),
					React.createElement(
						Element as any,
						{ is: Row as any, background: "#f8fafc", borderRadius: 12, padding: 14, alignItems: "center", justifyContent: "space-between", canvas: true },
						React.createElement(
							Element as any,
							{ is: Column as any, width: "44%", canvas: true },
							React.createElement(Text as any, { text: "Premium Product", fontSize: 16, fontWeight: "600", color: "#0f172a", marginBottom: 4 }),
							React.createElement(Text as any, { text: "$49.00", fontSize: 14, color: "#64748b" })
						),
						React.createElement(
							Element as any,
							{ is: Column as any, width: "28%", canvas: true },
							React.createElement(Text as any, { text: "Quantity selector", fontSize: 12, fontWeight: "500", color: "#475569", marginBottom: 6 }),
							React.createElement(
								Element as any,
								{ is: Container as any, background: "#ffffff", padding: 10, borderWidth: 1, borderColor: "#cbd5e1", borderStyle: "solid", borderRadius: 8, canvas: true },
								React.createElement(Text as any, { text: "−   1   +", fontSize: 14, color: "#334155" })
							)
						),
						React.createElement(
							Element as any,
							{ is: Column as any, width: "22%", alignItems: "flex-end", canvas: true },
							React.createElement(Text as any, { text: "$49.00", fontSize: 16, fontWeight: "600", color: "#0f172a", marginBottom: 6 }),
							React.createElement(Text as any, { text: "Remove item", fontSize: 13, color: "#dc2626" })
						)
					),
					React.createElement(
						Element as any,
						{ is: Row as any, canvas: true, marginTop: 14, gap: 10, alignItems: "center" },
						React.createElement(
							Element as any,
							{ is: Container as any, background: "#ffffff", padding: 12, borderWidth: 1, borderColor: "#cbd5e1", borderStyle: "solid", borderRadius: 10, canvas: true },
							React.createElement(Text as any, { text: "Apply coupon", fontSize: 14, color: "#94a3b8" })
						),
						React.createElement(Button as any, { label: "Apply", backgroundColor: "#0f766e", textColor: "#ffffff", fontSize: 14, borderRadius: 10 })
					)
				),
				React.createElement(
					Element as any,
					{ is: Column as any, width: "34%", background: "#0f172a", borderRadius: 12, padding: 22, canvas: true },
					React.createElement(Text as any, { text: "Order Summary", fontSize: 22, fontWeight: "bold", color: "#ffffff", marginBottom: 14 }),
					React.createElement(
						Element as any,
						{ is: Row as any, justifyContent: "space-between", marginBottom: 8, canvas: true },
						React.createElement(Text as any, { text: "Subtotal", fontSize: 14, color: "#cbd5e1" }),
						React.createElement(Text as any, { text: "$49.00", fontSize: 14, color: "#ffffff" })
					),
					React.createElement(
						Element as any,
						{ is: Row as any, justifyContent: "space-between", marginBottom: 8, canvas: true },
						React.createElement(Text as any, { text: "Discount", fontSize: 14, color: "#cbd5e1" }),
						React.createElement(Text as any, { text: "-$5.00", fontSize: 14, color: "#22c55e" })
					),
					React.createElement(
						Element as any,
						{ is: Row as any, justifyContent: "space-between", marginBottom: 14, canvas: true },
						React.createElement(Text as any, { text: "Total", fontSize: 16, fontWeight: "600", color: "#ffffff" }),
						React.createElement(Text as any, { text: "$44.00", fontSize: 16, fontWeight: "600", color: "#ffffff" })
					),
					React.createElement(Button as any, { label: "Checkout", backgroundColor: "#0f766e", textColor: "#ffffff", fontSize: 16, borderRadius: 10 })
				)
			)
		)
	),
	category: "form",
};
