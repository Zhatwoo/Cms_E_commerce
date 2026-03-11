"use client";

import React from "react";
import { useCollaboration } from "../_context/CollaborationContext";

/**
 * Renders floating cursors for all remote collaborators on the canvas.
 * Must be rendered inside the canvas scroll+scale container so coordinates align.
 */
const CollaboratorCursors: React.FC = () => {
    const { cursors } = useCollaboration();

    const cursorList = Object.values(cursors);
    if (cursorList.length === 0) return null;

    return (
        <>
            {cursorList.map((cursor) => (
                <div
                    key={cursor.socketId}
                    className="pointer-events-none absolute z-[99998]"
                    style={{
                        left: cursor.position.x,
                        top: cursor.position.y,
                        transform: "translate(-2px, -2px)",
                    }}
                >
                    {/* SVG Cursor */}
                    <svg
                        width="18"
                        height="24"
                        viewBox="0 0 18 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        style={{ filter: `drop-shadow(0 1px 3px rgba(0,0,0,0.4))` }}
                    >
                        <path
                            d="M0.5 0.5L0.5 18.5L4.5 14.5L8 21.5L10.5 20.5L7 13.5H12.5L0.5 0.5Z"
                            fill={cursor.color}
                            stroke="white"
                            strokeWidth="1"
                        />
                    </svg>

                    {/* Name Label */}
                    <div
                        className="absolute top-5 left-3 px-2 py-0.5 rounded-md text-xs font-semibold text-white whitespace-nowrap select-none shadow-lg"
                        style={{
                            backgroundColor: cursor.color,
                            fontFamily: "'Inter', sans-serif",
                        }}
                    >
                        {cursor.displayName}
                    </div>
                </div>
            ))}
        </>
    );
};

export default CollaboratorCursors;
