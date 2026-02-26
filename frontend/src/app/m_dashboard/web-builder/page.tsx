 'use client';
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../components/context/theme-context';
import { useRouter, useSearchParams } from 'next/navigation';
import DomeGallery from '../components/templates/DomeGallery';
import { templateService, Template as FullTemplate } from '@/lib/templateService';
import { createProject, listProjects, updateProject, deleteProject, getStoredUser, type Project } from '@/lib/api';
import { ensureProjectStorageFolder } from '@/lib/firebaseStorage';
import { useAlert } from '../components/context/alert-context';
import { useProject } from '../components/context/project-context';
import { DraftPreviewThumbnail } from '../components/projects/DraftPreviewThumbnail';
import { WebPreview } from '@/app/design/_lib/webRenderer';

// Template interface for DomeGallery compatibility
interface GalleryTemplate {
  id: string | number;
  title: string;
  category: string;
  desc: string;
  status?: 'New' | 'Popular' | 'Coming Soon';
  imageColor: string;
}

// Convert FullTemplate to GalleryTemplate
const convertToGalleryTemplate = (template: FullTemplate): GalleryTemplate => ({
  id: template.id,
  title: template.title,
  category: template.category,
  desc: template.desc,
  status: template.status,
  imageColor: template.imageColor || 'from-gray-500 to-gray-700'
});

const CATEGORIES = ['Type', 'E-commerce', 'Blog', 'Portfolio', 'Landing Page'];

type SortOptionId = 'relevant' | 'newest' | 'oldest' | 'az' | 'za';

const SORT_OPTIONS: Array<{ id: SortOptionId; label: string; icon: 'sparkles' | 'clock' | 'sort-asc' | 'sort-desc' }> = [
  { id: 'relevant', label: 'Most relevant', icon: 'sparkles' },
  { id: 'newest', label: 'Newest edited', icon: 'clock' },
  { id: 'oldest', label: 'Oldest edited', icon: 'clock' },
  { id: 'az', label: 'Alphabetical (A-Z)', icon: 'sort-asc' },
  { id: 'za', label: 'Alphabetical (Z-A)', icon: 'sort-desc' },
];

function SortOptionIcon({ icon }: { icon: 'sparkles' | 'clock' | 'sort-asc' | 'sort-desc' }) {
  if (icon === 'sparkles') {
    return (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M10.5 4.5l1.2 3.2c.15.4.47.72.87.87l3.2 1.2-3.2 1.2a1.4 1.4 0 00-.87.87l-1.2 3.2-1.2-3.2a1.4 1.4 0 00-.87-.87l-3.2-1.2 3.2-1.2c.4-.15.72-.47.87-.87l1.2-3.2zm7 9.5l.6 1.6c.1.26.3.46.56.56l1.6.6-1.6.6a.9.9 0 00-.56.56l-.6 1.6-.6-1.6a.9.9 0 00-.56-.56l-1.6-.6 1.6-.6a.9.9 0 00.56-.56l.6-1.6z" />
      </svg>
    );
  }

  if (icon === 'clock') {
    return (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="12" r="8" strokeWidth={1.8} />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 8v4l2.5 1.5" />
      </svg>
    );
  }

  if (icon === 'sort-asc') {
    return (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 17V7m0 0l-3 3m3-3l3 3M14 17h6M14 13h4M14 9h2" />
      </svg>
    );
  }

  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 7v10m0 0l-3-3m3 3l3-3M14 17h2M14 13h4M14 9h6" />
    </svg>
  );
}

