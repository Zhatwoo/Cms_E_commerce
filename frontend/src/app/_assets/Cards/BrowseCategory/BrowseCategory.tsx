"use client";

import React from "react";
import { Element } from "@craftjs/core";
import { Container } from "../../../design/_designComponents/Container/Container";
import { Text } from "../../../design/_designComponents/Text/Text";
import { Image } from "../../../design/_designComponents/Image/Image";
import { Button } from "../../../design/_designComponents/Button/Button";
import { Row } from "../../../design/_designComponents/Row/Row";
import { Column } from "../../../design/_designComponents/Column/Column";
import { Section } from "../../../design/_designComponents/Section/Section";
import { TemplateEntry } from "../../_types";

const topCards = [
  { title: "Browse Featured products", tag: "Featured" },
  { title: "Browse New products", tag: "New" },
];

const gridCards = [
  { title: "Women's Apparel" },
  { title: "Men's Apparel" },
  { title: "Kids' Apparel" },
  { title: "Shoes" },
  { title: "Electronics" },
  { title: "Accessories" },
  { title: "Bags & Luggage" },
  { title: "Appliances" },
  { title: "Health & Personal Care" },
  { title: "Makeup & Fragrances" },
  { title: "Sports & Travel" },
  { title: "Hobbies & Stationery" },
];

const generatedImageIds = [
  "photo-1556228578-8c89e6adf883",
  "photo-1512436991641-6745cdb1723f",
  "photo-1503342217505-b0a15ec3261c",
  "photo-1542291026-7eec264c27ff",
  "photo-1518770660439-4636190af475",
  "photo-1523170335258-f5ed11844a49",
  "photo-1548036328-c9fa89d128fa",
  "photo-1581093458791-9f3c3900df4b",
  "photo-1587854692152-cbe660dbde88",
  "photo-1596462502278-27bfdc403348",
  "photo-1612872087720-bb876e2e67d1",
  "photo-1452860606245-08befc0ff44b",
  "photo-1505740420928-5e560c06d30e",
  "photo-1523381210434-271e8be1f52b",
];

function getGeneratedImage(title: string, index: number) {
  const id = generatedImageIds[index % generatedImageIds.length];
  return `https://images.unsplash.com/${id}?auto=format&fit=crop&w=700&q=80&text=${encodeURIComponent(title)}`;
}

function browseBtn() {
  return React.createElement(Button as any, {
    label: "Browse",
    backgroundColor: "#ffffff",
    textColor: "#1f1f1f",
    // ✅ More aggressive min so button text never overflows on tiny screens
    fontSize: "clamp(8px, 1.8vw, 12px)",
    fontWeight: "600",
    borderRadius: 16,
    paddingTop: 4,
    paddingBottom: 4,
    paddingLeft: 10,
    paddingRight: 10,
  });
}

function topCard(title: string, tag: string, img: string) {
  return React.createElement(
    Element as any,
    {
      is: Container as any,
      canvas: true,
      background: "linear-gradient(120deg, #7f8188, #6f7178)",
      borderRadius: 4,
      width: "min(calc(50% - 6px), 600px)",
      flexShrink: 0,
      height: "clamp(130px, 16vw, 175px)",
      paddingTop: "clamp(8px, 1vw, 12px)",
      paddingBottom: "clamp(8px, 1vw, 12px)",
      paddingLeft: "clamp(10px, 1.2vw, 14px)",
      paddingRight: "clamp(10px, 1.2vw, 14px)",
      position: "relative",
      alignItems: "stretch",
      justifyContent: "space-between",
      overflow: "hidden",
    },
    // Tag badge
    React.createElement(
      Element as any,
      {
        is: Container as any,
        canvas: true,
        background: "#f5b400",
        borderRadius: 2,
        paddingTop: 2,
        paddingBottom: 2,
        paddingLeft: 6,
        paddingRight: 6,
        width: "auto",
        height: "auto",
        alignItems: "center",
        justifyContent: "center",
        gap: 0,
      },
      React.createElement(Text as any, {
        text: tag,
        // ✅ Scales down to 8px on very small screens
        fontSize: "clamp(8px, 2vw, 11px)",
        fontWeight: "700",
        color: "#111111",
        letterSpacing: 0.5,
      })
    ),
    // Image + text row
    React.createElement(
      Element as any,
      {
        is: Row as any,
        canvas: true,
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "nowrap",
        gap: 8,
        background: "transparent",
        padding: 0,
        width: "100%",
      },
      React.createElement(
        Element as any,
        {
          is: Container as any,
          canvas: true,
          width: "52%",
          height: "clamp(90px, 11vw, 130px)",
          background: "transparent",
          padding: 0,
          alignItems: "center",
          justifyContent: "center",
          gap: 0,
        },
        React.createElement(Image as any, {
          src: img,
          alt: tag,
          width: "100%",
          height: "100%",
          objectFit: "contain",
        })
      ),
      React.createElement(
        Element as any,
        {
          is: Column as any,
          canvas: true,
          width: "48%",
          padding: 0,
          gap: 6,
          alignItems: "flex-start",
          justifyContent: "center",
          background: "transparent",
        },
        React.createElement(Text as any, {
          text: title,
          // ✅ Key fix: min dropped to 9px so long titles fit on mobile
          fontSize: "clamp(9px, 2.2vw, 15px)",
          fontWeight: "700",
          color: "#ffffff",
          lineHeight: 1.3,
        }),
        browseBtn()
      )
    )
  );
}

