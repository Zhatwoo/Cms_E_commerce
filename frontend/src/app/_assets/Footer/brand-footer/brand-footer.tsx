"use client";

import React from "react";
import { Element } from "@craftjs/core";
import { Container } from "../../../design/_designComponents/Container/Container";
import { Text } from "../../../design/_designComponents/Text/Text";
import { Section } from "../../../design/_designComponents/Section/Section";
import { Row } from "../../../design/_designComponents/Row/Row";
import { Column } from "../../../design/_designComponents/Column/Column";
import { TemplateEntry } from "../../_types";

export const BrandFooter: TemplateEntry = {
  label: "Brand Footer",
  description: "Logo + brand story with social links",
  preview: "✨",
  element: React.createElement(
    Element as any,
    { is: Section, canvas: true, background: "#fff", customStyle: { padding: "0", borderTop: "1px solid #e5e7eb" } },
    // Subscribe Section
    React.createElement(
      Element as any,
      { is: Container, padding: "40px 0 32px", canvas: true, background: "#fff" },
      React.createElement(
        Element as any,
        { is: Row, alignItems: "center", justifyContent: "space-between", gap: 32, canvas: true },
        React.createElement(
          Element as any,
          { is: Column, width: "40%", canvas: true },
          React.createElement(Text, { text: "Subscribe", fontSize: 28, fontWeight: "700", color: "#222", marginBottom: 12 }),
          React.createElement(Text, { text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.", fontSize: 18, color: "#222", lineHeight: "1.7" })
        ),
        React.createElement(
          Element as any,
          { is: Column, width: "40%", canvas: true, alignItems: "flex-end" },
          React.createElement(
            Element as any,
            { is: Row, alignItems: "center", canvas: true },
            React.createElement(
              "input",
              {
                type: "email",
                placeholder: "Email",
                style: {
                  padding: "12px 20px",
                  border: "1px solid #d1d5db",
                  borderRadius: "8px 0 0 8px",
                  fontSize: 15,
                  outline: "none",
                  width: 220,
                  background: "#fff"
                }
              }
            ),
            React.createElement(
              "button",
              {
                style: {
                  padding: "12px 18px",
                  background: "#222",
                  color: "#fff",
                  border: "none",
                  borderRadius: "0 8px 8px 0",
                  fontWeight: 700,
                  fontSize: 15,
                  cursor: "pointer"
                }
              },
              React.createElement("span", { style: { marginRight: 0 } }, "\u27A4")
            )
          )
        )
      )
    ),
    // Divider
    React.createElement("hr", { style: { border: 0, borderTop: "1px solid #e5e7eb", margin: 0 } }),
    // Main Footer
    React.createElement(
      Element as any,
      { is: Container, padding: "48px 0 32px", canvas: true, background: "#ffff" },
      React.createElement(
        Element as any,
        { is: Row, alignItems: "flex-start", gap: 32, canvas: true },
        // Logo & About
        React.createElement(
          Element as any,
          { is: Column, width: "23%", canvas: true },
          React.createElement(Text, { text: "Placeholder Name", fontSize: 32, fontWeight: "700", color: "#222", marginBottom: 0 }),
          React.createElement(Text, { text: "About Us", fontSize: 20, fontWeight: "600", color: "#222", marginTop: 24, marginBottom: 12 }),
          React.createElement(Text, { text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.", fontSize: 16, color: "#444", lineHeight: "1.7" })
        ),
        // Services
        React.createElement(
          Element as any,
          { is: Column, width: "15%", canvas: true },
          React.createElement(Text, { text: "Services", fontSize: 20, fontWeight: "600", color: "#222", marginBottom: 18 }),
          React.createElement(Text, { text: "Logo", fontSize: 16, color: "#444", marginBottom: 10 }),
          React.createElement(Text, { text: "Web Design", fontSize: 16, color: "#444", marginBottom: 10 }),
          React.createElement(Text, { text: "Branding", fontSize: 16, color: "#444", marginBottom: 10 }),
          React.createElement(Text, { text: "Marketing", fontSize: 16, color: "#444", marginBottom: 10 }),
          React.createElement(Text, { text: "User Testing", fontSize: 16, color: "#444", marginBottom: 10 })
        ),
        // Company
        React.createElement(
          Element as any,
          { is: Column, width: "15%", canvas: true },
          React.createElement(Text, { text: "Company", fontSize: 20, fontWeight: "600", color: "#222", marginBottom: 18 }),
          React.createElement(Text, { text: "Who We Are", fontSize: 16, color: "#444", marginBottom: 10 }),
          React.createElement(Text, { text: "Our Clients", fontSize: 16, color: "#444", marginBottom: 10 }),
          React.createElement(Text, { text: "Mission & Vision", fontSize: 16, color: "#444", marginBottom: 10 }),
          React.createElement(Text, { text: "Careers", fontSize: 16, color: "#444", marginBottom: 10 }),
          React.createElement(Text, { text: "Partners", fontSize: 16, color: "#444", marginBottom: 10 })
        ),
        // Contact
        React.createElement(
          Element as any,
          { is: Column, width: "18%", canvas: true },
          React.createElement(Text, { text: "Contact Us", fontSize: 20, fontWeight: "600", color: "#222", marginBottom: 18 }),
          React.createElement(Text, { text: "Call:", fontSize: 16, color: "#444", marginBottom: 2 }),
          React.createElement(Text, { text: "+0123 456 789", fontSize: 16, color: "#444", marginBottom: 10 }),
          React.createElement(Text, { text: "Email:", fontSize: 16, color: "#444", marginBottom: 2 }),
          React.createElement(Text, { text: "name@gmail.com", fontSize: 16, color: "#444", marginBottom: 18 }),
          React.createElement(Text, { text: "Follow Us", fontSize: 18, fontWeight: "700", color: "#222", marginBottom: 8 }),
          React.createElement(
            Element as any,
            { is: Row, gap: 12, canvas: true },
            React.createElement(Text, { text: "🌐", fontSize: 22 }),
            React.createElement(Text, { text: "📷", fontSize: 22 }),
            React.createElement(Text, { text: "🐦", fontSize: 22 }),
            React.createElement(Text, { text: "✖️", fontSize: 22 }),
            React.createElement(Text, { text: "🎵", fontSize: 22 })
          )
        )
      )
    ),
    // Bottom Bar
    React.createElement(
      "div",
      { style: { background: "#222", color: "#fff", padding: "16px 0 0", marginTop: 0 } },
      React.createElement(
        Element as any,
        { is: Container, padding: "0", canvas: true },
        React.createElement(
          Element as any,
          { is: Row, alignItems: "center", justifyContent: "space-between", gap: 24, canvas: true },
          React.createElement(
            Element as any,
            { is: Row, gap: 32, canvas: true },
            React.createElement(Text, { text: "Privacy Policy", fontSize: 16, color: "#fff" }),
            React.createElement(Text, { text: "Our History", fontSize: 16, color: "#fff" }),
            React.createElement(Text, { text: "What we do", fontSize: 16, color: "#fff" })
          ),
          React.createElement(Text, { text: `© 2026 Name. All Rights Reserved`, fontSize: 16, color: "#fff" })
        )
      )
    )
  ),
  category: "footer",
};