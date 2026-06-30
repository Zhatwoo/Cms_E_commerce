"use client";

import React from "react";
import Image from "next/image";
import { Element } from "@craftjs/core";
import { TemplateEntry } from "../_assets/_types";
import { HeaderWithSearch, SimpleHeader } from "../_assets/Header";
import { HeroWithImage, CenteredHero, SplitScreenHero, VideoStyleHero } from "../_assets/Hero";
import { BrandLogos, CTABanner, NewsletterCTA, FeaturesGrid, Testimonial, StatsCounter, ImageText } from "../_assets/Content";
import { ProductsOverview, CategoriesCard, TeamMemberCard, ProductDescription, FeaturedProduct } from "../_assets/Cards";
import { DarkCommerceFooter, MinimalFooter } from "../_assets/Footer";
import { Container } from "../design/_designComponents/Container/Container";
import { CollectionHeroBlock } from "../_assets/Hero/CollectionHeroBlock";
import { ImageTextBlock } from "../_assets/Content/ImageTextBlock";
import { StatsCounterBlock } from "../_assets/Content/StatsCounterBlock";
import { NewsletterCTABlock } from "../_assets/Content/NewsletterCTABlock";
import { CTABannerBlock } from "../_assets/Content/CTABannerBlock";
import { FeaturesGridBlock } from "../_assets/Content/FeaturesGridBlock";
import { TestimonialBlock } from "../_assets/Content/TestimonialBlock";
import { HeroBannerCTABlock } from "../_assets/Hero/HeroBannerCTABlock";
import { MinimalTypeHeroBlock } from "../_assets/Hero/MinimalTypeHeroBlock";
import { FeaturedProductCanvas } from "../_assets/Cards/FeaturedProduct/FeaturedProduct";
import { ProductDescriptionCanvas } from "../_assets/Cards/ProductDescription/ProductDescription";
import { ProductSlider } from "../design/_designComponents/ProductSlider/ProductSlider";

// ─── Icon imports ─────────────────────────────────────────────────────────────
import { Truck } from "../_assets/Icon/Truck/Truck";
import { ShieldCheck } from "../_assets/Icon/ShieldCheck/ShieldCheck";
import { Headset } from "../_assets/Icon/Headset/Headset";
import { Return } from "../_assets/Icon/Return/Return";
import { Gift } from "../_assets/Icon/Gift/Gift";
import { Tag } from "../_assets/Icon/Tag/Tag";
import { Star } from "../_assets/Icon/Star/Star";
import { BoltDeal } from "../_assets/Icon/BoltDeal/BoltDeal";
import { Timer } from "../_assets/Icon/Timer/Timer";
import { PercentOff } from "../_assets/Icon/PercentOff/PercentOff";
import { Coupon } from "../_assets/Icon/Coupon/Coupon";
import { CreditCard } from "../_assets/Icon/CreditCard/CreditCard";
import { PackageCheck } from "../_assets/Icon/PackageCheck/PackageCheck";
import { ShoppingBag } from "../_assets/Icon/ShoppingBag/ShoppingBag";
import { Verified } from "../_assets/Icon/Verified/Verified";
import { Heart } from "../_assets/Icon/Heart/Heart";
import { Package } from "../_assets/Icon/Package/Package";
import { Loyalty } from "../_assets/Icon/Loyalty/Loyalty";
import { TargetDeal } from "../_assets/Icon/TargetDeal/TargetDeal";
import { Bell } from "../_assets/Icon/Bell/Bell";
import { Receipt } from "../_assets/Icon/Receipt/Receipt";

// ─── Shared mini-UI atoms ────────────────────────────────────────────────────

/** Reusable pill badge for preview cards */
const PreviewBadge = ({ label, bg, text }: { label: string; bg: string; text: string }) => (
  <div className={`rounded-full px-2 py-0.5 text-[7px] font-bold uppercase tracking-widest`} style={{ background: bg, color: text }}>
    {label}
  </div>
);

/** A small icon wrapper sized for preview cards */
const PIcon = ({ children, bg, color }: { children: React.ReactNode; bg: string; color: string }) => (
  <div className="flex h-5 w-5 items-center justify-center rounded" style={{ background: bg, color }}>
    {children}
  </div>
);

// ─── Asset image preview frame ────────────────────────────────────────────────
const AssetPreviewFrame = ({ src, alt, accent }: { src: string; alt: string; accent: string }) => (
  <div className="relative aspect-[16/10] w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
    <Image src={src} alt={alt} fill className="object-cover" unoptimized />
    <div className={`absolute inset-x-0 bottom-0 bg-linear-to-t ${accent} to-transparent p-3`}>
      <div className="h-2 w-16 rounded-full bg-white/80" />
    </div>
  </div>
);

// ─── SaaS Landing Preview ─────────────────────────────────────────────────────
const SaaSLandingPreview = () => (
  <AssetPreviewFrame src="/images/template-saas.jpg" alt="SaaS landing page preview" accent="from-blue-900/70" />
);

// ─── Blog Landing Preview ─────────────────────────────────────────────────────
const BlogLandingPreview = () => (
  <div className="flex aspect-[16/10] w-full flex-col overflow-hidden rounded-xl border border-amber-200 bg-white shadow-sm">
    {/* Nav */}
    <div className="flex items-center gap-2 border-b border-amber-100 bg-white px-3 py-1.5">
      <div className="h-1.5 w-12 rounded-full bg-amber-800/50" />
      <div className="ml-auto flex gap-1.5">
        {["w-6","w-5","w-5"].map((w,i) => <div key={i} className={`h-1.5 ${w} rounded-full bg-amber-400/40`} />)}
      </div>
    </div>
    {/* Hero */}
    <div className="relative h-[52%] min-h-[66px] bg-gradient-to-br from-amber-50 to-rose-100">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.92),transparent_65%)]" />
      <div className="absolute left-3 top-3">
        <div className="rounded-full bg-amber-600 px-2 py-0.5 text-[7px] font-bold uppercase tracking-widest text-white">Blog</div>
      </div>
      <div className="absolute bottom-3 left-3 right-3 space-y-1.5">
        <div className="h-3 w-5/6 rounded-sm bg-amber-900/80" />
        <div className="h-2.5 w-3/4 rounded-sm bg-amber-800/60" />
        <div className="h-2 w-20 rounded-full bg-amber-500/50" />
      </div>
    </div>
    {/* Feature strip */}
    <div className="flex items-center justify-around border-b border-amber-100 bg-amber-50 py-1 px-2">
      {[
        { Icon: Bell, label: "Subscribe" },
        { Icon: Heart, label: "Favorites" },
        { Icon: Receipt, label: "Read More" },
      ].map(({ Icon, label }, i) => (
        <div key={i} className="flex items-center gap-0.5">
          <div style={{ color: "#b45309" }}><Icon size={7} /></div>
          <span className="text-[6px] font-medium text-amber-700">{label}</span>
        </div>
      ))}
    </div>
    {/* Content cards */}
    <div className="flex flex-1 gap-1.5 p-2">
      {[0,1,2].map(i => (
        <div key={i} className="flex-1 rounded-lg bg-amber-50 border border-amber-100 flex flex-col p-1 gap-0.5">
          <div className="h-1.5 w-full rounded-full bg-amber-200" />
          <div className="h-1.5 w-4/5 rounded-full bg-amber-200" />
          <div className="mt-auto h-2.5 w-full rounded bg-amber-700" />
        </div>
      ))}
    </div>
  </div>
);

// ─── Agency/Portfolio Preview ─────────────────────────────────────────────────
const AgencyLandingPreview = () => (
  <AssetPreviewFrame src="/images/template-portfolio.jpg" alt="Agency portfolio preview" accent="from-purple-900/70" />
);

