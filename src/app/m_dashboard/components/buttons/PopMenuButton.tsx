'use client';

/**
 * ============================================================================
 * Pop Menu Button Component
 * ============================================================================
 *
 * Purpose of this File:
 * ----------------------------------------------------------------------------
 * This file contains a reusable pop menu (dropdown) button component for
 * displaying contextual actions and options throughout the dashboard.
 *
 * The component provides:
 * - Customizable menu options with icons and labels
 * - Theme support for light and dark modes
 * - Disabled and hidden state support for options
 * - Per-option visual customization via className
 * - Click handling with automatic menu closure
 * - Accessible trigger button with ARIA labels
 * - Responsive positioning and styling
 *
 * ----------------------------------------------------------------------------
 * What this Component Does:
 * ----------------------------------------------------------------------------
 * - Renders a trigger button (customizable icon or default three-dot)
 * - Displays a dropdown menu with selectable options
 * - Calls onSelect callback when an option is clicked
 * - Supports disabled options that cannot be selected
 * - Supports hidden options that are not displayed
 * - Allows per-option custom styling
 * - Filters hidden options before rendering
 * - Closes menu after option selection
 *
 * ----------------------------------------------------------------------------
 * Props / Parameters:
 * ----------------------------------------------------------------------------
 *
 * theme: DashboardTheme
 * - The current UI theme mode (light or dark).
 * - Determines menu styling and colors.
 * - Values: 'light' | 'dark'
 * - REQUIRED
 *
 * isOpen: boolean
 * - Whether the pop menu is currently open/visible.
 * - Used to control dropdown visibility state.
 * - REQUIRED
 *
 * onToggle: () => void
 * - Callback triggered when trigger button is clicked.
 * - Should toggle the isOpen state.
 * - REQUIRED
 *
 * options: PopMenuOption[]
 * - Array of menu options to display.
 * - Each option must contain key, label, and onSelect.
 * - REQUIRED
 *
 * triggerAriaLabel?: string
 * - Accessible label for screen readers.
 * - Default: 'Open actions menu'
 *
 * triggerIcon?: ReactNode
 * - Custom icon for the trigger button.
 * - Falls back to vertical three-dot icon if not provided.
 *
 * ----------------------------------------------------------------------------
 * Type Definitions:
 * ----------------------------------------------------------------------------
 *
 * DashboardTheme
 * - Type for theme modes: 'light' | 'dark'
 *
 * PopMenuOption
 * - Represents a single menu option with:
 *   - key: Stable identifier for rendering
 *   - label: User-facing option text
 *   - icon?: Optional icon node
 *   - onSelect: Callback when option selected
 *   - className?: Custom styling classes
 *   - disabled?: Whether option is disabled
 *   - hidden?: Whether option is hidden
 *
 * PopMenuButtonProps
 * - Props interface for the component
 *
 * ----------------------------------------------------------------------------
 * How to Use:
 * ----------------------------------------------------------------------------
 *
 * Example Usage:
 *
 * const [menuOpen, setMenuOpen] = useState(false);
 *
 * const options = [
 *   {
 *     key: 'edit',
 *     label: 'Edit Project',
 *     onSelect: () => handleEdit(),
 *   },
 *   {
 *     key: 'delete',
 *     label: 'Delete',
 *     onSelect: () => handleDelete(),
 *     className: 'text-red-500',
 *   },
 * ];
 *
 * <PopMenuButton
 *   theme="dark"
 *   isOpen={menuOpen}
 *   onToggle={() => setMenuOpen(!menuOpen)}
 *   options={options}
 * />
 *
 * ============================================================================
 */

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
  theme: DashboardTheme;
  isOpen: boolean;
  triggerAriaLabel?: string;
  triggerIcon?: ReactNode;
  onToggle: () => void;
  options: PopMenuOption[];
};


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