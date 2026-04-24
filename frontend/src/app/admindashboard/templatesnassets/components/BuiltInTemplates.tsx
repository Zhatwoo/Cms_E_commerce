'use client';

import React from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';

interface Template {
  id: string;
  name: string;
  category: string;
  thumbnail: string;
}

interface BuiltInTemplatesProps {
  templates: Template[];
}

export default function BuiltInTemplates({ templates }: BuiltInTemplatesProps) {
  return (
    <motion.div
      key="builtin"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.3 }}
      className="space-y-5"
    >
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
        {templates.map((template) => {
          return (
            <motion.div
              key={template.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.24 }}
              className="group relative flex flex-col overflow-hidden cursor-pointer rounded-[24px] border border-[rgba(177,59,255,0.18)] bg-white shadow-[0_12px_30px_rgba(71,19,150,0.12)]"
            >
              <div className="relative h-48 w-full overflow-hidden bg-[#DAD6F8] sm:h-52">
                {template.thumbnail ? (
                  <Image src={template.thumbnail} alt={template.name} fill className="object-cover transition-transform duration-700 group-hover:scale-105" unoptimized />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#8FC67E] via-[#4F805C] to-[#1E3C3C]">
                    <span className="text-lg font-semibold text-white/90">{template.category}</span>
                  </div>
                )}

                <div className="absolute left-3 top-3 z-10 flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider shadow-sm"
                  style={{ background: 'rgba(255,255,255,0.95)', border: '1px solid rgba(166,61,255,0.12)', color: '#7a5b00' }}>
                  <span className="h-1.5 w-1.5 rounded-full bg-[#f5c000]" />
                  Draft
                </div>

                <div className="absolute bottom-3 left-3 z-10 rounded-lg px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider"
                  style={{ background: 'rgba(74,26,138,0.75)', color: 'white', backdropFilter: 'blur(6px)' }}>
                  {template.category || 'General'}
                </div>
              </div>

              <div className="flex flex-1 flex-col p-5">
                <div className="mb-4 flex-1">
                  <h4 className="truncate text-[0.95rem] font-bold tracking-tight leading-snug" style={{ color: '#2d1a50' }} title={template.name}>
                    {template.name}
                  </h4>
                  <div className="mt-1.5 flex items-center gap-2">
                    <div className="flex h-5 w-5 items-center justify-center rounded-full shrink-0" style={{ background: 'rgba(166,61,255,0.1)' }}>
                      <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20" style={{ color: '#9b6fdb' }}>
                        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <p className="truncate text-[11px] font-semibold" style={{ color: '#a090c8' }}>Built-in template</p>
                  </div>
                </div>

                <div className="rounded-[18px] p-2" style={{ background: 'rgba(240,235,255,0.7)', border: '1px solid rgba(166,61,255,0.09)' }}>
                  <div className="grid grid-cols-3 gap-1.5 text-center text-[9px] font-bold uppercase tracking-wider">
                    <span style={{ color: '#7b1de8' }}>Preview</span>
                    <span style={{ color: '#7b1de8' }}>Built-in</span>
                    <span style={{ color: '#7b1de8' }}>Ready</span>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {templates.length === 0 && (
        <div className="admin-dashboard-inset-panel rounded-2xl border border-[rgba(177,59,255,0.2)] px-6 py-10 text-center">
          <p className="text-base font-medium text-[#471396]">No templates found matching your search.</p>
        </div>
      )}
    </motion.div>
  );
}
