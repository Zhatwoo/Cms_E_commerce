"use client";

import React from "react";
import { Element } from "@craftjs/core";
import { Container } from "../../design/_designComponents/Container/Container";
import { Text } from "../../design/_designComponents/Text/Text";
import { Section } from "../../design/_designComponents/Section/Section";
import { Row } from "../../design/_designComponents/Row/Row";
import { Column } from "../../design/_designComponents/Column/Column";
import { TemplateEntry } from "../_types";

export const Testimonial: TemplateEntry = {
  label: "Testimonial",
  description: "Customer testimonial with quote",
  preview: "💬",
  element: React.createElement(
    Element as any,
    { is: Section as any, canvas: true },
    React.createElement(
      Element as any,
      { is: Container as any, background: "#f1f5f9", padding: 60, maxWidth: "800px", canvas: true },
      React.createElement(
        Element as any,
        { is: Column as any, canvas: true },
        React.createElement(Text as any, { text: '"Excellent service and support. Highly recommended!"', fontSize: 24, color: "#475569" }),
        React.createElement(
          Element as any,
          { is: Row as any, canvas: true },
          React.createElement(
            Element as any,
            { is: Container as any, background: "#3b82f6", width: 50, height: 50, canvas: true },
            React.createElement(Text as any, { text: "JD", fontSize: 16, color: "#ffffff" })
          ),
          React.createElement(
            Element as any,
            { is: Column as any, canvas: true },
            React.createElement(Text as any, { text: "John Doe", fontSize: 18, fontWeight: "600", color: "#1e293b" }),
            React.createElement(Text as any, { text: "CEO, Company Name", fontSize: 14, color: "#64748b" })
          )
        )
      )
    )
  ),
  category: "content",
};