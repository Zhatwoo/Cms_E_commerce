"use client";

import React, { useRef, useState } from "react";
import { useNode } from "@craftjs/core";
import { DesignSection } from "../../design/_components/rightPanel/settings/DesignSection";
import { ColorPicker } from "../../design/_components/rightPanel/settings/inputs/ColorPicker";
import { NumericInput } from "../../design/_components/rightPanel/settings/inputs/NumericInput";
import { useDesignProject } from "../../design/_context/DesignProjectContext";
import { addFileToMediaLibrary } from "../../design/_lib/mediaActions";

export interface BeautyCosmeticsLandingBlockProps {
  nodeId?: string;
  // Hero Section
  heroBadge?: string;
  heroTitle?: string;
  heroTitleAccent?: string;
  heroSubtitle?: string;
  heroPrimaryLabel?: string;
  heroSecondaryLabel?: string;
  heroImage?: string;
  heroDiscountBadge?: string;
  heroBgColor?: string;
  heroTitleColor?: string;
  heroAccentColor?: string;
  heroSubtitleColor?: string;
  heroBtnBgColor?: string;
  heroBtnTextColor?: string;
  // Category Section
  categorySectionTitle?: string;
  category1Name?: string;
  category1Count?: string;
  category1Image?: string;
  category2Name?: string;
  category2Count?: string;
  category2Image?: string;
  category3Name?: string;
  category3Count?: string;
  category3Image?: string;
  category4Name?: string;
  category4Count?: string;
  category4Image?: string;
  category5Name?: string;
  category5Count?: string;
  category5Image?: string;
  // Promo Banner
  promoBadge?: string;
  promoTitle?: string;
  promoTitleAccent?: string;
  promoSubtitle?: string;
  promoBtnLabel?: string;
  promoStat1Value?: string;
  promoStat1Label?: string;
  promoStat2Value?: string;
  promoStat2Label?: string;
  promoBgColor?: string;
  promoImage?: string;
  // Bestsellers Section
  bestsellersSectionTitle?: string;
  product1Name?: string;
  product1Price?: string;
  product1Rating?: string;
  product1Image?: string;
  product2Name?: string;
  product2Price?: string;
  product2Rating?: string;
  product2Image?: string;
  product3Name?: string;
  product3Price?: string;
  product3Rating?: string;
  product3Image?: string;
  product4Name?: string;
  product4Price?: string;
  product4Rating?: string;
  product4Image?: string;
  // Global
  accentColor?: string;
  fontFamily?: string;
}

// ─── Settings Panel ───────────────────────────────────────────────────────────

