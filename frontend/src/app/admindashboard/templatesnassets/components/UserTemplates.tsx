'use client';

import React from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { Edit3, Eye, PauseCircle, ShieldAlert, Trash2 } from 'lucide-react';

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
  if (!input) return 'No date available';
  const date = new Date(input);
  if (Number.isNaN(date.getTime())) return 'No date available';
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
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
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.3 }}
      className="space-y-5"
    >
      <div className="flex justify-end">
        <button
          type="button"
          onClick={onReload}
          className="rounded-lg border border-[rgba(177,59,255,0.35)] bg-white/80 px-3 py-1.5 text-xs font-semibold text-[#5B21B6] hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
          disabled={loading}
        >
          {loading ? 'Refreshing...' : 'Reload'}
        </button>
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
        {templates.map((template) => {
          const isDeleting = deletingTemplateId === template.id;
          const isRenaming = renamingTemplateId === template.id;
          const isSuspending = suspendingTemplateId === template.id;
          const authorLabel = template.username || (template.ownerId ? `User ${template.ownerId}` : 'Unknown author');
          const dateLabel = formatTemplateDate(template.updatedAt || template.createdAt);
          const normalizedStatus = String(template.status || '').trim().toLowerCase() || 'template';
          const isSuspended = normalizedStatus === 'suspended';
          const statusLabel = isSuspended ? 'SUSPENDED' : 'DRAFT';

          const stopEvent = (event: React.MouseEvent<HTMLButtonElement>) => {
            event.stopPropagation();
          };

          return (
            <motion.div
              key={template.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ y: -5 }}
              transition={{ duration: 0.24 }}
              className="group relative flex min-h-[340px] cursor-pointer flex-col overflow-hidden rounded-[28px]"
              style={{
                border: '1.5px solid rgba(166,61,255,0.12)',
                boxShadow: '0 8px 30px rgba(103,2,191,0.06)',
                background: 'linear-gradient(135deg, #ffffff 0%, #f9f8ff 100%)',
              }}
              onClick={() => onPreview?.(template)}
              role="button"
              tabIndex={0}
              onKeyDown={(event) => {
                if ((event.key === 'Enter' || event.key === ' ') && onPreview) {
                  event.preventDefault();
                  onPreview(template);
                }
              }}
            >
              <div className="relative h-44 overflow-hidden" style={{ background: '#f5f4ff' }}>
                {template.thumbnail ? (
                  <Image src={template.thumbnail} alt={template.name} fill className="object-cover transition-transform duration-700 group-hover:scale-105" unoptimized />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#8FC67E] via-[#4F805C] to-[#1E3C3C]">
                    <span className="text-sm font-semibold tracking-wide text-white/90">{template.category}</span>
                  </div>
                )}

                <div
                  className="absolute left-4 top-4 z-10 flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest shadow-md"
                  style={{ background: 'rgba(255,255,255,0.95)', border: '1px solid rgba(166,61,255,0.1)' }}
                >
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ background: isSuspended ? '#FF4343' : '#FFCC00' }}
                  />
                  <span style={{ color: isSuspended ? '#FF4343' : '#7a5b00' }}>{statusLabel}</span>
                </div>

                <div
                  className="absolute bottom-4 left-4 z-10 rounded-lg px-2.5 py-1 text-[9px] font-black uppercase tracking-widest"
                  style={{ background: 'rgba(74, 26, 138, 0.8)', color: 'white', backdropFilter: 'blur(4px)' }}
                >
                  {template.category || 'General'}
                </div>
              </div>

              <div className="flex flex-1 flex-col p-5">
                <div className="mb-4">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="flex-1 truncate text-base font-black tracking-tight" style={{ color: '#2d1a50' }} title={template.name}>
                      {template.name}
                    </h4>
                    <div className="h-2 w-2 shrink-0 rounded-full" style={{ background: 'rgba(166,61,255,0.3)' }} />
                  </div>
                  <p className="mt-1 text-[10px] font-bold uppercase tracking-widest opacity-50" style={{ color: '#7a6aa0' }}>
                    {authorLabel}
                  </p>
                </div>

                <div className="mt-auto rounded-2xl border border-[rgba(166,61,255,0.08)] bg-[rgba(166,61,255,0.03)] px-3 py-3">
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={(event) => {
                        stopEvent(event);
                        onSuspend?.(template);
                      }}
                      disabled={isSuspending || isDeleting || isRenaming}
                      className="flex flex-col items-center justify-center gap-1 rounded-lg px-2 py-2 text-[10px] font-black uppercase tracking-wider text-[#7a6aa0] transition hover:bg-[rgba(166,61,255,0.09)] disabled:cursor-not-allowed disabled:opacity-60"
                      title="Suspend Template"
                    >
                      {isSuspending ? (
                        <ShieldAlert className="h-4 w-4 text-[#FF4343]" />
                      ) : (
                        <PauseCircle className="h-4 w-4 text-[#FF4343]" />
                      )}
                      <span>{isSuspending ? 'Working...' : 'Suspend'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={(event) => {
                        stopEvent(event);
                        onRename?.(template);
                      }}
                      disabled={isRenaming || isDeleting || isSuspending}
                      className="flex flex-col items-center justify-center gap-1 rounded-lg px-2 py-2 text-[10px] font-black uppercase tracking-wider text-[#7a6aa0] transition hover:bg-[rgba(166,61,255,0.09)] disabled:cursor-not-allowed disabled:opacity-60"
                      title="Rename Template"
                    >
                      <Edit3 className="h-4 w-4 text-[#7b1de8]" />
                      <span>{isRenaming ? 'Working...' : 'Rename'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={(event) => {
                        stopEvent(event);
                        onDelete?.(template);
                      }}
                      disabled={isDeleting || isRenaming || isSuspending}
                      className="flex flex-col items-center justify-center gap-1 rounded-lg px-2 py-2 text-[10px] font-black uppercase tracking-wider text-[#7a6aa0] transition hover:bg-[rgba(255,67,67,0.09)] disabled:cursor-not-allowed disabled:opacity-60"
                      title="Delete Template"
                    >
                      <Trash2 className="h-4 w-4 text-[#FF4343]" />
                      <span>{isDeleting ? 'Working...' : 'Delete'}</span>
                    </button>
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between text-[9px] font-bold uppercase tracking-wider opacity-40" style={{ color: '#7a6aa0' }}>
                  <span>{template.domainName || `Updated ${dateLabel}`}</span>
                  <Eye className="h-3 w-3" />
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {!loading && templates.length === 0 && (
        <div className="admin-dashboard-inset-panel rounded-2xl border border-[rgba(177,59,255,0.2)] px-6 py-10 text-center">
          <p className="text-base font-medium text-[#471396]">No user templates found matching your search.</p>
        </div>
      )}

      {loading && (
        <div className="admin-dashboard-inset-panel rounded-2xl border border-[rgba(177,59,255,0.2)] px-6 py-10 text-center">
          <p className="text-base font-medium text-[#471396]">Loading user templates...</p>
        </div>
      )}
    </motion.div>
  );
}
