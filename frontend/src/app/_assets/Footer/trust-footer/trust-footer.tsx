"use client";

import React from "react";
import { Element } from "@craftjs/core";
import { Container } from "../../../design/_designComponents/Container/Container";
import { Text } from "../../../design/_designComponents/Text/Text";
import { Section } from "../../../design/_designComponents/Section/Section";
import { Row } from "../../../design/_designComponents/Row/Row";
import { Column } from "../../../design/_designComponents/Column/Column";
import { TemplateEntry } from "../../_types";

export const TrustFooter: TemplateEntry = {
  label: "Trust Footer",
  description: "Security badges and payment methods for checkout",
  preview: "🔒",
  element: React.createElement(
    Element as any,
    { is: Section, canvas: true, background: "#ffffff", borderTop: "1px solid #e2e8f0", customStyle: { padding: "0" } },
    React.createElement(
      Element as any,
      { is: Container, padding: "40px 24px", canvas: true },
      // Trust badges
      React.createElement(
        Element as any,
        { is: Row, justifyContent: "center", gap: 48, marginBottom: 40, canvas: true },
        React.createElement(
          Element as any,
          { is: Column, width: "auto", textAlign: "center", canvas: true },
          React.createElement(Text, { text: "🔒", fontSize: 32, marginBottom: 8 }),
          React.createElement(Text, { text: "Secure SSL", fontSize: 12, color: "#475569", fontWeight: "500" })
        ),
        React.createElement(
          Element as any,
          { is: Column, width: "auto", textAlign: "center", canvas: true },
          React.createElement(Text, { text: "🛡️", fontSize: 32, marginBottom: 8 }),
          React.createElement(Text, { text: "Buyer Protection", fontSize: 12, color: "#475569", fontWeight: "500" })
        ),
        React.createElement(
          Element as any,
          { is: Column, width: "auto", textAlign: "center", canvas: true },
          React.createElement(Text, { text: "🚚", fontSize: 32, marginBottom: 8 }),
          React.createElement(Text, { text: "Free Shipping", fontSize: 12, color: "#475569", fontWeight: "500" })
        ),
        React.createElement(
          Element as any,
          { is: Column, width: "auto", textAlign: "center", canvas: true },
          React.createElement(Text, { text: "↩️", fontSize: 32, marginBottom: 8 }),
          React.createElement(Text, { text: "30-Day Returns", fontSize: 12, color: "#475569", fontWeight: "500" })
        )
      ),
      
      // Payment methods
      React.createElement(
        Element as any,
        { is: Row, justifyContent: "center", marginBottom: 32, canvas: true },
        React.createElement(
          Element as any,
          { is: Column, width: "auto", textAlign: "center", canvas: true },
          React.createElement(Text, { text: "We accept:", fontSize: 14, color: "#334155", fontWeight: "600", marginBottom: 16 }),
          React.createElement(
            Element as any,
            { is: Row, gap: 16, canvas: true },
            React.createElement(
              Element as any,
              { is: Container, background: "#f1f5f9", padding: "8px 16px", borderRadius: "6px", canvas: true },
              React.createElement(Text, { text: "Visa", fontSize: 13, color: "#0f172a", fontWeight: "500" })
            ),
            React.createElement(
              Element as any,
              { is: Container, background: "#f1f5f9", padding: "8px 16px", borderRadius: "6px", canvas: true },
              React.createElement(Text, { text: "Mastercard", fontSize: 13, color: "#0f172a", fontWeight: "500" })
            ),
            React.createElement(
              Element as any,
              { is: Container, background: "#f1f5f9", padding: "8px 16px", borderRadius: "6px", canvas: true },
              React.createElement(Text, { text: "American Express", fontSize: 13, color: "#0f172a", fontWeight: "500" })
            ),
            React.createElement(
              Element as any,
              { is: Container, background: "#f1f5f9", padding: "8px 16px", borderRadius: "6px", canvas: true },
              React.createElement(Text, { text: "PayPal", fontSize: 13, color: "#0f172a", fontWeight: "500" })
            ),
            React.createElement(
              Element as any,
              { is: Container, background: "#f1f5f9", padding: "8px 16px", borderRadius: "6px", canvas: true },
              React.createElement(Text, { text: "Apple Pay", fontSize: 13, color: "#0f172a", fontWeight: "500" })
            )
          )
        )
      ),
      
      // Security badges
      React.createElement(
        Element as any,
        { is: Row, justifyContent: "center", gap: 24, marginBottom: 32, canvas: true },
        React.createElement(
          Element as any,
          { is: Container, border: "1px solid #cbd5e1", borderRadius: "4px", padding: "8px 16px", canvas: true },
          React.createElement(Text, { text: "Norton Secured", fontSize: 12, color: "#475569" })
        ),
        React.createElement(
          Element as any,
          { is: Container, border: "1px solid #cbd5e1", borderRadius: "4px", padding: "8px 16px", canvas: true },
          React.createElement(Text, { text: "McAfee Secure", fontSize: 12, color: "#475569" })
        ),
        React.createElement(
          Element as any,
          { is: Container, border: "1px solid #cbd5e1", borderRadius: "4px", padding: "8px 16px", canvas: true },
          React.createElement(Text, { text: "GDPR Compliant", fontSize: 12, color: "#475569" })
        )
      ),
      
      // Copyright
      React.createElement(
        Element as any,
        { is: Row, justifyContent: "center", padding: "24px 0 0", borderTop: "1px solid #e2e8f0", canvas: true },
        React.createElement(
          Element as any,
          { is: Column, width: "auto", canvas: true },
          React.createElement(Text, { text: "© 2024 SecureCheckout. All rights reserved.", fontSize: 12, color: "#64748b" })
        )
      )
    )
  ),
  category: "footer",
};