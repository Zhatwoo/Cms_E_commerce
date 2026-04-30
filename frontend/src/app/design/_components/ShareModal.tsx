"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { useDesignProject } from "../_context/DesignProjectContext";
import { apiFetch } from "@/lib/api";
import { ModalShell } from "@/components/ModalShell";
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
    Globe,
    Lock,
} from "lucide-react";


type Permission = "editor" | "viewer";

interface Collaborator {
    id: string;
    email: string;
    displayName: string;
    name?: string;
    avatar?: string | null;
    color: string;
    role: Permission;
    status: "active" | "pending" | "accepted";
    projectId?: string;
    ownerId?: string;
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
    const [owner, setOwner] = useState<Collaborator | null>(null);
    const [email, setEmail] = useState("");
    const [role, setRole] = useState<Permission>("editor");
    const [loading, setLoading] = useState(false);
    const [inviteError, setInviteError] = useState<string | null>(null);
    const [inviteSuccess, setInviteSuccess] = useState(false);
    const [copiedLink, setCopiedLink] = useState(false);
    const [permDropdown, setPermDropdown] = useState<string | null>(null);
    const [generalAccess, setGeneralAccess] = useState<"restricted" | "anyone">("restricted");
    const [generalAccessRole, setGeneralAccessRole] = useState<"viewer" | "editor">("viewer");
    const [removingCollab, setRemovingCollab] = useState<Collaborator | null>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const loadCollaborators = useCallback(async () => {
        try {
            const data = await apiFetch<{ success: boolean; collaborators: Collaborator[]; owner?: Collaborator; generalAccess?: string; generalAccessRole?: string }>(`/api/collaboration/${projectId}/collaborators`);
            if (data.success) {
                setCollaborators(data.collaborators || []);
                if (data.owner) setOwner(data.owner);
                if (data.generalAccess) setGeneralAccess(data.generalAccess as "restricted" | "anyone");
                if (data.generalAccessRole) setGeneralAccessRole(data.generalAccessRole as "viewer" | "editor");
            }
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
                body: JSON.stringify({ email: email.trim(), role: role }),
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
                body: JSON.stringify({ role: perm }),
            });
            if (data.success) {
                setCollaborators(prev =>
                    prev.map(c => c.id === collabId ? { ...c, role: perm } : c)
                );
            } else {
                setInviteError(data.message || "Failed to update permission");
            }
        } catch (err: any) {
            setInviteError(err.message || "Network error while updating permission");
        }
    };

    const handleGeneralAccessChange = async (access: "restricted" | "anyone") => {
        setPermDropdown(null);
        setGeneralAccess(access); // optimistic update
        try {
            const data = await apiFetch<{ success: boolean; message?: string }>(`/api/projects/${projectId}`, {
                method: "PATCH",
                body: JSON.stringify({ general_access: access }),
            });
            if (!data.success) {
                loadCollaborators();
                setInviteError(data.message || "Failed to update general access.");
            }
        } catch (err: any) {
            loadCollaborators();
            setInviteError("Network error updating general access.");
        }
    };

    const handleGeneralAccessRoleChange = async (role: "viewer" | "editor") => {
        setPermDropdown(null);
        setGeneralAccessRole(role); // optimistic update
        try {
            const data = await apiFetch<{ success: boolean; message?: string }>(`/api/projects/${projectId}`, {
                method: "PATCH",
                body: JSON.stringify({ general_access_role: role }),
            });
            if (!data.success) {
                loadCollaborators();
                setInviteError(data.message || "Failed to update general access role.");
            }
        } catch (err: any) {
            loadCollaborators();
            setInviteError("Network error updating general access role.");
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
        if (typeof navigator !== "undefined" && navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(url).then(() => {
                setCopiedLink(true);
                setTimeout(() => setCopiedLink(false), 2500);
            }).catch(() => {
                fallbackCopyTextToClipboard(url);
            });
        } else {
            fallbackCopyTextToClipboard(url);
        }
    };

    // Fallback for older browsers or non-secure context
    function fallbackCopyTextToClipboard(text: string) {
        try {
            const textArea = document.createElement("textarea");
            textArea.value = text;
            // Avoid scrolling to bottom
            textArea.style.position = "fixed";
            textArea.style.left = "-9999px";
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            setCopiedLink(true);
            setTimeout(() => setCopiedLink(false), 2500);
        } catch (err) {
            // Optionally handle error
        }
    }

    return (
        <ModalShell
            isOpen={isOpen}
            onClose={onClose}
            usePortal
            className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/60 backdrop-blur-sm"
        >
            {/* Modal */}
            <div
                className="relative z-10 w-full max-w-lg mx-4 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200"
                style={{
                    background: "linear-gradient(145deg, #1a1a2e 0%, #16213e 100%)",
                    border: "1px solid rgba(108, 143, 255, 0.2)",
                }}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-5 border-b border-transparent">
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
                                <p className="text-white/40 text-xs mt-0.5 truncate max-w-[240px]">{projectTitle || projectId}</p>
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
                                        className="w-full bg-white/5 border border-transparent rounded-xl py-2.5 pl-10 pr-3.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all"
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
                                        className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-white/5 border border-transparent text-xs font-medium text-white/70 hover:bg-white/10 transition-colors h-full"
                                    >
                                        {PERMISSION_LABELS[role].icon}
                                        <span>{PERMISSION_LABELS[role].label}</span>
                                        <ChevronDown className="w-3.5 h-3.5 opacity-40" />
                                    </button>

                                    {permDropdown === "selector" && (
                                        <div className="absolute right-0 top-full mt-2 bg-[#1a1a2e] border border-transparent rounded-xl shadow-2xl z-[110] min-w-[140px] py-1 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                                            {(["editor", "viewer"] as Permission[]).map((p) => (
                                                <button
                                                    key={p}
                                                    type="button"
                                                    onMouseDown={(e) => {
                                                        e.preventDefault();
                                                        e.stopPropagation();
                                                        setRole(p);
                                                        setPermDropdown(null);
                                                    }}
                                                    className={`w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-white/5 transition-colors ${role === p ? "text-blue-400" : "text-white/70"}`}
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
                        <div className="p-4 rounded-xl bg-white/5 border border-transparent flex items-center justify-center text-center">
                            <p className="text-xs text-white/40 italic">
                                Only the project owner can invite new collaborators.
                            </p>
                        </div>
                    )}

                    {/* General Access & Copy Link */}
                    <div className="space-y-3">
                        <label className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em]">
                            General access
                        </label>
                        <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-transparent">
                            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                                {generalAccess === "restricted" ? (
                                    <Lock className="w-4 h-4 text-white/70" />
                                ) : (
                                    <Globe className="w-4 h-4 text-white/70" />
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                {myPermission === "owner" ? (
                                    <div className="relative" ref={permDropdown === "generalAccess" ? dropdownRef : null}>
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setPermDropdown(permDropdown === "generalAccess" ? null : "generalAccess");
                                            }}
                                            className="flex items-center gap-1.5 text-sm font-semibold text-white hover:text-blue-400 transition-colors"
                                        >
                                            {generalAccess === "restricted" ? "Restricted" : "Anyone with the link"}
                                            <ChevronDown className="w-3.5 h-3.5 opacity-50" />
                                        </button>

                                        {permDropdown === "generalAccess" && (
                                            <div className="absolute left-0 top-full mt-1 bg-[#1a1a2e] border border-transparent rounded-xl shadow-2xl z-[110] min-w-[200px] py-1">
                                                <button
                                                    onMouseDown={(e) => {
                                                        e.preventDefault();
                                                        e.stopPropagation();
                                                        handleGeneralAccessChange("restricted");
                                                    }}
                                                    className="w-full flex items-center justify-between px-4 py-2 text-xs hover:bg-white/5 transition-colors text-white/90"
                                                >
                                                    <span>Restricted</span>
                                                    {generalAccess === "restricted" && <Check className="w-3.5 h-3.5 text-blue-400" />}
                                                </button>
                                                <button
                                                    onMouseDown={(e) => {
                                                        e.preventDefault();
                                                        e.stopPropagation();
                                                        handleGeneralAccessChange("anyone");
                                                    }}
                                                    className="w-full flex items-center justify-between px-4 py-2 text-xs hover:bg-white/5 transition-colors text-white/90"
                                                >
                                                    <span>Anyone with the link</span>
                                                    {generalAccess === "anyone" && <Check className="w-3.5 h-3.5 text-blue-400" />}
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2">
                                        <div className="text-sm font-semibold text-white">
                                            {generalAccess === "restricted" ? "Restricted" : "Anyone with the link"}
                                        </div>
                                    </div>
                                )}
                                <div className="flex items-center mt-0.5 gap-2">
                                    <p className="text-[11px] text-white/40 truncate">
                                        {generalAccess === "restricted"
                                            ? "Only people with access can open with the link"
                                            : "Anyone on the internet with the link can"}
                                    </p>

                                    {generalAccess === "anyone" && (
                                        myPermission === "owner" ? (
                                            <div className="relative inline-block" ref={permDropdown === "generalAccessRole" ? dropdownRef : null}>
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setPermDropdown(permDropdown === "generalAccessRole" ? null : "generalAccessRole");
                                                    }}
                                                    className="flex items-center gap-1 text-[11px] font-semibold text-white/70 hover:text-white transition-colors"
                                                >
                                                    {generalAccessRole === "viewer" ? "view" : generalAccessRole}
                                                    <ChevronDown className="w-3 h-3 opacity-50" />
                                                </button>

                                                {permDropdown === "generalAccessRole" && (
                                                    <div className="absolute left-0 top-full mt-1 bg-[#1a1a2e] border border-transparent rounded-xl shadow-2xl z-[120] min-w-[120px] py-1">
                                                        {(["viewer", "editor"] as ("viewer" | "editor")[]).map((r) => (
                                                            <button
                                                                key={r}
                                                                onMouseDown={(e) => {
                                                                    e.preventDefault();
                                                                    e.stopPropagation();
                                                                    handleGeneralAccessRoleChange(r);
                                                                }}
                                                                className="w-full flex items-center justify-between px-3 py-1.5 text-xs hover:bg-white/5 transition-colors text-white/90 capitalize"
                                                            >
                                                                <span>{r}</span>
                                                                {generalAccessRole === r && <Check className="w-3.5 h-3.5 text-blue-400" />}
                                                            </button>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            <span className="text-[11px] font-semibold text-white/70">
                                                {generalAccessRole === "viewer" ? "view" : generalAccessRole}
                                            </span>
                                        )
                                    )}
                                </div>
                            </div>
                            {(generalAccess === "anyone" || myPermission === "owner") && (
                                <button
                                    onClick={handleCopyLink}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all hover:bg-white/10"
                                    style={{
                                        border: "1px solid rgba(255,255,255,0.1)",
                                        color: copiedLink ? "#34d399" : "#6c8fff"
                                    }}
                                >
                                    {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Link2 className="w-3.5 h-3.5" />}
                                    {copiedLink ? "Copied" : "Copy link"}
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Collaborators list */}
                {(collaborators.length > 0 || owner) && (
                    <div className="space-y-3 px-6 pb-6">
                        <label className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em]">
                            People with access
                        </label>
                        <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar pr-1 -mr-1">
                            {/* Owner entry */}
                            {owner && (
                                <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/[0.03] border border-transparent group ring-1 ring-blue-500/20">
                                    <div
                                        className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0 shadow-lg"
                                        style={{ background: owner.color || "#6c8fff" }}
                                    >
                                        {(owner.displayName || owner.email || "?").charAt(0).toUpperCase()}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <p className="text-sm text-white font-semibold truncate">{owner.displayName || owner.email}</p>
                                            <span className="px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 text-[9px] font-black uppercase tracking-wider">Owner</span>
                                        </div>
                                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] mt-0.5">
                                            <span className="text-white/40 truncate max-w-[140px]">{owner.email}</span>
                                            <span className="w-1 h-1 rounded-full bg-white/10 shrink-0" />
                                            <span className="text-blue-400 font-semibold uppercase tracking-tighter">Role: Owner</span>
                                            <span className="w-1 h-1 rounded-full bg-white/10 shrink-0" />
                                            <span className={`px-1.5 py-0.25 rounded-md text-[9px] font-bold uppercase ${owner.status === "pending" ? "bg-yellow-500/10 text-yellow-500 border border-yellow-500/20" : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"}`}>
                                                Status: {owner.status || "active"}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Collaborators */}
                            {collaborators.map((c) => (
                                <div
                                    key={c.id}
                                    className="flex items-center gap-3 p-3 rounded-2xl bg-white/[0.02] border border-transparent hover:bg-white/[0.05] transition-all group"
                                >
                                    {/* Avatar */}
                                    <div
                                        className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0 shadow-md"
                                        style={{ background: c.color }}
                                    >
                                        {(c.displayName || c.email || "?").charAt(0).toUpperCase()}
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm text-white/90 font-medium truncate">{c.displayName || c.name || c.email}</p>
                                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] mt-0.5">
                                            <span className="text-white/40 truncate max-w-[140px]">{c.email}</span>
                                            <span className="w-1 h-1 rounded-full bg-white/10 shrink-0" />
                                            <span className="text-blue-400 font-semibold uppercase tracking-tighter">Role: {c.role || "viewer"}</span>
                                            <span className="w-1 h-1 rounded-full bg-white/10 shrink-0" />
                                            <span className={`px-1.5 py-0.25 rounded-md text-[9px] font-bold uppercase ${c.status === "pending" ? "bg-yellow-500/10 text-yellow-500 border border-yellow-500/20" : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"}`}>
                                                Status: {c.status || "accepted"}
                                            </span>
                                        </div>
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
                                                    {PERMISSION_LABELS[c.role]?.icon}
                                                    <ChevronDown className="w-3 h-3" />
                                                </button>
                                                {permDropdown === c.id && (
                                                    <div className="absolute right-0 top-full mt-1 bg-[#1a1a2e] border border-transparent rounded-xl shadow-2xl z-[110] min-w-[130px] py-1">
                                                        {(["editor", "viewer"] as Permission[]).map(p => (
                                                            <button
                                                                key={p}
                                                                onMouseDown={(e) => {
                                                                    e.preventDefault();
                                                                    e.stopPropagation();
                                                                    handleChangePermission(c.id, p);
                                                                }}
                                                                className={`w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-white/5 transition-colors ${c.role === p ? "text-blue-400" : "text-white/70"}`}
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
                                                {PERMISSION_LABELS[c.role]?.label}
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

            {/* Remove Confirmation Modal */}
            {removingCollab && (
                <div className="fixed inset-0 z-[100000] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setRemovingCollab(null)} />
                    <div
                        className="relative w-full max-w-sm bg-[#1a1a2e] border border-transparent rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200"
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
                                    className="flex-1 px-4 py-2.5 rounded-xl border border-transparent text-white/60 hover:bg-white/5 transition-colors text-sm font-medium"
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
        </ModalShell>
    );
};
