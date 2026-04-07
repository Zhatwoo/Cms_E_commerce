"use client";

import React, { useState, useCallback } from "react";
import { ScrollTrigger } from "gsap/dist/ScrollTrigger";
import type { BuilderDocument, CleanNode, ComponentType } from "../_types/schema";
import type { AnimationConfig } from "../_types/animation";
import type { Interaction, PrototypeConfig, TransitionType } from "../_types/prototype";
import { AnimationWrapper, hasActiveAnimation } from "./animationEngine";
import { getComponentDefaults } from "./serializer";
import { PREVIEW_MOBILE_BREAKPOINT, PREVIEW_TABLET_BREAKPOINT } from "@/app/design/_lib/viewportConstants";
import { Icon as DesignIcon } from "../_designComponents/Icon/Icon";
import { ProfileLoginBlock } from "@/app/_assets/Header/profile-login/ProfileLoginBlock";

/** When provided, the storefront can show real products and handle Add to Cart in place of static product cards. */
export type StoreContext = {
  products: Array<{ id: string; name: string; price: number; description?: string; images?: string[] }>;
  addToCart: (product: { id: string; name: string; price: number; image?: string }) => void;
};

type StoreProduct = StoreContext["products"][number];

type ProductBindingField = "name" | "price" | "description" | "image" | "addToCart";

type ProductBinding = {
  rootNodeId: string;
  product: StoreProduct;
  productIndex: number;
  roles: {
    imageNodeId: string | null;
    nameNodeId: string | null;
    priceNodeId: string | null;
    descriptionNodeId: string | null;
    buttonNodeIds: Set<string>;
  };
};

function hasAddToCartButton(nodeId: string, nodes: Record<string, CleanNode>): boolean {
  const node = nodes[nodeId];
  if (!node) return false;
  if (node.type === "Button") {
    const label = (node.props?.label as string) ?? "";
    return label.trim().toLowerCase().includes("add to cart");
  }
  const childIds = node.children ?? [];
  return childIds.some((id) => hasAddToCartButton(id, nodes));
}

function looksLikeAddToCartLabel(label: string): boolean {
  return label.trim().toLowerCase().includes("add to cart");
}

function normalizeStoreProductField(value: unknown): ProductBindingField | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim().toLowerCase();
  if (!normalized) return null;
  if (normalized === "name" || normalized === "title" || normalized === "product-name" || normalized === "productname") return "name";
  if (normalized === "price" || normalized === "product-price" || normalized === "productprice") return "price";
  if (normalized === "description" || normalized === "details" || normalized === "product-description" || normalized === "productdescription") return "description";
  if (normalized === "image" || normalized === "product-image" || normalized === "productimage") return "image";
  if (normalized === "addtocart" || normalized === "add-to-cart" || normalized === "cart" || normalized === "cta") return "addToCart";
  return null;
}

function getExplicitProductField(props: Record<string, unknown>): ProductBindingField | null {
  return (
    normalizeStoreProductField(props.productField) ||
    normalizeStoreProductField(props.storeField) ||
    normalizeStoreProductField(props.bindingField) ||
    normalizeStoreProductField(props.contentRole)
  );
}

function collectSubtreeNodeIds(rootNodeId: string, nodes: Record<string, CleanNode>): string[] {
  const ordered: string[] = [];
  const queue: string[] = [rootNodeId];
  const seen = new Set<string>();

  while (queue.length > 0) {
    const currentId = queue.shift();
    if (!currentId || seen.has(currentId)) continue;
    seen.add(currentId);
    const current = nodes[currentId];
    if (!current) continue;
    ordered.push(currentId);
    for (const childId of current.children ?? []) {
      queue.push(childId);
    }
  }

  return ordered;
}

function looksLikePriceText(text: string): boolean {
  const normalized = text.trim().toLowerCase();
  return /(php|₱|p\s?\d|price)/i.test(normalized) || /\d[\d,]*(\.\d{1,2})?/.test(normalized);
}

function looksLikeBadgeText(text: string): boolean {
  const normalized = text.trim();
  if (!normalized) return false;
  const lower = normalized.toLowerCase();
  if (/(off|sale|new arrival|best seller|editor'?s pick|limited|promo)/i.test(lower)) return true;
  return normalized.length <= 24 && normalized === normalized.toUpperCase();
}

function toFontWeightScore(value: unknown): number {
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
    if (value.toLowerCase() === "bold") return 700;
    if (value.toLowerCase() === "semibold") return 600;
  }
  return 400;
}

function analyzeProductCardTemplate(rootNodeId: string, nodes: Record<string, CleanNode>): ProductBinding["roles"] {
  const subtreeIds = collectSubtreeNodeIds(rootNodeId, nodes);
  const textCandidates: Array<{
    id: string;
    text: string;
    fontSize: number;
    fontWeight: number;
    explicitField: ProductBindingField | null;
  }> = [];
  const imageCandidates: Array<{ id: string; explicitField: ProductBindingField | null }> = [];
  const buttonNodeIds = new Set<string>();

  for (const id of subtreeIds) {
    const current = nodes[id];
    if (!current) continue;
    const currentType = String(current.type || "").toLowerCase();
    const currentProps = (current.props ?? {}) as Record<string, unknown>;
    const explicitField = getExplicitProductField(currentProps);

    if (currentType === "image") {
      imageCandidates.push({ id, explicitField });
      continue;
    }

    if (currentType === "button") {
      const label = String(currentProps.label ?? "").trim();
      if (explicitField === "addToCart" || looksLikeAddToCartLabel(label)) {
        buttonNodeIds.add(id);
      }
      continue;
    }

    if (currentType === "text") {
      const text = String(currentProps.text ?? "").trim();
      if (!text) continue;
      textCandidates.push({
        id,
        text,
        fontSize: parsePixelValue(currentProps.fontSize) ?? toNumber(currentProps.fontSize, 16),
        fontWeight: toFontWeightScore(currentProps.fontWeight),
        explicitField,
      });
    }
  }

  const imageNodeId =
    imageCandidates.find((candidate) => candidate.explicitField === "image")?.id ??
    imageCandidates[0]?.id ??
    null;

  const priceNodeId =
    textCandidates
      .map((candidate) => {
        let score = 0;
        if (candidate.explicitField === "price") score += 1000;
        if (looksLikePriceText(candidate.text)) score += 180;
        score += Math.min(50, candidate.fontWeight / 20);
        if (candidate.fontSize >= 14 && candidate.fontSize <= 28) score += 20;
        return { id: candidate.id, score };
      })
      .sort((a, b) => b.score - a.score)[0]?.score > 0
      ? textCandidates
        .map((candidate) => {
          let score = 0;
          if (candidate.explicitField === "price") score += 1000;
          if (looksLikePriceText(candidate.text)) score += 180;
          score += Math.min(50, candidate.fontWeight / 20);
          if (candidate.fontSize >= 14 && candidate.fontSize <= 28) score += 20;
          return { id: candidate.id, score };
        })
        .sort((a, b) => b.score - a.score)[0]?.id ?? null
      : null;

  const remainingTextCandidates = textCandidates.filter((candidate) => candidate.id !== priceNodeId);

  const nameNodeId =
    remainingTextCandidates
      .map((candidate) => {
        let score = 0;
        const lower = candidate.text.toLowerCase();
        if (candidate.explicitField === "name") score += 1000;
        if (/product name|luminous glow serum|rose toner mist|nourish face cream/i.test(lower)) score += 180;
        if (!looksLikeBadgeText(candidate.text) && !looksLikePriceText(candidate.text)) score += 60;
        if (candidate.fontWeight >= 600) score += 35;
        if (candidate.fontSize >= 12 && candidate.fontSize <= 24) score += 25;
        if (candidate.text.length <= 40) score += 10;
        if (looksLikeBadgeText(candidate.text)) score -= 150;
        return { id: candidate.id, score };
      })
      .sort((a, b) => b.score - a.score)[0]?.score > 0
      ? remainingTextCandidates
        .map((candidate) => {
          let score = 0;
          const lower = candidate.text.toLowerCase();
          if (candidate.explicitField === "name") score += 1000;
          if (/product name|luminous glow serum|rose toner mist|nourish face cream/i.test(lower)) score += 180;
          if (!looksLikeBadgeText(candidate.text) && !looksLikePriceText(candidate.text)) score += 60;
          if (candidate.fontWeight >= 600) score += 35;
          if (candidate.fontSize >= 12 && candidate.fontSize <= 24) score += 25;
          if (candidate.text.length <= 40) score += 10;
          if (looksLikeBadgeText(candidate.text)) score -= 150;
          return { id: candidate.id, score };
        })
        .sort((a, b) => b.score - a.score)[0]?.id ?? null
      : null;

  const descriptionNodeId =
    remainingTextCandidates
      .filter((candidate) => candidate.id !== nameNodeId)
      .map((candidate) => {
        let score = 0;
        const lower = candidate.text.toLowerCase();
        if (candidate.explicitField === "description") score += 1000;
        if (/[·-]/.test(candidate.text) || /\bml\b|vitamin|hydrating|brightening|sensitive/i.test(lower)) score += 160;
        if (candidate.text.length >= 24) score += 60;
        if (candidate.fontSize <= 14) score += 25;
        if (looksLikePriceText(candidate.text) || looksLikeBadgeText(candidate.text)) score -= 200;
        return { id: candidate.id, score };
      })
      .sort((a, b) => b.score - a.score)[0]?.score > 0
      ? remainingTextCandidates
        .filter((candidate) => candidate.id !== nameNodeId)
        .map((candidate) => {
          let score = 0;
          const lower = candidate.text.toLowerCase();
          if (candidate.explicitField === "description") score += 1000;
          if (/[·-]/.test(candidate.text) || /\bml\b|vitamin|hydrating|brightening|sensitive/i.test(lower)) score += 160;
          if (candidate.text.length >= 24) score += 60;
          if (candidate.fontSize <= 14) score += 25;
          if (looksLikePriceText(candidate.text) || looksLikeBadgeText(candidate.text)) score -= 200;
          return { id: candidate.id, score };
        })
        .sort((a, b) => b.score - a.score)[0]?.id ?? null
      : null;

  return {
    imageNodeId,
    nameNodeId,
    priceNodeId,
    descriptionNodeId,
    buttonNodeIds,
  };
}

function resolveExplicitProduct(
  props: Record<string, unknown>,
  storeContext: StoreContext,
): StoreProduct | null {
  const explicitId =
    [props.productId, props.boundProductId, props.storeProductId, props.product_id]
      .find((value) => typeof value === "string" && value.trim()) as string | undefined;
  if (explicitId) {
    const normalized = explicitId.trim().toLowerCase();
    const matched =
      storeContext.products.find((product) => String(product.id).trim().toLowerCase() === normalized) ??
      storeContext.products.find((product) => String((product as { slug?: string }).slug ?? "").trim().toLowerCase() === normalized);
    if (matched) return matched;
  }

  const explicitIndex = toNumber(props.productIndex, NaN);
  if (Number.isFinite(explicitIndex) && explicitIndex >= 0) {
    return storeContext.products[Math.min(storeContext.products.length - 1, Math.floor(explicitIndex))] ?? null;
  }

  return null;
}

function hasExplicitProductReference(props: Record<string, unknown>): boolean {
  const explicitId = [props.productId, props.boundProductId, props.storeProductId, props.product_id]
    .some((value) => typeof value === "string" && value.trim());
  if (explicitId) return true;

  const explicitIndex = toNumber(props.productIndex, NaN);
  return Number.isFinite(explicitIndex) && explicitIndex >= 0;
}

function createProductBinding(
  rootNodeId: string,
  fallbackProductIndex: number,
  nodes: Record<string, CleanNode>,
  storeContext: StoreContext,
): ProductBinding | null {
  const rootNode = nodes[rootNodeId];
  if (!rootNode || storeContext.products.length === 0) return null;
  const rootProps = (rootNode.props ?? {}) as Record<string, unknown>;
  const explicit = resolveExplicitProduct(rootProps, storeContext);
  if (hasExplicitProductReference(rootProps) && !explicit) {
    return null;
  }
  const product =
    explicit ??
    storeContext.products[Math.min(storeContext.products.length - 1, Math.max(0, fallbackProductIndex))] ??
    null;
  if (!product) return null;
  const resolvedProductIndex = storeContext.products.findIndex((candidate) => candidate.id === product.id);

  return {
    rootNodeId,
    product,
    productIndex: resolvedProductIndex >= 0 ? resolvedProductIndex : fallbackProductIndex,
    roles: analyzeProductCardTemplate(rootNodeId, nodes),
  };
}

function resolveProductFieldForNode(
  nodeId: string | undefined,
  type: ComponentType,
  props: Record<string, unknown>,
  productBinding?: ProductBinding | null,
): ProductBindingField | null {
  if (!productBinding || !nodeId) return null;
  const explicitField = getExplicitProductField(props);
  if (explicitField) return explicitField;
  if (type === "Image" && productBinding.roles.imageNodeId === nodeId) return "image";
  if (type === "Button" && productBinding.roles.buttonNodeIds.has(nodeId)) return "addToCart";
  if (type === "Text") {
    if (productBinding.roles.priceNodeId === nodeId) return "price";
    if (productBinding.roles.nameNodeId === nodeId) return "name";
    if (productBinding.roles.descriptionNodeId === nodeId) return "description";
  }
  return null;
}

function formatStorePrice(price: number): string {
  return `PHP ${price.toFixed(2)}`;
}

/** Default links for common nav/CTA labels so the storefront viewport is functional without editing each button. */
function getDefaultLinkForLabel(label: string): string {
  const t = label.trim().toLowerCase();
  if (t === "home") return "#";
  if (t === "about") return "#about";
  if (t === "products") return "#products";
  if (t === "contact") return "#contact";
  if (t === "services") return "#services";
  if (t === "learn more" || t === "start building") return "#";
  if (t === "logo") return "#";
  return "";
}

function toNumber(value: unknown, fallback: number): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
}

function shouldRenderNodeAtWidth(props: Record<string, unknown>, viewportWidth: number, defaultBreakpoint: number = PREVIEW_MOBILE_BREAKPOINT): boolean {
  const breakpoint = toNumber(props.mobileBreakpoint, defaultBreakpoint);
  const isMobile = viewportWidth <= breakpoint;
  const showOn = (props.showOn as string | undefined)?.toLowerCase();

  if (showOn === "mobile") return isMobile;
  if (showOn === "desktop") return !isMobile;
  return true;
}

function getCollapsibleKey(props: Record<string, unknown>): string | null {
  const key = props.collapsibleKey;
  return typeof key === "string" && key.trim() ? key.trim() : null;
}

function isCollapsibleOpen(
  props: Record<string, unknown>,
  viewportWidth: number,
  interactionState: Record<string, boolean>,
  availableTriggerTargets: Set<string>
): boolean {
  const key = getCollapsibleKey(props);
  if (!key) return true;
  if (!availableTriggerTargets.has(key)) return true;

  const controlled = interactionState[key];
  if (typeof controlled === "boolean") return controlled;

  const breakpoint = toNumber(props.mobileBreakpoint, PREVIEW_MOBILE_BREAKPOINT);
  const isMobile = viewportWidth <= breakpoint;
  if (typeof props.defaultOpen === "boolean") return props.defaultOpen;
  if (isMobile && typeof props.defaultOpenMobile === "boolean") return props.defaultOpenMobile;
  if (!isMobile && typeof props.defaultOpenDesktop === "boolean") return props.defaultOpenDesktop;
  // Keep existing designs visible by default unless explicitly configured to start closed.
  return true;
}

function getToggleTarget(props: Record<string, unknown>): string | null {
  const key = props.toggleTarget;
  return typeof key === "string" && key.trim() ? key.trim() : null;
}

function getTriggerAction(props: Record<string, unknown>): "toggle" | "open" | "close" {
  const action = props.triggerAction;
  if (action === "open" || action === "close" || action === "toggle") return action;
  return "toggle";
}

function useContainerWidth(defaultWidth = 1200): {
  ref: React.RefObject<HTMLDivElement | null>;
  width: number;
} {
  const ref = React.useRef<HTMLDivElement>(null);
  const [width, setWidth] = React.useState(defaultWidth);

  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const updateWidth = () => {
      const w = el.clientWidth;
      // Tab in background / layout not ready often reports 0 — keep last width to avoid scale/width jumps.
      if (!Number.isFinite(w) || w <= 0) return;
      setWidth(w);
    };

    updateWidth();

    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", updateWidth);
      return () => window.removeEventListener("resize", updateWidth);
    }

    const observer = new ResizeObserver(() => {
      requestAnimationFrame(updateWidth);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [defaultWidth]);

  return { ref, width };
}

/** Responsive asset styles: images/video inside frame scale properly on all devices */
const frameResponsiveStyles = (
  <style dangerouslySetInnerHTML={{
    __html: `
      .frame-responsive-inner img,
      .frame-responsive-inner video,
      .frame-responsive-inner iframe,
      .frame-responsive-inner [data-responsive-asset] {
        max-width: 100%;
        width: 100%;
        min-width: 0;
        height: auto;
        object-fit: cover;
        display: block;
      }
      .frame-responsive-inner table { width: 100%; max-width: 100%; display: block; overflow-x: auto; }
      
      /* Fluid mode: same as canvas — responsive reflow so phone preview matches */
      .frame-responsive-inner.frame-fluid {
        width: 100% !important;
        max-width: 100% !important;
        min-width: 0 !important;
      }
      .frame-responsive-inner.frame-fluid * { box-sizing: border-box; }
      .frame-responsive-inner.frame-fluid > * {
        max-width: 100% !important;
        min-width: 0 !important;
      }
      .frame-responsive-inner.frame-fluid img,
      .frame-responsive-inner.frame-fluid video,
      .frame-responsive-inner.frame-fluid iframe {
        max-width: 100% !important;
        width: 100% !important;
        min-width: 0 !important;
        height: auto !important;
        display: block !important;

      .frame-responsive-inner.frame-fluid [data-node-id] {
        max-width: 100% !important;
        min-width: 0;
        overflow-wrap: break-word;
        word-break: break-word;
        transition:
          width 180ms ease,
          max-width 180ms ease,
          padding 180ms ease,
          margin 180ms ease,
          transform 180ms ease,
          opacity 180ms ease;
      }

      /* Tablet & Smaller: Intermediate Reflow */
      @container (max-width: 950px) {
        .frame-fluid [data-layout="row"],
        .frame-responsive-inner [data-layout="row"] {
          flex-wrap: wrap !important;
          gap: clamp(10px, 1.8cqw, 16px) !important;
        }
        .frame-fluid [data-layout="row"] > *,
        .frame-responsive-inner [data-layout="row"] > * {
          min-width: 250px !important;
          flex: 1 1 250px !important;
        }
        [data-fluid-text="true"] {
          --fluid-font-cqw: 1.8cqw;
        }
      }

      [data-page-node].is-tablet-view {
        width: 100% !important;
        max-width: 100% !important;
      }
      .is-tablet-view .frame-fluid [data-layout="row"],
      .is-tablet-view .frame-responsive-inner [data-layout="row"] {
        flex-wrap: wrap !important;
        gap: 20px !important;
        display: flex !important;
        flex-direction: row !important;
        width: 100% !important;
      }
      .is-tablet-view [data-layout="row"] > * {
        min-width: 300px !important;
        flex: 1 1 300px !important;
        max-width: 100% !important;
        width: 100% !important;
      }
      .is-tablet-view [data-node-id]:not([data-animated="true"]),
      .is-tablet-view img:not([data-animated="true"]),
      .is-tablet-view video:not([data-animated="true"]) {
        width: 100% !important;
        max-width: 100% !important;
        position: relative !important;
        left: 0 !important;
        top: 0 !important;
        transform: none !important;
      }
      .is-tablet-view img,
      .is-tablet-view video {
        height: auto !important;
        object-fit: cover !important;
      }

      /* Refined Tablet (Standard iPad) */
      @container (max-width: 768px) {
        [data-layout="row"] {
          gap: clamp(10px, 1.6cqw, 14px) !important;
          justify-content: center !important;
          flex-wrap: wrap !important;
        }
        [data-layout="row"] > * {
          min-width: 200px !important;
          flex: 1 1 200px !important;
          max-width: 100% !important;
        }
        [data-fluid-text="true"] {
          --fluid-font-cqw: 2.2cqw;
        }
        [data-fluid-space="true"] {
          padding-left: clamp(12px, 2.2cqw, 20px) !important;
          padding-right: clamp(12px, 2.2cqw, 20px) !important;
        }
      }

      /* Mobile: Full Stacking & Fluid Scaling */
      @container (max-width: 640px) {
        .frame-responsive-inner,
        .frame-fluid {
          display: flex !important;
          flex-direction: column !important;
          align-items: stretch !important;
          width: 100% !important;
        }

        .frame-fluid > *,
        .frame-responsive-inner > *,
        [data-node-id] {
          width: 100% !important;
          max-width: 100% !important;
          min-width: 0 !important;
          flex-grow: 1 !important;
        }
        
        .frame-responsive-inner > * + * {
          margin-top: clamp(12px, 3.2cqw, 18px) !important;
        }

        [data-layout="row"],
        [data-layout="column"] {
          flex-direction: column !important;
          align-items: stretch !important;
          height: auto !important;
          min-height: 0 !important;
          width: 100% !important;
          display: flex !important;
          gap: clamp(12px, 3cqw, 20px) !important;
        }

        [data-layout="row"] > *,
        [data-layout="column"] > * {
          width: 100% !important;
          max-width: 100% !important;
          min-width: 0 !important;
          flex: 1 1 100% !important;
          margin-left: 0 !important;
          margin-right: 0 !important;
        }

        [data-fluid-space="true"] {
          padding-left: clamp(10px, 3.5cqw, 28px) !important;
          padding-right: clamp(10px, 3.5cqw, 28px) !important;
          margin-left: 0 !important;
          margin-right: 0 !important;
          height: auto !important;
          min-height: 0 !important;
        }

        [data-fluid-media="true"],
        [data-fluid-button="true"],
        [data-fluid-grid="true"],
        img, 
        video {
          width: 100% !important;
          max-width: 100% !important;
          min-width: 0 !important;
          height: auto !important;
          min-height: 0 !important;
        }

        [data-fluid-grid="true"] {
          grid-template-columns: 1fr !important;
          gap: clamp(14px, 3.2cqw, 26px) !important;
          display: grid !important;
        }

        [data-fluid-button="true"] {
          display: flex !important;
          justify-content: center !important;
          padding: clamp(10px, 2.8cqw, 16px) clamp(20px, 4cqw, 32px) !important;
        }

        .frame-responsive-inner [style*="position: absolute"]:not([data-preserve-position="true"]):not([data-animated="true"]),
        .frame-responsive-inner [style*="position:absolute"]:not([data-preserve-position="true"]):not([data-animated="true"]),
        .frame-responsive-inner [style*="position: fixed"]:not([data-preserve-position="true"]):not([data-animated="true"]),
        .frame-responsive-inner [style*="position:fixed"]:not([data-preserve-position="true"]):not([data-animated="true"]) {
          position: relative !important;
          left: auto !important;
          right: auto !important;
          top: auto !important;
          bottom: auto !important;
          transform: none !important;
          width: 100% !important;
          margin-bottom: 12px !important;
        }

        [data-fluid-text="true"] {
          white-space: pre-wrap !important;
          overflow-wrap: anywhere !important;
          word-break: break-word !important;
          --fluid-font-cqw: 3.6cqw;
          line-height: 1.5 !important;
        }

        /* Better image scaling on mobile */
        img, video, iframe {
          border-radius: clamp(4px, 1.5cqw, 8px) !important;
        }
      }

      /* Class-based fallback for Editor Reliability (Mobile) */
      .is-mobile-view.frame-responsive-inner,
      .is-mobile-view.frame-fluid,
      [data-page-node].is-mobile-view {
        display: flex !important;
        flex-direction: column !important;
        align-items: stretch !important;
        width: 100% !important;
      }
      .is-mobile-view [data-node-id]:not([data-animated="true"]),
      .is-mobile-view [data-node-id] > *:not([data-animated="true"]),
      .is-mobile-view [data-fluid-media="true"]:not([data-animated="true"]),
      .is-mobile-view img:not([data-animated="true"]),
      .is-mobile-view video:not([data-animated="true"]) {
        width: 100% !important;
        min-width: 100% !important;
        max-width: 100% !important;
        position: relative !important;
        left: 0 !important;
        right: 0 !important;
        top: 0 !important;
        transform: none !important;
        margin-left: 0 !important;
        margin-right: 0 !important;
      }
      .is-mobile-view [data-layout="row"] {
        flex-direction: column !important;
        align-items: stretch !important;
        display: flex !important;
      }
      .is-mobile-view [data-layout="row"] > * {
        width: 100% !important;
        flex: 1 1 100% !important;
      }

      @container (max-width: 400px) {
        .frame-responsive-inner.frame-fluid:not(.builder-parity-narrow) [data-layout="row"] { gap: clamp(6px, 2cqw, 12px) !important; }
      }
    `,
  }} />
);

