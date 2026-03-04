'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { listProjects, type Project } from '@/lib/api';
import { DraftPreviewThumbnail } from '../components/projects/DraftPreviewThumbnail';
import { useProject } from '../components/context/project-context';
import { useNavigationLoading } from '../components/context/navigation-loading-context';

const INDUSTRIES = [
  { label: 'Fashion &\nApparel', img: '/images/industries/Fashion & Apparel.png', bg: 'linear-gradient(135deg,#3A006D 0%,#1A1A6E 100%)' },
  { label: 'Electronics\n& Tech', img: '/images/industries/Electronics & Tech.png', bg: 'linear-gradient(135deg,#1A1A6E 0%,#0E2060 100%)' },
  { label: 'Home &\nLiving', img: '/images/industries/Home & Living.png', bg: 'linear-gradient(135deg,#0E2060 0%,#2B0E7A 100%)' },
  { label: 'Food &\nBeverage', img: '/images/industries/Food & Beverage.png', bg: 'linear-gradient(135deg,#3F1080 0%,#1A1A6E 100%)' },
  { label: 'Beauty', img: '/images/industries/Beauty.png', bg: 'linear-gradient(135deg,#4A0E8A 0%,#3A006D 100%)' },
  { label: 'Kids, Toys\n& Hobbies', img: '/images/industries/Kids, Toys & Hobbies.png', bg: 'linear-gradient(135deg,#2B0E7A 0%,#0E2060 100%)' },
  { label: 'Pets', img: '/images/industries/Pets.png', bg: 'linear-gradient(135deg,#1D2B8A 0%,#3A006D 100%)' },
  { label: 'Automotive', img: '/images/industries/Automotive.png', bg: 'linear-gradient(135deg,#0E0B3D 0%,#1A1A6E 100%)' },
  { label: 'Sports &\nFitness', img: '/images/industries/Sports & Fitness.png', bg: 'linear-gradient(135deg,#2D0080 0%,#1D2B8A 100%)' },
  { label: 'Creative &\nHandmade', img: '/images/industries/Creative & Handmade.png', bg: 'linear-gradient(135deg,#3A1070 0%,#0E2060 100%)' },
] as const;

type HeroTab = 'designs' | 'templates';

function formatLastEdited(dateStr?: string) {
  if (!dateStr) return 'Last edited recently';
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = Math.max(0, now.getTime() - date.getTime());
  const hours = Math.floor(diffMs / 3600000);
  const days = Math.floor(diffMs / 86400000);
  if (hours < 24) return `Last edited ${hours} hour${hours === 1 ? '' : 's'} ago`;
  return `Last edited ${days || 1} day${days === 1 ? '' : 's'} ago`;
}

function formatEditedDate(dateStr?: string) {
  if (!dateStr) return 'Edited recently';
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = Math.max(0, now.getTime() - date.getTime());
  const minutes = Math.floor(diffMs / 60000);
  const hours = Math.floor(diffMs / 3600000);
  const days = Math.floor(diffMs / 86400000);
  if (minutes < 60) return `Edited ${minutes || 1} minute${minutes === 1 ? '' : 's'} ago`;
  if (hours < 24) return `Edited ${hours} hour${hours === 1 ? '' : 's'} ago`;
  return `Edited ${days || 1} day${days === 1 ? '' : 's'} ago`;
}

