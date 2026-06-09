"use client";

import React, { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { EditorShell } from "./_components/editorShell";
import { DesignProjectProvider, useDesignProject } from "./_context/DesignProjectContext";
import { CollaborationProvider } from "./_context/CollaborationContext";
import { Spinner, LoadingText } from "@/components/loading/LoadingBits";

const LoadingPlaceholder = () => (
  <div className="min-h-screen flex items-center justify-center bg-[#0a0d14] text-white">
    <div className="flex flex-col items-center gap-3">
      <Spinner sizePx={36} borderPx={3} className="animate-spin rounded-full border-white/25 border-t-white" />
      <LoadingText text="Loading..." className="text-sm text-white/70" />
    </div>
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
  const { permission, loading } = useDesignProject();

  if (loading) {
    return <LoadingPlaceholder />;
  }

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
          <div className="flex flex-col items-center gap-3">
            <Spinner sizePx={36} borderPx={3} className="animate-spin rounded-full border-white/25 border-t-white" />
            <LoadingText text="Loading..." className="text-sm text-white/70" />
          </div>
        </div>
      }
    >
      <DesignContent />
    </Suspense>
  );
}
