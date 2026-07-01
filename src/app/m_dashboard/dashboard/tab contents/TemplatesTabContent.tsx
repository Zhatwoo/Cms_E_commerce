'use client';

/**
 * ============================================================================
 * Templates Tab Content Component
 * ============================================================================
 *
 * Purpose of this File:
 * ----------------------------------------------------------------------------
 * This file contains the templates tab view component that displays available
 * design templates organized by industry categories and saved templates for
 * users to browse and apply to their projects.
 *
 * The component provides:
 * - Industry category filtering and selection
 * - Pre-built template deck display with descriptions
 * - Saved templates gallery showing user's saved template projects
 * - Template search functionality
 * - Apply template with project selection
 * - Loading and applying states
 * - Empty state handling
 * - Theme-aware styling
 *
 * ----------------------------------------------------------------------------
 * What this Component Does:
 * ----------------------------------------------------------------------------
 * - Displays hero template deck with featured templates by industry
 * - Shows industry cards for browsing templates by category
 * - Renders saved templates grid with preview thumbnails
 * - Allows applying templates to existing projects
 * - Filters templates by search query
 * - Shows loading state while applying template
 * - Provides empty state when no templates available
 * - Allows reassigning saved templates to different projects
 * - Routes to design editor for pre-built templates
 * - Adapts layout and colors based on theme
 *
 * Props / Parameters:
 * ----------------------------------------------------------------------------
 *
 * theme: DashboardTheme\n * - Current UI theme mode (light or dark).\n * - Determines component styling and colors.\n * - Values: 'light' | 'dark'\n * - REQUIRED\n *
 * industries: readonly IndustryCard[]\n * - Array of industry categories for template organization.\n * - Each card contains a label for the industry.\n * - REQUIRED\n *
 * getIndustryIcon: (label: string) => ReactNode\n * - Function to get icon for industry category.\n * - Takes industry label and returns React node.\n * - REQUIRED\n *
 * projects: Project[]\n * - Array of user's projects for applying templates.\n * - REQUIRED\n *
 * selectedProject: Project | null\n * - Currently selected project for template application.\n * - REQUIRED\n *
 * searchQuery: string\n * - Search filter for template names.\n * - REQUIRED\n *
 * applyingTemplateId: string | null\n * - ID of template currently being applied.\n * - Used for loading state.\n * - REQUIRED\n *
 * onApplyTemplate: (templateProjectId: string) => Promise<void>\n * - Callback to apply selected template to project.\n * - Should handle API call for template application.\n * - REQUIRED\n *
 * onOpenPrebuiltTemplate?: (folder: string, label: string) => void\n * - Optional callback when pre-built template is clicked.\n * - Routes to design editor with template context.\n *
 * onSelectTargetProject?: (projectId: string) => void\n * - Optional callback when target project is changed.\n * - Allows reassigning template to different project.\n *
 * Type Definitions:
 * ----------------------------------------\n *
 * DashboardTheme\n * - Union type for theme modes: 'light' | 'dark'\n *
 * IndustryCard\n * - Simple card type with label for industry category.\n *
 * PrebuiltTemplateCard\n * - Pre-built template card with folder, label, description, preview.\n *
 * TemplateCard\n * - Saved template card with project details and metadata.\n *
 * TemplatesTabContentProps\n * - Props interface for the component.\n *
 * ============================================================================
 */

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { motion } from 'framer-motion';
import type { Project } from '@/lib/api';
import { listTemplateProjectEntries, type TemplateProjectRegistryEntry } from '@/lib/templateProjectRegistry';
import { GROUPED_TEMPLATES } from '@/app/_templates';
import { ModalShell } from '@/components/ui/ModalShell';
import { EmptyState } from '@/app/m_dashboard/components/ui/emptyState';
import { DraftPreviewThumbnail } from '../../components/projects/DraftPreviewThumbnail';

type DashboardTheme = 'light' | 'dark';

type IndustryCard = {
  label: string;
};

type PrebuiltTemplateCard = {
  folder: string;
  label: string;
  description: string;
  preview: ReactNode;
};

type TemplateCard = {
  projectId: string;
  title: string;
  category: string;
  description: string;
  savedAt: string;
  project: Project;
};

