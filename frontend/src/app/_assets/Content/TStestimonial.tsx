"use client";

import React from "react";
import { Element } from "@craftjs/core";
import { Container } from "../../design/_designComponents/Container/Container";
import { Text } from "../../design/_designComponents/Text/Text";
import { Section } from "../../design/_designComponents/Section/Section";
import { Row } from "../../design/_designComponents/Row/Row";
import { Column } from "../../design/_designComponents/Column/Column";
import { TemplateEntry } from "../_types";

export const Testimonial: TemplateEntry = {
  label: "Testimonial",
  description: "Customer testimonial with quote",
  preview: "💬",
  category: "content",
  element: React.createElement(
    Element as any,
    {
      is: Section as any,
      canvas: true,
      background: "#f1f5f9",
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
        is: Container as any,
        canvas: true,
        background: "#ffffff",
        width: "min(100%, 800px)",
        paddingTop: 52,
        paddingBottom: 52,
        paddingLeft: 48,
        paddingRight: 48,
        borderRadius: 16,
        flexDirection: "column",
        alignItems: "flex-start",
        gap: 32,
      },

      // Quote
      React.createElement(Text as any, {
        text: '"Excellent service and support. Highly recommended!"',
        fontSize: 24,
        fontWeight: "400",
        color: "#475569",
        lineHeight: 1.5,
      }),

      // Author row
      React.createElement(
        Element as any,
        {
          is: Row as any,
          canvas: true,
          background: "transparent",
          padding: 0,
          gap: 14,
          alignItems: "center",
          flexWrap: "wrap",
          width: "100%",
        },

        // Avatar
        React.createElement(
          Element as any,
          {
            is: Container as any,
            canvas: true,
            background: "#3b82f6",
            width: "50px",
            height: "50px",
            flexShrink: 0,
            borderRadius: 25,
            alignItems: "center",
            justifyContent: "center",
            padding: 0,
            gap: 0,
          },
          React.createElement(Text as any, {
            text: "JD",
            fontSize: 16,
            fontWeight: "700",
            color: "#ffffff",
          })
        ),

        // Name + title
        React.createElement(
          Element as any,
          {
            is: Column as any,
            canvas: true,
            background: "transparent",
            padding: 0,
            gap: 2,
            alignItems: "flex-start",
          },
          React.createElement(Text as any, {
            text: "John Doe",
            fontSize: 18,
            fontWeight: "600",
            color: "#1e293b",
          }),
          React.createElement(Text as any, {
            text: "CEO, Company Name",
            fontSize: 14,
            fontWeight: "400",
            color: "#64748b",
          })
        )
      )
    )
  ),
};