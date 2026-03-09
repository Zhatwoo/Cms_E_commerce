"use client";

import React from "react";
import { Element } from "@craftjs/core";
import { Container } from "../../../design/_designComponents/Container/Container";
import { Text } from "../../../design/_designComponents/Text/Text";
import { Section } from "../../../design/_designComponents/Section/Section";
import { Row } from "../../../design/_designComponents/Row/Row";
import { Column } from "../../../design/_designComponents/Column/Column";
import { Button } from "../../../design/_designComponents/Button/Button";
import { TemplateEntry } from "../../_types";

export const DarkModeHeader: TemplateEntry = {
  label: "Dark Mode Header",
  description: "Simple dark header (desktop only)",
  preview: "DM",
  element: React.createElement(
    Element as any,
    { is: Section as any, canvas: true, background: "rgba(2, 6, 23, 0.95)", padding: 0 },
    React.createElement(
      Element as any,
      {
        is: Container as any,
        canvas: true,
        width: "min(1200px, 100%)",
        background: "rgba(15, 23, 42, 0.92)",
        paddingTop: 16,
        paddingBottom: 14,
        paddingLeft: 20,
        paddingRight: 20,
        borderWidth: 1,
        borderColor: "rgba(30, 41, 59, 0.7)",
        borderStyle: "solid",
        gap: 10,
      },
      React.createElement(
        Element as any,
        {
          is: Row as any,
          canvas: true,
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "nowrap",
          gap: 12,
        },

        // Logo
        React.createElement(
          Element as any,
          { is: Column as any, width: "auto", padding: 0, canvas: true },
          React.createElement(Text as any, {
            text: "NIGHT",
            fontSize: 22,
            fontWeight: "700",
            color: "#f8fafc",
            letterSpacing: 2,
          })
        ),

        // Navigation
        React.createElement(
          Element as any,
          {
            is: Row as any,
            canvas: true,
            width: "auto",
            flexWrap: "nowrap",
            gap: 24,
            alignItems: "center",
          },
          React.createElement(Text as any, { text: "Store", fontSize: 14, color: "#cbd5e1" }),
          React.createElement(Text as any, { text: "Digital", fontSize: 14, color: "#cbd5e1" }),
          React.createElement(Text as any, { text: "Gaming", fontSize: 14, color: "#cbd5e1" }),
          React.createElement(Text as any, { text: "Support", fontSize: 14, color: "#cbd5e1" })
        ),

        // Right Side
        React.createElement(
          Element as any,
          {
            is: Row as any,
            canvas: true,
            width: "auto",
            alignItems: "center",
            flexWrap: "nowrap",
            gap: 10,
          },
          React.createElement(Button as any, {
            label: "Connect",
            backgroundColor: "rgba(17, 31, 58, 0.85)",
            borderRadius: 999,
            borderWidth: 1,
            borderColor: "rgba(51, 65, 85, 0.7)",
            borderStyle: "solid",
            fontSize: 13,
            fontWeight: 600,
            textColor: "#93c5fd",
            paddingTop: 7,
            paddingBottom: 7,
            paddingLeft: 12,
            paddingRight: 12,
            variant: "ghost",
            key: "connect-btn-desktop",
            children: null,
          }),
          React.createElement(Text as any, {
            text: "Moon",
            fontSize: 13,
            color: "#e2e8f0",
          })
        )
      )
    )
  ),
  category: "header",
};