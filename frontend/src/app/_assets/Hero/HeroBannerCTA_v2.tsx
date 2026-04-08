"use client";

import React from "react";
import { HeroBannerCTA_v2Block } from "./HeroBannerCTA_v2Block";
import { TemplateEntry } from "../_types";

export const HeroBannerCTA_v2: TemplateEntry = {
  label: "Hero Banner CTA v2",
  description: "Elegant centered hero with serif typography",
  preview: "🎞️ Hero v2",
  category: "hero",
  element: React.createElement(HeroBannerCTA_v2Block as any, {}),
};