'use client';

import React, { useEffect, useState, useRef, useLayoutEffect } from 'react';
import { getDraft } from '@/app/design/_lib/pageApi';
import type { BuilderDocument } from '@/app/design/_types/schema';

/** Reference size fallback for the page (web builder canvas). */
const REFERENCE_WIDTH = 1440;
const REFERENCE_HEIGHT = 900;
const THUMB_SCALE = 0.2;

function toPx(value: unknown, fallback: number = 0): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const n = parseFloat(value);
    if (Number.isFinite(n)) return n;
  }
  return fallback;
}

/** Scale value for thumbnail; keep at least 1px for borders so they stay visible. */
function scale(v: number, min = 0): number {
  const s = v * THUMB_SCALE;
  return min > 0 && s > 0 && s < min ? min : s;
}

/** Build same style as web builder but scaled for thumbnail (accurate layout). */
function boxStyles(props: Record<string, unknown>) {
  const p = toPx(props.padding, 0);
  const pt = scale(toPx(props.paddingTop ?? p, 0));
  const pr = scale(toPx(props.paddingRight ?? p, 0));
  const pb = scale(toPx(props.paddingBottom ?? p, 0));
  const pl = scale(toPx(props.paddingLeft ?? p, 0));
  const m = toPx(props.margin, 0);
  const mt = scale(toPx(props.marginTop ?? m, 0));
  const mr = scale(toPx(props.marginRight ?? m, 0));
  const mb = scale(toPx(props.marginBottom ?? m, 0));
  const ml = scale(toPx(props.marginLeft ?? m, 0));
  const gap = scale(toPx(props.gap, 0));
  const br = scale(toPx(props.borderRadius, 0));
  const bw = scale(toPx(props.borderWidth, 0), 1);
  const display = (props.display as string) ?? 'flex';
  return {
    padding: `${pt}px ${pr}px ${pb}px ${pl}px`,
    margin: `${mt}px ${mr}px ${mb}px ${ml}px`,
    backgroundColor: (props.background as string) ?? '#f4f4f5',
    backgroundImage: (props.backgroundImage as string) ? `url(${(props.backgroundImage as string)})` : undefined,
    backgroundSize: (props.backgroundSize as string) ?? 'cover',
    backgroundPosition: (props.backgroundPosition as string) ?? 'center',
    flexDirection: (props.flexDirection as React.CSSProperties['flexDirection']) ?? 'column',
    flexWrap: (props.flexWrap as React.CSSProperties['flexWrap']) ?? 'nowrap',
    alignItems: (props.alignItems as string) ?? 'flex-start',
    justifyContent: (props.justifyContent as string) ?? 'flex-start',
    gap: `${gap}px`,
    display: display === 'grid' ? 'grid' : 'flex',
    gridTemplateColumns: display === 'grid' ? (props.gridTemplateColumns as string) : undefined,
    gridTemplateRows: display === 'grid' ? (props.gridTemplateRows as string) : undefined,
    borderRadius: `${br}px`,
    border: bw > 0 ? `${bw}px ${(props.borderStyle as string) ?? 'solid'} ${(props.borderColor as string) ?? 'transparent'}` : undefined,
    width: (props.width as string) ?? '100%',
    minWidth: (props.minWidth as string) ?? undefined,
    minHeight: gap ? undefined : '2px',
    boxSizing: 'border-box' as const,
    overflow: 'hidden' as const,
  };
}

/** Clean document shape (minimal type for preview). */
type CleanDoc = {
  version?: number;
  pages?: { id: string; name?: string; slug?: string; children: string[]; props?: Record<string, unknown> }[];
  nodes?: Record<string, { type: string; props?: Record<string, unknown>; children?: string[] }>;
};

type DraftPreviewThumbnailProps = {
  projectId: string;
  borderColor: string;
  bgColor: string;
  className?: string;
};

/**
 * Renders a Figma-style thumbnail preview of the draft content.
 * Fetches draft via getDraft(projectId) and draws a minimal static representation.
 */
