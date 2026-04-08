"use client";

import React from "react";
import { Element } from "@craftjs/core";
import { Container } from "../../../design/_designComponents/Container/Container";
import { Row } from "../../../design/_designComponents/Row/Row";
import { Column } from "../../../design/_designComponents/Column/Column";
import { Text } from "../../../design/_designComponents/Text/Text";
import { TemplateEntry } from "../../_types";

function chip(text: string) {
  return React.createElement(
    Element as any,
    {
      is: Container as any,
      background: "#0A0141",
      height: "42px",
      borderWidth: 1,
      borderStyle: "solid",
      borderColor: "#c9c5ff",
      borderRadius: 999,
      paddingTop: 6,
      paddingBottom: 6,
      paddingLeft: 14,
      paddingRight: 14,
      marginBottom: 10,
      width: "154px",
      canvas: true,
      alignItems: "center",
      justifyContent: "center",
    },
    React.createElement(Text as any, {
      text,
      fontSize: 11,
      color: "#f4f3ff",
      fontWeight: "700",
      letterSpacing: 0.3,
    })
  );
}

function menu(text: string) {
  return React.createElement(Text as any, {
    text,
    fontSize: 12,
    color: "#f7f7f7",
    marginBottom: 8,
    lineHeight: 1.35,
  });
}

