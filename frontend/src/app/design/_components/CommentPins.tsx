"use client";

import React from "react";
import { useComments, Comment } from "../_context/CommentsContext";
import { Check, Trash2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns/formatDistanceToNow";

export const CommentPins: React.FC = () => {
    const { comments, activeCommentId, setActiveCommentId, resolveComment, deleteComment } = useComments();

    // Only show active comments as pins by default, or just all that are on this page
    const activeComments = comments.filter(c => !c.resolved);

    return (
        <>
            {activeComments.map((comment) => (
                <CommentPin key={comment.id} comment={comment} />
            ))}
        </>
    );
};

const CommentPin: React.FC<{ comment: Comment }> = ({ comment }) => {
    const { activeCommentId, setActiveCommentId, resolveComment, deleteComment } = useComments();
    const isActive = activeCommentId === comment.id;

    // Time ago
    let timeAgo = "";
    try {
        timeAgo = formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true });
    } catch {
        timeAgo = "just now";
    }

    return (
        <div
            className="absolute z-[99999]"
            style={{
                left: comment.x,
                top: comment.y,
                // Make the bottom-left corner of the pin exactly touch the click coordinate
                transform: "translate(0%, -100%)",
            }}
        >
            {!isActive ? (
                // Closed state (Pin) - styled as a blue teardrop/chat bubble pointing bottom-left
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        setActiveCommentId(comment.id);
                    }}
                    className="relative w-10 h-10 rounded-full rounded-bl-none flex items-center justify-center shadow-lg transition-transform hover:scale-110 active:scale-95 border-2 bg-white origin-bottom-left"
                    style={{ borderColor: "#0E83DF" }}
                >
                    <div className="w-full h-full rounded-full overflow-hidden bg-[#0E83DF] text-white flex items-center justify-center font-bold text-sm">
                        {comment.authorAvatar ? (
                            <img src={comment.authorAvatar} alt={comment.authorName} className="w-full h-full object-cover" />
                        ) : (
                            <span>{comment.authorName.charAt(0).toUpperCase()}</span>
                        )}
                    </div>
                </button>
            ) : (
                // Open state (Chat Bubble Modal)
                <div
                    className="relative bg-[#0E83DF] text-white rounded-[24px] rounded-bl-none shadow-2xl p-4 flex flex-col gap-2 min-w-[300px] max-w-[400px] animate-in zoom-in-95 duration-200 origin-bottom-left"
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-white text-[#0E83DF] flex items-center justify-center overflow-hidden font-bold shrink-0">
                                {comment.authorAvatar ? (
                                    <img src={comment.authorAvatar} alt={comment.authorName} className="w-full h-full object-cover" />
                                ) : (
                                    <span>{comment.authorName.charAt(0).toUpperCase()}</span>
                                )}
                            </div>
                            <div className="flex flex-col">
                                <div className="flex items-baseline gap-2">
                                    <span className="font-bold text-[16px]">{comment.authorName}</span>
                                    <span className="text-[13px] text-white/80 font-medium">{timeAgo}</span>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center opacity-60 hover:opacity-100 transition-opacity pl-4">
                            <button
                                onClick={() => setActiveCommentId(null)}
                                className="p-1 hover:bg-white/20 rounded-md transition-colors"
                                title="Close"
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                    </div>

                    <p className="text-[15px] leading-relaxed mt-1 pl-[52px] break-words">
                        {comment.content}
                    </p>

                    <div className="flex items-center justify-between pl-[52px] mt-3">
                        <button
                            onClick={() => {
                                resolveComment(comment.id, true);
                                setActiveCommentId(null);
                            }}
                            className="bg-white/15 hover:bg-white/25 text-white text-xs px-3 py-1.5 rounded-full flex items-center gap-1.5 font-semibold transition-colors"
                        >
                            <Check className="w-3.5 h-3.5" strokeWidth={3} />
                            Resolve
                        </button>
                        <button
                            onClick={() => {
                                deleteComment(comment.id);
                                setActiveCommentId(null);
                            }}
                            className="text-white/60 hover:text-white hover:bg-white/10 p-1.5 rounded-full transition-colors"
                            title="Delete"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
