"use client";

import React from "react";
import { Element } from "@craftjs/core";
import { Container } from "../../../design/_designComponents/Container/Container";
import { Row } from "../../../design/_designComponents/Row/Row";
import { Column } from "../../../design/_designComponents/Column/Column";
import { Text } from "../../../design/_designComponents/Text/Text";
import { TemplateEntry } from "../../_types";

function link(text: string) {
  return React.createElement(Text as any, {
    text,
    fontSize: 12,
    color: "#cfc8ea",
    marginBottom: 8,
    lineHeight: 1.3,
  });
}

function ctaPill(text: string, primary = false) {
  return React.createElement(
    Element as any,
    {
      is: Container as any,
      background: primary ? "#ffcc00" : "transparent",
      borderWidth: 1,
      borderColor: primary ? "#ffcc00" : "#68539f",
      borderStyle: "solid",
      borderRadius: 999,
      paddingTop: 8,
      paddingBottom: 8,
      paddingLeft: 16,
      paddingRight: 16,
      width: "107px",
      height: "39px",
      marginTop: primary ? 33 : 35,
      marginLeft: primary ? 53 : 36,
      canvas: true,
      alignItems: "center",
      justifyContent: "center",
    },
    React.createElement(Text as any, {
      text,
      fontSize: 11,
      color: primary ? "#15093e" : "#f3efff",
      fontWeight: "600",
    })
  );
}

export const DarkCommerceFooter: TemplateEntry = {
  label: "Simple Footer 4",
  description: "Dark premium footer for ecommerce and conversion-focused layouts",
  preview: "Dark",
  element: React.createElement(
    Element as any,
    {
      is: Container as any,
      width: "100%",
      background: "#15093E",
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
        background: "#1b0d4f",
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
          alignItems: "flex-start",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 24,
        },
        React.createElement(
          Element as any,
          {
            is: Column as any,
            width: "32%",
            padding: 0,
            gap: 10,
            canvas: true,
            alignItems: "flex-start",
          },
          React.createElement(Text as any, {
            text: "Scale your store with a footer built to convert",
            fontSize: 28,
            color: "#ffffff",
            fontWeight: "700",
            lineHeight: 1.15,
          }),
          React.createElement(Text as any, {
            text: "Use curated links, trust markers, and a clean CTA to keep shoppers moving.",
            fontSize: 12,
            color: "#d8d0f4",
            lineHeight: 1.45,
          }),
          React.createElement(
            Element as any,
            {
              is: Row as any,
              canvas: true,
              alignItems: "center",
              justifyContent: "flex-start",
              flexWrap: "wrap",
              gap: 10,
            },
            ctaPill("Get Started", true),
            ctaPill("View Catalog")
          )
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
            text: "Products",
            fontSize: 12,
            color: "#ffffff",
            fontWeight: "700",
            marginBottom: 10,
          }),
          link("New Drops"),
          link("Collections"),
          link("Bundles"),
          link("Gift Cards"),
          link("Best Sellers")
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
            text: "Service",
            fontSize: 12,
            color: "#ffffff",
            fontWeight: "700",
            marginBottom: 10,
          }),
          link("Shipping"),
          link("Returns"),
          link("Support"),
          link("Order Tracking"),
          link("Warranty")
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
            text: "About",
            fontSize: 12,
            color: "#ffffff",
            fontWeight: "700",
            marginBottom: 10,
          }),
          link("Our Story"),
          link("Careers"),
          link("Press"),
          link("Contact"),
          link("Partners")
        )
      )
    ),
    React.createElement(
      Element as any,
      {
        is: Container as any,
        width: "100%",
        background: "#12073a",
        paddingTop: 12,
        paddingBottom: 12,
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
          flexWrap: "wrap",
        },
        React.createElement(Text as any, {
          text: "© 2026 CMS Commerce",
          fontSize: 11.1,
          color: "#b9acdf",
        }),
        React.createElement(
          Element as any,
          {
            is: Row as any,
            canvas: true,
            alignItems: "center",
            justifyContent: "flex-end",
            flexWrap: "wrap",
            gap: 18,
          },
          React.createElement(Text as any, { text: "Privacy", fontSize: 11, color: "#b9acdf" }),
          React.createElement(Text as any, { text: "Terms", fontSize: 11, color: "#b9acdf" }),
          React.createElement(Text as any, { text: "Cookies", fontSize: 11, color: "#b9acdf" })
        )
      )
    )
  ),
  category: "footer",
};
