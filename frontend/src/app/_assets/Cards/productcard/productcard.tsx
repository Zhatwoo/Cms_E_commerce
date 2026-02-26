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
  preview: "🛍️",
  element: React.createElement(
    Element as any,
    { 
      is: Container as any,
      background: "#ffffff",
      padding: 20,
      width: "380px",
      minWidth: "380px",
      maxWidth: "500px",
      borderRadius: 12,
      boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
      borderWidth: 1,
      borderColor: "#e5e7eb",
      borderStyle: "solid",
      canvas: true,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "flex-start"
    },
    React.createElement(
      Element as any,
      {
        is: Container as any,
        position: "relative",
        width: "340px",
        height: "360px",
        marginBottom: 20,
        padding: 0,
        background: "#f8fafc",
        borderRadius: 8,
        overflow: "hidden",
      },
      // Product Image
      React.createElement(Element as any, {
        is: Image as any,
        src: "",
        alt: "Product Image",
        width: "300px",
        height: "4500px",
        objectFit: "cover",
        borderRadius: 8,
        allowUpload: true,
      })
    ),
    React.createElement(Text as any, { text: "Product Name", fontSize: 30, fontWeight: "600", color: "#1e293b", marginTop: 8 }),
    React.createElement(Text as any, { text: "₱ 1,000", fontSize: 30, fontWeight: "bold", color: "#222", marginBottom: 4 }),
    // Description (optional)
    // React.createElement(Text as any, { text: "Short description of the product.", fontSize: 14, color: "#64748b" }),
    React.createElement(
      Element as any,
      {
        is: Container as any,
        marginTop: 16,
        display: "flex",
        justifyContent: "center",
      },
      React.createElement(Button as any, {
        label: "Add to Cart",
        backgroundColor: "#fff",
        textColor: "#222",
        fontSize: 30,
        borderColor: "#222",
        borderWidth: 1,
        borderStyle: "solid",
        borderRadius: 8,
        padding: "12px 24px",
        boxShadow: "none",
      })
    )
  ),
  category: "card",
};