// ─── Product Launch Preview ───────────────────────────────────────────────────
const ProductLaunchPreview = () => (
  <div className="flex aspect-[16/10] w-full flex-col overflow-hidden rounded-xl border border-violet-300 bg-[#0f0a1e] shadow-sm">
    {/* Nav */}
    <div className="flex items-center gap-2 border-b border-violet-900/60 bg-[#0f0a1e] px-3 py-1.5">
      <div className="h-1.5 w-14 rounded-full bg-violet-300/60" />
      <div className="ml-auto flex gap-2">
        {["w-6","w-5","w-4"].map((w,i) => <div key={i} className={`h-1.5 ${w} rounded-full bg-violet-700/60`} />)}
      </div>
    </div>
    {/* Hero */}
    <div className="relative h-[40%] bg-gradient-to-br from-[#1a0f3a] to-[#2d1f5e] overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(139,92,246,0.45),transparent_60%)]" />
      <div className="absolute left-3 top-3">
        <div className="rounded-full bg-violet-500/80 px-2 py-0.5 text-[7px] font-bold uppercase tracking-widest text-white">Now Live</div>
      </div>
      <div className="absolute bottom-3 left-3 space-y-1.5">
        <div className="h-3 w-28 rounded-sm bg-white/90" />
        <div className="h-2 w-20 rounded-sm bg-violet-300/70" />
        <div className="mt-1 h-5 w-16 rounded-lg bg-violet-500" />
      </div>
      <div className="absolute bottom-3 right-3 flex gap-1">
        {[ShoppingBag, PackageCheck, Star].map((Icon, i) => (
          <div key={i} className="h-8 w-8 rounded-lg bg-white/10 flex items-center justify-center" style={{ color: "#c4b5fd" }}>
            <Icon size={10} />
          </div>
        ))}
      </div>
    </div>
    {/* Stats bar */}
    <div className="flex items-center justify-around bg-violet-900/40 py-1 px-2 border-y border-violet-800/40">
      {["10K+","4.9★","98%","24h"].map((v,i) => (
        <div key={i} className="text-center">
          <div className="text-[8px] font-black text-violet-200">{v}</div>
          <div className="h-1 w-8 rounded-full bg-violet-700/60 mt-0.5" />
        </div>
      ))}
    </div>
    {/* Feature cards */}
    <div className="flex flex-1 gap-1.5 p-2">
      {[
        { Icon: Star, label: "Premium" },
        { Icon: Tag, label: "Exclusive" },
        { Icon: BoltDeal, label: "Launch Deal" },
      ].map(({ Icon, label }, i) => (
        <div key={i} className="flex-1 rounded-lg bg-violet-900/40 border border-violet-700/40 flex flex-col items-center justify-center gap-1 py-1">
          <div style={{ color: "#a78bfa" }}><Icon size={10} /></div>
          <div className="h-1.5 w-10 rounded-full bg-violet-700/60" />
        </div>
      ))}
    </div>
  </div>
);

// ─── Flash Sale Preview ───────────────────────────────────────────────────────
const FlashSaleLandingPreview = () => (
  <div className="flex aspect-[16/10] w-full flex-col overflow-hidden rounded-xl border border-orange-400 bg-[#0d0402] shadow-sm">
    {/* Nav */}
    <div className="flex items-center gap-2 border-b border-red-900/60 bg-[#0d0402] px-3 py-1.5">
      <div className="h-1.5 w-12 rounded-full bg-orange-300/60" />
      <div className="ml-auto flex gap-1.5">
        {["w-6","w-5"].map((w,i) => <div key={i} className={`h-1.5 ${w} rounded-full bg-orange-700/50`} />)}
        <div className="h-4 w-4 rounded bg-orange-500 flex items-center justify-center" style={{ color: "#fff" }}>
          <ShoppingBag size={8} />
        </div>
      </div>
    </div>
    {/* Hero */}
    <div className="relative h-[42%] bg-gradient-to-br from-red-700 to-orange-600 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(255,200,0,0.30),transparent_55%)]" />
      <div className="absolute left-3 top-3 flex items-center gap-1">
        <div className="rounded-full bg-yellow-400 px-2 py-0.5 text-[7px] font-black uppercase tracking-widest text-red-900 flex items-center gap-0.5">
          <BoltDeal size={7} /> Flash Sale
        </div>
        <div className="rounded-full bg-white/20 px-1.5 py-0.5 text-[6px] font-bold text-white flex items-center gap-0.5">
          <Timer size={6} /> 24h Only
        </div>
      </div>
      <div className="absolute bottom-3 left-3 space-y-1">
        <div className="h-3.5 w-32 rounded-sm bg-white/95" />
        <div className="h-2 w-24 rounded-sm bg-orange-200/80" />
        <div className="mt-1 flex gap-1">
          <div className="h-5 w-14 rounded-lg bg-yellow-400" />
          <div className="h-5 w-12 rounded-lg bg-white/20" />
        </div>
      </div>
      <div className="absolute right-3 top-1/2 -translate-y-1/2 flex flex-col items-center">
        <div className="text-[7px] font-black text-white/80">UP TO</div>
        <div className="text-[22px] font-black text-yellow-300 leading-none">70%</div>
        <div className="text-[7px] font-black text-white/80">OFF</div>
      </div>
    </div>
    {/* Trust bar */}
    <div className="flex items-center justify-around bg-red-900/50 border-y border-red-800/40 py-1 px-2">
      {[
        { Icon: Truck, label: "Free Ship" },
        { Icon: ShieldCheck, label: "Secure" },
        { Icon: Return, label: "30-Day" },
      ].map(({ Icon, label }, i) => (
        <div key={i} className="flex items-center gap-0.5">
          <div style={{ color: "#fca5a5" }}><Icon size={7} /></div>
          <span className="text-[6px] font-medium text-orange-200">{label}</span>
        </div>
      ))}
    </div>
    {/* Deal cards */}
    <div className="grid grid-cols-3 gap-1 p-2 flex-1">
      {[
        { Icon: PercentOff, label: "70% OFF" },
        { Icon: BoltDeal, label: "Flash" },
        { Icon: Tag, label: "Deals" },
      ].map(({ Icon, label }, i) => (
        <div key={i} className="rounded-lg bg-orange-900/40 border border-orange-700/40 flex flex-col items-center justify-center gap-0.5 py-1">
          <div style={{ color: "#fb923c" }}><Icon size={10} /></div>
          <div className="text-[6px] font-bold text-orange-300">{label}</div>
        </div>
      ))}
    </div>
  </div>
);

// ─── Promo/Voucher Preview ────────────────────────────────────────────────────
const PromoVoucherLandingPreview = () => (
  <div className="flex aspect-[16/10] w-full flex-col overflow-hidden rounded-xl border border-emerald-300 bg-white shadow-sm">
    {/* Nav */}
    <div className="flex items-center gap-2 border-b border-emerald-100 bg-white px-3 py-1.5">
      <div className="h-1.5 w-12 rounded-full bg-emerald-700/50" />
      <div className="ml-auto flex gap-1.5">
        {["w-6","w-5"].map((w,i) => <div key={i} className={`h-1.5 ${w} rounded-full bg-emerald-300/60`} />)}
      </div>
    </div>
    {/* Hero */}
    <div className="relative h-[48%] min-h-[60px] bg-gradient-to-br from-emerald-600 to-teal-500 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.18),transparent_60%)]" />
      {/* Voucher card */}
      <div className="absolute right-3 top-1/2 -translate-y-1/2 flex flex-col items-center">
        <div className="w-16 rounded-lg border-2 border-dashed border-white/60 bg-white/15 px-1 py-2 text-center">
          <div style={{ color: "rgba(255,255,255,0.70)" }} className="flex justify-center mb-0.5"><Coupon size={10} /></div>
          <div className="text-[6px] font-bold uppercase tracking-wider text-white/70">Promo Code</div>
          <div className="mt-0.5 h-2.5 w-12 rounded bg-yellow-300/90" />
        </div>
      </div>
      <div className="absolute bottom-3 left-3 space-y-1">
        <div className="flex items-center gap-1">
          <div className="rounded-full bg-yellow-400 px-1.5 py-0.5 text-[7px] font-black text-emerald-900 flex items-center gap-0.5">
            <Loyalty size={7} /> Voucher
          </div>
        </div>
        <div className="h-3 w-28 rounded-sm bg-white/90" />
        <div className="h-2 w-20 rounded-sm bg-emerald-200/70" />
        <div className="mt-0.5 h-5 w-16 rounded-lg bg-yellow-400" />
      </div>
    </div>
    {/* Feature cards */}
    <div className="flex flex-1 gap-1.5 p-2">
      {[
        { Icon: Gift, color: "#059669" },
        { Icon: CreditCard, color: "#0d9488" },
        { Icon: Tag, color: "#059669" },
        { Icon: Verified, color: "#0d9488" },
      ].map(({ Icon, color }, i) => (
        <div key={i} className="flex-1 rounded-lg bg-emerald-50 border border-emerald-200 flex flex-col items-center justify-center gap-0.5 py-1">
          <div style={{ color }}><Icon size={10} /></div>
          <div className="h-1.5 w-8 rounded-full bg-emerald-300" />
        </div>
      ))}
    </div>
  </div>
);

