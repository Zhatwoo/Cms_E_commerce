"use client";

import React from "react";
import { Element } from "@craftjs/core";
import { Container } from "../../../design/_designComponents/Container/Container";
import { Row } from "../../../design/_designComponents/Row/Row";
import { Column } from "../../../design/_designComponents/Column/Column";
import { Text } from "../../../design/_designComponents/Text/Text";
import { TemplateEntry } from "../../_types";

function footerLink(text: string) {
  return React.createElement(Text as any, {
    text,
    fontSize: 11,
    color: "#2f2f34",
    marginBottom: 8,
    lineHeight: 1.2,
  });
}

function socialGlyph(symbol: string) {
  return React.createElement(
    Element as any,
    {
      is: Container as any,
      width: "28px",
      height: "28px",
      background: "transparent",
      borderWidth: 0,
      borderRadius: 0,
      padding: 0,
      canvas: true,
      alignItems: "center",
      justifyContent: "center",
    },
    React.createElement(Text as any, {
      text: symbol,
      fontSize: 12,
      color: "#1b1b1d",
      fontWeight: "500",
    })
  );
}

export const SimpleFooter: TemplateEntry = {
  label: "Simple Footer",
  description: "Large clean footer with brand, links, and legal row",
  preview: "Simple",
  element: React.createElement(
    Element as any,
    {
      is: Container as any,
      width: "100%",
      background: "#d5d4df",
      paddingTop: 0,
      paddingBottom: 0,
      paddingLeft: 0,
      paddingRight: 0,
      canvas: true,
      alignItems: "center",
      justifyContent: "center",
    },
    React.createElement(
      Element as any,
      {
        is: Container as any,
        width: "100%",
        maxWidth: "100%",
        background: "#e3e3e6",
        borderWidth: 0,
        borderRadius: 0,
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
          background: "#e3e3e6",
          paddingTop: 18,
          paddingBottom: 14,
          paddingLeft: 32,
          paddingRight: 32,
          canvas: true,
          alignItems: "stretch",
          justifyContent: "flex-start",
        },
        React.createElement(
          Element as any,
          {
            is: Row as any,
            canvas: true,
            gap: 16,
            flexWrap: "nowrap",
            alignItems: "flex-start",
            justifyContent: "space-between",
          },
          React.createElement(
            Element as any,
            {
              is: Column as any,
              width: "26%",
              padding: 0,
              gap: 0,
              canvas: true,
              alignItems: "flex-start",
            },
            React.createElement(
              Element as any,
              {
                is: Row as any,
                canvas: true,
                gap: 16,
                flexWrap: "nowrap",
                alignItems: "center",
                justifyContent: "flex-start",
              },
              React.createElement(
                Element as any,
                {
                  is: Container as any,
                  width: "94px",
                  height: "94px",
                  background: "#2a2b31",
                  borderRadius: 0,
                  padding: 0,
                  canvas: true,
                  alignItems: "center",
                  justifyContent: "center",
                },
                React.createElement(Text as any, {
                  text: "Image",
                  fontSize: 28,
                  color: "#f2f2f3",
                  fontWeight: "500",
                })
              ),
              React.createElement(Text as any, {
                text: "Centric",
                fontSize: 11,
                color: "#1f1f24",
              })
            ),
            React.createElement(Text as any, {
              text: "Hassle Free Drag-Drop E-Commerce",
              fontSize: 11,
              color: "#2f2f34",
              marginTop: 18,
              marginBottom: 14,
            }),
            React.createElement(
              Element as any,
              {
                is: Row as any,
                canvas: true,
                gap: 8,
                flexWrap: "nowrap",
                alignItems: "center",
                justifyContent: "flex-start",
              },
              socialGlyph("X"),
              socialGlyph("◎"),
              socialGlyph("f")
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
              text: "Product",
              fontSize: 11,
              color: "#1f1f24",
              fontWeight: "600",
              marginBottom: 12,
            }),
            footerLink("Headless CMS New"),
            footerLink("Pricing"),
            footerLink("GraphQL APIs"),
            footerLink("Open source Starter-kit"),
            React.createElement(Text as any, { text: "Explore", fontSize: 11, color: "#2f2f34", fontWeight: "600", marginBottom: 8 }),
            footerLink("My feed"),
            footerLink("Case studies"),
            footerLink("Hashnode AI"),
            footerLink("Referral Program")
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
              fontSize: 11,
              color: "#1f1f24",
              fontWeight: "600",
              marginBottom: 12,
            }),
            footerLink("About Hashnode"),
            footerLink("Careers"),
            footerLink("Logos and media"),
            footerLink("Changelog"),
            footerLink("Feature Requests"),
            React.createElement(Text as any, { text: "Blogs", fontSize: 11, color: "#2f2f34", fontWeight: "600", marginBottom: 8 }),
            footerLink("Official Blog"),
            footerLink("Engineering Blog"),
            footerLink("Hashnode Townhall")
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
              text: "Partner with us",
              fontSize: 11,
              color: "#1f1f24",
              fontWeight: "600",
              marginBottom: 12,
            }),
            footerLink("Host a Hackathon"),
            React.createElement(Text as any, { text: "Support", fontSize: 11, color: "#2f2f34", fontWeight: "600", marginBottom: 8 }),
            footerLink("Support docs"),
            footerLink("Contact"),
            footerLink("Join discord")
          )
        )
      ),
      React.createElement(
        Element as any,
        {
          is: Container as any,
          width: "100%",
          height: "46px",
          background: "#dddde1",
          paddingLeft: 50,
          paddingRight: 40,
          paddingTop: 9,
          paddingBottom: 9,
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
          },
          React.createElement(
            Element as any,
            {
              is: Row as any,
              canvas: true,
              gap: 6,
              alignItems: "center",
              justifyContent: "flex-start",
              flexWrap: "nowrap",
            },
            React.createElement(Text as any, { text: "© 2026", fontSize: 9, color: "#4a4a4f" }),
            React.createElement(Text as any, { text: "Centric", fontSize: 9, color: "#4a4a4f" })
          ),
          React.createElement(
            Element as any,
            {
              is: Row as any,
              canvas: true,
              gap: 42,
              alignItems: "center",
              justifyContent: "flex-end",
              flexWrap: "nowrap",
            },
            React.createElement(Text as any, { text: "Privacy Policy", fontSize: 9, color: "#4a4a4f" }),
            React.createElement(Text as any, { text: "Terms", fontSize: 9, color: "#4a4a4f" }),
            React.createElement(Text as any, { text: "Code of Conduct", fontSize: 9, color: "#4a4a4f" })
          )
        )
      )
    )
  ),
  category: "footer",
};

