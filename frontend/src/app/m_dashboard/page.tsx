'use client';
import React, { useState } from 'react';
import { useTheme } from './components/context/theme-context';
import { useAuth } from './components/context/auth-context';
import { useProject } from './components/context/project-context';
import { deleteProject, type Project } from '@/lib/api';
import { DashboardContent } from './dashboard/page';

function ProjectSelectionScreen() {
    const { colors } = useTheme();
    const { projects, loading, selectedProjectId, setSelectedProjectId, refreshProjects } = useProject();
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [confirmTarget, setConfirmTarget] = useState<Project | null>(null);
    const [menuOpenId, setMenuOpenId] = useState<string | null>(null);

    if (loading) {
        return (
            <div
                className="flex items-center justify-center min-h-[60vh]"
                style={{ color: colors.text.secondary }}
            >
                <p className="text-sm">Loading your websites…</p>
            </div>
        );
    }

    const hasProjects = projects && projects.length > 0;

    return (
        <div className="flex items-center justify-center min-h-[60vh]">
            <div
                className="w-full max-w-xl rounded-2xl border p-6 sm:p-8 space-y-6"
                style={{
                    backgroundColor: colors.bg.card,
                    borderColor: colors.border.faint,
                }}
            >
                <div className="space-y-1">
                    <h1
                        className="text-xl sm:text-2xl font-semibold tracking-tight"
                        style={{ color: colors.text.primary }}
                    >
                        Create or select a website
                    </h1>
                    <p
                        className="text-sm"
                        style={{ color: colors.text.muted }}
                    >
                        Choose which store you want to work on.
                    </p>
                </div>

                {hasProjects ? (
                    <div className="space-y-4">
                        <div className="space-y-2 max-h-72 overflow-y-auto">
                            {projects.map((project) => {
                                const isActive = project.id === selectedProjectId;
                                const isDeleting = deletingId === project.id;
                                return (
                                    <div
                                        key={project.id}
                                        className="w-full rounded-xl border px-4 py-3 flex items-center justify-between gap-3"
                                        style={{
                                            borderColor: isActive ? colors.status.info : colors.border.faint,
                                            backgroundColor: isActive ? colors.bg.elevated : colors.bg.card,
                                        }}
                                    >
                                        <button
                                            type="button"
                                            onClick={() => setSelectedProjectId(project.id)}
                                            className="flex-1 min-w-0 text-left"
                                        >
                                            <p
                                                className="text-sm font-medium truncate"
                                                style={{ color: colors.text.primary }}
                                            >
                                                {project.title || 'Untitled website'}
                                            </p>
                                            {project.subdomain && (
                                                <p
                                                    className="text-xs mt-0.5 font-mono truncate"
                                                    style={{ color: colors.text.muted }}
                                                >
                                                    {project.subdomain}
                                                </p>
                                            )}
                                        </button>
                                        <div className="flex items-center gap-1 shrink-0 relative">
                                            <span
                                                className="text-[11px] px-2 py-1 rounded-full capitalize"
                                                style={{
                                                    backgroundColor: colors.bg.elevated,
                                                    color: colors.text.muted,
                                                }}
                                            >
                                                {project.status || 'draft'}
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setMenuOpenId((prev) =>
                                                        prev === project.id ? null : project.id
                                                    )
                                                }
                                                className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10"
                                                style={{ color: colors.text.muted }}
                                                aria-label="More actions"
                                            >
                                                <svg
                                                    viewBox="0 0 24 24"
                                                    aria-hidden="true"
                                                    className="h-4 w-4"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    strokeWidth="2"
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                >
                                                    <circle cx="12" cy="5" r="1" />
                                                    <circle cx="12" cy="12" r="1" />
                                                    <circle cx="12" cy="19" r="1" />
                                                </svg>
                                            </button>
                                            {menuOpenId === project.id && (
                                                <div
                                                    className="absolute right-0 top-8 z-20 w-40 rounded-lg border shadow-lg bg-white dark:bg-[#111113]"
                                                    style={{ borderColor: colors.border.faint }}
                                                >
                                                    <button
                                                        type="button"
                                                        className="w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-black/5 dark:hover:bg-white/10"
                                                        style={{ color: colors.text.primary }}
                                                        onClick={() => {
                                                            // Later: wire up rename modal
                                                            setMenuOpenId(null);
                                                        }}
                                                    >
                                                        <svg
                                                            viewBox="0 0 24 24"
                                                            aria-hidden="true"
                                                            className="h-3.5 w-3.5"
                                                            fill="none"
                                                            stroke="currentColor"
                                                            strokeWidth="2"
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                        >
                                                            <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25z" />
                                                            <path d="M14.06 4.94l3.75 3.75L21 5.5 17.5 2l-3.44 2.94z" />
                                                        </svg>
                                                        <span>Rename (soon)</span>
                                                    </button>
                                                    <button
                                                        type="button"
                                                        disabled={isDeleting || project.status === 'published'}
                                                        className={`w-full flex items-center gap-2 px-3 py-2 text-xs transition-colors ${project.status === 'published' ? 'opacity-40 cursor-not-allowed' : 'hover:bg-red-500/10'}`}
                                                        style={{
                                                            color: project.status === 'published' ? colors.text.muted : '#ef4444',
                                                        }}
                                                        onClick={() => {
                                                            setMenuOpenId(null);
                                                            setConfirmTarget(project);
                                                        }}
                                                        title={project.status === 'published' ? "Unpublish this site first to delete it" : "Move to trash"}
                                                    >
                                                        <svg
                                                            viewBox="0 0 24 24"
                                                            aria-hidden="true"
                                                            className="h-3.5 w-3.5"
                                                            fill="none"
                                                            stroke="currentColor"
                                                            strokeWidth="2"
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                        >
                                                            <polyline points="3 6 5 6 21 6" />
                                                            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                                                            <path d="M10 11v6" />
                                                            <path d="M14 11v6" />
                                                            <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                                                        </svg>
                                                        <span>{project.status === 'published' ? 'Published' : 'Delete'}</span>
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                            <button
                                type="button"
                                onClick={() => window.location.assign('/m_dashboard/web-builder?autoCreate=1')}
                                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium shadow-sm"
                                style={{
                                    backgroundColor: colors.text.primary,
                                    color: colors.bg.primary,
                                }}
                            >
                                <span
                                    className="flex h-4 w-4 items-center justify-center rounded-full"
                                    style={{ backgroundColor: colors.bg.card }}
                                >
                                    <svg
                                        viewBox="0 0 24 24"
                                        aria-hidden="true"
                                        className="h-3 w-3"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    >
                                        <path d="M12 5v14M5 12h14" />
                                    </svg>
                                </span>
                                <span>Create another website</span>
                            </button>
                            <p
                                className="text-[11px]"
                                style={{ color: colors.text.muted }}
                            >
                                Tip: you can manage domains and advanced settings later from the dashboard.
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-5">
                        <p
                            className="text-sm"
                            style={{ color: colors.text.muted }}
                        >
                            You don&apos;t have any websites yet. Create your first store to start
                            selling.
                        </p>
                        <button
                            type="button"
                            onClick={() => window.location.assign('/m_dashboard/web-builder?autoCreate=1')}
                            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium shadow-sm"
                            style={{
                                backgroundColor: colors.text.primary,
                                color: colors.bg.primary,
                            }}
                        >
                            <span
                                className="flex h-5 w-5 items-center justify-center rounded-full"
                                style={{ backgroundColor: colors.bg.card }}
                            >
                                <svg
                                    viewBox="0 0 24 24"
                                    aria-hidden="true"
                                    className="h-3.5 w-3.5"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                >
                                    <path d="M12 5v14M5 12h14" />
                                </svg>
                            </span>
                            <span>Create website</span>
                        </button>
                    </div>
                )}
            </div>

            {/* Delete confirmation modal */}
            {confirmTarget && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div
                        className="w-full max-w-sm rounded-2xl border shadow-2xl bg-white dark:bg-[#111113]"
                        style={{ borderColor: colors.border.faint }}
                    >
                        <div className="p-5 space-y-3">
                            <h2 className="text-lg font-semibold" style={{ color: colors.text.primary }}>
                                Move to trash?
                            </h2>
                            <p className="text-sm" style={{ color: colors.text.muted }}>
                                This will move{' '}
                                <span className="font-semibold" style={{ color: colors.text.primary }}>
                                    {confirmTarget.title || 'this website'}
                                </span>
                                {' '}to the trash. You can restore it later if you change your mind.
                            </p>
                        </div>
                        <div className="px-5 pb-4 flex items-center justify-end gap-2">
                            <button
                                type="button"
                                onClick={() => confirmTarget && setConfirmTarget(null)}
                                className="px-3 py-1.5 rounded-lg text-sm font-medium border"
                                style={{ borderColor: colors.border.faint, color: colors.text.primary }}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                disabled={deletingId === confirmTarget.id}
                                onClick={async () => {
                                    if (!confirmTarget) return;
                                    setDeletingId(confirmTarget.id);
                                    try {
                                        await deleteProject(confirmTarget.id);
                                        await refreshProjects();
                                        if (selectedProjectId === confirmTarget.id) {
                                            setSelectedProjectId(null);
                                        }
                                    } catch {
                                        // ignore for now
                                    } finally {
                                        setDeletingId(null);
                                        setConfirmTarget(null);
                                    }
                                }}
                                className="px-3 py-1.5 rounded-lg text-sm font-medium"
                                style={{ backgroundColor: '#ef4444', color: '#ffffff' }}
                            >
                                {deletingId === confirmTarget.id ? 'Moving…' : 'Move to trash'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default function MDashboardPage() {
    const { user } = useAuth();

    const userName = user?.name || user?.email || 'User';

    return (
        <DashboardContent userName={userName} />
    );
}
