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
  preview: "Cart",
  element: React.createElement(
    Element as any,
    {
      is: Section as any,
      canvas: true,
      width: "100%",
      backgroundImage:
        "https://images.unsplash.com/photo-1555529669-e69e7aa0ba9a?q=80&w=2070&auto=format&fit=crop",
      backgroundOverlay: "rgba(15, 23, 42, 0.7)",
      backgroundSize: "cover",
      backgroundPosition: "center",
      paddingTop: 56,
      paddingBottom: 56,
      paddingLeft: 20,
      paddingRight: 20,
      justifyContent: "center",
      alignItems: "center",
    },
    React.createElement(
      Element as any,
      {
        is: Container as any,
        canvas: true,
        width: "min(100%, 1280px)",
        background: "rgba(248, 250, 252, 0.94)",
        borderRadius: 22,
        borderWidth: 1,
        borderColor: "rgba(148, 163, 184, 0.25)",
        boxShadow: "0 24px 60px rgba(2, 6, 23, 0.2)",
        paddingTop: 34,
        paddingBottom: 34,
        paddingLeft: 34,
        paddingRight: 34,
      },
      React.createElement(
        Element as any,
        {
          is: Column as any,
          canvas: true,
          background: "transparent",
          padding: 0,
          gap: 16,
        },
        React.createElement(Text as any, {
          text: "Order Form",
          fontSize: 40,
          fontWeight: "700",
          color: "#0f172a",
        }),
        React.createElement(Text as any, {
          text: "Securely complete your order details below.",
          fontSize: 16,
          color: "#475569",
          marginBottom: 8,
        }),
        React.createElement(
          Element as any,
          {
            is: Row as any,
            canvas: true,
            alignItems: "stretch",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 18,
          },
          React.createElement(
            Element as any,
            {
              is: Column as any,
              canvas: true,
              width: "min(100%, 740px)",
              background: "#ffffff",
              borderRadius: 16,
              borderWidth: 1,
              borderColor: "#dbe3ee",
              boxShadow: "0 8px 24px rgba(15, 23, 42, 0.08)",
              paddingTop: 22,
              paddingBottom: 22,
              paddingLeft: 22,
              paddingRight: 22,
              gap: 18,
            },
            React.createElement(Text as any, {
              text: "Customer Information",
              fontSize: 22,
              fontWeight: "600",
              color: "#1e293b",
            }),
            React.createElement(
              Element as any,
              { is: Row as any, canvas: true, flexWrap: "wrap", gap: 12 },
              React.createElement(
                Element as any,
                { is: Column as any, width: "min(100%, 360px)", canvas: true, padding: 0, gap: 8 },
                React.createElement(Text as any, { text: "First Name", fontSize: 13, fontWeight: "600", color: "#334155" }),
                React.createElement(
                  Element as any,
                  { is: Container as any, background: "#f8fafc", borderColor: "#dbe3ee", borderWidth: 1, borderRadius: 10, padding: 12, canvas: true },
                  React.createElement(Text as any, { text: "John", fontSize: 14, color: "#64748b" })
                )
              ),
              React.createElement(
                Element as any,
                { is: Column as any, width: "min(100%, 360px)", canvas: true, padding: 0, gap: 8 },
                React.createElement(Text as any, { text: "Last Name", fontSize: 13, fontWeight: "600", color: "#334155" }),
                React.createElement(
                  Element as any,
                  { is: Container as any, background: "#f8fafc", borderColor: "#dbe3ee", borderWidth: 1, borderRadius: 10, padding: 12, canvas: true },
                  React.createElement(Text as any, { text: "Doe", fontSize: 14, color: "#64748b" })
                )
              )
            ),
            React.createElement(
              Element as any,
              { is: Row as any, canvas: true, flexWrap: "wrap", gap: 12 },
              React.createElement(
                Element as any,
                { is: Column as any, width: "min(100%, 360px)", canvas: true, padding: 0, gap: 8 },
                React.createElement(Text as any, { text: "Email", fontSize: 13, fontWeight: "600", color: "#334155" }),
                React.createElement(
                  Element as any,
                  { is: Container as any, background: "#f8fafc", borderColor: "#dbe3ee", borderWidth: 1, borderRadius: 10, padding: 12, canvas: true },
                  React.createElement(Text as any, { text: "john.doe@email.com", fontSize: 14, color: "#64748b" })
                )
              ),
              React.createElement(
                Element as any,
                { is: Column as any, width: "min(100%, 360px)", canvas: true, padding: 0, gap: 8 },
                React.createElement(Text as any, { text: "Phone", fontSize: 13, fontWeight: "600", color: "#334155" }),
                React.createElement(
                  Element as any,
                  { is: Container as any, background: "#f8fafc", borderColor: "#dbe3ee", borderWidth: 1, borderRadius: 10, padding: 12, canvas: true },
                  React.createElement(Text as any, { text: "+1 (555) 123-4567", fontSize: 14, color: "#64748b" })
                )
              )
            ),
            React.createElement(
              Element as any,
              {
                is: Container as any,
                canvas: true,
                background: "#f8fafc",
                borderRadius: 14,
                borderColor: "#dbe3ee",
                borderWidth: 1,
                paddingTop: 18,
                paddingBottom: 18,
                paddingLeft: 18,
                paddingRight: 18,
              },
              React.createElement(Text as any, {
                text: "Shipping Address",
                fontSize: 20,
                fontWeight: "600",
                color: "#1e293b",
                marginBottom: 14,
              }),
              React.createElement(
                Element as any,
                { is: Column as any, canvas: true, padding: 0, gap: 8, marginBottom: 12 },
                React.createElement(Text as any, { text: "Street Address", fontSize: 13, fontWeight: "600", color: "#334155" }),
                React.createElement(
                  Element as any,
                  { is: Container as any, background: "#ffffff", borderColor: "#dbe3ee", borderWidth: 1, borderRadius: 10, padding: 12, canvas: true },
                  React.createElement(Text as any, { text: "123 Main Street", fontSize: 14, color: "#64748b" })
                )
              ),
              React.createElement(
                Element as any,
                { is: Row as any, canvas: true, flexWrap: "wrap", gap: 12 },
                React.createElement(
                  Element as any,
                  { is: Column as any, width: "min(100%, 220px)", canvas: true, padding: 0, gap: 8 },
                  React.createElement(Text as any, { text: "City", fontSize: 13, fontWeight: "600", color: "#334155" }),
                  React.createElement(
                    Element as any,
                    { is: Container as any, background: "#ffffff", borderColor: "#dbe3ee", borderWidth: 1, borderRadius: 10, padding: 12, canvas: true },
                    React.createElement(Text as any, { text: "New York", fontSize: 14, color: "#64748b" })
                  )
                ),
                React.createElement(
                  Element as any,
                  { is: Column as any, width: "min(100%, 220px)", canvas: true, padding: 0, gap: 8 },
                  React.createElement(Text as any, { text: "State/Province", fontSize: 13, fontWeight: "600", color: "#334155" }),
                  React.createElement(
                    Element as any,
                    { is: Container as any, background: "#ffffff", borderColor: "#dbe3ee", borderWidth: 1, borderRadius: 10, padding: 12, canvas: true },
                    React.createElement(Text as any, { text: "NY", fontSize: 14, color: "#64748b" })
                  )
                ),
                React.createElement(
                  Element as any,
                  { is: Column as any, width: "min(100%, 220px)", canvas: true, padding: 0, gap: 8 },
                  React.createElement(Text as any, { text: "Zip Code", fontSize: 13, fontWeight: "600", color: "#334155" }),
                  React.createElement(
                    Element as any,
                    { is: Container as any, background: "#ffffff", borderColor: "#dbe3ee", borderWidth: 1, borderRadius: 10, padding: 12, canvas: true },
                    React.createElement(Text as any, { text: "10001", fontSize: 14, color: "#64748b" })
                  )
                )
              )
            )
          ),
          React.createElement(
            Element as any,
            {
              is: Column as any,
              canvas: true,
              width: "min(100%, 430px)",
              background: "linear-gradient(160deg, #0f172a, #1e293b)",
              borderRadius: 16,
              boxShadow: "0 10px 28px rgba(15, 23, 42, 0.22)",
              paddingTop: 22,
              paddingBottom: 22,
              paddingLeft: 22,
              paddingRight: 22,
              gap: 14,
            },
            React.createElement(Text as any, {
              text: "Order Details",
              fontSize: 22,
              fontWeight: "600",
              color: "#f8fafc",
            }),
            React.createElement(
              Element as any,
              { is: Column as any, canvas: true, padding: 0, gap: 8 },
              React.createElement(Text as any, { text: "Product/Service", fontSize: 13, fontWeight: "600", color: "#cbd5e1" }),
              React.createElement(
                Element as any,
                { is: Container as any, background: "rgba(248, 250, 252, 0.98)", borderRadius: 10, padding: 12, canvas: true },
                React.createElement(Text as any, { text: "Select product...", fontSize: 14, color: "#64748b" })
              )
            ),
            React.createElement(
              Element as any,
              { is: Row as any, canvas: true, flexWrap: "wrap", gap: 12 },
              React.createElement(
                Element as any,
                { is: Column as any, width: "min(100%, 180px)", canvas: true, padding: 0, gap: 8 },
                React.createElement(Text as any, { text: "Quantity", fontSize: 13, fontWeight: "600", color: "#cbd5e1" }),
                React.createElement(
                  Element as any,
                  { is: Container as any, background: "rgba(248, 250, 252, 0.98)", borderRadius: 10, padding: 12, canvas: true },
                  React.createElement(Text as any, { text: "1", fontSize: 14, color: "#64748b" })
                )
              ),
              React.createElement(
                Element as any,
                { is: Column as any, width: "min(100%, 210px)", canvas: true, padding: 0, gap: 8 },
                React.createElement(Text as any, { text: "Total Amount", fontSize: 13, fontWeight: "600", color: "#cbd5e1" }),
                React.createElement(
                  Element as any,
                  { is: Container as any, background: "#dcfce7", borderRadius: 10, padding: 12, canvas: true },
                  React.createElement(Text as any, { text: "₱0.00", fontSize: 18, fontWeight: "700", color: "#14532d" })
                )
              )
            ),
            React.createElement(
              Element as any,
              { is: Column as any, canvas: true, padding: 0, gap: 8, marginBottom: 8 },
              React.createElement(Text as any, { text: "Special Instructions", fontSize: 13, fontWeight: "600", color: "#cbd5e1" }),
              React.createElement(
                Element as any,
                {
                  is: Container as any,
                  background: "rgba(248, 250, 252, 0.98)",
                  borderRadius: 10,
                  paddingTop: 12,
                  paddingBottom: 12,
                  paddingLeft: 12,
                  paddingRight: 12,
                  height: "110px",
                  canvas: true,
                },
                React.createElement(Text as any, { text: "Any special requests or notes...", fontSize: 14, color: "#94a3b8" })
              )
            ),
            React.createElement(Button as any, {
              label: "Place Order",
              width: "100%",
              backgroundColor: "#16a34a",
              textColor: "#ffffff",
              fontSize: 16,
              fontWeight: "600",
              borderRadius: 10,
              paddingTop: 14,
              paddingBottom: 14,
              paddingLeft: 20,
              paddingRight: 20,
              marginTop: 4,
            }),
            React.createElement(Text as any, {
              text: "Encrypted checkout • Secure payment",
              fontSize: 12,
              color: "#94a3b8",
            })
          )
        )
      )
    )
  ),
  category: "form",
};




