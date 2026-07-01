/**
 * ============================================================================
 * Your Designs Tab Content Component
 * ============================================================================
 *
 * Purpose of this File:
 * ----------------------------------------------------------------------------
 * This file contains the "Your Designs" tab view component that displays the
 * user's projects including a featured project carousel and a grid of other
 * projects with quick access to create new designs.
 *
 * The component provides:
 * - Featured project carousel with smooth transitions
 * - Grid display of user's other projects
 * - Project cards with thumbnails and metadata
 * - New project creation button
 * - Project action menus (edit, delete, etc.)
 * - Search and filtering capabilities
 * - Empty state when no projects exist
 * - Loading state handling
 * - Theme-aware styling
 * - Responsive layout for mobile and desktop
 *
 * ----------------------------------------------------------------------------
 * What this Component Does:
 * ----------------------------------------------------------------------------
 * - Renders hero section with featured project carousel
 * - Displays carousel indicators and navigation
 * - Shows project cards with preview thumbnails
 * - Displays last edited dates and workspace info
 * - Provides quick access to create new project
 * - Opens design editor when project is clicked
 * - Shows action menu for project operations
 * - Filters/searches projects by name
 * - Expands to show all projects with \"See All\" toggle
 * - Handles carousel looping and transitions
 * - Adapts styling based on light/dark theme
 *
 * Props / Parameters:
 * ----\n * theme: DashboardTheme\n * - Current UI theme mode (light or dark).\n * - Determines component styling and colors.\n * - Values: 'light' | 'dark'\n * - REQUIRED\n *
 * userName: string\n * - Current user's display name.\n * - Used in empty-state greeting.\n * - REQUIRED\n *
 * loading: boolean\n * - Whether projects are being loaded.\n * - Shows loading skeleton when true.\n * - REQUIRED\n *
 * featuredProject: Project | null\n * - Currently featured project in carousel.\n * - null if no projects available.\n * - REQUIRED\n *
 * indicatorCount: number\n * - Total number of carousel indicator dots.\n * - REQUIRED\n *
 * displayProjectIndex: number\n * - Current active carousel indicator index.\n * - REQUIRED\n *
 * carouselProjects: Project[]\n * - Projects shown in the hero carousel.\n * - REQUIRED\n *
 * otherProjects: Project[]\n * - Projects shown in the grid below carousel.\n * - REQUIRED\n *
 * allProjectsCount: number\n * - Total project count for \"See All\" functionality.\n * - REQUIRED\n *
 * showAllOtherProjects: boolean\n * - Whether to display all projects or limited grid.\n * - REQUIRED\n *
 * openProjectMenuId: string | null\n * - Currently open project action menu ID.\n * - REQUIRED\n *
 * isSliderTransitionEnabled: boolean\n * - Whether carousel transitions are animated.\n * - REQUIRED\n *
 * formatLastEdited: (dateStr?: string) => string\n * - Function to format last edited timestamp.\n * - REQUIRED\n *
 * formatEditedDate: (dateStr?: string) => string\n * - Function to format edited date for cards.\n * - REQUIRED\n *
 * toWorkspaceLabel: (project?: Project | null) => string\n * - Function to convert project to workspace label.\n * - REQUIRED\n *
 * getTrackTranslateClass: () => string\n * - Function returning translate class for carousel.\n * - REQUIRED\n *
 * onTrackTransitionEnd: () => void\n * - Callback when carousel transition completes.\n * - Handles looping reset.\n * - REQUIRED\n *
 * onOpenDesign: (projectId?: string) => void\n * - Callback to open design editor.\n * - Opens new design if projectId not provided.\n * - REQUIRED\n *
 * setActiveProjectIndex: Dispatch<SetStateAction<number>>\n * - State setter for active carousel indicator.\n * - REQUIRED\n *
 * setIsSliderTransitionEnabled: Dispatch<SetStateAction<boolean>>\n * - State setter for carousel transition animation.\n * - REQUIRED\n *
 * setShowAllOtherProjects: Dispatch<SetStateAction<boolean>>\n * - State setter for \"show all\" toggle.\n * - REQUIRED\n *
 * onCreateProject: () => void\n * - Callback to navigate to create project page.\n * - REQUIRED\n *
 * onOpenProjectMenu: (projectId: string) => void\n * - Callback when project action menu is opened.\n * - REQUIRED\n *
 * onCloseProjectMenu: () => void\n * - Callback when project action menu is closed.\n * - REQUIRED\n *
 * Type Definitions:
 * ----\n *
 * DashboardTheme\n * - Union type for theme modes: 'light' | 'dark'\n *
 * YourDesignsTabContentProps\n * - Complete props interface for the component.\n *
 * ============================================================================
 */

