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
      // tag as a pre-built block so PanelDropFreePlacementHandler treats it as free-position
      custom: { isPrebuiltBlock: true },
      background: "#ffffff",
      width: "350px",
      height: "450px",
      flexShrink: 0,
      position: "absolute",
      top: "0px",
      left: "0px",
      borderWidth: 1,
      borderColor: "#e5e7eb",
      borderStyle: "solid",
      borderRadius: 10,
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "flex-start",
      paddingTop: 12,
      paddingBottom: 16,
      paddingLeft: 12,
      paddingRight: 12,
      gap: 10,
    },

    // Image with built-in badge overlay — no sub-container needed
    React.createElement(Image as any, {
      src: "https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=600&q=80",
      alt: "Product Image",
      width: "100%",
      height: "280px",
      objectFit: "cover",
      borderRadius: 6,
      allowUpload: true,
      badge: "50% Off",
      badgeColor: "#1e293b",
    }),

    // Product name
    React.createElement(Text as any, {
      text: "Product Name",
      fontSize: 14,
      fontWeight: "700",
      color: "#111827",
      textAlign: "center",
      width: "100%",
      lineHeight: 1.4,
    }),

    // Price
    React.createElement(Text as any, {
      text: "PHP 1,000",
      fontSize: 13,
      fontWeight: "400",
      color: "#374151",
      textAlign: "center",
      width: "100%",
      lineHeight: 1.4,
    }),

    // Add to Cart button
    React.createElement(Button as any, {
      label: "Add to Cart",
      backgroundColor: "#ffffff",
      textColor: "#111827",
      fontSize: 13,
      fontWeight: "600",
      paddingTop: 10,
      paddingBottom: 10,
      paddingLeft: 20,
      paddingRight: 20,
      borderColor: "#d1d5db",
      borderWidth: 1,
      borderStyle: "solid",
      borderRadius: 6,
      width: "100%",
    })
  ),
};
