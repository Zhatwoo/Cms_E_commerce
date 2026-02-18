"use client";

import React, { useState, useCallback } from "react";
import type { BuilderDocument, CleanNode, ComponentType } from "../_types/schema";
import type { AnimationConfig } from "../_types/animation";
import type { Interaction, PrototypeConfig, TransitionType } from "../_types/prototype";
import { AnimationWrapper, hasActiveAnimation } from "./animationEngine";
import { Icon as DesignIcon } from "../_designComponents/Icon/Icon";

/** When provided, the storefront can show real products and handle Add to Cart in place of static product cards. */
export type StoreContext = {
  products: Array<{ id: string; name: string; price: number; description?: string; images?: string[] }>;
  addToCart: (product: { id: string; name: string; price: number; image?: string }) => void;
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

/** Default links for common nav/CTA labels so the storefront viewport is functional without editing each button. */
function getDefaultLinkForLabel(label: string): string {
  const t = label.trim().toLowerCase();
  if (t === "home") return "#";
  if (t === "about") return "#about";
  if (t === "products") return "#products";
  if (t === "contact") return "#contact";
  if (t === "services") return "#services";
  if (t === "start building") return "/signup";
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

function shouldRenderNodeAtWidth(props: Record<string, unknown>, viewportWidth: number): boolean {
  const breakpoint = toNumber(props.mobileBreakpoint, 900);
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

  const breakpoint = toNumber(props.mobileBreakpoint, 900);
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
      setWidth(el.clientWidth || defaultWidth);
    };

    updateWidth();

    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", updateWidth);
      return () => window.removeEventListener("resize", updateWidth);
    }

    const observer = new ResizeObserver(updateWidth);
    observer.observe(el);
    return () => observer.disconnect();
  }, [defaultWidth]);

  return { ref, width };
}

// Default props per type (merge with node.props for full props). Minimal set for rendering.
const DEFAULTS: Record<string, Record<string, unknown>> = {
  Page: { width: "1000px", height: "auto", background: "#ffffff", pageName: "Page Name", pageSlug: "page" },
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
    fontFamily: "Inter",
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
    height: "auto",
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
    fontFamily: "Inter",
    borderRadius: 8,
    width: "auto",
    height: "auto",
    paddingTop: 10,
    paddingBottom: 10,
    paddingLeft: 24,
    paddingRight: 24,
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
    alignItems: "center",
    justifyContent: "flex-start",
    gap: 0,
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
};

function mergeProps(type: string, props: Record<string, unknown>): Record<string, unknown> {
  return { ...(DEFAULTS[type] ?? {}), ...props };
}

function px(v: unknown): string {
  if (typeof v === "number") return `${v}px`;
  if (typeof v === "string") return v;
  return "0";
}

function resolvePageFrameStyles(pageWidth: string): Pick<React.CSSProperties, "width" | "maxWidth"> {
  const normalized = (pageWidth || "1000px").trim();
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
};

function wrapWithAnimation(
  element: React.ReactElement,
  animation: AnimationConfig | undefined
): React.ReactElement {
  if (!hasActiveAnimation(animation)) return element;
  return <AnimationWrapper animation={animation}>{element}</AnimationWrapper>;
}

function wrapWithPrototype(
  element: React.ReactElement,
  prototype: PrototypeConfig | undefined,
  onPrototypeAction: ((interaction: Interaction) => void) | undefined
): React.ReactElement {
  if (!onPrototypeAction || !prototype?.interactions?.length) return element;
  const interactions = prototype.interactions;

  const run = (trigger: Interaction["trigger"]) => {
    const i = interactions.find((x) => x.trigger === trigger);
    if (i) onPrototypeAction(i);
  };

  const handlers: Record<string, () => void> = {};
  if (interactions.some((x) => x.trigger === "click")) handlers.onClick = () => run("click");
  if (interactions.some((x) => x.trigger === "doubleClick")) handlers.onDoubleClick = () => run("doubleClick");
  if (interactions.some((x) => x.trigger === "hover")) handlers.onMouseEnter = () => run("hover");
  if (interactions.some((x) => x.trigger === "mouseLeave")) handlers.onMouseLeave = () => run("mouseLeave");

  return (
    <div style={{ display: "contents" }} {...handlers}>
      {element}
    </div>
  );
}

