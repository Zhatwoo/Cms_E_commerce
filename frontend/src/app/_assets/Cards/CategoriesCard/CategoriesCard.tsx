"use client";
import React from "react";
import { Element } from "@craftjs/core";
import { Container } from "../../../design/_designComponents/Container/Container";
import { Text } from "../../../design/_designComponents/Text/Text";
import { Image } from "../../../design/_designComponents/Image/Image";
import { Section } from "../../../design/_designComponents/Section/Section";
import { Row } from "../../../design/_designComponents/Row/Row";
import { TemplateEntry } from "../../_types";

const unsplashImages = [
  "photo-1556228578-8c89e6adf883",
  "photo-1512436991641-6745cdb1723f",
  "photo-1517336714731-489689fd1ca8",
  "photo-1465101046530-73398c7f28ca",
  "photo-1506744038136-46273834b3fb",
  "photo-1519125323398-675f0ddb6308",
  "photo-1503342217505-b0a15ec3261c",
  "photo-1515378791036-0648a3ef77b2",
  "photo-1517841905240-472988babdf9",
  "photo-1524901548305-08eeddc35080",
];

const categories = [
  { label: "Men's Apparel" },
  { label: "Women's Apparel" },
  { label: "Mobile & Gadgets" },
  { label: "Mobile Accessories" },
  { label: "Home Entertainment" },
  { label: "Computers & Laptops" },
  { label: "Sports & Outdoors" },
  { label: "Beauty & Health" },
  { label: "Toys & Kids" },
  { label: "Books & Stationery" },
];

const createCategoryItem = (label: string, idx: number) => {
  const src = `https://images.unsplash.com/${unsplashImages[idx % unsplashImages.length]}?auto=format&fit=crop&w=600&q=80`;
  return React.createElement(
    Element as any,
    {
      is: Container as any,
      canvas: true,
      background: "#ffffff",
      // min(calc(50% - 8px), 220px):
      // - wide: caps at 220px → fits 4+ per row naturally
      // - narrow: 50%-8px kicks in → exactly 2 per row, always
      width: "min(calc(50% - 8px), 220px)",
      flexShrink: 0,
      overflow: "hidden",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "flex-start",
      padding: 0,
      gap: 0,
      boxShadow: "0 2px 12px rgba(0,0,0,0.07)",
    },

    // Image
    React.createElement(
      Element as any,
      {
        is: Container as any,
        canvas: true,
        background: "#f3f4f6",
        width: "100%",
        height: "130px",
        padding: 0,
        gap: 0,
        overflow: "hidden",
      },
      React.createElement(Image as any, {
        src,
        alt: label,
        width: "100%",
        height: "100%",
        objectFit: "cover",
        allowUpload: true,
      })
    ),

    // Label
    React.createElement(
      Element as any,
      {
        is: Container as any,
        canvas: true,
        background: "transparent",
        paddingTop: 10,
        paddingBottom: 10,
        paddingLeft: 8,
        paddingRight: 8,
        alignItems: "center",
        justifyContent: "center",
        gap: 0,
        width: "100%",
      },
      React.createElement(Text as any, {
        text: label,
        fontSize: 12,
        fontWeight: "600",
        color: "#1f2937",
        textAlign: "center",
        lineHeight: 1.4,
      })
    )
  );
};

export const CategoriesCard: TemplateEntry = {
  label: "Categories Card",
  description: "E-commerce categories card with modern UI",
  preview: "📦",
  category: "card",
  element: React.createElement(
    Element as any,
    {
      is: Section as any,
      canvas: true,
      background: "#f9fafb",
      width: "100%",
      minHeight: "100vh",
      paddingTop: 56,
      paddingBottom: 56,
      paddingLeft: 32,
      paddingRight: 32,
      gap: 36,
      flexDirection: "column",
      justifyContent: "flex-start",
      alignItems: "center",
    },

    // Header
    React.createElement(
      Element as any,
      {
        is: Row as any,
        canvas: true,
        background: "transparent",
        width: "min(100%, 1280px)",
        padding: 0,
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: 12,
      },
      React.createElement(Text as any, {
        text: "Shop by Category",
        fontSize: 28,
        fontWeight: "700",
        color: "#111827",
        lineHeight: 1.2,
      }),
      React.createElement(Text as any, {
        text: "View all →",
        fontSize: 14,
        fontWeight: "600",
        color: "#6366f1",
      })
    ),

    // Cards grid
    React.createElement(
      Element as any,
      {
        is: Row as any,
        canvas: true,
        background: "transparent",
        width: "min(100%, 1280px)",
        padding: 0,
        gap: 16,
        flexDirection: "row",
        flexWrap: "wrap",
        justifyContent: "center",
        alignItems: "flex-start",
        alignContent: "flex-start",
      },
      ...categories.map((cat, idx) => createCategoryItem(cat.label, idx))
    )
  ),
};

export default CategoriesCard;