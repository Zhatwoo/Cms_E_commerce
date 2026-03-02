"use client";

import React from "react";
import { Element } from "@craftjs/core";
import { Container } from "../../../design/_designComponents/Container/Container";
import { Text } from "../../../design/_designComponents/Text/Text";
import { Button } from "../../../design/_designComponents/Button/Button";
import { Image } from "../../../design/_designComponents/Image/Image";
import { Section } from "../../../design/_designComponents/Section/Section";
import { Row } from "../../../design/_designComponents/Row/Row";
import { Column } from "../../../design/_designComponents/Column/Column";
import { TemplateEntry } from "../../_types";

export const OrderFormV1: TemplateEntry = {
  label: "Order Form V1",
  description: "Enhanced checkout form with product images and polished layout",
  preview: "OF1",
  element: React.createElement(
    Element as any,
    { is: Section as any, background: "#e7e7e7", padding: 28, canvas: true },
    React.createElement(
      Element as any,
      {
        is: Container as any,
        background: "#e7e7e7",
        padding: 10,
        maxWidth: "1200px",
        borderRadius: 14,
        canvas: true,
      },
      React.createElement(
        Element as any,
        { is: Row as any, canvas: true, gap: 24, alignItems: "flex-start", flexWrap: "wrap" },
        React.createElement(
          Element as any,
          { is: Column as any, width: "44%", canvas: true, gap: 14, padding: 0 },
          React.createElement(
            Element as any,
            {
              is: Container as any,
              background: "#dbdbdb",
              borderRadius: 14,
              borderWidth: 1,
              borderColor: "#c9c9c9",
              boxShadow: "0 1px 2px rgba(0, 0, 0, 0.08)",
              padding: 18,
              alignItems: "stretch",
              justifyContent: "flex-start",
              gap: 16,
              canvas: true,
            },
            React.createElement(Text as any, {
              text: "Your Order",
              fontSize: 42,
              fontWeight: "700",
              color: "#111111",
              marginBottom: 2,
            }),
            React.createElement(
              Element as any,
              { is: Row as any, canvas: true, gap: 14, alignItems: "center", flexWrap: "wrap" },
              React.createElement(
                Element as any,
                {
                  is: Container as any,
                  width: "92px",
                  height: "92px",
                  background: "#f1f1f1",
                  borderRadius: 10,
                  borderWidth: 1,
                  borderColor: "#b7b7b7",
                  boxShadow: "0 1px 2px rgba(0, 0, 0, 0.12)",
                  padding: 0,
                  justifyContent: "center",
                  alignItems: "center",
                  canvas: true,
                },
                React.createElement(Element as any, {
                  is: Image as any,
                  src: "https://images.unsplash.com/photo-1556228578-8c89e6adf883?auto=format&fit=crop&w=300&q=80",
                  alt: "Product image 1",
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  borderRadius: 10,
                })
              ),
              React.createElement(
                Element as any,
                { is: Column as any, canvas: true, gap: 3, padding: 0 },
                React.createElement(Text as any, { text: "Product Name", fontSize: 26, fontWeight: "600", color: "#111111" }),
                React.createElement(Text as any, { text: "Size: Large     Color: Blue", fontSize: 15, color: "#1f2937" }),
                React.createElement(Text as any, { text: "Quantity: 2", fontSize: 15, color: "#1f2937" })
              ),
              React.createElement(Text as any, { text: "PHP 2,000", fontSize: 34, fontWeight: "700", color: "#111111" })
            ),
            React.createElement(
              Element as any,
              { is: Row as any, canvas: true, gap: 14, alignItems: "center", flexWrap: "wrap" },
              React.createElement(
                Element as any,
                {
                  is: Container as any,
                  width: "92px",
                  height: "92px",
                  background: "#f1f1f1",
                  borderRadius: 10,
                  borderWidth: 1,
                  borderColor: "#b7b7b7",
                  boxShadow: "0 1px 2px rgba(0, 0, 0, 0.12)",
                  padding: 0,
                  justifyContent: "center",
                  alignItems: "center",
                  canvas: true,
                },
                React.createElement(Element as any, {
                  is: Image as any,
                  src: "https://images.unsplash.com/photo-1625772452859-1c03d5bf1137?auto=format&fit=crop&w=300&q=80",
                  alt: "Product image 2",
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  borderRadius: 10,
                })
              ),
              React.createElement(
                Element as any,
                { is: Column as any, canvas: true, gap: 3, padding: 0 },
                React.createElement(Text as any, { text: "Product Name", fontSize: 26, fontWeight: "600", color: "#111111" }),
                React.createElement(Text as any, { text: "Color: Blue", fontSize: 15, color: "#1f2937" }),
                React.createElement(Text as any, { text: "Quantity: 1", fontSize: 15, color: "#1f2937" })
              ),
              React.createElement(Text as any, { text: "PHP 1,000", fontSize: 34, fontWeight: "700", color: "#111111" })
            )
          ),
          React.createElement(
            Element as any,
            {
              is: Container as any,
              background: "#dbdbdb",
              borderRadius: 14,
              borderWidth: 1,
              borderColor: "#c9c9c9",
              boxShadow: "0 1px 2px rgba(0, 0, 0, 0.08)",
              padding: 18,
              alignItems: "stretch",
              justifyContent: "flex-start",
              gap: 10,
              canvas: true,
            },
            React.createElement(Text as any, {
              text: "Payment Details",
              fontSize: 38,
              fontWeight: "700",
              color: "#111111",
              marginBottom: 4,
            }),
            React.createElement(
              Element as any,
              { is: Row as any, canvas: true, justifyContent: "space-between", gap: 8, flexWrap: "wrap" },
              React.createElement(Text as any, { text: "Merchandise Subtotal", fontSize: 27, color: "#111111" }),
              React.createElement(Text as any, { text: "PHP 3,000", fontSize: 27, fontWeight: "600", color: "#111111" })
            ),
            React.createElement(
              Element as any,
              { is: Row as any, canvas: true, justifyContent: "space-between", gap: 8, flexWrap: "wrap" },
              React.createElement(Text as any, { text: "Shipping Subtotal", fontSize: 27, color: "#111111" }),
              React.createElement(Text as any, { text: "PHP 250", fontSize: 27, fontWeight: "600", color: "#111111" })
            ),
            React.createElement(
              Element as any,
              {
                is: Container as any,
                background: "#b9b9b9",
                height: "1px",
                width: "100%",
                padding: 0,
                marginTop: 8,
                marginBottom: 8,
                canvas: true,
              }
            ),
            React.createElement(
              Element as any,
              { is: Row as any, canvas: true, justifyContent: "space-between", gap: 8, flexWrap: "wrap" },
              React.createElement(Text as any, { text: "Total Payment", fontSize: 30, fontWeight: "700", color: "#111111" }),
              React.createElement(Text as any, { text: "PHP 3,250", fontSize: 42, fontWeight: "700", color: "#111111" })
            )
          )
        ),
        React.createElement(
          Element as any,
          { is: Column as any, width: "54%", canvas: true, padding: 0, gap: 11 },
          React.createElement(Text as any, {
            text: "Checkout",
            fontSize: 48,
            fontWeight: "700",
            color: "#111111",
            marginBottom: 2,
          }),
          React.createElement(
            Element as any,
            { is: Row as any, canvas: true, gap: 12, flexWrap: "wrap" },
            React.createElement(
              Element as any,
              {
                is: Container as any,
                background: "#efefef",
                borderWidth: 1,
                borderColor: "#9c9c9c",
                borderRadius: 8,
                padding: 8,
                width: "50%",
                alignItems: "flex-start",
                justifyContent: "flex-start",
                canvas: true,
              },
              React.createElement(Text as any, { text: "First Name", fontSize: 12, color: "#6b7280" }),
              React.createElement(Text as any, { text: "Juan", fontSize: 22, color: "#4b5563" })
            ),
            React.createElement(
              Element as any,
              {
                is: Container as any,
                background: "#efefef",
                borderWidth: 1,
                borderColor: "#9c9c9c",
                borderRadius: 8,
                padding: 8,
                width: "50%",
                alignItems: "flex-start",
                justifyContent: "flex-start",
                canvas: true,
              },
              React.createElement(Text as any, { text: "Last Name", fontSize: 12, color: "#6b7280" }),
              React.createElement(Text as any, { text: "Dela Cruz", fontSize: 22, color: "#4b5563" })
            )
          ),
          React.createElement(
            Element as any,
            { is: Row as any, canvas: true, gap: 12, flexWrap: "wrap" },
            React.createElement(
              Element as any,
              {
                is: Container as any,
                background: "#efefef",
                borderWidth: 1,
                borderColor: "#9c9c9c",
                borderRadius: 8,
                padding: 8,
                width: "92px",
                alignItems: "center",
                justifyContent: "center",
                canvas: true,
              },
              React.createElement(Text as any, { text: "+63", fontSize: 22, color: "#4b5563" })
            ),
            React.createElement(
              Element as any,
              {
                is: Container as any,
                background: "#efefef",
                borderWidth: 1,
                borderColor: "#9c9c9c",
                borderRadius: 8,
                padding: 8,
                width: "calc(100% - 104px)",
                alignItems: "center",
                justifyContent: "center",
                canvas: true,
              },
              React.createElement(Text as any, { text: "Phone Number", fontSize: 22, color: "#6b7280" })
            )
          ),
          React.createElement(
            Element as any,
            {
              is: Container as any,
              background: "#efefef",
              borderWidth: 1,
              borderColor: "#9c9c9c",
              borderRadius: 8,
              padding: 10,
              alignItems: "flex-start",
              justifyContent: "center",
              canvas: true,
            },
            React.createElement(Text as any, { text: "Address Line 1", fontSize: 19, color: "#6b7280" })
          ),
          React.createElement(
            Element as any,
            {
              is: Container as any,
              background: "#efefef",
              borderWidth: 1,
              borderColor: "#9c9c9c",
              borderRadius: 8,
              padding: 10,
              alignItems: "flex-start",
              justifyContent: "center",
              canvas: true,
            },
            React.createElement(Text as any, { text: "Address Line 2", fontSize: 19, color: "#6b7280" })
          ),
          React.createElement(
            Element as any,
            { is: Row as any, canvas: true, gap: 12, flexWrap: "wrap" },
            React.createElement(
              Element as any,
              {
                is: Container as any,
                background: "#efefef",
                borderWidth: 1,
                borderColor: "#9c9c9c",
                borderRadius: 8,
                padding: 10,
                width: "33.33%",
                alignItems: "center",
                justifyContent: "center",
                canvas: true,
              },
              React.createElement(Text as any, { text: "City", fontSize: 20, color: "#6b7280" })
            ),
            React.createElement(
              Element as any,
              {
                is: Container as any,
                background: "#efefef",
                borderWidth: 1,
                borderColor: "#9c9c9c",
                borderRadius: 8,
                padding: 10,
                width: "33.33%",
                alignItems: "center",
                justifyContent: "center",
                canvas: true,
              },
              React.createElement(Text as any, { text: "State", fontSize: 20, color: "#6b7280" })
            ),
            React.createElement(
              Element as any,
              {
                is: Container as any,
                background: "#efefef",
                borderWidth: 1,
                borderColor: "#9c9c9c",
                borderRadius: 8,
                padding: 10,
                width: "33.33%",
                alignItems: "center",
                justifyContent: "center",
                canvas: true,
              },
              React.createElement(Text as any, { text: "Postal Code", fontSize: 20, color: "#6b7280" })
            )
          ),
          React.createElement(Button as any, {
            label: "Place Order",
            backgroundColor: "#000000",
            textColor: "#ffffff",
            fontSize: 38,
            borderRadius: 12,
            width: "100%",
            paddingTop: 14,
            paddingBottom: 14,
            marginTop: 10,
            boxShadow: "0 3px 8px rgba(0, 0, 0, 0.2)",
          })
        )
      )
    )
  ),
  category: "form",
};
