"use client";
import React from "react";
import { BrandLogosBlock } from "./BrandLogosBlock";
import { TemplateEntry } from "../_types";

export const BrandLogos: TemplateEntry = {
  label: "Brand Logos",
  description: "Trust bar with partner/brand logo placeholders",
  preview: "Brands",
  category: "content",
  element: React.createElement(BrandLogosBlock as any, {}),
};
