"use client";

import React from "react";
import { Element } from "@craftjs/core";
import { Container } from "../../design/_designComponents/Container/Container";
import { Text } from "../../design/_designComponents/Text/Text";
import { Section } from "../../design/_designComponents/Section/Section";
import { Row } from "../../design/_designComponents/Row/Row";
import { Column } from "../../design/_designComponents/Column/Column";
import { TemplateEntry } from "../_types";

export const FeaturesGrid: TemplateEntry = {
  label: "Features Grid",
  description: "3-column features section",
  preview: "Grid",
  category: "content",
  element: React.createElement(
    Element as any,
    {
      is: Section as any,
      canvas: true,
      background: "#ffffff",
      width: "100%",
      minHeight: "100vh",
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
        width: "min(100%, 1200px)",
        paddingTop: 64,
        paddingBottom: 64,
        paddingLeft: 24,
        paddingRight: 24,
        alignItems: "center",
        gap: 48,
      },

      // Header
      React.createElement(
        Element as any,
        {
          is: Column as any,
          canvas: true,
          background: "transparent",
          padding: 0,
          alignItems: "center",
          gap: 10,
          width: "100%",
        },
        React.createElement(Text as any, {
          text: "Why Choose Us",
          fontSize: 36,
          fontWeight: "700",
          color: "#1e293b",
          textAlign: "center",
        }),
        React.createElement(Text as any, {
          text: "Discover the features that make us stand out",
          fontSize: 18,
          fontWeight: "400",
          color: "#64748b",
          textAlign: "center",
        })
      ),

      // Cards row
      React.createElement(
        Element as any,
        {
          is: Row as any,
          canvas: true,
          background: "transparent",
          padding: 0,
          gap: 24,
          alignItems: "stretch",
          justifyContent: "center",
          flexWrap: "wrap",
          width: "100%",
        },
        ...[1, 2, 3].map((num) =>
          React.createElement(
            Element as any,
            {
              is: Container as any,
              key: num,
              canvas: true,
              background: "#f8fafc",
              width: "min(100%, 340px)",
              flexShrink: 0,
              paddingTop: 32,
              paddingBottom: 32,
              paddingLeft: 28,
              paddingRight: 28,
              borderRadius: 12,
              boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
              flexDirection: "column",
              justifyContent: "flex-start",
              alignItems: "flex-start",
              gap: 10,
            },
            React.createElement(Text as any, {
              text: `Feature ${num}`,
              fontSize: 20,
              fontWeight: "600",
              color: "#1e293b",
            }),
            React.createElement(Text as any, {
              text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
              fontSize: 14,
              fontWeight: "400",
              color: "#64748b",
              lineHeight: 1.6,
            })
          )
        )
      )
    )
  ),
};