function smallCard(title: string, img: string) {
  return React.createElement(
    Element as any,
    {
      is: Container as any,
      canvas: true,
      background: "#cccccf",
      borderRadius: 4,
      width: "min(calc(50% - 6px), 260px)",
      flexShrink: 0,
      height: "clamp(120px, 14vw, 160px)",
      paddingTop: "clamp(8px, 1vw, 10px)",
      paddingBottom: "clamp(8px, 1vw, 10px)",
      paddingLeft: "clamp(8px, 1vw, 10px)",
      paddingRight: "clamp(8px, 1vw, 10px)",
      alignItems: "stretch",
      justifyContent: "space-between",
      overflow: "hidden",
    },
    React.createElement(Text as any, {
      text: title,
      // ✅ Scales down aggressively; long labels like "Health & Personal Care" stay in bounds
      fontSize: "clamp(8px, 2.5vw, 13px)",
      fontWeight: "700",
      color: "#111111",
      lineHeight: 1.3,
    }),
    React.createElement(
      Element as any,
      {
        is: Row as any,
        canvas: true,
        background: "transparent",
        padding: 0,
        justifyContent: "space-between",
        alignItems: "flex-end",
        flexWrap: "nowrap",
        gap: 6,
        width: "100%",
      },
      browseBtn(),
      React.createElement(
        Element as any,
        {
          is: Container as any,
          canvas: true,
          width: "60%",
          height: "clamp(70px, 9vw, 100px)",
          background: "transparent",
          padding: 0,
          alignItems: "center",
          justifyContent: "center",
          gap: 0,
        },
        React.createElement(Image as any, {
          src: img,
          alt: title,
          width: "100%",
          height: "100%",
          objectFit: "contain",
        })
      )
    )
  );
}

export const BrowseCategory: TemplateEntry = {
  label: "Browse Category",
  description: "Category grid with featured banners and browse cards",
  preview: "Browse",
  category: "card",
  element: React.createElement(
    Element as any,
    {
      is: Section as any,
      canvas: true,
      background: "#f1f1f1",
      width: "100%",
      minHeight: "100vh",
      padding: 0,
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "flex-start",
    },

    // Header bar
    React.createElement(
      Element as any,
      {
        is: Container as any,
        canvas: true,
        background: "#3a3a3f",
        paddingTop: 14,
        paddingBottom: 14,
        paddingLeft: 24,
        paddingRight: 24,
        width: "100%",
        alignItems: "center",
        justifyContent: "center",
        gap: 0,
      },
      React.createElement(Text as any, {
        text: "Browse Categories",
        // ✅ Header also scales: readable on mobile, elegant on desktop
        fontSize: "clamp(13px, 3vw, 20px)",
        fontWeight: "700",
        color: "#ffffff",
        letterSpacing: 0.5,
      })
    ),

    // Content
    React.createElement(
      Element as any,
      {
        is: Container as any,
        canvas: true,
        background: "transparent",
        width: "min(100%, 1280px)",
        paddingTop: 16,
        paddingBottom: 16,
        paddingLeft: 16,
        paddingRight: 16,
        flexDirection: "column",
        alignItems: "stretch",
        justifyContent: "flex-start",
        gap: 12,
      },

      // Top banner cards
      React.createElement(
        Element as any,
        {
          is: Row as any,
          canvas: true,
          background: "transparent",
          padding: 0,
          gap: 12,
          flexWrap: "wrap",
          alignItems: "stretch",
          justifyContent: "center",
          width: "100%",
        },
        topCard(topCards[0].title, topCards[0].tag, getGeneratedImage(topCards[0].title, 0)),
        topCard(topCards[1].title, topCards[1].tag, getGeneratedImage(topCards[1].title, 1))
      ),

      // Small cards
      React.createElement(
        Element as any,
        {
          is: Row as any,
          canvas: true,
          background: "transparent",
          padding: 0,
          gap: 12,
          flexWrap: "wrap",
          alignItems: "stretch",
          justifyContent: "center",
          width: "100%",
        },
        ...gridCards.map((card, idx) =>
          smallCard(card.title, getGeneratedImage(card.title, idx + 2))
        )
      )
    )
  ),
};