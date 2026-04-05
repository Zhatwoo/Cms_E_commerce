'use client';

import { type ReactNode } from 'react';

type SidebarRowProps = {
  icon: ReactNode;
  label: string;
  children: ReactNode;
  action?: ReactNode;
  theme: 'light' | 'dark';
};

export function SidebarRow({ icon, label, children, action, theme }: SidebarRowProps) {
  const isDark = theme === 'dark';
  return (
    <div className="flex flex-col gap-1.5 transition-all">
      <div className="flex items-center justify-between">
        <div className={`flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.25em] opacity-40 ${isDark ? 'text-white' : 'text-[#12193A]'}`}>
          <span className="opacity-70">{icon}</span>
          {label}
        </div>
        {action}
      </div>
      <div className="pl-0">
        {children}
      </div>
    </div>
  );
}