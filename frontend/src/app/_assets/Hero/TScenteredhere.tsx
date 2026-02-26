"use client";

import React from "react";
import { Element } from "@craftjs/core";
import { Container } from "../../design/_designComponents/Container/Container";
import { Text } from "../../design/_designComponents/Text/Text";
import { Button } from "../../design/_designComponents/Button/Button";
import { Section } from "../../design/_designComponents/Section/Section";
import { Row } from "../../design/_designComponents/Row/Row";
import { Column } from "../../design/_designComponents/Column/Column";
import { TemplateEntry } from "../_types";

export const CenteredHero: TemplateEntry = {
  label: "Centered Hero",
  description: "Hero section with centered content",
  preview: "Hero",
  category: "hero",
  element: React.createElement(
    Element as any,
    {
      is: Section as any,
      canvas: true,
      background: "#f8fafc",
      padding: 12,
      width: "100%",
      minHeight: "100vh",
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
        paddingLeft: 32,
        paddingRight: 32,
        alignItems: "center",
        justifyContent: "center",
        gap: 0,
      },
      React.createElement(
        Element as any,
        {
          is: Column as any,
          canvas: true,
          background: "transparent",
          width: "100%",
          alignItems: "center",
          justifyContent: "center",
          padding: 0,
          gap: 16,
        },
        React.createElement(Text as any, {
          text: "Welcome to Our Platform",
          fontSize: 48,
          fontWeight: "700",
          color: "#1e293b",
          textAlign: "center",
          lineHeight: 1.15,
        }),
        React.createElement(Text as any, {
          text: "Build amazing websites with our drag-and-drop editor. No coding required.",
          fontSize: 18,
          fontWeight: "400",
          color: "#64748b",
          textAlign: "center",
          lineHeight: 1.6,
        }),
        React.createElement(
          Element as any,
          {
            is: Row as any,
            canvas: true,
            background: "transparent",
            padding: 0,
            gap: 12,
            alignItems: "center",
            justifyContent: "center",
            flexWrap: "wrap",
            width: "100%",
          },
          React.createElement(Button as any, {
            label: "Get Started",
            backgroundColor: "#3b82f6",
            textColor: "#ffffff",
            fontSize: 14,
            fontWeight: "600",
            paddingTop: 13,
            paddingBottom: 13,
            paddingLeft: 32,
            paddingRight: 32,
            borderRadius: 6,
            width: "min(100%, 200px)",
          }),
          React.createElement(Button as any, {
            label: "Learn More",
            backgroundColor: "transparent",
            textColor: "#64748b",
            fontSize: 14,
            fontWeight: "600",
            paddingTop: 13,
            paddingBottom: 13,
            paddingLeft: 32,
            paddingRight: 32,
            borderRadius: 6,
            borderWidth: 1,
            borderStyle: "solid",
            borderColor: "#e2e8f0",
            width: "min(100%, 200px)",
          })
        )
      )
    )
  ),
};