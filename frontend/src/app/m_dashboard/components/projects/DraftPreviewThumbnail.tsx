'use client';

import React, { useEffect, useState } from 'react';
import { getDraft } from '@/app/design/_lib/pageApi';

/** Clean document shape (minimal type for preview). */
type CleanDoc = {
  version?: number;
  pages?: { id: string; children: string[]; props?: Record<string, unknown> }[];
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

  useEffect(() => {
    let cancelled = false;
    getDraft(projectId)
      .then((res) => {
        if (cancelled || !res.success) {
          setLoading(false);
          return;
        }
        const raw = res.data?.content;
        if (raw == null) {
          setLoading(false);
          return;
        }
        let parsed: CleanDoc | null =
          typeof raw === 'string' ? (() => { try { return JSON.parse(raw); } catch { return null; } })() : raw;
        // If stored as raw Craft.js (ROOT, then node ids as keys), convert to minimal doc for preview
        const asAny = parsed as any;
        if (parsed && asAny.ROOT && typeof asAny['ROOT']?.nodes === 'object') {
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
              children: n.nodes ?? [],
            };
            (n.nodes ?? []).slice(0, 8).forEach(collect);
          }
          childIds.slice(0, 12).forEach(collect);
          parsed = { pages: [{ id: '1', children: childIds }], nodes };
        }
        if (parsed && (parsed.nodes || parsed.pages)) {
          setDoc(parsed);
        }
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [projectId]);

  if (loading) {
    return (
      <div
        className={`w-full aspect-[16/8] rounded-t-lg flex items-center justify-center ${className}`}
        style={{ backgroundColor: bgColor, borderBottom: `1px solid ${borderColor}` }}
      >
        <div className="w-6 h-6 border-2 border-current border-t-transparent rounded-full animate-spin opacity-50" />
      </div>
    );
  }

  if (!doc?.nodes || !doc.pages?.length) {
    return (
      <div
        className={`w-full aspect-[16/8] rounded-t-lg flex items-center justify-center ${className}`}
        style={{ backgroundColor: bgColor, borderBottom: `1px solid ${borderColor}` }}
      >
        <span className="text-[10px] opacity-50">No preview</span>
      </div>
    );
  }

  const nodes = doc.nodes;
  const firstPage = doc.pages[0];
  const childIds = firstPage?.children ?? [];

  return (
    <div
      className={`w-full aspect-[16/8] rounded-t-lg overflow-hidden flex flex-col ${className}`}
      style={{ backgroundColor: '#1a1a1a', borderBottom: `1px solid ${borderColor}` }}
    >
      <div className="w-full h-full flex flex-col gap-0.5 p-1 overflow-hidden">
        {childIds.slice(0, 16).map((id, index) => {
          const node = nodes[id];
          if (!node) return null;
          return (
            <PreviewNode key={`${id}-${index}`} node={node} nodes={nodes} depth={0} />
          );
        })}
      </div>
    </div>
  );
}

function PreviewNode({
  node,
  nodes,
  depth,
}: {
  node: { type: string; props?: Record<string, unknown>; children?: string[] };
  nodes: Record<string, { type: string; props?: Record<string, unknown>; children?: string[] }>;
  depth: number;
}) {
  const props = node.props || {};
  const children = node.children || [];
  const type = node.type || 'Container';

  if (depth > 1) return null;

  const bg = (props.background as string) ?? '#27272a';
  const color = (props.color as string) ?? '#374151';
  const text = (props.text as string) ?? '';
  const flexDir = (props.flexDirection as string) ?? 'column';

  if (type === 'Text') {
    return (
      <div
        className="truncate text-[8px] leading-tight py-0.5"
        style={{ color: color || '#9ca3af' }}
      >
        {String(text).slice(0, 32) || 'Text'}
      </div>
    );
  }

  if (type === 'Image') {
    const src = props.src as string;
    return (
      <div
        className="rounded shrink-0 h-4 w-full min-h-[12px] bg-gray-600"
        style={{
          backgroundImage: src ? `url(${src})` : undefined,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />
    );
  }

  if (type === 'Button') {
    const label = (props.text as string) || (props.label as string) || 'Button';
    return (
      <div
        className="rounded truncate text-[8px] py-0.5 px-1 shrink-0"
        style={{
          backgroundColor: (props.background as string) ?? '#3b82f6',
          color: (props.color as string) ?? '#fff',
        }}
      >
        {String(label).slice(0, 14)}
      </div>
    );
  }

  // Container, Section, Row, Column
  return (
    <div
      className="flex rounded-sm shrink-0 min-h-[6px] gap-0.5 p-0.5"
      style={{
        flexDirection: flexDir === 'row' ? 'row' : 'column',
        backgroundColor: typeof bg === 'string' ? bg : '#27272a',
      }}
    >
      {children.slice(0, 6).map((cid, index) => {
        const child = nodes[cid];
        return child ? <PreviewNode key={`${cid}-${depth}-${index}`} node={child} nodes={nodes} depth={depth + 1} /> : null;
      })}
    </div>
  );
}