type TemplatesTabContentProps = {
  theme: DashboardTheme;
  industries: readonly IndustryCard[];
  getIndustryIcon: (label: string) => ReactNode;
  projects: Project[];
  selectedProject: Project | null;
  searchQuery: string;
  applyingTemplateId: string | null;
  onApplyTemplate: (templateProjectId: string) => Promise<void>;
  /** Called when the user clicks a pre-built template card. Lets the parent route to the design editor with the right project context. */
  onOpenPrebuiltTemplate?: (folder: string, label: string) => void;
  /** Allow the saved-templates "Apply to" label to be reassigned to a different project from inside the dashboard. */
  onSelectTargetProject?: (projectId: string) => void;
};

function HeroTemplateDeck({
  theme,
  prebuiltTemplates,
  onOpenPrebuiltTemplate,
}: {
  theme: DashboardTheme;
  prebuiltTemplates: PrebuiltTemplateCard[];
  onOpenPrebuiltTemplate?: (folder: string, label: string) => void;
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  const featuredTemplates = prebuiltTemplates.slice(0, 3);

  return (
    <section className="relative w-full overflow-visible px-0">
      <div className="mx-auto flex w-full max-w-none flex-col items-center gap-12 lg:flex-row lg:justify-between">
        <div className="flex-1 space-y-6 text-center lg:text-left">
          <h1
            className={`text-5xl font-black tracking-tight md:text-6xl ${
              theme === 'dark' ? 'text-white' : 'text-[#15093E]'
            }`}
          >
            Use an existing <br />
            <span className={theme === 'dark' ? 'text-[#FFCE00]' : 'text-[#8B5CF6]'}>template</span>
          </h1>
          <p
            className={`max-w-md text-lg font-medium opacity-60 ${
              theme === 'dark' ? 'rgba(255,255,255,0.72)' : 'rgba(30, 41, 59, 0.72)'
            }`}
          >
            Jumpstart your project with professionally designed starter layouts and assets.
          </p>

          <div className="pt-4">
            <button
              type="button"
              onClick={() => setIsExpanded((value) => !value)}
              className={`
              rounded-full px-10 py-3 text-base font-bold cursor-pointer
              transition-all duration-300 ease-out
              hover:-translate-y-1 hover:brightness-110 active:scale-95
              text-white
              ${theme === 'dark' ? 'hover:shadow-[0_12px_28px_rgba(255,206,0,0.55)]' : 'hover:shadow-[0_12px_28px_rgba(217,70,239,0.5)]'}
            `}
            style={
              theme === 'dark'
                ? {
                    background: '#FFCE00',
                    color: '#120533',
                    boxShadow: '0 8px 24px rgba(255, 206, 0, 0.42)',
                  }
                : {
                    background: 'linear-gradient(90deg, #9333ea 0%, #ec4899 100%)',
                    boxShadow: '0 8px 24px rgba(217,70,239,0.4)',
                  }
            }
            >
              {isExpanded ? 'Show Less' : 'Browse Templates'}
            </button>
          </div>
        </div>

        <div className="relative h-[540px] w-full max-w-[760px] flex-1 lg:h-[660px]">
          {featuredTemplates.map((template, index) => {
            const positions = [
              'z-10 -rotate-12 -translate-x-22 translate-y-6 scale-90 opacity-40',
              'z-30 rotate-0 translate-x-0 scale-100 opacity-100',
              'z-10 rotate-12 translate-x-22 translate-y-6 scale-90 opacity-40',
            ];

            return (
              <button
                key={`${template.folder}-${template.label}`}
                type="button"
                onClick={() => onOpenPrebuiltTemplate?.(template.folder, template.label)}
                disabled={!onOpenPrebuiltTemplate}
                className={`absolute inset-0 m-auto aspect-[16/13] w-[520px] max-w-[92%] sm:w-[560px] md:w-[640px] overflow-hidden rounded-[3rem] border transition-all duration-700 ease-out hover:z-40 hover:scale-105 hover:-translate-y-4 hover:opacity-100 disabled:cursor-default ${
                  positions[index]
                } ${
                  theme === 'dark'
                    ? 'border-white/10 bg-[#15093E] shadow-2xl'
                    : 'border-[#E8DAFF] bg-white shadow-xl'
                }`}
              >
                <div className="h-full w-full scale-[1.18] -translate-y-3 p-3 sm:p-4">{template.preview}</div>
                <div className="absolute inset-0 bg-linear-to-t from-[#15093E]/80 via-transparent to-transparent" />
                <div className="absolute bottom-6 left-6 right-6 text-left">
                  <p
                    className={`text-[10px] sm:text-[11px] font-black uppercase tracking-[0.18em] drop-shadow-[0_8px_18px_rgba(0,0,0,0.55)] ${
                      theme === 'dark' ? 'text-[#FFCE00]' : 'text-[#C4B5FD]'
                    }`}
                  >
                    {template.folder}
                  </p>
                  <p
                    className="mt-1 line-clamp-1 text-lg sm:text-xl font-extrabold text-white drop-shadow-[0_10px_22px_rgba(0,0,0,0.6)]"
                  >
                    {template.label}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div
        className={`transition-all duration-1000 ease-[cubic-bezier(0.23,1,0.32,1)] ${
          isExpanded ? 'max-h-[5000px] opacity-100' : 'max-h-0 overflow-hidden opacity-0'
        }`}
      >
        {/* Section Divider */}
        <div className="mb-12 flex items-center justify-between">
          <div className="space-y-1">
            <h3 className={`text-[10px] font-black uppercase tracking-[0.4em] ${
              theme === 'dark' ? 'text-[#FFCE00]' : 'text-[#8B5CF6]'
            }`}>
              Library Catalog
            </h3>
            <p className={`text-sm font-medium opacity-50 ${theme === 'dark' ? 'text-white' : 'text-[#15093E]'}`}>
              Select a base to begin your build
            </p>
          </div>
          <div className={`hidden h-px flex-1 mx-10 md:block ${theme === 'dark' ? 'bg-white/10' : 'bg-[#15093E]/10'}`} />
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {prebuiltTemplates.map((template) => (
            <button
              key={`${template.folder}-grid-${template.label}`}
              type="button"
              onClick={() => onOpenPrebuiltTemplate?.(template.folder, template.label)}
              className={`
                group relative flex flex-col overflow-hidden rounded-[2rem] border transition-all duration-500
                hover:-translate-y-2 hover:shadow-2xl
                ${
                  theme === 'dark'
                    ? 'bg-[#15093E] border-white/10 shadow-[0_15px_35px_rgba(0,0,0,0.4)]'
                    : 'bg-white border-[#E8DAFF] shadow-[0_15px_35px_rgba(139,92,246,0.1)]'
                }
              `}
            >
              {/* Top Image Container */}
              <div className={`relative aspect-[16/10] w-full overflow-hidden border-b transition-colors duration-500 ${
                theme === 'dark' ? 'bg-[#1c1146] border-white/5' : 'bg-[#FAF9FF] border-[#F0E8FF]'
              }`}>
                <div className="h-full w-full scale-90 transition-transform duration-700 group-hover:scale-95">
                  {template.preview}
                </div>

                {/* Subtle Gradient to make the preview "pop" */}
                <div className="absolute inset-0 bg-linear-to-tr from-[#15093E]/20 to-transparent pointer-events-none" />
              </div>

              {/* Bottom Content Container */}
              <div className="flex flex-col p-6 text-left">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`h-1.5 w-1.5 rounded-full ${theme === 'dark' ? 'bg-[#FFCE00]' : 'bg-[#8B5CF6]'}`} />
                  <p className={`text-[9px] font-black uppercase tracking-[0.2em] ${
                    theme === 'dark' ? 'text-[#FFCE00]' : 'text-[#C4B5FD]'
                  }`}>
                    {template.folder}
                  </p>
                </div>

                <h4 className={`text-base font-bold tracking-tight transition-colors ${
                  theme === 'dark' ? 'text-white group-hover:text-[#FFCE00]' : 'text-[#15093E]'
                }`}>
                  {template.label}
                </h4>

                {/* Details */}
                <div className="mt-4 flex items-center justify-between transition-all duration-500">
                  <span className={`text-[10px] font-bold uppercase tracking-widest ${
                    theme === 'dark' ? 'text-white/30' : 'text-[#15093E]/40'
                  }`}>
                    View Details
                  </span>
                  <div className={`h-8 w-8 flex items-center justify-center rounded-full ${
                    theme === 'dark' ? 'bg-[#FFCE00] text-black' : 'bg-[#8B5CF6] text-white'
                  }`}>
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

    </section>
  );
}

export function TemplatesTabContent({
  theme,
  industries: _industries,
  getIndustryIcon: _getIndustryIcon,
  projects,
  selectedProject,
  searchQuery,
  applyingTemplateId,
  onApplyTemplate,
  onOpenPrebuiltTemplate,
  onSelectTargetProject,
}: TemplatesTabContentProps) {
  const [entries, setEntries] = useState<TemplateProjectRegistryEntry[]>([]);
  const [previewTemplate, setPreviewTemplate] = useState<TemplateCard | null>(null);

  useEffect(() => {
    const hydrate = () => setEntries(listTemplateProjectEntries());
    hydrate();

    const onRegistryChanged = () => hydrate();
    window.addEventListener('template-project-registry:changed', onRegistryChanged as EventListener);
    window.addEventListener('storage', hydrate);

    return () => {
      window.removeEventListener('template-project-registry:changed', onRegistryChanged as EventListener);
      window.removeEventListener('storage', hydrate);
    };
  }, []);

  const savedTemplates = useMemo<TemplateCard[]>(() => {
    const byProjectId = new Map(projects.map((project) => [project.id, project]));
    const fromRegistry = entries
      .map((entry) => {
        const project = byProjectId.get(entry.projectId) ?? null;
        if (!project || String(project.status || '').trim().toLowerCase() !== 'template') return null;
        return {
          projectId: entry.projectId,
          title: entry.name || project?.title || 'Untitled Template',
          category: entry.category || 'General',
          description: entry.description || 'No description provided.',
          savedAt: entry.savedAt,
          project,
        };
      })
      .filter((item): item is TemplateCard => item !== null);

    const fromProjectStatus = projects
      .filter((project) => String(project.status || '').trim().toLowerCase() === 'template')
      .map((project) => ({
        projectId: project.id,
        title: project.title || 'Untitled Template',
        category: 'Project Template',
        description: 'Saved from builder preview.',
        savedAt: project.updatedAt || project.createdAt || '',
        project,
      }));

    const mergedById = new Map<string, TemplateCard>();
    for (const item of fromProjectStatus) {
      mergedById.set(item.projectId, item);
    }
    for (const item of fromRegistry) {
      mergedById.set(item.projectId, item);
    }

    return Array.from(mergedById.values()).sort((a, b) => {
      const aTime = new Date(a.savedAt || 0).getTime();
      const bTime = new Date(b.savedAt || 0).getTime();
      return bTime - aTime;
    });
  }, [entries, projects]);

  const normalizedSearch = searchQuery.trim().toLowerCase();
  const filteredTemplates = useMemo(() => {
    if (!normalizedSearch) return savedTemplates;

    return savedTemplates.filter((template) => {
      return (
        template.title.toLowerCase().includes(normalizedSearch) ||
        template.category.toLowerCase().includes(normalizedSearch) ||
        template.description.toLowerCase().includes(normalizedSearch)
      );
    });
  }, [savedTemplates, normalizedSearch]);

  const prebuiltTemplates = useMemo<PrebuiltTemplateCard[]>(() => {
    return GROUPED_TEMPLATES.flatMap((group) =>
      group.items.map((item) => ({
        folder: group.folder,
        label: item.label,
        description: item.description,
        preview: item.preview,
      }))
    );
  }, []);

  const formatSavedAt = (iso: string) => {
    if (!iso) return 'Saved recently';
    const when = new Date(iso);
    if (Number.isNaN(when.getTime())) return 'Saved recently';
    return `Saved ${when.toLocaleDateString()}`;
  };

  return (
    <motion.div
      key="templates-tab"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.22, ease: 'easeOut' }}
    >
      <div className="w-full">
        {prebuiltTemplates.length === 0 ? (
          <section className="relative w-full py-10">
            <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_50%_0%,#8B5CF610,transparent_70%)]" />
            <div
              className={`rounded-[2rem] border p-12 text-center text-sm font-medium ${
                theme === 'dark'
                  ? 'border-[#2A2664] bg-[#161247] text-[#B7B2E0]'
                  : 'border-[#E5D7FF] bg-[#FAF6FF] text-[#4A2D84]'
              }`}
            >
              No pre-built templates found.
            </div>
          </section>
        ) : (
          <HeroTemplateDeck
            theme={theme}
            prebuiltTemplates={prebuiltTemplates}
            onOpenPrebuiltTemplate={onOpenPrebuiltTemplate}
          />
        )}

        <section className="mx-auto w-full max-w-none mt-20">
        <div className="mb-12 flex items-center justify-between">
          <div className="space-y-1">
            <h3 className={`text-[10px] font-black uppercase tracking-[0.4em] ${
              theme === 'dark' ? 'text-[#FFCE00]' : 'text-[#8B5CF6]'
            }`}>
              Saved Templates
            </h3>
            <p className={`text-sm font-medium opacity-50 ${theme === 'dark' ? 'text-white' : 'text-[#15093E]'}`}>
              Apply templates to your projects
            </p>
          </div>
          <div className={`hidden h-px flex-1 mx-10 md:block ${theme === 'dark' ? 'bg-white/10' : 'bg-[#15093E]/10'}`} />
        </div>

        <div className="mb-5 flex flex-wrap items-center justify-end gap-3">
          <label className={`flex items-center gap-2 text-xs ${theme === 'dark' ? 'text-[#8C84C8]' : 'text-[#7C3AED]/70'}`}>
            <span className="font-semibold uppercase tracking-widest text-[10px]">Apply to</span>
            <select
              value={selectedProject?.id ?? ''}
              onChange={(e) => onSelectTargetProject?.(e.target.value)}
              disabled={!onSelectTargetProject || projects.filter((project) => String(project.status || '').trim().toLowerCase() !== 'template').length === 0}
              className={`rounded-lg border px-3 py-1.5 text-xs font-semibold outline-none transition-colors disabled:opacity-50 ${theme === 'dark'
                ? 'border-[#2A246B] bg-[#161247] text-white focus:border-[#7C3AED]'
                : 'border-[#E5D7FF] bg-white text-[#16083D] focus:border-[#7C3AED]'
              }`}
            >
              {!selectedProject && (
                <option value="" disabled>
                  Select a project…
                </option>
              )}
              {projects
                .filter((project) => String(project.status || '').trim().toLowerCase() !== 'template')
                .map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.title || 'Untitled Project'}
                  </option>
                ))}
            </select>
          </label>
        </div>

        {filteredTemplates.length === 0 ? (
          normalizedSearch ? (
            <EmptyState
              tone={theme}
              size="compact"
              badgeText="No matches"
              title={`No templates match "${searchQuery.trim()}"`}
              description="Try a different keyword, or clear the search to see all saved templates."
            />
          ) : (
            <EmptyState
              tone={theme}
              size="compact"
              badgeText="Saved Templates"
              title="No saved templates yet"
              description="Save a template from the builder preview to see it here."
            />
          )
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredTemplates.map((template) => {
              const isApplying = applyingTemplateId === template.projectId;
              const hasThumbnail = Boolean(template.project?.thumbnail);

              return (
                <button
                  key={template.projectId}
                  type="button"
                  onClick={() => setPreviewTemplate(template)}
                  className={`
                    group relative flex flex-col overflow-hidden rounded-[2rem] border transition-all duration-500
                    hover:-translate-y-2 hover:shadow-2xl text-left
                    ${
                      theme === 'dark'
                        ? 'bg-[#15093E] border-white/10 shadow-[0_15px_35px_rgba(0,0,0,0.4)]'
                        : 'bg-white border-[#E8DAFF] shadow-[0_15px_35px_rgba(139,92,246,0.1)]'
                    }
                  `}
                >
                  {/* Top Image Container */}
                  <div className={`relative aspect-[16/10] w-full overflow-hidden border-b transition-colors duration-500 ${
                    theme === 'dark' ? 'bg-[#1c1146] border-white/5' : 'bg-[#FAF9FF] border-[#F0E8FF]'
                  }`}>
                    {hasThumbnail ? (
                      <img
                        src={template.project?.thumbnail || ''}
                        alt={template.title}
                        className="h-full w-full scale-90 object-cover transition-transform duration-700 group-hover:scale-95"
                        loading="lazy"
                      />
                    ) : (
                      <div className="h-full w-full scale-90 transition-transform duration-700 group-hover:scale-95">
                        <DraftPreviewThumbnail
                          projectId={template.projectId}
                          borderColor={theme === 'dark' ? 'rgba(146,139,221,0.28)' : 'rgba(124,58,237,0.18)'}
                          bgColor={theme === 'dark' ? '#120F46' : '#F8F5FF'}
                          className="h-full w-full"
                        />
                      </div>
                    )}

                    {/* Subtle Gradient to make the preview "pop" */}
                    <div className="absolute inset-0 bg-linear-to-tr from-[#15093E]/20 to-transparent pointer-events-none" />
                  </div>

                  {/* Bottom Content Container */}
                  <div className="flex flex-col p-6 text-left">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`h-1.5 w-1.5 rounded-full ${theme === 'dark' ? 'bg-[#FFCE00]' : 'bg-[#8B5CF6]'}`} />
                      <p className={`text-[9px] font-black uppercase tracking-[0.2em] ${
                        theme === 'dark' ? 'text-[#FFCE00]' : 'text-[#C4B5FD]'
                      }`}>
                        {template.category}
                      </p>
                    </div>

                    <h4 className={`text-base font-bold tracking-tight transition-colors ${
                      theme === 'dark' ? 'text-white group-hover:text-[#FFCE00]' : 'text-[#15093E]'
                    }`}>
                      {template.title}
                    </h4>

                    <p className={`mt-1 text-xs line-clamp-1 ${
                      theme === 'dark' ? 'text-white/50' : 'text-[#15093E]/50'
                    }`}>
                      {formatSavedAt(template.savedAt)}
                    </p>

                    {/* Details */}
                    <div className="mt-4 flex items-center justify-between transition-all duration-500">
                      <span className={`text-[10px] font-bold uppercase tracking-widest ${
                        theme === 'dark' ? 'text-white/30' : 'text-[#15093E]/40'
                      }`}>
                        View Details
                      </span>
                      <div className={`h-8 w-8 flex items-center justify-center rounded-full ${
                        theme === 'dark' ? 'bg-[#FFCE00] text-black' : 'bg-[#C4B5FD] text-black'
                      }`}>
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
        </section>
      </div>

      <ModalShell
        isOpen={!!previewTemplate}
        onClose={() => setPreviewTemplate(null)}
        usePortal
        className="fixed inset-0 z-9999 bg-black/70 backdrop-blur-sm p-4 md:p-8"
      >
        {previewTemplate && (
          <div
            className={`mx-auto h-full max-h-215 w-full max-w-6xl overflow-hidden rounded-2xl border ${theme === 'dark'
              ? 'border-[#2A256D] bg-[#121046]'
              : 'border-[#E7D8FF] bg-white'
            }`}
          >
            <div className={`flex items-center justify-between border-b px-4 py-3 ${theme === 'dark' ? 'border-[#2A256D]' : 'border-[#EEE4FF]'}`}>
              <div>
                <p className={`text-xs uppercase tracking-[0.14em] ${theme === 'dark' ? 'text-[#938BD3]' : 'text-[#7B61B8]'}`}>
                  Preview Template
                </p>
                <h3 className={`text-lg font-bold ${theme === 'dark' ? 'text-white' : 'text-[#16083D]'}`}>
                  {previewTemplate.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setPreviewTemplate(null)}
                className={`rounded-lg px-3 py-1.5 text-sm font-semibold ${theme === 'dark' ? 'text-[#C6C1EE] hover:bg-[#241D66]' : 'text-[#5636A5] hover:bg-[#F3EBFF]'}`}
              >
                Close
              </button>
            </div>

            <div className="h-[calc(100%-128px)] w-full">
              <iframe
                title={`Preview ${previewTemplate.title}`}
                src={`/design/preview?projectId=${previewTemplate.projectId}`}
                className="h-full w-full border-0"
              />
            </div>

            <div className={`flex items-center justify-end gap-2 border-t px-4 py-3 ${theme === 'dark' ? 'border-[#2A256D]' : 'border-[#EEE4FF]'}`}>
              <a
                href={`/design/preview?projectId=${previewTemplate.projectId}`}
                target="_blank"
                rel="noreferrer"
                className={`rounded-xl px-3 py-2 text-sm font-semibold ${theme === 'dark' ? 'bg-[#2A246B] text-white hover:bg-[#3A3388]' : 'bg-[#EEE4FF] text-[#4D2E9C] hover:bg-[#E4D7FF]'}`}
              >
                Open Full Preview
              </a>
              <button
                type="button"
                disabled={!selectedProject || applyingTemplateId === previewTemplate.projectId}
                onClick={async () => {
                  await onApplyTemplate(previewTemplate.projectId);
                  setPreviewTemplate(null);
                }}
                className={`rounded-xl px-4 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50 ${theme === 'dark' ? 'bg-[#FFCE00] text-[#1D134A] hover:bg-[#FFD840]' : 'bg-[#7C3AED] text-white hover:bg-[#6D28D9]'}`}
              >
                {applyingTemplateId === previewTemplate.projectId ? 'Applying...' : 'Apply To Builder'}
              </button>
            </div>
          </div>
        )}
      </ModalShell>
    </motion.div>
  );
}
