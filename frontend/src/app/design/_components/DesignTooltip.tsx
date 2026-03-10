"use client";

import React, { useState } from "react";
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
    let timeout: NodeJS.Timeout;

    const handleMouseEnter = () => {
        timeout = setTimeout(() => {
            setIsVisible(true);
        }, delay * 1000);
    };

    const handleMouseLeave = () => {
        clearTimeout(timeout);
        setIsVisible(false);
    };

    const positions = {
        top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
        bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
        left: "right-full top-1/2 -translate-y-1/2 mr-2",
        right: "left-full top-1/2 -translate-y-1/2 ml-2",
    };

    return (
        <div
            className="relative flex items-center"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            {children}
            <AnimatePresence>
                {isVisible && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: position === "top" ? 5 : -5 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: position === "top" ? 5 : -5 }}
                        transition={{ duration: 0.15, ease: "easeOut" }}
                        className={`absolute z-[9999] pointer-events-none ${positions[position]}`}
                    >
                        <div className="px-2 py-1 bg-brand-black/90 backdrop-blur-md border border-white/10 rounded-md shadow-xl whitespace-nowrap">
                            <span className="text-[10px] font-medium text-brand-light tracking-wide">
                                {content}
                            </span>
                        </div>
                        {/* Arrow */}
                        <div
                            className={`absolute w-1.5 h-1.5 bg-brand-black/90 border-white/10 rotate-45 pointer-events-none
                ${position === "top" ? "bottom-[-4px] left-1/2 -translate-x-1/2 border-r border-b" : ""}
                ${position === "bottom" ? "top-[-4px] left-1/2 -translate-x-1/2 border-l border-t" : ""}
                ${position === "left" ? "right-[-4px] top-1/2 -translate-y-1/2 border-r border-t" : ""}
                ${position === "right" ? "left-[-4px] top-1/2 -translate-y-1/2 border-l border-b" : ""}
              `}
                        />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
