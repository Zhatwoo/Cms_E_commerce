"use client";

import React from "react";
import { Element } from "@craftjs/core";
import { Container } from "../../../design/_designComponents/Container/Container";
import { Row } from "../../../design/_designComponents/Row/Row";
import { Column } from "../../../design/_designComponents/Column/Column";
import { Text } from "../../../design/_designComponents/Text/Text";
import { TemplateEntry } from "../../_types";

function linkLine(text: string) {
  return React.createElement(Text as any, {
    text,
    fontSize: 12,
    color: "#d9d3f1",
    marginBottom: 8,
    lineHeight: 1.35,
  });
}

export const StudioFooter: TemplateEntry = {
  label: "Simple Footer 2",
  description: "Modern two-row footer with CTA and quick links",
  preview: "Studio",
  element: React.createElement(
    Element as any,
    {
      is: Container as any,
      width: "100%",
      background: "#15093E",
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
        background: "#1f0f53",
        paddingTop: 22,
        paddingBottom: 22,
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
          gap: 16,
        },
        React.createElement(
          Element as any,
          {
            is: Column as any,
            width: "52%",
            padding: 0,
            gap: 8,
            canvas: true,
            alignItems: "flex-start",
          },
          React.createElement(Text as any, {
            text: "Build, launch, and sell in one place",
            fontSize: 28,
            color: "#ffffff",
            fontWeight: "700",
            lineHeight: 1.2,
          }),
          React.createElement(Text as any, {
            text: "Ship storefront updates fast with a flexible drag-drop workflow.",
            fontSize: 13,
            color: "#c7bcf2",
          })
        )
      )
    ),
    React.createElement(
      Element as any,
      {
        is: Container as any,
        width: "100%",
        background: "#15093E",
        paddingTop: 26,
        paddingBottom: 16,
        paddingLeft: 28,
        paddingRight: 28,
        canvas: true,
        alignItems: "stretch",
        justifyContent: "flex-start",
      },
      React.createElement(
        Element as any,
        {
          is: Row as any,
          canvas: true,
          alignItems: "flex-start",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 24,
        },
        React.createElement(
          Element as any,
          {
            is: Column as any,
            width: "34%",
            padding: 0,
            gap: 10,
            canvas: true,
            alignItems: "flex-start",
          },
          React.createElement(Text as any, {
            text: "CMS Commerce",
            fontSize: 18,
            color: "#ffffff",
            fontWeight: "700",
          }),
          React.createElement(Text as any, {
            text: "For teams who want speed, control, and modern storefront design.",
            fontSize: 12,
            color: "#c7bcf2",
            lineHeight: 1.45,
          })
        ),
        React.createElement(
          Element as any,
          {
            is: Column as any,
            width: "18%",
            padding: 0,
            gap: 0,
            canvas: true,
            alignItems: "flex-start",
          },
          React.createElement(Text as any, {
            text: "Product",
            fontSize: 12,
            color: "#ffffff",
            fontWeight: "600",
            marginBottom: 10,
          }),
          linkLine("Templates"),
          linkLine("Integrations"),
          linkLine("Analytics"),
          linkLine("Pricing")
        ),
        React.createElement(
          Element as any,
          {
            is: Column as any,
            width: "18%",
            padding: 0,
            gap: 0,
            canvas: true,
            alignItems: "flex-start",
          },
          React.createElement(Text as any, {
            text: "Company",
            fontSize: 12,
            color: "#ffffff",
            fontWeight: "600",
            marginBottom: 10,
          }),
          linkLine("About"),
          linkLine("Careers"),
          linkLine("Partner Program"),
          linkLine("Contact")
        ),
        React.createElement(
          Element as any,
          {
            is: Column as any,
            width: "18%",
            padding: 0,
            gap: 0,
            canvas: true,
            alignItems: "flex-start",
          },
          React.createElement(Text as any, {
            text: "Resources",
            fontSize: 12,
            color: "#ffffff",
            fontWeight: "600",
            marginBottom: 10,
          }),
          linkLine("Docs"),
          linkLine("Guides"),
          linkLine("Status"),
          linkLine("Support")
        )
      )
    ),
    React.createElement(
      Element as any,
      {
        is: Container as any,
        width: "100%",
        background: "#120735",
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
        },
        React.createElement(Text as any, {
          text: "© 2026 CMS Commerce",
          fontSize: 16.3,
          color: "#aa9fdb",
          width: "276px",
        }),
        React.createElement(
          Element as any,
          {
            is: Row as any,
            canvas: true,
            alignItems: "center",
            justifyContent: "flex-end",
            flexWrap: "wrap",
            gap: 18,
          },
          React.createElement(Text as any, { text: "Privacy", fontSize: 11, color: "#aa9fdb" }),
          React.createElement(Text as any, { text: "Terms", fontSize: 11, color: "#aa9fdb" }),
          React.createElement(Text as any, { text: "Cookies", fontSize: 11, color: "#aa9fdb" })
        )
      )
    )
  ),
  category: "footer",
};
