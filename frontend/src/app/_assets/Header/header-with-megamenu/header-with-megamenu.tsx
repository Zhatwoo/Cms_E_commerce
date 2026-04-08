"use client";

import React from "react";
import { Element } from "@craftjs/core";
import { Container } from "../../../design/_designComponents/Container/Container";
import { Text } from "../../../design/_designComponents/Text/Text";
import { Icon } from "../../../design/_designComponents/Icon/Icon";
import { Section } from "../../../design/_designComponents/Section/Section";
import { Row } from "../../../design/_designComponents/Row/Row";
import { Column } from "../../../design/_designComponents/Column/Column";
import { TemplateEntry } from "../../_types";

export const HeaderWithMegamenu: TemplateEntry = {
  label: "Header with Mega Menu",
  description: "Ecommerce header with utility bar, search, and categories nav",
  preview: "Mega",
  element: React.createElement(
    Element as any,
    { is: Section as any, background: "#6d756f", padding: 0, canvas: true },
    React.createElement(
      Element as any,
      {
        is: Container as any,
        background: "#f5f5f6",
        width: "100%",
        maxWidth: "1600px",
        padding: 0,
        canvas: true,
        height: "min-content",
      },
      React.createElement(
        Element as any,
        {
          is: Container as any,
          background: "#2e2e30",
          paddingTop: 6,
          paddingBottom: 6,
          paddingLeft: 10,
          paddingRight: 10,
          canvas: true,
          alignItems: "stretch",
          height: "min-content",
        },
        React.createElement(
          Element as any,
          { is: Row as any, canvas: true, justifyContent: "space-between", alignItems: "center", flexWrap: "nowrap", gap: 10 },
          React.createElement(
            Element as any,
            { is: Row as any, canvas: true, alignItems: "center", gap: 10, flexWrap: "nowrap" },
            React.createElement(Text as any, { text: "Download App", fontSize: 11, color: "#f3f4f6" }),
            React.createElement(Text as any, { text: "|", fontSize: 11, color: "#9ca3af" }),
            React.createElement(Text as any, { text: "Follow Us", fontSize: 11, color: "#f3f4f6" }),
            React.createElement(Text as any, { text: "f", fontSize: 11, color: "#f3f4f6" }),
            React.createElement(Text as any, { text: "o", fontSize: 11, color: "#f3f4f6" }),
            React.createElement(Text as any, { text: "x", fontSize: 11, color: "#f3f4f6" }),
            React.createElement(Text as any, { text: "t", fontSize: 11, color: "#f3f4f6" })
          ),
          React.createElement(
            Element as any,
            { is: Row as any, canvas: true, alignItems: "center", gap: 10, flexWrap: "nowrap" },
            React.createElement(Text as any, { text: "Notifications", fontSize: 11, color: "#f3f4f6" }),
            React.createElement(Text as any, { text: "|", fontSize: 11, color: "#9ca3af" }),
            React.createElement(Text as any, { text: "Help", fontSize: 11, color: "#f3f4f6" }),
            React.createElement(Text as any, { text: "|", fontSize: 11, color: "#9ca3af" }),
            React.createElement(Text as any, { text: "Sign up / Log in", fontSize: 11, color: "#f3f4f6" })
          )
        )
      ),
      React.createElement(
        Element as any,
        {
          is: Container as any,
          background: "#f5f5f6",
          paddingTop: 12,
          paddingBottom: 12,
          paddingLeft: 10,
          paddingRight: 10,
          canvas: true,
          alignItems: "stretch",
          height: "min-content",
        },
        React.createElement(
          Element as any,
          { is: Row as any, alignItems: "center", justifyContent: "space-between", canvas: true, gap: 12, flexWrap: "nowrap" },
          React.createElement(
            Element as any,
            { is: Row as any, canvas: true, alignItems: "center", gap: 10, flexWrap: "nowrap" },
            React.createElement(
              Element as any,
              {
                is: Container as any,
                width: "32px",
                height: "32px",
                background: "#111111",
                borderRadius: 4,
                padding: 0,
                canvas: true,
                alignItems: "center",
                justifyContent: "center",
              },
              React.createElement(Text as any, { text: "DEV", fontSize: 10, fontWeight: "700", color: "#ffffff" })
            ),
            React.createElement(Text as any, { text: "Placeholder Name", fontSize: 26, fontWeight: "700", color: "#111111" })
          ),
          React.createElement(
            Element as any,
            { is: Column as any, width: "52%", canvas: true, padding: 0, gap: 0 },
            React.createElement(
              Element as any,
              {
                is: Container as any,
                background: "#ececef",
                borderWidth: 1,
                borderColor: "#b8bcc4",
                borderStyle: "solid",
                borderRadius: 8,
                paddingTop: 8,
                paddingBottom: 8,
                paddingLeft: 14,
                paddingRight: 14,
                canvas: true,
                alignItems: "stretch",
                height: "44px",
              },
              React.createElement(
                Element as any,
                { is: Row as any, canvas: true, alignItems: "center", justifyContent: "space-between", flexWrap: "nowrap" },
                React.createElement(Text as any, { text: "Search...", fontSize: 14, color: "#6b7280", fontStyle: "italic" }),
                React.createElement(Icon as any, { iconType: "search", size: 20, color: "#6b7280" })
              )
            )
          ),
          React.createElement(
            Element as any,
            { is: Row as any, canvas: true, alignItems: "center", gap: 14, flexWrap: "nowrap" },
            React.createElement(Text as any, { text: "User", fontSize: 13, color: "#6b7280" }),
            React.createElement(Icon as any, { iconType: "heart", size: 18, color: "#6b7280" }),
            React.createElement(Text as any, { text: "Mail", fontSize: 13, color: "#6b7280" }),
            React.createElement(Icon as any, { iconType: "cart", size: 20, color: "#6b7280" })
          )
        )
      ),
      React.createElement(
        Element as any,
        {
          is: Container as any,
          background: "#f5f5f6",
          paddingTop: 8,
          paddingBottom: 10,
          paddingLeft: 10,
          paddingRight: 10,
          canvas: true,
          alignItems: "stretch",
          height: "min-content",
        },
        React.createElement(
          Element as any,
          { is: Row as any, alignItems: "center", justifyContent: "space-between", canvas: true, gap: 10, flexWrap: "nowrap" },
          React.createElement(
            Element as any,
            {
              is: Container as any,
              width: "28px",
              height: "28px",
              background: "#efefef",
              borderWidth: 1,
              borderColor: "#d1d5db",
              borderStyle: "solid",
              borderRadius: 99,
              padding: 0,
              canvas: true,
              alignItems: "center",
              justifyContent: "center",
            },
            React.createElement(Text as any, { text: "<", fontSize: 16, color: "#4b5563" })
          ),
          React.createElement(
            Element as any,
            { is: Row as any, alignItems: "center", gap: 24, canvas: true, flexWrap: "nowrap" },
            React.createElement(Text as any, { text: "All Categories", fontSize: 14, color: "#111111", fontWeight: "500" }),
            React.createElement(Text as any, { text: "New In", fontSize: 14, color: "#111111" }),
            React.createElement(Text as any, { text: "Sale", fontSize: 14, color: "#111111" }),
            React.createElement(Text as any, { text: "Women Clothing", fontSize: 14, color: "#111111" }),
            React.createElement(Text as any, { text: "Men Clothing", fontSize: 14, color: "#111111" }),
            React.createElement(Text as any, { text: "Kidswear", fontSize: 14, color: "#111111" }),
            React.createElement(Text as any, { text: "Beachwear", fontSize: 14, color: "#111111" }),
            React.createElement(Text as any, { text: "Shoes", fontSize: 14, color: "#111111" }),
            React.createElement(Text as any, { text: "Accessories", fontSize: 14, color: "#111111" }),
            React.createElement(Text as any, { text: "Underwear", fontSize: 14, color: "#111111" }),
            React.createElement(Text as any, { text: "Bags & Luggage", fontSize: 14, color: "#111111" })
          ),
          React.createElement(
            Element as any,
            {
              is: Container as any,
              width: "28px",
              height: "28px",
              background: "#efefef",
              borderWidth: 1,
              borderColor: "#d1d5db",
              borderStyle: "solid",
              borderRadius: 99,
              padding: 0,
              canvas: true,
              alignItems: "center",
              justifyContent: "center",
            },
            React.createElement(Text as any, { text: ">", fontSize: 16, color: "#4b5563" })
          )
        )
      )
    )
  ),
  category: "header",
};
