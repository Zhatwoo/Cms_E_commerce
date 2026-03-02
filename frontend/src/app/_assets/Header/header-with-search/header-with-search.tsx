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

export const HeaderWithSearch: TemplateEntry = {
  label: "Header with Search",
  description: "Minimal ecommerce navbar with logo, links, and utility icons",
  preview: "Search",
  element: React.createElement(
    Element as any,
    { is: Section as any, background: "#66706b", paddingTop: 10, paddingBottom: 10, paddingLeft: 8, paddingRight: 8, canvas: true },
    React.createElement(
      Element as any,
      {
        is: Container as any,
        background: "#ffffff",
        borderRadius: 2,
        width: "100%",
        maxWidth: "1500px",
        paddingTop: 12,
        paddingBottom: 12,
        paddingLeft: 24,
        paddingRight: 24,
        canvas: true,
      },
      React.createElement(
        Element as any,
        {
          is: Row as any,
          canvas: true,
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 12,
        },
        React.createElement(
          Element as any,
          { is: Column as any, width: "clamp(120px, 16%, 180px)", padding: 0, gap: 0, canvas: true, alignItems: "flex-start" },
          React.createElement(Text as any, {
            text: "Sass",
            fontSize: 48,
            fontWeight: "700",
            fontFamily: "cursive",
            color: "#111111",
            lineHeight: 0.9,
          })
        ),
        React.createElement(
          Element as any,
          { is: Column as any, width: "clamp(420px, 58%, 760px)", padding: 0, gap: 0, canvas: true },
          React.createElement(
            Element as any,
            { is: Row as any, canvas: true, alignItems: "center", justifyContent: "flex-start", gap: 26, flexWrap: "nowrap" },
            React.createElement(Text as any, { text: "Shop", fontSize: 36, color: "#111111", fontWeight: "500" }),
            React.createElement(Text as any, { text: "Retailer", fontSize: 36, color: "#111111", fontWeight: "500" }),
            React.createElement(Text as any, { text: "Wholesale", fontSize: 36, color: "#111111", fontWeight: "500" }),
            React.createElement(Text as any, { text: "About", fontSize: 36, color: "#111111", fontWeight: "500" })
          )
        ),
        React.createElement(
          Element as any,
          { is: Column as any, width: "clamp(150px, 18%, 240px)", padding: 0, gap: 0, canvas: true, alignItems: "flex-end" },
          React.createElement(
            Element as any,
            { is: Row as any, canvas: true, alignItems: "center", justifyContent: "flex-end", gap: 18, flexWrap: "nowrap" },
            React.createElement(Icon as any, { iconType: "search", size: 28, color: "#111111" }),
            React.createElement(Icon as any, { iconType: "cart", size: 28, color: "#111111" }),
            React.createElement(Text as any, { text: "Mail", fontSize: 18, color: "#111111", fontWeight: "600" })
          )
        )
      )
    )
  ),
  category: "header",
};
