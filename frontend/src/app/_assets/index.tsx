"use client";

import React from "react";
import { SimpleHeader, HeaderWithCTA } from "./Header";
import {
  HeaderWithSearch,
  HeaderWithMegamenu,
  MinimalistSaleHeader,
  LuxuryHeader,
  MobileHeader,
  DarkModeHeader
} from "./Header";
import { CenteredHero, HeroWithImage, HeroBannerCTA, HeroBannerCTA_v2, HeroBannerCTA_v3 } from "./Hero";
import { FeaturesGrid, Testimonial } from "./Content";
import { ContactForm, NewsletterSignup, OrderForm, LoginForm, SignupForm, AddToCart, PaymentForm } from "./Forms";
import { ProductCard, TeamMemberCard, GridViewCard, ProductDescription, FeaturedProduct, CategoriesCard, BrowseCategory, } from "./Cards";
import {
  SimpleFooter,
  MultiColumnFooter,
  NewsletterFooter,
  BrandFooter
} from "./Footer";
import {
  FacebookIcon,
  GoogleIcon,
  InstagramIcon,
  TwitterIcon,
  SearchIcon,
  HomeIcon,
  MenuIcon,
  CloseIcon,
  SettingsIcon,
  HeartIcon,
  PlusIcon,
  TrashIcon,
  StarIcon,
  CheckIcon,
  ChevronRightIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  CartIcon,
  ShoppingBagIcon,
  ShoppingBasketIcon,
} from "./Icon";
import { Circle as CraftCircle } from "./shapes/circle/circle";
import { Square as CraftSquare } from "./shapes/square/square";
import { Triangle as CraftTriangle } from "./shapes/triangle/triangle";

import { TemplateEntry } from "./_types";
import { ProductDetailView } from "./Cards/productcard/ProductDetailView";
import { ProductDetailViewV2 } from "./Cards/productcard/ProductDetailViewV2";
import { ProductDetailViewV3 } from "./Cards/productcard/ProductDetailViewV3";


export const Circle = ({ width = 60, height = 60 }: { width?: number; height?: number }) => (
  <svg width={width} height={height} viewBox="0 0 60 60">
    <circle cx="30" cy="30" r="28" fill="#ccc" />
  </svg>
);

export const Square = ({ width = 60, height = 60 }: { width?: number; height?: number }) => (
  <svg width={width} height={height} viewBox="0 0 60 60">
    <rect x="4" y="4" width="52" height="52" fill="#ccc" />
  </svg>
);

export const Triangle = ({ width = 60, height = 60 }: { width?: number; height?: number }) => (
  <svg width={width} height={height} viewBox="0 0 60 60">
    <polygon points="30,6 54,54 6,54" fill="#ccc" />
  </svg>
);

export const CircleTemplate: TemplateEntry = {
  label: "Circle",
  description: "A simple SVG circle shape.",
  preview: <Circle />,
  element: <CraftCircle />, // Draggable Craft.js component
  category: "icon",
};

export const SquareTemplate: TemplateEntry = {
  label: "Square",
  description: "A simple SVG square shape.",
  preview: <Square />,
  element: <CraftSquare />, // Draggable Craft.js component
  category: "icon",
};

export const TriangleTemplate: TemplateEntry = {
  label: "Triangle",
  description: "A simple SVG triangle shape.",
  preview: <Triangle />,
  element: <CraftTriangle />, // Draggable Craft.js component
  category: "icon",
};

export const TEMPLATES: TemplateEntry[] = [
  SimpleHeader,
  HeaderWithCTA,
  HeaderWithSearch,
  HeaderWithMegamenu,
  MinimalistSaleHeader,
  LuxuryHeader,
  MobileHeader,
  DarkModeHeader,
  CenteredHero,
  HeroWithImage,
  HeroBannerCTA,
  HeroBannerCTA_v2,
  HeroBannerCTA_v3,
  FeaturesGrid,
  Testimonial,
  ContactForm,
  NewsletterSignup,
  OrderForm,
  LoginForm,
  SignupForm,
  AddToCart,
  PaymentForm,
  ProductCard,
  TeamMemberCard,
  ProductDetailView,
  ProductDetailViewV2,
  ProductDetailViewV3,
  SimpleFooter,
  MultiColumnFooter,
  NewsletterFooter,
  BrandFooter,
  FacebookIcon,
  GoogleIcon,
  InstagramIcon,
  TwitterIcon,
  SearchIcon,
  HomeIcon,
  MenuIcon,
  CloseIcon,
  SettingsIcon,
  HeartIcon,
  PlusIcon,
  TrashIcon,
  StarIcon,
  CheckIcon,
  ChevronRightIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  CartIcon,
  ShoppingBagIcon,
  ShoppingBasketIcon,
  CircleTemplate,
  SquareTemplate,
  TriangleTemplate,
];

export const GROUPED_TEMPLATES = [
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
      DarkModeHeader,
    ],
  },
  {
    folder: "Hero",
    items: [CenteredHero, HeroWithImage, HeroBannerCTA, HeroBannerCTA_v2, HeroBannerCTA_v3],
  },
  {
    folder: "Content",
    items: [FeaturesGrid, Testimonial],
  },
  {
    folder: "Cards",
<<<<<<< HEAD
<<<<<<< HEAD
    items: [ProductCard, TeamMemberCard, GridViewCard, ProductDescription, FeaturedProduct, CategoriesCard, BrowseCategory],
=======
    items: [ProductCard, TeamMemberCard, GridViewCard, ProductDescription, FeaturedProduct, ProductDetailView, ProductDetailViewV2, ProductDetailViewV3],

>>>>>>> 3d3f007950958881bbec405bbbdf0c797d7ba6a4
=======
    items: [ProductCard, TeamMemberCard, GridViewCard, ProductDescription, FeaturedProduct, CategoriesCard, BrowseCategory],
>>>>>>> 4ae7803615d78b8d8f5eb9c176c2e07f63e62421
  },
  {
    folder: "Forms",
    items: [ContactForm, NewsletterSignup, OrderForm, LoginForm, SignupForm, AddToCart, PaymentForm],
  },
  {
    folder: "Footer",
    items: [
      MultiColumnFooter,
      SimpleFooter,
      NewsletterFooter,
      BrandFooter,
    ],
  },
  {
    folder: "Icons",
    items: [
      FacebookIcon,
      GoogleIcon,
      InstagramIcon,
      TwitterIcon,
      SearchIcon,
      HomeIcon,
      MenuIcon,
      CloseIcon,
      SettingsIcon,
      HeartIcon,
      PlusIcon,
      TrashIcon,
      StarIcon,
      CheckIcon,
      ChevronRightIcon,
      ArrowLeftIcon,
      ArrowRightIcon,
      CartIcon,
      ShoppingBagIcon,
      ShoppingBasketIcon,
    ],
  },
  {
    folder: "Shapes",
    items: [CircleTemplate, SquareTemplate, TriangleTemplate],
  },
];
