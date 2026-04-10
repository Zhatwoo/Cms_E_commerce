"use client";

import React from "react";
import { Element } from "@craftjs/core";
import { Container } from "../../../design/_designComponents/Container/Container";
import { Row } from "../../../design/_designComponents/Row/Row";
import { Column } from "../../../design/_designComponents/Column/Column";
import { Text } from "../../../design/_designComponents/Text/Text";
import { Image } from "../../../design/_designComponents/Image/Image";
import { TemplateEntry } from "../../_types";

function linkLine(text: string) {
  return React.createElement(Text as any, {
    text,
    fontSize: 13,
    color: "#2b2b2b",
    marginBottom: 7,
  });
}

function appBadge(label: string) {
  return React.createElement(
    Element as any,
    {
      is: Container as any,
      background: "#f6f6f6",
      borderWidth: 1,
      borderColor: "#d1d1d1",
      borderStyle: "solid",
      borderRadius: 4,
      paddingTop: 6,
      paddingBottom: 6,
      paddingLeft: 8,
      paddingRight: 8,
      width: "100%",
      canvas: true,
      alignItems: "flex-start",
      justifyContent: "center",
    },
    React.createElement(Text as any, {
      text: label,
      fontSize: 11,
      color: "#1f1f1f",
    })
  );
}

function logoPill(text: string) {
  return React.createElement(
    Element as any,
    {
      is: Container as any,
      background: "#f4f4f4",
      borderWidth: 1,
      borderColor: "#d7d7d7",
      borderStyle: "solid",
      borderRadius: 4,
      paddingTop: 6,
      paddingBottom: 6,
      paddingLeft: 10,
      paddingRight: 10,
      width: "auto",
      canvas: true,
      alignItems: "center",
      justifyContent: "center",
    },
    React.createElement(Text as any, {
      text,
      fontSize: 11,
      color: "#1f1f1f",
      fontWeight: "600",
    })
  );
}

