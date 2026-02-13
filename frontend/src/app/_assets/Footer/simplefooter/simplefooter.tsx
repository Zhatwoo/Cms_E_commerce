"use client";

import React from "react";
import { Element } from "@craftjs/core";
import { Container } from "../../../design/_designComponents/Container/Container";
import { Text } from "../../../design/_designComponents/Text/Text";
import { TemplateEntry } from "../../_types";

export const SimpleFooter: TemplateEntry = {
  label: "Simple Footer",
  description: "Minimal footer with copyright",
  preview: "©",
  element: React.createElement(
    Element as any,
    { is: Container as any, background: "#0f172a", padding: 24, canvas: true },
    React.createElement(Text as any, { text: "© 2026 Company. All rights reserved.", fontSize: 14, color: "#94a3b8" })
  ),
  category: "footer",
};

