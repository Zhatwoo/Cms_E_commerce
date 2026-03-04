/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React from "react";
import { Element } from "@craftjs/core";
import { Image } from "../../../design/_designComponents/Image/Image";
import { Text } from "../../../design/_designComponents/Text/Text";
import { Button } from "../../../design/_designComponents/Button/Button";
import { Section } from "../../../design/_designComponents/Section/Section";
import { Row } from "../../../design/_designComponents/Row/Row";
import { TemplateEntry } from "../../_types";

export const HeaderWithCTA: TemplateEntry = {
  label: "Header with CTA",
  description: "Navigation with call-to-action button",
  preview: "Nav+Btn",
  element: React.createElement(
    Element as any,
    {
      is: Row as any,
      canvas: true,
      background: "#1e293b",
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
            justifyContent: "flex-end",
          },
          React.createElement(Text as any, {
            text: "Home",
            fontSize: 24,
            fontWeight: "500",
            color: "#e2e8f0",
          }),
          React.createElement(Text as any, {
            text: "Features",
            fontSize: 24,
            fontWeight: "500",
            color: "#e2e8f0",
          }),
          React.createElement(Text as any, {
            text: "Pricing",
            fontSize: 24,
            fontWeight: "500",
            color: "#e2e8f0",
          }),
          React.createElement(Button as any, {
            label: "Get Started",
            backgroundColor: "#3b82f6",
            textColor: "#ffffff",
            fontSize: 24,
            fontWeight: "600",
            borderRadius: 4,
            paddingTop: 10,
            paddingBottom: 10,
            paddingLeft: 16,
            paddingRight: 16,
          })
        )
      )
    )
  ),
  category: "header",
};