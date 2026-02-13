"use client";

import React from "react";
import { SimpleHeader, HeaderWithCTA } from "./Header";
import {
  HeaderWithSearch,
  HeaderWithMegamenu,
  MinimalistSaleHeader,
  LuxuryHeader,
  MobileHeader,
  HeaderWithChips,
  DarkModeHeader
} from "./Header";
import { CenteredHero, HeroWithImage } from "./Hero";
import { FeaturesGrid, Testimonial } from "./Content";
import { ContactForm, NewsletterSignup } from "./Forms";
import { ProductCard, TeamMemberCard } from "./Cards";
import {
  SimpleFooter,
  MultiColumnFooter,
  NewsletterFooter,
  TrustFooter,
  CheckoutFooter,
  BrandFooter
} from "./Footer";

import { TemplateEntry } from "./_types";

export const TEMPLATES: TemplateEntry[] = [
  SimpleHeader,
  HeaderWithCTA,
  HeaderWithSearch,
  HeaderWithMegamenu,
  MinimalistSaleHeader,
  LuxuryHeader,
  MobileHeader,
  HeaderWithChips,
  DarkModeHeader,
  CenteredHero,
  HeroWithImage,
  FeaturesGrid,
  Testimonial,
  ContactForm,
  NewsletterSignup,
  ProductCard,
  TeamMemberCard,
  SimpleFooter,
  MultiColumnFooter,
  NewsletterFooter,
  TrustFooter,
  CheckoutFooter,
  BrandFooter,
];

export const GROUPED_TEMPLATES = [
  {
    folder: "Footer",
    items: [
      MultiColumnFooter,
      SimpleFooter,
      NewsletterFooter,
      TrustFooter,
      CheckoutFooter,
      BrandFooter,
    ],
  },
  {
    folder: "Header",
    items: [
      SimpleHeader,
      HeaderWithCTA,
      HeaderWithSearch,
      HeaderWithMegamenu,
      MinimalistSaleHeader,
      LuxuryHeader,
      MobileHeader,
      HeaderWithChips,
      DarkModeHeader,
    ],
  },
  {
    folder: "Hero",
    items: [CenteredHero, HeroWithImage],
  },
  {
    folder: "Content",
    items: [FeaturesGrid, Testimonial],
  },
  {
    folder: "Forms",
    items: [ContactForm, NewsletterSignup],
  },
  {
    folder: "Cards",
    items: [ProductCard, TeamMemberCard],
  },
];