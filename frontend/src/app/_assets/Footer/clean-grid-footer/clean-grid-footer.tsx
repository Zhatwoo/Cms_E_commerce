"use client";

import React from "react";
import { Element } from "@craftjs/core";
import { Container } from "../../../design/_designComponents/Container/Container";
import { Row } from "../../../design/_designComponents/Row/Row";
import { Column } from "../../../design/_designComponents/Column/Column";
import { Text } from "../../../design/_designComponents/Text/Text";
import { TemplateEntry } from "../../_types";

function item(text: string) {
  return React.createElement(Text as any, {
    text,
    fontSize: 11,
    color: "#2b2f39",
    marginBottom: 8,
  });
}

export const CleanGridFooter: TemplateEntry = {
  label: "Clean Grid Footer",
  description: "Balanced commerce footer with compact columns",
  preview: "Grid",
  element: React.createElement(
    Element as any,
    {
      is: Container as any,
      width: "100%",
      background: "#eef1f5",
      paddingTop: 0,
      paddingBottom: 0,
      paddingLeft: 0,
      paddingRight: 0,
      canvas: true,
      alignItems: "stretch",
      justifyContent: "flex-start",
    },
    React.createElement(
      Element as any,
      {
        is: Container as any,
        width: "100%",
        background: "#f4f6f9",
        paddingTop: 24,
        paddingBottom: 18,
        paddingLeft: 28,
        paddingRight: 28,
        canvas: true,
        alignItems: "stretch",
        justifyContent: "center",
      },
      React.createElement(
        Element as any,
        {
          is: Row as any,
          canvas: true,
          gap: 20,
          flexWrap: "wrap",
          alignItems: "flex-start",
          justifyContent: "space-between",
        },
        React.createElement(
          Element as any,
          {
            is: Column as any,
            width: "30%",
            padding: 0,
            gap: 8,
            canvas: true,
            alignItems: "flex-start",
          },
          React.createElement(Text as any, {
            text: "Clean Grid",
            fontSize: 18,
            color: "#1f2330",
            fontWeight: "700",
          }),
          React.createElement(Text as any, {
            text: "Utility-first footer ready for stores and SaaS pages.",
            fontSize: 11,
            color: "#495063",
            lineHeight: 1.45,
          })
        ),
        React.createElement(
          Element as any,
          {
            is: Column as any,
            width: "16%",
            padding: 0,
            gap: 0,
            canvas: true,
            alignItems: "flex-start",
          },
          React.createElement(Text as any, { text: "Product", fontSize: 11, color: "#1f2330", fontWeight: "700", marginBottom: 10 }),
          item("Pricing"),
          item("Features"),
          item("Security"),
          item("Integrations")
        ),
        React.createElement(
          Element as any,
          {
            is: Column as any,
            width: "16%",
            padding: 0,
            gap: 0,
            canvas: true,
            alignItems: "flex-start",
          },
          React.createElement(Text as any, { text: "Resources", fontSize: 11, color: "#1f2330", fontWeight: "700", marginBottom: 10 }),
          item("Docs"),
          item("Guides"),
          item("API"),
          item("Community")
        ),
        React.createElement(
          Element as any,
          {
            is: Column as any,
            width: "16%",
            padding: 0,
            gap: 0,
            canvas: true,
            alignItems: "flex-start",
          },
          React.createElement(Text as any, { text: "Company", fontSize: 11, color: "#1f2330", fontWeight: "700", marginBottom: 10 }),
          item("About"),
          item("Careers"),
          item("Press"),
          item("Legal")
        ),
        React.createElement(
          Element as any,
          {
            is: Column as any,
            width: "16%",
            padding: 0,
            gap: 0,
            canvas: true,
            alignItems: "flex-start",
          },
          React.createElement(Text as any, { text: "Contact", fontSize: 11, color: "#1f2330", fontWeight: "700", marginBottom: 10 }),
          item("hello@cleangrid.com"),
          item("+63 900 000 0000"),
          item("Manila, PH")
        )
      )
    ),
    React.createElement(
      Element as any,
      {
        is: Container as any,
        width: "100%",
        background: "#e8edf3",
        paddingTop: 10,
        paddingBottom: 10,
        paddingLeft: 28,
        paddingRight: 28,
        canvas: true,
        alignItems: "stretch",
        justifyContent: "center",
      },
      React.createElement(
        Element as any,
        {
          is: Row as any,
          canvas: true,
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 18,
        },
        React.createElement(Text as any, {
          text: "Copyright 2026 Clean Grid",
          fontSize: 11,
          color: "#445064",
        }),
        React.createElement(
          Element as any,
          {
            is: Row as any,
            canvas: true,
            alignItems: "center",
            justifyContent: "flex-end",
            flexWrap: "wrap",
            gap: 16,
          },
          React.createElement(Text as any, { text: "Privacy", fontSize: 11, color: "#445064" }),
          React.createElement(Text as any, { text: "Terms", fontSize: 11, color: "#445064" }),
          React.createElement(Text as any, { text: "Status", fontSize: 11, color: "#445064" })
        )
      )
    )
  ),
  category: "footer",
};