// ─── Beauty Cosmetics Preview ─────────────────────────────────────────────────
const BeautyCosmeticsLandingPreview = () => (
  <div className="flex aspect-[16/10] w-full flex-col overflow-hidden rounded-xl border border-rose-200 bg-white shadow-sm">
    {/* Nav */}
    <div className="flex items-center gap-2 border-b border-rose-100 bg-white px-3 py-1.5">
      <div className="h-1.5 w-14 rounded-full bg-rose-700/50" />
      <div className="ml-auto flex gap-1.5">
        {["w-6","w-5"].map((w,i) => <div key={i} className={`h-1.5 ${w} rounded-full bg-rose-300/50`} />)}
        <div className="h-4 w-4 rounded-full bg-rose-200 flex items-center justify-center" style={{ color: "#be185d" }}>
          <Heart size={8} />
        </div>
      </div>
    </div>
    {/* Hero */}
    <div className="relative h-[48%] min-h-[60px] bg-gradient-to-br from-rose-100 to-pink-100 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.88),transparent_55%)]" />
      {/* Decorative circles */}
      <div className="absolute right-4 top-3 h-9 w-9 rounded-full bg-rose-300/50 border border-rose-300/60" />
      <div className="absolute right-7 top-8 h-5 w-5 rounded-full bg-pink-200/70 border border-pink-300/50" />
      <div className="absolute bottom-3 left-3 space-y-1.5">
        <div className="flex items-center gap-1">
          <div className="rounded-full bg-rose-600 px-1.5 py-0.5 text-[6px] font-bold text-white">New Arrivals</div>
        </div>
        <div className="h-3 w-24 rounded-sm bg-rose-900/75" />
        <div className="h-2.5 w-20 rounded-sm bg-rose-700/65" />
        <div className="h-2 w-16 rounded-full bg-rose-400/50" />
      </div>
    </div>
    {/* Trust bar */}
    <div className="flex items-center justify-around bg-rose-50 border-y border-rose-100 py-1 px-2">
      {[
        { Icon: Verified, label: "Natural" },
        { Icon: ShieldCheck, label: "Tested" },
        { Icon: Heart, label: "Cruelty-Free" },
      ].map(({ Icon, label }, i) => (
        <div key={i} className="flex items-center gap-0.5">
          <div style={{ color: "#be185d" }}><Icon size={7} /></div>
          <span className="text-[6px] font-medium text-rose-600">{label}</span>
        </div>
      ))}
    </div>
    {/* Product cards */}
    <div className="flex flex-1 gap-1.5 p-2">
      {[
        { Icon: Star, color: "#be185d" },
        { Icon: Heart, color: "#db2777" },
        { Icon: Gift, color: "#be185d" },
        { Icon: Verified, color: "#ec4899" },
      ].map(({ Icon, color }, i) => (
        <div key={i} className="flex-1 rounded-lg bg-rose-50 border border-rose-100 flex flex-col items-center justify-between p-1 gap-0.5">
          <div style={{ color }}><Icon size={10} /></div>
          <div className="h-1.5 w-8 rounded-full bg-rose-200" />
          <div className="h-2.5 w-full rounded bg-rose-600" />
        </div>
      ))}
    </div>
  </div>
);

// ─── Electronics Store Preview ────────────────────────────────────────────────
const ElectronicsStoreLandingPreview = () => (
  <div className="flex aspect-[16/10] w-full flex-col overflow-hidden rounded-xl border border-neutral-700 bg-neutral-900 shadow-sm">
    {/* Header */}
    <div className="flex items-center gap-1.5 border-b border-neutral-700 bg-neutral-950 px-3 py-1.5">
      <div className="h-2 w-2 rounded-full bg-green-500" />
      <div className="h-1.5 w-10 rounded-full bg-neutral-600" />
      <div className="ml-auto flex gap-1.5 items-center">
        {["w-6","w-5","w-5"].map((w,i) => <div key={i} className={`h-1.5 ${w} rounded-full bg-neutral-600`} />)}
        <div className="h-4 w-4 rounded bg-green-600 flex items-center justify-center" style={{ color: "#fff" }}>
          <ShoppingBag size={8} />
        </div>
      </div>
    </div>
    {/* Hero */}
    <div className="relative flex-none h-[36%] bg-neutral-900 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_right,rgba(34,197,94,0.14),transparent_60%)]" />
      <div className="absolute left-3 top-1/2 -translate-y-1/2 space-y-1">
        <div className="h-3 w-28 rounded-sm bg-white/90" />
        <div className="h-2.5 w-24 rounded-sm bg-white/75" />
        <div className="h-1.5 w-20 rounded-full bg-neutral-400" />
        <div className="mt-1 h-5 w-16 rounded bg-green-500" />
      </div>
      <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-end gap-1">
        <div className="h-10 w-10 rounded-lg bg-neutral-700/60 flex items-center justify-center" style={{ color: "#4ade80" }}>
          <Headset size={14} />
        </div>
        <div className="h-8 w-8 rounded-lg bg-neutral-700/40 flex items-center justify-center" style={{ color: "#86efac" }}>
          <PackageCheck size={11} />
        </div>
        <div className="h-6 w-6 rounded-lg bg-neutral-700/30 flex items-center justify-center" style={{ color: "#bbf7d0" }}>
          <ShoppingBag size={9} />
        </div>
      </div>
    </div>
    {/* Trust bar */}
    <div className="flex items-center justify-around bg-neutral-800 py-1 px-2 border-y border-neutral-700">
      {[
        { Icon: Truck, label: "Free Ship" },
        { Icon: Return, label: "30-Day" },
        { Icon: Headset, label: "24/7" },
        { Icon: ShieldCheck, label: "100% Auth." },
      ].map(({ Icon, label }, i) => (
        <div key={i} className="flex items-center gap-0.5">
          <div style={{ color: "#4ade80" }}><Icon size={7} /></div>
          <span className="text-[6px] font-semibold text-green-400">{label}</span>
        </div>
      ))}
    </div>
    {/* Product cards */}
    <div className="flex gap-1.5 p-2 flex-1">
      {[
        { Icon: Headset, label: "Earbuds" },
        { Icon: ShoppingBag, label: "Watch" },
        { Icon: PackageCheck, label: "Speaker" },
        { Icon: Package, label: "Mouse" },
      ].map(({ Icon, label }, i) => (
        <div key={i} className="flex-1 rounded-lg bg-white flex flex-col items-center justify-between p-1 gap-0.5">
          <div style={{ color: "#16a34a" }}><Icon size={11} /></div>
          <div className="h-1.5 w-8 rounded-full bg-neutral-300" />
          <div className="h-3 w-full rounded bg-green-500" />
        </div>
      ))}
    </div>
  </div>
);

// ─── Jewelry Store Preview ────────────────────────────────────────────────────
const JewelryStoreLandingPreview = () => (
  <div className="flex aspect-[16/10] w-full flex-col overflow-hidden rounded-xl border border-amber-200 bg-[#faf8f5] shadow-sm">
    {/* Nav */}
    <div className="flex items-center gap-2 border-b border-amber-100 bg-[#faf8f5] px-3 py-1.5">
      <div className="h-1.5 w-14 rounded-full bg-amber-800/50" />
      <div className="ml-auto flex gap-1.5">
        {["w-6","w-5","w-4"].map((w,i) => <div key={i} className={`h-1.5 ${w} rounded-full bg-amber-700/30`} />)}
        <div className="h-4 w-4 rounded-full bg-amber-100 flex items-center justify-center" style={{ color: "#a07840" }}>
          <Heart size={8} />
        </div>
      </div>
    </div>
    {/* Hero */}
    <div className="relative flex-none h-[40%] bg-gradient-to-br from-[#f5ede0] to-[#e8d5b7] overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(255,255,255,0.72),transparent_62%)]" />
      <div className="absolute bottom-3 left-3 space-y-1.5">
        <div className="h-3 w-28 rounded-sm bg-amber-900/80" />
        <div className="h-2.5 w-24 rounded-sm bg-amber-900/65" />
        <div className="h-1.5 w-20 rounded-full bg-amber-600/50" />
        <div className="mt-1 h-5 w-16 rounded bg-amber-700" />
      </div>
      {/* Decorative rings */}
      <div className="absolute right-3 top-1/2 -translate-y-1/2 flex flex-col gap-1 items-center">
        <div className="h-9 w-9 rounded-full bg-amber-300/50 border-2 border-amber-400/50 flex items-center justify-center" style={{ color: "#a07840" }}>
          <Star size={10} />
        </div>
        <div className="h-7 w-7 rounded-full bg-amber-200/60 border border-amber-300/40 flex items-center justify-center" style={{ color: "#c4973a" }}>
          <Heart size={8} />
        </div>
        <div className="h-5 w-5 rounded-full bg-amber-100/80 border border-amber-200/60 flex items-center justify-center" style={{ color: "#b8841e" }}>
          <Verified size={7} />
        </div>
      </div>
    </div>
    {/* Category pills */}
    <div className="flex items-center justify-around bg-[#fdf9f4] py-1 px-2 border-b border-amber-100">
      {[
        { Icon: Star, label: "Rings" },
        { Icon: Heart, label: "Necklaces" },
        { Icon: Loyalty, label: "Earrings" },
      ].map(({ Icon, label }, i) => (
        <div key={i} className="flex items-center gap-0.5">
          <div style={{ color: "#a07840" }}><Icon size={7} /></div>
          <span className="text-[7px] font-semibold text-amber-800">{label}</span>
        </div>
      ))}
    </div>
    {/* Product cards */}
    <div className="flex gap-1.5 p-2 flex-1">
      {[
        { Icon: Star, color: "#a07840" },
        { Icon: Heart, color: "#c4973a" },
        { Icon: Verified, color: "#a07840" },
        { Icon: Loyalty, color: "#b8841e" },
      ].map(({ Icon, color }, i) => (
        <div key={i} className="flex-1 rounded-lg bg-white border border-amber-100 flex flex-col items-center justify-between p-1 gap-0.5">
          <div style={{ color }}><Icon size={11} /></div>
          <div className="h-1.5 w-8 rounded-full bg-amber-200" />
          <div className="h-3 w-full rounded bg-amber-700" />
        </div>
      ))}
    </div>
  </div>
);

