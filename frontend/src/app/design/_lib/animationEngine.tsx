"use client";

import React, { useRef, useEffect, useState, useMemo } from "react";
import { motion, useInView } from "framer-motion";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/dist/ScrollTrigger";
import type {
  AnimationConfig,
  AnimateInType,
  AnimateOutType,
  AnimateDuringType,
  EasingType,
  ScrollEffectType,
} from "../_types/animation";
import { DEFAULT_ANIMATION } from "../_types/animation";

gsap.registerPlugin(ScrollTrigger);

// Track which documents already have a scrollerProxy configured.
const SCROLLER_PROXY_DOCS = new WeakSet<Document>();

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : {};
}

function normalizeTriggerType(raw: unknown): AnimationConfig["trigger"]["type"] {
  if (typeof raw !== "string") return DEFAULT_ANIMATION.trigger.type;
  const v = raw.trim().toLowerCase();
  if (v === "onscroll" || v === "scroll" || v === "inview" || v === "in-view") return "onScroll";
  if (v === "onload" || v === "load") return "onLoad";
  if (v === "onhover" || v === "hover") return "onHover";
  if (v === "onclick" || v === "click" || v === "tap") return "onClick";
  return DEFAULT_ANIMATION.trigger.type;
}

function normalizeAnimationConfig(animation: unknown): AnimationConfig {
  const root = asRecord(animation);
  const animateIn = asRecord(root.animateIn);
  const animateOut = asRecord(root.animateOut);
  const animateDuring = asRecord(root.animateDuring);
  const scrollEffect = asRecord(root.scrollEffect);
  const trigger = asRecord(root.trigger);

  return {
    animateIn: { ...DEFAULT_ANIMATION.animateIn, ...animateIn },
    animateOut: { ...DEFAULT_ANIMATION.animateOut, ...animateOut },
    animateDuring: { ...DEFAULT_ANIMATION.animateDuring, ...animateDuring },
    scrollEffect: {
      ...DEFAULT_ANIMATION.scrollEffect,
      ...scrollEffect,
      enabled:
        scrollEffect.enabled === true ||
        scrollEffect.enabled === "true" ||
        scrollEffect.enabled === 1,
    },
    trigger: {
      ...DEFAULT_ANIMATION.trigger,
      ...trigger,
      type: normalizeTriggerType(trigger.type),
    },
  };
}

function resolveNearestScrollContainer(
  el: HTMLElement,
  view: Window
): HTMLElement | null {
  const explicitPreviewRoot = el.closest('[data-preview-scroll-root="true"]');
  if (explicitPreviewRoot instanceof HTMLElement) return explicitPreviewRoot;

  let cur: HTMLElement | null = el.parentElement;
  let styledScrollableFallback: HTMLElement | null = null;
  while (cur) {
    const style = view.getComputedStyle(cur);
    const overflowY = style.overflowY;
    const overflowX = style.overflowX;
    const hasScrollStyle =
      overflowY === "auto" ||
      overflowY === "scroll" ||
      overflowX === "auto" ||
      overflowX === "scroll";
    const canScrollY =
      (overflowY === "auto" || overflowY === "scroll") && cur.scrollHeight > cur.clientHeight + 1;
    const canScrollX =
      (overflowX === "auto" || overflowX === "scroll") && cur.scrollWidth > cur.clientWidth + 1;

    if (canScrollY || canScrollX) return cur;
    if (!styledScrollableFallback && hasScrollStyle) styledScrollableFallback = cur;
    cur = cur.parentElement;
  }
  return styledScrollableFallback;
}

function isElementScrollable(el: HTMLElement | null): boolean {
  if (!el) return false;
  return el.scrollHeight > el.clientHeight + 1 || el.scrollWidth > el.clientWidth + 1;
}

