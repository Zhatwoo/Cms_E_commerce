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
    color: "#cbd5e1",
    marginBottom: 12,
  });
}

function iconInfoRow(icon: string, text: string) {
  return React.createElement(
    Element as any,
    {
      is: Row as any,
      canvas: true,
      gap: 12,
      alignItems: "center",
      marginBottom: 12,
      height: "auto",
    },
    React.createElement(Text as any, { text: icon, fontSize: 16, color: "#cbd5e1" }),
    React.createElement(Text as any, { text, fontSize: 14, color: "#cbd5e1" })
  );
}

export const MinimalFooter: TemplateEntry = {
  label: "Minimal Footer",
  description: "Two-tone footer with CTA section and detailed links",
  preview: "Minimal",
  element: React.createElement(
    Element as any,
    {
      is: Section as any,
      width: "100%",
      background: "#121212",
      paddingTop: 0,
      paddingBottom: 0,
      paddingLeft: 0,
      paddingRight: 0,
      canvas: true,
      height: "auto",
      isFreeform: false,
      alignItems: "center",
      justifyContent: "center",
    },
    // CTA SECTION (Upper)
    React.createElement(
      Element as any,
      {
        is: Container as any,
        width: "100%",
        background: "#333333",
        paddingTop: 80,
        paddingBottom: 80,
        canvas: true,
        alignItems: "center",
        justifyContent: "center",
        height: "auto",
      },
      React.createElement(Text as any, {
        text: "Become A Part Of Our Team",
        fontSize: 36,
        color: "#ffffff",
        fontWeight: "700",
        marginBottom: 20,
        textAlign: "center",
      }),
      React.createElement(Text as any, {
        text: "Here's your opportunity to join a unique, global company with an incredible, life-changing mission",
        fontSize: 18,
        color: "rgba(255, 255, 255, 0.7)",
        marginBottom: 32,
        textAlign: "center",
        maxWidth: "600px",
      }),
      React.createElement(
        Element as any,
        {
          is: Container as any,
          background: "#10b981", // Green button
          padding: 0,
          paddingTop: 14,
          paddingBottom: 14,
          paddingLeft: 32,
          paddingRight: 32,
          width: "156px",
          height: "52px",
          borderRadius: 8,
          canvas: true,
          cursor: "pointer",
          alignItems: "center",
          justifyContent: "center",
        },
        React.createElement(Text as any, {
          text: "Join Now →",
          color: "#ffffff",
          fontWeight: "600",
        })
      )
    ),

    // LINKS SECTION (Lower)
    React.createElement(
      Element as any,
      {
        is: Container as any,
        width: "100%",
        maxWidth: "1280px",
        background: "transparent",
        paddingTop: 80,
        paddingBottom: 60,
        paddingLeft: 60,
        paddingRight: 60,
        canvas: true,
        height: "auto",
        alignItems: "stretch",
      },
      React.createElement(
        Element as any,
        {
          is: Row as any,
          canvas: true,
          gap: 60,
          alignItems: "flex-start",
          justifyContent: "space-between",
          height: "auto",
        },
        // Branding Column
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
          // Placeholder Logo
          React.createElement(
            Element as any,
            {
              is: Row as any,
              canvas: true,
              gap: 12,
              alignItems: "center",
              marginBottom: 24,
              height: "auto",
            },
            React.createElement(Text as any, { text: "Minimal Footer", fontSize: 24, color: "#ffffff", fontWeight: "700" })
          ),
          React.createElement(Text as any, {
            text: "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s.",
            fontSize: 14,
            color: "rgba(255, 255, 255, 0.6)",
            lineHeight: 1.6,
          })
        ),

        // Company Column
        React.createElement(
          Element as any,
          {
            is: Column as any,
            width: "auto",
            canvas: true,
            alignItems: "flex-start",
            height: "auto",
          },
          React.createElement(Text as any, { text: "Company", fontSize: 18, color: "rgba(234, 179, 8, 0.9)", fontWeight: "700", marginBottom: 24 }),
          React.createElement(Text as any, { text: "Company Name", fontSize: 16, color: "#ffffff", fontWeight: "600", marginBottom: 8 }),
          React.createElement(Text as any, { text: "Manila, Philippines", fontSize: 14, color: "#cbd5e1", marginBottom: 20 }),
          iconInfoRow("📞", "+6390123456789"),
          iconInfoRow("✉", "info@emailid.com")
        ),

        // Quick Links Column
        React.createElement(
          Element as any,
          {
            is: Column as any,
            width: "auto",
            canvas: true,
            alignItems: "flex-start",
            height: "auto",
          },
          React.createElement(Text as any, { text: "Quick Links", fontSize: 18, color: "rgba(234, 179, 8, 0.9)", fontWeight: "700", marginBottom: 24 }),
          footerLink("About Us"),
          footerLink("FAQ"),
          footerLink("Privacy"),
          footerLink("Terms & Conditions")
        ),

        // Social Media Column
        React.createElement(
          Element as any,
          {
            is: Column as any,
            width: "auto",
            canvas: true,
            alignItems: "flex-start",
            height: "auto",
          },
          React.createElement(Text as any, { text: "Social Media", fontSize: 18, color: "rgba(234, 179, 8, 0.9)", fontWeight: "700", marginBottom: 24 }),
          iconInfoRow("fb", "Facebook"),
          iconInfoRow("in", "Linkedin")
        )
      )
    ),
    
    // Bottom Right Anchor Button
    React.createElement(
      Element as any,
      {
        is: Container as any,
        width: "40px",
        height: "40px",
        background: "#0d9488",
        borderRadius: 8,
        position: "absolute",
        bottom: "20px",
        right: "20px",
        canvas: true,
        alignItems: "center",
        justifyContent: "center",
      },
      React.createElement(Text as any, { text: "︿", fontSize: 20, color: "#ffffff", fontWeight: "bold" })
    )
  ),
  category: "footer",
};
