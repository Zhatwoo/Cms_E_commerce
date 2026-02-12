'use client';
import React from 'react';
import { useTheme } from './components/context/theme-context';
import { useAuth } from './components/context/auth-context';
import { DashboardContent } from './dashboard/page';

export default function MDashboardPage() {
    const { user } = useAuth();
    const { colors } = useTheme();

    const userName = user?.name || user?.email || 'User';

    return (
        <DashboardContent userName={userName} />
    );
}