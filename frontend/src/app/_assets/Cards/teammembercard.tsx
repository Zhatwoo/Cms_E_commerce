"use client";

import React from "react";
import { Element } from "@craftjs/core";
import { Container } from "../../design/_designComponents/Container/Container";
import { Text } from "../../design/_designComponents/Text/Text";
import { TemplateEntry } from "../_types";

export const TeamMemberCard: TemplateEntry = {
  label: "Team Member Card",
  description: "Profile card for team members",
  preview: "👥",
  element: React.createElement(
    Element as any,
    { is: Container as any, background: "#ffffff", padding: 24, maxWidth: "280px", canvas: true },
    React.createElement(
      Element as any,
      { is: Container as any, background: "#3b82f6", width: 80, height: 80, canvas: true },
      React.createElement(Text as any, { text: "JD", fontSize: 24, color: "#ffffff" })
    ),
    React.createElement(Text as any, { text: "John Doe", fontSize: 20, fontWeight: "bold", color: "#1e293b" }),
    React.createElement(Text as any, { text: "Web Developer", fontSize: 14, color: "#64748b" }),
    React.createElement(Text as any, { text: "Passionate about creating beautiful websites.", fontSize: 13, color: "#94a3b8" })
  ),
  category: "card",
};
