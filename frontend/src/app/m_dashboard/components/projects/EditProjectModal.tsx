"use client";

import { useThemeOptional } from '../context/theme-context';
import { ModalShell } from '@/components/ui/ModalShell';
import { ModalCard } from '@/components/ui/ModalCard';
import { ModalButton } from '@/components/ui/ModalButton';

/// A high-end, editorial modal for editing project configuration.
/// 
/// Designed with a focus on typography and clean spacing, this component 
/// adapts to Light and Dark modes while maintaining a professional SaaS aesthetic.
///
/// Parameters:
/// - [isOpen]: Controls the animation lifecycle of the modal.
/// - [theme]: Current UI mode ('light' | 'dark').
/// - [projectName]: The original name of the project being edited.
/// - [title]: The current value of the project name input.
/// - [subdomain]: The current value of the subdomain input.
/// - [error]: Optional validation message to display.
/// - [saving]: Loading state for the primary action button.
/// - [onTitleChange]: Callback for the name input.
/// - [onSubdomainChange]: Callback for the subdomain input.
/// - [onCancel]: Dismisses the modal.
/// - [onSave]: Executes the update logic.

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