import type { Dispatch, ReactNode, SetStateAction } from 'react';
import { motion } from 'framer-motion';
import type { Project } from '@/lib/api';
import { MostRecentProjectContainer } from '@/app/m_dashboard/container/MostRecentProjectContainer';
import { NewProjectButton } from '../../components/buttons/NewProjectButton';
import { ProjectCardContainer } from '../../container/ProjectCardContainer';

type DashboardTheme = 'light' | 'dark';

type YourDesignsTabContentProps = {
  /**
   * Tab theme mode used to render color variants.
   */
  theme: DashboardTheme;
  /**
   * Current user display name used in the empty-state headline.
   */
  userName: string;
  /**
   * Loading state for recent projects.
   */
  loading: boolean;
  /**
   * Current featured project shown in the hero section.
   */
  featuredProject: Project | null;
  /**
   * Number of active carousel indicators.
   */
  indicatorCount: number;
  /**
   * Index used to mark the active indicator.
   */
  displayProjectIndex: number;
  /**
   * Project cards shown in the hero carousel track.
   */
  carouselProjects: Project[];
  /**
   * Project cards shown in the "Other Projects" grid.
   */
  otherProjects: Project[];
  /**
   * Total project count used for "See All" visibility.
   */
  allProjectsCount: number;
  /**
   * Whether all projects are currently visible.
   */
  showAllOtherProjects: boolean;
  /**
   * Currently opened kebab menu project id.
   */
  openProjectMenuId: string | null;
  /**
   * Whether carousel transition animation is enabled.
   */
  isSliderTransitionEnabled: boolean;
  /**
   * Builds human-readable "last edited" text.
   */
  formatLastEdited: (dateStr?: string) => string;
  /**
   * Builds human-readable "edited" text for project cards.
   */
  formatEditedDate: (dateStr?: string) => string;
  /**
   * Converts project metadata to workspace display label.
   */
  toWorkspaceLabel: (project?: Project | null) => string;
  /**
   * Returns translate class for the hero carousel track.
   */
  getTrackTranslateClass: () => string;
  /**
   * Handles track transition completion for loop resets.
   */
  onTrackTransitionEnd: () => void;
  /**
   * Opens design editor for a specific project or a new design.
   */
  onOpenDesign: (projectId?: string) => void;
  /**
   * Updates active indicator index.
   */
  setActiveProjectIndex: Dispatch<SetStateAction<number>>;
  /**
   * Enables/disables carousel transitions.
   */
  setIsSliderTransitionEnabled: Dispatch<SetStateAction<boolean>>;
  /**
   * Toggles "show all projects" mode.
   */
  setShowAllOtherProjects: Dispatch<SetStateAction<boolean>>;
  /**
   * Navigates to the dedicated create project page.
   */
  onCreateProject: () => void;
  /**
   * Opens/closes project action menus.
   */
  setOpenProjectMenuId: Dispatch<SetStateAction<string | null>>;
  /**
   * Triggers project rename flow.
   */
  onEditProject: (project: Project) => void;
  /**
   * Triggers project delete flow.
   */
  onDeleteProject: (project: Project) => void;
  /**
   * Renders a preview node for a project card.
   */
  renderProjectPreview: (project: Project | null) => ReactNode;
};

/**
 * Renders all content for the "YOUR DESIGNS" dashboard tab.
 */
