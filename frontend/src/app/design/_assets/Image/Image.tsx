import React from "react";
import { useNode } from "@craftjs/core";
import { ImageSettings } from "./ImageSettings";
import type { ImageProps } from "../../_types/components";

export const Image = ({
  src = "https://placehold.co/600x400/27272a/a1a1aa?text=Image",
  alt = "Image",
  objectFit = "cover",
  width = "100%",
  height = "auto",
  borderRadius = 0,
  radiusTopLeft,
  radiusTopRight,
  radiusBottomRight,
  radiusBottomLeft,
  padding = 0,
  paddingTop,
  paddingRight,
  paddingBottom,
  paddingLeft,
  margin = 0,
  marginTop,
  marginRight,
  marginBottom,
  marginLeft,
  opacity = 1,
  boxShadow = "none",
}: ImageProps) => {
  const { connectors: { connect, drag } } = useNode();

  // Resolve spacing
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

  // Resolve border radius
  const br = borderRadius || 0;
  const rtl = radiusTopLeft ?? br;
  const rtr = radiusTopRight ?? br;
  const rbr = radiusBottomRight ?? br;
  const rbl = radiusBottomLeft ?? br;

  return (
    <img
      ref={(ref) => { if (ref) connect(drag(ref)); }}
      src={src}
      alt={alt}
      style={{
        width,
        height,
        objectFit,
        borderTopLeftRadius: `${rtl}px`,
        borderTopRightRadius: `${rtr}px`,
        borderBottomRightRadius: `${rbr}px`,
        borderBottomLeftRadius: `${rbl}px`,
        paddingTop: `${pt}px`,
        paddingRight: `${pr}px`,
        paddingBottom: `${pb}px`,
        paddingLeft: `${pl}px`,
        marginTop: `${mt}px`,
        marginRight: `${mr}px`,
        marginBottom: `${mb}px`,
        marginLeft: `${ml}px`,
        opacity,
        boxShadow,
        display: "block",
      }}
      className="hover:outline hover:outline-blue-500 cursor-pointer"
    />
  );
};

export const ImageDefaultProps: Partial<ImageProps> = {
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
};

Image.craft = {
  displayName: "Image",
  props: ImageDefaultProps,
  related: {
    settings: ImageSettings,
  },
};
