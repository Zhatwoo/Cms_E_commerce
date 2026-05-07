'use client';

import React from 'react';
import { motion } from 'framer-motion';

type AdminPageHeroProps = {
  title: string;
  subtitle: string;
  rightContent?: React.ReactNode;
  className?: string;
};

export function AdminPageHero({ title, subtitle, rightContent, className = '' }: AdminPageHeroProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={`mb-6 rounded-3xl border border-[rgba(177,59,255,0.29)] bg-gradient-to-br from-[#FDFBFF] via-[#F8F2FF] to-[#F3E8FF] px-5 py-6 shadow-[0_10px_32px_rgba(177,59,255,0.14)] sm:px-7 ${className}`}
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[#26155E] sm:text-4xl">{title}</h1>
          <p className="mt-1 text-sm font-medium text-[#7E4FB4] sm:text-base">{subtitle}</p>
        </div>
        {rightContent ? <div className="shrink-0">{rightContent}</div> : null}
      </div>
    </motion.div>
  );
}
