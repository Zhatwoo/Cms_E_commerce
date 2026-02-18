"use client";

import React from "react";
import { Element } from "@craftjs/core";
import { Container } from "../../../design/_designComponents/Container/Container";
import { Text } from "../../../design/_designComponents/Text/Text";
import { Section } from "../../../design/_designComponents/Section/Section";
import { Row } from "../../../design/_designComponents/Row/Row";
import { Column } from "../../../design/_designComponents/Column/Column";
import { TemplateEntry } from "../../_types";

export const MinimalistSaleHeader: TemplateEntry = {
  label: "Minimalist Sale Header",
  description: "Clean design with sale announcement",
  preview: "🏷️",
  element: React.createElement(
    Element as any,
    { is: Section, canvas: true, customStyle: { padding: "0" } },
    React.createElement(
      Element as any,
      { is: Container, background: "#dc2626", padding: "8px 16px", canvas: true },
      React.createElement(
        Element as any,
        { is: Row, justifyContent: "center", alignItems: "center", canvas: true },
        React.createElement(Text, { 
          text: "⚡ FLASH SALE: Up to 70% off • Use code: SAVE70", 
          fontSize: 13, 
          color: "#ffffff", 
          fontWeight: "500",
          textAlign: "center"
        })
      )
    ),
    React.createElement(
      Element as any,
      { is: Container, background: "#ffffff", padding: "20px 32px", canvas: true },
      React.createElement(
        Element as any,
        { is: Row, alignItems: "center", justifyContent: "space-between", canvas: true },
        React.createElement(
          Element as any,
          { is: Column, width: "auto", canvas: true },
          React.createElement(Text, { 
            text: "minimal.", 
            fontSize: 20, 
            fontWeight: "300", 
            letterSpacing: "2px",
            color: "#18181b" 
          })
        ),
        React.createElement(
          Element as any,
          { is: Column, width: "auto", canvas: true },
          React.createElement(Element as any, { is: Row, gap: 32, canvas: true })
        ),
        React.createElement(
          Element as any,
          { is: Column, width: "auto", canvas: true },
          React.createElement(
            Element as any,
            { is: Row, gap: 16, canvas: true },
            React.createElement(Text, { text: "🔍", fontSize: 18 }),
            React.createElement(Text, { text: "🛍️", fontSize: 18 }),
            React.createElement(Text, { text: "👤", fontSize: 18 })
          )
        )
      )
    )
  ),
  category: "header",
};