"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useCollaboration } from "./CollaborationContext";
import { useDesignProject } from "./DesignProjectContext";
import { apiFetch, getApiErrorMessage, isBackendUnavailableError, isQuietAuthError } from "@/lib/api";

export interface CommentReply {
    id: string;
    commentId: string;
    content: string;
    authorId: string;
    authorName: string;
    authorEmail: string;
    authorAvatar?: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface CommentReaction {
    emoji: string;
    userId: string;
    userName: string;
}

export interface Comment {
    id: string;
    content: string;
    x: number;
    y: number;
    pageId: string;
    authorId: string;
    authorName: string;
    authorEmail: string;
    authorAvatar?: string | null;
    color: string;
    resolved: boolean;
    createdAt: string;
    updatedAt: string;
    replies?: CommentReply[];
    reactions?: CommentReaction[];
}

interface CommentsContextType {
    comments: Comment[];
    activeCommentId: string | null;
    setActiveCommentId: (id: string | null) => void;
    addComment: (comment: Partial<Comment>) => Promise<void>;
    updateComment: (id: string, content: string) => Promise<void>;
    updateCommentPosition: (id: string, x: number, y: number) => Promise<void>;
    resolveComment: (id: string, resolved: boolean) => Promise<void>;
    deleteComment: (id: string) => Promise<void>;
    addReply: (commentId: string, content: string) => Promise<void>;
    deleteReply: (commentId: string, replyId: string) => Promise<void>;
    addReaction: (commentId: string, emoji: string) => Promise<void>;
    removeReaction: (commentId: string, emoji: string) => Promise<void>;
    isCommentMode: boolean;
    setCommentMode: (active: boolean) => void;
    loading: boolean;
}

const CommentsContext = createContext<CommentsContextType | undefined>(undefined);

export const CommentsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { projectId } = useDesignProject();
    const { collaborators, connected, socket } = useCollaboration();
    const [comments, setComments] = useState<Comment[]>([]);
    const [activeCommentId, setActiveCommentId] = useState<string | null>(null);
    const [isCommentMode, setCommentMode] = useState(false);
    const [loading, setLoading] = useState(true);

    const fetchComments = useCallback(async (retries = 3) => {
        if (!projectId) return;
        try {
            setLoading(true);
            const res = await apiFetch<{ success: boolean; comments: Comment[] }>(`/api/projects/${projectId}/comments`);
            if (res.success) {
                setComments(res.comments);
            }
        } catch (error: unknown) {
            const message = getApiErrorMessage(error);
            if (message === "Access denied" && retries > 0) {
                setTimeout(() => fetchComments(retries - 1), 1000);
            } else if (isBackendUnavailableError(error)) {
                setComments([]);
            } else if (isQuietAuthError(error)) {
                setComments([]);
                setActiveCommentId(null);
            } else if (message !== "Access denied") {
                console.error("[Comments] Fetch failed:", error);
            }
        } finally {
            setLoading(false);
        }
    }, [projectId]);

    useEffect(() => {
        if (connected || !socket) {
            fetchComments();
        }
    }, [fetchComments, connected, socket]);

