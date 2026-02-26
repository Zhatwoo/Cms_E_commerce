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

function paymentOptionRow(label: string, iconType: string) {
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
      width: "100%",
      alignItems: "stretch",
      justifyContent: "center",
      canvas: true,
    },
    React.createElement(
      Element as any,
      { is: Row as any, canvas: true, alignItems: "center", flexWrap: "nowrap", gap: 8 },
      React.createElement(Icon as any, {
        iconType,
        size: 18,
        color: "#111111",
      }),
      React.createElement(Text as any, {
        text: label,
        fontSize: 24,
        fontWeight: "400",
        color: "#1a1a1a",
      })
    )
  );
}

export const PaymentMethod: TemplateEntry = {
  label: "Payment Method",
  description: "Payment method options list",
  preview: "PM",
  element: React.createElement(
    Element as any,
    { is: Section as any, background: "#dddddd", padding: 16, canvas: true },
    React.createElement(
      Element as any,
      {
        is: Container as any,
        background: "#dddddd",
        maxWidth: "760px",
        padding: 6,
        canvas: true,
        alignItems: "stretch",
        justifyContent: "flex-start",
      },
      React.createElement(
        Element as any,
        { is: Column as any, width: "100%", canvas: true, padding: 0, gap: 10, alignItems: "stretch" },
        React.createElement(Text as any, {
          text: "Payment Method",
          fontSize: 42,
          fontWeight: "700",
          color: "#101010",
          marginBottom: 8,
        }),
        paymentOptionRow("Cash On Delivery", "shoppingBasket"),
        paymentOptionRow("Credit/Debit Card", "cart"),
        paymentOptionRow("E-Wallet", "shoppingBag"),
        paymentOptionRow("Online Banking", "home"),
        paymentOptionRow("Linked Banked Accounts", "menu")
      )
    )
  ),
  category: "form",
};
