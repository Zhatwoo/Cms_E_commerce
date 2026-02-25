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

const PRODUCT_IMG = "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=800&q=80";
const THUMB_IMG = "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=200&q=80";
const RATING_STAR_COLOR = "#F5A623";
const RATING_STAR_COUNT = 5;

function Swatch(color: string, selected: boolean) {
  return React.createElement(Button as any, {
    label: "",
    backgroundColor: color,
    textColor: "transparent",
    fontSize: 0,
    fontWeight: "500",
    width: "28px",
    height: "28px",
    paddingTop: 0,
    paddingBottom: 0,
    paddingLeft: 0,
    paddingRight: 0,
    borderRadius: 999,
    borderWidth: selected ? 2 : 1,
    borderStyle: "solid",
    borderColor: selected ? "#111111" : "#8A8A8A",
    boxShadow: "0 1px 2px rgba(0,0,0,0.12)",
  });
}

function SizePill(label: string, active: boolean) {
  return React.createElement(Button as any, {
    label,
    backgroundColor: active ? "#1A1A1A" : "transparent",
    textColor: active ? "#FFFFFF" : "#1A1A1A",
    fontSize: 11,
    fontWeight: "500",
    paddingTop: 5,
    paddingBottom: 5,
    paddingLeft: 14,
    paddingRight: 14,
    borderRadius: 5,
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: active ? "#1A1A1A" : "#CCCCCC",
  });
}

