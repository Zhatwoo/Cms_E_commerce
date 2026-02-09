'use client';
import React from 'react';
import { useTheme } from './components/theme-context';
import { useAuth } from './components/auth-context';
import { DashboardContent } from './dashboard';

export default function MDashboardPage() {
    const { user } = useAuth();
    const { colors } = useTheme();

    const userName = user?.name || user?.email || 'User';

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold" style={{ color: colors.text.primary }}>
                    Welcome back, {userName}
                </h1>
                <p className="text-sm mt-1" style={{ color: colors.text.secondary }}>
                    Here is an overview of your workspace.
                </p>
            </div>
            <DashboardContent />
        </div>
    );
}