"use client";

import React from "react";
import { Element } from "@craftjs/core";
import { Container } from "../../design/_designComponents/Container/Container";
import { Text } from "../../design/_designComponents/Text/Text";
import { Button } from "../../design/_designComponents/Button/Button";
import { Section } from "../../design/_designComponents/Section/Section";
import { Row } from "../../design/_designComponents/Row/Row";
import { Column } from "../../design/_designComponents/Column/Column";
import { TemplateEntry } from "../_types";

export const CenteredHero: TemplateEntry = {
  label: "Centered Hero",
  description: "Hero section with centered content",
  preview: "Hero",
  element: React.createElement(
    Element as any,
    { is: Section as any, canvas: true },
    React.createElement(
      Element as any,
      { is: Container as any, background: "#f8fafc", padding: 80, maxWidth: "800px", canvas: true },
      React.createElement(
        Element as any,
        { is: Column as any, canvas: true },
        React.createElement(Text as any, { text: "Welcome to Our Platform", fontSize: 48, fontWeight: "bold", color: "#1e293b" }),
        React.createElement(Text as any, { text: "Build amazing websites with our drag-and-drop editor. No coding required.", fontSize: 18, color: "#64748b" }),
        React.createElement(
          Element as any,
          { is: Row as any, canvas: true },
          React.createElement(Button as any, { label: "Get Started", backgroundColor: "#3b82f6", textColor: "#ffffff", fontSize: 16 }),
          React.createElement(Button as any, { label: "Learn More", backgroundColor: "#ffffff", textColor: "#64748b", fontSize: 16 })
        )
      )
    )
  ),
  category: "hero",
};