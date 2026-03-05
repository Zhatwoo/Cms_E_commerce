"use client";

import React from "react";
import { Element } from "@craftjs/core";
import { Container } from "../../../design/_designComponents/Container/Container";
import { Text } from "../../../design/_designComponents/Text/Text";
import { Button } from "../../../design/_designComponents/Button/Button";
import { Image } from "../../../design/_designComponents/Image/Image";
import { TemplateEntry } from "../../_types";

export const ProductCard: TemplateEntry = {
  label: "Product Card",
  description: "E-commerce product card",
  preview: "Card",
  category: "card",
  element: React.createElement(
    Element as any,
    {
      is: Container as any,
      canvas: true,
      background: "#ffffff",
      width: "calc((100% - 72px) / 4)",
      flexShrink: 0,
      borderWidth: 1,
      borderColor: "#e5e7eb",
      borderStyle: "solid",
      paddingTop: 12,
      paddingBottom: 12,
      paddingLeft: 12,
      paddingRight: 12,
      borderRadius: 8,
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "flex-start",
      gap: 10,
    },

    // Image + badge
    React.createElement(
      Element as any,
      {
        is: Container as any,
        canvas: true,
        background: "transparent",
        position: "relative",
        width: "100%",
        height: "320px",
        padding: 0,
        gap: 0,
      },
      React.createElement(Image as any, {
        src: "https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=600&q=80",
        alt: "Product Image",
        width: "100%",
        height: "100%",
        objectFit: "cover",
        borderRadius: 4,
        allowUpload: true,
      }),
      React.createElement(
        Element as any,
        {
          is: Container as any,
          canvas: true,
          position: "absolute",
          top: "8px",
          left: "8px",
          background: "#1e293b",
          borderRadius: 3,
          paddingTop: 4,
          paddingBottom: 4,
          paddingLeft: 8,
          paddingRight: 8,
          width: "auto",
          height: "auto",
          alignItems: "center",
          justifyContent: "center",
          gap: 0,
        },
        React.createElement(Text as any, {
          text: "50% Off",
          fontSize: 11,
          fontWeight: "600",
          color: "#ffffff",
        })
      )
    ),

    // Product name
    React.createElement(Text as any, {
      text: "Product Name",
      fontSize: 14,
      fontWeight: "700",
      color: "#111827",
      textAlign: "center",
    }),

    // Price
    React.createElement(Text as any, {
      text: "PHP 1,000",
      fontSize: 13,
      fontWeight: "500",
      color: "#111827",
      textAlign: "center",
    }),

    // Add to cart button
    React.createElement(Button as any, {
      label: "Add to Cart",
      backgroundColor: "#ffffff",
      textColor: "#111827",
      fontSize: 12,
      fontWeight: "600",
      paddingTop: 8,
      paddingBottom: 8,
      paddingLeft: 20,
      paddingRight: 20,
      borderColor: "#111827",
      borderWidth: 1,
      borderStyle: "solid",
      borderRadius: 4,
      width: "100%",
    })
  ),
};
