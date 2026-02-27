"use client";

import React from "react";
import { Element } from "@craftjs/core";
import { Container } from "../../../design/_designComponents/Container/Container";
import { Text } from "../../../design/_designComponents/Text/Text";
import { Button } from "../../../design/_designComponents/Button/Button";
import { Image } from "../../../design/_designComponents/Image/Image";
import { Section } from "../../../design/_designComponents/Section/Section";
import { TemplateEntry } from "../../_types";

export const ProductCard: TemplateEntry = {
  label: "Product Card",
  description: "E-commerce product card",
  preview: "🛍️",
  category: "card",
  element: React.createElement(
    Element as any,
    {
      is: Section as any,
      canvas: true,
      background: "#f1f5f9",
      width: "100%",
      minHeight: "100vh",
      padding: 12,
      flexDirection: "column",
      justifyContent: "center",
      alignItems: "center",
    },

    React.createElement(
      Element as any,
      {
        is: Container as any,
        canvas: true,
        background: "#ffffff",
        width: "min(100%, 380px)",
        flexShrink: 0,
        paddingTop: 20,
        paddingBottom: 20,
        paddingLeft: 20,
        paddingRight: 20,
        borderRadius: 12,
        boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
        borderWidth: 1,
        borderColor: "#e5e7eb",
        borderStyle: "solid",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "flex-start",
        gap: 12,
      },

      // Image container
      React.createElement(
        Element as any,
        {
          is: Container as any,
          canvas: true,
          background: "#f8fafc",
          width: "100%",
          height: "320px",
          padding: 0,
          borderRadius: 8,
          overflow: "hidden",
          alignItems: "center",
          justifyContent: "center",
          gap: 0,
        },
        React.createElement(Image as any, {
          src: "",
          alt: "Product Image",
          width: "100%",
          height: "100%",
          objectFit: "cover",
          borderRadius: 8,
          allowUpload: true,
        })
      ),

      // Product name
      React.createElement(Text as any, {
        text: "Product Name",
        fontSize: 20,
        fontWeight: "600",
        color: "#1e293b",
        textAlign: "center",
      }),

      // Price
      React.createElement(Text as any, {
        text: "₱ 1,000",
        fontSize: 22,
        fontWeight: "700",
        color: "#222222",
        textAlign: "center",
      }),

      // Add to cart button
      React.createElement(Button as any, {
        label: "Add to Cart",
        backgroundColor: "#ffffff",
        textColor: "#222222",
        fontSize: 14,
        fontWeight: "600",
        paddingTop: 12,
        paddingBottom: 12,
        paddingLeft: 24,
        paddingRight: 24,
        borderColor: "#222222",
        borderWidth: 1,
        borderStyle: "solid",
        borderRadius: 8,
        width: "100%",
      }),
    )
  ),
};