"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useCollaboration } from "./CollaborationContext";
import { useDesignProject } from "./DesignProjectContext";
import { apiFetch } from "@/lib/api";

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
}

interface CommentsContextType {
    comments: Comment[];
    activeCommentId: string | null;
    setActiveCommentId: (id: string | null) => void;
    addComment: (comment: Partial<Comment>) => Promise<void>;
    resolveComment: (id: string, resolved: boolean) => Promise<void>;
    deleteComment: (id: string) => Promise<void>;
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

    const isBackendUnavailableError = (error: unknown): boolean => {
        if (!(error instanceof Error)) return false;
        return error.message.includes("Backend is unreachable");
    };

    const fetchComments = useCallback(async (retries = 3) => {
        if (!projectId) return;
        try {
            setLoading(true);
            const res = await apiFetch<{ success: boolean; comments: Comment[] }>(`/api/projects/${projectId}/comments`);
            if (res.success) {
                setComments(res.comments);
            }
        } catch (error: any) {
            if (error?.message === "Access denied" && retries > 0) {
                // Retry after 1 second — backend collab entry may not be ready yet
                setTimeout(() => fetchComments(retries - 1), 1000);
            } else if (isBackendUnavailableError(error)) {
                // Backend may be intentionally offline during frontend-only work.
                setComments([]);
            } else if (error?.message !== "Access denied") {
                console.error("[Comments] Fetch failed:", error);
            }
        } finally {
            setLoading(false);
        }
    }, [projectId]);

    // Wait until the collab socket is connected before fetching comments so that
    // resolveProjectOwner can successfully locate the user's role.
    useEffect(() => {
        if (connected || !socket) {
            fetchComments();
        }
    }, [fetchComments, connected, socket]);

    // Socket listeners for real-time updates
    useEffect(() => {
        if (!socket) return;

        const handleCommentAdded = (data: { comment: Comment }) => {
            setComments(prev => {
                if (prev.find(c => c.id === data.comment.id)) return prev;
                return [data.comment, ...prev];
            });
        };

        const handleCommentResolved = (data: { id: string, resolved: boolean }) => {
            setComments(prev => prev.map(c => c.id === data.id ? { ...c, resolved: data.resolved } : c));
        };

        const handleCommentDeleted = (data: { id: string }) => {
            setComments(prev => prev.filter(c => c.id !== data.id));
        };

        socket.on("collab:comment_added", handleCommentAdded);
        socket.on("collab:comment_resolved", handleCommentResolved);
        socket.on("collab:comment_deleted", handleCommentDeleted);

        return () => {
            socket.off("collab:comment_added", handleCommentAdded);
            socket.off("collab:comment_resolved", handleCommentResolved);
            socket.off("collab:comment_deleted", handleCommentDeleted);
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
            if (!isBackendUnavailableError(error)) {
                console.error("[Comments] Add failed:", error);
            }
        }
    };

    const resolveComment = async (id: string, resolved: boolean) => {
        if (!projectId || !id) return;
        console.log(`[Comments] Resolving comment: ${id} to ${resolved}`);
        try {
            const res = await apiFetch<{ success: boolean }>(`/api/projects/${projectId}/comments/${id}/resolve`, {
                method: "PATCH",
                body: JSON.stringify({ resolved }),
            });
            if (res.success) {
                setComments(prev => prev.map(c => c.id === id ? { ...c, resolved } : c));
                socket?.emit("collab:comment_resolved", { id, resolved });
            }
        } catch (error: any) {
            if (!isBackendUnavailableError(error)) {
                console.error("[Comments] Resolve failed:", error.message || error);
            }
        }
    };

    const deleteComment = async (id: string) => {
        if (!projectId || !id) return;
        console.log(`[Comments] Deleting comment: ${id}`);
        try {
            const res = await apiFetch<{ success: boolean }>(`/api/projects/${projectId}/comments/${id}`, {
                method: "DELETE"
            });
            if (res.success) {
                setComments(prev => prev.filter(c => c.id !== id));
                socket?.emit("collab:comment_deleted", { id });
            }
        } catch (error: any) {
            if (!isBackendUnavailableError(error)) {
                console.error("[Comments] Delete failed:", error.message || error);
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
                resolveComment,
                deleteComment,
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