function resolveScrollRoots(
  el: HTMLElement,
  view: Window
): { primary: HTMLElement | null; fallback: HTMLElement | null } {
  // Always check for an explicit preview scroll root first.
  const explicitPreviewRoot = el.closest('[data-preview-scroll-root="true"]');
  if (explicitPreviewRoot instanceof HTMLElement) {
    // Preview root should only be used when it is actually scrollable at current viewport size.
    if (isElementScrollable(explicitPreviewRoot)) {
      return { primary: explicitPreviewRoot, fallback: null };
    }
    return { primary: null, fallback: null };
  }

  // Check if we are inside the builder canvas container. The canvas element is the
  // scroll root in the builder — regardless of whether we're in an iframe or not.
  const canvasContainer = el.closest('[data-canvas-container]');
  if (canvasContainer instanceof HTMLElement && isElementScrollable(canvasContainer)) {
    return { primary: canvasContainer, fallback: null };
  }

  // In the top-level window (not inside an iframe), default to window scroll.
  // This is correct for the preview page, the live site, and any other top-level context.
  // Do NOT walk the DOM here — random overflow:hidden containers will be picked up.
  if (view.parent === view) {
    return { primary: null, fallback: null };
  }

  // Inside an iframe (builder canvas in iframe mode), find the nearest scroll container.
  const nearest = resolveNearestScrollContainer(el, view);
  const primary = nearest && isElementScrollable(nearest) ? nearest : null;
  return { primary, fallback: null };
}

// ─── Easing Map (Framer Motion) ──────────────────────────────────────────────

function mapEasing(easing: EasingType): number[] | string {
  const map: Record<EasingType, number[] | string> = {
    linear: [0, 0, 1, 1],
    easeIn: [0.42, 0, 1, 1],
    easeOut: [0, 0, 0.58, 1],
    easeInOut: [0.42, 0, 0.58, 1],
    circIn: [0.6, 0.04, 0.98, 0.34],
    circOut: [0.08, 0.82, 0.17, 1],
    circInOut: [0.78, 0.14, 0.15, 0.86],
    backIn: [0.6, -0.28, 0.735, 0.045],
    backOut: [0.175, 0.885, 0.32, 1.275],
    backInOut: [0.68, -0.55, 0.265, 1.55],
    anticipate: "anticipate",
  };
  return map[easing] ?? [0, 0, 0.58, 1];
}

// ─── In Animation Variants ───────────────────────────────────────────────────

export function getInVariants(type: AnimateInType, distance: number) {
  const base = { opacity: 0 };
  const variants: Record<AnimateInType, { hidden: Record<string, unknown>; visible: Record<string, unknown> }> = {
    none: { hidden: {}, visible: {} },
    fadeIn: {
      hidden: { opacity: 0 },
      visible: { opacity: 1 },
    },
    slideUp: {
      hidden: { ...base, y: distance },
      visible: { opacity: 1, y: 0 },
    },
    slideDown: {
      hidden: { ...base, y: -distance },
      visible: { opacity: 1, y: 0 },
    },
    slideLeft: {
      hidden: { ...base, x: distance },
      visible: { opacity: 1, x: 0 },
    },
    slideRight: {
      hidden: { ...base, x: -distance },
      visible: { opacity: 1, x: 0 },
    },
    scaleUp: {
      hidden: { ...base, scale: 0.5 },
      visible: { opacity: 1, scale: 1 },
    },
    scaleDown: {
      hidden: { ...base, scale: 1.5 },
      visible: { opacity: 1, scale: 1 },
    },
    rotateIn: {
      hidden: { ...base, rotate: -180 },
      visible: { opacity: 1, rotate: 0 },
    },
    bounceIn: {
      hidden: { ...base, scale: 0.3 },
      visible: {
        opacity: 1,
        scale: 1,
        transition: { type: "spring", stiffness: 300, damping: 15 },
      },
    },
    flipX: {
      hidden: { ...base, rotateX: 90 },
      visible: { opacity: 1, rotateX: 0 },
    },
    flipY: {
      hidden: { ...base, rotateY: 90 },
      visible: { opacity: 1, rotateY: 0 },
    },
    blur: {
      hidden: { opacity: 0, filter: "blur(20px)" },
      visible: { opacity: 1, filter: "blur(0px)" },
    },
  };
  return variants[type] ?? variants.none;
}

