"use client";

import React from "react";
import { Element } from "@craftjs/core";
import { Container } from "../../../design/_designComponents/Container/Container";
import { Text } from "../../../design/_designComponents/Text/Text";
import { Section } from "../../../design/_designComponents/Section/Section";
import { Row } from "../../../design/_designComponents/Row/Row";
import { Column } from "../../../design/_designComponents/Column/Column";
import { TemplateEntry } from "../../_types";

function fieldBox(label: string, value: string, width = "100%") {
  return React.createElement(
    Element as any,
    {
      is: Container as any,
      background: "#e6e6e6",
      borderWidth: 1,
      borderColor: "#949494",
      borderStyle: "solid",
      borderRadius: 10,
      paddingTop: 8,
      paddingBottom: 8,
      paddingLeft: 12,
      paddingRight: 12,
      width,
      alignItems: "stretch",
      justifyContent: "center",
      canvas: true,
    },
    React.createElement(Text as any, {
      text: label,
      fontSize: 11,
      color: "#6b6b6b",
    }),
    React.createElement(Text as any, {
      text: value,
      fontSize: 24,
      color: "#333333",
      marginTop: 2,
    })
  );
}

export const PaymentMethodV1: TemplateEntry = {
  label: "Payment Method V1",
  description: "Card details payment form",
  preview: "PM1",
  element: React.createElement(
    Element as any,
    {
      is: Section as any,
      background: "#dddddd",
      width: "100%",
      paddingTop: 16,
      paddingBottom: 16,
      paddingLeft: 12,
      paddingRight: 12,
      justifyContent: "center",
      alignItems: "center",
      canvas: true,
    },
    React.createElement(
      Element as any,
      {
        is: Container as any,
        background: "#dddddd",
        width: "min(100%, 820px)",
        paddingTop: 0,
        paddingBottom: 0,
        paddingLeft: 0,
        paddingRight: 0,
        canvas: true,
        alignItems: "stretch",
        justifyContent: "flex-start",
      },
      React.createElement(
        Element as any,
        {
          is: Column as any,
          width: "100%",
          background: "#d8d8d8",
          borderRadius: 4,
          canvas: true,
          paddingTop: 16,
          paddingBottom: 16,
          paddingLeft: 18,
          paddingRight: 18,
          gap: 10,
          alignItems: "stretch",
        },
        React.createElement(Text as any, {
          text: "Payment Method",
          fontSize: 32,
          fontWeight: "700",
          color: "#101010",
          marginBottom: 8,
        }),
        fieldBox("Name on card", "Juan Dela Cruz"),
        React.createElement(
          Element as any,
          { is: Row as any, canvas: true, gap: 10, flexWrap: "wrap" },
          fieldBox("Card Number", "1234   1234   1234   1234", "min(100%, 520px)"),
          fieldBox("CVV", "123", "min(100%, 240px)")
        ),
        React.createElement(
          Element as any,
          { is: Row as any, canvas: true, gap: 10, flexWrap: "wrap" },
          React.createElement(
            Element as any,
            {
              is: Container as any,
              background: "#e6e6e6",
              borderWidth: 1,
              borderColor: "#949494",
              borderStyle: "solid",
              borderRadius: 10,
              paddingTop: 8,
              paddingBottom: 8,
              paddingLeft: 12,
              paddingRight: 12,
              width: "min(100%, 390px)",
              alignItems: "stretch",
              justifyContent: "center",
              canvas: true,
            },
            React.createElement(
              Element as any,
              { is: Row as any, canvas: true, alignItems: "center", justifyContent: "space-between", flexWrap: "nowrap" },
              React.createElement(
                Element as any,
                { is: Column as any, canvas: true, padding: 0, gap: 2, alignItems: "flex-start" },
                React.createElement(Text as any, { text: "Month", fontSize: 11, color: "#6b6b6b" }),
                React.createElement(Text as any, { text: "MM", fontSize: 24, color: "#333333" })
              ),
              React.createElement(Text as any, { text: "v", fontSize: 20, color: "#333333" })
            )
          ),
          React.createElement(
            Element as any,
            {
              is: Container as any,
              background: "#e6e6e6",
              borderWidth: 1,
              borderColor: "#949494",
              borderStyle: "solid",
              borderRadius: 10,
              paddingTop: 8,
              paddingBottom: 8,
              paddingLeft: 12,
              paddingRight: 12,
              width: "min(100%, 390px)",
              alignItems: "stretch",
              justifyContent: "center",
              canvas: true,
            },
            React.createElement(
              Element as any,
              { is: Row as any, canvas: true, alignItems: "center", justifyContent: "space-between", flexWrap: "nowrap" },
              React.createElement(
                Element as any,
                { is: Column as any, canvas: true, padding: 0, gap: 2, alignItems: "flex-start" },
                React.createElement(Text as any, { text: "Year", fontSize: 11, color: "#6b6b6b" }),
                React.createElement(Text as any, { text: "YYYY", fontSize: 24, color: "#333333" })
              ),
              React.createElement(Text as any, { text: "v", fontSize: 20, color: "#333333" })
            )
          )
        )
      )
    )
  ),
  category: "form",
};
