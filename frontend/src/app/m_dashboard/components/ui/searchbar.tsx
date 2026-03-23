'use client';

import type { ChangeEvent } from 'react';

type SearchBarTheme = 'light' | 'dark';

export type SearchBarProps = {
  /** Current search query value controlled by the parent. */
  value: string;
  /** Callback fired when the query text changes. */
  onChange: (value: string) => void;
  /** Color mode used to style input text, placeholder, and icon states. */
  theme?: SearchBarTheme;
  /** Optional placeholder text shown when input is empty. */
  placeholder?: string;
  /** Optional wrapper class names for layout overrides. */
  className?: string;
};

/**
 * A reusable themed search bar widget with icon, focus styles, and controlled input behavior.
 *
 * Parameters:
 * - `value`: Current query text displayed by the input.
 * - `onChange`: Callback triggered whenever the input value changes.
 * - `theme`: Optional visual mode (`light` or `dark`) used for colors and shadows.
 * - `placeholder`: Optional placeholder text shown when the input is empty.
 * - `className`: Optional wrapper class names for spacing and layout overrides.
 */
export function SearchBar({
  value,
  onChange,
  theme = 'light',
  placeholder = 'Search...',
  className = '',
}: SearchBarProps) {
  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    onChange(event.target.value);
  };

  return (
    <div
      className={`
        m-dashboard-search-shadow w-full max-w-4xl rounded-2xl px-5 py-3.5 flex items-center gap-3 border
        transition-all duration-500

        ${theme === 'dark'
          ? 'bg-[#141446] border-[#1F1F51]'
          : 'admin-dashboard-panel-soft border-0'
        }

        ${theme === 'light' && 'shadow-[0_0_15px_rgba(139,92,246,0.1),0_0_1px_rgba(139,92,246,0.2)]'}
        ${theme === 'dark' && 'shadow-[0_0_12px_rgba(31,31,81,0.4)]'}

        ${theme === 'dark'
          ? 'hover:border-[#2a2a6e] focus-within:border-[#3b3b8a]'
          : 'hover:border-[#8B5CF6]/40 focus-within:border-[#8B5CF6] focus-within:shadow-[0_0_25px_rgba(139,92,246,0.2)]'
        }

        ${className}
      `.trim()}
    >
      <div className="relative">
        {theme === 'light' && (
          <div className="absolute inset-0 bg-[#8B5CF6] blur-md opacity-20 scale-150 rounded-full" />
        )}

        <svg
          viewBox="0 0 20 20"
          className={`
            h-4 w-4 shrink-0 relative z-10 transition-all duration-300
            ${theme === 'dark'
              ? 'text-[#FFCE00] filter-[drop-shadow(0_0_5px_rgba(255,206,0,0.6))]'
              : 'text-[#8B5CF6]'
            }
          `}
          fill="none"
          aria-hidden="true"
        >
          <path d="M14.3 14.3L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <circle cx="8.75" cy="8.75" r="5.75" stroke="currentColor" strokeWidth="2" />
        </svg>
      </div>

      <input
        type="text"
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        className={`
          w-full bg-transparent text-sm outline-none font-medium
          ${theme === 'dark'
            ? 'text-white placeholder:text-[#6F70A8]'
            : 'text-[#120533] placeholder:text-[#120533]/30'
          }
        `}
      />
    </div>
  );
}
