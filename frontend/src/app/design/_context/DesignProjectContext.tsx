"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { getProject, getStoredUser } from "@/lib/api";
import { ensureFirebaseAuthForStorage } from "@/lib/firebase";

type DesignProjectContextType = {
  projectId: string | null;
  /** Client name for Storage path: {clientName}/... */
  clientName: string | null;
  /** Project name for Storage path: {clientName}/{websiteName}/... */
  websiteName: string | null;
};

const DesignProjectContext = createContext<DesignProjectContextType>({
  projectId: null,
  clientName: null,
  websiteName: null,
});

export function DesignProjectProvider({
  projectId,
  children,
}: {
  projectId: string;
  children: React.ReactNode;
}) {
  const [clientName, setClientName] = useState<string | null>(null);
  const [websiteName, setWebsiteName] = useState<string | null>(null);

  // Sync Firebase Auth when user has backend session (so Storage uploads work)
  useEffect(() => {
    if (getStoredUser()) ensureFirebaseAuthForStorage();
  }, []);

  useEffect(() => {
    let cancelled = false;

    const user = getStoredUser();
    const name = (user?.name || user?.username || "client")?.trim() || "client";
    setClientName(name);

    getProject(projectId).then((res) => {
      if (cancelled) return;
      const title = (res.project?.title || "website")?.trim() || "website";
      setWebsiteName(title);
    }).catch(() => {
      if (!cancelled) setWebsiteName("website");
    });

    return () => { cancelled = true; };
  }, [projectId]);

  return (
    <DesignProjectContext.Provider value={{ projectId, clientName, websiteName }}>
      {children}
    </DesignProjectContext.Provider>
  );
}

export function useDesignProject(): DesignProjectContextType {
  return useContext(DesignProjectContext);
}
