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
  const storageKey = user?.id ? `md_selected_instance_${user.id}` : null;

  useEffect(() => {
    if (!storageKey) {
      setSelectedProjectIdState(null);
      return;
    }
    try {
      const saved = window.sessionStorage.getItem(storageKey);
      setSelectedProjectIdState(saved || null);
    } catch {
      setSelectedProjectIdState(null);
    }
  }, [storageKey]);

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    try {
      const res = await listProjects();
      if (res?.success && Array.isArray(res.projects)) {
        setProjects(res.projects);

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
      setLoading(false);
    }
  }, [storageKey]);

  useEffect(() => {
    if (!storageKey) {
      setProjects([]);
      setLoading(false);
      return;
    }
    void fetchProjects();
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

  const value: ProjectContextType = {
    projects,
    loading,
    selectedProjectId,
    selectedProject,
    setSelectedProjectId: handleSetSelectedProjectId,
    refreshProjects: fetchProjects,
  };

  return <ProjectContext.Provider value={value}>{children}</ProjectContext.Provider>;
}

export function useProject() {
  return useContext(ProjectContext);
}