const TemplateCard = ({ template, colors, onPreview, onUseTemplate }: {
  template: GalleryTemplate;
  colors: any;
  onPreview: (t: GalleryTemplate) => void;
  onUseTemplate: (t: GalleryTemplate) => void;
}) => (
  <div
    className="group relative rounded-2xl border overflow-hidden flex flex-col shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 h-full"
    style={{
      backgroundColor: colors.bg.card,
      borderColor: colors.border.faint,
    }}
  >
    {/* Thumbnail */}
    <div className={`h-48 w-full bg-gradient-to-br ${template.imageColor} relative overflow-hidden`}>
      <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors" />

      {/* Status Badge */}
      {template.status && (
        <div className="absolute top-3 right-3">
          <span
            className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide backdrop-blur-md shadow-sm ${template.status === 'Coming Soon'
              ? 'bg-black/40 text-white border border-white/20'
              : 'bg-white text-black'
              }`}
          >
            {template.status}
          </span>
        </div>
      )}

      {/* Overlay Actions */}
      <div className="absolute inset-0 flex items-center justify-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-black/40 backdrop-blur-[2px]">
        <button
          onClick={() => onPreview(template)}
          className="px-4 py-2 rounded-lg bg-white text-black text-sm font-medium shadow-lg hover:bg-gray-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-200"
        >
          Preview
        </button>
      </div>
    </div>

    {/* Content */}
    <div className="p-5 flex-1 flex flex-col">
      <div className="flex justify-between items-start mb-2">
        <div>
          <p className="text-xs font-medium mb-1" style={{ color: colors.status.info }}>
            {template.category}
          </p>
          <h3 className="text-lg font-semibold" style={{ color: colors.text.primary }}>
            {template.title}
          </h3>
        </div>
      </div>

      <p className="text-sm line-clamp-2 mb-6" style={{ color: colors.text.secondary }}>
        {template.desc}
      </p>

      <div
        className="mt-auto pt-4 border-t flex items-center justify-between"
        style={{ borderColor: colors.border.faint }}
      >
        <button
          disabled={template.status === 'Coming Soon'}
          onClick={() => onUseTemplate(template)}
          className={`w-full py-2.5 rounded-lg text-sm font-medium transition-colors ${template.status === 'Coming Soon' ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-90'
            }`}
          style={{
            backgroundColor:
              template.status === 'Coming Soon' ? colors.bg.elevated : colors.text.primary,
            color: template.status === 'Coming Soon' ? colors.text.muted : colors.bg.primary,
          }}
        >
          {template.status === 'Coming Soon' ? 'Not Available' : 'Use Template'}
        </button>
      </div>
    </div>
  </div>
);

/** Modal: ask project title + preferred subdomain before creating project */
const CreateProjectModal = ({
  open,
  initialTitle,
  templateId,
  colors,
  creating,
  onClose,
  onSubmit,
}: {
  open: boolean;
  initialTitle: string;
  templateId?: string | null;
  colors: any;
  creating: boolean;
  onClose: () => void;
  onSubmit: (title: string, subdomain: string) => void;
}) => {
  const [title, setTitle] = useState(initialTitle);
  const [subdomain, setSubdomain] = useState('');

  useEffect(() => {
    if (open) {
      setTitle(initialTitle);
      setSubdomain('');
    }
  }, [open, initialTitle]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const t = title.trim() || 'Untitled Project';
    const sub = subdomain.trim().toLowerCase().replace(/[^a-z0-9-]/g, '') || '';
    onSubmit(t, sub);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-md rounded-2xl border shadow-2xl overflow-hidden"
        style={{ backgroundColor: colors.bg.card, borderColor: colors.border.default }}
      >
        <div className="p-6 border-b" style={{ borderColor: colors.border.faint }}>
          <h3 className="text-xl font-semibold" style={{ color: colors.text.primary }}>Create project</h3>
          <p className="text-sm mt-1" style={{ color: colors.text.secondary }}>
            Set a title and preferred subdomain. The subdomain will be ready when you deploy.
          </p>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: colors.text.primary }}>Project title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="My Store"
              className="w-full px-4 py-2.5 rounded-lg border bg-transparent focus:outline-none focus:ring-2"
              style={{ borderColor: colors.border.default, color: colors.text.primary }}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: colors.text.primary }}>Preferred subdomain</label>
            <input
              type="text"
              value={subdomain}
              onChange={(e) => setSubdomain(e.target.value)}
              placeholder="mystore"
              className="w-full px-4 py-2.5 rounded-lg border bg-transparent focus:outline-none focus:ring-2"
              style={{ borderColor: colors.border.default, color: colors.text.primary }}
            />
            <p className="text-xs mt-1" style={{ color: colors.text.muted }}>
              Only letters, numbers, and hyphens. Example: mystore → mystore.yourdomain.com
            </p>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg text-sm font-medium hover:opacity-80" style={{ color: colors.text.primary }}>
              Cancel
            </button>
            <button type="submit" disabled={creating} className="px-4 py-2 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50">
              {creating ? 'Creating…' : 'Create & open'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

const PreviewModal = ({
  template,
  colors,
  onClose,
  onUseTemplate
}: {
  template: GalleryTemplate;
  colors: any;
  onClose: () => void;
  onUseTemplate: (t: GalleryTemplate) => void;
}) => {
  const fullTemplate = templateService.getTemplate(String(template.id));
  const hasDesign = fullTemplate?.data?.pages?.length && fullTemplate?.data?.nodes && Object.keys(fullTemplate.data.nodes).length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-2xl rounded-2xl border shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        style={{ backgroundColor: colors.bg.card, borderColor: colors.border.default }}
      >
        {/* Header */}
        <div className="p-6 border-b flex justify-between items-center shrink-0" style={{ borderColor: colors.border.faint }}>
          <div>
            <h3 className="text-xl font-semibold" style={{ color: colors.text.primary }}>{template.title}</h3>
            <p className="text-sm" style={{ color: colors.text.secondary }}>{template.category}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors" style={{ color: colors.text.muted }}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {/* Body: thumbnail-style preview (same as project cards) */}
        <div className="flex-1 overflow-y-auto p-6 min-h-0">
          {hasDesign ? (
            <div className="flex justify-center mb-6">
              <div
                className="rounded-xl overflow-hidden border shrink-0"
                style={{
                  width: 288,
                  height: 180,
                  borderColor: colors.border.faint,
                  boxShadow: '0 1px 3px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.04)',
                }}
              >
                <div
                  style={{
                    width: 1440,
                    height: 900,
                    transform: 'scale(0.2)',
                    transformOrigin: 'top left',
                    overflow: 'hidden',
                  }}
                >
                  <WebPreview
                    doc={fullTemplate!.data}
                    pageIndex={0}
                    simulatedWidth={1440}
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className={`w-full h-48 rounded-xl flex items-center justify-center bg-gradient-to-br ${template.imageColor} mb-6`}>
              <span className="text-white/50 font-medium">No preview content</span>
            </div>
          )}
          <p className="text-base leading-relaxed" style={{ color: colors.text.secondary }}>
            {template.desc}
          </p>
        </div>

        {/* Footer */}
        <div className="p-6 border-t flex justify-end gap-3 shrink-0" style={{ borderColor: colors.border.faint, backgroundColor: colors.bg.elevated }}>
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm font-medium transition-colors hover:opacity-80" style={{ color: colors.text.primary }}>
            Cancel
          </button>
          <button onClick={() => onUseTemplate(template)} className="px-4 py-2 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/20">
            Use Template
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default function WebBuilderPage() {
  const { colors, theme } = useTheme();
  const { showAlert, showConfirm } = useAlert();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { selectedProject, setSelectedProjectId, projects: contextProjects, loading: projectsLoadingFromContext } = useProject();
  const [selectedCategory, setSelectedCategory] = useState('Type');
  const [previewTemplate, setPreviewTemplate] = useState<GalleryTemplate | null>(null);
  const [templates, setTemplates] = useState<GalleryTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectsLoading, setProjectsLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createModalTitle, setCreateModalTitle] = useState('');
  const [createModalTemplate, setCreateModalTemplate] = useState<GalleryTemplate | null>(null);
  const [projectMenuId, setProjectMenuId] = useState<string | null>(null);
  const [renamingProject, setRenamingProject] = useState<Project | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [sortOption, setSortOption] = useState<SortOptionId>('relevant');
  const [showSortMenu, setShowSortMenu] = useState(false);

  const visibleProjects = React.useMemo(
    () => (selectedProject ? projects.filter((p) => p.id === selectedProject.id) : projects),
    [projects, selectedProject]
  );

  // Load templates on mount
  useEffect(() => {
    const loadedTemplates = templateService.getTemplates();
    const convertedTemplates = loadedTemplates.map(convertToGalleryTemplate);
    setTemplates(convertedTemplates);
    setLoading(false);
  }, []);

  // Load user projects for this view (fallback to context projects if available)
  useEffect(() => {
    let cancelled = false;
    if (contextProjects.length > 0) {
      setProjects(contextProjects);
      setProjectsLoading(false);
      return;
    }
    listProjects()
      .then((res) => {
        if (!cancelled && res.success && res.projects) setProjects(res.projects);
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setProjectsLoading(false); });
    return () => { cancelled = true; };
  }, [contextProjects]);

  // If coming from the "Create a website" CTA (autoCreate=1),
  // immediately open the create modal so the user can name the website,
  // regardless of whether there are existing projects.
  useEffect(() => {
    const autoCreate = searchParams?.get('autoCreate');
    if (autoCreate === '1' && !createModalOpen && !projectsLoading) {
      openCreateModal({ title: '' });
    }
  }, [searchParams, projectsLoading, createModalOpen]);

  const isAutoCreate = searchParams?.get('autoCreate') === '1';

  const openCreateModal = (options: { title: string; template?: GalleryTemplate }) => {
    setCreateModalTitle(options.title);
    setCreateModalTemplate(options.template ?? null);
    setCreateModalOpen(true);
  };

  // No "Choose a website to manage" modal: auto-select first project or open create modal
  useEffect(() => {
    if (projectsLoading || projectsLoadingFromContext || isAutoCreate) return;
    if (selectedProject) return;
    if (projects.length > 0) {
      setSelectedProjectId(projects[0].id);
    } else {
      openCreateModal({ title: '' });
    }
  }, [projectsLoading, projectsLoadingFromContext, isAutoCreate, selectedProject, projects, setSelectedProjectId]);

  const handleCreateSubmit = async (title: string, subdomain: string) => {
    try {
      setCreating(true);
      const res = await createProject({
        title: title || 'Untitled Project',
        subdomain: subdomain || undefined,
        templateId: createModalTemplate ? String(createModalTemplate.id) : null,
      });
      if (!res.success || !res.project) {
        showAlert('Failed to create project. Please try again.');
        return;
      }
      const user = getStoredUser();
      const clientName = (user?.name || user?.username || 'client').trim() || 'client';
      ensureProjectStorageFolder(clientName, res.project.title || 'website').catch(() => {});
      setCreateModalOpen(false);
      // Treat as a new website/instance only if we don't already have one selected
      // or if we explicitly came from the "Create website" CTA.
      if (!selectedProject || isAutoCreate) {
        setSelectedProjectId(res.project.id);
      }
      if (createModalTemplate) await templateService.loadTemplate(createModalTemplate.id.toString(), res.project.id);
      router.push(`/design?projectId=${res.project.id}`);
    } catch (error) {
      console.error('Error creating project:', error);
      const msg = error instanceof Error ? error.message : '';
      if (msg.includes('Route not found') || msg.includes('404')) {
        showAlert('Project API not found. Make sure the backend is running and restart it (e.g. in backend folder: npm start).');
      } else if (msg.includes('Backend is unreachable') || msg.includes('Failed to fetch')) {
        showAlert('Cannot reach backend API. Start backend server and check if it is running on port 5000 or 5001.');
      } else {
        showAlert('Failed to create project. Please try again.');
      }
    } finally {
      setCreating(false);
    }
  };

  const handleUseTemplate = (template: GalleryTemplate) => {
    setPreviewTemplate(null);
    openCreateModal({ title: template.title || 'Untitled', template });
  };

  const handleStartBlank = () => {
    openCreateModal({ title: '' });
  };

  // Close project menu when clicking outside
  useEffect(() => {
    if (!projectMenuId) return;
    const close = () => setProjectMenuId(null);
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, [projectMenuId]);

  // Close sort menu when clicking outside
  useEffect(() => {
    if (!showSortMenu) return;
    const close = () => setShowSortMenu(false);
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, [showSortMenu]);

  const handleProjectRename = (e: React.MouseEvent, p: Project) => {
    e.stopPropagation();
    setProjectMenuId(null);
    setRenamingProject(p);
    setRenameValue(p.title);
  };

  const handleRenameSubmit = async () => {
    if (!renamingProject || !renameValue.trim()) {
      setRenamingProject(null);
      return;
    }
    try {
      const res = await updateProject(renamingProject.id, { title: renameValue.trim() });
      if (res.success && res.project) {
        setProjects((prev) => prev.map((x) => (x.id === res.project!.id ? { ...x, title: res.project!.title } : x)));
      }
    } catch (_) {}
    setRenamingProject(null);
  };

  const handleProjectDuplicate = async (e: React.MouseEvent, p: Project) => {
    e.stopPropagation();
    setProjectMenuId(null);
    try {
      setCreating(true);
      const res = await createProject({
        title: `${p.title} (copy)`,
        subdomain: p.subdomain ? `${p.subdomain}-copy` : undefined,
      });
      if (res.success && res.project) {
        const user = getStoredUser();
        const clientName = (user?.name || user?.username || 'client').trim() || 'client';
        ensureProjectStorageFolder(clientName, res.project!.title || 'website').catch(() => {});
        setProjects((prev) => [res.project!, ...prev]);
        router.push(`/design?projectId=${res.project!.id}`);
      }
    } catch (_) {
      showAlert('Failed to duplicate project.');
    } finally {
      setCreating(false);
    }
  };

  const handleProjectDelete = async (e: React.MouseEvent, p: Project) => {
    e.stopPropagation();
    setProjectMenuId(null);
    const confirmed = await showConfirm(`Delete website "${p.title}"? Only this website will be removed; your account will not be affected. This cannot be undone.`);
    if (!confirmed) return;
    try {
      const res = await deleteProject(p.id);
      if (res.success) {
        setProjects((prev) => prev.filter((x) => x.id !== p.id));
      } else {
        showAlert('Failed to delete project.');
      }
    } catch (_) {
      showAlert('Failed to delete project.');
    }
  };

  const filteredTemplates = templates
    .filter(
      (t: GalleryTemplate) => selectedCategory === 'Type' || t.category === selectedCategory
    )
    .sort((a, b) => {
      let comparison = 0;
      if (sortOption === 'az') {
        comparison = a.title.localeCompare(b.title);
      } else if (sortOption === 'za') {
        comparison = b.title.localeCompare(a.title);
      } else if (sortOption === 'newest' || sortOption === 'oldest' || sortOption === 'relevant') {
        // For these sorts, maintain original order as we don't have dates
        comparison = 0;
      }
      return comparison;
    });

  // While no project selected and not auto-create, show loading until we auto-select or open create modal
  if (!selectedProject && !isAutoCreate && !createModalOpen) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]" style={{ color: colors.text.secondary }}>
        <p className="text-sm">{projectsLoading || projectsLoadingFromContext ? 'Loading your websites…' : 'Opening Web Builder…'}</p>
      </div>
    );
  }

  return (
    <section className="space-y-8 min-h-screen pb-20 max-w-full overflow-x-hidden">
      {/* Header Section */}
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
        <div className="relative flex flex-col gap-3">
          <div
            className="absolute -inset-x-6 -inset-y-4 rounded-3xl opacity-70 blur-2xl"
            style={{
              background: theme === 'dark'
                ? 'radial-gradient(60% 60% at 20% 20%, rgba(99,102,241,0.2), transparent 60%), radial-gradient(55% 55% at 80% 20%, rgba(14,165,233,0.16), transparent 60%), radial-gradient(50% 50% at 40% 80%, rgba(16,185,129,0.14), transparent 60%)'
                : 'radial-gradient(60% 60% at 20% 20%, rgba(99,102,241,0.14), transparent 60%), radial-gradient(55% 55% at 80% 20%, rgba(14,165,233,0.12), transparent 60%), radial-gradient(50% 50% at 40% 80%, rgba(16,185,129,0.1), transparent 60%)'
            }}
          />
          <div className="relative z-10">
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
              Web Builder
            </motion.h1>
            <motion.p
              className="mt-2 text-sm md:text-base max-w-2xl"
              style={{ color: colors.text.secondary }}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.08 }}
            >
              Choose how you want to start building your website. Start from scratch with a blank canvas or use one of our professionally designed templates.
            </motion.p>
          </div>
        </div>
      </section>

      {/* Start Options */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Blank Design Option */}
        <motion.div
          className="relative rounded-2xl border overflow-hidden p-8 cursor-pointer group"
          style={{
            backgroundColor: colors.bg.card,
            borderColor: colors.border.faint,
          }}
          whileHover={!creating ? { scale: 1.02, y: -4 } : undefined}
          whileTap={!creating ? { scale: 0.98 } : undefined}
          onClick={creating ? undefined : handleStartBlank}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />

          <div className="relative z-10">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4" style={{ backgroundColor: colors.bg.elevated }}>
              <svg className="w-8 h-8" style={{ color: colors.text.primary }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </div>

            <h3 className="text-xl font-semibold mb-2" style={{ color: colors.text.primary }}>
              Start from Scratch
            </h3>
            <p className="text-sm mb-4" style={{ color: colors.text.secondary }}>
              Create your design from a blank canvas with complete creative freedom.
            </p>

            <div className={`inline-flex items-center gap-2 text-sm font-medium ${creating ? 'opacity-60' : ''}`} style={{ color: colors.status.info }}>
              {creating ? 'Creating…' : 'Start Building'}
              {!creating && (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              )}
            </div>
          </div>
        </motion.div>

        {/* Use Template Option */}
        <motion.div
          className="relative rounded-2xl border overflow-hidden p-8 cursor-pointer group"
          style={{
            backgroundColor: colors.bg.card,
            borderColor: colors.border.faint,
          }}
          whileHover={{ scale: 1.02, y: -4 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => document.getElementById('templates-section')?.scrollIntoView({ behavior: 'smooth' })}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />

          <div className="relative z-10">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4" style={{ backgroundColor: colors.bg.elevated }}>
              <svg className="w-8 h-8" style={{ color: colors.text.primary }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>

            <h3 className="text-xl font-semibold mb-2" style={{ color: colors.text.primary }}>
              Use a Template
            </h3>
            <p className="text-sm mb-4" style={{ color: colors.text.secondary }}>
              Jumpstart your project with professionally designed templates.
            </p>

            <div className="inline-flex items-center gap-2 text-sm font-medium" style={{ color: colors.status.info }}>
              Browse Templates
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Your projects */}
      <div id="projects-section" className="space-y-4">
        <h2 className="text-xl font-semibold tracking-tight" style={{ color: colors.text.primary }}>
          Your projects
        </h2>
        <p className="text-sm" style={{ color: colors.text.secondary }}>
          Edit or continue a saved draft.
        </p>
        {projectsLoading ? (
          <div className="rounded-xl border p-6 text-center" style={{ borderColor: colors.border.faint, color: colors.text.muted }}>
            Loading projects…
          </div>
        ) : visibleProjects.length === 0 ? (
          <div className="rounded-xl border p-6 text-center" style={{ borderColor: colors.border.faint, color: colors.text.muted }}>
            No projects yet. Start from scratch or use a template above.
          </div>
        ) : (
          <div className="grid w-full max-w-full min-w-0 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3">
            {visibleProjects.map((p) => (
              <motion.div
                key={p.id}
                className="relative min-w-0 rounded-lg border overflow-hidden cursor-pointer hover:border-opacity-80 transition-colors"
                style={{ backgroundColor: colors.bg.card, borderColor: colors.border.faint }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => router.push(`/design?projectId=${p.id}`)}
              >
                {/* Thumbnail: first-page draft preview */}
                <div className="relative w-full min-h-[100px]" style={{ backgroundColor: colors.bg.elevated, borderBottom: `1px solid ${colors.border.faint}` }}>
                  <DraftPreviewThumbnail
                    projectId={p.id}
                    borderColor={colors.border.faint}
                    bgColor={colors.bg.elevated}
                  />
                </div>
                <div className="p-2">
                {/* 3-dots menu */}
                <div className="absolute top-1.5 right-1.5 z-10" onClick={(e) => e.stopPropagation()}>
                  <button
                    type="button"
                    aria-label="Project options"
                    className="p-1 rounded-md hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
                    style={{ color: colors.text.muted }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setProjectMenuId((id) => (id === p.id ? null : p.id));
                    }}
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <circle cx="12" cy="6" r="1.5" />
                      <circle cx="12" cy="12" r="1.5" />
                      <circle cx="12" cy="18" r="1.5" />
                    </svg>
                  </button>
                  <AnimatePresence>
                    {projectMenuId === p.id && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="absolute right-0 top-full mt-0.5 py-1 min-w-[140px] rounded-md border shadow-xl z-20 text-xs"
                        style={{ backgroundColor: colors.bg.elevated, borderColor: colors.border.default }}
                      >
                        <button
                          type="button"
                          className="w-full px-3 py-1.5 text-left flex items-center gap-1.5 hover:bg-black/5 dark:hover:bg-white/5"
                          style={{ color: colors.text.primary }}
                          onClick={(e) => handleProjectRename(e, p)}
                        >
                          <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" /></svg>
                          Rename
                        </button>
                        <button
                          type="button"
                          className="w-full px-3 py-1.5 text-left flex items-center gap-1.5 hover:bg-black/5 dark:hover:bg-white/5"
                          style={{ color: colors.text.primary }}
                          onClick={(e) => handleProjectDuplicate(e, p)}
                        >
                          <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h2m8 0h2a2 2 0 012 2v2m0 8a2 2 0 01-2 2h-8a2 2 0 01-2-2v-8a2 2 0 012-2h2" /></svg>
                          Duplicate
                        </button>
                        <button
                          type="button"
                          className="w-full px-3 py-1.5 text-left flex items-center gap-1.5 hover:bg-red-500/10"
                          style={{ color: colors.text.primary }}
                          onClick={(e) => handleProjectDelete(e, p)}
                        >
                          <svg className="w-3.5 h-3.5 shrink-0 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                          Delete
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                <h3 className="font-medium truncate pr-6 text-sm" style={{ color: colors.text.primary }}>{p.title}</h3>
                <p className="text-[10px] mt-0.5" style={{ color: colors.text.muted }}>
                  {p.status} · {p.updatedAt ? new Date(p.updatedAt).toLocaleDateString() : '—'}
                </p>
                <p className="text-[10px] mt-1 font-medium" style={{ color: colors.status.info }}>Edit →</p>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Templates Section */}
      <div id="templates-section" className="space-y-8">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight" style={{ color: colors.text.primary }}>
            Choose a Template
          </h2>
          <p className="mt-2 text-base" style={{ color: colors.text.secondary }}>
            Select a template to get started quickly. All templates are fully customizable.
          </p>
        </div>

        {/* Featured Carousel */}
        <div className="w-full overflow-hidden py-2">
          <div className="mb-4">
            <h3 className="text-lg font-semibold" style={{ color: colors.text.primary }}>Featured & Popular</h3>
          </div>
          <DomeGallery
            templates={templates}
            colors={colors}
            onPreview={(template: GalleryTemplate) => setPreviewTemplate(template)}
            onUseTemplate={handleUseTemplate}
          />
        </div>

        {/* Filters and Sorting - Similar to Orders Page */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          <div className="flex flex-wrap gap-3 flex-1 min-w-0">
            {/* Type Filter */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-2 rounded-lg text-sm border focus:outline-none focus:ring-2"
              style={{
                backgroundColor: colors.bg.card,
                borderColor: colors.border.faint,
                color: colors.text.primary,
                focusRingColor: 'rgb(59, 130, 246)'
              }}
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>

            {/* Sort By Dropdown Menu */}
            <div className="relative">
              <button
                onClick={() => setShowSortMenu(!showSortMenu)}
                className="px-4 py-2 rounded-lg text-sm border focus:outline-none focus:ring-2 flex items-center gap-2 transition-colors"
                style={{
                  backgroundColor: colors.bg.card,
                  borderColor: colors.border.faint,
                  color: colors.text.primary,
                  focusRingColor: 'rgb(59, 130, 246)'
                }}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
                Sort by
                <svg className={`w-4 h-4 transition-transform ${showSortMenu ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7-7m0 0L5 14" />
                </svg>
              </button>

              {/* Sort Menu Dropdown */}
              {showSortMenu && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute top-full left-0 mt-2 w-56 rounded-lg border shadow-xl overflow-hidden z-50"
                  style={{ backgroundColor: colors.bg.card, borderColor: colors.border.faint }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="px-4 py-3 border-b font-semibold text-sm" style={{ borderColor: colors.border.faint, color: colors.text.primary }}>
                    Sort by
                  </div>
                  <div className="py-1">
                    {SORT_OPTIONS.map((option) => (
                      <button
                        key={option.id}
                        onClick={() => {
                          setSortOption(option.id);
                          setShowSortMenu(false);
                        }}
                        className="w-full px-4 py-2.5 text-left text-sm flex items-center gap-3 hover:bg-white/5 dark:hover:bg-white/5 transition-colors"
                        style={{ color: colors.text.primary }}
                      >
                        <span className="w-5 inline-flex justify-center">
                          <SortOptionIcon icon={option.icon} />
                        </span>
                        <span className="flex-1">{option.label}</span>
                        {sortOption === option.id && (
                          <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </div>
          </div>

          {/* Right side controls */}
          <div className="flex items-center gap-2 sm:ml-auto shrink-0">
            {/* List view toggle */}
            <div className="flex items-center rounded-lg overflow-hidden border" style={{ borderColor: colors.border.faint }}>
              <button
                onClick={() => {}}
                className="px-3 py-1.5 text-sm hover:bg-white/5 transition-colors"
                style={{ color: colors.text.primary }}
                title="List view"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
              </button>
            </div>

            {/* Add new button */}
            <button
              onClick={handleStartBlank}
              className="px-3 py-1.5 rounded-lg text-sm font-medium transition-colors hover:opacity-80 flex items-center justify-center"
              style={{
                backgroundColor: colors.text.primary,
                color: colors.bg.primary
              }}
              title="Create new project"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>
        </div>

        {/* Grid */}
        <motion.div
          layout
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
        >
          <AnimatePresence mode='popLayout'>
            {filteredTemplates.map((template: GalleryTemplate) => (
              <motion.div
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.2 }}
                key={template.id}
              >
                <TemplateCard
                  template={template}
                  colors={colors}
                  onPreview={setPreviewTemplate}
                  onUseTemplate={handleUseTemplate}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>

        {filteredTemplates.length === 0 && (
          <div className="text-center py-20">
            <p style={{ color: colors.text.muted }}>No templates found for this category.</p>
            <button
              onClick={() => setSelectedCategory('Type')}
              className="mt-4 text-sm hover:underline"
              style={{ color: colors.status.info }}
            >
              Clear filters
            </button>
          </div>
        )}
      </div>

      {/* Rename project modal */}
      <AnimatePresence>
        {renamingProject && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setRenamingProject(null)}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm rounded-2xl border p-6 shadow-xl"
              style={{ backgroundColor: colors.bg.card, borderColor: colors.border.default }}
            >
              <h3 className="text-lg font-semibold mb-3" style={{ color: colors.text.primary }}>Rename project</h3>
              <input
                type="text"
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleRenameSubmit()}
                className="w-full px-4 py-2.5 rounded-lg border bg-transparent mb-4 focus:outline-none focus:ring-2"
                style={{ borderColor: colors.border.default, color: colors.text.primary }}
                placeholder="Project title"
                autoFocus
              />
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setRenamingProject(null)} className="px-4 py-2 rounded-lg text-sm font-medium" style={{ color: colors.text.primary }}>Cancel</button>
                <button type="button" onClick={handleRenameSubmit} className="px-4 py-2 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700">Save</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Create Project Modal (title + subdomain) */}
      <AnimatePresence>
        {createModalOpen && (
          <CreateProjectModal
            open={createModalOpen}
            initialTitle={createModalTitle}
            templateId={createModalTemplate ? String(createModalTemplate.id) : null}
            colors={colors}
            creating={creating}
            onClose={() => setCreateModalOpen(false)}
            onSubmit={handleCreateSubmit}
          />
        )}
      </AnimatePresence>

      {/* Preview Modal */}
      <AnimatePresence>
        {previewTemplate && (
          <PreviewModal
            template={previewTemplate}
            colors={colors}
            onClose={() => setPreviewTemplate(null)}
            onUseTemplate={handleUseTemplate}
          />
        )}
      </AnimatePresence>
    </section>
  );
}
