"use client";

import React from "react";
import { Element } from "@craftjs/core";
import { Container } from "../../../design/_designComponents/Container/Container";
import { Text } from "../../../design/_designComponents/Text/Text";
import { Image } from "../../../design/_designComponents/Image/Image";
import { Section } from "../../../design/_designComponents/Section/Section";
import { TemplateEntry } from "../../_types";

export const TeamMemberCard: TemplateEntry = {
  label: "Team Member Card",
  description: "Profile card for team members",
  preview: "👥",
  category: "card",
  element: React.createElement(
    Element as any,
    {
      is: Section as any,
      canvas: true,
      background: "#f1f5f9",
      width: "100%",
      minHeight: "100vh",
      padding: 12,
      flexDirection: "column",
      justifyContent: "center",
      alignItems: "center",
    },

    React.createElement(
      Element as any,
      {
        is: Container as any,
        canvas: true,
        background: "#ffffff",
        width: "min(100%, 300px)",
        flexShrink: 0,
        paddingTop: 32,
        paddingBottom: 32,
        paddingLeft: 24,
        paddingRight: 24,
        borderRadius: 12,
        boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
        borderWidth: 1,
        borderColor: "#e5e7eb",
        borderStyle: "solid",
        flexDirection: "column",
        alignItems: "center",
        gap: 12,
      },

      // Avatar
      React.createElement(Image as any, {
        src: "",
        alt: "Team Member Avatar",
        width: "100px",
        height: "100px",
        objectFit: "cover",
        borderRadius: 50,
        allowUpload: true,
      }),

      // Name
      React.createElement(Text as any, {
        text: "John Doe",
        fontSize: 20,
        fontWeight: "700",
        color: "#1e293b",
        textAlign: "center",
      }),

      // Role
      React.createElement(Text as any, {
        text: "Web Developer",
        fontSize: 14,
        fontWeight: "600",
        color: "#3b82f6",
        textAlign: "center",
      }),

      // Bio
      React.createElement(Text as any, {
        text: "Passionate about creating beautiful websites.",
        fontSize: 13,
        fontWeight: "400",
        color: "#64748b",
        textAlign: "center",
        lineHeight: 1.6,
      })
    )
  ),
};