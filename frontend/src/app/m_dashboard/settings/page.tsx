'use client';
import React from 'react';
import { useTheme } from '../components/context/theme-context';

export default function SettingsPage() {
    const { colors, theme } = useTheme();

    return (
        <section className="space-y-6">
            <header>
                <h1 className="text-2xl font-semibold" style={{ color: colors.text.primary }}>Settings</h1>
                <p className="mt-1 text-sm" style={{ color: colors.text.secondary }}>
                    Configure your workspace preferences and site-wide options.
                </p>
            </header>

            <div className="space-y-4">
                <div
                    className="rounded-2xl border p-5 shadow-lg transition-colors"
                    style={{
                        backgroundColor: colors.bg.card,
                        borderColor: colors.border.faint
                    }}
                >
                    <h2 className="text-sm font-medium" style={{ color: colors.text.primary }}>General</h2>
                    <p className="mt-1 text-xs" style={{ color: colors.text.muted }}>
                        Basic details about your workspace and default behaviors.
                    </p>
                </div>

                <div
                    className="rounded-2xl border p-5 shadow-lg transition-colors"
                    style={{
                        backgroundColor: colors.bg.card,
                        borderColor: colors.border.faint
                    }}
                >
                    <h2 className="text-sm font-medium" style={{ color: colors.text.primary }}>Notifications</h2>
                    <p className="mt-1 text-xs" style={{ color: colors.text.muted }}>
                        Control when and how you&apos;re notified about activity in your sites.
                    </p>
                </div>
            </div>
        </section>
    );
}

