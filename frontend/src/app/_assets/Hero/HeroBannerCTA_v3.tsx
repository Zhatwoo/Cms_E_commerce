"use client";

import React from "react";
import { Element } from "@craftjs/core";
import { Container } from "../../design/_designComponents/Container/Container";
import { Text } from "../../design/_designComponents/Text/Text";
import { Button } from "../../design/_designComponents/Button/Button";
import { Section } from "../../design/_designComponents/Section/Section";
import { Row } from "../../design/_designComponents/Row/Row";
import { TemplateEntry } from "../_types";

export const HeroBannerCTA_v3: TemplateEntry = {
  label: "Hero Banner CTA v3",
  description: "Hero with floating white card on the right",
  preview: "🎞️ Hero v3",
  category: "hero",
  element: React.createElement(
    Element as any,
    {
      is: Section as any,
      canvas: true,
      backgroundImage: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=2099&auto=format&fit=crop",
      backgroundSize: "cover",
      backgroundPosition: "center",
      width: "100%",
      minHeight: "520px",
      padding: 0,
      flexDirection: "column",
      justifyContent: "center",
      alignItems: "center",
    },

    // Full-width inner row to push card to the right
    React.createElement(
      Element as any,
      {
        is: Row as any,
        canvas: true,
        background: "transparent",
        width: "min(100%, 1280px)",
        paddingTop: 48,
        paddingBottom: 48,
        paddingLeft: 24,
        paddingRight: 48,
        minHeight: "520px",
        alignItems: "center",
        justifyContent: "flex-end",
        flexWrap: "wrap",
      },

      // Floating white card
      React.createElement(
        Element as any,
        {
          is: Container as any,
          canvas: true,
          background: "#ffffff",
          width: "min(100%, 360px)",
          flexShrink: 0,
          paddingTop: 52,
          paddingBottom: 52,
          paddingLeft: 52,
          paddingRight: 52,
          borderRadius: 16,
          boxShadow: "0 24px 40px -8px rgba(0,0,0,0.18), 0 1.5px 4px rgba(0,0,0,0.08)",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 28,
        },
        React.createElement(
          Element as any,
          {
            is: Container as any,
            canvas: true,
            background: "transparent",
            alignItems: "center",
            padding: 0,
            gap: 10,
          },
          React.createElement(Text as any, {
            text: "Lorem Ipsum Generator",
            fontSize: 24,
            fontWeight: "600",
            fontFamily: "Georgia, serif",
            color: "#18181b",
            textAlign: "center",
          }),
          React.createElement(Text as any, {
            text: "Paragraphs • Sentences • Words • Copy",
            fontSize: 16,
            fontWeight: "400",
            fontFamily: "Georgia, serif",
            color: "#444",
            textAlign: "center",
          })
        ),
        React.createElement(Button as any, {
          label: "WATCH NOW",
          backgroundColor: "#18181b",
          textColor: "#ffffff",
          fontSize: 14,
          fontWeight: "800",
          paddingTop: 18,
          paddingBottom: 18,
          paddingLeft: 40,
          paddingRight: 40,
          borderRadius: 6,
          letterSpacing: 1.5,
          boxShadow: "0 2px 8px rgba(0,0,0,0.10)",
        })
      )
    )
  ),
};