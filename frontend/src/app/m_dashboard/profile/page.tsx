'use client';
import React from 'react';

export default function ProfilePage() {
    return (
        <section className="space-y-6">
            <header className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-gray-200">
                    <span className="text-lg font-semibold">J</span>
                </div>
                <div>
                    <h1 className="text-2xl font-semibold text-white">Profile</h1>
                    <p className="mt-1 text-sm text-gray-400">
                        View and update your personal information and account details.
                    </p>
                </div>
            </header>

            <div className="grid gap-5 md:grid-cols-2">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-5 shadow-lg space-y-3">
                    <h2 className="text-sm font-medium text-white">Account</h2>
                    <div className="space-y-1 text-xs text-gray-300">
                        <p>
                            <span className="text-gray-400">Name:</span> Juan Dela Cruz
                        </p>
                        <p>
                            <span className="text-gray-400">Role:</span> Website Owner
                        </p>
                        <p>
                            <span className="text-gray-400">Email:</span> you@example.com
                        </p>
                    </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/5 p-5 shadow-lg space-y-3">
                    <h2 className="text-sm font-medium text-white">Security</h2>
                    <p className="text-xs text-gray-400">
                        Password and sign-in settings will appear here in a future update.
                    </p>
                </div>
            </div>
        </section>
    );
}

