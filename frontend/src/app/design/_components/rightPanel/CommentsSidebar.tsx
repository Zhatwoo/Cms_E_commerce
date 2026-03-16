"use client";

import React, { useState } from "react";
import { MessageSquare, X, Check, Trash2, Search, Filter } from "lucide-react";
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
        <div className="w-80 h-full bg-[#1a1a2e]/95 backdrop-blur-xl border-l border-white/10 flex flex-col shadow-2xl animate-in slide-in-from-right duration-300">
            {/* Header */}
            <div className="p-4 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
                <div className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-amber-400" />
                    <h2 className="text-sm font-bold text-white uppercase tracking-wider">Comments</h2>
                    <span className="px-1.5 py-0.5 rounded-full bg-white/5 text-[10px] text-white/40 font-bold">
                        {filteredComments.length}
                    </span>
                </div>
                <button
                    onClick={onClose}
                    className="p-1.5 rounded-lg hover:bg-white/5 text-white/40 hover:text-white transition-colors"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>

            {/* Search and Filter */}
            <div className="p-4 space-y-3 bg-white/[0.01]">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/20" />
                    <input
                        type="text"
                        placeholder="Search comments..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder:text-white/20 focus:outline-none focus:border-blue-500/50 transition-all font-medium"
                    />
                </div>
                <div className="flex gap-1 p-1 bg-white/5 rounded-xl border border-white/5">
                    {(["active", "resolved", "all"] as const).map((f) => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${filter === f
                                    ? "bg-white/10 text-white shadow-sm"
                                    : "text-white/40 hover:text-white/60"
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
                        <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center mb-4">
                            <MessageSquare className="w-6 h-6 text-white/10" />
                        </div>
                        <p className="text-xs text-white/40 font-medium">No comments found</p>
                    </div>
                ) : (
                    filteredComments.map((comment) => (
                        <div
                            key={comment.id}
                            onClick={() => setActiveCommentId(comment.id)}
                            className={`group p-3 rounded-2xl border transition-all cursor-pointer ${activeCommentId === comment.id
                                    ? "bg-amber-500/10 border-amber-500/30 ring-1 ring-amber-500/20"
                                    : "bg-white/[0.02] border-white/5 hover:border-white/10"
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
                                        <p className="text-[11px] font-bold text-white truncate">{comment.authorName}</p>
                                        <p className="text-[9px] text-white/30">
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
                                        className={`p-1 rounded-md transition-colors ${comment.resolved ? "bg-emerald-500/20 text-emerald-400" : "hover:bg-white/10 text-white/40 hover:text-emerald-400"}`}
                                    >
                                        <Check className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            deleteComment(comment.id);
                                        }}
                                        title="Delete"
                                        className="p-1 rounded-md hover:bg-white/10 text-white/40 hover:text-red-400 transition-colors"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            </div>
                            <p className="text-xs text-white/70 leading-relaxed font-medium">
                                {comment.content}
                            </p>
                            <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between">
                                <span className="text-[9px] text-white/20 font-bold uppercase tracking-tighter">
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
