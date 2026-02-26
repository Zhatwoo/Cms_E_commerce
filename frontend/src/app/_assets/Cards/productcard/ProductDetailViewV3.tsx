"use client";

import React from "react";
import { Element } from "@craftjs/core";
import { Container } from "../../../design/_designComponents/Container/Container";
import { Text } from "../../../design/_designComponents/Text/Text";
import { Button } from "../../../design/_designComponents/Button/Button";
import { Image } from "../../../design/_designComponents/Image/Image";
import { Icon } from "../../../design/_designComponents/Icon/Icon";
import { Section } from "../../../design/_designComponents/Section/Section";
import { Row } from "../../../design/_designComponents/Row/Row";
import { Column } from "../../../design/_designComponents/Column/Column";
import { TemplateEntry } from "../../_types";

const PRODUCT_IMG = "https://images.unsplash.com/photo-1503341455253-b2e723bb3dbb?auto=format&fit=crop&w=900&q=80";
const THUMB_IMG = "https://images.unsplash.com/photo-1503341455253-b2e723bb3dbb?auto=format&fit=crop&w=240&q=80";
const CARD_MAX_WIDTH = "min(100%, 1320px)";
const MEDIA_COLUMN_WIDTH = "min(100%, 520px)";
const DETAIL_COLUMN_WIDTH = "min(100%, 560px)";

function SizePill(label: string, active: boolean) {
  return React.createElement(Button as any, {
    label,
    backgroundColor: active ? "#101010" : "transparent",
    textColor: active ? "#ffffff" : "#101010",
    fontSize: 10,
    fontWeight: "600",
    paddingTop: 6,
    paddingBottom: 6,
    paddingLeft: 12,
    paddingRight: 12,
    borderRadius: 5,
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: active ? "#101010" : "#b8b8b8",
  });
}