/** Responsive Navigation Component - converts nav bars to hamburger menu on mobile */
function ResponsiveNav({ children, containerStyle, onClick, className, dataMobileOverflow, nodeId, nodeType }: {
  children: React.ReactNode;
  containerStyle: React.CSSProperties;
  onClick?: () => void;
  className?: string;
  dataMobileOverflow?: "true";
  nodeId?: string;
  nodeType?: string;
}) {
  const [isOpen, setIsOpen] = React.useState(false);
  const navRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  return (
    <div
      ref={navRef}
      data-nav-container
      data-fluid-space="true"
      data-node-id={nodeId}
      data-node-type={nodeType}
      data-mobile-overflow={dataMobileOverflow}
      className={className}
      style={{ ...containerStyle, position: "relative" }}
      onClick={onClick}
    >
      <div className={`nav-menu ${isOpen ? "open" : ""}`}>
        {children}
      </div>
      <button
        className={`nav-hamburger ${isOpen ? "active" : ""}`}
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        aria-label="Toggle menu"
        aria-expanded={isOpen}
        style={{
          color: "inherit",
          display: "none",
          flexDirection: "column",
          gap: "4px",
          background: "transparent",
          border: "none",
          cursor: "pointer",
          padding: "8px",
          zIndex: 1001,
          position: "relative"
        }}
      >
        <span style={{ display: "block", width: "24px", height: "2px", backgroundColor: "currentColor", transition: "all 0.3s ease" }}></span>
        <span style={{ display: "block", width: "24px", height: "2px", backgroundColor: "currentColor", transition: "all 0.3s ease" }}></span>
        <span style={{ display: "block", width: "24px", height: "2px", backgroundColor: "currentColor", transition: "all 0.3s ease" }}></span>
      </button>
    </div>
  );
}

/** hamburger dropdown only on Header assets (data-header, class "header", or role="banner"). */
function enhanceNavInPreview(innerEl: HTMLElement | null) {
  if (!innerEl) return;
  const looksLikeMenuLabel = (text: string): boolean => {
    const normalized = text.trim().toLowerCase();
    if (!normalized) return false;
    if (normalized.length > 28) return false;
    if (/[0-9]/.test(normalized)) return false;
    const words = normalized.split(/\s+/).filter(Boolean);
    if (words.length > 3) return false;
    return true;
  };
  const isHeaderAsset = (el: HTMLElement): boolean => {
    const tag = el.tagName.toLowerCase();
    if (el.getAttribute("data-header") !== null) return true;
    if (/header/i.test((el.className || "") as string)) return true;
    if (el.getAttribute("role") === "banner") return true;
    if (el.getAttribute("role") === "navigation") return true;
    if (tag === "header" || tag === "nav") return true;
    if (el.querySelector("ul") && (el.querySelector("a") || el.querySelector("li"))) return true;
    return false;
  };
  const enhance = (container: HTMLElement): boolean => {
    if (container.hasAttribute("data-nav-enhanced")) return false;
    const existing = Array.from(container.children).filter((c) => !(c as HTMLElement).classList.contains("nav-hamburger"));
    if (existing.length < 2) return false;
    const navChildren: Element[] = [];
    for (const c of existing) {
      const el = c as HTMLElement;
      if (el.tagName === "UL" || el.querySelector("ul")) navChildren.push(c);
    }

    const textLikeChildren = existing.filter((c) => {
      const el = c as HTMLElement;
      if (el.querySelector("img, video, iframe, input, textarea, form")) return false;
      const hasInteractive = Boolean(el.querySelector("a, button, [role='button']"));
      const text = (el.textContent || "").trim();
      if (!text) return false;
      return hasInteractive || looksLikeMenuLabel(text);
    });

    const toDrop =
      navChildren.length > 0
        ? navChildren
        : textLikeChildren.length >= 2
          ? textLikeChildren
          : existing.length > 1
            ? existing.slice(1)
            : [];

    const menuWrapper = document.createElement("div");
    menuWrapper.className = "nav-menu";
    toDrop.forEach((c) => menuWrapper.appendChild(c));
    if (menuWrapper.children.length === 0) return false;
    container.setAttribute("data-nav-enhanced", "true");
    container.setAttribute("data-nav-container", "true");
    container.append(menuWrapper);
    const hamburger = document.createElement("button");
    hamburger.className = "nav-hamburger";
    hamburger.setAttribute("aria-label", "Toggle menu");
    hamburger.setAttribute("aria-expanded", "false");
    hamburger.type = "button";
    for (let i = 0; i < 3; i++) hamburger.appendChild(document.createElement("span"));
    hamburger.addEventListener("click", (e) => {
      e.stopPropagation();
      e.preventDefault();
      const menu = container.querySelector(".nav-menu");
      if (menu) {
        menu.classList.toggle("open");
        hamburger.classList.toggle("active");
        hamburger.setAttribute("aria-expanded", String(menu.classList.contains("open")));
      }
    });
    container.appendChild(hamburger);
    return true;
  };
  const containers = innerEl.querySelectorAll("header, nav, div, section");
  for (const c of containers) {
    const el = c as HTMLElement;
    if (el.classList.contains("nav-menu") || el.classList.contains("nav-hamburger")) continue;
    if (isHeaderAsset(el)) {
      const enhanced = enhance(el);
      if (enhanced) break;
    }
  }
}

/** Wrapper that measures container size and scales inner content for responsiveness (desktop/tablet/mobile). */

function normalizeContainerHeight(value: unknown): string {
  if (value == null) return "240px";
  const text = String(value).trim().toLowerCase();
  return text === "auto" ? "240px" : String(value);
}


// Default props per type (merge with node.props for full props). Minimal set for rendering.
const DEFAULTS: Record<string, Record<string, unknown>> = {
  Page: { width: "1920px", height: "1200px", background: "#ffffff", pageName: "Page Name", pageSlug: "page" },
  Container: {
    background: "#27272a",
    padding: 20,
    paddingTop: 20,
    paddingRight: 20,
    paddingBottom: 20,
    paddingLeft: 20,
    margin: 0,
    marginTop: 0,
    marginRight: 0,
    marginBottom: 0,
    marginLeft: 0,
    width: "100%",
    height: "240px",
    backgroundImage: "",
    backgroundSize: "cover",
    backgroundPosition: "center",
    backgroundRepeat: "no-repeat",
    backgroundOverlay: "",
    borderRadius: 0,
    borderColor: "transparent",
    borderWidth: 0,
    borderStyle: "solid",
    flexDirection: "column",
    flexWrap: "nowrap",
    alignItems: "flex-start",
    justifyContent: "flex-start",
    gap: 0,
    gridTemplateColumns: "1fr 1fr",
    gridTemplateRows: "auto",
    gridGap: 0,
    gridColumnGap: 0,
    gridRowGap: 0,
    gridAutoRows: "auto",
    gridAutoFlow: "row",
    position: "static",
    display: "flex",
    zIndex: 0,
    top: "auto",
    right: "auto",
    bottom: "auto",
    left: "auto",
    boxShadow: "none",
    opacity: 1,
    overflow: "visible",
    cursor: "default",
  },
  Text: {
    text: "Edit me!",
    fontSize: 16,
    fontFamily: "Outfit",
    fontWeight: "400",
    lineHeight: 1.5,
    letterSpacing: 0,
    textAlign: "left",
    textTransform: "none",
    color: "#000000",
    margin: 0,
    marginTop: 0,
    marginRight: 0,
    marginBottom: 0,
    marginLeft: 0,
    padding: 0,
    paddingTop: 0,
    paddingRight: 0,
    paddingBottom: 0,
    paddingLeft: 0,
    opacity: 1,
    boxShadow: "none",
  },
  Image: {
    src: "https://placehold.co/600x400/27272a/a1a1aa?text=Image",
    alt: "Image",
    objectFit: "cover",
    width: "100%",
    height: "300px",
    borderRadius: 0,
    padding: 0,
    margin: 0,
    opacity: 1,
    boxShadow: "none",
  },
  Video: {
    src: "",
    autoPlay: false,
    loop: false,
    muted: true,
    controls: true,
    objectFit: "cover",
    width: "100%",
    height: "300px",
    borderRadius: 0,
    padding: 0,
    margin: 0,
    opacity: 1,
    boxShadow: "none",
  },
  Button: {
    label: "Button",
    link: "",
    variant: "primary",
    fontSize: 14,
    fontWeight: "500",
    fontFamily: "Outfit",
    borderRadius: 8,
    width: "auto",
    height: "auto",
    paddingTop: 12,
    paddingBottom: 12,
    paddingLeft: 28,
    paddingRight: 28,
    margin: 0,
    opacity: 1,
    boxShadow: "none",
  },
  Divider: {
    dividerStyle: "solid",
    color: "#4a4a4a",
    thickness: 1,
    width: "100%",
    marginTop: 8,
    marginBottom: 8,
  },
  Section: {
    background: "transparent",
    padding: 40,
    margin: 0,
    width: "100%",
    height: "auto",
    backgroundImage: "",
    backgroundSize: "cover",
    backgroundPosition: "center",
    backgroundRepeat: "no-repeat",
    backgroundOverlay: "",
    borderRadius: 0,
    borderColor: "transparent",
    borderWidth: 0,
    borderStyle: "solid",
    flexDirection: "column",
    flexWrap: "nowrap",
    alignItems: "flex-start",
    justifyContent: "flex-start",
    gap: 0,
    display: "block",
    isFreeform: true,
    contentWidth: "full",
    contentMaxWidth: "none",
    boxShadow: "none",
    opacity: 1,
    overflow: "visible",
  },
  Row: {
    background: "transparent",
    padding: 0,
    margin: 0,
    width: "100%",
    height: "auto",
    borderRadius: 0,
    borderColor: "transparent",
    borderWidth: 0,
    borderStyle: "solid",
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "stretch",
    justifyContent: "flex-start",
    gap: 16,
    boxShadow: "none",
    opacity: 1,
    overflow: "visible",
  },
  Column: {
    background: "transparent",
    padding: 12,
    margin: 0,
    width: "auto",
    height: "auto",
    borderRadius: 0,
    borderColor: "transparent",
    borderWidth: 0,
    borderStyle: "solid",
    flexDirection: "column",
    flexWrap: "nowrap",
    alignItems: "flex-start",
    justifyContent: "flex-start",
    gap: 8,
    boxShadow: "none",
    opacity: 1,
    overflow: "visible",
  },
  Icon: {
    iconType: "home",
    size: 24,
    color: "currentColor",
    width: "auto",
    height: "auto",
    margin: 0,
    marginTop: 0,
    marginRight: 0,
    marginBottom: 0,
    marginLeft: 0,
    padding: 0,
    paddingTop: 0,
    paddingRight: 0,
    paddingBottom: 0,
    paddingLeft: 0,
    opacity: 1,
    link: "",
  },
  Spacer: {
    width: "100%",
    height: "20px",
    background: "transparent",
    padding: 0,
    margin: 0,
    borderRadius: 0,
    borderWidth: 0,
    borderColor: "transparent",
    borderStyle: "solid",
    opacity: 1,
    boxShadow: "none",
  },
  Pagination: {
    totalItems: 50,
    itemsPerPage: 10,
    currentPage: 1,
    type: "numbers",
    activeColor: "#3b82f6",
    gap: 8,
    prevText: "Prev",
    nextText: "Next",
    showIcons: true,
    width: "auto",
    height: "auto",
    padding: 0,
    margin: 0,
    color: "#a1a1aa",
    fontSize: 14,
    fontWeight: "400",
    textAlign: "center",
    background: "transparent",
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#3f3f46",
    borderStyle: "solid",
  },
  Badge: {
    background: "#16a34a",
    padding: 8,
    margin: 0,
    width: "120px",
    height: "36px",
    borderRadius: 999,
    borderColor: "transparent",
    borderWidth: 0,
    borderStyle: "solid",
    strokePlacement: "mid",
    display: "flex",
    flexDirection: "row",
    flexWrap: "nowrap",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    boxShadow: "none",
    opacity: 1,
    overflow: "hidden",
  },

  Circle: {
    color: "#10b981",
    width: "200px",
    height: "200px",
    background: "",
    borderColor: "transparent",
    borderWidth: 0,
    borderStyle: "solid",
    boxShadow: "none",
    opacity: 1,
    overflow: "visible",
    cursor: "default",
    margin: 0,
    marginTop: 0,
    marginRight: 0,
    marginBottom: 0,
    marginLeft: 0,
    padding: 0,
    paddingTop: 0,
    paddingRight: 0,
    paddingBottom: 0,
    paddingLeft: 0,
    position: "relative",
    display: "flex",
    zIndex: 0,
    top: "auto",
    right: "auto",
    bottom: "auto",
    left: "auto",
  },
  Square: {
    color: "#e74c3c",
    width: "200px",
    height: "200px",
    background: "",
    borderColor: "transparent",
    borderWidth: 0,
    borderStyle: "solid",
    boxShadow: "none",
    opacity: 1,
    overflow: "visible",
    cursor: "default",
    margin: 0,
    marginTop: 0,
    marginRight: 0,
    marginBottom: 0,
    marginLeft: 0,
    padding: 0,
    paddingTop: 0,
    paddingRight: 0,
    paddingBottom: 0,
    paddingLeft: 0,
    position: "relative",
    display: "flex",
    zIndex: 0,
    top: "auto",
    right: "auto",
    bottom: "auto",
    left: "auto",
  },
  Triangle: {
    color: "#3498db",
    width: "200px",
    height: "200px",
    background: "",
    borderColor: "transparent",
    borderWidth: 0,
    borderStyle: "solid",
    boxShadow: "none",
    opacity: 1,
    overflow: "visible",
    cursor: "default",
    margin: 0,
    marginTop: 0,
    marginRight: 0,
    marginBottom: 0,
    marginLeft: 0,
    padding: 0,
    paddingTop: 0,
    paddingRight: 0,
    paddingBottom: 0,
    paddingLeft: 0,
    position: "relative",
    display: "flex",
    zIndex: 0,
    top: "auto",
    right: "auto",
    bottom: "auto",
    left: "auto",
  },
  Accordion: {
    items: [],
    headerBg: "#1e1e2e",
    headerTextColor: "#e2e8f0",
    contentBg: "#12121c",
    contentTextColor: "#a0aec0",
    borderColor: "#2d2d44",
    borderWidth: 1,
    headerFontSize: 14,
    contentFontSize: 13,
    borderRadius: 8,
    backgroundColor: "transparent",
  },
};

function mergeProps(type: string, props: Record<string, unknown>): Record<string, unknown> {
  const sharedDefaults = getComponentDefaults(type);
  const fallbackDefaults = DEFAULTS[type] ?? {};
  const baseDefaults = Object.keys(sharedDefaults).length > 0 ? sharedDefaults : fallbackDefaults;
  return { ...baseDefaults, ...props };
}

function px(v: unknown): string {
  if (typeof v === "number") return `${v}px`;
  if (typeof v === "string") return v;
  return "0";
}

function fluidSpace(
  value: unknown,
  minFloor = 0,
  ratio = 0.45,
  cqw = 2.2,
  useFixedPx = false,
): string {
  const n = typeof value === "number" ? value : parsePixelValue(value);
  if (n === null || !Number.isFinite(n) || n <= 0) return `${minFloor}px`;
  if (useFixedPx) return `${n}px`;
  const min = Math.max(minFloor, Math.round(n * ratio));
  return `clamp(${min}px, ${cqw}cqw, ${n}px)`;
}

function fluidFont(maxPx: number, minFloor = 12, cqw = 3.2, useFixedPx = false): string {
  const safeMax = Number.isFinite(maxPx) && maxPx > 0 ? maxPx : minFloor;
  if (useFixedPx) return `${safeMax}px`;
  const min = Math.max(minFloor, Math.round(safeMax * 0.58));
  return `clamp(${min}px, ${cqw}cqw, ${safeMax}px)`;
}

type ResponsiveSpacingPreset = "default" | "hero" | "nav" | "cards";

function detectResponsiveSpacingPreset(nodeId: string | undefined, props: Record<string, unknown>): ResponsiveSpacingPreset {
  const hint = [
    nodeId ?? "",
    String(props.customClassName ?? ""),
    String(props.sectionType ?? ""),
    String(props.layoutPreset ?? ""),
    String(props.role ?? ""),
  ].join(" ").toLowerCase();

  if (/hero|banner|jumbotron/.test(hint)) return "hero";
  if (/nav|header|menu/.test(hint)) return "nav";
  if (/card|cards|pricing|feature|service|product|grid/.test(hint)) return "cards";
  return "default";
}

function getResponsiveSpacingTuning(
  preset: ResponsiveSpacingPreset,
  isNarrow: boolean,
  builderParityMode?: boolean,
): {
  paddingRatio: number;
  paddingCqw: number;
  marginRatio: number;
  marginCqw: number;
  gapRatio: number;
  gapCqw: number;
} {
  if (!isNarrow || builderParityMode) {
    return {
      paddingRatio: 0.45,
      paddingCqw: 2.2,
      marginRatio: 0.35,
      marginCqw: 1.4,
      gapRatio: 0.4,
      gapCqw: 1.8,
    };
  }

  if (preset === "hero") {
    return {
      paddingRatio: 0.28,
      paddingCqw: 3.4,
      marginRatio: 0.3,
      marginCqw: 1.6,
      gapRatio: 0.34,
      gapCqw: 2.6,
    };
  }
  if (preset === "nav") {
    return {
      paddingRatio: 0.22,
      paddingCqw: 2.2,
      marginRatio: 0.24,
      marginCqw: 1.2,
      gapRatio: 0.28,
      gapCqw: 1.6,
    };
  }
  if (preset === "cards") {
    return {
      paddingRatio: 0.32,
      paddingCqw: 2.4,
      marginRatio: 0.3,
      marginCqw: 1.4,
      gapRatio: 0.45,
      gapCqw: 2,
    };
  }

  return {
    paddingRatio: 0.38,
    paddingCqw: 2.4,
    marginRatio: 0.32,
    marginCqw: 1.5,
    gapRatio: 0.42,
    gapCqw: 2,
  };
}

type TypographyLevel = "h1" | "h2" | "h3" | "h4" | "h5" | "h6" | "body" | "caption";

function inferTypographyLevel(props: Record<string, unknown>, rawFontSize: number): TypographyLevel {
  const tag = String(props.tag ?? props.textTag ?? props.as ?? props.variant ?? "").trim().toLowerCase();
  if (tag === "h1") return "h1";
  if (tag === "h2") return "h2";
  if (tag === "h3") return "h3";
  if (tag === "h4") return "h4";
  if (tag === "h5") return "h5";
  if (tag === "h6") return "h6";
  if (tag.includes("heading") || tag.includes("title")) return rawFontSize >= 30 ? "h2" : "h3";
  if (tag.includes("body") || tag.includes("paragraph")) return "body";
  if (tag.includes("caption") || tag.includes("label") || tag.includes("small")) return "caption";

  if (rawFontSize >= 56) return "h1";
  if (rawFontSize >= 40) return "h2";
  if (rawFontSize >= 32) return "h3";
  if (rawFontSize >= 26) return "h4";
  if (rawFontSize >= 22) return "h5";
  if (rawFontSize >= 18) return "h6";
  if (rawFontSize >= 14) return "body";
  return "caption";
}

function getResponsiveTypographySpec(
  level: TypographyLevel,
  rawFontSize: number,
  isNarrow: boolean,
  builderParityMode?: boolean,
  useFixedPx = false,
): { fontSize: string; minLineHeight: number } {
  if (!isNarrow || builderParityMode) {
    return {
      fontSize: fluidFont(rawFontSize, 12, 3.2, useFixedPx),
      minLineHeight: 1.4,
    };
  }

  const map: Record<TypographyLevel, { minFloor: number; cqw: number; lineHeight: number }> = {
    h1: { minFloor: 26, cqw: 6.4, lineHeight: 1.12 },
    h2: { minFloor: 24, cqw: 5.8, lineHeight: 1.15 },
    h3: { minFloor: 22, cqw: 5.2, lineHeight: 1.18 },
    h4: { minFloor: 20, cqw: 4.8, lineHeight: 1.22 },
    h5: { minFloor: 18, cqw: 4.4, lineHeight: 1.26 },
    h6: { minFloor: 16, cqw: 4.1, lineHeight: 1.3 },
    body: { minFloor: 14, cqw: 3.6, lineHeight: 1.45 },
    caption: { minFloor: 12, cqw: 3.1, lineHeight: 1.45 },
  };

  const spec = map[level];
  return {
    fontSize: fluidFont(rawFontSize, spec.minFloor, spec.cqw, useFixedPx),
    minLineHeight: spec.lineHeight,
  };
}

function normalizePreviewWidth(
  widthValue: unknown,
  viewportWidth: number,
  builderParityMode?: boolean,
  mobileBreakpoint?: number,
): string | undefined {
  const isNarrow = !builderParityMode && viewportWidth <= toNumber(mobileBreakpoint, PREVIEW_TABLET_BREAKPOINT);
  if (typeof widthValue === "number") {
    if (!isNarrow) return `${widthValue}px`;
    return `min(100%, ${Math.max(1, widthValue)}px)`;
  }
  if (typeof widthValue === "string") {
    if (!isNarrow) return widthValue;

    const normalized = widthValue.trim().toLowerCase();
    if (!normalized || normalized === "auto") return widthValue;
    if (
      normalized.endsWith("%") ||
      normalized.includes("vw") ||
      normalized.startsWith("min(") ||
      normalized.startsWith("max(") ||
      normalized.startsWith("clamp(") ||
      normalized.startsWith("calc(")
    ) {
      return widthValue;
    }

    if (normalized.endsWith("px")) {
      const parsed = Number(normalized.slice(0, -2));
      if (Number.isFinite(parsed) && parsed > 0) {
        return `min(100%, ${parsed}px)`;
      }
    }

    return "100%";
  }
  return builderParityMode ? undefined : undefined;
}

function normalizeLayoutWidthForNarrow(
  widthValue: unknown,
  isNarrow: boolean,
  builderParityMode?: boolean,
): string | undefined {
  if (typeof widthValue === "number") {
    if (!isNarrow || builderParityMode) return `${widthValue}px`;
    return `min(100%, ${Math.max(1, widthValue)}px)`;
  }
  if (typeof widthValue === "string") {
    if (!isNarrow || builderParityMode) return widthValue;

    const normalized = widthValue.trim().toLowerCase();
    if (!normalized || normalized === "auto") return widthValue;
    if (
      normalized.endsWith("%") ||
      normalized.includes("vw") ||
      normalized.startsWith("min(") ||
      normalized.startsWith("max(") ||
      normalized.startsWith("clamp(") ||
      normalized.startsWith("calc(")
    ) {
      return widthValue;
    }

    if (normalized.endsWith("px")) {
      const parsed = Number(normalized.slice(0, -2));
      if (Number.isFinite(parsed) && parsed > 0) {
        return `min(100%, ${parsed}px)`;
      }
    }

    return "100%";
  }
  return undefined;
}

function normalizeLayoutHeightForNarrow(
  heightValue: unknown,
  _isNarrow: boolean,
  _builderParityMode?: boolean,
): string | undefined {
  if (typeof heightValue === "number") return `${heightValue}px`;
  if (typeof heightValue === "string") return heightValue;
  return undefined;
}

