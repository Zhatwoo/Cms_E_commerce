'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useProject } from '../context/project-context';

export function ProjectSwitchPill() {
  const { projects, selectedProject, selectedProjectId, setSelectedProjectId, loading } = useProject();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  const projectLabel = useMemo(() => {
    if (loading) return 'Loading...';
    if (!projects.length) return 'No Project';
    return (selectedProject?.title || 'Untitled').trim() || 'Untitled';
  }, [loading, projects.length, selectedProject?.title]);

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

  return (
    <div ref={rootRef} className="relative inline-flex">
      <motion.button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        whileTap={{ scale: 0.97 }}
        className="h-10 rounded-full border px-3 inline-flex items-center gap-2"
        style={{
          borderColor: '#3A4473',
          backgroundColor: 'rgba(18, 25, 53, 0.9)',
          color: '#DDE7FF',
        }}
        title="Switch project"
      >
        <span className="max-w-[130px] truncate text-xs font-medium">{projectLabel}</span>
        <span
          className="h-5 px-2 rounded-full text-[10px] font-semibold inline-flex items-center"
          style={{ backgroundColor: 'rgba(151, 166, 210, 0.15)', color: '#A8B8DF' }}
        >
          Switch
        </span>
        <motion.svg
          className="w-3.5 h-3.5"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.18 }}
          style={{ color: '#A8B8DF' }}
        >
          <path d="M6 9l6 6 6-6" />
        </motion.svg>
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
            className="absolute left-1/2 top-full mt-2 -translate-x-1/2 w-64 rounded-xl border p-1.5 z-40"
            style={{ borderColor: '#3A4473', backgroundColor: '#12193A' }}
          >
            {projects.length === 0 ? (
              <div className="px-3 py-2 text-xs" style={{ color: '#8EA1D0' }}>
                {loading ? 'Loading projects...' : 'No projects found'}
              </div>
            ) : (
              projects.map((project) => {
                const active = selectedProjectId === project.id;
                return (
                  <button
                    key={project.id}
                    type="button"
                    onClick={() => {
                      setSelectedProjectId(project.id);
                      setOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 rounded-lg text-xs transition-colors"
                    style={{
                      backgroundColor: active ? 'rgba(59,130,246,0.22)' : 'transparent',
                      color: active ? '#E8F0FF' : '#B8C6E8',
                    }}
                  >
                    {project.title || 'Untitled Project'}
                  </button>
                );
              })
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
