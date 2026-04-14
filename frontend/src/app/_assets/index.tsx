"use client";

import React from "react";
import { Element } from "@craftjs/core";
import { SimpleHeader } from "./Header";
import {
  HeaderWithSearch,
  HeaderWithMegamenu,
  ProfileLogin
} from "./Header";
import { CenteredHero, HeroWithImage, HeroBannerCTA, HeroBannerCTA_v2, SplitScreenHero, MinimalTypeHero, VideoStyleHero, CollectionHero } from "./Hero";
import { FeaturesGrid, Testimonial, StatsCounter, NewsletterCTA, ImageText, BrandLogos, CTABanner } from "./Content";
import {
  ProductCard,
  TeamMemberCard,
  GridViewCard,
  ProductDescription,
  FeaturedProduct,
  ProductDescriptionCard,
  CategoriesCard,
   ProductsOverview,
} from "./Cards";
import {
  SimpleFooter,
  StudioFooter,
  MarketplaceFooter,
  DarkCommerceFooter,
  BrutalistFooter,
  NeoFooter,
  SynclyFooter,
  MinimalFooter,
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
  PackageIcon,
  TruckIcon,
  CreditCardIcon,
  TagIcon,
  StoreIcon,
  ReceiptIcon,
  WalletIcon,
  CouponIcon,
  BarcodeIcon,
  ShieldCheckIcon,
  GiftIcon,
  QrCodeIcon,
  BanknoteIcon,
  BoxOpenIcon,
  PackageCheckIcon,
  ScanIcon,
  InventoryIcon,
  WarehouseIcon,
  ReturnIcon,
  RefundIcon,
  LoyaltyIcon,
  VerifiedIcon,
  BoltDealIcon,
  TimerIcon,
  PercentOffIcon,
  TargetDealIcon,
  HeadsetIcon,
  ChatSupportIcon,
  HelpCircleIcon,
  PhoneCallIcon,
  MailSupportIcon,
  DebitCardIcon,
  BankTransferIcon,
  PosTerminalIcon,
  InvoiceIcon,
  CashOnDeliveryIcon,
  DeliveryBikeIcon,
  TrackingIcon,
  ReturnBoxIcon,
  WarehouseShelfIcon,
  PickupPointIcon,
  FilterCommerceIcon,
  SortCommerceIcon,
  CompareIcon,
  WishlistIcon,
  RecentlyViewedIcon,
  MoneyBackIcon,
  VerifiedSellerIcon,
  BestPriceIcon,
  AuthenticProductIcon,
  BundleOfferIcon,
  YouTubeIcon,
  TikTokIcon,
  LinkedInIcon,
  PinterestIcon,
  SnapchatIcon,
  RedditIcon,
  TelegramIcon,
  DiscordIcon,
  WhatsAppIcon,
  TwitchIcon,
  GithubIcon,
  DribbbleIcon,
  BehanceIcon,
  MediumIcon,
  ThreadsIcon,
  LineIcon,
  WeChatIcon,
  ViberIcon,
  SignalIcon,
  MessengerIcon,
  VimeoIcon,
  TumblrIcon,
  XingIcon,
} from "./Icon";
import { Circle as CraftCircle } from "./shapes/circle/circle";
import { Square as CraftSquare } from "./shapes/square/square";
import { Triangle as CraftTriangle } from "./shapes/triangle/triangle";
import { Rectangle as CraftRectangle } from "./shapes/rectangle/rectangle";
import {
  Diamond as CraftDiamond,
  Heart as CraftHeart,
  Trapezoid as CraftTrapezoid,
  Pentagon as CraftPentagon,
  Hexagon as CraftHexagon,
  Heptagon as CraftHeptagon,
  Octagon as CraftOctagon,
  Nonagon as CraftNonagon,
  Decagon as CraftDecagon,
  Parallelogram as CraftParallelogram,
  Kite as CraftKite
} from "./shapes/additional_shapes";

import { TemplateEntry } from "./_types";

export const Circle = ({ width = 60, height = 60 }: { width?: number; height?: number }) => (
  <svg width={width} height={height} viewBox="0 0 60 60">
    <circle cx="30" cy="30" r="28" fill="#10b981" />
  </svg>
);

export const Square = ({ width = 60, height = 60 }: { width?: number; height?: number }) => (
  <svg width={width} height={height} viewBox="0 0 60 60">
    <rect x="4" y="4" width="52" height="52" fill="#e74c3c" />
  </svg>
);

