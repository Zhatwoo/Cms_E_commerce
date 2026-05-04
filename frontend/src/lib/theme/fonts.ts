/**
 * Font tokens.
 *
 * The two main families used across the app — Outfit (UI) and
 * Montserrat (display) — are loaded as next/font CSS variables in
 * the root layout. This file gives every consumer a single string
 * to drop into a `style={{ fontFamily }}` declaration.
 *
 * Frequency snapshot:
 *   "Outfit" (raw)                                55  -> use fonts.uiRaw
 *   'var(--font-outfit), sans-serif'              14  -> use fonts.ui
 *   'var(--font-montserrat)'                       2  -> use fonts.display
 */

export const fonts = {
  /** Default UI font. Falls back to system sans if the next/font CSS variable is not loaded. */
  ui: "var(--font-outfit), 'Outfit', system-ui, sans-serif",

  /** Same family without the CSS-variable indirection — only for places that cannot reach the variable. */
  uiRaw: "'Outfit', system-ui, sans-serif",

  /** Display / heading font. */
  display: "var(--font-montserrat), 'Montserrat', sans-serif",

  /** Mono font for code / numeric display. */
  mono: "ui-monospace, SFMono-Regular, Menlo, Monaco, 'Cascadia Mono', monospace",

  /** Serif fallback used by a couple of design templates. */
  serif: "Georgia, 'Times New Roman', serif",
} as const;
