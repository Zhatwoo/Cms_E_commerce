"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Editor, Frame, useEditor } from "@craftjs/core";
import { ChevronLeft, ChevronRight, Layout, Star, FileText, CreditCard, FormInput, PanelBottom, Smile, Shapes as ShapesIcon } from "lucide-react";
import { GROUPED_TEMPLATES } from "../../../_assets";
import { buildCraftResolver } from "../craftResolver";
import { Container } from "../../_designComponents/Container/Container";
import { Text } from "../../_designComponents/Text/Text";
import { Page } from "../../_designComponents/Page/Page";
import { Viewport } from "../../_designComponents/Viewport/Viewport";
import { Image } from "../../_designComponents/Image/Image";
import { Button } from "../../_designComponents/Button/Button";
import { Divider } from "../../_designComponents/Divider/Divider";
import { Banner } from "../../_designComponents/Banner/banner";
import { Badge } from "../../_designComponents/Badge/badge";
import { Pagination } from "../../_designComponents/Pagination/Pagination";
import { BooleanField } from "../../_designComponents/BooleanField/BooleanField";
import { Section } from "../../_designComponents/Section/Section";
import { Row } from "../../_designComponents/Row/Row";
import { Column } from "../../_designComponents/Column/Column";
import { Icon } from "../../_designComponents/Icon/Icon";
import { Rating } from "../../_designComponents/Rating/Rating";
import { Accordion } from "../../_designComponents/Accordion/Accordion";
import { Rectangle } from "../../../_assets/shapes/rectangle/rectangle";
import {
  Diamond,
  Heart,
  Trapezoid,
  Pentagon,
  Hexagon,
  Heptagon,
  Octagon,
  Nonagon,
  Decagon,
  Parallelogram,
  Kite
} from "../../../_assets/shapes/additional_shapes";

