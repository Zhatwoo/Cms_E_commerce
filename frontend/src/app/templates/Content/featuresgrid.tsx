"use client";

import React from "react";
import { Element } from "@craftjs/core";
import { Container } from "../../design/_designComponents/Container/Container";
import { Text } from "../../design/_designComponents/Text/Text";
import { Section } from "../../design/_designComponents/Section/Section";
import { Row } from "../../design/_designComponents/Row/Row";
import { Column } from "../../design/_designComponents/Column/Column";
import { TemplateEntry } from "../_types";

export const FeaturesGrid: TemplateEntry = {
  label: "Features Grid",
  description: "3-column features section",
  preview: "📊",
  element: React.createElement(
    Element as any,
    { is: Section as any, canvas: true },
    React.createElement(
      Element as any,
      { is: Container as any, background: "#ffffff", padding: 80, canvas: true },
      React.createElement(
        Element as any,
        { is: Column as any, canvas: true },
        React.createElement(Text as any, { text: "Why Choose Us", fontSize: 36, fontWeight: "bold", color: "#1e293b" }),
        React.createElement(Text as any, { text: "Discover the features that make us stand out", fontSize: 18, color: "#64748b" })
      ),
      React.createElement(
        Element as any,
        { is: Row as any, canvas: true },
        [1, 2, 3].map((num) =>
          React.createElement(
            Element as any,
            { is: Column as any, key: num, canvas: true },
            React.createElement(
              Element as any,
              { is: Container as any, background: "#f8fafc", padding: 24, canvas: true },
              React.createElement(Text as any, { text: `Feature ${num}`, fontSize: 20, fontWeight: "600", color: "#1e293b" }),
              React.createElement(Text as any, { text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit.", fontSize: 14, color: "#64748b" })
            )
          )
        )
      )
    )
  ),
  category: "content",
};