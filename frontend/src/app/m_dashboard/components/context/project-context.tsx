'use client';

/**
 * ============================================================================
 * Project Context
 * ============================================================================
 *
 * Purpose of this File:
 * ----------------------------------------------------------------------------
 * This file provides a global project context for managing the current user's
 * projects and project selection state across the entire dashboard application.
 *
 * The context provides:
 * - Project list management and fetching
 * - Current project selection tracking
 * - Project persistence in local storage
 * - Hydration-aware state management
 * - Loading state for async operations
 *
 * ----------------------------------------------------------------------------
 * What this Context Does:
 * ----------------------------------------------------------------------------
 * - Fetches and manages list of user's projects
 * - Tracks currently selected project ID and details
 * - Persists project selection in local storage per user
 * - Handles hydration of persisted project selection
 * - Provides refresh function to update project list
 * - Allows switching between projects
 * - Updates backend when project selection changes
 *
 * ----------------------------------------------------------------------------
 * Props / Parameters (ProjectProvider):
 * ----------------------------------------------------------------------------
 *
 * children: React.ReactNode
 * - React components to be wrapped by the project provider.
 * - REQUIRED
 *
 * Context Values:
 *
 * projects: Project[]
 * - Array of all projects for the current user.
 * - Empty array if no projects exist.
 *
 * loading: boolean
 * - Whether projects are being fetched.
 * - true during initial load.
 *
 * selectedProjectId: string | null
 * - ID of the currently selected project.
 * - null if no project is selected.
 *
 * selectedProject: Project | null
 * - Full project object of the selected project.
 * - null if no project is selected.
 *
 * setSelectedProjectId: (id: string | null) => void
 * - Change the currently selected project.
 * - Updates state and persists to local storage.
 *
 * refreshProjects: (silent?: boolean) => Promise<void>\n * - Refetch projects from API.\n * - Optional silent parameter to skip loading state.
 *
 * ----------------------------------------------------------------------------
 * Type Definitions:
 * ----------------------------------------------------------------------------
 *
 * Project
 * - Project object type from API.
 *
 * ProjectContextType
 * - Context type with projects, selection, and callbacks.
 *
 * ProviderProps
 * - Props for ProjectProvider component.
 *
 * ----------------------------------------------------------------------------
 * How to Use:
 * ----------------------------------------------------------------------------
 *
 * 1. Wrap with ProjectProvider:\n *
 * <ProjectProvider>\n *   <YourApp />\n * </ProjectProvider>\n *
 * 2. Use in components:\n *
 * const { projects, selectedProject, setSelectedProjectId } = useProject();\n *
 * return (\n *   <select onChange={(e) => setSelectedProjectId(e.target.value)}>\n *     {projects.map(p => (\n *       <option key={p.id} value={p.id}>{p.title}</option>\n *     ))}\n *   </select>\n * );\n *
 * ============================================================================
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { listProjects, setActiveProjectId, type Project } from '@/lib/api';
import { useAuth } from './auth-context';

type ProjectContextType = {
  projects: Project[];
  loading: boolean;
  selectedProjectId: string | null;
  selectedProject: Project | null;
  setSelectedProjectId: (id: string | null) => void;
  refreshProjects: (silent?: boolean) => Promise<void>;
};

const ProjectContext = createContext<ProjectContextType>({
  projects: [],
  loading: true,
  selectedProjectId: null,
  selectedProject: null,

  setSelectedProjectId: () => {},

  refreshProjects: async () => {},
});

type ProviderProps = {
  children: React.ReactNode;
};

export function ProjectProvider({ children }: ProviderProps) {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProjectId, setSelectedProjectIdState] = useState<string | null>(null);
  const [selectionHydrated, setSelectionHydrated] = useState(false);
  const storageKey = user?.id ? `md_selected_instance_${user.id}` : null;

  useEffect(() => {
    if (!storageKey) {
      setSelectedProjectIdState(null);
      setSelectionHydrated(true);
      return;
    }
    setSelectionHydrated(false);
    try {
      const saved = window.sessionStorage.getItem(storageKey);
      setSelectedProjectIdState(saved || null);
      const cached = window.sessionStorage.getItem(storageKey + '_projects');
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed)) {
            setProjects(parsed);
            setLoading(false);
          }
        } catch (_) {}
      }
    } catch {
      setSelectedProjectIdState(null);
    } finally {
      setSelectionHydrated(true);
    }
  }, [storageKey]);

  const fetchProjects = useCallback(async (includeShared = false, silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await listProjects();
      if (res?.success && Array.isArray(res.projects)) {
        setProjects(res.projects);
        if (storageKey) {
          try {
            window.sessionStorage.setItem(storageKey + '_projects', JSON.stringify(res.projects));
          } catch (_) {}
        }

        const nonTemplateProjects = res.projects.filter(
          (project) => String(project.status || '').trim().toLowerCase() !== 'template'
        );

        // Keep last selected project when still available, otherwise prefer a normal design.
        setSelectedProjectIdState((prev) => {
          if (res.projects.length === 0) return null;
          if (prev && res.projects.some((p) => p.id === prev)) {
            const prevProject = res.projects.find((p) => p.id === prev);
            if (prevProject && String(prevProject.status || '').trim().toLowerCase() !== 'template') {
              return prev;
            }
          }
          return nonTemplateProjects[0]?.id || res.projects[0].id;
        });
      } else {
        setProjects([]);
        setSelectedProjectIdState(null);
        if (storageKey) {
          try {
            window.sessionStorage.removeItem(storageKey);
          } catch {}
        }
      }
    } catch {
      setProjects([]);
      setSelectedProjectIdState(null);
      if (storageKey) {
        try {
          window.sessionStorage.removeItem(storageKey);
        } catch {}
      }
    } finally {
      if (!silent) setLoading(false);
    }
  }, [storageKey]);

  useEffect(() => {
    if (!storageKey) {
      setProjects([]);
      setLoading(false);
      return;
    }
    const hasCache = typeof window !== 'undefined' && storageKey && window.sessionStorage.getItem(storageKey + '_projects');
    void fetchProjects(false, !!hasCache);
  }, [fetchProjects, storageKey]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleTemplateRegistryChange = () => {
      void fetchProjects(true, true);
    };

    window.addEventListener('template-project-registry:changed', handleTemplateRegistryChange);
    return () => window.removeEventListener('template-project-registry:changed', handleTemplateRegistryChange);
  }, [fetchProjects]);

  useEffect(() => {
    setActiveProjectId(selectedProjectId);
  }, [selectedProjectId]);

  const selectedProject = useMemo(
    () => projects.find((p) => p.id === selectedProjectId) ?? null,
    [projects, selectedProjectId]
  );

  const handleSetSelectedProjectId = (id: string | null) => {
    setSelectedProjectIdState(id);
    if (storageKey) {
      try {
        if (id) window.sessionStorage.setItem(storageKey, id);
        else window.sessionStorage.removeItem(storageKey);
      } catch {}
    }
  };

  const refreshProjects = useCallback(async (silent = true) => {
    await fetchProjects(true, silent);
  }, [fetchProjects]);

  const value: ProjectContextType = {
    projects,
    loading,
    selectedProjectId,
    selectedProject,
    setSelectedProjectId: handleSetSelectedProjectId,
    refreshProjects,
  };

  return <ProjectContext.Provider value={value}>{children}</ProjectContext.Provider>;
}

export function useProject() {
  return useContext(ProjectContext);
}

