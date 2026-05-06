'use client';

import React, { useState, useEffect } from 'react';
import { useTheme } from './context/theme-context';
import { publishProject, schedulePublish } from '@/lib/api';
import { getDraft } from '@/app/design/_lib/pageApi';
import { getSubdomainSiteUrl } from '@/lib/siteUrls';
import { ModalShell } from '@/components/ui/ModalShell';
import { ModalCard } from '@/components/ui/ModalCard';
import { ModalButton } from '@/components/ui/ModalButton';

const SUBDOMAIN_REGEX = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/;

function validateSubdomain(value: string): string | null {
  const trimmed = value.trim().toLowerCase();
  if (!trimmed) return 'Subdomain is required';
  if (trimmed.length > 63) return 'Subdomain must be 63 characters or less';
  if (!SUBDOMAIN_REGEX.test(trimmed)) return 'Use only letters, numbers, and hyphens. No leading or trailing hyphens.';
  return null;
}

function toSubdomainSlug(title: string): string {
  return (title || 'site').trim().toLowerCase().replace(/[^a-z0-9-]/g, '') || 'site';
}

export type PublishModalProps = {
  open: boolean;
  onClose: () => void;
  onSuccess: (subdomain: string) => void;
  projectId: string;
  projectTitle: string;
  existingSubdomain?: string | null;
  /** When provided with length > 1, shows project selector. Used by Domains Add flow. */
  projects?: Array<{ id: string; title: string; subdomain?: string | null }>;
  onProjectChange?: (projectId: string) => void;
};

