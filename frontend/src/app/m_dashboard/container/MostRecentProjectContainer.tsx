import type { Dispatch, ReactNode, SetStateAction } from 'react';
import type { Project } from '@/lib/api';

type DashboardTheme = 'light' | 'dark';

type MostRecentProjectContainerProps = {
  /** Theme mode used to render dark/light variants. */
  theme: DashboardTheme;
  /** Currently featured project in the hero view. */
  featuredProject: Project | null;
  /** Number of active carousel indicators. */
  indicatorCount: number;
  /** Index of active carousel slide indicator. */
  displayProjectIndex: number;
  /** Carousel project items including loop item. */
  carouselProjects: Project[];
  /** Whether carousel transition animation is enabled. */
  isSliderTransitionEnabled: boolean;
  /** Converts project metadata to workspace label format. */
  toWorkspaceLabel: (project?: Project | null) => string;
  /** Returns current translate class for the carousel track. */
  getTrackTranslateClass: () => string;
  /** Handles transition completion of carousel track. */
  onTrackTransitionEnd: () => void;
  /** Opens design editor for existing project or blank page. */
  onOpenDesign: (projectId?: string) => void;
  /** Updates active carousel index. */
  setActiveProjectIndex: Dispatch<SetStateAction<number>>;
  /** Toggles carousel transition enabled state. */
  setIsSliderTransitionEnabled: Dispatch<SetStateAction<boolean>>;
  /** Renders preview node for a project item. */
  renderProjectPreview: (project: Project | null) => ReactNode;
};

/** Renders the "Most Recent Project" hero container in the designs tab. */
export function MostRecentProjectContainer({
  theme,
  featuredProject,
  indicatorCount,
  displayProjectIndex,
  carouselProjects,
  isSliderTransitionEnabled,
  toWorkspaceLabel,
  getTrackTranslateClass,
  onTrackTransitionEnd,
  onOpenDesign,
  setActiveProjectIndex,
  setIsSliderTransitionEnabled,
  renderProjectPreview,
}: MostRecentProjectContainerProps) {
  return (
    <div
      className={`
        relative rounded-4xl border p-5 text-left overflow-hidden transition-all duration-500
        ${theme === 'dark'
          ? 'bg-linear-to-br from-[#0D0C37] via-[#110F4D] to-[#0D0C37] border-[#6E6ABF]/40 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)]'
          : 'admin-dashboard-panel border-0'
        }
      `}
    >
        <div
          className={`
            absolute inset-0 pointer-events-none opacity-40 blur-[100px] transition-colors duration-700
            ${theme === 'dark'
              ? 'bg-[radial-gradient(circle_at_top_right,#FFCE0010,transparent),radial-gradient(circle_at_bottom_left,#8B5CF620,transparent)]'
              : 'bg-[radial-gradient(circle_at_top_right,#8B5CF615,transparent)]'
            }
          `}
        />

        <div className="relative flex items-center justify-between px-1 mb-4 min-h-6 z-10">
          <div className="flex items-center gap-2.5">
            {Array.from({ length: indicatorCount }).map((_, idx) => {
              const isActive = idx === displayProjectIndex;
              return (
                <button
                  key={`indicator-${idx}`}
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsSliderTransitionEnabled(true);
                    setActiveProjectIndex(idx);
                  }}
                  className={`
                    relative h-2 rounded-full transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)]
                    ${isActive
                      ? (theme === 'dark' ? 'w-10 bg-linear-to-r from-[#FFCE00] to-[#FF8A00]' : 'w-10 bg-linear-to-r from-[#8B5CF6] to-[#D946EF]')
                      : (theme === 'dark' ? 'w-2 bg-[#6C6A98]/40 hover:bg-[#8B5CF6]/40' : 'w-2 bg-[#8B5CF6]/20 hover:bg-[#8B5CF6]/40')
                    }
                  `}
                >
                  {isActive && <span className={`absolute inset-0 rounded-full blur-[6px] animate-pulse ${theme === 'dark' ? 'bg-[#FFCE00]/60' : 'bg-[#D946EF]/50'}`} />}
                </button>
              );
            })}
          </div>

          <span
            className={`
              text-[10px] font-[1000] uppercase tracking-[0.3em] transition-all duration-500
              ${theme === 'dark'
                ? 'bg-linear-to-r from-[#FFCE00] to-[#FF8A00] bg-clip-text text-transparent'
                : 'bg-linear-to-r from-[#8B5CF6] to-[#D946EF] bg-clip-text text-transparent'
              }
            `}
          >
            WORKSPACE // {toWorkspaceLabel(featuredProject)}
          </span>
        </div>

        <div
          role="button"
          onClick={() => onOpenDesign(featuredProject?.id)}
          className={`
            group relative w-full block rounded-2xl mt-2 overflow-hidden border transition-all duration-700 cursor-pointer
            ${theme === 'dark' ? 'border-white/5 bg-[#0A092D] shadow-2xl' : 'border-white bg-white shadow-lg'}
            hover:scale-[1.015]
          `}
        >
          <div
            className={`
              absolute inset-0 z-30 pointer-events-none transition-opacity duration-500 border-2 rounded-2xl opacity-0 group-hover:opacity-100
              ${theme === 'dark' ? 'border-[#FFCE00]/40' : 'border-[#8B5CF6]/50'}
            `}
          />

          <div className="w-full aspect-video">
            <div className="relative h-full w-full overflow-hidden">
              <div
                onTransitionEnd={onTrackTransitionEnd}
                className={`flex h-full w-full ${getTrackTranslateClass()} ${isSliderTransitionEnabled ? 'transition-transform duration-700 cubic-bezier(0.23, 1, 0.32, 1)' : ''}`}
              >
                {carouselProjects.map((project, idx) => (
                  <div key={`${project.id}-${idx}`} className="h-full w-full shrink-0 grow-0 basis-full">
                    {renderProjectPreview(project)}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
    </div>
  );
}
