"use client";

import React from "react";
import { Element } from "@craftjs/core";
import { Container } from "../../../design/_designComponents/Container/Container";
import { Row } from "../../../design/_designComponents/Row/Row";
import { Column } from "../../../design/_designComponents/Column/Column";
import { Text } from "../../../design/_designComponents/Text/Text";
import { TemplateEntry } from "../../_types";

function footerLink(text: string, strong = false) {
  return React.createElement(Text as any, {
    text,
    fontSize: 11,
    color: strong ? "#161616" : "#404040",
    fontWeight: strong ? "600" : "400",
    marginBottom: 8,
    lineHeight: 1.25,
  });
}

function socialDot(text: string) {
  return React.createElement(
    Element as any,
    {
      is: Container as any,
      width: "30px",
      height: "30px",
      background: "#ffffff",
      borderWidth: 1,
      borderColor: "#d7d7dc",
      borderStyle: "solid",
      borderRadius: 999,
      padding: 0,
      canvas: true,
      alignItems: "center",
      justifyContent: "center",
    },
    React.createElement(Text as any, {
      text,
      fontSize: 11,
      color: "#1d1d1f",
      fontWeight: "600",
    })
  );
}

export const MarketplaceFooter: TemplateEntry = {
  label: "Simple Footer 3",
  description: "Bright commerce footer with newsletter, links, and app badges",
  preview: "Market",
  element: React.createElement(
    Element as any,
    {
      is: Container as any,
      width: "100%",
      background: "#f4f1e8",
      paddingTop: 0,
      paddingBottom: 0,
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
        width: "100%",
        background: "#fffdf7",
        paddingTop: 24,
        paddingBottom: 24,
        paddingLeft: 28,
        paddingRight: 28,
        canvas: true,
        alignItems: "stretch",
        justifyContent: "center",
      },
      React.createElement(
        Element as any,
        {
          is: Row as any,
          canvas: true,
          gap: 24,
          flexWrap: "nowrap",
          alignItems: "flex-start",
          justifyContent: "space-between",
        },
        React.createElement(
          Element as any,
          {
            is: Column as any,
            width: "31%",
            padding: 0,
            gap: 10,
            canvas: true,
            alignItems: "flex-start",
          },
          React.createElement(Text as any, {
            text: "Shop smarter with a footer that converts",
            fontSize: 26,
            color: "#161616",
            fontWeight: "700",
            lineHeight: 1.15,
          }),
          React.createElement(Text as any, {
            text: "Add trust, discovery, and support links without losing the clean storefront feel.",
            fontSize: 12,
            color: "#555555",
            lineHeight: 1.45,
          })
        ),
        React.createElement(
          Element as any,
          {
            is: Column as any,
            width: "18%",
            padding: 0,
            gap: 0,
            canvas: true,
            alignItems: "flex-start",
          },
          React.createElement(Text as any, {
            text: "Shop",
            fontSize: 12,
            color: "#161616",
            fontWeight: "700",
            marginBottom: 10,
          }),
          footerLink("New Arrivals", true),
          footerLink("Best Sellers"),
          footerLink("Bundles"),
          footerLink("Gift Cards"),
          footerLink("Sale")
        ),
        React.createElement(
          Element as any,
          {
            is: Column as any,
            width: "18%",
            padding: 0,
            gap: 0,
            canvas: true,
            alignItems: "flex-start",
          },
          React.createElement(Text as any, {
            text: "Support",
            fontSize: 12,
            color: "#161616",
            fontWeight: "700",
            marginBottom: 10,
          }),
          footerLink("Shipping"),
          footerLink("Returns"),
          footerLink("FAQs"),
          footerLink("Size Guide"),
          footerLink("Track Order")
        ),
        React.createElement(
          Element as any,
          {
            is: Column as any,
            width: "18%",
            padding: 0,
            gap: 0,
            canvas: true,
            alignItems: "flex-start",
          },
          React.createElement(Text as any, {
            text: "Company",
            fontSize: 12,
            color: "#161616",
            fontWeight: "700",
            marginBottom: 10,
          }),
          footerLink("About Us"),
          footerLink("Careers"),
          footerLink("Sustainability"),
          footerLink("Blog"),
          footerLink("Contact")
        )
      )
    ),
    React.createElement(
      Element as any,
      {
        is: Container as any,
        width: "100%",
        background: "#ebe7dc",
        paddingTop: 16,
        paddingBottom: 16,
        paddingLeft: 28,
        paddingRight: 28,
        canvas: true,
        alignItems: "stretch",
        justifyContent: "center",
      },
      React.createElement(
        Element as any,
        {
          is: Row as any,
          canvas: true,
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "nowrap",
          gap: 16,
        },
        React.createElement(Text as any, {
          text: "© 2026 Centric Store",
          fontSize: 15.8,
          color: "#5a5547",
          width: "209px",
        }),
        React.createElement(
          Element as any,
          {
            is: Row as any,
            canvas: true,
            alignItems: "center",
            justifyContent: "flex-end",
            flexWrap: "nowrap",
            gap: 8,
          },
          socialDot("X"),
          socialDot("IG"),
          socialDot("f")
        )
      )
    )
  ),
  category: "footer",
};
