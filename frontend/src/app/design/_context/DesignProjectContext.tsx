"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { getProject, getStoredUser } from "@/lib/api";
import { ensureFirebaseAuthForStorage } from "@/lib/firebase";

type DesignProjectContextType = {
  projectId: string | null;
  /** Current page ID being edited */
  pageId: string | null;
  /** Client name for Storage path: {clientName}/... */
  clientName: string | null;
  /** Project name for Storage path: {clientName}/{websiteName}/... */
  websiteName: string | null;
  /** User permission for this project */
  permission: "editor" | "viewer" | "owner";
  /** Whether project data is still loading */
  loading: boolean;
};

const DesignProjectContext = createContext<DesignProjectContextType>({
  projectId: null,
  pageId: null,
  clientName: null,
  websiteName: null,
  permission: "viewer",
  loading: true,
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
  const [permission, setPermission] = useState<"editor" | "viewer" | "owner">("viewer");
  const [loading, setLoading] = useState(true);

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
        if (res.project?.collaboratorPermission) {
          setPermission(res.project.collaboratorPermission as any);
        } else {
          setPermission("owner");
        }
      })
      .catch(() => {
        if (!cancelled) setWebsiteName("website");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [projectId]);

  return (
    <DesignProjectContext.Provider value={{ projectId, pageId: pageId || null, clientName, websiteName, permission, loading }}>
      {children}
    </DesignProjectContext.Provider>
  );
}

export function useDesignProject(): DesignProjectContextType {
  return useContext(DesignProjectContext);
}