function RenderNode({
  node,
  nodes,
  pageIndex,
  viewportWidth,
  interactionState,
  availableTriggerTargets,
  onToggle,
  storeContext,
  nodeId,
  onPrototypeAction,
}: {
  node: CleanNode;
  nodes: Record<string, CleanNode>;
  pageIndex: number;
  viewportWidth: number;
  interactionState: Record<string, boolean>;
  availableTriggerTargets: Set<string>;
  onToggle: (target: string, action: "toggle" | "open" | "close") => void;
  storeContext?: StoreContext | null;
  nodeId?: string;
  onPrototypeAction?: (interaction: Interaction) => void;
}): React.ReactElement {
  const type = node.type as ComponentType;
  const props = mergeProps(type, node.props) as Record<string, unknown>;
  if (!shouldRenderNodeAtWidth(props, viewportWidth)) {
    return <></>;
  }
  if (!isCollapsibleOpen(props, viewportWidth, interactionState, availableTriggerTargets)) {
    return <></>;
  }
  const toggleTarget = getToggleTarget(props);
  const triggerAction = getTriggerAction(props);
  const interactiveClick = toggleTarget ? () => onToggle(toggleTarget, triggerAction) : undefined;
  const animation = props.animation as AnimationConfig | undefined;
  const prototype = props.prototype as PrototypeConfig | undefined;
  const childIds = node.children ?? [];
  const children = childIds.map((id) => {
    const n = nodes[id];
    if (!n) return null;
    return (
      <RenderNode
        key={id}
        node={n}
        nodes={nodes}
        pageIndex={pageIndex}
        storeContext={storeContext}
        nodeId={id}
        onPrototypeAction={onPrototypeAction}
      />
    );
  });

  const wrap = (el: React.ReactElement) =>
    wrapWithPrototype(wrapWithAnimation(el, animation), prototype, onPrototypeAction);

  switch (type) {
    case "Container": {
      const hasRenderableChildren = childIds.some((id) => Boolean(nodes[id]));
      const isProductSlot =
        storeContext &&
        storeContext.products.length > 0 &&
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
        return (
          <div
            id="products"
            style={{
              backgroundColor: props.background as string,
              padding: `${pt}px ${pr}px ${pb}px ${pl}px`,
              margin: `${mt}px ${mr}px ${mb}px ${ml}px`,
              width: props.width as string,
              display: "flex",
              flexWrap: "wrap",
              gap: 20,
              justifyContent: "flex-start",
              alignItems: "flex-start",
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
                    maxWidth: 300,
                    borderRadius: 8,
                    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                    display: "flex",
                    flexDirection: "column",
                    gap: 8,
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
                    ${price.toFixed(2)}
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
      const bgImage = props.backgroundImage as string;
      const overlay = props.backgroundOverlay as string;
      const rawHeight = (props.height as string) ?? "auto";
      const showEmptyMinHeight = !hasRenderableChildren;
      const effectiveDisplay = (props.display as React.CSSProperties["display"]) ?? "flex";
      return wrap(
        <div
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
            padding: `${pt}px ${pr}px ${pb}px ${pl}px`,
            margin: `${mt}px ${mr}px ${mb}px ${ml}px`,
            width: props.width as string,
            height: rawHeight,
            minHeight: showEmptyMinHeight ? "50px" : undefined,
            borderRadius: `${br}px`,
            border: `${bw}px ${props.borderStyle} ${props.borderColor}`,
            position: props.position as React.CSSProperties["position"],
            display: effectiveDisplay,
            flexDirection: effectiveDisplay === "flex" ? (props.flexDirection as React.CSSProperties["flexDirection"]) : undefined,
            flexWrap: effectiveDisplay === "flex" ? (props.flexWrap as React.CSSProperties["flexWrap"]) : undefined,
            alignItems: effectiveDisplay === "flex" || effectiveDisplay === "grid" ? (props.alignItems as string) : undefined,
            justifyContent: effectiveDisplay === "flex" || effectiveDisplay === "grid" ? (props.justifyContent as string) : undefined,
            gap: effectiveDisplay === "flex" ? px(props.gap) : undefined,
            gridTemplateColumns: effectiveDisplay === "grid" ? (props.gridTemplateColumns as string) : undefined,
            gridTemplateRows: effectiveDisplay === "grid" ? (props.gridTemplateRows as string) : undefined,
            columnGap: effectiveDisplay === "grid" ? px(props.gridColumnGap ?? props.gridGap) : undefined,
            rowGap: effectiveDisplay === "grid" ? px(props.gridRowGap ?? props.gridGap) : undefined,
            boxShadow: props.boxShadow as string,
            opacity: props.opacity as number,
            overflow: props.overflow as string,
            cursor: interactiveClick ? "pointer" : (props.cursor as string),
          }}
          onClick={interactiveClick}
        >
          {children}
        </div>
      );
    }

    case "Section": {
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
      const bgImage = props.backgroundImage as string;
      const overlay = props.backgroundOverlay as string;
      return wrap(
        <section
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
            padding: `${pt}px ${pr}px ${pb}px ${pl}px`,
            margin: `${mt}px ${mr}px ${mb}px ${ml}px`,
            width: props.width as string,
            height: props.height as string,
            borderRadius: px(props.borderRadius),
            border: `${props.borderWidth}px ${props.borderStyle} ${props.borderColor}`,
            display: "flex",
            flexDirection: props.flexDirection as string,
            flexWrap: props.flexWrap as string,
            alignItems: props.alignItems as string,
            justifyContent: props.justifyContent as string,
            gap: px(props.gap),
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
      return wrap(
        <div
          style={{
            backgroundColor: props.background as string,
            padding: `${pt}px ${pr}px ${pb}px ${pl}px`,
            margin: `${mt}px ${mr}px ${mb}px ${ml}px`,
            width: props.width as string,
            height: props.height as string,
            borderRadius: px(props.borderRadius),
            border: `${props.borderWidth}px ${props.borderStyle} ${props.borderColor}`,
            display: "flex",
            flexDirection: props.flexDirection as string,
            flexWrap: props.flexWrap as string,
            alignItems: props.alignItems as string,
            justifyContent: props.justifyContent as string,
            gap: px(props.gap),
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
      return wrap(
        <div
          style={{
            flex: w === "auto" ? 1 : undefined,
            width: w !== "auto" ? w : undefined,
            backgroundColor: props.background as string,
            padding: `${pt}px ${pr}px ${pb}px ${pl}px`,
            margin: `${mt}px ${mr}px ${mb}px ${ml}px`,
            height: props.height as string,
            borderRadius: px(props.borderRadius),
            border: `${props.borderWidth}px ${props.borderStyle} ${props.borderColor}`,
            display: "flex",
            flexDirection: props.flexDirection as string,
            flexWrap: props.flexWrap as string,
            alignItems: props.alignItems as string,
            justifyContent: props.justifyContent as string,
            gap: px(props.gap),
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
      return wrap(
        <div
          style={{
            fontSize: px(props.fontSize),
            fontFamily: (props.fontFamily as string) || "Inter",
            fontWeight: props.fontWeight as string,
            lineHeight: props.lineHeight as number,
            letterSpacing: px(props.letterSpacing),
            textAlign: props.textAlign as React.CSSProperties["textAlign"],
            textTransform: props.textTransform as React.CSSProperties["textTransform"],
            color: props.color as string,
            margin: `${mt}px ${mr}px ${mb}px ${ml}px`,
            padding: `${pt}px ${pr}px ${pb}px ${pl}px`,
            opacity: props.opacity as number,
            boxShadow: props.boxShadow as string,
            cursor: interactiveClick ? "pointer" : undefined,
          }}
          onClick={interactiveClick}
        >
          {(props.text as string) ?? ""}
        </div>
      );
    }

    case "Image":
      return wrap(
        <img
          src={(props.src as string) || "https://placehold.co/600x400?text=Image"}
          alt={(props.alt as string) || "Image"}
          style={{
            width: props.width as string,
            height: props.height as string,
            objectFit: props.objectFit as React.CSSProperties["objectFit"],
            borderRadius: px(props.borderRadius),
            padding: px(props.padding),
            margin: px(props.margin),
            opacity: props.opacity as number,
            boxShadow: props.boxShadow as string,
          }}
        />
      );

    case "Button": {
      const variant = (props.variant as string) || "primary";
      const style = BUTTON_VARIANTS[variant] ?? BUTTON_VARIANTS.primary;
      const bg = (props.backgroundColor as string) ?? style.bg;
      const color = (props.textColor as string) ?? style.text;
      const borderColor = (props.borderColor as string) ?? style.border;
      const borderWidth = (props.borderWidth as number) ?? style.borderWidth;
      const m = typeof props.margin === "number" ? props.margin : 0;
      const mt = (props.marginTop ?? m) as number;
      const mr = (props.marginRight ?? m) as number;
      const mb = (props.marginBottom ?? m) as number;
      const ml = (props.marginLeft ?? m) as number;
      const labelStr = (props.label as string) ?? "Button";
      const explicitLink = (props.link as string) || "";
      const link =
        explicitLink ||
        (storeContext ? getDefaultLinkForLabel(labelStr) : "");
      const content = (
        <span
          style={{
            backgroundColor: bg,
            color,
            fontSize: px(props.fontSize),
            fontWeight: props.fontWeight as string,
            fontFamily: (props.fontFamily as string) || "Inter",
            borderRadius: px(props.borderRadius),
            border: `${borderWidth}px solid ${borderColor}`,
            padding: `${props.paddingTop}px ${props.paddingRight}px ${props.paddingBottom}px ${props.paddingLeft}px`,
            margin: `${mt}px ${mr}px ${mb}px ${ml}px`,
            opacity: props.opacity as number,
            boxShadow: props.boxShadow as string,
            display: "inline-block",
            cursor: interactiveClick ? "pointer" : undefined,
          }}
          onClick={interactiveClick}
        >
          {labelStr}
        </span>
      );
      if (interactiveClick) {
        return wrapWithAnimation(content, animation);
      }
      if (link) {
        return wrap(
          <a href={link} style={{ textDecoration: "none" }}>
            {content}
          </a>
        );
      }
      return wrap(content);
    }

    case "Divider":
      return wrap(
        <hr
          style={{
            width: (props.width as string) || "100%",
            border: "none",
            borderTop: `${props.thickness}px ${props.dividerStyle} ${props.color}`,
            marginTop: px(props.marginTop),
            marginBottom: px(props.marginBottom),
          }}
        />
      );

    case "Icon":
      return wrapWithAnimation(
        <div onClick={interactiveClick}>
          <DesignIcon
            iconType={props.iconType as string}
            size={toNumber(props.size, 24)}
            color={props.color as string}
            width={props.width as string}
            height={props.height as string}
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
        </div>,
        animation
      );

    case "Circle":
    case "Square":
    case "Triangle": {
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
      const w = (props.width as string) || "200px";
      const h = (props.height as string) || "200px";

      return wrapWithAnimation(
        <div
          style={{
            width: w,
            height: h,
            minWidth: w,
            minHeight: h,
            position: props.position as React.CSSProperties["position"],
            display: props.display as React.CSSProperties["display"],
            zIndex: toNumber(props.zIndex, 0) || undefined,
            top: (props.position as string) !== "static" ? (props.top as string) : undefined,
            right: (props.position as string) !== "static" ? (props.right as string) : undefined,
            bottom: (props.position as string) !== "static" ? (props.bottom as string) : undefined,
            left: (props.position as string) !== "static" ? (props.left as string) : undefined,
            backgroundColor: type === "Triangle" ? undefined : fill,
            borderRadius: type === "Circle" ? "50%" : undefined,
            border: type === "Triangle"
              ? undefined
              : `${toNumber(props.borderWidth, 0)}px ${props.borderStyle as string} ${props.borderColor as string}`,
            alignItems: "center",
            justifyContent: "center",
            margin: `${mt}px ${mr}px ${mb}px ${ml}px`,
            padding: `${pt}px ${pr}px ${pb}px ${pl}px`,
            boxShadow: props.boxShadow as string,
            opacity: toNumber(props.opacity, 1),
            overflow: props.overflow as string,
            cursor: interactiveClick ? "pointer" : (props.cursor as string),
          }}
          onClick={interactiveClick}
        >
          {type === "Triangle" ? (
            <svg
              width="100%"
              height="100%"
              viewBox="0 0 100 100"
              style={{ position: "absolute", top: 0, left: 0, pointerEvents: "none" }}
            >
              <polygon
                points="0,100 50,0 100,100"
                fill={fill}
                stroke={props.borderColor as string}
                strokeWidth={toNumber(props.borderWidth, 0)}
                strokeDasharray={
                  props.borderStyle === "dashed"
                    ? "6,6"
                    : props.borderStyle === "dotted"
                      ? "3,3"
                      : undefined
                }
              />
            </svg>
          ) : null}
          {children}
        </div>,
        animation
      );
    }

    default:
      return <div data-unknown-type={type}>{children}</div>;
  }
}

function getPageSlug(page: { slug?: string }, index: number): string {
  return page.slug ?? `page-${index}`;
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
}: {
  doc: BuilderDocument;
  pageIndex?: number;
  /** Initial page slug for multi-page (overrides pageIndex when set). */
  initialPageSlug?: string;
  storeContext?: StoreContext | null;
}): React.ReactElement {
  const firstSlug = doc.pages[0] ? getPageSlug(doc.pages[0], 0) : "page";
  const [currentPageSlug, setCurrentPageSlug] = useState(initialPageSlug ?? getPageSlug(doc.pages[pageIndex] ?? doc.pages[0], pageIndex) ?? firstSlug);
  const [history, setHistory] = useState<string[]>([]);
  const [transitionStyle, setTransitionStyle] = useState<React.CSSProperties>({});

  const currentPage = doc.pages.find((p, i) => getPageSlug(p, i) === currentPageSlug) ?? doc.pages[0];
  const currentPageIndex = doc.pages.findIndex((p, i) => getPageSlug(p, i) === currentPageSlug);

  const onPrototypeAction = useCallback(
    (interaction: Interaction) => {
      const duration = (interaction.duration ?? 300) / 1000;
      if (interaction.action === "navigateTo" && interaction.destination) {
        setHistory((h) => [...h, currentPageSlug]);
        const trans = interaction.transition ?? "dissolve";
        setTransitionStyle({
          ...PAGE_TRANSITION_STYLES[trans],
          animationDuration: `${duration}s`,
        });
        setCurrentPageSlug(interaction.destination);
      } else if (interaction.action === "back") {
        if (history.length > 0) {
          const prev = history[history.length - 1];
          setHistory((h) => h.slice(0, -1));
          setTransitionStyle(PAGE_TRANSITION_STYLES.dissolve);
          setCurrentPageSlug(prev);
        }
      } else if (interaction.action === "openUrl" && interaction.destination) {
        window.open(interaction.destination, "_blank", "noopener");
      } else if (interaction.action === "scrollTo" && interaction.destination) {
        document.getElementById(interaction.destination)?.scrollIntoView({ behavior: "smooth" });
      }
    },
    [currentPageSlug, history]
  );

  if (!currentPage) {
    return <div style={{ padding: 24, color: "#666" }}>No page to display.</div>;
  }

  const pageProps = mergeProps("Page", currentPage.props) as Record<string, unknown>;
  const width = (pageProps.width as string) || "1000px";
  const background = (pageProps.background as string) || "#ffffff";
  const minHeight = (pageProps.height as string) === "auto" ? "800px" : (pageProps.height as string);
  const frameStyles = resolvePageFrameStyles(width);
  const { ref, width: viewportWidth } = useContainerWidth(1000);
  const [interactionState, setInteractionState] = React.useState<Record<string, boolean>>({});
  const availableTriggerTargets = React.useMemo(() => {
    const targets = new Set<string>();
    for (const node of Object.values(doc.nodes)) {
      const target = node?.props?.toggleTarget;
      if (typeof target === "string" && target.trim()) {
        targets.add(target.trim());
      }
    }
    return targets;
  }, [doc.nodes]);
  const handleToggle = React.useCallback((target: string, action: "toggle" | "open" | "close") => {
    setInteractionState((prev) => {
      const current = prev[target] ?? false;
      const next =
        action === "open" ? true :
        action === "close" ? false :
        !current;
      return { ...prev, [target]: next };
    });
  }, []);

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
      <div
        key={currentPageSlug}
        style={{
          width,
          minHeight,
          backgroundColor: background,
          margin: "0 auto",
          boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)",
          borderRadius: 8,
          overflow: "hidden",
          ...transitionStyle,
        }}
      >
        {currentPage.children.map((id) => {
          const node = doc.nodes[id];
          if (!node) return null;
          return (
            <RenderNode
              key={id}
              node={node}
              nodes={doc.nodes}
              pageIndex={currentPageIndex >= 0 ? currentPageIndex : 0}
              storeContext={storeContext}
              nodeId={id}
              onPrototypeAction={onPrototypeAction}
            />
          );
        })}
      </div>
    </>
  );
}

/**
 * Full-width live site renderer. No shadow, no border-radius, no max-width box.
 * The design fills the entire browser viewport as a real website.
 */
export function LiveSite({
  doc,
  pageIndex = 0,
  storeContext,
}: {
  doc: BuilderDocument;
  pageIndex?: number;
  storeContext?: StoreContext | null;
}): React.ReactElement {
  const page = doc.pages[pageIndex];
  if (!page) {
    return <div style={{ padding: 24, color: "#666" }}>No page to display.</div>;
  }

  const pageProps = mergeProps("Page", page.props) as Record<string, unknown>;
  const background = (pageProps.background as string) || "#ffffff";
  const { ref, width: viewportWidth } = useContainerWidth();
  const [interactionState, setInteractionState] = React.useState<Record<string, boolean>>({});
  const availableTriggerTargets = React.useMemo(() => {
    const targets = new Set<string>();
    for (const node of Object.values(doc.nodes)) {
      const target = node?.props?.toggleTarget;
      if (typeof target === "string" && target.trim()) {
        targets.add(target.trim());
      }
    }
    return targets;
  }, [doc.nodes]);
  const handleToggle = React.useCallback((target: string, action: "toggle" | "open" | "close") => {
    setInteractionState((prev) => {
      const current = prev[target] ?? false;
      const next =
        action === "open" ? true :
        action === "close" ? false :
        !current;
      return { ...prev, [target]: next };
    });
  }, []);

  return (
    <div
      ref={ref}
      style={{
        width: "100%",
        minHeight: "100vh",
        backgroundColor: background,
      }}
    >
      {page.children.map((id) => {
        const node = doc.nodes[id];
        if (!node) return null;
        return (
          <RenderNode
            key={id}
            node={node}
            nodes={doc.nodes}
            pageIndex={pageIndex}
            viewportWidth={viewportWidth}
            interactionState={interactionState}
            availableTriggerTargets={availableTriggerTargets}
            onToggle={handleToggle}
            storeContext={storeContext}
          />
        );
      })}
    </div>
  );
}
