"use client";

import React from "react";
import { Element } from "@craftjs/core";
import { Container } from "../../../design/_designComponents/Container/Container";
import { Row } from "../../../design/_designComponents/Row/Row";
import { Column } from "../../../design/_designComponents/Column/Column";
import { Text } from "../../../design/_designComponents/Text/Text";
import { TemplateEntry } from "../../_types";

function link(text: string) {
  return React.createElement(Text as any, {
    text,
    fontSize: 12,
    color: "#262626",
    marginBottom: 8,
    lineHeight: 1.3,
  });
}

export const MinimalFooter: TemplateEntry = {
  label: "Minimal Footer",
  description: "Clean neutral footer with subtle sections",
  preview: "Minimal",
  element: React.createElement(
    Element as any,
    {
      is: Container as any,
      width: "100%",
      background: "#f5f5f2",
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
        background: "#f8f8f6",
        paddingTop: 26,
        paddingBottom: 20,
        paddingLeft: 32,
        paddingRight: 32,
        canvas: true,
        alignItems: "stretch",
        justifyContent: "center",
      },
      React.createElement(
        Element as any,
        {
          is: Row as any,
          canvas: true,
          gap: 24,
          flexWrap: "nowrap",
          alignItems: "flex-start",
          justifyContent: "space-between",
        },
        React.createElement(
          Element as any,
          {
            is: Column as any,
            width: "36%",
            padding: 0,
            gap: 10,
            canvas: true,
            alignItems: "flex-start",
          },
          React.createElement(Text as any, {
            text: "MINIMAL STUDIO",
            fontSize: 12,
            color: "#101010",
            fontWeight: "700",
            letterSpacing: 1,
          }),
          React.createElement(Text as any, {
            text: "Quiet design system for focused storefronts.",
            fontSize: 12,
            color: "#4f4f4f",
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
          React.createElement(Text as any, { text: "Pages", fontSize: 12, color: "#151515", fontWeight: "600", marginBottom: 10 }),
          link("Home"),
          link("Shop"),
          link("About"),
          link("Contact")
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
          React.createElement(Text as any, { text: "Help", fontSize: 12, color: "#151515", fontWeight: "600", marginBottom: 10 }),
          link("FAQ"),
          link("Returns"),
          link("Shipping"),
          link("Support")
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
          React.createElement(Text as any, { text: "Social", fontSize: 12, color: "#151515", fontWeight: "600", marginBottom: 10 }),
          link("Instagram"),
          link("X"),
          link("Dribbble"),
          link("Behance")
        )
      )
    ),
    React.createElement(
      Element as any,
      {
        is: Container as any,
        width: "100%",
        background: "#efefeb",
        paddingTop: 12,
        paddingBottom: 12,
        paddingLeft: 32,
        paddingRight: 32,
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
          flexWrap: "nowrap",
          gap: 18,
        },
        React.createElement(Text as any, {
          text: "Copyright 2026 Minimal Studio",
          fontSize: 11,
          color: "#3d3d3d",
        }),
        React.createElement(
          Element as any,
          {
            is: Row as any,
            canvas: true,
            alignItems: "center",
            justifyContent: "flex-end",
            flexWrap: "nowrap",
            gap: 18,
          },
          React.createElement(Text as any, { text: "Privacy", fontSize: 11, color: "#3d3d3d" }),
          React.createElement(Text as any, { text: "Terms", fontSize: 11, color: "#3d3d3d" }),
          React.createElement(Text as any, { text: "Cookies", fontSize: 11, color: "#3d3d3d" })
        )
      )
    )
  ),
  category: "footer",
};
