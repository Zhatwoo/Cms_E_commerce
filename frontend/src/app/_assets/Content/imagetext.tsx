"use client";

import React from "react";
import { Element } from "@craftjs/core";
import { Container } from "../../design/_designComponents/Container/Container";
import { Text } from "../../design/_designComponents/Text/Text";
import { Section } from "../../design/_designComponents/Section/Section";
import { Row } from "../../design/_designComponents/Row/Row";
import { Column } from "../../design/_designComponents/Column/Column";
import { TemplateEntry } from "../_types";

export const ImageText: TemplateEntry = {
  label: "Image + Text",
  description: "Side-by-side image and text content section",
  preview: "ImgTxt",
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
        is: Row as any,
        canvas: true,
        background: "transparent",
        width: "min(100%, 1100px)",
        paddingTop: 72,
        paddingBottom: 72,
        paddingLeft: 24,
        paddingRight: 24,
        gap: 48,
        alignItems: "center",
        justifyContent: "center",
        flexWrap: "wrap",
      },
      // Image placeholder
      React.createElement(
        Element as any,
        {
          is: Container as any,
          canvas: true,
          background: "#f1f5f9",
          width: "min(100%, 480px)",
          height: "380px",
          flexShrink: 0,
          borderRadius: 16,
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          padding: 0,
        },
        React.createElement(Text as any, {
          text: "Image",
          fontSize: 16,
          fontWeight: "500",
          color: "#94a3b8",
          textAlign: "center",
        })
      ),
      // Text content
      React.createElement(
        Element as any,
        {
          is: Column as any,
          canvas: true,
          background: "transparent",
          width: "min(100%, 480px)",
          padding: 0,
          gap: 16,
          alignItems: "flex-start",
        },
        React.createElement(Text as any, {
          text: "Crafted with Care",
          fontSize: 14,
          fontWeight: "600",
          color: "#6366f1",
          letterSpacing: 2,
        }),
        React.createElement(Text as any, {
          text: "Quality You Can Feel",
          fontSize: 36,
          fontWeight: "700",
          color: "#1e293b",
          lineHeight: 1.2,
        }),
        React.createElement(Text as any, {
          text: "We believe in creating products that stand the test of time. Each piece is carefully selected for its quality, design, and sustainability. Our commitment to excellence means you get only the best.",
          fontSize: 16,
          fontWeight: "400",
          color: "#64748b",
          lineHeight: 1.7,
        }),
        // Feature list
        React.createElement(
          Element as any,
          {
            is: Column as any,
            canvas: true,
            background: "transparent",
            padding: 0,
            gap: 10,
            alignItems: "flex-start",
            width: "100%",
          },
          ...["Sustainably sourced materials", "Handcrafted by artisans", "30-day satisfaction guarantee"].map((item, idx) =>
            React.createElement(
              Element as any,
              {
                is: Row as any,
                key: idx,
                canvas: true,
                background: "transparent",
                padding: 0,
                gap: 10,
                alignItems: "center",
                flexWrap: "wrap",
                width: "100%",
              },
              React.createElement(
                Element as any,
                {
                  is: Container as any,
                  canvas: true,
                  background: "#ecfdf5",
                  width: "24px",
                  height: "24px",
                  borderRadius: 12,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: 0,
                  gap: 0,
                  flexShrink: 0,
                },
                React.createElement(Text as any, {
                  text: "\u2713",
                  fontSize: 12,
                  fontWeight: "700",
                  color: "#10b981",
                })
              ),
              React.createElement(Text as any, {
                text: item,
                fontSize: 14,
                fontWeight: "500",
                color: "#475569",
              })
            )
          )
        )
      )
    )
  ),
};
