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

export const ContactForm: TemplateEntry = {
  label: "Contact Form",
  description: "Simple contact form with fields",
  preview: "📝",
  element: React.createElement(
    Element as any,
    { is: Section as any, canvas: true },
    React.createElement(
      Element as any,
      { is: Container as any, background: "#ffffff", padding: 60, maxWidth: "600px", canvas: true },
      React.createElement(
        Element as any,
        { is: Column as any, canvas: true },
        React.createElement(Text as any, { text: "Get In Touch", fontSize: 32, fontWeight: "bold", color: "#1e293b" }),
        React.createElement(Text as any, { text: "Fill out the form below and we'll get back to you soon", fontSize: 16, color: "#64748b" }),
        React.createElement(
          Element as any,
          { is: Column as any, canvas: true },
          React.createElement(
            Element as any,
            { is: Row as any, canvas: true },
            React.createElement(
              Element as any,
              { is: Column as any, canvas: true },
              React.createElement(Text as any, { text: "Name", fontSize: 14, fontWeight: "500", color: "#475569" }),
              React.createElement(
                Element as any,
                { is: Container as any, background: "#f8fafc", padding: 12, canvas: true },
                React.createElement(Text as any, { text: "Your name", fontSize: 14, color: "#94a3b8" })
              )
            ),
            React.createElement(
              Element as any,
              { is: Column as any, canvas: true },
              React.createElement(Text as any, { text: "Email", fontSize: 14, fontWeight: "500", color: "#475569" }),
              React.createElement(
                Element as any,
                { is: Container as any, background: "#f8fafc", padding: 12, canvas: true },
                React.createElement(Text as any, { text: "your@email.com", fontSize: 14, color: "#94a3b8" })
              )
            )
          ),
          React.createElement(
            Element as any,
            { is: Column as any, canvas: true },
            React.createElement(Text as any, { text: "Message", fontSize: 14, fontWeight: "500", color: "#475569" }),
            React.createElement(
              Element as any,
              { is: Container as any, background: "#f8fafc", padding: 12, height: 120, canvas: true },
              React.createElement(Text as any, { text: "Your message here...", fontSize: 14, color: "#94a3b8" })
            )
          ),
          React.createElement(Button as any, { label: "Send Message", backgroundColor: "#3b82f6", textColor: "#ffffff", fontSize: 16 })
        )
      )
    )
  ),
  category: "form",
};