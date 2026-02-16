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

export const HeroWithImage: TemplateEntry = {
  label: "Hero with Image",
  description: "Hero with text and image placeholder",
  preview: "📷 Hero",
  element: React.createElement(
    Element as any,
    { is: Section as any, canvas: true },
    React.createElement(
      Element as any,
      { is: Container as any, background: "#ffffff", padding: 60, canvas: true },
      React.createElement(
        Element as any,
        { is: Row as any, canvas: true },
        React.createElement(
          Element as any,
          { is: Column as any, canvas: true },
          React.createElement(Text as any, { text: "Create Beautiful Websites", fontSize: 40, fontWeight: "bold", color: "#1e293b" }),
          React.createElement(Text as any, { text: "Our visual builder makes it easy to create stunning websites without writing a single line of code.", fontSize: 16, color: "#64748b" }),
          React.createElement(Button as any, { label: "Start Building", backgroundColor: "#10b981", textColor: "#ffffff", fontSize: 16 })
        ),
        React.createElement(
          Element as any,
          { is: Column as any, canvas: true },
          React.createElement(
            Element as any,
            { is: Container as any, background: "linear-gradient(135deg, #a5b4fc, #818cf8)", height: 300, canvas: true },
            React.createElement(Text as any, { text: "Image Placeholder", fontSize: 18, color: "#ffffff" })
          )
        )
      )
    )
  ),
  category: "hero",
};