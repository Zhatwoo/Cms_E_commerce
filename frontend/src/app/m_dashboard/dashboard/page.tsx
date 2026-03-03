'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import {
  listProjects,
  listTrashedProjects,
  updateProject,
  deleteProject,
  restoreProject,
  permanentDeleteProject,
  type Project,
} from '@/lib/api';
import { DraftPreviewThumbnail } from '../components/projects/DraftPreviewThumbnail';
import { useProject } from '../components/context/project-context';
import { useTheme } from '../components/context/theme-context';
import { useAlert } from '../components/context/alert-context';

const INDUSTRIES = [
  { label: 'Fashion &\nApparel',      img: '/images/industries/Fashion & Apparel.png',    bg: 'linear-gradient(135deg,#3A006D 0%,#1A1A6E 100%)' },
  { label: 'Electronics\n& Tech',     img: '/images/industries/Electronics & Tech.png',    bg: 'linear-gradient(135deg,#1A1A6E 0%,#0E2060 100%)' },
  { label: 'Home &\nLiving',          img: '/images/industries/Home & Living.png',          bg: 'linear-gradient(135deg,#0E2060 0%,#2B0E7A 100%)' },
  { label: 'Food &\nBeverage',        img: '/images/industries/Food & Beverage.png',        bg: 'linear-gradient(135deg,#3F1080 0%,#1A1A6E 100%)' },
  { label: 'Beauty',                  img: '/images/industries/Beauty.png',                 bg: 'linear-gradient(135deg,#4A0E8A 0%,#3A006D 100%)' },
  { label: 'Kids, Toys\n& Hobbies',  img: '/images/industries/Kids, Toys & Hobbies.png',  bg: 'linear-gradient(135deg,#2B0E7A 0%,#0E2060 100%)' },
  { label: 'Pets',                    img: '/images/industries/Pets.png',                   bg: 'linear-gradient(135deg,#1D2B8A 0%,#3A006D 100%)' },
  { label: 'Automotive',              img: '/images/industries/Automotive.png',             bg: 'linear-gradient(135deg,#0E0B3D 0%,#1A1A6E 100%)' },
  { label: 'Sports &\nFitness',       img: '/images/industries/Sports & Fitness.png',       bg: 'linear-gradient(135deg,#2D0080 0%,#1D2B8A 100%)' },
  { label: 'Creative &\nHandmade',    img: '/images/industries/Creative & Handmade.png',    bg: 'linear-gradient(135deg,#3A1070 0%,#0E2060 100%)' },
] as const;

