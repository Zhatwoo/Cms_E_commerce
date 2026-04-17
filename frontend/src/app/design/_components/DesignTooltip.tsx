"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createPortal } from "react-dom";

interface DesignTooltipProps {
    children: React.ReactNode;
    content: string;
    delay?: number;
    position?: "top" | "bottom" | "left" | "right";
}

export const DesignTooltip: React.FC<DesignTooltipProps> = ({
    children,
    content,
    delay = 0.3,
    position = "bottom",
}) => {
    const [isVisible, setIsVisible] = useState(false);
    const [tooltipPos, setTooltipPos] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
    const triggerRef = useRef<HTMLDivElement>(null);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    const TOOLTIP_WIDTH = 220;
    const EDGE_PADDING = 10;

    const handleMouseEnter = () => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => {
            setIsVisible(true);
            if (triggerRef.current) {
                const rect = triggerRef.current.getBoundingClientRect();
                const offset = 8;

                let top = rect.top;
                let left = rect.left + rect.width / 2;

                switch (position) {
                    case "top":
                        top = rect.top - offset;
                        break;
                    case "bottom":
                        top = rect.bottom + offset;
                        break;
                    case "left":
                        left = rect.left - offset;
                        top = rect.top + rect.height / 2;
                        break;
                    case "right":
                        left = rect.right + offset;
                        top = rect.top + rect.height / 2;
                        break;
                }

                const clampedLeft = Math.min(
                    window.innerWidth - TOOLTIP_WIDTH / 2 - EDGE_PADDING,
                    Math.max(TOOLTIP_WIDTH / 2 + EDGE_PADDING, left)
                );

                setTooltipPos({ top, left: clampedLeft });
            }
        }, delay * 1000);
    };

    const handleMouseLeave = () => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
        }
        setIsVisible(false);
    };

    useEffect(() => {
        return () => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
        };
    }, []);

    const tooltipNode = (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.15, ease: "easeOut" }}
                    className="fixed z-[9999] pointer-events-none"
                    style={{
                        top: position === "top" ? `${Math.max(EDGE_PADDING, tooltipPos.top - 8)}px` : `${tooltipPos.top}px`,
                        left: `${tooltipPos.left}px`,
                        transform:
                            position === "left" || position === "right"
                                ? "translateY(-50%)"
                                : "translateX(-50%)",
                    }}
                >
                    <div
                        className={`px-3 py-2 bg-brand-black/95 backdrop-blur-md border border-brand-white/10 rounded-md shadow-2xl max-w-[220px] ${
                            position === "bottom" ? "mt-3" : position === "top" ? "mb-3" : ""
                        }`}
                    >
                        <span className="text-[12px] font-medium text-brand-light tracking-wide leading-relaxed whitespace-normal break-words">
                            {content}
                        </span>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );

    return (
        <>
            <div
                ref={triggerRef}
                className="block"
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
            >
                {children}
            </div>
            {typeof window !== "undefined" ? createPortal(tooltipNode, document.body) : null}
        </>
    );
};
