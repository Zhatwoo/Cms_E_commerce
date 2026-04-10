"use client";

import React from "react";
import { Element } from "@craftjs/core";
import { Container } from "../../../design/_designComponents/Container/Container";
import { Section } from "../../../design/_designComponents/Section/Section";
import { Row } from "../../../design/_designComponents/Row/Row";
import { Column } from "../../../design/_designComponents/Column/Column";
import { Text } from "../../../design/_designComponents/Text/Text";
import { TemplateEntry } from "../../_types";

// Helper for Footer Links
function footerLink(text: string) {
  return React.createElement(Text as any, {
    text,
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.8)",
    marginBottom: 16,
    fontWeight: "400",
  });
}

export const SynclyFooter: TemplateEntry = {
  label: "Syncly Footer",
  description: "Syncly prebuilt footer for drag-and-drop",
  preview: "Syncly",
  element: React.createElement(
    Element as any,
    {
      is: Section as any,
      width: "100%",
      background: "linear-gradient(135deg, #8b5cf6 0%, #3b82f6 25%, #1e1b4b 50%, #171717 100%)",
      paddingTop: 72,
      paddingBottom: 40,
      paddingLeft: 40,
      paddingRight: 40,
      canvas: true,
      height: "auto",
      position: "relative",
      overflow: "hidden",
    },
    React.createElement(
      Element as any,
      {
        is: Container as any,
        width: "100%",
        background: "transparent",
        display: "flex",
        flexDirection: "column",
        gap: 52,
        canvas: true,
        height: "auto",
        padding: 0,
        alignItems: "flex-start",
        position: "relative",
        zIndex: 2,
      },
      React.createElement(
        Element as any,
        {
          is: Column as any,
          padding: 0,
          canvas: true,
          alignItems: "flex-start",
          height: "auto",
          gap: 24,
          width: "100%",
        },
        React.createElement(Text as any, {
          text: "Ready to start syncing your data?",
          fontSize: 58,
          color: "#ffffff",
          fontWeight: "600",
          marginBottom: 0,
          lineHeight: 1.1,
          width: "100%",
        })
      ),
      React.createElement(
        Element as any,
        {
          is: Row as any,
          canvas: true,
          gap: 24,
          alignItems: "flex-start",
          justifyContent: "space-between",
          height: "auto",
        },
        React.createElement(
          Element as any,
          {
            is: Column as any,
            width: "38%",
            padding: 0,
            canvas: true,
            alignItems: "flex-start",
            height: "auto",
            gap: 12,
          },
          React.createElement(Text as any, {
            text: "We'd love to share our love for product with you in our monthly newsletter.",
            fontSize: 14,
            color: "rgba(255, 255, 255, 0.7)",
            marginBottom: 10,
            lineHeight: 1.5,
          }),
          React.createElement(
            Element as any,
            {
              is: Row as any,
              canvas: true,
              gap: 8,
              alignItems: "center",
              height: "auto",
              flexWrap: "wrap",
            },
            React.createElement(
              Element as any,
              {
                is: Container as any,
                background: "rgba(255, 255, 255, 0.1)",
                padding: 10,
                height: "100%",
                borderRadius: 8,
                borderWidth: 1,
                borderColor: "rgba(255, 255, 255, 0.1)",
                canvas: true,
                alignItems: "center",
              },
              React.createElement(Text as any, {
                text: "Enter your email",
                fontSize: 14,
                color: "#FFFFFF",
              })
            ),
            React.createElement(
              Element as any,
              {
                is: Container as any,
                background: "rgba(255, 255, 255, 0.15)",
                padding: 0,
                paddingTop: 10,
                paddingBottom: 10,
                borderRadius: 8,
                canvas: true,
                cursor: "pointer",
                height: "auto",
                alignItems: "center",
                justifyContent: "center",
              },
              React.createElement(Text as any, {
                text: "Subscribe",
                fontSize: 14,
                color: "#ffffff",
                fontWeight: "500",
              })
            )
          )
        ),
        React.createElement(
          Element as any,
          {
            is: Row as any,
            width: "58%",
            gap: 40,
            canvas: true,
            alignItems: "flex-start",
            justifyContent: "flex-end",
            height: "auto",
            flexWrap: "wrap",
          },
          React.createElement(
            Element as any,
            {
              is: Column as any,
              width: "auto",
              canvas: true,
              alignItems: "flex-start",
              height: "auto",
            },
            React.createElement(Text as any, { text: "Home", fontSize: 16, color: "#ffffff", fontWeight: "600", marginBottom: 24 }),
            footerLink("Benefits"),
            footerLink("Features")
          ),
          React.createElement(
            Element as any,
            {
              is: Column as any,
              width: "auto",
              canvas: true,
              alignItems: "flex-start",
              height: "auto",
            },
            React.createElement(Text as any, { text: "Platform", fontSize: 16, color: "#ffffff", fontWeight: "600", marginBottom: 24 }),
            footerLink("Solution"),
            footerLink("Overview"),
            footerLink("Portfolio")
          ),
          React.createElement(
            Element as any,
            {
              is: Column as any,
              width: "auto",
              canvas: true,
              alignItems: "flex-start",
              height: "auto",
            },
            React.createElement(Text as any, { text: "About us", fontSize: 16, color: "#ffffff", fontWeight: "600", marginBottom: 24 }),
            footerLink("Connectors"),
            footerLink("Security"),
            footerLink("Contact Us"),
            React.createElement(
              Element as any,
              {
                is: Row as any,
                canvas: true,
                gap: 16,
                marginTop: 20,
                alignItems: "center",
                height: "auto",
              },
              React.createElement(Text as any, { text: "✉", fontSize: 20, color: "rgba(255, 255, 255, 0.8)" }),
              React.createElement(Text as any, { text: "in", fontSize: 18, color: "rgba(255, 255, 255, 0.8)", fontWeight: "700" })
            )
          )
        )
      ),
      React.createElement(
        Element as any,
        {
          is: Container as any,
          width: "100%",
          marginTop: 8,
          canvas: true,
          alignItems: "center",
          justifyContent: "center",
          height: "auto",
          background: "transparent",
          padding: 0,
          display: "flex",
        },
        React.createElement(Text as any, {
          text: "© 2026 Syncly.",
          fontSize: 14,
          color: "rgba(255, 255, 255, 0.5)",
          fontWeight: "400",
        })
      )
    )
  ),
  category: "footer",
};
