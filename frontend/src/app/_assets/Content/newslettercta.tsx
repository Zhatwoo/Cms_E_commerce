"use client";
import React from "react";
import { NewsletterCTABlock } from "./NewsletterCTABlock";
import { TemplateEntry } from "../_types";

export const NewsletterCTA: TemplateEntry = {
  label: "Newsletter CTA",
  description: "Email signup section with input field",
  preview: "Newsletter",
  category: "content",
  element: React.createElement(NewsletterCTABlock as any, {}),
};