// ─── Out Animation Variants ──────────────────────────────────────────────────

export function getOutVariants(type: AnimateOutType, distance: number) {
  const variants: Record<AnimateOutType, { visible: Record<string, unknown>; exit: Record<string, unknown> }> = {
    none: { visible: {}, exit: {} },
    fadeOut: {
      visible: { opacity: 1 },
      exit: { opacity: 0 },
    },
    slideUp: {
      visible: { opacity: 1, y: 0 },
      exit: { opacity: 0, y: -distance },
    },
    slideDown: {
      visible: { opacity: 1, y: 0 },
      exit: { opacity: 0, y: distance },
    },
    slideLeft: {
      visible: { opacity: 1, x: 0 },
      exit: { opacity: 0, x: -distance },
    },
    slideRight: {
      visible: { opacity: 1, x: 0 },
      exit: { opacity: 0, x: distance },
    },
    scaleDown: {
      visible: { opacity: 1, scale: 1 },
      exit: { opacity: 0, scale: 0.5 },
    },
    scaleUp: {
      visible: { opacity: 1, scale: 1 },
      exit: { opacity: 0, scale: 1.5 },
    },
    rotateOut: {
      visible: { opacity: 1, rotate: 0 },
      exit: { opacity: 0, rotate: 180 },
    },
    bounceOut: {
      visible: { opacity: 1, scale: 1 },
      exit: { opacity: 0, scale: 0.3 },
    },
    flipX: {
      visible: { opacity: 1, rotateX: 0 },
      exit: { opacity: 0, rotateX: 90 },
    },
    flipY: {
      visible: { opacity: 1, rotateY: 0 },
      exit: { opacity: 0, rotateY: 90 },
    },
    blur: {
      visible: { opacity: 1, filter: "blur(0px)" },
      exit: { opacity: 0, filter: "blur(20px)" },
    },
  };
  return variants[type] ?? variants.none;
}

// ─── Continuous Animation Keyframes ──────────────────────────────────────────

export function getDuringAnimation(type: AnimateDuringType, duration: number, intensity: number) {
  const i = intensity;
  const animations: Record<AnimateDuringType, Record<string, unknown>> = {
    none: {},
    pulse: {
      scale: [1, 1 + 0.05 * i, 1],
      transition: { duration, repeat: Infinity, ease: "easeInOut" },
    },
    float: {
      y: [0, -10 * i, 0],
      transition: { duration, repeat: Infinity, ease: "easeInOut" },
    },
    spin: {
      rotate: [0, 360],
      transition: { duration, repeat: Infinity, ease: "linear" },
    },
    shake: {
      x: [0, -5 * i, 5 * i, -5 * i, 5 * i, 0],
      transition: { duration: duration * 0.5, repeat: Infinity, ease: "easeInOut" },
    },
    wobble: {
      rotate: [0, -3 * i, 3 * i, -3 * i, 0],
      transition: { duration, repeat: Infinity, ease: "easeInOut" },
    },
    heartbeat: {
      scale: [1, 1.1 * i, 1, 1.15 * i, 1],
      transition: { duration, repeat: Infinity, ease: "easeInOut" },
    },
    breathe: {
      scale: [1, 1 + 0.03 * i, 1],
      opacity: [1, 0.85, 1],
      transition: { duration: duration * 1.5, repeat: Infinity, ease: "easeInOut" },
    },
    glow: {
      boxShadow: [
        `0 0 0px rgba(59, 130, 246, 0)`,
        `0 0 ${20 * i}px rgba(59, 130, 246, 0.5)`,
        `0 0 0px rgba(59, 130, 246, 0)`,
      ],
      transition: { duration, repeat: Infinity, ease: "easeInOut" },
    },
    bounce: {
      y: [0, -15 * i, 0],
      transition: { duration: duration * 0.6, repeat: Infinity, ease: [0.32, 0, 0.67, 0] },
    },
  };
  return animations[type] ?? {};
}

