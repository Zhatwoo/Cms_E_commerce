"use client";

import React from "react";
import { Element } from "@craftjs/core";
import { Container } from "../../../design/_designComponents/Container/Container";
import { Row } from "../../../design/_designComponents/Row/Row";
import { Column } from "../../../design/_designComponents/Column/Column";
import { Text } from "../../../design/_designComponents/Text/Text";
import { TemplateEntry } from "../../_types";

function menu(text: string) {
  return React.createElement(Text as any, {
    text,
    fontSize: 12,
    color: "#f3eef9",
    marginBottom: 8,
    lineHeight: 1.3,
  });
}

export const AestheticFooter: TemplateEntry = {
  label: "Aesthetic Footer",
  description: "Soft gradient footer with premium link columns",
  preview: "Aesthetic",
  element: React.createElement(
    Element as any,
    {
      is: Container as any,
      width: "100%",
      background: "#2a1248",
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
        background: "#3e1c66",
        paddingTop: 28,
        paddingBottom: 22,
        paddingLeft: 30,
        paddingRight: 30,
        canvas: true,
        alignItems: "stretch",
        justifyContent: "center",
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
            text: "AESTHETICA",
            fontSize: 22,
            color: "#ffffff",
            fontWeight: "700",
            letterSpacing: 0.8,
          }),
          React.createElement(Text as any, {
            text: "Crafted visuals, calm gradients, and storefront experiences that feel premium.",
            fontSize: 12,
            color: "#d5c6ea",
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
          React.createElement(Text as any, { text: "Discover", fontSize: 12, color: "#ffffff", fontWeight: "700", marginBottom: 10 }),
          menu("New Drops"),
          menu("Collections"),
          menu("Season Picks"),
          menu("Lookbook")
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
          React.createElement(Text as any, { text: "Studio", fontSize: 12, color: "#ffffff", fontWeight: "700", marginBottom: 10 }),
          menu("About"),
          menu("Journal"),
          menu("Creators"),
          menu("Contact")
        ),
        React.createElement(
          Element as any,
          {
            is: Column as any,
            width: "20%",
            padding: 0,
            gap: 0,
            canvas: true,
            alignItems: "flex-start",
          },
          React.createElement(Text as any, { text: "Get Updates", fontSize: 12, color: "#ffffff", fontWeight: "700", marginBottom: 10 }),
          menu("Newsletter"),
          menu("Instagram"),
          menu("Pinterest"),
          menu("Support")
        )
      )
    ),
    React.createElement(
      Element as any,
      {
        is: Container as any,
        width: "100%",
        background: "#2f1451",
        paddingTop: 12,
        paddingBottom: 12,
        paddingLeft: 30,
        paddingRight: 30,
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
        React.createElement(Text as any, {
          text: "Copyright 2026 Aesthetica",
          fontSize: 11,
          color: "#ccbfe2",
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
          React.createElement(Text as any, { text: "Privacy", fontSize: 11, color: "#ccbfe2" }),
          React.createElement(Text as any, { text: "Terms", fontSize: 11, color: "#ccbfe2" }),
          React.createElement(Text as any, { text: "Licensing", fontSize: 11, color: "#ccbfe2" })
        )
      )
    )
  ),
  category: "footer",
};
