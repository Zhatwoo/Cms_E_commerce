"use client";

import React from "react";
import { Element } from "@craftjs/core";
import { Container } from "../../../design/_designComponents/Container/Container";
import { Text } from "../../../design/_designComponents/Text/Text";
import { Section } from "../../../design/_designComponents/Section/Section";
import { Row } from "../../../design/_designComponents/Row/Row";
import { Column } from "../../../design/_designComponents/Column/Column";
import { TemplateEntry } from "../../_types";

export const HeaderWithMegamenu: TemplateEntry = {
  label: "Header with Mega Menu",
  description: "Navigation with category dropdowns",
  preview: "📱",
  element: React.createElement(
    Element as any,
    { is: Section, canvas: true, customStyle: { padding: "0" } },
    React.createElement(
      Element as any,
      { is: Container, background: "#0f172a", padding: "16px 24px", canvas: true },
      React.createElement(
        Element as any,
        { is: Row, alignItems: "center", justifyContent: "space-between", canvas: true },
        React.createElement(
          Element as any,
          { is: Column, width: "auto", canvas: true },
          React.createElement(Text, { 
            text: "MegaStore", 
            fontSize: 26, 
            fontWeight: "bold", 
            color: "#ffffff" 
          })
        ),
        React.createElement(
          Element as any,
          { is: Column, width: "auto", canvas: true },
          React.createElement(
            Element as any,
            { is: Row, gap: 32, canvas: true },
            React.createElement(Text, { text: "Electronics ▼", fontSize: 16, color: "#f1f5f9" }),
            React.createElement(Text, { text: "Fashion ▼", fontSize: 16, color: "#f1f5f9" }),
            React.createElement(Text, { text: "Home ▼", fontSize: 16, color: "#f1f5f9" }),
            React.createElement(Text, { text: "Sports ▼", fontSize: 16, color: "#f1f5f9" })
          )
        ),
        React.createElement(
          Element as any,
          { is: Column, width: "auto", canvas: true },
          React.createElement(Text, { text: "🛒", fontSize: 20, color: "#ffffff" })
        )
      )
    ),
    React.createElement(
      Element as any,
      { is: Container, background: "#1e293b", padding: "12px 24px", canvas: true },
      React.createElement(
        Element as any,
        { is: Row, alignItems: "center", gap: 40, canvas: true },
        React.createElement(Text, { text: "Today's Deals", fontSize: 14, color: "#94a3b8" }),
        React.createElement(Text, { text: "Best Sellers", fontSize: 14, color: "#94a3b8" }),
        React.createElement(Text, { text: "New Arrivals", fontSize: 14, color: "#94a3b8" }),
        React.createElement(Text, { text: "Gift Cards", fontSize: 14, color: "#94a3b8" }),
        React.createElement(Text, { text: "Clearance", fontSize: 14, color: "#ef4444", fontWeight: "bold" })
      )
    )
  ),
  category: "header",
};