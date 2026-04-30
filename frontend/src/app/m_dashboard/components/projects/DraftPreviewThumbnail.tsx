'use client';

import React, { useEffect, useState, useRef, useLayoutEffect } from 'react';
import { getDraft } from '@/app/design/_lib/pageApi';
import type { BuilderDocument } from '@/app/design/_types/schema';
import { parseContentToCleanDoc } from '@/app/design/_lib/contentParser';

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

type DraftPreviewThumbnailProps = {
  projectId: string;
  borderColor: string;
  bgColor: string;
  className?: string;
};

export function DraftPreviewThumbnail({
  projectId,
  borderColor,
  bgColor,
  className = '',
}: DraftPreviewThumbnailProps) {
  const [doc, setDoc] = useState<BuilderDocument | null>(null);
  const [loading, setLoading] = useState(true);
  const [WebPreviewComponent, setWebPreviewComponent] = useState<React.ComponentType<{ doc: BuilderDocument; pageIndex?: number; simulatedWidth?: number; builderParityMode?: boolean; renderAllNodes?: boolean; storeContext?: any }> | null>(null);
  const [fitScale, setFitScale] = useState(THUMB_SCALE);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    getDraft(projectId)
      .then((res) => {
        if (cancelled || !res.success) {
          setLoading(false);
          return;
        }
        const raw = res.data?.content ?? res.data;
        if (raw == null) {
          setLoading(false);
          return;
        }
        const cleanDoc = parseContentToCleanDoc(raw);
        if (cleanDoc) {
          setDoc(cleanDoc);
        }
        setLoading(false);
      })
      .catch(() => { setLoading(false); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [projectId]);

  useEffect(() => {
    if (!doc?.pages?.length) return;
    import('@/app/design/_lib/webRenderer')
      .then((m) => setWebPreviewComponent(() => m.WebPreview))
      .catch(() => { });
  }, [doc]);

  const homePageSlug = doc && typeof doc.homePageSlug === 'string' ? (doc.homePageSlug || '').trim().toLowerCase() : '';
  const selectedPageIndex = React.useMemo(() => {
    if (!doc?.pages?.length) return 0;
    if (!homePageSlug) return 0;
    const idx = doc.pages.findIndex((page, index) => {
      const slug = (page?.slug || `page-${index}`).trim().toLowerCase();
      return slug === homePageSlug;
    });
    return idx >= 0 ? idx : 0;
  }, [doc, homePageSlug]);

  const firstPage = doc?.pages?.[selectedPageIndex];
  const pageProps = (firstPage?.props as Record<string, unknown>) ?? {};
  const previewBaseWidth = Math.max(320, toPx(pageProps.width, REFERENCE_WIDTH));
  const previewBaseHeight = Math.max(320, toPx(pageProps.height, REFERENCE_HEIGHT));

  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const update = () => {
      const w = el.offsetWidth;
      if (w > 0) {
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

  if (!doc?.pages?.length || Object.keys(doc.nodes || {}).length === 0) {
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

  if (!WebPreviewComponent) {
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

  return (
    <div
      ref={containerRef}
      className={`w-full aspect-[16/10] rounded-t-lg overflow-hidden flex items-start justify-start ${className}`}
      style={{
        backgroundColor: 'rgba(0,0,0,0.04)',
        borderBottom: `1px solid ${borderColor}`,
        position: 'relative',
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
            doc={doc}
            pageIndex={selectedPageIndex}
            simulatedWidth={previewBaseWidth}
            builderParityMode={true}
            renderAllNodes={true}
          />
        </div>
      </div>
      {/* Invisible overlay to catch clicks and prevent interaction with preview */}
      <div className="absolute inset-0 z-10 cursor-pointer" />
    </div>
  );
}
