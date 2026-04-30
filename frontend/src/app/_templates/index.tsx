"use client";

import React from "react";
import Image from "next/image";
import { Element } from "@craftjs/core";
import { TemplateEntry } from "../_assets/_types";
import { HeaderWithSearch, SimpleHeader } from "../_assets/Header";
import { HeroWithImage, CenteredHero, SplitScreenHero, VideoStyleHero } from "../_assets/Hero";
import { BrandLogos, CTABanner, NewsletterCTA, FeaturesGrid, Testimonial, StatsCounter, ImageText } from "../_assets/Content";
import { ProductsOverview, CategoriesCard, TeamMemberCard } from "../_assets/Cards";
import { DarkCommerceFooter, MinimalFooter } from "../_assets/Footer";
import { Container } from "../design/_designComponents/Container/Container";

const AssetPreviewFrame = ({ src, alt, accent }: { src: string; alt: string; accent: string }) => (
  <div className="relative aspect-[16/10] w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
    <Image src={src} alt={alt} fill className="object-cover" unoptimized />
    <div className={`absolute inset-x-0 bottom-0 bg-linear-to-t ${accent} to-transparent p-3`}>
      <div className="h-2 w-16 rounded-full bg-white/80" />
    </div>
  </div>
);

const SaaSLandingPreview = () => (
  <AssetPreviewFrame src="/images/template-saas.jpg" alt="SaaS landing page preview" accent="from-blue-900/70" />
);

const BlogLandingPreview = () => (
  <div className="flex aspect-[16/10] w-full flex-col overflow-hidden rounded-xl border border-amber-200 bg-white shadow-sm">
    <div className="relative h-[58%] min-h-[74px] bg-linear-to-br from-amber-100 to-rose-100">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.9),transparent_60%)]" />
      <div className="absolute left-3 top-3 rounded-full bg-white/90 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-amber-700 shadow-sm">
        Blog
      </div>
      <div className="absolute bottom-3 left-3 right-3 space-y-1.5">
        <div className="h-2.5 w-20 rounded-full bg-white/85" />
        <div className="h-2.5 w-5/6 rounded-full bg-white/70" />
      </div>
    </div>
    <div className="flex flex-1 flex-col gap-1.5 p-3 text-[10px] text-amber-700">
      <div className="h-2.5 w-4/5 rounded-full bg-amber-100" />
      <div className="h-2.5 w-3/5 rounded-full bg-amber-100" />
      <div className="mt-1 h-8 rounded-lg bg-amber-50" />
    </div>
  </div>
);

const AgencyLandingPreview = () => (
  <AssetPreviewFrame src="/images/template-portfolio.jpg" alt="Agency portfolio preview" accent="from-purple-900/70" />
);

const ProductLaunchPreview = () => (
  <AssetPreviewFrame src="/images/template-fashion.jpg" alt="Product launch preview" accent="from-emerald-900/70" />
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
  {
    folder: "Landing Pages",
    items: [
      AgencyLandingTemplate,
      ProductLaunchTemplate,
      BlogLandingTemplate,
      SaaSLandingTemplate,
    ],
  },
];
