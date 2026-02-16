"use client";

import React from "react";
import { Element } from "@craftjs/core";
import { Container } from "../../../design/_designComponents/Container/Container";
import { Text } from "../../../design/_designComponents/Text/Text";
import { Section } from "../../../design/_designComponents/Section/Section";
import { Row } from "../../../design/_designComponents/Row/Row";
import { Column } from "../../../design/_designComponents/Column/Column";
import { TemplateEntry } from "../../_types";

export const LuxuryHeader: TemplateEntry = {
  label: "Luxury Header",
  description: "Elegant header for premium brands",
  preview: "✨",
  element: React.createElement(
    Element as any,
    { is: Section, canvas: true, customStyle: { padding: "0" } },
    React.createElement(
      Element as any,
      { is: Container, background: "#0a0a0a", padding: "24px 48px", canvas: true },
      React.createElement(
        Element as any,
        { is: Row, alignItems: "center", justifyContent: "space-between", canvas: true },
        React.createElement(
          Element as any,
          { is: Column, width: "33%", canvas: true },
          React.createElement(
            Element as any,
            { is: Row, gap: 32, canvas: true },
            React.createElement(Text, { text: "New", fontSize: 13, color: "#d4d4d8", fontWeight: "300", letterSpacing: "1px" }),
            React.createElement(Text, { text: "Women", fontSize: 13, color: "#d4d4d8", fontWeight: "300", letterSpacing: "1px" }),
            React.createElement(Text, { text: "Men", fontSize: 13, color: "#d4d4d8", fontWeight: "300", letterSpacing: "1px" })
          )
        ),
        React.createElement(
          Element as any,
          { is: Column, width: "33%", canvas: true },
          React.createElement(Text, { 
            text: "LUXE", 
            fontSize: 28, 
            fontWeight: "400", 
            color: "#ffffff",
            letterSpacing: "8px",
            textAlign: "center",
            fontFamily: "serif"
          })
        ),
        React.createElement(
          Element as any,
          { is: Column, width: "33%", canvas: true },
          React.createElement(
            Element as any,
            { is: Row, justifyContent: "flex-end", gap: 24, canvas: true },
            React.createElement(Text, { text: "Search", fontSize: 13, color: "#d4d4d8", fontWeight: "300" }),
            React.createElement(Text, { text: "Account", fontSize: 13, color: "#d4d4d8", fontWeight: "300" }),
            React.createElement(Text, { text: "Bag (0)", fontSize: 13, color: "#d4d4d8", fontWeight: "300" })
          )
        )
      )
    )
  ),
  category: "header",
};