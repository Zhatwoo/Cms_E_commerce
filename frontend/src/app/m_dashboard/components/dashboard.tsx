'use client';
import React from 'react';

const BriefcaseIcon = () => (
    <svg
        viewBox="0 0 24 24"
        aria-hidden="true"
        className="h-6 w-6"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
        <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
    </svg>
);

const ArrowUpIcon = () => (
    <svg
        viewBox="0 0 24 24"
        aria-hidden="true"
        className="h-6 w-6"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        <line x1="12" y1="19" x2="12" y2="5" />
        <polyline points="5 12 12 5 19 12" />
    </svg>
);

const RefreshIcon = () => (
    <svg
        viewBox="0 0 24 24"
        aria-hidden="true"
        className="h-6 w-6"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        <polyline points="23 4 23 10 17 10" />
        <polyline points="1 20 1 14 7 14" />
        <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
    </svg>
);

const FilterIcon = () => (
    <svg
        viewBox="0 0 24 24"
        aria-hidden="true"
        className="h-5 w-5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
    </svg>
);

export function DashboardContent() {
    return (
        <main className="flex-1 text-white overflow-y-auto">
            <div className="p-6 space-y-6">
                <h1 className="text-3xl font-bold text-white">Dashboard</h1>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white/20 backdrop-blur-xl rounded-lg p-6 flex items-center justify-between border border-white/20 shadow-2xl">
                        <div>
                            <p className="text-sm text-gray-300 mb-2 font-medium">Total Projects</p>
                            <p className="text-3xl font-bold text-white">123,456</p>
                        </div>
                        <div className="text-white">
                            <BriefcaseIcon />
                        </div>
                    </div>

                    <div className="bg-black/30 backdrop-blur-xl rounded-lg p-6 flex items-center justify-between border border-white/10 shadow-2xl">
                        <div>
                            <p className="text-sm text-gray-400 mb-2">Published Sites</p>
                            <p className="text-3xl font-bold text-white">123,456</p>
                            <div className="flex items-center gap-1 mt-1">
                                <p className="text-xs text-gray-400">123,456</p>
                                <svg viewBox="0 0 24 24" className="h-3 w-3 text-gray-400" fill="currentColor">
                                    <path d="M7 14l5-5 5 5z" />
                                </svg>
                            </div>
                        </div>
                        <div className="text-white">
                            <ArrowUpIcon />
                        </div>
                    </div>

                    <div className="bg-black/30 backdrop-blur-xl rounded-lg p-6 flex items-center justify-between border border-white/10 shadow-2xl">
                        <div>
                            <p className="text-sm text-gray-400 mb-2">Under Review</p>
                            <p className="text-3xl font-bold text-white">123,456</p>
                        </div>
                        <div className="text-white">
                            <RefreshIcon />
                        </div>
                    </div>
                </div>

                {/* Analytics + Usage */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    <div className="lg:col-span-2 bg-black/25 backdrop-blur-xl rounded-lg p-6 flex items-center justify-center min-h-[300px] border border-white/10 shadow-2xl">
                        <p className="text-gray-400 text-lg">Sample Analytics</p>
                    </div>

                    <div className="bg-black/25 backdrop-blur-xl rounded-lg p-6 border border-white/10 shadow-2xl">
                        <h3 className="text-lg font-semibold text-white mb-4">Usage Summary</h3>
                        <div className="flex items-center justify-center">
                            <div className="relative w-40 h-40">
                                <svg className="transform -rotate-90" width="160" height="160">
                                    <circle
                                        cx="80"
                                        cy="80"
                                        r="70"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="16"
                                        className="text-gray-700/50"
                                    />
                                    <circle
                                        cx="80"
                                        cy="80"
                                        r="70"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="16"
                                        strokeDasharray={`${2 * Math.PI * 70 * 0.35} ${2 * Math.PI * 70}`}
                                        className="text-gray-400"
                                        strokeLinecap="round"
                                    />
                                </svg>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Projects / Websites */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-2xl font-bold text-white">Projects / Websites</h2>
                        <button
                            type="button"
                            className="p-2 text-gray-400 hover:text-white transition-all hover:bg-white/10 rounded-lg backdrop-blur-sm border border-transparent hover:border-white/10"
                            aria-label="Filter"
                        >
                            <FilterIcon />
                        </button>
                    </div>

                    <div className="bg-white/25 backdrop-blur-xl rounded-lg p-6 min-h-[200px] flex items-center justify-center border border-white/25 shadow-2xl">
                        <p className="text-gray-900 font-bold text-lg">Web Preview</p>
                    </div>

                    <div className="bg-black/25 backdrop-blur-xl rounded-lg border border-white/10 shadow-2xl">
                        <div className="p-4">
                            <div className="grid grid-cols-4 gap-4 border-b border-white/10 pb-2 mb-2">
                                <div className="text-sm text-gray-400">Column 1</div>
                                <div className="text-sm text-gray-400">Column 2</div>
                                <div className="text-sm text-gray-400">Column 3</div>
                                <div className="text-sm text-gray-400">Column 4</div>
                            </div>
                            <div className="space-y-2">
                                {[1, 2, 3].map((row) => (
                                    <div
                                        key={row}
                                        className="grid grid-cols-4 gap-4 py-2 border-b border-white/10 last:border-b-0"
                                    >
                                        <div className="text-sm text-gray-300">Row {row} Col 1</div>
                                        <div className="text-sm text-gray-300">Row {row} Col 2</div>
                                        <div className="text-sm text-gray-300">Row {row} Col 3</div>
                                        <div className="text-sm text-gray-300">Row {row} Col 4</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}