"use client";

import React from "react";
import { Element } from "@craftjs/core";
import { Container } from "../../design/_designComponents/Container/Container";
import { Text } from "../../design/_designComponents/Text/Text";
import { Button } from "../../design/_designComponents/Button/Button";
import { Image } from "../../design/_designComponents/Image/Image";
import { Section } from "../../design/_designComponents/Section/Section";
import { Row } from "../../design/_designComponents/Row/Row";
import { Column } from "../../design/_designComponents/Column/Column";
import { TemplateEntry } from "../_types";

export const HeroWithImage: TemplateEntry = {
  label: "Hero with Image",
  description: "Hero with text and image placeholder",
  preview: "📷 Hero",
  category: "hero",
  element: React.createElement(
    Element as any,
    {
      is: Section as any,
      canvas: true,
      background: "#ffffff",
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
        is: Row as any,
        canvas: true,
        background: "#ffffff",
        width: "min(100%, 1280px)",
        paddingTop: 48,
        paddingBottom: 48,
        paddingLeft: 24,
        paddingRight: 24,
        gap: 48,
        alignItems: "center",
        justifyContent: "center",
        flexWrap: "wrap",
      },

      // Left: text + CTA
      React.createElement(
        Element as any,
        {
          is: Column as any,
          canvas: true,
          background: "transparent",
          width: "min(100%, 520px)",
          flexShrink: 0,
          alignItems: "flex-start",
          justifyContent: "center",
          padding: 0,
          gap: 20,
        },
        React.createElement(Text as any, {
          text: "Welcome to Our Website",
          fontSize: 40,
          fontWeight: "700",
          color: "#1e293b",
          lineHeight: 1.15,
        }),
        React.createElement(Text as any, {
          text: "We're here to help you discover what you need. Browse our offerings and get in touch.",
          fontSize: 16,
          fontWeight: "400",
          color: "#64748b",
          lineHeight: 1.6,
        }),
        React.createElement(Button as any, {
          label: "Learn More",
          backgroundColor: "#10b981",
          textColor: "#ffffff",
          fontSize: 14,
          fontWeight: "600",
          paddingTop: 13,
          paddingBottom: 13,
          paddingLeft: 32,
          paddingRight: 32,
          borderRadius: 6,
          width: "min(100%, 200px)",
        })
      ),

      // Right: image
      React.createElement(
        Element as any,
        {
          is: Column as any,
          canvas: true,
          background: "transparent",
          width: "min(100%, 560px)",
          flexShrink: 0,
          alignItems: "stretch",
          justifyContent: "center",
          padding: 0,
          gap: 0,
        },
        React.createElement(Image as any, {
          src: "",
          alt: "Hero Image",
          width: "100%",
          height: "400px",
          objectFit: "cover",
          borderRadius: 12,
        })
      )
    )
  ),
};