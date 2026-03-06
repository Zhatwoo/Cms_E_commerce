"use client";

import React from "react";
import { Element } from "@craftjs/core";
import { Container } from "../../../design/_designComponents/Container/Container";
import { Text } from "../../../design/_designComponents/Text/Text";
import { Image } from "../../../design/_designComponents/Image/Image";
import { Button } from "../../../design/_designComponents/Button/Button";
import { Row } from "../../../design/_designComponents/Row/Row";
import { TemplateEntry } from "../../_types";

const createGridProductItem = (name: string, price: string, imageText: string) =>
  React.createElement(
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
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "flex-start",
      gap: 10,
      paddingTop: 12,
      paddingBottom: 12,
      paddingLeft: 12,
      paddingRight: 12,
      borderRadius: 8,
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
        src: `https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=600&q=80&text=${encodeURIComponent(imageText)}`,
        alt: name,
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
          text: "↩ 50% Off",
          fontSize: 11,
          fontWeight: "600",
          color: "#ffffff",
        })
      )
    ),

    // Name
    React.createElement(Text as any, {
      text: name,
      fontSize: 14,
      fontWeight: "700",
      textAlign: "center",
      color: "#111827",
    }),

    // Price
    React.createElement(Text as any, {
      text: price,
      fontSize: 13,
      fontWeight: "500",
      textAlign: "center",
      color: "#111827",
    }),

    // Button
    React.createElement(Button as any, {
      label: "Add to Cart",
      backgroundColor: "#ffffff",
      textColor: "#111827",
      fontSize: 12,
      fontWeight: "600",
      borderWidth: 1,
      borderColor: "#111827",
      borderStyle: "solid",
      borderRadius: 4,
      paddingTop: 8,
      paddingBottom: 8,
      paddingLeft: 20,
      paddingRight: 20,
      width: "100%",
    })
  );

export const GridViewCard: TemplateEntry = {
  label: "Products Grid View",
  description: "Rows and columns layout with product image, name, price, and rating",
  preview: "🧩",
  category: "card",
  element: React.createElement(
    Element as any,
    {
      is: Row as any,
      canvas: true,
      background: "#d4d4d8",
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
    createGridProductItem("Product Name", "₱ 1,000", "Bottle"),
    createGridProductItem("Product Name", "₱ 1,000", "Bottle"),
    createGridProductItem("Product Name", "₱ 1,000", "Bottle"),
    createGridProductItem("Product Name", "₱ 1,000", "Bottle")
  ),
};
