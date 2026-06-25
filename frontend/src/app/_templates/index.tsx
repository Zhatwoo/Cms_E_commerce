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
import { CollectionHeroBlock } from "../_assets/Hero/CollectionHeroBlock";
import { ImageTextBlock } from "../_assets/Content/ImageTextBlock";
import { StatsCounterBlock } from "../_assets/Content/StatsCounterBlock";
import { NewsletterCTABlock } from "../_assets/Content/NewsletterCTABlock";
import { CTABannerBlock } from "../_assets/Content/CTABannerBlock";
import { ProductSlider } from "../design/_designComponents/ProductSlider/ProductSlider";

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

const BeautyCosmeticsLandingPreview = () => (
  <div className="flex aspect-[16/10] w-full flex-col overflow-hidden rounded-xl border border-rose-200 bg-white shadow-sm">
    <div className="relative h-[55%] min-h-[70px] bg-linear-to-br from-rose-100 to-pink-100">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.85),transparent_55%)]" />
      <div className="absolute right-3 top-3 h-10 w-10 rounded-full bg-rose-300/60" />
      <div className="absolute bottom-3 left-3 space-y-1.5">
        <div className="h-2 w-10 rounded-full bg-rose-400/60" />
        <div className="h-3 w-24 rounded-full bg-rose-800/70" />
        <div className="h-3 w-20 rounded-full bg-rose-500/70" />
        <div className="h-2 w-16 rounded-full bg-rose-300/60" />
      </div>
    </div>
    <div className="flex flex-1 gap-1.5 p-2">
      {["🧴","💧","✨","☀️"].map((e,i) => (
        <div key={i} className="flex-1 rounded-lg bg-rose-50 border border-rose-100 flex items-center justify-center text-[10px]">{e}</div>
      ))}
    </div>
  </div>
);

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

const BeautyCosmeticsLandingTemplate: TemplateEntry = {
  label: "Beauty Cosmetics",
  description: "A soft, rose-toned beauty landing page with hero, product categories, promotional banner, and bestsellers grid.",
  preview: <BeautyCosmeticsLandingPreview />,
  category: "landing",
  element: (
    <Element is={Container} canvas background="#fff7f8" padding={0}>
      {HeaderWithSearch.element}
      {React.createElement(CollectionHeroBlock as any, {
        title: "Darling, You Deserve This",
        subtitle: "Soft, feminine beauty rituals for the girl who treats herself. Glow in blush. Flourish in rose.",
        badgeText: "🎀 New Arrivals",
        primaryLabel: "Shop the Edit",
        secondaryLabel: "View Lookbook",
        backgroundImage: "",
        imageOpacity: 0,
        overlayColor: "#fde8f0",
        buttonColor: "#ad1457",
        badgeColor: "#c2185b",
        titleColor: "#4a0e2a",
        subtitleColor: "#880e4f",
        layoutStyle: "image-right",
        minHeight: 560,
        categoryMode: "manual",
        selectedCategories: ["Skincare", "Lip Care", "Blush & Glow", "Perfume"],
      })}
      {React.createElement(ImageTextBlock as any, {
        tagline: "Our Promise",
        heading: "Skincare That Loves You Back",
        description: "Made with nature's finest botanicals — our formulas are dermatologist-tested, cruelty-free, and free from harsh chemicals. Beauty that's as kind to the earth as it is to your skin.",
        feature1: "100% Natural Ingredients",
        feature2: "Dermatologist Tested",
        feature3: "Cruelty Free & Vegan",
        backgroundColor: "#fdf0f3",
        taglineColor: "#c2546b",
        headingColor: "#3d1a26",
        textColor: "#7d4558",
        checkColor: "#e87497",
        layoutStyle: "image-left",
      })}
      {React.createElement(StatsCounterBlock as any, {
        stat1Value: "50K+",
        stat1Label: "Happy Customers",
        stat2Value: "4.9★",
        stat2Label: "Average Rating",
        stat3Value: "200+",
        stat3Label: "Products",
        stat4Value: "100%",
        stat4Label: "Natural",
        backgroundColor: "#3d1a26",
        valueColor: "#f9c4d4",
        labelColor: "#d4899e",
        cardBg: "rgba(255,255,255,0.07)",
        layoutStyle: "row",
      })}
      {React.createElement(ProductSlider as any, {
        title: "Our Bestsellers",
        background: "#fff7f8",
        cardBackground: "#ffffff",
        gap: 18,
        showBadge: true,
        badgeText: "Best Seller",
        badgeColor: "#c2546b",
        buttonLabel: "Add to Cart",
        width: "100%",
        paddingTop: 56,
        paddingBottom: 56,
        paddingLeft: 24,
        paddingRight: 24,
      })}
      {React.createElement(CTABannerBlock as any, {
        heading: "Your Glow-Up Starts Here",
        subheading: "Join our beauty community and get 20% off your first order. Free shipping on all orders.",
        primaryLabel: "Shop Now",
        secondaryLabel: "Learn More",
        gradientFrom: "#d4667e",
        gradientTo: "#e8a4b8",
        headingColor: "#ffffff",
        textColor: "rgba(255,255,255,0.85)",
        primaryButtonColor: "#ffffff",
        primaryButtonTextColor: "#c2546b",
        layoutStyle: "centered",
      })}
      {React.createElement(NewsletterCTABlock as any, {
        heading: "Get Beauty Tips & Exclusive Offers",
        subheading: "Subscribe for weekly skincare tips, early product drops, and 10% off your next purchase.",
        buttonLabel: "Subscribe",
        placeholder: "Your email address",
        backgroundColor: "#fdf0f3",
        cardBg: "#ffffff",
        headingColor: "#3d1a26",
        textColor: "#7d4558",
        buttonColor: "#c2546b",
        inputBg: "#fdf0f3",
        layoutStyle: "split",
      })}
      {MinimalFooter.element}
    </Element>
  ),
};

export const TEMPLATES: TemplateEntry[] = [
  SaaSLandingTemplate,
  BlogLandingTemplate,
  AgencyLandingTemplate,
  ProductLaunchTemplate,
  BeautyCosmeticsLandingTemplate,
];

export const GROUPED_TEMPLATES = [
  {
    folder: "Landing Pages",
    items: [
      AgencyLandingTemplate,
      ProductLaunchTemplate,
      BlogLandingTemplate,
      SaaSLandingTemplate,
      BeautyCosmeticsLandingTemplate,
    ],
  },
];

