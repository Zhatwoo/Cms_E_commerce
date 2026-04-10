"use client";

import React from "react";
import { MinimalTypeHeroBlock } from "./MinimalTypeHeroBlock";
import { TemplateEntry } from "../_types";

export const MinimalTypeHero: TemplateEntry = {
  label: "Minimal Type Hero",
  description: "Clean typography-focused hero with elegant serif font",
  preview: "Minimal",
  category: "hero",
  element: React.createElement(MinimalTypeHeroBlock as any, {}),
};
