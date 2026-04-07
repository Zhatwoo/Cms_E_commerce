import React from 'react';

export interface StatusFilterButtonProps {
  showStatusFilterMenu: boolean;
  onToggle: () => void;
  statusFilter: 'all' | 'active' | 'inactive';
  onFilterChange: (filter: 'all' | 'active' | 'inactive') => void;
  theme: 'light' | 'dark';
  isLight: boolean;
}

export function StatusFilterButton({
  showStatusFilterMenu,
  onToggle,
  statusFilter,
  onFilterChange,
  theme,
  isLight,
}: StatusFilterButtonProps) {
  return (
    <div className="relative" ref={undefined}>
      <button
        type="button"
        onClick={onToggle}
        className={`h-[48px] w-[48px] cursor-pointer rounded-2xl border flex items-center justify-center transition-all duration-300 ${showStatusFilterMenu ? 'shadow-md scale-105' : 'hover:scale-105'} ${theme === 'light' ? 'admin-dashboard-panel-soft border-0' : ''}`}
        style={{
          backgroundColor: showStatusFilterMenu && theme === 'light' ? '#14034A' : (theme === 'light' ? undefined : '#1F2544'),
          borderColor: theme === 'light' ? undefined : '#1F1F51',
          boxShadow: theme === 'dark' ? '0 0 12px rgba(31,31,81,0.4)' : undefined,
          color: showStatusFilterMenu && theme === 'light' ? '#FFFFFF' : (theme === 'light' ? '#14034A' : '#FFCE00'),
        }}
        title="Filter products"
      >
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {showStatusFilterMenu && (
        <div
          className="absolute right-0 top-full mt-2 w-56 rounded-xl border p-2 z-30"
          style={{ backgroundColor: '#141446', borderColor: '#2D3A90' }}
        >
          {[
            { value: 'all' as const, label: 'All' },
            { value: 'active' as const, label: 'Active' },
            { value: 'inactive' as const, label: 'Inactive' },
          ].map((item) => {
            const checked = statusFilter === item.value;
            return (
              <button
                key={item.value}
                type="button"
                onClick={() => onFilterChange(item.value)}
                className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm hover:bg-white/5"
                style={{ color: '#D2D6F7' }}
              >
                <span>{item.label}</span>
                <span>{checked ? '✓' : ''}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export interface ViewModeToggleButtonProps {
  viewMode: 'tile' | 'list';
  onToggle: () => void;
  theme: 'light' | 'dark';
  colors: {
    border: {
      faint: string;
    };
    text: {
      primary: string;
    };
    bg: {
      card: string;
    };
    accent: {
      purple: string;
    };
  };
}

export function ViewModeToggleButton({
  viewMode,
  onToggle,
  theme,
  colors,
}: ViewModeToggleButtonProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`h-12 w-12 rounded-2xl border inline-flex items-center justify-center transition-all duration-300 ${viewMode === 'list' ? 'shadow-md scale-105' : 'hover:scale-105 opacity-70'}`}
      style={{
        borderColor: viewMode === 'list' ? 'transparent' : colors.border.faint,
        backgroundColor: viewMode === 'list'
          ? theme === 'light'
            ? '#14034A'
            : colors.accent.purple
          : theme === 'light'
          ? 'rgba(255,255,255,0.72)'
          : colors.bg.card,
        color: viewMode === 'list' ? '#FFFFFF' : theme === 'light' ? '#14034A' : colors.text.primary,
        boxShadow: theme === 'dark' && viewMode !== 'list' ? '0 0 12px rgba(31,31,81,0.4)' : undefined,
      }}
      title={viewMode === 'tile' ? 'Switch to list view' : 'Switch to tile view'}
    >
      {viewMode === 'tile' ? (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" strokeLinecap="round" />
        </svg>
      ) : (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <rect x="4" y="4" width="6" height="6" rx="1.5" />
          <rect x="14" y="4" width="6" height="6" rx="1.5" />
          <rect x="4" y="14" width="6" height="6" rx="1.5" />
          <rect x="14" y="14" width="6" height="6" rx="1.5" />
        </svg>
      )}
    </button>
  );
}
