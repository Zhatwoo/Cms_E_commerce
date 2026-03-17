export type Rect = {
  left: number;
  right: number;
  top: number;
  bottom: number;
  width: number;
  height: number;
  centerX: number;
  centerY: number;
};

export type SnapGuide = {
  type: "vertical" | "horizontal" | "rect";
  pos?: number;
  start?: number;
  end?: number;
  rect?: Rect;
};

export type SnapResult = {
  snappedX: number | null;
  snappedY: number | null;
  guides: SnapGuide[];
};

export const getBoundingRect = (el: HTMLElement, zoom: number = 1): Rect => {
  const rect = el.getBoundingClientRect();
  // We need to account for the canvas zoom if the rects are used for rendering markers in a zoomed overlay
  // But usually, getBoundingClientRect is enough for relative comparisons if everything is in the same zoom context.
  // However, the guides often need to be rendered in a global overlay.
  return {
    left: rect.left,
    right: rect.right,
    top: rect.top,
    bottom: rect.bottom,
    width: rect.width,
    height: rect.height,
    centerX: rect.left + rect.width / 2,
    centerY: rect.top + rect.height / 2,
  };
};

export const getSnapGuides = (
  movingRect: Rect,
  targetRects: Rect[],
  threshold: number = 5
) => {
  let bestDeltaX = threshold + 1;
  let bestDeltaY = threshold + 1;
  let snappedX: number | null = null;
  let snappedY: number | null = null;

  // 1. Find the best snap delta across all targets and all edges
  for (const target of targetRects) {
    const vAlignments = [
      { m: movingRect.left, t: target.left, offset: 0 },
      { m: movingRect.left, t: target.right, offset: 0 },
      { m: movingRect.right, t: target.left, offset: movingRect.width },
      { m: movingRect.right, t: target.right, offset: movingRect.width },
      { m: movingRect.centerX, t: target.centerX, offset: movingRect.width / 2 },
    ];

    for (const { m, t, offset } of vAlignments) {
      const delta = Math.abs(m - t);
      if (delta < bestDeltaX) {
        bestDeltaX = delta;
        snappedX = t - offset;
      }
    }

    const hAlignments = [
      { m: movingRect.top, t: target.top, offset: 0 },
      { m: movingRect.top, t: target.bottom, offset: 0 },
      { m: movingRect.bottom, t: target.top, offset: movingRect.height },
      { m: movingRect.bottom, t: target.bottom, offset: movingRect.height },
      { m: movingRect.centerY, t: target.centerY, offset: movingRect.height / 2 },
    ];

    for (const { m, t, offset } of hAlignments) {
      const delta = Math.abs(m - t);
      if (delta < bestDeltaY) {
        bestDeltaY = delta;
        snappedY = t - offset;
      }
    }
  }

  // If no snap found within threshold, use original position for guide detection
  const finalX = snappedX !== null ? snappedX : movingRect.left;
  const finalY = snappedY !== null ? snappedY : movingRect.top;
  const finalMovingRect: Rect = {
    ...movingRect,
    left: finalX,
    top: finalY,
    right: finalX + movingRect.width,
    bottom: finalY + movingRect.height,
    centerX: finalX + movingRect.width / 2,
    centerY: finalY + movingRect.height / 2,
  };

  const guides: SnapGuide[] = [];
  const snappedTargetIds = new Set<number>();

  // 2. Collect ALL guides that match at the final position
  if (bestDeltaX <= threshold || snappedX === null) {
      for (let i = 0; i < targetRects.length; i++) {
        const target = targetRects[i];
        const vAlignments = [
          { m: finalMovingRect.left, t: target.left, gp: target.left },
          { m: finalMovingRect.left, t: target.right, gp: target.right },
          { m: finalMovingRect.right, t: target.left, gp: target.left },
          { m: finalMovingRect.right, t: target.right, gp: target.right },
          { m: finalMovingRect.centerX, t: target.centerX, gp: target.centerX },
        ];

        for (const { m, t, gp } of vAlignments) {
          if (Math.abs(m - t) < 0.1) {
            guides.push({
              type: "vertical",
              pos: gp,
              start: Math.min(finalMovingRect.top, target.top),
              end: Math.max(finalMovingRect.bottom, target.bottom),
            });
            snappedTargetIds.add(i);
          }
        }
      }
  }

  if (bestDeltaY <= threshold || snappedY === null) {
      for (let i = 0; i < targetRects.length; i++) {
        const target = targetRects[i];
        const hAlignments = [
          { m: finalMovingRect.top, t: target.top, gp: target.top },
          { m: finalMovingRect.top, t: target.bottom, gp: target.bottom },
          { m: finalMovingRect.bottom, t: target.top, gp: target.top },
          { m: finalMovingRect.bottom, t: target.bottom, gp: target.bottom },
          { m: finalMovingRect.centerY, t: target.centerY, gp: target.centerY },
        ];

        for (const { m, t, gp } of hAlignments) {
          if (Math.abs(m - t) < 0.1) {
            guides.push({
              type: "horizontal",
              pos: gp,
              start: Math.min(finalMovingRect.left, target.left),
              end: Math.max(finalMovingRect.right, target.right),
            });
            snappedTargetIds.add(i);
          }
        }
      }
  }

  // If we didn't actually snap for an axis, we shouldn't show guides for that axis
  // unless the delta is actually 0. The logic above handles it via threshold.
  const filteredGuides = guides.filter(g => {
    if (g.type === "vertical") return bestDeltaX <= threshold;
    if (g.type === "horizontal") return bestDeltaY <= threshold;
    return true;
  });

  // Add the targets themselves (blue rects)
  for (const idx of Array.from(snappedTargetIds)) {
    filteredGuides.push({
      type: "rect",
      rect: targetRects[idx],
    });
  }

  return {
    snappedX,
    snappedY,
    guides: filteredGuides,
  };
};



