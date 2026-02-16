"use client";

import React from "react";
import { Element } from "@craftjs/core";
import { Container } from "../../../design/_designComponents/Container/Container";
import { Text } from "../../../design/_designComponents/Text/Text";
import { Section } from "../../../design/_designComponents/Section/Section";
import { Row } from "../../../design/_designComponents/Row/Row";
import { Column } from "../../../design/_designComponents/Column/Column";
import { TemplateEntry } from "../../_types";

export const SimpleEcommerceHeader: TemplateEntry = {
  label: "Simple Ecommerce Header",
  description: "Clean navigation with cart and search icons",
  preview: "🛍️",
  element: React.createElement(
    Element as any,
    { is: Section, canvas: true, customStyle: { padding: "0" } },
    React.createElement(
      Element as any,
      { is: Container, background: "#ffffff", padding: "16px 24px", canvas: true },
      React.createElement(
        Element as any,
        { is: Row, alignItems: "center", justifyContent: "space-between", canvas: true },
        React.createElement(
          Element as any,
          { is: Column, width: "auto", canvas: true },
          React.createElement(Text, { 
            text: "ShopEase", 
            fontSize: 24, 
            fontWeight: "bold", 
            color: "#2563eb" 
          })
        ),
        React.createElement(
          Element as any,
          { is: Column, width: "auto", canvas: true },
          React.createElement(
            Element as any,
            { is: Row, gap: 24, canvas: true },
            React.createElement(Text, { text: "Home", fontSize: 16, color: "#1e293b" }),
            React.createElement(Text, { text: "Shop", fontSize: 16, color: "#1e293b" }),
            React.createElement(Text, { text: "Deals", fontSize: 16, color: "#1e293b" }),
            React.createElement(Text, { text: "Contact", fontSize: 16, color: "#1e293b" })
          )
        ),
        React.createElement(
          Element as any,
          { is: Column, width: "auto", canvas: true },
          React.createElement(
            Element as any,
            { is: Row, gap: 20, canvas: true },
            React.createElement(Text, { text: "🔍", fontSize: 20 }),
            React.createElement(Text, { text: "🛒", fontSize: 20 }),
            React.createElement(Text, { text: "👤", fontSize: 20 })
          )
        )
      )
    )
  ),
  category: "header",
};