"use client";

import React from "react";
import { SplitScreenHeroBlock } from "./SplitScreenHeroBlock";
import { TemplateEntry } from "../_types";

export const SplitScreenHero: TemplateEntry = {
  label: "Split Screen Hero",
  description: "Bold split-screen hero with dark content panel",
  preview: "Split",
  category: "hero",
  element: React.createElement(SplitScreenHeroBlock as any, {}),
};
