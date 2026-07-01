"use client";

import React from "react";
import { ProductDescriptionCard as ProductDescriptionCardComponent } from "../../../design/_designComponents/ProductDescriptionCard/ProductDescriptionCard";
import { TemplateEntry } from "../../_types";

export const ProductDescriptionCard: TemplateEntry = {
  label: "Product Description Card",
  description: "Bind a product and display its full description with image and CTA",
  preview: "FP",
  category: "card",
  element: React.createElement(ProductDescriptionCardComponent as any, {}),
};
