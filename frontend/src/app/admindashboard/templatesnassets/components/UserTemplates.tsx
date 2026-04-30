'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { Edit3, Eye, PauseCircle, ShieldAlert, Trash2, RefreshCw } from 'lucide-react';

interface Template {
  id: string;
  name: string;
  category: string;
  status?: string;
  username?: string;
  ownerId?: string;
  domainName?: string;
  createdAt?: string;
  updatedAt?: string;
  thumbnail: string;
}

interface UserTemplatesProps {
  templates: Template[];
  loading?: boolean;
  deletingTemplateId?: string | null;
  renamingTemplateId?: string | null;
  suspendingTemplateId?: string | null;
  onPreview?: (template: Template) => void;
  onSuspend?: (template: Template) => void;
  onRename?: (template: Template) => void;
  onDelete?: (template: Template) => void;
  onReload?: () => void;
}

function formatTemplateDate(input?: string) {
  if (!input) return 'No date';
  const date = new Date(input);
  if (Number.isNaN(date.getTime())) return 'No date';
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/* ── Skeleton card while loading ─────────────────────────────── */
function SkeletonCard() {
  return (
    <div className="overflow-hidden rounded-[24px] animate-pulse"
      style={{ border: '1px solid rgba(166,61,255,0.1)', background: 'rgba(255,255,255,0.7)', minHeight: 320 }}>
      <div className="h-44" style={{ background: 'rgba(240,235,255,0.7)' }} />
      <div className="p-5 space-y-3">
        <div className="h-4 w-2/3 rounded-lg" style={{ background: 'rgba(166,61,255,0.1)' }} />
        <div className="h-3 w-1/2 rounded-lg" style={{ background: 'rgba(166,61,255,0.07)' }} />
        <div className="mt-6 h-16 rounded-2xl" style={{ background: 'rgba(166,61,255,0.06)' }} />
      </div>
    </div>
  );
}

/* ── Empty State ─────────────────────────────────────────────── */
function EmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="rounded-[24px] px-8 py-16 text-center"
      style={{
        background: 'rgba(255,255,255,0.84)',
        border: '1px solid rgba(166,61,255,0.13)',
        boxShadow: '0 4px 24px rgba(103,2,191,0.06)',
      }}
    >
      <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full"
        style={{ background: 'rgba(166,61,255,0.07)', border: '1px solid rgba(166,61,255,0.12)' }}>
        <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#c4a8e8' }}>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      </div>
      <p className="text-base font-semibold" style={{ color: '#4a1a8a' }}>No user templates found</p>
      <p className="mt-1 text-sm" style={{ color: '#a090c8' }}>Try adjusting your search or reload the list.</p>
    </motion.div>
  );
}