export function DraftPreviewThumbnail({
  projectId,
  borderColor,
  bgColor,
  className = '',
}: DraftPreviewThumbnailProps) {
  const [doc, setDoc] = useState<CleanDoc | null>(null);
  const [loading, setLoading] = useState(true);
  const [WebPreviewComponent, setWebPreviewComponent] = useState<React.ComponentType<{ doc: BuilderDocument; pageIndex?: number; simulatedWidth?: number }> | null>(null);
  const [fitScale, setFitScale] = useState(THUMB_SCALE);
  const containerRef = useRef<HTMLDivElement>(null);

  const firstPage = doc?.pages?.[0];
  const pageProps = (firstPage?.props as Record<string, unknown>) ?? {};
  const previewBaseWidth = Math.max(320, toPx(pageProps.width, REFERENCE_WIDTH));
  const previewBaseHeight = Math.max(320, toPx(pageProps.height, REFERENCE_HEIGHT));

  useEffect(() => {
    let cancelled = false;
    getDraft(projectId)
      .then((res) => {
        if (cancelled || !res.success) {
          setLoading(false);
          return;
        }
        // API may return { content } or the content at top level
        const raw = res.data?.content ?? res.data;
        if (raw == null) {
          setLoading(false);
          return;
        }
        let parsed: CleanDoc | null =
          typeof raw === 'string' ? (() => { try { return JSON.parse(raw); } catch { return null; } })() : raw;
        if (!parsed || typeof parsed !== 'object') {
          setLoading(false);
          return;
        }
        const asAny = parsed as Record<string, unknown>;
        // Clean format (BuilderDocument): version + pages + nodes
        if (typeof asAny.version === 'number' && Array.isArray(asAny.pages) && asAny.nodes && typeof asAny.nodes === 'object') {
          setDoc(parsed as CleanDoc);
          setLoading(false);
          return;
        }
        // Craft.js format: ROOT with nodes array
        if (asAny.ROOT && typeof (asAny.ROOT as { nodes?: unknown })?.nodes === 'object') {
          const craft = asAny as Record<string, { type?: { resolvedName?: string }; props?: Record<string, unknown>; nodes?: string[] }>;
          const root = craft['ROOT'];
          const pageIds = root?.nodes ?? [];
          const pageId = pageIds[0];
          const page = pageId ? craft[pageId] : null;
          const childIds = page?.nodes ?? [];
          const nodes: Record<string, { type: string; props?: Record<string, unknown>; children?: string[] }> = {};
          function collect(nid: string) {
            const n = craft[nid];
            if (!n) return;
            nodes[nid] = {
              type: n.type?.resolvedName ?? 'Container',
              props: n.props ?? {},
              children: (n.nodes ?? []) as string[],
            };
            (n.nodes ?? []).slice(0, 16).forEach(collect);
          }
          childIds.slice(0, 20).forEach(collect);
          parsed = { pages: [{ id: '1', children: childIds }], nodes };
          setDoc(parsed);
        }
      })
      .catch(() => { })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [projectId]);

  useEffect(() => {
    if (!doc?.pages?.length) return;
    const firstPage = doc.pages[0];
    if (!firstPage?.children?.length) return;
    import('@/app/design/_lib/webRenderer')
      .then((m) => setWebPreviewComponent(() => m.WebPreview))
      .catch(() => { });
  }, [doc]);

  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const update = () => {
      const w = el.offsetWidth;
      if (w > 0) {
        // Scale so the full design width always fits; height overflows and is clipped (shows top portion)
        const s = w / previewBaseWidth;
        setFitScale(s);
      }
    };
    update();
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(update) : null;
    if (ro) ro.observe(el);
    return () => ro?.disconnect();
  }, [WebPreviewComponent, previewBaseWidth, previewBaseHeight]);

  if (loading) {
    return (
      <div
        className={`w-full aspect-[16/10] rounded-t-lg flex items-center justify-center ${className}`}
        style={{
          backgroundColor: 'rgba(0,0,0,0.03)',
          borderBottom: `1px solid ${borderColor}`,
        }}
      >
        <div
          className="w-5 h-5 rounded-full border-2 border-current border-t-transparent animate-spin opacity-40"
          style={{ borderColor: 'inherit' }}
        />
      </div>
    );
  }

  const nodes = doc?.nodes ?? {};
  const childIds = firstPage?.children ?? [];

  if (!doc?.pages?.length || (Object.keys(nodes).length === 0 && childIds.length === 0)) {
    return (
      <div
        className={`w-full aspect-[16/10] rounded-t-lg flex flex-col items-center justify-center gap-2 ${className}`}
        style={{
          backgroundColor: 'rgba(0,0,0,0.03)',
          borderBottom: `1px solid ${borderColor}`,
        }}
      >
        <div className="w-9 h-9 rounded-lg flex items-center justify-center opacity-30" style={{ backgroundColor: 'rgba(0,0,0,0.06)' }}>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <span className="text-xs font-medium opacity-50">No design yet</span>
      </div>
    );
  }

  const pageBg = (pageProps.background as string) ?? '#ffffff';
  const pageW = toPx(pageProps.width, REFERENCE_WIDTH);
  const pageH = toPx(pageProps.height, REFERENCE_HEIGHT);
  const thumbW = pageW * THUMB_SCALE;
  const thumbH = pageH * THUMB_SCALE;

  const builderDoc: BuilderDocument = {
    version: typeof doc?.version === 'number' ? doc.version : 2,
    pages: (doc?.pages ?? []).map((p) => ({
      id: p.id,
      name: p.name ?? 'Page',
      slug: p.slug ?? 'page',
      props: p.props ?? {},
      children: p.children ?? [],
    })),
    nodes: (doc?.nodes ?? {}) as BuilderDocument['nodes'],
  };

  if (WebPreviewComponent && childIds.length > 0) {
    return (
      <div
        ref={containerRef}
        className={`w-full aspect-[16/10] rounded-t-lg overflow-hidden flex items-start justify-start ${className}`}
        style={{
          backgroundColor: 'rgba(0,0,0,0.04)',
          borderBottom: `1px solid ${borderColor}`,
        }}
      >
        <div
          className="overflow-hidden shrink-0"
          style={{
            width: '100%',
            height: '100%',
          }}
        >
          <div
            style={{
              width: `${previewBaseWidth}px`,
              height: `${previewBaseHeight}px`,
              transform: `scale(${fitScale})`,
              transformOrigin: 'top left',
              overflow: 'hidden',
            }}
          >
            <WebPreviewComponent
              doc={builderDoc}
              pageIndex={0}
              simulatedWidth={previewBaseWidth}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`w-full aspect-[16/10] rounded-t-lg overflow-hidden flex items-center justify-center ${className}`}
      style={{
        backgroundColor: 'rgba(0,0,0,0.04)',
        borderBottom: `1px solid ${borderColor}`,
      }}
    >
      <div
        className="flex flex-col shrink-0 overflow-hidden rounded-sm"
        style={{
          width: `${thumbW}px`,
          minHeight: `${thumbH}px`,
          maxWidth: '100%',
          backgroundColor: pageBg,
          boxShadow: '0 1px 3px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.04)',
          borderRadius: '6px',
        }}
      >
        {childIds.length === 0 ? (
          <div className="flex-1 flex items-center justify-center min-h-[72px]">
            <span className="text-[10px] font-medium opacity-40">Empty canvas</span>
          </div>
        ) : (
          childIds.slice(0, 30).map((id, index) => {
            const node = nodes[id];
            if (!node) return null;
            return (
              <PreviewNode key={`${id}-${index}`} node={node} nodes={nodes} depth={0} isRoot />
            );
          })
        )}
      </div>
    </div>
  );
}

