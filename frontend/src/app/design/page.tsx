"use client";

import React, { Suspense, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { EditorShell } from "./_components/editorShell";

function DesignContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const projectId = searchParams.get("projectId");

  useEffect(() => {
    if (!projectId) router.replace("/m_dashboard/web-builder");
  }, [projectId, router]);

  if (!projectId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0d14] text-white">
        <p>Redirecting to Web Builder...</p>
      </div>
    );
  }

  return <EditorShell projectId={projectId} />;
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