// Stub components for preview — ProductCard/ProductSlider need DesignProjectProvider
// context that isn't available in the isolated preview Editor.
const ProductCardPreviewStub = () => (
  <div style={{ width: 1440, display: "flex", background: "#f8fafc" }}>
    {[1,2,3,4,5].map((i) => (
      <div key={i} style={{ flex: 1, background: "#ffffff", borderRight: i < 5 ? "1px solid #e5e7eb" : undefined, display: "flex", flexDirection: "column" }}>
        <div style={{ height: 180, background: "#e2e8f0", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>
        </div>
        <div style={{ padding: "10px 12px", display: "flex", flexDirection: "column", gap: 6 }}>
          <div style={{ height: 11, background: "#e2e8f0", borderRadius: 3, width: "75%" }} />
          <div style={{ height: 10, background: "#f1f5f9", borderRadius: 3, width: "50%" }} />
          <div style={{ height: 30, background: "#1e293b", borderRadius: 5, marginTop: 4 }} />
        </div>
      </div>
    ))}
  </div>
);
const ProductSliderPreviewStub = () => (
  <div style={{ width: 1440, background: "#f8fafc", padding: "24px", boxSizing: "border-box" }}>
    <div style={{ height: 16, background: "#e2e8f0", borderRadius: 4, width: 160, margin: "0 auto 16px" }} />
    <div style={{ display: "flex", gap: 12 }}>
      {[1,2,3,4,5].map((i) => (
        <div key={i} style={{ flex: 1, background: "#ffffff", borderRadius: 6, border: "1px solid #e5e7eb", overflow: "hidden" }}>
          <div style={{ height: 140, background: "#e2e8f0" }} />
          <div style={{ padding: 8, display: "flex", flexDirection: "column", gap: 5 }}>
            <div style={{ height: 9, background: "#e2e8f0", borderRadius: 3, width: "80%" }} />
            <div style={{ height: 9, background: "#f1f5f9", borderRadius: 3, width: "50%" }} />
            <div style={{ height: 24, background: "#1e293b", borderRadius: 4, marginTop: 2 }} />
          </div>
        </div>
      ))}
    </div>
  </div>
);
const ProductDescriptionCardPreviewStub = () => (
  <div style={{ width: 1440, display: "flex", background: "#f8fafc" }}>
    {[1,2].map((i) => (
      <div key={i} style={{ flex: 1, background: "#ffffff", borderRight: i < 2 ? "1px solid #e5e7eb" : undefined, display: "flex" }}>
        <div style={{ width: "45%", background: "#e2e8f0", minHeight: 220, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>
        </div>
        <div style={{ flex: 1, padding: "20px 18px", display: "flex", flexDirection: "column", gap: 8, justifyContent: "center" }}>
          <div style={{ height: 14, background: "#e2e8f0", borderRadius: 3, width: "85%" }} />
          <div style={{ height: 3, background: "#e2e8f0", borderRadius: 1, width: 32 }} />
          <div style={{ height: 9, background: "#f1f5f9", borderRadius: 3 }} />
          <div style={{ height: 9, background: "#f1f5f9", borderRadius: 3, width: "90%" }} />
          <div style={{ height: 9, background: "#f1f5f9", borderRadius: 3, width: "70%" }} />
          <div style={{ height: 14, background: "#e2e8f0", borderRadius: 3, width: "35%", marginTop: 4 }} />
          <div style={{ height: 32, background: "transparent", border: "1.5px solid #1e293b", borderRadius: 5, marginTop: 2 }} />
        </div>
      </div>
    ))}
  </div>
);

const SAFE_CONTAINER: React.ComponentType<any> =
  (typeof Container === "function" ? Container : null) ??
  ((props: any) => {
    const { 
      background, paddingTop, paddingRight, paddingBottom, paddingLeft, padding,
      width, height, borderRadius, borderColor, borderWidth, borderStyle,
      alignItems, justifyContent, flexDirection, flexWrap, gap, 
      display, position, top, right, bottom, left, zIndex,
      opacity, overflow, rotation, canvas, isFreeform, anchorPoints, ...domProps 
    } = props;

    const style: React.CSSProperties = {
      background: background ?? "transparent",
      paddingTop: paddingTop ?? padding ?? 0,
      paddingRight: paddingRight ?? padding ?? 0,
      paddingBottom: paddingBottom ?? padding ?? 0,
      paddingLeft: paddingLeft ?? padding ?? 0,
      width,
      height,
      borderRadius,
      borderColor,
      borderWidth,
      borderStyle,
      alignItems,
      justifyContent,
      flexDirection,
      flexWrap,
      gap,
      display: display ?? "flex",
      position: position ?? "relative",
      top,
      right,
      bottom,
      left,
      zIndex,
      opacity,
      overflow,
      transform: rotation ? `rotate(${rotation}deg)` : undefined,
      ...props.style,
    };

    return <div {...domProps} style={style}>{props.children}</div>;
  });

const asComponent = (value: unknown): React.ComponentType<any> =>
  typeof value === "function" ? (value as React.ComponentType<any>) : SAFE_CONTAINER;

function withResolverFallback<T extends Record<string, React.ComponentType<any>>>(base: T): T {
  return new Proxy(base, {
    get(target, prop, receiver) {
      const direct = Reflect.get(target, prop, receiver);
      if (direct) return direct;
      if (typeof prop !== "string") return direct;

      const normalized = prop.trim().toLowerCase();
      // Try exact, then lowercase, then CamelCase
      const resolved =
        target[prop.trim()] ||
        target[normalized] ||
        target[normalized.charAt(0).toUpperCase() + normalized.slice(1)];

      return resolved || target.Container || SAFE_CONTAINER;
    },
    has(target, prop) {
      if (Reflect.has(target, prop)) return true;
      if (typeof prop === "string") return true;
      return !!(target.Container || target.container);
    },
    ownKeys(target) {
      return Reflect.ownKeys(target);
    },
    getOwnPropertyDescriptor(target, prop) {
      return Reflect.getOwnPropertyDescriptor(target, prop);
    }
  }) as T;
}

export type AssetItem = {
  label: string;
  description?: string;
  preview: React.ReactNode;
  element: React.ReactElement;
  category: string;
};

class AssetPreviewErrorBoundary extends React.Component<
  { fallback: React.ReactNode; children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { fallback: React.ReactNode; children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch() { }

  render() {
    if (this.state.hasError) return this.props?.fallback ?? null;
    return this.props?.children ?? null;
  }
}

const DESKTOP_PREVIEW_WIDTH = 1440;
const MAX_PREVIEW_HEIGHT = 180;

interface AssetSelection {
  folder: string;
  item: AssetItem;
  key: string;
}

const buildAssetKey = (folder: string, label: string, idx: number) => `${folder}::${label}::${idx}`;

const isIconFolder = (folder: string) => folder.toLowerCase() === "icons";
const isShapeFolder = (folder: string) => folder.toLowerCase() === "shapes";

const SOCIAL_ICON_LABELS = new Set([
  "facebook", "google", "instagram", "twitter", "youtube", "tiktok", "linkedin", "pinterest",
  "snapchat", "reddit", "telegram", "discord", "whatsapp", "messenger", "threads", "line",
  "wechat", "viber", "signal", "twitch", "github", "dribbble", "behance", "medium", "vimeo",
  "tumblr", "xing",
]);

const SUPPORT_ICON_LABELS = new Set([
  "headset", "chat support", "help circle", "phone call", "mail support",
]);

const NAVIGATION_ICON_LABELS = new Set([
  "search", "home", "menu", "close", "settings", "heart", "plus", "trash", "star", "check",
  "chevron right", "arrow left", "arrow right", "user", "bell",
]);

const ICON_GROUP_ORDER = ["Social", "Commerce", "Support", "Navigation", "Other"] as const;

function classifyIconLabel(label: string): (typeof ICON_GROUP_ORDER)[number] {
  const normalized = label.replace(/\s*icon$/i, "").trim().toLowerCase();
  if (SOCIAL_ICON_LABELS.has(normalized)) return "Social";
  if (SUPPORT_ICON_LABELS.has(normalized)) return "Support";
  if (NAVIGATION_ICON_LABELS.has(normalized)) return "Navigation";
  if (normalized.length) return "Commerce";
  return "Other";
}

const ASSET_ICONS: Record<string, React.ReactNode> = {
  Header: <Layout className="w-5 h-5" />,
  Hero: <Star className="w-5 h-5" />,
  Content: <FileText className="w-5 h-5" />,
  Cards: <CreditCard className="w-5 h-5" />,
  Forms: <FormInput className="w-5 h-5" />,
  Footer: <PanelBottom className="w-5 h-5" />,
  Icons: <Smile className="w-5 h-5" />,
  Shapes: <ShapesIcon className="w-5 h-5" />,
};

const BASE_CRAFT_RESOLVER = buildCraftResolver();

const PREVIEW_RESOLVER: Record<string, React.ComponentType<any>> = withResolverFallback({
  ...BASE_CRAFT_RESOLVER,
  Container: SAFE_CONTAINER,
  container: SAFE_CONTAINER,
  CONTAINER: SAFE_CONTAINER,
  Text: asComponent(Text),
  text: asComponent(Text),
  TEXT: asComponent(Text),
  Page: asComponent(Page),
  page: asComponent(Page),
  PAGE: asComponent(Page),
  Viewport: asComponent(Viewport),
  viewport: asComponent(Viewport),
  VIEWPORT: asComponent(Viewport),
  Image: asComponent(Image),
  image: asComponent(Image),
  IMAGE: asComponent(Image),
  img: asComponent(Image),
  Img: asComponent(Image),
  ImageComponent: asComponent(Image),
  Button: asComponent(Button),
  button: asComponent(Button),
  BUTTON: asComponent(Button),
  Divider: asComponent(Divider),
  divider: asComponent(Divider),
  DIVIDER: asComponent(Divider),
  Banner: asComponent(Banner),
  banner: asComponent(Banner),
  BANNER: asComponent(Banner),
  Badge: asComponent(Badge),
  badge: asComponent(Badge),
  BADGE: asComponent(Badge),
  Pagination: asComponent(Pagination),
  pagination: asComponent(Pagination),
  PAGINATION: asComponent(Pagination),
  BooleanField: asComponent(BooleanField),
  booleanfield: asComponent(BooleanField),
  BOOLEANFIELD: asComponent(BooleanField),
  "Boolean Field": asComponent(BooleanField),
  "boolean field": asComponent(BooleanField),
  Checkbox: asComponent(BooleanField),
  checkbox: asComponent(BooleanField),
  CheckBox: asComponent(BooleanField),
  Radio: asComponent(BooleanField),
  radio: asComponent(BooleanField),
  Section: asComponent(Section),
  Row: asComponent(Row),
  Column: asComponent(Column),
  Icon: asComponent(Icon),
  icon: asComponent(Icon),
  ICON: asComponent(Icon),
  Rating: asComponent(Rating),
  rating: asComponent(Rating),
  ProfileLogin: asComponent((BASE_CRAFT_RESOLVER as Record<string, unknown>).ProfileLogin),
  profilelogin: asComponent((BASE_CRAFT_RESOLVER as Record<string, unknown>).profilelogin),
  ProfileLoginNode: asComponent((BASE_CRAFT_RESOLVER as Record<string, unknown>).ProfileLoginNode ?? (BASE_CRAFT_RESOLVER as Record<string, unknown>).ProfileLogin),
  profileloginnode: asComponent((BASE_CRAFT_RESOLVER as Record<string, unknown>).profileloginnode ?? (BASE_CRAFT_RESOLVER as Record<string, unknown>).profilelogin),
  Accordion: asComponent(Accordion),
  accordion: asComponent(Accordion),
  ProductCard: ProductCardPreviewStub,
  productcard: ProductCardPreviewStub,
  "Product Card": ProductCardPreviewStub,
  ProductSlider: ProductSliderPreviewStub,
  productslider: ProductSliderPreviewStub,
  "Product Slider": ProductSliderPreviewStub,
  ProductDescriptionCard: ProductDescriptionCardPreviewStub,
  productdescriptioncard: ProductDescriptionCardPreviewStub,
  "Product Description Card": ProductDescriptionCardPreviewStub,
  CategoriesCardCanvas: asComponent((BASE_CRAFT_RESOLVER as Record<string, unknown>).CategoriesCardCanvas),
  categoriescardcanvas: asComponent((BASE_CRAFT_RESOLVER as Record<string, unknown>).CategoriesCardCanvas),
  Rectangle: asComponent(Rectangle),
  rectangle: asComponent(Rectangle),
  Diamond: asComponent(Diamond),
  diamond: asComponent(Diamond),
  Heart: asComponent(Heart),
  heart: asComponent(Heart),
  Trapezoid: asComponent(Trapezoid),
  trapezoid: asComponent(Trapezoid),
  Pentagon: asComponent(Pentagon),
  pentagon: asComponent(Pentagon),
  Hexagon: asComponent(Hexagon),
  hexagon: asComponent(Hexagon),
  Heptagon: asComponent(Heptagon),
  heptagon: asComponent(Heptagon),
  Octagon: asComponent(Octagon),
  octagon: asComponent(Octagon),
  Nonagon: asComponent(Nonagon),
  nonagon: asComponent(Nonagon),
  Decagon: asComponent(Decagon),
  decagon: asComponent(Decagon),
  Parallelogram: asComponent(Parallelogram),
  parallelogram: asComponent(Parallelogram),
  Kite: asComponent(Kite),
  kite: asComponent(Kite),
});

export const AssetLivePreview = ({
  item,
  previewMode,
  maxHeight = MAX_PREVIEW_HEIGHT,
}: {
  item: AssetItem;
  previewMode: "icon" | "shape" | "full";
  maxHeight?: number;
}) => {
  const previewRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const [previewHeight, setPreviewHeight] = useState(0);

  useEffect(() => {
    const containerEl = previewRef.current;
    const frameEl = frameRef.current;
    if (!containerEl || !frameEl) return;

    const resizeObserver = new ResizeObserver(() => {
      if (containerEl) setContainerWidth(containerEl.clientWidth);
      if (frameEl) setPreviewHeight(frameEl.getBoundingClientRect().height);
    });

    resizeObserver.observe(containerEl);
    resizeObserver.observe(frameEl);
    setContainerWidth(containerEl.clientWidth);
    setPreviewHeight(frameEl.getBoundingClientRect().height);

    return () => resizeObserver.disconnect();
  }, []);

  const scale = useMemo(() => {
    if (containerWidth <= 0) return 0.2;
    return Math.min(1, containerWidth / DESKTOP_PREVIEW_WIDTH);
  }, [containerWidth]);

  if (!item?.element) return null;

  if (previewMode === "icon") {
    return (
      <div className="h-16 w-full rounded-lg border border-dashed border-[var(--builder-border)] bg-[var(--builder-surface-2)] flex items-center justify-center text-[var(--builder-text-muted)] pointer-events-none group-hover:bg-[var(--builder-surface-3)] transition-colors">
        <AssetPreviewErrorBoundary fallback={<span className="text-[10px] opacity-70">Preview unavailable</span>}>
          {item.preview ?? (
            <Editor resolver={PREVIEW_RESOLVER} enabled={false}>
              <Frame>{item.element}</Frame>
            </Editor>
          )}
        </AssetPreviewErrorBoundary>
      </div>
    );
  }

  if (previewMode === "shape") {
    const shapePreviewElement = item.preview ? React.cloneElement(item.preview as React.ReactElement<any>, {
      width: ["rectangle", "trapezoid", "parallelogram"].includes(item.label.toLowerCase()) ? 64 : (item.label.toLowerCase() === "kite" ? 36 : 48),
      height: ["rectangle", "trapezoid", "parallelogram"].includes(item.label.toLowerCase()) ? 32 : (item.label.toLowerCase() === "kite" ? 64 : 48),
    }) : null;

    return (
      <div className="h-20 w-full rounded-lg border border-dashed border-[var(--builder-border)] bg-[var(--builder-surface-2)] flex items-center justify-center pointer-events-none overflow-hidden group-hover:bg-[var(--builder-surface-3)] transition-colors">
        {shapePreviewElement}
      </div>
    );
  }

  return (
    <div
      ref={previewRef}
      className="w-full rounded-lg border border-dashed border-[var(--builder-border)] bg-[var(--builder-surface-2)] overflow-hidden pointer-events-none relative group-hover:bg-[var(--builder-surface-3)] transition-colors"
      style={{ height: previewHeight > 0 ? `${Math.min(previewHeight, maxHeight)}px` : "100px" }}
    >
      <div
        ref={frameRef}
        className="origin-top-left"
        style={{
          width: `${DESKTOP_PREVIEW_WIDTH}px`,
          transform: `scale(${scale})`,
        }}
      >
        <AssetPreviewErrorBoundary fallback={<div className="h-[100px] w-full flex items-center justify-center text-[10px] text-[var(--builder-text-faint)]">Preview unavailable</div>}>
          <Editor resolver={PREVIEW_RESOLVER} enabled={false}>
            <Frame>{item.element}</Frame>
          </Editor>
        </AssetPreviewErrorBoundary>
      </div>
    </div>
  );
};

export const AssetsPanel = () => {
  const { connectors } = useEditor();
  const [panelView, setPanelView] = useState<"folders" | "items">("folders");
  const [activeFolder, setActiveFolder] = useState<string | null>(null);
  const [selectedAsset, setSelectedAsset] = useState<AssetSelection | null>(null);

  const activeGroup = useMemo(
    () => GROUPED_TEMPLATES.find((group) => group.folder === activeFolder) ?? null,
    [activeFolder],
  );

  const groupedIconItems = useMemo(() => {
    if (!activeGroup || !isIconFolder(activeGroup.folder)) return null;

    const buckets: Record<(typeof ICON_GROUP_ORDER)[number], Array<{ item: AssetItem; idx: number }>> = {
      Social: [],
      Commerce: [],
      Support: [],
      Navigation: [],
      Other: [],
    };

    activeGroup.items.forEach((item: AssetItem, idx: number) => {
      const key = classifyIconLabel(item.label);
      buckets[key].push({ item, idx });
    });

    return buckets;
  }, [activeGroup]);

  useEffect(() => {
    if (!activeGroup) {
      setSelectedAsset(null);
      return;
    }

    if (!selectedAsset) return;
    const existsInActive = activeGroup.items.some(
      (item: AssetItem, idx: number) => buildAssetKey(activeGroup.folder, item.label, idx) === selectedAsset.key,
    );

    if (!existsInActive) {
      setSelectedAsset(null);
    }
  }, [activeGroup, selectedAsset]);

  return (
    <div className="h-full flex flex-col p-1 relative overflow-hidden">
      <div className="relative flex-1 overflow-hidden">
        {/* Folders View */}
        <div
          className={`absolute inset-0 overflow-y-auto space-y-2 transition-transform duration-250 ease-out py-2 ${panelView === "folders" ? "translate-x-0" : "-translate-x-full"
            }`}
        >
          <div className="grid grid-cols-1 gap-2">
            {GROUPED_TEMPLATES.map((group) => (
              <button
                key={group.folder}
                type="button"
                onClick={() => {
                  setActiveFolder(group.folder);
                  setPanelView("items");
                  setSelectedAsset(null);
                }}
                className="group relative w-full bg-[var(--builder-surface-2)] rounded-xl border border-[var(--builder-border)] overflow-hidden hover:bg-[var(--builder-surface-3)] transition-all duration-300 hover:border-[var(--builder-border-mid)] shadow-sm h-16"
              >
                <div className="flex h-full items-center p-2.5 gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[var(--builder-surface-3)] flex items-center justify-center text-[var(--builder-purple-light)] group-hover:text-[var(--builder-accent)] transition-colors border border-[var(--builder-border)] shadow-inner shrink-0">
                    {ASSET_ICONS[group.folder] || <Layout className="w-5 h-5" />}
                  </div>
                  <div className="flex-1 text-left">
                    <div className="text-sm font-semibold text-[var(--builder-text)] group-hover:translate-x-1 transition-transform">
                      {group.folder}
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[var(--builder-text-faint)] group-hover:text-[var(--builder-accent)] transition-all group-hover:translate-x-1" />
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Items View */}
        <div
          className={`absolute inset-0 transition-transform duration-250 ease-out py-2 ${panelView === "items" ? "translate-x-0" : "translate-x-full"
            }`}
        >
          <div className="h-full overflow-y-auto">
            <div className="flex items-center gap-2 px-1 pb-2 border-b border-[var(--builder-border)] mb-4 sticky top-0 bg-[var(--builder-surface)] z-10">
              <button
                type="button"
                onClick={() => setPanelView("folders")}
                className="inline-flex items-center justify-center w-7 h-7 rounded-lg border border-[var(--builder-border)] text-[var(--builder-text-muted)] hover:text-[var(--builder-accent)] hover:bg-[var(--builder-surface-2)] transition-all"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <div className="text-xs font-bold text-[var(--builder-text)]">{activeGroup?.folder}</div>
            </div>

            {activeGroup ? (
              (() => {
                const shapeFolder = isShapeFolder(activeGroup.folder);
                const iconFolder = isIconFolder(activeGroup.folder);

                const renderAssetCard = (item: AssetItem, idx: number) => {
                  const assetKey = buildAssetKey(activeGroup.folder, item.label, idx);
                  const isSelected = selectedAsset?.key === assetKey;

                  return (
                    <div
                      key={assetKey}
                      data-drag-source="asset"
                      data-asset-category={item.category}
                      data-asset-label={item.label}
                      ref={(ref) => {
                        if (!ref || !item?.element) return;

                        const dragElement = iconFolder
                          ? React.cloneElement(item.element as React.ReactElement<any>, {
                              color: "#000000",
                            })
                          : item.element;

                        connectors.create(ref, dragElement);
                      }}
                      onDragStart={() => {
                        if (typeof document !== "undefined") {
                          document.body.dataset.assetDragCategory = item.category;
                          document.body.dataset.assetDragLabel = item.label;
                        }
                      }}
                      onMouseDown={() => {
                        if (typeof document !== "undefined") {
                          document.body.dataset.assetDragCategory = item.category;
                          document.body.dataset.assetDragLabel = item.label;
                        }
                      }}
                      onDragEnd={() => {
                        if (typeof document !== "undefined") {
                          delete document.body.dataset.assetDragCategory;
                          delete document.body.dataset.assetDragLabel;
                        }
                      }}
                      onClick={() => {
                        setSelectedAsset({
                          folder: activeGroup.folder,
                          item,
                          key: assetKey,
                        });
                      }}
                      className={`group bg-[var(--builder-surface-2)] p-3 rounded-xl hover:bg-[var(--builder-surface-3)] transition-all border cursor-move shadow-sm ${isSelected ? "border-[var(--builder-accent)] bg-[var(--builder-surface-3)]" : "border-[var(--builder-border)] hover:border-[var(--builder-border-mid)]"
                        }`}
                    >
                      <div className="flex flex-col gap-2">
                        {!iconFolder && (
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <div className="text-sm text-[var(--builder-text)] font-medium leading-tight line-clamp-1">
                              {item?.label ?? ""}
                            </div>
                          </div>
                        )}
                        <div className="flex items-center justify-center">
                          {(item.label === "Product Card" || item.label === "Product Description Card") ? (
                            <div className="w-full rounded-lg overflow-hidden border border-[var(--builder-border)] bg-[var(--builder-surface-3)]" style={{ height: 100 }}>
                              {item.label === "Product Card" ? (
                                <div style={{ display: "flex", height: "100%", gap: 1 }}>
                                  {[1,2,3].map((i) => (
                                    <div key={i} style={{ flex: 1, background: "var(--builder-surface-2)", display: "flex", flexDirection: "column", borderRight: i < 3 ? "1px solid var(--builder-border)" : undefined }}>
                                      <div style={{ flex: 1, background: "var(--builder-border)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-[var(--builder-text-faint)]"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>
                                      </div>
                                      <div style={{ padding: "4px 5px", display: "flex", flexDirection: "column", gap: 3 }}>
                                        <div style={{ height: 5, background: "var(--builder-border-mid)", borderRadius: 2, width: "80%" }} />
                                        <div style={{ height: 4, background: "var(--builder-border)", borderRadius: 2, width: "55%" }} />
                                        <div style={{ height: 10, background: "var(--builder-text-faint)", borderRadius: 2, opacity: 0.3 }} />
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <div style={{ display: "flex", height: "100%" }}>
                                  <div style={{ width: "40%", background: "var(--builder-border)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-[var(--builder-text-faint)]"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>
                                  </div>
                                  <div style={{ flex: 1, padding: "10px 10px", display: "flex", flexDirection: "column", gap: 5, justifyContent: "center", background: "var(--builder-surface-2)" }}>
                                    <div style={{ height: 6, background: "var(--builder-border-mid)", borderRadius: 2, width: "85%" }} />
                                    <div style={{ height: 4, background: "var(--builder-border)", borderRadius: 2 }} />
                                    <div style={{ height: 4, background: "var(--builder-border)", borderRadius: 2, width: "90%" }} />
                                    <div style={{ height: 4, background: "var(--builder-border)", borderRadius: 2, width: "70%" }} />
                                    <div style={{ height: 6, background: "var(--builder-border-mid)", borderRadius: 2, width: "40%", marginTop: 2 }} />
                                    <div style={{ height: 14, border: "1px solid var(--builder-border-mid)", borderRadius: 3 }} />
                                  </div>
                                </div>
                              )}
                            </div>
                          ) : (
                            <AssetLivePreview
                              item={item}
                              previewMode={iconFolder ? "icon" : shapeFolder ? "shape" : "full"}
                            />
                          )}
                        </div>
                      </div>
                    </div>
                  );
                };

                if (iconFolder && groupedIconItems) {
                  return (
                    <div className="space-y-4 p-0.5">
                      {ICON_GROUP_ORDER.map((groupName) => {
                        const items = groupedIconItems[groupName];
                        if (!items.length) return null;
                        return (
                          <div key={groupName} className="space-y-2">
                            <div className="px-0.5 text-[10px] font-black uppercase tracking-[0.16em] text-[var(--builder-text-faint)]">
                              {groupName}
                            </div>
                            <div className="grid grid-cols-4 gap-2">
                              {items.map(({ item, idx }) => renderAssetCard(item, idx))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                }

                return (
                  <div
                    className={`grid gap-2 p-0.5 ${shapeFolder ? "grid-cols-2" : "grid-cols-1"}`}
                  >
                    {activeGroup.items.map((item: AssetItem, idx: number) => renderAssetCard(item, idx))}
                  </div>
                );
              })()
            ) : (
              <div className="rounded-sm border border-transparent bg-transparent p-4 text-center text-xs text-[var(--builder-text-faint)]">
                Select a category.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
