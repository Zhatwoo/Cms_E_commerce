'use client';

import { motion } from 'framer-motion';

export type TabBarTheme = 'light' | 'dark';

export type TabBarItem<T extends string = string> = {
  id: T;
  label: string;
};

export type TabBarProps<T extends string = string> = {
  /** Ordered tab entries displayed by the tab bar. */
  tabs: readonly TabBarItem<T>[];
  /** Currently selected tab identifier. */
  activeTab: T;
  /** Callback fired when a tab is selected. */
  onTabChange: (tabId: T) => void;
  /** Color mode used to style active and inactive tab states. */
  theme?: TabBarTheme;
  /** Optional wrapper class names for layout overrides. */
  className?: string;
  /** Optional Framer Motion layout id to isolate underline animation instances. */
  underlineLayoutId?: string;
};

/**
 * A reusable tab bar widget that renders selectable labels with an animated underline indicator.
 *
 * Parameters:
 * - `tabs`: Ordered tab entries rendered as selectable buttons.
 * - `activeTab`: Currently selected tab id.
 * - `onTabChange`: Callback triggered when a tab is selected.
 * - `theme`: Optional visual mode (`light` or `dark`) used for tab colors.
 * - `className`: Optional wrapper class names for spacing and layout overrides.
 * - `underlineLayoutId`: Optional Framer Motion layout id for underline animation scoping.
 */
export function TabBar<T extends string = string>({
  tabs,
  activeTab,
  onTabChange,
  theme = 'light',
  className = '',
  underlineLayoutId = 'tabbar-underline',
}: TabBarProps<T>) {
  return (
    <div
      className={`flex items-center gap-8 text-xs uppercase font-bold tracking-widest [font-family:var(--font-outfit),sans-serif] ${className}`.trim()}
      role="tablist"
      aria-label="Content sections"
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;

        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onTabChange(tab.id)}
            className={`
              cursor-pointer relative pb-1 transition-all duration-300
              ${isActive
                ? (theme === 'dark' ? 'text-[#FFCE00]' : 'text-[#120533]')
                : (theme === 'dark' ? 'text-[#807FAF]' : 'text-[#120533]/50')
              }
              hover:opacity-70
            `}
          >
            {tab.label}

            {isActive && (
              <motion.span
                layoutId={underlineLayoutId}
                className="absolute left-0 right-0 -bottom-0.5 h-[2.5px] rounded-full"
                style={{
                  background: theme === 'dark'
                    ? 'linear-gradient(90deg, #7c3aed 0%, #d946ef 50%, #ffcc00 100%)'
                    : 'linear-gradient(90deg, #7c3aed 0%, #d946ef 50%, #f5a213 100%)',
                }}
                transition={{
                  type: 'spring',
                  stiffness: 520,
                  damping: 38,
                }}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}
