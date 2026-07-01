'use client';

import React from 'react';
import { ThemeProvider } from '@/app/m_dashboard/components/context/theme-context';
import { AlertProvider } from '@/app/m_dashboard/components/context/alert-context';
import { AuthProvider } from '@/app/m_dashboard/components/context/auth-context';

export default function DesignLayout({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <AlertProvider>
        <AuthProvider>{children}</AuthProvider>
      </AlertProvider>
    </ThemeProvider>
  );
}