function toWorkspaceLabel(project?: Project | null) {
  const source = (project?.title || project?.subdomain || 'untitled').trim();
  return source
    .replace(/[^a-zA-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .replace(/_+/g, '_')
    .toUpperCase();
}

export function DashboardContent({ userName = 'User' }: { userName?: string }) {
  const router = useRouter();
  const { selectedProject } = useProject();
  const { startNavigation } = useNavigationLoading();
  const [activeTab, setActiveTab] = useState<HeroTab>('designs');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [allProjects, setAllProjects] = useState<Project[]>([]);
  const [recentProjects, setRecentProjects] = useState<Project[]>([]);
  const [activeProjectIndex, setActiveProjectIndex] = useState(0);
  const [isSliderTransitionEnabled, setIsSliderTransitionEnabled] = useState(true);
  const [showAllOtherProjects, setShowAllOtherProjects] = useState(false);

  useEffect(() => {
    let cancelled = false;
    if (!selectedProject?.id) {
      setAllProjects([]);
      setRecentProjects([]);
      setLoading(false);
      return () => {
        cancelled = true;
      };
    }
    listProjects()
      .then((res) => {
        if (!res.success || cancelled || !res.projects?.length) {
          setRecentProjects([]);
          return;
        }
        const sorted = [...res.projects].sort((a, b) => {
          const aDate = new Date(a.updatedAt || a.createdAt || 0).getTime();
          const bDate = new Date(b.updatedAt || b.createdAt || 0).getTime();
          return bDate - aDate;
        });
        setAllProjects(sorted);
        setRecentProjects(sorted.slice(0, 3));
        setActiveProjectIndex(0);
        setIsSliderTransitionEnabled(true);
        setShowAllOtherProjects(false);
      })
      .catch(() => {
        if (!cancelled) {
          setAllProjects([]);
          setRecentProjects([]);
          setShowAllOtherProjects(false);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedProject?.id]);

  useEffect(() => {
    if (recentProjects.length <= 1) return;
    const interval = window.setInterval(() => {
      setActiveProjectIndex((prev) => prev + 1);
    }, 3500);
    return () => window.clearInterval(interval);
  }, [recentProjects.length]);

  const projectCount = recentProjects.length;
  const displayProjectIndex = projectCount > 0 && activeProjectIndex >= projectCount ? 0 : activeProjectIndex;
  const featuredProject = recentProjects[displayProjectIndex] ?? null;
  const carouselProjects = projectCount > 1 ? [...recentProjects, recentProjects[0]] : recentProjects;
  const indicatorCount = Math.max(1, Math.min(3, projectCount || 1));
  const recentProjectIds = new Set(recentProjects.map((project) => project.id));
  const otherProjects = allProjects.length > 3 && !showAllOtherProjects
    ? allProjects.filter((project) => !recentProjectIds.has(project.id))
    : allProjects;

  const getTrackTranslateClass = () => {
    if (activeProjectIndex <= 0) return 'translate-x-0';
    if (activeProjectIndex === 1) return '-translate-x-full';
    if (activeProjectIndex === 2) return '-translate-x-[200%]';
    return '-translate-x-[300%]';
  };

  const handleTrackTransitionEnd = () => {
    if (projectCount <= 1) return;
    if (activeProjectIndex !== projectCount) return;
    setIsSliderTransitionEnabled(false);
    setActiveProjectIndex(0);
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        setIsSliderTransitionEnabled(true);
      });
    });
  };

  const renderProjectPreview = (project: Project | null) => {
    if (project?.thumbnail) {
      return <img src={project.thumbnail} alt={project.title || 'Recent'} className="h-full w-full object-cover" loading="lazy" />;
    }
    if (project?.id) {
      return (
        <DraftPreviewThumbnail
          projectId={project.id}
          borderColor="rgba(147,145,212,0.2)"
          bgColor="#120F46"
          className="w-full h-full !aspect-[16/9] !rounded-none"
        />
      );
    }
    return (
      <div className="relative h-full w-full overflow-hidden bg-gradient-to-br from-[#FFD8A3] via-[#B25BE6] to-[#4505CB]">
        <div className="absolute -left-20 bottom-[-44%] h-[120%] w-[72%] rounded-[50%] bg-[#00B9F2]/85" />
        <div className="absolute -left-8 bottom-[-28%] h-[80%] w-[52%] rounded-[50%] bg-[#1AA0E4]/90" />
        <div className="absolute left-[22%] top-[28%] h-[65%] w-[95%] rounded-[45%] bg-[#D8ABF8]/55" />
        <div className="absolute right-[-18%] bottom-[-34%] h-[90%] w-[62%] rounded-[50%] bg-[#6500D8]/82" />
      </div>
    );
  };

  const navigateWithLoader = (href: string) => {
    startNavigation();
    router.push(href);
  };

  return (
    <section className="relative min-h-[calc(100vh-176px)] px-3 py-3 sm:px-5 sm:py-4 lg:px-[100px] [font-family:var(--font-outfit),sans-serif]">
      <div className="pointer-events-none absolute -top-24 -left-24 h-72 w-72 rounded-full blur-3xl opacity-25 bg-[#5C1D8F]" />
      <div className="pointer-events-none absolute top-44 right-20 h-56 w-56 rounded-full blur-3xl opacity-20 bg-[#3F2A9A]" />
      <div className="pointer-events-none absolute -bottom-28 right-2 h-80 w-80 rounded-full blur-3xl opacity-30 bg-[#11144E]" />

      <div className="relative z-10 mx-auto w-full max-w-none flex flex-col gap-10">
        <div className="flex flex-col items-center text-center gap-6 pt-1">
          <h1 className="text-4xl sm:text-6xl lg:text-[76px] font-extrabold leading-[1.06] tracking-tight max-w-5xl [font-family:var(--font-outfit),sans-serif] bg-gradient-to-r from-[#8b3dff] via-[#c026d3] to-[#f5c400] bg-clip-text text-transparent">
            <span className="block">What website will</span>
            <span className="block">you build?</span>
          </h1>

          <div className="flex items-center gap-8 text-xs uppercase font-bold tracking-widest [font-family:var(--font-outfit),sans-serif]">
            <button
              type="button"
              onClick={() => setActiveTab('designs')}
              className={`pb-1 border-b-2 transition-colors ${activeTab === 'designs' ? 'border-[#FFCE00] text-[#FFCE00]' : 'border-transparent text-[#807FAF]'}`}
            >
              YOUR DESIGNS
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('templates')}
              className={`pb-1 border-b-2 transition-colors ${activeTab === 'templates' ? 'border-[#FFCE00] text-[#FFCE00]' : 'border-transparent text-[#807FAF]'}`}
            >
              TEMPLATES
            </button>
          </div>

          <div className="w-full max-w-4xl rounded-2xl px-5 py-3.5 flex items-center gap-3 border bg-[#141446] border-[#1F1F51] [box-shadow:inset_0_0_0_1px_rgba(255,255,255,0.03),0_10px_40px_rgba(16,11,62,0.45)]">
            <svg viewBox="0 0 20 20" className="h-4 w-4 shrink-0 text-[#FFCE00]" fill="none">
              <path d="M14.3 14.3L18 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              <circle cx="8.75" cy="8.75" r="5.75" stroke="currentColor" strokeWidth="1.8" />
            </svg>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search templates, designs, or actions"
              className="w-full bg-transparent text-sm outline-none text-white placeholder:text-[#6F70A8]"
            />
          </div>
        </div>

        {activeTab === 'designs' ? (
          <>
            <div className="mx-auto w-full max-w-none grid grid-cols-1 lg:grid-cols-[minmax(0,1.02fr)_minmax(0,1.18fr)] gap-8 lg:gap-12 items-center pt-3">
              <div className="space-y-5 w-full max-w-[760px] lg:justify-self-start">
                <h2 className="text-5xl sm:text-6xl lg:text-[84px] font-extrabold leading-[0.94] [font-family:var(--font-outfit),sans-serif] text-white">
                  Most Recent Project
                </h2>
                <p className="text-base sm:text-xl leading-relaxed text-[rgba(255,255,255,0.72)] max-w-[760px]">
                  {loading
                    ? 'Loading your latest project...'
                    : featuredProject
                      ? `${featuredProject.title || 'Untitled website'} — ${formatLastEdited(featuredProject.updatedAt || featuredProject.createdAt)}. Continue building your responsive hero section and component library.`
                      : `${userName}, create your first project to start building your website.`}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    if (featuredProject?.id) navigateWithLoader(`/design?projectId=${featuredProject.id}`);
                    else navigateWithLoader('/m_dashboard/web-builder');
                  }}
                  className="rounded-full px-10 py-3 text-base font-bold transition-transform hover:-translate-y-0.5 bg-[#FFCE00] text-[#121241] shadow-[0_0_28px_rgba(255,206,0,0.35)]"
                >
                  View Project
                </button>
              </div>

              <div className="relative rounded-[24px] border p-4 text-left overflow-hidden w-full max-w-none justify-self-stretch bg-[#120F46] border-[rgba(110,106,191,0.4)] shadow-[0_16px_44px_rgba(6,7,32,0.55)]">
                <div className="relative flex items-center justify-center px-1.5 mb-2 min-h-[16px]">
                  <div className="absolute left-1.5 top-1/2 -translate-y-1/2 flex items-center gap-2">
                    {Array.from({ length: indicatorCount }).map((_, idx) => {
                      const isActive = idx === displayProjectIndex;
                      return (
                        <button
                          key={`indicator-${idx}`}
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setIsSliderTransitionEnabled(true);
                            setActiveProjectIndex(idx);
                          }}
                          aria-label={`Show featured project ${idx + 1}`}
                          title={`Show featured project ${idx + 1}`}
                          className={`h-2.5 w-2.5 rounded-full transition-colors ${isActive ? 'bg-[#FFCE00]' : 'bg-[#6C6A98] hover:bg-[#8A88B8]'}`}
                        >
                          <span className="sr-only">Show featured project {idx + 1}</span>
                        </button>
                      );
                    })}
                  </div>
                  <span className="text-[10px] uppercase tracking-[0.24em] text-[#7775A6] whitespace-nowrap">
                    WORKSPACE // {toWorkspaceLabel(featuredProject)}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (featuredProject?.id) navigateWithLoader(`/design?projectId=${featuredProject.id}`);
                    else navigateWithLoader('/m_dashboard/web-builder');
                  }}
                  aria-label={featuredProject?.title ? `Open featured project ${featuredProject.title}` : 'Open featured project'}
                  title={featuredProject?.title ? `Open featured project ${featuredProject.title}` : 'Open featured project'}
                  className="w-full block rounded-xl mt-3 overflow-hidden border border-[rgba(147,145,212,0.2)] bg-[#0E0D3D]"
                >
                  <div className="w-full aspect-[16/9]">
                    <div className="relative h-full w-full overflow-hidden">
                      <div
                        onTransitionEnd={handleTrackTransitionEnd}
                        className={`flex h-full w-full ${getTrackTranslateClass()} ${isSliderTransitionEnabled ? 'transition-transform duration-500 ease-out' : ''}`}
                      >
                        {carouselProjects.map((project, idx) => (
                          <div key={`${project.id}-${idx}`} className="h-full w-full shrink-0 grow-0 basis-full">
                            {renderProjectPreview(project)}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </button>
              </div>
            </div>

            <section className="mx-auto w-full max-w-none pt-2 sm:pt-4">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-xs sm:text-sm font-bold tracking-[0.18em] uppercase text-[#FFCE00]">Other Projects</h3>
                {allProjects.length > 3 && (
                  <button
                    type="button"
                    onClick={() => setShowAllOtherProjects((prev) => !prev)}
                    className="rounded-lg border border-[#2B3488] bg-[#10145A]/70 px-4 py-1.5 text-xs sm:text-sm font-semibold text-white hover:opacity-95"
                  >
                    {showAllOtherProjects ? 'Show Less' : 'See All'}
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
                <button
                  type="button"
                  onClick={() => navigateWithLoader('/m_dashboard/web-builder')}
                  className="rounded-[26px] border border-dashed border-[#2D3A90] bg-[#12145A]/80 p-4 sm:p-5 text-left min-h-[240px] sm:min-h-[260px] flex flex-col items-center justify-center gap-5"
                >
                  <span className="h-14 w-14 rounded-2xl bg-[#FFCE00] flex items-center justify-center">
                    <svg className="w-7 h-7" fill="none" stroke="#11134D" strokeWidth={2.4} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                    </svg>
                  </span>
                  <span className="text-2xl font-extrabold text-white">New Project</span>
                </button>

                {otherProjects.map((project) => (
                  <button
                    key={project.id}
                    type="button"
                    onClick={() => navigateWithLoader(`/design?projectId=${project.id}`)}
                    className="rounded-[26px] border border-[#2D3A90] bg-[#12145A]/80 overflow-hidden text-left hover:translate-y-[-1px] transition-transform"
                  >
                    <div className="w-full aspect-[16/10] overflow-hidden border-b border-[#2D3A90] bg-[#0E0D3D]">
                      {project.thumbnail ? (
                        <img src={project.thumbnail} alt={project.title || 'Project'} className="h-full w-full object-cover" loading="lazy" />
                      ) : (
                        <DraftPreviewThumbnail
                          projectId={project.id}
                          borderColor="rgba(45,58,144,0.9)"
                          bgColor="#120F46"
                          className="w-full h-full !aspect-[16/10] !rounded-none"
                        />
                      )}
                    </div>
                    <div className="px-4 py-3.5">
                      <p className="text-2xl font-extrabold text-white leading-tight truncate">{project.title || 'Untitled Project'}</p>
                      <p className="text-xs text-[#8A8FC4] mt-1 truncate">{formatEditedDate(project.updatedAt || project.createdAt)}</p>
                    </div>
                  </button>
                ))}
              </div>
            </section>
          </>
        ) : (
          <>
            <section className="mx-auto w-full max-w-none pt-2">
              <div className="mb-5">
                <h3 className="text-xs sm:text-sm font-bold tracking-[0.18em] uppercase text-[#FFCE00]">Browse by Industry</h3>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
                {INDUSTRIES.map((industry) => (
                  <button
                    key={industry.label}
                    type="button"
                    className="relative overflow-hidden rounded-2xl h-[120px] sm:h-[140px] text-left group transition-all duration-200 hover:-translate-y-1"
                    style={{
                      background: industry.bg,
                      boxShadow: '0 4px 18px rgba(0,0,0,0.32)',
                    }}
                  >
                    <img
                      src={industry.img}
                      alt={industry.label.replace('\n', ' ')}
                      className="absolute right-0 bottom-0 h-[105%] w-[55%] object-contain object-bottom transition-transform duration-200 group-hover:scale-105"
                      style={{ filter: 'drop-shadow(-6px 4px 12px rgba(0,0,0,0.65))' }}
                      loading="lazy"
                    />

                    <div className="absolute inset-0 bg-gradient-to-r from-black/30 via-transparent to-transparent" />

                    <div className="absolute inset-y-0 left-0 w-[55%] flex items-center justify-center px-4 pl-6 z-10">
                      <span className="text-base sm:text-lg font-extrabold text-white leading-snug whitespace-pre-line text-center drop-shadow-sm">
                        {industry.label}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
              <div className="flex justify-center mt-5">
                <button
                  type="button"
                  className="px-8 py-2 rounded-full text-sm font-semibold text-white transition-opacity hover:opacity-80"
                  style={{ backgroundColor: '#6258AE' }}
                >
                  See More
                </button>
              </div>
            </section>

            <section className="mx-auto w-full max-w-none pt-2">
              <div className="mb-5">
                <h3 className="text-xs sm:text-sm font-bold tracking-[0.18em] uppercase text-[#FFCE00]">Featured Templates</h3>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-4 h-auto lg:h-[620px]">

                {/* Left — large featured card */}
                <div className="relative rounded-[22px] overflow-hidden h-[420px] lg:h-full group cursor-pointer hover:-translate-y-0.5 transition-transform">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/images/template-portfolio.jpg" alt="PC Website" className="template-pan-img" loading="lazy" />
                  {/* gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0A0730]/95 via-[#0A0730]/40 to-transparent" />
                  {/* floating text */}
                  <div className="absolute bottom-0 left-0 p-6 flex flex-col gap-2">
                    <span className="text-[10px] font-bold tracking-[0.22em] uppercase text-[#FFCE00]">Template</span>
                    <h4 className="text-2xl sm:text-3xl font-extrabold text-white leading-tight">Fashion Website</h4>
                    <button type="button" className="mt-1 flex items-center gap-2 text-xs font-bold tracking-widest uppercase text-[#FFCE00] group-hover:gap-3 transition-all duration-200">
                      Explore Collection
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Right — 2 stacked cards */}
                <div className="flex flex-col gap-4 h-full">

                  {/* Top right */}
                  <div className="relative rounded-[22px] overflow-hidden flex-1 group cursor-pointer hover:-translate-y-0.5 transition-transform min-h-[240px]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/images/template-saas.jpg" alt="Simple Website" className="template-pan-img-slow" loading="lazy" />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0A0730]/90 via-[#0A0730]/30 to-transparent" />
                    <div className="absolute bottom-0 left-0 p-5 flex flex-col gap-1">
                      <span className="text-[10px] font-bold tracking-[0.22em] uppercase text-[#FFCE00]">Template</span>
                      <h4 className="text-xl font-extrabold text-white leading-tight">Simple Website</h4>
                    </div>
                  </div>

                  {/* Bottom right */}
                  <div className="relative rounded-[22px] overflow-hidden flex-1 group cursor-pointer hover:-translate-y-0.5 transition-transform min-h-[240px]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/images/template-fashion.jpg" alt="Fashion Website" className="template-pan-img" loading="lazy" />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0A0730]/90 via-[#0A0730]/30 to-transparent" />
                    <div className="absolute bottom-0 left-0 p-5 flex flex-col gap-1">
                      <span className="text-[10px] font-bold tracking-[0.22em] uppercase text-[#FFCE00]">Template</span>
                      <h4 className="text-xl font-extrabold text-white leading-tight">Fashion Website</h4>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </>
        )}
      </div>

      <style jsx>{`
        .template-pan-img,
        .template-pan-img-slow {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transform: scale(1.02);
          transition: transform 8s ease;
        }

        .template-pan-img-slow {
          transition-duration: 12s;
        }

        .group:hover .template-pan-img,
        .group:hover .template-pan-img-slow {
          transform: scale(1.08);
        }
      `}</style>
    </section>
  );
}

export default function Page() {
  return <DashboardContent />;
}
