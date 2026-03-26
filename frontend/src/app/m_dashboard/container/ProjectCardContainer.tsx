import type { Project } from '@/lib/api';
import type { ReactNode } from 'react';
import { DraftPreviewThumbnail } from '../components/projects/DraftPreviewThumbnail';
import { PopMenuButton, type PopMenuOption } from '../components/buttons/PopMenuButton';

type DashboardTheme = 'light' | 'dark';

type ProjectCardContainerProps = {
  /** Theme mode used to render dark/light variants. */
  theme: DashboardTheme;
  /** Project represented by this card. */
  project: Project;
  /** Whether the card pop menu is open. */
  isMenuOpen: boolean;
  /** Opens design editor for the provided project id. */
  onOpenDesign: (projectId?: string) => void;
  /** Toggles pop menu state for a given project id. */
  onToggleMenu: (projectId: string) => void;
  /** Triggers rename flow. */
  onEditProject: (project: Project) => void;
  /** Triggers delete flow. */
  onDeleteProject: (project: Project) => void;
  /** Optional override for menu options and action logic. */
  menuOptionsBuilder?: (project: Project) => PopMenuOption[];
  /** Optional custom trigger icon for the pop menu button. */
  menuTriggerIcon?: ReactNode;
  /** Builds human-readable edited text for project metadata. */
  formatEditedDate: (dateStr?: string) => string;
};

/**
 * Renders one project card in the "Other Projects" grid.
 */
export function ProjectCardContainer({
  theme,
  project,
  isMenuOpen,
  onOpenDesign,
  onToggleMenu,
  onEditProject,
  onDeleteProject,
  menuOptionsBuilder,
  menuTriggerIcon,
  formatEditedDate,
}: ProjectCardContainerProps) {
  const defaultMenuOptions: PopMenuOption[] = [
    {
      key: 'edit',
      label: 'Edit',
      onSelect: () => onEditProject(project),
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 3.487a1.875 1.875 0 1 1 2.652 2.652L8.25 17.403 4.5 18.75l1.347-3.75L16.862 3.487Z" />
        </svg>
      ),
    },
    {
      key: 'delete',
      label: 'Delete',
      onSelect: () => onDeleteProject(project),
      className: 'text-red-500',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      ),
    },
  ];

  const menuOptions = menuOptionsBuilder ? menuOptionsBuilder(project) : defaultMenuOptions;

  return (
    <div
      className={`
        group relative rounded-4xl overflow-hidden transition-all duration-500 cursor-pointer
        ${theme === 'dark'
          ? 'bg-[#15093E] border border-[#272261] shadow-[0_20px_40px_rgba(0,0,0,0.3)]'
          : 'admin-dashboard-panel-soft border-0'
        }
        hover:-translate-y-2
      `}
    >
      {theme === 'light' && (
        <div className="absolute inset-0 z-10 pointer-events-none bg-[radial-gradient(ellipse_at_top,var(--tw-gradient-stops))] from-[#8B5CF6]/10 via-transparent to-transparent opacity-100" />
      )}

      <div
        className={`
          absolute inset-0 z-30 rounded-4xl pointer-events-none transition-all duration-500
          border-2 opacity-0 group-hover:opacity-100
          ${theme === 'dark' ? 'border-[#FFCE00]/50' : 'border-[#8B5CF6]/60'}
        `}
      />

      {!project.isShared && (
        <PopMenuButton
          theme={theme}
          isOpen={isMenuOpen}
          triggerIcon={menuTriggerIcon}
          triggerAriaLabel={`Open menu for ${project.title || 'Untitled Project'}`}
          onToggle={() => onToggleMenu(project.id)}
          options={menuOptions}
        />
      )}

      <div role="button" onClick={() => onOpenDesign(project.id)}>
        <div className={`relative w-full aspect-video overflow-hidden ${theme === 'dark' ? 'bg-[#0A0A26]' : 'bg-white'}`}>
          <DraftPreviewThumbnail
            projectId={project.id}
            borderColor="transparent"
            bgColor="transparent"
            className="w-full h-full aspect-16/10! rounded-none!"
          />
          <div className={`absolute inset-0 opacity-10 ${theme === 'light' ? 'bg-[#8B5CF6]' : 'bg-transparent'}`} />
        </div>

        <div className="p-6">
          <h3 className={`text-lg font-black tracking-tight truncate transition-colors duration-300 ${
            theme === 'dark' ? 'text-white group-hover:text-[#FFCE00]' : 'text-[#120533] group-hover:text-[#8B5CF6]'
          }`}>
            {project.title || 'Untitled Project'}
          </h3>
          <p className={`text-[11px] font-bold tracking-widest mt-1 ${theme === 'dark' ? 'text-[#6F70A8]' : 'text-[#8B5CF6]/70'}`}>
            {project.isShared ? `by ${project.ownerName}` : formatEditedDate(project.updatedAt)}
          </p>
        </div>
      </div>
    </div>
  );
}
