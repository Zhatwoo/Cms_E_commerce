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
        object-fit: cover;
      }
      .frame-responsive-inner table { width: 100%; max-width: 100%; }
      
      /* Responsive Navigation Styles - Auto hamburger menu on mobile */
      .frame-responsive-inner [data-nav-container] {
        position: relative;
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: space-between;
        width: 100%;
      }
      
      /* Hamburger always on the right: order last + margin-left auto */
      .frame-responsive-inner [data-nav-container] .nav-hamburger {
        display: none;
        flex-direction: column;
        gap: 4px;
        background: transparent;
        border: none;
        cursor: pointer;
        padding: 8px;
        z-index: 1001;
        position: relative;
        color: inherit;
        margin-left: auto !important;
        order: 999 !important;
        flex-shrink: 0;
      }
      
      .frame-responsive-inner [data-nav-container] .nav-menu {
        order: 0;
      }
      
      .frame-responsive-inner [data-nav-container] .nav-hamburger span {
        display: block;
        width: 24px;
        height: 2px;
        background-color: currentColor;
        transition: all 0.3s ease;
      }
      
      /* Hamburger animation when active */
      .frame-responsive-inner [data-nav-container] .nav-hamburger.active span:nth-child(1) {
        transform: rotate(45deg) translate(5px, 5px);
      }
      
      .frame-responsive-inner [data-nav-container] .nav-hamburger.active span:nth-child(2) {
        opacity: 0;
      }
      
      .frame-responsive-inner [data-nav-container] .nav-hamburger.active span:nth-child(3) {
        transform: rotate(-45deg) translate(7px, -6px);
      }
      
      /* Mobile nav menu - default desktop view */
      .frame-responsive-inner [data-nav-container] .nav-menu {
        display: flex;
        flex-direction: row;
        align-items: center;
        gap: 16px;
        list-style: none;
        margin: 0;
        padding: 0;
        width: 100%;
      }

      .frame-responsive-inner [data-nav-container] .nav-menu ul,
      .frame-responsive-inner [data-nav-container] .nav-menu ol {
        list-style: none;
        margin: 0;
        padding: 0;
        width: 100%;
      }
      
      /* Mobile breakpoint - convert nav to hamburger menu */
      /* Based on container size, not viewport - using container queries if available */
      @container (max-width: 768px) {
        .frame-responsive-inner [data-nav-container] {
          display: flex !important;
          justify-content: space-between !important;
          align-items: center !important;
          width: 100% !important;
          position: relative !important;
        }
        
        .frame-responsive-inner [data-nav-container] .nav-hamburger {
          display: flex !important;
          order: 999 !important;
          margin-left: auto !important;
        }
        
        .frame-responsive-inner [data-nav-container] .nav-menu {
          position: absolute !important;
          top: 100% !important;
          left: auto !important;
          right: 0 !important;
          min-width: 200px !important;
          max-width: 100% !important;
          flex-direction: column !important;
          align-items: stretch !important;
          background: rgba(255, 255, 255, 0.98) !important;
          backdrop-filter: blur(10px);
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1) !important;
          padding: 0 !important;
          gap: 0 !important;
          max-height: 0 !important;
          overflow: hidden !important;
          opacity: 0 !important;
          transition: max-height 0.3s ease, opacity 0.3s ease, padding 0.3s ease !important;
          z-index: 1000 !important;
          margin-top: 8px !important;
          border-radius: 0 0 8px 8px !important;
        }
        
        .frame-responsive-inner [data-nav-container] .nav-menu.open {
          max-height: 500px !important;
          opacity: 1 !important;
          padding: 16px !important;
        }
        
        .frame-responsive-inner [data-nav-container] .nav-menu > * {
          width: 100% !important;
          padding: 12px !important;
          text-align: right !important;
          border-bottom: 1px solid rgba(0, 0, 0, 0.1) !important;
          display: block !important;
        }

        .frame-responsive-inner [data-nav-container] .nav-menu ul,
        .frame-responsive-inner [data-nav-container] .nav-menu ol {
          display: flex !important;
          flex-direction: column !important;
          gap: 0 !important;
          width: 100% !important;
        }

        .frame-responsive-inner [data-nav-container] .nav-menu ul > li,
        .frame-responsive-inner [data-nav-container] .nav-menu ol > li {
          width: 100% !important;
          margin: 0 !important;
          display: block !important;
        }

        .frame-responsive-inner [data-nav-container] .nav-menu ul > li > a,
        .frame-responsive-inner [data-nav-container] .nav-menu ol > li > a {
          width: 100% !important;
          display: block !important;
        }
        
        .frame-responsive-inner [data-nav-container] .nav-menu > *:last-child {
          border-bottom: none !important;
        }
      }
      
      /* Mobile styles when frame container is small (JavaScript-triggered) */
      .frame-responsive-inner.frame-mobile [data-nav-container],
      .frame-mobile .frame-responsive-inner [data-nav-container] {
        display: flex !important;
        justify-content: space-between !important;
        align-items: center !important;
        width: 100% !important;
        position: relative !important;
      }
      
      .frame-responsive-inner.frame-mobile [data-nav-container] .nav-hamburger,
      .frame-mobile .frame-responsive-inner [data-nav-container] .nav-hamburger {
        display: flex !important;
        order: 999 !important;
        margin-left: auto !important;
      }
      
      .frame-responsive-inner.frame-mobile [data-nav-container] .nav-menu,
      .frame-mobile .frame-responsive-inner [data-nav-container] .nav-menu {
        position: absolute !important;
        top: 100% !important;
        left: auto !important;
        right: 0 !important;
        min-width: 200px !important;
        max-width: 100% !important;
        flex-direction: column !important;
        align-items: stretch !important;
        background: rgba(255, 255, 255, 0.98) !important;
        backdrop-filter: blur(10px);
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1) !important;
        padding: 0 !important;
        gap: 0 !important;
        max-height: 0 !important;
        overflow: hidden !important;
        opacity: 0 !important;
        transition: max-height 0.3s ease, opacity 0.3s ease, padding 0.3s ease !important;
        z-index: 1000 !important;
        margin-top: 8px !important;
        border-radius: 0 0 8px 8px !important;
      }
      
      .frame-responsive-inner.frame-mobile [data-nav-container] .nav-menu.open,
      .frame-mobile .frame-responsive-inner [data-nav-container] .nav-menu.open {
        max-height: 500px !important;
        opacity: 1 !important;
        padding: 16px !important;
      }
      
      .frame-responsive-inner.frame-mobile [data-nav-container] .nav-menu > *,
      .frame-mobile .frame-responsive-inner [data-nav-container] .nav-menu > * {
        width: 100% !important;
        padding: 12px !important;
        text-align: right !important;
        border-bottom: 1px solid rgba(0, 0, 0, 0.1) !important;
        display: block !important;
      }

      .frame-responsive-inner.frame-mobile [data-nav-container] .nav-menu ul,
      .frame-responsive-inner.frame-mobile [data-nav-container] .nav-menu ol,
      .frame-mobile .frame-responsive-inner [data-nav-container] .nav-menu ul,
      .frame-mobile .frame-responsive-inner [data-nav-container] .nav-menu ol {
        display: flex !important;
        flex-direction: column !important;
        gap: 0 !important;
        width: 100% !important;
      }

      .frame-responsive-inner.frame-mobile [data-nav-container] .nav-menu ul > li,
      .frame-responsive-inner.frame-mobile [data-nav-container] .nav-menu ol > li,
      .frame-mobile .frame-responsive-inner [data-nav-container] .nav-menu ul > li,
      .frame-mobile .frame-responsive-inner [data-nav-container] .nav-menu ol > li {
        width: 100% !important;
        margin: 0 !important;
        display: block !important;
      }

      .frame-responsive-inner.frame-mobile [data-nav-container] .nav-menu ul > li > a,
      .frame-responsive-inner.frame-mobile [data-nav-container] .nav-menu ol > li > a,
      .frame-mobile .frame-responsive-inner [data-nav-container] .nav-menu ul > li > a,
      .frame-mobile .frame-responsive-inner [data-nav-container] .nav-menu ol > li > a {
        width: 100% !important;
        display: block !important;
      }
      
      .frame-responsive-inner.frame-mobile [data-nav-container] .nav-menu > *:last-child,
      .frame-mobile .frame-responsive-inner [data-nav-container] .nav-menu > *:last-child {
        border-bottom: none !important;
      }
      
      /* Fallback for browsers without container queries - use viewport media query */
      @media (max-width: 768px) {
        .frame-responsive-inner [data-nav-container] {
          display: flex !important;
          justify-content: space-between !important;
          align-items: center !important;
          width: 100% !important;
          position: relative !important;
        }
        
        .frame-responsive-inner [data-nav-container] .nav-hamburger {
          display: flex !important;
          order: 999 !important;
          margin-left: auto !important;
        }
        
        .frame-responsive-inner [data-nav-container] .nav-menu {
          position: absolute !important;
          top: 100% !important;
          left: auto !important;
          right: 0 !important;
          min-width: 200px !important;
          max-width: 100% !important;
          flex-direction: column !important;
          align-items: stretch !important;
          background: rgba(255, 255, 255, 0.98) !important;
          backdrop-filter: blur(10px);
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1) !important;
          padding: 0 !important;
          gap: 0 !important;
          max-height: 0 !important;
          overflow: hidden !important;
          opacity: 0 !important;
          transition: max-height 0.3s ease, opacity 0.3s ease, padding 0.3s ease !important;
          z-index: 1000 !important;
          margin-top: 8px !important;
          border-radius: 0 0 8px 8px !important;
        }
        
        .frame-responsive-inner [data-nav-container] .nav-menu.open {
          max-height: 500px !important;
          opacity: 1 !important;
          padding: 16px !important;
        }
        
        .frame-responsive-inner [data-nav-container] .nav-menu > * {
          width: 100% !important;
          padding: 12px !important;
          text-align: right !important;
          border-bottom: 1px solid rgba(0, 0, 0, 0.1) !important;
          display: block !important;
        }

        .frame-responsive-inner [data-nav-container] .nav-menu ul,
        .frame-responsive-inner [data-nav-container] .nav-menu ol {
          display: flex !important;
          flex-direction: column !important;
          gap: 0 !important;
          width: 100% !important;
        }

        .frame-responsive-inner [data-nav-container] .nav-menu ul > li,
        .frame-responsive-inner [data-nav-container] .nav-menu ol > li {
          width: 100% !important;
          margin: 0 !important;
          display: block !important;
        }

        .frame-responsive-inner [data-nav-container] .nav-menu ul > li > a,
        .frame-responsive-inner [data-nav-container] .nav-menu ol > li > a {
          width: 100% !important;
          display: block !important;
        }
        
        .frame-responsive-inner [data-nav-container] .nav-menu > *:last-child {
          border-bottom: none !important;
        }
      }
      
      /* Ensure all container elements are responsive */
      .frame-responsive-inner * {
        box-sizing: border-box;
      }
      
      /* Make text responsive */
      .frame-responsive-inner {
        font-size: clamp(12px, 1vw, 16px);
      }
      
      /* Responsive images and media */
      .frame-responsive-inner img,
      .frame-responsive-inner video,
      .frame-responsive-inner iframe {
        max-width: 100%;
        height: auto;
        display: block;
      }
      
      /* Responsive buttons and inputs */
      .frame-responsive-inner button,
      .frame-responsive-inner input,
      .frame-responsive-inner select,
      .frame-responsive-inner textarea {
        max-width: 100%;
        box-sizing: border-box;
      }
      
      /* Fluid mode: maayos na alignment, compatible sa lahat ng devices */
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
        height: auto !important;
        display: block !important;
        object-fit: contain;
      }
      .frame-responsive-inner.frame-fluid [data-node-id] {
        max-width: 100% !important;
        min-width: 0;
      }
      /* Maliit na canvas (phone): row -> column — text sa taas, image sa ibaba (hero) */
      @container (max-width: 640px) {
        .frame-responsive-inner.frame-fluid [data-layout="row"] {
          flex-direction: column !important;
          align-items: stretch !important;
        }
        .frame-responsive-inner.frame-fluid [data-layout="row"] > * {
          width: 100% !important;
          max-width: 100% !important;
          min-width: 0 !important;
        }
      }
      @container (max-width: 400px) {
        .frame-responsive-inner.frame-fluid [data-layout="row"] { gap: 12px !important; }
      }
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
    overflow: "hidden",
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

  const innerRef = useRef<HTMLDivElement>(null);
  const frameContainerRef = useRef<HTMLDivElement>(null);

  // Detect frame size and add mobile class when frame is small
  useEffect(() => {
    const containerEl = frameContainerRef.current;
    const innerEl = innerRef.current;
    if (!containerEl || !innerEl) return;

    const updateMobileClass = () => {
      const containerWidth = containerEl.clientWidth;
      // Consider mobile if container width is less than 768px (accounting for scale)
      const isMobile = containerWidth < 768;
      
      if (isMobile) {
        innerEl.classList.add("frame-mobile");
        containerEl.classList.add("frame-mobile");
      } else {
        innerEl.classList.remove("frame-mobile");
        containerEl.classList.remove("frame-mobile");
      }
    };

    updateMobileClass();

    const resizeObserver = new ResizeObserver(() => {
      updateMobileClass();
    });

    resizeObserver.observe(containerEl);

    return () => {
      resizeObserver.disconnect();
    };
  }, [containerWidth, containerHeight]);

  // Auto-detect and enhance navigation containers with hamburger menu
  useEffect(() => {
    const innerEl = innerRef.current;
    if (!innerEl) return;

    // Detect header/nav containers, including hand-made headers with UL menus
    const isHeaderAsset = (el: HTMLElement): boolean => {
      const tag = el.tagName.toLowerCase();
      if (el.getAttribute("data-header") !== null) return true;
      const className = (el.className || "") as string;
      if (/header/i.test(className)) return true;
      if (el.getAttribute("role") === "banner") return true;
      if (el.getAttribute("role") === "navigation") return true;
      if (tag === "header" || tag === "nav") return true;
      if (el.querySelector("ul") && (el.querySelector("a") || el.querySelector("li"))) return true;
      return false;
    };

    // Function to enhance a navigation container: keep first child (brand/logo) visible,
    // move all remaining nav items (e.g., Home, links, buttons) into dropdown.
    const enhanceNavContainer = (container: HTMLElement): boolean => {
      if (container.hasAttribute("data-nav-enhanced")) return false;

      const existingChildren = Array.from(container.children).filter(
        (c) => {
          const el = c as HTMLElement;
          return !el.classList.contains("nav-hamburger") && !el.classList.contains("nav-menu");
        }
      );

      if (existingChildren.length <= 1) return false;

      // Keep first element (usually brand/logo) outside; move the rest into dropdown.
      const toDropDown = existingChildren.slice(1);

      const menuWrapper = document.createElement("div");
      menuWrapper.className = "nav-menu";
      toDropDown.forEach((c) => menuWrapper.appendChild(c));

      if (menuWrapper.children.length === 0) return false;

      container.setAttribute("data-nav-enhanced", "true");
      container.setAttribute("data-nav-container", "true");
      container.append(menuWrapper);

      const hamburger = document.createElement("button");
      hamburger.className = "nav-hamburger";
      hamburger.setAttribute("aria-label", "Toggle menu");
      hamburger.setAttribute("aria-expanded", "false");
      hamburger.type = "button";
      for (let i = 0; i < 3; i++) {
        const span = document.createElement("span");
        hamburger.appendChild(span);
      }
      hamburger.addEventListener("click", (e) => {
        e.stopPropagation();
        e.preventDefault();
        const menu = container.querySelector(".nav-menu");
        if (menu) {
          const isOpen = menu.classList.contains("open");
          menu.classList.toggle("open");
          hamburger.classList.toggle("active");
          hamburger.setAttribute("aria-expanded", String(!isOpen));
        }
      });
      container.appendChild(hamburger);
      return true;
    };

    // Scan and enhance only Header assets (first match only)
    const scanAndEnhance = () => {
      setTimeout(() => {
        if (!innerEl) return;

        const containers = innerEl.querySelectorAll("header, nav, div, section");
        for (const container of containers) {
          const el = container as HTMLElement;
          if (el.classList.contains("nav-menu") || el.classList.contains("nav-hamburger")) continue;
          if (isHeaderAsset(el)) {
            const enhanced = enhanceNavContainer(el);
            if (enhanced) break;
          }
        }
      }, 100);
    };

    // Initial scan after a delay
    const timeoutId = setTimeout(scanAndEnhance, 200);

    // Use MutationObserver to watch for new containers
    const observer = new MutationObserver(() => {
      scanAndEnhance();
    });

    observer.observe(innerEl, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["style"],
    });

    return () => {
      clearTimeout(timeoutId);
      observer.disconnect();
    };
  }, [children, containerWidth, containerHeight]);

  return (
    <div
      data-node-id={id}
      ref={(el) => {
        (containerRef as React.MutableRefObject<HTMLDivElement | null>).current = el;
        (frameContainerRef as React.MutableRefObject<HTMLDivElement | null>).current = el;
        if (el) connect(drag(el));
      }}
      className="min-h-[80px] transition-[outline] duration-150 hover:outline hover:outline-blue-500 box-border flex items-center justify-center overflow-hidden"
      style={{
        width,
        minHeight: effectiveMinHeight,
        padding: `${pt}px ${pr}px ${pb}px ${pl}px`,
        margin: `${mt}px ${mr}px ${mb}px ${ml}px`,
        boxSizing: "border-box",
        containerType: "inline-size", // Enable container queries
      }}
    >
      {responsiveAssetStyles}
      <div 
        ref={innerRef}
        data-node-id={id}
        className={`frame-responsive-inner${isFluid ? " frame-fluid" : ""} min-h-[60px]`}
        style={{
          ...innerStyle,
          containerType: "inline-size", // Enable container queries for inner content
        }}
      >
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
