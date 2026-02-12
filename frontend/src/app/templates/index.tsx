"use client";

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
import { SimpleFooter, MultiColumnFooter } from "./Footer";

import { ProductListing } from "./Ecommerce/ProductListing/ProductListing";
import { ProductDetails } from "./Ecommerce/ProductDetails/ProductDetails";
import { CategoryLayout } from "./Ecommerce/CategoryLayout/CategoryLayout";
import { CheckoutForm } from "./Ecommerce/CheckoutForm/CheckoutForm";

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
];

export const GROUPED_TEMPLATES = [
  {
    folder: "Ecommerce",
    items: [
      ProductListing,
      ProductDetails,
      CategoryLayout,
      CheckoutForm,
    ],
  },
  {
    folder: "Footer",
    items: [MultiColumnFooter, SimpleFooter],
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