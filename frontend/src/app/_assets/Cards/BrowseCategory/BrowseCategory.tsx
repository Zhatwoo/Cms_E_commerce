"use client";

import React from "react";
import { Element } from "@craftjs/core";
import { Container } from "../../../design/_designComponents/Container/Container";
import { Text } from "../../../design/_designComponents/Text/Text";
import { Image } from "../../../design/_designComponents/Image/Image";
import { Button } from "../../../design/_designComponents/Button/Button";
import { Row } from "../../../design/_designComponents/Row/Row";
import { Column } from "../../../design/_designComponents/Column/Column";
import { TemplateEntry } from "../../_types";

const topCards = [
  {
    title: "Browse Featured products",
    tag: "Featured",
  },
  {
    title: "Browse New products",
    tag: "New",
  },
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
    fontSize: 12,
    fontWeight: "600",
    borderRadius: 16,
    paddingTop: 5,
    paddingBottom: 5,
    paddingLeft: 22,
    paddingRight: 22,
  });
}

function topCard(title: string, tag: string, img: string) {
  return React.createElement(
    Element as any,
    {
      is: Container as any,
      background: "linear-gradient(120deg, #7f8188, #6f7178)",
      borderRadius: 4,
      width: "49%",
      height: "175px",
      paddingTop: 10,
      paddingBottom: 12,
      paddingLeft: 14,
      paddingRight: 14,
      position: "relative",
      canvas: true,
      alignItems: "stretch",
      justifyContent: "space-between",
      overflow: "hidden",
    },
    React.createElement(
      Element as any,
      {
        is: Container as any,
        background: "#f5b400",
        borderRadius: 2,
        paddingTop: 2,
        paddingBottom: 2,
        paddingLeft: 14,
        paddingRight: 14,
        width: "84px",
        canvas: true,
        alignItems: "center",
        justifyContent: "center",
      },
      React.createElement(Text as any, {
        text: tag,
        fontSize: 20,
        fontWeight: "700",
        color: "#111111",
      })
    ),
    React.createElement(
      Element as any,
      {
        is: Row as any,
        canvas: true,
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "nowrap",
        gap: 10,
      },
      React.createElement(
        Element as any,
        {
          is: Container as any,
          width: "52%",
          height: "138px",
          background: "transparent",
          padding: 0,
          canvas: true,
          alignItems: "center",
          justifyContent: "center",
        },
        React.createElement(Image as any, {
          src: img,
          alt: tag,
          width: "100%",
          height: "136px",
          objectFit: "contain",
        })
      ),
      React.createElement(
        Element as any,
        {
          is: Column as any,
          width: "50%",
          padding: 0,
          gap: 8,
          canvas: true,
          alignItems: "flex-start",
          justifyContent: "center",
        },
        React.createElement(Text as any, {
          text: title,
          fontSize: 20,
          fontWeight: "700",
          color: "#ffffff",
          lineHeight: 1.1,
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
      background: "#cccccf",
      borderRadius: 4,
      width: "23.8%",
      height: "210px",
      paddingTop: 12,
      paddingBottom: 12,
      paddingLeft: 12,
      paddingRight: 12,
      canvas: true,
      alignItems: "stretch",
      justifyContent: "space-between",
      overflow: "hidden",
    },
    React.createElement(Text as any, {
      text: title,
      fontSize: 20,
      fontWeight: "700",
      color: "#111111",
      lineHeight: 1.08,
    }),
    React.createElement(
      Element as any,
      { is: Row as any, canvas: true, justifyContent: "space-between", alignItems: "flex-end", flexWrap: "nowrap", gap: 8 },
      browseBtn(),
      React.createElement(
        Element as any,
        {
          is: Container as any,
          width: "64%",
          height: "136px",
          background: "transparent",
          padding: 0,
          canvas: true,
          alignItems: "center",
          justifyContent: "center",
        },
        React.createElement(Image as any, {
          src: img,
          alt: title,
          width: "100%",
          height: "134px",
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
  element: React.createElement(
    Element as any,
    {
      is: Container as any,
      background: "#f1f1f1",
      width: "100%",
      paddingTop: 0,
      paddingBottom: 14,
      paddingLeft: 0,
      paddingRight: 0,
      canvas: true,
      alignItems: "stretch",
      justifyContent: "flex-start",
    },
    React.createElement(
      Element as any,
      {
        is: Container as any,
        background: "#3a3a3f",
        paddingTop: 10,
        paddingBottom: 10,
        width: "100%",
        canvas: true,
        alignItems: "center",
        justifyContent: "center",
      },
      React.createElement(Text as any, {
        text: "Browse Categories",
        fontSize: 30,
        fontWeight: "700",
        color: "#ffffff",
      })
    ),
    React.createElement(
      Element as any,
      {
        is: Container as any,
        background: "#f1f1f1",
        paddingTop: 12,
        paddingBottom: 8,
        paddingLeft: 12,
        paddingRight: 12,
        canvas: true,
        alignItems: "stretch",
        justifyContent: "flex-start",
        gap: 10,
      },
      React.createElement(
        Element as any,
        { is: Row as any, canvas: true, gap: 12, flexWrap: "nowrap", alignItems: "stretch" },
        topCard(topCards[0].title, topCards[0].tag, getGeneratedImage(topCards[0].title, 0)),
        topCard(topCards[1].title, topCards[1].tag, getGeneratedImage(topCards[1].title, 1))
      ),
      React.createElement(
        Element as any,
        { is: Row as any, canvas: true, gap: 12, flexWrap: "nowrap", alignItems: "stretch" },
        smallCard(gridCards[0].title, getGeneratedImage(gridCards[0].title, 2)),
        smallCard(gridCards[1].title, getGeneratedImage(gridCards[1].title, 3)),
        smallCard(gridCards[2].title, getGeneratedImage(gridCards[2].title, 4)),
        smallCard(gridCards[3].title, getGeneratedImage(gridCards[3].title, 5))
      ),
      React.createElement(
        Element as any,
        { is: Row as any, canvas: true, gap: 12, flexWrap: "nowrap", alignItems: "stretch" },
        smallCard(gridCards[4].title, getGeneratedImage(gridCards[4].title, 6)),
        smallCard(gridCards[5].title, getGeneratedImage(gridCards[5].title, 7)),
        smallCard(gridCards[6].title, getGeneratedImage(gridCards[6].title, 8)),
        smallCard(gridCards[7].title, getGeneratedImage(gridCards[7].title, 9))
      ),
      React.createElement(
        Element as any,
        { is: Row as any, canvas: true, gap: 12, flexWrap: "nowrap", alignItems: "stretch" },
        smallCard(gridCards[8].title, getGeneratedImage(gridCards[8].title, 10)),
        smallCard(gridCards[9].title, getGeneratedImage(gridCards[9].title, 11)),
        smallCard(gridCards[10].title, getGeneratedImage(gridCards[10].title, 12)),
        smallCard(gridCards[11].title, getGeneratedImage(gridCards[11].title, 13))
      )
    )
  ),
  category: "card",
};
