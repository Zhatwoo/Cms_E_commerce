/**
 * Design tokens barrel.
 *
 * Usage:
 *   import { brand, brandGradients, fonts } from "@/lib/theme";
 *
 * brand.purple.deep, brand.yellow.accent, fonts.ui, etc.
 *
 * For surface colours that change with the merchant-dashboard
 * light/dark mode, use `useTheme().colors` from
 * `m_dashboard/components/context/theme-context.tsx` — those are
 * theme-conditional and live with the mode they belong to.
 */

export { brand, brandGradients } from "./brandColors";
export { fonts } from "./fonts";