const MAX_DEPTH = 5;
const MAX_CHILDREN = 12;

function PreviewNode({
  node,
  nodes,
  depth,
  isRoot = false,
}: {
  node: { type: string; props?: Record<string, unknown>; children?: string[] };
  nodes: Record<string, { type: string; props?: Record<string, unknown>; children?: string[] }>;
  depth: number;
  isRoot?: boolean;
}) {
  const props = node.props || {};
  const children = node.children || [];
  const type = node.type || 'Container';

  if (depth > MAX_DEPTH) return null;

  if (type === 'Text') {
    const p = toPx(props.padding, 0);
    const pt = scale(toPx(props.paddingTop ?? p, 0));
    const pr = scale(toPx(props.paddingRight ?? p, 0));
    const pb = scale(toPx(props.paddingBottom ?? p, 0));
    const pl = scale(toPx(props.paddingLeft ?? p, 0));
    const m = toPx(props.margin, 0);
    const mt = scale(toPx(props.marginTop ?? m, 0));
    const mr = scale(toPx(props.marginRight ?? m, 0));
    const mb = scale(toPx(props.marginBottom ?? m, 0));
    const ml = scale(toPx(props.marginLeft ?? m, 0));
    const fontSize = Math.max(5, scale(toPx(props.fontSize, 16)));
    const text = (props.text != null && props.text !== '') ? String(props.text) : 'Edit me!';
    return (
      <div
        className="shrink-0 min-w-0 overflow-hidden"
        style={{
          fontSize: `${fontSize}px`,
          fontFamily: (props.fontFamily as string) || 'inherit',
          fontWeight: (props.fontWeight as string) || 'inherit',
          color: (props.color as string) ?? '#18181b',
          textAlign: (props.textAlign as React.CSSProperties['textAlign']) ?? 'left',
          margin: `${mt}px ${mr}px ${mb}px ${ml}px`,
          padding: `${pt}px ${pr}px ${pb}px ${pl}px`,
          lineHeight: 1.35,
          letterSpacing: 'normal',
          wordBreak: 'break-word',
        }}
      >
        {text.slice(0, 120)}{text.length > 120 ? '…' : ''}
      </div>
    );
  }

  if (type === 'Image') {
    const src = (props.src as string) || '';
    const br = scale(toPx(props.borderRadius, 0));
    const h = Math.max(28, scale(toPx(props.height, 200)));
    return (
      <div
        className="shrink-0 w-full flex items-center justify-center min-w-0"
        style={{
          height: `${h}px`,
          minHeight: `${h}px`,
          backgroundImage: src ? `url(${src})` : undefined,
          backgroundColor: src ? undefined : '#e4e4e7',
          backgroundSize: (props.backgroundSize as string) ?? 'cover',
          backgroundPosition: (props.backgroundPosition as string) ?? 'center',
          borderRadius: `${br}px`,
          color: '#71717a',
          fontSize: `${Math.max(6, scale(12))}px`,
          fontWeight: 500,
          border: src ? undefined : '1px solid rgba(0,0,0,0.06)',
        }}
      >
        {!src ? 'Image' : null}
      </div>
    );
  }

  if (type === 'Button') {
    const p = toPx(props.padding, 0);
    const pt = scale(toPx(props.paddingTop ?? p, 10));
    const pr = scale(toPx(props.paddingRight ?? p, 24));
    const pb = scale(toPx(props.paddingBottom ?? p, 10));
    const pl = scale(toPx(props.paddingLeft ?? p, 24));
    const m = toPx(props.margin, 0);
    const mt = scale(toPx(props.marginTop ?? m, 0));
    const mr = scale(toPx(props.marginRight ?? m, 0));
    const mb = scale(toPx(props.marginBottom ?? m, 0));
    const ml = scale(toPx(props.marginLeft ?? m, 0));
    const fontSize = Math.max(5, scale(toPx(props.fontSize, 14)));
    const label = (props.label as string) || (props.text as string) || 'Button';
    const bg = (props.backgroundColor as string) ?? (props.background as string) ?? '#3b82f6';
    const color = (props.textColor as string) ?? (props.color as string) ?? '#ffffff';
    const br = scale(toPx(props.borderRadius, 0));
    const bw = scale(toPx(props.borderWidth, 0), 1);
    const borderColor = (props.borderColor as string) ?? 'transparent';
    return (
      <span
        className="shrink-0 inline-block min-w-0 overflow-hidden"
        style={{
          backgroundColor: bg,
          color,
          fontSize: `${fontSize}px`,
          fontWeight: (props.fontWeight as string) || '600',
          padding: `${pt}px ${pr}px ${pb}px ${pl}px`,
          margin: `${mt}px ${mr}px ${mb}px ${ml}px`,
          borderRadius: `${br}px`,
          border: bw > 0 ? `${bw}px solid ${borderColor}` : undefined,
          lineHeight: 1.25,
        }}
      >
        {label.slice(0, 24)}{label.length > 24 ? '…' : ''}
      </span>
    );
  }

  if (type === 'Divider') {
    const w = (props.width as string) ?? '100%';
    const thickness = Math.max(1, scale(toPx(props.thickness, 1)));
    const color = (props.color as string) ?? '#e4e4e7';
    return (
      <hr
        style={{
          width: w,
          border: 'none',
          borderTop: `${thickness}px solid ${color}`,
          margin: `${scale(toPx(props.marginTop, 0))}px 0 ${scale(toPx(props.marginBottom, 0))}px 0`,
        }}
      />
    );
  }

  // Container, Section, Row, Column, Frame — same layout as web builder
  const style = boxStyles(props);
  if (isRoot) {
    style.width = '100%';
    style.minWidth = '100%';
  }
  return (
    <div className="shrink-0 flex w-full min-w-0" style={style}>
      {children.slice(0, MAX_CHILDREN).map((cid, index) => {
        const child = nodes[cid];
        return child ? <PreviewNode key={`${cid}-${depth}-${index}`} node={child} nodes={nodes} depth={depth + 1} /> : null;
      })}
    </div>
  );
}
