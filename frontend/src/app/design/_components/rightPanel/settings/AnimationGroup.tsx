"use client";

import React, { useCallback, useEffect, useMemo, useRef } from "react";
import { useEditor } from "@craftjs/core";
import { Play } from "lucide-react";
import gsap from "gsap";
import { DesignSection } from "./DesignSection";
import { getInVariants, getOutVariants, getDuringAnimation, getScrollEffectTweenProps, getScrollEffectRange } from "../../../_lib/animationEngine";
import {
  DEFAULT_ANIMATION,
  ANIMATE_IN_LABELS,
  ANIMATE_OUT_LABELS,
  ANIMATE_DURING_LABELS,
  EASING_LABELS,
  SCROLL_EFFECT_LABELS,
  TRIGGER_LABELS,
} from "../../../_types/animation";
import type {
  AnimationConfig,
  AnimateInType,
  AnimateOutType,
  AnimateDuringType,
  EasingType,
  ScrollEffectType,
  TriggerType,
} from "../../../_types/animation";

const selectClass =
  "w-full bg-[var(--builder-surface-2)] rounded-md text-xs text-[var(--builder-text)] px-2.5 py-1.5 focus:outline-none appearance-none cursor-pointer";
const labelClass = "text-[12px] text-[var(--builder-text)] font-base";
const subLabelClass = "text-[10px] text-[var(--builder-text-muted)]";
const sliderClass = "w-full accent-[var(--builder-accent)] cursor-pointer";
const checkboxClass = "accent-[var(--builder-accent)] cursor-pointer";

function getAnimation(props: Record<string, unknown>): AnimationConfig {
  const raw = props.animation as AnimationConfig | undefined;
  if (!raw) return { ...DEFAULT_ANIMATION };
  return {
    animateIn: { ...DEFAULT_ANIMATION.animateIn, ...(raw.animateIn ?? {}) },
    animateOut: { ...DEFAULT_ANIMATION.animateOut, ...(raw.animateOut ?? {}) },
    animateDuring: { ...DEFAULT_ANIMATION.animateDuring, ...(raw.animateDuring ?? {}) },
    scrollEffect: { ...DEFAULT_ANIMATION.scrollEffect, ...(raw.scrollEffect ?? {}) },
    trigger: { ...DEFAULT_ANIMATION.trigger, ...(raw.trigger ?? {}) },
  };
}

/** Deep-clone animation config so we can mutate it without touching Craft.js frozen state. */
function cloneAnimation(config: AnimationConfig): AnimationConfig {
  return JSON.parse(JSON.stringify(config));
}

function setAtPath(obj: Record<string, unknown>, path: string, value: unknown): void {
  const keys = path.split(".");
  let target: Record<string, unknown> = obj;
  for (let i = 0; i < keys.length - 1; i++) {
    const k = keys[i];
    const next = target[k] as Record<string, unknown> | undefined;
    if (!next || typeof next !== "object") {
      target[k] = {};
      target = target[k] as Record<string, unknown>;
    } else {
      target = next;
    }
  }
  target[keys[keys.length - 1]] = value;
}

interface AnimationGroupProps {
  selectedIds: string[];
}

type PreviewPhase = "in" | "out" | "during" | "scrollEffect";

function easingToCss(easing: EasingType): string {
  const map: Record<EasingType, string> = {
    linear: "linear",
    easeIn: "cubic-bezier(0.42,0,1,1)",
    easeOut: "cubic-bezier(0,0,0.58,1)",
    easeInOut: "cubic-bezier(0.42,0,0.58,1)",
    circIn: "cubic-bezier(0.6,0.04,0.98,0.34)",
    circOut: "cubic-bezier(0.08,0.82,0.17,1)",
    circInOut: "cubic-bezier(0.78,0.14,0.15,0.86)",
    backIn: "cubic-bezier(0.6,-0.28,0.735,0.045)",
    backOut: "cubic-bezier(0.175,0.885,0.32,1.275)",
    backInOut: "cubic-bezier(0.68,-0.55,0.265,1.55)",
    anticipate: "cubic-bezier(0.4,0,0.2,1)",
  };
  return map[easing] ?? "ease";
}

function normalizeWebAnimationEasing(raw: string | undefined): string {
  if (!raw) return "ease-in-out";
  const value = raw.trim();
  if (!value) return "ease-in-out";

  const map: Record<string, string> = {
    linear: "linear",
    ease: "ease",
    easein: "ease-in",
    easeout: "ease-out",
    easeinout: "ease-in-out",
    "ease-in": "ease-in",
    "ease-out": "ease-out",
    "ease-in-out": "ease-in-out",
    "step-start": "step-start",
    "step-end": "step-end",
  };

  const compact = value.toLowerCase().replace(/[\s_-]/g, "");
  if (map[compact]) return map[compact];
  if (map[value.toLowerCase()]) return map[value.toLowerCase()];

  const lower = value.toLowerCase();
  if (lower.startsWith("cubic-bezier(") || lower.startsWith("steps(")) {
    return value;
  }

  return "ease-in-out";
}

