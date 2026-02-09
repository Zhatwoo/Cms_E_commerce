/**
 * Responsive breakpoint types for the web builder.
 * Scaffold for future responsive design implementation.
 */

// ─── Breakpoint Definitions ──────────────────────────────────────────────────

export type BreakpointId = "desktop" | "tablet" | "mobile";

export interface BreakpointConfig {
  id: BreakpointId;
  label: string;
  maxWidth: number | null;
  defaultViewportWidth: number;
}

/** Default breakpoint configuration for the builder. */
export const BREAKPOINTS: Record<BreakpointId, BreakpointConfig> = {
  desktop: {
    id: "desktop",
    label: "Desktop",
    maxWidth: null,
    defaultViewportWidth: 1440,
  },
  tablet: {
    id: "tablet",
    label: "Tablet",
    maxWidth: 1024,
    defaultViewportWidth: 768,
  },
  mobile: {
    id: "mobile",
    label: "Mobile",
    maxWidth: 768,
    defaultViewportWidth: 375,
  },
};

// ─── Responsive Style Overrides ──────────────────────────────────────────────

/**
 * Represents per-breakpoint style overrides for a component.
 * Only overridden properties need to be specified per breakpoint.
 *
 * @example
 * const overrides: ResponsiveOverrides<ContainerProps> = {
 *   tablet: { width: "100%", padding: 16 },
 *   mobile: { width: "100%", padding: 8, flexDirection: "column" },
 * };
 */
export type ResponsiveOverrides<T> = {
  [K in BreakpointId]?: Partial<T>;
};

/**
 * Wraps a component's base props with optional responsive overrides.
 * Desktop styles serve as the base; tablet and mobile override specific values.
 *
 * @example
 * const containerStyles: ResponsiveProps<ContainerProps> = {
 *   base: { width: "1200px", padding: 40, flexDirection: "row" },
 *   overrides: {
 *     tablet: { width: "100%", padding: 20 },
 *     mobile: { flexDirection: "column", padding: 12 },
 *   },
 * };
 */
export interface ResponsiveProps<T> {
  /** Base styles (applied at desktop / default breakpoint). */
  base: T;
  /** Optional per-breakpoint overrides. */
  overrides?: ResponsiveOverrides<T>;
}