// ─── Scroll Effect (GSAP ScrollTrigger) ──────────────────────────────────────

function useGsapScrollEffect(
  ref: React.RefObject<HTMLElement | null>,
  config: AnimationConfig["scrollEffect"]
) {
  useEffect(() => {
    if (!config.enabled || config.type === "none" || !ref.current) return;

    const el = ref.current;
    if (!el) return;

    const view = el.ownerDocument?.defaultView ?? window;
    const doc = el.ownerDocument ?? document;


    // If we're rendering inside an iframe (builder canvas), the actual scrolling may happen
    // in the parent document on `.canvas-scroll-container` instead of inside the iframe.
    // In that case, proxy the iframe documentElement's scrollTop/Left to the parent scroller.
    let proxiedParentScroller: HTMLElement | null = null;
    try {
      const parentWin = view.parent;
      if (parentWin && parentWin !== view && parentWin.document) {
        proxiedParentScroller =
          (parentWin.document.querySelector("[data-canvas-container]") as HTMLElement | null) ??
          (parentWin.document.querySelector(".canvas-scroll-container") as HTMLElement | null);
      }
    } catch {
      proxiedParentScroller = null;
    }

    const proxyScroller = proxiedParentScroller ? (doc.documentElement as unknown as HTMLElement) : null;
    if (proxiedParentScroller && proxyScroller && !SCROLLER_PROXY_DOCS.has(doc)) {
      SCROLLER_PROXY_DOCS.add(doc);
      const frameEl = view.frameElement as HTMLElement | null;
      ScrollTrigger.scrollerProxy(proxyScroller, {
        scrollTop(value) {
          if (typeof value === "number") proxiedParentScroller!.scrollTop = value;
          return proxiedParentScroller!.scrollTop;
        },
        scrollLeft(value) {
          if (typeof value === "number") proxiedParentScroller!.scrollLeft = value;
          return proxiedParentScroller!.scrollLeft;
        },
        getBoundingClientRect() {
          const width = frameEl?.clientWidth ?? view.innerWidth;
          const height = frameEl?.clientHeight ?? view.innerHeight;
          return { top: 0, left: 0, width, height, right: width, bottom: height } as DOMRect;
        },
        // Pinning isn't used for our effects, but required for consistency.
        pinType: "transform",
      });
    }

    // If the real scroll happens outside the iframe, ScrollTrigger won't receive scroll events
    // from the proxied scroller (documentElement). Bridge scroll/resize to ScrollTrigger.
    const parentScrollHandler = proxiedParentScroller
      ? () => {
          ScrollTrigger.update();
        }
      : null;
    const parentResizeHandler = proxiedParentScroller
      ? () => {
          ScrollTrigger.refresh();
        }
      : null;

    if (proxiedParentScroller && parentScrollHandler) {
      proxiedParentScroller.addEventListener("scroll", parentScrollHandler, { passive: true });
    }
    if (proxiedParentScroller && parentResizeHandler) {
      try {
        view.parent?.addEventListener("resize", parentResizeHandler, { passive: true });
      } catch {
        // ignore
      }
    }

    // Prefer the proxied scroller (iframe -> parent canvas scroll container).
    const { primary: resolvedScroller, fallback: fallbackScroller } = resolveScrollRoots(el, view);
    const scroller = proxyScroller ?? resolvedScroller ?? fallbackScroller;

    const getScrollOffsets = () => {
      if (!scroller) return { x: view.scrollX, y: view.scrollY };
      // If proxied, offsets are the parent scroller's scroll positions.
      if (proxyScroller && proxiedParentScroller) {
        return { x: proxiedParentScroller.scrollLeft, y: proxiedParentScroller.scrollTop };
      }
      return { x: scroller.scrollLeft, y: scroller.scrollTop };
    };

    const getPageRect = () => {
      const rect = el.getBoundingClientRect();
      const scroll = getScrollOffsets();
      return {
        left: rect.left + scroll.x,
        top: rect.top + scroll.y,
      };
    };

    const catmullRom = (p0: number, p1: number, p2: number, p3: number, t: number) => {
      const t2 = t * t;
      const t3 = t2 * t;
      return 0.5 * (
        (2 * p1) +
        (-p0 + p2) * t +
        (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 +
        (-p0 + 3 * p1 - 3 * p2 + p3) * t3
      );
    };

    const sampleSpline = (
      points: Array<{ x: number; y: number }>,
      t: number
    ): { x: number; y: number } => {
      const n = points.length;
      if (n === 0) return { x: 0, y: 0 };
      if (n === 1) return points[0];
      const clamped = Math.min(1, Math.max(0, t));
      const scaled = clamped * (n - 1);
      const i = Math.floor(scaled);
      const localT = scaled - i;

      const p0 = points[Math.max(0, i - 1)];
      const p1 = points[i];
      const p2 = points[Math.min(n - 1, i + 1)];
      const p3 = points[Math.min(n - 1, i + 2)];

      return {
        x: catmullRom(p0.x, p1.x, p2.x, p3.x, localT),
        y: catmullRom(p0.y, p1.y, p2.y, p3.y, localT),
      };
    };

    const computeFreeMoveKeyframes = (): Array<{ at: number; x: number; y: number }> => {
      const direct = config.freeMove?.keyframes;
      const start = config.freeMove?.start;
      const mids = config.freeMove?.mids;
      const end = config.freeMove?.end;
      const mode = config.freeMove?.mode ?? "relative";
      const capturedOrigin = config.freeMove?.origin;

      // Always use relative mode for smooth, accurate keyframes
      // Keyframes are always relative to the captured origin (start position)
      const origin = capturedOrigin ?? start ?? { x: 0, y: 0 };
      const points: Array<{ x: number; y: number }> = [];
      if (start) points.push({ x: start.x, y: start.y });
      if (Array.isArray(mids)) {
        for (const m of mids) points.push({ x: m.x, y: m.y });
      }
      if (end) points.push({ x: end.x, y: end.y });
      if (points.length < 2) return [];

      // Normalize all points relative to the origin (start)
      const relPoints = points.map((p) => ({ x: p.x - origin.x, y: p.y - origin.y }));
      const last = relPoints.length - 1;
      const frames = relPoints.map((p, idx) => ({
        at: last === 0 ? 0 : idx / last,
        x: p.x,
        y: p.y,
      }));

      // Ensure we have distinct progress points
      const dedup: Array<{ at: number; x: number; y: number }> = [];
      for (const f of frames) {
        if (dedup.length === 0 || Math.abs(dedup[dedup.length - 1].at - f.at) > 1e-6) {
          dedup.push(f);
        } else {
          dedup[dedup.length - 1] = f;
        }
      }

      // After setting End, always reset the component to the Start position
      if (end && el) {
        gsap.set(el, { x: 0, y: 0, force3D: true });
      }

      return dedup.length >= 2 ? dedup : [];
    };

    const intensity =
      typeof config.intensity === "number" && Number.isFinite(config.intensity)
        ? Math.max(0, Math.min(2, config.intensity))
        : 1;

    if (config.type === "freeMove") {
      const keyframes = computeFreeMoveKeyframes();
      if (keyframes.length === 0) return;

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: el,
          scroller: scroller ?? undefined,
          start: config.start,
          end: config.end,
          scrub: config.scrub ? Math.max(0.05, Math.min(2, intensity)) : false,
          immediateRender: false,
          invalidateOnRefresh: true,
        },
      });

      // Map progress-based keyframes to the scrubbed timeline
      keyframes.forEach((kf, idx) => {
        if (idx === 0) {
          tl.set(el, { x: kf.x, y: kf.y, force3D: true });
        } else {
          const prev = keyframes[idx - 1];
          const duration = kf.at - prev.at;
          tl.to(el, {
            x: kf.x,
            y: kf.y,
            duration,
            ease: "none", // Linear segments since keyframes are sampled/progress-based
            force3D: true,
          }, prev.at);
        }
      });

      ScrollTrigger.refresh();
      const settleRefresh = view.setTimeout(() => ScrollTrigger.refresh(), 50);

      return () => {
        tl.kill();
        view.clearTimeout(settleRefresh);
        ScrollTrigger.getAll().forEach((t) => {
          if (t.trigger === el) t.kill();
        });
        if (proxiedParentScroller && parentScrollHandler) {
          proxiedParentScroller.removeEventListener("scroll", parentScrollHandler as EventListener);
        }
        if (parentResizeHandler) {
          try {
            view.parent?.removeEventListener("resize", parentResizeHandler as EventListener);
          } catch {
            // ignore
          }
        }
      };
    } else {
      // Use a natural ease for all scroll effects for a clean, smooth feel
      const naturalEase = config.scrub ? "none" : "power1.inOut";
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: el,
          scroller: scroller ?? undefined,
          start: config.start,
          end: config.end,
          scrub: config.scrub ? Math.max(0.05, Math.min(2, intensity)) : false,
          immediateRender: false,
          invalidateOnRefresh: true,
        },
        defaults: { ease: naturalEase },
      });
      const { from, to } = getScrollEffectRange(config);
      // Clamp and round all numeric values for pixel-perfect movement
      const clampObj = (obj: Record<string, unknown>) => {
        const out: Record<string, unknown> = {};
        for (const k in obj) {
          const v = obj[k];
          if (typeof v === 'number') out[k] = Math.round(v * 1000) / 1000;
          else out[k] = v;
        }
        return out;
      };
      // If rotate effect, set transformOrigin to center for true rotation
      if (config.type === "rotate") {
        gsap.set(el, { transformOrigin: "50% 50%" });
      }
      tl.fromTo(el, clampObj(from), {
        ...clampObj(to),
        // Use a natural ease for all effects
        ease: naturalEase,
        ...(config.type === "rotate" ? { transformOrigin: "50% 50%" } : {}),
      });
      ScrollTrigger.refresh();
      const settleRefresh = view.setTimeout(() => ScrollTrigger.refresh(), 50);

      return () => {
        tl.kill();
        view.clearTimeout(settleRefresh);
        ScrollTrigger.getAll().forEach((t) => {
          if (t.trigger === el) t.kill();
        });
        if (proxiedParentScroller && parentScrollHandler) {
          proxiedParentScroller.removeEventListener("scroll", parentScrollHandler as EventListener);
        }
        if (parentResizeHandler) {
          try {
            view.parent?.removeEventListener("resize", parentResizeHandler as EventListener);
          } catch {
            // ignore
          }
        }
      };
    }
  }, [
    ref,
    config.enabled,
    config.type,
    config.speed,
    config.direction,
    config.scrub,
    config.start,
    config.end,
    config.freeMove?.start?.x,
    config.freeMove?.start?.y,
    config.freeMove?.end?.x,
    config.freeMove?.end?.y,
    config.freeMove?.mids,
    config.freeMove?.keyframes,
    config.freeMove?.mode,
    config.intensity,
  ]);
}

