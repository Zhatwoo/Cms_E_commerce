"use client";

import React from "react";
import { Element } from "@craftjs/core";
import { Container } from "../../../design/_designComponents/Container/Container";
import { Text } from "../../../design/_designComponents/Text/Text";
import { Button } from "../../../design/_designComponents/Button/Button";
import { Section } from "../../../design/_designComponents/Section/Section";
import { Column } from "../../../design/_designComponents/Column/Column";
import { TemplateEntry } from "../../_types";

export const NewsletterSignup: TemplateEntry = {
  label: "Newsletter Signup",
  description: "Simple newsletter signup block",
  preview: "✉️",
  element: React.createElement(
    Element as any,
    { is: Section as any, canvas: true },
    React.createElement(
      Element as any,
      { is: Container as any, background: "#ffffff", padding: 40, maxWidth: "640px", canvas: true },
      React.createElement(
        Element as any,
        { is: Column as any, canvas: true },
        React.createElement(Text as any, { text: "Subscribe", fontSize: 28, fontWeight: "bold", color: "#1e293b" }),
        React.createElement(Text as any, { text: "Get updates and news straight to your inbox.", fontSize: 14, color: "#64748b" }),
        React.createElement(
          Element as any,
          { is: Container as any, background: "#f8fafc", padding: 12, canvas: true },
          React.createElement(Text as any, { text: "Enter your email", fontSize: 14, color: "#94a3b8" })
        ),
        React.createElement(Button as any, { label: "Subscribe", backgroundColor: "#3b82f6", textColor: "#ffffff", fontSize: 14 })
      )
    )
  ),
  category: "form",
};