function normalizeSpacerDimension(
  value: unknown,
  axis: "width" | "height",
  isNarrow: boolean,
  builderParityMode?: boolean,
): string {
  if (typeof value === "number") {
    if (!isNarrow || builderParityMode) return `${value}px`;
    if (axis === "width") return `min(100%, ${Math.max(1, value)}px)`;
    const max = Math.max(4, value);
    const min = Math.max(4, Math.round(max * 0.4));
    return `clamp(${min}px, 5cqw, ${max}px)`;
  }

  if (typeof value === "string") {
    const raw = value.trim();
    if (!raw) return axis === "width" ? "100%" : "20px";
    if (!isNarrow || builderParityMode) return raw;

    const normalized = raw.toLowerCase();
    if (normalized === "auto") return raw;
    if (
      normalized.endsWith("%") ||
      normalized.includes("vw") ||
      normalized.startsWith("min(") ||
      normalized.startsWith("max(") ||
      normalized.startsWith("clamp(") ||
      normalized.startsWith("calc(")
    ) {
      return raw;
    }

    if (normalized.endsWith("px")) {
      const parsed = Number(normalized.slice(0, -2));
      if (Number.isFinite(parsed) && parsed > 0) {
        if (axis === "width") return `min(100%, ${parsed}px)`;
        const max = Math.max(4, parsed);
        const min = Math.max(4, Math.round(max * 0.4));
        return `clamp(${min}px, 5cqw, ${max}px)`;
      }
    }
  }

  return axis === "width" ? "100%" : "20px";
}

function isNarrowResponsivePreview(
  viewportWidth: number,
  builderParityMode?: boolean,
  mobileBreakpoint?: number,
  layoutReferenceWidth?: number,
): boolean {
  if (builderParityMode) return false;
  if (!Number.isFinite(viewportWidth) || viewportWidth <= 0) return false;
  const breakpoint = toNumber(mobileBreakpoint, PREVIEW_TABLET_BREAKPOINT);
  const authoredLayoutWidth =
    typeof layoutReferenceWidth === "number" && Number.isFinite(layoutReferenceWidth) && layoutReferenceWidth > 0
      ? layoutReferenceWidth
      : null;
  return viewportWidth <= breakpoint || (authoredLayoutWidth !== null && viewportWidth < authoredLayoutWidth);
}

function parsePixelValue(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value !== "string") return null;
  const normalized = value.trim().toLowerCase();
  if (!normalized) return null;
  if (!normalized.endsWith("px")) return null;
  const parsed = Number(normalized.slice(0, -2));
  return Number.isFinite(parsed) ? parsed : null;
}

function isLikelyOverflowingNarrowViewport(props: Record<string, unknown>, viewportWidth: number): boolean {
  if (!Number.isFinite(viewportWidth) || viewportWidth <= 0) return false;

  const tolerance = 8;
  const widthPx = parsePixelValue(props.width);
  const leftPx = parsePixelValue(props.left);
  const rightPx = parsePixelValue(props.right);

  if (widthPx !== null && widthPx > viewportWidth) return true;
  if (leftPx !== null && (leftPx < 0 || leftPx > tolerance)) return true;
  if (rightPx !== null && (rightPx < 0 || rightPx > tolerance)) return true;
  if (widthPx !== null && leftPx !== null && leftPx + widthPx > viewportWidth + tolerance) return true;
  if (widthPx !== null && rightPx !== null && rightPx + widthPx > viewportWidth + tolerance) return true;

  return false;
}

function normalizeResponsivePosition(
  position: React.CSSProperties["position"] | undefined,
  isNarrow: boolean,
  props: Record<string, unknown>,
  viewportWidth: number,
  builderParityMode?: boolean,
): React.CSSProperties["position"] | undefined {
  if (builderParityMode) return position;
  if (!isNarrow) return position;
  if (position === "absolute" || position === "fixed") {
    if (isLikelyOverflowingNarrowViewport(props, viewportWidth)) return "relative";
    return position; // Keep absolute if it fits!
  }
  return position;
}

function resolvePageFrameStyles(pageWidth: string): Pick<React.CSSProperties, "width" | "maxWidth"> {
  const normalized = (pageWidth || "1920px").trim();
  if (!normalized || normalized === "auto") {
    return { width: "100%" };
  }

  const isFluid =
    normalized.includes("%") ||
    normalized.includes("vw") ||
    normalized.startsWith("min(") ||
    normalized.startsWith("max(") ||
    normalized.startsWith("clamp(");

  if (isFluid) {
    return { width: normalized };
  }

  return {
    width: "100%",
    maxWidth: normalized,
  };
}

const BUTTON_VARIANTS: Record<string, { bg: string; text: string; border: string; borderWidth: number }> = {
  primary: { bg: "#3b82f6", text: "#ffffff", border: "transparent", borderWidth: 0 },
  secondary: { bg: "#6b7280", text: "#ffffff", border: "transparent", borderWidth: 0 },
  outline: { bg: "transparent", text: "#3b82f6", border: "#3b82f6", borderWidth: 1 },
  ghost: { bg: "transparent", text: "#3b82f6", border: "transparent", borderWidth: 0 },
  cta: { bg: "#000000", text: "#ffffff", border: "transparent", borderWidth: 0 },
};

function wrapWithAnimation(
  element: React.ReactElement,
  animation: AnimationConfig | undefined
): React.ReactElement {
  if (!hasActiveAnimation(animation)) return element;
  return <AnimationWrapper animation={animation}>{element}</AnimationWrapper>;
}

/** Check if a container looks like a navigation bar */
function isNavContainer(
  node: CleanNode,
  nodes: Record<string, CleanNode>,
  props: Record<string, unknown>
): boolean {
  const looksLikeNavLabel = (value: unknown): boolean => {
    if (typeof value !== "string") return false;
    const text = value.trim();
    if (!text) return false;
    if (text.length > 24) return false;
    const normalized = text.toLowerCase();
    if (normalized === "logo" || normalized === "brand") return false;
    const words = text.split(/\s+/).filter(Boolean);
    if (words.length > 3) return false;
    return true;
  };

  const flexDirection = props.flexDirection as string;
  const isHorizontal = flexDirection === "row" || flexDirection === undefined;
  const childIds = node.children ?? [];

  // Check if it has multiple buttons, links, or text elements (typical nav items)
  let navItemCount = 0;
  for (const childId of childIds) {
    const child = nodes[childId];
    if (!child) continue;
    const childType = String(child.type || "").toLowerCase();
    const childProps = child.props ?? {};
    const hasExplicitLink = Boolean(childProps.link || childProps.href);
    const isTextNavCandidate = childType === "text" && (hasExplicitLink || looksLikeNavLabel(childProps.text));

    // Count buttons, links, or text elements that could be nav items
    if (
      childType === "button" ||
      isTextNavCandidate ||
      (childType === "container" && isNavContainer(child, nodes, childProps))
    ) {
      navItemCount++;
    }
  }

  // Consider it a nav if horizontal with 2+ items, or any layout with 3+ menu-like items.
  return (isHorizontal && navItemCount >= 2) || navItemCount >= 3;
}

function PrototypeWrapper({
  children,
  interactions,
  onPrototypeAction,
}: {
  children: React.ReactElement;
  interactions: Interaction[];
  onPrototypeAction: (interaction: Interaction) => void;
}) {
  const run = React.useCallback(
    (trigger: Interaction["trigger"]) => {
      const i = interactions.find((x) => x.trigger === trigger);
      if (i) onPrototypeAction(i);
    },
    [interactions, onPrototypeAction]
  );

  const hasClick = interactions.some((x) => x.trigger === "click");
  const hasDblClick = interactions.some((x) => x.trigger === "doubleClick");
  const hasHover = interactions.some((x) => x.trigger === "hover");
  const hasMouseLeave = interactions.some((x) => x.trigger === "mouseLeave");

  const handleClick = React.useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    run("click");
  }, [run]);

  const handleDblClick = React.useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    run("doubleClick");
  }, [run]);

  const isDomElement = typeof children.type === "string";

  if (isDomElement) {
    const existingStyle =
      (children.props as Record<string, unknown>)?.style as React.CSSProperties | undefined;
    return React.cloneElement(children as React.ReactElement<Record<string, unknown>>, {
      ...(hasClick ? { onClick: handleClick } : {}),
      ...(hasDblClick ? { onDoubleClick: handleDblClick } : {}),
      ...(hasHover ? { onMouseEnter: () => run("hover") } : {}),
      ...(hasMouseLeave ? { onMouseLeave: () => run("mouseLeave") } : {}),
      style: { ...existingStyle, cursor: "pointer" },
      onKeyDown: (e: React.KeyboardEvent) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          run("click");
        }
      },
      role: "button",
      tabIndex: 0,
    });
  }

  return (
    <div
      style={{ display: "contents", cursor: "pointer" }}
      role="button"
      tabIndex={0}
      {...(hasClick ? { onClickCapture: handleClick } : {})}
      {...(hasDblClick ? { onDoubleClickCapture: handleDblClick } : {})}
      {...(hasHover ? { onMouseEnter: () => run("hover") } : {})}
      {...(hasMouseLeave ? { onMouseLeave: () => run("mouseLeave") } : {})}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          run("click");
        }
      }}
    >
      {children}
    </div>
  );
}

function wrapWithPrototype(
  element: React.ReactElement,
  prototype: PrototypeConfig | undefined,
  onPrototypeAction: ((interaction: Interaction) => void) | undefined
): React.ReactElement {
  if (!onPrototypeAction || !prototype?.interactions?.length) return element;
  return (
    <PrototypeWrapper interactions={prototype.interactions} onPrototypeAction={onPrototypeAction}>
      {element}
    </PrototypeWrapper>
  );
}

