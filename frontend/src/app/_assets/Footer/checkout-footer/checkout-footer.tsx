"use client";

import React from "react";
import { Element } from "@craftjs/core";
import { Container } from "../../../design/_designComponents/Container/Container";
import { Text } from "../../../design/_designComponents/Text/Text";
import { Section } from "../../../design/_designComponents/Section/Section";
import { Row } from "../../../design/_designComponents/Row/Row";
import { Column } from "../../../design/_designComponents/Column/Column";
import { TemplateEntry } from "../../_types";

export const CheckoutFooter: TemplateEntry = {
  label: "Checkout Footer",
  description: "Minimal footer optimized for checkout pages",
  preview: "🛒",
  element: React.createElement(
    Element as any,
    { is: Section, canvas: true, background: "#ffffff", borderTop: "1px solid #f1f5f9", customStyle: { padding: "0" } },
    React.createElement(
      Element as any,
      { is: Container, padding: "24px", canvas: true },
      React.createElement(
        Element as any,
        { is: Row, justifyContent: "space-between", alignItems: "center", canvas: true },
        React.createElement(
          Element as any,
          { is: Column, width: "auto", canvas: true },
          React.createElement(Text, { text: "© 2024 ShopEase", fontSize: 12, color: "#64748b" })
        ),
        React.createElement(
          Element as any,
          { is: Column, width: "auto", canvas: true },
          React.createElement(
            Element as any,
            { is: Row, gap: 24, canvas: true },
            React.createElement(Text, { text: "Help", fontSize: 12, color: "#2563eb" }),
            React.createElement(Text, { text: "Shipping", fontSize: 12, color: "#2563eb" }),
            React.createElement(Text, { text: "Returns", fontSize: 12, color: "#2563eb" }),
            React.createElement(Text, { text: "Privacy", fontSize: 12, color: "#2563eb" })
          )
        ),
        React.createElement(
          Element as any,
          { is: Column, width: "auto", canvas: true },
          React.createElement(
            Element as any,
            { is: Row, gap: 8, canvas: true },
            React.createElement(Text, { text: "🔒", fontSize: 14 }),
            React.createElement(Text, { text: "Secure Checkout", fontSize: 12, color: "#10b981", fontWeight: "500" })
          )
        )
      ),
      
      // Payment methods mini
      React.createElement(
        Element as any,
        { is: Row, justifyContent: "center", gap: 12, marginTop: 16, canvas: true },
        React.createElement(Text, { text: "Visa", fontSize: 11, color: "#64748b" }),
        React.createElement(Text, { text: "MC", fontSize: 11, color: "#64748b" }),
        React.createElement(Text, { text: "Amex", fontSize: 11, color: "#64748b" }),
        React.createElement(Text, { text: "PayPal", fontSize: 11, color: "#64748b" }),
        React.createElement(Text, { text: "Apple Pay", fontSize: 11, color: "#64748b" })
      ),
      
      // Trust badge
      React.createElement(
        Element as any,
        { is: Row, justifyContent: "center", marginTop: 16, canvas: true },
        React.createElement(
          Element as any,
          { is: Container, background: "#f0fdf4", padding: "6px 12px", borderRadius: "9999px", canvas: true },
          React.createElement(Text, { text: "✓ 100% Secure & Encrypted", fontSize: 11, color: "#166534", fontWeight: "500" })
        )
      )
    )
  ),
  category: "footer",
};