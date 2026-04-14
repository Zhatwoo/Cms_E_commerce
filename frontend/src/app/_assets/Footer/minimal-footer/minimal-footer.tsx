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
    fontFamily: "Outfit",
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
    React.createElement(Text as any, { text: icon, fontSize: 16, fontFamily: "Outfit", color: "#ffffff", position: "relative", display: "block", zIndex: 2 }),
    React.createElement(Text as any, { text, fontSize: 14, fontFamily: "Outfit", color: "#cbd5e1", position: "relative", display: "block", zIndex: 2 })
  );
}

export const MinimalFooter: TemplateEntry = {
  label: "Minimal Footer",
  description: "Two-tone footer with CTA section and detailed links",
  preview: null,
  element: React.createElement(
    Element as any,
    {
      is: Section as any,
      width: "100%",
      background: "#121212",
      paddingTop: 0,
      paddingRight: 0,
      paddingBottom: 0,
      paddingLeft: 0,
      canvas: true,
      height: "auto",
      isFreeform: false,
      position: "relative",
      zIndex: 0,
    },
    // Upper CTA Section
    React.createElement(
      Element as any,
      {
        is: Container as any,
        width: "100%",
        background: "#333333",
        paddingTop: 80,
        paddingRight: 0,
        paddingBottom: 80,
        paddingLeft: 0,
        height: "auto",
        alignItems: "center",
        justifyContent: "center",
        canvas: true,
      },
      React.createElement(Text as any, {
        text: "Become A Part Of Our Team",
        fontSize: 36,
        fontFamily: "Outfit",
        fontWeight: "700",
        color: "#ffffff",
        marginBottom: 20,
        textAlign: "center",
        position: "relative",
        display: "block",
        zIndex: 2,
      }),
      React.createElement(Text as any, {
        text: "Here's your opportunity to join a unique, global company with an incredible, life-changing mission",
        fontSize: 18,
        fontFamily: "Outfit",
        color: "rgba(255, 255, 255, 0.7)",
        marginBottom: 32,
        textAlign: "center",
        maxWidth: "600px",
        position: "relative",
        display: "block",
        zIndex: 2,
      }),
      React.createElement(
        Element as any,
        {
          is: Container as any,
          width: "156px",
          height: "52px",
          background: "#10b981",
          borderRadius: 8,
          alignItems: "center",
          justifyContent: "center",
          canvas: true,
          cursor: "pointer",
        },
        React.createElement(Text as any, {
          text: "Join Now →",
          fontSize: 16,
          fontFamily: "Outfit",
          fontWeight: "600",
          color: "#ffffff",
          position: "relative",
          display: "block",
          zIndex: 2,
        })
      )
    ),
    // Lower Links Section
    React.createElement(
      Element as any,
      {
        is: Container as any,
        width: "100%",
        maxWidth: "1280px",
        background: "transparent",
        paddingTop: 80,
        paddingRight: 60,
        paddingBottom: 60,
        paddingLeft: 60,
        height: "auto",
        alignItems: "stretch",
        justifyContent: "center",
        canvas: true,
      },
      React.createElement(
        Element as any,
        {
          is: Row as any,
          width: "100%",
          gap: 20,
          alignItems: "flex-start",
          justifyContent: "space-between",
          flexWrap: "nowrap",
          canvas: true,
        },
        // Column 1: Branding
        React.createElement(
          Element as any,
          {
            is: Column as any,
            width: "25%",
            gap: 24,
            alignItems: "flex-start",
            canvas: true,
          },
          React.createElement(
            Element as any,
            {
              is: Row as any,
              marginBottom: 24,
              gap: 12,
              alignItems: "center",
              canvas: true,
            },
            React.createElement(Text as any, {
              text: "Minimal Footer",
              fontSize: 24,
              fontFamily: "Outfit",
              fontWeight: "700",
              color: "#ffffff",
              position: "relative",
              display: "block",
              zIndex: 2,
            })
          ),
          React.createElement(Text as any, {
            text: "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s.",
            fontSize: 14,
            fontFamily: "Outfit",
            color: "rgba(255, 255, 255, 0.6)",
            lineHeight: 1.6,
            position: "relative",
            display: "block",
            zIndex: 2,
          })
        ),
        // Column 2: Company
        React.createElement(
          Element as any,
          {
            is: Column as any,
            width: "20%",
            gap: 0,
            alignItems: "flex-start",
            canvas: true,
          },
          React.createElement(Text as any, { text: "Company", fontSize: 18, fontFamily: "Outfit", fontWeight: "700", color: "rgba(234, 179, 8, 0.9)", position: "relative", display: "block", zIndex: 2, marginBottom: 24 }),
          React.createElement(Text as any, { text: "Company Name", fontSize: 16, fontFamily: "Outfit", fontWeight: "600", color: "#ffffff", position: "relative", display: "block", zIndex: 2, marginBottom: 8 }),
          React.createElement(Text as any, { text: "Manila, Philippines", fontSize: 14, fontFamily: "Outfit", color: "#cbd5e1", position: "relative", display: "block", zIndex: 2, marginBottom: 20 }),
          React.createElement(
            Element as any,
            { is: Row as any, gap: 12, alignItems: "center", marginBottom: 12, canvas: true },
            React.createElement(Text as any, { text: "📞", fontSize: 16, fontFamily: "Outfit", color: "#cbd5e1", position: "relative", display: "block", zIndex: 2 }),
            React.createElement(Text as any, { text: "+6390123456789", fontSize: 14, fontFamily: "Outfit", color: "#cbd5e1", position: "relative", display: "block", zIndex: 2 })
          ),
          React.createElement(
            Element as any,
            { is: Row as any, gap: 12, alignItems: "center", marginBottom: 12, canvas: true },
            React.createElement(Text as any, { text: "✉", fontSize: 16, fontFamily: "Outfit", color: "#cbd5e1", position: "relative", display: "block", zIndex: 2 }),
            React.createElement(Text as any, { text: "info@emailid.com", fontSize: 14, fontFamily: "Outfit", color: "#cbd5e1", position: "relative", display: "block", zIndex: 2 })
          )
        ),
        // Column 3: Quick Links
        React.createElement(
          Element as any,
          {
            is: Column as any,
            width: "auto",
            gap: 12,
            alignItems: "flex-start",
            canvas: true,
          },
          React.createElement(Text as any, { text: "Quick Links", fontSize: 18, fontFamily: "Outfit", fontWeight: "700", color: "rgba(234, 179, 8, 0.9)", position: "relative", display: "block", zIndex: 2, marginBottom: 24 }),
          React.createElement(Text as any, { text: "About Us", fontSize: 14, fontFamily: "Outfit", color: "#cbd5e1", position: "relative", display: "block", zIndex: 2, marginBottom: 12 }),
          React.createElement(Text as any, { text: "FAQ", fontSize: 14, fontFamily: "Outfit", color: "#cbd5e1", position: "relative", display: "block", zIndex: 2, marginBottom: 12 }),
          React.createElement(Text as any, { text: "Privacy", fontSize: 14, fontFamily: "Outfit", color: "#cbd5e1", position: "relative", display: "block", zIndex: 2, marginBottom: 12 }),
          React.createElement(Text as any, { text: "Terms & Conditions", fontSize: 14, fontFamily: "Outfit", color: "#cbd5e1", position: "relative", display: "block", zIndex: 2, marginBottom: 12 })
        ),
        // Column 4: Social Media
        React.createElement(
          Element as any,
          {
            is: Column as any,
            width: "auto",
            gap: 12,
            alignItems: "flex-start",
            canvas: true,
          },
          React.createElement(Text as any, { text: "Social Media", fontSize: 18, fontFamily: "Outfit", fontWeight: "700", color: "rgba(234, 179, 8, 0.9)", position: "relative", display: "block", zIndex: 2, marginBottom: 24 }),
          React.createElement(
            Element as any,
            { is: Row as any, gap: 12, alignItems: "center", marginBottom: 12, canvas: true },
            React.createElement(Text as any, { text: "fb", fontSize: 16, fontFamily: "Outfit", color: "#cbd5e1", position: "relative", display: "block", zIndex: 2 }),
            React.createElement(Text as any, { text: "Facebook", fontSize: 14, fontFamily: "Outfit", color: "#cbd5e1", position: "relative", display: "block", zIndex: 2 })
          ),
          React.createElement(
            Element as any,
            { is: Row as any, gap: 12, alignItems: "center", marginBottom: 12, canvas: true },
            React.createElement(Text as any, { text: "in", fontSize: 16, fontFamily: "Outfit", color: "#cbd5e1", position: "relative", display: "block", zIndex: 2 }),
            React.createElement(Text as any, { text: "Linkedin", fontSize: 14, fontFamily: "Outfit", color: "#cbd5e1", position: "relative", display: "block", zIndex: 2 })
          )
        )
      )
    ),
    // Back to top button
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
        alignItems: "center",
        justifyContent: "center",
        canvas: true,
      },
      React.createElement(Text as any, { text: "︿", fontSize: 20, color: "#ffffff", fontWeight: "700", position: "relative", display: "block", zIndex: 2 })
    )
  ),
  category: "footer",
};