type HeroTab = 'designs' | 'templates';
type ProjectTab = 'active' | 'trash';

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
  const { theme } = useTheme();
  const { showAlert } = useAlert();
  const [activeTab, setActiveTab] = useState<HeroTab>('designs');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [allProjects, setAllProjects] = useState<Project[]>([]);
  const [recentProjects, setRecentProjects] = useState<Project[]>([]);
  const [activeProjectIndex, setActiveProjectIndex] = useState(0);
  const [isSliderTransitionEnabled, setIsSliderTransitionEnabled] = useState(true);
  const [showAllOtherProjects, setShowAllOtherProjects] = useState(false);
  const [projectTab, setProjectTab] = useState<ProjectTab>('active');
  const [trashLoading, setTrashLoading] = useState(false);
  const [trashedProjects, setTrashedProjects] = useState<Project[]>([]);
  const [actioningProjectId, setActioningProjectId] = useState<string | null>(null);
  const [openProjectMenuId, setOpenProjectMenuId] = useState<string | null>(null);
  const [renamingProject, setRenamingProject] = useState<Project | null>(null);
  const [renameTitle, setRenameTitle] = useState('');

  useEffect(() => {
    let cancelled = false;
    if (!selectedProject?.id) {
      setAllProjects([]);
      setRecentProjects([]);
      setLoading(false);
      return () => { cancelled = true; };
    }
    listProjects({ instanceId: selectedProject.id })
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
    return () => { cancelled = true; };
  }, [selectedProject?.id]);

  useEffect(() => {
    if (recentProjects.length <= 1) return;
    const interval = window.setInterval(() => {
      setActiveProjectIndex((prev) => prev + 1);
    }, 3500);
    return () => window.clearInterval(interval);
  }, [recentProjects.length]);

  useEffect(() => {
    if (projectTab !== 'trash') return;
    let cancelled = false;
    setTrashLoading(true);
    listTrashedProjects()
      .then((res) => {
        if (cancelled) return;
        if (res.success && res.projects) {
          setTrashedProjects(res.projects);
          return;
        }
        setTrashedProjects([]);
      })
      .catch(() => {
        if (!cancelled) setTrashedProjects([]);
      })
      .finally(() => {
        if (!cancelled) setTrashLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [projectTab]);

  useEffect(() => {
    if (!openProjectMenuId) return;
    const closeMenu = () => setOpenProjectMenuId(null);
    document.addEventListener('click', closeMenu);
    return () => document.removeEventListener('click', closeMenu);
  }, [openProjectMenuId]);

  const projectCount = recentProjects.length;
  const displayProjectIndex = projectCount > 0 && activeProjectIndex >= projectCount ? 0 : activeProjectIndex;
  const featuredProject = recentProjects[displayProjectIndex] ?? null;
  const carouselProjects = projectCount > 1 ? [...recentProjects, recentProjects[0]] : recentProjects;
  const indicatorCount = Math.max(1, Math.min(3, projectCount || 1));
  const recentProjectIds = new Set(recentProjects.map((project) => project.id));
  const otherProjects = allProjects.length > 3 && !showAllOtherProjects
    ? allProjects.filter((project) => !recentProjectIds.has(project.id))
    : allProjects;
  const visibleTrashProjects = showAllOtherProjects
    ? trashedProjects
    : trashedProjects.slice(0, 3);

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

  const handleRestoreProject = async (projectId: string) => {
    try {
      setActioningProjectId(projectId);
      const res = await restoreProject(projectId);
      if (!res.success) return;
      setTrashedProjects((prev) => prev.filter((project) => project.id !== projectId));
      if (selectedProject?.id) {
        const activeRes = await listProjects({ instanceId: selectedProject.id });
        if (activeRes.success && activeRes.projects) {
          const sorted = [...activeRes.projects].sort((a, b) => {
            const aDate = new Date(a.updatedAt || a.createdAt || 0).getTime();
            const bDate = new Date(b.updatedAt || b.createdAt || 0).getTime();
            return bDate - aDate;
          });
          setAllProjects(sorted);
          setRecentProjects(sorted.slice(0, 3));
        }
      }
    } finally {
      setActioningProjectId(null);
    }
  };

  const handlePermanentDeleteProject = async (projectId: string, projectTitle?: string) => {
    const confirmed = window.confirm(`Permanently delete "${projectTitle || 'Untitled Project'}"? This cannot be undone.`);
    if (!confirmed) return;
    try {
      setActioningProjectId(projectId);
      const res = await permanentDeleteProject(projectId);
      if (!res.success) return;
      setTrashedProjects((prev) => prev.filter((project) => project.id !== projectId));
    } finally {
      setActioningProjectId(null);
    }
  };

  const sortProjectsByUpdated = (projects: Project[]) => {
    return [...projects].sort((a, b) => {
      const aDate = new Date(a.updatedAt || a.createdAt || 0).getTime();
      const bDate = new Date(b.updatedAt || b.createdAt || 0).getTime();
      return bDate - aDate;
    });
  };

  const handleEditActiveProject = async (project: Project) => {
    setRenamingProject(project);
    setRenameTitle((project.title || 'Untitled Project').trim());
    setOpenProjectMenuId(null);
  };

  const submitRenameProject = async () => {
    if (!renamingProject) return;
    const trimmedTitle = renameTitle.trim();
    if (!trimmedTitle) {
      showAlert('Project title cannot be empty.');
      return;
    }

    try {
      setActioningProjectId(renamingProject.id);
      const res = await updateProject(renamingProject.id, { title: trimmedTitle });
      if (!res.success) {
        showAlert(res.message || 'Failed to rename project.');
        return;
      }

      const merged = allProjects.map((item) =>
        item.id === renamingProject.id
          ? {
              ...item,
              ...(res.project || {}),
              title: res.project?.title || trimmedTitle,
              updatedAt: res.project?.updatedAt || new Date().toISOString(),
            }
          : item
      );
      const sorted = sortProjectsByUpdated(merged);
      setAllProjects(sorted);
      setRecentProjects(sorted.slice(0, 3));
      setRenamingProject(null);
      setRenameTitle('');
    } catch {
      showAlert('Backend is unreachable. Start the backend server and ensure API URL/port is correct.');
    } finally {
      setActioningProjectId(null);
    }
  };

  const handleDeleteActiveProject = async (project: Project) => {
    const confirmed = window.confirm(`Move "${project.title || 'Untitled Project'}" to trash?`);
    if (!confirmed) return;

    try {
      setActioningProjectId(project.id);
      const res = await deleteProject(project.id);
      if (!res.success) return;

      const filtered = allProjects.filter((item) => item.id !== project.id);
      const sorted = sortProjectsByUpdated(filtered);
      setAllProjects(sorted);
      setRecentProjects(sorted.slice(0, 3));
    } catch {
      showAlert('Backend is unreachable. Start the backend server and ensure API URL/port is correct.');
    } finally {
      setActioningProjectId(null);
      setOpenProjectMenuId(null);
    }
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

  /* Reference: deep indigo/purple bg with subtle gradient */
  return (
    <section className="relative min-h-[calc(100vh-176px)] px-3 py-3 sm:px-5 sm:py-4 lg:px-[100px] [font-family:var(--font-outfit),sans-serif]">
      <div className="pointer-events-none absolute -top-24 -left-24 h-72 w-72 rounded-full blur-3xl opacity-25 bg-[#5C1D8F]" />
      <div className="pointer-events-none absolute top-44 right-20 h-56 w-56 rounded-full blur-3xl opacity-20 bg-[#3F2A9A]" />
      <div className="pointer-events-none absolute -bottom-28 right-2 h-80 w-80 rounded-full blur-3xl opacity-30 bg-[#11144E]" />

      <div className="relative z-10 mx-auto w-full max-w-none flex flex-col gap-10">
        <div className="flex flex-col items-center text-center gap-6 pt-1">
          <h1
            className={`text-4xl sm:text-6xl lg:text-[76px] font-extrabold leading-[1.06] tracking-tight max-w-5xl [font-family:var(--font-outfit),sans-serif] ${theme === 'dark' ? 'bg-clip-text text-transparent' : 'text-[#000000]'}`}
            style={{
              backgroundImage: theme === 'dark'
                ? 'linear-gradient(90deg,rgba(255,255,255,1) 0%,rgba(255,255,255,0.81) 15%,rgba(216,157,255,0.63) 31%,rgba(167,139,250,1) 54%,rgba(217,173,143,0.89) 82%,rgba(255,242,191,0.78) 88%,rgba(255,255,255,0.81) 97%)'
                : 'none',
            }}
          >
            <span className="block">What website will</span>
            <span className="block">you build?</span>
          </h1>

          <div className="flex items-center gap-8 text-xs uppercase font-bold tracking-widest [font-family:var(--font-outfit),sans-serif]">
            <button
              type="button"
              onClick={() => setActiveTab('designs')}
              className={`relative pb-1 transition-colors ${activeTab === 'designs' ? 'text-[#FFCE00]' : 'text-[#807FAF]'}`}
            >
              YOUR DESIGNS
              {activeTab === 'designs' && (
                <motion.span
                  layoutId="dashboard-tab-underline"
                  className="absolute left-0 right-0 -bottom-[2px] h-[2px]"
                  style={{ background: 'linear-gradient(90deg,#B13BFF 0%, #B36760 50%, #FFCC00 100%)' }}
                  transition={{ type: 'spring', stiffness: 520, damping: 38 }}
                />
              )}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('templates')}
              className={`relative pb-1 transition-colors ${activeTab === 'templates' ? 'text-[#FFCE00]' : 'text-[#807FAF]'}`}
            >
              TEMPLATES
              {activeTab === 'templates' && (
                <motion.span
                  layoutId="dashboard-tab-underline"
                  className="absolute left-0 right-0 -bottom-[2px] h-[2px]"
                  style={{ background: 'linear-gradient(90deg,#B13BFF 0%, #B36760 50%, #FFCC00 100%)' }}
                  transition={{ type: 'spring', stiffness: 520, damping: 38 }}
                />
              )}
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

        <AnimatePresence mode="wait" initial={false}>
        {activeTab === 'designs' ? (
          <motion.div
            key="designs-tab"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
          >
            <div className="mx-auto w-full max-w-none grid grid-cols-1 lg:grid-cols-[minmax(0,1.02fr)_minmax(0,1.18fr)] gap-8 lg:gap-12 items-center pt-3">
              <div className="space-y-5 w-full max-w-[760px] lg:justify-self-start">
                <h2
                  className="text-5xl sm:text-6xl lg:text-[84px] font-extrabold leading-[0.94] [font-family:var(--font-outfit),sans-serif]"
                  style={{ color: theme === 'dark' ? '#FFFFFF' : '#1E1B4B' }}
                >
                  Most Recent Project
                </h2>
                <p
                  className="text-base sm:text-xl leading-relaxed max-w-[760px]"
                  style={{ color: theme === 'dark' ? 'rgba(255,255,255,0.72)' : 'rgba(30, 41, 59, 0.78)' }}
                >
                  {loading
                    ? 'Loading your latest project...'
                    : featuredProject
                      ? `${featuredProject.title || 'Untitled website'} – ${formatLastEdited(featuredProject.updatedAt || featuredProject.createdAt)}. Continue building your responsive hero section and component library.`
                      : `${userName}, create your first project to start building your website.`}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    if (featuredProject?.id) router.push(`/design?projectId=${featuredProject.id}`);
                    else router.push('/design');
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
                    if (featuredProject?.id) router.push(`/design?projectId=${featuredProject.id}`);
                    else router.push('/design');
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
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="inline-flex items-center gap-1 rounded-xl border border-[#1F1F51] bg-[#141446] p-1">
                    <button
                      type="button"
                      onClick={() => {
                        setProjectTab('active');
                        setShowAllOtherProjects(false);
                      }}
                      className={`px-3 py-1.5 rounded-lg text-[11px] sm:text-xs font-semibold transition-all ${projectTab === 'active' ? 'bg-[#2D3A90] text-white shadow-sm' : 'text-[#8A8FC4] hover:text-white'}`}
                    >
                      Active
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setProjectTab('trash');
                        setShowAllOtherProjects(false);
                      }}
                      className={`px-3 py-1.5 rounded-lg text-[11px] sm:text-xs font-semibold transition-all ${projectTab === 'trash' ? 'bg-[#2D3A90] text-white shadow-sm' : 'text-[#8A8FC4] hover:text-white'}`}
                    >
                      Trash
                    </button>
                  </div>
                  {((projectTab === 'active' && allProjects.length > 3) || (projectTab === 'trash' && trashedProjects.length > 3)) && (
                    <button
                      type="button"
                      onClick={() => setShowAllOtherProjects((prev) => !prev)}
                      className="rounded-lg border border-[#2B3488] bg-[#10145A]/70 px-4 py-1.5 text-xs sm:text-sm font-semibold text-white hover:opacity-95"
                    >
                      {showAllOtherProjects ? 'Show Less' : 'See All'}
                    </button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
                {projectTab === 'active' ? (
                  <>
                    <button
                      type="button"
                      onClick={() => router.push('/design')}
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
                      <div
                        key={project.id}
                        role="button"
                        tabIndex={0}
                        onClick={() => router.push(`/design?projectId=${project.id}`)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            router.push(`/design?projectId=${project.id}`);
                          }
                        }}
                        className="relative rounded-[26px] border border-[#2D3A90] bg-[#12145A]/80 overflow-hidden text-left hover:translate-y-[-1px] transition-transform"
                      >
                        <div className="absolute right-3 top-3 z-20" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setOpenProjectMenuId((prev) => (prev === project.id ? null : project.id));
                            }}
                            className="h-8 w-8 rounded-md border border-[#2D3A90] bg-[#0E0D3D]/90 text-white flex items-center justify-center"
                            aria-label="Project actions"
                            title="Project actions"
                          >
                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                              <circle cx="12" cy="6" r="1.8" />
                              <circle cx="12" cy="12" r="1.8" />
                              <circle cx="12" cy="18" r="1.8" />
                            </svg>
                          </button>

                          {openProjectMenuId === project.id && (
                            <div className="absolute right-0 mt-1 w-36 rounded-lg border border-[#2D3A90] bg-[#12145A] py-1 shadow-xl">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  handleEditActiveProject(project);
                                }}
                                disabled={actioningProjectId === project.id}
                                className="w-full px-3 py-2 text-left text-sm text-white flex items-center gap-2 hover:bg-white/5 disabled:opacity-50"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden="true">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 3.487a1.875 1.875 0 1 1 2.652 2.652L8.25 17.403 4.5 18.75l1.347-3.75L16.862 3.487Z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 4.5l3.75 3.75" />
                                </svg>
                                Edit
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  handleDeleteActiveProject(project);
                                }}
                                disabled={actioningProjectId === project.id}
                                className="w-full px-3 py-2 text-left text-sm text-red-300 flex items-center gap-2 hover:bg-red-500/10 disabled:opacity-50"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden="true">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                                Delete
                              </button>
                            </div>
                          )}
                        </div>

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
                      </div>
                    ))}
                  </>
                ) : trashLoading ? (
                  <div className="col-span-full flex flex-col items-center justify-center py-14 gap-3">
                    <div className="w-6 h-6 border-2 border-[#FFCE00] border-t-transparent rounded-full animate-spin" />
                    <p className="text-sm text-[#8A8FC4]">Loading trash…</p>
                  </div>
                ) : visibleTrashProjects.length === 0 ? (
                  <div className="col-span-full flex flex-col items-center justify-center py-14 gap-2 text-center">
                    <svg className="w-10 h-10 text-[#3A3A7A]" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    <p className="text-sm text-[#8A8FC4]">Trash is empty.</p>
                    <p className="text-xs text-[#6B6FA0]">Deleted projects appear here for 30 days before being purged.</p>
                  </div>
                ) : (
                  <>
                    {visibleTrashProjects.map((project) => (
                      <div
                        key={project.id}
                        className="rounded-[26px] border border-[#2D3A90] bg-[#12145A]/80 overflow-hidden text-left"
                      >
                        <div className="w-full aspect-[16/10] overflow-hidden border-b border-[#2D3A90] bg-[#0E0D3D] grayscale">
                          <DraftPreviewThumbnail
                            projectId={project.id}
                            borderColor="rgba(45,58,144,0.9)"
                            bgColor="#120F46"
                            className="w-full h-full !aspect-[16/10] !rounded-none"
                          />
                        </div>
                        <div className="px-4 py-3.5 space-y-3">
                          <div>
                            <p className="text-2xl font-extrabold text-white leading-tight truncate">{project.title || 'Untitled Project'}</p>
                            <p className="text-xs text-[#8A8FC4] mt-1 truncate">In trash</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleRestoreProject(project.id)}
                              disabled={actioningProjectId === project.id}
                              className="px-2.5 py-1.5 rounded-md text-xs font-medium text-white border border-[#3E4AA3] hover:bg-[#2D3A90]/40 disabled:opacity-50"
                            >
                              Restore
                            </button>
                            <button
                              type="button"
                              onClick={() => handlePermanentDeleteProject(project.id, project.title)}
                              disabled={actioningProjectId === project.id}
                              className="px-2.5 py-1.5 rounded-md text-xs font-medium text-red-300 border border-red-500/40 hover:bg-red-500/10 disabled:opacity-50"
                            >
                              Delete forever
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </>
                )}
              </div>
            </section>
          </motion.div>
        ) : (
          /* ── TEMPLATES TAB ──────────────────────────────────────── */
          <motion.div
            key="templates-tab"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
          >
            {/* Browse by Industry */}
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
                    {/* Image — floats large at the right, slightly overflowing bottom */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={industry.img}
                      alt={industry.label.replace('\n', ' ')}
                      className="absolute right-0 bottom-0 h-[105%] w-[55%] object-contain object-bottom transition-transform duration-200 group-hover:scale-105"
                      style={{ filter: 'drop-shadow(-6px 4px 12px rgba(0,0,0,0.65))' }}
                      loading="lazy"
                    />

                    {/* Subtle gradient fade so text stays readable */}
                    <div className="absolute inset-0 bg-gradient-to-r from-black/30 via-transparent to-transparent" />

                    {/* Text label — left half, centered */}
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

            {/* Featured Templates */}
            <section className="mx-auto w-full max-w-none pt-2">
              <div className="mb-5">
                <h3 className="text-xs sm:text-sm font-bold tracking-[0.18em] uppercase text-[#FFCE00]">Featured Templates</h3>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-4 h-auto lg:h-[560px]">

                {/* Left — big Fashion Website card */}
                <div className="group relative rounded-2xl overflow-hidden cursor-pointer hover:-translate-y-1 transition-transform duration-200 h-[380px] lg:h-full">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/images/template-fashion.jpg" alt="Fashion Website" className="template-pan-img" loading="lazy" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0A0730]/95 via-[#0A0730]/30 to-transparent" />
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-br from-white/5 to-transparent" />
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

                {/* Right — Simple Website (top) + PC Website (bottom) */}
                <div className="flex flex-col gap-4 h-full">

                  {/* Simple Website */}
                  <div className="group relative rounded-2xl overflow-hidden cursor-pointer hover:-translate-y-1 transition-transform duration-200 flex-1 min-h-[260px]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/images/template-saas.jpg" alt="Simple Website" className="template-pan-img-sm template-pan-img-delay" loading="lazy" />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0A0730]/90 via-[#0A0730]/25 to-transparent" />
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-br from-white/5 to-transparent" />
                    <div className="absolute bottom-0 left-0 p-4 flex flex-col gap-1">
                      <span className="text-[9px] font-bold tracking-[0.2em] uppercase text-[#FFCE00]">Template</span>
                      <h4 className="text-lg font-extrabold text-white leading-tight">Simple Website</h4>
                    </div>
                  </div>

                  {/* PC Website */}
                  <div className="group relative rounded-2xl overflow-hidden cursor-pointer hover:-translate-y-1 transition-transform duration-200 flex-1 min-h-[260px]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/images/template-portfolio.jpg" alt="PC Website" className="template-pan-img-sm template-pan-img-delay2" loading="lazy" />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0A0730]/90 via-[#0A0730]/25 to-transparent" />
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-br from-white/5 to-transparent" />
                    <div className="absolute bottom-0 left-0 p-4 flex flex-col gap-1">
                      <span className="text-[9px] font-bold tracking-[0.2em] uppercase text-[#FFCE00]">Template</span>
                      <h4 className="text-lg font-extrabold text-white leading-tight">PC Website</h4>
                    </div>
                  </div>

                </div>
              </div>
            </section>
          </motion.div>
        )}
        </AnimatePresence>
      </div>

      {renamingProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={() => {
          if (actioningProjectId === renamingProject.id) return;
          setRenamingProject(null);
          setRenameTitle('');
        }}>
          <div
            className="w-full max-w-md rounded-2xl border border-[#2D3A90] bg-[#12145A] p-5 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-white">Rename project</h3>
            <p className="mt-1 text-xs text-[#8A8FC4]">Update the project title.</p>

            <input
              type="text"
              value={renameTitle}
              onChange={(e) => setRenameTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  submitRenameProject();
                }
              }}
              autoFocus
              className="mt-4 w-full rounded-lg border border-[#2D3A90] bg-[#0E0D3D] px-3 py-2 text-sm text-white outline-none focus:border-[#6B72D8]"
              placeholder="Untitled Project"
            />

            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setRenamingProject(null);
                  setRenameTitle('');
                }}
                disabled={actioningProjectId === renamingProject.id}
                className="px-3 py-1.5 rounded-md text-xs font-medium text-[#8A8FC4] hover:text-white disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={submitRenameProject}
                disabled={actioningProjectId === renamingProject.id}
                className="px-3 py-1.5 rounded-md text-xs font-semibold bg-[#FFCE00] text-[#121241] hover:bg-[#FFD740] disabled:opacity-50"
              >
                {actioningProjectId === renamingProject.id ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

export default function Page() {
  return <DashboardContent />;
}
