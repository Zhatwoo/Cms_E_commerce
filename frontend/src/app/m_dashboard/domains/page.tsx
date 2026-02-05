'use client';
import React from 'react';

export default function DomainsPage() {
    return (
        <section className="space-y-6">
            <header>
                <h1 className="text-2xl font-semibold text-white">Domains</h1>
                <p className="mt-1 text-sm text-gray-400">
                    Connect and manage domains for your published sites.
                </p>
            </header>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-lg flex items-center justify-between">
                <div>
                    <p className="text-sm font-medium text-white">No domains connected yet</p>
                    <p className="text-xs text-gray-400 mt-1">
                        When you publish your website, you&apos;ll be able to attach custom domains here.
                    </p>
                </div>
                <button
                    type="button"
                    className="px-4 py-2 text-sm font-medium rounded-lg bg-white text-black hover:bg-gray-200 transition-colors"
                >
                    Add domain
                </button>
            </div>
        </section>
    );
}

//sample