import type { ReactNode } from "react";
import type { AnimationConfig } from "./animation";
import type { PrototypeConfig } from "./prototype";

/**
 * Shared type definitions for web builder components.
 * Each prop group interface maps to a settings panel group in the right panel.
 */

// ─── Utility Types ───────────────────────────────────────────────────────────

/** Type-safe setProp wrapper for craft.js node property updates. */
export type SetProp<T> = (cb: (props: T) => void) => void;

// ─── Animation Properties (shared by all components) ─────────────────────────

export interface AnimatableProps {
  animation?: AnimationConfig;
}

// ─── Prototype / Interaction (Figma-style) ───────────────────────────────────

export interface InteractableProps {
  prototype?: PrototypeConfig;
}

export interface InteractionProps {
  toggleTarget?: string;
  triggerAction?: "toggle" | "open" | "close";
  collapsibleKey?: string;
  defaultOpen?: boolean;
  defaultOpenMobile?: boolean;
  defaultOpenDesktop?: boolean;
  showOn?: "desktop" | "mobile";
  mobileBreakpoint?: number;
}

// ─── Settings Group Prop Interfaces ──────────────────────────────────────────
// Each interface below corresponds to a settings group in the right panel.

/** Layout / Auto-layout properties → AutoLayoutGroup */
export interface LayoutProps {
  flexDirection?: "row" | "column";
  flexWrap?: "nowrap" | "wrap";
  alignItems?: "flex-start" | "center" | "flex-end" | "stretch";
  justifyContent?: "flex-start" | "center" | "flex-end" | "space-between" | "space-around";
  gap?: number;
}

/** Spacing (padding & margin) properties → SizePositionGroup */
export interface SpacingProps {
  padding?: number | string;
  paddingTop?: number;
  paddingRight?: number;
  paddingBottom?: number;
  paddingLeft?: number;
  margin?: number | string;
  marginTop?: number;
  marginRight?: number;
  marginBottom?: number;
  marginLeft?: number;
}

/** Dimension properties → SizePositionGroup */
export interface SizeProps {
  width?: string;
  height?: string;
  /** Content size at scale 1; when set, children are scaled with parent resize */
  designWidth?: number;
  designHeight?: number;
}

/** Visual appearance properties → AppearanceGroup */
export interface AppearanceProps {
  background?: string;
  backgroundImage?: string;
  backgroundSize?: "cover" | "contain" | "auto" | string;
  backgroundPosition?: string;
  backgroundRepeat?: "no-repeat" | "repeat" | "repeat-x" | "repeat-y";
  backgroundOverlay?: string;
  borderColor?: string;
  borderWidth?: number;
  borderStyle?: string;
  borderRadius?: number;
  radiusTopLeft?: number;
  radiusTopRight?: number;
  radiusBottomRight?: number;
  radiusBottomLeft?: number;
}

/** CSS Grid layout properties → GridLayoutGroup */
export interface GridProps {
  gridTemplateColumns?: string;
  gridTemplateRows?: string;
  gridGap?: number;
  gridColumnGap?: number;
  gridRowGap?: number;
  gridAutoRows?: string;
  gridAutoFlow?: "row" | "column" | "dense" | "row dense" | "column dense";
}

/** Position & display properties → PositionGroup */
export interface PositionProps {
  position?: "static" | "relative" | "absolute" | "fixed" | "sticky";
  display?: "flex" | "grid" | "block" | "inline-block" | "none";
  zIndex?: number;
  top?: string;
  right?: string;
  bottom?: string;
  left?: string;
  editorVisibility?: "auto" | "show" | "hide";
}

/** Transform properties (rotation) — used for double-click transform mode */
export interface TransformProps {
  rotation?: number; // degrees, 0 = no rotation
}

/** Visual effects properties → EffectsGroup */
export interface EffectsProps {
  opacity?: number;
  boxShadow?: string;
  overflow?: string;
  cursor?: string;
}

/** Typography properties → TypographyGroup */
export interface TypographyProps {
  fontFamily?: string;
  fontWeight?: string;
  fontSize?: number;
  lineHeight?: number | string;
  letterSpacing?: number | string;
  textAlign?: "left" | "center" | "right" | "justify";
  textTransform?: "none" | "uppercase" | "lowercase" | "capitalize";
  color?: string;
}

// ─── Component Prop Interfaces ───────────────────────────────────────────────

/** Container component props — combines all layout and visual property groups. */
export interface ContainerProps
  // extends LayoutProps, GridProps, SpacingProps, SizeProps, AppearanceProps, PositionProps, EffectsProps, TransformProps, AnimatableProps, InteractableProps {
  extends LayoutProps, GridProps, SpacingProps, SizeProps, AppearanceProps, PositionProps, EffectsProps, TransformProps, AnimatableProps, InteractionProps {
  children?: ReactNode;
}

/** Text component props — combines typography, spacing, and basic effects. */
// export interface TextProps extends SpacingProps, TypographyProps, TransformProps, AnimatableProps, InteractableProps {
export interface TextProps extends SpacingProps, TypographyProps, TransformProps, AnimatableProps, InteractionProps {
  text: string;
  opacity?: number;
  boxShadow?: string;
}

/** Image component props — media display with sizing, corners, and effects. */
export interface ImageProps extends SpacingProps, SizeProps, EffectsProps, TransformProps, AnimatableProps, InteractableProps {
  src?: string;
  alt?: string;
  objectFit?: "cover" | "contain" | "fill" | "none" | "scale-down";
  borderRadius?: number;
  radiusTopLeft?: number;
  radiusTopRight?: number;
  radiusBottomRight?: number;
  radiusBottomLeft?: number;
}

/** Button component props — interactive element with label, link, and variant. */
// export interface ButtonProps extends SpacingProps, EffectsProps, TransformProps, AnimatableProps, InteractableProps {
export interface ButtonProps extends SpacingProps, EffectsProps, TransformProps, AnimatableProps, InteractionProps {
  label?: string;
  link?: string;
  variant?: "primary" | "secondary" | "outline" | "ghost";
  backgroundColor?: string;
  textColor?: string;
  fontSize?: number;
  fontWeight?: string;
  fontFamily?: string;
  borderRadius?: number;
  borderColor?: string;
  borderWidth?: number;
  width?: string;
  height?: string;
}

/** Page component props — top-level page wrapper with dimensions and background. */
export interface PageProps extends AnimatableProps, InteractableProps {
  width?: string;
  height?: string;
  background?: string;
  /** User-editable page name (e.g. "About Us"). */
  pageName?: string;
  /** URL slug for navigation (e.g. "about-us"). Auto-derived from pageName if not set. */
  pageSlug?: string;
  children?: ReactNode;
}

/** Divider component props — simple horizontal rule element. */
export interface DividerProps extends TransformProps, AnimatableProps, InteractableProps {
  dividerStyle?: "solid" | "dashed" | "dotted";
  color?: string;
  thickness?: number;
  width?: string;
  marginTop?: number;
  marginBottom?: number;
}

export interface CircleProps
  extends LayoutProps, GridProps, SpacingProps, SizeProps, AppearanceProps, PositionProps, EffectsProps {
  color?: string;
  size?: number;
  children?: ReactNode;
  isPreview?: boolean;
}

export interface SquareProps extends CircleProps {}
export interface TriangleProps extends CircleProps {}