export const BeautyCosmeticsLandingBlockSettings = () => {
  const { props, actions: { setProp } } = useNode(
    (node) => ({ props: node.data.props as BeautyCosmeticsLandingBlockProps })
  );
  const { projectId } = useDesignProject();
  const heroImgRef = useRef<HTMLInputElement>(null);
  const promoImgRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState<string | null>(null);

  const set = <K extends keyof BeautyCosmeticsLandingBlockProps>(
    key: K,
    val: BeautyCosmeticsLandingBlockProps[K]
  ) => setProp((p: BeautyCosmeticsLandingBlockProps) => { p[key] = val; });

  const handleUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    key: keyof BeautyCosmeticsLandingBlockProps,
    label: string
  ) => {
    const file = e.target.files?.[0];
    if (!file || !projectId) return;
    setUploading(label);
    try {
      const item = await addFileToMediaLibrary(projectId, file);
      set(key, item.url);
    } catch { /* upload failed */ }
    setUploading(null);
    e.target.value = "";
  };

  const inputCls =
    "w-full h-8 rounded px-2 text-xs bg-builder-surface-3 border border-(--builder-border) text-builder-text focus:outline-none focus:border-builder-accent";

  const UploadRow = ({
    label,
    propKey,
    inputRef,
  }: {
    label: string;
    propKey: keyof BeautyCosmeticsLandingBlockProps;
    inputRef: React.RefObject<HTMLInputElement>;
  }) => (
    <div className="flex flex-col gap-1">
      <label className="text-[10px] text-builder-text-muted">{label}</label>
      <div className="flex gap-1.5">
        <input
          className={inputCls + " flex-1 min-w-0"}
          value={(props[propKey] as string) ?? ""}
          onChange={(e) => set(propKey, e.target.value)}
          placeholder="https://..."
        />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading === label}
          className="h-8 px-2.5 rounded text-[10px] font-semibold bg-builder-surface-3 border border-(--builder-border) text-builder-text-muted hover:text-builder-text hover:bg-builder-surface-2 transition-colors shrink-0 disabled:opacity-50"
        >
          {uploading === label ? "..." : "Upload"}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => handleUpload(e, propKey, label)}
        />
      </div>
    </div>
  );

  return (
    <div className="flex flex-col gap-0">
      {/* Hero */}
      <DesignSection title="Hero Section" defaultOpen>
        <div className="flex flex-col gap-2">
          <label className="text-[11px] text-builder-text-muted">Badge text</label>
          <input className={inputCls} value={props.heroBadge ?? "New Collection"} onChange={(e) => set("heroBadge", e.target.value)} />
          <label className="text-[11px] text-builder-text-muted">Title</label>
          <input className={inputCls} value={props.heroTitle ?? "Reveal Your"} onChange={(e) => set("heroTitle", e.target.value)} />
          <label className="text-[11px] text-builder-text-muted">Title accent (highlighted)</label>
          <input className={inputCls} value={props.heroTitleAccent ?? "Natural Glow"} onChange={(e) => set("heroTitleAccent", e.target.value)} />
          <label className="text-[11px] text-builder-text-muted">Subtitle</label>
          <input className={inputCls} value={props.heroSubtitle ?? "Discover skincare that enhances your natural beauty. Gentle, effective, and made for you."} onChange={(e) => set("heroSubtitle", e.target.value)} />
          <label className="text-[11px] text-builder-text-muted">Primary button</label>
          <input className={inputCls} value={props.heroPrimaryLabel ?? "Shop Now"} onChange={(e) => set("heroPrimaryLabel", e.target.value)} />
          <label className="text-[11px] text-builder-text-muted">Secondary button</label>
          <input className={inputCls} value={props.heroSecondaryLabel ?? "Watch Video"} onChange={(e) => set("heroSecondaryLabel", e.target.value)} />
          <label className="text-[11px] text-builder-text-muted">Discount badge</label>
          <input className={inputCls} value={props.heroDiscountBadge ?? "30% OFF For New Customers"} onChange={(e) => set("heroDiscountBadge", e.target.value)} />
          <UploadRow label="Hero image" propKey="heroImage" inputRef={heroImgRef} />
        </div>
      </DesignSection>

      <DesignSection title="Hero Colors" defaultOpen={false}>
        <div className="flex flex-col gap-2">
          <label className="text-[10px] text-builder-text-muted">Background color</label>
          <ColorPicker value={props.heroBgColor ?? "#fdf6f4"} onChange={(v) => set("heroBgColor", v)} className="w-full" />
          <label className="text-[10px] text-builder-text-muted">Title color</label>
          <ColorPicker value={props.heroTitleColor ?? "#1e1e2e"} onChange={(v) => set("heroTitleColor", v)} className="w-full" />
          <label className="text-[10px] text-builder-text-muted">Accent / highlight color</label>
          <ColorPicker value={props.heroAccentColor ?? "#d4667e"} onChange={(v) => set("heroAccentColor", v)} className="w-full" />
          <label className="text-[10px] text-builder-text-muted">Subtitle color</label>
          <ColorPicker value={props.heroSubtitleColor ?? "#6b5c65"} onChange={(v) => set("heroSubtitleColor", v)} className="w-full" />
          <label className="text-[10px] text-builder-text-muted">Button background</label>
          <ColorPicker value={props.heroBtnBgColor ?? "#1e1e2e"} onChange={(v) => set("heroBtnBgColor", v)} className="w-full" />
        </div>
      </DesignSection>

      {/* Categories */}
      <DesignSection title="Categories Section" defaultOpen={false}>
        <div className="flex flex-col gap-2">
          <label className="text-[11px] text-builder-text-muted">Section title</label>
          <input className={inputCls} value={props.categorySectionTitle ?? "Shop By Categories"} onChange={(e) => set("categorySectionTitle", e.target.value)} />
          {([1, 2, 3, 4, 5] as const).map((i) => (
            <React.Fragment key={i}>
              <p className="text-[10px] text-builder-text-faint mt-1 uppercase tracking-wider font-semibold">Category {i}</p>
              <label className="text-[11px] text-builder-text-muted">Name</label>
              <input className={inputCls}
                value={(props[`category${i}Name` as keyof BeautyCosmeticsLandingBlockProps] as string) ?? ["Cleanser", "Moisturizers", "Serums", "Sunscreen", "Masks"][i - 1]}
                onChange={(e) => set(`category${i}Name` as keyof BeautyCosmeticsLandingBlockProps, e.target.value)} />
              <label className="text-[11px] text-builder-text-muted">Count label</label>
              <input className={inputCls}
                value={(props[`category${i}Count` as keyof BeautyCosmeticsLandingBlockProps] as string) ?? "10 Products"}
                onChange={(e) => set(`category${i}Count` as keyof BeautyCosmeticsLandingBlockProps, e.target.value)} />
            </React.Fragment>
          ))}
        </div>
      </DesignSection>

      {/* Promo Banner */}
      <DesignSection title="Promo Banner" defaultOpen={false}>
        <div className="flex flex-col gap-2">
          <label className="text-[11px] text-builder-text-muted">Badge</label>
          <input className={inputCls} value={props.promoBadge ?? "Good Every Day ✦"} onChange={(e) => set("promoBadge", e.target.value)} />
          <label className="text-[11px] text-builder-text-muted">Title</label>
          <input className={inputCls} value={props.promoTitle ?? "Skincare That"} onChange={(e) => set("promoTitle", e.target.value)} />
          <label className="text-[11px] text-builder-text-muted">Title accent</label>
          <input className={inputCls} value={props.promoTitleAccent ?? "Loves You Back"} onChange={(e) => set("promoTitleAccent", e.target.value)} />
          <label className="text-[11px] text-builder-text-muted">Subtitle</label>
          <input className={inputCls} value={props.promoSubtitle ?? "Flat 20% off on our best-selling products. Limited time offer!"} onChange={(e) => set("promoSubtitle", e.target.value)} />
          <label className="text-[11px] text-builder-text-muted">Button label</label>
          <input className={inputCls} value={props.promoBtnLabel ?? "Shop Now"} onChange={(e) => set("promoBtnLabel", e.target.value)} />
          <label className="text-[11px] text-builder-text-muted">Stat 1 value</label>
          <input className={inputCls} value={props.promoStat1Value ?? "10K+"} onChange={(e) => set("promoStat1Value", e.target.value)} />
          <label className="text-[11px] text-builder-text-muted">Stat 1 label</label>
          <input className={inputCls} value={props.promoStat1Label ?? "Happy Customers"} onChange={(e) => set("promoStat1Label", e.target.value)} />
          <label className="text-[11px] text-builder-text-muted">Stat 2 value</label>
          <input className={inputCls} value={props.promoStat2Value ?? "4.8"} onChange={(e) => set("promoStat2Value", e.target.value)} />
          <label className="text-[11px] text-builder-text-muted">Stat 2 label</label>
          <input className={inputCls} value={props.promoStat2Label ?? "Average Rating"} onChange={(e) => set("promoStat2Label", e.target.value)} />
          <label className="text-[10px] text-builder-text-muted">Background color</label>
          <ColorPicker value={props.promoBgColor ?? "#f9ede9"} onChange={(v) => set("promoBgColor", v)} className="w-full" />
          <UploadRow label="Promo image" propKey="promoImage" inputRef={promoImgRef} />
        </div>
      </DesignSection>

      {/* Bestsellers */}
      <DesignSection title="Bestsellers Section" defaultOpen={false}>
        <div className="flex flex-col gap-2">
          <label className="text-[11px] text-builder-text-muted">Section title</label>
          <input className={inputCls} value={props.bestsellersSectionTitle ?? "Our Bestsellers"} onChange={(e) => set("bestsellersSectionTitle", e.target.value)} />
          {([1, 2, 3, 4] as const).map((i) => (
            <React.Fragment key={i}>
              <p className="text-[10px] text-builder-text-faint mt-1 uppercase tracking-wider font-semibold">Product {i}</p>
              <label className="text-[11px] text-builder-text-muted">Name</label>
              <input className={inputCls}
                value={(props[`product${i}Name` as keyof BeautyCosmeticsLandingBlockProps] as string) ?? ["Hydrating Moisturizer", "Glow Sunscreen SPF 50", "Rose Clay Mask", "Vitamin C Serum"][i - 1]}
                onChange={(e) => set(`product${i}Name` as keyof BeautyCosmeticsLandingBlockProps, e.target.value)} />
              <label className="text-[11px] text-builder-text-muted">Price</label>
              <input className={inputCls}
                value={(props[`product${i}Price` as keyof BeautyCosmeticsLandingBlockProps] as string) ?? ["₹699", "₹589", "₹499", "₹799"][i - 1]}
                onChange={(e) => set(`product${i}Price` as keyof BeautyCosmeticsLandingBlockProps, e.target.value)} />
              <label className="text-[11px] text-builder-text-muted">Rating (1–5)</label>
              <input className={inputCls}
                value={(props[`product${i}Rating` as keyof BeautyCosmeticsLandingBlockProps] as string) ?? "4.5"}
                onChange={(e) => set(`product${i}Rating` as keyof BeautyCosmeticsLandingBlockProps, e.target.value)} />
            </React.Fragment>
          ))}
        </div>
      </DesignSection>

      {/* Global */}
      <DesignSection title="Global" defaultOpen={false}>
        <div className="flex flex-col gap-2">
          <label className="text-[10px] text-builder-text-muted">Primary accent color</label>
          <ColorPicker value={props.accentColor ?? "#d4667e"} onChange={(v) => set("accentColor", v)} className="w-full" />
        </div>
      </DesignSection>
    </div>
  );
};

