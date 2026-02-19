'use client';

import React, { useEffect, useState } from 'react';
import { ExternalLink, X, Globe, Calendar, FileText } from 'lucide-react';
import { useTheme } from '../components/context/theme-context';
import { useAuth } from '../components/context/auth-context';
import { listProjects, getSchedule, getPublishHistory, type Project, type PublishHistoryEntry } from '@/lib/api';
import { subscribeUserProjectSubdomains, type ProjectSubdomainEntry } from '@/lib/firebase';

const BASE_DOMAIN = process.env.NEXT_PUBLIC_BASE_DOMAIN ?? 'websitelink';
/** Host for subdomain display (e.g. panes/localhost:3000 or panes.websitelink) */
const SITE_HOST = process.env.NEXT_PUBLIC_SITE_HOST ?? 'localhost:3000';

/** Normalized subdomain slug for URLs. */
function toSubdomainSlug(subdomain: string): string {
  return subdomain.trim().toLowerCase().replace(/[^a-z0-9-]/g, '') || '';
}

/**
 * Full URL to open the published site (subdomain-based, like Vercel).
 * In dev: http://subdomain.localhost:3000. In production: https://subdomain.websitelink (or your BASE_DOMAIN).
 */
function getSubdomainSiteUrl(subdomain: string, origin: string | null): string {
  const slug = toSubdomainSlug(subdomain);
  if (!slug) return '#';
  if (origin && (origin.includes('localhost') || origin.includes('127.0.0.1'))) {
    const port = typeof window !== 'undefined' ? window.location.port || '3000' : '3000';
    return `http://${slug}.localhost:${port}`;
  }
  return `https://${slug}.${BASE_DOMAIN}`;
}

/** Display URL: subdomain/host format e.g. panes/localhost:3000, or subdomain.base in production */
function getSiteDisplayUrl(subdomain: string, origin: string | null): string {
  const slug = toSubdomainSlug(subdomain);
  if (origin && (origin.includes('localhost') || origin.includes('127.0.0.1'))) {
    return `${slug}/${SITE_HOST}`;
  }
  return `${slug}.${BASE_DOMAIN}`;
}

