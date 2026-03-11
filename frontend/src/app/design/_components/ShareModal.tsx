"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { useDesignProject } from "../../_contexts/DesignProjectContext";
import { apiFetch } from "@/lib/api";
import { createPortal } from "react-dom";
import {
    X,
    Copy,
    Check,
    UserPlus,
    Link2,
    ChevronDown,
    Trash2,
    Mail,
    Users,
    ShieldCheck,
    Eye,
} from "lucide-react";


type Permission = "editor" | "viewer";

interface Collaborator {
    id: string;
    email: string;
    displayName: string;
    color: string;
    permission: Permission;
    status: "active" | "pending";
}

interface Props {
    projectId: string;
    projectTitle?: string;
    isOpen: boolean;
    onClose: () => void;
    myPermission?: "owner" | "editor" | "viewer";
}

const PERMISSION_LABELS: Record<Permission, { label: string; icon: React.ReactNode }> = {
    editor: { label: "Can edit", icon: <ShieldCheck className="w-3.5 h-3.5" /> },
    viewer: { label: "Can view", icon: <Eye className="w-3.5 h-3.5" /> },
};

export const ShareModal: React.FC<Props> = ({ projectId, projectTitle, isOpen, onClose, myPermission = "editor" }) => {
    const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
    const [email, setEmail] = useState("");
    const [permission, setPermission] = useState<Permission>("editor");
    const [loading, setLoading] = useState(false);
    const [inviteError, setInviteError] = useState<string | null>(null);
    const [inviteSuccess, setInviteSuccess] = useState(false);
    const [copiedLink, setCopiedLink] = useState(false);
    const [permDropdown, setPermDropdown] = useState<string | null>(null);
    const [removingCollab, setRemovingCollab] = useState<Collaborator | null>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const loadCollaborators = useCallback(async () => {
        try {
            const data = await apiFetch<{ success: boolean; collaborators: Collaborator[] }>(`/api/collaboration/${projectId}/collaborators`);
            if (data.success) setCollaborators(data.collaborators || []);
        } catch (err) {
            console.error("Failed to load collaborators:", err);
        }
    }, [projectId]);

    useEffect(() => {
        if (isOpen) loadCollaborators();
    }, [isOpen, loadCollaborators]);

    // Close dropdown on outside click
    useEffect(() => {
        if (!permDropdown) return;
        const handler = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setPermDropdown(null);
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, [permDropdown]);

    const handleInvite = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email.trim()) return;
        setLoading(true);
        setInviteError(null);
        setInviteSuccess(false);
        try {
            const data = await apiFetch<{ success: boolean; message?: string }>(`/api/collaboration/${projectId}/invite`, {
                method: "POST",
                body: JSON.stringify({ email: email.trim(), permission }),
            });
            if (data.success) {
                setEmail("");
                setInviteSuccess(true);
                loadCollaborators();
                setTimeout(() => setInviteSuccess(false), 3000);
            } else {
                setInviteError(data.message || "Failed to invite");
            }
        } catch (err: any) {
            setInviteError(err.message || "Network error");
        } finally {
            setLoading(false);
        }
    };

    const handleChangePermission = async (collabId: string, perm: Permission) => {
        setPermDropdown(null);
        setInviteError(null);
        try {
            const data = await apiFetch<{ success: boolean; message?: string }>(`/api/collaboration/${projectId}/collaborators/${collabId}`, {
                method: "PATCH",
                body: JSON.stringify({ permission: perm }),
            });
            if (data.success) {
                setCollaborators(prev =>
                    prev.map(c => c.id === collabId ? { ...c, permission: perm } : c)
                );
            } else {
                setInviteError(data.message || "Failed to update permission");
            }
        } catch (err: any) {
            setInviteError(err.message || "Network error while updating permission");
        }
    };

    const handleRemove = async (collabId: string) => {
        setPermDropdown(null);
        setInviteError(null);
        try {
            const data = await apiFetch<{ success: boolean; message?: string }>(`/api/collaboration/${projectId}/collaborators/${collabId}`, {
                method: "DELETE",
            });
            if (data.success) {
                setCollaborators(prev => prev.filter(c => c.id !== collabId));
            } else {
                setInviteError(data.message || "Failed to remove collaborator");
            }
        } catch (err: any) {
            setInviteError(err.message || "Network error while removing collaborator");
        }
    };

    const handleCopyLink = () => {
        const url = `${window.location.origin}/design?projectId=${projectId}`;
        navigator.clipboard.writeText(url).then(() => {
            setCopiedLink(true);
            setTimeout(() => setCopiedLink(false), 2500);
        });
    };

    if (!isOpen) return null;
    if (typeof document === "undefined") return null;

    return createPortal(
        <div
            className="fixed inset-0 z-[99999] flex items-center justify-center"
            onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

            {/* Modal */}
            <div
                className="relative z-10 w-full max-w-lg mx-4 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200"
                style={{
                    background: "linear-gradient(145deg, #1a1a2e 0%, #16213e 100%)",
                    border: "1px solid rgba(108, 143, 255, 0.2)",
                }}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-5 border-b border-white/10">
                    <div className="flex items-center gap-3">
                        <div
                            className="p-2 rounded-xl"
                            style={{ background: "rgba(108, 143, 255, 0.15)" }}
                        >
                            <Users className="w-4 h-4 text-blue-400" />
                        </div>
                        <div>
                            <h2 className="text-white font-semibold text-base leading-tight">Share project</h2>
                            {projectTitle && (
                                <p className="text-white/40 text-xs mt-0.5 truncate max-w-[240px]">{projectTitle}</p>
                            )}
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-lg hover:bg-white/5 transition-colors text-white/40 hover:text-white/70"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                <div className="px-6 py-5 space-y-5">
                    {/* Invite Section (Owners only) */}
                    {myPermission === "owner" ? (
                        <form onSubmit={handleInvite} className="space-y-3">
                            <label className="text-xs font-medium text-white/50 uppercase tracking-wider">
                                Invite collaborators
                            </label>
                            <div className="flex gap-2">
                                <div className="relative flex-1 group">
                                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within:text-blue-400/50 transition-colors" />
                                    <input
                                        autoFocus
                                        type="email"
                                        placeholder="friend@example.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value.toLowerCase())}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-10 pr-3.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all"
                                    />
                                </div>

                                {/* Permission Selector */}
                                <div className="relative" ref={permDropdown === "selector" ? dropdownRef : null}>
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setPermDropdown(permDropdown === "selector" ? null : "selector");
                                        }}
                                        className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs font-medium text-white/70 hover:bg-white/10 transition-colors h-full"
                                    >
                                        {PERMISSION_LABELS[permission].icon}
                                        <span>{PERMISSION_LABELS[permission].label}</span>
                                        <ChevronDown className="w-3.5 h-3.5 opacity-40" />
                                    </button>

                                    {permDropdown === "selector" && (
                                        <div className="absolute right-0 top-full mt-2 bg-[#1a1a2e] border border-white/10 rounded-xl shadow-2xl z-[110] min-w-[140px] py-1 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                                            {(["editor", "viewer"] as Permission[]).map((p) => (
                                                <button
                                                    key={p}
                                                    type="button"
                                                    onMouseDown={(e) => {
                                                        e.preventDefault();
                                                        e.stopPropagation();
                                                        setPermission(p);
                                                        setPermDropdown(null);
                                                    }}
                                                    className={`w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-white/5 transition-colors ${permission === p ? "text-blue-400" : "text-white/70"}`}
                                                >
                                                    {PERMISSION_LABELS[p].icon}
                                                    {PERMISSION_LABELS[p].label}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading || !email.trim()}
                                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                    style={{
                                        background: "linear-gradient(135deg, #6c8fff, #a78bfa)",
                                        color: "white",
                                    }}
                                >
                                    <UserPlus className="w-4 h-4" />
                                    {loading ? "…" : "Invite"}
                                </button>
                            </div>

                            {inviteSuccess && (
                                <p className="text-emerald-400 text-xs flex items-center gap-1">
                                    <Check className="w-3.5 h-3.5" /> Invitation sent!
                                </p>
                            )}
                        </form>
                    ) : (
                        <div className="p-4 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-center">
                            <p className="text-xs text-white/40 italic">
                                Only the project owner can invite new collaborators.
                            </p>
                        </div>
                    )}

                    {/* Copy link */}
                    <div className="flex items-center gap-2 p-3 rounded-xl bg-white/5 border border-white/10">
                        <Link2 className="w-4 h-4 text-white/40 shrink-0" />
                        <span className="flex-1 text-xs text-white/40 truncate">
                            {typeof window !== "undefined" ? `${window.location.origin}/design?projectId=${projectId}` : ""}
                        </span>
                        <button
                            onClick={handleCopyLink}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                            style={{ background: copiedLink ? "rgba(52,211,153,0.15)" : "rgba(108,143,255,0.15)", color: copiedLink ? "#34d399" : "#6c8fff" }}
                        >
                            {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                            {copiedLink ? "Copied!" : "Copy link"}
                        </button>
                    </div>

                    {/* Collaborators list */}
                    {collaborators.length > 0 && (
                        <div className="space-y-2">
                            <label className="text-xs font-medium text-white/50 uppercase tracking-wider">
                                People with access ({collaborators.length})
                            </label>
                            <div className="space-y-1 max-h-48 overflow-y-auto custom-scrollbar">
                                {collaborators.map((c) => (
                                    <div
                                        key={c.id}
                                        className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/5 transition-colors group"
                                    >
                                        {/* Avatar */}
                                        <div
                                            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                                            style={{ background: c.color }}
                                        >
                                            {(c.displayName || c.email || "?").charAt(0).toUpperCase()}
                                        </div>

                                        {/* Info */}
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm text-white/80 font-medium truncate">{c.displayName || c.email}</p>
                                            <p className="text-xs text-white/30 truncate">{c.email}
                                                {c.status === "pending" && (
                                                    <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-yellow-500/15 text-yellow-400 text-[10px]">pending</span>
                                                )}
                                            </p>
                                        </div>

                                        {/* Permission Actions (Owners only) */}
                                        <div className="relative" ref={permDropdown === c.id ? dropdownRef : null}>
                                            {myPermission === "owner" ? (
                                                <>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setPermDropdown(permDropdown === c.id ? null : c.id);
                                                        }}
                                                        className="flex items-center gap-1 px-2 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-xs text-white/50"
                                                    >
                                                        {PERMISSION_LABELS[c.permission]?.icon}
                                                        <ChevronDown className="w-3 h-3" />
                                                    </button>
                                                    {permDropdown === c.id && (
                                                        <div className="absolute right-0 top-full mt-1 bg-[#1a1a2e] border border-white/10 rounded-xl shadow-2xl z-[110] min-w-[130px] py-1">
                                                            {(["editor", "viewer"] as Permission[]).map(p => (
                                                                <button
                                                                    key={p}
                                                                    onMouseDown={(e) => {
                                                                        e.preventDefault();
                                                                        e.stopPropagation();
                                                                        handleChangePermission(c.id, p);
                                                                    }}
                                                                    className={`w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-white/5 transition-colors ${c.permission === p ? "text-blue-400" : "text-white/70"}`}
                                                                >
                                                                    {PERMISSION_LABELS[p].icon}
                                                                    {PERMISSION_LABELS[p].label}
                                                                </button>
                                                            ))}
                                                            <div className="h-px bg-white/10 my-1" />
                                                            <button
                                                                onMouseDown={(e) => {
                                                                    e.preventDefault();
                                                                    e.stopPropagation();
                                                                    setPermDropdown(null);
                                                                    setRemovingCollab(c);
                                                                }}
                                                                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-400 hover:bg-white/5 transition-colors"
                                                            >
                                                                <Trash2 className="w-3.5 h-3.5" />
                                                                Remove
                                                            </button>
                                                        </div>
                                                    )}
                                                </>
                                            ) : (
                                                <div className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs text-white/30 italic">
                                                    {PERMISSION_LABELS[c.permission]?.label}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                    {/* General Error Message */}
                    {inviteError && (
                        <div className="mt-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20">
                            <p className="text-red-400 text-xs text-center">{inviteError}</p>
                        </div>
                    )}
                </div>

                {/* Footer note */}
                <div className="px-6 pb-5">
                    <p className="text-[11px] text-white/25 text-center">
                        Editors can move and modify elements. Viewers can only watch in real-time.
                    </p>
                </div>
            </div>

            {/* Remove Confirmation Modal */}
            {removingCollab && (
                <div className="fixed inset-0 z-[100000] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setRemovingCollab(null)} />
                    <div
                        className="relative w-full max-w-sm bg-[#1a1a2e] border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200"
                        style={{
                            background: "linear-gradient(145deg, #1a1a2e 0%, #16213e 100%)",
                        }}
                    >
                        <div className="p-6 text-center">
                            <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4">
                                <Trash2 className="w-6 h-6 text-red-400" />
                            </div>
                            <h3 className="text-white font-semibold text-lg mb-2">Remove collaborator?</h3>
                            <p className="text-white/40 text-sm mb-6">
                                Are you sure you want to remove <span className="text-white/70 font-medium">{removingCollab.displayName || removingCollab.email}</span>? They will lose all access to this project.
                            </p>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setRemovingCollab(null)}
                                    className="flex-1 px-4 py-2.5 rounded-xl border border-white/10 text-white/60 hover:bg-white/5 transition-colors text-sm font-medium"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={async () => {
                                        const collabId = removingCollab.id;
                                        setRemovingCollab(null);
                                        await handleRemove(collabId);
                                    }}
                                    className="flex-1 px-4 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white transition-colors text-sm font-medium shadow-lg shadow-red-500/20"
                                >
                                    Remove
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>,
        document.body
    );
};
