'use client';

import React from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';

interface Template {
  id: string;
  name: string;
  category: string;
  username?: string;
  domainName?: string;
  thumbnail: string;
}

interface UserTemplatesProps {
  templates: Template[];
}

export default function UserTemplates({ templates }: UserTemplatesProps) {
  return (
    <motion.div
      key="user"
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
              className="overflow-hidden rounded-[2px] border border-[rgba(177,59,255,0.22)] bg-white/35 shadow-[0_8px_22px_rgba(71,19,150,0.16)]"
            >
              <div className="relative h-48 w-full overflow-hidden bg-[#DAD6F8] sm:h-52">
                {template.thumbnail ? (
                  <Image src={template.thumbnail} alt={template.name} fill className="object-cover" unoptimized />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#8FC67E] via-[#4F805C] to-[#1E3C3C]">
                    <span className="text-lg font-semibold text-white/90">{template.category}</span>
                  </div>
                )}
              </div>

              <div className="bg-gradient-to-r from-[#8F29E8] to-[#B13BFF] px-4 py-4 text-center">
                <p className="truncate text-[2rem] font-semibold leading-none text-white">{template.name}</p>
                <p className="mt-1 text-sm font-medium text-white/90">
                  {template.username ? `By ${template.username}` : 'By user'}
                </p>
                <p className="mt-1 text-xs font-medium text-white/80">
                  {template.domainName || 'Created on: January 1, 2026'}
                </p>
              </div>
            </motion.div>
          );
        })}
      </div>

      {templates.length === 0 && (
        <div className="admin-dashboard-inset-panel rounded-2xl border border-[rgba(177,59,255,0.2)] px-6 py-10 text-center">
          <p className="text-base font-medium text-[#471396]">No user templates found matching your search.</p>
        </div>
      )}
    </motion.div>
  );
}
