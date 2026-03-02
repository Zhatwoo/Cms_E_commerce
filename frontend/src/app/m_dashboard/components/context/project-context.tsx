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
      const saved = window.localStorage.getItem(storageKey);
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

        // Ensure we always have a valid selected project when projects exist
        if (res.projects.length === 0) {
          setSelectedProjectIdState(null);
        } else if (
          !selectedProjectId ||
          !res.projects.find((p) => p.id === selectedProjectId)
        ) {
          setSelectedProjectIdState(res.projects[0].id);
        }
      } else {
        setProjects([]);
        setSelectedProjectIdState(null);
        if (storageKey) {
          try {
            window.localStorage.removeItem(storageKey);
          } catch {}
        }
      }
    } catch {
      setProjects([]);
      setSelectedProjectIdState(null);
      if (storageKey) {
        try {
          window.localStorage.removeItem(storageKey);
        } catch {}
      }
    } finally {
      setLoading(false);
    }
  }, [selectedProjectId, storageKey]);

  useEffect(() => {
    void fetchProjects();
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
        if (id) window.localStorage.setItem(storageKey, id);
        else window.localStorage.removeItem(storageKey);
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

