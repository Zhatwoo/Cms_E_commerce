"use client";

import React from "react";
import { ProductCard as ProductCardComponent } from "../../../design/_designComponents/ProductCard/ProductCard";
import { TemplateEntry } from "../../_types";

export const ProductCard: TemplateEntry = {
  label: "Product Card",
  description: "Bind a product and display it as a card",
  preview: "Card",
  category: "card",
  element: React.createElement(ProductCardComponent as any, {}),
};
