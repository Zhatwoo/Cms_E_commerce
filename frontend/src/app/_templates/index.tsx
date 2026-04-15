"use client";

import React from "react";
import { Element } from "@craftjs/core";
import { TemplateEntry } from "../_assets/_types";
import { SimpleEcommerceHeader } from "../_assets/Header";
import { HeroWithImage } from "../_assets/Hero";
import { BrandLogos, CTABanner, NewsletterCTA } from "../_assets/Content";
import { ProductsOverview } from "../_assets/Cards";
import { SimpleFooter } from "../_assets/Footer";
import { Container } from "../design/_designComponents/Container/Container";

const EcommerceLandingPreview = () => (
  <div className="flex h-full flex-col justify-between rounded-xl border border-slate-200 bg-white p-3 text-[10px] text-slate-600 shadow-sm">
    <div className="h-2.5 w-14 rounded-full bg-slate-200" />
    <div className="space-y-2 mt-3 flex-1">
      <div className="h-3 rounded-full bg-slate-200 w-5/6" />
      <div className="h-3 rounded-full bg-slate-200 w-4/6" />
      <div className="h-3 rounded-full bg-slate-200 w-3/6" />
    </div>
    <div className="flex gap-2 items-center mt-3">
      <div className="h-3 w-20 rounded-full bg-slate-200" />
      <div className="h-3 w-12 rounded-full bg-slate-200" />
    </div>
  </div>
);

const EcommerceLandingTemplate: TemplateEntry = {
  label: "E-commerce Landing",
  description: "A simple e-commerce landing page layout built from pre-built header, hero, product showcase, CTAs, and footer blocks.",
  preview: <EcommerceLandingPreview />,
  category: "landing",
  element: (
    <Element is={Container} canvas background="#ffffff" padding={0}>
      {SimpleEcommerceHeader.element}
      {HeroWithImage.element}
      {BrandLogos.element}
      {ProductsOverview.element}
      {CTABanner.element}
      {NewsletterCTA.element}
      {SimpleFooter.element}
    </Element>
  ),
};

export const TEMPLATES: TemplateEntry[] = [
  EcommerceLandingTemplate,
];

export const GROUPED_TEMPLATES = [
  {
    folder: "E-commerce",
    items: [EcommerceLandingTemplate],
  },
];