export function getScrollEffectTweenProps(
  config: AnimationConfig["scrollEffect"]
): Record<string, unknown> {
  return getScrollEffectRange(config).to;
}

export function getScrollEffectRange(config: AnimationConfig["scrollEffect"]): {
  from: Record<string, unknown>;
  to: Record<string, unknown>;
} {
  // Clamp and normalize speed for all effects
  const speed = Math.max(-2, Math.min(2, typeof config.speed === 'number' && Number.isFinite(config.speed) ? config.speed : 1));
  const isVertical = config.direction === "vertical";
  const from: Record<string, unknown> = {};
  const to: Record<string, unknown> = {};

  switch (config.type as ScrollEffectType) {
    case "parallax": {
      // Parallax: always proportional to scroll, never overshoots
      const maxDist = 150;
      const p = speed * maxDist;
      if (isVertical) {
        from.y = -Math.abs(p);
        to.y = Math.abs(p);
      } else {
        from.x = -Math.abs(p);
        to.x = Math.abs(p);
      }
      break;
    }
    case "fade":
      // Fade: always 0→1 or 1→0
      from.opacity = speed >= 0 ? 0 : 1;
      to.opacity = speed >= 0 ? 1 : 0;
      break;
    case "scale": {
      // Scale: always from 1 to 1+s or reverse
      const s = Math.abs(speed) * 0.5;
      from.scale = speed >= 0 ? 1 : 1 + s;
      to.scale = speed >= 0 ? 1 + s : 1;
      break;
    }
    case "rotate": {
      // Rotate: always -r to r
      const r = Math.abs(speed) * 180;
      from.rotation = -r;
      to.rotation = r;
      break;
    }
    case "blur": {
      // Blur: always from blur to clear
      const b = Math.abs(speed) * 20;
      from.filter = `blur(${b}px)`;
      to.filter = "blur(0px)";
      break;
    }
    case "horizontalMove": {
      // Horizontal move: always -h to h
      const h = Math.abs(speed) * 300;
      from.x = -h;
      to.x = h;
      break;
    }
    case "freeMove": {
      // FreeMove fallback: always proportional to scroll, never overshoots
      const start = config.freeMove?.start;
      const end = config.freeMove?.end;
      if (start && end) {
        const dx = (end.x - start.x);
        const dy = (end.y - start.y);
        from.x = 0;
        from.y = 0;
        to.x = speed * dx;
        to.y = speed * dy;
      }
      break;
    }
    case "skew": {
      // Skew: always -sk to sk
      const sk = Math.abs(speed) * 25;
      if (isVertical) {
        from.skewY = -sk;
        to.skewY = sk;
      } else {
        from.skewX = -sk;
        to.skewX = sk;
      }
      break;
    }
    case "reveal":
      // Reveal: always from clipped to revealed
      from.clipPath = speed >= 0 ? "inset(0% 100% 0% 0%)" : "inset(100% 0% 0% 0%)";
      to.clipPath = "inset(0% 0% 0% 0%)";
      break;
    case "zoom": {
      // Zoom: always from 1 to 1+z
      const zScale = Math.abs(speed) * 1.5;
      const zDepth = speed * 200;
      from.scale = 1;
      from.z = -zDepth;
      to.scale = 1 + zScale;
      to.z = zDepth;
      break;
    }
    case "tilt3d": {
      // Tilt3d: always -t to t
      const t = Math.abs(speed) * 35;
      from.rotationX = -t;
      from.rotationY = isVertical ? 0 : -t;
      from.transformPerspective = 1200;
      to.rotationX = t;
      to.rotationY = isVertical ? 0 : t;
      to.transformPerspective = 1200;
      break;
    }
  }

  // Backward-compat: if persisted configs still contain the old "customMove" type,
  // treat it as "none" by returning empty tween vars.
  return { from, to };
}