function buildTransformFromState(state: Record<string, unknown>): string | undefined {
  const parts: string[] = [];
  if (typeof state.x === "number") parts.push(`translateX(${state.x}px)`);
  if (typeof state.y === "number") parts.push(`translateY(${state.y}px)`);
  if (typeof state.scale === "number") parts.push(`scale(${state.scale})`);
  if (typeof state.scaleX === "number") parts.push(`scaleX(${state.scaleX})`);
  if (typeof state.scaleY === "number") parts.push(`scaleY(${state.scaleY})`);
  if (typeof state.rotate === "number") parts.push(`rotate(${state.rotate}deg)`);
  if (typeof state.rotateX === "number") parts.push(`rotateX(${state.rotateX}deg)`);
  if (typeof state.rotateY === "number") parts.push(`rotateY(${state.rotateY}deg)`);
  return parts.length > 0 ? parts.join(" ") : undefined;
}

function stateToKeyframe(state: Record<string, unknown>): Keyframe {
  const frame: Keyframe = {};
  const transform = buildTransformFromState(state);
  if (transform) frame.transform = transform;
  if (typeof state.opacity === "number") frame.opacity = state.opacity;
  if (typeof state.filter === "string") frame.filter = state.filter;
  if (typeof state.boxShadow === "string") frame.boxShadow = state.boxShadow;
  return frame;
}

function toKeyframeState(input: Record<string, unknown>): Record<string, unknown> {
  const out = { ...input };
  delete out.transition;
  return out;
}

function parseDuringKeyframes(input: Record<string, unknown>): Keyframe[] {
  const state = { ...input };
  delete state.transition;

  const props = Object.entries(state);
  if (props.length === 0) return [];

  const maxFrames = props.reduce((max, [, value]) => {
    if (Array.isArray(value)) return Math.max(max, value.length);
    return max;
  }, 0);

  if (maxFrames <= 0) return [];

  const frames: Keyframe[] = Array.from({ length: maxFrames }, () => ({}));

  for (const [key, value] of props) {
    if (!Array.isArray(value)) {
      frames.forEach((frame) => {
        (frame as Record<string, unknown>)[key] = value;
      });
      continue;
    }
    for (let i = 0; i < frames.length; i++) {
      const frameValue = value[Math.min(i, value.length - 1)];
      (frames[i] as Record<string, unknown>)[key] = frameValue;
    }
  }

  const normalized = frames.map((frame) => {
    const record = frame as Record<string, unknown>;
    const transformParts: string[] = [];
    if (typeof record.x === "number") transformParts.push(`translateX(${record.x}px)`);
    if (typeof record.y === "number") transformParts.push(`translateY(${record.y}px)`);
    if (typeof record.scale === "number") transformParts.push(`scale(${record.scale})`);
    if (typeof record.rotate === "number") transformParts.push(`rotate(${record.rotate}deg)`);

    const next: Keyframe = {};
    if (transformParts.length > 0) next.transform = transformParts.join(" ");
    if (typeof record.opacity === "number") next.opacity = record.opacity;
    if (typeof record.filter === "string") next.filter = record.filter;
    if (typeof record.boxShadow === "string") next.boxShadow = record.boxShadow;
    return next;
  });

  return normalized;
}

