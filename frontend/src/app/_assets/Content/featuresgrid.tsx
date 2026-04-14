"use client";
import React from "react";
import { FeaturesGridBlock } from "./FeaturesGridBlock";
import { TemplateEntry } from "../_types";

export const FeaturesGrid: TemplateEntry = {
  label: "Features Grid",
  description: "3-column features section",
  preview: "Grid",
  category: "content",
  element: React.createElement(FeaturesGridBlock as any, {}),
};