export const ProductDetailViewV2: TemplateEntry = {
  label: "Product Detail View v2",
  description: "Clean card-style product detail with thumbnail strip, color swatches, size selector, and CTA bar.",
  preview: "??? Product v2",
  category: "content",
  element: React.createElement(
    Element as any,
    {
      is: Section as any,
      canvas: true,
      background: "#7A8C8A",
      padding: 10,
      width: "100%",
      minHeight: "100vh",
      flexDirection: "column",
      justifyContent: "center",
      alignItems: "center",
    },

    React.createElement(
      Element as any,
        {
          is: Row as any,
          canvas: true,
          background: "#EDEDED",
          borderRadius: 0,
          width: "min(100%, 1320px)",
          height: "auto",
        gap: 16,
        paddingTop: 24,
        paddingRight: 24,
        paddingBottom: 24,
        paddingLeft: 24,
        alignItems: "center",
        justifyContent: "center",
        flexWrap: "wrap",
        overflow: "hidden",
        boxShadow: "0 4px 24px rgba(0,0,0,0.12)",
      },

      React.createElement(
        Element as any,
        {
          is: Column as any,
          canvas: true,
          background: "transparent",
          width: "520px",
          alignItems: "center",
          justifyContent: "flex-start",
          padding: 0,
          gap: 10,
        },
        React.createElement(Image as any, {
          src: PRODUCT_IMG,
          alt: "Product Main",
          width: "100%",
          height: "auto",
          objectFit: "cover",
          borderRadius: 8,
        }),
        React.createElement(
          Element as any,
          {
            is: Row as any,
            canvas: true,
            background: "transparent",
            width: "100%",
            alignItems: "center",
            justifyContent: "flex-start",
            padding: 0,
            gap: 10,
            flexWrap: "nowrap",
            overflow: "auto",
          },
        React.createElement(
          Element as any,
          {
            is: Container as any,
            canvas: true,
            background: "#CCCCCC",
            borderRadius: 8,
            padding: 0,
            width: "92px",
            height: "92px",
            gap: 0,
            overflow: "hidden",
          },
          React.createElement(Image as any, {
            src: THUMB_IMG,
            alt: "Thumb 1",
            width: "100%",
            height: "100%",
            objectFit: "cover",
            borderRadius: 8,
          })
        ),
        React.createElement(
          Element as any,
          {
            is: Container as any,
            canvas: true,
            background: "#CCCCCC",
            borderRadius: 8,
            padding: 0,
            width: "92px",
            height: "92px",
            gap: 0,
            overflow: "hidden",
          },
          React.createElement(Image as any, {
            src: THUMB_IMG,
            alt: "Thumb 2",
            width: "100%",
            height: "100%",
            objectFit: "cover",
            borderRadius: 8,
          })
        ),
        React.createElement(
          Element as any,
          {
            is: Container as any,
            canvas: true,
            background: "#CCCCCC",
            borderRadius: 8,
            padding: 0,
            width: "92px",
            height: "92px",
            gap: 0,
            overflow: "hidden",
          },
          React.createElement(Image as any, {
            src: THUMB_IMG,
            alt: "Thumb 3",
            width: "100%",
            height: "100%",
            objectFit: "cover",
            borderRadius: 8,
          })
        )
      )
      ),

      React.createElement(
        Element as any,
        {
          is: Column as any,
          canvas: true,
          background: "transparent",
          width: "560px",
          alignItems: "flex-start",
          justifyContent: "flex-start",
          padding: 24,
          gap: 12,
        },

        React.createElement(Text as any, {
          text: "Product Name",
          fontSize: 28,
          fontWeight: "700",
          color: "#111111",
          lineHeight: 1.15,
        }),

        React.createElement(
          Element as any,
          {
            is: Row as any,
            canvas: true,
            alignItems: "center",
            gap: 6,
            background: "transparent",
            padding: 0,
   width: "auto",
          },
          React.createElement(
            Element as any,
            {
              is: Row as any,
              canvas: true,
              alignItems: "center",
              gap: 2,
              background: "transparent",
              padding: 0,
              width: "auto",
            },
            ...Array.from({ length: RATING_STAR_COUNT }, (_, index) =>
              React.createElement(Icon as any, {
                key: `rating-star-${index}`,
                iconType: "star",
                size: 14,
                color: RATING_STAR_COLOR,
              })
            )
          ),
          React.createElement(Text as any, {
            text: "1.2k Total Reviews",
            fontSize: 12,
            fontWeight: "400",
            color: "#888888",
          })
        ),
        
        React.createElement(
          Element as any,
          {
            is: Row as any,
            canvas: true,
            alignItems: "center",
            gap: 4,
            background: "transparent",
            padding: 0,
            flexWrap: "wrap",
            width: "auto",
          },
          React.createElement(Text as any, {
            text: "\u20B1",
            fontSize: 28,
            fontWeight: "700",
            color: "#111111",
          }),
          React.createElement(Text as any, {
            text: "250",
            fontSize: 28,
            fontWeight: "700",
            color: "#111111",
          })
        ),

        React.createElement(Text as any, {
          text: "Product Description",
          fontSize: 13,
          fontWeight: "700",
          color: "#111111",
        }),

        React.createElement(Text as any, {
          text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.",
          fontSize: 12,
          fontWeight: "400",
          color: "#555555",
          lineHeight: 1.6,
        }),

        React.createElement(
          Element as any,
          {
            is: Row as any,
            canvas: true,
            alignItems: "center",
            justifyContent: "flex-start",
            gap: 14,
            background: "transparent",
            padding: 0,
            flexWrap: "wrap",
            width: "100%",
          },

          React.createElement(
            Element as any,
            {
              is: Row as any,
              canvas: true,
              alignItems: "center",
              gap: 8,
              background: "transparent",
              padding: 0,
              flexWrap: "wrap",
              width: "auto",
            },
            React.createElement(Text as any, {
              text: "Color",
              fontSize: 12,
              fontWeight: "600",
              color: "#111111",
            }),
            Swatch("#ADADAD", false),
            Swatch("#717171", false),
            Swatch("#3A3A3A", false)
          ),

          React.createElement(
            Element as any,
            {
              is: Row as any,
              canvas: true,
              alignItems: "center",
              gap: 6,
              background: "transparent",
              padding: 0,
              flexWrap: "wrap",
              width: "auto",
            },
            React.createElement(Text as any, {
              text: "Sizes",
              fontSize: 12,
              fontWeight: "600",
              color: "#111111",
            }),
            SizePill("Small", true),
            SizePill("Medium", false),
            SizePill("Large", false)
          )
        ),

        React.createElement(
          Element as any,
          {
            is: Row as any,
            canvas: true,
            alignItems: "center",
            gap: 10,
            background: "transparent",
            padding: 0,
            flexWrap: "wrap",
            width: "auto",
          },
          React.createElement(Text as any, {
            text: "Quantity",
            fontSize: 12,
            fontWeight: "600",
            color: "#666666",
          }),
          React.createElement(Button as any, {
            label: "-",
            backgroundColor: "transparent",
            textColor: "#333333",
            fontSize: 14,
            fontWeight: "500",
            paddingTop: 10,
            paddingBottom: 10,
            paddingLeft: 14,
            paddingRight: 14,
            borderRadius: 0,
            borderWidth: 1,
            borderStyle: "solid",
            borderColor: "#BFBFBF",
          }),
          React.createElement(
            Element as any,
            {
              is: Container as any,
              canvas: true,
              alignItems: "center",
              justifyContent: "center",
              background: "#FFFFFF",
              padding: 0,
              borderWidth: 1,
              borderStyle: "solid",
              borderColor: "#BFBFBF",
              width: "38px",
              height: "38px",
              gap: 0,
            },
            React.createElement(Text as any, {
              text: "1",
              fontSize: 14,
              fontWeight: "600",
              color: "#111111",
            })
          ),
          React.createElement(Button as any, {
            label: "+",
            backgroundColor: "transparent",
            textColor: "#333333",
            fontSize: 14,
            fontWeight: "500",
            paddingTop: 10,
            paddingBottom: 10,
            paddingLeft: 14,
            paddingRight: 14,
            borderRadius: 0,
            borderWidth: 1,
            borderStyle: "solid",
            borderColor: "#3B82F6",
          })
        ),

        React.createElement(
          Element as any,
          {
            is: Row as any,
            canvas: true,
            alignItems: "center",
            gap: 10,
            background: "transparent",
            padding: 0,
            width: "100%",
            flexWrap: "wrap",
            justifyContent: "flex-start",
          },
          React.createElement(Button as any, {
            label: "Add To Cart",
            backgroundColor: "#FFFFFF",
            textColor: "#111111",
            fontSize: 13,
            fontWeight: "600",
            paddingTop: 11,
            paddingBottom: 11,
            paddingLeft: 20,
            paddingRight: 20,
            borderRadius: 8,
            borderWidth: 1,
            borderStyle: "solid",
            borderColor: "#1A1A1A",
            width: "100%",
          }),
          React.createElement(Button as any, {
            label: "Buy Now",
            backgroundColor: "#1A1A1A",
            textColor: "#FFFFFF",
            fontSize: 13,
            fontWeight: "600",
            paddingTop: 11,
            paddingBottom: 11,
            paddingLeft: 20,
            paddingRight: 20,
            borderRadius: 8,
            borderWidth: 0,
            borderStyle: "solid",
            borderColor: "transparent",
            width: "100%",
          })
        )
      )
    )
  ),
};