function PreviewTabs({
  props,
  childNodes,
  childNodeIds,
  childNodeMap,
}: {
  props: Record<string, any>;
  childNodes?: React.ReactNode[];
  childNodeIds?: string[];
  childNodeMap?: Record<string, React.ReactNode>;
}) {
  const tabs = (props.tabs as any[]) || [];
  const linkedSlotMap = (props.__linkedNodes as Record<string, string>) ?? {};
  const [activeTabId, setActiveTabId] = React.useState(
    props.activeTabId || (tabs[0]?.id || "")
  );

  React.useEffect(() => {
    const preferred = props.activeTabId || "";
    const hasPreferred = preferred && tabs.some((t) => t?.id === preferred);
    if (hasPreferred) {
      setActiveTabId(preferred);
      return;
    }
    const firstId = tabs[0]?.id || "";
    if (firstId && firstId !== activeTabId) {
      setActiveTabId(firstId);
    }
  }, [props.activeTabId, tabs, activeTabId]);

  const br = (props.borderRadius ?? 0) as number;
  const borderColor = (props.borderColor as string) || "transparent";
  const borderWidth = (props.borderWidth ?? 0) as number;
  const narrowTabsPreview = isNarrowResponsivePreview(
    toNumber(props.viewportWidth, 1200),
    Boolean(props.builderParityMode),
    toNumber(props.mobileBreakpoint, PREVIEW_MOBILE_BREAKPOINT),
  );

  return (
    <div
      data-fluid-space="true"
      data-layout="column"
      className="tabs-component w-full flex flex-col"
      style={{
        backgroundColor: (props.background as string) || "transparent",
        borderRadius: `${br}px`,
        borderWidth: `${borderWidth}px`,
        borderColor,
        borderStyle: (props.borderStyle as string) || "solid",
        width: (props.width as string) || "100%",
        height: (props.height as string) || "auto",
        overflow: "hidden",
        boxSizing: "border-box",
      }}
    >
      <div
        className="tabs-header flex flex-row w-full overflow-x-auto border-b no-scrollbar"
        style={{
          borderColor: borderColor !== "transparent" ? borderColor : "#e5e7eb",
          flexWrap: narrowTabsPreview ? "wrap" : "nowrap",
          justifyContent:
            props.tabAlignment === "center"
              ? "center"
              : props.tabAlignment === "right"
                ? "flex-end"
                : "flex-start",
        }}
      >
        {tabs.map((tab) => {
          const isActive = tab.id === activeTabId;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTabId(tab.id)}
              className="px-6 py-4 font-semibold text-sm transition-all duration-300 border-b-2 whitespace-nowrap hover:bg-black/5 active:scale-95 translate-gpu"
              style={{
                backgroundColor: isActive
                  ? props.activeTabBackgroundColor
                  : props.tabHeaderBackgroundColor,
                color: isActive ? props.activeTabTextColor : props.tabHeaderTextColor,
                borderBottomColor: isActive
                  ? (props.activeTabTextColor as string) || "#3b82f6"
                  : "transparent",
                transform: isActive ? "scale(1.02)" : "scale(1)",
                zIndex: isActive ? 1 : 0,
                borderTop: "none",
                borderLeft: "none",
                borderRight: "none",
                padding: narrowTabsPreview ? "10px 12px" : "16px 24px",
                fontSize: narrowTabsPreview ? "13px" : undefined,
                cursor: "pointer",
                maxWidth: narrowTabsPreview ? "100%" : undefined,
                minWidth: narrowTabsPreview ? "0" : undefined,
              }}
            >
              {tab.title}
            </button>
          );
        })}
      </div>
      {/* Tab content: render actual child nodes from linkedNodes (via linkedSlotMap + childNodeMap) */}
      <div className="tabs-content relative w-full flex-grow min-h-[100px] overflow-visible">
        {(() => {
          const activeIndex = tabs.findIndex((tab) => tab?.id === activeTabId);
          const safeIndex = activeIndex >= 0 ? activeIndex : 0;
          const active = tabs[safeIndex] ?? tabs[0];
          if (!active) return <span />;

          const fallbackId = `tab-content-${active.id}`;
          const candidateId =
            typeof active?.content === "string" && active.content.trim() ? active.content.trim() : fallbackId;
          const slotKey = `tab-content-${active.id}`;
          const linkedContentNodeId = linkedSlotMap[slotKey];
          const indexedChildId = Array.isArray(childNodeIds) ? childNodeIds[safeIndex] : undefined;
          const candidates = [linkedContentNodeId, candidateId, fallbackId, indexedChildId].filter(
            (v): v is string => typeof v === "string" && !!v.trim(),
          );
          const contentNodeId =
            candidates.find((id) => Boolean(props.nodes && props.nodes[id])) || fallbackId;

          return (
            <div className="w-full min-h-[100px] transition-all duration-300 ease-out opacity-100 translate-y-0 relative">
              <div
                className="w-full min-h-[100px] flex flex-col text-sm whitespace-pre-wrap text-gray-800 leading-relaxed"
                style={{
                  padding: narrowTabsPreview ? "12px" : "24px",
                  maxWidth: "100%",
                  minWidth: 0,
                  overflow: "visible",
                }}
              >
                {props.nodes && props.nodes[contentNodeId] ? (
                  <RenderNode
                    node={props.nodes[contentNodeId]}
                    nodes={props.nodes}
                    pages={props.pages || []}
                    pageIndex={props.pageIndex || 0}
                    viewportWidth={props.viewportWidth || 1200}
                    interactionState={props.interactionState || {}}
                    availableTriggerTargets={props.availableTriggerTargets || new Set()}
                    onToggle={props.onToggle || (() => { })}
                    storeContext={props.storeContext || null}
                    nodeId={contentNodeId}
                    onPrototypeAction={props.onPrototypeAction}
                    mobileBreakpoint={props.mobileBreakpoint}
                    enableFormInputs={props.enableFormInputs}
                    builderParityMode={props.builderParityMode}
                    renderAllNodes={props.renderAllNodes}
                    preserveAuthoredPositioning={props.preserveAuthoredPositioning}
                    layoutReferenceWidth={props.layoutReferenceWidth}
                    layoutReferenceHeight={props.layoutReferenceHeight}
                    parentType={"Tabs" as ComponentType}
                    insideTabsContext
                  />
                ) : (
                  <span />
                )}
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
}

function RenderNode({
  node,
  nodes,
  pages,
  pageIndex,
  viewportWidth,
  interactionState,
  availableTriggerTargets,
  onToggle,
  storeContext,
  nodeId,
  onPrototypeAction,
  mobileBreakpoint,
  enableFormInputs,
  builderParityMode,
  renderAllNodes,
  productBinding,
  preserveAuthoredPositioning,
  layoutReferenceWidth,
  layoutReferenceHeight,
  parentType,
  insideTabsContext,
}: {
  node: CleanNode;
  nodes: Record<string, CleanNode>;
  pages: PreviewPageMeta[];
  pageIndex: number;
  viewportWidth: number;
  interactionState: Record<string, boolean>;
  availableTriggerTargets: Set<string>;
  onToggle: (target: string, action: "toggle" | "open" | "close") => void;
  storeContext?: StoreContext | null;
  nodeId?: string;
  onPrototypeAction?: (interaction: Interaction) => void;
  mobileBreakpoint?: number;
  enableFormInputs?: boolean;
  builderParityMode?: boolean;
  renderAllNodes?: boolean;
  productBinding?: ProductBinding | null;
  preserveAuthoredPositioning?: boolean;
  layoutReferenceWidth?: number;
  layoutReferenceHeight?: number;
  parentType?: ComponentType;
  insideTabsContext?: boolean;
}): React.ReactElement {
  void preserveAuthoredPositioning;
  const effectiveLayoutReferenceWidth =
    typeof layoutReferenceWidth === "number" && Number.isFinite(layoutReferenceWidth) && layoutReferenceWidth > 0
      ? layoutReferenceWidth
      : undefined;
  void layoutReferenceHeight;
  // Normalize legacy and object-based node types so published and preview payloads render identically.
  const nodeType = typeof node.type === "string" ? node.type : (node.type as any)?.resolvedName;
  const rawType = String(nodeType || "").trim() || "Container";
  const normalizedTypeMap: Record<string, ComponentType> = {
    text: "Text",
    container: "Container",
    section: "Section",
    row: "Row",
    column: "Column",
    image: "Image",
    video: "Video",
    button: "Button",
    divider: "Divider",
    icon: "Icon",
    spacer: "Spacer",
    pagination: "Pagination",
    badge: "Badge",
    profilelogin: "ProfileLogin",
    "profile-login": "ProfileLogin",
    "profile login": "ProfileLogin",
    circle: "Circle",
    square: "Square",
    triangle: "Triangle",
    banner: "Banner",
    rating: "Rating",
    tabcontent: "TabContent",
    "tab-content": "TabContent",
    "tab content": "TabContent",
    importedblock: "ImportedBlock",
    booleanfield: "BooleanField",
    diamond: "Diamond",
    heart: "Heart",
    trapezoid: "Trapezoid",
    pentagon: "Pentagon",
    hexagon: "Hexagon",
    heptagon: "Heptagon",
    octagon: "Octagon",
    nonagon: "Nonagon",
    decagon: "Decagon",
    parallelogram: "Parallelogram",
    kite: "Kite",
  };
  const type = (() => {
    const lowerRaw = rawType.toLowerCase();
    const shapes = ["circle", "square", "triangle", "rectangle", "diamond", "heart", "trapezoid", "pentagon", "hexagon", "heptagon", "octagon", "nonagon", "decagon", "parallelogram", "kite"];
    const foundShape = shapes.find(s => lowerRaw.includes(s));
    if (foundShape) {
      return (foundShape.charAt(0).toUpperCase() + foundShape.slice(1)) as ComponentType;
    }
    return (normalizedTypeMap[lowerRaw] ?? rawType) as ComponentType;
  })();
  const props = mergeProps(type, node.props) as Record<string, unknown>;
  const useFixedPx = Boolean(builderParityMode);
  const isNarrowPreview = isNarrowResponsivePreview(
    viewportWidth,
    builderParityMode,
    mobileBreakpoint,
    effectiveLayoutReferenceWidth,
  );
  if (!builderParityMode && !renderAllNodes && !shouldRenderNodeAtWidth(props, viewportWidth, mobileBreakpoint)) {
    return <></>;
  }
  if (!builderParityMode && !renderAllNodes && !isCollapsibleOpen(props, viewportWidth, interactionState, availableTriggerTargets)) {
    return <></>;
  }
  const allowPreviewInput = Boolean(enableFormInputs && props.previewEditable === true);
  const toggleTarget = getToggleTarget(props);
  const triggerAction = getTriggerAction(props);
  const interactiveClick = !allowPreviewInput && toggleTarget ? () => onToggle(toggleTarget, triggerAction) : undefined;
  const animation = props.animation as AnimationConfig | undefined;
  const prototype = props.prototype as PrototypeConfig | undefined;
  const nextInsideTabsContext = Boolean(insideTabsContext || type === "Tabs" || type === "TabContent");
  const childIds = node.children ?? [];
  const childNodeMap: Record<string, React.ReactNode> = {};
  const directProductTemplateIds =
    storeContext && !productBinding
      ? childIds.filter((id) => {
        const childNode = nodes[id];
        return Boolean(childNode) &&
          String(childNode?.type ?? "").trim().toLowerCase() === "container" &&
          hasAddToCartButton(id, nodes);
      })
      : [];
  const productTemplateIdSet = new Set(directProductTemplateIds);
  const hasExplicitTemplateBinding = directProductTemplateIds.some((id) =>
    hasExplicitProductReference((nodes[id]?.props ?? {}) as Record<string, unknown>)
  );

  const renderChildNode = (
    id: string,
    childProductBinding?: ProductBinding | null,
    renderKey?: string,
  ) => {
    const n = nodes[id];
    if (!n) return null;
    const renderedNode = (
      <RenderNode
        key={renderKey ?? id}
        node={n}
        nodes={nodes}
        pages={pages}
        pageIndex={pageIndex}
        viewportWidth={viewportWidth}
        interactionState={interactionState}
        availableTriggerTargets={availableTriggerTargets}
        onToggle={onToggle}
        storeContext={storeContext}
        nodeId={id}
        onPrototypeAction={onPrototypeAction}
        mobileBreakpoint={mobileBreakpoint}
        enableFormInputs={enableFormInputs}
        builderParityMode={builderParityMode}
        renderAllNodes={renderAllNodes}
        parentType={type}
        insideTabsContext={nextInsideTabsContext}
        productBinding={childProductBinding ?? productBinding}
      />
    );
    childNodeMap[id] = renderedNode;
    return renderedNode;
  };

  const children = directProductTemplateIds.length > 0
    ? childIds.flatMap((id) => {
      if (!productTemplateIdSet.has(id)) {
        const rendered = renderChildNode(id);
        return rendered ? [rendered] : [];
      }
      if (hasExplicitTemplateBinding) {
        const fallbackProductIndex = Math.max(0, directProductTemplateIds.indexOf(id));
        const binding = createProductBinding(id, fallbackProductIndex, nodes, storeContext!);
        const rendered = renderChildNode(id, binding);
        return rendered ? [rendered] : [];
      }
      if (id !== directProductTemplateIds[0]) return [];

      return storeContext!.products.map((_, productIndex) => {
        const templateId = directProductTemplateIds[
          Math.min(productIndex, directProductTemplateIds.length - 1)
        ] ?? directProductTemplateIds[0];
        const binding = createProductBinding(templateId, productIndex, nodes, storeContext!);
        return renderChildNode(templateId, binding, `${templateId}::product-${productIndex}`);
      });
    })
    : childIds.map((id) => renderChildNode(id));

  const withNodeMeta = (el: React.ReactElement): React.ReactElement => {
    if (!nodeId) return el;
    if (typeof el.type !== "string") return el;
    const current = (el.props ?? {}) as Record<string, unknown>;
    if (current["data-node-id"]) return el;
    return React.cloneElement(el as React.ReactElement<Record<string, unknown>>, {
      "data-node-id": nodeId,
      "data-node-type": type,
    });
  };

  const wrap = (el: React.ReactElement) =>
    wrapWithAnimation(wrapWithPrototype(withNodeMeta(el), prototype, onPrototypeAction), animation);

  switch (type) {
    case "Container": {
      const spacingPreset = detectResponsiveSpacingPreset(nodeId, props);
      const spacing = getResponsiveSpacingTuning(spacingPreset, isNarrowPreview, builderParityMode);
      const hasRenderableChildren = childIds.some((id) => Boolean(nodes[id]));
      const rawHeight = props.height as string | undefined;
      const showEmptyMinHeight = !rawHeight && !hasRenderableChildren;
      const effectiveDisplay =
        (props.display as React.CSSProperties["display"] | undefined) ?? "block";
      const isProductSlot =
        storeContext &&
        !productBinding &&
        storeContext.products.length > 0 &&
        directProductTemplateIds.length === 0 &&
        hasAddToCartButton(nodeId ?? "", nodes);
      if (isProductSlot) {
        // Product slots skip animation wrapping for simplicity
        const p = typeof props.padding === "number" ? props.padding : 0;
        const pt = (props.paddingTop ?? p) as number;
        const pb = (props.paddingBottom ?? p) as number;
        const pl = (props.paddingLeft ?? p) as number;
        const pr = (props.paddingRight ?? p) as number;
        const m = typeof props.margin === "number" ? props.margin : 0;
        const mt = (props.marginTop ?? m) as number;
        const mr = (props.marginRight ?? m) as number;
        const mb = (props.marginBottom ?? m) as number;
        const ml = (props.marginLeft ?? m) as number;
        const normalizedSlotWidth = normalizeLayoutWidthForNarrow(
          normalizePreviewWidth(props.width, viewportWidth, builderParityMode, mobileBreakpoint),
          isNarrowPreview,
          builderParityMode,
        );
        const rawSlotWidth = (props.width as string | undefined)?.trim() || "";
        const slotWidthPx = rawSlotWidth.toLowerCase().endsWith("px")
          ? Number(rawSlotWidth.slice(0, -2))
          : NaN;
        const forceFluidSlotWidth = Number.isFinite(slotWidthPx) && slotWidthPx > 0 && slotWidthPx < 320;
        const resolvedSlotWidth = forceFluidSlotWidth
          ? "100%"
          : ((normalizedSlotWidth ?? rawSlotWidth) || "100%");
        return (
          <div
            id="products"
            data-node-id={nodeId}
            data-node-type={type}
            className={((props.customClassName as string) || "").trim() || undefined}
            style={{
              backgroundColor: props.background as string,
              padding: `${pt}px ${pr}px ${pb}px ${pl}px`,
              margin: `${mt}px ${mr}px ${mb}px ${ml}px`,
              width: resolvedSlotWidth,
              maxWidth: "100%",
              minWidth: 0,
              display: "grid",
              gridTemplateColumns: isNarrowPreview
                ? "minmax(0, 1fr)"
                : "repeat(auto-fit, minmax(220px, 1fr))",
              gap: 20,
              alignItems: "flex-start",
              boxSizing: "border-box",
            }}
          >
            {storeContext!.products.map((product) => {
              const price = typeof product.price === "number" ? product.price : 0;
              const imageUrl =
                product.images?.[0] ||
                "https://placehold.co/400x300/f1f5f9/64748b?text=Product";
              return (
                <div
                  key={product.id}
                  style={{
                    background: "#ffffff",
                    padding: 20,
                    width: "100%",
                    maxWidth: "100%",
                    borderRadius: 8,
                    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                    display: "flex",
                    flexDirection: "column",
                    gap: 8,
                    boxSizing: "border-box",
                  }}
                >
                  <div
                    style={{
                      height: 180,
                      background: "linear-gradient(45deg, #6ee7b7, #3b82f6)",
                      borderRadius: 4,
                      overflow: "hidden",
                    }}
                  >
                    <img
                      src={imageUrl}
                      alt={product.name}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  </div>
                  <div style={{ fontSize: 18, fontWeight: 600, color: "#1e293b" }}>
                    {product.name}
                  </div>
                  <div style={{ fontSize: 20, fontWeight: "bold", color: "#3b82f6" }}>
                    ₱{price.toFixed(2)}
                  </div>
                  {product.description && (
                    <div style={{ fontSize: 14, color: "#64748b" }}>
                      {product.description}
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() =>
                      storeContext!.addToCart({
                        id: product.id,
                        name: product.name,
                        price,
                        image: product.images?.[0],
                      })
                    }
                    style={{
                      backgroundColor: "#10b981",
                      color: "#ffffff",
                      fontSize: 14,
                      fontWeight: 500,
                      border: "none",
                      borderRadius: 8,
                      padding: "10px 24px",
                      cursor: "pointer",
                      marginTop: 4,
                    }}
                  >
                    Add to Cart
                  </button>
                </div>
              );
            })}
          </div>
        );
      }
      const p = typeof props.padding === "number" ? props.padding : 0;
      const pl = (props.paddingLeft ?? p) as number;
      const pr = (props.paddingRight ?? p) as number;
      const pt = (props.paddingTop ?? p) as number;
      const pb = (props.paddingBottom ?? p) as number;
      const m = typeof props.margin === "number" ? props.margin : 0;
      const ml = (props.marginLeft ?? m) as number;
      const mr = (props.marginRight ?? m) as number;
      const mt = (props.marginTop ?? m) as number;
      const mb = (props.marginBottom ?? m) as number;
      const br = (props.borderRadius ?? 0) as number;
      const bw = (props.borderWidth ?? 0) as number;
      const strokePlacement = (props.strokePlacement as "mid" | "inside" | "outside") ?? "mid";
      const borderDecl = bw > 0 ? `${bw}px ${props.borderStyle} ${props.borderColor}` : undefined;
      const bgImage = props.backgroundImage as string;
      const overlay = props.backgroundOverlay as string;
      const displayVal = (props.display as React.CSSProperties["display"]) ?? "flex";
      const isNav = isNavContainer(node, nodes, props);
      const normalizedWidth = normalizeLayoutWidthForNarrow(
        normalizePreviewWidth(props.width, viewportWidth, builderParityMode, mobileBreakpoint),
        isNarrowPreview,
        builderParityMode,
      );
      const normalizedHeight = normalizeLayoutHeightForNarrow(props.height, isNarrowPreview, builderParityMode);
      const normalizedPosition = normalizeResponsivePosition(
        props.position as React.CSSProperties["position"] | undefined,
        isNarrowPreview,
        props,
        viewportWidth,
        builderParityMode,
      );
      const mobileOverflowLikely = !builderParityMode && isNarrowPreview && isLikelyOverflowingNarrowViewport(props, viewportWidth);
      const shouldClearNarrowOffsets =
        !builderParityMode &&
        isNarrowPreview &&
        ((props.position as React.CSSProperties["position"]) === "absolute" ||
          (props.position as React.CSSProperties["position"]) === "fixed");
      const resolvedContainerHeight = builderParityMode
        ? normalizeContainerHeight(normalizedHeight ?? (props.height as string) ?? "240px")
        : (isNarrowPreview ? "auto" : (normalizedHeight ?? (props.height as string) ?? "auto"));

      const containerStyle: React.CSSProperties = {
        backgroundColor: props.background as string,
        backgroundImage: bgImage
          ? overlay
            ? `linear-gradient(${overlay}, ${overlay}), url(${bgImage})`
            : `url(${bgImage})`
          : undefined,
        backgroundSize: bgImage ? (props.backgroundSize as string) : undefined,
        backgroundPosition: bgImage ? (props.backgroundPosition as string) : undefined,
        backgroundRepeat: bgImage ? (props.backgroundRepeat as string) : undefined,
        padding: `${fluidSpace(pt, 0, spacing.paddingRatio, spacing.paddingCqw, useFixedPx)} ${fluidSpace(pr, 0, spacing.paddingRatio, spacing.paddingCqw, useFixedPx)} ${fluidSpace(pb, 0, spacing.paddingRatio, spacing.paddingCqw, useFixedPx)} ${fluidSpace(pl, 0, spacing.paddingRatio, spacing.paddingCqw, useFixedPx)}`,
        margin: `${fluidSpace(mt, 0, spacing.marginRatio, spacing.marginCqw, useFixedPx)} ${fluidSpace(mr, 0, spacing.marginRatio, spacing.marginCqw, useFixedPx)} ${fluidSpace(mb, 0, spacing.marginRatio, spacing.marginCqw, useFixedPx)} ${fluidSpace(ml, 0, spacing.marginRatio, spacing.marginCqw, useFixedPx)}`,
        width: normalizedWidth ?? (props.width as string),
        maxWidth: normalizedPosition === "static" ? "100%" : (isNarrowPreview ? "100%" : undefined),
        minWidth: normalizedPosition === "static" ? 0 : (isNarrowPreview ? 0 : undefined),
        height: resolvedContainerHeight,
        minHeight: !hasRenderableChildren ? "50px" : undefined,
        boxSizing: "border-box",
        borderRadius: `${br}px`,
        ...(strokePlacement === "outside" && borderDecl
          ? { border: "none", outline: borderDecl, outlineOffset: 0 }
          : borderDecl
            ? { border: borderDecl }
            : {}),
        position: normalizedPosition,
        display: displayVal,
        flexDirection: displayVal === "flex" ? (props.flexDirection as React.CSSProperties["flexDirection"]) : undefined,
        flexWrap: displayVal === "flex" ? (props.flexWrap as React.CSSProperties["flexWrap"]) : undefined,
        alignItems: displayVal === "flex" || displayVal === "grid" ? (props.alignItems as string) : undefined,
        justifyContent: displayVal === "flex" || displayVal === "grid" ? (props.justifyContent as string) : undefined,
        gap: displayVal === "flex" ? fluidSpace(props.gap, 0, spacing.gapRatio, spacing.gapCqw, useFixedPx) : undefined,
        gridTemplateColumns: displayVal === "grid" ? (props.gridTemplateColumns as string) : undefined,
        gridTemplateRows: displayVal === "grid" ? (props.gridTemplateRows as string) : undefined,
        columnGap: displayVal === "grid" ? fluidSpace(props.gridColumnGap ?? props.gridGap, 0, spacing.gapRatio, spacing.gapCqw, useFixedPx) : undefined,
        rowGap: displayVal === "grid" ? fluidSpace(props.gridRowGap ?? props.gridGap, 0, spacing.gapRatio, spacing.gapCqw, useFixedPx) : undefined,
        boxShadow: props.boxShadow as string,
        opacity: props.opacity as number,
        overflow: props.overflow as string,
        cursor: interactiveClick ? "pointer" : (props.cursor as string),
        top: shouldClearNarrowOffsets ? undefined : (props.top as React.CSSProperties["top"]),
        right: shouldClearNarrowOffsets ? undefined : (props.right as React.CSSProperties["right"]),
        bottom: shouldClearNarrowOffsets ? undefined : (props.bottom as React.CSSProperties["bottom"]),
        left: shouldClearNarrowOffsets ? undefined : (props.left as React.CSSProperties["left"]),
      };

      const containerContent = isNav ? (
        <ResponsiveNav
          containerStyle={containerStyle}
          onClick={interactiveClick}
          className={((props.customClassName as string) || "").trim() || undefined}
          dataMobileOverflow={mobileOverflowLikely ? "true" : undefined}
          nodeId={nodeId}
          nodeType={type}
        >
          {children}
        </ResponsiveNav>
      ) : (
        <div
          data-mobile-overflow={mobileOverflowLikely ? "true" : undefined}
          data-fluid-space="true"
          data-fluid-grid={displayVal === "grid" ? "true" : undefined}
          data-layout={displayVal === "flex" ? ((props.flexDirection as string) === "row" ? "row" : "column") : undefined}
          className={((props.customClassName as string) || "").trim() || undefined}
          style={containerStyle}
          onClick={interactiveClick}
        >
          {children}
        </div>
      );

      return wrap(containerContent);
    }

    case "Section": {
      const spacingPreset = detectResponsiveSpacingPreset(nodeId, props);
      const spacing = getResponsiveSpacingTuning(spacingPreset, isNarrowPreview, builderParityMode);
      const p = typeof props.padding === "number" ? props.padding : 0;
      const pl = (props.paddingLeft ?? p) as number;
      const pr = (props.paddingRight ?? p) as number;
      const pt = (props.paddingTop ?? p) as number;
      const pb = (props.paddingBottom ?? p) as number;
      const m = typeof props.margin === "number" ? props.margin : 0;
      const ml = (props.marginLeft ?? m) as number;
      const mr = (props.marginRight ?? m) as number;
      const mt = (props.marginTop ?? m) as number;
      const mb = (props.marginBottom ?? m) as number;
      const sectionBw = (props.borderWidth ?? 0) as number;
      const sectionBorderDecl = sectionBw > 0 ? `${sectionBw}px ${props.borderStyle} ${props.borderColor}` : undefined;
      const sectionStrokePlacement = (props.strokePlacement as "mid" | "inside" | "outside") ?? "mid";
      const bgImage = props.backgroundImage as string;
      const overlay = props.backgroundOverlay as string;
      const isHeaderAsset = nodeId != null && /header/i.test(nodeId);
      const normalizedWidth = normalizeLayoutWidthForNarrow(
        normalizePreviewWidth(props.width, viewportWidth, builderParityMode, mobileBreakpoint),
        isNarrowPreview,
        builderParityMode,
      );
      const normalizedHeight = normalizeLayoutHeightForNarrow(props.height, isNarrowPreview, builderParityMode);
      return wrap(
        <section
          data-fluid-space="true"
          data-layout={(props.flexDirection as string) === "row" ? "row" : "column"}
          {...(isHeaderAsset ? { "data-header": "true" } : {})}
          className={((props.customClassName as string) || "").trim() || undefined}
          style={{
            backgroundColor: props.background as string,
            backgroundImage: bgImage
              ? overlay
                ? `linear-gradient(${overlay}, ${overlay}), url(${bgImage})`
                : `url(${bgImage})`
              : undefined,
            backgroundSize: bgImage ? (props.backgroundSize as string) : undefined,
            backgroundPosition: bgImage ? (props.backgroundPosition as string) : undefined,
            backgroundRepeat: bgImage ? (props.backgroundRepeat as string) : undefined,
            padding: `${fluidSpace(pt, 0, spacing.paddingRatio, spacing.paddingCqw, useFixedPx)} ${fluidSpace(pr, 0, spacing.paddingRatio, spacing.paddingCqw, useFixedPx)} ${fluidSpace(pb, 0, spacing.paddingRatio, spacing.paddingCqw, useFixedPx)} ${fluidSpace(pl, 0, spacing.paddingRatio, spacing.paddingCqw, useFixedPx)}`,
            margin: `${fluidSpace(mt, 0, spacing.marginRatio, spacing.marginCqw, useFixedPx)} ${fluidSpace(mr, 0, spacing.marginRatio, spacing.marginCqw, useFixedPx)} ${fluidSpace(mb, 0, spacing.marginRatio, spacing.marginCqw, useFixedPx)} ${fluidSpace(ml, 0, spacing.marginRatio, spacing.marginCqw, useFixedPx)}`,
            width: normalizedWidth ?? (props.width as string),
            maxWidth: isNarrowPreview ? "100%" : undefined,
            minWidth: isNarrowPreview ? 0 : undefined,
            height: normalizedHeight ?? (props.height as string),
            containerType: "inline-size",
            borderRadius: px(props.borderRadius),
            ...(sectionStrokePlacement === "outside" && sectionBorderDecl
              ? { border: "none", outline: sectionBorderDecl, outlineOffset: 0 }
              : sectionBorderDecl
                ? { border: sectionBorderDecl }
                : {}),
            display: "flex",
            flexDirection: props.flexDirection as React.CSSProperties["flexDirection"],
            flexWrap: props.flexWrap as React.CSSProperties["flexWrap"],
            alignItems: props.alignItems as string,
            justifyContent: props.justifyContent as string,
            gap: fluidSpace(props.gap, 0, spacing.gapRatio, spacing.gapCqw, useFixedPx),
            boxShadow: props.boxShadow as string,
            opacity: props.opacity as number,
            overflow: props.overflow as string,
            cursor: interactiveClick ? "pointer" : undefined,
          }}
          onClick={interactiveClick}
        >
          {children}
        </section>
      );
    }



    case "Row": {
      const spacingPreset = detectResponsiveSpacingPreset(nodeId, props);
      const spacing = getResponsiveSpacingTuning(spacingPreset, isNarrowPreview, builderParityMode);
      const p = typeof props.padding === "number" ? props.padding : 0;
      const pl = (props.paddingLeft ?? p) as number;
      const pr = (props.paddingRight ?? p) as number;
      const pt = (props.paddingTop ?? p) as number;
      const pb = (props.paddingBottom ?? p) as number;
      const m = typeof props.margin === "number" ? props.margin : 0;
      const ml = (props.marginLeft ?? m) as number;
      const mr = (props.marginRight ?? m) as number;
      const mt = (props.marginTop ?? m) as number;
      const mb = (props.marginBottom ?? m) as number;
      const flexDir = (props.flexDirection as React.CSSProperties["flexDirection"]) ?? "row";
      const isHeaderRow = nodeId != null && /header/i.test(nodeId);
      const rowBw = (props.borderWidth ?? 0) as number;
      const rowBorderDecl = rowBw > 0 ? `${rowBw}px ${props.borderStyle} ${props.borderColor}` : undefined;
      const rowStrokePlacement = (props.strokePlacement as "mid" | "inside" | "outside") ?? "mid";
      const normalizedWidth = normalizeLayoutWidthForNarrow(
        normalizePreviewWidth(props.width, viewportWidth, builderParityMode, mobileBreakpoint),
        isNarrowPreview,
        builderParityMode,
      );
      const normalizedHeight = normalizeLayoutHeightForNarrow(props.height, isNarrowPreview, builderParityMode);
      const isNavRow = isNavContainer(node, nodes, props);
      const rowStyle: React.CSSProperties = {
        backgroundColor: props.background as string,
        padding: `${fluidSpace(pt, 0, spacing.paddingRatio, spacing.paddingCqw, useFixedPx)} ${fluidSpace(pr, 0, spacing.paddingRatio, spacing.paddingCqw, useFixedPx)} ${fluidSpace(pb, 0, spacing.paddingRatio, spacing.paddingCqw, useFixedPx)} ${fluidSpace(pl, 0, spacing.paddingRatio, spacing.paddingCqw, useFixedPx)}`,
        margin: `${fluidSpace(mt, 0, spacing.marginRatio, spacing.marginCqw, useFixedPx)} ${fluidSpace(mr, 0, spacing.marginRatio, spacing.marginCqw, useFixedPx)} ${fluidSpace(mb, 0, spacing.marginRatio, spacing.marginCqw, useFixedPx)} ${fluidSpace(ml, 0, spacing.marginRatio, spacing.marginCqw, useFixedPx)}`,
        width: normalizedWidth ?? (props.width as string),
        maxWidth: isNarrowPreview ? "100%" : undefined,
        minWidth: isNarrowPreview ? 0 : undefined,
        height: normalizedHeight ?? (props.height as string),
        borderRadius: px(props.borderRadius),
        ...(rowStrokePlacement === "outside" && rowBorderDecl
          ? { border: "none", outline: rowBorderDecl, outlineOffset: 0 }
          : rowBorderDecl
            ? { border: rowBorderDecl }
            : {}),
        display: "flex",
        flexDirection: isNavRow ? "row" : flexDir,
        flexWrap: props.flexWrap as React.CSSProperties["flexWrap"],
        alignItems: props.alignItems as string,
        justifyContent: props.justifyContent as string,
        gap: fluidSpace(props.gap, 0, spacing.gapRatio, spacing.gapCqw, useFixedPx),
        boxShadow: props.boxShadow as string,
        opacity: props.opacity as number,
        overflow: isNavRow ? "visible" : (props.overflow as string),
        cursor: interactiveClick ? "pointer" : undefined,
      };

      const rowContent = isNavRow ? (
        <ResponsiveNav
          containerStyle={rowStyle}
          onClick={interactiveClick}
          className={((props.customClassName as string) || "").trim() || undefined}
          nodeId={nodeId}
          nodeType={type}
        >
          {children}
        </ResponsiveNav>
      ) : (
        <div
          data-layout="row"
          data-fluid-space="true"
          {...(isHeaderRow ? { "data-header": "true" } : {})}
          className={((props.customClassName as string) || "").trim() || undefined}
          style={rowStyle}
          onClick={interactiveClick}
        >
          {children}
        </div>
      );

      return wrap(rowContent);
    }

    case "Column": {
      const p = typeof props.padding === "number" ? props.padding : 0;
      const pl = (props.paddingLeft ?? p) as number;
      const pr = (props.paddingRight ?? p) as number;
      const pt = (props.paddingTop ?? p) as number;
      const pb = (props.paddingBottom ?? p) as number;
      const m = typeof props.margin === "number" ? props.margin : 0;
      const ml = (props.marginLeft ?? m) as number;
      const mr = (props.marginRight ?? m) as number;
      const mt = (props.marginTop ?? m) as number;
      const mb = (props.marginBottom ?? m) as number;
      const w = props.width as string;
      const normalizedWidth = normalizeLayoutWidthForNarrow(
        normalizePreviewWidth(w, viewportWidth, builderParityMode, mobileBreakpoint),
        isNarrowPreview,
        builderParityMode,
      );
      const normalizedHeight = normalizeLayoutHeightForNarrow(props.height, isNarrowPreview, builderParityMode);
      const colBw = (props.borderWidth ?? 0) as number;
      const colBorderDecl = colBw > 0 ? `${colBw}px ${props.borderStyle} ${props.borderColor}` : undefined;
      const colStrokePlacement = (props.strokePlacement as "mid" | "inside" | "outside") ?? "mid";
      return wrap(
        <div
          data-fluid-space="true"
          data-layout={(props.flexDirection as string) === "row" ? "row" : "column"}
          className={((props.customClassName as string) || "").trim() || undefined}
          style={{
            flex: (normalizedWidth ?? w) === "auto" ? 1 : undefined,
            width: (normalizedWidth ?? w) !== "auto" ? (normalizedWidth ?? w) : undefined,
            maxWidth: isNarrowPreview ? "100%" : undefined,
            minWidth: 0,
            containerType: "inline-size",
            backgroundColor: props.background as string,
            padding: `${fluidSpace(pt, 0, 0.45, 2.2, useFixedPx)} ${fluidSpace(pr, 0, 0.45, 2.2, useFixedPx)} ${fluidSpace(pb, 0, 0.45, 2.2, useFixedPx)} ${fluidSpace(pl, 0, 0.45, 2.2, useFixedPx)}`,
            margin: `${fluidSpace(mt, 0, 0.35, 1.4, useFixedPx)} ${fluidSpace(mr, 0, 0.35, 1.4, useFixedPx)} ${fluidSpace(mb, 0, 0.35, 1.4, useFixedPx)} ${fluidSpace(ml, 0, 0.35, 1.4, useFixedPx)}`,
            height: normalizedHeight ?? (props.height as string),
            borderRadius: px(props.borderRadius),
            ...(colStrokePlacement === "outside" && colBorderDecl
              ? { border: "none", outline: colBorderDecl, outlineOffset: 0 }
              : colBorderDecl
                ? { border: colBorderDecl }
                : {}),
            display: "flex",
            flexDirection: props.flexDirection as React.CSSProperties["flexDirection"],
            flexWrap: props.flexWrap as React.CSSProperties["flexWrap"],
            alignItems: props.alignItems as string,
            justifyContent: props.justifyContent as string,
            gap: fluidSpace(props.gap, 0, 0.4, 1.8, useFixedPx),
            boxShadow: props.boxShadow as string,
            opacity: props.opacity as number,
            overflow: props.overflow as string,
            cursor: interactiveClick ? "pointer" : undefined,
          }}
          onClick={interactiveClick}
        >
          {children}
        </div>
      );
    }

    case "Text": {
      const m = typeof props.margin === "number" ? props.margin : 0;
      const mt = (props.marginTop ?? m) as number;
      const mb = (props.marginBottom ?? m) as number;
      const ml = (props.marginLeft ?? m) as number;
      const mr = (props.marginRight ?? m) as number;
      const p = typeof props.padding === "number" ? props.padding : 0;
      const pt = (props.paddingTop ?? p) as number;
      const pb = (props.paddingBottom ?? p) as number;
      const pl = (props.paddingLeft ?? p) as number;
      const pr = (props.paddingRight ?? p) as number;
      const fallbackTextContent = (props.text != null && props.text !== "") ? String(props.text) : ((DEFAULTS["Text"]?.text as string) ?? "Edit me!");
      const resolvedProductField = resolveProductFieldForNode(nodeId, type, props, productBinding);
      const textContent =
        resolvedProductField === "name" && productBinding?.product.name
          ? productBinding.product.name
          : resolvedProductField === "price"
            ? formatStorePrice(typeof productBinding?.product.price === "number" ? productBinding.product.price : 0)
            : resolvedProductField === "description" && productBinding?.product.description
              ? productBinding.product.description
              : fallbackTextContent;
      const normalizedTextWidth = normalizeLayoutWidthForNarrow(props.width, isNarrowPreview, builderParityMode);
      const normalizedTextHeight = normalizeLayoutHeightForNarrow(props.height, isNarrowPreview, builderParityMode);
      const rawTextFontSize = parsePixelValue(props.fontSize) ?? toNumber(props.fontSize, toNumber(DEFAULTS["Text"]?.fontSize, 16));
      const typographyLevel = inferTypographyLevel(props, rawTextFontSize);
      const typographySpec = getResponsiveTypographySpec(typographyLevel, rawTextFontSize, isNarrowPreview, builderParityMode, useFixedPx);
      const shouldScaleTextFont = !builderParityMode && isNarrowPreview && rawTextFontSize > 30;
      const textOverflowLikely = !builderParityMode && isNarrowPreview && isLikelyOverflowingNarrowViewport(props, viewportWidth);
      const rot = toNumber(props.rotation, 0);
      const flipH = props.flipHorizontal === true;
      const flipV = props.flipVertical === true;
      const textTransformStyle = [rot ? `rotate(${rot}deg)` : null, flipH ? "scaleX(-1)" : null, flipV ? "scaleY(-1)" : null].filter(Boolean).join(" ") || undefined;
      const normalizedPos = normalizeResponsivePosition(((props.position as React.CSSProperties["position"]) || "relative"), isNarrowPreview, props, viewportWidth, builderParityMode);
      const originalPos = (props.position as string) || "relative";
      const shouldClearOffsets = !builderParityMode && isNarrowPreview && originalPos !== "relative" && normalizedPos === "relative";

      const textStyle: React.CSSProperties = {
        fontSize: typographySpec.fontSize,
        fontFamily: (props.fontFamily as string) || "Outfit",
        fontWeight: props.fontWeight as string,
        fontStyle: (props.fontStyle as string) || "normal",
        lineHeight: Math.max(toNumber(props.lineHeight, typographySpec.minLineHeight), typographySpec.minLineHeight),
        letterSpacing: px(props.letterSpacing),
        textAlign: props.textAlign as React.CSSProperties["textAlign"],
        textTransform: props.textTransform as React.CSSProperties["textTransform"],
        color: (props.color as string) || "#000000",
        position: normalizedPos,
        display: ((props.display as React.CSSProperties["display"]) || "block"),
        zIndex: (props.zIndex as number | undefined) ?? 2,
        top: shouldClearOffsets ? undefined : ((props.position as string) !== "static" ? (props.top as string) : undefined),
        left: shouldClearOffsets ? undefined : ((props.position as string) !== "static" ? (props.left as string) : undefined),
        right: shouldClearOffsets ? undefined : ((props.position as string) !== "static" ? (props.right as string) : undefined),
        bottom: shouldClearOffsets ? undefined : ((props.position as string) !== "static" ? (props.bottom as string) : undefined),
        width: normalizedTextWidth ?? (props.width as string | undefined),
        height: normalizedTextHeight ?? (props.height as string | undefined),
        minHeight: "1em",
        overflow: props.height ? "hidden" : undefined,
        maxWidth: "100%",
        minWidth: 0,
        margin: `${fluidSpace(mt, 0, 0.35, 1.4, useFixedPx)} ${fluidSpace(mr, 0, 0.35, 1.4, useFixedPx)} ${fluidSpace(mb, 0, 0.35, 1.4, useFixedPx)} ${fluidSpace(ml, 0, 0.35, 1.4, useFixedPx)}`,
        padding: `${fluidSpace(pt, 0, 0.45, 2.2, useFixedPx)} ${fluidSpace(pr, 0, 0.45, 2.2, useFixedPx)} ${fluidSpace(pb, 0, 0.45, 2.2, useFixedPx)} ${fluidSpace(pl, 0, 0.45, 2.2, useFixedPx)}`,
        opacity: props.opacity as number,
        boxShadow: props.boxShadow as string,
        cursor: allowPreviewInput ? "text" : (interactiveClick ? "pointer" : undefined),
        transform: textTransformStyle,
        transformOrigin: "center center",
        whiteSpace: "pre-wrap",
        overflowWrap: "break-word",
        wordBreak: "normal",
        ["--fluid-font-cqw" as any]: "3.2cqw",
        ["--mobile-source-font-size" as any]: `${rawTextFontSize}px`,
        ["--fluid-font-max" as any]: `${rawTextFontSize}px`,
      };

      if (allowPreviewInput) {
        const previewInputStyle = {
          ...textStyle,
          color: "#111827",
          background: "transparent",
          border: "none",
          outline: "none",
          width: "100%",
          minWidth: 0,
          "--placeholder-color": (props.color as string) || "#94a3b8",
        } as React.CSSProperties;

        return wrapWithAnimation(
          <input
            type="text"
            defaultValue={textContent}
            placeholder={textContent}
            aria-label={textContent}
            data-fluid-space="true"
            data-fluid-text="true"
            data-mobile-font-scale={shouldScaleTextFont ? "true" : undefined}
            data-typography-level={typographyLevel}
            data-mobile-overflow={textOverflowLikely ? "true" : undefined}
            className={`preview-input ${((props.customClassName as string) || "").trim()}`.trim() || undefined}
            style={previewInputStyle}
          />,
          animation
        );
      }

      return wrap(
        <div
          data-fluid-space="true"
          data-fluid-text="true"
          data-mobile-font-scale={shouldScaleTextFont ? "true" : undefined}
          data-typography-level={typographyLevel}
          data-mobile-overflow={textOverflowLikely ? "true" : undefined}
          className={((props.customClassName as string) || "").trim() || undefined}
          style={textStyle}
          onClick={interactiveClick}
        >
          {textContent}
        </div>
      );
    }

    case "Image": {
      const resolvedProductField = resolveProductFieldForNode(nodeId, type, props, productBinding);
      const productImageUrl =
        resolvedProductField === "image"
          ? productBinding?.product.images?.[0]
          : undefined;
      const imgRot = toNumber(props.rotation, 0);
      const imgFlipH = props.flipHorizontal === true;
      const imgFlipV = props.flipVertical === true;
      const imgTransform = [imgRot ? `rotate(${imgRot}deg)` : null, imgFlipH ? "scaleX(-1)" : null, imgFlipV ? "scaleY(-1)" : null].filter(Boolean).join(" ") || undefined;
      const normalizedImageWidth = normalizeLayoutWidthForNarrow(props.width, isNarrowPreview, builderParityMode);
      const normalizedImageHeight = normalizeLayoutHeightForNarrow(props.height, isNarrowPreview, builderParityMode);
      const isInsideTabs = Boolean(insideTabsContext || parentType === "Tabs" || parentType === "TabContent");
      const autoFitInTabs = props._autoFitInTabs === true;
      const rawWidth =
        isInsideTabs && !autoFitInTabs
          ? (props.width as string)
          : (normalizedImageWidth ?? (props.width as string));
      const rawHeight =
        isInsideTabs && !autoFitInTabs
          ? (props.height as string)
          : (normalizedImageHeight ?? (props.height as string));
      const resolvedImageWidth = isInsideTabs && autoFitInTabs ? "100%" : rawWidth;
      const resolvedImageHeight = isInsideTabs && autoFitInTabs ? "auto" : rawHeight;
      const imageWidthPx = parsePixelValue(props.width);
      const imageHeightPx = parsePixelValue(props.height);
      const mediaAspectRatio = imageWidthPx && imageHeightPx ? `${imageWidthPx} / ${imageHeightPx}` : undefined;
      const normalizedPos = normalizeResponsivePosition(((props.position as React.CSSProperties["position"]) || "relative"), isNarrowPreview, props, viewportWidth, builderParityMode);
      const originalPos = (props.position as string) || "relative";
      const shouldClearOffsets = !builderParityMode && isNarrowPreview && originalPos !== "relative" && normalizedPos === "relative";

      return wrap(
        <img
          src={productImageUrl || (props.src as string) || "https://placehold.co/600x400?text=Photo"}
          alt={(resolvedProductField === "image" ? productBinding?.product.name : undefined) || (props.alt as string) || "Image"}
          onError={(e) => {
            const target = e.currentTarget;
            if (target.src !== "https://placehold.co/600x400?text=Image+Not+Found") {
              target.src = "https://placehold.co/600x400?text=Image+Not+Found";
            }
          }}
          data-fluid-space="true"
          data-fluid-media="true"
          className={((props.customClassName as string) || "").trim() || undefined}
          style={{
            position: normalizedPos,
            top: shouldClearOffsets ? undefined : ((props.position as string) !== "static" ? (props.top as string) : undefined),
            left: shouldClearOffsets ? undefined : ((props.position as string) !== "static" ? (props.left as string) : undefined),
            right: shouldClearOffsets ? undefined : ((props.position as string) !== "static" ? (props.right as string) : undefined),
            bottom: shouldClearOffsets ? undefined : ((props.position as string) !== "static" ? (props.bottom as string) : undefined),
            zIndex: (props.zIndex as number | undefined) ?? 2,
            width: resolvedImageWidth,
            height: resolvedImageHeight,
            maxWidth: "100%",
            objectFit: ((props.objectFit as React.CSSProperties["objectFit"]) || "cover"),
            aspectRatio: mediaAspectRatio,
            ["--media-aspect-ratio" as any]: mediaAspectRatio,
            borderRadius: px(props.borderRadius),
            padding: fluidSpace(props.padding),
            margin: fluidSpace(props.margin, 0, 0.35, 1.4),
            opacity: props.opacity as number,
            boxShadow: props.boxShadow as string,
            transform: imgTransform,
            transformOrigin: "center center",
          }}
        />
      );
    }

    case "BooleanField": {
      const controlTypeRaw = String(props.controlType ?? "checkbox").trim().toLowerCase();
      const controlType = controlTypeRaw === "radio" ? "radio" : "checkbox";
      const isRadio = controlType === "radio";
      const disabled = props.disabled === true;
      const labelColor = (props.labelColor as string) || "#000000";
      const gap = toNumber(props.gap, 10);
      const itemGap = toNumber(props.itemGap, 10);
      const fontSize = toNumber(props.fontSize, 14);
      const fontFamily = (props.fontFamily as string) || "Outfit";
      const fontWeight = (props.fontWeight as string) || "500";
      const showLabels = props.showLabels !== false;
      const controlSize = isNarrowPreview ? 18 : 16;
      const baseOptions = Array.isArray(props.options) && props.options.length > 0
        ? props.options
        : [
          {
            id: "opt-1",
            label: (props.label as string) || "Option 1",
            checked: Boolean(props.checked),
          },
          { id: "opt-2", label: "Option 2", checked: false },
          { id: "opt-3", label: "Option 3", checked: false },
        ];

      const normalizedWidth =
        normalizeLayoutWidthForNarrow(
          normalizePreviewWidth(props.width, viewportWidth, builderParityMode, mobileBreakpoint) ||
          (props.width as string) ||
          "fit-content",
          isNarrowPreview,
          builderParityMode,
        ) || "fit-content";
      const resolvedBooleanWidth = isNarrowPreview ? "100%" : normalizedWidth;

      const m = typeof props.margin === "number" ? props.margin : 0;
      const mt = (props.marginTop ?? m) as number;
      const mb = (props.marginBottom ?? m) as number;
      const ml = (props.marginLeft ?? m) as number;
      const mr = (props.marginRight ?? m) as number;
      const p = typeof props.padding === "number" ? props.padding : 0;
      const pt = (props.paddingTop ?? p) as number;
      const pb = (props.paddingBottom ?? p) as number;
      const pl = (props.paddingLeft ?? p) as number;
      const pr = (props.paddingRight ?? p) as number;

      return wrap(
        <div
          data-fluid-space="true"
          data-fluid-text="true"
          className={((props.customClassName as string) || "").trim() || undefined}
          style={{
            width: resolvedBooleanWidth,
            height: (props.height as string) || "fit-content",
            paddingTop: `${pt}px`,
            paddingRight: `${pr}px`,
            paddingBottom: `${pb}px`,
            paddingLeft: `${pl}px`,
            marginTop: `${mt}px`,
            marginRight: `${mr}px`,
            marginBottom: `${mb}px`,
            marginLeft: `${ml}px`,
            opacity: (props.opacity as number) ?? 1,
            cursor: disabled ? "not-allowed" : "default",
            userSelect: "none",
            maxWidth: "100%",
            boxSizing: "border-box",
            display: "inline-flex",
            flexDirection: "column",
            alignItems: "flex-start",
            gap: `${itemGap}px`,
          }}
        >
          {baseOptions.map((opt: any, idx: number) => {
            const checked =
              isRadio
                ? Boolean(opt.checked) && !baseOptions.some((o: any, i: number) => i < idx && o.checked)
                : Boolean(opt.checked);

            return (
              <label
                key={opt.id || `opt-${idx}`}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: `${gap}px`,
                  cursor: disabled ? "not-allowed" : "pointer",
                  width: isNarrowPreview ? "100%" : "auto",
                  maxWidth: "100%",
                  minWidth: 0,
                  flexWrap: "nowrap",
                }}
              >
                <input
                  type={controlType}
                  disabled={disabled || !enableFormInputs}
                  defaultChecked={checked}
                  readOnly={!enableFormInputs}
                  className="h-4 w-4 accent-brand-blue"
                  style={{
                    flexShrink: 0,
                    width: `${controlSize}px`,
                    height: `${controlSize}px`,
                    minWidth: `${controlSize}px`,
                    minHeight: `${controlSize}px`,
                    marginTop: isNarrowPreview ? "2px" : undefined,
                  }}
                />
                {showLabels && (
                  <span
                    style={{
                      color: labelColor,
                      fontSize: fluidFont(fontSize, isNarrowPreview ? 13 : 12, isNarrowPreview ? 3.6 : 3, useFixedPx),
                      fontFamily,
                      fontWeight,
                      lineHeight: 1.35,
                      minWidth: 0,
                      maxWidth: "100%",
                      whiteSpace: isNarrowPreview ? "normal" : "nowrap",
                      overflowWrap: isNarrowPreview ? "anywhere" : "normal",
                      wordBreak: isNarrowPreview ? "break-word" : "normal",
                    }}
                    title={opt.label || `Option ${idx + 1}`}
                  >
                    {opt.label || `Option ${idx + 1}`}
                  </span>
                )}
              </label>
            );
          })}
        </div>
      );
    }

    case "Video": {
      const vidRot = toNumber(props.rotation, 0);
      const vidFlipH = props.flipHorizontal === true;
      const vidFlipV = props.flipVertical === true;
      const vidTransform = [vidRot ? `rotate(${vidRot}deg)` : null, vidFlipH ? "scaleX(-1)" : null, vidFlipV ? "scaleY(-1)" : null].filter(Boolean).join(" ") || undefined;
      const normalizedVideoWidth = normalizeLayoutWidthForNarrow(props.width, isNarrowPreview, builderParityMode);
      const normalizedVideoHeight = normalizeLayoutHeightForNarrow(props.height, isNarrowPreview, builderParityMode);
      const isInsideTabs = Boolean(insideTabsContext || parentType === "Tabs" || parentType === "TabContent");
      const resolvedVideoWidth = isInsideTabs
        ? ((props.width as string) ?? "100%")
        : (normalizedVideoWidth ?? (props.width as string) ?? "100%");
      const resolvedVideoHeight = isInsideTabs
        ? ((props.height as string) ?? "auto")
        : (normalizedVideoHeight ?? (props.height as string) ?? "auto");
      const videoWidthPx = parsePixelValue(props.width);
      const videoHeightPx = parsePixelValue(props.height);
      const videoAspectRatio = videoWidthPx && videoHeightPx ? `${videoWidthPx} / ${videoHeightPx}` : "16 / 9";
      const rawVideoSrc = typeof props.src === "string" ? props.src.trim() : "";

      const normalizedPos = normalizeResponsivePosition(((props.position as React.CSSProperties["position"]) || "relative"), isNarrowPreview, props, viewportWidth, builderParityMode);
      const originalPos = (props.position as string) || "relative";
      const shouldClearOffsets = !builderParityMode && isNarrowPreview && originalPos !== "relative" && normalizedPos === "relative";

      if (!rawVideoSrc) {
        return wrap(
          <div
            data-fluid-space="true"
            data-fluid-media="true"
            className={((props.customClassName as string) || "").trim() || undefined}
            style={{
              position: normalizedPos,
              top: shouldClearOffsets ? undefined : ((props.position as string) !== "static" ? (props.top as string) : undefined),
              left: shouldClearOffsets ? undefined : ((props.position as string) !== "static" ? (props.left as string) : undefined),
              right: shouldClearOffsets ? undefined : ((props.position as string) !== "static" ? (props.right as string) : undefined),
              bottom: shouldClearOffsets ? undefined : ((props.position as string) !== "static" ? (props.bottom as string) : undefined),
              zIndex: (props.zIndex as number | undefined) ?? 2,
              width: resolvedVideoWidth,
              height: resolvedVideoHeight,
              maxWidth: "100%",
              aspectRatio: videoAspectRatio,
              borderRadius: px(props.borderRadius),
              padding: fluidSpace(props.padding),
              margin: fluidSpace(props.margin, 0, 0.35, 1.4),
              opacity: props.opacity as number,
              boxShadow: props.boxShadow as string,
              transform: vidTransform,
              transformOrigin: "center center",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "#0f172a",
              color: "#cbd5e1",
              fontSize: "12px",
            }}
          >
            No video source
          </div>
        );
      }

      return wrap(
        <video
          src={rawVideoSrc}
          controls={props.controls !== false}
          autoPlay={props.autoPlay === true}
          loop={props.loop === true}
          muted={props.muted !== false}
          playsInline
          data-fluid-space="true"
          data-fluid-media="true"
          className={((props.customClassName as string) || "").trim() || undefined}
          style={{
            position: normalizeResponsivePosition(((props.position as React.CSSProperties["position"]) || "relative"), isNarrowPreview, props, viewportWidth, builderParityMode),
            top: (props.position as string) !== "static" ? (props.top as string) : undefined,
            left: (props.position as string) !== "static" ? (props.left as string) : undefined,
            right: (props.position as string) !== "static" ? (props.right as string) : undefined,
            bottom: (props.position as string) !== "static" ? (props.bottom as string) : undefined,
            zIndex: (props.zIndex as number | undefined) ?? 2,
            width: resolvedVideoWidth,
            height: resolvedVideoHeight,
            maxWidth: "100%",
            objectFit: ((props.objectFit as React.CSSProperties["objectFit"]) || "cover"),
            aspectRatio: videoAspectRatio,
            ["--media-aspect-ratio" as any]: videoAspectRatio,
            borderRadius: px(props.borderRadius),
            padding: fluidSpace(props.padding),
            margin: fluidSpace(props.margin, 0, 0.35, 1.4),
            opacity: props.opacity as number,
            boxShadow: props.boxShadow as string,
            transform: vidTransform,
            transformOrigin: "center center",
            display: "block",
            background: "#0f172a",
          }}
        />
      );
    }

    case "Button": {
      const variant = (props.variant as string) || "primary";
      const style = BUTTON_VARIANTS[variant] ?? BUTTON_VARIANTS.primary;
      const isCta = variant === "cta";
      const bg = (props.backgroundColor as string) ?? style.bg;
      const color = (props.textColor as string) ?? style.text;
      const borderColor = (props.borderColor as string) ?? style.border;
      const borderWidth = (props.borderWidth as number) ?? style.borderWidth;
      const borderStyle = ((props.borderStyle as string) || "solid");
      const resolvedBorderStyle = borderWidth > 0 ? borderStyle : "none";
      const width = normalizeLayoutWidthForNarrow(
        normalizePreviewWidth(props.width, viewportWidth, builderParityMode, mobileBreakpoint) || (props.width as string) || "auto",
        isNarrowPreview,
        builderParityMode,
      ) || "auto";
      const isAutoWidth = width === "auto";
      const height = normalizeLayoutHeightForNarrow(props.height, isNarrowPreview, builderParityMode) || (props.height as string) || "auto";
      const isPercentWidth = typeof width === "string" && width.includes("%");
      const p = typeof props.padding === "number" ? props.padding : 0;
      const pt = toNumber(props.paddingTop ?? p, 12);
      const pr = toNumber(props.paddingRight ?? p, 28);
      const pb = toNumber(props.paddingBottom ?? p, 12);
      const pl = toNumber(props.paddingLeft ?? p, 28);
      const m = typeof props.margin === "number" ? props.margin : 0;
      const mt = (props.marginTop ?? m) as number;
      const mr = (props.marginRight ?? m) as number;
      const mb = (props.marginBottom ?? m) as number;
      const ml = (props.marginLeft ?? m) as number;
      const labelStr = (props.label as string) ?? "Button";
      const resolvedProductField = resolveProductFieldForNode(nodeId, type, props, productBinding);
      const boundAddToCart = resolvedProductField === "addToCart" && productBinding && storeContext;
      const explicitLink = (props.link as string) || "";
      const link =
        explicitLink ||
        (storeContext ? getDefaultLinkForLabel(labelStr) : "");
      const internalTargetId = link ? resolveInternalPageId(link, pages) : null;
      const btnRot = toNumber(props.rotation, 0);
      const btnFlipH = props.flipHorizontal === true;
      const btnFlipV = props.flipVertical === true;
      const btnTransform = [btnRot ? `rotate(${btnRot}deg)` : null, btnFlipH ? "scaleX(-1)" : null, btnFlipV ? "scaleY(-1)" : null].filter(Boolean).join(" ") || undefined;
      const rawButtonFontSize = parsePixelValue(props.fontSize) ?? toNumber(props.fontSize, toNumber(DEFAULTS["Button"]?.fontSize, 14));
      const shouldScaleButtonFont = !builderParityMode && isNarrowPreview && rawButtonFontSize > 30;
      const normalizedPos = normalizeResponsivePosition(((props.position as React.CSSProperties["position"]) || "relative"), isNarrowPreview, props, viewportWidth, builderParityMode);
      const originalPos = (props.position as string) || "relative";
      const shouldClearOffsets = !builderParityMode && isNarrowPreview && originalPos !== "relative" && normalizedPos === "relative";
      const isTrueMobileWidth = viewportWidth <= toNumber(mobileBreakpoint, PREVIEW_MOBILE_BREAKPOINT);
      const shouldForceMobileButtonWidth =
        !builderParityMode &&
        isTrueMobileWidth &&
        (originalPos === "absolute" || originalPos === "fixed" || isPercentWidth);
      const resolvedButtonWidth = shouldForceMobileButtonWidth
        ? "100%"
        : (isPercentWidth ? "100%" : isAutoWidth ? "fit-content" : width);

      const content = (
        <span
          data-fluid-space="true"
          data-fluid-button="true"
          data-fluid-text="true"
          data-smooth="true"
          data-mobile-font-scale={shouldScaleButtonFont ? "true" : undefined}
          className={((props.customClassName as string) || "").trim() || undefined}
          style={{
            position: normalizedPos,
            top: shouldClearOffsets ? undefined : ((props.position as string) !== "static" ? (props.top as string) : undefined),
            left: shouldClearOffsets ? undefined : ((props.position as string) !== "static" ? (props.left as string) : undefined),
            right: shouldClearOffsets ? undefined : ((props.position as string) !== "static" ? (props.right as string) : undefined),
            bottom: shouldClearOffsets ? undefined : ((props.position as string) !== "static" ? (props.bottom as string) : undefined),
            zIndex: (props.zIndex as number | undefined) ?? 2,
            backgroundColor: bg,
            color,
            fontSize: fluidFont(rawButtonFontSize, 12, 3, useFixedPx),
            fontWeight: props.fontWeight as string,
            fontFamily: (props.fontFamily as string) || "Outfit",
            borderRadius: isCta ? "0px" : px(props.borderRadius),
            border: `${borderWidth}px ${resolvedBorderStyle} ${borderColor}`,
            padding: `${fluidSpace(pt, 0, 0.45, 2.2, useFixedPx)} ${fluidSpace(pr, 0, 0.45, 2.2, useFixedPx)} ${fluidSpace(pb, 0, 0.45, 2.2, useFixedPx)} ${fluidSpace(pl, 0, 0.45, 2.2, useFixedPx)}`,
            margin: `${fluidSpace(mt, 0, 0.35, 1.4, useFixedPx)} ${fluidSpace(mr, 0, 0.35, 1.4, useFixedPx)} ${fluidSpace(mb, 0, 0.35, 1.4, useFixedPx)} ${fluidSpace(ml, 0, 0.35, 1.4, useFixedPx)}`,
            width: resolvedButtonWidth,
            maxWidth: isNarrowPreview ? "100%" : undefined,
            height: height,
            boxSizing: "border-box",
            opacity: props.opacity as number,
            boxShadow: props.boxShadow as string,
            display: shouldForceMobileButtonWidth ? "flex" : "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: interactiveClick ? "pointer" : undefined,
            transform: btnTransform,
            transformOrigin: "center center",
            minWidth: shouldForceMobileButtonWidth ? 0 : (isPercentWidth ? (isNarrowPreview ? 0 : undefined) : "max-content"),
            flexShrink: shouldForceMobileButtonWidth ? 1 : (isAutoWidth ? 0 : 1),
            textTransform: isCta ? "uppercase" : undefined,
            letterSpacing: isCta ? "0.08em" : undefined,
            whiteSpace: isNarrowPreview ? "normal" : "nowrap",
            overflowWrap: isNarrowPreview ? "break-word" : "normal",
            wordBreak: isNarrowPreview ? "break-word" : "keep-all",
            transition: "background-color 180ms ease, color 180ms ease, border-color 180ms ease, box-shadow 180ms ease, transform 180ms ease, opacity 180ms ease",
            ["--fluid-font-cqw" as any]: "3cqw",
            ["--mobile-source-font-size" as any]: `${rawButtonFontSize}px`,
            ["--fluid-font-max" as any]: `${rawButtonFontSize}px`,
          }}
          onClick={interactiveClick}
        >
          {labelStr}
        </span>
      );
      if (interactiveClick) {
        return wrapWithAnimation(content, animation);
      }
      if (boundAddToCart) {
        return wrap(
          <button
            type="button"
            data-fluid-space="true"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              storeContext.addToCart({
                id: productBinding.product.id,
                name: productBinding.product.name,
                price: typeof productBinding.product.price === "number" ? productBinding.product.price : 0,
                image: productBinding.product.images?.[0],
              });
            }}
            style={{
              all: "unset",
              display: isPercentWidth || isNarrowPreview ? "block" : "inline-block",
              width: isPercentWidth || isNarrowPreview ? resolvedButtonWidth : undefined,
              cursor: "pointer",
            }}
          >
            {content}
          </button>
        );
      }
      if (internalTargetId && onPrototypeAction) {
        return wrap(
          <button
            type="button"
            data-fluid-space="true"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onPrototypeAction({
                trigger: "click",
                action: "navigateTo",
                destination: internalTargetId,
              });
            }}
            style={{
              all: "unset",
              display: isPercentWidth || isNarrowPreview ? "block" : "inline-block",
              width: isPercentWidth || isNarrowPreview ? resolvedButtonWidth : undefined,
              cursor: "pointer",
            }}
          >
            {content}
          </button>
        );
      }
      if (link) {
        return wrap(
          <a
            href={link}
            data-fluid-space="true"
            style={{
              textDecoration: "none",
              display: isPercentWidth || isNarrowPreview ? "block" : "inline-block",
              width: isPercentWidth || isNarrowPreview ? resolvedButtonWidth : undefined,
            }}
          >
            {content}
          </a>
        );
      }
      return wrap(content);
    }

    case "Accordion": {
      const itemsRaw = Array.isArray(props.items) ? props.items : [];
      const items = itemsRaw.length > 0
        ? itemsRaw
        : [
          { title: "Item 1", content: "Accordion content" },
          { title: "Item 2", content: "Accordion content" },
        ];

      // Respect authored colors from the canvas to keep preview/theme parity.
      const headerBg = String(props.headerBg ?? "#1e1e2e");
      const headerTextColor = String(props.headerTextColor ?? "#e2e8f0");
      const contentBg = String(props.contentBg ?? "#12121c");
      const contentTextColor = String(props.contentTextColor ?? "#a0aec0");
      const borderColor = String(props.borderColor ?? "#2d2d44");
      const borderWidth = toNumber(props.borderWidth, 1);
      const headerFontSize = toNumber(props.headerFontSize, 14);
      const contentFontSize = toNumber(props.contentFontSize, 13);
      const radius = toNumber(props.borderRadius, 8);
      const width = normalizeLayoutWidthForNarrow(
        normalizePreviewWidth(props.width, viewportWidth, builderParityMode, mobileBreakpoint) || (props.width as string) || "100%",
        isNarrowPreview,
        builderParityMode,
      ) || "100%";

      return wrap(
        <div
          className={((props.customClassName as string) || "").trim() || undefined}
          style={{
            width,
            maxWidth: "100%",
            minWidth: 0,
            background: (props.backgroundColor as string) || "transparent",
            borderRadius: `${radius}px`,
            overflow: "hidden",
            border: `${borderWidth}px solid ${borderColor}`,
            display: "flex",
            flexDirection: "column",
          }}
        >
          {items.map((item: any, index: number) => {
            const mediaType = item?.mediaType as string | undefined;
            const mediaUrl = typeof item?.mediaUrl === "string" ? item.mediaUrl.trim() : "";
            return (
              <details key={index} open={index === 0} style={{ borderTop: index === 0 ? "none" : `${borderWidth}px solid ${borderColor}` }}>
                <summary
                  style={{
                    listStyle: "none",
                    cursor: "pointer",
                    background: headerBg,
                    color: headerTextColor,
                    padding: "12px 14px",
                    fontSize: `${headerFontSize}px`,
                    fontWeight: 600,
                    lineHeight: 1.35,
                    whiteSpace: "normal",
                    overflowWrap: "anywhere",
                    wordBreak: "break-word",
                  }}
                >
                  {String(item?.title ?? `Item ${index + 1}`)}
                </summary>
                <div
                  style={{
                    background: contentBg,
                    color: contentTextColor,
                    padding: "12px 14px",
                    fontSize: `${contentFontSize}px`,
                    lineHeight: 1.6,
                    whiteSpace: "pre-wrap",
                    overflowWrap: "anywhere",
                    wordBreak: "break-word",
                  }}
                >
                  <div style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere", wordBreak: "break-word" }}>
                    {String(item?.content ?? "")}
                  </div>
                  {mediaUrl && mediaType === "image" ? (
                    <img src={mediaUrl} alt="accordion media" data-fluid-media="true" style={{ width: "100%", marginTop: 10, borderRadius: 6 }} />
                  ) : null}
                  {mediaUrl && mediaType === "video" ? (
                    <video src={mediaUrl} controls playsInline data-fluid-media="true" style={{ width: "100%", marginTop: 10, borderRadius: 6 }} />
                  ) : null}
                </div>
              </details>
            );
          })}
        </div>
      );
    }

    case "Banner": {
      const width = normalizeLayoutWidthForNarrow(
        normalizePreviewWidth(props.width, viewportWidth, builderParityMode, mobileBreakpoint) || (props.width as string) || "100%",
        isNarrowPreview,
        builderParityMode,
      ) || "100%";
      const height = normalizeLayoutHeightForNarrow(props.height, isNarrowPreview, builderParityMode) || (props.height as string) || "auto";
      const bannerText = String(props.text ?? "FLASH SALE: Up to 70% off - Use code SAVE70");
      const bannerFontSize = Math.max(8, toNumber(props.fontSize, 13));
      const bannerFontWeight = String(props.fontWeight ?? "700");
      const bannerFontFamily = String(props.fontFamily ?? "Outfit");
      const bannerFontStyle = (props.fontStyle as React.CSSProperties["fontStyle"]) || "normal";
      const bannerLineHeight = (props.lineHeight as React.CSSProperties["lineHeight"]) ?? 1.2;
      const bannerLetterSpacing = typeof props.letterSpacing === "number"
        ? `${props.letterSpacing}px`
        : (props.letterSpacing as React.CSSProperties["letterSpacing"]);
      const bannerTextAlign = (props.textAlign as React.CSSProperties["textAlign"]) || "center";
      const bannerTextTransform = (props.textTransform as React.CSSProperties["textTransform"]) || "none";
      const bannerTextColor = (props.color as string) || "#ffffff";
      const hasBannerChildren = Array.isArray(children) && children.length > 0;
      const originalPos = (props.position as string) || "relative";
      const normalizedPosition = normalizeResponsivePosition(((props.position as React.CSSProperties["position"]) || "relative"), isNarrowPreview, props, viewportWidth, builderParityMode);
      const shouldClearNarrowOffsets = !builderParityMode && isNarrowPreview && (originalPos === "absolute" || originalPos === "fixed") && normalizedPosition === "relative";

      return wrap(
        <div
          data-layout="row"
          className={((props.customClassName as string) || "").trim() || undefined}
          style={{
            position: normalizedPosition,
            top: shouldClearNarrowOffsets ? undefined : (props.top as React.CSSProperties["top"]),
            right: shouldClearNarrowOffsets ? undefined : (props.right as React.CSSProperties["right"]),
            bottom: shouldClearNarrowOffsets ? undefined : (props.bottom as React.CSSProperties["bottom"]),
            left: shouldClearNarrowOffsets ? undefined : (props.left as React.CSSProperties["left"]),
            zIndex: (props.zIndex as number | undefined) ?? 3,
            width,
            height,
            maxWidth: normalizedPosition === "static" ? "100%" : (isNarrowPreview ? "100%" : undefined),
            minWidth: 0,
            background: (props.background as string) || "#ef4444",
            color: (props.color as string) || "#ffffff",
            display: "flex",
            alignItems: (props.alignItems as string) || "center",
            justifyContent: (props.justifyContent as string) || "center",
            gap: fluidSpace(props.gap, 0, 0.4, 1.8, useFixedPx),
            padding: `${fluidSpace(props.paddingTop ?? props.padding, 0, 0.45, 2.2, useFixedPx)} ${fluidSpace(props.paddingRight ?? props.padding, 0, 0.45, 2.2, useFixedPx)} ${fluidSpace(props.paddingBottom ?? props.padding, 0, 0.45, 2.2, useFixedPx)} ${fluidSpace(props.paddingLeft ?? props.padding, 0, 0.45, 2.2, useFixedPx)}`,
            margin: `${fluidSpace(props.marginTop ?? props.margin, 0, 0.35, 1.4, useFixedPx)} ${fluidSpace(props.marginRight ?? props.margin, 0, 0.35, 1.4, useFixedPx)} ${fluidSpace(props.marginBottom ?? props.margin, 0, 0.35, 1.4, useFixedPx)} ${fluidSpace(props.marginLeft ?? props.margin, 0, 0.35, 1.4, useFixedPx)}`,
            borderRadius: px(props.borderRadius),
            overflow: "hidden",
            boxShadow: props.boxShadow as string,
            opacity: props.opacity as number,
          }}
        >
          {hasBannerChildren ? children : (
            <span
              data-banner-text="true"
              style={{
                display: "block",
                width: "100%",
                margin: 0,
                padding: 0,
                fontSize: `clamp(${Math.max(10, Math.round(bannerFontSize * 0.8))}px, ${(bannerFontSize / 12).toFixed(2)}cqw, ${bannerFontSize}px)`,
                fontWeight: bannerFontWeight,
                fontFamily: bannerFontFamily,
                fontStyle: bannerFontStyle,
                lineHeight: bannerLineHeight,
                letterSpacing: bannerLetterSpacing,
                textAlign: bannerTextAlign,
                textTransform: bannerTextTransform,
                color: bannerTextColor,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {bannerText}
            </span>
          )}
        </div>
      );
    }

    case "Rating": {
      const rawValue = Math.max(0, toNumber(props.value, 4.2));
      const max = Math.max(1, Math.round(toNumber(props.max, 5)));
      const allowFractional = props.allowFractional === true;
      const value = allowFractional ? rawValue : Math.round(rawValue);
      const clampedValue = Math.max(0, Math.min(max, value));
      const baseSize = Math.max(10, toNumber(props.size, 24));
      const size = isNarrowPreview ? Math.max(12, Math.min(baseSize, 22)) : baseSize;
      const gap = Math.max(0, toNumber(props.gap, 8));
      const filledColor = (props.filledColor as string) || "#f7c200";
      const emptyColor = (props.emptyColor as string) || "#6b6b6b";
      const showValue = props.showValue === true;

      return wrap(
        <div
          data-fluid-space="true"
          data-layout="row"
          className={((props.customClassName as string) || "").trim() || undefined}
          style={{
            display: "flex",
            alignItems: "center",
            flexWrap: isNarrowPreview ? "wrap" : "nowrap",
            gap: `${Math.max(0, toNumber(props.valueGap, 8))}px`,
            width: normalizeLayoutWidthForNarrow(props.width, isNarrowPreview, builderParityMode) || (isNarrowPreview ? "100%" : undefined),
            maxWidth: "100%",
            minWidth: 0,
          }}
        >
          <div style={{ display: "inline-flex", alignItems: "center", gap: `${gap}px`, flexWrap: "wrap", maxWidth: "100%" }}>
            {Array.from({ length: max }).map((_, index) => {
              const fillRatio = Math.max(0, Math.min(1, clampedValue - index));
              return (
                <span key={index} style={{ position: "relative", width: `${size}px`, height: `${size}px`, display: "inline-flex" }}>
                  <svg viewBox="0 0 24 24" width={size} height={size} style={{ display: "block" }}>
                    <path fill={emptyColor} d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                  </svg>
                  <span data-preserve-position="true" style={{ position: "absolute", inset: 0, overflow: "hidden", width: `${fillRatio * 100}%` }}>
                    <svg viewBox="0 0 24 24" width={size} height={size} style={{ display: "block" }}>
                      <path fill={filledColor} d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                    </svg>
                  </span>
                </span>
              );
            })}
          </div>
          {showValue ? (
            <span style={{ fontSize: fluidFont(toNumber(props.fontSize, 12), 12, 3.2, useFixedPx), color: (props.color as string) || "#e2e8f0" }}>
              {String(props.valueText ?? `${clampedValue}/${max}`)}
            </span>
          ) : null}
        </div>
      );
    }

    case "TabContent": {
      return wrap(
        <div
          className={((props.customClassName as string) || "").trim() || undefined}
          style={{
            width: normalizeLayoutWidthForNarrow(props.width, isNarrowPreview, builderParityMode) || "100%",
            maxWidth: "100%",
            minWidth: 0,
            minHeight: "100px",
            padding: `${fluidSpace(props.paddingTop ?? props.padding, 0, 0.45, 2.2, useFixedPx)} ${fluidSpace(props.paddingRight ?? props.padding, 0, 0.45, 2.2, useFixedPx)} ${fluidSpace(props.paddingBottom ?? props.padding, 0, 0.45, 2.2, useFixedPx)} ${fluidSpace(props.paddingLeft ?? props.padding, 0, 0.45, 2.2, useFixedPx)}`,
            margin: `${fluidSpace(props.marginTop ?? props.margin, 0, 0.35, 1.4, useFixedPx)} ${fluidSpace(props.marginRight ?? props.margin, 0, 0.35, 1.4, useFixedPx)} ${fluidSpace(props.marginBottom ?? props.margin, 0, 0.35, 1.4, useFixedPx)} ${fluidSpace(props.marginLeft ?? props.margin, 0, 0.35, 1.4, useFixedPx)}`,
            backgroundColor: (props.background as string) || "transparent",
            display: ((props.display as string) || "flex") as React.CSSProperties["display"],
            flexDirection: (props.flexDirection as React.CSSProperties["flexDirection"]) || "column",
            alignItems: (props.alignItems as string) || "flex-start",
            justifyContent: (props.justifyContent as string) || "flex-start",
            gap: fluidSpace(props.gap, 0, 0.4, 1.8, useFixedPx),
          }}
        >
          {children}
        </div>
      );
    }

    case "Spacer": {
      const p = typeof props.padding === "number" ? props.padding : 0;
      const pt = toNumber(props.paddingTop ?? p, 0);
      const pr = toNumber(props.paddingRight ?? p, 0);
      const pb = toNumber(props.paddingBottom ?? p, 0);
      const pl = toNumber(props.paddingLeft ?? p, 0);
      const m = typeof props.margin === "number" ? props.margin : 0;
      const mt = toNumber(props.marginTop ?? m, 0);
      const mr = toNumber(props.marginRight ?? m, 0);
      const mb = toNumber(props.marginBottom ?? m, 0);
      const ml = toNumber(props.marginLeft ?? m, 0);
      const spacerRot = toNumber(props.rotation, 0);
      const spacerFlipH = props.flipHorizontal === true;
      const spacerFlipV = props.flipVertical === true;
      const spacerTransform = [
        spacerRot ? `rotate(${spacerRot}deg)` : null,
        spacerFlipH ? "scaleX(-1)" : null,
        spacerFlipV ? "scaleY(-1)" : null,
      ].filter(Boolean).join(" ") || undefined;
      const spacerWidthSource =
        normalizePreviewWidth(props.width, viewportWidth, builderParityMode, mobileBreakpoint) ||
        props.width ||
        "100%";
      const spacerHeightSource = props.height ?? "20px";
      const width = normalizeSpacerDimension(spacerWidthSource, "width", isNarrowPreview, builderParityMode);
      const height = normalizeSpacerDimension(spacerHeightSource, "height", isNarrowPreview, builderParityMode);
      const bw = toNumber(props.borderWidth, 0);

      return wrap(
        <div
          data-fluid-space="true"
          data-smooth="true"
          className={((props.customClassName as string) || "").trim() || undefined}
          style={{
            position: normalizeResponsivePosition(((props.position as React.CSSProperties["position"]) || "relative"), isNarrowPreview, props, viewportWidth, builderParityMode),
            top: (props.position as string) !== "static" ? (props.top as string) : undefined,
            left: (props.position as string) !== "static" ? (props.left as string) : undefined,
            right: (props.position as string) !== "static" ? (props.right as string) : undefined,
            bottom: (props.position as string) !== "static" ? (props.bottom as string) : undefined,
            zIndex: (props.zIndex as number | undefined) ?? 1,
            width,
            height,
            maxWidth: "100%",
            minWidth: 0,
            boxSizing: "border-box",
            display: "block",
            flexShrink: 0,
            opacity: toNumber(props.opacity, 1),
            boxShadow: props.boxShadow as string,
            transform: spacerTransform,
            transformOrigin: "center center",
            backgroundColor: (props.background as string) || "transparent",
            borderRadius: px(props.borderRadius),
            border: bw > 0 ? `${bw}px ${(props.borderStyle as string) || "solid"} ${(props.borderColor as string) || "transparent"}` : undefined,
            padding: `${fluidSpace(pt, 0, 0.45, 2.2, useFixedPx)} ${fluidSpace(pr, 0, 0.45, 2.2, useFixedPx)} ${fluidSpace(pb, 0, 0.45, 2.2, useFixedPx)} ${fluidSpace(pl, 0, 0.45, 2.2, useFixedPx)}`,
            margin: `${fluidSpace(mt, 0, 0.35, 1.4, useFixedPx)} ${fluidSpace(mr, 0, 0.35, 1.4, useFixedPx)} ${fluidSpace(mb, 0, 0.35, 1.4, useFixedPx)} ${fluidSpace(ml, 0, 0.35, 1.4, useFixedPx)}`,
          }}
        />
      );
    }

    case "Badge": {
      const p = typeof props.padding === "number" ? props.padding : 0;
      const pt = toNumber(props.paddingTop ?? p, 0);
      const pr = toNumber(props.paddingRight ?? p, 0);
      const pb = toNumber(props.paddingBottom ?? p, 0);
      const pl = toNumber(props.paddingLeft ?? p, 0);
      const m = typeof props.margin === "number" ? props.margin : 0;
      const mt = toNumber(props.marginTop ?? m, 0);
      const mr = toNumber(props.marginRight ?? m, 0);
      const mb = toNumber(props.marginBottom ?? m, 0);
      const ml = toNumber(props.marginLeft ?? m, 0);
      const badgeWidth = normalizeLayoutWidthForNarrow(
        normalizePreviewWidth(props.width, viewportWidth, builderParityMode, mobileBreakpoint) || (props.width as string) || "120px",
        isNarrowPreview,
        builderParityMode,
      ) || "120px";
      const badgeHeight = normalizeLayoutHeightForNarrow(props.height, isNarrowPreview, builderParityMode) || (props.height as string) || "36px";
      const badgeBw = toNumber(props.borderWidth, 0);
      const badgeBorderDecl = badgeBw > 0
        ? `${badgeBw}px ${(props.borderStyle as string) || "solid"} ${(props.borderColor as string) || "transparent"}`
        : undefined;
      const badgeStrokePlacement = (props.strokePlacement as "mid" | "inside" | "outside") ?? "mid";

      return wrap(
        <div
          data-fluid-space="true"
          data-layout="row"
          data-smooth="true"
          className={((props.customClassName as string) || "").trim() || undefined}
          style={{
            width: badgeWidth,
            height: badgeHeight,
            maxWidth: "100%",
            minWidth: badgeWidth === "fit-content" ? fluidSpace(pl + pr + 48, 48) : 0,
            boxSizing: "border-box",
            backgroundColor: (props.background as string) || "#16a34a",
            padding: `${fluidSpace(pt, 0, 0.45, 2.2, useFixedPx)} ${fluidSpace(pr, 0, 0.45, 2.2, useFixedPx)} ${fluidSpace(pb, 0, 0.45, 2.2, useFixedPx)} ${fluidSpace(pl, 0, 0.45, 2.2, useFixedPx)}`,
            margin: `${fluidSpace(mt, 0, 0.35, 1.4, useFixedPx)} ${fluidSpace(mr, 0, 0.35, 1.4, useFixedPx)} ${fluidSpace(mb, 0, 0.35, 1.4, useFixedPx)} ${fluidSpace(ml, 0, 0.35, 1.4, useFixedPx)}`,
            borderRadius: px(props.borderRadius),
            ...(badgeStrokePlacement === "outside" && badgeBorderDecl
              ? { border: "none", outline: badgeBorderDecl, outlineOffset: 0 }
              : badgeBorderDecl
                ? { border: badgeBorderDecl }
                : {}),
            display: (props.display as React.CSSProperties["display"]) || "flex",
            flexDirection: (props.flexDirection as React.CSSProperties["flexDirection"]) || "row",
            flexWrap: (props.flexWrap as React.CSSProperties["flexWrap"]) || "nowrap",
            alignItems: (props.alignItems as React.CSSProperties["alignItems"]) || "center",
            justifyContent: (props.justifyContent as React.CSSProperties["justifyContent"]) || "center",
            gap: fluidSpace(props.gap, 0, 0.4, 1.8, useFixedPx),
            overflow: (props.overflow as string) || "hidden",
            boxShadow: props.boxShadow as string,
            opacity: toNumber(props.opacity, 1),
            cursor: interactiveClick ? "pointer" : undefined,
          }}
          onClick={interactiveClick}
        >
          {children}
        </div>
      );
    }

    case "Pagination": {
      const totalItems = Math.max(1, Math.round(toNumber(props.totalItems, 50)));
      const itemsPerPage = Math.max(1, Math.round(toNumber(props.itemsPerPage, 10)));
      const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
      const currentPage = Math.min(totalPages, Math.max(1, Math.round(toNumber(props.currentPage, 1))));
      const paginationType = String(props.type || "numbers").toLowerCase();
      const gapValue = Math.max(0, toNumber(props.gap, 8));
      const showIcons = props.showIcons !== false;
      const prevText = String(props.prevText ?? "Prev");
      const nextText = String(props.nextText ?? "Next");
      const activeColor = (props.activeColor as string) || "#3b82f6";
      const textColor = (props.color as string) || "#a1a1aa";
      const baseBackground = (props.background as string) || "transparent";
      const borderColor = (props.borderColor as string) || "#3f3f46";
      const borderStyle = (props.borderStyle as string) || "solid";
      const borderWidth = Math.max(0, toNumber(props.borderWidth, 1));
      const borderRadius = toNumber(props.borderRadius, 6);
      const fontSize = Math.max(10, toNumber(props.fontSize, 14));
      const fontWeight = String(props.fontWeight ?? "400");
      const width = normalizeLayoutWidthForNarrow(
        normalizePreviewWidth(props.width, viewportWidth, builderParityMode, mobileBreakpoint) || (props.width as string) || "auto",
        isNarrowPreview,
        builderParityMode,
      ) || "auto";
      const height = normalizeLayoutHeightForNarrow(props.height, isNarrowPreview, builderParityMode) || (props.height as string) || "auto";
      const p = typeof props.padding === "number" ? props.padding : 0;
      const m = typeof props.margin === "number" ? props.margin : 0;
      const pt = toNumber(props.paddingTop ?? p, 0);
      const pr = toNumber(props.paddingRight ?? p, 0);
      const pb = toNumber(props.paddingBottom ?? p, 0);
      const pl = toNumber(props.paddingLeft ?? p, 0);
      const mt = toNumber(props.marginTop ?? m, 0);
      const mr = toNumber(props.marginRight ?? m, 0);
      const mb = toNumber(props.marginBottom ?? m, 0);
      const ml = toNumber(props.marginLeft ?? m, 0);
      const textAlign = String(props.textAlign ?? "center");
      const justifyContent = textAlign === "right" ? "flex-end" : textAlign === "left" ? "flex-start" : "center";

      const pageTokens =
        totalPages <= 5
          ? Array.from({ length: totalPages }, (_, i) => i + 1)
          : [1, Math.max(2, currentPage - 1), currentPage, Math.min(totalPages - 1, currentPage + 1), totalPages]
            .filter((value, idx, arr) => arr.indexOf(value) === idx)
            .sort((a, b) => a - b)
            .flatMap((value, idx, arr) => {
              if (idx === 0) return [value];
              const prev = arr[idx - 1];
              return value - prev > 1 ? ["...", value] : [value];
            });

      const buttonBase: React.CSSProperties = {
        fontSize: fluidFont(fontSize, 10, 3),
        fontWeight,
        color: textColor,
        backgroundColor: baseBackground,
        borderWidth: `${borderWidth}px`,
        borderColor,
        borderStyle,
        borderRadius: `${borderRadius}px`,
        lineHeight: 1.2,
        maxWidth: "100%",
        minWidth: 0,
        boxSizing: "border-box",
        transition: "background-color 180ms ease, color 180ms ease, border-color 180ms ease, box-shadow 180ms ease, transform 180ms ease",
      };

      const navButtonStyle: React.CSSProperties = {
        ...buttonBase,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "6px",
        padding: "8px 10px",
        whiteSpace: "nowrap",
      };

      const pageButtonStyle: React.CSSProperties = {
        ...buttonBase,
        width: "36px",
        minWidth: "36px",
        height: "36px",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 0,
      };

      return wrap(
        <div
          data-fluid-space="true"
          data-smooth="true"
          className={((props.customClassName as string) || "").trim() || undefined}
          style={{
            width,
            height,
            maxWidth: "100%",
            minWidth: 0,
            display: "inline-flex",
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent,
            gap: fluidSpace(gapValue, 0, 0.45, 1.8, useFixedPx),
            padding: `${fluidSpace(pt, 0, 0.45, 2.2, useFixedPx)} ${fluidSpace(pr, 0, 0.45, 2.2, useFixedPx)} ${fluidSpace(pb, 0, 0.45, 2.2, useFixedPx)} ${fluidSpace(pl, 0, 0.45, 2.2, useFixedPx)}`,
            margin: `${fluidSpace(mt, 0, 0.35, 1.4, useFixedPx)} ${fluidSpace(mr, 0, 0.35, 1.4, useFixedPx)} ${fluidSpace(mb, 0, 0.35, 1.4, useFixedPx)} ${fluidSpace(ml, 0, 0.35, 1.4, useFixedPx)}`,
            boxSizing: "border-box",
          }}
        >
          {paginationType === "load-more" ? (
            <button type="button" style={{ ...navButtonStyle, padding: "10px 18px" }}>
              Load More
            </button>
          ) : (
            <>
              <button type="button" style={navButtonStyle}>
                {showIcons ? "<" : ""}
                {prevText}
              </button>

              {paginationType === "numbers" ? (
                <div style={{ display: "inline-flex", flexWrap: "wrap", alignItems: "center", gap: fluidSpace(gapValue, 0, 0.45, 1.8) }}>
                  {pageTokens.map((token, idx) => {
                    if (token === "...") {
                      return (
                        <span key={`ellipsis-${idx}`} style={{ color: textColor, fontSize: fluidFont(fontSize, 10, 3) }}>
                          ...
                        </span>
                      );
                    }

                    const isActive = token === currentPage;
                    return (
                      <button
                        key={`page-${token}`}
                        type="button"
                        style={{
                          ...pageButtonStyle,
                          backgroundColor: isActive ? activeColor : baseBackground,
                          borderColor: isActive ? activeColor : borderColor,
                          color: isActive ? "#ffffff" : textColor,
                          fontWeight: isActive ? "700" : fontWeight,
                        }}
                      >
                        {token}
                      </button>
                    );
                  })}
                </div>
              ) : null}

              <button type="button" style={navButtonStyle}>
                {nextText}
                {showIcons ? ">" : ""}
              </button>
            </>
          )}
        </div>
      );
    }

    case "Divider": {
      const normalizedPos = normalizeResponsivePosition(((props.position as React.CSSProperties["position"]) || "relative"), isNarrowPreview, props, viewportWidth, builderParityMode);
      const originalPos = (props.position as string) || "relative";
      const shouldClearOffsets = !builderParityMode && isNarrowPreview && originalPos !== "relative" && normalizedPos === "relative";

      return wrap(
        <hr
          data-fluid-space="true"
          data-smooth="true"
          style={{
            position: normalizedPos,
            top: shouldClearOffsets ? undefined : ((props.position as string) !== "static" ? (props.top as string) : undefined),
            left: shouldClearOffsets ? undefined : ((props.position as string) !== "static" ? (props.left as string) : undefined),
            right: shouldClearOffsets ? undefined : ((props.position as string) !== "static" ? (props.right as string) : undefined),
            bottom: shouldClearOffsets ? undefined : ((props.position as string) !== "static" ? (props.bottom as string) : undefined),
            zIndex: (props.zIndex as number | undefined) ?? 1,
            width: normalizeLayoutWidthForNarrow((props.width as string) || "100%", isNarrowPreview, builderParityMode) || "100%",
            border: "none",
            maxWidth: "100%",
            minWidth: 0,
            borderTop: `${toNumber(props.thickness, 1)}px ${(props.dividerStyle as string) || "solid"} ${(props.color as string) || "#4a4a4a"}`,
            marginTop: fluidSpace(props.marginTop, 0, 0.35, 1.4, useFixedPx),
            marginBottom: fluidSpace(props.marginBottom, 0, 0.35, 1.4, useFixedPx),
            opacity: toNumber(props.opacity, 1),
          }}
        />
      );
    }

    case "Icon": {
      const normalizedPos = normalizeResponsivePosition(((props.position as React.CSSProperties["position"]) || "relative"), isNarrowPreview, props, viewportWidth, builderParityMode);
      const originalPos = (props.position as string) || "relative";
      const shouldClearOffsets = !builderParityMode && isNarrowPreview && originalPos !== "relative" && normalizedPos === "relative";

      const iconSize = toNumber(props.size, 24);
      const normalizedIconWidth = normalizeLayoutWidthForNarrow(props.width as string, isNarrowPreview, builderParityMode);
      const normalizedIconHeight = normalizeLayoutHeightForNarrow(props.height as string, isNarrowPreview, builderParityMode);
      const fluidIconBox = `clamp(14px, 3.4cqw, ${iconSize}px)`;
      return wrap(
        <div
          data-fluid-space="true"
          data-fluid-icon="true"
          data-smooth="true"
          onClick={interactiveClick}
          style={{
            position: normalizedPos,
            top: shouldClearOffsets ? undefined : ((props.position as string) !== "static" ? (props.top as string) : undefined),
            left: shouldClearOffsets ? undefined : ((props.position as string) !== "static" ? (props.left as string) : undefined),
            right: shouldClearOffsets ? undefined : ((props.position as string) !== "static" ? (props.right as string) : undefined),
            bottom: shouldClearOffsets ? undefined : ((props.position as string) !== "static" ? (props.bottom as string) : undefined),
            zIndex: (props.zIndex as number | undefined) ?? 3,
            ["--fluid-icon-max" as any]: `${iconSize}px`,
            maxWidth: "100%",
            minWidth: 0,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: interactiveClick ? "pointer" : undefined,
          }}
        >
          <DesignIcon
            iconType={props.iconType as string}
            size={iconSize}
            color={props.color as string}
            width={normalizedIconWidth ?? ((props.width as string) || fluidIconBox)}
            height={normalizedIconHeight ?? ((props.height as string) || fluidIconBox)}
            margin={toNumber(props.margin, 0)}
            marginTop={toNumber(props.marginTop, 0)}
            marginRight={toNumber(props.marginRight, 0)}
            marginBottom={toNumber(props.marginBottom, 0)}
            marginLeft={toNumber(props.marginLeft, 0)}
            padding={toNumber(props.padding, 0)}
            paddingTop={toNumber(props.paddingTop, 0)}
            paddingRight={toNumber(props.paddingRight, 0)}
            paddingBottom={toNumber(props.paddingBottom, 0)}
            paddingLeft={toNumber(props.paddingLeft, 0)}
            opacity={toNumber(props.opacity, 1)}
            link={props.link as string}
          />
        </div>
      );
    }

    case "ImportedBlock": {
      const blockCss = (props.blockCss as string) ?? "";
      const blockHtml = (props.blockHtml as string) ?? "<div>Empty</div>";
      const scopeId = `imported-prev-${(nodeId ?? "").replace(/[^a-z0-9]/gi, "")}`;
      const responsiveScopedCss = `
        .${scopeId},
        .${scopeId} * {
          max-width: 100%;
          min-width: 0;
          box-sizing: border-box;
        }
        .${scopeId} img,
        .${scopeId} video,
        .${scopeId} iframe,
        .${scopeId} canvas,
        .${scopeId} svg {
          width: 100%;
          max-width: 100%;
          height: auto;
          display: block;
        }
        .${scopeId} iframe {
          aspect-ratio: 16 / 9;
        }
      `;
      const scopedCss = blockCss
        ? blockCss.replace(/([^{}]+)\{/g, (_: string, sel: string) => {
          const s = sel.trim();
          if (s.startsWith("@keyframes") || s.startsWith("@media") || s.startsWith("@")) return `${s} {`;
          return `.${scopeId} ${s} {`;
        })
        : "";
      const normalizedPos = normalizeResponsivePosition(((props.position as React.CSSProperties["position"]) || "relative"), isNarrowPreview, props, viewportWidth, builderParityMode);
      const originalPos = (props.position as string) || "relative";
      const shouldClearOffsets = !builderParityMode && isNarrowPreview && originalPos !== "relative" && normalizedPos === "relative";

      const m = toNumber(props.margin, 0);
      const p = toNumber(props.padding, 0);
      return wrap(
        <div
          className={`${scopeId} imported-block-preview ${((props.customClassName as string) || "").trim() || ""}`.trim() || undefined}
          style={{
            display: "block",
            minWidth: 1,
            minHeight: 1,
            maxWidth: "100%",
            position: normalizedPos,
            top: shouldClearOffsets ? undefined : ((props.position as string) !== "static" ? (props.top as string) : undefined),
            left: shouldClearOffsets ? undefined : ((props.position as string) !== "static" ? (props.left as string) : undefined),
            right: shouldClearOffsets ? undefined : ((props.position as string) !== "static" ? (props.right as string) : undefined),
            bottom: shouldClearOffsets ? undefined : ((props.position as string) !== "static" ? (props.bottom as string) : undefined),
            margin: toNumber(props.margin, 0),
            marginTop: toNumber(props.marginTop ?? m, 0),
            marginRight: toNumber(props.marginRight ?? m, 0),
            marginBottom: toNumber(props.marginBottom ?? m, 0),
            marginLeft: toNumber(props.marginLeft ?? m, 0),
            padding: toNumber(props.padding, 0),
            paddingTop: toNumber(props.paddingTop ?? p, 0),
            paddingRight: toNumber(props.paddingRight ?? p, 0),
            paddingBottom: toNumber(props.paddingBottom ?? p, 0),
            paddingLeft: toNumber(props.paddingLeft ?? p, 0),
            width: normalizeLayoutWidthForNarrow((props.width as string) || undefined, isNarrowPreview, builderParityMode) || (props.width as string) || undefined,
            height: (props.height as string) || undefined,
            opacity: toNumber(props.opacity, 1),
          }}
        >
          <style dangerouslySetInnerHTML={{ __html: responsiveScopedCss }} />
          {scopedCss && <style dangerouslySetInnerHTML={{ __html: scopedCss }} />}
          <div dangerouslySetInnerHTML={{ __html: blockHtml }} />
        </div>
      );
    }

    case "Circle":
    case "Square":
    case "Triangle":
    case "Diamond":
    case "Heart":
    case "Trapezoid":
    case "Pentagon":
    case "Hexagon":
    case "Heptagon":
    case "Octagon":
    case "Nonagon":
    case "Decagon":
    case "Parallelogram":
    case "Kite": {
      const m = toNumber(props.margin, 0);
      const mt = toNumber(props.marginTop ?? m, 0);
      const mr = toNumber(props.marginRight ?? m, 0);
      const mb = toNumber(props.marginBottom ?? m, 0);
      const ml = toNumber(props.marginLeft ?? m, 0);
      const p = toNumber(props.padding, 0);
      const pt = toNumber(props.paddingTop ?? p, 0);
      const pr = toNumber(props.paddingRight ?? p, 0);
      const pb = toNumber(props.paddingBottom ?? p, 0);
      const pl = toNumber(props.paddingLeft ?? p, 0);
      const fill = (props.background as string) || (props.color as string) || "#999999";
      const normalizedPos = normalizeResponsivePosition(((props.position as React.CSSProperties["position"]) || "relative"), isNarrowPreview, props, viewportWidth, builderParityMode);
      const originalPos = (props.position as string) || "relative";
      const shouldClearOffsets = !builderParityMode && isNarrowPreview && originalPos !== "relative" && normalizedPos === "relative";

      const rawW = (props.width as string) || "200px";
      const rawH = (props.height as string) || "200px";
      const resolvedW = isNarrowPreview ? (parseFloat(rawW) > viewportWidth * 0.8 ? "100%" : rawW) : rawW;
      const isCircleOrSquare = type === "Circle" || type === "Square";
      const resolvedH = isNarrowPreview
        ? (isCircleOrSquare && resolvedW === "100%" ? "auto" : (parseFloat(rawH) > 360 ? (isCircleOrSquare ? rawH : "300px") : rawH))
        : rawH;

      const bgImage = props.backgroundImage as string;
      const overlay = props.backgroundOverlay as string;
      const bw = toNumber(props.borderWidth, 0);
      const triangleStroke = `${bw}px ${props.borderStyle as string} ${props.borderColor as string}`;
      const shapeStrokePlacement = (props.strokePlacement as "mid" | "inside" | "outside") ?? "mid";
      const useOutline = shapeStrokePlacement === "outside" && bw > 0 && type !== "Triangle";
      const uniformShapeRadius = toNumber(props.borderRadius, 0);
      const shapeTopLeftRadius = toNumber(props.radiusTopLeft ?? uniformShapeRadius, uniformShapeRadius);
      const shapeTopRightRadius = toNumber(props.radiusTopRight ?? uniformShapeRadius, uniformShapeRadius);
      const shapeBottomRightRadius = toNumber(props.radiusBottomRight ?? uniformShapeRadius, uniformShapeRadius);
      const shapeBottomLeftRadius = toNumber(props.radiusBottomLeft ?? uniformShapeRadius, uniformShapeRadius);

      return wrap(
        <div
          style={{
            width: resolvedW,
            height: resolvedH,
            aspectRatio: (isNarrowPreview && isCircleOrSquare && resolvedW === "100%") ? "1 / 1" : undefined,
            minWidth: resolvedW === "100%" ? undefined : resolvedW,
            minHeight: resolvedH === "auto" ? undefined : resolvedH,
            position: normalizedPos,
            display: props.display as React.CSSProperties["display"],
            zIndex: toNumber(props.zIndex, 0) || undefined,
            top: shouldClearOffsets ? undefined : ((props.position as string) !== "static" ? (props.top as string) : undefined),
            left: shouldClearOffsets ? undefined : ((props.position as string) !== "static" ? (props.left as string) : undefined),
            right: shouldClearOffsets ? undefined : ((props.position as string) !== "static" ? (props.right as string) : undefined),
            bottom: shouldClearOffsets ? undefined : ((props.position as string) !== "static" ? (props.bottom as string) : undefined),
            transform: (() => {
              const r = toNumber(props.rotation, 0);
              const fh = props.flipHorizontal === true;
              const fv = props.flipVertical === true;
              const parts = [r ? `rotate(${r}deg)` : null, fh ? "scaleX(-1)" : null, fv ? "scaleY(-1)" : null].filter(Boolean);
              return parts.length ? parts.join(" ") : undefined;
            })(),
            transformOrigin: "center center",
            backgroundColor: "transparent",
            backgroundImage: "none",
            backgroundSize: undefined,
            backgroundPosition: undefined,
            backgroundRepeat: undefined,
            borderRadius:
              type === "Circle"
                ? "50%"
                : type === "Square"
                  ? `${shapeTopLeftRadius}px ${shapeTopRightRadius}px ${shapeBottomRightRadius}px ${shapeBottomLeftRadius}px`
                  : undefined,
            clipPath: undefined,
            WebkitClipPath: undefined,
            ...(bw > 0
              ? useOutline
                ? { border: "none", outline: triangleStroke, outlineOffset: 0 }
                : { border: type === "Circle" || type === "Square" ? triangleStroke : "none" }
              : {}),
            alignItems: "center",
            justifyContent: "center",
            margin: `${mt}px ${mr}px ${mb}px ${ml}px`,
            padding: `${pt}px ${pr}px ${pb}px ${pl}px`,
            boxShadow: props.boxShadow as string,
            opacity: toNumber(props.opacity, 1),
            overflow: "visible",
            cursor: interactiveClick ? "pointer" : (props.cursor as string),
          }}
          onClick={interactiveClick}
        >
          {type !== "Circle" && type !== "Square" ? (
            <svg
              width="100%"
              height="100%"
              viewBox="0 0 100 100"
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                pointerEvents: "none",
                display: "block",
              }}
              preserveAspectRatio="none"
            >
              {type === "Heart" ? (
                <path
                  d="M 50 90 C 20 70 5 55 5 35 C 5 20 20 10 32 10 C 40 10 47 15 50 22 C 53 15 60 10 68 10 C 80 10 95 20 95 35 C 95 55 80 70 50 90 Z"
                  fill={fill}
                  stroke={props.borderColor as string}
                  strokeWidth={toNumber(props.borderWidth, 0) > 0 ? toNumber(props.borderWidth, 0) : undefined}
                />
              ) : (
                <polygon
                  points={(() => {
                    if (type === "Triangle") return "0,100 50,0 100,100";
                    if (type === "Diamond") return "50,0 100,50 50,100 0,50";
                    if (type === "Trapezoid") return "20,0 80,0 100,100 0,100";
                    if (type === "Pentagon") return "50,0 100,38 82,100 18,100 0,38";
                    if (type === "Hexagon") return "25,0 75,0 100,50 75,100 25,100 0,50";
                    if (type === "Heptagon") return "50,0 90,20 100,60 75,100 25,100 0,60 10,20";
                    if (type === "Octagon") return "30,0 70,0 100,30 100,70 70,100 30,100 0,70 0,30";
                    if (type === "Nonagon") return "50,0 83,12 100,43 94,78 68,100 32,100 6,78 0,43 17,12";
                    if (type === "Decagon") return "50,0 80,10 100,35 100,65 80,90 50,100 20,90 0,65 0,35 20,10";
                    if (type === "Parallelogram") return "25,0 100,0 75,100 0,100";
                    if (type === "Kite") return "50,0 100,45 50,100 0,45";
                    return "";
                  })()}
                  fill={fill}
                  stroke={props.borderColor as string}
                  strokeWidth={toNumber(props.borderWidth, 0) > 0 ? toNumber(props.borderWidth, 0) * 2 : undefined}
                  strokeDasharray={
                    props.borderStyle === "dashed"
                      ? "6,6"
                      : props.borderStyle === "dotted"
                        ? "3,3"
                        : undefined
                  }
                />
              )}
            </svg>
          ) : null}
          {children}
        </div>
      );
    }

    case "Tabs": {
      const tabs = Array.isArray(props.tabs) ? (props.tabs as Array<{ id?: string; content?: unknown }>) : [];
      const linkedSlotMap: Record<string, string> = {};
      const tabContentChildIds = childIds.filter((id) => {
        const child = nodes[id];
        const childType = String(child?.type || "").toLowerCase();
        return childType === "tabcontent" || childType === "tab-content" || childType === "tab content";
      });

      for (let index = 0; index < tabs.length; index += 1) {
        const tab = tabs[index];
        const tabId = typeof tab?.id === "string" ? tab.id.trim() : "";
        if (!tabId) continue;

        const fallbackId = `tab-content-${tabId}`;
        const candidateId =
          typeof tab?.content === "string" && tab.content.trim() ? tab.content.trim() : fallbackId;
        const resolvedId =
          (nodes[candidateId] ? candidateId : undefined) ||
          (nodes[fallbackId] ? fallbackId : undefined) ||
          (tabContentChildIds[index] && nodes[tabContentChildIds[index]] ? tabContentChildIds[index] : undefined);

        if (resolvedId) {
          linkedSlotMap[`tab-content-${tabId}`] = resolvedId;
        }
      }

      const previewTabsProps = {
        ...props,
        __linkedNodes: linkedSlotMap,
        nodes,
        pages,
        pageIndex,
        viewportWidth,
        interactionState,
        availableTriggerTargets,
        onToggle,
        storeContext,
        onPrototypeAction,
        mobileBreakpoint,
        enableFormInputs,
        builderParityMode,
        renderAllNodes,
        preserveAuthoredPositioning,
        layoutReferenceWidth,
        layoutReferenceHeight,
      };

      return wrap(
        <PreviewTabs
          props={previewTabsProps}
          childNodes={children}
          childNodeIds={tabContentChildIds.length > 0 ? tabContentChildIds : childIds}
          childNodeMap={childNodeMap}
        />
      );
    }

    case "ProfileLogin":
      return wrapWithAnimation(
        <ProfileLoginBlock
          text={typeof props.text === "string" ? props.text : undefined}
          fontSize={typeof props.fontSize === "number" ? props.fontSize : undefined}
          fontFamily={typeof props.fontFamily === "string" ? props.fontFamily : undefined}
          fontWeight={typeof props.fontWeight === "string" ? props.fontWeight : undefined}
          fontStyle={props.fontStyle as "normal" | "italic" | undefined}
          lineHeight={props.lineHeight as number | string | undefined}
          letterSpacing={props.letterSpacing as number | string | undefined}
          color={typeof props.color === "string" ? props.color : undefined}
          iconColor={typeof props.iconColor === "string" ? props.iconColor : undefined}
          arrowSize={typeof props.arrowSize === "number" ? props.arrowSize : undefined}
          avatarSrc={typeof props.avatarSrc === "string" ? props.avatarSrc : undefined}
          avatarSize={typeof props.avatarSize === "number" ? props.avatarSize : undefined}
          width={typeof props.width === "number" || typeof props.width === "string" ? props.width : undefined}
          height={typeof props.height === "number" || typeof props.height === "string" ? props.height : undefined}
          display={props.display as "inline-flex" | "flex" | "block" | undefined}
          alignItems={props.alignItems as "flex-start" | "center" | "flex-end" | "stretch" | undefined}
          justifyContent={props.justifyContent as "flex-start" | "center" | "flex-end" | "space-between" | "space-around" | undefined}
          gap={typeof props.gap === "number" ? props.gap : undefined}
          paddingTop={typeof props.paddingTop === "number" ? props.paddingTop : undefined}
          paddingRight={typeof props.paddingRight === "number" ? props.paddingRight : undefined}
          paddingBottom={typeof props.paddingBottom === "number" ? props.paddingBottom : undefined}
          paddingLeft={typeof props.paddingLeft === "number" ? props.paddingLeft : undefined}
          marginTop={typeof props.marginTop === "number" ? props.marginTop : undefined}
          marginRight={typeof props.marginRight === "number" ? props.marginRight : undefined}
          marginBottom={typeof props.marginBottom === "number" ? props.marginBottom : undefined}
          marginLeft={typeof props.marginLeft === "number" ? props.marginLeft : undefined}
          background={typeof props.background === "string" ? props.background : undefined}
          borderRadius={typeof props.borderRadius === "number" ? props.borderRadius : undefined}
          borderColor={typeof props.borderColor === "string" ? props.borderColor : undefined}
          borderWidth={typeof props.borderWidth === "number" ? props.borderWidth : undefined}
          borderStyle={typeof props.borderStyle === "string" ? props.borderStyle : undefined}
          boxShadow={typeof props.boxShadow === "string" ? props.boxShadow : undefined}
          opacity={typeof props.opacity === "number" ? props.opacity : undefined}
          overflow={typeof props.overflow === "string" ? props.overflow : undefined}
          position={props.position as "static" | "relative" | "absolute" | "fixed" | "sticky" | undefined}
          top={typeof props.top === "string" ? props.top : undefined}
          right={typeof props.right === "string" ? props.right : undefined}
          bottom={typeof props.bottom === "string" ? props.bottom : undefined}
          left={typeof props.left === "string" ? props.left : undefined}
          zIndex={typeof props.zIndex === "number" ? props.zIndex : undefined}
          rotation={typeof props.rotation === "number" ? props.rotation : undefined}
          customClassName={typeof props.customClassName === "string" ? props.customClassName : undefined}
          interactive
          nodeId={nodeId}
        />,
        animation,
      );

    default:
      return <div data-unknown-type={type}>{children}</div>;
  }
}

