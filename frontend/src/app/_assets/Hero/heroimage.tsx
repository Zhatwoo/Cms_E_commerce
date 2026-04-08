"use client";

import React from "react";
import { HeroWithImageBlock } from "./HeroWithImageBlock";
import { TemplateEntry } from "../_types";

export const HeroWithImage: TemplateEntry = {
  label: "Hero with Image",
  description: "Hero with text and image placeholder",
  preview: "📷 Hero",
  category: "hero",
  element: React.createElement(HeroWithImageBlock as any, {}),
};