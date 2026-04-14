"use client";

import React from "react";
import { CollectionHeroBlock } from "./CollectionHeroBlock";
import { TemplateEntry } from "../_types";

export const CollectionHero: TemplateEntry = {
  label: "Collection Hero",
  description: "E-commerce collection banner with sale badge and category tags",
  preview: "Sale",
  category: "hero",
  element: React.createElement(CollectionHeroBlock as any, {}),
};
