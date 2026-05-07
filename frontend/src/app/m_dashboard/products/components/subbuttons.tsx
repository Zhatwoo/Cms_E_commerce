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
  const isDark = theme === 'dark' && !isLight;
  const railBg = isDark ? 'rgba(20, 20, 70, 0.4)' : '#FFFFFF';
  const railBorder = isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)';
  const railShadow = isDark ? 'none' : '0 10px 30px rgba(0,0,0,0.04)';

  return (
    <div className="relative" ref={undefined}>
      <div
        className="rounded-[1.2rem] border p-1.5 transition-all duration-500"
        style={{ backgroundColor: railBg, borderColor: railBorder, boxShadow: railShadow }}
      >
        <button
          type="button"
          onClick={onToggle}
          className="relative h-9 w-9 sm:h-10 sm:w-10 rounded-[0.9rem] inline-flex items-center justify-center transition-colors duration-300 outline-none"
          style={{ color: showStatusFilterMenu ? (isDark ? '#FFCE00' : '#FFFFFF') : (isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)') }}
        >
          <span
            className="absolute inset-0 rounded-[0.8rem] transition-opacity duration-300"
            style={{
              opacity: showStatusFilterMenu ? 1 : 0,
              background: isDark ? 'rgba(255, 206, 0, 0.05)' : 'linear-gradient(135deg, #BD34FE 0%, #F13797 100%)',
              boxShadow: isDark
                ? '0 0 15px rgba(255, 206, 0, 0.1)'
                : '0 4px 12px rgba(189, 52, 254, 0.2)',
              border: isDark ? '1px solid rgba(255, 206, 0, 0.15)' : 'none',
            }}
          />
          <svg
            className="relative z-10 h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.6}
          >
            <path d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>

  {/* MENU: Matches the clean editorial dropdown style */}
  {showStatusFilterMenu && (
    <div
      className="absolute right-0 top-full mt-2 w-48 rounded-2xl border shadow-xl z-30 p-1.5"
      style={{ 
        backgroundColor: isDark ? 'rgba(20, 20, 70, 0.95)' : '#FFFFFF',
        borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(20, 3, 74, 0.05)',
        backdropFilter: 'blur(12px)'
      }}
    >
      {[
        { value: 'all' as const, label: 'All Status' },
        { value: 'active' as const, label: 'Active' },
        { value: 'inactive' as const, label: 'Inactive' },
      ].map((item) => {
        const checked = statusFilter === item.value;
        return (
          <button
            key={item.value}
            type="button"
            onClick={() => onFilterChange(item.value)}
            className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-sm font-bold transition-all"
            style={{ 
              color: checked ? '#7c3aed' : (isDark ? '#EDEBFF' : '#14034A'),
              backgroundColor: checked
                ? 'rgba(124, 58, 237, 0.08)'
                : 'transparent'
            }}
          >
            <span className="tracking-tight">{item.label}</span>
            {checked && (
              <div className="w-1.5 h-1.5 rounded-full bg-[#7c3aed]" />
            )}
          </button>
        );
      })}
    </div>
  )}
</div>
  );
}

