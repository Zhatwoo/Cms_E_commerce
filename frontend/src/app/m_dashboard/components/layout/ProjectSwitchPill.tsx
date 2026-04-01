'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useProject } from '../context/project-context';
import { useTheme } from '../context/theme-context';

export function ProjectSwitchPill() {
  const { projects, selectedProject, selectedProjectId, setSelectedProjectId, loading } = useProject();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  const projectLabel = useMemo(() => {
    if (loading) return 'Loading...';
    if (!projects.length) return 'No Project';
    return (selectedProject?.title || 'Untitled').trim() || 'Untitled';
  }, [loading, projects.length, selectedProject?.title]);

  const selectedInitial = useMemo(() => {
    const first = String(projectLabel || '').trim().charAt(0);
    return (first || 'P').toUpperCase();
  }, [projectLabel]);

  useEffect(() => {
    const onClickOutside = (event: MouseEvent) => {
      if (!rootRef.current) return;
      if (!rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    if (open) {
      document.addEventListener('mousedown', onClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', onClickOutside);
    };
  }, [open]);

    const colors = {
        bg: isDark ? 'bg-[#141446]' : 'bg-[#FFFFFF]',
        border: isDark ? 'border-[#3A4473]/50' : 'border-slate-200',
        label: isDark ? 'text-[#FFCE00]' : 'text-[#8B5CF6]',
        text: isDark ? 'text-[#DDE7FF]' : 'text-[#120533]',
        dropdown: isDark ? 'bg-[#141446]/95' : 'bg-white',
    };
    
  return (
    <div ref={rootRef} className="relative inline-flex font-[outfit] antialiased">
      <motion.button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        whileTap={{ scale: 0.97 }}
        // THE FIX: Increased px-5 and h-12 to stop the "cramped" feel
        className={`
          h-12 rounded-[18px] border px-5 inline-flex items-center gap-4 transition-all duration-500
          ${colors.bg} ${colors.border}
          ${open
            ? `shadow-[0_4px_20px_-12px_rgba(0,0,0,0.5)] ${isDark ? 'border-[#FFCE00]/50' : 'border-[#8B5CF6]/60'}`
            : 'shadow-[0_4px_20px_-12px_rgba(0,0,0,0.5)]'}
          backdrop-blur-xl
        `}
      >
        {/* ICON: Now with more margin-right to breathe */}
        <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-[8px] shadow-[0_4px_12px_rgba(0,0,0,0.18)] ${isDark ? 'bg-gradient-to-br from-[#FFCE00] to-[#FFAA00]' : 'bg-gradient-to-r from-[#9333ea] to-[#ec4899]'}`}>
          <span className={`text-[11px] font-black ${isDark ? 'text-[#141446]' : 'text-white'}`}>{selectedInitial}</span>
        </div>

        {/* TYPOGRAPHY: Editorial spacing fix */}
        <div className="flex flex-col items-start text-left">
          <span className={`text-[8px] font-black uppercase tracking-[0.3em] ${colors.label} opacity-80 mb-0.5`}>
            Selected Project
          </span>
          <span className={`max-w-[160px] truncate text-[14px] font-bold tracking-tight ${colors.text}`}>
            {projectLabel}
          </span>
        </div>

        {/* CHEVRON: Pushed further right */}
        <motion.div
          animate={{ rotate: open ? 180 : 0 }}
          className={`ml-2 transition-colors ${open ? (isDark ? 'text-[#FFCE00]' : 'text-[#8B5CF6]') : 'text-slate-400'}`}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </motion.div>
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 15, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 15, scale: 0.98 }}
            transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
            className={`absolute left-0 top-full mt-4 w-80 rounded-[28px] border p-3 z-50 shadow-[0_4px_20px_-12px_rgba(0,0,0,0.5)] backdrop-blur-2xl ${colors.dropdown} ${colors.border}`}
          >
            {/* HEADER */}
            <div className="px-3 py-2 mb-2">
              <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-500 opacity-60">
                Workspaces
              </p>
            </div>

            <div className="space-y-1 overflow-y-auto max-h-[320px] custom-scrollbar pr-1">
              {projects.map((project) => {
                const active = String(selectedProjectId || '') === String(project.id || '');
                return (
                  <button
                    key={project.id}
                    type="button"
                    onClick={() => { setSelectedProjectId(String(project.id)); setOpen(false); }}
                    className={`
                      group w-full flex items-center gap-4 px-3 py-3 rounded-[16px] transition-all duration-300
                      ${active 
                        ? (isDark ? 'bg-[#FFCE00]/10 border border-[#FFCE00]/20' : 'bg-[#8B5CF6]/10 border border-[#8B5CF6]/25')
                        : (isDark ? 'hover:bg-white/5 border border-transparent' : 'hover:bg-[#8B5CF6]/5 border border-transparent')
                      }
                    `}
                  >
                    <div className={`
                      w-9 h-9 rounded-xl flex items-center justify-center font-black text-[12px] shrink-0 transition-transform group-hover:scale-105
                      ${active ? (isDark ? 'bg-[#FFCE00] text-[#141446]' : 'bg-gradient-to-r from-[#9333ea] to-[#ec4899] text-white') : (isDark ? 'bg-[#3A4473]/30 text-[#A8B8DF]' : 'bg-slate-100 text-slate-500')}
                    `}>
                      {project.title?.charAt(0) || 'U'}
                    </div>

                    <div className="flex flex-col items-start truncate">
                      <span className={`text-[13px] font-bold truncate ${active ? (isDark ? 'text-[#FFCE00]' : 'text-[#8B5CF6]') : (isDark ? 'text-[#B8C6E8] group-hover:text-white' : 'text-slate-700 group-hover:text-[#8B5CF6]')}`}>
                        {project.title}
                      </span>
                      <span className="text-[9px] font-medium uppercase tracking-wider text-slate-500">
                        Website Project
                      </span>
                    </div>

                    {active && (
                      <div className={`ml-auto w-1.5 h-1.5 rounded-full ${isDark ? 'bg-[#FFCE00] shadow-[0_0_12px_#FFCE00]' : 'bg-[#8B5CF6] shadow-[0_0_10px_rgba(139,92,246,0.75)]'}`} />
                    )}
                  </button>
                );
              })}
            </div>   
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}