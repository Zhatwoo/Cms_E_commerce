"use client";

import React from "react";
import type { BuilderDocument, CleanNode, ComponentType } from "../_types/schema";

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

// Default props per type (merge with node.props for full props). Minimal set for rendering.
const DEFAULTS: Record<string, Record<string, unknown>> = {
  Page: { width: "1000px", height: "auto", background: "#ffffff" },
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
};

function mergeProps(type: string, props: Record<string, unknown>): Record<string, unknown> {
  return { ...(DEFAULTS[type] ?? {}), ...props };
}

function px(v: unknown): string {
  if (typeof v === "number") return `${v}px`;
  if (typeof v === "string") return v;
  return "0";
}

const BUTTON_VARIANTS: Record<string, { bg: string; text: string; border: string; borderWidth: number }> = {
  primary: { bg: "#3b82f6", text: "#ffffff", border: "transparent", borderWidth: 0 },
  secondary: { bg: "#6b7280", text: "#ffffff", border: "transparent", borderWidth: 0 },
  outline: { bg: "transparent", text: "#3b82f6", border: "#3b82f6", borderWidth: 1 },
  ghost: { bg: "transparent", text: "#3b82f6", border: "transparent", borderWidth: 0 },
};

function RenderNode({
  node,
  nodes,
  pageIndex,
  storeContext,
}: {
  node: CleanNode;
  nodes: Record<string, CleanNode>;
  pageIndex: number;
  storeContext?: StoreContext | null;
}): React.ReactElement {
  const type = node.type as ComponentType;
  const props = mergeProps(type, node.props) as Record<string, unknown>;
  const childIds = node.children ?? [];
  const children = childIds.map((id) => {
    const n = nodes[id];
    if (!n) return null;
    return <RenderNode key={id} node={n} nodes={nodes} pageIndex={pageIndex} storeContext={storeContext} />;
  });

  switch (type) {
    case "Container": {
      const isProductSlot =
        storeContext &&
        storeContext.products.length > 0 &&
        hasAddToCartButton(node.id, nodes);
      if (isProductSlot) {
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
      return (
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
            height: props.height as string,
            borderRadius: `${br}px`,
            border: `${bw}px ${props.borderStyle} ${props.borderColor}`,
            position: props.position as React.CSSProperties["position"],
            display: props.display as React.CSSProperties["display"],
            flexDirection: props.display === "flex" ? (props.flexDirection as React.CSSProperties["flexDirection"]) : undefined,
            flexWrap: props.display === "flex" ? (props.flexWrap as React.CSSProperties["flexWrap"]) : undefined,
            alignItems: props.display === "flex" || props.display === "grid" ? (props.alignItems as string) : undefined,
            justifyContent: props.display === "flex" || props.display === "grid" ? (props.justifyContent as string) : undefined,
            gap: props.display === "flex" ? px(props.gap) : undefined,
            gridTemplateColumns: props.display === "grid" ? (props.gridTemplateColumns as string) : undefined,
            gridTemplateRows: props.display === "grid" ? (props.gridTemplateRows as string) : undefined,
            columnGap: props.display === "grid" ? px(props.gridColumnGap ?? props.gridGap) : undefined,
            rowGap: props.display === "grid" ? px(props.gridRowGap ?? props.gridGap) : undefined,
            boxShadow: props.boxShadow as string,
            opacity: props.opacity as number,
            overflow: props.overflow as string,
          }}
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
      return (
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
          }}
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
      return (
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
          }}
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
      return (
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
          }}
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
      return (
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
          }}
        >
          {(props.text as string) ?? ""}
        </div>
      );
    }

    case "Image":
      return (
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
          }}
        >
          {labelStr}
        </span>
      );
      if (link) {
        return (
          <a href={link} style={{ textDecoration: "none" }}>
            {content}
          </a>
        );
      }
      return content;
    }

    case "Divider":
      return (
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

    default:
      return <div data-unknown-type={type}>{children}</div>;
  }
}

export function WebPreview({
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
  const width = (pageProps.width as string) || "1000px";
  const background = (pageProps.background as string) || "#ffffff";
  const minHeight = (pageProps.height as string) === "auto" ? "800px" : (pageProps.height as string);

  return (
    <div
      style={{
        width,
        minHeight,
        backgroundColor: background,
        margin: "0 auto",
        boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)",
        borderRadius: 8,
        overflow: "hidden",
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
            storeContext={storeContext}
          />
        );
      })}
    </div>
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

  return (
    <div
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
            storeContext={storeContext}
          />
        );
      })}
    </div>
  );
}
