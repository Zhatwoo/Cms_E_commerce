"use client";

export const NEW_PAGE_WIDTH = 1920;
export const NEW_PAGE_HEIGHT = 1200;

export type DropPoint = {
  clientX: number;
  clientY: number;
  ts: number;
};

/**
 * Get the current canvas scale by comparing the scaled bounding rect with unscaled offsetWidth.
 * This is the most robust method for any browser.
 */
export function getCanvasContainerScale(): number | null {
  if (typeof document === "undefined") return null;
  const container = document.querySelector("[data-canvas-container]") as HTMLElement | null;
  if (!container) return null;

  // The first child of the container is the one with the scale(s) transform
  const scaledChild = container.firstElementChild as HTMLElement | null;
  if (!scaledChild) return null;

  // getBoundingClientRect returns scaled dimensions, offsetWidth returns unscaled/CSS dimensions
  const scaledWidth = scaledChild.getBoundingClientRect().width;
  const unscaledWidth = scaledChild.offsetWidth;

  if (unscaledWidth > 0) {
    const scale = scaledWidth / unscaledWidth;
    // Sanity check: our zoom range is 0.05 to 3.0
    if (scale > 0.01 && scale < 10) {
      return scale;
    }
  }

  // Fallback to transform string parsing if offsetWidth is 0 (rare)
  const transform = window.getComputedStyle(scaledChild).transform;
  if (transform && transform !== "none") {
    const matrixMatch = transform.match(/matrix\(([^)]+)\)/);
    if (matrixMatch && matrixMatch[1]) {
      const values = matrixMatch[1].split(",").map((v: string) => parseFloat(v.trim()));
      if (values.length >= 4) {
        const scaleX = values[0];
        if (Number.isFinite(scaleX) && scaleX > 0.01) return scaleX;
      }
    }
  }

  return null;
}

/**
 * Converts screen coordinates to unscaled canvas coordinates relative to the desktop root.
 */
export function getDropPointInDesktop(desktopRoot: HTMLElement, clientX: number, clientY: number): { x: number; y: number } {
  const rect = desktopRoot.getBoundingClientRect();
  const scale = getCanvasContainerScale();
  const effectiveScale = scale != null && scale > 0.01 ? scale : 1;

  // desktopRoot is inside the scaled canvas; dividing by scale converts back to unscaled canvas coords
  const x = (clientX - rect.left) / effectiveScale;
  const y = (clientY - rect.top) / effectiveScale;

  return {
    x: Number.isFinite(x) ? Math.round(x) : 0,
    y: Number.isFinite(y) ? Math.round(y) : 0,
  };
}
