"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import ReactDOM from "react-dom";
import { useEditor } from "@craftjs/core";
import { usePrototypeTabActive } from "./PrototypeTabContext";
import type { PrototypeConfig } from "../_types/prototype";
import { slugFromName } from "../_lib/slug";
import { useThemeOptional } from "@/app/m_dashboard/components/context/theme-context";

interface Line {
  sourceNodeId: string;
  targetPageNodeId: string;
  targetPageName: string;
  targetPageSlug: string;
  sourceRect: DOMRect;
  targetRect: DOMRect;
}

interface PageBadge {
  pageNodeId: string;
  pageIndex: number;
  pageName: string;
  pageSlug: string;
  rect: DOMRect;
}

function toCleanPageLabel(pageName: string, pageIndex: number): string {
  const fallback = `Page ${pageIndex}`;
  const trimmed = String(pageName || "").trim();
  if (!trimmed) return fallback;
  if (/^untitled\s*page$/i.test(trimmed)) return fallback;
  if (/^page\s*name$/i.test(trimmed)) return fallback;
  return trimmed;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export const PrototypeFlowLines = ({ scale = 1 }: { scale?: number }) => {
  const isPrototypeTabActive = usePrototypeTabActive();
  const themeContext = useThemeOptional();
  const isLightTheme = themeContext?.theme === "light";
  const [lines, setLines] = useState<Line[]>([]);
  const [pageBadges, setPageBadges] = useState<PageBadge[]>([]);
  const [editingPageId, setEditingPageId] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState("");
  const [mounted, setMounted] = useState(false);
  const rafRef = useRef<number>(0);
  const { query, actions } = useEditor();

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  const computeLines = useCallback(() => {
    try {
      const state = query.getState();
      const nodes = state.nodes ?? {};

      // Build page lookup maps for destination resolution + page badges
      const slugMap: Record<string, string> = {};
      const pageInfoById: Record<string, { name: string; slug: string }> = {};
      const nextBadges: PageBadge[] = [];
      let pageCounter = 0;
      for (const [nodeId, node] of Object.entries(nodes)) {
        if (node?.data?.displayName !== "Page") continue;
        pageCounter += 1;
        const slug = (node.data.props?.pageSlug as string) ?? "page";
        const pageName = (node.data.props?.pageName as string) || "Untitled Page";
        slugMap[slug] = nodeId;

        pageInfoById[nodeId] = {
          name: pageName,
          slug,
        };

        const pageEl = document.querySelector(`[data-node-id="${nodeId}"]`) as HTMLElement | null;
        if (pageEl) {
          nextBadges.push({
            pageNodeId: nodeId,
            pageIndex: pageCounter,
            pageName,
            pageSlug: slug,
            rect: pageEl.getBoundingClientRect(),
          });
        }
      }

      // Find all navigateTo interactions (prototype tab only)
      const next: Line[] = [];
      if (isPrototypeTabActive) {
        for (const [nodeId, node] of Object.entries(nodes)) {
          const props = node?.data?.props ?? {};
          const proto = props.prototype as PrototypeConfig | undefined;
          if (!proto?.interactions?.length) continue;

          for (const interaction of proto.interactions) {
            if (interaction.action !== "navigateTo" || !interaction.destination) continue;

            // Resolve target page ID: check direct ID match (new way) or slug map (legacy/backup)
            let targetPageId = interaction.destination;
            if (!nodes[targetPageId] || nodes[targetPageId].data?.displayName !== "Page") {
              targetPageId = slugMap[interaction.destination];
            }

            if (!targetPageId || !nodes[targetPageId]) continue;

            const sourceEl = document.querySelector(`[data-node-id="${nodeId}"]`) as HTMLElement | null;
            const targetEl = document.querySelector(`[data-node-id="${targetPageId}"]`) as HTMLElement | null;
            if (!sourceEl || !targetEl) continue;

            next.push({
              sourceNodeId: nodeId,
              targetPageNodeId: targetPageId,
              targetPageName: pageInfoById[targetPageId]?.name || "Untitled Page",
              targetPageSlug: pageInfoById[targetPageId]?.slug || "page",
              sourceRect: sourceEl.getBoundingClientRect(),
              targetRect: targetEl.getBoundingClientRect(),
            });
          }
        }
      }
      setLines(next);
      setPageBadges(nextBadges);
    } catch {
      setLines([]);
      setPageBadges([]);
    }
  }, [query, isPrototypeTabActive]);

  const commitRename = useCallback((badge: PageBadge, rawValue: string) => {
    const nextName = rawValue.trim();
    if (!nextName) return;
    actions.setProp(badge.pageNodeId, (props: Record<string, unknown>) => {
      props.pageName = nextName;
      const nextSlug = slugFromName(nextName) || `page-${badge.pageIndex}`;
      props.pageSlug = nextSlug;
    });
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(computeLines);
  }, [actions, computeLines]);

  const startRename = useCallback((badge: PageBadge) => {
    setEditingPageId(badge.pageNodeId);
    setEditingValue(toCleanPageLabel(badge.pageName, badge.pageIndex));
  }, []);

  const cancelRename = useCallback(() => {
    setEditingPageId(null);
    setEditingValue("");
  }, []);

  useEffect(() => {
    if (!mounted) {
      setLines([]);
      setPageBadges([]);
      return;
    }

    computeLines();
    const scheduleCompute = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(computeLines);
    };
    const onPointerMove = (event: PointerEvent) => {
      if (event.buttons !== 0) scheduleCompute();
    };
    const onKeyDown = () => {
      scheduleCompute();
    };

    window.addEventListener("scroll", scheduleCompute, true);
    window.addEventListener("resize", scheduleCompute);
    window.addEventListener("wheel", scheduleCompute, { passive: true });
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("scroll", scheduleCompute, true);
      window.removeEventListener("resize", scheduleCompute);
      window.removeEventListener("wheel", scheduleCompute);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("keydown", onKeyDown);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [mounted, computeLines]);

  useEffect(() => {
    if (!mounted) return;
    computeLines();
  }, [mounted, scale, computeLines]);

  if (!mounted || (lines.length === 0 && pageBadges.length === 0)) return null;

  const safeScale = Number.isFinite(scale) && scale > 0 ? scale : 1;
  const pageBadgeFontSize = 9;
  const edgeBadgeFontSize = 10;
  const lineStrokeWidth = clamp(2 / safeScale, 1.25, 2.75);

  return ReactDOM.createPortal(
    <div
      data-panel="prototype-flow-lines"
      className="fixed inset-0 pointer-events-none z-40"
      aria-hidden
    >
      {pageBadges.map((badge) => (
        <div
          key={`page-badge-${badge.pageNodeId}`}
          className="absolute"
          style={{
            left: badge.rect.left + 8,
            top: Math.max(8, badge.rect.top - 8),
            transform: "translateY(-100%)",
            fontSize: `${pageBadgeFontSize}px`,
          }}
        >
          {editingPageId === badge.pageNodeId ? (
            <input
              autoFocus
              value={editingValue}
              onChange={(event) => setEditingValue(event.target.value)}
              onBlur={() => {
                commitRename(badge, editingValue);
                cancelRename();
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  commitRename(badge, editingValue);
                  cancelRename();
                } else if (event.key === "Escape") {
                  event.preventDefault();
                  cancelRename();
                }
              }}
              className={`pointer-events-auto w-[180px] rounded border px-1 py-0 outline-none ${isLightTheme ? "border-slate-300 bg-white/95 text-black" : "border-sky-400/70 bg-slate-950/85 text-sky-100"}`}
              title="Rename page"
            />
          ) : (
            <span
              className={`pointer-events-auto cursor-text select-none font-semibold ${isLightTheme ? "text-black drop-shadow-none" : "text-sky-200/95 drop-shadow-[0_1px_2px_rgba(0,0,0,0.35)]"}`}
              onDoubleClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                startRename(badge);
              }}
              title="Double-click to rename page"
            >
              {toCleanPageLabel(badge.pageName, badge.pageIndex)}
            </span>
          )}
        </div>
      ))}
      <svg className="absolute inset-0 w-full h-full" style={{ overflow: "visible" }}>
        <defs>
          <marker
            id="prototype-arrowhead"
            markerWidth="12"
            markerHeight="8"
            refX="9"
            refY="3.5"
            orient="auto"
          >
            <polygon points="0 0, 10 3.5, 0 7" fill="rgb(59, 130, 246)" />
          </marker>
        </defs>
        {lines.map((line, i) => {
          const sourceCenterX = line.sourceRect.left + line.sourceRect.width / 2;
          const sourceCenterY = line.sourceRect.top + line.sourceRect.height / 2;
          const targetCenterX = line.targetRect.left + line.targetRect.width / 2;
          const targetCenterY = line.targetRect.top + line.targetRect.height / 2;

          const direction = targetCenterX >= sourceCenterX ? 1 : -1;

          // Route from side edges (not center) to reduce overlap across page content.
          const sx = direction > 0 ? line.sourceRect.right : line.sourceRect.left;
          const sy = sourceCenterY;
          const tx = direction > 0 ? line.targetRect.left : line.targetRect.right;
          const ty = targetCenterY;

          const dx = Math.abs(tx - sx);
          const dy = Math.abs(ty - sy);
          const horizontalCurve = Math.max(120, Math.min(340, dx * 0.45));
          const verticalBend = Math.max(40, Math.min(180, dy * 0.25));

          const c1x = sx + direction * horizontalCurve;
          const c2x = tx - direction * horizontalCurve;
          const c1y = sy - verticalBend;
          const c2y = ty + verticalBend;
          const mx = (sx + tx) / 2;
          const my = (sy + ty) / 2;

          const path = `M ${sx} ${sy} C ${c1x} ${c1y}, ${c2x} ${c2y}, ${tx} ${ty}`;
          return (
            <g key={i}>
              <path
                d={path}
                fill="none"
                stroke="rgba(14, 165, 233, 0.35)"
                strokeWidth={lineStrokeWidth + 2}
              />
              <path
                d={path}
                fill="none"
                stroke="rgb(59, 130, 246)"
                strokeWidth={lineStrokeWidth}
                strokeDasharray="5 4"
                markerEnd="url(#prototype-arrowhead)"
              />
              <foreignObject x={mx - 120} y={my - 14} width="240" height="28">
                <div
                  xmlns="http://www.w3.org/1999/xhtml"
                  className="mx-auto w-fit rounded-md border border-blue-400/60 bg-blue-500/15 px-2 py-0.5 text-blue-100 backdrop-blur-sm"
                  style={{ fontSize: `${edgeBadgeFontSize}px` }}
                >
                  {`Go to ${line.targetPageName}`}
                </div>
              </foreignObject>
            </g>
          );
        })}
      </svg>
    </div>,
    document.body
  );
};
