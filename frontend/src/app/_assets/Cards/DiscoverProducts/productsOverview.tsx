"use client";

import React from "react";
import { ProductSlider } from "../../../design/_designComponents/ProductSlider/ProductSlider";
import { TemplateEntry } from "../../_types";

export const ProductsOverview: TemplateEntry = {
  label: "Product Slider",
  description: "Displays your products in a horizontal scrollable slider",
  preview: "🛍️",
  category: "card",
  element: React.createElement(ProductSlider as any, {
    title: "Our Products",
    background: "#f9fafb",
    cardBackground: "#ffffff",
    gap: 18,
    showBadge: false,
    badgeText: "Sale",
    badgeColor: "#1e293b",
    buttonLabel: "Add to Cart",
    width: "100%",
    paddingTop: 48,
    paddingBottom: 48,
    paddingLeft: 24,
    paddingRight: 24,
  }),
};
