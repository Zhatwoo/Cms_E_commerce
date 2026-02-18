"use client";

import React from "react";
import { Element } from "@craftjs/core";
import { Container } from "../../../design/_designComponents/Container/Container";
import { Text } from "../../../design/_designComponents/Text/Text";
import { Section } from "../../../design/_designComponents/Section/Section";
import { Row } from "../../../design/_designComponents/Row/Row";
import { Column } from "../../../design/_designComponents/Column/Column";
import { TemplateEntry } from "../../_types";

const MOBILE_MENU_KEY = "dark_header_mobile_menu";

export const DarkModeHeader: TemplateEntry = {
  label: "Dark Mode Header",
  description: "Dark header interaction demo (trigger + collapsible)",
  preview: "DM",
  element: React.createElement(
    Element as any,
    { is: Section as any, canvas: true, background: "#020617", padding: 0 },
    React.createElement(
      Element as any,
      {
        is: Container as any,
        canvas: true,
        width: "min(1200px, 100%)",
        background: "#0f172a",
        paddingTop: 16,
        paddingBottom: 14,
        paddingLeft: 20,
        paddingRight: 20,
        borderWidth: 1,
        borderColor: "#1e293b",
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
          React.createElement(
            Element as any,
            {
              is: Container as any,
              canvas: true,
              background: "#111f3a",
              borderRadius: 999,
              borderWidth: 1,
              borderColor: "#334155",
              borderStyle: "solid",
              paddingTop: 7,
              paddingBottom: 7,
              paddingLeft: 12,
              paddingRight: 12,
            },
            React.createElement(Text as any, {
              text: "Connect",
              fontSize: 13,
              fontWeight: "600",
              color: "#93c5fd",
            })
          ),
          React.createElement(Text as any, { text: "Moon", fontSize: 13, color: "#e2e8f0" })
        ),
        React.createElement(
          Element as any,
          {
            is: Row as any,
            canvas: true,
            width: "auto",
            alignItems: "center",
            flexWrap: "nowrap",
            gap: 8,
          },
          React.createElement(
            Element as any,
            {
              is: Container as any,
              canvas: true,
              background: "#111f3a",
              borderRadius: 10,
              borderWidth: 1,
              borderColor: "#334155",
              borderStyle: "solid",
              paddingTop: 8,
              paddingBottom: 8,
              paddingLeft: 10,
              paddingRight: 10,
              toggleTarget: MOBILE_MENU_KEY,
              triggerAction: "toggle",
            },
            React.createElement(Text as any, {
              text: "Menu",
              fontSize: 13,
              fontWeight: "700",
              color: "#e2e8f0",
            })
          )
        )
      ),
      React.createElement(
        Element as any,
        {
          is: Container as any,
          canvas: true,
          background: "#0b1222",
          borderRadius: 12,
          borderWidth: 1,
          borderColor: "#1e293b",
          borderStyle: "solid",
          paddingTop: 10,
          paddingBottom: 10,
          paddingLeft: 12,
          paddingRight: 12,
          collapsibleKey: MOBILE_MENU_KEY,
          defaultOpen: true,
        },
        React.createElement(
          Element as any,
          { is: Column as any, canvas: true, gap: 10, alignItems: "flex-start", padding: 0 },
          React.createElement(Text as any, { text: "Store", fontSize: 14, color: "#cbd5e1" }),
          React.createElement(Text as any, { text: "Digital", fontSize: 14, color: "#cbd5e1" }),
          React.createElement(Text as any, { text: "Gaming", fontSize: 14, color: "#cbd5e1" }),
          React.createElement(Text as any, { text: "Support", fontSize: 14, color: "#cbd5e1" })
        )
      )
    )
  ),
  category: "header",
};
