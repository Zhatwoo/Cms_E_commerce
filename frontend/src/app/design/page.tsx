"use client";

import React, { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { EditorShell } from "./_components/editorShell";
import { DesignProjectProvider } from "./_context/DesignProjectContext";

const LoadingPlaceholder = () => (
  <div className="min-h-screen flex items-center justify-center bg-[#0a0d14] text-white">
    <p>Loading...</p>
  </div>
);

function DesignContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const projectId = searchParams.get("projectId");
  const pageId = searchParams.get("pageId");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    if (!projectId) router.replace("/m_dashboard/web-builder");
  }, [mounted, projectId, router]);

  if (!mounted) {
    return <LoadingPlaceholder />;
  }

  if (!projectId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0d14] text-white">
        <p>Redirecting to Web Builder...</p>
      </div>
    );
  }

  return (
    <DesignProjectProvider projectId={projectId} pageId={pageId}>
      <EditorShell projectId={projectId} pageId={pageId} />
    </DesignProjectProvider>
  );
}

/** Design Page — requires ?projectId= to edit a project. */
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