// ─── Star Rating SVG ──────────────────────────────────────────────────────────

const StarRating = ({ rating, color = "#f0a500" }: { rating: number; color?: string }) => {
  const stars = [1, 2, 3, 4, 5];
  return (
    <div style={{ display: "flex", gap: 2 }}>
      {stars.map((s) => {
        const fill = s <= Math.floor(rating) ? color : s - 0.5 <= rating ? "url(#half)" : "#e2e8f0";
        return (
          <svg key={s} width="12" height="12" viewBox="0 0 24 24" fill={fill}>
            <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
          </svg>
        );
      })}
    </div>
  );
};

// ─── Trust Badge Icons ─────────────────────────────────────────────────────────

const TrustBadges = ({ accentColor }: { accentColor: string }) => (
  <div style={{ display: "flex", gap: 24, flexWrap: "wrap", marginTop: 8 }}>
    {[
      { icon: "🌿", label: "Natural Ingredients", sub: "100% Organic" },
      { icon: "🧪", label: "Dermatologist Tested", sub: "Clinically Proven" },
      { icon: "🐰", label: "Cruelty Free", sub: "No Animal Testing" },
    ].map((badge) => (
      <div key={badge.label} style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{
          width: 36, height: 36, borderRadius: "50%",
          background: `${accentColor}18`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 16,
        }}>
          {badge.icon}
        </div>
        <div>
          <div style={{ fontSize: 11, fontWeight: 600, color: "#1e1e2e" }}>{badge.label}</div>
          <div style={{ fontSize: 10, color: "#9e8c96" }}>{badge.sub}</div>
        </div>
      </div>
    ))}
  </div>
);