// ─── AnimationWrapper Component ──────────────────────────────────────────────

interface AnimationWrapperProps {
  animation?: AnimationConfig;
  children: React.ReactNode;
  style?: React.CSSProperties;
  className?: string;
  as?: keyof React.JSX.IntrinsicElements;
}

export function AnimationWrapper({
  animation,
  children,
  style,
  className,
  as = "div",
}: AnimationWrapperProps) {
  const config = useMemo(() => normalizeAnimationConfig(animation), [animation]);

  const hasIn = config.animateIn.type !== "none";
  const hasOut = config.animateOut.type !== "none";
  const hasDuring = config.animateDuring.type !== "none";
  const hasScroll = config.scrollEffect.enabled && config.scrollEffect.type !== "none";
  const hasAny = hasIn || hasOut || hasDuring || hasScroll;

  const ref = useRef<HTMLDivElement>(null);
  const [inViewRoot, setInViewRoot] = useState<Element | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const view = el.ownerDocument?.defaultView ?? window;
    const { primary, fallback } = resolveScrollRoots(el, view);
    setInViewRoot(primary ?? fallback);
  }, []);

  const isInView = useInView(ref, {
    root: inViewRootRef,
    once: config.trigger.once,
    amount: config.trigger.threshold,
  });

  const [hasTriggered, setHasTriggered] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isClicked, setIsClicked] = useState(false);

  useEffect(() => {
    if (config.trigger.type === "onLoad") {
      setHasTriggered(true);
    } else if (config.trigger.type === "onScroll" && isInView) {
      setHasTriggered(true);
    }
  }, [config.trigger.type, isInView]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (el.ownerDocument !== document) {
      setHasTriggered(true);
    }
  }, []);

  const shouldAnimate =
    config.trigger.type === "onLoad"
      ? hasTriggered
      : config.trigger.type === "onScroll"
        ? hasTriggered
        : config.trigger.type === "onHover"
          ? isHovered
          : config.trigger.type === "onClick"
            ? isClicked
            : false;

  useGsapScrollEffect(ref, config.scrollEffect);

  if (!hasAny) {
    return <>{children}</>;
  }

  const inVariants = getInVariants(config.animateIn.type, config.animateIn.distance);
  const outVariants = getOutVariants(config.animateOut.type, config.animateOut.distance);
  const duringAnim = getDuringAnimation(
    config.animateDuring.type,
    config.animateDuring.duration,
    config.animateDuring.intensity
  );

  const inTransition = hasIn
    ? {
      duration: config.animateIn.duration,
      delay: config.animateIn.delay,
      ease: mapEasing(config.animateIn.easing),
    }
    : {};

  const combinedInitial = hasIn ? inVariants.hidden : {};
  const combinedAnimate = {
    ...(shouldAnimate && hasIn ? inVariants.visible : {}),
    ...(shouldAnimate && hasDuring ? duringAnim : {}),
    ...(!shouldAnimate && hasIn ? inVariants.hidden : {}),
  };

  const MotionComponent = motion[as as "div"] ?? motion.div;

  // Optimization: Don't use willChange for continuous animations (pulse, float, spin, etc.)
  // These cause excessive paint/layout thrashing, especially during zoom or previews.
  // Only set willChange for entrance/exit animations which are one-time events.
  const shouldUseWillChange = hasIn || hasOut;

  return (
    <MotionComponent
      ref={ref}
      className={className}
      style={{ ...style, willChange: shouldUseWillChange ? "transform, opacity" : undefined }}
      initial={combinedInitial as any}
      animate={combinedAnimate as any}
      exit={hasOut ? (outVariants.exit as any) : undefined}
      transition={inTransition as any}
      onHoverStart={config.trigger.type === "onHover" ? () => setIsHovered(true) : undefined}
      onHoverEnd={config.trigger.type === "onHover" ? () => setIsHovered(false) : undefined}
      onTap={config.trigger.type === "onClick" ? () => setIsClicked((c) => !c) : undefined}
    >
      {children}
    </MotionComponent>
  );
}

// ─── Utility: check if animation config has any active animations ────────────

export function hasActiveAnimation(animation?: AnimationConfig): boolean {
  if (!animation) return false;
  const normalized = normalizeAnimationConfig(animation);
  return (
    normalized.animateIn?.type !== "none" ||
    normalized.animateOut?.type !== "none" ||
    normalized.animateDuring?.type !== "none" ||
    (normalized.scrollEffect?.enabled && normalized.scrollEffect?.type !== "none")
  );
}
