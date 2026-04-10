"use client";

import React, { createContext, useContext, useEffect, useLayoutEffect, useState } from "react";
import { getProject, getStoredUser, setActiveProjectId, updateProject } from "@/lib/api";
import { ensureFirebaseAuthForStorage } from "@/lib/firebase";

type DesignProjectContextType = {
  projectId: string | null;
  /** Current page ID being edited */
  pageId: string | null;
  /** Store type / industry used by catalog-driven design components */
  projectIndustry: string | null;
  /** Client name for Storage path: {clientName}/... */
  clientName: string | null;
  /** Project name for Storage path: {clientName}/{websiteName}/... */
  websiteName: string | null;
  /** Project subdomain used by storefront/product APIs */
  projectSubdomain: string | null;
  /** User permission for this project */
  permission: "editor" | "viewer" | "owner";
  /** Whether project data is still loading */
  loading: boolean;
  /** Update project title */
  updateProjectTitle: (newTitle: string) => Promise<boolean>;
};

const DesignProjectContext = createContext<DesignProjectContextType>({
  projectId: null,
  pageId: null,
  projectIndustry: null,
  clientName: null,
  websiteName: null,
  projectSubdomain: null,
  permission: "viewer",
  loading: true,
  updateProjectTitle: async () => false,
});

export function DesignProjectProvider({
  projectId,
  pageId,
  children,
}: {
  projectId: string;
  pageId?: string | null;
  children: React.ReactNode;
}) {
  const [clientName, setClientName] = useState<string | null>(null);
  const [websiteName, setWebsiteName] = useState<string | null>(null);
  const [projectSubdomain, setProjectSubdomain] = useState<string | null>(null);
  const [projectIndustry, setProjectIndustry] = useState<string | null>(null);
  const [permission, setPermission] = useState<"editor" | "viewer" | "owner">("viewer");
  const [loading, setLoading] = useState(true);

  // Ensure `/api/*` calls in the builder include the correct project scope via `x-project-id`
  // so draft projects (no subdomain yet) can still load project-scoped products/inventory.
  useLayoutEffect(() => {
    setActiveProjectId(projectId);
    return () => setActiveProjectId(null);
  }, [projectId]);

  const updateProjectTitle = async (newTitle: string): Promise<boolean> => {
    if (!projectId) return false;
    try {
      const res = await updateProject(projectId, { title: newTitle });
      if (res.success) {
        setWebsiteName(res.project.title);
        return true;
      }
      return false;
    } catch (error) {
      console.error("Failed to update project title:", error);
      return false;
    }
  };

  // Sync Firebase Auth when user has backend session (so Storage uploads work)
  useEffect(() => {
    if (getStoredUser()) ensureFirebaseAuthForStorage();
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    const user = getStoredUser();
    const name = (user?.name || user?.username || "client")?.trim() || "client";
    setClientName(name);

    getProject(projectId)
      .then((res) => {
        if (cancelled) return;
        const title = (res.project?.title || "website")?.trim() || "website";
        setWebsiteName(title);
        setProjectSubdomain((res.project?.subdomain || "")?.trim() || null);
        setProjectIndustry((res.project?.industry || "")?.trim() || null);
        if (res.project?.collaboratorPermission) {
          setPermission(res.project.collaboratorPermission as any);
        } else {
          setPermission("owner");
        }
      })
      .catch(() => {
        if (!cancelled) {
          setWebsiteName("website");
          setProjectSubdomain(null);
          setProjectIndustry(null);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [projectId]);

  return (
    <DesignProjectContext.Provider value={{ projectId, pageId: pageId || null, projectIndustry, clientName, websiteName, projectSubdomain, permission, loading, updateProjectTitle }}>
      {children}
    </DesignProjectContext.Provider>
  );
}

export function useDesignProject(): DesignProjectContextType {
  return useContext(DesignProjectContext);
}