    useEffect(() => {
        if (!socket) return;

        const handleCommentAdded = (data: { comment: Comment }) => {
            setComments(prev => {
                if (prev.find(c => c.id === data.comment.id)) return prev;
                return [data.comment, ...prev];
            });
        };

        const handleCommentUpdated = (data: { id: string, content: string }) => {
            setComments(prev => prev.map(c => c.id === data.id ? { ...c, content: data.content, updatedAt: new Date().toISOString() } : c));
        };

        const handleCommentMoved = (data: { id: string, x: number, y: number }) => {
            setComments(prev => prev.map(c => c.id === data.id ? { ...c, x: data.x, y: data.y } : c));
        };

        const handleCommentResolved = (data: { id: string, resolved: boolean }) => {
            setComments(prev => prev.map(c => c.id === data.id ? { ...c, resolved: data.resolved } : c));
        };

        const handleCommentDeleted = (data: { id: string }) => {
            setComments(prev => prev.filter(c => c.id !== data.id));
        };

        const handleReplyAdded = (data: { commentId: string, reply: CommentReply }) => {
            setComments(prev => prev.map(c => {
                if (c.id === data.commentId) {
                    return { ...c, replies: [...(c.replies || []), data.reply] };
                }
                return c;
            }));
        };

        const handleReplyDeleted = (data: { commentId: string, replyId: string }) => {
            setComments(prev => prev.map(c => {
                if (c.id === data.commentId) {
                    return { ...c, replies: (c.replies || []).filter(r => r.id !== data.replyId) };
                }
                return c;
            }));
        };

        const handleReactionAdded = (data: { commentId: string, reaction: CommentReaction }) => {
            setComments(prev => prev.map(c => {
                if (c.id === data.commentId) {
                    const reactions = c.reactions || [];
                    const existing = reactions.find(r => r.emoji === data.reaction.emoji && r.userId === data.reaction.userId);
                    if (existing) return c;
                    return { ...c, reactions: [...reactions, data.reaction] };
                }
                return c;
            }));
        };

        const handleReactionRemoved = (data: { commentId: string, emoji: string, userId: string }) => {
            setComments(prev => prev.map(c => {
                if (c.id === data.commentId) {
                    return { ...c, reactions: (c.reactions || []).filter(r => !(r.emoji === data.emoji && r.userId === data.userId)) };
                }
                return c;
            }));
        };

        socket.on("collab:comment_added", handleCommentAdded);
        socket.on("collab:comment_updated", handleCommentUpdated);
        socket.on("collab:comment_moved", handleCommentMoved);
        socket.on("collab:comment_resolved", handleCommentResolved);
        socket.on("collab:comment_deleted", handleCommentDeleted);
        socket.on("collab:reply_added", handleReplyAdded);
        socket.on("collab:reply_deleted", handleReplyDeleted);
        socket.on("collab:reaction_added", handleReactionAdded);
        socket.on("collab:reaction_removed", handleReactionRemoved);

        return () => {
            socket.off("collab:comment_added", handleCommentAdded);
            socket.off("collab:comment_updated", handleCommentUpdated);
            socket.off("collab:comment_moved", handleCommentMoved);
            socket.off("collab:comment_resolved", handleCommentResolved);
            socket.off("collab:comment_deleted", handleCommentDeleted);
            socket.off("collab:reply_added", handleReplyAdded);
            socket.off("collab:reply_deleted", handleReplyDeleted);
            socket.off("collab:reaction_added", handleReactionAdded);
            socket.off("collab:reaction_removed", handleReactionRemoved);
        };
    }, [socket]);

    const addComment = async (commentData: Partial<Comment>) => {
        if (!projectId) return;
        try {
            const res = await apiFetch<{ success: boolean; comment: Comment }>(`/api/projects/${projectId}/comments`, {
                method: "POST",
                body: JSON.stringify(commentData),
            });
            if (res.success) {
                const newComment = res.comment;
                setComments(prev => [newComment, ...prev]);
                socket?.emit("collab:comment_added", { comment: newComment });
            }
        } catch (error) {
            if (!isBackendUnavailableError(error) && !isQuietAuthError(error)) {
                console.error("[Comments] Add failed:", error);
            }
        }
    };

    const updateComment = async (id: string, content: string) => {
        if (!projectId || !id) return;
        try {
            const res = await apiFetch<{ success: boolean }>(`/api/projects/${projectId}/comments/${id}`, {
                method: "PATCH",
                body: JSON.stringify({ content }),
            });
            if (res.success) {
                setComments(prev => prev.map(c => c.id === id ? { ...c, content, updatedAt: new Date().toISOString() } : c));
                socket?.emit("collab:comment_updated", { id, content });
            }
        } catch (error) {
            if (!isBackendUnavailableError(error) && !isQuietAuthError(error)) {
                console.error("[Comments] Update failed:", error);
            }
        }
    };

    const updateCommentPosition = async (id: string, x: number, y: number) => {
        if (!projectId || !id) return;
        try {
            const res = await apiFetch<{ success: boolean }>(`/api/projects/${projectId}/comments/${id}/position`, {
                method: "PATCH",
                body: JSON.stringify({ x, y }),
            });
            if (res.success) {
                setComments(prev => prev.map(c => c.id === id ? { ...c, x, y } : c));
                socket?.emit("collab:comment_moved", { id, x, y });
            }
        } catch (error) {
            if (!isBackendUnavailableError(error) && !isQuietAuthError(error)) {
                console.error("[Comments] Position update failed:", error);
            }
        }
    };

    const resolveComment = async (id: string, resolved: boolean) => {
        if (!projectId || !id) return;
        try {
            const res = await apiFetch<{ success: boolean }>(`/api/projects/${projectId}/comments/${id}/resolve`, {
                method: "PATCH",
                body: JSON.stringify({ resolved }),
            });
            if (res.success) {
                setComments(prev => prev.map(c => c.id === id ? { ...c, resolved } : c));
                socket?.emit("collab:comment_resolved", { id, resolved });
            }
        } catch (error: unknown) {
            if (!isBackendUnavailableError(error) && !isQuietAuthError(error)) {
                console.error("[Comments] Resolve failed:", getApiErrorMessage(error) || error);
            }
        }
    };

