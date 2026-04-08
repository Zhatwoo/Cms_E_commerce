"use client";

import React from "react";
import { Element } from "@craftjs/core";
import { Container } from "../../../design/_designComponents/Container/Container";
import { Row } from "../../../design/_designComponents/Row/Row";
import { Column } from "../../../design/_designComponents/Column/Column";
import { Text } from "../../../design/_designComponents/Text/Text";
import { TemplateEntry } from "../../_types";

function link(text: string) {
  return React.createElement(Text as any, {
    text,
    fontSize: 11,
    color: "#1f2125",
    marginBottom: 8,
    lineHeight: 1.35,
  });
}

function socialBadge(text: string) {
  return React.createElement(
    Element as any,
    {
      is: Container as any,
      width: "36px",
      height: "36px",
      background: "transparent",
      borderWidth: 1,
      borderColor: "#c8ccd3",
      borderStyle: "solid",
      borderRadius: 999,
      padding: 0,
      canvas: true,
      alignItems: "center",
      justifyContent: "center",
    },
    React.createElement(Text as any, {
      text,
      fontSize: 16,
      color: "#14161a",
      fontWeight: "600",
      lineHeight: 1,
    })
  );
}

export const CentricFooter: TemplateEntry = {
  label: "Centric Footer",
  description: "Light editorial footer with link columns and social row",
  preview: "Centric",
  element: React.createElement(
    Element as any,
    {
      is: Container as any,
      width: "100%",
      background: "#e9eaed",
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
        background: "#e5e6e8",
        paddingTop: 18,
        paddingBottom: 16,
        paddingLeft: 24,
        paddingRight: 24,
        canvas: true,
        alignItems: "stretch",
        justifyContent: "center",
      },
      React.createElement(
        Element as any,
        {
          is: Row as any,
          canvas: true,
          gap: 22,
          flexWrap: "nowrap",
          alignItems: "flex-start",
          justifyContent: "space-between",
        },
        React.createElement(
          Element as any,
          {
            is: Column as any,
            width: "30%",
            padding: 0,
            gap: 8,
            canvas: true,
            alignItems: "flex-start",
          },
          React.createElement(
            Element as any,
            {
              is: Row as any,
              canvas: true,
              gap: 10,
              flexWrap: "nowrap",
              alignItems: "center",
              justifyContent: "flex-start",
            },
            React.createElement(
              Element as any,
              {
                is: Container as any,
                width: "82px",
                height: "72px",
                background: "#2d2f35",
                borderRadius: 1,
                padding: 0,
                canvas: true,
                alignItems: "center",
                justifyContent: "center",
              },
              React.createElement(Text as any, {
                text: "Image",
                fontSize: 14,
                color: "#ffffff",
                fontWeight: "600",
              })
            ),
            React.createElement(Text as any, {
              text: "Centric",
              fontSize: 12,
              color: "#1f2125",
              fontWeight: "500",
            })
          ),
          React.createElement(Text as any, {
            text: "Hassle Free Drag-Drop E-Commerce",
            fontSize: 11,
            color: "#202226",
            marginTop: 2,
          }),
          React.createElement(
            Element as any,
            {
              is: Row as any,
              canvas: true,
              gap: 12,
              flexWrap: "nowrap",
              alignItems: "center",
              justifyContent: "flex-start",
            },
            socialBadge("X"),
            socialBadge("IG"),
            socialBadge("f")
          )
        ),
        React.createElement(
          Element as any,
          {
            is: Column as any,
            width: "24%",
            padding: 0,
            gap: 0,
            canvas: true,
            alignItems: "flex-start",
          },
          React.createElement(Text as any, {
            text: "Product",
            fontSize: 11,
            color: "#1f2125",
            fontWeight: "600",
            marginBottom: 10,
          }),
          link("Headless CMS New"),
          link("Pricing"),
          link("GraphQL APIs"),
          link("Open source Starter-kit"),
          React.createElement(Text as any, {
            text: "Explore",
            fontSize: 11,
            color: "#1f2125",
            fontWeight: "600",
            marginBottom: 10,
            marginTop: 8,
          }),
          link("My feed"),
          link("Case studies"),
          link("Hashnode AI"),
          link("Referral Program")
        ),
        React.createElement(
          Element as any,
          {
            is: Column as any,
            width: "24%",
            padding: 0,
            gap: 0,
            canvas: true,
            alignItems: "flex-start",
          },
          React.createElement(Text as any, {
            text: "Company",
            fontSize: 11,
            color: "#1f2125",
            fontWeight: "600",
            marginBottom: 10,
          }),
          link("About Hashnode"),
          link("Careers"),
          link("Logos and media"),
          link("Changelog"),
          link("Feature Requests"),
          React.createElement(Text as any, {
            text: "Blogs",
            fontSize: 11,
            color: "#1f2125",
            fontWeight: "600",
            marginBottom: 10,
            marginTop: 8,
          }),
          link("Official Blog"),
          link("Engineering Blog"),
          link("Hashnode Townhall")
        ),
        React.createElement(
          Element as any,
          {
            is: Column as any,
            width: "18%",
            padding: 0,
            gap: 0,
            canvas: true,
            alignItems: "flex-start",
          },
          React.createElement(Text as any, {
            text: "Partner with us",
            fontSize: 11,
            color: "#1f2125",
            fontWeight: "600",
            marginBottom: 10,
          }),
          link("Host a Hackathon"),
          React.createElement(Text as any, {
            text: "Support",
            fontSize: 11,
            color: "#1f2125",
            fontWeight: "600",
            marginBottom: 10,
            marginTop: 8,
          }),
          link("Support docs"),
          link("Contact"),
          link("Join discord")
        )
      )
    ),
    React.createElement(
      Element as any,
      {
        is: Container as any,
        width: "100%",
        background: "#dadddf",
        paddingTop: 10,
        paddingBottom: 10,
        paddingLeft: 24,
        paddingRight: 24,
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
          gap: 16,
        },
        React.createElement(Text as any, {
          text: "© 2026 Centric",
          fontSize: 11,
          color: "#1f2125",
          width: "160px",
        }),
        React.createElement(
          Element as any,
          {
            is: Row as any,
            canvas: true,
            alignItems: "center",
            justifyContent: "flex-end",
            flexWrap: "nowrap",
            gap: 18,
          },
          React.createElement(Text as any, { text: "Privacy Policy", fontSize: 11, color: "#1f2125" }),
          React.createElement(Text as any, { text: "Terms", fontSize: 11, color: "#1f2125" }),
          React.createElement(Text as any, { text: "Code of Conduct", fontSize: 11, color: "#1f2125" })
        )
      )
    )
  ),
  category: "footer",
};