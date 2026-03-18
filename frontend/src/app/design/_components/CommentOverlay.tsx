"use client";

import React, { useState, useEffect } from "react";
import { useComments } from "../_context/CommentsContext";
import { useCollaboration } from "../_context/CollaborationContext";
import { useCanvasTool } from "./CanvasToolContext";
import { Send, X, MessageSquare } from "lucide-react";
import { getStoredUser } from "@/lib/api";

export const CommentOverlay: React.FC<{ scale?: number }> = ({ scale = 1 }) => {
    const { addComment } = useComments();
    const { activeTool } = useCanvasTool();
    const { myColor } = useCollaboration();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [clickPos, setClickPos] = useState<{ x: number; y: number } | null>(null);
    const [content, setContent] = useState("");

    useEffect(() => {
        if (activeTool === "comment") {
            const originalCursor = document.body.style.cursor;
            document.body.style.cursor = 'crosshair';
            console.log("[CommentOverlay] Active! Set global cursor to crosshair.");
            return () => {
                document.body.style.cursor = originalCursor;
            };
        }
    }, [activeTool]);

    if (activeTool !== "comment") return null;

    const handleCanvasClick = (e: React.MouseEvent) => {
        if (isSubmitting || clickPos) return;

        console.log("[CommentOverlay] Canvas click detected at viewport:", e.clientX, e.clientY);

        const rect = e.currentTarget.getBoundingClientRect();
        const x = (e.clientX - rect.left) / scale;
        const y = (e.clientY - rect.top) / scale;

        setClickPos({ x, y });
        setContent("");
    };

    const handleSubmit = async () => {
        if (!content.trim() || !clickPos || isSubmitting) return;

        const user = getStoredUser();
        setIsSubmitting(true);

        try {
            await addComment({
                content,
                x: clickPos.x,
                y: clickPos.y,
                authorName: user?.name || user?.username || "You",
                authorAvatar: user?.avatar || null,
                color: myColor,
            });

            setContent("");
            setClickPos(null);
        } catch (err) {
            console.error("Comment submission failed:", err);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div
            id="comment-placement-overlay"
            className="absolute inset-0 z-[100000] pointer-events-auto"
            style={{
                cursor: 'crosshair',
                backgroundColor: 'rgba(59, 130, 246, 0.04)', // Slightly stronger tint to see it's active
                outline: '2px solid rgba(59, 130, 246, 0.2)', // Border to see visibility
            }}
            onClick={handleCanvasClick}
            data-active-tool={activeTool}
            data-testid="comment-overlay"
        >
            {/* The Hint - only show if no clickPos yet */}
            {!clickPos && (
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 pointer-events-none px-4 py-2 bg-[#1A1A1A] text-white text-xs rounded-full shadow-2xl border border-transparent animate-in fade-in slide-in-from-bottom-2 duration-300 backdrop-blur-md">
                    <span className="flex items-center gap-2 font-medium">
                        <MessageSquare className="w-3.5 h-3.5 text-blue-400" />
                        Click anywhere to add a comment
                    </span>
                </div>
            )}

            {clickPos && (
                <div
                    className="absolute z-[100001] animate-in zoom-in-95 duration-200"
                    style={{
                        left: clickPos.x,
                        top: clickPos.y,
                        // Offset so the pointer is at the bottom-left of the bubble
                        transform: "translate(0, -100%)",
                        pointerEvents: "auto"
                    }}
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Input Bubble */}
                    <div
                        className="relative bg-[#0E83DF] text-white rounded-[24px] rounded-bl-none shadow-[0_20px_50px_rgba(0,0,0,0.5)] p-4 w-[280px] origin-bottom-left"
                    >
                        <textarea
                            autoFocus
                            placeholder="Write a comment..."
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            disabled={isSubmitting}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSubmit();
                                }
                                if (e.key === 'Escape') {
                                    setClickPos(null);
                                }
                            }}
                            className={`w-full bg-white/15 border border-transparent rounded-xl p-3 text-sm text-white placeholder:text-white/50 focus:outline-none focus:border-transparent transition-all font-medium resize-none h-24 mb-3 ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                        />
                        <div className="flex items-center justify-between pl-1">
                            <span className="text-[10px] text-white/60 font-bold uppercase tracking-widest">
                                {isSubmitting ? "Posting..." : "Press Enter to post"}
                            </span>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setClickPos(null)}
                                    disabled={isSubmitting}
                                    className="p-1.5 hover:bg-white/10 rounded-full transition-colors disabled:opacity-30"
                                    title="Cancel"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={handleSubmit}
                                    disabled={!content.trim() || isSubmitting}
                                    className="p-1.5 bg-white text-[#0E83DF] rounded-full hover:bg-white/90 transition-all shadow-lg active:scale-95 disabled:opacity-40 disabled:scale-100"
                                    title="Send"
                                >
                                    <Send className={`w-4 h-4 ${isSubmitting ? 'animate-pulse' : ''}`} />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
