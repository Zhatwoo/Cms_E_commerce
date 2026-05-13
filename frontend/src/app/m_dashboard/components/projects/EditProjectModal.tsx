"use client";

/**
 * ============================================================================
 * Edit Project Modal Component
 * ============================================================================
 *
 * Purpose of this File:
 * ----------------------------------------------------------------------------
 * This file contains a modal component for editing existing project
 * configuration including project name and subdomain.
 *
 * The component provides:
 * - Animated modal transitions
 * - Project name editing
 * - Subdomain configuration
 * - Error message display
 * - Saving state handling
 * - Theme-aware styling
 * - Cancel and save actions
 * - Editorial design aesthetic
 *
 * ----------------------------------------------------------------------------
 * What this Component Does:\n * - Displays an edit modal for project settings\n * - Allows editing project title/name\n * - Allows editing project subdomain\n * - Shows validation errors\n * - Displays saving loading state\n * - Closes modal on cancel\n * - Calls onSave callback when confirmed\n * - Adapts styling based on light/dark theme\n * - Provides editorial, professional appearance\n *
 * Props / Parameters:\n * ----------------------------------------------------------------------------\n *
 * isOpen: boolean\n * - Controls modal visibility and animation state.\n * - REQUIRED\n *
 * theme: DashboardTheme\n * - Current UI theme (light or dark).\n * - Determines modal styling.\n * - REQUIRED\n *
 * projectName: string\n * - Original project name (for display only).\n * - REQUIRED\n *
 * title: string\n * - Current value of project name input.\n * - REQUIRED\n *
 * subdomain: string\n * - Current value of subdomain input.\n * - REQUIRED\n *
 * error?: string\n * - Optional validation error message to display.\n *
 * saving: boolean\n * - Whether form is currently submitting.\n * - Shows loading state on button.\n * - REQUIRED\n *
 * onTitleChange: (value: string) => void\n * - Callback when project name input changes.\n * - REQUIRED\n *
 * onSubdomainChange: (value: string) => void\n * - Callback when subdomain input changes.\n * - REQUIRED\n *
 * onCancel: () => void\n * - Callback when user clicks cancel.\n * - REQUIRED\n *
 * onSave: () => void\n * - Callback when user clicks save.\n * - REQUIRED\n *
 * ============================================================================\n */

import { useThemeOptional } from '../context/theme-context';
import { ModalShell } from '@/components/ui/ModalShell';
import { ModalCard } from '@/components/ui/ModalCard';
import { ModalButton } from '@/components/ui/ModalButton';

type DashboardTheme = 'light' | 'dark';

type EditProjectModalProps = {
  isOpen: boolean;
  theme: DashboardTheme;
  projectName: string;
  title: string;
  subdomain: string;
  error?: string;
  saving: boolean;
  onTitleChange: (value: string) => void;
  onSubdomainChange: (value: string) => void;
  onCancel: () => void;
  onSave: () => void;
};

export function EditProjectModal({
  isOpen,
  theme,
  projectName,
  title,
  subdomain,
  error,
  saving,
  onTitleChange,
  onSubdomainChange,
  onCancel,
  onSave,
}: EditProjectModalProps) {
  const isDark = theme === 'dark';
  const themeOptional = useThemeOptional();
  const isLight = (themeOptional?.theme ?? 'dark') === 'light';

  const inputStyles = {
    backgroundColor: isLight ? 'rgba(103,2,191,0.05)' : 'rgba(255,255,255,0.05)',
    borderColor: isLight ? 'rgba(103,2,191,0.15)' : 'rgba(255,255,255,0.1)',
    color: isLight ? '#120533' : '#FFFFFF',
  };

  const labelColor = isLight ? 'rgba(18,5,51,0.55)' : 'rgba(255,255,255,0.55)';

  return (
    <ModalShell
      isOpen={isOpen}
      onClose={onCancel}
      disabled={saving}
      usePortal
    >
      <ModalCard
        title="Edit project"
        subtitle="Update the project name and subdomain"
        footer={
          <div className="flex gap-2 w-full justify-end">
            <ModalButton
              label="Cancel"
              onClick={onCancel}
              variant="secondary"
              disabled={saving}
            />
            <ModalButton
              label={saving ? 'Saving…' : 'Save Changes'}
              onClick={onSave}
              variant="primary"
              disabled={saving}
              primaryColor="#8B5CF6"
            />
          </div>
        }
      >
        <div className="space-y-5">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.15em] mb-2" style={{ color: labelColor }}>
              Project Name
            </p>
            <input
              type="text"
              value={title}
              onChange={(e) => onTitleChange(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border text-sm font-medium transition-all outline-none"
              style={inputStyles}
              placeholder="Untitled Project"
              autoFocus
            />
            <p className="text-xs mt-1.5" style={{ color: labelColor }}>
              Updating: <span className="font-semibold">{projectName}</span>
            </p>
          </div>

          <div>
            <p className="text-xs font-black uppercase tracking-[0.15em] mb-2" style={{ color: labelColor }}>
              Subdomain
            </p>
            <input
              type="text"
              value={subdomain}
              onChange={(e) => onSubdomainChange(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border text-sm font-medium transition-all outline-none"
              style={inputStyles}
              placeholder="my-store"
            />
            <p className="text-xs mt-1.5" style={{ color: labelColor }}>
              Letters, numbers, and hyphens only.
            </p>
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-semibold">
              {error}
            </div>
          )}
        </div>
      </ModalCard>
    </ModalShell>
  );
}