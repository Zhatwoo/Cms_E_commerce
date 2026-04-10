"use client";

import React from "react";
import { Element } from "@craftjs/core";
import { Container } from "../../design/_designComponents/Container/Container";
import { Text } from "../../design/_designComponents/Text/Text";
import { Section } from "../../design/_designComponents/Section/Section";
import { Row } from "../../design/_designComponents/Row/Row";
import { Column } from "../../design/_designComponents/Column/Column";
import { TemplateEntry } from "../_types";

const stats = [
  { value: "10K+", label: "Products" },
  { value: "500+", label: "Brands" },
  { value: "98%", label: "Happy Customers" },
  { value: "24/7", label: "Support" },
];

export const StatsCounter: TemplateEntry = {
  label: "Stats Counter",
  description: "Row of statistics with large numbers",
  preview: "Stats",
  category: "content",
  element: React.createElement(
    Element as any,
    {
      is: Section as any,
      canvas: true,
      background: "#0f172a",
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
        is: Row as any,
        canvas: true,
        background: "transparent",
        width: "min(100%, 1100px)",
        paddingTop: 64,
        paddingBottom: 64,
        paddingLeft: 24,
        paddingRight: 24,
        gap: 16,
        alignItems: "center",
        justifyContent: "center",
        flexWrap: "wrap",
      },
      ...stats.map((stat, idx) =>
        React.createElement(
          Element as any,
          {
            is: Container as any,
            key: idx,
            canvas: true,
            background: "rgba(255,255,255,0.05)",
            width: "min(100%, 240px)",
            flexShrink: 0,
            paddingTop: 36,
            paddingBottom: 36,
            paddingLeft: 24,
            paddingRight: 24,
            borderRadius: 16,
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            gap: 6,
          },
          React.createElement(Text as any, {
            text: stat.value,
            fontSize: 40,
            fontWeight: "700",
            color: "#ffffff",
            textAlign: "center",
          }),
          React.createElement(Text as any, {
            text: stat.label,
            fontSize: 14,
            fontWeight: "500",
            color: "#94a3b8",
            textAlign: "center",
            letterSpacing: 1,
          })
        )
      )
    )
  ),
};
