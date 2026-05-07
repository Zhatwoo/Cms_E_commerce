"use client";

import React from "react";
import { Element } from "@craftjs/core";
import { Text } from "../../../design/_designComponents/Text/Text";
import { Icon } from "../../../design/_designComponents/Icon/Icon";
import { Row } from "../../../design/_designComponents/Row/Row";
import { Column } from "../../../design/_designComponents/Column/Column";
import { Image } from "../../../design/_designComponents/Image/Image";
import { Container } from "../../../design/_designComponents/Container/Container";
import { TemplateEntry } from "../../_types";

export const HeaderWithMegamenu: TemplateEntry = {
  label: "Header with Mega Menu",
  description: "Two-row header with social bar and search row",
  preview: "Mega",
  element: React.createElement(
    Element as any,
    {
      is: Container as any,
      background: "#ffffff",
      width: "100%",
      padding: 0,
      canvas: true,
      display: "flex",
      flexDirection: "column",
      alignItems: "stretch",
      justifyContent: "flex-start",
      gap: 0,
      height: "96px",
    },
    React.createElement(
      Element as any,
      {
        is: Row as any,
        background: "#1f1f22",
        width: "100%",
        height: "40px",
        paddingTop: 0,
        paddingBottom: 0,
        paddingLeft: 12,
        paddingRight: 12,
        canvas: true,
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "nowrap",
        gap: 0,
      },
      React.createElement(
        Element as any,
        {
          is: Column as any,
          canvas: true,
          customClassName: "min-h-0",
          width: "80%",
          height: "100%",
          padding: 0,
          paddingLeft: 0,
          gap: 10,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "flex-start",
        },
        React.createElement(Text as any, {
          text: "Follow Us",
          width: "auto",
          display: "inline-block",
          editorVisibility: "show",
          fontSize: 12,
          lineHeight: 1,
          fontWeight: "500",
          color: "#f8fafc",
        }),
        React.createElement(Icon as any, { iconType: "facebook", size: 13, color: "#f3f4f6" }),
        React.createElement(Icon as any, { iconType: "instagram", size: 13, color: "#f3f4f6" }),
        React.createElement(Icon as any, { iconType: "twitter", size: 13, color: "#f3f4f6" })
      ),
      React.createElement(
        Element as any,
        {
          is: Column as any,
          canvas: true,
          customClassName: "min-h-0",
          width: "20%",
          height: "100%",
          padding: 0,
          paddingRight: 0,
          gap: 10,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "flex-end",
        },
        React.createElement(Text as any, {
          text: "|",
          width: "auto",
          fontSize: 15,
          lineHeight: 1,
          fontWeight: "400",
          color: "#808289",
        }),
        React.createElement(Icon as any, { iconType: "question", size: 13, color: "#f3f4f6" }),
        React.createElement(Icon as any, { iconType: "bell", size: 13, color: "#f3f4f6" })
      )
    ),
    React.createElement(
      Element as any,
      {
        is: Row as any,
        background: "#ffffff",
        width: "100%",
        height: "56px",
        paddingTop: 0,
        paddingBottom: 0,
        paddingLeft: 12,
        paddingRight: 12,
        canvas: true,
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "nowrap",
        gap: 0,
      },
      React.createElement(
        Element as any,
        {
          is: Column as any,
          canvas: true,
          customClassName: "min-h-0",
          width: "60%",
          height: "100%",
          padding: 0,
          paddingLeft: 0,
          gap: 14,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "flex-start",
        },
        React.createElement(Image as any, {
          src: "",
          alt: "Image",
          width: "42px",
          height: "42px",
          objectFit: "cover",
          allowUpload: true,
        }),
        React.createElement(Text as any, { text: "Home", width: "auto", fontSize: 16, fontWeight: "600", color: "#5f6067" }),
        React.createElement(Text as any, { text: "About", width: "auto", fontSize: 16, fontWeight: "600", color: "#5f6067" }),
        React.createElement(Text as any, { text: "Contact", width: "auto", fontSize: 16, fontWeight: "600", color: "#5f6067" }),
        React.createElement(Text as any, { text: "Categories", width: "auto", fontSize: 16, fontWeight: "600", color: "#5f6067" })
      ),
      React.createElement(
        Element as any,
        {
          is: Column as any,
          canvas: true,
          customClassName: "min-h-0",
          width: "40%",
          height: "100%",
          padding: 0,
          paddingRight: 0,
          gap: 0,
          alignItems: "flex-end",
          justifyContent: "center",
        },
        React.createElement(
          Element as any,
          {
            is: Row as any,
            background: "#f2f2f4",
            borderWidth: 1,
            borderColor: "#9ea3ad",
            borderStyle: "solid",
            borderRadius: 8,
            width: "100%",
            height: "46px",
            paddingTop: 0,
            paddingBottom: 0,
            paddingLeft: 16,
            paddingRight: 14,
            canvas: true,
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "nowrap",
            gap: 12,
          },
          React.createElement(Text as any, { text: "Search...", width: "auto", fontSize: 14, color: "#6b7280", fontStyle: "italic", fontWeight: "500" }),
          React.createElement(Icon as any, { iconType: "search", size: 22, color: "#6b7280" })
        )
      )
    )
  ),
  category: "header",
};
