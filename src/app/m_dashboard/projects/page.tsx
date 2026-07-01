/**
 * ============================================================================
 * Projects Page Wrapper
 * ============================================================================
 *
 * Purpose of this File:
 * This page wraps the ProjectSelectorModal component which displays the
 * project selector interface for browsing and managing projects.
 *
 * What this Component Does:
 * - Renders the ProjectSelectorModal component
 * - Provides a page-level container for project selection
 *
 * ============================================================================
 */

"use client";

import React from 'react';
import { ProjectSelectorModal } from '@/app/design/_components/ProjectSelectorModal';

export default function ProjectsPage() {
  return <ProjectSelectorModal />;
}
