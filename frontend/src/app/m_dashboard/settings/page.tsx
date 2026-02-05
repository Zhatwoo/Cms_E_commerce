'use client';
import React from 'react';

export default function SettingsPage() {
    return (
        <section className="space-y-6">
            <header>
                <h1 className="text-2xl font-semibold text-white">Settings</h1>
                <p className="mt-1 text-sm text-gray-400">
                    Configure your workspace preferences and site-wide options.
                </p>
            </header>

            <div className="space-y-4">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-5 shadow-lg">
                    <h2 className="text-sm font-medium text-white">General</h2>
                    <p className="mt-1 text-xs text-gray-400">
                        Basic details about your workspace and default behaviors.
                    </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/5 p-5 shadow-lg">
                    <h2 className="text-sm font-medium text-white">Notifications</h2>
                    <p className="mt-1 text-xs text-gray-400">
                        Control when and how you&apos;re notified about activity in your sites.
                    </p>
                </div>
            </div>
        </section>
    );
}

//sample