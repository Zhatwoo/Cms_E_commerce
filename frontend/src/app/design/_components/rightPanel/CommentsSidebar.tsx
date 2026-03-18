"use client";

import React, { useState } from "react";
import { MessageSquare, X, Check, Trash2, Search } from "lucide-react";
import { useComments } from "../../_context/CommentsContext";
import { formatDistanceToNow } from "date-fns";

export const CommentsSidebar: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const { comments, resolveComment, deleteComment, activeCommentId, setActiveCommentId } = useComments();
    const [searchQuery, setSearchQuery] = useState("");
    const [filter, setFilter] = useState<"all" | "active" | "resolved">("active");

    const filteredComments = comments.filter(c => {
        const matchesSearch = c.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
            c.authorName.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesFilter = filter === "all" ? true :
            filter === "resolved" ? c.resolved : !c.resolved;
        return matchesSearch && matchesFilter;
    });

    return (
        <div className="w-80 h-full bg-[var(--builder-surface-2)] backdrop-blur-xl border-l border-[var(--builder-border)] flex flex-col shadow-2xl animate-in slide-in-from-right duration-300">
            {/* Header */}
            <div className="p-4 border-b border-[var(--builder-border)] flex items-center justify-between bg-[var(--builder-surface-3)]">
                <div className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-amber-400" />
                    <h2 className="text-sm font-bold text-[var(--builder-text)] uppercase tracking-wider">Comments</h2>
                    <span className="px-1.5 py-0.5 rounded-full bg-[var(--builder-surface)] text-[10px] text-[var(--builder-text-faint)] font-bold">
                        {filteredComments.length}
                    </span>
                </div>
                <button
                    onClick={onClose}
                    className="p-1.5 rounded-lg hover:bg-[var(--builder-surface-hover)] text-[var(--builder-text-faint)] hover:text-[var(--builder-text)] transition-colors"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>

            {/* Search and Filter */}
            <div className="p-4 space-y-3 bg-[var(--builder-surface)]">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--builder-text-faint)]" />
                    <input
                        type="text"
                        placeholder="Search comments..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-[var(--builder-surface-2)] border border-[var(--builder-border)] rounded-xl pl-9 pr-4 py-2 text-xs text-[var(--builder-text)] placeholder:text-[var(--builder-text-faint)] focus:outline-none focus:border-[var(--builder-border-mid)] transition-all font-medium"
                    />
                </div>
                <div className="flex gap-1 p-1 bg-[var(--builder-surface-2)] rounded-xl border border-[var(--builder-border)]">
                    {(["active", "resolved", "all"] as const).map((f) => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${filter === f
                                    ? "bg-[var(--builder-surface-3)] text-[var(--builder-text)] shadow-sm"
                                    : "text-[var(--builder-text-faint)] hover:text-[var(--builder-text-muted)]"
                                }`}
                        >
                            {f}
                        </button>
                    ))}
                </div>
            </div>

            {/* Comments List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                {filteredComments.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                        <div className="w-12 h-12 rounded-2xl bg-[var(--builder-surface-2)] flex items-center justify-center mb-4">
                            <MessageSquare className="w-6 h-6 text-[var(--builder-text-faint)]" />
                        </div>
                        <p className="text-xs text-[var(--builder-text-muted)] font-medium">No comments found</p>
                    </div>
                ) : (
                    filteredComments.map((comment) => (
                        <div
                            key={comment.id}
                            onClick={() => setActiveCommentId(comment.id)}
                            className={`group p-3 rounded-2xl border transition-all cursor-pointer ${activeCommentId === comment.id
                                    ? "bg-amber-500/10 border-amber-500/30 ring-1 ring-amber-500/20"
                                    : "bg-[var(--builder-surface-2)] border-[var(--builder-border)] hover:border-[var(--builder-border-mid)]"
                                } ${comment.resolved ? "opacity-60" : ""}`}
                        >
                            <div className="flex items-start justify-between mb-2">
                                <div className="flex items-center gap-2">
                                    <div
                                        className="w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-bold text-white"
                                        style={{ background: comment.color }}
                                    >
                                        {comment.authorName.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-[11px] font-bold text-[var(--builder-text)] truncate">{comment.authorName}</p>
                                        <p className="text-[9px] text-[var(--builder-text-faint)]">
                                            {formatDistanceToNow(new Date(comment.createdAt))} ago
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            resolveComment(comment.id, !comment.resolved);
                                        }}
                                        title={comment.resolved ? "Unresolve" : "Resolve"}
                                        className={`p-1 rounded-md transition-colors ${comment.resolved ? "bg-emerald-500/20 text-emerald-400" : "hover:bg-[var(--builder-surface-3)] text-[var(--builder-text-faint)] hover:text-emerald-400"}`}
                                    >
                                        <Check className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            deleteComment(comment.id);
                                        }}
                                        title="Delete"
                                        className="p-1 rounded-md hover:bg-[var(--builder-surface-3)] text-[var(--builder-text-faint)] hover:text-red-400 transition-colors"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            </div>
                            <p className="text-xs text-[var(--builder-text-muted)] leading-relaxed font-medium">
                                {comment.content}
                            </p>
                            <div className="mt-3 pt-3 border-t border-[var(--builder-border)] flex items-center justify-between">
                                <span className="text-[9px] text-[var(--builder-text-faint)] font-bold uppercase tracking-tighter">
                                    PAGE: {comment.pageId}
                                </span>
                                {comment.resolved && (
                                    <span className="flex items-center gap-1 text-[9px] text-emerald-400 font-black uppercase italic">
                                        <Check className="w-3 h-3" strokeWidth={3} />
                                        Resolved
                                    </span>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};
