/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React from "react";
import { Element } from "@craftjs/core";
import { Image } from "../../../design/_designComponents/Image/Image";
import { Text } from "../../../design/_designComponents/Text/Text";
import { Section } from "../../../design/_designComponents/Section/Section";
import { Row } from "../../../design/_designComponents/Row/Row";
import { TemplateEntry } from "../../_types";

export const SimpleHeader: TemplateEntry = {
  label: "Simple Header",
  description: "Clean navbar with logo and menu",
  preview: "Nav",
  element: React.createElement(
    Element as any,
    {
      is: Row as any,
      canvas: true,
      background: "#ffffff",
      width: "100%",
      paddingTop: 16,
      paddingBottom: 16,
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
          width: 76,
          height: 34,
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
            justifyContent: "flex-end",
          },
          React.createElement(Text as any, {
            text: "Home",
            fontSize: 24,
            fontWeight: "500",
            color: "#374151",
          }),
          React.createElement(Text as any, {
            text: "About",
            fontSize: 24,
            fontWeight: "500",
            color: "#374151",
          }),
          React.createElement(Text as any, {
            text: "Services",
            fontSize: 24,
            fontWeight: "500",
            color: "#374151",
          }),
          React.createElement(Text as any, {
            text: "Contact",
            fontSize: 24,
            fontWeight: "500",
            color: "#374151",
          })
        )
      )
    )
  ),
  category: "header",
};