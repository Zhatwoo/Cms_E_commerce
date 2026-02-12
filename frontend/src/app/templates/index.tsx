"use client";

import React from "react";
import { SimpleHeader, HeaderWithCTA } from "./Header";
import { 
  SimpleEcommerceHeader, 
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

import { ProductListing } from "./Ecommerce/ProductListing/ProductListing";
import { ProductDetails } from "./Ecommerce/ProductDetails/ProductDetails";
import { CategoryLayout } from "./Ecommerce/CategoryLayout/CategoryLayout";
import { CheckoutForm } from "./Ecommerce/CheckoutForm/CheckoutForm";
import { CartLayout } from "./Ecommerce/CartLayout/CartLayout";
import { OrderTrackingLayout } from "./Ecommerce/OrderTrackingLayout/OrderTrackingLayout";

import { TemplateEntry } from "./_types";

export const TEMPLATES: TemplateEntry[] = [
  SimpleHeader,
  HeaderWithCTA,
  SimpleEcommerceHeader,
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
    folder: "Ecommerce",
    items: [
      {
        label: "Product Listing",
        description: "Grid of product cards",
        element: React.createElement(ProductListing),
        preview: "PL",
      },
      {
        label: "Product Details",
        description: "Detailed product view",
        element: React.createElement(ProductDetails),
        preview: "PD",
      },
      {
        label: "Category Listing",
        description: "Product listing with header, filters, sort & pagination",
        element: React.createElement(CategoryLayout),
        preview: "CL",
      },
      {
        label: "Checkout Form",
        description: "Complete checkout form with order summary",
        element: React.createElement(CheckoutForm),
        preview: "CO",
      },
      {
        label: "Cart",
        description: "Shopping cart with item list and order summary",
        element: React.createElement(CartLayout),
        preview: "🛒",
      },
      {
        label: "Order Tracking",
        description: "Order tracking with status timeline, shipping & carrier info",
        element: React.createElement(OrderTrackingLayout),
        preview: "📦",
      },
    ],
  },
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
      SimpleEcommerceHeader,
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