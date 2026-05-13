"use client";

import React from "react";
import { CenteredHeroBlock } from "./CenteredHeroBlock";
import { TemplateEntry } from "../_types";

export const CenteredHero: TemplateEntry = {
  label: "Centered Hero",
  description: "Hero section with centered content",
  preview: "Hero",
  category: "hero",
  element: React.createElement(CenteredHeroBlock as any, {}),
};