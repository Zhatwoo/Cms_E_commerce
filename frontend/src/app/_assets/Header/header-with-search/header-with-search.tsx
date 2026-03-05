/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React from "react";
import { Element } from "@craftjs/core";
import { Image } from "../../../design/_designComponents/Image/Image";
import { Text } from "../../../design/_designComponents/Text/Text";
import { Icon } from "../../../design/_designComponents/Icon/Icon";
import { Section } from "../../../design/_designComponents/Section/Section";
import { Row } from "../../../design/_designComponents/Row/Row";
import { TemplateEntry } from "../../_types";

export const HeaderWithSearch: TemplateEntry = {
  label: "Header with Search",
  description: "Minimal ecommerce navbar with logo, links, and utility icons",
  preview: "Search",
  element: React.createElement(
    Element as any,
    {
      is: Row as any,
      canvas: true,
      background: "#ffffff",
      width: "100%",
      paddingTop: 12,
      paddingBottom: 12,
      paddingLeft: 24,
      paddingRight: 24,
      justifyContent: "space-between",
      alignItems: "center",
      gap: 24,
    },
    React.createElement(
      Element as any,
      {
        is: Section as any,
        canvas: true,
        background: "transparent",
        width: "100%",
        padding: 0,
        minHeight: "auto",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
      },
      React.createElement(
        Element as any,
        {
          is: Row as any,
          canvas: true,
          background: "transparent",
          width: "100%",
          padding: 0,
          gap: 24,
          flexWrap: "nowrap",
          alignItems: "center",
          justifyContent: "space-between",
        },
        React.createElement(Image as any, {
          src: "",
          alt: "Header Logo",
          width: 100,
          height: 40,
          objectFit: "contain",
          allowUpload: true,
        }),
        React.createElement(
          Element as any,
          {
            is: Row as any,
            canvas: true,
            background: "transparent",
            width: "auto",
            padding: 0,
            gap: 32,
            flexWrap: "nowrap",
            alignItems: "center",
            justifyContent: "center",
          },
          React.createElement(Text as any, {
            text: "Shop",
            fontSize: 24,
            fontWeight: "500",
            color: "#111111",
          }),
          React.createElement(Text as any, {
            text: "Retailer",
            fontSize: 24,
            fontWeight: "500",
            color: "#111111",
          }),
          React.createElement(Text as any, {
            text: "Wholesale",
            fontSize: 24,
            fontWeight: "500",
            color: "#111111",
          }),
          React.createElement(Text as any, {
            text: "About",
            fontSize: 24,
            fontWeight: "500",
            color: "#111111",
          })
        ),
        React.createElement(
          Element as any,
          {
            is: Row as any,
            canvas: true,
            background: "transparent",
            width: "auto",
            padding: 0,
            gap: 24,
            flexWrap: "nowrap",
            alignItems: "center",
            justifyContent: "flex-end",
          },
          React.createElement(Icon as any, {
            iconType: "search",
            size: 24,
            color: "#111111",
          }),
          React.createElement(Icon as any, {
            iconType: "cart",
            size: 24,
            color: "#111111",
          })
        )
      )
    )
  ),
  category: "header",
};
