'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence } from 'framer-motion';
import {
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
import { autoSavePage, getDraft } from '@/app/design/_lib/pageApi';
import { TabBar, type TabBarItem } from '@/app/m_dashboard/components/ui/tabbar';
import { SearchBar } from '@/app/m_dashboard/components/ui/searchbar';
import { YourDesignsTabContent } from './tab contents/YourDesignsTabContent';
import { TemplatesTabContent } from './tab contents/TemplatesTabContent';

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
  const [applyingTemplateId, setApplyingTemplateId] = useState<string | null>(null);

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

  const getIndustryIcon = (label: string) => {
    const foundKey = Object.keys(INDUSTRY_CONFIG).find((key) => label.toLowerCase().includes(key));
    return INDUSTRY_CONFIG[(foundKey || 'creative') as keyof typeof INDUSTRY_CONFIG].icon;
  };

  const handleApplyTemplate = async (templateProjectId: string) => {
    if (!selectedProject?.id) {
      showAlert('Select a destination project in Your Designs first.');
      return;
    }

    if (selectedProject.id === templateProjectId) {
      showAlert('You are already on this project. Pick a different destination project.');
      return;
    }

    setApplyingTemplateId(templateProjectId);
    try {
      const templateDraftRes = await getDraft(templateProjectId);
      const templateContent = templateDraftRes?.data?.content;

      if (!templateDraftRes.success || !templateContent) {
        showAlert('Template has no saved draft content yet. Open it in the builder and save once, then try again.');
        return;
      }

      const contentString = typeof templateContent === 'string'
        ? templateContent
        : JSON.stringify(templateContent);

      const applyResult = await autoSavePage(contentString, selectedProject.id);
      if (!applyResult.success) {
        showAlert(applyResult.error || 'Failed to apply template to the selected project.');
        return;
      }

      showAlert('Template applied. Opening your builder project...');
      router.push(`/design?projectId=${selectedProject.id}`);
    } catch {
      showAlert('Failed to apply template. Please try again.');
    } finally {
      setApplyingTemplateId(null);
    }
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

          <TabBar<HeroTab>
            tabs={DASHBOARD_TABS}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            theme={theme as 'light' | 'dark'}
            underlineLayoutId="dashboard-tab-underline"
          />

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
            <YourDesignsTabContent
              theme={theme}
              userName={userName}
              loading={loading}
              featuredProject={featuredProject}
              indicatorCount={indicatorCount}
              displayProjectIndex={displayProjectIndex}
              carouselProjects={carouselProjects}
              otherProjects={otherProjects}
              allProjectsCount={allProjects.length}
              showAllOtherProjects={showAllOtherProjects}
              openProjectMenuId={openProjectMenuId}
              isSliderTransitionEnabled={isSliderTransitionEnabled}
              formatLastEdited={formatLastEdited}
              formatEditedDate={formatEditedDate}
              toWorkspaceLabel={toWorkspaceLabel}
              getTrackTranslateClass={getTrackTranslateClass}
              onTrackTransitionEnd={handleTrackTransitionEnd}
              onOpenDesign={(projectId) => {
                if (projectId) {
                  router.push(`/design?projectId=${projectId}`);
                  return;
                }
                router.push('/design');
              }}
              setActiveProjectIndex={setActiveProjectIndex}
              setIsSliderTransitionEnabled={setIsSliderTransitionEnabled}
              setShowAllOtherProjects={setShowAllOtherProjects}
              onCreateProject={() => router.push('/m_dashboard/projects/new')}
              setOpenProjectMenuId={setOpenProjectMenuId}
              onEditProject={handleEditActiveProject}
              onDeleteProject={handleDeleteActiveProject}
              renderProjectPreview={renderProjectPreview}
            />
          ) : (
            <TemplatesTabContent
              theme={theme}
              industries={INDUSTRIES}
              getIndustryIcon={getIndustryIcon}
              projects={allProjects}
              selectedProject={selectedProject}
              searchQuery={searchQuery}
              applyingTemplateId={applyingTemplateId}
              onApplyTemplate={handleApplyTemplate}
            />
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
