"use client";

import React from "react";
import { Element } from "@craftjs/core";
import { Container } from "../../../design/_designComponents/Container/Container";
import { Row } from "../../../design/_designComponents/Row/Row";
import { Column } from "../../../design/_designComponents/Column/Column";
import { Text } from "../../../design/_designComponents/Text/Text";
import { TemplateEntry } from "../../_types";

export const MultiColumnFooter: TemplateEntry = {
	label: "Multi Column Footer",
	description: "Footer with multiple columns",
	preview: "Footer",
	element: React.createElement(
		Element as any,
		{ is: Container as any, background: "#0b1220", padding: 40, canvas: true },
		React.createElement(
			Element as any,
			{ is: Row as any, canvas: true },
			React.createElement(
				Element as any,
				{ is: Column as any, canvas: true },
				React.createElement(Text as any, { text: "About", fontSize: 16, color: "#ffffff" })
			),
			React.createElement(
				Element as any,
				{ is: Column as any, canvas: true },
				React.createElement(Text as any, { text: "Products", fontSize: 16, color: "#ffffff" })
			),
			React.createElement(
				Element as any,
				{ is: Column as any, canvas: true },
				React.createElement(Text as any, { text: "Contact", fontSize: 16, color: "#ffffff" })
			)
		)
	),
	category: "footer",
};

