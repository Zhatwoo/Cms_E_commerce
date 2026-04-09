"use client";

import React from "react";
import { Element } from "@craftjs/core";
import { Container } from "../../../design/_designComponents/Container/Container";
import { Section } from "../../../design/_designComponents/Section/Section";
import { Row } from "../../../design/_designComponents/Row/Row";
import { Column } from "../../../design/_designComponents/Column/Column";
import { Text } from "../../../design/_designComponents/Text/Text";
import { Button } from "../../../design/_designComponents/Button/Button";
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
  description: "Modern vibrant gradient footer with newsletter and links",
  preview: "Syncly",
  element: React.createElement(
    Element as any,
    {
      is: Section as any,
      width: "100%",
      // Mesh-like vibrant gradient background
      background: "linear-gradient(135deg, #8b5cf6 0%, #3b82f6 25%, #1e1b4b 50%, #171717 100%)",
      paddingTop: 80,
      paddingBottom: 40,
      paddingLeft: 60,
      paddingRight: 60,
      canvas: true,
      height: "auto",
      position: "relative",
      overflow: "hidden",
    },
    // Decorative Blobs for Mesh Effect
    React.createElement(Container as any, {
      width: "800px",
      height: "800px",
      background: "radial-gradient(circle, rgba(139, 92, 246, 0.4) 0%, transparent 70%)",
      position: "absolute",
      top: "-200px",
      right: "-100px",
      borderRadius: 400,
      zIndex: 1,
    }),
    React.createElement(Container as any, {
      width: "600px",
      height: "600px",
      background: "radial-gradient(circle, rgba(59, 130, 246, 0.3) 0%, transparent 70%)",
      position: "absolute",
      bottom: "-100px",
      left: "-100px",
      borderRadius: 300,
      zIndex: 1,
    }),

    // Content Wrapper
    React.createElement(
      Element as any,
      {
        is: Container as any,
        width: "100%",
        maxWidth: "1280px",
        background: "transparent",
        canvas: true,
        height: "auto",
        alignItems: "stretch",
        position: "relative",
        zIndex: 10,
      },
      // TOP SECTION: Heading and CTA
      React.createElement(
        Element as any,
        {
          is: Column as any,
          padding: 0,
          marginBottom: 80,
          canvas: true,
          alignItems: "flex-start",
          height: "auto",
        },
        React.createElement(Text as any, {
          text: "Ready to start syncing your data?",
          fontSize: 64,
          color: "#ffffff",
          fontWeight: "500",
          marginBottom: 32,
          lineHeight: 1.1,
          width: "600px",
        }),
        React.createElement(
          Element as any,
          {
            is: Container as any,
            background: "#ffffff",
            paddingTop: 12,
            paddingBottom: 12,
            paddingLeft: 24,
            paddingRight: 24,
            borderRadius: 8,
            canvas: true,
            cursor: "pointer",
            height: "auto",
          },
          React.createElement(Text as any, {
            text: "Contact us",
            fontSize: 16,
            color: "#000000",
            fontWeight: "500",
          })
        )
      ),

      // BOTTOM SECTION: Newsletter + Links
      React.createElement(
        Element as any,
        {
          is: Row as any,
          canvas: true,
          gap: 40,
          alignItems: "flex-start",
          justifyContent: "space-between",
          height: "auto",
        },
        // Newsletter Column
        React.createElement(
          Element as any,
          {
            is: Column as any,
            width: "35%",
            padding: 0,
            canvas: true,
            alignItems: "flex-start",
            height: "auto",
          },
          React.createElement(Text as any, {
            text: "Newsletter",
            fontSize: 16,
            color: "#ffffff",
            fontWeight: "600",
            marginBottom: 20,
          }),
          React.createElement(Text as any, {
            text: "We'd love to share our love for product with you in our monthly newsletter.",
            fontSize: 14,
            color: "rgba(255, 255, 255, 0.7)",
            marginBottom: 24,
            lineHeight: 1.5,
          }),
          // Input + Subscribe Row
          React.createElement(
            Element as any,
            {
              is: Row as any,
              canvas: true,
              gap: 12,
              alignItems: "center",
              height: "auto",
            },
            React.createElement(
              Element as any,
              {
                is: Container as any,
                width: "240px",
                height: "44px",
                background: "rgba(255, 255, 255, 0.1)",
                borderRadius: 8,
                borderWidth: 1,
                borderColor: "rgba(255, 255, 255, 0.1)",
                paddingLeft: 16,
                canvas: true,
                alignItems: "center",
              },
              React.createElement(Text as any, {
                text: "Enter your email",
                fontSize: 14,
                color: "rgba(255, 255, 255, 0.4)",
              })
            ),
            React.createElement(
              Element as any,
              {
                is: Container as any,
                background: "rgba(255, 255, 255, 0.15)",
                paddingTop: 10,
                paddingBottom: 10,
                paddingLeft: 20,
                paddingRight: 20,
                borderRadius: 8,
                canvas: true,
                cursor: "pointer",
                height: "auto",
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

        // Navigation Links
        React.createElement(
          Element as any,
          {
            is: Row as any,
            width: "50%",
            gap: 80,
            canvas: true,
            alignItems: "flex-start",
            justifyContent: "flex-end",
            height: "auto",
          },
          // Column 1
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
          // Column 2
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
          // Column 3
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
            // Social Icons at bottom of this col
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

      // COPYRIGHT
      React.createElement(
        Element as any,
        {
          is: Container as any,
          width: "100%",
          marginTop: 60,
          canvas: true,
          alignItems: "center",
          justifyContent: "center",
          height: "auto",
        },
        React.createElement(Text as any, {
          text: "© 2025 Syncly.",
          fontSize: 14,
          color: "rgba(255, 255, 255, 0.5)",
          fontWeight: "400",
        })
      )
    )
  ),
  category: "footer",
};
