"use client";

import React from "react";
import { Element } from "@craftjs/core";
import { Container } from "../../../design/_designComponents/Container/Container";
import { Text } from "../../../design/_designComponents/Text/Text";
import { Section } from "../../../design/_designComponents/Section/Section";
import { Row } from "../../../design/_designComponents/Row/Row";
import { Column } from "../../../design/_designComponents/Column/Column";
import { TemplateEntry } from "../../_types";

export const HeaderWithSearch: TemplateEntry = {
  label: "Header with Search",
  description: "Ecommerce header with prominent search bar",
  preview: "🔍",
  element: React.createElement(
    Element as any,
    { is: Section, canvas: true, customStyle: { padding: "0" } },
    React.createElement(
      Element as any,
      { is: Container, background: "#f8fafc", padding: "16px 24px", borderBottom: "1px solid #e2e8f0", canvas: true },
      React.createElement(
        Element as any,
        { is: Row, alignItems: "center", justifyContent: "space-between", canvas: true },
        React.createElement(
          Element as any,
          { is: Column, width: "15%", canvas: true },
          React.createElement(Text, { 
            text: "Market", 
            fontSize: 22, 
            fontWeight: "700", 
            color: "#0f172a" 
          })
        ),
        React.createElement(
          Element as any,
          { is: Column, width: "50%", canvas: true },
          React.createElement(
            Element as any,
            { is: Container, background: "#ffffff", padding: "8px 16px", borderRadius: "9999px", border: "1px solid #cbd5e1", canvas: true },
            React.createElement(
              Element as any,
              { is: Row, alignItems: "center", canvas: true },
              React.createElement(Text, { text: "🔍", fontSize: 18, marginRight: 8 }),
              React.createElement(Text, { text: "Search products...", fontSize: 14, color: "#64748b" })
            )
          )
        ),
        React.createElement(
          Element as any,
          { is: Column, width: "35%", canvas: true },
          React.createElement(
            Element as any,
            { is: Row, justifyContent: "flex-end", gap: 24, canvas: true },
            React.createElement(Text, { text: "Sign In", fontSize: 14, color: "#2563eb", fontWeight: "500" }),
            React.createElement(Text, { text: "🛒", fontSize: 20 }),
            React.createElement(Text, { text: "❤️", fontSize: 20 })
          )
        )
      )
    )
  ),
  category: "header",
};