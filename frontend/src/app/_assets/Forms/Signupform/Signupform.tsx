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

export const SignupForm: TemplateEntry = {
	label: "Signup Form",
	description: "Landscape sign up form with full name, email, and password",
	preview: "🧾",
	element: React.createElement(
		Element as any,
		{ is: Section as any, background: "#f1f5f9", padding: 20, canvas: true },
		React.createElement(
			Element as any,
			{ is: Container as any, background: "#ffffff", padding: 16, width: "100%", maxWidth: "980px", borderRadius: 16, canvas: true },
			React.createElement(
				Element as any,
				{ is: Row as any, canvas: true, flexWrap: "wrap", alignItems: "stretch", justifyContent: "center", gap: 16 },
				React.createElement(
					Element as any,
					{ is: Column as any, width: "clamp(280px, 38%, 360px)", background: "#0f766e", borderRadius: 12, padding: 24, justifyContent: "space-between", canvas: true },
					React.createElement(
						Element as any,
						{ is: Column as any, canvas: true },
						React.createElement(Text as any, { text: "Create Your Account", fontSize: 30, fontWeight: "bold", color: "#ffffff", marginBottom: 8 }),
						React.createElement(Text as any, { text: "Join us today to manage your content, products, and orders in one place.", fontSize: 14, color: "#ccfbf1", marginBottom: 20 }),
						React.createElement(Text as any, { text: "• Build your online presence", fontSize: 13, color: "#99f6e4", marginBottom: 6 }),
						React.createElement(Text as any, { text: "• Access your dashboard instantly", fontSize: 13, color: "#99f6e4", marginBottom: 6 }),
						React.createElement(Text as any, { text: "• Start selling with confidence", fontSize: 13, color: "#99f6e4" })
					),
					React.createElement(Text as any, { text: "Already registered? Login to continue.", fontSize: 12, color: "#99f6e4", marginTop: 24 })
				),
				React.createElement(
					Element as any,
					{ is: Column as any, width: "clamp(320px, 58%, 560px)", padding: 24, canvas: true, alignItems: "stretch" },
					React.createElement(Text as any, { text: "Sign Up", fontSize: 28, fontWeight: "bold", color: "#1e293b", marginBottom: 6 }),
					React.createElement(Text as any, { text: "Fill in your details to create a new account", fontSize: 14, color: "#64748b", marginBottom: 22 }),
					React.createElement(
						Element as any,
						{ is: Column as any, canvas: true, marginBottom: 14, alignItems: "stretch" },
						React.createElement(Text as any, { text: "Full Name", fontSize: 14, fontWeight: "500", color: "#334155", marginBottom: 6 }),
						React.createElement(
							Element as any,
							{
								is: Container as any,
								background: "#f8fafc",
								paddingTop: 12,
								paddingBottom: 12,
								paddingLeft: 14,
								paddingRight: 14,
								width: "100%",
								borderWidth: 1,
								borderColor: "#e2e8f0",
								borderStyle: "solid",
								borderRadius: 10,
								canvas: true,
								alignItems: "flex-start",
							},
							React.createElement(Text as any, { text: "Your full name", fontSize: 14, color: "#94a3b8" })
						)
					),
					React.createElement(
						Element as any,
						{ is: Column as any, canvas: true, marginBottom: 14, alignItems: "stretch" },
						React.createElement(Text as any, { text: "Email", fontSize: 14, fontWeight: "500", color: "#334155", marginBottom: 6 }),
						React.createElement(
							Element as any,
							{
								is: Container as any,
								background: "#f8fafc",
								paddingTop: 12,
								paddingBottom: 12,
								paddingLeft: 14,
								paddingRight: 14,
								width: "100%",
								borderWidth: 1,
								borderColor: "#e2e8f0",
								borderStyle: "solid",
								borderRadius: 10,
								canvas: true,
								alignItems: "flex-start",
							},
							React.createElement(Text as any, { text: "you@example.com", fontSize: 14, color: "#94a3b8" })
						)
					),
					React.createElement(
						Element as any,
						{ is: Column as any, canvas: true, marginBottom: 18, alignItems: "stretch" },
						React.createElement(Text as any, { text: "Password", fontSize: 14, fontWeight: "500", color: "#334155", marginBottom: 6 }),
						React.createElement(
							Element as any,
							{
								is: Container as any,
								background: "#f8fafc",
								paddingTop: 12,
								paddingBottom: 12,
								paddingLeft: 14,
								paddingRight: 14,
								width: "100%",
								borderWidth: 1,
								borderColor: "#e2e8f0",
								borderStyle: "solid",
								borderRadius: 10,
								canvas: true,
								alignItems: "flex-start",
							},
							React.createElement(Text as any, { text: "••••••••••", fontSize: 14, color: "#94a3b8" })
						)
					),
					React.createElement(Button as any, { label: "Create Account", width: "100%", backgroundColor: "#0f766e", textColor: "#ffffff", fontSize: 16, borderRadius: 10, paddingTop: 12, paddingBottom: 12 }),
					React.createElement(
						Element as any,
						{ is: Row as any, canvas: true, justifyContent: "center", marginTop: 14, gap: 6 },
						React.createElement(Text as any, { text: "Already have an account?", fontSize: 13, color: "#64748b" }),
						React.createElement(Text as any, { text: "Login", fontSize: 13, color: "#0f766e", fontWeight: "600" })
					)
				)
			)
		)
	),
	category: "form",
};