export const BrutalistFooter: TemplateEntry = {
  label: "Store Footer",
  description: "High-contrast asymmetric footer with editorial blocks",
  preview: "Store",
  element: React.createElement(
    Element as any,
    {
      is: Container as any,
      width: "100%",
      height: "318px",
      background: "#101114",
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
        is: Container as any,
        width: "100%",
        height: "266px",
        background: "#111317",
        paddingTop: 0,
        paddingBottom: 0,
        paddingLeft: 0,
        paddingRight: 0,
        canvas: true,
        alignItems: "stretch",
        justifyContent: "center",
      },
      React.createElement(
        Element as any,
        {
          is: Row as any,
          canvas: true,
          alignItems: "stretch",
          justifyContent: "space-between",
          flexWrap: "nowrap",
          gap: 0,
        },
        React.createElement(
          Element as any,
          {
            is: Column as any,
            width: "42%",
            height: "266px",
            background: "#0A0141",
            paddingTop: 30,
            paddingBottom: 26,
            paddingLeft: 28,
            paddingRight: 26,
            gap: 10,
            canvas: true,
            alignItems: "flex-start",
          },
          React.createElement(Text as any, {
            text: "CENTRIC",
            fontSize: 48,
            color: "#f4f3ff",
            fontWeight: "800",
            lineHeight: 1,
            letterSpacing: 1,
            top: "-3px",
            left: "0px",
            width: "231px",
          }),
          React.createElement(Text as any, {
            text: "STORE",
            fontSize: 48,
            color: "#f4f3ff",
            fontWeight: "800",
            lineHeight: 1,
            letterSpacing: 1,
            marginBottom: 12,
            width: "173px",
          }),
          React.createElement(Text as any, {
            text: "Loud branding. Sharp commerce. Built for statement pages.",
            fontSize: 18,
            color: "#d9d5ff",
            fontWeight: "600",
            lineHeight: 1.4,
            top: "8px",
            left: "2px",
            width: "647px",
          }),
          React.createElement(
            Element as any,
            {
              is: Container as any,
              background: "#0A0141",
              width: "154px",
              height: "42px",
              borderWidth: 1,
              borderStyle: "solid",
              borderColor: "#c9c5ff",
              borderRadius: 999,
              paddingTop: 6,
              paddingBottom: 6,
              paddingLeft: 14,
              paddingRight: 14,
              marginTop: 36.26581096498615,
              marginBottom: 10,
              marginLeft: 0.000033456387174446434,
              canvas: true,
              alignItems: "center",
              justifyContent: "center",
            },
            React.createElement(Text as any, {
              text: "LAUNCH",
              fontSize: 11,
              color: "#f4f3ff",
              fontWeight: "700",
              letterSpacing: 0.3,
            })
          ),
          React.createElement(
            Element as any,
            {
              is: Container as any,
              background: "#0A0141",
              width: "154px",
              height: "42px",
              borderWidth: 1,
              borderStyle: "solid",
              borderColor: "#c9c5ff",
              borderRadius: 999,
              paddingTop: 6,
              paddingBottom: 6,
              paddingLeft: 14,
              paddingRight: 14,
              marginTop: -43.93948397914938,
              marginBottom: 10,
              marginLeft: 375.35105519411,
              canvas: true,
              alignItems: "center",
              justifyContent: "center",
            },
            React.createElement(Text as any, {
              text: "GET TEMPLATE",
              fontSize: 11,
              color: "#f4f3ff",
              fontWeight: "700",
              letterSpacing: 0.3,
            })
          )
        ),
        React.createElement(
          Element as any,
          {
            is: Column as any,
            width: "58%",
            height: "266px",
            background: "#111317",
            paddingTop: 30,
            paddingBottom: 24,
            paddingLeft: 28,
            paddingRight: 30,
            canvas: true,
            alignItems: "stretch",
          },
          React.createElement(
            Element as any,
            {
              is: Row as any,
              canvas: true,
              alignItems: "flex-start",
              justifyContent: "space-between",
              flexWrap: "nowrap",
              gap: 20,
            },
            React.createElement(
              Element as any,
              {
                is: Column as any,
                width: "32%",
                padding: 0,
                gap: 0,
                canvas: true,
                alignItems: "flex-start",
              },
              React.createElement(Text as any, { text: "Shop", fontSize: 12, color: "#0A0141", fontWeight: "700", marginBottom: 10 }),
              menu("New In"),
              menu("Collections"),
              menu("Most Wanted"),
              menu("Gift Cards")
            ),
            React.createElement(
              Element as any,
              {
                is: Column as any,
                width: "32%",
                padding: 0,
                gap: 0,
                canvas: true,
                alignItems: "flex-start",
              },
              React.createElement(Text as any, { text: "Studio", fontSize: 12, color: "#0A0141", fontWeight: "700", marginBottom: 10 }),
              menu("Manifesto"),
              menu("Creators"),
              menu("Journal"),
              menu("Contact")
            ),
            React.createElement(
              Element as any,
              {
                is: Column as any,
                width: "32%",
                padding: 0,
                gap: 0,
                canvas: true,
                alignItems: "flex-start",
              },
              React.createElement(Text as any, { text: "Signal", fontSize: 12, color: "#0A0141", fontWeight: "700", marginBottom: 10 }),
              menu("Instagram"),
              menu("X"),
              menu("Discord"),
              menu("Newsletter")
            )
          ),
          React.createElement(
            Element as any,
            {
              is: Container as any,
              width: "100%",
              height: "56px",
              background: "#0a0b0e",
              borderWidth: 1,
              borderStyle: "solid",
              borderColor: "#2a2d33",
              borderRadius: 6,
              paddingTop: 12,
              paddingBottom: 12,
              paddingLeft: 14,
              paddingRight: 14,
              marginTop: 16,
              canvas: true,
              alignItems: "flex-start",
              justifyContent: "center",
            },
            React.createElement(Text as any, {
              text: "NEWSWIRE: Free shipping over PHP 1,500 - New season drop live now",
              fontSize: 11,
              color: "#d0d3da",
              fontWeight: "600",
            })
          )
        )
      )
    ),
    React.createElement(
      Element as any,
      {
        is: Container as any,
        width: "100%",
        height: "48px",
        background: "#08090c",
        paddingTop: 10,
        paddingBottom: 10,
        paddingLeft: 28,
        paddingRight: 28,
        canvas: true,
        alignItems: "stretch",
        justifyContent: "center",
      },
      React.createElement(
        Element as any,
        {
          is: Row as any,
          canvas: true,
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "nowrap",
        },
        React.createElement(Text as any, {
          text: "© 2026 Centric Store",
          fontSize: 11,
          color: "#a7adb9",
          width: "170px",
          lineHeight: 1.1,
        }),
        React.createElement(
          Element as any,
          {
            is: Row as any,
            canvas: true,
            alignItems: "center",
            justifyContent: "flex-end",
            flexWrap: "nowrap",
            gap: 14,
          },
          React.createElement(Text as any, { text: "Privacy", fontSize: 11, color: "#a7adb9" }),
          React.createElement(Text as any, { text: "Terms", fontSize: 11, color: "#a7adb9" }),
          React.createElement(Text as any, { text: "Cookies", fontSize: 11, color: "#a7adb9" })
        )
      )
    )
  ),
  category: "footer",
};
