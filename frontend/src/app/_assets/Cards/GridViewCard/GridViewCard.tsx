"use client";

import React from "react";
import { Element } from "@craftjs/core";
import { Container } from "../../../design/_designComponents/Container/Container";
import { Text } from "../../../design/_designComponents/Text/Text";
import { Image } from "../../../design/_designComponents/Image/Image";
import { Button } from "../../../design/_designComponents/Button/Button";
import { Row } from "../../../design/_designComponents/Row/Row";
import { TemplateEntry } from "../../_types";

const createGridProductItem = (name: string, price: string) =>
  React.createElement(
    Element as any,
    {
      is: Container as any,
      canvas: true,
      background: "#ffffff",
      width: "min(calc((100% - 72px) / 4), 100%)",
      minWidth: "220px",
      height: "450px",
      flexShrink: 0,
      borderWidth: 1,
      borderColor: "#e5e7eb",
      borderStyle: "solid",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "flex-start",
      gap: 10,
      paddingTop: 12,
      paddingBottom: 16,
      paddingLeft: 12,
      paddingRight: 12,
      borderRadius: 8,
    },

    // Image with badge overlay built-in
    React.createElement(Image as any, {
      src: "https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=600&q=80",
      alt: name,
      width: "100%",
      height: "280px",
      objectFit: "cover",
      borderRadius: 6,
      allowUpload: true,
      badge: "50% Off",
      badgeColor: "#1e293b",
    }),

    // Name
    React.createElement(Text as any, {
      text: name,
      fontSize: 14,
      fontWeight: "700",
      textAlign: "center",
      color: "#111827",
      width: "100%",
      lineHeight: 1.4,
    }),

    // Price
    React.createElement(Text as any, {
      text: price,
      fontSize: 13,
      fontWeight: "400",
      textAlign: "center",
      color: "#374151",
      width: "100%",
      lineHeight: 1.4,
    }),

    // Button
    React.createElement(Button as any, {
      label: "Add to Cart",
      backgroundColor: "#ffffff",
      textColor: "#111827",
      fontSize: 13,
      fontWeight: "600",
      borderWidth: 1,
      borderColor: "#d1d5db",
      borderStyle: "solid",
      borderRadius: 6,
      paddingTop: 10,
      paddingBottom: 10,
      paddingLeft: 20,
      paddingRight: 20,
      width: "100%",
    })
  );

export const GridViewCard: TemplateEntry = {
  label: "Products Grid View",
  description: "4-column product grid with image, badge, name, price and add to cart",
  preview: "🧩",
  category: "card",
  element: React.createElement(
    Element as any,
    {
      is: Row as any,
      canvas: true,
      background: "#f9fafb",
      width: "100%",
      paddingTop: 24,
      paddingBottom: 24,
      paddingLeft: 24,
      paddingRight: 24,
      gap: 16,
      alignItems: "stretch",
      justifyContent: "flex-start",
      flexWrap: "wrap",
    },
    createGridProductItem("Product Name", "PHP 1,000"),
    createGridProductItem("Product Name", "PHP 1,000"),
    createGridProductItem("Product Name", "PHP 1,000"),
    createGridProductItem("Product Name", "PHP 1,000")
  ),
};
