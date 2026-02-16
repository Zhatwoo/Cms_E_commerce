"use client";

import React from "react";
import { Element } from "@craftjs/core";
import { Container } from "../../../design/_designComponents/Container/Container";
import { Text } from "../../../design/_designComponents/Text/Text";
import { Image } from "../../../design/_designComponents/Image/Image";
import { TemplateEntry } from "../../_types";

export const TeamMemberCard: TemplateEntry = {
  label: "Team Member Card",
  description: "Profile card for team members",
  preview: "👥",
  element: React.createElement(
    Element as any,
    { 
      is: Container as any, 
      background: "#ffffff", 
      padding: 24,
      maxWidth: "300px",
      borderRadius: 12,
      boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
      borderWidth: 1,
      borderColor: "#e5e7eb",
      borderStyle: "solid",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: 16,
      canvas: true 
    },
    React.createElement(Element as any, { 
      is: Image as any, 
      src: "",
      alt: "Team Member Avatar",
      width: "100px",
      height: "100px",
      objectFit: "cover",
      borderRadius: 50,
      allowUpload: true
    }),
    React.createElement(Text as any, { text: "John Doe", fontSize: 20, fontWeight: "bold", color: "#1e293b" }),
    React.createElement(Text as any, { text: "Web Developer", fontSize: 14, fontWeight: "600", color: "#3b82f6" }),
    React.createElement(Text as any, { text: "Passionate about creating beautiful websites.", fontSize: 13, color: "#64748b" })
  ),
  category: "card",
};
