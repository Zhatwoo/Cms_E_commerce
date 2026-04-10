"use client";

import React from "react";
import { Element } from "@craftjs/core";
import { Container } from "../../design/_designComponents/Container/Container";
import { Text } from "../../design/_designComponents/Text/Text";
import { Section } from "../../design/_designComponents/Section/Section";
import { Row } from "../../design/_designComponents/Row/Row";
import { Column } from "../../design/_designComponents/Column/Column";
import { TemplateEntry } from "../_types";

export const CTABanner: TemplateEntry = {
  label: "CTA Banner",
  description: "Full-width call-to-action banner with gradient",
  preview: "CTA",
  category: "content",
  element: React.createElement(
    Element as any,
    {
      is: Section as any,
      canvas: true,
      background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a855f7 100%)",
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
        paddingLeft: 40,
        paddingRight: 40,
        gap: 32,
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
      },
      // Text side
      React.createElement(
        Element as any,
        {
          is: Column as any,
          canvas: true,
          background: "transparent",
          width: "min(100%, 560px)",
          padding: 0,
          gap: 12,
          alignItems: "flex-start",
        },
        React.createElement(Text as any, {
          text: "Ready to Transform Your Shopping Experience?",
          fontSize: 32,
          fontWeight: "700",
          color: "#ffffff",
          lineHeight: 1.2,
        }),
        React.createElement(Text as any, {
          text: "Join thousands of satisfied customers and discover products you'll love. Free shipping on orders over $50.",
          fontSize: 16,
          fontWeight: "400",
          color: "rgba(255,255,255,0.8)",
          lineHeight: 1.6,
        })
      ),
      // Buttons side
      React.createElement(
        Element as any,
        {
          is: Row as any,
          canvas: true,
          background: "transparent",
          padding: 0,
          gap: 12,
          alignItems: "center",
          justifyContent: "flex-start",
          flexWrap: "wrap",
        },
        React.createElement(
          Element as any,
          {
            is: Container as any,
            canvas: true,
            background: "#ffffff",
            paddingTop: 14,
            paddingBottom: 14,
            paddingLeft: 32,
            paddingRight: 32,
            borderRadius: 10,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: 0,
          },
          React.createElement(Text as any, {
            text: "Start Shopping",
            fontSize: 14,
            fontWeight: "600",
            color: "#6366f1",
          })
        ),
        React.createElement(
          Element as any,
          {
            is: Container as any,
            canvas: true,
            background: "rgba(255,255,255,0.15)",
            paddingTop: 14,
            paddingBottom: 14,
            paddingLeft: 32,
            paddingRight: 32,
            borderRadius: 10,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: 0,
          },
          React.createElement(Text as any, {
            text: "Learn More",
            fontSize: 14,
            fontWeight: "600",
            color: "#ffffff",
          })
        )
      )
    )
  ),
};
