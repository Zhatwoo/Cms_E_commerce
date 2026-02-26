"use client";

import React from "react";
import { Element } from "@craftjs/core";
import { Container } from "../../design/_designComponents/Container/Container";
import { Text } from "../../design/_designComponents/Text/Text";
import { Button } from "../../design/_designComponents/Button/Button";
import { Row } from "../../design/_designComponents/Row/Row";
import { Column } from "../../design/_designComponents/Column/Column";
import { Section } from "../../design/_designComponents/Section/Section";
import { TemplateEntry } from "../_types";

function inputBox(label: string, value: string, width = "100%") {
  return React.createElement(
    Element as any,
    {
      is: Column as any,
      width,
      padding: 0,
      gap: 4,
      canvas: true,
      alignItems: "stretch",
    },
    React.createElement(Text as any, {
      text: label,
      fontSize: 12,
      color: "#6b7280",
    }),
    React.createElement(
      Element as any,
      {
        is: Container as any,
        background: "#f5f5f5",
        borderWidth: 1,
        borderColor: "#a3a3a3",
        borderStyle: "solid",
        borderRadius: 7,
        width: "100%",
        paddingTop: 9,
        paddingBottom: 9,
        paddingLeft: 12,
        paddingRight: 12,
        canvas: true,
        alignItems: "flex-start",
        justifyContent: "center",
      },
      React.createElement(Text as any, {
        text: value,
        fontSize: 14,
        color: "#6b7280",
      })
    )
  );
}

export const DeliveryAddressV1: TemplateEntry = {
  label: "Delivery Address V1",
  description: "New address form with region and default address toggle",
  preview: "Address V1",
  element: React.createElement(
    Element as any,
    { is: Section as any, background: "#e6e6e6", padding: 20, canvas: true },
    React.createElement(
      Element as any,
      {
        is: Container as any,
        maxWidth: "620px",
        width: "100%",
        background: "#e6e6e6",
        padding: 0,
        canvas: true,
        alignItems: "stretch",
        justifyContent: "flex-start",
      },
      React.createElement(Text as any, {
        text: "New Address",
        fontSize: 42,
        fontWeight: "700",
        color: "#111111",
        marginBottom: 14,
      }),
      React.createElement(
        Element as any,
        { is: Row as any, canvas: true, gap: 10, flexWrap: "nowrap", alignItems: "flex-start", marginBottom: 10 },
        inputBox("Full Name", "juandelacruz@gmail.com", "50%"),
        inputBox("Phone Number", "+63    9123456789", "50%")
      ),
      React.createElement(
        Element as any,
        { is: Column as any, canvas: true, padding: 0, gap: 4, alignItems: "stretch", marginBottom: 10 },
        React.createElement(Text as any, {
          text: "Region",
          fontSize: 12,
          color: "#6b7280",
        }),
        React.createElement(
          Element as any,
          {
            is: Container as any,
            background: "#f5f5f5",
            borderWidth: 1,
            borderColor: "#a3a3a3",
            borderStyle: "solid",
            borderRadius: 7,
            width: "100%",
            paddingTop: 9,
            paddingBottom: 9,
            paddingLeft: 12,
            paddingRight: 12,
            canvas: true,
            alignItems: "stretch",
            justifyContent: "center",
          },
          React.createElement(
            Element as any,
            { is: Row as any, canvas: true, alignItems: "center", justifyContent: "space-between", flexWrap: "nowrap" },
            React.createElement(Text as any, {
              text: "Region, Province, City, Barangay",
              fontSize: 14,
              color: "#6b7280",
            }),
            React.createElement(Text as any, {
              text: "v",
              fontSize: 16,
              color: "#6b7280",
            })
          )
        )
      ),
      React.createElement(
        Element as any,
        { is: Column as any, canvas: true, padding: 0, gap: 10, alignItems: "stretch" },
        inputBox("Postal Code", "Postal Code"),
        inputBox("Street Name, Building, House No.", "Street Name, Building, House No.")
      ),
      React.createElement(
        Element as any,
        { is: Row as any, canvas: true, alignItems: "center", gap: 8, marginTop: 14, marginBottom: 14, flexWrap: "nowrap" },
        React.createElement(
          Element as any,
          {
            is: Container as any,
            width: "14px",
            height: "14px",
            background: "transparent",
            borderWidth: 1,
            borderColor: "#8d8d8d",
            borderStyle: "solid",
            borderRadius: 2,
            padding: 0,
            canvas: true,
          }
        ),
        React.createElement(Text as any, {
          text: "Set As Default Address",
          fontSize: 14,
          color: "#6b7280",
        })
      ),
      React.createElement(Button as any, {
        label: "Save",
        width: "100%",
        backgroundColor: "#000000",
        textColor: "#ffffff",
        fontSize: 32,
        borderRadius: 7,
        paddingTop: 10,
        paddingBottom: 10,
      })
    )
  ),
  category: "content",
};
