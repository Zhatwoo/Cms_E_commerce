import React from 'react';

const SearchIcon = () => (
    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
);

const MailIcon = () => (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
);

const SettingsIcon = () => (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
        <path d="M12 8.5a3.5 3.5 0 100 7 3.5 3.5 0 000-7z" stroke="currentColor" strokeWidth="1.5" />
        <path d="M19.4 15a1.8 1.8 0 00.35 2l.02.02a2 2 0 01-2.83 2.83l-.02-.02a1.8 1.8 0 00-2-.35 1.8 1.8 0 00-1 1.6V21a2 2 0 01-4 0v-.01a1.8 1.8 0 00-1-1.6 1.8 1.8 0 00-2 .35l-.02.02a2 2 0 01-2.83-2.83l.02-.02a1.8 1.8 0 00.35-2 1.8 1.8 0 00-1.6-1H3a2 2 0 010-4h.01a1.8 1.8 0 001.6-1 1.8 1.8 0 00-.35-2l-.02-.02a2 2 0 012.83-2.83l.02.02a1.8 1.8 0 002 .35h.01a1.8 1.8 0 001-1.6V3a2 2 0 014 0v.01a1.8 1.8 0 001 1.6 1.8 1.8 0 002-.35l.02-.02a2 2 0 012.83 2.83l-.02.02a1.8 1.8 0 00-.35 2v.01a1.8 1.8 0 001.6 1H21a2 2 0 010 4h-.01a1.8 1.8 0 00-1.6 1z" stroke="currentColor" strokeWidth="1.5" />
    </svg>
);

const ProfileIcon = () => (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
);

export function AdminHeader() {
    return (
        <header className="bg-black text-white border-b border-gray-800">
            <div className="px-6 py-3 flex items-center justify-between gap-4">
                {/* Left: Search */}
                <div className="flex-1 max-w-sm">
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Search"
                            className="w-full pl-4 pr-10 py-2 bg-white text-gray-900 text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                            <SearchIcon />
                        </div>
                    </div>
                </div>

                {/* Right: Icons */}
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        className="p-2 text-white hover:bg-gray-800 rounded-lg transition-colors"
                        aria-label="Mail"
                    >
                        <MailIcon />
                    </button>

                    <button
                        type="button"
                        className="p-2 text-white hover:bg-gray-800 rounded-lg transition-colors"
                        aria-label="Settings"
                    >
                        <SettingsIcon />
                    </button>

                    <button
                        type="button"
                        className="p-2 text-white hover:bg-gray-800 rounded-lg transition-colors"
                        aria-label="Profile"
                    >
                        <ProfileIcon />
                    </button>
                </div>
            </div>
        </header>
    );
}
