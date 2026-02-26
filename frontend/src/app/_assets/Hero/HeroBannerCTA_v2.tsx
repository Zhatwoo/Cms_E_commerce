"use client";

import React from "react";
import { Element } from "@craftjs/core";
import { Text } from "../../design/_designComponents/Text/Text";
import { Button } from "../../design/_designComponents/Button/Button";
import { Section } from "../../design/_designComponents/Section/Section";
import { Column } from "../../design/_designComponents/Column/Column";
import { TemplateEntry } from "../_types";

export const HeroBannerCTA_v2: TemplateEntry = {
  label: "Hero Banner CTA v2",
  description: "Elegant centered hero with serif typography",
  preview: "🎞️ Hero v2",
  category: "hero",
  element: React.createElement(
    Element as any,
    {
      is: Section as any,
      canvas: true,
      backgroundImage: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=2099&auto=format&fit=crop",
      backgroundOverlay: "rgba(255,255,255,0.2)",
      backgroundSize: "cover",
      backgroundPosition: "center",
      width: "100%",
      minHeight: "500px",
      padding: 0,
      flexDirection: "column",
      justifyContent: "center",
      alignItems: "center",
    },
    React.createElement(
      Element as any,
      {
        is: Column as any,
        canvas: true,
        background: "transparent",
        width: "min(100%, 1280px)",
        paddingTop: 80,
        paddingBottom: 80,
        paddingLeft: 48,
        paddingRight: 48,
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        gap: 20,
        minHeight: "500px",
      },
      React.createElement(
        Element as any,
        {
          is: Column as any,
          canvas: true,
          background: "transparent",
          alignItems: "center",
          padding: 0,
          gap: 0,
        },
        React.createElement(Text as any, {
          text: "Lorem Ipsum Generator",
          fontSize: 28,
          fontWeight: "500",
          fontFamily: "Georgia, serif",
          color: "#000000",
          textAlign: "center",
        }),
        React.createElement(Text as any, {
          text: "Paragraphs Sentences Words Copy",
          fontSize: 42,
          fontWeight: "700",
          fontFamily: "Georgia, serif",
          color: "#000000",
          textAlign: "center",
          marginTop: -10,
        })
      ),
      React.createElement(Button as any, {
        label: "BUY NOW",
        backgroundColor: "#000000",
        textColor: "#ffffff",
        fontSize: 14,
        fontWeight: "700",
        paddingTop: 16,
        paddingBottom: 16,
        paddingLeft: 40,
        paddingRight: 40,
        borderRadius: 0,
        letterSpacing: 2,
      })
    )
  ),
};