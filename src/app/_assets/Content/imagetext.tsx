"use client";
import React from "react";
import { ImageTextBlock } from "./ImageTextBlock";
import { TemplateEntry } from "../_types";

export const ImageText: TemplateEntry = {
  label: "Image + Text",
  description: "Side-by-side image and text content section",
  preview: "ImgTxt",
  category: "content",
  element: React.createElement(ImageTextBlock as any, {}),
};
