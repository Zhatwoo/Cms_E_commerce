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

export const PaymentForm: TemplateEntry = {
	label: "Payment Form",
	description: "Landscape payment form with card details and billing info",
	preview: "💳",
	element: React.createElement(
		Element as any,
		{ is: Section as any, background: "#f1f5f9", padding: 24, canvas: true },
		React.createElement(
			Element as any,
			{ is: Container as any, background: "#ffffff", padding: 16, maxWidth: "1040px", borderRadius: 16, canvas: true },
			React.createElement(
				Element as any,
				{ is: Row as any, canvas: true, flexWrap: "wrap", alignItems: "stretch", gap: 16 },
				React.createElement(
					Element as any,
					{ is: Column as any, width: "60%", padding: 24, canvas: true },
					React.createElement(Text as any, { text: "Secure Payment", fontSize: 28, fontWeight: "bold", color: "#0f172a", marginBottom: 6 }),
					React.createElement(Text as any, { text: "Enter your card details and billing information", fontSize: 14, color: "#64748b", marginBottom: 20 }),
					React.createElement(
						Element as any,
						{ is: Column as any, canvas: true, marginBottom: 14 },
						React.createElement(Text as any, { text: "Card Number", fontSize: 14, fontWeight: "500", color: "#334155", marginBottom: 6 }),
						React.createElement(
							Element as any,
							{ is: Container as any, background: "#f8fafc", padding: 12, borderWidth: 1, borderColor: "#e2e8f0", borderStyle: "solid", borderRadius: 10, canvas: true },
							React.createElement(Text as any, { text: "1234 5678 9012 3456", fontSize: 14, color: "#94a3b8" })
						)
					),
					React.createElement(
						Element as any,
						{ is: Row as any, canvas: true, gap: 12, marginBottom: 14 },
						React.createElement(
							Element as any,
							{ is: Column as any, width: "48%", canvas: true },
							React.createElement(Text as any, { text: "Expiry Date", fontSize: 14, fontWeight: "500", color: "#334155", marginBottom: 6 }),
							React.createElement(
								Element as any,
								{ is: Container as any, background: "#f8fafc", padding: 12, borderWidth: 1, borderColor: "#e2e8f0", borderStyle: "solid", borderRadius: 10, canvas: true },
								React.createElement(Text as any, { text: "MM / YY", fontSize: 14, color: "#94a3b8" })
							)
						),
						React.createElement(
							Element as any,
							{ is: Column as any, width: "48%", canvas: true },
							React.createElement(Text as any, { text: "CVV", fontSize: 14, fontWeight: "500", color: "#334155", marginBottom: 6 }),
							React.createElement(
								Element as any,
								{ is: Container as any, background: "#f8fafc", padding: 12, borderWidth: 1, borderColor: "#e2e8f0", borderStyle: "solid", borderRadius: 10, canvas: true },
								React.createElement(Text as any, { text: "***", fontSize: 14, color: "#94a3b8" })
							)
						)
					),
					React.createElement(
						Element as any,
						{ is: Column as any, canvas: true, marginBottom: 18 },
						React.createElement(Text as any, { text: "Billing Info", fontSize: 14, fontWeight: "500", color: "#334155", marginBottom: 6 }),
						React.createElement(
							Element as any,
							{ is: Container as any, background: "#f8fafc", padding: 12, borderWidth: 1, borderColor: "#e2e8f0", borderStyle: "solid", borderRadius: 10, canvas: true },
							React.createElement(Text as any, { text: "Full billing address", fontSize: 14, color: "#94a3b8" })
						)
					),
					React.createElement(Button as any, { label: "Pay Now", backgroundColor: "#2563eb", textColor: "#ffffff", fontSize: 16, borderRadius: 10 })
				),
				React.createElement(
					Element as any,
					{ is: Column as any, width: "36%", background: "#1e3a8a", borderRadius: 12, padding: 22, justifyContent: "space-between", canvas: true },
					React.createElement(
						Element as any,
						{ is: Column as any, canvas: true },
						React.createElement(Text as any, { text: "Payment Summary", fontSize: 22, fontWeight: "bold", color: "#ffffff", marginBottom: 12 }),
						React.createElement(
							Element as any,
							{ is: Row as any, justifyContent: "space-between", marginBottom: 8, canvas: true },
							React.createElement(Text as any, { text: "Order Total", fontSize: 14, color: "#dbeafe" }),
							React.createElement(Text as any, { text: "₱149.00", fontSize: 14, color: "#ffffff" })
						),
						React.createElement(
							Element as any,
							{ is: Row as any, justifyContent: "space-between", marginBottom: 8, canvas: true },
							React.createElement(Text as any, { text: "Processing Fee", fontSize: 14, color: "#dbeafe" }),
							React.createElement(Text as any, { text: "₱3.00", fontSize: 14, color: "#ffffff" })
						),
						React.createElement(
							Element as any,
							{ is: Row as any, justifyContent: "space-between", marginBottom: 14, canvas: true },
							React.createElement(Text as any, { text: "Final Amount", fontSize: 16, fontWeight: "600", color: "#ffffff" }),
							React.createElement(Text as any, { text: "₱152.00", fontSize: 16, fontWeight: "600", color: "#ffffff" })
						)
					),
					React.createElement(Text as any, { text: "Your payment is encrypted and secure.", fontSize: 12, color: "#bfdbfe", marginTop: 18 })
				)
			)
		)
	),
	category: "form",
};