// ─── Fashion Store Preview ────────────────────────────────────────────────────
const FashionStoreLandingPreview = () => (
  <div className="flex aspect-[16/10] w-full flex-col overflow-hidden rounded-xl border border-stone-200 bg-[#f8f6f2] shadow-sm">
    {/* Nav */}
    <div className="flex items-center gap-2 border-b border-stone-200 bg-white px-3 py-1.5">
      <div className="h-1.5 w-12 rounded-full bg-stone-800/60" />
      <div className="ml-auto flex gap-1.5 items-center">
        {["w-7","w-5","w-5","w-4"].map((w,i) => <div key={i} className={`h-1.5 ${w} rounded-full bg-stone-400/60`} />)}
        <div className="h-4 w-4 rounded-full bg-stone-800 flex items-center justify-center" style={{ color: "#fff" }}>
          <ShoppingBag size={8} />
        </div>
      </div>
    </div>
    {/* Hero split */}
    <div className="relative flex flex-row flex-none h-[38%] overflow-hidden">
      <div className="relative flex-1 bg-[#ede8df] flex flex-col justify-end p-2">
        <div className="text-[6px] font-semibold uppercase tracking-[0.15em] text-stone-500 mb-1">New Collection</div>
        <div className="h-3 w-24 rounded-sm bg-stone-900/85 mb-1" />
        <div className="h-2.5 w-20 rounded-sm bg-stone-900/70 mb-1.5" />
        <div className="h-1.5 w-16 rounded-full bg-stone-500/50 mb-2" />
        <div className="flex gap-1">
          <div className="h-4 w-14 rounded bg-stone-900" />
          <div className="h-4 w-12 rounded border border-stone-400" />
        </div>
      </div>
      <div className="w-[42%] bg-[#d9cfc2] flex items-center justify-center" style={{ color: "#a8a29e" }}>
        <ShoppingBag size={20} />
      </div>
    </div>
    {/* Trust strip */}
    <div className="flex items-center justify-around bg-white border-y border-stone-100 py-1 px-2">
      {[
        { Icon: Truck, label: "Free Ship" },
        { Icon: Return, label: "Easy Return" },
        { Icon: ShieldCheck, label: "Secure Pay" },
        { Icon: Headset, label: "24/7 Help" },
      ].map(({ Icon, label }, i) => (
        <div key={i} className="flex items-center gap-0.5">
          <div style={{ color: "#78716c" }}><Icon size={7} /></div>
          <span className="text-[6px] font-medium text-stone-500">{label}</span>
        </div>
      ))}
    </div>
    {/* Category icons */}
    <div className="flex items-center justify-around bg-[#f8f6f2] py-1 px-3 border-b border-stone-100">
      {[ShoppingBag, Tag, Heart, Loyalty, TargetDeal].map((Icon, i) => (
        <div key={i} className="flex flex-col items-center gap-0.5">
          <div className="h-5 w-5 rounded-full bg-stone-200 flex items-center justify-center" style={{ color: "#57534e" }}>
            <Icon size={9} />
          </div>
          <div className="h-1 w-5 rounded-full bg-stone-300" />
        </div>
      ))}
    </div>
    {/* Product cards */}
    <div className="flex gap-1 p-1.5 flex-1">
      {[ShoppingBag, Tag, Heart, Loyalty, TargetDeal].map((Icon, i) => (
        <div key={i} className="flex-1 rounded bg-white border border-stone-100 flex flex-col items-center justify-between p-1">
          <div className="flex items-center justify-center flex-1" style={{ color: "#a8a29e" }}>
            <Icon size={11} />
          </div>
          <div className="space-y-0.5 w-full">
            <div className="h-1 w-full rounded-full bg-stone-200" />
            <div className="h-2 w-full rounded bg-stone-800" />
          </div>
        </div>
      ))}
    </div>
  </div>
);

// ─── Template Definitions ─────────────────────────────────────────────────────

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
  description: "A full product launch landing page with hero, product showcase, feature highlights, testimonials, product cards, and conversion CTAs.",
  preview: <ProductLaunchPreview />,
  category: "landing",
  element: (
    <Element is={Container} canvas background="#0f0a1e" padding={0}>
      {HeaderWithSearch.element}

      {/* Hero — bold launch headline */}
      {React.createElement(HeroBannerCTABlock as any, {
        layoutStyle: "image-right",
        title: "The Future of Style Is Here",
        subtitle: "Introducing our most anticipated collection. Designed to turn heads, built to last. Limited launch edition — get yours before it's gone.",
        buttonLabel: "Shop the Launch",
        backgroundImage: "",
        imageOpacity: 0,
        overlayColor: "#1a0f3a",
        titleColor: "#f5f0ff",
        subtitleColor: "#c4b5fd",
        buttonColor: "#7c3aed",
        minHeight: 580,
      })}

      {/* Why this product — feature benefits */}
      {React.createElement(FeaturesGridBlock as any, {
        layoutStyle: "three-col",
        heading: "Why Everyone Is Talking About It",
        subheading: "Engineered for performance, designed for those who dare to be different.",
        feature1Title: "Premium Materials",
        feature1Desc: "Crafted from sustainably sourced, top-grade materials that look and feel extraordinary from day one.",
        feature2Title: "Lifetime Guarantee",
        feature2Desc: "We stand behind every product. If it doesn't last a lifetime, we'll replace it — no questions asked.",
        feature3Title: "Free Global Shipping",
        feature3Desc: "Every order ships worldwide at no extra cost. Fast, tracked, and fully insured for your peace of mind.",
        backgroundColor: "#130d2b",
        headingColor: "#f5f0ff",
        textColor: "#a78bfa",
        cardBg: "#1e1540",
        minHeight: 480,
      })}

      {/* Stats */}
      {React.createElement(StatsCounterBlock as any, {
        stat1Value: "10K+",
        stat1Label: "Units Sold on Launch Day",
        stat2Value: "4.9★",
        stat2Label: "Average Customer Rating",
        stat3Value: "98%",
        stat3Label: "Would Recommend",
        stat4Value: "24h",
        stat4Label: "Fast Delivery",
        backgroundColor: "#7c3aed",
        valueColor: "#ffffff",
        labelColor: "rgba(255,255,255,0.75)",
        cardBg: "rgba(255,255,255,0.1)",
        layoutStyle: "row",
      })}

      {/* Product detail — image + description */}
      {React.createElement(ImageTextBlock as any, {
        tagline: "Signature Collection",
        heading: "Crafted for the Bold",
        description: "Every detail has been meticulously considered — the weight, the texture, the finishing. This is not just a product, it's a statement. Available in three exclusive colorways only during launch week.",
        feature1: "Exclusive Launch Colorways",
        feature2: "Sustainably Sourced Materials",
        feature3: "Ships in Signature Gift Box",
        backgroundColor: "#0f0a1e",
        taglineColor: "#a78bfa",
        headingColor: "#f5f0ff",
        textColor: "#c4b5fd",
        checkColor: "#7c3aed",
        layoutStyle: "image-right",
      })}

      {/* Full product description from API - uses TemplateEntry element for resolver compatibility */}
      {ProductDescription.element}

      {/* Featured product cards - uses TemplateEntry element for resolver compatibility */}
      {FeaturedProduct.element}

      {/* Scrollable product slider */}
      {React.createElement(ProductSlider as any, {
        title: "Bestsellers",
        background: "#130d2b",
        cardBackground: "#1e1540",
        gap: 18,
        showBadge: true,
        badgeText: "Launch Exclusive",
        badgeColor: "#7c3aed",
        buttonLabel: "Add to Cart",
        width: "100%",
        paddingTop: 56,
        paddingBottom: 56,
        paddingLeft: 24,
        paddingRight: 24,
      })}

      {/* Social proof testimonial */}
      {React.createElement(TestimonialBlock as any, {
        layoutStyle: "card-left",
        quote: "I've been waiting for a brand to actually deliver on both style and quality. This launch collection is everything. The craftsmanship is unlike anything I've seen at this price point — ordered two more for gifts.",
        authorName: "Sofia Reyes",
        authorRole: "Verified Buyer · Manila",
        authorInitials: "SR",
        backgroundColor: "#1a0f3a",
        cardBg: "#2d1f5e",
        quoteColor: "#e9d5ff",
        nameColor: "#f5f0ff",
        roleColor: "#a78bfa",
        accentColor: "#7c3aed",
        minHeight: 380,
      })}

      {/* Final CTA */}
      {React.createElement(CTABannerBlock as any, {
        heading: "Limited Launch Stock. Don't Miss Out.",
        subheading: "This collection was made in limited quantities. Once they're gone, they're gone. Free shipping on all launch orders.",
        primaryLabel: "Order Now",
        secondaryLabel: "View All Products",
        gradientFrom: "#4c1d95",
        gradientTo: "#7c3aed",
        headingColor: "#ffffff",
        textColor: "rgba(255,255,255,0.85)",
        primaryButtonColor: "#ffffff",
        primaryButtonTextColor: "#7c3aed",
        layoutStyle: "centered",
      })}

      {/* Newsletter */}
      {React.createElement(NewsletterCTABlock as any, {
        heading: "Be First to Know",
        subheading: "Get early access to new drops, exclusive discounts, and behind-the-scenes stories from the studio.",
        buttonLabel: "Join the List",
        placeholder: "Your email address",
        backgroundColor: "#0f0a1e",
        cardBg: "#1a0f3a",
        headingColor: "#f5f0ff",
        textColor: "#c4b5fd",
        buttonColor: "#7c3aed",
        inputBg: "#130d2b",
        layoutStyle: "split",
      })}

      {DarkCommerceFooter.element}
    </Element>
  ),
};

