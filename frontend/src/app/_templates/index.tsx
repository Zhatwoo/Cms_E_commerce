"use client";

import React from "react";
import { Element } from "@craftjs/core";
import { TemplateEntry } from "../_assets/_types";
import { HeaderWithSearch, SimpleHeader } from "../_assets/Header";
import { HeroWithImage, CenteredHero, SplitScreenHero, VideoStyleHero } from "../_assets/Hero";
import { BrandLogos, CTABanner, NewsletterCTA, FeaturesGrid, Testimonial, StatsCounter, ImageText } from "../_assets/Content";
import { ProductsOverview, CategoriesCard, TeamMemberCard } from "../_assets/Cards";
import { DarkCommerceFooter, MinimalFooter } from "../_assets/Footer";
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

// REMOVED: EcommerceLandingTemplate - had rendering issues

const SaaSLandingPreview = () => (
  <div className="flex h-full flex-col justify-between rounded-xl border border-blue-200 bg-gradient-to-br from-blue-50 to-white p-3 text-[10px] text-blue-600 shadow-sm">
    <div className="h-2 w-16 rounded-full bg-blue-300" />
    <div className="space-y-2 mt-2">
      <div className="h-2.5 rounded-full bg-blue-200 w-full" />
      <div className="h-2.5 rounded-full bg-blue-200 w-5/6" />
    </div>
    <div className="flex gap-1 mt-2">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="h-1.5 w-8 rounded bg-blue-200" />
      ))}
    </div>
  </div>
);

const BlogLandingPreview = () => (
  <div className="flex h-full flex-col justify-between rounded-xl border border-amber-200 bg-gradient-to-br from-amber-50 to-white p-3 text-[10px] text-amber-600 shadow-sm">
    <div className="h-2 w-14 rounded-full bg-amber-300" />
    <div className="space-y-1.5 mt-2 flex-1">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="h-1.5 rounded-full bg-amber-200 w-full" />
      ))}
    </div>
    <div className="h-12 w-full rounded bg-amber-100 mt-2" />
  </div>
);

const AgencyLandingPreview = () => (
  <div className="flex h-full flex-col justify-between rounded-xl border border-purple-200 bg-gradient-to-br from-purple-50 to-white p-3 text-[10px] text-purple-600 shadow-sm">
    <div className="h-2 w-20 rounded-full bg-purple-300" />
    <div className="grid grid-cols-3 gap-1 mt-2 flex-1">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="h-4 w-full rounded bg-purple-200" />
      ))}
    </div>
  </div>
);

const ProductLaunchPreview = () => (
  <div className="flex h-full flex-col justify-between rounded-xl border border-green-200 bg-gradient-to-br from-green-50 to-white p-3 text-[10px] text-green-600 shadow-sm">
    <div className="h-3 w-24 rounded-full bg-green-300" />
    <div className="h-full bg-green-100 rounded mt-2 mb-2" />
    <div className="h-2 w-12 rounded-full bg-green-200" />
  </div>
);

// REMOVED: EcommerceLandingTemplate - had rendering issues

const SaaSLandingTemplate: TemplateEntry = {
  label: "SaaS Landing",
  description: "A modern SaaS landing page with header, value proposition, features, testimonials, stats, and call-to-action.",
  preview: <SaaSLandingPreview />,
  category: "landing",
  element: (
    <Element is={Container} canvas background="#ffffff" padding={0}>
      {SimpleHeader.element}
      {CenteredHero.element}
      {FeaturesGrid.element}
      {StatsCounter.element}
      {Testimonial.element}
      {CTABanner.element}
      {MinimalFooter.element}
    </Element>
  ),
};

const BlogLandingTemplate: TemplateEntry = {
  label: "Blog Landing",
  description: "A content-focused blog landing page with header, featured content, newsletter signup, and footer.",
  preview: <BlogLandingPreview />,
  category: "landing",
  element: (
    <Element is={Container} canvas background="#ffffff" padding={0}>
      {SimpleHeader.element}
      {ImageText.element}
      {NewsletterCTA.element}
      {MinimalFooter.element}
    </Element>
  ),
};

const AgencyLandingTemplate: TemplateEntry = {
  label: "Agency/Portfolio",
  description: "A professional agency and portfolio page with header, hero, team showcase, case studies, and footer.",
  preview: <AgencyLandingPreview />,
  category: "landing",
  element: (
    <Element is={Container} canvas background="#ffffff" padding={0}>
      {HeaderWithSearch.element}
      {SplitScreenHero.element}
      {FeaturesGrid.element}
      {BrandLogos.element}
      {CTABanner.element}
      {DarkCommerceFooter.element}
    </Element>
  ),
};

const ProductLaunchTemplate: TemplateEntry = {
  label: "Product Launch",
  description: "A product-focused launch page with hero, highlights, benefits breakdown, testimonials, and conversion CTA.",
  preview: <ProductLaunchPreview />,
  category: "landing",
  element: (
    <Element is={Container} canvas background="#ffffff" padding={0}>
      {SimpleHeader.element}
      {VideoStyleHero.element}
      {ImageText.element}
      {Testimonial.element}
      {CTABanner.element}
      {MinimalFooter.element}
    </Element>
  ),
};

export const TEMPLATES: TemplateEntry[] = [
  SaaSLandingTemplate,
  BlogLandingTemplate,
  AgencyLandingTemplate,
  ProductLaunchTemplate,
];

export const GROUPED_TEMPLATES = [
  // Intentionally empty: prebuilt template cards are disabled.
];
