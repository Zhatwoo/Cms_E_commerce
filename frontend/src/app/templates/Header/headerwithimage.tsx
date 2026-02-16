"use client";

import React from "react";
import { Element } from "@craftjs/core";
import { Container } from "../../design/_designComponents/Container/Container";
import { Text } from "../../design/_designComponents/Text/Text";
import { Image } from "../../design/_designComponents/Image/Image";
import { Section } from "../../design/_designComponents/Section/Section";
import { Row } from "../../design/_designComponents/Row/Row";
import { Column } from "../../design/_designComponents/Column/Column";
import { TemplateEntry } from "../_types";

export const HeaderWithImage: TemplateEntry = {
  label: "Header with Image & Nav",
  description: "Header with logo image and navigation menu",
  preview: "H+Img",
  element: React.createElement(
    Element as any,
    { is: Section as any, canvas: true },
    React.createElement(
      Element as any,
      { is: Container as any, background: "#ffffff", padding: 20, canvas: true },
      React.createElement(
        Element as any,
        { is: Row as any, canvas: true },
        // Left column with logo image
        React.createElement(
          Element as any,
          { is: Column as any, canvas: true },
          React.createElement(
            Image as any,
            {
              src: "https://placehold.co/120x40/3b82f6/ffffff?text=Logo",
              alt: "Logo",
              width: "120px",
              height: "40px",
              objectFit: "contain",
            }
          )
        ),
        // Right column with navigation
        React.createElement(
          Element as any,
          { is: Column as any, canvas: true },
          React.createElement(
            Element as any,
            { is: Row as any, gap: 24, canvas: true },
            React.createElement(Text as any, { text: "Home", fontSize: 16, color: "#64748b" }),
            React.createElement(Text as any, { text: "About", fontSize: 16, color: "#64748b" }),
            React.createElement(Text as any, { text: "Services", fontSize: 16, color: "#64748b" }),
            React.createElement(Text as any, { text: "Products", fontSize: 16, color: "#64748b" }),
            React.createElement(Text as any, { text: "Contact", fontSize: 16, color: "#64748b" })
          )
        )
      )
    )
  ),
  category: "header",
};
