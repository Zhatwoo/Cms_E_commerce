"use client";

import React from "react";
import { Element } from "@craftjs/core";
import { Container } from "../../design/_designComponents/Container/Container";
import { Text } from "../../design/_designComponents/Text/Text";
import { Section } from "../../design/_designComponents/Section/Section";
import { Row } from "../../design/_designComponents/Row/Row";
import { Column } from "../../design/_designComponents/Column/Column";
import { TemplateEntry } from "../_types";

const brands = ["Brand A", "Brand B", "Brand C", "Brand D", "Brand E"];

export const BrandLogos: TemplateEntry = {
  label: "Brand Logos",
  description: "Trust bar with partner/brand logo placeholders",
  preview: "Brands",
  category: "content",
  element: React.createElement(
    Element as any,
    {
      is: Section as any,
      canvas: true,
      background: "#ffffff",
      width: "100%",
      minHeight: "auto",
      padding: 12,
      flexDirection: "column",
      justifyContent: "center",
      alignItems: "center",
    },
    React.createElement(
      Element as any,
      {
        is: Column as any,
        canvas: true,
        background: "transparent",
        width: "min(100%, 1100px)",
        paddingTop: 48,
        paddingBottom: 48,
        paddingLeft: 24,
        paddingRight: 24,
        gap: 28,
        alignItems: "center",
      },
      React.createElement(Text as any, {
        text: "Trusted by Leading Brands",
        fontSize: 14,
        fontWeight: "600",
        color: "#94a3b8",
        textAlign: "center",
        letterSpacing: 2,
      }),
      React.createElement(
        Element as any,
        {
          is: Row as any,
          canvas: true,
          background: "transparent",
          width: "100%",
          padding: 0,
          gap: 32,
          alignItems: "center",
          justifyContent: "center",
          flexWrap: "wrap",
        },
        ...brands.map((brand, idx) =>
          React.createElement(
            Element as any,
            {
              is: Container as any,
              key: idx,
              canvas: true,
              background: "#f8fafc",
              width: "160px",
              height: "72px",
              flexShrink: 0,
              borderRadius: 10,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              padding: 0,
              gap: 0,
            },
            React.createElement(Text as any, {
              text: brand,
              fontSize: 16,
              fontWeight: "600",
              color: "#cbd5e1",
              textAlign: "center",
            })
          )
        )
      ),
      // Divider line
      React.createElement(
        Element as any,
        {
          is: Container as any,
          canvas: true,
          background: "#e2e8f0",
          width: "100%",
          height: "1px",
          padding: 0,
          gap: 0,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
        }
      )
    )
  ),
};
