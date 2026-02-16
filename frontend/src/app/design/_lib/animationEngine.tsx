"use client";

import React, { useRef, useEffect, useState, useMemo } from "react";
import { motion, useInView } from "framer-motion";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
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

function getInVariants(type: AnimateInType, distance: number) {
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

function getOutVariants(type: AnimateOutType, distance: number) {
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

function getDuringAnimation(type: AnimateDuringType, duration: number, intensity: number) {
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
    const speed = config.speed;
    const isVertical = config.direction === "vertical";

    const tweenProps: Record<string, unknown> = {};

    switch (config.type as ScrollEffectType) {
      case "parallax":
        if (isVertical) {
          tweenProps.y = `${speed * 100}`;
        } else {
          tweenProps.x = `${speed * 100}`;
        }
        break;
      case "fade":
        tweenProps.opacity = speed > 0 ? 0 : 1;
        break;
      case "scale":
        tweenProps.scale = 1 + speed * 0.5;
        break;
      case "rotate":
        tweenProps.rotation = speed * 180;
        break;
      case "blur":
        tweenProps.filter = `blur(${Math.abs(speed) * 10}px)`;
        break;
      case "horizontalMove":
        tweenProps.x = `${speed * 200}`;
        break;
    }

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: el,
        start: config.start,
        end: config.end,
        scrub: config.scrub ? 1 : false,
        invalidateOnRefresh: true,
      },
    });

    tl.to(el, {
      ...tweenProps,
      ease: "none",
    });

    return () => {
      tl.kill();
      ScrollTrigger.getAll().forEach((t) => {
        if (t.trigger === el) t.kill();
      });
    };
  }, [
    ref,
    config.enabled,
    config.type,
    config.speed,
    config.direction,
    config.scrub,
    config.start,
    config.end,
  ]);
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
  const config = useMemo(() => {
    if (!animation) return DEFAULT_ANIMATION;
    return {
      animateIn: { ...DEFAULT_ANIMATION.animateIn, ...(animation.animateIn ?? {}) },
      animateOut: { ...DEFAULT_ANIMATION.animateOut, ...(animation.animateOut ?? {}) },
      animateDuring: { ...DEFAULT_ANIMATION.animateDuring, ...(animation.animateDuring ?? {}) },
      scrollEffect: { ...DEFAULT_ANIMATION.scrollEffect, ...(animation.scrollEffect ?? {}) },
      trigger: { ...DEFAULT_ANIMATION.trigger, ...(animation.trigger ?? {}) },
    };
  }, [animation]);

  const hasIn = config.animateIn.type !== "none";
  const hasOut = config.animateOut.type !== "none";
  const hasDuring = config.animateDuring.type !== "none";
  const hasScroll = config.scrollEffect.enabled && config.scrollEffect.type !== "none";
  const hasAny = hasIn || hasOut || hasDuring || hasScroll;

  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, {
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
      initial={combinedInitial}
      animate={combinedAnimate}
      exit={hasOut ? outVariants.exit : undefined}
      transition={inTransition}
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
  return (
    animation.animateIn?.type !== "none" ||
    animation.animateOut?.type !== "none" ||
    animation.animateDuring?.type !== "none" ||
    (animation.scrollEffect?.enabled && animation.scrollEffect?.type !== "none")
  );
}
