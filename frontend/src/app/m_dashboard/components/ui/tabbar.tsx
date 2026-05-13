'use client';
/**
 * ============================================================================
 * TabBar Component
 * ============================================================================
 *
 * Purpose of this File:
 * ----------------------------------------------------------------------------
 * This file contains a reusable animated TabBar component used for switching
 * between content sections inside dashboards, panels, management pages,
 * analytics views, or multi-section interfaces.
 *
 * The component provides:
 * - Reusable tab navigation
 * - Animated active tab indicator
 * - Theme-aware styling
 * - Generic TypeScript support
 * - Smooth Framer Motion transitions
 *
 * ----------------------------------------------------------------------------
 * What this Component Does:
 * ----------------------------------------------------------------------------
 * - Displays selectable tab labels
 * - Highlights the currently active tab
 * - Animates underline transitions between tabs
 * - Supports dark and light themes
 * - Allows parent-controlled tab state
 * - Provides reusable section navigation UI
 *
 * ----------------------------------------------------------------------------
 * Type Definitions:
 * ----------------------------------------------------------------------------
 *
 * TabBarTheme
 * ----------------------------------------------------------------------------
 * Defines available visual theme modes.
 *
 * Supported values:
 * - 'light'
 * - 'dark'
 *
 * ----------------------------------------------------------------------------
 * TabBarItem<T>
 * ----------------------------------------------------------------------------
 *
 * Represents a single tab entry.
 *
 * Properties:
 *
 * id: T
 * - Unique tab identifier
 * - Used for active state matching
 *
 * label: string
 * - Display text shown in the tab
 *
 * ----------------------------------------------------------------------------
 * TabBarProps<T>
 * ----------------------------------------------------------------------------
 *
 * tabs: readonly TabBarItem<T>[]
 * ----------------------------------------------------------------------------
 * Ordered list of tabs displayed in the tab bar.
 *
 * REQUIRED
 *
 * ----------------------------------------------------------------------------
 * activeTab: T
 * ----------------------------------------------------------------------------
 * Currently selected tab identifier.
 *
 * REQUIRED
 *
 * ----------------------------------------------------------------------------
 * onTabChange: (tabId: T) => void
 * ----------------------------------------------------------------------------
 * Callback triggered when a tab is selected.
 *
 * Returns:
 * - Selected tab id
 *
 * REQUIRED
 *
 * ----------------------------------------------------------------------------
 * theme?: TabBarTheme
 * ----------------------------------------------------------------------------
 * Controls tab styling appearance.
 *
 * Available values:
 * - 'light'
 * - 'dark'
 *
 * Default:
 * - 'light'
 *
 * ----------------------------------------------------------------------------
 * className?: string
 * ----------------------------------------------------------------------------
 * Additional wrapper class names.
 *
 * Useful for:
 * - Margin spacing
 * - Layout overrides
 * - Positioning
 *
 * ----------------------------------------------------------------------------
 * underlineLayoutId?: string
 * ----------------------------------------------------------------------------
 * Framer Motion layoutId used for underline animation scoping.
 *
 * Useful when:
 * - Multiple TabBar components exist on the same page
 * - Preventing animation conflicts
 *
 * Default:
 * - 'tabbar-underline'
 *
 * ----------------------------------------------------------------------------
 * Generic Type Support:
 * ----------------------------------------------------------------------------
 *
 * This component uses TypeScript generics:
 *
 * <T extends string>
 *
 * Benefits:
 * - Strongly typed tab ids
 * - Safer active state handling
 * - Better autocomplete support
 *
 * Example:
 *
 * type DashboardTab =
 *   | 'overview'
 *   | 'analytics'
 *   | 'settings';
 *
 * ----------------------------------------------------------------------------
 * How to Use:
 * ----------------------------------------------------------------------------
 *
 * Basic Example:
 *
 * const tabs = [
 *   { id: 'overview', label: 'Overview' },
 *   { id: 'analytics', label: 'Analytics' },
 *   { id: 'settings', label: 'Settings' },
 * ];
 *
 * const [activeTab, setActiveTab] = useState('overview');
 *
 * <TabBar
 *   tabs={tabs}
 *   activeTab={activeTab}
 *   onTabChange={setActiveTab}
 * />
 *
 * ----------------------------------------------------------------------------
 * Example with Dark Theme:
 * ----------------------------------------------------------------------------
 *
 * <TabBar
 *   tabs={tabs}
 *   activeTab={activeTab}
 *   onTabChange={setActiveTab}
 *   theme="dark"
 * />
 *
 * ----------------------------------------------------------------------------
 * Example with Typed Tabs:
 * ----------------------------------------------------------------------------
 *
 * type ProjectTab =
 *   | 'products'
 *   | 'inventory'
 *   | 'orders';
 *
 * const tabs: TabBarItem<ProjectTab>[] = [
 *   { id: 'products', label: 'Products' },
 *   { id: 'inventory', label: 'Inventory' },
 *   { id: 'orders', label: 'Orders' },
 * ];
 *
 * <TabBar<ProjectTab>
 *   tabs={tabs}
 *   activeTab={activeTab}
 *   onTabChange={setActiveTab}
 * />
 *
 * ============================================================================
 */

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

// push