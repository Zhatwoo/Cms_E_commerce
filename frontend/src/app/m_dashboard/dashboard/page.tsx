'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import {
  updateProject,
  deleteProject,
  restoreProject,
  permanentDeleteProject,
  createProject,
  getStoredUser,
  type Project,
} from '@/lib/api';
import { DraftPreviewThumbnail } from '../components/projects/DraftPreviewThumbnail';
import { useProject } from '../components/context/project-context';
import { useTheme } from '../components/context/theme-context';
import { useAlert } from '../components/context/alert-context';
import { ensureProjectStorageFolder } from '@/lib/firebaseStorage';
import { INDUSTRY_OPTIONS } from '@/lib/industryCatalog';
import { span } from 'framer-motion/m';

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

const INDUSTRY_CONFIG = {
  'fashion': { icon: <path d="M20.38 3.46L16 2a4 4 0 01-8 0L3.62 3.46a2 2 0 00-1.34 2.23l.58 3.47a1 1 0 00.99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 002-2V10h2.15a1 1 0 00.99-.84l.58-3.47a2 2 0 00-1.34-2.23z" /> },
  'tech': { icon: <path d="M20 16V4a2 2 0 00-2-2H6a2 2 0 00-2 2v12m16 0a2 2 0 01-2 2H6a2 2 0 01-2-2m16 0H4m16 4H4" /> },
  'electronics': { icon: <path d="M20 16V4a2 2 0 00-2-2H6a2 2 0 00-2 2v12m16 0a2 2 0 01-2 2H6a2 2 0 01-2-2m16 0H4m16 4H4" /> },
  'home': { icon: <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2zM9 22V12h6v10" /> },
  'food': { icon: <path d="M18 8h1a4 4 0 010 8h-1M2 8h16v9a4 4 0 01-4 4H6a4 4 0 01-4-4V8zM6 1v3M10 1v3M14 1v3" /> },
  'beauty': { icon: <path d="M12 2s-4 4.5-4 7.5a4 4 0 008 0c0-3-4-7.5-4-7.5zM12 22s8-7 8-12.5S16 3 12 3 4 4.5 4 9.5 12 22 12 22z" /> },
  'kids': { icon: <path d="M10 3H5a2 2 0 00-2 2v5a2 2 0 002 2h5a2 2 0 002-2V5a2 2 0 00-2-2zM21 3h-5a2 2 0 00-2 2v5a2 2 0 002 2h5a2 2 0 002-2V5a2 2 0 00-2-2zM10 14H5a2 2 0 00-2 2v5a2 2 0 002 2h5a2 2 0 002-2v-5a2 2 0 00-2-2zM21 14h-5a2 2 0 00-2 2v5a2 2 0 002 2h5a2 2 0 002-2v-5a2 2 0 00-2-2z" /> },
  'pets': { icon: <path d="M11 20H4a2 2 0 01-2-2V5a2 2 0 012-2h3.9a2 2 0 011.69.9l.81 1.2a2 2 0 001.67.9H20a2 2 0 012 2v5M15 19l2 2 4-4" /> },
  'automotive': { icon: <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-1.1 0-2 .9-2 2v4c0 .6.4 1 1 1h2m12 0a2 2 0 100 4 2 2 0 000-4zm-12 0a2 2 0 100 4 2 2 0 000-4z" /> },
  'sports': { icon: <path d="M6.7 6.7l10.6 10.6m-10.6 0l10.6-10.6" /> },
  'creative': { icon: <path d="M12 19l7-7 3 3-7 7-3-3zM18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5zM2 2l5 5" /> },
};

const DASHBOARD_TABS = [
  { id: 'designs' as const, label: 'YOUR DESIGNS' },
  { id: 'templates' as const, label: 'TEMPLATES' },
];

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
  const { selectedProject, projects: contextProjects, loading: contextLoading, refreshProjects } = useProject();
  const { theme } = useTheme();
  const { showAlert, showConfirm } = useAlert();
  const [activeTab, setActiveTab] = useState<HeroTab>('designs');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [allProjects, setAllProjects] = useState<Project[]>([]);
  const [recentProjects, setRecentProjects] = useState<Project[]>([]);
  const [activeProjectIndex, setActiveProjectIndex] = useState(0);
  const [isSliderTransitionEnabled, setIsSliderTransitionEnabled] = useState(true);
  const [showAllOtherProjects, setShowAllOtherProjects] = useState(false);
  const [actioningProjectId, setActioningProjectId] = useState<string | null>(null);
  const [openProjectMenuId, setOpenProjectMenuId] = useState<string | null>(null);
  const [renamingProject, setRenamingProject] = useState<Project | null>(null);
  const [renameTitle, setRenameTitle] = useState('');
  
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createTitle, setCreateTitle] = useState('');
  const [createIndustry, setCreateIndustry] = useState('');
  const [createSubdomain, setCreateSubdomain] = useState('');
  const [creating, setCreating] = useState(false);

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setCreating(true);
      const title = createTitle.trim() || 'Untitled Project';
      const industry = createIndustry.trim();
      const subdomain = createSubdomain.trim().toLowerCase().replace(/[^a-z0-9-]/g, '');

      if (!industry) {
        showAlert('Please select your store industry first.');
        return;
      }

      const res = await createProject({
        title,
        industry,
        subdomain: subdomain || undefined,
      });

      if (!res.success || !res.project) {
        showAlert('Failed to create project. Please try again.');
        return;
      }

      const user = getStoredUser();
      const clientName = (user?.name || user?.username || 'client').trim() || 'client';
      ensureProjectStorageFolder(clientName, res.project.title || 'website').catch(() => {});

      setCreateModalOpen(false);
      setCreateTitle('');
      setCreateIndustry('');
      setCreateSubdomain('');
      
      router.push(`/design?projectId=${res.project.id}`);
    } catch (error) {
      const msg = error instanceof Error ? error.message : '';
      if (msg.includes('404')) {
        showAlert('Project API not found. Make sure the backend is running.');
      } else {
        showAlert('Failed to create project. Please try again.');
      }
    } finally {
      setCreating(false);
    }
  };

  const handleCardKeyDown = (event: React.KeyboardEvent<HTMLDivElement>, onActivate: () => void) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onActivate();
    }
  };

  useEffect(() => {
    if (!selectedProject?.id || contextLoading) {
      setAllProjects([]);
      setRecentProjects([]);
      setLoading(contextLoading);
      return;
    }
    if (!contextProjects?.length) {
      setAllProjects([]);
      setRecentProjects([]);
      setLoading(false);
      return;
    }
    const sorted = [...contextProjects].sort((a, b) => {
      const aDate = new Date(a.updatedAt || a.createdAt || 0).getTime();
      const bDate = new Date(b.updatedAt || b.createdAt || 0).getTime();
      return bDate - aDate;
    });
    setAllProjects(sorted);
    setRecentProjects(sorted.slice(0, 3));
    setActiveProjectIndex(0);
    setIsSliderTransitionEnabled(true);
    setShowAllOtherProjects(false);
    setLoading(false);
  }, [selectedProject?.id, contextProjects, contextLoading]);

  useEffect(() => {
    if (recentProjects.length <= 1) return;
    const interval = window.setInterval(() => {
      setActiveProjectIndex((prev) => prev + 1);
    }, 3500);
    return () => window.clearInterval(interval);
  }, [recentProjects.length]);

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
    const normalizedStatus = String(project.status || '').trim().toLowerCase();
    if (normalizedStatus === 'published' || normalizedStatus === 'live') {
      showAlert('This project is live. Take down (unpublish) the website first before moving it to trash.');
      setOpenProjectMenuId(null);
      return;
    }

    const confirmed = await showConfirm(`Move "${project.title || 'Untitled Project'}" to trash?`);
    if (!confirmed) return;

    try {
      setActioningProjectId(project.id);
      const res = await deleteProject(project.id);
      if (!res.success) return;

      await refreshProjects();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to move project to trash.';
      showAlert(message);
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
          className="w-full h-full aspect-video! rounded-none!"
        />
      );
    }
    return (
      <div className="relative h-full w-full overflow-hidden bg-linear-to-br from-[#FFD8A3] via-[#B25BE6] to-[#4505CB]">
        <div className="absolute -left-20 bottom-[-44%] h-[120%] w-[72%] rounded-[50%] bg-[#00B9F2]/85" />
        <div className="absolute -left-8 bottom-[-28%] h-[80%] w-[52%] rounded-[50%] bg-[#1AA0E4]/90" />
        <div className="absolute left-[22%] top-[28%] h-[65%] w-[95%] rounded-[45%] bg-[#D8ABF8]/55" />
        <div className="absolute right-[-18%] bottom-[-34%] h-[90%] w-[62%] rounded-[50%] bg-[#6500D8]/82" />
      </div>
    );
  };

  return (
    <section className="dashboard-landing-light relative min-h-[calc(100vh-176px)] px-3 py-3 sm:px-5 sm:py-4 lg:px-25 [font-family:var(--font-outfit),sans-serif]">
      <div className="relative z-10 mx-auto w-full max-w-none flex flex-col gap-10">
        <div className="flex flex-col items-center text-center gap-8 pt-1">
          <h1
            className="text-4xl sm:text-6xl lg:text-[76px] font-black leading-[1.2] tracking-tight max-w-5xl [font-family:var(--font-outfit),sans-serif] text-white"
          >
            <span className={`block ${theme === 'dark' ? 'text-white' : 'text-[#120533]'}`}>
              What{' '}
              <span
                className={`inline-block bg-clip-text text-transparent bg-gradient-to-r ${theme === 'dark' ? 'from-[#7c3aed] via-[#d946ef] to-[#ffcc00]' : 'from-[#7c3aed] via-[#d946ef] to-[#f5a213]'}`}
                style={{ paddingBottom: '0.1em', marginBottom: '-0.1em' }}
              >
                website
              </span>{' '}
              will
            </span>
            <span className={`block ${theme === 'dark' ? 'text-white' : 'text-[#120533]'}`}>
              you{' '}
              <span
                className={`inline-block bg-clip-text text-transparent bg-gradient-to-r ${theme === 'dark' ? 'from-[#7c3aed] via-[#d946ef] to-[#ffcc00]' : 'from-[#7c3aed] via-[#d946ef] to-[#f5a213]'}`}
                style={{ paddingBottom: '0.1em', marginBottom: '-0.1em' }}
              >
                build?
              </span>
            </span>
          </h1>

          <div className="flex items-center gap-8 text-xs uppercase font-bold tracking-widest [font-family:var(--font-outfit),sans-serif]">
            {DASHBOARD_TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                /* Casting tab.id to HeroTab fixes the TS error Severity 8 */
                onClick={() => setActiveTab(tab.id as HeroTab)}
                className={`
                  cursor-pointer relative pb-1 transition-all duration-300
                  ${activeTab === tab.id 
                    ? (theme === 'dark' ? 'text-[#FFCE00]' : 'text-[#120533]') 
                    : (theme === 'dark' ? 'text-[#807FAF]' : 'text-[#120533]/50')
                  }
                  hover:opacity-70
                `}
              >
                {tab.label}
                
                {activeTab === tab.id && (
                  <motion.span
                    layoutId="dashboard-tab-underline"
                    className="absolute left-0 right-0 -bottom-0.5 h-[2.5px] rounded-full"
                    style={{ 
                      background: theme === 'dark'
                        ? 'linear-gradient(90deg, #7c3aed 0%, #d946ef 50%, #ffcc00 100%)' 
                        : 'linear-gradient(90deg, #7c3aed 0%, #d946ef 50%, #f5a213 100%)' 
                    }}
                    transition={{ 
                      type: 'spring', 
                      stiffness: 520, 
                      damping: 38 
                    }}
                  />
                )}
              </button>
            ))}
          </div>

          <div 
            className={`
              m-dashboard-search-shadow w-full max-w-4xl rounded-2xl px-5 py-3.5 flex items-center gap-3 border 
              transition-all duration-500
              
              ${theme === 'dark' 
                ? 'bg-[#141446] border-[#1F1F51]' 
                : 'admin-dashboard-panel-soft border-0'
              }

              ${theme === 'light' && 'shadow-[0_0_15px_rgba(139,92,246,0.1),0_0_1px_rgba(139,92,246,0.2)]'}
              ${theme === 'dark' && 'shadow-[0_0_12px_rgba(31,31,81,0.4)]'}

              ${theme === 'dark'
                ? 'hover:border-[#2a2a6e] focus-within:border-[#3b3b8a]'
                : 'hover:border-[#8B5CF6]/40 focus-within:border-[#8B5CF6] focus-within:shadow-[0_0_25px_rgba(139,92,246,0.2)]'
              }
            `}
          >
            <div className="relative">
              {theme === 'light' && (
                <div className="absolute inset-0 bg-[#8B5CF6] blur-md opacity-20 scale-150 rounded-full" />
              )}
              
              <svg 
                viewBox="0 0 20 20" 
                className={`
                  h-4 w-4 shrink-0 relative z-10 transition-all duration-300
                  ${theme === 'dark' 
                    ? 'text-[#FFCE00] filter-[drop-shadow(0_0_5px_rgba(255,206,0,0.6))]' 
                    : 'text-[#8B5CF6]'
                  }
                `} 
                fill="none"
              >
                <path d="M14.3 14.3L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                <circle cx="8.75" cy="8.75" r="5.75" stroke="currentColor" strokeWidth="2" />
              </svg>
            </div>

            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search templates, designs, or actions"
              className={`
                w-full bg-transparent text-sm outline-none font-medium
                ${theme === 'dark'
                  ? 'text-white placeholder:text-[#6F70A8]'
                  : 'text-[#120533] placeholder:text-[#120533]/30'
                }
              `}
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
              <div className="mt-10 mx-auto w-full max-w-none grid grid-cols-1 lg:grid-cols-[minmax(0,1.02fr)_minmax(0,1.18fr)] gap-8 lg:gap-12 items-center pt-3">
                <div className="space-y-5 w-full max-w-190 lg:justify-self-start">
                  <h2
                    className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-[0.94] [font-family:var(--font-outfit),sans-serif]"
                    style={{ color: theme === 'dark' ? '#FFFFFF' : '#120533' }}
                  >
                    Most Recent Project
                  </h2>
                  
                  <p
                    className="text-base sm:text-xl leading-relaxed max-w-190"
                    style={{ color: theme === 'dark' ? 'rgba(255,255,255,0.72)' : 'rgba(30, 41, 59, 0.72)' }}
                  >
                    {loading
                      ? 'Loading your latest project...'
                      : featuredProject
                        ? (
                          <>
                            {/* Using the vibrant purple/fuchsia for the project title in light mode */}
                            <span style={{ 
                              color: theme === 'dark' ? '#FFCE00' : '#8B5CF6', 
                              fontWeight: 700 
                            }}>
                              {featuredProject.title || 'Untitled website'}
                            </span>
                            {` — ${formatLastEdited(featuredProject.updatedAt || featuredProject.createdAt)}. Continue building your responsive hero section and component library.`}
                          </>
                        )
                        : `${userName}, create your first project to start building your website.`}
                  </p>

                  <button
                    type="button"
                    onClick={() => {
                      if (featuredProject?.id) router.push(`/design?projectId=${featuredProject.id}`);
                      else router.push('/design');
                    }}
                    className={`
                      rounded-full px-10 py-3 text-base font-bold cursor-pointer 
                      transition-all duration-300 ease-out 
                      hover:-translate-y-1 hover:brightness-110 active:scale-95
                      text-white shadow-[0_8px_24px_rgba(217,70,239,0.4)] hover:shadow-[0_12px_28px_rgba(217,70,239,0.5)]
                    `}
                    style={{
                      background: 'linear-gradient(90deg, #9333ea 0%, #ec4899 100%)'
                    }}
                  >
                    View Project
                  </button>
                </div>

               <div className={`
                  relative rounded-4xl border p-5 text-left overflow-hidden transition-all duration-500
                  ${theme === 'dark' 
                    ? 'bg-linear-to-br from-[#0D0C37] via-[#110F4D] to-[#0D0C37] border-[#6E6ABF]/40 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)]' 
                    : 'admin-dashboard-panel border-0'
                  }
                `}>
                  {/* Ambient Background Glows */}
                  <div className={`
                    absolute inset-0 pointer-events-none opacity-40 blur-[100px] transition-colors duration-700
                    ${theme === 'dark' 
                      ? 'bg-[radial-gradient(circle_at_top_right,#FFCE0010,transparent),radial-gradient(circle_at_bottom_left,#8B5CF620,transparent)]' 
                      : 'bg-[radial-gradient(circle_at_top_right,#8B5CF615,transparent)]'
                    }
                  `} />

                  <div className="relative flex items-center justify-between px-1 mb-4 min-h-6 z-10">
                    {/* High-Energy Indicators */}
                    <div className="flex items-center gap-2.5">
                      {Array.from({ length: indicatorCount }).map((_, idx) => {
                        const isActive = idx === displayProjectIndex;
                        return (
                          <button
                            key={`indicator-${idx}`}
                            type="button"
                            onClick={(e) => {
                              e.preventDefault(); e.stopPropagation();
                              setIsSliderTransitionEnabled(true);
                              setActiveProjectIndex(idx);
                            }}
                            className={`
                              relative h-2 rounded-full transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)]
                              ${isActive 
                                ? (theme === 'dark' ? 'w-10 bg-linear-to-r from-[#FFCE00] to-[#FF8A00]' : 'w-10 bg-linear-to-r from-[#8B5CF6] to-[#D946EF]') 
                                : (theme === 'dark' ? 'w-2 bg-[#6C6A98]/40 hover:bg-[#8B5CF6]/40' : 'w-2 bg-[#8B5CF6]/20 hover:bg-[#8B5CF6]/40')
                              }
                            `}
                          >
                            {isActive && (
                              <span className={`absolute inset-0 rounded-full blur-[6px] animate-pulse ${theme === 'dark' ? 'bg-[#FFCE00]/60' : 'bg-[#D946EF]/50'}`} />
                            )}
                          </button>
                        );
                      })}
                    </div>

                    {/* Stylish Label */}
                    <span className={`
                      text-[10px] font-[1000] uppercase tracking-[0.3em] transition-all duration-500
                      ${theme === 'dark' 
                        ? 'bg-linear-to-r from-[#FFCE00] to-[#FF8A00] bg-clip-text text-transparent' 
                        : 'bg-linear-to-r from-[#8B5CF6] to-[#D946EF] bg-clip-text text-transparent'
                      }
                    `}>
                      WORKSPACE // {toWorkspaceLabel(featuredProject)}
                    </span>
                  </div>

                  <div
                    role="button"
                    onClick={() => featuredProject?.id ? router.push(`/design?projectId=${featuredProject.id}`) : router.push('/design')}
                    className={`
                      group relative w-full block rounded-2xl mt-2 overflow-hidden border transition-all duration-700 cursor-pointer
                      ${theme === 'dark' 
                        ? 'border-white/5 bg-[#0A092D] shadow-2xl' 
                        : 'border-white bg-white shadow-lg'
                      }
                      hover:scale-[1.015]
                    `}
                  >
                    {/* Adaptive All-around Glow Border */}
                    <div className={`
                      absolute inset-0 z-30 pointer-events-none transition-opacity duration-500 border-2 rounded-2xl opacity-0 group-hover:opacity-100
                      ${theme === 'dark' ? 'border-[#FFCE00]/40' : 'border-[#8B5CF6]/50'}
                    `} />

                    <div className="w-full aspect-video">
                      <div className="relative h-full w-full overflow-hidden">
                        <div
                          onTransitionEnd={handleTrackTransitionEnd}
                          className={`flex h-full w-full ${getTrackTranslateClass()} ${isSliderTransitionEnabled ? 'transition-transform duration-700 cubic-bezier(0.23, 1, 0.32, 1)' : ''}`}
                        >
                          {carouselProjects.map((project, idx) => (
                            <div key={`${project.id}-${idx}`} className="h-full w-full shrink-0 grow-0 basis-full">
                              {renderProjectPreview(project)}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <section className="mx-auto w-full max-w-none pt-2 sm:pt-4 mt-10">
                <div className="mb-4 flex items-center justify-between">
                  <h3 
                    className={`
                      text-xs sm:text-sm font-bold tracking-[0.18em] transition-colors duration-300
                      ${theme === 'dark' 
                        ? 'text-[#FFCE00]' 
                        : 'text-[#8B5CF6]' 
                      }
                    `}
                  >
                    Other Projects
                  </h3> 

                  <div className="flex items-center gap-2 sm:gap-3">
                    {allProjects.length > 3 && (
                      <button
                        type="button"
                        onClick={() => setShowAllOtherProjects((prev) => !prev)}
                        className={`
                          cursor-pointer rounded-lg px-4 py-1.5 text-xs sm:text-sm font-bold transition-all duration-300 active:scale-95 border-2
                          ${theme === 'dark' 
                            ? 'border-[#272261] bg-[#15093E]/70 text-white hover:border-[#FFCE00] hover:text-[#FFCE00]' 
                            : 'border-[#8B5CF6] bg-transparent text-[#8B5CF6] hover:bg-[#8B5CF6] hover:text-white'
                          }
                        `}
                      >
                        {showAllOtherProjects ? 'Show Less' : 'See All'}
                      </button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
                  <button
                    type="button"
                    onClick={() => setCreateModalOpen(true)}
                    className={`
                      cursor-pointer group relative flex flex-col items-center justify-center gap-6
                      w-full min-h-60 sm:min-h-65 p-4 sm:p-5
                      rounded-[40px] transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)]
                      hover:-translate-y-2
                      
                      ${theme === 'dark' 
                        ? 'bg-[#15093E] border border-[#280E59] shadow-[0_20px_40px_rgba(0,0,0,0.3)]' 
                        : 'admin-dashboard-panel border-0'
                      }
                    `}
                  >

                    {/* Main Action Icon */}
                    <div className="relative">
                      <div 
                        className={`
                          h-20 w-20 rounded-[28px] flex items-center justify-center 
                          transition-all duration-500 shadow-lg group-hover:scale-110 group-hover:rotate-90
                          ${theme === 'dark'
                            ? 'bg-[#FFCE00] text-[#11134D] shadow-[0_0_30px_rgba(255,206,0,0.2)]'
                            : 'bg-linear-to-br from-[#8B5CF6] to-[#D946EF] text-white shadow-[0_10px_25px_rgba(139,92,246,0.3)]'
                          }
                        `}
                      >
                        <svg className="w-10 h-10" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14m7-7H5" />
                        </svg>
                      </div>
                    </div>

                    {/* Typography - Fixed spacing and font weight */}
                    <div className="flex flex-col items-center gap-1">
                      <span 
                        className={`
                          text-xl font-black tracking-tighter transition-colors duration-300
                          ${theme === 'dark' ? 'text-white' : 'text-[#120533]'}
                        `}
                      >
                        New Project
                      </span>
                      <div className={`h-1 w-8 rounded-full transition-all duration-500 scale-x-0 group-hover:scale-x-100 ${theme === 'dark' ? 'bg-[#FFCE00]' : 'bg-[#8B5CF6]'}`} />
                    </div>
                  </button>
                  {otherProjects.map((project) => (
                    <div
                      key={project.id}
                      className={`
                        group relative rounded-4xl overflow-hidden transition-all duration-500 cursor-pointer
                        ${theme === 'dark' 
                          ? 'bg-[#15093E] border border-[#272261] shadow-[0_20px_40px_rgba(0,0,0,0.3)]' 
                          : 'admin-dashboard-panel-soft border-0'
                        }
                        hover:-translate-y-2
                      `}
                    >
                      {/* Default State Violet Highlight - Ambient Top Glow */}
                      {theme === 'light' && (
                        <div className="absolute inset-0 z-10 pointer-events-none bg-[radial-gradient(ellipse_at_top,var(--tw-gradient-stops))] from-[#8B5CF6]/10 via-transparent to-transparent opacity-100" />
                      )}

                      {/* Hover Border Overlay - All-around Glow */}
                      <div className={`
                        absolute inset-0 z-30 rounded-4xl pointer-events-none transition-all duration-500
                        border-2 opacity-0 group-hover:opacity-100
                        ${theme === 'dark' ? 'border-[#FFCE00]/50' : 'border-[#8B5CF6]/60'}
                      `} />

                      {/* Action Menu */}
                      {!project.isShared && (
                        <div className="absolute right-3 top-3 z-40" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault(); e.stopPropagation();
                              setOpenProjectMenuId((prev) => (prev === project.id ? null : project.id));
                            }}
                            className={`
                              cursor-pointer h-8 w-8 rounded-full flex items-center justify-center transition-all backdrop-blur-md
                              ${theme === 'dark' ? 'bg-black/20 text-white/40 hover:text-white' : 'bg-[#8B5CF6]/10 text-[#8B5CF6] hover:bg-[#8B5CF6] hover:text-white'}
                            `}
                          >
                            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                              <circle cx="12" cy="5" r="1.5" /><circle cx="12" cy="12" r="1.5" /><circle cx="12" cy="19" r="1.5" />
                            </svg>
                          </button>

                          {openProjectMenuId === project.id && (
                            <div className={`
                              absolute right-0 mt-2 w-36 rounded-2xl border p-1 shadow-xl animate-in fade-in zoom-in duration-200 z-50
                              ${theme === 'dark' ? 'bg-[#15093E] border-[#272261] text-white' : 'bg-white border-[#8B5CF6]/20 text-slate-700'}
                            `}>
                              <button
                                onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleEditActiveProject(project); }}
                                className={`w-full px-3 py-2 rounded-xl text-left text-sm flex items-center gap-2 transition-colors ${theme === 'dark' ? 'hover:bg-white/5' : 'hover:bg-slate-50'}`}
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 3.487a1.875 1.875 0 1 1 2.652 2.652L8.25 17.403 4.5 18.75l1.347-3.75L16.862 3.487Z" /></svg>
                                Edit
                              </button>
                              <button
                                onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleDeleteActiveProject(project); }}
                                className={`w-full px-3 py-2 rounded-xl text-left text-sm text-red-500 flex items-center gap-2 transition-colors ${theme === 'dark' ? 'hover:bg-red-500/10' : 'hover:bg-red-50'}`}
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                Delete
                              </button>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Content Area */}
                      <div role="button" onClick={() => router.push(`/design?projectId=${project.id}`)}>
                        <div className={`relative w-full aspect-video overflow-hidden ${theme === 'dark' ? 'bg-[#0A0A26]' : 'bg-white'}`}>
                          {project.thumbnail ? (
                            <img src={project.thumbnail} alt={project.title} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
                          ) : (
                            <DraftPreviewThumbnail
                              projectId={project.id}
                              borderColor="transparent"
                              bgColor="transparent"
                              className="w-full h-full aspect-16/10! rounded-none!"
                            />
                          )}
                          {/* Subtle Violet Wash on Image */}
                          <div className={`absolute inset-0 opacity-10 ${theme === 'light' ? 'bg-[#8B5CF6]' : 'bg-transparent'}`} />
                        </div>

                        <div className="p-6">
                          <h3 className={`text-lg font-black tracking-tight truncate transition-colors duration-300 ${
                            theme === 'dark' ? 'text-white group-hover:text-[#FFCE00]' : 'text-[#120533] group-hover:text-[#8B5CF6]'
                          }`}>
                            {project.title || 'Untitled Project'}
                          </h3>
                          <p className={`text-[11px] font-bold tracking-widest mt-1 ${theme === 'dark' ? 'text-[#6F70A8]' : 'text-[#8B5CF6]/70'}`}>
                            {project.isShared ? `by ${project.ownerName}` : formatEditedDate(project.updatedAt)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
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
              <section className="mx-auto w-full max-w-none pt-2 my-10">
                <div className="mb-5 flex items-center justify-between">
                  <h3 
                    className={`
                      text-xs sm:text-sm font-bold tracking-[0.18em] transition-colors duration-300
                      ${theme === 'dark' 
                        ? 'text-[#FFCE00]' 
                        : 'text-[#8B5CF6]' 
                      }
                    `}
                  >
                    Browse by Industry
                  </h3> 
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
                  {INDUSTRIES.map((industry) => {
                    const foundKey = Object.keys(INDUSTRY_CONFIG).find(k => 
                      industry.label.toLowerCase().includes(k)
                    );      
                    const activeIcon = INDUSTRY_CONFIG[(foundKey || 'creative') as keyof typeof INDUSTRY_CONFIG].icon;
                    
                    return (
                      <button
                        key={industry.label}
                        type="button"
                        className={`
                          group relative h-25 sm:h-27.5 w-full overflow-hidden rounded-3xl border transition-all duration-300 text-left
                          /* Dark Mode: Original preserved */
                          ${theme === 'dark' 
                            ? 'border-[#272261]/50 bg-[#23164E] hover:border-[#B13BFF] hover:bg-[#2A1756]' 
                            : 'admin-dashboard-panel border-0'
                          }
                          hover:-translate-y-1 active:scale-95
                        `}
                      >
                        {/* Background Detail: Soft Violet Curve */}
                        <div className={`
                          absolute -right-4 -top-6 h-[140%] w-[65%] rounded-full transition-transform duration-500 group-hover:scale-110
                          ${theme === 'dark' ? 'bg-[#1A0D45]' : 'bg-[#A855F7]/10'}
                        `} />

                        {/* Foreground Content */}
                        <div className="relative z-10 flex h-full w-full items-center justify-between px-5 sm:px-6">
                          <span className={`
                            max-w-[50%] text-sm sm:text-base font-[1000] leading-tight tracking-tight transition-all
                            ${theme === 'dark' 
                              ? 'text-white group-hover:text-white/90' 
                              : 'text-[#7C3AED] group-hover:text-[#6B21A8]'
                            }
                          `}>
                            {industry.label}
                          </span>

                          <div className="relative flex items-center justify-center">
                            {/* Icon Housing: Crisp Violet Glass */}
                            <div className={`
                              relative flex h-14 w-14 items-center justify-center rounded-[22px] border transition-all duration-300 sm:h-16 sm:w-16
                              ${theme === 'dark'
                                ? 'border-[#3C3161] bg-[#26194E] [box-shadow:inset_0_2px_10px_rgba(255,255,255,0.02),inset_0_-2px_10px_rgba(0,0,0,0.4)] group-hover:border-[#FFCE00]/30 group-hover:bg-[#301E3D]'
                                : 'border-[#A855F7]/20 bg-white/50 backdrop-blur-sm group-hover:bg-white group-hover:border-[#A855F7]/40 shadow-sm'
                              }
                            `}>
                              <svg 
                                className={`
                                  h-7 w-7 transition-all duration-300 group-hover:scale-110
                                  ${theme === 'dark' ? 'text-white/70 group-hover:text-[#FFCE00]' : 'text-[#A855F7]'} 
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

                <div className="mt-8 flex justify-center">
                 <button
                  type="button"
                  className={`
                    cursor-pointer text-sm font-black tracking-[0.2em] transition-all duration-300
                    ${theme === 'dark' 
                      ? 'text-[#8C84C8] hover:text-[#FFCE00]' 
                      /* Light Mode: Using the Orchid/Amethyst theme from your reference */
                      : 'text-[#A855F7] hover:text-[#7C3AED] hover:translate-x-1'
                    }
                  `}
                >
                  See More
                </button>

                </div>
              </section>
              <section className="mx-auto w-full max-w-none pt-2">
                <div className="mb-5">
                  <h3 
                    className={`
                      text-xs sm:text-sm font-bold tracking-[0.18em] uppercase transition-colors duration-300
                      ${theme === 'dark' 
                        ? 'text-[#FFCE00]' 
                        : 'text-[#8B5CF6]' 
                      }
                    `}
                  >
                    Featured Templates
                  </h3> 
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-4 h-auto lg:h-155">
                  {/* Left — large featured card */}
                  <div className="relative rounded-[22px] overflow-hidden h-105 lg:h-full group cursor-pointer hover:-translate-y-0.5 transition-transform">
                    <img src="/images/template-portfolio.jpg" alt="PC Website" className="template-pan-img" loading="lazy" />
                    
                    {/* Clean, Light-First Overlays */}
                    <div className={`
                      absolute inset-0 transition-all duration-500
                      ${theme === 'dark' 
                        ? 'bg-linear-to-t from-[#0A0730]/95 via-[#0A0730]/40 to-transparent' 
                        : 'bg-linear-to-t from-white/90 via-white/20 to-transparent group-hover:from-[#F3E8FF]/90'
                      }
                    `} />

                    <div className="absolute bottom-0 left-0 p-6 flex flex-col gap-2">
                      <span className={`
                        text-[10px] font-black tracking-[0.22em] uppercase
                        ${theme === 'dark' ? 'text-[#FFCE00]' : 'text-[#A855F7]'}
                      `}>
                        Template
                      </span>
                      <h4 className={`
                        text-2xl sm:text-3xl font-extrabold leading-tight transition-colors
                        ${theme === 'dark' ? 'text-white' : 'text-[#120533]'}
                      `}>
                        Fashion Website
                      </h4>
                      <button type="button" className={`
                        mt-1 flex items-center gap-2 text-xs font-black tracking-widest uppercase group-hover:gap-3 transition-all duration-200
                        ${theme === 'dark' ? 'text-[#FFCE00]' : 'text-[#A855F7]'}
                      `}>
                        Explore Collection
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  {/* Right — 2 stacked cards */}
                  <div className="flex flex-col gap-4 h-full">
                    {/* Top right */}
                    <div className="relative rounded-[22px] overflow-hidden flex-1 group cursor-pointer hover:-translate-y-0.5 transition-transform min-h-60">
                      <img src="/images/template-saas.jpg" alt="Simple Website" className="template-pan-img-slow" loading="lazy" />
                      <div className={`
                        absolute inset-0 transition-all duration-500
                        ${theme === 'dark' 
                          ? 'bg-linear-to-t from-[#0A0730]/90 via-[#0A0730]/30 to-transparent' 
                          : 'bg-linear-to-t from-white/80 via-white/10 to-transparent'
                        }
                      `} />
                      <div className="absolute bottom-0 left-0 p-5 flex flex-col gap-1">
                        <span className={`
                          text-[10px] font-black tracking-[0.22em] uppercase
                          ${theme === 'dark' ? 'text-[#FFCE00]' : 'text-[#A855F7]'}
                        `}>
                          Template
                        </span>
                        <h4 className={`
                          text-xl font-extrabold leading-tight
                          ${theme === 'dark' ? 'text-white' : 'text-[#120533]'}
                        `}>
                          Simple Website
                        </h4>
                      </div>
                    </div>

                    {/* Bottom right */}
                    <div className="relative rounded-[22px] overflow-hidden flex-1 group cursor-pointer hover:-translate-y-0.5 transition-transform min-h-60">
                      <img src="/images/template-fashion.jpg" alt="Fashion Website" className="template-pan-img" loading="lazy" />
                      <div className={`
                        absolute inset-0 transition-all duration-500
                        ${theme === 'dark' 
                          ? 'bg-linear-to-t from-[#0A0730]/90 via-[#0A0730]/30 to-transparent' 
                          : 'bg-linear-to-t from-white/80 via-white/10 to-transparent'
                        }
                      `} />
                      <div className="absolute bottom-0 left-0 p-5 flex flex-col gap-1">
                        <span className={`
                          text-[10px] font-black tracking-[0.22em] uppercase
                          ${theme === 'dark' ? 'text-[#FFCE00]' : 'text-[#A855F7]'}
                        `}>
                          Template
                        </span>
                        <h4 className={`
                          text-xl font-extrabold leading-tight
                          ${theme === 'dark' ? 'text-white' : 'text-[#120533]'}
                        `}>
                          Fashion Website
                        </h4>
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
            className={`w-full max-w-md rounded-2xl border p-5 shadow-2xl ${theme === 'dark' ? 'border-[#2D3A90] bg-[#12145A]' : 'border-[#8B5CF6]/20 bg-white'}`}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className={`text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-[#120533]'}`}>Rename project</h3>
            <p className={`mt-1 text-xs ${theme === 'dark' ? 'text-[#8A8FC4]' : 'text-[#8B5CF6]/70'}`}>Update the project title.</p>

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
              className={`mt-4 w-full rounded-lg border px-3 py-2 text-sm outline-none ${
                theme === 'dark'
                  ? 'border-[#2D3A90] bg-[#0E0D3D] text-white focus:border-[#6B72D8]'
                  : 'border-[#8B5CF6]/20 bg-[#F8F9FF] text-[#120533] focus:border-[#8B5CF6] placeholder:text-gray-400'
              }`}
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
                className={`px-3 py-1.5 rounded-md text-xs font-medium hover:text-white disabled:opacity-50 ${theme === 'dark' ? 'text-[#8A8FC4]' : 'text-gray-500 hover:text-[#120533]'}`}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={submitRenameProject}
                disabled={actioningProjectId === renamingProject.id}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold disabled:opacity-50 ${
                  theme === 'dark' 
                    ? 'bg-[#FFCE00] text-[#121241] hover:bg-[#FFD740]' 
                    : 'bg-[#8B5CF6] text-white hover:bg-[#7C3AED]'
                }`}
              >
                {actioningProjectId === renamingProject.id ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Project Modal */}
      <AnimatePresence>
        {createModalOpen && (
          <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setCreateModalOpen(false)}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-md rounded-[32px] border shadow-[0_32px_80px_rgba(0,0,0,0.5)] overflow-hidden"
              style={{ 
                backgroundColor: theme === 'dark' ? '#15093E' : '#FFFFFF', 
                borderColor: theme === 'dark' ? '#280E59' : '#E5E7EB' 
              }}
            >
              <div className="p-8 border-b" style={{ borderColor: theme === 'dark' ? '#280E59' : '#F3F4F6' }}>
                <h3 className="text-2xl font-black tracking-tight" style={{ color: theme === 'dark' ? '#FFFFFF' : '#120533' }}>Create New Project</h3>
                <p className="text-sm mt-2 font-medium opacity-60" style={{ color: theme === 'dark' ? '#A78BFA' : '#616170' }}>
                  Launch your next stunning storefront. Select an industry to load the best optimized tools.
                </p>
              </div>

              <form onSubmit={handleCreateProject} className="p-8 space-y-5">
                <div>
                  <label className="block text-xs font-black uppercase tracking-widest mb-2 opacity-50" style={{ color: theme === 'dark' ? '#A78BFA' : '#120533' }}>Project Title</label>
                  <input
                    type="text"
                    value={createTitle}
                    onChange={(e) => setCreateTitle(e.target.value)}
                    placeholder="e.g. My Awesome Store"
                    required
                    className="w-full px-5 py-3.5 rounded-2xl border bg-transparent font-medium transition-all focus:outline-none focus:ring-2 focus:ring-[#8B5CF6]/50"
                    style={{ 
                      borderColor: theme === 'dark' ? '#280E59' : '#E5E7EB', 
                      color: theme === 'dark' ? '#FFFFFF' : '#120533',
                      backgroundColor: theme === 'dark' ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.02)'
                    }}
                  />
                </div>

                <div>
                  <label className="block text-xs font-black uppercase tracking-widest mb-2 opacity-50" style={{ color: theme === 'dark' ? '#A78BFA' : '#120533' }}>Industry / Store Type</label>
                  <select
                    value={createIndustry}
                    onChange={(e) => setCreateIndustry(e.target.value)}
                    required
                    className="w-full px-5 py-3.5 rounded-2xl border bg-transparent font-medium appearance-none transition-all focus:outline-none focus:ring-2 focus:ring-[#8B5CF6]/50"
                    style={{ 
                      borderColor: theme === 'dark' ? '#280E59' : '#E5E7EB', 
                      color: theme === 'dark' ? '#FFFFFF' : '#120533',
                      backgroundColor: theme === 'dark' ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.02)'
                    }}
                  >
                    <option value="" disabled className={theme === 'dark' ? 'bg-[#15093E]' : 'bg-white'}>Select Industry</option>
                    {INDUSTRY_OPTIONS.map((item) => (
                      <option key={item.key} value={item.key} className={theme === 'dark' ? 'bg-[#15093E]' : 'bg-white'}>{item.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-black uppercase tracking-widest mb-2 opacity-50" style={{ color: theme === 'dark' ? '#A78BFA' : '#120533' }}>Preferred Subdomain</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={createSubdomain}
                      onChange={(e) => setCreateSubdomain(e.target.value)}
                      placeholder="myshop"
                      className="w-full px-5 py-3.5 rounded-2xl border bg-transparent font-medium transition-all focus:outline-none focus:ring-2 focus:ring-[#8B5CF6]/50"
                      style={{ 
                        borderColor: theme === 'dark' ? '#280E59' : '#E5E7EB', 
                        color: theme === 'dark' ? '#FFFFFF' : '#120533',
                        backgroundColor: theme === 'dark' ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.02)'
                      }}
                    />
                  </div>
                  <p className="text-[10px] mt-2 font-bold opacity-40 uppercase tracking-tighter" style={{ color: theme === 'dark' ? '#A78BFA' : '#616170' }}>
                    Result: {createSubdomain.toLowerCase().replace(/[^a-z0-9-]/g, '') || 'myshop'}.mycentric.shop
                  </p>
                </div>

                <div className="flex justify-end gap-4 pt-6">
                  <button 
                    type="button" 
                    onClick={() => setCreateModalOpen(false)} 
                    className="px-6 py-3 rounded-2xl text-sm font-bold transition-all hover:opacity-70" 
                    style={{ color: theme === 'dark' ? '#A78BFA' : '#616170' }}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    disabled={creating} 
                    className={`px-8 py-3 rounded-2xl text-sm font-black text-white transition-all transform active:scale-95 disabled:opacity-50 shadow-lg ${
                      theme === 'dark' ? 'bg-[#FFCE00] !text-[#121241]' : 'bg-gradient-to-r from-[#8B5CF6] to-[#D946EF]'
                    }`}
                  >
                    {creating ? 'Creating…' : 'Create & Design'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
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
