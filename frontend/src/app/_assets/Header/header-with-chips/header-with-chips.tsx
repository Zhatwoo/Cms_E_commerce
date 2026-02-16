"use client";

import React from "react";
import { Element } from "@craftjs/core";
import { Container } from "../../../design/_designComponents/Container/Container";
import { Text } from "../../../design/_designComponents/Text/Text";
import { Section } from "../../../design/_designComponents/Section/Section";
import { Row } from "../../../design/_designComponents/Row/Row";
import { Column } from "../../../design/_designComponents/Column/Column";
import { TemplateEntry } from "../../_types";

export const HeaderWithChips: TemplateEntry = {
  label: "Header with Category Chips",
  description: "Quick category navigation with chips",
  preview: "🏷️",
  element: React.createElement(
    Element as any,
    { is: Section, canvas: true, customStyle: { padding: "0" } },
    React.createElement(
      Element as any,
      { is: Container, background: "#ffffff", padding: "16px 24px", borderBottom: "1px solid #e2e8f0", canvas: true },
      React.createElement(
        Element as any,
        { is: Row, alignItems: "center", justifyContent: "space-between", canvas: true },
        React.createElement(
          Element as any,
          { is: Column, width: "auto", canvas: true },
          React.createElement(Text, { 
            text: "QuickShop", 
            fontSize: 24, 
            fontWeight: "700", 
            color: "#2563eb" 
          })
        ),
        React.createElement(
          Element as any,
          { is: Column, width: "auto", canvas: true },
          React.createElement(
            Element as any,
            { is: Row, gap: 16, canvas: true },
            React.createElement(Text, { text: "🛒", fontSize: 22 }),
            React.createElement(Text, { text: "👤", fontSize: 22 })
          )
        )
      )
    ),
    React.createElement(
      Element as any,
      { is: Container, background: "#ffffff", padding: "12px 24px", canvas: true },
      React.createElement(
        Element as any,
        { is: Row, gap: 12, canvas: true },
        React.createElement(
          Element as any,
          { is: Container, background: "#2563eb", padding: "6px 16px", borderRadius: "9999px", canvas: true },
          React.createElement(Text, { text: "All", fontSize: 14, color: "#ffffff", fontWeight: "500" })
        ),
        React.createElement(
          Element as any,
          { is: Container, background: "#f1f5f9", padding: "6px 16px", borderRadius: "9999px", canvas: true },
          React.createElement(Text, { text: "Electronics", fontSize: 14, color: "#334155" })
        ),
        React.createElement(
          Element as any,
          { is: Container, background: "#f1f5f9", padding: "6px 16px", borderRadius: "9999px", canvas: true },
          React.createElement(Text, { text: "Fashion", fontSize: 14, color: "#334155" })
        ),
        React.createElement(
          Element as any,
          { is: Container, background: "#f1f5f9", padding: "6px 16px", borderRadius: "9999px", canvas: true },
          React.createElement(Text, { text: "Home & Living", fontSize: 14, color: "#334155" })
        ),
        React.createElement(
          Element as any,
          { is: Container, background: "#f1f5f9", padding: "6px 16px", borderRadius: "9999px", canvas: true },
          React.createElement(Text, { text: "Sports", fontSize: 14, color: "#334155" })
        ),
        React.createElement(
          Element as any,
          { is: Container, background: "#f1f5f9", padding: "6px 16px", borderRadius: "9999px", canvas: true },
          React.createElement(Text, { text: "Books", fontSize: 14, color: "#334155" })
        )
      )
    )
  ),
  category: "header",
};