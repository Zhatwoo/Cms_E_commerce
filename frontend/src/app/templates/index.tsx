"use client";

import { SimpleHeader, HeaderWithCTA } from "./Header";
import { CenteredHero, HeroWithImage } from "./Hero";
import { FeaturesGrid, Testimonial } from "./Content";
import { ContactForm, NewsletterSignup } from "./Forms";
import { ProductCard, TeamMemberCard } from "./Cards";
import { SimpleFooter, MultiColumnFooter } from "./Footer";

import { ProductListing } from "./Ecommerce/ProductListing/ProductListing";
import { ProductDetails } from "./Ecommerce/ProductDetails/ProductDetails";

import { TemplateEntry } from "./_types";

export const TEMPLATES: TemplateEntry[] = [
  SimpleHeader,
  HeaderWithCTA,
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
];

export const GROUPED_TEMPLATES = [
  {
    folder: "Ecommerce",
    items: [
      {
        label: "Product Listing",
        description: "Grid of product cards",
        element: <ProductListing />,
        preview: "PL",
      },
      {
        label: "Product Details",
        description: "Detailed product view",
        element: <ProductDetails />,
        preview: "PD",
      },
    ],
  },
  {
    folder: "Footer",
    items: [MultiColumnFooter, SimpleFooter],
  },
  {
    folder: "Header",
    items: [SimpleHeader, HeaderWithCTA],
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