// ─── Main Component ────────────────────────────────────────────────────────────

export const BeautyCosmeticsLandingBlock = ({
  nodeId,
  // Hero
  heroBadge = "New Collection",
  heroTitle = "Reveal Your",
  heroTitleAccent = "Natural Glow",
  heroSubtitle = "Discover skincare that enhances your natural beauty. Gentle, effective, and made for you.",
  heroPrimaryLabel = "Shop Now",
  heroSecondaryLabel = "Watch Video",
  heroDiscountBadge = "30% OFF For New Customers",
  heroImage = "https://images.unsplash.com/photo-1526045612212-70caf35c14df?q=80&w=800&auto=format&fit=crop",
  heroBgColor = "#fdf6f4",
  heroTitleColor = "#1e1e2e",
  heroAccentColor = "#d4667e",
  heroSubtitleColor = "#6b5c65",
  heroBtnBgColor = "#1e1e2e",
  heroBtnTextColor = "#ffffff",
  // Categories
  categorySectionTitle = "Shop By Categories",
  category1Name = "Cleanser", category1Count = "12 Products", category1Image = "",
  category2Name = "Moisturizers", category2Count = "18 Products", category2Image = "",
  category3Name = "Serums", category3Count = "14 Products", category3Image = "",
  category4Name = "Sunscreen", category4Count = "10 Products", category4Image = "",
  category5Name = "Masks", category5Count = "9 Products", category5Image = "",
  // Promo
  promoBadge = "Good Every Day ✦",
  promoTitle = "Skincare That",
  promoTitleAccent = "Loves You Back",
  promoSubtitle = "Flat 20% off on our best-selling products. Limited time offer!",
  promoBtnLabel = "Shop Now",
  promoStat1Value = "10K+", promoStat1Label = "Happy Customers",
  promoStat2Value = "4.8", promoStat2Label = "Average Rating",
  promoBgColor = "#f9ede9",
  promoImage = "https://images.unsplash.com/photo-1608248597279-f99d160bfcbc?q=80&w=700&auto=format&fit=crop",
  // Bestsellers
  bestsellersSectionTitle = "Our Bestsellers",
  product1Name = "Hydrating Moisturizer", product1Price = "₹699", product1Rating = "4.5", product1Image = "",
  product2Name = "Glow Sunscreen SPF 50", product2Price = "₹589", product2Rating = "4.7", product2Image = "",
  product3Name = "Rose Clay Mask", product3Price = "₹499", product3Rating = "4.3", product3Image = "",
  product4Name = "Vitamin C Serum", product4Price = "₹799", product4Rating = "4.8", product4Image = "",
  // Global
  accentColor = "#d4667e",
  fontFamily = "inherit",
}: BeautyCosmeticsLandingBlockProps) => {
  const node = (() => {
    try { return useNode(); } catch { return null; }
  })();
  const id = node?.id || nodeId;
  const connectors = node?.connectors;

  const categories = [
    { name: category1Name, count: category1Count, image: category1Image, emoji: "🧴" },
    { name: category2Name, count: category2Count, image: category2Image, emoji: "💧" },
    { name: category3Name, count: category3Count, image: category3Image, emoji: "✨" },
    { name: category4Name, count: category4Count, image: category4Image, emoji: "☀️" },
    { name: category5Name, count: category5Count, image: category5Image, emoji: "🌹" },
  ];

  const bestsellers = [
    { name: product1Name, price: product1Price, rating: parseFloat(product1Rating ?? "4.5"), image: product1Image },
    { name: product2Name, price: product2Price, rating: parseFloat(product2Rating ?? "4.7"), image: product2Image },
    { name: product3Name, price: product3Price, rating: parseFloat(product3Rating ?? "4.3"), image: product3Image },
    { name: product4Name, price: product4Price, rating: parseFloat(product4Rating ?? "4.8"), image: product4Image },
  ];

  const sectionPadding = "clamp(32px, 5vw, 60px) clamp(16px, 5vw, 80px)";

  return (
    <div
      ref={(ref) => {
        if (ref && connectors?.connect && connectors?.drag) {
          connectors.connect(connectors.drag(ref));
        }
      }}
      data-node-id={id}
      style={{ width: "100%", fontFamily, backgroundColor: "#ffffff", overflowX: "hidden" }}
    >
      {/* ═══════════════════════════════════════════════════════
          HERO SECTION
      ═══════════════════════════════════════════════════════ */}
      <section style={{
        backgroundColor: heroBgColor,
        padding: sectionPadding,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: 480,
        position: "relative",
        overflow: "hidden",
      }}>
        {/* Decorative blobs */}
        <div style={{
          position: "absolute", top: -80, right: -80,
          width: 340, height: 340, borderRadius: "50%",
          background: `radial-gradient(circle, ${accentColor}22 0%, transparent 70%)`,
          pointerEvents: "none",
        }} />
        <div style={{
          position: "absolute", bottom: -60, left: "10%",
          width: 220, height: 220, borderRadius: "50%",
          background: `radial-gradient(circle, ${accentColor}18 0%, transparent 70%)`,
          pointerEvents: "none",
        }} />

        <div style={{
          position: "relative", zIndex: 1,
          width: "min(100%, 1200px)",
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          gap: "clamp(24px, 5vw, 64px)",
          flexWrap: "wrap",
        }}>
          {/* Left: Text content */}
          <div style={{ flex: "1 1 320px", display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Badge */}
            <div style={{ display: "inline-flex", alignItems: "center", gap: 6, width: "fit-content" }}>
              <div style={{
                width: 6, height: 6, borderRadius: "50%",
                background: accentColor,
              }} />
              <span style={{
                fontSize: 11, fontWeight: 700, letterSpacing: "0.14em",
                textTransform: "uppercase", color: accentColor,
              }}>
                {heroBadge}
              </span>
            </div>

            {/* Title */}
            <h1 style={{ margin: 0, lineHeight: 1.1 }}>
              <span style={{ display: "block", fontSize: "clamp(32px, 5vw, 52px)", fontWeight: 800, color: heroTitleColor }}>
                {heroTitle}
              </span>
              <span style={{
                display: "block",
                fontSize: "clamp(32px, 5vw, 52px)", fontWeight: 800,
                color: heroAccentColor,
                fontStyle: "italic",
              }}>
                {heroTitleAccent}
              </span>
            </h1>

            {/* Subtitle */}
            <p style={{ margin: 0, fontSize: "clamp(13px, 1.8vw, 15px)", color: heroSubtitleColor, lineHeight: 1.7, maxWidth: 420 }}>
              {heroSubtitle}
            </p>

            {/* Buttons */}
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
              <button type="button" style={{
                background: heroBtnBgColor,
                color: heroBtnTextColor,
                border: "none",
                fontSize: 13, fontWeight: 700,
                padding: "13px 28px",
                borderRadius: 50,
                cursor: "pointer",
                letterSpacing: "0.02em",
                display: "flex", alignItems: "center", gap: 8,
              }}>
                {heroPrimaryLabel}
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </button>
              <button type="button" style={{
                background: "transparent",
                color: heroTitleColor,
                border: "none",
                fontSize: 13, fontWeight: 600,
                padding: "13px 12px",
                borderRadius: 50,
                cursor: "pointer",
                display: "flex", alignItems: "center", gap: 8,
              }}>
                <div style={{
                  width: 34, height: 34, borderRadius: "50%",
                  background: `${accentColor}22`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill={accentColor}>
                    <polygon points="5,3 19,12 5,21" />
                  </svg>
                </div>
                {heroSecondaryLabel}
              </button>
            </div>

            {/* Trust Badges */}
            <TrustBadges accentColor={accentColor} />
          </div>

          {/* Right: Hero image + floating badges */}
          <div style={{ flex: "0 0 auto", position: "relative", minWidth: 260, maxWidth: 400 }}>
            {/* Discount badge */}
            <div style={{
              position: "absolute", top: -16, right: -16, zIndex: 2,
              width: 72, height: 72, borderRadius: "50%",
              background: `linear-gradient(135deg, ${accentColor}, #f06292)`,
              display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center",
              color: "#fff", textAlign: "center",
              boxShadow: `0 4px 16px ${accentColor}55`,
              padding: 4,
            }}>
              <span style={{ fontSize: 10, fontWeight: 700, lineHeight: 1.1 }}>{heroDiscountBadge}</span>
            </div>

            {/* Image frame */}
            <div style={{
              width: "clamp(240px, 30vw, 380px)",
              aspectRatio: "3/4",
              borderRadius: 24,
              overflow: "hidden",
              background: heroImage
                ? `url(${heroImage}) center/cover no-repeat`
                : `linear-gradient(145deg, ${accentColor}30 0%, ${accentColor}10 100%)`,
              boxShadow: `0 20px 60px ${accentColor}30`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}>
              {!heroImage && (
                <span style={{ fontSize: 48 }}>🌸</span>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          SHOP BY CATEGORIES
      ═══════════════════════════════════════════════════════ */}
      <section style={{
        backgroundColor: "#ffffff",
        padding: sectionPadding,
      }}>
        <div style={{ width: "min(100%, 1200px)", margin: "0 auto" }}>
          <h2 style={{ margin: "0 0 28px", fontSize: "clamp(20px, 3vw, 28px)", fontWeight: 700, color: "#1e1e2e", textAlign: "center" }}>
            {categorySectionTitle}
          </h2>

          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
            gap: 16,
          }}>
            {categories.map((cat, i) => (
              <div
                key={i}
                style={{
                  borderRadius: 20,
                  overflow: "hidden",
                  background: cat.image
                    ? `url(${cat.image}) center/cover no-repeat`
                    : `linear-gradient(145deg, ${accentColor}18, ${accentColor}08)`,
                  border: `1.5px solid ${accentColor}22`,
                  aspectRatio: "1 / 1.15",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  cursor: "pointer",
                  transition: "box-shadow 0.2s",
                  boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
                  position: "relative",
                }}
              >
                {!cat.image && (
                  <span style={{ fontSize: 32 }}>{cat.emoji}</span>
                )}
                <div style={{
                  position: "absolute", bottom: 0, left: 0, right: 0,
                  background: "rgba(255,255,255,0.92)",
                  padding: "10px 8px",
                  textAlign: "center",
                  backdropFilter: "blur(4px)",
                }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#1e1e2e" }}>{cat.name}</div>
                  <div style={{ fontSize: 10, color: accentColor, fontWeight: 500, marginTop: 2 }}>{cat.count}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          PROMO BANNER
      ═══════════════════════════════════════════════════════ */}
      <section style={{
        backgroundColor: promoBgColor,
        padding: sectionPadding,
        margin: "0 clamp(8px, 3vw, 40px)",
        borderRadius: 28,
        overflow: "hidden",
      }}>
        <div style={{
          width: "min(100%, 1200px)",
          margin: "0 auto",
          display: "flex",
          alignItems: "center",
          gap: "clamp(24px, 5vw, 56px)",
          flexWrap: "wrap",
        }}>
          {/* Left: Text */}
          <div style={{ flex: "1 1 280px", display: "flex", flexDirection: "column", gap: 14 }}>
            <span style={{
              fontSize: 10, fontWeight: 700, letterSpacing: "0.16em",
              textTransform: "uppercase", color: accentColor,
            }}>
              {promoBadge}
            </span>

            <h2 style={{ margin: 0, lineHeight: 1.15 }}>
              <span style={{ display: "block", fontSize: "clamp(24px, 4vw, 38px)", fontWeight: 800, color: "#1e1e2e" }}>
                {promoTitle}
              </span>
              <span style={{
                display: "block",
                fontSize: "clamp(24px, 4vw, 38px)", fontWeight: 800,
                color: accentColor, fontStyle: "italic",
              }}>
                {promoTitleAccent}
              </span>
            </h2>

            <p style={{ margin: 0, fontSize: "clamp(12px, 1.5vw, 14px)", color: "#6b5c65", lineHeight: 1.7, maxWidth: 380 }}>
              {promoSubtitle}
            </p>

            <button type="button" style={{
              background: "#1e1e2e",
              color: "#fff",
              border: "none",
              fontSize: 13, fontWeight: 700,
              padding: "13px 28px",
              borderRadius: 50,
              cursor: "pointer",
              width: "fit-content",
            }}>
              {promoBtnLabel}
            </button>
          </div>

          {/* Right: Stats + Image */}
          <div style={{ flex: "0 0 auto", display: "flex", flexDirection: "column", gap: 16, alignItems: "flex-end" }}>
            {/* Stats */}
            <div style={{ display: "flex", gap: 24 }}>
              {[
                { value: promoStat1Value, label: promoStat1Label },
                { value: promoStat2Value, label: promoStat2Label },
              ].map((stat) => (
                <div key={stat.label} style={{ textAlign: "center" }}>
                  <div style={{ fontSize: "clamp(22px, 3.5vw, 32px)", fontWeight: 800, color: accentColor }}>
                    {stat.value}
                  </div>
                  <div style={{ fontSize: 11, color: "#6b5c65", fontWeight: 500 }}>{stat.label}</div>
                  {stat.label?.toLowerCase().includes("rating") && (
                    <div style={{ marginTop: 4, display: "flex", justifyContent: "center" }}>
                      <StarRating rating={parseFloat(stat.value ?? "4.8")} color={accentColor} />
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Promo image */}
            <div style={{
              width: "clamp(180px, 24vw, 300px)",
              aspectRatio: "3/4",
              borderRadius: 20,
              overflow: "hidden",
              background: promoImage
                ? `url(${promoImage}) center/cover no-repeat`
                : `linear-gradient(145deg, ${accentColor}30, ${accentColor}10)`,
              boxShadow: `0 12px 40px ${accentColor}28`,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              {!promoImage && <span style={{ fontSize: 40 }}>💆‍♀️</span>}
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          BESTSELLERS
      ═══════════════════════════════════════════════════════ */}
      <section style={{
        backgroundColor: "#ffffff",
        padding: sectionPadding,
      }}>
        <div style={{ width: "min(100%, 1200px)", margin: "0 auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
            <h2 style={{ margin: 0, fontSize: "clamp(20px, 3vw, 28px)", fontWeight: 700, color: "#1e1e2e" }}>
              {bestsellersSectionTitle}
            </h2>
            <button type="button" style={{
              background: "transparent",
              border: `1.5px solid ${accentColor}50`,
              color: accentColor,
              fontSize: 12, fontWeight: 600,
              padding: "7px 18px",
              borderRadius: 50,
              cursor: "pointer",
            }}>
              View All
            </button>
          </div>

          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: 20,
          }}>
            {bestsellers.map((product, i) => (
              <div key={i} style={{
                borderRadius: 20,
                overflow: "hidden",
                background: "#fff",
                border: "1.5px solid #f0e6e9",
                boxShadow: "0 4px 16px rgba(212,102,126,0.08)",
                transition: "box-shadow 0.2s, transform 0.2s",
                cursor: "pointer",
              }}>
                {/* Product image placeholder */}
                <div style={{
                  aspectRatio: "1",
                  background: product.image
                    ? `url(${product.image}) center/cover no-repeat`
                    : `linear-gradient(145deg, ${accentColor}18, ${accentColor}06)`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  position: "relative",
                }}>
                  {!product.image && (
                    <span style={{ fontSize: 36 }}>{"🧴🧼🌹💧".split("")[i] || "✨"}</span>
                  )}
                  {/* Wishlist icon */}
                  <div style={{
                    position: "absolute", top: 10, right: 10,
                    width: 28, height: 28, borderRadius: "50%",
                    background: "rgba(255,255,255,0.9)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                  }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={accentColor} strokeWidth="2">
                      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                    </svg>
                  </div>
                </div>

                {/* Product info */}
                <div style={{ padding: "12px 14px 14px" }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#1e1e2e", marginBottom: 4, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {product.name}
                  </div>
                  <StarRating rating={product.rating} color={accentColor} />
                  <div style={{ marginTop: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 15, fontWeight: 700, color: accentColor }}>{product.price}</span>
                    <button type="button" style={{
                      background: `${accentColor}18`,
                      border: "none",
                      color: accentColor,
                      fontSize: 11, fontWeight: 700,
                      padding: "5px 12px",
                      borderRadius: 50,
                      cursor: "pointer",
                    }}>
                      Add
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

// ─── Craft.js Configuration ───────────────────────────────────────────────────

BeautyCosmeticsLandingBlock.craft = {
  displayName: "Beauty Cosmetics Landing Block",
  props: {
    heroBadge: "New Collection",
    heroTitle: "Reveal Your",
    heroTitleAccent: "Natural Glow",
    heroSubtitle: "Discover skincare that enhances your natural beauty. Gentle, effective, and made for you.",
    heroPrimaryLabel: "Shop Now",
    heroSecondaryLabel: "Watch Video",
    heroDiscountBadge: "30% OFF For New Customers",
    heroImage: "https://images.unsplash.com/photo-1526045612212-70caf35c14df?q=80&w=800&auto=format&fit=crop",
    heroBgColor: "#fdf6f4",
    heroTitleColor: "#1e1e2e",
    heroAccentColor: "#d4667e",
    heroSubtitleColor: "#6b5c65",
    heroBtnBgColor: "#1e1e2e",
    heroBtnTextColor: "#ffffff",
    categorySectionTitle: "Shop By Categories",
    category1Name: "Cleanser", category1Count: "12 Products", category1Image: "",
    category2Name: "Moisturizers", category2Count: "18 Products", category2Image: "",
    category3Name: "Serums", category3Count: "14 Products", category3Image: "",
    category4Name: "Sunscreen", category4Count: "10 Products", category4Image: "",
    category5Name: "Masks", category5Count: "9 Products", category5Image: "",
    promoBadge: "Good Every Day ✦",
    promoTitle: "Skincare That",
    promoTitleAccent: "Loves You Back",
    promoSubtitle: "Flat 20% off on our best-selling products. Limited time offer!",
    promoBtnLabel: "Shop Now",
    promoStat1Value: "10K+", promoStat1Label: "Happy Customers",
    promoStat2Value: "4.8", promoStat2Label: "Average Rating",
    promoBgColor: "#f9ede9",
    promoImage: "https://images.unsplash.com/photo-1608248597279-f99d160bfcbc?q=80&w=700&auto=format&fit=crop",
    bestsellersSectionTitle: "Our Bestsellers",
    product1Name: "Hydrating Moisturizer", product1Price: "₹699", product1Rating: "4.5", product1Image: "",
    product2Name: "Glow Sunscreen SPF 50", product2Price: "₹589", product2Rating: "4.7", product2Image: "",
    product3Name: "Rose Clay Mask", product3Price: "₹499", product3Rating: "4.3", product3Image: "",
    product4Name: "Vitamin C Serum", product4Price: "₹799", product4Rating: "4.8", product4Image: "",
    accentColor: "#d4667e",
    fontFamily: "inherit",
  },
  custom: {},
  related: { settings: BeautyCosmeticsLandingBlockSettings },
  rules: { canDrag: () => true, canDrop: () => true, canMoveIn: () => false },
  isCanvas: false,
};