export const Triangle = ({ width = 60, height = 60 }: { width?: number; height?: number }) => (
  <svg width={width} height={height} viewBox="0 0 60 60">
    <polygon points="30,6 54,54 6,54" fill="#3498db" />
  </svg>
);

export const Rectangle = ({ width = 60, height = 40 }: { width?: number; height?: number }) => (
  <svg width={width} height={height} viewBox="0 0 60 40">
    <rect x="4" y="4" width="52" height="32" fill="#8b5cf6" />
  </svg>
);

export const DiamondPreview = (props: any) => (
  <svg width="60" height="60" viewBox="0 0 100 100"><polygon points="50,10 75,50 50,90 25,50" fill="#f43f5e" /></svg>
);
export const HeartPreview = (props: any) => (
  <svg width="60" height="60" viewBox="0 0 100 100"><path d="M50,90 C20,70 5,55 5,35 C5,20 20,10 32,10 C40,10 47,15 50,22 C53,15 60,10 68,10 C80,10 95,20 95,35 C95,55 80,70 50,90 Z" fill="#e11d48" /></svg>
);
export const TrapezoidPreview = (props: any) => (
  <svg width="60" height="60" viewBox="0 0 100 100"><polygon points="25,25 75,25 90,75 10,75" fill="#f59e0b" /></svg>
);
export const PentagonPreview = (props: any) => (
  <svg width="60" height="60" viewBox="0 0 100 100"><polygon points="50,15 85,42 72,78 28,78 15,42" fill="#14b8a6" /></svg>
);
export const HexagonPreview = (props: any) => (
  <svg width="60" height="60" viewBox="0 0 100 100"><polygon points="50,15 80,30 80,70 50,85 20,70 20,30" fill="#6366f1" /></svg>
);
export const HeptagonPreview = (props: any) => (
  <svg width="60" height="60" viewBox="0 0 100 100"><polygon points="50,15 78,25 85,50 72,78 28,78 15,50 22,25" fill="#a855f7" /></svg>
);
export const OctagonPreview = (props: any) => (
  <svg width="60" height="60" viewBox="0 0 100 100"><polygon points="65,15 85,35 85,65 65,85 35,85 15,65 15,35 35,15" fill="#d946ef" /></svg>
);
export const NonagonPreview = (props: any) => (
  <svg width="60" height="60" viewBox="0 0 100 100"><polygon points="50,15 72,21 85,39 81,64 64,80 36,80 19,64 15,39 28,21" fill="#0ea5e9" /></svg>
);
export const DecagonPreview = (props: any) => (
  <svg width="60" height="60" viewBox="0 0 100 100"><polygon points="50,15 68,20 80,35 80,65 68,80 50,85 32,80 20,65 20,35 32,20" fill="#22c55e" /></svg>
);
export const ParallelogramPreview = (props: any) => (
  <svg width="60" height="60" viewBox="0 0 100 100"><polygon points="25,30 85,30 75,70 15,70" fill="#f97316" /></svg>
);
export const KitePreview = (props: any) => (
  <svg width="60" height="60" viewBox="0 0 100 100"><polygon points="50,15 80,40 50,85 20,40" fill="#ef4444" /></svg>
);

export const DiamondTemplate: TemplateEntry = { label: "Diamond", description: "Diamond shape", preview: <DiamondPreview />, element: <Element is={CraftDiamond} canvas />, category: "icon" };
export const HeartTemplate: TemplateEntry = { label: "Heart", description: "Heart shape", preview: <HeartPreview />, element: <Element is={CraftHeart} canvas />, category: "icon" };
export const TrapezoidTemplate: TemplateEntry = { label: "Trapezoid", description: "Trapezoid shape", preview: <TrapezoidPreview />, element: <Element is={CraftTrapezoid} canvas />, category: "icon" };
export const PentagonTemplate: TemplateEntry = { label: "Pentagon", description: "Pentagon shape", preview: <PentagonPreview />, element: <Element is={CraftPentagon} canvas />, category: "icon" };
export const HexagonTemplate: TemplateEntry = { label: "Hexagon", description: "Hexagon shape", preview: <HexagonPreview />, element: <Element is={CraftHexagon} canvas />, category: "icon" };
export const HeptagonTemplate: TemplateEntry = { label: "Heptagon", description: "Heptagon shape", preview: <HeptagonPreview />, element: <Element is={CraftHeptagon} canvas />, category: "icon" };
export const OctagonTemplate: TemplateEntry = { label: "Octagon", description: "Octagon shape", preview: <OctagonPreview />, element: <Element is={CraftOctagon} canvas />, category: "icon" };
export const NonagonTemplate: TemplateEntry = { label: "Nonagon", description: "Nonagon shape", preview: <NonagonPreview />, element: <Element is={CraftNonagon} canvas />, category: "icon" };
export const DecagonTemplate: TemplateEntry = { label: "Decagon", description: "Decagon shape", preview: <DecagonPreview />, element: <Element is={CraftDecagon} canvas />, category: "icon" };
export const ParallelogramTemplate: TemplateEntry = { label: "Parallelogram", description: "Parallelogram shape", preview: <ParallelogramPreview />, element: <Element is={CraftParallelogram} canvas />, category: "icon" };
export const KiteTemplate: TemplateEntry = { label: "Kite", description: "Kite shape", preview: <KitePreview />, element: <Element is={CraftKite} canvas />, category: "icon" };