export default function DomainsPage() {
  const { colors } = useTheme();
  const { user, loading: authLoading } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectsLoading, setProjectsLoading] = useState(true);
  const [subdomainsByProject, setSubdomainsByProject] = useState<Record<string, ProjectSubdomainEntry>>({});
  const [origin, setOrigin] = useState<string | null>(null);

  useEffect(() => {
    setOrigin(typeof window !== 'undefined' ? window.location.origin : null);
  }, []);

  // Load projects from API
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await listProjects();
        if (!cancelled && res.success && res.projects) setProjects(res.projects);
      } catch {
        if (!cancelled) setProjects([]);
      } finally {
        if (!cancelled) setProjectsLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Subscribe to Firebase subdomains at /user/roles/client/{uid}/projects
  useEffect(() => {
    const uid = user?.id;
    if (!uid) {
      setSubdomainsByProject({});
      return undefined;
    }
    const unsub = subscribeUserProjectSubdomains(uid, setSubdomainsByProject);
    return () => { unsub?.(); };
  }, [user?.id]);

  const loading = authLoading || projectsLoading;
  const domainsList = projects
    .map((p) => ({
      project: p,
      subdomain: subdomainsByProject[p.id]?.subdomain ?? p.subdomain ?? null,
    }))
    .filter((d) => d.subdomain);

  type DomainEntry = { project: Project; subdomain: string };
  const [selectedDomain, setSelectedDomain] = useState<DomainEntry | null>(null);
  const [scheduleInfo, setScheduleInfo] = useState<{ scheduledAt: string; subdomain: string | null } | null>(null);
  const [publishHistory, setPublishHistory] = useState<PublishHistoryEntry[]>([]);

  useEffect(() => {
    if (!selectedDomain?.project.id) {
      setScheduleInfo(null);
      setPublishHistory([]);
      return;
    }
    let cancelled = false;
    const pid = selectedDomain.project.id;
    getSchedule(pid).then((res) => {
      if (!cancelled && res.success && res.data) setScheduleInfo(res.data);
      else if (!cancelled) setScheduleInfo(null);
    });
    getPublishHistory(pid).then((res) => {
      if (!cancelled && res.success && res.data?.history) setPublishHistory(res.data.history);
      else if (!cancelled) setPublishHistory([]);
    });
    return () => { cancelled = true; };
  }, [selectedDomain?.project.id]);

  const siteUrl = selectedDomain
    ? getSubdomainSiteUrl(selectedDomain.subdomain, origin)
    : '';

  return (
    <section className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold" style={{ color: colors.text.primary }}>Domains</h1>
        <p className="mt-1 text-sm" style={{ color: colors.text.secondary }}>
          Connect and manage domains for your published sites. Subdomains are synced from your projects.
        </p>
      </header>

      <div className="flex flex-col md:flex-row md:gap-6">
        {loading ? (
          <div
            className="rounded-2xl border p-6 shadow-lg flex-1"
            style={{ backgroundColor: colors.bg.card, borderColor: colors.border.faint }}
          >
            <p className="text-sm" style={{ color: colors.text.muted }}>Loading…</p>
          </div>
        ) : domainsList.length === 0 ? (
          <div
            className="rounded-2xl border p-6 shadow-lg flex items-center justify-between transition-colors flex-1"
            style={{
              backgroundColor: colors.bg.card,
              borderColor: colors.border.faint,
            }}
          >
            <div>
              <p className="text-sm font-medium" style={{ color: colors.text.primary }}>No domains connected yet</p>
              <p className="text-xs mt-1" style={{ color: colors.text.muted }}>
                When you publish your website and set a subdomain on a project, it will appear here.
              </p>
            </div>
            <button
              type="button"
              className="px-4 py-2 text-sm font-medium rounded-lg transition-colors"
              style={{
                backgroundColor: colors.text.primary,
                color: colors.bg.primary,
              }}
            >
              Add domain
            </button>
          </div>
        ) : (
          <div className="space-y-3 flex-1 min-w-0">
          {domainsList.map(({ project, subdomain }) => (
            <div
              key={project.id}
              role="button"
              tabIndex={0}
              onClick={() => setSelectedDomain({ project, subdomain: subdomain ?? '' })}
              onKeyDown={(e) => e.key === 'Enter' && setSelectedDomain({ project, subdomain: subdomain ?? '' })}
              className="rounded-2xl border p-4 shadow-sm flex items-center justify-between gap-3 transition-colors cursor-pointer hover:opacity-95"
              style={{
                backgroundColor: colors.bg.card,
                borderColor: colors.border.faint,
              }}
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate" style={{ color: colors.text.primary }}>{project.title}</p>
                <p className="text-xs mt-0.5 font-mono truncate" style={{ color: colors.text.secondary }}>
                  {getSiteDisplayUrl(subdomain ?? '', origin)}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span
                  className="text-xs px-2 py-1 rounded-full capitalize"
                  style={{
                    backgroundColor: project.status === 'published' ? 'rgba(34,197,94,0.2)' : 'rgba(245,158,11,0.2)',
                    color: project.status === 'published' ? 'rgb(22,163,74)' : 'rgb(180,83,9)',
                  }}
                >
                  {project.status || 'draft'}
                </span>
                <a
                  href={getSubdomainSiteUrl(subdomain ?? '', origin)}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors shrink-0"
                  style={{
                    backgroundColor: colors.text.primary,
                    color: colors.bg.primary,
                  }}
                >
                  <ExternalLink size={14} />
                  Continue to website
                </a>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Right sidebar: website details + publish history */}
      {selectedDomain && (
        <aside
          className="w-full md:w-96 shrink-0 rounded-2xl border overflow-hidden flex flex-col"
          style={{
            backgroundColor: colors.bg.card,
            borderColor: colors.border.faint,
          }}
        >
          <div className="p-4 border-b flex items-center justify-between" style={{ borderColor: colors.border.faint }}>
            <h2 className="text-lg font-semibold" style={{ color: colors.text.primary }}>Website details</h2>
            <button
              type="button"
              onClick={() => setSelectedDomain(null)}
              className="p-1.5 rounded-lg hover:opacity-80 transition-opacity"
              style={{ color: colors.text.secondary }}
              aria-label="Close sidebar"
            >
              <X size={20} />
            </button>
          </div>
          <div className="p-4 flex-1 overflow-y-auto space-y-5">
            <div>
              <div className="flex items-center gap-2 text-sm font-medium mb-1" style={{ color: colors.text.secondary }}>
                <FileText size={16} />
                Title
              </div>
              <p className="text-base font-medium" style={{ color: colors.text.primary }}>{selectedDomain.project.title}</p>
            </div>
            <div>
              <div className="flex items-center gap-2 text-sm font-medium mb-1" style={{ color: colors.text.secondary }}>
                <Globe size={16} />
                Subdomain
              </div>
              <p className="text-sm font-mono" style={{ color: colors.text.primary }}>
                {getSiteDisplayUrl(selectedDomain.subdomain, origin)}
              </p>
            </div>
            <div>
              <div className="flex items-center gap-2 text-sm font-medium mb-1" style={{ color: colors.text.secondary }}>
                Link
              </div>
              <a
                href={siteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm font-medium break-all hover:underline"
                style={{ color: colors.text.primary }}
              >
                {siteUrl}
                <ExternalLink size={14} className="shrink-0" />
              </a>
            </div>
            <div>
              <div className="text-sm font-medium mb-1" style={{ color: colors.text.secondary }}>Status</div>
              <span
                className="text-xs px-2 py-1 rounded-full capitalize"
                style={{
                  backgroundColor: selectedDomain.project.status === 'published' ? 'rgba(34,197,94,0.2)' : 'rgba(245,158,11,0.2)',
                  color: selectedDomain.project.status === 'published' ? 'rgb(22,163,74)' : 'rgb(180,83,9)',
                }}
              >
                {selectedDomain.project.status || 'draft'}
              </span>
            </div>
            {selectedDomain.project.createdAt && (
              <div>
                <div className="text-sm font-medium mb-1" style={{ color: colors.text.secondary }}>Created</div>
                <p className="text-sm" style={{ color: colors.text.primary }}>
                  {new Date(selectedDomain.project.createdAt).toLocaleString()}
                </p>
              </div>
            )}
            {selectedDomain.project.updatedAt && (
              <div>
                <div className="text-sm font-medium mb-1" style={{ color: colors.text.secondary }}>Last updated</div>
                <p className="text-sm" style={{ color: colors.text.primary }}>
                  {new Date(selectedDomain.project.updatedAt).toLocaleString()}
                </p>
              </div>
            )}

            <div className="pt-3 border-t space-y-3" style={{ borderColor: colors.border.faint }}>
              <div className="flex items-center gap-2 text-sm font-semibold" style={{ color: colors.text.primary }}>
                <Calendar size={16} />
                Publish history
              </div>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center justify-between gap-2">
                  <span style={{ color: colors.text.secondary }}>Status</span>
                  <span
                    className="capitalize px-2 py-0.5 rounded text-xs font-medium"
                    style={{
                      backgroundColor: selectedDomain.project.status === 'published' ? 'rgba(34,197,94,0.2)' : 'rgba(245,158,11,0.2)',
                      color: selectedDomain.project.status === 'published' ? 'rgb(22,163,74)' : 'rgb(180,83,9)',
                    }}
                  >
                    {selectedDomain.project.status === 'published' ? 'Published' : 'Draft'}
                  </span>
                </li>
                {scheduleInfo?.scheduledAt && (
                  <li className="flex items-center justify-between gap-2">
                    <span style={{ color: colors.text.secondary }}>Next scheduled</span>
                    <span style={{ color: colors.text.primary }}>
                      {new Date(scheduleInfo.scheduledAt).toLocaleString()}
                    </span>
                  </li>
                )}
              </ul>
              <div>
                <div className="text-xs font-medium mb-2" style={{ color: colors.text.secondary }}>Last 10 changes (newest first)</div>
                {publishHistory.length > 0 ? (
                  <ul className="space-y-1.5 max-h-48 overflow-y-auto">
                    {publishHistory.map((entry, i) => (
                      <li
                        key={`${entry.at}-${i}`}
                        className="flex items-center justify-between gap-2 py-1.5 px-2 rounded text-xs"
                        style={{
                          backgroundColor: colors.bg.primary,
                          color: colors.text.primary,
                          borderLeft: '3px solid rgba(56, 189, 248, 0.6)',
                        }}
                      >
                        <span className="capitalize" style={{ color: colors.text.secondary }}>{entry.type}</span>
                        <span>{new Date(entry.at).toLocaleString()}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs py-1" style={{ color: colors.text.muted }}>
                    No publish history yet. History is recorded each time you publish.
                  </p>
                )}
              </div>
              {!scheduleInfo?.scheduledAt && selectedDomain.project.status === 'published' && (
                <p className="text-xs" style={{ color: colors.text.muted }}>
                  No upcoming scheduled publish.
                </p>
              )}
            </div>
          </div>
        </aside>
        )}
      </div>
    </section>
  );
}
