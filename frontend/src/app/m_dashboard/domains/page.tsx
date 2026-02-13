'use client';

import React, { useEffect, useState } from 'react';
import { useTheme } from '../components/context/theme-context';
import { useAuth } from '../components/context/auth-context';
import { listProjects, type Project } from '@/lib/api';
import { subscribeUserProjectSubdomains, type ProjectSubdomainEntry } from '@/lib/firebase';

const BASE_DOMAIN = process.env.NEXT_PUBLIC_BASE_DOMAIN ?? 'yoursite.com';
/** Host for subdomain display (sir: subdomain/host e.g. panes/localhost:5000) */
const SITE_HOST = process.env.NEXT_PUBLIC_SITE_HOST ?? 'localhost:5000';

/** Link to view the published site. Use projectId so it always loads (no by-subdomain API). */
function getPublishedSiteUrl(projectId: string): string {
  return `/site/${encodeURIComponent(projectId)}`;
}

/** Display URL: subdomain/host format e.g. panes/localhost:5000, or subdomain.base in production */
function getSiteDisplayUrl(subdomain: string, origin: string | null): string {
  const slug = subdomain.trim().toLowerCase().replace(/[^a-z0-9-]/g, '') || '';
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

  return (
    <section className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold" style={{ color: colors.text.primary }}>Domains</h1>
        <p className="mt-1 text-sm" style={{ color: colors.text.secondary }}>
          Connect and manage domains for your published sites. Subdomains are synced from your projects.
        </p>
      </header>

      {loading ? (
        <div
          className="rounded-2xl border p-6 shadow-lg"
          style={{ backgroundColor: colors.bg.card, borderColor: colors.border.faint }}
        >
          <p className="text-sm" style={{ color: colors.text.muted }}>Loading…</p>
        </div>
      ) : domainsList.length === 0 ? (
        <div
          className="rounded-2xl border p-6 shadow-lg flex items-center justify-between transition-colors"
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
        <div className="space-y-3">
          {domainsList.map(({ project, subdomain }) => (
              <a
                key={project.id}
                href={getPublishedSiteUrl(project.id)}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-2xl border p-4 shadow-sm flex items-center justify-between transition-colors block hover:opacity-90 cursor-pointer"
                style={{
                  backgroundColor: colors.bg.card,
                  borderColor: colors.border.faint,
                }}
              >
                <div>
                  <p className="text-sm font-medium" style={{ color: colors.text.primary }}>{project.title}</p>
                  <p className="text-xs mt-0.5 font-mono" style={{ color: colors.text.secondary }}>
                    {getSiteDisplayUrl(subdomain ?? '', origin)}
                  </p>
                </div>
                <span
                  className="text-xs px-2 py-1 rounded-full capitalize"
                  style={{
                    backgroundColor: project.status === 'published' ? 'rgba(34,197,94,0.2)' : 'rgba(245,158,11,0.2)',
                    color: project.status === 'published' ? 'rgb(22,163,74)' : 'rgb(180,83,9)',
                  }}
                >
                  {project.status || 'draft'}
                </span>
              </a>
          ))}
        </div>
      )}
    </section>
  );
}
