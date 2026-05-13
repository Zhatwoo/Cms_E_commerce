'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { type MouseEvent } from 'react';
import { ArrowDownToLine, ExternalLink, Globe } from 'lucide-react';

import { DraftPreviewThumbnail } from '../../components/projects/DraftPreviewThumbnail';
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

export function DomainCard({
  project,
  subdomain,
  origin,
  theme,
  colors,
  selected,
  unpublishingId,
  onSelect,
  onUnpublish,
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
}) {
  const published = isPublished(project.status);
  const canVisit = Boolean(subdomain && published);
  const displayUrl = subdomain ? getDisplayUrl(subdomain, origin) : 'No subdomain';

  return (
    <motion.div
  initial={{ opacity: 0, y: 10 }}
  animate={{ opacity: 1, y: 0 }}
  exit={{ opacity: 0 }}
  transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
  // REMOVED overflow-hidden here to allow the tooltip to break out
  className="relative rounded-[2.2rem] cursor-pointer transition-all duration-500 group border"
  style={{
    background: theme === 'dark' ? '#15093E' : '#F6F7FB',
    borderColor: selected
      ? (theme === 'dark' ? '#7C3AED' : '#7C3AED') // Unified brand purple for selection
      : (theme === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(21,9,62,0.05)'),
    boxShadow: selected
      ? (theme === 'dark' ? '0 25px 50px -12px rgba(0,0,0,0.5)' : '0 20px 40px rgba(124,58,237,0.08)')
      : 'none',
  }}
  whileHover={{ y: -4 }}
  whileTap={{ scale: 0.99 }}
  onClick={() => onSelect(project, subdomain)}
>
  {/* 1. Visual Frame - Overflow hidden kept here specifically */}
  <div className="relative aspect-[16/10] m-2 overflow-hidden rounded-[1.8rem] bg-black/10">
    <DraftPreviewThumbnail
      projectId={project.id}
      borderColor="transparent"
      bgColor="transparent"
    />
    
    <div className="absolute bottom-3 right-3 z-10 scale-90">
      <StatusBadge status={project.status} size="sm" />
    </div>
  </div>

  {/* 2. Metadata */}
  <div className="px-5 py-3">
    <div className="flex flex-col gap-0.5">
      <h3 
        className="font-black text-sm tracking-tight truncate" 
        style={{ color: theme === 'dark' ? '#FFFFFF' : '#15093E', fontFamily: 'var(--font-outfit)' }}
      >
        {project.title}
      </h3>
      <p 
        className="text-[10px] font-mono truncate opacity-30 italic" 
        style={{ color: theme === 'dark' ? '#FFFFFF' : '#15093E' }}
      >
        {displayUrl || 'no-domain-assigned'}
      </p>
    </div>
  </div>

  {/* 3. Actions Row */}
  <div className="px-4 pb-4">
    <div className="flex items-center gap-2">
      {canVisit ? (
        <a
          href={getSubdomainSiteUrl(subdomain as string, origin)}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="flex-1 h-10 flex items-center justify-center gap-2 rounded-xl text-[10px] font-black uppercase tracking-[0.15em] text-white transition-all hover:brightness-110"
          style={{
            background: theme === 'dark'
              ? 'rgba(124, 58, 237, 0.15)'
              : '#7C3AED',
            border: theme === 'dark' ? '1px solid rgba(124, 58, 237, 0.3)' : 'none',
            color: theme === 'dark' ? '#C4B5FD' : '#FFFFFF',
          }}
        >
          <Globe size={12} /> Visit Site
        </a>
      ) : (
        <Link
          href={`/design?projectId=${project.id}`}
          onClick={(e) => e.stopPropagation()}
          className="flex-1 h-10 flex items-center justify-center gap-2 rounded-xl text-[10px] font-black uppercase tracking-[0.15em] transition-all hover:brightness-105"
          style={{ 
            // Solid purple in dark mode, gradient in light mode
            background: theme === 'dark' 
              ? '#7C3AED' 
              : 'linear-gradient(135deg, #7C3AED 0%, #D946EF 100%)',
            border: 'none',
            color: '#FFFFFF'
          }}
        >
          <ExternalLink size={12} /> Go Live
        </Link>
      )}
      
      {published && (
        <div className="relative group/tooltip">
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onUnpublish(project.id, e); }}
            disabled={unpublishingId === project.id}
            className={`cursor-pointer w-10 h-10 flex items-center justify-center rounded-xl transition-all border border-red-500/10 ${theme === 'dark' ? 'bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white' : 'bg-red-500/5 text-red-600 hover:bg-red-500/10 hover:border-red-500/20 hover:text-red-700'}`}
          >
            <ArrowDownToLine size={14} className="rotate-180" />
          </button>
          
          {/* TOOLTIP FIX: Added z-50 and ensured parent doesn't clip */}
          <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 px-3 py-2 bg-[#12193A] rounded-lg opacity-0 group-hover/tooltip:opacity-100 transition-all pointer-events-none whitespace-nowrap z-[100] shadow-2xl border border-white/10">
            <span className="text-[9px] font-black uppercase tracking-widest text-white">Take Down Site</span>
            {/* Top Arrow */}
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 border-[5px] border-transparent border-b-[#12193A]" />
          </div>
        </div>
      )}
    </div>
  </div>
</motion.div>
  );
}
