/**
 * Shared zoom constants for the design canvas.
 * Used by editorShell, TopPanel, and BottomPanel for consistent zoom behavior.
 */
export const MIN_SCALE = 0.05;
export const MAX_SCALE = 3;
export const DEFAULT_SCALE = 0.75;
export const ZOOM_STEP = 0.1;
export const ZOOM_SENSITIVITY = 0.003;

/** Quick zoom preset levels (scale values) */
export const ZOOM_PRESETS = [0.5, 0.75, 1, 1.25, 1.5] as const;