function getPageSlug(page: { slug?: string } | null | undefined, index: number): string {
  return page?.slug ?? `page-${index}`;
}

type PreviewPageMeta = {
  id: string;
  name: string;
  slug: string;
};

function normalizeNavToken(value: string): string {
  return value.trim().replace(/^\/+/, "").toLowerCase();
}

function resolveInternalPageId(destination: string | undefined, pages: PreviewPageMeta[]): string | null {
  if (!destination) return null;

  const raw = destination.trim();
  if (!raw) return null;

  const normalized = normalizeNavToken(raw);

  // Match by page ID first (most stable)
  const byId = pages.find((p) => normalizeNavToken(p.id) === normalized);
  if (byId) return byId.id;

  // Match by exact slug
  const bySlug = pages.find((p) => normalizeNavToken(p.slug) === normalized);
  if (bySlug) return bySlug.id;

  // Match by page name
  const byName = pages.find((p) => normalizeNavToken(p.name) === normalized);
  if (byName) return byName.id;

  // Partial matches and page index patterns
  const pageIndexMatch = raw.match(/^page-(\d+)$/i);
  if (pageIndexMatch) {
    const idx = parseInt(pageIndexMatch[1], 10);
    if (idx >= 0 && idx < pages.length) return pages[idx].id;
    if (idx - 1 >= 0 && idx - 1 < pages.length) return pages[idx - 1].id;
  }

  const fuzzy = pages.find((p) =>
    normalizeNavToken(p.slug).includes(normalized) ||
    normalized.includes(normalizeNavToken(p.slug))
  );
  if (fuzzy) return fuzzy.id;

  return null;
}

