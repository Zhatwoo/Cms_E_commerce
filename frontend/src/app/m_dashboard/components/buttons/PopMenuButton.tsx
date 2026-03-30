import type { ReactNode } from 'react';

type DashboardTheme = 'light' | 'dark';

export type PopMenuOption = {
  /** Stable key for rendering this option. */
  key: string;
  /** User-facing option label. */
  label: string;
  /** Optional icon rendered before label. */
  icon?: ReactNode;
  /** Callback executed when option is selected. */
  onSelect: () => void;
  /** Optional classes for per-option visual customization. */
  className?: string;
  /** Whether option should be disabled. */
  disabled?: boolean;
  /** Whether option should be hidden from the list. */
  hidden?: boolean;
};

type PopMenuButtonProps = {
  /** Theme mode used to render dark/light variants. */
  theme: DashboardTheme;
  /** Whether the pop menu is currently open. */
  isOpen: boolean;
  /** Accessible label for the trigger button. */
  triggerAriaLabel?: string;
  /** Trigger icon node. Falls back to a vertical three-dot icon. */
  triggerIcon?: ReactNode;
  /** Called when trigger button is clicked. */
  onToggle: () => void;
  /** List of options rendered in the pop menu. */
  options: PopMenuOption[];
};

/**
 * Generic pop-menu trigger and dropdown options renderer.
 */
export function PopMenuButton({
  theme,
  isOpen,
  triggerAriaLabel = 'Open actions menu',
  triggerIcon,
  onToggle,
  options,
}: PopMenuButtonProps) {
  const visibleOptions = options.filter((option) => !option.hidden);

  return (
    <div className="absolute right-3 top-3 z-40" onClick={(e) => e.stopPropagation()}>
      <button
        type="button"
        aria-label={triggerAriaLabel}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onToggle();
        }}
        className={`
          cursor-pointer h-8 w-8 rounded-full flex items-center justify-center transition-all backdrop-blur-md
          ${theme === 'dark' ? 'bg-black/20 text-white/40 hover:text-white' : 'bg-[#8B5CF6]/10 text-[#8B5CF6] hover:bg-[#8B5CF6] hover:text-white'}
        `}
      >
        {triggerIcon ?? (
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
            <circle cx="12" cy="5" r="1.5" />
            <circle cx="12" cy="12" r="1.5" />
            <circle cx="12" cy="19" r="1.5" />
          </svg>
        )}
      </button>

      {isOpen && visibleOptions.length > 0 && (
        <div
          className={`
            absolute right-0 mt-2 w-44 rounded-2xl border p-1 shadow-xl animate-in fade-in zoom-in duration-200 z-50
            ${theme === 'dark' ? 'bg-[#15093E] border-[#272261] text-white' : 'bg-white border-[#8B5CF6]/20 text-slate-700'}
          `}
        >
          {visibleOptions.map((option) => (
            <button
              key={option.key}
              type="button"
              disabled={option.disabled}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (option.disabled) {
                  return;
                }
                option.onSelect();
              }}
              className={`
                w-full px-3 py-2 rounded-xl text-left text-sm flex items-center gap-2 transition-colors
                ${theme === 'dark' ? 'hover:bg-white/5' : 'hover:bg-slate-50'}
                ${option.disabled ? 'opacity-50 cursor-not-allowed' : ''}
                ${option.className ?? ''}
              `}
            >
              {option.icon && <span className="shrink-0">{option.icon}</span>}
              <span className="truncate">{option.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}