"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { CreateProjectForm } from "@/app/m_dashboard/components/projects/CreateProjectForm";
import { useTheme } from "@/app/m_dashboard/components/context/theme-context";

/**
 * Dedicated page for creating a new project.
 * Keeps project-creation concerns separate from the project selector list.
 */
export default function NewProjectPage() {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  return (
    <div className="project-selector-page dashboard-landing-light w-full py-1">
      <div className="relative w-full flex flex-col">
        <div className="px-4 lg:px-30 pt-4">
        </div>
        <div className="flex-1 overflow-y-auto min-h-0 px-0 pb-2 border-[#1F1F51] pt-2">
          <div className="w-full px-4 lg:px-30 flex justify-center">
            <CreateProjectForm cancelHref="/m_dashboard/projects" />
          </div>
        </div>
      </div>
    </div>
  );
}
