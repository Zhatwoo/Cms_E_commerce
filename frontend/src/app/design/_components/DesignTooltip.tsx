"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

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
    let timeout: NodeJS.Timeout;

    const handleMouseEnter = () => {
        timeout = setTimeout(() => {
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

                setTooltipPos({ top, left });
            }
        }, delay * 1000);
    };

    const handleMouseLeave = () => {
        clearTimeout(timeout);
        setIsVisible(false);
    };

    return (
        <>
            <div
                ref={triggerRef}
                className="w-full"
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
            >
                {children}
            </div>
            <AnimatePresence>
                {isVisible && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.15, ease: "easeOut" }}
                        className={`fixed z-[9999] pointer-events-none`}
                        style={{
                            top: position === "top" ? `${Math.max(10, tooltipPos.top - 8)}px` : `${tooltipPos.top}px`,
                            left: `${Math.min(window.innerWidth - 250, Math.max(10, tooltipPos.left - 125))}px`,
                            transform: position === "left" || position === "right"
                                ? "translateY(-50%)"
                                : "translateX(-50%)",
                        }}
                    >
                        <div className={`px-3 py-2 bg-brand-black/95 backdrop-blur-md border border-brand-white/10 rounded-md shadow-2xl max-w-[200px] ${
                            position === "bottom" ? "mt-3" : position === "top" ? "mb-3" : ""
                        }`}>
                            <span className="text-[11px] font-medium text-brand-light tracking-wide leading-snug">
                                {content}
                            </span>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};
