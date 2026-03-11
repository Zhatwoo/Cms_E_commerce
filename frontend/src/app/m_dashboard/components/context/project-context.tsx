'use client';

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
  refreshProjects: () => Promise<void>;
};

const ProjectContext = createContext<ProjectContextType>({
  projects: [],
  loading: true,
  selectedProjectId: null,
  selectedProject: null,
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  setSelectedProjectId: () => {},
  // eslint-disable-next-line @typescript-eslint/no-empty-function
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
      const res = await listProjects({ includeShared });
      if (res?.success && Array.isArray(res.projects)) {
        setProjects(res.projects);
        if (storageKey) {
          try {
            window.sessionStorage.setItem(storageKey + '_projects', JSON.stringify(res.projects));
          } catch (_) {}
        }

        // Keep last selected project when still available, otherwise fall back once.
        setSelectedProjectIdState((prev) => {
          if (res.projects.length === 0) return null;
          if (prev && res.projects.some((p) => p.id === prev)) return prev;
          return res.projects[0].id;
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

  const refreshProjects = useCallback(() => fetchProjects(true), [fetchProjects]);

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

