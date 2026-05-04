"use client";
import React from "react";
import { TestimonialBlock } from "./TestimonialBlock";
import { TemplateEntry } from "../_types";

export const Testimonial: TemplateEntry = {
  label: "Testimonial",
  description: "Customer testimonial with quote",
  preview: "💬",
  category: "content",
  element: React.createElement(TestimonialBlock as any, {}),
};