export const ProductDetailViewV3: TemplateEntry = {
  label: "Product Detail View v3",
  description: "Compact product detail with framed image, size pills, and split CTA row.",
  preview: "PD Product v3",
  category: "content",
  element: React.createElement(
    Element as any,
    {
      is: Section as any,
      canvas: true,
      background: "#7F8B82",
      width: "100%",
      minHeight: "100vh",
      padding: 12,
      justifyContent: "center",
      alignItems: "center",
      flexDirection: "column",
    },
    React.createElement(
      Element as any,
      {
        is: Row as any,
        canvas: true,
        background: "#CCCCCC",
        width: CARD_MAX_WIDTH,
        paddingTop: 24,
        paddingBottom: 24,
        paddingLeft: 24,
        paddingRight: 24,
        gap: 16,
        flexWrap: "wrap",
        alignItems: "stretch",
        justifyContent: "center",
      },
      React.createElement(
        Element as any,
        {
          is: Column as any,
          canvas: true,
          background: "transparent",
          width: MEDIA_COLUMN_WIDTH,
          gap: 10,
          padding: 0,
          alignItems: "stretch",
        },
        React.createElement(
          Element as any,
          {
            is: Container as any,
            canvas: true,
            background: "transparent",
            borderWidth: 3,
            borderStyle: "solid",
            borderColor: "#238EEA",
            width: "100%",
            padding: 0,
            gap: 0,
          },
          React.createElement(Image as any, {
            src: PRODUCT_IMG,
            alt: "Product image",
            width: "100%",
            height: "auto",
            objectFit: "cover",
            borderRadius: 0,
          })
        ),
        React.createElement(
          Element as any,
          {
            is: Row as any,
            canvas: true,
            width: "100%",
            gap: 12,
            padding: 0,
            justifyContent: "flex-start",
            flexWrap: "wrap",
            alignItems: "center",
          },
          ...Array.from({ length: 3 }, (_, idx) =>
            React.createElement(
              Element as any,
              {
                key: `v3-thumb-${idx}`,
                is: Container as any,
                canvas: true,
            background: "#DFCFAF",
                width: "92px",
                height: "92px",
                padding: 0,
                borderRadius: 8,
                gap: 0,
              },
              React.createElement(Image as any, {
                src: THUMB_IMG,
                alt: `Thumb ${idx + 1}`,
                width: "100%",
                height: "100%",
                objectFit: "cover",
              })
            )
          )
        )
      ),
      React.createElement(
        Element as any,
        {
          is: Column as any,
          canvas: true,
          background: "transparent",
          width: DETAIL_COLUMN_WIDTH,
          paddingTop: 24,
          paddingBottom: 24,
          paddingLeft: 0,
          paddingRight: 0,
          gap: 12,
          alignItems: "flex-start",
        },
        React.createElement(Text as any, {
          text: "Product Name",
          fontSize: 28,
          fontWeight: "700",
          color: "#0d0d0d",
          lineHeight: 1.15,
        }),
        React.createElement(
          Element as any,
          {
            is: Row as any,
            canvas: true,
            alignItems: "center",
            gap: 5,
            background: "transparent",
            padding: 0,
            width: "100%",
            flexWrap: "wrap",
          },
          ...Array.from({ length: 5 }, (_, index) =>
            React.createElement(Icon as any, {
              key: `v3-star-${index}`,
              iconType: "star",
              size: 10,
              color: index < 4 ? "#F6CE3E" : "#B8B8B8",
            })
          ),
          React.createElement(Text as any, {
            text: "4.3 1.2k Total Reviews",
            fontSize: 11,
            fontWeight: "400",
            color: "#7b7b7b",
          })
        ),
        React.createElement(
          Element as any,
          {
            is: Row as any,
            canvas: true,
            alignItems: "center",
            gap: 8,
            background: "transparent",
            padding: 0,
            width: "100%",
            flexWrap: "wrap",
          },
          React.createElement(Text as any, {
            text: "\u20B1 250",
            fontSize: 28,
            fontWeight: "700",
            color: "#101010",
          })
        ),
        React.createElement(Text as any, {
          text: "Product Description",
          fontSize: 13,
          fontWeight: "700",
          color: "#101010",
          marginBottom: 4,
        }),
        React.createElement(Text as any, {
          text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.",
          fontSize: 12,
          fontWeight: "400",
          color: "#444444",
          lineHeight: 1.6,
        }),
        React.createElement(
          Element as any,
          {
            is: Row as any,
            canvas: true,
            width: "100%",
            justifyContent: "flex-start",
            alignItems: "center",
            gap: 14,
            padding: 0,
            flexWrap: "wrap",
          },
          React.createElement(
            Element as any,
            {
              is: Column as any,
              canvas: true,
              background: "transparent",
              gap: 8,
              padding: 0,
              width: "auto",
              alignItems: "flex-start",
            },
            React.createElement(Text as any, {
              text: "Sizes",
              fontSize: 11,
              fontWeight: "700",
              color: "#4f4f4f",
            }),
            React.createElement(
              Element as any,
              {
                is: Row as any,
                canvas: true,
                gap: 6,
                padding: 0,
                width: "auto",
                alignItems: "center",
                flexWrap: "wrap",
              },
              SizePill("Small", true),
              SizePill("Medium", false),
              SizePill("Large", false)
            )
          ),
          React.createElement(
            Element as any,
            {
              is: Column as any,
              canvas: true,
              background: "transparent",
              gap: 8,
              padding: 0,
              width: "auto",
              alignItems: "flex-start",
            },
            React.createElement(Text as any, {
              text: "Quantity",
              fontSize: 11,
              fontWeight: "700",
              color: "#4f4f4f",
            }),
            React.createElement(
              Element as any,
              {
                is: Row as any,
                canvas: true,
                gap: 0,
                padding: 0,
                width: "auto",
                alignItems: "center",
              },
              React.createElement(Button as any, {
                label: "-",
                backgroundColor: "transparent",
                textColor: "#181818",
                width: "38px",
                height: "38px",
                paddingTop: 0,
                paddingBottom: 0,
                paddingLeft: 0,
                paddingRight: 0,
                borderWidth: 1,
                borderStyle: "solid",
                borderColor: "#9e9e9e",
                borderRadius: 0,
                fontSize: 14,
              }),
              React.createElement(Button as any, {
                label: "0",
                backgroundColor: "transparent",
                textColor: "#181818",
                width: "38px",
                height: "38px",
                paddingTop: 0,
                paddingBottom: 0,
                paddingLeft: 0,
                paddingRight: 0,
                borderWidth: 1,
                borderStyle: "solid",
                borderColor: "#9e9e9e",
                borderRadius: 0,
                fontSize: 14,
                fontWeight: "700",
              }),
              React.createElement(Button as any, {
                label: "+",
                backgroundColor: "transparent",
                textColor: "#181818",
                width: "38px",
                height: "38px",
                paddingTop: 0,
                paddingBottom: 0,
                paddingLeft: 0,
                paddingRight: 0,
                borderWidth: 1,
                borderStyle: "solid",
                borderColor: "#9e9e9e",
                borderRadius: 0,
                fontSize: 14,
              })
            )
          )
        ),
        React.createElement(
          Element as any,
          {
            is: Row as any,
            canvas: true,
            width: "100%",
            gap: 14,
            alignItems: "center",
            justifyContent: "flex-start",
            paddingTop: 12,
            paddingBottom: 0,
            paddingLeft: 0,
            paddingRight: 0,
            flexWrap: "wrap",
          },
          React.createElement(Icon as any, {
            iconType: "heart",
            size: 20,
            color: "#111111",
          }),
          React.createElement(Button as any, {
            label: "Add To Cart",
            backgroundColor: "transparent",
            textColor: "#111111",
            borderWidth: 1,
            borderStyle: "solid",
            borderColor: "#111111",
            borderRadius: 8,
            paddingTop: 11,
            paddingBottom: 11,
            paddingLeft: 20,
            paddingRight: 20,
            fontSize: 13,
            fontWeight: "600",
            width: "min(100%, 220px)",
          }),
          React.createElement(Button as any, {
            label: "Buy Now",
            backgroundColor: "#111111",
            textColor: "#ffffff",
            borderWidth: 1,
            borderStyle: "solid",
            borderColor: "#111111",
            borderRadius: 8,
            paddingTop: 11,
            paddingBottom: 11,
            paddingLeft: 20,
            paddingRight: 20,
            fontSize: 13,
            fontWeight: "600",
            width: "min(100%, 220px)",
          })
        )
      )
    )
  ),
};
