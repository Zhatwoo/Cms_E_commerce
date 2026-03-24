"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { useComments, Comment } from "../_context/CommentsContext";
import { Check, Trash2, Edit2, Send, Smile, MoreVertical, X } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

// ─── Helpers ────────────────────────────────────────────────────────────────

function getCanvasScale(el: HTMLElement | null): number {
  if (!el) return 1;
  let cur: HTMLElement | null = el;
  while (cur) {
    const t = window.getComputedStyle(cur).transform;
    if (t && t !== "none") {
      const m = t.match(/matrix\(([^,]+)/);
      if (m) {
        const s = parseFloat(m[1]);
        if (Number.isFinite(s) && s > 0) return s;
      }
    }
    cur = cur.parentElement;
  }
  return 1;
}

const EMOJI_REACTIONS = ["👍", "❤️", "😄", "🎉", "🚀", "👀"];
const DRAG_THRESHOLD = 4;

// ─── Root list ───────────────────────────────────────────────────────────────

export const CommentPins: React.FC = () => {
  const { comments } = useComments();
  return (
    <>
      {comments.filter((c) => !c.resolved).map((c) => (
        <CommentPin key={c.id} comment={c} />
      ))}
    </>
  );
};

// ─── Single pin ──────────────────────────────────────────────────────────────

const CommentPin: React.FC<{ comment: Comment }> = ({ comment }) => {
  const {
    activeCommentId,
    setActiveCommentId,
    resolveComment,
    deleteComment,
    updateComment,
    updateCommentPosition,
    addReply,
    deleteReply,
    addReaction,
    removeReaction,
  } = useComments();

  const isExpanded = activeCommentId === comment.id;

  const [pos, setPos] = useState({ x: comment.x, y: comment.y });
  const [hovered, setHovered] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);
  const [replyContent, setReplyContent] = useState("");
  const [showReactions, setShowReactions] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [isDragActive, setIsDragActive] = useState(false);

  const pinRef = useRef<HTMLDivElement>(null);
  const hoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isExpandedRef = useRef(isExpanded);
  const posRef = useRef(pos);

  // Keep refs in sync
  useEffect(() => { isExpandedRef.current = isExpanded; }, [isExpanded]);
  useEffect(() => { posRef.current = pos; }, [pos]);

  // Drag state in a ref — never causes re-renders mid-drag
  const drag = useRef({
    active: false,
    moved: false,
    startClientX: 0,
    startClientY: 0,
    startCanvasX: 0,
    startCanvasY: 0,
    lastCanvasX: 0,  // tracks final position without relying on async posRef
    lastCanvasY: 0,
    ignoreNextSync: false,
  });

  // Sync position from context only when not dragging
  useEffect(() => {
    if (drag.current.active) return;
    if (drag.current.ignoreNextSync) {
      drag.current.ignoreNextSync = false;
      return;
    }
    setPos({ x: comment.x, y: comment.y });
  }, [comment.x, comment.y]);

  // ── Drag ──────────────────────────────────────────────────────────────────

  const onMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (e.button !== 0) return;
      const target = e.target as HTMLElement;
      if (target.closest("button, input, textarea, [contenteditable]")) return;

      e.preventDefault();
      e.stopPropagation();

      // Clear hover timer but keep tooltip visible during drag
      if (hoverTimer.current) clearTimeout(hoverTimer.current);

      document.body.dataset.commentDragging = "true";
      document.body.style.userSelect = "none";

      drag.current = {
        active: true,
        moved: false,
        startClientX: e.clientX,
        startClientY: e.clientY,
        startCanvasX: posRef.current.x,
        startCanvasY: posRef.current.y,
        lastCanvasX: posRef.current.x,
        lastCanvasY: posRef.current.y,
        ignoreNextSync: false,
      };
      setIsDragActive(true);
    },
    [] // no deps — reads from refs
  );

  useEffect(() => {
    if (!isDragActive) return;

    const onMove = (e: MouseEvent) => {
      if (!drag.current.active) return;
      e.preventDefault();
      e.stopPropagation();

      const scale = getCanvasScale(pinRef.current);
      const dx = (e.clientX - drag.current.startClientX) / scale;
      const dy = (e.clientY - drag.current.startClientY) / scale;

      if (!drag.current.moved && (Math.abs(dx) > DRAG_THRESHOLD || Math.abs(dy) > DRAG_THRESHOLD)) {
        drag.current.moved = true;
        // Hide hover tooltip once we confirm it's a real drag
        setHovered(false);
      }

      if (drag.current.moved) {
        const newX = drag.current.startCanvasX + dx;
        const newY = drag.current.startCanvasY + dy;
        drag.current.lastCanvasX = newX;
        drag.current.lastCanvasY = newY;
        setPos({ x: newX, y: newY });
      }
    };

    const onUp = (e: MouseEvent) => {
      const wasMoved = drag.current.moved;
      // Read final position directly from drag ref — avoids async posRef lag
      const finalX = drag.current.lastCanvasX;
      const finalY = drag.current.lastCanvasY;

      if (wasMoved) {
        e.preventDefault();
        e.stopPropagation();
      }

      delete document.body.dataset.commentDragging;
      document.body.style.userSelect = "";

      // Reset drag state
      drag.current.active = false;
      drag.current.moved = false;
      setIsDragActive(false);

      if (wasMoved) {
        // Save new position — don't open the full view
        drag.current.ignoreNextSync = true;
        updateCommentPosition(comment.id, finalX, finalY);
      }
      // If NOT moved: do nothing here — the click will be handled by the
      // onMouseDown → no-op path. The expand toggle is on the avatar click below.
    };

    document.addEventListener("mousemove", onMove, { capture: true, passive: false });
    document.addEventListener("mouseup", onUp, { capture: true, passive: false });
    return () => {
      document.removeEventListener("mousemove", onMove, { capture: true });
      document.removeEventListener("mouseup", onUp, { capture: true });
    };
  }, [isDragActive, comment.id, updateCommentPosition]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      delete document.body.dataset.commentDragging;
      document.body.style.userSelect = "";
      if (hoverTimer.current) clearTimeout(hoverTimer.current);
    };
  }, []);

  // ── Hover ─────────────────────────────────────────────────────────────────

  const onMouseEnter = useCallback(() => {
    if (drag.current.active || isExpandedRef.current) return;
    if (hoverTimer.current) clearTimeout(hoverTimer.current);
    hoverTimer.current = setTimeout(() => {
      if (!drag.current.active && !isExpandedRef.current) setHovered(true);
    }, 200);
  }, []);

  const onMouseLeave = useCallback(() => {
    if (hoverTimer.current) clearTimeout(hoverTimer.current);
    // Don't hide during drag — user may move mouse fast off the pin
    if (drag.current.active) return;
    hoverTimer.current = setTimeout(() => setHovered(false), 120);
  }, []);

  // Click on the avatar bubble to expand (separate from drag)
  const onAvatarClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (drag.current.moved) return; // just finished a drag, ignore
      setHovered(false);
      setActiveCommentId(isExpandedRef.current ? null : comment.id);
    },
    [comment.id, setActiveCommentId]
  );

  // ── Actions ───────────────────────────────────────────────────────────────

  const handleSaveEdit = () => {
    if (editContent.trim() && editContent !== comment.content) {
      updateComment(comment.id, editContent.trim());
    }
    setIsEditing(false);
  };

  const handleAddReply = () => {
    if (replyContent.trim()) {
      addReply(comment.id, replyContent.trim());
      setReplyContent("");
    }
  };

  const handleReaction = (emoji: string) => {
    const existing = comment.reactions?.find((r) => r.emoji === emoji);
    if (existing) removeReaction(comment.id, emoji);
    else addReaction(comment.id, emoji);
    setShowReactions(false);
  };

  const groupedReactions = comment.reactions?.reduce(
    (acc, r) => {
      acc[r.emoji] = acc[r.emoji] ?? [];
      acc[r.emoji]!.push(r);
      return acc;
    },
    {} as Record<string, typeof comment.reactions>
  );

  let timeAgo = "just now";
  try {
    timeAgo = formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true });
  } catch { /* */ }

  const isDragging = isDragActive && drag.current.moved;

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div
      ref={pinRef}
      className="absolute select-none"
      style={{
        left: pos.x,
        top: pos.y,
        transform: "translate(0, -100%)",
        zIndex: isDragging ? 100002 : isExpanded ? 100001 : 99999,
        cursor: isDragging ? "grabbing" : "grab",
        transition: isDragging ? "none" : "left 0.12s ease-out, top 0.12s ease-out",
        willChange: isDragging ? "left, top" : "auto",
        pointerEvents: "auto",
      }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onMouseDown={onMouseDown}
    >
      {!isExpanded ? (
        <CollapsedPin
          comment={comment}
          hovered={hovered}
          isDragging={isDragging}
          timeAgo={timeAgo}
          onAvatarClick={onAvatarClick}
        />
      ) : (
        <ExpandedPin
          comment={comment}
          isDragging={isDragging}
          isEditing={isEditing}
          editContent={editContent}
          replyContent={replyContent}
          showReactions={showReactions}
          showMenu={showMenu}
          groupedReactions={groupedReactions}
          timeAgo={timeAgo}
          onClose={() => setActiveCommentId(null)}
          onEditStart={() => { setIsEditing(true); setShowMenu(false); }}
          onEditCancel={() => { setIsEditing(false); setEditContent(comment.content); }}
          onEditSave={handleSaveEdit}
          onEditChange={setEditContent}
          onReplyChange={setReplyContent}
          onReplySubmit={handleAddReply}
          onReaction={handleReaction}
          onDeleteReply={(rid) => deleteReply(comment.id, rid)}
          onResolve={() => { resolveComment(comment.id, true); setActiveCommentId(null); }}
          onDelete={() => deleteComment(comment.id)}
          onToggleReactions={() => setShowReactions((v) => !v)}
          onToggleMenu={() => setShowMenu((v) => !v)}
        />
      )}
    </div>
  );
};

