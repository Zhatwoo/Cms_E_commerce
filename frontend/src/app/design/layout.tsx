'use client';

import React from 'react';
import { ThemeProvider } from '@/app/m_dashboard/components/context/theme-context';
import { AlertProvider } from '@/app/m_dashboard/components/context/alert-context';

export default function DesignLayout({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <AlertProvider>{children}</AlertProvider>
    </ThemeProvider>
  );
}