export const MultiColumnFooter: TemplateEntry = {
  label: "Multi Column Footer",
  description: "Detailed ecommerce footer with subscribe row and app section",
  preview: "Footer",
  element: React.createElement(
    Element as any,
    {
      is: Container as any,
      background: "#e4e4e4",
      width: "100%",
      padding: 0,
      canvas: true,
      alignItems: "stretch",
      justifyContent: "flex-start",
    },
    React.createElement(
      Element as any,
      {
        is: Container as any,
        maxWidth: "1280px",
        width: "100%",
        background: "#e4e4e4",
        padding: 0,
        canvas: true,
        alignItems: "stretch",
        justifyContent: "flex-start",
      },
      React.createElement(
        Element as any,
        {
          is: Container as any,
          background: "#e4e4e4",
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
          { is: Row as any, canvas: true, gap: 18, flexWrap: "wrap", alignItems: "center" },
          React.createElement(
            Element as any,
            { is: Column as any, width: "16%", padding: 0, gap: 0, canvas: true, alignItems: "flex-start" },
            React.createElement(Text as any, { text: "Subscribe", fontSize: 32, fontWeight: "700", color: "#151515" })
          ),
          React.createElement(
            Element as any,
            { is: Column as any, width: "50%", padding: 0, gap: 0, canvas: true, alignItems: "flex-start" },
            React.createElement(Text as any, {
              text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.",
              fontSize: 10,
              color: "#3a3a3a",
              lineHeight: 1.4,
            })
          ),
          React.createElement(
            Element as any,
            { is: Column as any, width: "34%", padding: 0, gap: 0, canvas: true, alignItems: "stretch" },
            React.createElement(
              Element as any,
              {
                is: Container as any,
                background: "#ececec",
                borderWidth: 1,
                borderColor: "#bebebe",
                borderStyle: "solid",
                borderRadius: 6,
                paddingTop: 7,
                paddingBottom: 7,
                paddingLeft: 12,
                paddingRight: 12,
                canvas: true,
                alignItems: "stretch",
                justifyContent: "center",
              },
              React.createElement(
                Element as any,
                { is: Row as any, canvas: true, justifyContent: "space-between", alignItems: "center", flexWrap: "wrap" },
                React.createElement(Text as any, { text: "Email", fontSize: 12, color: "#949494" }),
                React.createElement(Text as any, { text: ">", fontSize: 14, color: "#949494" })
              )
            )
          )
        )
      ),
      React.createElement(
        Element as any,
        {
          is: Container as any,
          background: "#b8b8b8",
          height: "1px",
          width: "100%",
          padding: 0,
          canvas: true,
        }
      ),
      React.createElement(
        Element as any,
        {
          is: Container as any,
          background: "#e4e4e4",
          paddingTop: 24,
          paddingBottom: 22,
          paddingLeft: 28,
          paddingRight: 28,
          canvas: true,
          alignItems: "stretch",
          justifyContent: "flex-start",
        },
        React.createElement(
          Element as any,
          { is: Row as any, canvas: true, gap: 18, flexWrap: "wrap", alignItems: "flex-start" },
          React.createElement(
            Element as any,
            { is: Column as any, width: "36%", padding: 0, gap: 8, canvas: true, alignItems: "flex-start" },
            React.createElement(
              Element as any,
              { is: Row as any, canvas: true, gap: 8, alignItems: "center", flexWrap: "wrap" },
              React.createElement(
                Element as any,
                {
                  is: Container as any,
                  background: "#111111",
                  borderRadius: 4,
                  width: "20px",
                  height: "20px",
                  padding: 0,
                  canvas: true,
                  alignItems: "center",
                  justifyContent: "center",
                },
                React.createElement(Text as any, { text: "DEV", fontSize: 8, color: "#ffffff", fontWeight: "700" })
              ),
              React.createElement(Text as any, { text: "Placeholder Name", fontSize: 40, fontWeight: "700", color: "#111111" })
            ),
            React.createElement(Text as any, { text: "Company Slogan Here", fontSize: 13, color: "#f59e0b", fontWeight: "600", marginBottom: 18 }),
            React.createElement(Text as any, { text: "About Us", fontSize: 34, color: "#111111", fontWeight: "700", marginBottom: 2 }),
            React.createElement(Text as any, {
              text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.",
              fontSize: 10,
              color: "#3a3a3a",
              lineHeight: 1.45,
            })
          ),
          React.createElement(
            Element as any,
            { is: Column as any, width: "14%", padding: 0, gap: 4, canvas: true, alignItems: "flex-start" },
            React.createElement(Text as any, { text: "Services", fontSize: 30, color: "#111111", fontWeight: "700", marginBottom: 6 }),
            linkLine("- Logo"),
            linkLine("- Web Design"),
            linkLine("- Branding"),
            linkLine("- Marketing"),
            linkLine("- User Testing")
          ),
          React.createElement(
            Element as any,
            { is: Column as any, width: "14%", padding: 0, gap: 4, canvas: true, alignItems: "flex-start" },
            React.createElement(Text as any, { text: "Company", fontSize: 30, color: "#111111", fontWeight: "700", marginBottom: 6 }),
            linkLine("- Who We Are"),
            linkLine("- Our Clients"),
            linkLine("- Mission & Vision"),
            linkLine("- Careers"),
            linkLine("- Partners")
          ),
          React.createElement(
            Element as any,
            { is: Column as any, width: "12%", padding: 0, gap: 4, canvas: true, alignItems: "flex-start" },
            React.createElement(Text as any, { text: "Contact Us", fontSize: 30, color: "#111111", fontWeight: "700", marginBottom: 6 }),
            React.createElement(Text as any, { text: "Call:", fontSize: 12, color: "#2b2b2b", marginBottom: 2 }),
            React.createElement(Text as any, { text: "+0123 456 789", fontSize: 11, color: "#4b4b4b", marginBottom: 8 }),
            React.createElement(Text as any, { text: "Email:", fontSize: 12, color: "#2b2b2b", marginBottom: 2 }),
            React.createElement(Text as any, { text: "name@gmail.com", fontSize: 11, color: "#4b4b4b" })
          ),
          React.createElement(
            Element as any,
            { is: Column as any, width: "24%", padding: 0, gap: 8, canvas: true, alignItems: "flex-start" },
            React.createElement(
              Element as any,
              { is: Row as any, canvas: true, gap: 10, alignItems: "flex-start", flexWrap: "wrap" },
              React.createElement(
                Element as any,
                {
                  is: Container as any,
                  width: "96px",
                  height: "96px",
                  background: "#ffffff",
                  borderWidth: 1,
                  borderColor: "#bfbfbf",
                  borderStyle: "solid",
                  borderRadius: 4,
                  padding: 2,
                  canvas: true,
                },
                React.createElement(Element as any, {
                  is: Image as any,
                  src: "https://upload.wikimedia.org/wikipedia/commons/d/d0/QR_code_for_mobile_English_Wikipedia.svg",
                  alt: "QR Code",
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  borderRadius: 2,
                })
              ),
              React.createElement(
                Element as any,
                { is: Column as any, width: "58%", padding: 0, gap: 6, canvas: true, alignItems: "stretch" },
                appBadge("App Store / Mac"),
                appBadge("Google Play"),
                appBadge("Windows"),
                appBadge("App Gallery")
              )
            ),
            React.createElement(Text as any, { text: "Download our App", fontSize: 28, fontWeight: "700", color: "#111111", marginTop: 2 }),
            React.createElement(Text as any, { text: "f  i  x  d", fontSize: 14, color: "#111111", marginTop: 6 }),
            React.createElement(Text as any, { text: "Follow Us", fontSize: 34, fontWeight: "700", color: "#111111", marginTop: -2 })
          )
        ),
        React.createElement(
          Element as any,
          { is: Row as any, canvas: true, gap: 18, flexWrap: "wrap", alignItems: "flex-start", marginTop: 14 },
          React.createElement(Element as any, { is: Column as any, width: "36%", padding: 0, gap: 0, canvas: true }),
          React.createElement(
            Element as any,
            { is: Column as any, width: "22%", padding: 0, gap: 8, canvas: true, alignItems: "flex-start" },
            React.createElement(Text as any, { text: "Payment", fontSize: 30, fontWeight: "700", color: "#111111" }),
            React.createElement(
              Element as any,
              { is: Row as any, canvas: true, gap: 8, flexWrap: "wrap", alignItems: "center" },
              logoPill("GCash"),
              logoPill("MariBank"),
              logoPill("mastercard"),
              logoPill("VISA"),
              logoPill("BPI"),
              logoPill("maya")
            )
          ),
          React.createElement(
            Element as any,
            { is: Column as any, width: "18%", padding: 0, gap: 8, canvas: true, alignItems: "flex-start" },
            React.createElement(Text as any, { text: "Logistics", fontSize: 30, fontWeight: "700", color: "#111111" }),
            React.createElement(
              Element as any,
              { is: Row as any, canvas: true, gap: 8, flexWrap: "wrap", alignItems: "center" },
              logoPill("J&T Express"),
              logoPill("ninjavan"),
              logoPill("2GO")
            )
          ),
          React.createElement(Element as any, { is: Column as any, width: "24%", padding: 0, gap: 0, canvas: true })
        )
      ),
      React.createElement(
        Element as any,
        {
          is: Container as any,
          background: "#2f3035",
          paddingTop: 9,
          paddingBottom: 9,
          paddingLeft: 28,
          paddingRight: 28,
          canvas: true,
          alignItems: "stretch",
          justifyContent: "center",
        },
        React.createElement(
          Element as any,
          { is: Row as any, canvas: true, justifyContent: "space-between", alignItems: "center", flexWrap: "wrap" },
          React.createElement(
            Element as any,
            { is: Row as any, canvas: true, gap: 0, alignItems: "center", flexWrap: "wrap" },
            React.createElement(Text as any, { text: "Privacy Policy", fontSize: 10, color: "#e5e5e5" }),
            React.createElement(Text as any, { text: "|", fontSize: 10, color: "#8f8f8f", marginLeft: 12, marginRight: 12 }),
            React.createElement(Text as any, { text: "Our History", fontSize: 10, color: "#e5e5e5" }),
            React.createElement(Text as any, { text: "|", fontSize: 10, color: "#8f8f8f", marginLeft: 12, marginRight: 12 }),
            React.createElement(Text as any, { text: "What we do", fontSize: 10, color: "#e5e5e5" })
          ),
          React.createElement(Text as any, { text: "(c) 2026 Name. All Rights Reserved", fontSize: 10, color: "#e5e5e5" })
        )
      )
    )
  ),
  category: "footer",
};