// ─── Collapsed pin ───────────────────────────────────────────────────────────

const CollapsedPin: React.FC<{
  comment: Comment;
  hovered: boolean;
  isDragging: boolean;
  timeAgo: string;
  onAvatarClick: (e: React.MouseEvent) => void;
}> = ({ comment, hovered, isDragging, timeAgo, onAvatarClick }) => (
  <div className="relative" style={{ transform: "translateY(100%)" }}>
    {/* Avatar bubble */}
    <div
      className="relative w-9 h-9 rounded-full flex items-center justify-center border-2 bg-white"
      style={{
        borderColor: comment.color || "#0066FF",
        boxShadow: isDragging
          ? "0 12px 32px rgba(0,0,0,0.22)"
          : hovered
          ? "0 4px 16px rgba(0,0,0,0.18)"
          : "0 2px 8px rgba(0,0,0,0.12)",
        transform: isDragging ? "scale(1.08)" : hovered ? "scale(1.05)" : "scale(1)",
        transition: isDragging ? "none" : "transform 0.15s ease, box-shadow 0.15s ease",
      }}
      onClick={onAvatarClick}
    >
      <div
        className="w-full h-full rounded-full overflow-hidden flex items-center justify-center font-bold text-xs text-white"
        style={{ backgroundColor: comment.color || "#0066FF" }}
      >
        {comment.authorAvatar ? (
          <img src={comment.authorAvatar} alt={comment.authorName} className="w-full h-full object-cover" />
        ) : (
          <span>{comment.authorName.charAt(0).toUpperCase()}</span>
        )}
      </div>
      {(comment.replies?.length ?? 0) > 0 && (
        <div className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center leading-none">
          {comment.replies!.length}
        </div>
      )}
    </div>

    {/* Hover preview — stays visible during drag */}
    {hovered && (
      <div
        className="absolute left-full top-1/2 -translate-y-1/2 ml-2.5 bg-white rounded-xl shadow-2xl border border-gray-200/80 p-3 min-w-[220px] max-w-[280px] pointer-events-none"
        style={{ animation: "commentFadeIn 0.12s ease-out", zIndex: 100003 }}
      >
        <div className="absolute right-full top-1/2 -translate-y-1/2 border-[6px] border-transparent border-r-white" />
        <div className="absolute right-full top-1/2 -translate-y-1/2 mr-[-1px] border-[7px] border-transparent border-r-gray-200/80" />
        <div className="flex items-center gap-2 mb-1.5">
          <span className="font-semibold text-[13px] text-gray-900 leading-tight">{comment.authorName}</span>
          <span className="text-[11px] text-gray-400">{timeAgo}</span>
        </div>
        <p className="text-[13px] text-gray-700 leading-relaxed line-clamp-3">{comment.content}</p>
        <p className="mt-2 text-[11px] text-gray-400">Click to expand</p>
      </div>
    )}
  </div>
);