    const deleteComment = async (id: string) => {
        if (!projectId || !id) return;
        try {
            const res = await apiFetch<{ success: boolean }>(`/api/projects/${projectId}/comments/${id}`, {
                method: "DELETE"
            });
            if (res.success) {
                setComments(prev => prev.filter(c => c.id !== id));
                socket?.emit("collab:comment_deleted", { id });
            }
        } catch (error: unknown) {
            if (!isBackendUnavailableError(error) && !isQuietAuthError(error)) {
                console.error("[Comments] Delete failed:", getApiErrorMessage(error) || error);
            }
        }
    };

    const addReply = async (commentId: string, content: string) => {
        if (!projectId || !commentId) return;
        try {
            const res = await apiFetch<{ success: boolean; reply: CommentReply }>(`/api/projects/${projectId}/comments/${commentId}/replies`, {
                method: "POST",
                body: JSON.stringify({ content }),
            });
            if (res.success) {
                const newReply = res.reply;
                setComments(prev => prev.map(c => {
                    if (c.id === commentId) {
                        return { ...c, replies: [...(c.replies || []), newReply] };
                    }
                    return c;
                }));
                socket?.emit("collab:reply_added", { commentId, reply: newReply });
            }
        } catch (error) {
            if (!isBackendUnavailableError(error) && !isQuietAuthError(error)) {
                console.error("[Comments] Add reply failed:", error);
            }
        }
    };

    const deleteReply = async (commentId: string, replyId: string) => {
        if (!projectId || !commentId || !replyId) return;
        try {
            const res = await apiFetch<{ success: boolean }>(`/api/projects/${projectId}/comments/${commentId}/replies/${replyId}`, {
                method: "DELETE"
            });
            if (res.success) {
                setComments(prev => prev.map(c => {
                    if (c.id === commentId) {
                        return { ...c, replies: (c.replies || []).filter(r => r.id !== replyId) };
                    }
                    return c;
                }));
                socket?.emit("collab:reply_deleted", { commentId, replyId });
            }
        } catch (error) {
            if (!isBackendUnavailableError(error) && !isQuietAuthError(error)) {
                console.error("[Comments] Delete reply failed:", error);
            }
        }
    };

    const addReaction = async (commentId: string, emoji: string) => {
        if (!projectId || !commentId) return;
        try {
            const res = await apiFetch<{ success: boolean; reaction: CommentReaction }>(`/api/projects/${projectId}/comments/${commentId}/reactions`, {
                method: "POST",
                body: JSON.stringify({ emoji }),
            });
            if (res.success) {
                const newReaction = res.reaction;
                setComments(prev => prev.map(c => {
                    if (c.id === commentId) {
                        const reactions = c.reactions || [];
                        const existing = reactions.find(r => r.emoji === emoji && r.userId === newReaction.userId);
                        if (existing) return c;
                        return { ...c, reactions: [...reactions, newReaction] };
                    }
                    return c;
                }));
                socket?.emit("collab:reaction_added", { commentId, reaction: newReaction });
            }
        } catch (error) {
            if (!isBackendUnavailableError(error) && !isQuietAuthError(error)) {
                console.error("[Comments] Add reaction failed:", error);
            }
        }
    };

    const removeReaction = async (commentId: string, emoji: string) => {
        if (!projectId || !commentId) return;
        try {
            const res = await apiFetch<{ success: boolean; userId: string }>(`/api/projects/${projectId}/comments/${commentId}/reactions`, {
                method: "DELETE",
                body: JSON.stringify({ emoji }),
            });
            if (res.success) {
                setComments(prev => prev.map(c => {
                    if (c.id === commentId) {
                        return { ...c, reactions: (c.reactions || []).filter(r => !(r.emoji === emoji && r.userId === res.userId)) };
                    }
                    return c;
                }));
                socket?.emit("collab:reaction_removed", { commentId, emoji, userId: res.userId });
            }
        } catch (error) {
            if (!isBackendUnavailableError(error) && !isQuietAuthError(error)) {
                console.error("[Comments] Remove reaction failed:", error);
            }
        }
    };

    return (
        <CommentsContext.Provider
            value={{
                comments,
                activeCommentId,
                setActiveCommentId,
                addComment,
                updateComment,
                updateCommentPosition,
                resolveComment,
                deleteComment,
                addReply,
                deleteReply,
                addReaction,
                removeReaction,
                isCommentMode,
                setCommentMode,
                loading,
            }}
        >
            {children}
        </CommentsContext.Provider>
    );
};

export const useComments = () => {
    const context = useContext(CommentsContext);
    if (context === undefined) {
        throw new Error("useComments must be used within a CommentsProvider");
    }
    return context;
};