export const CircleTemplate: TemplateEntry = {
  label: "Circle",
  description: "A simple SVG circle shape.",
  preview: <Circle />,
  element: <Element is={CraftCircle} canvas />, // Draggable Craft.js component
  category: "icon",
};

export const SquareTemplate: TemplateEntry = {
  label: "Square",
  description: "A simple SVG square shape.",
  preview: <Square />,
  element: <Element is={CraftSquare} canvas />, // Draggable Craft.js component
  category: "icon",
};

export const TriangleTemplate: TemplateEntry = {
  label: "Triangle",
  description: "A simple SVG triangle shape.",
  preview: <Triangle />,
  element: <Element is={CraftTriangle} canvas />, // Draggable Craft.js component
  category: "icon",
};

export const RectangleTemplate: TemplateEntry = {
  label: "Rectangle",
  description: "A simple SVG rectangle shape.",
  preview: <Rectangle />,
  element: <Element is={CraftRectangle} canvas />, // Draggable Craft.js component
  category: "icon",
};

export const TEMPLATES: TemplateEntry[] = [
  SimpleHeader,
  HeaderWithSearch,
  HeaderWithMegamenu,
  ProfileLogin,
  CenteredHero,
  HeroWithImage,
  HeroBannerCTA,
  HeroBannerCTA_v2,
  SplitScreenHero,
  MinimalTypeHero,
  VideoStyleHero,
  CollectionHero,
  FeaturesGrid,
  Testimonial,
  StatsCounter,
  NewsletterCTA,
  ImageText,
  BrandLogos,
  CTABanner,
  ProductCard,
  TeamMemberCard,
  ProductsOverview,
  ProductDescriptionCard,
  SimpleFooter,
  StudioFooter,
  MarketplaceFooter,
  DarkCommerceFooter,
  BrutalistFooter,
  NeoFooter,
  SynclyFooter,
  MinimalFooter,
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
  PackageIcon,
  TruckIcon,
  CreditCardIcon,
  TagIcon,
  StoreIcon,
  ReceiptIcon,
  WalletIcon,
  CouponIcon,
  BarcodeIcon,
  ShieldCheckIcon,
  GiftIcon,
  QrCodeIcon,
  BanknoteIcon,
  BoxOpenIcon,
  PackageCheckIcon,
  ScanIcon,
  InventoryIcon,
  WarehouseIcon,
  ReturnIcon,
  RefundIcon,
  LoyaltyIcon,
  VerifiedIcon,
  BoltDealIcon,
  TimerIcon,
  PercentOffIcon,
  TargetDealIcon,
  HeadsetIcon,
  ChatSupportIcon,
  HelpCircleIcon,
  PhoneCallIcon,
  MailSupportIcon,
  DebitCardIcon,
  BankTransferIcon,
  PosTerminalIcon,
  InvoiceIcon,
  CashOnDeliveryIcon,
  DeliveryBikeIcon,
  TrackingIcon,
  ReturnBoxIcon,
  WarehouseShelfIcon,
  PickupPointIcon,
  FilterCommerceIcon,
  SortCommerceIcon,
  CompareIcon,
  WishlistIcon,
  RecentlyViewedIcon,
  MoneyBackIcon,
  VerifiedSellerIcon,
  BestPriceIcon,
  AuthenticProductIcon,
  BundleOfferIcon,
  YouTubeIcon,
  TikTokIcon,
  LinkedInIcon,
  PinterestIcon,
  SnapchatIcon,
  RedditIcon,
  TelegramIcon,
  DiscordIcon,
  WhatsAppIcon,
  TwitchIcon,
  GithubIcon,
  DribbbleIcon,
  BehanceIcon,
  MediumIcon,
  ThreadsIcon,
  LineIcon,
  WeChatIcon,
  ViberIcon,
  SignalIcon,
  MessengerIcon,
  VimeoIcon,
  TumblrIcon,
  XingIcon,
  CircleTemplate,
  SquareTemplate,
  TriangleTemplate,
  RectangleTemplate,
  DiamondTemplate,
  HeartTemplate,
  TrapezoidTemplate,
  PentagonTemplate,
  HexagonTemplate,
  HeptagonTemplate,
  OctagonTemplate,
  NonagonTemplate,
  DecagonTemplate,
  ParallelogramTemplate,
  KiteTemplate,
];

