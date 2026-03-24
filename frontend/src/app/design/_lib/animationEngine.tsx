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
  // Preview page runs in the top window (not iframe). To keep behavior stable across
  // browser zoom levels, always use window scroll there.
  if (view.parent === view) {
    return { primary: null, fallback: null };
  }

  const explicitPreviewRoot = el.closest('[data-preview-scroll-root="true"]');
  if (explicitPreviewRoot instanceof HTMLElement) {
    // Preview root should only be used when it is actually scrollable at current viewport size.
    // Otherwise, scrolling is happening on the window and we should not force a custom root.
    if (isElementScrollable(explicitPreviewRoot)) {
      return { primary: explicitPreviewRoot, fallback: null };
    }
    return { primary: null, fallback: null };
  }

  const nearest = resolveNearestScrollContainer(el, view);
  const primary = nearest && isElementScrollable(nearest) ? nearest : null;
  const fallback = null;
  return { primary, fallback };
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
      const mode = config.freeMove?.mode ?? "absolute";
      const capturedOrigin = config.freeMove?.origin;

      const raw: Array<{ t: number; x: number; y: number }> =
        Array.isArray(direct) && direct.length >= 2
          ? direct
          : start && end
            ? (() => {
              const midPoints = Array.isArray(mids) ? mids : [];
              const points: Array<{ x: number; y: number }> = [start, ...midPoints, end];
              if (points.length < 2) return [];
              const last = points.length - 1;
              return points.map((p, idx) => ({
                t: last === 0 ? 0 : idx / last,
                x: p.x,
                y: p.y,
              }));
            })()
            : [];

      if (raw.length < 2) return [];

      // Compute transform offsets relative to the element's layout position (page coords).
      // At scroll start (progress 0) the element will appear at captured "start".
      const page = getPageRect();
      const baseX = Number(gsap.getProperty(el, "x")) || 0;
      const baseY = Number(gsap.getProperty(el, "y")) || 0;
      const anchorFromFrames = raw[0] ? { x: raw[0].x, y: raw[0].y } : null;
      const absoluteAnchor = capturedOrigin ?? start ?? anchorFromFrames ?? { x: page.left, y: page.top };
      const toOffset = (p: { x: number; y: number }) => ({
        // FreeMove should be exact regardless of Speed/Intensity.
        // Speed is still used by other scroll effects, but FreeMove uses 1:1 mapping.
        // IMPORTANT: preserve any existing transform set by the builder by adding deltas
        // instead of overwriting absolute x/y.
        x: baseX + (mode === "relative" ? p.x : (p.x - absoluteAnchor.x)),
        y: baseY + (mode === "relative" ? p.y : (p.y - absoluteAnchor.y)),
      });

      const frames = raw
        .map((k) => ({
          at: Math.min(1, Math.max(0, k.t)),
          ...toOffset({ x: k.x, y: k.y }),
        }))
        .sort((a, b) => a.at - b.at);

      // Ensure we have distinct progress points
      const dedup: Array<{ at: number; x: number; y: number }> = [];
      for (const f of frames) {
        if (dedup.length === 0 || Math.abs(dedup[dedup.length - 1].at - f.at) > 1e-6) {
          dedup.push(f);
        } else {
          dedup[dedup.length - 1] = f;
        }
      }
      return dedup.length >= 2 ? dedup : [];
    };

    const intensity =
      typeof config.intensity === "number" && Number.isFinite(config.intensity)
        ? Math.max(0, Math.min(2, config.intensity))
        : 1;

    if (config.type === "freeMove") {
      const frames = computeFreeMoveKeyframes();
      if (frames.length >= 2) {
        // Use smooth spline sampling over scroll progress (no sharp corners).
        const points = frames.map((f) => ({ x: f.x, y: f.y }));
        const speed = typeof config.speed === "number" && Number.isFinite(config.speed) ? config.speed : 1;
        const speedAbs = Math.max(0, Math.min(2, Math.abs(speed)));
        const followBase = (() => {
          if (speedAbs <= 0.05) return 0.02;
          if (speedAbs >= 1.95) return 1;
          return Math.max(0.02, Math.min(0.75, 0.05 + speedAbs * 0.35));
        })();
        const intensityNorm = intensity / 2; // 0..1
        const follow = Math.max(0.01, Math.min(1, followBase * (1 - 0.85 * intensityNorm)));

        let targetProgress = 0;
        let currentProgress = 0;
        let tickerAdded = false;
        let initializedFromScroll = false;
        let hasUserScrolled = false;
        const scrollEventTarget = (scroller ?? view) as EventTarget;

        // On initial load, set element to start position
        const p0 = sampleSpline(points, 0);
        gsap.set(el, { x: p0.x, y: p0.y, force3D: true });

        const markScrolled = () => {
          if (!hasUserScrolled) {
            hasUserScrolled = true;
            if (!tickerAdded) {
              tickerAdded = true;
              gsap.ticker.add(tick);
            }
          }
        };
        if (scrollEventTarget && "addEventListener" in (scrollEventTarget as any)) {
          (scrollEventTarget as any).addEventListener("scroll", markScrolled, { passive: true });
          (scrollEventTarget as any).addEventListener("wheel", markScrolled, { passive: true });
          (scrollEventTarget as any).addEventListener("touchmove", markScrolled, { passive: true });
        }

        const tick = () => {
          if (!initializedFromScroll || !hasUserScrolled) return;
          if (process.env.NODE_ENV !== 'production') {
            // eslint-disable-next-line no-console
            console.log('[freeMove] speed:', speed, 'targetProgress:', targetProgress, 'currentProgress:', currentProgress);
          }
          if (follow >= 1) {
            currentProgress = targetProgress;
          } else {
            currentProgress += (targetProgress - currentProgress) * follow;
          }
          currentProgress = Math.max(0, Math.min(1, currentProgress));
          const p = sampleSpline(points, currentProgress);
          gsap.set(el, { x: p.x, y: p.y, force3D: true });
        };

        const st = ScrollTrigger.create({
          trigger: el,
          scroller: scroller ?? undefined,
          start: config.start,
          end: config.end,
          scrub: false,
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            if (!initializedFromScroll) {
              initializedFromScroll = true;
              if (speed < 0) {
                currentProgress = 1 - self.progress;
                targetProgress = 1 - self.progress;
              } else {
                currentProgress = self.progress;
                targetProgress = self.progress;
              }
            } else {
              if (speed < 0) {
                targetProgress = 1 - self.progress;
              } else {
                targetProgress = self.progress;
              }
              targetProgress = Math.max(0, Math.min(1, targetProgress));
            }
          },
        });
        ScrollTrigger.refresh();
        const settleRefresh = view.setTimeout(() => ScrollTrigger.refresh(), 50);

        return () => {
          if (tickerAdded) gsap.ticker.remove(tick);
          st.kill();
          view.clearTimeout(settleRefresh);
          if (scrollEventTarget && "removeEventListener" in (scrollEventTarget as any)) {
            (scrollEventTarget as any).removeEventListener("scroll", markScrolled as EventListener);
            (scrollEventTarget as any).removeEventListener("wheel", markScrolled as EventListener);
            (scrollEventTarget as any).removeEventListener("touchmove", markScrolled as EventListener);
          }
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
      return;
    } else {
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
      const { from, to } = getScrollEffectRange(config);
      tl.fromTo(el, from, {
        ...to,
        ease: "none",
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
    root: inViewRoot,
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

  return (
    <MotionComponent
      ref={ref}
      className={className}
      style={{ ...style, willChange: hasAny ? "transform, opacity" : undefined }}
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