export function PublishModal({
  open,
  onClose,
  onSuccess,
  projectId,
  projectTitle,
  existingSubdomain,
  projects = [],
  onProjectChange,
}: PublishModalProps) {
  const { colors } = useTheme();
  const [mode, setMode] = useState<'now' | 'schedule'>('now');
  const [subdomain, setSubdomain] = useState('');
  const [error, setError] = useState('');
  const [publishing, setPublishing] = useState(false);
  const [scheduling, setScheduling] = useState(false);
  const [scheduledAt, setScheduledAt] = useState('');

  const normalizedSlug = subdomain.trim().toLowerCase().replace(/[^a-z0-9-]/g, '') || 'site';
  const previewUrl = typeof window !== 'undefined'
    ? getSubdomainSiteUrl(normalizedSlug, window.location.origin).replace(/^https?:\/\//, '')
    : `${normalizedSlug}.websitelink`;

  useEffect(() => {
    if (open) {
      setSubdomain(existingSubdomain || toSubdomainSlug(projectTitle) || '');
      setError('');
      setMode('now');
      setScheduledAt('');
    }
  }, [open, existingSubdomain, projectTitle, projectId]);

  const handlePublishNow = async () => {
    const err = validateSubdomain(subdomain);
    if (err) {
      setError(err);
      return;
    }
    const normalized = subdomain.trim().toLowerCase().replace(/[^a-z0-9-]/g, '');
    if (!normalized) {
      setError('Subdomain is required');
      return;
    }
    setError('');
    setPublishing(true);
    try {
      let content: string | null = null;
      const draftRes = await getDraft(projectId);
      if (draftRes.success && draftRes.data?.content != null) {
        content = typeof draftRes.data.content === 'string'
          ? draftRes.data.content
          : JSON.stringify(draftRes.data.content);
      }
      if (!content && typeof window !== 'undefined' && window.sessionStorage) {
        const sessionKey = `craftjs_preview_json_${projectId}`;
        const sessionRaw = window.sessionStorage.getItem(sessionKey);
        if (sessionRaw && sessionRaw.trim()) content = sessionRaw;
      }
      if (!content) {
        setError('Design your site in the editor first, then publish. Open the project in Design, add content, and try again.');
        setPublishing(false);
        return;
      }
      const contentToPublish: string | null = content;
      const res = await publishProject(projectId, normalized, contentToPublish);
      if (res.success) {
        onSuccess(normalized);
        onClose();
      } else {
        setError(res.message || 'Publish failed');
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Publish failed');
    } finally {
      setPublishing(false);
    }
  };

  const handleSchedule = async () => {
    const err = validateSubdomain(subdomain);
    if (err) {
      setError(err);
      return;
    }
    if (!scheduledAt) {
      setError('Please pick a date and time.');
      return;
    }
    const normalized = subdomain.trim().toLowerCase().replace(/[^a-z0-9-]/g, '');
    if (!normalized) {
      setError('Subdomain is required');
      return;
    }
    setError('');
    setScheduling(true);
    try {
      let content: string | null = null;
      const draftRes = await getDraft(projectId);
      if (draftRes.success && draftRes.data?.content != null) {
        content = typeof draftRes.data.content === 'string'
          ? draftRes.data.content
          : JSON.stringify(draftRes.data.content);
      }
      if (!content && typeof window !== 'undefined' && window.sessionStorage) {
        const sessionKey = `craftjs_preview_json_${projectId}`;
        const sessionRaw = window.sessionStorage.getItem(sessionKey);
        if (sessionRaw && sessionRaw.trim()) content = sessionRaw;
      }
      if (!content) {
        setError('Design your site in the editor first. Open the project in Design, add content, and try again.');
        setScheduling(false);
        return;
      }
      const contentToPublish: string | null = content;
      const res = await schedulePublish(projectId, new Date(scheduledAt).toISOString(), normalized, contentToPublish);
      if (res.success) {
        onSuccess(normalized);
        onClose();
      } else {
        setError(res.message || 'Schedule failed');
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Schedule failed');
    } finally {
      setScheduling(false);
    }
  };

  return (
    <ModalShell
      isOpen={open}
      onClose={onClose}
      disabled={publishing || scheduling}
      usePortal
    >
      <ModalCard
        title="Publish to live domain"
        subtitle="Choose a subdomain for your public website"
        footer={
          <div className="flex gap-2 w-full justify-end">
            <ModalButton
              label="Cancel"
              onClick={onClose}
              variant="secondary"
              disabled={publishing || scheduling}
            />
            {mode === 'now' ? (
              <ModalButton
                label={publishing ? 'Publishing…' : 'Publish'}
                onClick={handlePublishNow}
                variant="primary"
                disabled={publishing || scheduling}
                primaryColor="#3B82F6"
              />
            ) : (
              <ModalButton
                label={scheduling ? 'Scheduling…' : 'Set schedule'}
                onClick={handleSchedule}
                variant="primary"
                disabled={publishing || scheduling}
                primaryColor="#F59E0B"
              />
            )}
          </div>
        }
      >
        <div className="space-y-4">
            {projects.length > 1 && onProjectChange && (
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: colors.text.secondary }}>
                  Project
                </label>
                <select
                  value={projectId}
                  onChange={(e) => onProjectChange(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border text-sm"
                  style={{
                    backgroundColor: colors.bg.primary,
                    borderColor: colors.border.faint,
                    color: colors.text.primary,
                  }}
                >
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>{p.title}</option>
                  ))}
                </select>
              </div>
            )}
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: colors.text.secondary }}>
                Live domain (subdomain) <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. mysite"
                value={subdomain}
                onChange={(e) => {
                  setSubdomain(e.target.value);
                  setError('');
                }}
                className="w-full px-3 py-2 rounded-lg border text-sm font-mono"
                style={{
                  backgroundColor: colors.bg.primary,
                  borderColor: error ? '#ef4444' : colors.border.faint,
                  color: colors.text.primary,
                }}
              />
              {subdomain.trim() && (
                <p className="text-xs mt-1" style={{ color: colors.text.muted }}>
                  Your site will be live at <span className="font-mono">{previewUrl}</span>
                </p>
              )}
              {error && (
                <p className="text-xs mt-1" style={{ color: '#ef4444' }}>{error}</p>
              )}
            </div>

            <div className="flex gap-2 p-1 rounded-lg" style={{ backgroundColor: colors.bg.elevated }}>
              <button
                type="button"
                onClick={() => setMode('now')}
                className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${mode === 'now' ? 'bg-blue-600 text-white' : ''}`}
                style={mode !== 'now' ? { color: colors.text.secondary } : undefined}
              >
                Publish now
              </button>
              <button
                type="button"
                onClick={() => setMode('schedule')}
                className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${mode === 'schedule' ? 'bg-amber-600 text-white' : ''}`}
                style={mode !== 'schedule' ? { color: colors.text.secondary } : undefined}
              >
                Schedule for later
              </button>
            </div>

            {mode === 'schedule' && (
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: colors.text.secondary }}>
                  When should your site go live?
                </label>
                <input
                  type="datetime-local"
                  value={scheduledAt}
                  onChange={(e) => setScheduledAt(e.target.value)}
                  min={new Date().toISOString().slice(0, 16)}
                  className="w-full px-3 py-2 rounded-lg border text-sm"
                  style={{
                    backgroundColor: colors.bg.primary,
                    borderColor: colors.border.faint,
                    color: colors.text.primary,
                  }}
                />
                <p className="text-xs mt-1" style={{ color: colors.text.muted }}>
                  Your current draft will go live at this date and time.
                </p>
              </div>
            )}
        </div>
      </ModalCard>
    </ModalShell>
  );
}
