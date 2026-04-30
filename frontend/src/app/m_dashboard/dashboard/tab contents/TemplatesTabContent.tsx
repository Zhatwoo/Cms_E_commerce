'use client';

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { motion } from 'framer-motion';
import type { Project } from '@/lib/api';
import { listTemplateProjectEntries, type TemplateProjectRegistryEntry } from '@/lib/templateProjectRegistry';
import { GROUPED_TEMPLATES } from '@/app/_templates';
import { DraftPreviewThumbnail } from '../../components/projects/DraftPreviewThumbnail';

type DashboardTheme = 'light' | 'dark';

type IndustryCard = {
  label: string;
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
};

export function TemplatesTabContent({
  theme,
  industries,
  getIndustryIcon,
  projects,
  selectedProject,
  searchQuery,
  applyingTemplateId,
  onApplyTemplate,
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
  }, [entries, projects, selectedProject?.id]);

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

  const prebuiltTemplates = useMemo(() => {
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
      <section className="mx-auto w-full max-w-none pt-2 my-10">
        <div className="mb-5 flex items-center justify-between">
          <h3
            className={`
              uppercase text-xs sm:text-sm font-bold tracking-[0.18em] transition-colors duration-300
              ${theme === 'dark' ? 'text-[#FFCE00]' : 'text-[#8B5CF6]'}
            `}
          >
            Browse by Industry
          </h3>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 sm:gap-4">
          {industries.map((industry) => {
            const activeIcon = getIndustryIcon(industry.label);

            return (
              <button
                key={industry.label}
                type="button"
                className={`
                  group relative h-25 sm:h-27.5 w-full overflow-hidden rounded-4xl border transition-all duration-500 text-left
                  ${theme === 'dark'
                    ? 'border-[#272261]/50 bg-[#23164E] hover:border-[#B13BFF] hover:bg-[#2A1756]'
                    : 'border-[#7C3AED]/10 bg-[#F8F7FF] hover:border-[#7C3AED]/30 hover:bg-[#F3F0FF] shadow-[0_10px_30px_-10px_rgba(124,58,237,0.08)]'
                  }
                  hover:-translate-y-1 active:scale-[0.98]
                `}
              >
                <div
                  className={`
                    absolute -right-6 -top-10 h-[150%] w-[68%] rounded-full transition-all duration-700 group-hover:scale-110
                    ${theme === 'dark'
                      ? 'bg-[#1A0D45]'
                      : 'bg-linear-to-br from-[#7C3AED]/20 via-[#A855F7]/40 to-[#F43F5E]/20 blur-xl opacity-80 group-hover:opacity-100'
                    }
                  `}
                />

                <div className="relative z-10 flex h-full w-full items-center px-6 sm:px-9">
                  <span
                    className={`
                      flex-1 text-sm sm:text-base font-[1000] leading-snug tracking-tighter transition-all duration-300 pr-14 sm:pr-20
                      ${theme === 'dark'
                        ? 'text-white group-hover:text-white/90'
                        : 'text-[#2E1065] group-hover:text-[#7C3AED]'
                      }
                    `}
                  >
                    {industry.label}
                  </span>

                  <div className="absolute right-4 sm:right-6 flex items-center justify-center">
                    <div
                      className={`
                        relative flex h-14 w-14 items-center justify-center rounded-3xl border transition-all duration-500 sm:h-16 sm:w-16
                        ${theme === 'dark'
                          ? 'border-[#3C3161] bg-[#26194E] [box-shadow:inset_0_2px_10px_rgba(255,255,255,0.02)]'
                          : 'border-white bg-white/50 backdrop-blur-xl shadow-[0_8px_16px_rgba(124,58,237,0.1)] group-hover:bg-white group-hover:scale-110 group-hover:border-[#7C3AED]/20'
                        }
                      `}
                    >
                      <svg
                        className={`
                          h-7 w-7 transition-all duration-500 group-hover:rotate-6
                          ${theme === 'dark'
                            ? 'text-white/70 group-hover:text-[#FFCE00]'
                            : 'text-[#7C3AED] group-hover:text-[#4F46E5]'}
                        `}
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={2.5}
                        viewBox="0 0 24 24"
                      >
                        {activeIcon}
                      </svg>
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      <section className="mx-auto w-full max-w-none pt-2">
        <div className="mb-5 flex items-center justify-between gap-3">
          <h3
            className={`
              text-xs sm:text-sm font-bold tracking-[0.18em] uppercase transition-colors duration-300
              ${theme === 'dark' ? 'text-[#FFCE00]' : 'text-[#8B5CF6]'}
            `}
          >
            Your Templates
          </h3>
          <span className={`text-xs ${theme === 'dark' ? 'text-[#8C84C8]' : 'text-[#7C3AED]/70'}`}>
            From assets and starter layouts
          </span>
        </div>

        {prebuiltTemplates.length === 0 ? (
          <div
            className={`rounded-2xl border p-6 text-sm ${theme === 'dark'
              ? 'border-[#2A2664] bg-[#161247] text-[#B7B2E0]'
              : 'border-[#E5D7FF] bg-[#FAF6FF] text-[#4A2D84]'
            }`}
          >
            No pre-built templates found.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
            {prebuiltTemplates.map((template) => (
              <article
                key={`${template.folder}-${template.label}`}
                className={`overflow-hidden rounded-3xl border shadow-[0_18px_50px_rgba(29,18,74,0.08)] ${theme === 'dark'
                  ? 'border-[#2D2A67] bg-[#161447]'
                  : 'border-[#E8DAFF] bg-white'
                }`}
              >
                <div className="relative aspect-16/10 overflow-hidden bg-[#f8f5ff]">
                  <div className="h-full w-full p-3">
                    <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-black/5 bg-white/90 p-3 shadow-sm">
                      <div className="mb-2 flex items-center justify-between gap-2">
                        <span className={`text-[10px] font-semibold uppercase tracking-[0.18em] ${theme === 'dark' ? 'text-[#938BD3]' : 'text-[#7B61B8]'}`}>
                          {template.folder}
                        </span>
                        <span className="rounded-full bg-black/5 px-2 py-1 text-[9px] font-semibold uppercase tracking-[0.16em] text-black/60">
                          Pre-built
                        </span>
                      </div>
                      <div className="min-h-0 flex-1 overflow-hidden rounded-xl border border-black/5 bg-[#f8f5ff] p-2">
                        <div className="h-full w-full scale-[0.9] origin-top-left">
                          {template.preview}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="absolute inset-x-0 bottom-0 bg-linear-to-t from-black/70 via-black/15 to-transparent p-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-white/90">{template.label}</p>
                  </div>
                </div>

                <div className="p-4 space-y-2">
                  <p className={`line-clamp-2 text-sm ${theme === 'dark' ? 'text-[#B9B4E9]' : 'text-[#5F46A5]'}`}>
                    {template.description}
                  </p>
                  <p className={`text-xs ${theme === 'dark' ? 'text-[#8982C8]' : 'text-[#7A63B8]'}`}>
                    Starter asset template
                  </p>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="mx-auto w-full max-w-none pt-2">
        <div className="mb-5 flex items-center justify-between gap-3">
          <h3
            className={`
              text-xs sm:text-sm font-bold tracking-[0.18em] uppercase transition-colors duration-300
              ${theme === 'dark' ? 'text-[#FFCE00]' : 'text-[#8B5CF6]'}
            `}
          >
            Saved Templates
          </h3>
          <span className={`text-xs ${theme === 'dark' ? 'text-[#8C84C8]' : 'text-[#7C3AED]/70'}`}>
            Apply to: {selectedProject?.title || 'Select a project in Your Designs first'}
          </span>
        </div>

        {filteredTemplates.length === 0 ? (
          <div
            className={`rounded-2xl border p-6 text-sm ${theme === 'dark'
              ? 'border-[#2A2664] bg-[#161247] text-[#B7B2E0]'
              : 'border-[#E5D7FF] bg-[#FAF6FF] text-[#4A2D84]'
            }`}
          >
            No saved templates yet. Save one from builder preview to see it here.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {filteredTemplates.map((template) => {
              const isApplying = applyingTemplateId === template.projectId;
              const hasThumbnail = Boolean(template.project?.thumbnail);

              return (
                <article
                  key={template.projectId}
                  className={`group overflow-hidden rounded-3xl border shadow-[0_18px_50px_rgba(29,18,74,0.08)] transition-transform duration-300 hover:-translate-y-1 ${theme === 'dark'
                    ? 'border-[#2D2A67] bg-[#161447] shadow-[0_18px_50px_rgba(0,0,0,0.24)]'
                    : 'border-[#E8DAFF] bg-white'
                  }`}
                >
                  <div className="relative aspect-16/10 overflow-hidden bg-[#f8f5ff]">
                    {hasThumbnail ? (
                      <img
                        src={template.project?.thumbnail || ''}
                        alt={template.title}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                        loading="lazy"
                      />
                    ) : (
                      <DraftPreviewThumbnail
                        projectId={template.projectId}
                        borderColor={theme === 'dark' ? 'rgba(146,139,221,0.28)' : 'rgba(124,58,237,0.18)'}
                        bgColor={theme === 'dark' ? '#120F46' : '#F8F5FF'}
                        className="h-full w-full"
                      />
                    )}
                    <div className="absolute inset-x-0 bottom-0 bg-linear-to-t from-black/70 via-black/15 to-transparent p-3">
                      <div className="flex items-end justify-between gap-3">
                        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-white/90">{template.category}</p>
                        <span className="rounded-full border border-white/20 bg-white/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/90 backdrop-blur-sm">
                          Your Template
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex h-full flex-col p-4">
                    <div className="space-y-2">
                      <h4 className={`text-lg font-extrabold leading-tight ${theme === 'dark' ? 'text-white' : 'text-[#16083D]'}`}>
                        {template.title}
                      </h4>
                      <p className={`line-clamp-2 text-sm ${theme === 'dark' ? 'text-[#B9B4E9]' : 'text-[#5F46A5]'}`}>
                        {template.description}
                      </p>
                      <p className={`text-xs ${theme === 'dark' ? 'text-[#8982C8]' : 'text-[#7A63B8]'}`}>
                        {formatSavedAt(template.savedAt)}
                      </p>
                    </div>

                    <div className="mt-4 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setPreviewTemplate(template)}
                        className={`flex-1 rounded-xl px-3 py-2 text-sm font-semibold transition-colors ${theme === 'dark'
                          ? 'bg-[#2A246B] text-white hover:bg-[#3A3388]'
                          : 'bg-[#EFE5FF] text-[#4D2E9C] hover:bg-[#E4D3FF]'
                        }`}
                      >
                        Preview
                      </button>
                      <button
                        type="button"
                        disabled={!selectedProject || isApplying}
                        onClick={() => onApplyTemplate(template.projectId)}
                        className={`flex-1 rounded-xl px-3 py-2 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${theme === 'dark'
                          ? 'bg-[#FFCE00] text-[#21164E] hover:bg-[#FFD840]'
                          : 'bg-[#7C3AED] text-white hover:bg-[#6D28D9]'
                        }`}
                      >
                        {isApplying ? 'Applying...' : 'Apply'}
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {previewTemplate && (
        <div
          className="fixed inset-0 z-100 bg-black/70 p-4 md:p-8"
          onClick={() => setPreviewTemplate(null)}
        >
          <div
            className={`mx-auto h-full max-h-215 w-full max-w-6xl overflow-hidden rounded-2xl border ${theme === 'dark'
              ? 'border-[#2A256D] bg-[#121046]'
              : 'border-[#E7D8FF] bg-white'
            }`}
            onClick={(event) => event.stopPropagation()}
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
        </div>
      )}
    </motion.div>
  );
}
