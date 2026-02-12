"use client";

import React from "react";
import { Element } from "@craftjs/core";
import { Container } from "../../../design/_designComponents/Container/Container";
import { Text } from "../../../design/_designComponents/Text/Text";
import { Section } from "../../../design/_designComponents/Section/Section";
import { Row } from "../../../design/_designComponents/Row/Row";
import { Column } from "../../../design/_designComponents/Column/Column";
import { TemplateEntry } from "../../_types";

export const NewsletterFooter: TemplateEntry = {
  label: "Newsletter Footer",
  description: "Footer with email signup and social proof",
  preview: "📧",
  element: React.createElement(
    Element as any,
    { is: Section, canvas: true, background: "#f8fafc", customStyle: { padding: "0" } },
    // Newsletter section
    React.createElement(
      Element as any,
      { is: Container, background: "linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)", padding: "64px 24px", canvas: true },
      React.createElement(
        Element as any,
        { is: Row, justifyContent: "center", canvas: true },
        React.createElement(
          Element as any,
          { is: Column, width: "50%", textAlign: "center", canvas: true },
          React.createElement(Text, { 
            text: "📬", 
            fontSize: 48, 
            marginBottom: 16 
          }),
          React.createElement(Text, { 
            text: "Stay in the loop", 
            fontSize: 32, 
            fontWeight: "bold", 
            color: "#ffffff",
            marginBottom: 16
          }),
          React.createElement(Text, { 
            text: "Subscribe to get special offers, free giveaways, and exclusive deals.", 
            fontSize: 16, 
            color: "#e2e8f0",
            marginBottom: 32
          }),
          React.createElement(
            Element as any,
            { is: Row, justifyContent: "center", gap: 8, canvas: true },
            React.createElement(
              Element as any,
              { is: Container, background: "#ffffff", padding: "12px 20px", borderRadius: "8px", width: "300px", canvas: true },
              React.createElement(Text, { text: "Your email address", fontSize: 14, color: "#64748b" })
            ),
            React.createElement(
              Element as any,
              { is: Container, background: "#0f172a", padding: "12px 32px", borderRadius: "8px", canvas: true },
              React.createElement(Text, { text: "Subscribe", fontSize: 14, color: "#ffffff", fontWeight: "600" })
            )
          ),
          React.createElement(Text, { 
            text: "No spam, unsubscribe anytime.", 
            fontSize: 12, 
            color: "#cbd5e1",
            marginTop: 16
          })
        )
      )
    ),
    // Footer links
    React.createElement(
      Element as any,
      { is: Container, background: "#ffffff", padding: "32px 24px", borderTop: "1px solid #e2e8f0", canvas: true },
      React.createElement(
        Element as any,
        { is: Row, justifyContent: "space-between", alignItems: "center", canvas: true },
        React.createElement(
          Element as any,
          { is: Column, width: "auto", canvas: true },
          React.createElement(Text, { text: "© 2024 ShopEase. All rights reserved.", fontSize: 12, color: "#64748b" })
        ),
        React.createElement(
          Element as any,
          { is: Column, width: "auto", canvas: true },
          React.createElement(
            Element as any,
            { is: Row, gap: 24, canvas: true },
            React.createElement(Text, { text: "Privacy", fontSize: 12, color: "#475569" }),
            React.createElement(Text, { text: "Terms", fontSize: 12, color: "#475569" }),
            React.createElement(Text, { text: "Contact", fontSize: 12, color: "#475569" })
          )
        )
      )
    )
  ),
  category: "footer",
};