const PAGE_TRANSITION_STYLES: Record<TransitionType, React.CSSProperties> = {
  instant: {},
  dissolve: { animation: "page-dissolve 0.3s ease forwards" },
  slideLeft: { animation: "page-slide-left 0.3s ease forwards" },
  slideRight: { animation: "page-slide-right 0.3s ease forwards" },
  slideUp: { animation: "page-slide-up 0.3s ease forwards" },
  slideDown: { animation: "page-slide-down 0.3s ease forwards" },
  push: { animation: "page-push 0.3s ease forwards" },
  moveIn: { animation: "page-move-in 0.3s ease forwards" },
};

export function WebPreview({
  doc,
  pageIndex = 0,
  initialPageSlug,
  storeContext,
  onNavigate,
  simulatedWidth,
  responsiveViewportWidth,
  mobileBreakpoint,
  enableFormInputs = false,
  builderParityMode = false,
  fillViewport = false,
  renderAllNodes = false,
}: {
  doc: BuilderDocument;
  pageIndex?: number;
  initialPageSlug?: string;
  storeContext?: StoreContext | null;
  onNavigate?: (pageSlug: string) => void;
  simulatedWidth?: number;
  responsiveViewportWidth?: number;
  mobileBreakpoint?: number;
  enableFormInputs?: boolean;
  builderParityMode?: boolean;
  fillViewport?: boolean;
  renderAllNodes?: boolean;
}): React.ReactElement {
  const safePages = React.useMemo(
    () => (Array.isArray(doc?.pages)
      ? doc.pages.filter((page): page is BuilderDocument["pages"][number] => Boolean(page))
      : []),
    [doc]
  );
  const safeNodes = React.useMemo(
    () => (doc?.nodes && typeof doc.nodes === "object"
      ? (doc.nodes as Record<string, CleanNode>)
      : {}),
    [doc]
  );

  const initialPage = (initialPageSlug ? safePages.find((p, index) => getPageSlug(p, index) === initialPageSlug) : null) ?? safePages[pageIndex] ?? safePages[0];
  const [currentPageId, setCurrentPageId] = React.useState<string>(initialPage?.id || "");
  const [history, setHistory] = React.useState<string[]>([]);
  const [transitionStyle, setTransitionStyle] = React.useState<React.CSSProperties>({});

  const currentPage = safePages.find((p) => p.id === currentPageId) ?? safePages[0];
  const currentPageIndex = safePages.findIndex((p) => p.id === currentPageId);
  const pageMeta = React.useMemo<PreviewPageMeta[]>(
    () => safePages.map((p, i) => ({
      id: p.id,
      name: p.name || (p.props?.pageName as string) || `Page ${i + 1}`,
      slug: getPageSlug(p, i),
    })),
    [safePages]
  );

  const onPrototypeAction = React.useCallback(
    (interaction: Interaction) => {
      const duration = (interaction.duration ?? 300) / 1000;
      if (interaction.action === "navigateTo" && interaction.destination) {
        const destId = resolveInternalPageId(interaction.destination, pageMeta);
        if (destId) {
          setHistory((h) => [...h, currentPageId]);
          const trans = interaction.transition ?? "dissolve";
          setTransitionStyle({
            ...PAGE_TRANSITION_STYLES[trans],
            animationDuration: `${duration}s`,
          });
          setCurrentPageId(destId);
          const destPage = safePages.find((p) => p.id === destId);
          if (destPage) onNavigate?.(getPageSlug(destPage, safePages.indexOf(destPage)));
        } else if (interaction.destination.startsWith("#")) {
          document.getElementById(interaction.destination.slice(1))?.scrollIntoView({ behavior: "smooth" });
        } else if (
          interaction.destination.startsWith("http://") ||
          interaction.destination.startsWith("https://") ||
          interaction.destination.startsWith("mailto:")
        ) {
          window.open(interaction.destination, "_blank", "noopener");
        }
      } else if (interaction.action === "back") {
        if (history.length > 0) {
          const prevId = history[history.length - 1];
          setHistory((h) => h.slice(0, -1));
          setTransitionStyle(PAGE_TRANSITION_STYLES.dissolve);
          setCurrentPageId(prevId);
          const prevPage = safePages.find((p) => p.id === prevId);
          if (prevPage) onNavigate?.(getPageSlug(prevPage, safePages.indexOf(prevPage)));
        }
      } else if (interaction.action === "openUrl" && interaction.destination) {
        window.open(interaction.destination, "_blank", "noopener");
      } else if (interaction.action === "scrollTo" && interaction.destination) {
        document.getElementById(interaction.destination)?.scrollIntoView({ behavior: "smooth" });
      }
    },
    [currentPageId, history, pageMeta, onNavigate, safePages]
  );

  const pageProps = mergeProps("Page", currentPage?.props ?? {}) as Record<string, unknown>;
  const width = (pageProps.width as string) || "1920px";
  const pageWidthPx = parsePixelValue(width) ?? 1920;
  const background = (pageProps.background as string) || "#ffffff";
  const minHeight = (pageProps.height as string) === "auto" ? "800px" : (pageProps.height as string);
  const pageRotation = toNumber(pageProps.pageRotation, 0);

  const { ref, width: measuredWidth } = useContainerWidth(1200);
  const viewportWidth = simulatedWidth ?? responsiveViewportWidth ?? measuredWidth;
  const effectiveMobileBreakpoint = mobileBreakpoint ?? PREVIEW_TABLET_BREAKPOINT;
  const isPhoneSize = measuredWidth > 0 && measuredWidth <= effectiveMobileBreakpoint;
  const shouldUseResponsiveViewport = !fillViewport && viewportWidth > 0 && viewportWidth < pageWidthPx;
  const isScaling = !isPhoneSize && !fillViewport && !shouldUseResponsiveViewport && measuredWidth < pageWidthPx && measuredWidth > 0;
  const scale = isScaling ? measuredWidth / pageWidthPx : 1;
  const shouldStretchDesktopPage = !isPhoneSize && !fillViewport && !isScaling;

  const mobileWrapperRef = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    if (isPhoneSize && mobileWrapperRef.current) {
      mobileWrapperRef.current.removeAttribute("data-nav-preview-done");
      const t = setTimeout(() => {
        if (mobileWrapperRef.current) enhanceNavInPreview(mobileWrapperRef.current);
      }, 200);
      return () => clearTimeout(t);
    }
  }, [isPhoneSize, currentPageId]);
  const [interactionState, setInteractionState] = React.useState<Record<string, boolean>>({});
  const availableTriggerTargets = React.useMemo(() => {
    const targets = new Set<string>();
    for (const node of Object.values(safeNodes)) {
      const target = node?.props?.toggleTarget;
      if (typeof target === "string" && target.trim()) targets.add(target.trim());
    }
    return targets;
  }, [safeNodes]);

  const handleToggle = React.useCallback((target: string, action: "toggle" | "open" | "close") => {
    setInteractionState((prev) => {
      const current = prev[target] ?? false;
      const next = action === "open" ? true : action === "close" ? false : !current;
      return { ...prev, [target]: next };
    });
  }, []);

  if (!currentPage) {
    const hasPages = safePages.length > 0;
    return (
      <div style={{ padding: 24, color: "#666", textAlign: "center", maxWidth: 360 }}>
        {hasPages ? "No page to display." : "No pages yet. Add a page in the editor, then open Preview again (Play button)."}
      </div>
    );
  }

  const pageContent = (
    <>
      {(Array.isArray(currentPage.children) ? currentPage.children : []).map((id) => {
        const node = safeNodes[id];
        if (!node) return null;
        const childType = String(node.type || "").toLowerCase();
        if (childType === "page") return null;
        return (
          <RenderNode
            key={id}
            node={node}
            nodes={safeNodes}
            pages={pageMeta}
            pageIndex={currentPageIndex >= 0 ? currentPageIndex : 0}
            viewportWidth={isPhoneSize || shouldUseResponsiveViewport ? viewportWidth : pageWidthPx}
            interactionState={interactionState}
            availableTriggerTargets={availableTriggerTargets}
            onToggle={handleToggle}
            storeContext={storeContext}
            nodeId={id}
            onPrototypeAction={onPrototypeAction}
            mobileBreakpoint={mobileBreakpoint}
            enableFormInputs={enableFormInputs}
            builderParityMode={builderParityMode}
            renderAllNodes={renderAllNodes}
          />
        );
      })}
    </>
  );

      const isContainedScroller = fillViewport || isPhoneSize || shouldUseResponsiveViewport;

      return (
    <>
      <style>{`
        @keyframes page-dissolve { from { opacity: 0; } to { opacity: 1; } }
        @keyframes page-slide-left { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        @keyframes page-slide-right { from { transform: translateX(-100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        @keyframes page-slide-up { from { transform: translateY(100%); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        @keyframes page-slide-down { from { transform: translateY(-100%); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        @keyframes page-push { from { opacity: 0; transform: scale(0.98); } to { opacity: 1; transform: scale(1); } }
        @keyframes page-move-in { from { opacity: 0; } to { opacity: 1; } }
      `}</style>
      {isPhoneSize && frameResponsiveStyles}
      {/* Outer wrapper: NO key here so ResizeObserver stays alive across page changes */}
      <div
        ref={ref}
        data-preview-scroll-root={isContainedScroller ? "true" : undefined}
        style={{
          width: "100%",
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: shouldStretchDesktopPage ? "stretch" : "center",
          overflowX: "hidden",
          overflowY: isContainedScroller ? "auto" : "visible",
          backgroundColor: background,
        }}
      >
        {/* Inner wrapper: key={currentPageId} so page content re-mounts on navigation */}
        <div
          key={currentPageId}
          style={{
            width: shouldStretchDesktopPage ? "100%" : (isScaling ? pageWidthPx : ((isPhoneSize || fillViewport || shouldUseResponsiveViewport) ? "100%" : width)),
            maxWidth: shouldStretchDesktopPage ? "100%" : ((isPhoneSize || fillViewport || shouldUseResponsiveViewport) ? "100%" : width),
            height: isScaling ? (parsePixelValue(minHeight) ?? 0) * scale : (isPhoneSize ? "auto" : minHeight),
            minHeight: isScaling ? (parsePixelValue(minHeight) ?? 0) * scale : (isPhoneSize ? "100vh" : minHeight),
            backgroundColor: "transparent",
            margin: shouldStretchDesktopPage ? "0" : "0 auto",
            transform: isScaling ? `scale(${scale})${pageRotation !== 0 ? ` rotate(${pageRotation}deg)` : ""}` : (pageRotation !== 0 ? `rotate(${pageRotation}deg)` : ""),
            transformOrigin: shouldStretchDesktopPage ? "top left" : "top center",
            position: "relative",
            isolation: "isolate",
            overflow: isScaling ? "visible" : "hidden",
            transition: "transform 0.2s ease, width 0.3s ease",
            ...transitionStyle,
          }}
        >
          {isPhoneSize ? (
            <div
              ref={mobileWrapperRef}
              className={isPhoneSize
                ? "frame-responsive-inner frame-fluid frame-mobile is-mobile-view"
                : (fillViewport ? "frame-responsive-inner frame-fluid" : "frame-responsive-inner")}
              style={{
                width: isScaling ? pageWidthPx : "100%",
                minHeight: "100vh",
                boxSizing: "border-box",
                containerType: "inline-size",
              }}
            >
              {pageContent}
            </div>
          ) : (
            pageContent
          )}
        </div>
      </div>
    </>
  );
}

