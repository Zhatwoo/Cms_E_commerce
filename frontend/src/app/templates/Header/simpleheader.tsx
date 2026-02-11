"use client";

import React from "react";
import { Element } from "@craftjs/core";
import { Container } from "../../design/_designComponents/Container/Container";
import { Text } from "../../design/_designComponents/Text/Text";
import { Section } from "../../design/_designComponents/Section/Section";
import { Row } from "../../design/_designComponents/Row/Row";
import { Column } from "../../design/_designComponents/Column/Column";
import { TemplateEntry } from "../_types";

export const SimpleHeader: TemplateEntry = {
  label: "Simple Header",
  description: "Clean navbar with logo and menu",
  preview: "Nav",
  element: React.createElement(
    Element as any,
    { is: Section as any, canvas: true },
    React.createElement(
      Element as any,
      { is: Container as any, background: "#ffffff", padding: 20, canvas: true },
      React.createElement(
        Element as any,
        { is: Row as any, canvas: true },
        React.createElement(
          Element as any,
          { is: Column as any, canvas: true },
          React.createElement(Text as any, { text: "Logo", fontSize: 24, fontWeight: "bold", color: "#3b82f6" })
        ),
        React.createElement(
          Element as any,
          { is: Column as any, canvas: true },
          React.createElement(
            Element as any,
            { is: Row as any, canvas: true },
            React.createElement(Text as any, { text: "Home", fontSize: 16, color: "#64748b" }),
            React.createElement(Text as any, { text: "About", fontSize: 16, color: "#64748b" }),
            React.createElement(Text as any, { text: "Services", fontSize: 16, color: "#64748b" }),
            React.createElement(Text as any, { text: "Contact", fontSize: 16, color: "#64748b" })
          )
        )
      )
    )
  ),
  category: "header",
};