/**
 * Animation configuration types for the web builder.
 *
 * Supports three animation phases (In, Out, During) plus scroll-based
 * effects like parallax. Powered by GSAP + Framer Motion at runtime.
 */

// ─── Animation Presets ───────────────────────────────────────────────────────

export type AnimateInType =
  | "none"
  | "fadeIn"
  | "slideUp"
  | "slideDown"
  | "slideLeft"
  | "slideRight"
  | "scaleUp"
  | "scaleDown"
  | "rotateIn"
  | "bounceIn"
  | "flipX"
  | "flipY"
  | "blur";

export type AnimateOutType =
  | "none"
  | "fadeOut"
  | "slideUp"
  | "slideDown"
  | "slideLeft"
  | "slideRight"
  | "scaleDown"
  | "scaleUp"
  | "rotateOut"
  | "bounceOut"
  | "flipX"
  | "flipY"
  | "blur";

export type AnimateDuringType =
  | "none"
  | "pulse"
  | "float"
  | "spin"
  | "shake"
  | "wobble"
  | "heartbeat"
  | "breathe"
  | "glow"
  | "bounce";

export type EasingType =
  | "linear"
  | "easeIn"
  | "easeOut"
  | "easeInOut"
  | "circIn"
  | "circOut"
  | "circInOut"
  | "backIn"
  | "backOut"
  | "backInOut"
  | "anticipate";

export type ScrollEffectType =
  | "none"
  | "parallax"
  | "fade"
  | "scale"
  | "rotate"
  | "blur"
  | "horizontalMove"
  | "freeMove"
  | "skew"
  | "reveal"
  | "zoom"
  | "tilt3d";

export type TriggerType = "onLoad" | "onScroll" | "onHover" | "onClick";

// ─── Animation Phase Configs ─────────────────────────────────────────────────

export interface AnimateInConfig {
  type: AnimateInType;
  duration: number;
  delay: number;
  easing: EasingType;
  distance: number;
  stagger: number;
}

export interface AnimateOutConfig {
  type: AnimateOutType;
  duration: number;
  delay: number;
  easing: EasingType;
  distance: number;
}

export interface AnimateDuringConfig {
  type: AnimateDuringType;
  duration: number;
  iterationCount: number | "infinite";
  intensity: number;
}

export interface ScrollEffectConfig {
  enabled: boolean;
  type: ScrollEffectType;
  speed: number;
  /**
   * Scroll smoothing intensity when scrub is enabled.
   * Maps to GSAP ScrollTrigger `scrub` numeric value (seconds).
   * Higher = smoother / more lag.
   */
  intensity: number;
  direction: "vertical" | "horizontal";
  scrub: boolean;
  start: string;
  end: string;
  freeMove?: {
    /**
     * How captured points should be interpreted.
     * - relative: points are stored as deltas from the captured start position (recommended; stable across layouts).
     * - absolute: points are stored as page coordinates.
     */
    mode?: "relative" | "absolute";
    /**
     * Captured start position in page coords (used as reference when mode="relative").
     * Note: runtime uses the element's current layout as the base, so this is only a capture-time reference.
     */
    origin?: { x: number; y: number };
    start?: { x: number; y: number };
    mids?: Array<{ x: number; y: number }>;
    end?: { x: number; y: number };
    /**
     * Multi-keyframe path. Each keyframe is in page coordinates (x/y) with progress t in [0..1].
     * When present, this takes precedence over start/mid/end.
     */
    keyframes?: Array<{ t: number; x: number; y: number }>;
  };
}

export interface TriggerConfig {
  type: TriggerType;
  threshold: number;
  once: boolean;
}

// ─── Full Animation Config ───────────────────────────────────────────────────

export interface AnimationConfig {
  animateIn: AnimateInConfig;
  animateOut: AnimateOutConfig;
  animateDuring: AnimateDuringConfig;
  scrollEffect: ScrollEffectConfig;
  trigger: TriggerConfig;
}

// ─── Defaults ────────────────────────────────────────────────────────────────

