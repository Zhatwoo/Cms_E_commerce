"use client";

import React, { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { EditorShell } from "./_components/editorShell";
import { DesignProjectProvider } from "./_context/DesignProjectContext";

const LoadingPlaceholder = () => (
  <div className="min-h-screen flex items-center justify-center bg-[#0a0d14] text-white">
    <p>Loading...</p>
  </div>
);

function DesignContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const projectId = searchParams.get("projectId");
  const pageId = searchParams.get("pageId");

  useEffect(() => {
    if (!projectId) {
      router.replace('/m_dashboard/projects');
    }
  }, [projectId, router]);

  if (!projectId) {
    return <LoadingPlaceholder />;
  }

  return (
    <DesignProjectProvider projectId={projectId} pageId={pageId}>
      <EditorShell projectId={projectId} pageId={pageId} />
    </DesignProjectProvider>
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
