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
    { 
      is: Section, 
      canvas: true, 
      background: "linear-gradient(180deg, #f0f9ff 0%, #e0f2fe 50%, #dbeafe 100%)",
      borderTop: "2px solid #93c5fd",
      customStyle: { padding: "0" } 
    },
    React.createElement(
      Element as any,
      { is: Container, padding: "28px 24px", canvas: true },
      
      // Trust badge with payment methods combined
      React.createElement(
        Element as any,
        { is: Row, justifyContent: "center", alignItems: "center", gap: 24, marginBottom: 24, flexWrap: "wrap", canvas: true },
        React.createElement(
          Element as any,
          { 
            is: Container, 
            background: "linear-gradient(135deg, #10b981 0%, #059669 100%)", 
            padding: "10px 20px", 
            borderRadius: "10px",
            boxShadow: "0 3px 6px rgba(16, 185, 129, 0.25)",
            canvas: true 
          },
          React.createElement(
            Element as any,
            { is: Row, gap: 8, alignItems: "center", canvas: true },
            React.createElement(Text, { text: "🔒", fontSize: 16 }),
            React.createElement(Text, { text: "Secure Checkout", fontSize: 20, color: "#ffffff", fontWeight: "700" })
          )
        ),
        
        // Payment methods inline
        React.createElement(
          Element as any,
          { is: Row, gap: 10, flexWrap: "wrap", canvas: true },
          React.createElement(
            Element as any,
            { 
              is: Container, 
              background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)", 
              padding: "8px 14px", 
              borderRadius: "8px",
              boxShadow: "0 2px 4px rgba(59, 130, 246, 0.2)",
              canvas: true 
            },
            React.createElement(Text, { text: "💳 Visa", fontSize: 20, color: "#ffffff", fontWeight: "600" })
          ),
          React.createElement(
            Element as any,
            { 
              is: Container, 
              background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)", 
              padding: "8px 14px", 
              borderRadius: "8px",
              boxShadow: "0 2px 4px rgba(245, 158, 11, 0.2)",
              canvas: true 
            },
            React.createElement(Text, { text: "💳 MC", fontSize: 20, color: "#ffffff", fontWeight: "600" })
          ),
          React.createElement(
            Element as any,
            { 
              is: Container, 
              background: "linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)", 
              padding: "8px 14px", 
              borderRadius: "8px",
              boxShadow: "0 2px 4px rgba(139, 92, 246, 0.2)",
              canvas: true 
            },
            React.createElement(Text, { text: "💳 Amex", fontSize: 20, color: "#ffffff", fontWeight: "600" })
          ),
          React.createElement(
            Element as any,
            { 
              is: Container, 
              background: "linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)", 
              padding: "8px 14px", 
              borderRadius: "8px",
              boxShadow: "0 2px 4px rgba(14, 165, 233, 0.2)",
              canvas: true 
            },
            React.createElement(Text, { text: "🅿️ PayPal", fontSize: 20, color: "#ffffff", fontWeight: "600" })
          ),
          React.createElement(
            Element as any,
            { 
              is: Container, 
              background: "linear-gradient(135deg, #1f2937 0%, #111827 100%)", 
              padding: "8px 14px", 
              borderRadius: "8px",
              boxShadow: "0 2px 4px rgba(31, 41, 55, 0.2)",
              canvas: true 
            },
            React.createElement(Text, { text: " Pay", fontSize: 20, color: "#ffffff", fontWeight: "600" })
          )
        )
      ),
      
      // Trust indicators - compact
      React.createElement(
        Element as any,
        { is: Row, justifyContent: "center", gap: 32, marginBottom: 20, flexWrap: "wrap", canvas: true },
        React.createElement(
          Element as any,
          { is: Row, gap: 6, alignItems: "center", canvas: true },
          React.createElement(Text, { text: "🚚", fontSize: 14 }),
          React.createElement(Text, { text: "Free Shipping $50+", fontSize: 20, color: "#1e40af", fontWeight: "600" })
        ),
        React.createElement(
          Element as any,
          { is: Row, gap: 6, alignItems: "center", canvas: true },
          React.createElement(Text, { text: "↩️", fontSize: 14 }),
          React.createElement(Text, { text: "30-Day Returns", fontSize: 20, color: "#1e40af", fontWeight: "600" })
        ),
        React.createElement(
          Element as any,
          { is: Row, gap: 6, alignItems: "center", canvas: true },
          React.createElement(Text, { text: "💬", fontSize: 14 }),
          React.createElement(Text, { text: "24/7 Support", fontSize: 20, color: "#1e40af", fontWeight: "600" })
        )
      ),
      
      // Footer links and copyright - compact
      React.createElement(
        Element as any,
        { is: Column, gap: 12, canvas: true },
        React.createElement(
          Element as any,
          { is: Row, justifyContent: "center", gap: 24, flexWrap: "wrap", canvas: true },
          React.createElement(Text, { text: "Support", fontSize: 20, color: "#2563eb", fontWeight: "600" }),
          React.createElement(Text, { text: "Shipping", fontSize: 20, color: "#2563eb", fontWeight: "600" }),
          React.createElement(Text, { text: "Returns", fontSize: 20, color: "#2563eb", fontWeight: "600" }),
          React.createElement(Text, { text: "Privacy", fontSize: 20, color: "#2563eb", fontWeight: "600" }),
          React.createElement(Text, { text: "Terms", fontSize: 20, color: "#2563eb", fontWeight: "600" })
        ),
        
        React.createElement(
          Element as any,
          { is: Row, justifyContent: "center", canvas: true },
          React.createElement(Text, { text: "© 2024 ShopEase. All rights reserved.", fontSize: 12, color: "#475569" })
        )
      )
    )
  ),
  category: "footer",
};