export function LiveSite({
  doc,
  pageIndex = 0,
  storeContext,
  initialPageSlug,
  mobileBreakpoint = PREVIEW_TABLET_BREAKPOINT,
  enableFormInputs = false,
  fillViewport = false,
}: {
  doc: BuilderDocument;
  pageIndex?: number;
  storeContext?: StoreContext | null;
  initialPageSlug?: string;
  mobileBreakpoint?: number;
  enableFormInputs?: boolean;
  fillViewport?: boolean;
}): React.ReactElement {
  const safePages = React.useMemo(
    () => (Array.isArray(doc?.pages) ? doc.pages.filter((page): page is BuilderDocument["pages"][number] => Boolean(page)) : []),
    [doc]
  );
  const safeNodes = React.useMemo(
    () => (doc?.nodes && typeof doc.nodes === "object" ? (doc.nodes as Record<string, CleanNode>) : {}),
    [doc]
  );

  const initialPage = (initialPageSlug ? safePages.find((p, index) => getPageSlug(p, index) === initialPageSlug) : null) ?? safePages[pageIndex] ?? safePages[0];
  const [currentPageId, setCurrentPageId] = React.useState<string>(initialPage?.id || "");
  const [history, setHistory] = React.useState<string[]>([]);
  const [transitionStyle, setTransitionStyle] = React.useState<React.CSSProperties>({});

  const currentPage = safePages.find((p) => p.id === currentPageId) ?? safePages[0];
  const currentPageIndex = safePages.findIndex((p) => p.id === currentPageId);
  const pageMeta = React.useMemo<PreviewPageMeta[]>(
    () => safePages.map((p, i) => ({
      id: p.id,
      name: p.name || (p.props?.pageName as string) || `Page ${i + 1}`,
      slug: getPageSlug(p, i),
    })),
    [safePages]
  );

  const pageProps = mergeProps("Page", currentPage?.props ?? {}) as Record<string, unknown>;
  const width = (pageProps.width as string) || "1920px";
  const background = (pageProps.background as string) || "#ffffff";
  const minHeight = (pageProps.height as string) === "auto" ? "800px" : (pageProps.height as string);
  const pageRotation = toNumber(pageProps.pageRotation, 0);
  const pageWidthPx = parsePixelValue(width) ?? 1920;

  const { ref, width: measuredWidth } = useContainerWidth(1200);
  const effectiveMobileBreakpoint = mobileBreakpoint ?? PREVIEW_TABLET_BREAKPOINT;
  const isPhoneSize = measuredWidth > 0 && measuredWidth <= effectiveMobileBreakpoint;
  const viewportWidth = measuredWidth;
  const shouldUseResponsiveViewport = !fillViewport && viewportWidth > 0 && viewportWidth < pageWidthPx;
  const isScaling = !isPhoneSize && !fillViewport && !shouldUseResponsiveViewport && measuredWidth < pageWidthPx && measuredWidth > 0;
  const scale = isScaling ? measuredWidth / pageWidthPx : 1;
  const shouldStretchDesktopPage = !isPhoneSize && !fillViewport && !isScaling;

  const layoutReferenceWidth = pageWidthPx;
  const layoutReferenceHeight = parsePixelValue(pageProps.height) ?? pageWidthPx;

  const liveSiteWrapperRef = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    if (isPhoneSize && liveSiteWrapperRef.current) {
      liveSiteWrapperRef.current.removeAttribute("data-nav-preview-done");
      const t = setTimeout(() => {
        if (liveSiteWrapperRef.current) enhanceNavInPreview(liveSiteWrapperRef.current);
      }, 200);
      return () => clearTimeout(t);
    }
  }, [isPhoneSize, currentPageId]);

  React.useEffect(() => {
    if (typeof document !== "undefined") {
      const oldBg = document.body.style.backgroundColor;
      document.body.style.backgroundColor = background;
      return () => { document.body.style.backgroundColor = oldBg; };
    }
  }, [background]);

  const [interactionState, setInteractionState] = React.useState<Record<string, boolean>>({});
  const availableTriggerTargets = React.useMemo(() => {
    const targets = new Set<string>();
    for (const node of Object.values(safeNodes)) {
      const target = node?.props?.toggleTarget;
      if (typeof target === "string" && target.trim()) targets.add(target.trim());
    }
    return targets;
  }, [safeNodes]);

  const handleToggle = React.useCallback((target: string, action: "toggle" | "open" | "close") => {
    setInteractionState((prev) => {
      const current = prev[target] ?? false;
      const next = action === "open" ? true : action === "close" ? false : !current;
      return { ...prev, [target]: next };
    });
  }, []);

  const onPrototypeAction = React.useCallback((interaction: Interaction) => {
    if (interaction.action === "openUrl" && interaction.destination) {
      window.open(interaction.destination, "_blank", "noopener");
    } else if (interaction.action === "scrollTo" && interaction.destination) {
      document.getElementById(interaction.destination)?.scrollIntoView({ behavior: "smooth" });
    } else if (interaction.action === "navigateTo" && interaction.destination) {
      const destId = resolveInternalPageId(interaction.destination, pageMeta);
      if (destId) {
        setHistory((h) => [...h, currentPageId]);
        const duration = (interaction.duration ?? 300) / 1000;
        const trans = (interaction.transition as keyof typeof PAGE_TRANSITION_STYLES) ?? "dissolve";
        setTransitionStyle({ ...PAGE_TRANSITION_STYLES[trans], animationDuration: `${duration}s` });
        setCurrentPageId(destId);
      } else {
        const el = document.getElementById(interaction.destination.startsWith("#") ? interaction.destination.slice(1) : interaction.destination);
        if (el) el.scrollIntoView({ behavior: "smooth" });
        else if (interaction.destination.match(/^(https?:\/\/|mailto:|\/)/)) window.location.href = interaction.destination;
      }
    } else if (interaction.action === "back") {
      if (history.length > 0) {
        const prevId = history[history.length - 1];
        setHistory((h) => h.slice(0, -1));
        setTransitionStyle(PAGE_TRANSITION_STYLES.dissolve);
        setCurrentPageId(prevId);
      } else window.history.back();
    }
  }, [currentPageId, history, pageMeta]);

  if (!currentPage) {
    const hasPages = safePages.length > 0;
    return (
      <div style={{ padding: 24, color: "#666", textAlign: "center", maxWidth: 360 }}>
        {hasPages ? "No page to display." : "No pages yet. Add a page in the editor, then open Preview again (Play button)."}
      </div>
    );
  }

  const pageChildren = (
    <>
      {(Array.isArray(currentPage.children) ? currentPage.children : []).map((id) => {
        const node = safeNodes[id];
        if (!node) return null;
        const childType = String(node.type || "").toLowerCase();
        if (childType === "page") return null;
        return (
          <RenderNode
            key={id}
            node={node}
            nodes={safeNodes}
            pages={pageMeta}
            pageIndex={currentPageIndex >= 0 ? currentPageIndex : 0}
            viewportWidth={isPhoneSize || shouldUseResponsiveViewport ? viewportWidth : pageWidthPx}
            interactionState={interactionState}
            availableTriggerTargets={availableTriggerTargets}
            onToggle={handleToggle}
            storeContext={storeContext}
            nodeId={id}
            onPrototypeAction={onPrototypeAction}
            mobileBreakpoint={mobileBreakpoint}
            enableFormInputs={enableFormInputs}
            builderParityMode={false}
            preserveAuthoredPositioning={false}
            layoutReferenceWidth={layoutReferenceWidth}
            layoutReferenceHeight={layoutReferenceHeight}
          />
        );
      })}
    </>
  );

  return (
    <>
      <style>{`
        @keyframes page-dissolve { from { opacity: 0; } to { opacity: 1; } }
        @keyframes page-slide-left { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        @keyframes page-slide-right { from { transform: translateX(-100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        @keyframes page-slide-up { from { transform: translateY(100%); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        @keyframes page-slide-down { from { transform: translateY(-100%); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        @keyframes page-push { from { opacity: 0; transform: scale(0.98); } to { opacity: 1; transform: scale(1); } }
        @keyframes page-move-in { from { opacity: 0; } to { opacity: 1; } }
      `}</style>
      {isPhoneSize && frameResponsiveStyles}
      {/* Outer wrapper: NO key here so ResizeObserver stays alive across page changes */}
      <div
        ref={ref}
        style={{
          width: "100%",
          minHeight: "100vh",
          backgroundColor: background,
          display: "flex",
          flexDirection: "column",
          alignItems: shouldStretchDesktopPage ? "stretch" : "center",
          overflowX: "hidden",
          ...transitionStyle,
        }}
      >
        {/* Inner wrapper: key={currentPageId} so page content re-mounts on navigation */}
        <div
          key={currentPageId}
          style={{
            width: shouldStretchDesktopPage ? "100%" : (isScaling ? pageWidthPx : ((isPhoneSize || fillViewport || shouldUseResponsiveViewport) ? "100%" : width)),
            maxWidth: shouldStretchDesktopPage ? "100%" : ((isPhoneSize || fillViewport || shouldUseResponsiveViewport) ? "100%" : width),
            height: isScaling ? (parsePixelValue(minHeight) ?? 0) * scale : (isPhoneSize ? "auto" : minHeight),
            minHeight: isScaling ? (parsePixelValue(minHeight) ?? 0) * scale : (isPhoneSize ? "auto" : minHeight),
            backgroundColor: "transparent",
            margin: shouldStretchDesktopPage ? "0" : "0 auto",
            transform: isScaling ? `scale(${scale})${pageRotation !== 0 ? ` rotate(${pageRotation}deg)` : ""}` : (pageRotation !== 0 ? `rotate(${pageRotation}deg)` : ""),
            transformOrigin: shouldStretchDesktopPage ? "top left" : "top center",
          }}
        >
          {isPhoneSize ? (
            <div style={{ width: "100%", boxSizing: "border-box", containerType: "inline-size" }}>
              <div ref={liveSiteWrapperRef} className="frame-responsive-inner frame-fluid frame-mobile is-mobile-view">
                {pageChildren}
              </div>
            </div>
          ) : (
            pageChildren
          )}
        </div>
      </div>
    </>
  );
}