function asNumber(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number.parseFloat(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return 0;
}

function getDomXY(el: HTMLElement): { x: number; y: number } {
  const view = el.ownerDocument?.defaultView ?? window;
  const rect = el.getBoundingClientRect();
  return { x: rect.left + view.scrollX, y: rect.top + view.scrollY };
}

function getEffectiveZoom(el: HTMLElement | null): number {
  if (!el) return 1;
  let zoom = 1;
  let current: HTMLElement | null = el;
  while (current) {
    const zoomText = window.getComputedStyle(current).getPropertyValue("zoom");
    const parsed = parseFloat(zoomText);
    if (Number.isFinite(parsed) && parsed > 0) zoom *= parsed;
    current = current.parentElement;
  }
  const rect = el.getBoundingClientRect();
  const baseWidth = el.offsetWidth || el.clientWidth || 0;
  const baseHeight = el.offsetHeight || el.clientHeight || 0;
  const scaleX = baseWidth > 0 ? rect.width / baseWidth : 1;
  const scaleY = baseHeight > 0 ? rect.height / baseHeight : 1;
  const transformScale =
    Number.isFinite(scaleX) && Number.isFinite(scaleY) ? (scaleX + scaleY) / 2 : 1;
  const effective = zoom * transformScale;
  return effective > 0.01 ? effective : 1;
}

function countMids(value: unknown): number {
  return Array.isArray(value) ? value.length : 0;
}

function toFixedPoint(value: number): number {
  return Math.round(value * 1000) / 1000;
}

function getScrollPreviewDuration(speed: unknown): number {
  if (typeof speed !== "number" || !Number.isFinite(speed)) return 0.8;
  const magnitude = Math.max(0.15, Math.min(2, Math.abs(speed)));
  // Higher speed => shorter preview duration (faster movement)
  return Math.max(0.25, Math.min(1.6, 0.9 / magnitude));
}

function applyScrollPreviewIndicator(element: HTMLElement): () => void {
  const prevOutline = element.style.outline;
  const prevOutlineOffset = element.style.outlineOffset;
  const prevTransition = element.style.transition;

  element.style.transition = prevTransition
    ? `${prevTransition}, outline-color 140ms ease`
    : "outline-color 140ms ease";
  element.style.outline = "2px solid #a855f7";
  element.style.outlineOffset = "2px";

  return () => {
    element.style.outline = prevOutline;
    element.style.outlineOffset = prevOutlineOffset;
    element.style.transition = prevTransition;
  };
}

export const AnimationGroup = ({ selectedIds }: AnimationGroupProps) => {
  const firstId = selectedIds[0];
  const animation = useEditor((state) =>
    getAnimation(state.nodes[firstId]?.data?.props ?? {})
  );
  const { actions, query } = useEditor();
  const playingAnimationRef = useRef<Animation | null>(null);
  const scrollPreviewTimelineRef = useRef<gsap.core.Timeline | null>(null);
  const restoreScrollIndicatorRef = useRef<(() => void) | null>(null);
  const debounceTimersRef = useRef<Record<PreviewPhase, number | null>>({
    in: null,
    out: null,
    during: null,
    scrollEffect: null,
  });

  const update = useCallback(
    (path: string, value: unknown) => {
      selectedIds.forEach((nodeId) => {
        actions.setProp(nodeId, (props: Record<string, unknown>) => {
          const current = getAnimation(props);
          const next = cloneAnimation(current);
          setAtPath(next as unknown as Record<string, unknown>, path, value);
          props.animation = next;
        });
      });
    },
    [actions, selectedIds]
  );

  const previewOnCanvas = useCallback(
    (phase: PreviewPhase, overrideType?: AnimateInType | AnimateOutType | AnimateDuringType | ScrollEffectType) => {
      if (!firstId) return;

      let element: HTMLElement | null = null;
      try {
        element = query.node(firstId).get()?.dom ?? null;
      } catch {
        element = null;
      }
      if (!element) return;

      if (playingAnimationRef.current) {
        playingAnimationRef.current.cancel();
        playingAnimationRef.current = null;
      }
      if (scrollPreviewTimelineRef.current) {
        scrollPreviewTimelineRef.current.kill();
        scrollPreviewTimelineRef.current = null;
      }
      if (restoreScrollIndicatorRef.current) {
        restoreScrollIndicatorRef.current();
        restoreScrollIndicatorRef.current = null;
      }

      // Explicitly clear any residual GSAP/Inline styles from previous previews
      gsap.set(element, { clearProps: "transform,opacity,filter,clip-path,transformOrigin" });

      const current = animation;
      let webAnimation: Animation | null = null;

      if (phase === "in") {
        const type = (overrideType as AnimateInType | undefined) ?? current.animateIn.type;
        if (type === "none") return;
        const variants = getInVariants(type, current.animateIn.distance);
        const hidden = toKeyframeState(variants.hidden);
        const visible = toKeyframeState(variants.visible);
        const keyframes: Keyframe[] = [stateToKeyframe(hidden), stateToKeyframe(visible)];
        webAnimation = element.animate(keyframes, {
          duration: Math.max(1, current.animateIn.duration * 1000),
          delay: Math.max(0, current.animateIn.delay * 1000),
          easing: easingToCss(current.animateIn.easing),
          fill: "forwards",
        });
      }

      if (phase === "out") {
        const type = (overrideType as AnimateOutType | undefined) ?? current.animateOut.type;
        if (type === "none") return;
        const variants = getOutVariants(type, current.animateOut.distance);
        const visible = toKeyframeState(variants.visible);
        const exit = toKeyframeState(variants.exit);
        const keyframes: Keyframe[] = [stateToKeyframe(visible), stateToKeyframe(exit)];
        webAnimation = element.animate(keyframes, {
          duration: Math.max(1, current.animateOut.duration * 1000),
          delay: Math.max(0, current.animateOut.delay * 1000),
          easing: easingToCss(current.animateOut.easing),
          fill: "forwards",
        });
      }

      if (phase === "during") {
        const type = (overrideType as AnimateDuringType | undefined) ?? current.animateDuring.type;
        if (type === "none") return;
        const duringConfig = getDuringAnimation(type, current.animateDuring.duration, current.animateDuring.intensity);
        const keyframes = parseDuringKeyframes(duringConfig as Record<string, unknown>);
        if (keyframes.length === 0) return;

        const transition = (duringConfig as Record<string, unknown>).transition as Record<string, unknown> | undefined;
        const durationSeconds = typeof transition?.duration === "number"
          ? transition.duration
          : current.animateDuring.duration;
        const easing = normalizeWebAnimationEasing(
          typeof transition?.ease === "string" ? transition.ease : "ease-in-out"
        );

        webAnimation = element.animate(keyframes, {
          duration: Math.max(1, durationSeconds * 1000),
          easing,
          iterations: 2,
          fill: "forwards",
        });
      }

      if (phase === "scrollEffect") {
        const nextType = (overrideType as ScrollEffectType | undefined) ?? current.scrollEffect.type;
        if (!current.scrollEffect.enabled || nextType === "none") return;

        const scrollConfig = {
          ...current.scrollEffect,
          type: nextType,
        };
        let from: Record<string, unknown> = {};
        let to: Record<string, unknown> = {};
        if (nextType === "freeMove") {
          const start = scrollConfig.freeMove?.start;
          const end = scrollConfig.freeMove?.end;
          if (!start || !end) return;

          const mids = (scrollConfig.freeMove?.mids ?? []) as Array<{ x: number; y: number }>;
          const points: Array<{ x: number; y: number }> = [start, ...mids, end];

          const view = element.ownerDocument?.defaultView ?? window;
          const rect = element.getBoundingClientRect();
          const pageLeft = rect.left + view.scrollX;
          const pageTop = rect.top + view.scrollY;
          const mode = scrollConfig.freeMove?.mode ?? "relative";
          const normalized = scrollConfig.freeMove?.normalized === true;
          const effectiveZoom = getEffectiveZoom(element);
          const scale = normalized ? 1 : 1 / effectiveZoom;
          const origin = scrollConfig.freeMove?.origin ?? start;
          const baseToStartX = ((origin?.x ?? pageLeft) - pageLeft) / effectiveZoom;
          const baseToStartY = ((origin?.y ?? pageTop) - pageTop) / effectiveZoom;
          const toOffset = (p: { x: number; y: number }) => ({
            // FreeMove should be exact regardless of Speed/Intensity.
            x:
              mode === "relative"
                ? baseToStartX + (p.x * scale)
                : (p.x - (origin?.x ?? pageLeft)) * scale,
            y:
              mode === "relative"
                ? baseToStartY + (p.y * scale)
                : (p.y - (origin?.y ?? pageTop)) * scale,
          });

          const offsets = points.map(toOffset);
          from = offsets[0] ?? {};
          to = offsets[offsets.length - 1] ?? {};

          // Simulated smooth preview (Start -> ... -> End -> Back to Start)
          const baseDuration = getScrollPreviewDuration(scrollConfig.speed);
          const simulatedEase = current.scrollEffect.scrub ? "none" : "power1.inOut";

          const restoreIndicator = applyScrollPreviewIndicator(element);
          restoreScrollIndicatorRef.current = restoreIndicator;

          const timeline = gsap.timeline({
            defaults: { ease: simulatedEase },
            onComplete: () => {
              // Keep FreeMove parked at captured Start after preview ends.
              gsap.set(element, {
                x: go[0]?.x ?? 0,
                y: go[0]?.y ?? 0,
                force3D: true,
                clearProps: "opacity,filter,clip-path",
              });
              if (restoreScrollIndicatorRef.current) {
                restoreScrollIndicatorRef.current();
                restoreScrollIndicatorRef.current = null;
              }
              timeline.kill();
              if (scrollPreviewTimelineRef.current === timeline) {
                scrollPreviewTimelineRef.current = null;
              }
            },
          });

          // Build preview samples per segment so each keyframe point is hit exactly.
          const segmentSamples = 8;
          const go: Array<{ x: number; y: number }> = [];
          for (let segIdx = 0; segIdx < offsets.length - 1; segIdx++) {
            const p1 = offsets[segIdx];
            const p2 = offsets[segIdx + 1];
            if (!p1 || !p2) continue;
            for (let s = 0; s <= segmentSamples; s++) {
              if (segIdx > 0 && s === 0) continue; // avoid duplicate point at joints
              const localT = s / segmentSamples;
              go.push({
                x: (p1.x as number) + ((p2.x as number) - (p1.x as number)) * localT,
                y: (p1.y as number) + ((p2.y as number) - (p1.y as number)) * localT,
              });
            }
          }

          timeline.set(element, { x: go[0]?.x ?? 0, y: go[0]?.y ?? 0, force3D: true }, 0);
          for (let i = 1; i < go.length; i++) {
            timeline.to(element, { ...go[i], force3D: true, duration: baseDuration / (go.length - 1) }, (i - 1) * (baseDuration / (go.length - 1)));
          }
          timeline.to(element, { x: go[0]?.x ?? 0, y: go[0]?.y ?? 0, force3D: true, duration: baseDuration * 0.5 }, baseDuration);

          scrollPreviewTimelineRef.current = timeline;
          return;
        } else {
          const range = getScrollEffectRange(scrollConfig);
          from = range.from;
          to = range.to;
        }
        const baseDuration = getScrollPreviewDuration(scrollConfig.speed);
        const simulatedEase = current.scrollEffect.scrub ? "none" : "power1.inOut";

        const restoreIndicator = applyScrollPreviewIndicator(element);
        restoreScrollIndicatorRef.current = restoreIndicator;

        // If rotate effect, set transformOrigin to center for true rotation
        if (nextType === "rotate") {
          gsap.set(element, { transformOrigin: "50% 50%" });
        }

        const timeline = gsap.timeline({
          defaults: {
            ease: simulatedEase,
            ...(nextType === "rotate" ? { transformOrigin: "50% 50%" } : {}),
          },
          onComplete: () => {
            gsap.set(element, { clearProps: "transform,opacity,filter,clip-path,transformOrigin" });
            if (restoreScrollIndicatorRef.current) {
              restoreScrollIndicatorRef.current();
              restoreScrollIndicatorRef.current = null;
            }
            timeline.kill();
            if (scrollPreviewTimelineRef.current === timeline) {
              scrollPreviewTimelineRef.current = null;
            }
          },
        });

        // The simulation plays through the full range: Entering -> Steady -> Exiting
        const steady: Record<string, unknown> = {};
        for (const k in from) {
          if (k === "opacity" || k === "scale") steady[k] = 1;
          else if (k === "filter") steady[k] = "blur(0px)";
          else if (k === "clipPath") steady[k] = "inset(0% 0% 0% 0%)";
          else steady[k] = 0;
        }
        for (const k in to) {
          if (k === "opacity" || k === "scale") steady[k] = 1;
          else if (k === "filter") steady[k] = "blur(0px)";
          else if (k === "clipPath") steady[k] = "inset(0% 0% 0% 0%)";
          else if (!(k in steady)) steady[k] = 0;
        }

        timeline.fromTo(element, from, { ...steady, duration: baseDuration * 0.35 });
        timeline.to(element, { ...steady, duration: baseDuration * 0.3, ease: "none" });
        timeline.to(element, { ...to, duration: baseDuration * 0.35 });

        scrollPreviewTimelineRef.current = timeline;
        return;
      }

      if (!webAnimation) return;

      playingAnimationRef.current = webAnimation;
      webAnimation.finished
        .catch(() => undefined)
        .then(() => {
          webAnimation.cancel();
          if (playingAnimationRef.current === webAnimation) {
            playingAnimationRef.current = null;
          }
        });
    },
    [animation, firstId, query]
  );

  const schedulePreview = useCallback(
    (phase: PreviewPhase) => {
      const prev = debounceTimersRef.current[phase];
      if (prev != null) {
        window.clearTimeout(prev);
      }
      debounceTimersRef.current[phase] = window.setTimeout(() => {
        previewOnCanvas(phase);
        debounceTimersRef.current[phase] = null;
      }, 300);
    },
    [previewOnCanvas]
  );

  useEffect(() => {
    return () => {
      (Object.keys(debounceTimersRef.current) as PreviewPhase[]).forEach((phase) => {
        const timer = debounceTimersRef.current[phase];
        if (timer != null) {
          window.clearTimeout(timer);
          debounceTimersRef.current[phase] = null;
        }
      });
      if (playingAnimationRef.current) {
        playingAnimationRef.current.cancel();
        playingAnimationRef.current = null;
      }
      if (scrollPreviewTimelineRef.current) {
        scrollPreviewTimelineRef.current.kill();
        scrollPreviewTimelineRef.current = null;
      }
      if (restoreScrollIndicatorRef.current) {
        restoreScrollIndicatorRef.current();
        restoreScrollIndicatorRef.current = null;
      }
    };
  }, []);

  const freeMoveStatus = useMemo(() => {
    const start = animation.scrollEffect.freeMove?.start;
    const end = animation.scrollEffect.freeMove?.end;
    const mids = animation.scrollEffect.freeMove?.mids;
    return {
      hasStart: !!start,
      hasEnd: !!end,
      start,
      end,
      midCount: countMids(mids),
    };
  }, [animation.scrollEffect.freeMove?.start, animation.scrollEffect.freeMove?.end, animation.scrollEffect.freeMove?.mids]);

  const captureFreeMovePoint = useCallback(
    (point: "start" | "mid" | "end") => {
      if (!firstId) return;

      let element: HTMLElement | null = null;
      try {
        element = query.node(firstId).get()?.dom ?? null;
      } catch {
        element = null;
      }
      if (!element) return;

      const absolute = getDomXY(element);
      const current = animation.scrollEffect.freeMove;
      const mode = current?.mode ?? "relative";
      const effectiveZoom = getEffectiveZoom(element);
      const originAbs = current?.origin ?? absolute;

      const toStoredPoint = (abs: { x: number; y: number }) => {
        if (mode === "absolute") {
          return {
            x: toFixedPoint(abs.x / effectiveZoom),
            y: toFixedPoint(abs.y / effectiveZoom),
          };
        }
        return {
          x: toFixedPoint((abs.x - originAbs.x) / effectiveZoom),
          y: toFixedPoint((abs.y - originAbs.y) / effectiveZoom),
        };
      };

      if (point === "start") {
        const nextFreeMove = {
          mode,
          normalized: true,
          origin: { x: toFixedPoint(absolute.x), y: toFixedPoint(absolute.y) },
          start: { x: 0, y: 0 },
          mids: [] as Array<{ x: number; y: number }>,
          end: undefined as { x: number; y: number } | undefined,
        };
        update("scrollEffect.freeMove", nextFreeMove);
        return;
      }

      const start = current?.start;
      if (!start) return;
      const nextPoint = toStoredPoint(absolute);

      if (point === "mid") {
        const mids = Array.isArray(current?.mids) ? [...current.mids] : [];
        mids.push(nextPoint);
        update("scrollEffect.freeMove.mids", mids);
        return;
      }

      update("scrollEffect.freeMove.end", nextPoint);

      const startAbs = current?.origin ?? originAbs;
      const dx = toFixedPoint((startAbs.x - absolute.x) / effectiveZoom);
      const dy = toFixedPoint((startAbs.y - absolute.y) / effectiveZoom);
      gsap.set(element, { x: dx, y: dy, force3D: true });
    },
    [animation.scrollEffect.freeMove, firstId, query, update]
  );

  const removeLastMidPoint = useCallback(() => {
    const mids = animation.scrollEffect.freeMove?.mids;
    if (!Array.isArray(mids) || mids.length === 0) return;
    update("scrollEffect.freeMove.mids", mids.slice(0, -1));
  }, [animation.scrollEffect.freeMove?.mids, update]);

  const clearFreeMovePath = useCallback(() => {
    update("scrollEffect.freeMove", undefined);
  }, [update]);

  return (
    <div className="flex flex-col pb-4">
      <div className="mb-3 px-0.5">
        <button
          type="button"
          aria-label="Preview animation"
          title="Preview animation"
          onClick={() => {
            if (animation.animateIn.type !== "none") {
              previewOnCanvas("in");
              return;
            }
            if (animation.animateDuring.type !== "none") {
              previewOnCanvas("during");
              return;
            }
            if (animation.scrollEffect.enabled && animation.scrollEffect.type !== "none") {
              previewOnCanvas("scrollEffect");
            }
          }}
          className="inline-flex items-center justify-center w-8 h-8 rounded-md border border-[var(--builder-border)] bg-[var(--builder-surface-2)] text-[var(--builder-text)] hover:bg-[var(--builder-surface-3)] hover:border-[var(--builder-border-mid)]/50 transition-colors"
        >
          <Play size={12} strokeWidth={2.2} />
        </button>
      </div>

      {/* ─── Trigger ─── */}
      <DesignSection title="Trigger">
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <label className={labelClass}>Trigger Event</label>
            <select
              value={animation.trigger.type}
              onChange={(e) => update("trigger.type", e.target.value as TriggerType)}
              className={selectClass}
            >
              {Object.entries(TRIGGER_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>

          {animation.trigger.type === "onScroll" && (
            <div className="flex flex-col gap-1">
              <div className="flex justify-between">
                <label className={labelClass}>Visibility Threshold</label>
                <span className={subLabelClass}>{Math.round(animation.trigger.threshold * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={animation.trigger.threshold}
                onChange={(e) => update("trigger.threshold", Number(e.target.value))}
                className={sliderClass}
              />
            </div>
          )}

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={animation.trigger.once}
              onChange={(e) => update("trigger.once", e.target.checked)}
              className={checkboxClass}
            />
            <span className={labelClass}>Play only once</span>
          </label>
        </div>
      </DesignSection>

      {/* ─── Animate In ─── */}
      <DesignSection title="Animate In">
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <label className={labelClass}>Animation</label>
            <select
              value={animation.animateIn.type}
              onChange={(e) => {
                const nextType = e.target.value as AnimateInType;
                update("animateIn.type", nextType);
                previewOnCanvas("in", nextType);
              }}
              className={selectClass}
            >
              {Object.entries(ANIMATE_IN_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>

          {animation.animateIn.type !== "none" && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <div className="flex justify-between">
                    <label className={labelClass}>Duration</label>
                    <span className={subLabelClass}>{animation.animateIn.duration}s</span>
                  </div>
                  <input
                    type="range"
                    min="0.1"
                    max="3"
                    step="0.1"
                    value={animation.animateIn.duration}
                    onChange={(e) => {
                      update("animateIn.duration", Number(e.target.value));
                      schedulePreview("in");
                    }}
                    className={sliderClass}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <div className="flex justify-between">
                    <label className={labelClass}>Delay</label>
                    <span className={subLabelClass}>{animation.animateIn.delay}s</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="3"
                    step="0.1"
                    value={animation.animateIn.delay}
                    onChange={(e) => {
                      update("animateIn.delay", Number(e.target.value));
                      schedulePreview("in");
                    }}
                    className={sliderClass}
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className={labelClass}>Easing</label>
                <select
                  value={animation.animateIn.easing}
                  onChange={(e) => {
                    update("animateIn.easing", e.target.value as EasingType);
                    schedulePreview("in");
                  }}
                  className={selectClass}
                >
                  {Object.entries(EASING_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </div>

              {["slideUp", "slideDown", "slideLeft", "slideRight"].includes(animation.animateIn.type) && (
                <div className="flex flex-col gap-1">
                  <div className="flex justify-between">
                    <label className={labelClass}>Distance</label>
                    <span className={subLabelClass}>{animation.animateIn.distance}px</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="300"
                    step="5"
                    value={animation.animateIn.distance}
                    onChange={(e) => {
                      update("animateIn.distance", Number(e.target.value));
                      schedulePreview("in");
                    }}
                    className={sliderClass}
                  />
                </div>
              )}

              <div className="flex flex-col gap-1">
                <div className="flex justify-between">
                  <label className={labelClass}>Stagger Children</label>
                  <span className={subLabelClass}>{animation.animateIn.stagger}s</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="0.5"
                  step="0.02"
                  value={animation.animateIn.stagger}
                  onChange={(e) => update("animateIn.stagger", Number(e.target.value))}
                  className={sliderClass}
                />
              </div>
            </>
          )}
        </div>
      </DesignSection>

      {/* ─── Animate Out ─── */}
      <DesignSection title="Animate Out" defaultOpen={false}>
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <label className={labelClass}>Animation</label>
            <select
              value={animation.animateOut.type}
              onChange={(e) => {
                const nextType = e.target.value as AnimateOutType;
                update("animateOut.type", nextType);
                previewOnCanvas("out", nextType);
              }}
              className={selectClass}
            >
              {Object.entries(ANIMATE_OUT_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>

          {animation.animateOut.type !== "none" && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <div className="flex justify-between">
                    <label className={labelClass}>Duration</label>
                    <span className={subLabelClass}>{animation.animateOut.duration}s</span>
                  </div>
                  <input
                    type="range"
                    min="0.1"
                    max="3"
                    step="0.1"
                    value={animation.animateOut.duration}
                    onChange={(e) => {
                      update("animateOut.duration", Number(e.target.value));
                      schedulePreview("out");
                    }}
                    className={sliderClass}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <div className="flex justify-between">
                    <label className={labelClass}>Delay</label>
                    <span className={subLabelClass}>{animation.animateOut.duration}s</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="3"
                    step="0.1"
                    value={animation.animateOut.delay}
                    onChange={(e) => {
                      update("animateOut.delay", Number(e.target.value));
                      schedulePreview("out");
                    }}
                    className={sliderClass}
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className={labelClass}>Easing</label>
                <select
                  value={animation.animateOut.easing}
                  onChange={(e) => {
                    update("animateOut.easing", e.target.value as EasingType);
                    schedulePreview("out");
                  }}
                  className={selectClass}
                >
                  {Object.entries(EASING_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </div>

              {["slideUp", "slideDown", "slideLeft", "slideRight"].includes(animation.animateOut.type) && (
                <div className="flex flex-col gap-1">
                  <div className="flex justify-between">
                    <label className={labelClass}>Distance</label>
                    <span className={subLabelClass}>{animation.animateOut.distance}px</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="300"
                    step="5"
                    value={animation.animateOut.distance}
                    onChange={(e) => {
                      update("animateOut.distance", Number(e.target.value));
                      schedulePreview("out");
                    }}
                    className={sliderClass}
                  />
                </div>
              )}
            </>
          )}
        </div>
      </DesignSection>

      {/* ─── Animate During (Continuous) ─── */}
      <DesignSection title="Continuous Animation" defaultOpen={false}>
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <label className={labelClass}>Animation</label>
            <select
              value={animation.animateDuring.type}
              onChange={(e) => {
                const nextType = e.target.value as AnimateDuringType;
                update("animateDuring.type", nextType);
                previewOnCanvas("during", nextType);
              }}
              className={selectClass}
            >
              {Object.entries(ANIMATE_DURING_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>

          {animation.animateDuring.type !== "none" && (
            <>
              <div className="flex flex-col gap-1">
                <div className="flex justify-between">
                  <label className={labelClass}>Duration</label>
                  <span className={subLabelClass}>{animation.animateDuring.duration}s</span>
                </div>
                <input
                  type="range"
                  min="0.2"
                  max="5"
                  step="0.1"
                  value={animation.animateDuring.duration}
                  onChange={(e) => {
                    update("animateDuring.duration", Number(e.target.value));
                    schedulePreview("during");
                  }}
                  className={sliderClass}
                />
              </div>

              <div className="flex flex-col gap-1">
                <div className="flex justify-between">
                  <label className={labelClass}>Intensity</label>
                  <span className={subLabelClass}>{animation.animateDuring.intensity}x</span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="3"
                  step="0.1"
                  value={animation.animateDuring.intensity}
                  onChange={(e) => {
                    update("animateDuring.intensity", Number(e.target.value));
                    schedulePreview("during");
                  }}
                  className={sliderClass}
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className={labelClass}>Repeat</label>
                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="iterCount"
                      checked={animation.animateDuring.iterationCount === "infinite"}
                      onChange={() => update("animateDuring.iterationCount", "infinite")}
                      className={checkboxClass}
                    />
                    <span className={subLabelClass}>Infinite</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="iterCount"
                      checked={animation.animateDuring.iterationCount !== "infinite"}
                      onChange={() => update("animateDuring.iterationCount", 3)}
                      className={checkboxClass}
                    />
                    <span className={subLabelClass}>Count</span>
                  </label>
                  {animation.animateDuring.iterationCount !== "infinite" && (
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={animation.animateDuring.iterationCount as number}
                      onChange={(e) => update("animateDuring.iterationCount", Number(e.target.value))}
                      className="w-14 bg-[var(--builder-surface-2)] rounded-md text-xs text-[var(--builder-text)] px-2 py-1 focus:outline-none"
                    />
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </DesignSection>

      {/* ─── Scroll Effect ─── */}
      <DesignSection title="Scroll Effects" defaultOpen={false}>
        <div className="flex flex-col gap-3">
          <label className="flex items-center gap-2 cursor-pointer mb-1">
            <input
              type="checkbox"
              checked={animation.scrollEffect.enabled}
              onChange={(e) => update("scrollEffect.enabled", e.target.checked)}
              className={checkboxClass}
            />
            <span className={labelClass}>Enable Scroll Effects</span>
          </label>

          {animation.scrollEffect.enabled && (
            <>
              <div className="flex flex-col gap-1">
                <label className={labelClass}>Effect Type</label>
                <select
                  value={animation.scrollEffect.type}
                  onChange={(e) => {
                    const nextType = e.target.value as ScrollEffectType;
                    update("scrollEffect.type", nextType);
                    previewOnCanvas("scrollEffect", nextType);
                  }}
                  className={selectClass}
                >
                  {Object.entries(SCROLL_EFFECT_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </div>

              {animation.scrollEffect.type !== "none" && (
                <>
                  <div className="flex flex-col gap-1">
                    <div className="flex justify-between">
                      <label className={labelClass}>Speed</label>
                      <span className={subLabelClass}>{animation.scrollEffect.speed}x</span>
                    </div>
                    <input
                      type="range"
                      min="-2"
                      max="2"
                      step="0.1"
                      value={animation.scrollEffect.speed}
                      onChange={(e) => {
                        update("scrollEffect.speed", Number(e.target.value));
                        schedulePreview("scrollEffect");
                      }}
                      className={sliderClass}
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className={labelClass}>Direction</label>
                    <select
                      value={animation.scrollEffect.direction}
                      onChange={(e) => {
                        update("scrollEffect.direction", e.target.value);
                        schedulePreview("scrollEffect");
                      }}
                      className={selectClass}
                    >
                      <option value="vertical">Vertical</option>
                      <option value="horizontal">Horizontal</option>
                    </select>
                  </div>

                  {animation.scrollEffect.type === "freeMove" && (
                    <div className="rounded-md border border-[var(--builder-border)] bg-[var(--builder-surface-2)] p-2.5">
                      <div className="mb-2 flex items-center justify-between">
                        <label className={labelClass}>Free Move Keyframes</label>
                        <span className={subLabelClass}>Mid Frames: {freeMoveStatus.midCount}</span>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => captureFreeMovePoint("start")}
                          className="rounded-md border border-[var(--builder-border)] px-2 py-1.5 text-[11px] text-[var(--builder-text)] hover:bg-[var(--builder-surface-3)]"
                        >
                          Capture Start
                        </button>
                        <button
                          type="button"
                          onClick={() => captureFreeMovePoint("mid")}
                          disabled={!freeMoveStatus.hasStart}
                          className="rounded-md border border-[var(--builder-border)] px-2 py-1.5 text-[11px] text-[var(--builder-text)] hover:bg-[var(--builder-surface-3)] disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          Add Mid
                        </button>
                        <button
                          type="button"
                          onClick={() => captureFreeMovePoint("end")}
                          disabled={!freeMoveStatus.hasStart}
                          className="rounded-md border border-[var(--builder-border)] px-2 py-1.5 text-[11px] text-[var(--builder-text)] hover:bg-[var(--builder-surface-3)] disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          Capture End
                        </button>
                        <button
                          type="button"
                          onClick={removeLastMidPoint}
                          disabled={freeMoveStatus.midCount === 0}
                          className="rounded-md border border-[var(--builder-border)] px-2 py-1.5 text-[11px] text-[var(--builder-text)] hover:bg-[var(--builder-surface-3)] disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          Remove Last Mid
                        </button>
                      </div>

                      <div className="mt-2 flex items-center justify-between">
                        <span className={subLabelClass}>
                          {freeMoveStatus.hasStart ? "Start set" : "Start not set"} |{" "}
                          {freeMoveStatus.hasEnd ? "End set" : "End not set"}
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => previewOnCanvas("scrollEffect", "freeMove")}
                            disabled={!freeMoveStatus.hasStart || !freeMoveStatus.hasEnd}
                            className="rounded-md border border-[var(--builder-border)] px-2 py-1 text-[10px] text-[var(--builder-text)] hover:bg-[var(--builder-surface-3)] disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            Preview Movement
                          </button>
                          <button
                            type="button"
                            onClick={clearFreeMovePath}
                            className="rounded-md border border-[var(--builder-border)] px-2 py-1 text-[10px] text-[var(--builder-text-muted)] hover:bg-[var(--builder-surface-3)]"
                          >
                            Clear Path
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <label className={labelClass}>Smooth Scrub</label>
                    <input
                      type="checkbox"
                      checked={animation.scrollEffect.scrub}
                      onChange={(e) => {
                        update("scrollEffect.scrub", e.target.checked);
                        schedulePreview("scrollEffect");
                      }}
                      className={checkboxClass}
                    />
                  </div>

                  {animation.scrollEffect.scrub && (
                    <div className="flex flex-col gap-1">
                      <div className="flex justify-between">
                        <label className={labelClass}>Scrub Intensity</label>
                        <span className={subLabelClass}>{animation.scrollEffect.intensity}s</span>
                      </div>
                      <input
                        type="range"
                        min="0.1"
                        max="2"
                        step="0.1"
                        value={animation.scrollEffect.intensity}
                        onChange={(e) => {
                          update("scrollEffect.intensity", Number(e.target.value));
                          schedulePreview("scrollEffect");
                        }}
                        className={sliderClass}
                      />
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3 mt-1">
                    <div className="flex flex-col gap-1">
                      <label className={labelClass}>Start Trigger</label>
                      <input
                        type="text"
                        value={animation.scrollEffect.start}
                        onChange={(e) => update("scrollEffect.start", e.target.value)}
                        className="w-full bg-[var(--builder-surface-2)] rounded-md text-[10px] text-[var(--builder-text)] px-2 py-1.5 focus:outline-none border border-transparent focus:border-[var(--builder-accent)]/50"
                        placeholder="top bottom"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className={labelClass}>End Trigger</label>
                      <input
                        type="text"
                        value={animation.scrollEffect.end}
                        onChange={(e) => update("scrollEffect.end", e.target.value)}
                        className="w-full bg-[var(--builder-surface-2)] rounded-md text-[10px] text-[var(--builder-text)] px-2 py-1.5 focus:outline-none border border-transparent focus:border-[var(--builder-accent)]/50"
                        placeholder="bottom top"
                      />
                    </div>
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </DesignSection>
    </div>
  );
};
