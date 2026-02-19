"use client";

import React, { useRef, useState, useEffect } from "react";
import { useNode } from "@craftjs/core";
import { FrameSettings } from "./FrameSettings";
import type { FrameProps } from "../../_types/components";

function useFrameSize(enable: boolean): { width: number; height: number; ref: React.RefObject<HTMLDivElement | null> } {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const [height, setHeight] = useState(0);

  useEffect(() => {
    if (!enable) return;
    const el = ref.current;
    if (!el) return;

    const update = () => {
      setWidth(el.clientWidth || 0);
      setHeight(el.clientHeight || 0);
    };
    update();
    const ro = typeof ResizeObserver !== "undefined"
      ? new ResizeObserver(update)
      : null;
    if (ro) ro.observe(el);
    return () => ro?.disconnect();
  }, [enable]);

  return { width, height, ref };
}

/** Responsive inner: makes assets (img, video, etc.) scale with frame on all devices */
const RESPONSIVE_INNER_STYLE: React.CSSProperties = {
  boxSizing: "border-box",
};
const responsiveAssetStyles = (
  <style dangerouslySetInnerHTML={{
    __html: `
      .frame-responsive-inner img,
      .frame-responsive-inner video,
      .frame-responsive-inner iframe,
      .frame-responsive-inner [data-responsive-asset] {
        max-width: 100%;
        height: auto;
        object-fit: contain;
      }
      .frame-responsive-inner table { width: 100%; max-width: 100%; }
    `,
  }} />
);

/**
 * Frame — ginagawang responsive ang lahat ng assets sa loob para sa desktop, tablet, at mobile.
 * Scale mode: content ay in-scale para mag-fit sa container.
 * Fluid mode: 100% width, assets ay nag reflow (max-width: 100%).
 */
export const Frame = ({
  referenceWidth = 1440,
  referenceHeight = 900,
  fitMode = "contain",
  width = "100%",
  minHeight,
  height,
  padding = 0,
  paddingTop,
  paddingBottom,
  paddingLeft,
  paddingRight,
  margin = 0,
  marginTop,
  marginBottom,
  marginLeft,
  marginRight,
  children,
}: FrameProps) => {
  const { id, connectors: { connect, drag } } = useNode();
  const effectiveMinHeight = minHeight ?? height ?? "400px";
  const isFluid = fitMode === "fluid";
  const enableScale = !isFluid && referenceWidth > 0 && referenceHeight > 0;
  const { width: containerWidth, height: containerHeight, ref: containerRef } = useFrameSize(enableScale);

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

  let scale = 1;
  let innerStyle: React.CSSProperties = {
    ...RESPONSIVE_INNER_STYLE,
    flexShrink: 0,
    position: "relative",
  };

  if (isFluid) {
    innerStyle = {
      ...innerStyle,
      width: "100%",
      minHeight: referenceHeight ? `${referenceHeight}px` : undefined,
    };
  } else {
    innerStyle = {
      ...innerStyle,
      width: referenceWidth,
      height: referenceHeight,
    };
    if (enableScale && containerWidth > 0 && containerHeight > 0) {
      const scaleX = containerWidth / referenceWidth;
      const scaleY = containerHeight / referenceHeight;
      if (fitMode === "contain") {
        scale = Math.min(scaleX, scaleY);
      } else if (fitMode === "cover") {
        scale = Math.max(scaleX, scaleY);
      } else {
        scale = scaleX;
      }
      innerStyle = {
        ...innerStyle,
        transform: `scale(${scale})`,
        transformOrigin: "0 0",
      };
    } else if (enableScale) {
      // Not yet measured: limit size so it doesn't overflow
      innerStyle = { ...innerStyle, maxWidth: "100%", maxHeight: "100%" };
    }
  }

  return (
    <div
      data-node-id={id}
      ref={(el) => {
        (containerRef as React.MutableRefObject<HTMLDivElement | null>).current = el;
        if (el) connect(drag(el));
      }}
      className="min-h-[80px] transition-[outline] duration-150 hover:outline hover:outline-blue-500 box-border flex items-start justify-start overflow-hidden"
      style={{
        width,
        minHeight: effectiveMinHeight,
        padding: `${pt}px ${pr}px ${pb}px ${pl}px`,
        margin: `${mt}px ${mr}px ${mb}px ${ml}px`,
        boxSizing: "border-box",
      }}
    >
      {responsiveAssetStyles}
      <div className="frame-responsive-inner" style={innerStyle}>
        {children}
      </div>
    </div>
  );
};

export const FrameDefaultProps: Partial<FrameProps> = {
  referenceWidth: 1440,
  referenceHeight: 900,
  fitMode: "contain",
  width: "100%",
  minHeight: "400px",
  padding: 0,
  margin: 0,
};

Frame.craft = {
  displayName: "Frame",
  props: FrameDefaultProps,
  related: {
    settings: FrameSettings,
  },
};
