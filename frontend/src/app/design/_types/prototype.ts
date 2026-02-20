/**
 * Figma-style prototype/interaction types for multi-page websites.
 * Interactions are attached to any component and drive navigation, URLs, scroll, etc.
 */

export type InteractionTrigger = "click" | "hover" | "mouseLeave" | "doubleClick";

export type InteractionAction =
  | "navigateTo"
  | "openUrl"
  | "scrollTo"
  | "openOverlay"
  | "closeOverlay"
  | "back";

export type TransitionType =
  | "instant"
  | "dissolve"
  | "slideLeft"
  | "slideRight"
  | "slideUp"
  | "slideDown"
  | "push"
  | "moveIn";

export interface Interaction {
  trigger: InteractionTrigger;
  action: InteractionAction;
  /** Page slug (e.g. "about-us") or external URL for openUrl */
  destination?: string;
  transition?: TransitionType;
  duration?: number; // ms, default 300
  easing?: string; // easing curve (from animation.ts EasingType)
}

export interface PrototypeConfig {
  interactions: Interaction[];
}

export const DEFAULT_PROTOTYPE: PrototypeConfig = {
  interactions: [],
};
