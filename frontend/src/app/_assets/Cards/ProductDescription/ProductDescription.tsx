"use client";

import React from "react";
import { Element } from "@craftjs/core";
import { Container } from "../../../design/_designComponents/Container/Container";
import { Text } from "../../../design/_designComponents/Text/Text";
import { Image } from "../../../design/_designComponents/Image/Image";
import { Row } from "../../../design/_designComponents/Row/Row";
import { TemplateEntry } from "../../_types";

const createProductDescriptionItem = (
  name: string,
  description: string,
  price: string,
  src: string
) =>
  React.createElement(
    Element as any,
    {
      is: Container as any,
      canvas: true,
      background: "#FFFFFF",
      width: "min(calc((100% - 48px) / 4), 100%)",
      minWidth: "220px",
      flexShrink: 0,
      borderRadius: 12,
      overflow: "hidden",
      flexDirection: "column",
      alignItems: "stretch",
      justifyContent: "flex-start",
      padding: 0,
      gap: 0,
      boxShadow: "0 2px 12px rgba(0,0,0,0.07)",
    },

    React.createElement(
      Element as any,
      {
        is: Container as any,
        canvas: true,
        background: "#F5F3F0",
        width: "100%",
        height: "220px",
        padding: 0,
        gap: 0,
        overflow: "hidden",
      },
      React.createElement(Image as any, {
        src,
        alt: name,
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
        text: name,
        fontSize: 14,
        fontWeight: "600",
        color: "#111827",
        lineHeight: 1.3,
      }),
      React.createElement(Text as any, {
        text: description,
        fontSize: 12,
        fontWeight: "400",
        color: "#6B7280",
        lineHeight: 1.5,
      }),
      React.createElement(Text as any, {
        text: price,
        fontSize: 16,
        fontWeight: "700",
        color: "#111827",
        lineHeight: 1,
      })
    )
  );

export const ProductDescription: TemplateEntry = {
  label: "Product Description",
  description: "Product cards with image, name, description and price",
  preview: "PD",
  category: "card",
  element: React.createElement(
    Element as any,
    {
      is: Row as any,
      canvas: true,
      background: "#F5F3F0",
      width: "100%",
      minHeight: "100vh",
      paddingTop: 16,
      paddingBottom: 16,
      paddingLeft: 96,
      paddingRight: 96,
      gap: 16,
      alignItems: "stretch",
      justifyContent: "flex-start",
      flexWrap: "wrap",
    },
    createProductDescriptionItem(
      "Luminous Glow Serum",
      "Brightening vitamin C serum for radiant skin.",
      "P 1,299",
      "https://images.unsplash.com/photo-1556228578-8c89e6adf883?auto=format&fit=crop&w=800&q=80"
    ),
    createProductDescriptionItem(
      "Rose Toner Mist",
      "Hydrating facial mist with rose water extract.",
      "P 899",
      "https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=800&q=80"
    ),
    createProductDescriptionItem(
      "Nourish Face Cream",
      "Rich moisturizer for dry and sensitive skin.",
      "P 1,099",
      "https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=800&q=80"
    ),
    createProductDescriptionItem(
      "Gentle Foam Cleanser",
      "Soft cleansing foam that respects skin barrier.",
      "P 749",
      "https://images.unsplash.com/photo-1515377905703-c4788e51af15?auto=format&fit=crop&w=800&q=80"
    )
  ),
};
