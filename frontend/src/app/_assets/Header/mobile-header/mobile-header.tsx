"use client";

import React from "react";
import { Element } from "@craftjs/core";
import { Container } from "../../../design/_designComponents/Container/Container";
import { Text } from "../../../design/_designComponents/Text/Text";
import { Section } from "../../../design/_designComponents/Section/Section";
import { Row } from "../../../design/_designComponents/Row/Row";
import { Column } from "../../../design/_designComponents/Column/Column";
import { TemplateEntry } from "../../_types";

export const MobileHeader: TemplateEntry = {
  label: "Mobile Header",
  description: "Optimized for mobile shopping",
  preview: "📱",
  element: React.createElement(
    Element as any,
    { is: Section, canvas: true, customStyle: { padding: "0" } },
    React.createElement(
      Element as any,
      { is: Container, background: "#ffffff", padding: "12px 16px", canvas: true },
      React.createElement(
        Element as any,
        { is: Row, alignItems: "center", justifyContent: "space-between", canvas: true },
        React.createElement(
          Element as any,
          { is: Column, width: "auto", canvas: true },
          React.createElement(Text, { text: "☰", fontSize: 24, color: "#0f172a" })
        ),
        React.createElement(
          Element as any,
          { is: Column, width: "auto", canvas: true },
          React.createElement(Text, { 
            text: "SHOP", 
            fontSize: 20, 
            fontWeight: "600", 
            color: "#0f172a",
            letterSpacing: "1px"
          })
        ),
        React.createElement(
          Element as any,
          { is: Column, width: "auto", canvas: true },
          React.createElement(
            Element as any,
            { is: Row, gap: 16, canvas: true },
            React.createElement(Text, { text: "🔍", fontSize: 20 }),
            React.createElement(
              Element as any,
              { is: Container, position: "relative", canvas: true },
              React.createElement(Text, { text: "🛒", fontSize: 20 }),
              React.createElement(
                Element as any,
                { 
                  is: Container, 
                  background: "#ef4444", 
                  borderRadius: "50%", 
                  width: 18, 
                  height: 18, 
                  position: "absolute", 
                  top: -8, 
                  right: -8,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  canvas: true
                },
                React.createElement(Text, { text: "3", fontSize: 11, color: "#ffffff", fontWeight: "bold" })
              )
            )
          )
        )
      )
    ),
    React.createElement(
      Element as any,
      { is: Container, background: "#f1f5f9", padding: "12px 16px", borderTop: "1px solid #e2e8f0", canvas: true },
      React.createElement(
        Element as any,
        { is: Container, background: "#ffffff", padding: "10px 16px", borderRadius: "8px", border: "1px solid #cbd5e1", canvas: true },
        React.createElement(
          Element as any,
          { is: Row, alignItems: "center", gap: 8, canvas: true },
          React.createElement(Text, { text: "🔍", fontSize: 16 }),
          React.createElement(Text, { text: "What are you looking for?", fontSize: 14, color: "#64748b" })
        )
      )
    )
  ),
  category: "header",
};