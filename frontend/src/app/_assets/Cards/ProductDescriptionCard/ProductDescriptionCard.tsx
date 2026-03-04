"use client";

import React from "react";
import { Element } from "@craftjs/core";
import { Container } from "../../../design/_designComponents/Container/Container";
import { Text } from "../../../design/_designComponents/Text/Text";
import { Image } from "../../../design/_designComponents/Image/Image";
import { Button } from "../../../design/_designComponents/Button/Button";
import { Row } from "../../../design/_designComponents/Row/Row";
import { Column } from "../../../design/_designComponents/Column/Column";
import { TemplateEntry } from "../../_types";

export const ProductDescriptionCard: TemplateEntry = {
  label: "Product Description Card",
  description: "Single featured product card with image, details, price, and CTA",
  preview: "FP",
  category: "card",
  element: React.createElement(
    Element as any,
    {
      is: Container as any,
      canvas: true,
      background: "#FFFFFF",
      width: "calc((100% - 48px) / 4)",
      flexShrink: 0,
      borderRadius: 12,
      overflow: "hidden",
      flexDirection: "column",
      alignItems: "stretch",
      justifyContent: "flex-start",
      padding: 0,
      gap: 0,
      boxShadow: "0 10px 24px rgba(0,0,0,0.12)",
    },
    React.createElement(
      Element as any,
      {
        is: Container as any,
        canvas: true,
        width: "100%",
        height: "210px",
        background: "#EDE4D9",
        padding: 0,
        gap: 0,
        overflow: "hidden",
      },
      React.createElement(Image as any, {
        src: "https://images.unsplash.com/photo-1556228578-8c89e6adf883?auto=format&fit=crop&w=900&q=80",
        alt: "Luminous Glow Serum",
        width: "100%",
        height: "100%",
        objectFit: "cover",
        allowUpload: true,
      })
    ),
    React.createElement(
      Element as any,
      {
        is: Container as any,
        canvas: true,
        background: "transparent",
        paddingTop: 14,
        paddingRight: 14,
        paddingBottom: 14,
        paddingLeft: 14,
        flexDirection: "column",
        alignItems: "stretch",
        gap: 6,
      },
      React.createElement(Text as any, {
        text: "Luminous Glow Serum",
        fontSize: 13,
        fontWeight: "700",
        color: "#0F172A",
        lineHeight: 1.35,
      }),
      React.createElement(Text as any, {
        text: "Vitamin C - Brightening - 30ml",
        fontSize: 10,
        fontWeight: "400",
        color: "#6B7280",
        lineHeight: 1.4,
      }),
      React.createElement(
        Element as any,
        {
          is: Row as any,
          canvas: true,
          background: "transparent",
          width: "100%",
          paddingTop: 8,
          paddingRight: 0,
          paddingBottom: 0,
          paddingLeft: 0,
          gap: 10,
          alignItems: "center",
          justifyContent: "space-between",
        },
        React.createElement(
          Element as any,
          {
            is: Column as any,
            canvas: true,
            background: "transparent",
            padding: 0,
            gap: 0,
            alignItems: "flex-start",
          },
          React.createElement(Text as any, {
            text: "P 1,299",
            fontSize: 20,
            fontWeight: "800",
            color: "#0F172A",
            lineHeight: 1,
          })
        ),
        React.createElement(Button as any, {
          label: "Add to Cart",
          backgroundColor: "#111827",
          textColor: "#FFFFFF",
          fontSize: 10,
          fontWeight: "700",
          paddingTop: 9,
          paddingBottom: 9,
          paddingLeft: 14,
          paddingRight: 14,
          borderRadius: 8,
        })
      )
    )
  ),
};