// ─── Expanded pin ────────────────────────────────────────────────────────────

interface ExpandedPinProps {
  comment: Comment;
  isDragging: boolean;
  isEditing: boolean;
  editContent: string;
  replyContent: string;
  showReactions: boolean;
  showMenu: boolean;
  groupedReactions: Record<string, Comment["reactions"]> | undefined;
  timeAgo: string;
  onClose: () => void;
  onEditStart: () => void;
  onEditCancel: () => void;
  onEditSave: () => void;
  onEditChange: (v: string) => void;
  onReplyChange: (v: string) => void;
  onReplySubmit: () => void;
  onReaction: (emoji: string) => void;
  onDeleteReply: (id: string) => void;
  onResolve: () => void;
  onDelete: () => void;
  onToggleReactions: () => void;
  onToggleMenu: () => void;
}

const ExpandedPin: React.FC<ExpandedPinProps> = ({
  comment, isDragging, isEditing, editContent, replyContent,
  showReactions, showMenu, groupedReactions, timeAgo,
  onClose, onEditStart, onEditCancel, onEditSave, onEditChange,
  onReplyChange, onReplySubmit, onReaction, onDeleteReply,
  onResolve, onDelete, onToggleReactions, onToggleMenu,
}) => (
  <div
    className="relative bg-white rounded-2xl border border-gray-200/80 flex flex-col min-w-[320px] max-w-[380px]"
    style={{
      boxShadow: isDragging ? "0 24px 48px rgba(0,0,0,0.18)" : "0 8px 32px rgba(0,0,0,0.12)",
      transition: isDragging ? "none" : "box-shadow 0.2s ease",
      transformOrigin: "bottom left",
      animation: "commentPopIn 0.18s cubic-bezier(0.34,1.56,0.64,1)",
    }}
    onClick={(e) => e.stopPropagation()}
  >
    {/* Header */}
    <div className="flex items-start justify-between px-4 pt-4 pb-3 border-b border-gray-100 cursor-grab active:cursor-grabbing">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center overflow-hidden font-bold text-xs shrink-0 text-white"
          style={{ backgroundColor: comment.color || "#0066FF" }}
        >
          {comment.authorAvatar ? (
            <img src={comment.authorAvatar} alt={comment.authorName} className="w-full h-full object-cover" />
          ) : (
            <span>{comment.authorName.charAt(0).toUpperCase()}</span>
          )}
        </div>
        <div className="flex flex-col min-w-0">
          <span className="font-semibold text-[13px] text-gray-900 truncate">{comment.authorName}</span>
          <span className="text-[11px] text-gray-400">{timeAgo}</span>
        </div>
      </div>
      <div className="flex items-center gap-0.5 shrink-0">
        <div className="relative">
          <button onClick={onToggleMenu} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors" title="More options">
            <MoreVertical className="w-4 h-4 text-gray-500" />
          </button>
          {showMenu && (
            <div className="absolute right-0 top-full mt-1 bg-white rounded-xl shadow-xl border border-gray-200 py-1 min-w-[130px] z-10">
              <button onClick={onEditStart} className="w-full px-3 py-2 text-left text-[13px] hover:bg-gray-50 flex items-center gap-2 text-gray-700">
                <Edit2 className="w-3.5 h-3.5" /> Edit
              </button>
              <button onClick={onDelete} className="w-full px-3 py-2 text-left text-[13px] hover:bg-gray-50 text-red-600 flex items-center gap-2">
                <Trash2 className="w-3.5 h-3.5" /> Delete
              </button>
            </div>
          )}
        </div>
        <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors" title="Close">
          <X className="w-4 h-4 text-gray-500" />
        </button>
      </div>
    </div>

    {/* Body */}
    <div className="px-4 py-3">
      {isEditing ? (
        <div className="flex flex-col gap-2">
          <textarea
            value={editContent}
            onChange={(e) => onEditChange(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-xl text-[13px] resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows={3}
            autoFocus
          />
          <div className="flex gap-2 justify-end">
            <button onClick={onEditCancel} className="px-3 py-1.5 text-[13px] text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">Cancel</button>
            <button onClick={onEditSave} className="px-3 py-1.5 text-[13px] bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">Save</button>
          </div>
        </div>
      ) : (
        <p className="text-[13px] leading-relaxed text-gray-800 break-words whitespace-pre-wrap">{comment.content}</p>
      )}
    </div>

    {/* Reactions */}
    {groupedReactions && Object.keys(groupedReactions).length > 0 && (
      <div className="px-4 pb-3 flex flex-wrap gap-1">
        {Object.entries(groupedReactions).map(([emoji, reactions]) => (
          <button key={emoji} onClick={() => onReaction(emoji)} className="px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded-full text-xs flex items-center gap-1 transition-colors">
            <span>{emoji}</span>
            <span className="text-gray-600 font-medium">{reactions!.length}</span>
          </button>
        ))}
      </div>
    )}

    {/* Replies */}
    {comment.replies && comment.replies.length > 0 && (
      <div className="px-4 pb-3 space-y-3 border-t border-gray-100 pt-3 max-h-48 overflow-y-auto">
        {comment.replies.map((reply) => {
          let rTimeAgo = "just now";
          try { rTimeAgo = formatDistanceToNow(new Date(reply.createdAt), { addSuffix: true }); } catch { /* */ }
          return (
            <div key={reply.id} className="flex gap-2 group">
              <div className="w-6 h-6 rounded-full flex items-center justify-center overflow-hidden font-bold text-[10px] shrink-0 text-white" style={{ backgroundColor: comment.color || "#0066FF" }}>
                {reply.authorAvatar ? <img src={reply.authorAvatar} alt={reply.authorName} className="w-full h-full object-cover" /> : <span>{reply.authorName.charAt(0).toUpperCase()}</span>}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2">
                  <span className="font-semibold text-[12px] text-gray-900">{reply.authorName}</span>
                  <span className="text-[11px] text-gray-400">{rTimeAgo}</span>
                </div>
                <p className="text-[13px] text-gray-700 break-words mt-0.5">{reply.content}</p>
              </div>
              <button onClick={() => onDeleteReply(reply.id)} className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-100 rounded transition-all shrink-0" title="Delete reply">
                <Trash2 className="w-3 h-3 text-gray-400" />
              </button>
            </div>
          );
        })}
      </div>
    )}

    {/* Action bar */}
    <div className="px-4 pb-3 flex items-center gap-2 border-t border-gray-100 pt-3">
      <div className="relative">
        <button onClick={onToggleReactions} className="p-2 hover:bg-gray-100 rounded-full transition-colors" title="Add reaction">
          <Smile className="w-4 h-4 text-gray-500" />
        </button>
        {showReactions && (
          <div className="absolute bottom-full left-0 mb-2 bg-white rounded-xl shadow-xl border border-gray-200 p-2 flex gap-1 z-10">
            {EMOJI_REACTIONS.map((emoji) => (
              <button key={emoji} onClick={() => onReaction(emoji)} className="w-8 h-8 hover:bg-gray-100 rounded-lg transition-colors text-lg flex items-center justify-center">{emoji}</button>
            ))}
          </div>
        )}
      </div>
      <button onClick={onResolve} className="ml-auto bg-emerald-600 hover:bg-emerald-700 text-white text-[12px] px-3 py-1.5 rounded-full flex items-center gap-1.5 font-semibold transition-colors">
        <Check className="w-3.5 h-3.5" strokeWidth={2.5} /> Resolve
      </button>
    </div>

    {/* Reply input */}
    <div className="px-4 pb-4 flex gap-2 border-t border-gray-100 pt-3">
      <input
        type="text"
        value={replyContent}
        onChange={(e) => onReplyChange(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); onReplySubmit(); } }}
        placeholder="Reply..."
        className="flex-1 px-3 py-2 border border-gray-200 rounded-xl text-[13px] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      />
      <button onClick={onReplySubmit} disabled={!replyContent.trim()} className="p-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
        <Send className="w-4 h-4" />
      </button>
    </div>
  </div>
);
