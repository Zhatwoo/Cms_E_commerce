"use client";

import React from "react";
import { Element } from "@craftjs/core";
import { Container } from "../../../design/_designComponents/Container/Container";
import { Text } from "../../../design/_designComponents/Text/Text";
import { Icon } from "../../../design/_designComponents/Icon/Icon";
import { Row } from "../../../design/_designComponents/Row/Row";
import { Column } from "../../../design/_designComponents/Column/Column";
import { Image } from "../../../design/_designComponents/Image/Image";
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
      height: "min-content",
    },
    React.createElement(
      Element as any,
      {
        is: Container as any,
        background: "#2e2e30",
        width: "100%",
        height: "48px",
        paddingTop: 4,
        paddingBottom: 4,
        paddingLeft: 14,
        paddingRight: 14,
        canvas: true,
        display: "flex",
        flexDirection: "column",
        alignItems: "stretch",
        justifyContent: "center",
      },
      React.createElement(
        Element as any,
        {
          is: Row as any,
          canvas: true,
          background: "transparent",
          width: "100%",
          height: "100%",
          minHeight: "100%",
          padding: 0,
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 12,
        },
        React.createElement(
          Element as any,
          {
            is: Column as any,
            canvas: true,
            customClassName: "min-h-0",
            width: "50%",
            height: "100%",
            padding: 0,
            gap: 8,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "flex-start",
          },
          React.createElement(Text as any, {
            text: "Follow Us",
            width: "78px",
            display: "inline-block",
            editorVisibility: "show",
            fontSize: 13,
            lineHeight: 1,
            fontWeight: "700",
            color: "#f8fafc",
          }),
          React.createElement(Icon as any, { iconType: "facebook", size: 14, color: "#f3f4f6" }),
          React.createElement(Icon as any, { iconType: "instagram", size: 14, color: "#f3f4f6" }),
          React.createElement(Icon as any, { iconType: "twitter", size: 14, color: "#f3f4f6" })
        ),
        React.createElement(
          Element as any,
          {
            is: Column as any,
            canvas: true,
            customClassName: "min-h-0",
            width: "50%",
            height: "100%",
            padding: 0,
            gap: 10,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "flex-end",
          },
          React.createElement(Icon as any, { iconType: "settings", size: 14, color: "#f3f4f6" }),
          React.createElement(Icon as any, { iconType: "bell", size: 14, color: "#f3f4f6" })
        )
      )
    ),
    React.createElement(
      Element as any,
      {
        is: Container as any,
        background: "#ffffff",
        width: "100%",
        height: "90px",
        paddingTop: 14,
        paddingBottom: 14,
        paddingLeft: 14,
        paddingRight: 14,
        canvas: true,
        display: "flex",
        flexDirection: "column",
        alignItems: "stretch",
        justifyContent: "center",
      },
      React.createElement(
        Element as any,
        {
          is: Row as any,
          alignItems: "center",
          justifyContent: "space-between",
          canvas: true,
          width: "100%",
          height: "100%",
          minHeight: "100%",
          padding: 0,
          gap: 16,
          flexWrap: "wrap",
        },
        React.createElement(
          Element as any,
          {
            is: Column as any,
            canvas: true,
            customClassName: "min-h-0",
            width: "33.33%",
            height: "100%",
            padding: 0,
            gap: 0,
            alignItems: "flex-start",
            justifyContent: "center",
          },
          React.createElement(Image as any, {
            src: "",
            alt: "Image",
            width: "42px",
            height: "30px",
            objectFit: "cover",
            allowUpload: true,
          })
        ),
        React.createElement(
          Element as any,
          {
            is: Column as any,
            canvas: true,
            customClassName: "min-h-0",
            width: "33.33%",
            height: "100%",
            padding: 0,
            gap: 0,
            alignItems: "center",
            justifyContent: "center",
          },
          React.createElement(
            Element as any,
            {
              is: Row as any,
              canvas: true,
              width: "auto",
              padding: 0,
              gap: 22,
              alignItems: "center",
              justifyContent: "center",
              flexWrap: "wrap",
            },
            React.createElement(Text as any, { text: "Home", width: "auto", fontSize: 14, fontWeight: "600", color: "#111111" }),
            React.createElement(Text as any, { text: "About", width: "auto", fontSize: 14, fontWeight: "600", color: "#111111" })
          )
        ),
        React.createElement(
          Element as any,
          {
            is: Column as any,
            canvas: true,
            customClassName: "min-h-0",
            width: "33.33%",
            height: "100%",
            padding: 0,
            gap: 0,
            alignItems: "flex-end",
            justifyContent: "center",
          },
          React.createElement(
            Element as any,
            {
              is: Container as any,
              background: "#ececef",
              borderWidth: 1,
              borderColor: "#b8bcc4",
              borderStyle: "solid",
              borderRadius: 8,
              width: "100%",
              maxWidth: "380px",
              height: "40px",
              paddingTop: 8,
              paddingBottom: 8,
              paddingLeft: 14,
              paddingRight: 14,
              canvas: true,
              alignItems: "stretch",
            },
            React.createElement(
              Element as any,
              { is: Row as any, canvas: true, width: "100%", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap" },
              React.createElement(Text as any, { text: "Search...", width: "auto", fontSize: 14, color: "#6b7280", fontStyle: "italic" }),
              React.createElement(Icon as any, { iconType: "search", size: 18, color: "#6b7280" })
            )
          )
        )
      )
    )
  ),
  category: "header",
};
