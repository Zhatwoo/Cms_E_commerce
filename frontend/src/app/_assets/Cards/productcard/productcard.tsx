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
      maxWidth: "300px",
      borderRadius: 12,
      boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
      borderWidth: 1,
      borderColor: "#e5e7eb",
      borderStyle: "solid",
      canvas: true 
    },
    React.createElement(Element as any, { 
      is: Image as any, 
      src: "",
      alt: "Product Image",
      width: "100%",
      height: "200px",
      objectFit: "cover",
      borderRadius: 8,
      allowUpload: true  // Enable image upload
    }),
    React.createElement(Text as any, { text: "Product Name", fontSize: 18, fontWeight: "600", color: "#1e293b" }),
    React.createElement(Text as any, { text: "$99.99", fontSize: 20, fontWeight: "bold", color: "#3b82f6" }),
    React.createElement(Text as any, { text: "Short description of the product.", fontSize: 14, color: "#64748b" }),
    React.createElement(Button as any, { label: "Add to Cart", backgroundColor: "#10b981", textColor: "#ffffff", fontSize: 14 })
  ),
  category: "card",
};