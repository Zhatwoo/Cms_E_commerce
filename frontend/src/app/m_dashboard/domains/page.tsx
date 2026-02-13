// shet to, ala pa idea pano gawen functional

'use client';
import React from 'react';
import { useTheme } from '../components/context/theme-context';

export default function DomainsPage() {
    const { colors, theme } = useTheme();
    return (
        <section className="space-y-6">
            <header>
                <h1 className="text-2xl font-semibold" style={{ color: colors.text.primary }}>Domains</h1>
                <p className="mt-1 text-sm" style={{ color: colors.text.secondary }}>
                    Connect and manage domains for your published sites.
                </p>
            </header>

            <div
                className="rounded-2xl border p-6 shadow-lg flex items-center justify-between transition-colors"
                style={{
                    backgroundColor: colors.bg.card,
                    borderColor: colors.border.faint
                }}
            >
                <div>
                    <p className="text-sm font-medium" style={{ color: colors.text.primary }}>No domains connected yet</p>
                    <p className="text-xs mt-1" style={{ color: colors.text.muted }}>
                        When you publish your website, you&apos;ll be able to attach custom domains here.
                    </p>
                </div>
                <button
                    type="button"
                    className="px-4 py-2 text-sm font-medium rounded-lg transition-colors"
                    style={{
                        backgroundColor: colors.text.primary,
                        color: colors.bg.primary
                    }}
                >
                    Add domain
                </button>
            </div>
        </section>
    );
}