export default function UserTemplates({
  templates,
  loading = false,
  deletingTemplateId = null,
  renamingTemplateId = null,
  suspendingTemplateId = null,
  onPreview,
  onSuspend,
  onRename,
  onDelete,
  onReload,
}: UserTemplatesProps) {
  return (
    <motion.div
      key="user"
      initial={{ opacity: 0, x: -16 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 16 }}
      transition={{ duration: 0.3 }}
      className="space-y-4 sm:space-y-5"
    >
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm font-medium" style={{ color: '#a090c8' }}>
          {loading ? 'Loading…' : `${templates.length} template${templates.length !== 1 ? 's' : ''}`}
        </p>
        <button
          type="button"
          onClick={onReload}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-50"
          style={{
            background: 'rgba(255,255,255,0.9)',
            border: '1.5px solid rgba(166,61,255,0.18)',
            color: '#7b1de8',
            boxShadow: '0 1px 4px rgba(103,2,191,0.05)',
          }}
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          {loading ? 'Refreshing…' : 'Reload'}
        </button>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:gap-5 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : templates.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:gap-5 md:grid-cols-2 xl:grid-cols-3">
          <AnimatePresence mode="popLayout">
            {templates.map((template, index) => {
              const isDeleting = deletingTemplateId === template.id;
              const isRenaming = renamingTemplateId === template.id;
              const isSuspending = suspendingTemplateId === template.id;
              const isBusy = isDeleting || isRenaming || isSuspending;
              const authorLabel = template.username || (template.ownerId ? `User ${template.ownerId}` : 'Unknown');
              const dateLabel = formatTemplateDate(template.updatedAt || template.createdAt);
              const normalizedStatus = String(template.status || '').trim().toLowerCase();
              const isSuspended = normalizedStatus === 'suspended';
              const statusLabel = isSuspended ? 'Suspended' : normalizedStatus === 'published' ? 'Published' : 'Draft';

              const stopEvent = (e: React.MouseEvent<HTMLButtonElement>) => e.stopPropagation();

              return (
                <motion.div
                  key={template.id}
                  layout
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.3, delay: index * 0.04 }}
                    whileHover={{ y: -4, transition: { duration: 0.3 } }}
                  className="group relative flex flex-col overflow-hidden cursor-pointer rounded-[24px] border border-[rgba(177,59,255,0.18)] bg-white shadow-[0_12px_30px_rgba(71,19,150,0.12)]"
                  style={{
                    minHeight: 340,
                  }}
                  onClick={() => onPreview?.(template)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if ((e.key === 'Enter' || e.key === ' ') && onPreview) {
                      e.preventDefault();
                      onPreview(template);
                    }
                  }}
                >
                  {/* Thumbnail */}
                  <div className="relative h-48 overflow-hidden bg-[#DAD6F8]">
                    {template.thumbnail ? (
                      <Image
                        src={template.thumbnail}
                        alt={template.name}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                        unoptimized
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center"
                        style={{ background: 'linear-gradient(135deg, #ede9ff 0%, #ddd5ff 100%)' }}>
                        <svg className="h-10 w-10 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#7b1de8' }}>
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1}
                            d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
                        </svg>
                      </div>
                    )}

                    {/* Status badge */}
                    <div className="absolute left-3 top-3 z-10 flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider shadow-sm"
                      style={{
                        background: 'rgba(255,255,255,0.95)',
                        border: '1px solid rgba(166,61,255,0.12)',
                        color: isSuspended ? '#dc2626' : normalizedStatus === 'published' ? '#16a34a' : '#7a5b00',
                      }}>
                      <span className="h-1.5 w-1.5 rounded-full"
                        style={{ background: isSuspended ? '#ef4444' : normalizedStatus === 'published' ? '#22c55e' : '#f5c000' }} />
                      {statusLabel}
                    </div>

                    {/* Category badge */}
                    <div className="absolute bottom-3 left-3 z-10 rounded-lg px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider"
                      style={{ background: 'rgba(74,26,138,0.75)', color: 'white', backdropFilter: 'blur(6px)' }}>
                      {template.category || 'General'}
                    </div>

                    {/* Preview hint on hover */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                      style={{ background: 'rgba(74,26,138,0.18)', backdropFilter: 'blur(2px)' }}>
                      <div className="flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold text-white shadow-lg"
                        style={{ background: 'rgba(74,26,138,0.85)' }}>
                        <Eye className="h-3.5 w-3.5" />
                        Preview
                      </div>
                    </div>
                  </div>

                  {/* Card body */}
                  <div className="flex flex-1 flex-col p-4 sm:p-5">
                    {/* Title + author */}
                    <div className="mb-4 flex-1">
                      <h4 className="truncate text-[0.95rem] font-bold tracking-tight leading-snug" style={{ color: '#2d1a50' }} title={template.name}>
                        {template.name}
                      </h4>
                      <div className="mt-1.5 flex items-center gap-2">
                        <div className="flex h-5 w-5 items-center justify-center rounded-full shrink-0"
                          style={{ background: 'rgba(166,61,255,0.1)' }}>
                          <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20" style={{ color: '#9b6fdb' }}>
                            <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <p className="truncate text-[11px] font-semibold" style={{ color: '#a090c8' }}>{authorLabel}</p>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="rounded-[18px] p-2"
                      style={{ background: 'rgba(240,235,255,0.7)', border: '1px solid rgba(166,61,255,0.09)' }}>
                      <div className="grid grid-cols-3 gap-1.5">
                        {/* Suspend */}
                        <button
                          type="button"
                          onClick={(e) => { stopEvent(e); onSuspend?.(template); }}
                          disabled={isBusy}
                          title="Suspend Template"
                          className="flex min-h-10 flex-col items-center justify-center gap-1.5 rounded-xl py-2.5 text-[10px] font-bold uppercase tracking-wider transition-all disabled:cursor-not-allowed disabled:opacity-50"
                          style={{ color: '#dc2626' }}
                          onMouseEnter={(e) => !isBusy && (e.currentTarget.style.background = 'rgba(239,68,68,0.08)')}
                          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                        >
                          {isSuspending
                            ? <ShieldAlert className="h-4 w-4 animate-pulse" />
                            : <PauseCircle className="h-4 w-4" />
                          }
                          <span>{isSuspending ? 'Working…' : 'Suspend'}</span>
                        </button>

                        {/* Rename */}
                        <button
                          type="button"
                          onClick={(e) => { stopEvent(e); onRename?.(template); }}
                          disabled={isBusy}
                          title="Rename Template"
                          className="flex min-h-10 flex-col items-center justify-center gap-1.5 rounded-xl py-2.5 text-[10px] font-bold uppercase tracking-wider transition-all disabled:cursor-not-allowed disabled:opacity-50"
                          style={{ color: '#7b1de8' }}
                          onMouseEnter={(e) => !isBusy && (e.currentTarget.style.background = 'rgba(123,29,232,0.08)')}
                          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                        >
                          <Edit3 className="h-4 w-4" />
                          <span>{isRenaming ? 'Working…' : 'Rename'}</span>
                        </button>

                        {/* Delete */}
                        <button
                          type="button"
                          onClick={(e) => { stopEvent(e); onDelete?.(template); }}
                          disabled={isBusy}
                          title="Delete Template"
                          className="flex flex-col items-center justify-center gap-1.5 rounded-xl py-2.5 text-[9px] font-bold uppercase tracking-wider transition-all disabled:cursor-not-allowed disabled:opacity-50"
                          style={{ color: '#dc2626' }}
                          onMouseEnter={(e) => !isBusy && (e.currentTarget.style.background = 'rgba(239,68,68,0.08)')}
                          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                        >
                          <Trash2 className="h-4 w-4" />
                          <span>{isDeleting ? 'Working…' : 'Delete'}</span>
                        </button>
                      </div>
                    </div>

                    {/* Footer meta */}
                    <div className="mt-3 flex items-center justify-between"
                      style={{ color: '#c4a8e8' }}>
                      <span className="text-[10px] font-semibold truncate">
                        {template.domainName || dateLabel}
                      </span>
                      <div className="flex items-center gap-1 text-[10px] font-semibold shrink-0 ml-2">
                        <Eye className="h-3 w-3" />
                        <span>Preview</span>
                      </div>
                    </div>
                  </div>

                  {/* Busy overlay */}
                  {isBusy && (
                    <div className="absolute inset-0 rounded-[24px] flex items-center justify-center"
                      style={{ background: 'rgba(255,255,255,0.6)', backdropFilter: 'blur(3px)' }}>
                      <div className="h-6 w-6 rounded-full border-2 border-[rgba(123,29,232,0.3)] border-t-[#7b1de8] animate-spin" />
                    </div>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </motion.div>
  );
}