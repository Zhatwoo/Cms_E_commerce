"use client";

import React from "react";
import { Element } from "@craftjs/core";
import { Container } from "../../design/_designComponents/Container/Container";
import { Text } from "../../design/_designComponents/Text/Text";
import { Section } from "../../design/_designComponents/Section/Section";
import { Row } from "../../design/_designComponents/Row/Row";
import { Column } from "../../design/_designComponents/Column/Column";
import { TemplateEntry } from "../_types";

export const NewsletterCTA: TemplateEntry = {
  label: "Newsletter CTA",
  description: "Email signup section with input field",
  preview: "Newsletter",
  category: "content",
  element: React.createElement(
    Element as any,
    {
      is: Section as any,
      canvas: true,
      background: "#f8fafc",
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
        is: Container as any,
        canvas: true,
        background: "#ffffff",
        width: "min(100%, 800px)",
        paddingTop: 64,
        paddingBottom: 64,
        paddingLeft: 48,
        paddingRight: 48,
        borderRadius: 20,
        boxShadow: "0 4px 24px -4px rgba(0,0,0,0.06)",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 16,
      },
      React.createElement(Text as any, {
        text: "Stay in the Loop",
        fontSize: 32,
        fontWeight: "700",
        color: "#0f172a",
        textAlign: "center",
      }),
      React.createElement(Text as any, {
        text: "Subscribe to our newsletter and get 15% off your first order plus exclusive access to new arrivals.",
        fontSize: 16,
        fontWeight: "400",
        color: "#64748b",
        textAlign: "center",
        lineHeight: 1.6,
      }),
      // Email input row
      React.createElement(
        Element as any,
        {
          is: Row as any,
          canvas: true,
          background: "#f1f5f9",
          width: "min(100%, 520px)",
          paddingTop: 6,
          paddingBottom: 6,
          paddingLeft: 20,
          paddingRight: 6,
          borderRadius: 12,
          gap: 8,
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
        },
        React.createElement(Text as any, {
          text: "Enter your email address",
          fontSize: 14,
          fontWeight: "400",
          color: "#94a3b8",
        }),
        React.createElement(
          Element as any,
          {
            is: Container as any,
            canvas: true,
            background: "#0f172a",
            paddingTop: 12,
            paddingBottom: 12,
            paddingLeft: 24,
            paddingRight: 24,
            borderRadius: 8,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: 0,
          },
          React.createElement(Text as any, {
            text: "Subscribe",
            fontSize: 14,
            fontWeight: "600",
            color: "#ffffff",
          })
        )
      ),
      React.createElement(Text as any, {
        text: "No spam, unsubscribe anytime.",
        fontSize: 12,
        fontWeight: "400",
        color: "#94a3b8",
        textAlign: "center",
      })
    )
  ),
};
