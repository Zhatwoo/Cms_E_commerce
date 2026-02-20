'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../components/context/theme-context';
import { useAuth } from '../components/context/auth-context';
import { listProjects, type Project } from '@/lib/api';
import { subscribeUserProjectSubdomains, type ProjectSubdomainEntry } from '@/lib/firebase';
import { 
  Globe, 
  Plus, 
  Search, 
  ExternalLink, 
  Copy, 
  Settings, 
  Trash2, 
  Check,
  AlertCircle,
  Clock,
  TrendingUp
} from 'lucide-react';

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
  const { colors, theme } = useTheme();
  const { user, loading: authLoading } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectsLoading, setProjectsLoading] = useState(true);
  const [subdomainsByProject, setSubdomainsByProject] = useState<Record<string, ProjectSubdomainEntry>>({});
  const [origin, setOrigin] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

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

  // Filter domains based on search
  const filteredDomains = domainsList.filter(({ project, subdomain }) => {
    const query = searchQuery.toLowerCase();
    return (
      project.title.toLowerCase().includes(query) ||
      subdomain?.toLowerCase().includes(query)
    );
  });

  const handleCopyUrl = (subdomain: string, projectId: string) => {
    const url = getSubdomainSiteUrl(subdomain, origin);
    navigator.clipboard.writeText(url);
    setCopiedId(projectId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const stats = {
    total: domainsList.length,
    active: domainsList.filter(d => d.project.status === 'published').length,
    draft: domainsList.filter(d => d.project.status === 'draft').length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <section
        className="rounded-2xl border p-5 md:p-6"
        style={{
          backgroundColor: colors.bg.card,
          borderColor: colors.border.faint,
          boxShadow: theme === 'dark'
            ? 'inset 0 1px 0 rgba(255,255,255,0.06), 0 20px 50px rgba(2,6,23,0.55)'
            : 'inset 0 1px 0 rgba(255,255,255,0.8), 0 12px 30px rgba(15,23,42,0.12)',
        }}
      >
        <div className="relative">
          <div
            className="absolute -inset-x-6 -inset-y-4 rounded-3xl opacity-70 blur-2xl"
            style={{
              background: theme === 'dark'
                ? 'radial-gradient(60% 60% at 20% 20%, rgba(99,102,241,0.2), transparent 60%), radial-gradient(55% 55% at 80% 20%, rgba(14,165,233,0.16), transparent 60%), radial-gradient(50% 50% at 40% 80%, rgba(16,185,129,0.14), transparent 60%)'
                : 'radial-gradient(60% 60% at 20% 20%, rgba(99,102,241,0.14), transparent 60%), radial-gradient(55% 55% at 80% 20%, rgba(14,165,233,0.12), transparent 60%), radial-gradient(50% 50% at 40% 80%, rgba(16,185,129,0.1), transparent 60%)'
            }}
          />
          <div className="relative z-10 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div>
              <motion.p
                className="text-xs uppercase tracking-[0.2em] mb-2"
                style={{ color: colors.text.muted }}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
              >
                Dashboard Insights
              </motion.p>
              <motion.h1
                className="text-3xl font-bold tracking-tight bg-clip-text text-transparent"
                style={{
                  backgroundImage: theme === 'dark'
                    ? 'linear-gradient(180deg, #ffffff 25%, #9ca3af 100%)'
                    : 'linear-gradient(180deg, #111827 25%, #4b5563 100%)'
                }}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45 }}
              >
                Domains
              </motion.h1>
              <motion.p
                className="mt-2 text-sm md:text-base"
                style={{ color: colors.text.secondary }}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, delay: 0.08 }}
              >
                Manage and connect domains for your published sites
              </motion.p>
            </div>
            <button
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Add Domain
            </button>
          </div>
        </div>
      </section>

      {/* Stats Cards */}
      {!loading && domainsList.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl border p-4"
            style={{ backgroundColor: colors.bg.card, borderColor: colors.border.faint }}
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <Globe className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold" style={{ color: colors.text.primary }}>
                  {stats.total}
                </p>
                <p className="text-sm" style={{ color: colors.text.muted }}>
                  Total Domains
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-xl border p-4"
            style={{ backgroundColor: colors.bg.card, borderColor: colors.border.faint }}
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10">
                <Check className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold" style={{ color: colors.text.primary }}>
                  {stats.active}
                </p>
                <p className="text-sm" style={{ color: colors.text.muted }}>
                  Active Sites
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="rounded-xl border p-4"
            style={{ backgroundColor: colors.bg.card, borderColor: colors.border.faint }}
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-orange-500/10">
                <Clock className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold" style={{ color: colors.text.primary }}>
                  {stats.draft}
                </p>
                <p className="text-sm" style={{ color: colors.text.muted }}>
                  In Draft
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Search Bar */}
      {!loading && domainsList.length > 0 && (
        <div className="relative rounded-2xl border p-3" style={{ backgroundColor: colors.bg.card, borderColor: colors.border.faint }}>
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: colors.text.muted }} />
          <input
            type="text"
            placeholder="Search domains..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            style={{
              backgroundColor: colors.bg.card,
              borderColor: colors.border.faint,
              color: colors.text.primary,
            }}
          />
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div
          className="rounded-2xl border p-8 text-center"
          style={{ backgroundColor: colors.bg.card, borderColor: colors.border.faint }}
        >
          <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-sm" style={{ color: colors.text.muted }}>Loading domains...</p>
        </div>
      ) : domainsList.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border p-12 text-center"
          style={{
            backgroundColor: colors.bg.card,
            borderColor: colors.border.faint,
          }}
        >
          <div className="inline-flex p-4 rounded-full mb-4" style={{ backgroundColor: colors.bg.elevated }}>
            <Globe className="w-12 h-12" style={{ color: colors.text.muted }} />
          </div>
          <h3 className="text-lg font-semibold mb-2" style={{ color: colors.text.primary }}>
            No domains connected yet
          </h3>
          <p className="text-sm mb-6 max-w-md mx-auto" style={{ color: colors.text.muted }}>
            When you publish your website and set a subdomain on a project, it will appear here.
          </p>
          <button
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Your First Domain
          </button>
        </motion.div>
      ) : filteredDomains.length === 0 ? (
        <div
          className="rounded-xl border p-8 text-center"
          style={{ backgroundColor: colors.bg.card, borderColor: colors.border.faint }}
        >
          <AlertCircle className="w-12 h-12 mx-auto mb-3" style={{ color: colors.text.muted }} />
          <p className="text-sm" style={{ color: colors.text.muted }}>
            No domains match your search
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          <AnimatePresence>
            {filteredDomains.map(({ project, subdomain }, index) => {
              const displayUrl = getSiteDisplayUrl(subdomain ?? '', origin);
              const siteUrl = getSubdomainSiteUrl(subdomain ?? '', origin);
              const isPublished = project.status === 'published';
              
              return (
                <motion.div
                  key={project.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -100 }}
                  transition={{ delay: index * 0.05 }}
                  className="rounded-xl border p-5 hover:shadow-md transition-all"
                  style={{
                    backgroundColor: colors.bg.card,
                    borderColor: colors.border.faint,
                  }}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <div className={`p-2 rounded-lg ${isPublished ? 'bg-green-500/10' : 'bg-orange-500/10'}`}>
                          <Globe className={`w-5 h-5 ${isPublished ? 'text-green-600' : 'text-orange-600'}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg font-semibold truncate" style={{ color: colors.text.primary }}>
                            {project.title}
                          </h3>
                          <div className="flex items-center gap-2 mt-1">
                            <code 
                              className="text-sm font-mono truncate"
                              style={{ color: colors.text.secondary }}
                            >
                              {displayUrl}
                            </code>
                            <span
                              className={`text-xs px-2 py-0.5 rounded-full capitalize ${
                                isPublished ? 'bg-green-500/10 text-green-600' : 'bg-orange-500/10 text-orange-600'
                              }`}
                            >
                              {project.status || 'draft'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {project.description && (
                        <p className="text-sm mt-2 line-clamp-2" style={{ color: colors.text.muted }}>
                          {project.description}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleCopyUrl(subdomain ?? '', project.id)}
                        className="p-2 rounded-lg hover:bg-opacity-50 transition-colors"
                        style={{ backgroundColor: colors.bg.elevated }}
                        title="Copy URL"
                      >
                        {copiedId === project.id ? (
                          <Check className="w-4 h-4 text-green-600" />
                        ) : (
                          <Copy className="w-4 h-4" style={{ color: colors.text.secondary }} />
                        )}
                      </button>
                      
                      <a
                        href={siteUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 rounded-lg hover:bg-opacity-50 transition-colors"
                        style={{ backgroundColor: colors.bg.elevated }}
                        title="Open site"
                      >
                        <ExternalLink className="w-4 h-4" style={{ color: colors.text.secondary }} />
                      </a>

                      <button
                        className="p-2 rounded-lg hover:bg-opacity-50 transition-colors"
                        style={{ backgroundColor: colors.bg.elevated }}
                        title="Settings"
                      >
                        <Settings className="w-4 h-4" style={{ color: colors.text.secondary }} />
                      </button>

                      <button
                        className="p-2 rounded-lg hover:bg-red-500/10 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </button>
                    </div>
                  </div>

                  {/* Additional Info */}
                  <div className="flex items-center gap-4 mt-4 pt-4 border-t" style={{ borderColor: colors.border.faint }}>
                    <div className="flex items-center gap-2 text-xs" style={{ color: colors.text.muted }}>
                      <TrendingUp className="w-3.5 h-3.5" />
                      <span>0 visitors today</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs" style={{ color: colors.text.muted }}>
                      <Clock className="w-3.5 h-3.5" />
                      <span>Updated {new Date().toLocaleDateString()}</span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