export function YourDesignsTabContent({
  theme,
  userName,
  loading,
  featuredProject,
  indicatorCount,
  displayProjectIndex,
  carouselProjects,
  otherProjects,
  allProjectsCount,
  showAllOtherProjects,
  openProjectMenuId,
  isSliderTransitionEnabled,
  formatLastEdited,
  formatEditedDate,
  toWorkspaceLabel,
  getTrackTranslateClass,
  onTrackTransitionEnd,
  onOpenDesign,
  setActiveProjectIndex,
  setIsSliderTransitionEnabled,
  setShowAllOtherProjects,
  onCreateProject,
  setOpenProjectMenuId,
  onEditProject,
  onDeleteProject,
  renderProjectPreview,
}: YourDesignsTabContentProps) {
  return (
    <motion.div
      key="designs-tab"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.22, ease: 'easeOut' }}
    >
        {/* Most Recent Project Hero*/}
      <div className="mt-10 mx-auto w-full max-w-none grid grid-cols-1 lg:grid-cols-[minmax(0,1.02fr)_minmax(0,1.18fr)] gap-8 lg:gap-12 items-center pt-3">
        <div className="space-y-5 w-full max-w-190 lg:justify-self-start">
          <h2
            className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-[0.94] [font-family:var(--font-outfit),sans-serif]"
            style={{ color: theme === 'dark' ? '#FFFFFF' : '#120533' }}
          >
            Most Recent Project
          </h2>

          <p
            className="text-base sm:text-xl leading-relaxed max-w-190"
            style={{ color: theme === 'dark' ? 'rgba(255,255,255,0.72)' : 'rgba(30, 41, 59, 0.72)' }}
          >
            {loading
              ? 'Loading your latest project...'
              : featuredProject
                ? (
                  <>
                    <span style={{ color: theme === 'dark' ? '#FFCE00' : '#8B5CF6', fontWeight: 700 }}>
                      {featuredProject.title || 'Untitled website'}
                    </span>
                    {` - ${formatLastEdited(featuredProject.updatedAt || featuredProject.createdAt)}. Continue building your responsive hero section and component library.`}
                  </>
                )
                : `${userName}, create your first project to start building your website.`}
          </p>

          <button
            type="button"
            onClick={() => onOpenDesign(featuredProject?.id)}
            className={`
              rounded-full px-10 py-3 text-base font-bold cursor-pointer
              transition-all duration-300 ease-out
              hover:-translate-y-1 hover:brightness-110 active:scale-95
              text-white
              ${theme === 'dark' ? 'hover:shadow-[0_12px_28px_rgba(255,206,0,0.55)]' : 'hover:shadow-[0_12px_28px_rgba(217,70,239,0.5)]'}
            `}
            style={
              theme === 'dark'
                ? {
                    background: '#FFCE00',
                    color: '#120533',
                    boxShadow: '0 8px 24px rgba(255, 206, 0, 0.42)',
                  }
                : {
                    background: 'linear-gradient(90deg, #9333ea 0%, #ec4899 100%)',
                    boxShadow: '0 8px 24px rgba(217,70,239,0.4)',
                  }
            }
          >
            View Project
          </button>
        </div>

        {/* Most Recent Project Container */}
        <MostRecentProjectContainer
          theme={theme}
          featuredProject={featuredProject}
          indicatorCount={indicatorCount}
          displayProjectIndex={displayProjectIndex}
          carouselProjects={carouselProjects}
          isSliderTransitionEnabled={isSliderTransitionEnabled}
          toWorkspaceLabel={toWorkspaceLabel}
          getTrackTranslateClass={getTrackTranslateClass}
          onTrackTransitionEnd={onTrackTransitionEnd}
          onOpenDesign={onOpenDesign}
          setActiveProjectIndex={setActiveProjectIndex}
          setIsSliderTransitionEnabled={setIsSliderTransitionEnabled}
          renderProjectPreview={renderProjectPreview}
        />
      </div>

      <section className="mx-auto w-full max-w-none pt-2 sm:pt-4 mt-10">
        <div className="mb-4 flex items-center justify-between">
          <h3
            className={`
              text-xs sm:text-sm font-bold tracking-[0.18em] transition-colors duration-300
              ${theme === 'dark' ? 'text-[#FFCE00]' : 'text-[#8B5CF6]'}
            `}
          >
            Other Projects
          </h3>

          <div className="flex items-center gap-2 sm:gap-3">
            {allProjectsCount > 3 && (
              <button
                type="button"
                onClick={() => setShowAllOtherProjects((prev) => !prev)}
                className={`
                  cursor-pointer rounded-lg px-4 py-1.5 text-xs sm:text-sm font-bold transition-all duration-300 active:scale-95 border-2
                  ${theme === 'dark'
                    ? 'border-[#272261] bg-[#15093E]/70 text-white hover:border-[#FFCE00] hover:text-[#FFCE00]'
                    : 'border-[#8B5CF6] bg-transparent text-[#8B5CF6] hover:bg-[#8B5CF6] hover:text-white'
                  }
                `}
              >
                {showAllOtherProjects ? 'Show Less' : 'See All'}
              </button>
            )}
          </div>
        </div>

        {/* Other Projects Section */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">

         {/* New Project BButton */}
          <NewProjectButton
            theme={theme}
            onCreateProject={onCreateProject}
          />

         {/* Project Container */}
          {otherProjects.map((project) => (
            <ProjectCardContainer
              key={project.id}
              theme={theme}
              project={project}
              isMenuOpen={openProjectMenuId === project.id}
              onOpenDesign={onOpenDesign}
              onToggleMenu={(projectId) => {
                setOpenProjectMenuId((prev) => (prev === projectId ? null : projectId));
              }}
              onEditProject={onEditProject}
              onDeleteProject={onDeleteProject}
              formatEditedDate={formatEditedDate}
            />
          ))}
        </div>
      </section>
    </motion.div>
  );
}