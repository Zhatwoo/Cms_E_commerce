type DashboardTheme = 'light' | 'dark';

type NewProjectButtonProps = {
  /**
   * Theme mode used to render dark/light variants.
   */
  theme: DashboardTheme;
  /**
   * Callback triggered when the button is clicked.
   */
  onCreateProject: () => void;
};

/**
 * Renders the "New Project" action button for the designs grid.
 */
export function NewProjectButton({
  theme,
  onCreateProject,
}: NewProjectButtonProps) {
  const plusStrokeColor = theme === 'dark' ? '#11134D' : '#FFFFFF';

  return (
    <button
      type="button"
      onClick={onCreateProject}
      className={`
        cursor-pointer group relative flex flex-col items-center justify-center gap-6
        w-full min-h-60 sm:min-h-65 p-4 sm:p-5
        rounded-[40px] transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)]
        hover:-translate-y-2

        ${theme === 'dark'
          ? 'bg-[#15093E] border border-[#280E59] shadow-[0_20px_40px_rgba(0,0,0,0.3)]'
          : 'admin-dashboard-panel border-0'
        }
      `}
    >
      <div className="relative">
        <div
          className={`
            h-20 w-20 rounded-[28px] flex items-center justify-center
            transition-all duration-500 shadow-lg group-hover:scale-110 group-hover:rotate-90
            ${theme === 'dark'
              ? 'bg-[#FFCE00] shadow-[0_0_30px_rgba(255,206,0,0.2)]'
              : 'bg-linear-to-br from-[#8B5CF6] to-[#D946EF] shadow-[0_10px_25px_rgba(139,92,246,0.3)]'
            }
          `}
        >
          <svg className="w-10 h-10" fill="none" stroke={plusStrokeColor} strokeWidth={3} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14m7-7H5" />
          </svg>
        </div>
      </div>

      <div className="flex flex-col items-center gap-1">
        <span
          className={`
            text-xl font-black tracking-tighter transition-colors duration-300
            ${theme === 'dark' ? 'text-white' : 'text-[#120533]'}
          `}
        >
          New Project
        </span>
        <div className={`h-1 w-8 rounded-full transition-all duration-500 scale-x-0 group-hover:scale-x-100 ${theme === 'dark' ? 'bg-[#FFCE00]' : 'bg-[#8B5CF6]'}`} />
      </div>
    </button>
  );
}