export const GROUPED_TEMPLATES = [
  {
    folder: "Header",
    items: [
      SimpleHeader,
      HeaderWithSearch,
      HeaderWithMegamenu,
      ProfileLogin,
    ],
  },
  {
    folder: "Hero",
    items: [CenteredHero, HeroWithImage, HeroBannerCTA, HeroBannerCTA_v2, SplitScreenHero, MinimalTypeHero, VideoStyleHero, CollectionHero],
  },
  {
    folder: "Content",
    items: [FeaturesGrid, Testimonial, StatsCounter, NewsletterCTA, ImageText, BrandLogos, CTABanner],
  },
  {
    folder: "Cards",
    items: [
      ProductCard,
      ProductDescriptionCard,
      ProductsOverview,
      ProductDescription,
      FeaturedProduct,
      CategoriesCard,
    ],
  },
  {
    folder: "Footer",
    items: [
      SimpleFooter,
      StudioFooter,
      MarketplaceFooter,
      DarkCommerceFooter,
      BrutalistFooter,
      NeoFooter,
      SynclyFooter,
      MinimalFooter,
    ],
  },
  {
    folder: "Icons",
    items: [
      FacebookIcon,
      GoogleIcon,
      InstagramIcon,
      TwitterIcon,
      YouTubeIcon,
      TikTokIcon,
      LinkedInIcon,
      PinterestIcon,
      SnapchatIcon,
      RedditIcon,
      TelegramIcon,
      DiscordIcon,
      WhatsAppIcon,
      MessengerIcon,
      ThreadsIcon,
      LineIcon,
      WeChatIcon,
      ViberIcon,
      SignalIcon,
      TwitchIcon,
      GithubIcon,
      DribbbleIcon,
      BehanceIcon,
      MediumIcon,
      VimeoIcon,
      TumblrIcon,
      XingIcon,
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
      PackageIcon,
      TruckIcon,
      CreditCardIcon,
      TagIcon,
      StoreIcon,
      ReceiptIcon,
      WalletIcon,
      CouponIcon,
      BarcodeIcon,
      ShieldCheckIcon,
      GiftIcon,
      QrCodeIcon,
      BanknoteIcon,
      BoxOpenIcon,
      PackageCheckIcon,
      ScanIcon,
      InventoryIcon,
      WarehouseIcon,
      ReturnIcon,
      RefundIcon,
      LoyaltyIcon,
      VerifiedIcon,
      BoltDealIcon,
      TimerIcon,
      PercentOffIcon,
      TargetDealIcon,
      HeadsetIcon,
      ChatSupportIcon,
      HelpCircleIcon,
      PhoneCallIcon,
      MailSupportIcon,
      DebitCardIcon,
      BankTransferIcon,
      PosTerminalIcon,
      InvoiceIcon,
      CashOnDeliveryIcon,
      DeliveryBikeIcon,
      TrackingIcon,
      ReturnBoxIcon,
      WarehouseShelfIcon,
      PickupPointIcon,
      FilterCommerceIcon,
      SortCommerceIcon,
      CompareIcon,
      WishlistIcon,
      RecentlyViewedIcon,
      MoneyBackIcon,
      VerifiedSellerIcon,
      BestPriceIcon,
      AuthenticProductIcon,
      BundleOfferIcon,
    ],
  },
  {
    folder: "Shapes",
    items: [
      CircleTemplate,
      SquareTemplate,
      TriangleTemplate,
      RectangleTemplate,
      DiamondTemplate,
      HeartTemplate,
      TrapezoidTemplate,
      PentagonTemplate,
      HexagonTemplate,
      HeptagonTemplate,
      OctagonTemplate,
      NonagonTemplate,
      DecagonTemplate,
      ParallelogramTemplate,
      KiteTemplate,
    ],
  },
];