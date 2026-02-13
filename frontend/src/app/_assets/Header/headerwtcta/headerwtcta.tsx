"use client";

import React from "react";
import { Element } from "@craftjs/core";
import { Container } from "../../../design/_designComponents/Container/Container";
import { Text } from "../../../design/_designComponents/Text/Text";
import { Button } from "../../../design/_designComponents/Button/Button";
import { Section } from "../../../design/_designComponents/Section/Section";
import { Row } from "../../../design/_designComponents/Row/Row";
import { Column } from "../../../design/_designComponents/Column/Column";
import { TemplateEntry } from "../../_types";

export const HeaderWithCTA: TemplateEntry = {
  label: "Header with CTA",
  description: "Navigation with call-to-action button",
  preview: "Nav+Btn",
  element: React.createElement(
      Element as any,
      { is: Section as any, canvas: true },
      React.createElement(
        Element as any,
        { is: Container as any, background: "#1e293b", padding: 20, canvas: true },
        React.createElement(
          Element as any,
          { is: Row as any, canvas: true },
          React.createElement(
            Element as any,
            { is: Column as any, canvas: true },
            React.createElement(Text as any, { text: "BrandName", fontSize: 24, fontWeight: "bold", color: "#ffffff" })
          ),
          React.createElement(
            Element as any,
            { is: Column as any, canvas: true },
            React.createElement(
              Element as any,
              { is: Row as any, canvas: true },
              React.createElement(Text as any, { text: "Home", fontSize: 16, color: "#e2e8f0" }),
              React.createElement(Text as any, { text: "Features", fontSize: 16, color: "#e2e8f0" }),
              React.createElement(Text as any, { text: "Pricing", fontSize: 16, color: "#e2e8f0" }),
              React.createElement(Button as any, { backgroundColor: "#3b82f6", textColor: "#ffffff", fontSize: 14, label: "Get Started" })
            )
          )
        )
      )
    ),
  category: "header",
};