const FlashSaleLandingTemplate: TemplateEntry = {
  label: "Flash Sale",
  description: "A bold, urgency-driven flash sale page with hero countdown, deal showcase, product slider, testimonials, and a last-chance CTA.",
  preview: <FlashSaleLandingPreview />,
  category: "landing",
  element: (
    <Element is={Container} canvas background="#0d0402" padding={0}>
      {HeaderWithSearch.element}

      {/* HERO — urgent sale banner */}
      {React.createElement(CollectionHeroBlock as any, {
        title: "Flash Sale — Up To 70% Off",
        subtitle: "Massive discounts across the entire store. Today only — limited stock. Don't sleep on this.",
        badgeText: "24 Hours Only",
        primaryLabel: "Shop All Deals",
        secondaryLabel: "View Categories",
        backgroundImage: "",
        imageOpacity: 0,
        overlayColor: "#1a0800",
        buttonColor: "#f59e0b",
        badgeColor: "#ef4444",
        titleColor: "#fff7ed",
        subtitleColor: "#fbbf24",
        layoutStyle: "image-right",
        minHeight: 580,
        categoryMode: "manual",
        selectedCategories: ["Electronics", "Fashion", "Home & Living", "Sports"],
      })}

      {/* Urgency stats */}
      {React.createElement(StatsCounterBlock as any, {
        stat1Value: "70%",
        stat1Label: "Maximum Discount",
        stat2Value: "500+",
        stat2Label: "Deals Live Now",
        stat3Value: "24H",
        stat3Label: "Sale Duration",
        stat4Value: "Free",
        stat4Label: "Shipping on All Orders",
        backgroundColor: "#ef4444",
        valueColor: "#ffffff",
        labelColor: "rgba(255,255,255,0.80)",
        cardBg: "rgba(0,0,0,0.15)",
        layoutStyle: "row",
      })}

      {/* Featured deals — product cards */}
      {FeaturedProduct.element}

      {/* Scrollable product deals slider */}
      {React.createElement(ProductSlider as any, {
        title: "Hot Deals",
        background: "#150a02",
        cardBackground: "#1f1008",
        gap: 16,
        showBadge: true,
        badgeText: "SALE",
        badgeColor: "#ef4444",
        buttonLabel: "Grab Deal",
        width: "100%",
        paddingTop: 56,
        paddingBottom: 56,
        paddingLeft: 24,
        paddingRight: 24,
      })}

      {/* Why shop now */}
      {React.createElement(ImageTextBlock as any, {
        tagline: "Why Shop Today",
        heading: "Biggest Sale of the Year — Ends Tonight",
        description: "These prices won't last. Every hour, stock runs lower. We've cut prices across every category — fashion, tech, home, and more. This is your once-a-year chance to get the most for your money.",
        feature1: "Genuine Up to 70% Discounts",
        feature2: "Same-Day & Next-Day Delivery Available",
        feature3: "30-Day Easy Returns on All Items",
        backgroundColor: "#0d0402",
        taglineColor: "#f59e0b",
        headingColor: "#fff7ed",
        textColor: "#fcd34d",
        checkColor: "#ef4444",
        layoutStyle: "image-left",
      })}

      {/* Features grid — sale perks */}
      {React.createElement(FeaturesGridBlock as any, {
        layoutStyle: "three-col",
        heading: "Shop Smarter This Sale",
        subheading: "Every deal comes with our full store guarantee.",
        feature1Title: "Lightning Prices",
        feature1Desc: "Discounts you won't find anywhere else — slashed from our standard pricing across 500+ items.",
        feature2Title: "Safe & Secure",
        feature2Desc: "Your payment is fully protected. Shop with confidence using any payment method.",
        feature3Title: "Fast Delivery",
        feature3Desc: "Get your deals delivered fast. Same-day dispatch on orders placed before 2PM.",
        backgroundColor: "#1a0800",
        headingColor: "#fff7ed",
        textColor: "#fbbf24",
        cardBg: "#2d1200",
        minHeight: 440,
      })}

      {/* Social proof */}
      {React.createElement(TestimonialBlock as any, {
        layoutStyle: "card-right",
        quote: "I saved over ₱8,000 during the last flash sale. Got three items I'd been eyeing for months — all shipped the next day. This is the sale I wait for every year.",
        authorName: "Marco Santos",
        authorRole: "Verified Buyer · Cebu",
        authorInitials: "MS",
        backgroundColor: "#0d0402",
        cardBg: "#2d1200",
        quoteColor: "#fef3c7",
        nameColor: "#fff7ed",
        roleColor: "#f59e0b",
        accentColor: "#ef4444",
        minHeight: 360,
      })}

      {/* Last chance CTA */}
      {React.createElement(CTABannerBlock as any, {
        heading: "Hurry — Sale Ends at Midnight!",
        subheading: "Once the clock hits zero, prices go back up. Stock is selling fast — don't miss your chance to save big.",
        primaryLabel: "Shop Now Before It's Gone",
        secondaryLabel: "See All Categories",
        gradientFrom: "#b91c1c",
        gradientTo: "#ea580c",
        headingColor: "#ffffff",
        textColor: "rgba(255,255,255,0.88)",
        primaryButtonColor: "#fbbf24",
        primaryButtonTextColor: "#7c2d12",
        layoutStyle: "centered",
      })}

      {/* VIP early access newsletter */}
      {React.createElement(NewsletterCTABlock as any, {
        heading: "Get VIP Early Access to the Next Sale",
        subheading: "Be the first to know when flash sales drop. Subscribers get 1-hour early access and an extra 5% off.",
        buttonLabel: "Join VIP List",
        placeholder: "Your email address",
        backgroundColor: "#150a02",
        cardBg: "#2d1200",
        headingColor: "#fff7ed",
        textColor: "#fbbf24",
        buttonColor: "#ef4444",
        inputBg: "#0d0402",
        layoutStyle: "split",
      })}

      {DarkCommerceFooter.element}
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
        badgeText: "New Arrivals",
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

const PromoVoucherLandingTemplate: TemplateEntry = {
  label: "Promo / Voucher",
  description: "A fresh, deal-focused promo page with voucher showcases, exclusive codes, featured products, and conversion CTAs.",
  preview: <PromoVoucherLandingPreview />,
  category: "landing",
  element: (
    <Element is={Container} canvas background="#f0fdf4" padding={0}>
      {HeaderWithSearch.element}

      {/* HERO — voucher / promo headline */}
      {React.createElement(HeroBannerCTABlock as any, {
        layoutStyle: "image-right",
        title: "Exclusive Promo Codes Just for You",
        subtitle: "Unlock massive savings with our hand-picked vouchers. Copy your code, add items to cart, and watch the price drop instantly.",
        buttonLabel: "Claim Your Voucher",
        backgroundImage: "",
        imageOpacity: 0,
        overlayColor: "#064e3b",
        titleColor: "#f0fdf4",
        subtitleColor: "#6ee7b7",
        buttonColor: "#f59e0b",
        minHeight: 560,
      })}

      {/* Promo perks stats */}
      {React.createElement(StatsCounterBlock as any, {
        stat1Value: "30%",
        stat1Label: "Average Savings Per Order",
        stat2Value: "100+",
        stat2Label: "Active Voucher Codes",
        stat3Value: "₱0",
        stat3Label: "Shipping on Promo Orders",
        stat4Value: "Daily",
        stat4Label: "New Deals Added",
        backgroundColor: "#059669",
        valueColor: "#ffffff",
        labelColor: "rgba(255,255,255,0.78)",
        cardBg: "rgba(0,0,0,0.12)",
        layoutStyle: "row",
      })}

      {/* Featured promo products */}
      {FeaturedProduct.element}

      {/* Scrollable promo deals */}
      {React.createElement(ProductSlider as any, {
        title: "Promo Picks",
        background: "#ecfdf5",
        cardBackground: "#ffffff",
        gap: 18,
        showBadge: true,
        badgeText: "PROMO",
        badgeColor: "#059669",
        buttonLabel: "Apply Voucher",
        width: "100%",
        paddingTop: 56,
        paddingBottom: 56,
        paddingLeft: 24,
        paddingRight: 24,
      })}

      {/* How it works */}
      {React.createElement(FeaturesGridBlock as any, {
        layoutStyle: "three-col",
        heading: "How to Use Your Voucher",
        subheading: "Redeeming your promo code is quick and easy — just three simple steps.",
        feature1Title: "1. Choose Your Code",
        feature1Desc: "Browse our active promo codes and pick the one that gives you the best deal on your order.",
        feature2Title: "2. Add to Cart",
        feature2Desc: "Shop the items you love and head to checkout. Your cart is ready when you are.",
        feature3Title: "3. Paste & Save",
        feature3Desc: "Enter your promo code at checkout and watch the discount apply instantly — no hassle.",
        backgroundColor: "#f0fdf4",
        headingColor: "#064e3b",
        textColor: "#065f46",
        cardBg: "#d1fae5",
        minHeight: 440,
      })}

      {/* Why our promos are special */}
      {React.createElement(ImageTextBlock as any, {
        tagline: "Real Savings, Every Time",
        heading: "Vouchers That Actually Work",
        description: "No hidden conditions, no minimum spend surprises. Every promo code on this page is valid, tested, and ready to use today. We partner with our top brands to give you the deepest, most genuine discounts available.",
        feature1: "Verified & Tested Before Publishing",
        feature2: "No Hidden Terms or Conditions",
        feature3: "New Codes Added Every Day",
        backgroundColor: "#ecfdf5",
        taglineColor: "#059669",
        headingColor: "#064e3b",
        textColor: "#065f46",
        checkColor: "#10b981",
        layoutStyle: "image-right",
      })}

      {/* Product description promo detail */}
      {ProductDescription.element}

      {/* Customer testimonial */}
      {React.createElement(TestimonialBlock as any, {
        layoutStyle: "card-left",
        quote: "I saved ₱2,400 on my last order using the promo code from this page. The code worked perfectly at checkout and delivery was next day. I'm never shopping without checking here first.",
        authorName: "Ana Villanueva",
        authorRole: "Verified Buyer · Quezon City",
        authorInitials: "AV",
        backgroundColor: "#f0fdf4",
        cardBg: "#d1fae5",
        quoteColor: "#064e3b",
        nameColor: "#022c22",
        roleColor: "#059669",
        accentColor: "#10b981",
        minHeight: 360,
      })}

      {/* Final promo CTA */}
      {React.createElement(CTABannerBlock as any, {
        heading: "Don't Let These Deals Expire!",
        subheading: "Promo codes have limited validity. Grab your vouchers now and save before they're gone.",
        primaryLabel: "Copy My Promo Code",
        secondaryLabel: "Browse All Deals",
        gradientFrom: "#059669",
        gradientTo: "#0d9488",
        headingColor: "#ffffff",
        textColor: "rgba(255,255,255,0.88)",
        primaryButtonColor: "#f59e0b",
        primaryButtonTextColor: "#064e3b",
        layoutStyle: "centered",
      })}

      {/* VIP voucher newsletter */}
      {React.createElement(NewsletterCTABlock as any, {
        heading: "Get Exclusive Codes in Your Inbox",
        subheading: "Subscribe to receive private promo codes, first access to flash vouchers, and member-only deals every week.",
        buttonLabel: "Get My Code",
        placeholder: "Your email address",
        backgroundColor: "#ecfdf5",
        cardBg: "#ffffff",
        headingColor: "#064e3b",
        textColor: "#065f46",
        buttonColor: "#059669",
        inputBg: "#f0fdf4",
        layoutStyle: "split",
      })}

      {MinimalFooter.element}
    </Element>
  ),
};

const ElectronicsStoreLandingTemplate: TemplateEntry = {
  label: "Electronics Store",
  description: "A sleek, dark-themed tech store landing page with hero, product features bar, product grid, productivity CTA, product sliders, and newsletter.",
  preview: <ElectronicsStoreLandingPreview />,
  category: "landing",
  element: (
    <Element is={Container} canvas background="#111111" padding={0}>
      {HeaderWithSearch.element}

      {/* HERO — dark tech hero */}
      {React.createElement(HeroBannerCTABlock as any, {
        layoutStyle: "image-right",
        title: "Top Tech Gear for Your Lifestyle",
        subtitle: "Explore the latest gadgets & accessories. Premium quality tech, unbeatable prices.",
        buttonLabel: "Shop Now",
        backgroundImage: "",
        imageOpacity: 0,
        overlayColor: "#111111",
        titleColor: "#ffffff",
        subtitleColor: "#a3a3a3",
        buttonColor: "#22c55e",
        minHeight: 520,
      })}

      {/* Store guarantees — feature bar */}
      {React.createElement(StatsCounterBlock as any, {
        stat1Value: "Free",
        stat1Label: "Shipping on Orders Over ₱2,500",
        stat2Value: "30-Day",
        stat2Label: "Money Back Guarantee",
        stat3Value: "24/7",
        stat3Label: "Customer Support",
        stat4Value: "100%",
        stat4Label: "Authentic Products",
        backgroundColor: "#1a1a1a",
        valueColor: "#22c55e",
        labelColor: "#a3a3a3",
        cardBg: "rgba(255,255,255,0.04)",
        layoutStyle: "row",
      })}

      {/* Featured Products grid */}
      {FeaturedProduct.element}

      {/* Boost Productivity — image+text CTA */}
      {React.createElement(ImageTextBlock as any, {
        tagline: "Work & Play",
        heading: "Boost Your Productivity",
        description: "Essential accessories for the modern workspace. From mechanical keyboards and precision mice to ultra-wide monitors and noise-cancelling headphones — everything you need to perform at your best.",
        feature1: "Ergonomic Designs for All-Day Comfort",
        feature2: "Compatible with Mac, Windows & Linux",
        feature3: "Shop New Arrivals Every Week",
        backgroundColor: "#1a1a1a",
        taglineColor: "#22c55e",
        headingColor: "#ffffff",
        textColor: "#a3a3a3",
        checkColor: "#22c55e",
        layoutStyle: "image-right",
      })}

      {/* New Arrivals slider */}
      {React.createElement(ProductSlider as any, {
        title: "New Arrivals",
        background: "#111111",
        cardBackground: "#1f1f1f",
        gap: 16,
        showBadge: true,
        badgeText: "New",
        badgeColor: "#22c55e",
        buttonLabel: "Shop New",
        width: "100%",
        paddingTop: 56,
        paddingBottom: 56,
        paddingLeft: 24,
        paddingRight: 24,
      })}

      {/* Best Sellers slider */}
      {React.createElement(ProductSlider as any, {
        title: "Best Sellers",
        background: "#1a1a1a",
        cardBackground: "#111111",
        gap: 16,
        showBadge: true,
        badgeText: "Popular",
        badgeColor: "#16a34a",
        buttonLabel: "Shop Bestsellers",
        width: "100%",
        paddingTop: 56,
        paddingBottom: 56,
        paddingLeft: 24,
        paddingRight: 24,
      })}

      {/* Why choose us */}
      {React.createElement(FeaturesGridBlock as any, {
        layoutStyle: "three-col",
        heading: "Why TechNest?",
        subheading: "Thousands of satisfied customers trust us for their tech needs.",
        feature1Title: "Fast & Reliable Shipping",
        feature1Desc: "Orders dispatched within 24 hours. Real-time tracking on every package from warehouse to your door.",
        feature2Title: "Warranty on Every Product",
        feature2Desc: "Every product comes with a full manufacturer warranty. Extended coverage available at checkout.",
        feature3Title: "Expert Tech Support",
        feature3Desc: "Our trained specialists are available 7 days a week to help you find the right product for your needs.",
        backgroundColor: "#111111",
        headingColor: "#ffffff",
        textColor: "#a3a3a3",
        cardBg: "#1f1f1f",
        minHeight: 440,
      })}

      {/* Customer review */}
      {React.createElement(TestimonialBlock as any, {
        layoutStyle: "card-left",
        quote: "Ordered a pair of wireless earbuds and a smartwatch. Both arrived the next day in perfect condition. The product quality is exactly as described and the customer support team helped me set everything up. Highly recommend!",
        authorName: "Ryan Dela Cruz",
        authorRole: "Verified Buyer · Makati",
        authorInitials: "RC",
        backgroundColor: "#1a1a1a",
        cardBg: "#1f1f1f",
        quoteColor: "#e5e5e5",
        nameColor: "#ffffff",
        roleColor: "#22c55e",
        accentColor: "#22c55e",
        minHeight: 360,
      })}

      {/* Newsletter */}
      {React.createElement(NewsletterCTABlock as any, {
        heading: "Join Our Newsletter",
        subheading: "Get the latest deals & updates. Be the first to know about new arrivals, exclusive tech drops, and flash sales.",
        buttonLabel: "Subscribe",
        placeholder: "Enter your email",
        backgroundColor: "#111111",
        cardBg: "#1a1a1a",
        headingColor: "#ffffff",
        textColor: "#a3a3a3",
        buttonColor: "#22c55e",
        inputBg: "#1f1f1f",
        layoutStyle: "split",
      })}

      {DarkCommerceFooter.element}
    </Element>
  ),
};

const JewelryStoreLandingTemplate: TemplateEntry = {
  label: "Jewelry Store Landing",
  description: "An elegant, warm-toned jewelry store landing page with hero, collection showcase, bestsellers, features, testimonial, newsletter, and footer.",
  preview: <JewelryStoreLandingPreview />,
  category: "landing",
  element: (
    <Element is={Container} canvas background="#faf8f5" padding={0}>
      {SimpleHeader.element}

      {/* HERO — warm cream jewelry hero */}
      {React.createElement(HeroBannerCTABlock as any, {
        layoutStyle: "image-right",
        title: "Elevate Every Moment",
        subtitle: "Timeless jewelry crafted to shine with you. Discover our handpicked collections of rings, necklaces, earrings, and bracelets.",
        buttonLabel: "Explore All Jewelry",
        backgroundImage: "",
        imageOpacity: 0,
        overlayColor: "#f5ede0",
        titleColor: "#3b2a14",
        subtitleColor: "#6b4c2a",
        buttonColor: "#a07840",
        minHeight: 560,
      })}

      {/* Store trust signals */}
      {React.createElement(StatsCounterBlock as any, {
        stat1Value: "10K+",
        stat1Label: "Happy Customers",
        stat2Value: "Free",
        stat2Label: "Shipping on Orders Over ₱3,000",
        stat3Value: "30-Day",
        stat3Label: "Easy Returns",
        stat4Value: "100%",
        stat4Label: "Authentic & Certified",
        backgroundColor: "#fdf9f4",
        valueColor: "#a07840",
        labelColor: "#7a5c38",
        cardBg: "rgba(160,120,64,0.06)",
        layoutStyle: "row",
      })}

      {/* Bestsellers product grid */}
      {FeaturedProduct.element}

      {/* Bestsellers slider */}
      {React.createElement(ProductSlider as any, {
        title: "Our Bestsellers",
        background: "#faf8f5",
        cardBackground: "#ffffff",
        gap: 16,
        showBadge: true,
        badgeText: "Popular",
        badgeColor: "#a07840",
        buttonLabel: "Add to Bag",
        width: "100%",
        paddingTop: 56,
        paddingBottom: 56,
        paddingLeft: 24,
        paddingRight: 24,
      })}

      {/* Collection spotlight — image + text */}
      {React.createElement(ImageTextBlock as any, {
        tagline: "Summer Collection",
        heading: "Shine in Summer",
        description: "Discover radiant pieces made for sunny days and golden nights. From dainty chains to statement rings, each piece is thoughtfully designed to complement every style and occasion.",
        feature1: "Handcrafted with Premium Materials",
        feature2: "Hypoallergenic & Skin-Safe",
        feature3: "Available in Gold, Rose Gold & Silver",
        backgroundColor: "#fdf6ee",
        taglineColor: "#a07840",
        headingColor: "#3b2a14",
        textColor: "#6b4c2a",
        checkColor: "#a07840",
        layoutStyle: "image-left",
      })}

      {/* Why choose us */}
      {React.createElement(FeaturesGridBlock as any, {
        layoutStyle: "three-col",
        heading: "Why Glow & Co.?",
        subheading: "We believe every piece of jewelry should tell your story beautifully.",
        feature1Title: "Fine Craftsmanship",
        feature1Desc: "Every piece is handcrafted by skilled artisans using ethically sourced gemstones and premium metals that stand the test of time.",
        feature2Title: "Gift-Ready Packaging",
        feature2Desc: "Each order arrives in our signature gift box — perfect for anniversaries, birthdays, or simply treating yourself.",
        feature3Title: "Certified Authenticity",
        feature3Desc: "All pieces come with a certificate of authenticity. Shop with confidence knowing every item is genuine and quality-assured.",
        backgroundColor: "#faf8f5",
        headingColor: "#3b2a14",
        textColor: "#6b4c2a",
        cardBg: "#ffffff",
        minHeight: 440,
      })}

      {/* New arrivals slider */}
      {React.createElement(ProductSlider as any, {
        title: "New Arrivals",
        background: "#fdf6ee",
        cardBackground: "#faf8f5",
        gap: 16,
        showBadge: true,
        badgeText: "New",
        badgeColor: "#c4973a",
        buttonLabel: "Shop Now",
        width: "100%",
        paddingTop: 56,
        paddingBottom: 56,
        paddingLeft: 24,
        paddingRight: 24,
      })}

      {/* Customer love */}
      {React.createElement(TestimonialBlock as any, {
        layoutStyle: "card-left",
        quote: "I bought a gold necklace for my anniversary and she absolutely loved it. The packaging was stunning — it looked and felt like a luxury brand. Glow & Co. is my go-to for all special gifts now!",
        authorName: "Sofia Reyes",
        authorRole: "Verified Buyer · Cebu City",
        authorInitials: "SR",
        backgroundColor: "#fdf9f4",
        cardBg: "#fff8ee",
        quoteColor: "#3b2a14",
        nameColor: "#2a1e0d",
        roleColor: "#a07840",
        accentColor: "#c4973a",
        minHeight: 360,
      })}

      {/* Newsletter */}
      {React.createElement(NewsletterCTABlock as any, {
        heading: "Join the Glow Newsletter",
        subheading: "Be the first to discover new collections, exclusive offers, and styling tips. Subscribe and get 10% off your first order.",
        buttonLabel: "Subscribe & Save",
        placeholder: "Your email address",
        backgroundColor: "#faf8f5",
        cardBg: "#ffffff",
        headingColor: "#3b2a14",
        textColor: "#6b4c2a",
        buttonColor: "#a07840",
        inputBg: "#fdf9f4",
        layoutStyle: "split",
      })}

      {DarkCommerceFooter.element}
    </Element>
  ),
};

// ─── Fashion Store Landing ────────────────────────────────────────────────────

const FashionStoreLandingTemplate: TemplateEntry = {
  label: "Fashion Store Landing",
  description: "An elegant editorial fashion landing page with split hero, category navigation, collection grid, dual banners, bestsellers, trust strip, and newsletter — in warm neutral tones.",
  preview: <FashionStoreLandingPreview />,
  category: "landing",
  element: (
    <Element is={Container} canvas background="#f8f6f2" padding={0}>
      {HeaderWithSearch.element}

      {/* ── HERO: editorial split with model + headline ── */}
      {React.createElement(MinimalTypeHeroBlock as any, {
        layoutStyle: "image-right",
        title: "Elevate Your\nEveryday Style",
        subtitle: "Discover timeless pieces crafted for comfort, designed for elegance, made for you.",
        primaryLabel: "Shop Now →",
        secondaryLabel: "▶ Watch Lookbook",
        backgroundImage: "",
        imageOpacity: 0,
        overlayColor: "#ede8df",
        titleColor: "#1c1917",
        subtitleColor: "#78716c",
        buttonColor: "#1c1917",
        minHeight: 600,
      })}

      {/* ── TRUST STRIP: Free shipping · Easy returns · Secure payment ── */}
      {React.createElement(StatsCounterBlock as any, {
        stat1Value: "Free",
        stat1Label: "Shipping on Orders Over ₱899",
        stat2Value: "30-Day",
        stat2Label: "Easy Returns & Exchanges",
        stat3Value: "100%",
        stat3Label: "Secure & Protected Payments",
        stat4Value: "24/7",
        stat4Label: "Customer Support Always Here",
        backgroundColor: "#ffffff",
        valueColor: "#1c1917",
        labelColor: "#78716c",
        cardBg: "rgba(0,0,0,0.02)",
        layoutStyle: "row",
      })}

      {/* ── CATEGORIES: Shop by category — Women · Men · Dresses · Bags ── */}
      {React.createElement(CollectionHeroBlock as any, {
        title: "Find Your Perfect Style",
        subtitle: "Shop by category and discover curated collections for every occasion.",
        badgeText: "SHOP BY CATEGORY",
        primaryLabel: "Shop Women",
        secondaryLabel: "Shop Men",
        backgroundImage: "",
        imageOpacity: 0,
        overlayColor: "#f8f6f2",
        buttonColor: "#1c1917",
        badgeColor: "#78716c",
        titleColor: "#1c1917",
        subtitleColor: "#78716c",
        layoutStyle: "image-left-1",
        minHeight: 540,
        categoryMode: "manual",
        selectedCategories: ["Women's Collection", "Men's Collection", "Dresses", "Accessories"],
      })}

      {/* ── DUAL BANNERS: Spring Sale + Fresh Styles ── */}
      {React.createElement(ImageTextBlock as any, {
        tagline: "LIMITED TIME OFFER",
        heading: "Spring Sale — Up to 50% Off",
        description: "Our biggest seasonal clearance is here. Hundreds of styles across women's, men's, and accessories are now marked down. Shop before sizes sell out.",
        feature1: "Up to 50% on selected styles",
        feature2: "New markdowns added daily",
        feature3: "Free shipping on sale orders over ₱499",
        backgroundColor: "#f0ebe3",
        taglineColor: "#a8956e",
        headingColor: "#1c1917",
        textColor: "#78716c",
        checkColor: "#1c1917",
        layoutStyle: "image-right",
      })}

      {React.createElement(ImageTextBlock as any, {
        tagline: "NEW ARRIVALS",
        heading: "Fresh Styles Just Landed",
        description: "Be the first to wear what's new. From relaxed weekend fits to polished office looks — this season's freshest drops are in. New pieces added every week.",
        feature1: "Newest cuts and silhouettes",
        feature2: "Ethically made & responsibly sourced",
        feature3: "Exclusive colorways only on our store",
        backgroundColor: "#ffffff",
        taglineColor: "#78716c",
        headingColor: "#1c1917",
        textColor: "#78716c",
        checkColor: "#1c1917",
        layoutStyle: "image-left",
      })}

      {/* ── BESTSELLERS: Our Most Loved Picks ── */}
      {React.createElement(StatsCounterBlock as any, {
        stat1Value: "5K+",
        stat1Label: "5-Star Reviews",
        stat2Value: "500+",
        stat2Label: "Styles Available",
        stat3Value: "98%",
        stat3Label: "Customer Satisfaction",
        stat4Value: "48H",
        stat4Label: "Fast Delivery",
        backgroundColor: "#1c1917",
        valueColor: "#f8f6f2",
        labelColor: "#a8a29e",
        cardBg: "rgba(255,255,255,0.06)",
        layoutStyle: "row",
      })}

      {FeaturedProduct.element}

      {React.createElement(ProductSlider as any, {
        title: "Our Most Loved Picks",
        background: "#f8f6f2",
        cardBackground: "#ffffff",
        gap: 16,
        showBadge: true,
        badgeText: "Best Seller",
        badgeColor: "#1c1917",
        buttonLabel: "Add to Bag",
        width: "100%",
        paddingTop: 56,
        paddingBottom: 56,
        paddingLeft: 24,
        paddingRight: 24,
      })}

      {/* ── WHY LUNORA: Editorial brand values ── */}
      {React.createElement(FeaturesGridBlock as any, {
        layoutStyle: "three-col",
        heading: "Fashion That Fits Your Life",
        subheading: "We design clothing that moves with you — from morning routines to late-night occasions.",
        feature1Title: "Timeless Designs",
        feature1Desc: "Every piece is designed to outlast trends. Our collections are built on clean lines, quality fabrics, and versatile silhouettes that never go out of style.",
        feature2Title: "Sustainable Sourcing",
        feature2Desc: "We partner with ethical manufacturers and use responsibly sourced materials — because good fashion shouldn't cost the earth.",
        feature3Title: "Perfect Fit Guarantee",
        feature3Desc: "Not the right fit? Exchange it free. We offer a hassle-free 30-day return policy so you can shop with complete confidence.",
        backgroundColor: "#ffffff",
        headingColor: "#1c1917",
        textColor: "#78716c",
        cardBg: "#f8f6f2",
        minHeight: 440,
      })}

      {/* ── STYLE STORY: Image + text editorial ── */}
      {React.createElement(ImageTextBlock as any, {
        tagline: "OUR STORY",
        heading: "Timeless Fashion for Every Moment",
        description: "LUNORA was founded on the belief that great style shouldn't be reserved for special occasions. We craft everyday pieces that feel luxurious, look effortless, and are made to be worn and loved for years — not just a season.",
        feature1: "Founded in 2019 · Trusted by 100K+ customers",
        feature2: "Designed in-house by our creative team",
        feature3: "Proudly Filipino, shipping worldwide",
        backgroundColor: "#f0ebe3",
        taglineColor: "#a8956e",
        headingColor: "#1c1917",
        textColor: "#57534e",
        checkColor: "#a8956e",
        layoutStyle: "image-left",
      })}

      {/* ── NEW ARRIVALS SLIDER ── */}
      {React.createElement(ProductSlider as any, {
        title: "New Arrivals",
        background: "#ffffff",
        cardBackground: "#f8f6f2",
        gap: 16,
        showBadge: true,
        badgeText: "New In",
        badgeColor: "#78716c",
        buttonLabel: "Explore Now",
        width: "100%",
        paddingTop: 56,
        paddingBottom: 56,
        paddingLeft: 24,
        paddingRight: 24,
      })}

      {/* ── CUSTOMER LOVE: Social proof ── */}
      {React.createElement(TestimonialBlock as any, {
        layoutStyle: "card-left",
        quote: "I've been shopping at LUNORA for two years and every single piece has exceeded my expectations. The quality is incredible — these aren't fast fashion pieces, they genuinely last. The linen blazer I bought last spring is still my most-worn item.",
        authorName: "Isabelle Reyes",
        authorRole: "Verified Buyer · Makati City",
        authorInitials: "IR",
        backgroundColor: "#f8f6f2",
        cardBg: "#ffffff",
        quoteColor: "#1c1917",
        nameColor: "#1c1917",
        roleColor: "#a8956e",
        accentColor: "#1c1917",
        minHeight: 380,
      })}

      {/* ── CTA BANNER: Get 10% off first order ── */}
      {React.createElement(CTABannerBlock as any, {
        heading: "Get 10% Off Your First Order",
        subheading: "Join our style community and enjoy exclusive offers, early access to new arrivals, and personal styling tips delivered to your inbox.",
        primaryLabel: "Subscribe & Save 10%",
        secondaryLabel: "Browse All Styles",
        gradientFrom: "#1c1917",
        gradientTo: "#44403c",
        headingColor: "#f8f6f2",
        textColor: "rgba(248,246,242,0.78)",
        primaryButtonColor: "#c8b89a",
        primaryButtonTextColor: "#1c1917",
        layoutStyle: "split",
      })}

      {/* ── NEWSLETTER: Join our style list ── */}
      {React.createElement(NewsletterCTABlock as any, {
        heading: "Join Our Style List",
        subheading: "Sign up for exclusive offers, new arrivals, and style inspiration. Get 10% off your first order as a welcome gift.",
        buttonLabel: "Subscribe",
        placeholder: "Enter your email",
        backgroundColor: "#f8f6f2",
        cardBg: "#ffffff",
        headingColor: "#1c1917",
        textColor: "#78716c",
        buttonColor: "#1c1917",
        inputBg: "#f0ebe3",
        layoutStyle: "centered",
      })}

      {DarkCommerceFooter.element}
    </Element>
  ),
};

export const TEMPLATES: TemplateEntry[] = [
  SaaSLandingTemplate,
  BlogLandingTemplate,
  AgencyLandingTemplate,
  ProductLaunchTemplate,
  BeautyCosmeticsLandingTemplate,
  FlashSaleLandingTemplate,
  PromoVoucherLandingTemplate,
  ElectronicsStoreLandingTemplate,
  JewelryStoreLandingTemplate,
  FashionStoreLandingTemplate,
];

export const GROUPED_TEMPLATES = [
  {
    folder: "Landing Pages",
    items: [
      FashionStoreLandingTemplate,
      JewelryStoreLandingTemplate,
      ElectronicsStoreLandingTemplate,
      FlashSaleLandingTemplate,
      PromoVoucherLandingTemplate,
      AgencyLandingTemplate,
      ProductLaunchTemplate,
      BeautyCosmeticsLandingTemplate,
      BlogLandingTemplate,
      SaaSLandingTemplate,
    ],
  },
];
