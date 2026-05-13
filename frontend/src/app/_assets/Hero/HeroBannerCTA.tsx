"use client";

import React from "react";
import { HeroBannerCTABlock } from "./HeroBannerCTABlock";
import { TemplateEntry } from "../_types";

export const HeroBannerCTA: TemplateEntry = {
  label: "Hero Banner CTA",
  description: "Classic gray hero banner with title and navigation",
  preview: "🎞️ Hero",
  category: "hero",
  element: React.createElement(HeroBannerCTABlock as any, {}),
};