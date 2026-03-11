"use client";

import React, { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { EditorShell } from "./_components/editorShell";
import { DesignProjectProvider, useDesignProject } from "./_context/DesignProjectContext";
import { CollaborationProvider } from "./_context/CollaborationContext";

const LoadingPlaceholder = () => (
  <div className="min-h-screen flex items-center justify-center bg-[#0a0d14] text-white">
    <p>Loading...</p>
  </div>
);

function DesignContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const projectIdParam = searchParams.get("projectId");
  const inviteParam = searchParams.get("invite");
  const projectId = projectIdParam || inviteParam;
  const pageId = searchParams.get("pageId");
  const fromInvite = !projectIdParam && !!inviteParam;

  useEffect(() => {
    if (!projectId) {
      router.replace('/m_dashboard/projects');
      return;
    }
    if (fromInvite) {
      router.replace(`/design?projectId=${projectId}${pageId ? `&pageId=${pageId}` : ''}`);
    }
  }, [projectId, pageId, router, fromInvite]);

  if (!projectId) {
    return <LoadingPlaceholder />;
  }

  return (
    <DesignProjectProvider projectId={projectId} pageId={pageId}>
      <DesignContentInner projectId={projectId} pageId={pageId} />
    </DesignProjectProvider>
  );
}

function DesignContentInner({ projectId, pageId }: { projectId: string, pageId: string | null }) {
  const { permission } = useDesignProject();

  return (
    <CollaborationProvider projectId={projectId} permission={permission === "owner" ? "editor" : permission}>
      <EditorShell projectId={projectId} pageId={pageId} permission={permission} />
    </CollaborationProvider>
  );
}

/** Design Page — requires ?projectId= and redirects to /m_dashboard/projects when missing. */
export default function DesignPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#0a0d14] text-white">
          <p>Loading...</p>
        </div>
      }
    >
      <DesignContent />
    </Suspense>
  );
}
