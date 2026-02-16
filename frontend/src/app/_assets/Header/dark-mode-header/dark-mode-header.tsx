"use client";

import React from "react";
import { Element } from "@craftjs/core";
import { Container } from "../../../design/_designComponents/Container/Container";
import { Text } from "../../../design/_designComponents/Text/Text";
import { Section } from "../../../design/_designComponents/Section/Section";
import { Row } from "../../../design/_designComponents/Row/Row";
import { Column } from "../../../design/_designComponents/Column/Column";
import { TemplateEntry } from "../../_types";

export const DarkModeHeader: TemplateEntry = {
  label: "Dark Mode Header",
  description: "Ecommerce header optimized for dark mode",
  preview: "🌙",
  element: React.createElement(
    Element as any,
    { is: Section, canvas: true, customStyle: { padding: "0" } },
    React.createElement(
      Element as any,
      { is: Container, background: "#0f172a", padding: "20px 32px", borderBottom: "1px solid #1e293b", canvas: true },
      React.createElement(
        Element as any,
        { is: Row, alignItems: "center", justifyContent: "space-between", canvas: true },
        React.createElement(
          Element as any,
          { is: Column, width: "auto", canvas: true },
          React.createElement(Text, { 
            text: "NIGHT", 
            fontSize: 22, 
            fontWeight: "600", 
            color: "#f1f5f9",
            letterSpacing: "2px"
          })
        ),
        React.createElement(
          Element as any,
          { is: Column, width: "auto", canvas: true },
          React.createElement(
            Element as any,
            { is: Row, gap: 28, canvas: true },
            React.createElement(Text, { text: "Store", fontSize: 15, color: "#cbd5e1" }),
            React.createElement(Text, { text: "Digital", fontSize: 15, color: "#cbd5e1" }),
            React.createElement(Text, { text: "Gaming", fontSize: 15, color: "#cbd5e1" }),
            React.createElement(Text, { text: "Support", fontSize: 15, color: "#cbd5e1" })
          )
        ),
        React.createElement(
          Element as any,
          { is: Column, width: "auto", canvas: true },
          React.createElement(
            Element as any,
            { is: Row, gap: 20, canvas: true },
            React.createElement(Text, { 
              text: "Connect", 
              fontSize: 14, 
              color: "#3b82f6", 
              fontWeight: "500" 
            }),
            React.createElement(Text, { text: "🌙", fontSize: 20 })
          )
        )
      )
    )
  ),
  category: "header",
};