export const DEFAULT_ANIMATE_IN: AnimateInConfig = {
  type: "none",
  duration: 0.6,
  delay: 0,
  easing: "easeOut",
  distance: 50,
  stagger: 0,
};

export const DEFAULT_ANIMATE_OUT: AnimateOutConfig = {
  type: "none",
  duration: 0.4,
  delay: 0,
  easing: "easeIn",
  distance: 50,
};

export const DEFAULT_ANIMATE_DURING: AnimateDuringConfig = {
  type: "none",
  duration: 1,
  iterationCount: "infinite",
  intensity: 1,
};

export const DEFAULT_SCROLL_EFFECT: ScrollEffectConfig = {
  enabled: false,
  type: "none",
  speed: 0.5,
  intensity: 0.2, // Snappier, more optimized feel (0.2s lag)
  direction: "vertical",
  scrub: true,
  start: "",
  end: "",
};

export const DEFAULT_TRIGGER: TriggerConfig = {
  type: "onScroll",
  threshold: 0.2,
  once: true,
};

export const DEFAULT_ANIMATION: AnimationConfig = {
  animateIn: { ...DEFAULT_ANIMATE_IN },
  animateOut: { ...DEFAULT_ANIMATE_OUT },
  animateDuring: { ...DEFAULT_ANIMATE_DURING },
  scrollEffect: { ...DEFAULT_SCROLL_EFFECT },
  trigger: { ...DEFAULT_TRIGGER },
};

// ─── Preset Labels (for the UI) ─────────────────────────────────────────────

export const ANIMATE_IN_LABELS: Record<AnimateInType, string> = {
  none: "None",
  fadeIn: "Fade In",
  slideUp: "Slide Up",
  slideDown: "Slide Down",
  slideLeft: "Slide Left",
  slideRight: "Slide Right",
  scaleUp: "Scale Up",
  scaleDown: "Scale Down",
  rotateIn: "Rotate In",
  bounceIn: "Bounce In",
  flipX: "Flip X",
  flipY: "Flip Y",
  blur: "Blur In",
};

export const ANIMATE_OUT_LABELS: Record<AnimateOutType, string> = {
  none: "None",
  fadeOut: "Fade Out",
  slideUp: "Slide Up",
  slideDown: "Slide Down",
  slideLeft: "Slide Left",
  slideRight: "Slide Right",
  scaleDown: "Scale Down",
  scaleUp: "Scale Up",
  rotateOut: "Rotate Out",
  bounceOut: "Bounce Out",
  flipX: "Flip X",
  flipY: "Flip Y",
  blur: "Blur Out",
};

export const ANIMATE_DURING_LABELS: Record<AnimateDuringType, string> = {
  none: "None",
  pulse: "Pulse",
  float: "Float",
  spin: "Spin",
  shake: "Shake",
  wobble: "Wobble",
  heartbeat: "Heartbeat",
  breathe: "Breathe",
  glow: "Glow",
  bounce: "Bounce",
};

export const EASING_LABELS: Record<EasingType, string> = {
  linear: "Linear",
  easeIn: "Ease In",
  easeOut: "Ease Out",
  easeInOut: "Ease In-Out",
  circIn: "Circ In",
  circOut: "Circ Out",
  circInOut: "Circ In-Out",
  backIn: "Back In",
  backOut: "Back Out",
  backInOut: "Back In-Out",
  anticipate: "Anticipate",
};

export const SCROLL_EFFECT_LABELS: Record<ScrollEffectType, string> = {
  none: "None",
  parallax: "Parallax",
  fade: "Fade on Scroll",
  scale: "Scale on Scroll",
  rotate: "Rotate on Scroll",
  blur: "Blur on Scroll",
  horizontalMove: "Horizontal Move",
  freeMove: "Free Move",
  skew: "Skew on Scroll",
  reveal: "Reveal on Scroll",
  zoom: "Zoom on Scroll",
  tilt3d: "3D Tilt on Scroll",
};

export const TRIGGER_LABELS: Record<TriggerType, string> = {
  onLoad: "On Page Load",
  onScroll: "On Scroll Into View",
  onHover: "On Hover",
  onClick: "On Click",
};
