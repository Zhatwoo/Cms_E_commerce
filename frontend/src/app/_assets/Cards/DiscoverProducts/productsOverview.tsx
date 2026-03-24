/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React from "react";
import { Element } from "@craftjs/core";
import { Container } from "../../../design/_designComponents/Container/Container";
import { Text } from "../../../design/_designComponents/Text/Text";
import { Image } from "../../../design/_designComponents/Image/Image";
import { Button } from "../../../design/_designComponents/Button/Button";
import { Section } from "../../../design/_designComponents/Section/Section";
import { Row } from "../../../design/_designComponents/Row/Row";
import { Column } from "../../../design/_designComponents/Column/Column";
import { TemplateEntry } from "../../_types";

const createDiscoverProductCard = () =>
  React.createElement(
    Element as any,
    {
      is: Container as any,
      canvas: true,
      background: "#ffffff",
      width: "calc((100% - 54px) / 4)",
      height: "450px",
      flexShrink: 0,
      borderWidth: 1,
      borderColor: "#e5e7eb",
      borderStyle: "solid",
      borderRadius: 8,
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "flex-start",
      paddingTop: 12,
      paddingBottom: 16,
      paddingLeft: 12,
      paddingRight: 12,
      gap: 10,
    },

    // Image with badge overlay
    React.createElement(Image as any, {
      src: "",
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

export const ProductsOverview: TemplateEntry = {
  label: "Discover Products",
  description: "Product discovery layout with grid cards",
  preview: "🧾",
  category: "card",
  element: React.createElement(
    Element as any,
    {
      is: Section as any,
      canvas: true,
      background: "#f9fafb",
      width: "100%",
      minHeight: "100vh",
      padding: 0,
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "flex-start",
      gap: 0,
    },

    // Header
    React.createElement(
      Element as any,
      {
        is: Container as any,
        canvas: true,
        background: "#2f3035",
        width: "100%",
        paddingTop: 16,
        paddingBottom: 16,
        paddingLeft: 24,
        paddingRight: 24,
        alignItems: "center",
        justifyContent: "center",
        gap: 0,
      },
      React.createElement(Text as any, {
        text: "Discover Products",
        fontSize: 42,
        fontWeight: "700",
        color: "#f6f7f8",
        lineHeight: 1.1,
      })
    ),

    // Grid rows
    React.createElement(
      Element as any,
      {
        is: Row as any,
        canvas: true,
        background: "transparent",
        width: "100%",
        paddingTop: 56,
        paddingBottom: 56,
        paddingLeft: 24,
        paddingRight: 24,
        justifyContent: "center",
        alignItems: "center",
        gap: 18,
      },
      React.createElement(
        Element as any,
        {
          is: Column as any,
          canvas: true,
          background: "transparent",
          width: "min(100%, 1220px)",
          padding: 0,
          alignItems: "stretch",
          justifyContent: "flex-start",
          gap: 18,
        },
        React.createElement(
          Element as any,
          {
            is: Row as any,
            canvas: true,
            background: "transparent",
            width: "100%",
            padding: 0,
            justifyContent: "center",
            alignItems: "stretch",
            gap: 18,
            flexWrap: "wrap",
          },
          createDiscoverProductCard(),
          createDiscoverProductCard(),
          createDiscoverProductCard(),
          createDiscoverProductCard()
        ),
        React.createElement(
          Element as any,
          {
            is: Row as any,
            canvas: true,
            background: "transparent",
            width: "100%",
            padding: 0,
            justifyContent: "center",
            alignItems: "stretch",
            gap: 18,
            flexWrap: "wrap",
          },
          createDiscoverProductCard(),
          createDiscoverProductCard(),
          createDiscoverProductCard(),
          createDiscoverProductCard()
        )
      )
    )
  ),
};
