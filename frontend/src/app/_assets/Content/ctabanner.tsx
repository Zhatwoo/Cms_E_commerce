"use client";
import React from "react";
import { CTABannerBlock } from "./CTABannerBlock";
import { TemplateEntry } from "../_types";

export const CTABanner: TemplateEntry = {
  label: "CTA Banner",
  description: "Full-width call-to-action banner with gradient",
  preview: "CTA",
  category: "content",
  element: React.createElement(CTABannerBlock as any, {}),
};
