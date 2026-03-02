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

	export const LoginForm: TemplateEntry = {
	label: "Login Form",
	description: "Landscape login form with account details",
	preview: "🔐",
	element: React.createElement(
		Element as any,
		{
			is: Section as any,
			background: "#f1f5f9",
			width: "100%",
			paddingTop: 24,
			paddingBottom: 24,
			paddingLeft: 16,
			paddingRight: 16,
			justifyContent: "center",
			alignItems: "center",
			canvas: true,
		},
		React.createElement(
			Element as any,
			{
				is: Container as any,
				background: "#ffffff",
				paddingTop: 16,
				paddingBottom: 16,
				paddingLeft: 16,
				paddingRight: 16,
				width: "min(100%, 980px)",
				borderRadius: 16,
				canvas: true,
			},
			React.createElement(
				Element as any,
				{ is: Row as any, canvas: true, flexWrap: "wrap", alignItems: "stretch", justifyContent: "space-between", gap: 16 },
				React.createElement(
					Element as any,
					{
						is: Column as any,
						width: "min(100%, 340px)",
						background: "#1d4ed8",
						borderRadius: 12,
						padding: 24,
						justifyContent: "space-between",
						minHeight: "360px",
						canvas: true,
					},
					React.createElement(
						Element as any,
						{ is: Column as any, canvas: true },
						React.createElement(Text as any, { text: "Welcome Back", fontSize: 30, fontWeight: "bold", color: "#ffffff", marginBottom: 8 }),
						React.createElement(Text as any, { text: "Securely access your dashboard, orders, and account settings.", fontSize: 14, color: "#dbeafe", marginBottom: 20 }),
						React.createElement(Text as any, { text: "• Fast and secure sign in", fontSize: 13, color: "#bfdbfe", marginBottom: 6 }),
						React.createElement(Text as any, { text: "• Track your activity in real time", fontSize: 13, color: "#bfdbfe", marginBottom: 6 }),
						React.createElement(Text as any, { text: "• Manage profile and preferences", fontSize: 13, color: "#bfdbfe" })
					),
					React.createElement(Text as any, { text: "Need help? support@yourbrand.com", fontSize: 12, color: "#bfdbfe", marginTop: 24 })
				),
				React.createElement(
					Element as any,
					{ is: Column as any, width: "min(100%, 560px)", padding: 24, canvas: true, alignItems: "stretch" },
					React.createElement(Text as any, { text: "Login Form", fontSize: 28, fontWeight: "bold", color: "#1e293b", marginBottom: 6 }),
					React.createElement(Text as any, { text: "Use your credentials to continue", fontSize: 14, color: "#64748b", marginBottom: 22 }),
					React.createElement(
						Element as any,
						{ is: Column as any, canvas: true, marginBottom: 14, alignItems: "stretch" },
						React.createElement(Text as any, { text: "Email / Username", fontSize: 14, fontWeight: "500", color: "#334155", marginBottom: 6 }),
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
						{ is: Column as any, canvas: true, marginBottom: 14, alignItems: "stretch" },
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
					React.createElement(
						Element as any,
						{ is: Row as any, canvas: true, justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", marginBottom: 18, gap: 8 },
						React.createElement(Text as any, { text: "☑ Remember me", fontSize: 13, color: "#64748b" }),
						React.createElement(Text as any, { text: "Forgot password?", fontSize: 13, color: "#2563eb" })
					),
					React.createElement(Button as any, { label: "Login", width: "100%", backgroundColor: "#2563eb", textColor: "#ffffff", fontSize: 16, borderRadius: 10, paddingTop: 12, paddingBottom: 12 }),
					React.createElement(
						Element as any,
						{ is: Row as any, canvas: true, justifyContent: "center", marginTop: 14, gap: 6 },
						React.createElement(Text as any, { text: "Don’t have an account?", fontSize: 13, color: "#64748b" }),
						React.createElement(Text as any, { text: "Sign up", fontSize: 13, color: "#2563eb", fontWeight: "600" })
					)
				)
			)
		)
	),
	category: "form",
};
