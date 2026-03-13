import React from "react";
import { useNode } from "@craftjs/core";
import type { IconRowProps, IconRowItem } from "../../_types/components";
import { IconRowSettings } from "./IconRowSettings";

function fluidSpace(value: number | undefined, min = 0): string | undefined {
  if (value == null) return undefined;
  if (!Number.isFinite(value) || value <= 0) return `${value || 0}px`;
  const preferred = Math.max(0.1, value / 12);
  const floor = Math.max(min, Math.round(value * 0.45));
  return `clamp(${floor}px, ${preferred.toFixed(2)}cqw, ${value}px)`;
}

const DEFAULT_ITEMS: IconRowItem[] = [
  {
    id: "facebook",
    src: "https://cdn.jsdelivr.net/npm/simple-icons@v13/icons/facebook.svg",
    alt: "Facebook",
    link: "https://facebook.com",
  },
  {
    id: "instagram",
    src: "https://cdn.jsdelivr.net/npm/simple-icons@v13/icons/instagram.svg",
    alt: "Instagram",
    link: "https://instagram.com",
  },
  {
    id: "twitter",
    src: "https://cdn.jsdelivr.net/npm/simple-icons@v13/icons/x.svg",
    alt: "X",
    link: "https://x.com",
  },
];

export const IconRow = ({
  items,
  align = "left",
  gap = 16,
  size = 22,
  padding = 0,
  paddingTop,
  paddingRight,
  paddingBottom,
  paddingLeft,
  margin,
  marginTop,
  marginRight,
  marginBottom,
  marginLeft,
  width = "auto",
  height = "auto",
  opacity = 1,
  position = "static",
  top,
  right,
  bottom,
  left,
  rotation = 0,
  flipHorizontal = false,
  flipVertical = false,
  customClassName = "",
}: IconRowProps) => {
  const {
    id,
    connectors: { connect, drag },
  } = useNode();

  const list = (items && items.length ? items : DEFAULT_ITEMS).slice(0, 12);

  const p = typeof padding === "number" ? padding : 0;
  const pt = paddingTop ?? p;
  const pr = paddingRight ?? p;
  const pb = paddingBottom ?? p;
  const pl = paddingLeft ?? p;

  const m = typeof margin === "number" ? margin : 0;
  const mt = marginTop ?? m;
  const mr = marginRight ?? m;
  const mb = marginBottom ?? m;
  const ml = marginLeft ?? m;

  const transform =
    [
      rotation ? `rotate(${rotation}deg)` : null,
      flipHorizontal ? "scaleX(-1)" : null,
      flipVertical ? "scaleY(-1)" : null,
    ]
      .filter(Boolean)
      .join(" ") || undefined;

  const justifyContent =
    align === "center" ? "center" : align === "right" ? "flex-end" : "flex-start";

  return (
    <nav
      aria-label="Social links"
      data-node-id={id}
      ref={(ref) => {
        if (ref) connect(drag(ref));
      }}
      className={customClassName}
      style={{
        width,
        height,
        opacity,
        position,
        top,
        right,
        bottom,
        left,
        transform,
        transformOrigin: "center center",
        paddingTop: fluidSpace(pt, 0),
        paddingRight: fluidSpace(pr, 0),
        paddingBottom: fluidSpace(pb, 0),
        paddingLeft: fluidSpace(pl, 0),
        marginTop: fluidSpace(mt, 0),
        marginRight: fluidSpace(mr, 0),
        marginBottom: fluidSpace(mb, 0),
        marginLeft: fluidSpace(ml, 0),
        display: "flex",
        alignItems: "center",
        justifyContent,
        gap: fluidSpace(gap, 4),
        boxSizing: "border-box",
        containerType: "inline-size",
      }}
    >
      {list.map((item) => (
        <a
          key={item.id}
          href={item.link || "#"}
          target="_blank"
          rel="noreferrer"
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "transform 0.15s ease-out, opacity 0.15s ease-out",
          }}
        >
          <img
            src={item.src}
            alt={item.alt || "Icon"}
            style={{
              width: `${size}px`,
              height: `${size}px`,
              objectFit: "contain",
              display: "block",
            }}
          />
        </a>
      ))}
    </nav>
  );
};

export const IconRowDefaultProps: Partial<IconRowProps> = {
  items: DEFAULT_ITEMS,
  align: "left",
  gap: 16,
  size: 22,
  padding: 0,
  width: "auto",
  height: "auto",
  opacity: 1,
};

IconRow.craft = {
  displayName: "IconRow",
  props: IconRowDefaultProps,
  related: {
    settings: IconRowSettings,
  },
};

