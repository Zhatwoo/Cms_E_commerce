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

const createFeaturedItem = (
  badge: string,
  badgeColor: string,
  name: string,
  subtitle: string,
  price: string,
  originalPrice: string,
  src: string
) =>
  React.createElement(
    Element as any,
    {
      is: Container as any,
      canvas: true,
      background: "#FFFFFF",
      width: "min(calc(50% - 16px), 380px)",
      flexShrink: 0,
      flexDirection: "column",
      alignItems: "stretch",
      justifyContent: "flex-start",
      gap: 0,
      padding: 0,
      overflow: "hidden",
      boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
    },

    // Image area
    React.createElement(
      Element as any,
      {
        is: Container as any,
        canvas: true,
        background: "#F7F4F0",
        position: "relative",
        width: "100%",
        height: "clamp(180px, 22vw, 260px)",
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
      }),
      // Badge
      React.createElement(
        Element as any,
        {
          is: Container as any,
          canvas: true,
          position: "absolute",
          top: "12px",
          left: "12px",
          background: badgeColor,
          paddingTop: 5,
          paddingBottom: 5,
          paddingLeft: 12,
          paddingRight: 12,
          width: "auto",
          height: "auto",
          alignItems: "center",
          justifyContent: "center",
          gap: 0,
        },
        React.createElement(Text as any, {
          text: badge,
          fontSize: 10,
          fontWeight: "800",
          color: "#ffffff",
          letterSpacing: 1,
        })
      )
    ),

    // Content
    React.createElement(
      Element as any,
      {
        is: Container as any,
        canvas: true,
        background: "transparent",
        paddingTop: 20,
        paddingBottom: 20,
        paddingLeft: 20,
        paddingRight: 20,
        flexDirection: "column",
        alignItems: "stretch",
        gap: 16,
      },

      // Name + subtitle
      React.createElement(
        Element as any,
        {
          is: Column as any,
          canvas: true,
          background: "transparent",
          padding: 0,
          gap: 5,
          alignItems: "flex-start",
        },
        React.createElement(Text as any, {
          text: name,
          fontSize: 16,
          fontWeight: "700",
          color: "#111827",
          lineHeight: 1.3,
        }),
        React.createElement(Text as any, {
          text: subtitle,
          fontSize: 12,
          fontWeight: "400",
          color: "#9CA3AF",
          lineHeight: 1.5,
        })
      ),

      // Price + button row
      React.createElement(
        Element as any,
        {
          is: Row as any,
          canvas: true,
          background: "transparent",
          padding: 0,
          gap: 12,
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          width: "100%",
        },
        React.createElement(
          Element as any,
          {
            is: Column as any,
            canvas: true,
            background: "transparent",
            padding: 0,
            gap: 4,
            alignItems: "flex-start",
          },
          React.createElement(Text as any, {
            text: price,
            fontSize: 20,
            fontWeight: "700",
            color: "#111827",
            lineHeight: 1,
          }),
          React.createElement(Text as any, {
            text: originalPrice,
            fontSize: 12,
            fontWeight: "400",
            color: "#D1D5DB",
            lineHeight: 1,
          })
        ),
        React.createElement(Button as any, {
          label: "Add to Cart",
          backgroundColor: "#111827",
          textColor: "#ffffff",
          fontSize: 12,
          fontWeight: "700",
          paddingTop: 10,
          paddingBottom: 10,
          paddingLeft: 18,
          paddingRight: 18,
          letterSpacing: 0.3,
        })
      )
    )
  );

export const FeaturedProduct: TemplateEntry = {
  label: "Featured Product",
  description: "Three featured products with badges, price, and add to cart button",
  preview: "🏷️",
  category: "card",
  element: React.createElement(
    Element as any,
    {
      is: Section as any,
      canvas: true,
      background: "#F7F4F0",
      width: "100%",
      minHeight: "100vh",
      paddingTop: 64,
      paddingBottom: 64,
      paddingLeft: 40,
      paddingRight: 40,
      gap: 48,
      flexDirection: "column",
      justifyContent: "center",
      alignItems: "center",
    },

    // Header
    React.createElement(
      Element as any,
      {
        is: Column as any,
        canvas: true,
        background: "transparent",
        padding: 0,
        alignItems: "center",
        gap: 10,
        width: "min(100%, 520px)",
      },
      React.createElement(Text as any, {
        text: "Featured Products",
        fontSize: 32,
        fontWeight: "700",
        color: "#111827",
        textAlign: "center",
        lineHeight: 1.15,
      }),
      React.createElement(Text as any, {
        text: "Handpicked pieces worth every peso.",
        fontSize: 14,
        fontWeight: "400",
        color: "#9CA3AF",
        textAlign: "center",
        lineHeight: 1.6,
      })
    ),

    // Cards
    React.createElement(
      Element as any,
      {
        is: Row as any,
        canvas: true,
        background: "transparent",
        width: "min(100%, 1280px)",
        padding: 0,
        gap: 24,
        flexDirection: "row",
        flexWrap: "wrap",
        justifyContent: "center",
        alignItems: "flex-start",
        alignContent: "flex-start",
      },
      createFeaturedItem(
        "NEW ARRIVAL",
        "#C2410C",
        "Luminous Glow Serum",
        "Vitamin C · Brightening · 30ml",
        "₱ 1,299",
        "₱ 2,500",
        "https://images.unsplash.com/photo-1556228578-8c89e6adf883?auto=format&fit=crop&w=800&q=80"
      ),
      createFeaturedItem(
        "BEST SELLER",
        "#A16207",
        "Rose Toner Mist",
        "Hydrating · Rose Extract · 100ml",
        "₱ 899",
        "₱ 1,800",
        "https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=800&q=80"
      ),
      createFeaturedItem(
        "EDITOR'S PICK",
        "#1D4ED8",
        "Nourish Face Cream",
        "Rich Moisture · Sensitive Skin · 50ml",
        "₱ 1,099",
        "₱ 2,200",
        "https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=800&q=80"
      )
    )
  ),
};