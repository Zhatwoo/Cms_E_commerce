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

const THUMB_SIZE = "92px";
const MAIN_IMAGE_WIDTH = "min(100%, 520px)";

export const ProductDetailView: TemplateEntry = {
  label: "Product Detail View",
  description: "Modern product detail layout with image gallery and info panel.",
  preview: "PD Product Detail",
  category: "content",
  element: React.createElement(
    Element as any,
    {
      is: Section as any,
      canvas: true,
      background: "#F5F0EB",
      padding: 12,
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
        background: "#FFFFFF",
        width: "min(100%, 1320px)",
        gap: 16,
        paddingTop: 24,
        paddingBottom: 24,
        paddingLeft: 24,
        paddingRight: 24,
        alignItems: "stretch",
        justifyContent: "center",
        flexWrap: "wrap",
      },

      React.createElement(
        Element as any,
        {
          is: Column as any,
          canvas: true,
          background: "transparent",
          width: "min(100%, 520px)",
          alignItems: "center",
          justifyContent: "flex-start",
          padding: 0,
          gap: 14,
        },

      React.createElement(
        Element as any,
        {
          is: Container as any,
          canvas: true,
          background: "#1A1A1A",
          borderRadius: 2,
          paddingTop: 6,
          paddingBottom: 6,
          paddingLeft: 14,
          paddingRight: 14,
          alignSelf: "flex-start",
          width: "auto",
          height: "auto",
          gap: 0,
        },
        React.createElement(Text as any, {
          text: "NEW ARRIVAL",
          fontSize: 10,
          fontWeight: "500",
          color: "#F5F0EB",
          letterSpacing: 1.5,
        })
      ),

      React.createElement(Image as any, {
        src: "https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=600&q=80",
        alt: "Product Main",
        width: MAIN_IMAGE_WIDTH,
        height: "auto",
        objectFit: "cover",
        borderRadius: 4,
      }),

      React.createElement(
        Element as any,
        {
          is: Row as any,
          canvas: true,
          gap: 8,
          alignItems: "center",
          justifyContent: "center",
          background: "transparent",
          padding: 0,
          flexWrap: "wrap",
          width: "100%",
        },

        React.createElement(
          Element as any,
          {
            is: Container as any,
            canvas: true,
            background: "transparent",
            borderRadius: 4,
            borderWidth: 1,
            borderStyle: "solid",
            borderColor: "#D5CCC3",
            padding: 2,
            width: THUMB_SIZE,
            height: THUMB_SIZE,
            gap: 0,
          },
          React.createElement(Image as any, {
            src: "https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=200&q=80",
            alt: "Thumb 2",
            width: "100%",
            height: "100%",
            objectFit: "cover",
            borderRadius: 2,
          })
        ),
        React.createElement(
          Element as any,
          {
            is: Container as any,
            canvas: true,
            background: "transparent",
            borderRadius: 4,
            borderWidth: 1,
            borderStyle: "solid",
            borderColor: "#D5CCC3",
            padding: 2,
            width: THUMB_SIZE,
            height: THUMB_SIZE,
            gap: 0,
          },
          React.createElement(Image as any, {
            src: "https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=200&q=80",
            alt: "Thumb 3",
            width: "100%",
            height: "100%",
            objectFit: "cover",
            borderRadius: 2,
          })
        ),
        React.createElement(
          Element as any,
          {
            is: Container as any,
            canvas: true,
            background: "transparent",
            borderRadius: 4,
            borderWidth: 1,
            borderStyle: "solid",
            borderColor: "#D5CCC3",
            padding: 2,
            width: THUMB_SIZE,
            height: THUMB_SIZE,
            gap: 0,
          },
          React.createElement(Image as any, {
            src: "https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=200&q=80",
            alt: "Thumb 4",
            width: "100%",
            height: "100%",
            objectFit: "cover",
            borderRadius: 2,
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
        width: "min(100%, 560px)",
        alignItems: "flex-start",
        justifyContent: "flex-start",
        paddingLeft: 0,
        paddingRight: 0,
        paddingTop: 24,
        paddingBottom: 24,
        gap: 0,
      },

      React.createElement(Text as any, {
        text: "SKINCARE / SERUM",
        fontSize: 10,
        fontWeight: "500",
        color: "#A89F96",
        letterSpacing: 1.5,
        marginBottom: 10,
      }),

      React.createElement(Text as any, {
        text: "Luminous Glow Serum",
        fontSize: 30,
        fontWeight: "700",
        color: "#1A1A1A",
        lineHeight: 1.15,
        marginBottom: 10,
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
          marginBottom: 20,
          flexWrap: "wrap",
          width: "100%",
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
          ...Array.from({ length: 5 }, (_, index) =>
            React.createElement(Icon as any, {
              key: `p1-star-${index}`,
              iconType: "star",
              size: 13,
              color: "#C9A84C",
            })
          )
        ),
        React.createElement(Text as any, {
          text: "4.9",
          fontSize: 12,
          fontWeight: "700",
          color: "#1A1A1A",
        }),
        React.createElement(Text as any, {
          text: "12 Reviews - 6.2K Ratings",
          fontSize: 12,
          fontWeight: "400",
          color: "#A89F96",
        })
      ),

      React.createElement(
        Element as any,
        {
          is: Row as any,
          canvas: true,
          alignItems: "center",
          gap: 12,
          background: "#F5F0EB",
          borderRadius: 6,
          paddingLeft: 16,
          paddingRight: 16,
          paddingTop: 14,
          paddingBottom: 14,
          width: "100%",
          marginBottom: 18,
          flexWrap: "wrap",
          justifyContent: "flex-start",
        },
        React.createElement(Text as any, {
          text: "PHP 1,000 - PHP 1,500",
          fontSize: 24,
          fontWeight: "700",
          color: "#1A1A1A",
        }),
        React.createElement(Text as any, {
          text: "PHP 2,000 - PHP 3,500",
          fontSize: 12,
          fontWeight: "400",
          color: "#A89F96",
        }),
        React.createElement(
          Element as any,
          {
            is: Container as any,
            canvas: true,
            background: "#1A1A1A",
            borderRadius: 4,
            paddingTop: 6,
            paddingBottom: 6,
            paddingLeft: 14,
            paddingRight: 14,
            marginLeft: "auto",
            width: "auto",
            height: "auto",
            gap: 0,
          },
          React.createElement(Text as any, {
            text: "-51%",
            fontSize: 12,
            fontWeight: "700",
            color: "#F5F0EB",
            letterSpacing: 1,
          })
        )
      ),

      React.createElement(
        Element as any,
        {
          is: Row as any,
          canvas: true,
          alignItems: "flex-start",
          gap: 6,
          background: "transparent",
          padding: 0,
          marginBottom: 8,
          flexWrap: "wrap",
          width: "100%",
        },
        React.createElement(Icon as any, {
          iconType: "check",
          size: 14,
          color: "#6BA07A",
          marginTop: 2,
        }),
        React.createElement(Text as any, {
          text: "Free shipping - Arrives Feb 23-24. PHP 50 voucher if late.",
          fontSize: 12,
          fontWeight: "400",
          color: "#5A5550",
        })
      ),

      React.createElement(
        Element as any,
        {
          is: Row as any,
          canvas: true,
          alignItems: "flex-start",
          gap: 6,
          background: "transparent",
          padding: 0,
          marginBottom: 20,
          flexWrap: "wrap",
          width: "100%",
        },
        React.createElement(Icon as any, {
          iconType: "check",
          size: 14,
          color: "#6BA07A",
          marginTop: 2,
        }),
        React.createElement(Text as any, {
          text: "Free & Easy Returns - Merchandise Protection",
          fontSize: 12,
          fontWeight: "400",
          color: "#5A5550",
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
          marginBottom: 16,
          flexWrap: "wrap",
          width: "100%",
          justifyContent: "flex-start",
        },
        React.createElement(Text as any, {
          text: "Volume",
          fontSize: 12,
          fontWeight: "600",
          color: "#A89F96",
          letterSpacing: 1,
        }),
        React.createElement(Button as any, {
          label: "10 ml",
          backgroundColor: "#1A1A1A",
          textColor: "#F5F0EB",
          fontSize: 12,
          fontWeight: "500",
          paddingTop: 7,
          paddingBottom: 7,
          paddingLeft: 14,
          paddingRight: 14,
          borderRadius: 4,
          borderWidth: 2,
          borderStyle: "solid",
          borderColor: "#1A1A1A",
        }),
        React.createElement(Button as any, {
          label: "20 ml",
          backgroundColor: "transparent",
          textColor: "#1A1A1A",
          fontSize: 12,
          fontWeight: "500",
          paddingTop: 7,
          paddingBottom: 7,
          paddingLeft: 14,
          paddingRight: 14,
          borderRadius: 4,
          borderWidth: 1,
          borderStyle: "solid",
          borderColor: "#D5CCC3",
        }),
        React.createElement(Button as any, {
          label: "50 ml",
          backgroundColor: "transparent",
          textColor: "#1A1A1A",
          fontSize: 12,
          fontWeight: "500",
          paddingTop: 7,
          paddingBottom: 7,
          paddingLeft: 14,
          paddingRight: 14,
          borderRadius: 4,
          borderWidth: 1,
          borderStyle: "solid",
          borderColor: "#D5CCC3",
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
          marginBottom: 22,
          flexWrap: "wrap",
          width: "100%",
          justifyContent: "flex-start",
        },
        React.createElement(Text as any, {
          text: "Quantity",
          fontSize: 12,
          fontWeight: "600",
          color: "#A89F96",
          letterSpacing: 1,
          marginRight: 6,
        }),
        React.createElement(Button as any, {
          label: "-",
          backgroundColor: "transparent",
          textColor: "#1A1A1A",
          fontSize: 16,
          fontWeight: "300",
          width: "42px",
          height: "40px",
          paddingTop: 0,
          paddingBottom: 0,
          paddingLeft: 0,
          paddingRight: 0,
          borderRadius: 0,
          borderWidth: 1,
          borderStyle: "solid",
          borderColor: "#D5CCC3",
        }),
        React.createElement(
          Element as any,
          {
            is: Container as any,
            canvas: true,
            alignItems: "center",
            justifyContent: "center",
            background: "transparent",
            paddingLeft: 0,
            paddingRight: 0,
            paddingTop: 0,
            paddingBottom: 0,
            borderWidth: 1,
            borderStyle: "solid",
            borderColor: "#D5CCC3",
            width: "52px",
            height: "40px",
            gap: 0,
          },
          React.createElement(Text as any, {
            text: "1",
            fontSize: 13,
            fontWeight: "600",
            color: "#1A1A1A",
          })
        ),
        React.createElement(Button as any, {
          label: "+",
          backgroundColor: "transparent",
          textColor: "#1A1A1A",
          fontSize: 16,
          fontWeight: "300",
          width: "42px",
          height: "40px",
          paddingTop: 0,
          paddingBottom: 0,
          paddingLeft: 0,
          paddingRight: 0,
          borderRadius: 0,
          borderWidth: 1,
          borderStyle: "solid",
          borderColor: "#D5CCC3",
        })
      ),

      React.createElement(
        Element as any,
        {
          is: Row as any,
          canvas: true,
          gap: 12,
          background: "transparent",
          padding: 0,
          width: "100%",
          flexWrap: "wrap",
          alignItems: "stretch",
        },
        React.createElement(Button as any, {
          label: "Add To Cart",
          backgroundColor: "transparent",
          textColor: "#1A1A1A",
          fontSize: 13,
          fontWeight: "600",
          borderRadius: 4,
          paddingTop: 13,
          paddingBottom: 13,
          paddingLeft: 28,
          paddingRight: 28,
          borderWidth: 2,
          borderStyle: "solid",
          borderColor: "#1A1A1A",
          width: "min(100%, 260px)",
        }),
        React.createElement(Button as any, {
          label: "Buy Now",
          backgroundColor: "#1A1A1A",
          textColor: "#F5F0EB",
          fontSize: 13,
          fontWeight: "600",
          borderRadius: 4,
          paddingTop: 13,
          paddingBottom: 13,
          paddingLeft: 36,
          paddingRight: 36,
          width: "min(100%, 260px)",
        })
      )
    )
    )
  ),
};
