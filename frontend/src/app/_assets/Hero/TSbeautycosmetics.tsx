"use client";

import React from "react";
import { BeautyCosmeticsLandingBlock } from "./BeautyCosmeticsLandingBlock";
import { TemplateEntry } from "../_types";

export const BeautyCosmeticsLanding: TemplateEntry = {
  label: "Beauty Cosmetics",
  description: "A soft, rose-toned beauty landing page with hero, product categories, promotional banner, and bestsellers grid.",
  preview: "🌸",
  category: "landing",
  element: React.createElement(BeautyCosmeticsLandingBlock as any, {}),
};
