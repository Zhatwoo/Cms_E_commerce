"use client";

import React from "react";
import { Element } from "@craftjs/core";
import { Container } from "../../../design/_designComponents/Container/Container";
import { Text } from "../../../design/_designComponents/Text/Text";
import { Button } from "../../../design/_designComponents/Button/Button";
import { Section } from "../../../design/_designComponents/Section/Section";
import { Row } from "../../../design/_designComponents/Row/Row";
import { Column } from "../../../design/_designComponents/Column/Column";
import { TemplateEntry } from "../../_types";

export const OrderForm: TemplateEntry = {
  label: "Order Form",
  description: "Product order form with customer details",
  preview: "🛒",
  element: React.createElement(
    Element as any,
    { is: Section as any, background: "#e5e7eb", padding: 24, canvas: true },
    React.createElement(
      Element as any,
      { is: Container as any, background: "#f3f4f6", padding: 40, maxWidth: "1200px", canvas: true },
      React.createElement(
        Element as any,
        { is: Column as any, canvas: true },
        React.createElement(Text as any, { text: "Order Form", fontSize: 32, fontWeight: "bold", color: "#1e293b", marginBottom: 8 }),
        React.createElement(Text as any, { text: "Complete your order details below", fontSize: 16, color: "#64748b", marginBottom: 32 }),
        React.createElement(
          Element as any,
          { is: Row as any, canvas: true, marginBottom: 24, flexWrap: "wrap", alignItems: "flex-start" },
          React.createElement(
            Element as any,
            { is: Column as any, width: "100%", canvas: true },
            React.createElement(
              Element as any,
              { is: Container as any, background: "#e5e7eb", padding: 24, canvas: true },
              React.createElement(Text as any, { text: "Customer Information", fontSize: 20, fontWeight: "600", color: "#334155", marginBottom: 16 }),
              React.createElement(
                Element as any,
                { is: Row as any, canvas: true, marginBottom: 16 },
                React.createElement(
                  Element as any,
                  { is: Column as any, canvas: true },
                  React.createElement(Text as any, { text: "First Name", fontSize: 14, fontWeight: "500", color: "#475569" }),
                  React.createElement(
                    Element as any,
                    { is: Container as any, background: "#ffffff", padding: 12, canvas: true },
                    React.createElement(Text as any, { text: "John", fontSize: 14, color: "#94a3b8" })
                  )
                ),
                React.createElement(
                  Element as any,
                  { is: Column as any, canvas: true },
                  React.createElement(Text as any, { text: "Last Name", fontSize: 14, fontWeight: "500", color: "#475569" }),
                  React.createElement(
                    Element as any,
                    { is: Container as any, background: "#ffffff", padding: 12, canvas: true },
                    React.createElement(Text as any, { text: "Doe", fontSize: 14, color: "#94a3b8" })
                  )
                )
              ),
              React.createElement(
                Element as any,
                { is: Row as any, canvas: true },
                React.createElement(
                  Element as any,
                  { is: Column as any, canvas: true },
                  React.createElement(Text as any, { text: "Email", fontSize: 14, fontWeight: "500", color: "#475569" }),
                  React.createElement(
                    Element as any,
                    { is: Container as any, background: "#ffffff", padding: 12, canvas: true },
                    React.createElement(Text as any, { text: "john.doe@email.com", fontSize: 14, color: "#94a3b8" })
                  )
                ),
                React.createElement(
                  Element as any,
                  { is: Column as any, canvas: true },
                  React.createElement(Text as any, { text: "Phone", fontSize: 14, fontWeight: "500", color: "#475569" }),
                  React.createElement(
                    Element as any,
                    { is: Container as any, background: "#ffffff", padding: 12, canvas: true },
                    React.createElement(Text as any, { text: "+1 (555) 123-4567", fontSize: 14, color: "#94a3b8" })
                  )
                )
              )
            ),
            React.createElement(
              Element as any,
              { is: Container as any, background: "#e5e7eb", padding: 24, marginTop: 16, canvas: true },
              React.createElement(Text as any, { text: "Shipping Address", fontSize: 20, fontWeight: "600", color: "#334155", marginBottom: 16 }),
              React.createElement(
                Element as any,
                { is: Column as any, canvas: true, marginBottom: 16 },
                React.createElement(Text as any, { text: "Street Address", fontSize: 14, fontWeight: "500", color: "#475569" }),
                React.createElement(
                  Element as any,
                  { is: Container as any, background: "#ffffff", padding: 12, canvas: true },
                  React.createElement(Text as any, { text: "123 Main Street", fontSize: 14, color: "#94a3b8" })
                )
              ),
              React.createElement(
                Element as any,
                { is: Row as any, canvas: true },
                React.createElement(
                  Element as any,
                  { is: Column as any, canvas: true },
                  React.createElement(Text as any, { text: "City", fontSize: 14, fontWeight: "500", color: "#475569" }),
                  React.createElement(
                    Element as any,
                    { is: Container as any, background: "#ffffff", padding: 12, canvas: true },
                    React.createElement(Text as any, { text: "New York", fontSize: 14, color: "#94a3b8" })
                  )
                ),
                React.createElement(
                  Element as any,
                  { is: Column as any, canvas: true },
                  React.createElement(Text as any, { text: "State/Province", fontSize: 14, fontWeight: "500", color: "#475569" }),
                  React.createElement(
                    Element as any,
                    { is: Container as any, background: "#ffffff", padding: 12, canvas: true },
                    React.createElement(Text as any, { text: "NY", fontSize: 14, color: "#94a3b8" })
                  )
                ),
                React.createElement(
                  Element as any,
                  { is: Column as any, canvas: true },
                  React.createElement(Text as any, { text: "Zip Code", fontSize: 14, fontWeight: "500", color: "#475569" }),
                  React.createElement(
                    Element as any,
                    { is: Container as any, background: "#ffffff", padding: 12, canvas: true },
                    React.createElement(Text as any, { text: "10001", fontSize: 14, color: "#94a3b8" })
                  )
                )
              )
            )
          ),
          React.createElement(
            Element as any,
            { is: Column as any, width: "100%", canvas: true },
            React.createElement(
              Element as any,
              { is: Container as any, background: "#e5e7eb", padding: 24, canvas: true },
              React.createElement(Text as any, { text: "Order Details", fontSize: 20, fontWeight: "600", color: "#334155", marginBottom: 16 }),
              React.createElement(
                Element as any,
                { is: Column as any, canvas: true, marginBottom: 16 },
                React.createElement(Text as any, { text: "Product/Service", fontSize: 14, fontWeight: "500", color: "#475569" }),
                React.createElement(
                  Element as any,
                  { is: Container as any, background: "#ffffff", padding: 12, canvas: true },
                  React.createElement(Text as any, { text: "Select product...", fontSize: 14, color: "#94a3b8" })
                )
              ),
              React.createElement(
                Element as any,
                { is: Row as any, canvas: true, marginBottom: 16 },
                React.createElement(
                  Element as any,
                  { is: Column as any, canvas: true },
                  React.createElement(Text as any, { text: "Quantity", fontSize: 14, fontWeight: "500", color: "#475569" }),
                  React.createElement(
                    Element as any,
                    { is: Container as any, background: "#ffffff", padding: 12, canvas: true },
                    React.createElement(Text as any, { text: "1", fontSize: 14, color: "#94a3b8" })
                  )
                ),
                React.createElement(
                  Element as any,
                  { is: Column as any, canvas: true },
                  React.createElement(Text as any, { text: "Total Amount", fontSize: 14, fontWeight: "500", color: "#475569" }),
                  React.createElement(
                    Element as any,
                    { is: Container as any, background: "#f1f5f9", padding: 12, canvas: true },
                    React.createElement(Text as any, { text: "$0.00", fontSize: 16, fontWeight: "600", color: "#0f172a" })
                  )
                )
              ),
              React.createElement(
                Element as any,
                { is: Column as any, canvas: true, marginBottom: 16 },
                React.createElement(Text as any, { text: "Special Instructions", fontSize: 14, fontWeight: "500", color: "#475569" }),
                React.createElement(
                  Element as any,
                  { is: Container as any, background: "#ffffff", padding: 12, height: 100, canvas: true },
                  React.createElement(Text as any, { text: "Any special requests or notes...", fontSize: 14, color: "#94a3b8" })
                )
              ),
              React.createElement(Button as any, { label: "Place Order", backgroundColor: "#10b981", textColor: "#ffffff", fontSize: 16, marginTop: 8 })
            )
          )
        )
      )
    )
  ),
  category: "form",
};
