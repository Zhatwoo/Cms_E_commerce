/**
 * Brand color tokens.
 *
 * The merchant dashboard has its own light/dark theme object in
 * `m_dashboard/components/context/theme-context.tsx` for surface
 * colours that change per mode. This file holds the colours that
 * DO NOT change per theme — the brand identity that appears on the
 * landing page, design builder, storefront, and admin areas.
 *
 * Names map to the actual hex values that already appear most often
 * across the codebase, so adoption is a 1:1 substitution rather than
 * a redesign. New code should reference these constants; existing
 * sites can migrate incrementally as files are touched.
 *
 * Frequency snapshot (case-insensitive grep across src/, in `style`
 * objects + className arbitrary values):
 *   #ffffff  269   white
 *   #4a1a8a  127   purple.deep
 *   #7c3aed  103   purple.violet600 (Tailwind violet-600)
 *   #b13bff  100   purple.bright
 *   #120533   99   ink (very dark indigo, near-black)
 *   #8b5cf6   93   purple.violet500 (Tailwind violet-500)
 *   #ffcc00   83   yellow.gold        (alt cap of #FFCE00)
 *   #ffce00   67   yellow.accent
 *   #d946ef   65   purple.fuchsia500
 *   #111827   60   slate.almostBlack  (Tailwind gray-900)
 */

export const brand = {
  /** Primary text on dark surfaces; default page background on light pages. */
  white: "#FFFFFF",

  /** Near-black brand ink. Used for dark page backgrounds across landing/design. */
  ink: "#120533",

  purple: {
    /** Saturated brand purple — the most common hand-rolled shade. */
    deep: "#4A1A8A",
    /** Bright magenta-purple used for hero gradients and CTA glows. */
    bright: "#B13BFF",
    /** Tailwind violet-500 equivalent. */
    violet500: "#8B5CF6",
    /** Tailwind violet-600 equivalent. */
    violet600: "#7C3AED",
    /** Tailwind violet-700 / saturated. */
    violet700: "#6D28D9",
    /** Tailwind fuchsia-500 equivalent. */
    fuchsia500: "#D946EF",
    /** Tailwind purple-600 equivalent. */
    purple600: "#9333EA",
    /** Tailwind purple-500 equivalent. */
    purple500: "#A855F7",
    /** Deep indigo, used in some hero accents. */
    indigo: "#471396",
  },

  yellow: {
    /** Primary yellow CTA fill — slightly warmer. */
    accent: "#FFCE00",
    /** Logo gold. */
    gold: "#FFCC00",
    /** Hover/pressed state for the yellow CTA. */
    accentHover: "#FFD740",
  },

  blue: {
    /** Tailwind blue-500. */
    blue500: "#3B82F6",
  },

  /** Neutral surfaces and borders — match Tailwind's slate / gray palette. */
  neutral: {
    /** Tailwind slate-300 — light borders, muted text. */
    slate300: "#CBD5E1",
    /** Tailwind gray-400 — secondary text. */
    gray400: "#9CA3AF",
    /** Tailwind gray-900 — primary text on light surfaces. */
    almostBlack: "#111827",
  },

  /** Warm accent used for some hero panels. */
  amber: "#F5A213",

  /** Light page background tint used on landing / dashboard light theme. */
  paper: "#F5F4FF",
} as const;

/**
 * Common gradient strings — these get repeated as hand-rolled
 * `linear-gradient(...)` literals. Centralise the most-used ones.
 */
export const brandGradients = {
  /** Landing-page hero / dark surface from indigo to black. */
  heroDark: `linear-gradient(135deg, ${brand.ink} 0%, ${brand.purple.indigo} 100%)`,
  /** Light card surface used in dashboards. */
  cardLight: `linear-gradient(135deg, ${brand.paper} 0%, #ECE6FF 100%)`,
} as const;
