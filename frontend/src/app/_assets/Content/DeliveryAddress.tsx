"use client";

import React from "react";
import { Element } from "@craftjs/core";
import { Container } from "../../design/_designComponents/Container/Container";
import { Text } from "../../design/_designComponents/Text/Text";
import { Row } from "../../design/_designComponents/Row/Row";
import { Column } from "../../design/_designComponents/Column/Column";
import { Section } from "../../design/_designComponents/Section/Section";
import { TemplateEntry } from "../_types";

export const DeliveryAddress: TemplateEntry = {
  label: "Delivery Address",
  description: "Modern address card with status and quick actions",
  preview: "Address",
  element: React.createElement(
    Element as any,
    { is: Section as any, background: "#eceff3", padding: 22, canvas: true },
    React.createElement(
      Element as any,
      {
        is: Container as any,
        maxWidth: "1200px",
        width: "100%",
        background: "#ffffff",
        borderWidth: 1,
        borderColor: "#d8dee8",
        borderStyle: "solid",
        borderRadius: 14,
        boxShadow: "0 8px 20px rgba(15, 23, 42, 0.08)",
        paddingTop: 18,
        paddingBottom: 18,
        paddingLeft: 20,
        paddingRight: 20,
        canvas: true,
        alignItems: "stretch",
        justifyContent: "flex-start",
      },
      React.createElement(
        Element as any,
        { is: Row as any, canvas: true, alignItems: "center", gap: 10, marginBottom: 12, flexWrap: "nowrap" },
        React.createElement(
          Element as any,
          {
            is: Container as any,
            width: "26px",
            height: "26px",
            background: "#111827",
            borderRadius: 99,
            padding: 0,
            canvas: true,
            alignItems: "center",
            justifyContent: "center",
          },
          React.createElement(Text as any, { text: "i", fontSize: 12, fontWeight: "700", color: "#ffffff" })
        ),
        React.createElement(Text as any, { text: "Delivery Address", fontSize: 34, fontWeight: "700", color: "#111827" })
      ),
      React.createElement(
        Element as any,
        { is: Row as any, canvas: true, alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "nowrap" },
        React.createElement(
          Element as any,
          { is: Column as any, width: "28%", canvas: true, padding: 0, gap: 0, alignItems: "flex-start" },
          React.createElement(Text as any, {
            text: "Name | Contact Number",
            fontSize: 24,
            fontWeight: "600",
            color: "#1f2937",
          })
        ),
        React.createElement(
          Element as any,
          { is: Column as any, width: "50%", canvas: true, padding: 0, gap: 4, alignItems: "flex-start" },
          React.createElement(Text as any, {
            text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit,",
            fontSize: 14,
            color: "#4b5563",
          }),
          React.createElement(Text as any, {
            text: "sed do eiusmod tempor incididunt ut labore",
            fontSize: 14,
            color: "#4b5563",
          })
        ),
        React.createElement(
          Element as any,
          { is: Row as any, width: "22%", canvas: true, alignItems: "center", justifyContent: "flex-end", gap: 12, flexWrap: "nowrap" },
          React.createElement(
            Element as any,
            {
              is: Container as any,
              background: "#f4ecff",
              borderWidth: 1,
              borderColor: "#b887ff",
              borderStyle: "solid",
              borderRadius: 8,
              paddingTop: 7,
              paddingBottom: 7,
              paddingLeft: 12,
              paddingRight: 12,
              width: "92px",
              canvas: true,
              alignItems: "center",
              justifyContent: "center",
            },
            React.createElement(Text as any, {
              text: "Default",
              fontSize: 12,
              fontWeight: "600",
              color: "#7c3aed",
            })
          ),
          React.createElement(
            Element as any,
            {
              is: Container as any,
              background: "transparent",
              borderWidth: 1,
              borderColor: "#93c5fd",
              borderStyle: "solid",
              borderRadius: 8,
              paddingTop: 7,
              paddingBottom: 7,
              paddingLeft: 14,
              paddingRight: 14,
              width: "88px",
              canvas: true,
              alignItems: "center",
              justifyContent: "center",
            },
            React.createElement(Text as any, {
              text: "Change",
              fontSize: 13,
              fontWeight: "700",
              color: "#1d4ed8",
            })
          )
        )
      )
    )
  ),
  category: "content",
};
