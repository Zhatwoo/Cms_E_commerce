'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { type MouseEvent, type ReactNode } from 'react';
import { ArrowDownToLine, Copy, ExternalLink, Globe } from 'lucide-react';

import { StatusBadge } from '../../components/ui/StatusBadge';
import { type Project } from '@/lib/api';
import { getSubdomainSiteUrl } from '@/lib/siteUrls';

const BASE_DOMAIN = process.env.NEXT_PUBLIC_BASE_DOMAIN ?? 'websitelink';
const SITE_HOST = process.env.NEXT_PUBLIC_SITE_HOST ?? 'localhost:3000';

type ThemeColors = {
  [key: string]: any;
};

function isPublished(status?: string | null) {
  return (status || '').trim().toLowerCase() === 'published';
}

function getDisplayUrl(subdomain: string, origin: string | null) {
  const slug = subdomain.trim().toLowerCase();
  return origin && (origin.includes('localhost') || origin.includes('127.0.0.1'))
    ? `${slug}/${SITE_HOST}`
    : `${slug}.${BASE_DOMAIN}`;
}

function ActionTooltip({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="group/tooltip relative inline-flex items-center justify-center">
      {children}
      <div className="pointer-events-none absolute bottom-full left-1/2 mb-2 -translate-x-1/2 rounded-lg border border-white/10 bg-[#12193A] px-2.5 py-1.5 text-[9px] font-bold uppercase tracking-widest text-white opacity-0 shadow-2xl transition-all group-hover/tooltip:opacity-100 whitespace-nowrap z-20">
        {label}
      </div>
    </div>
  );
}

export function DomainListRow({
  project,
  subdomain,
  origin,
  theme,
  colors,
  selected,
  unpublishingId,
  onSelect,
  onUnpublish,
  onCopyUrl,
}: {
  project: Project;
  subdomain: string | null;
  origin: string | null;
  theme: 'light' | 'dark';
  colors: ThemeColors;
  selected: boolean;
  unpublishingId: string | null;
  onSelect: (project: Project, subdomain: string | null) => void;
  onUnpublish: (projectId: string, event?: MouseEvent) => void;
  onCopyUrl: (url: string) => void;
}) {
  const published = isPublished(project.status);
  const canVisit = Boolean(subdomain && published);
  const displayUrl = subdomain ? getDisplayUrl(subdomain, origin) : 'No subdomain';
  const visitUrl = canVisit ? getSubdomainSiteUrl(subdomain as string, origin) : `/design?projectId=${project.id}`;
  const copyUrl = subdomain ? displayUrl : '';
  const rowBackground = selected
    ? (theme === 'dark' ? 'rgba(124,58,237,0.12)' : 'rgba(124,58,237,0.06)')
    : 'transparent';
  const rowHoverBackground = theme === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(124,58,237,0.03)';

  const buttonBaseClass = 'inline-flex h-9 w-9 items-center justify-center rounded-xl border transition-all duration-200 hover:-translate-y-0.5 hover:brightness-110 disabled:opacity-40 disabled:hover:translate-y-0 disabled:hover:brightness-100';

  return (
    <motion.tr
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="cursor-pointer transition-colors"
      style={{
        background: rowBackground,
        borderBottom: `1px solid ${selected ? (theme === 'dark' ? 'rgba(96,165,250,0.35)' : colors.accent.purple) : (theme === 'dark' ? 'rgba(148,163,184,0.12)' : colors.border.faint)}`,
      }}
      onClick={() => onSelect(project, subdomain)}
      onMouseEnter={(event) => {
        if (selected) return;
        (event.currentTarget as HTMLTableRowElement).style.backgroundColor = rowHoverBackground;
      }}
      onMouseLeave={(event) => {
        if (selected) return;
        (event.currentTarget as HTMLTableRowElement).style.backgroundColor = rowBackground;
      }}
    >
      <td className="px-5 py-4 align-middle">
        <p className="text-sm font-semibold truncate" style={{ color: colors.text.primary }}>
          {project.title}
        </p>
        <p className="mt-0.5 text-[11px] font-mono truncate" style={{ color: colors.text.muted }}>
          {subdomain ? `.${subdomain}` : 'No subdomain yet'}
        </p>
      </td>

      <td className="px-5 py-4 align-middle">
        <p className="text-[11px] font-mono truncate" style={{ color: colors.text.muted }}>
          {displayUrl}
        </p>
      </td>

      <td className="px-5 py-4 align-middle text-center">
        <div className="flex items-center justify-center">
          <StatusBadge status={project.status} size="sm" />
        </div>
      </td>

      <td className="px-5 py-4 align-middle text-center">
        <div className="flex items-center justify-center gap-2 flex-wrap">
          <ActionTooltip label={canVisit ? 'Visit site' : 'Publish site'}>
            {canVisit ? (
              <a
                href={visitUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(event) => event.stopPropagation()}
                aria-label="Visit site"
                title="Visit site"
                className={buttonBaseClass}
                style={{
                  background: theme === 'dark' ? 'rgba(34,197,94,0.12)' : 'rgba(34,197,94,0.08)',
                  borderColor: theme === 'dark' ? 'rgba(34,197,94,0.24)' : 'rgba(34,197,94,0.18)',
                  color: '#22c55e',
                }}
              >
                <Globe size={13} />
              </a>
            ) : (
              <Link
                href={visitUrl}
                onClick={(event) => event.stopPropagation()}
                aria-label="Publish site"
                title="Publish site"
                className={buttonBaseClass}
                style={{
                  background: theme === 'dark' ? 'rgba(124,58,237,0.16)' : 'rgba(124,58,237,0.08)',
                  borderColor: theme === 'dark' ? 'rgba(124,58,237,0.28)' : 'rgba(124,58,237,0.18)',
                  color: theme === 'dark' ? '#c4b5fd' : '#7c3aed',
                }}
              >
                <ExternalLink size={13} />
              </Link>
            )}
          </ActionTooltip>

          {published && (
            <ActionTooltip label={unpublishingId === project.id ? 'Taking down site…' : 'Take down site'}>
              <button
                type="button"
                onClick={(event) => onUnpublish(project.id, event)}
                disabled={unpublishingId === project.id}
                aria-label="Take down site"
                title="Take down site"
                className={buttonBaseClass}
                style={{
                  background: theme === 'dark' ? 'rgba(239,68,68,0.12)' : 'rgba(239,68,68,0.06)',
                  borderColor: theme === 'dark' ? 'rgba(239,68,68,0.22)' : 'rgba(239,68,68,0.18)',
                  color: '#f87171',
                }}
              >
                <ArrowDownToLine size={13} />
              </button>
            </ActionTooltip>
          )}

          {copyUrl && (
            <ActionTooltip label="Copy URL">
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  onCopyUrl(copyUrl);
                }}
                aria-label="Copy URL"
                title="Copy URL"
                className={buttonBaseClass}
                style={{
                  background: theme === 'dark' ? 'rgba(255,255,255,0.04)' : 'rgba(18,25,58,0.03)',
                  borderColor: theme === 'dark' ? 'rgba(255,255,255,0.08)' : colors.border.faint,
                  color: colors.text.secondary,
                }}
              >
                <Copy size={13} />
              </button>
            </ActionTooltip>
          )}
        </div>
      </td>
    </motion.tr>
  );
}
