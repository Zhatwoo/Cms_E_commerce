"use client";

import React, { useState, useEffect, useRef, useCallback, useId } from "react";
import ReactDOM from "react-dom";
import { Pipette, ChevronDown, Square, Blend, Grid3X3, ImageIcon, Video } from "lucide-react";

type HSVA = { h: number; s: number; v: number; a: number };
type RGBA = { r: number; g: number; b: number; a: number };
type PaintMode = "solid" | "gradient" | "pattern" | "image" | "video";
type GradientType = "linear" | "radial";
type PatternType = "dots" | "grid" | "diagonal";
type GradientStop = { id: string; position: number; color: string; alpha: number };

// --- Utils ---

function hsvaToRgba(h: number, s: number, v: number, a: number): RGBA {
    let r = 0, g = 0, b = 0;
    const i = Math.floor(h * 6);
    const f = h * 6 - i;
    const p = v * (1 - s);
    const q = v * (1 - f * s);
    const t = v * (1 - (1 - f) * s);
    switch (i % 6) {
        case 0: r = v; g = t; b = p; break;
        case 1: r = q; g = v; b = p; break;
        case 2: r = p; g = v; b = t; break;
        case 3: r = p; g = q; b = v; break;
        case 4: r = t; g = p; b = v; break;
        case 5: r = v; g = p; b = q; break;
    }
    return { r: Math.round(r * 255), g: Math.round(g * 255), b: Math.round(b * 255), a };
}

function rgbaToHsva(r: number, g: number, b: number, a: number): HSVA {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0, s = 0, v = max;
    const d = max - min;
    s = max === 0 ? 0 : d / max;
    if (max !== min) {
        switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
    }
    return { h, s, v, a };
}

function hexToRgba(hex: string): RGBA {
    hex = hex.replace("#", "");
    if (hex === "transparent") return { r: 0, g: 0, b: 0, a: 0 };
    if (hex.length === 3) hex = hex.split("").map(x => x + x).join("");
    if (hex.length === 4) hex = hex.split("").map(x => x + x).join("");

    const r = parseInt(hex.substring(0, 2), 16) || 0;
    const g = parseInt(hex.substring(2, 4), 16) || 0;
    const b = parseInt(hex.substring(4, 6), 16) || 0;
    let a = 1;
    if (hex.length === 8) {
        a = parseInt(hex.substring(6, 8), 16) / 255;
    }
    return { r, g, b, a: isNaN(a) ? 1 : a };
}

function rgbaToHex(r: number, g: number, b: number, a: number): string {
    const toHex = (n: number) => n.toString(16).padStart(2, "0").toUpperCase();
    const alphaHex = toHex(Math.round(a * 255));
    return `#${toHex(r)}${toHex(g)}${toHex(b)}${alphaHex === "FF" ? "" : alphaHex}`;
}

function rgbaToHsla(r: number, g: number, b: number, a: number) {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0, s = 0, l = (max + min) / 2;
    if (max === min) {
        h = s = 0;
    } else {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
    }
    return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100), a };
}

function hslaToRgba(h: number, s: number, l: number, a: number): RGBA {
    s /= 100; l /= 100;
    const k = (n: number) => (n + h / 30) % 12;
    const f = (n: number) => l - s * Math.min(l, 1 - l) * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
    return { r: Math.round(255 * f(0)), g: Math.round(255 * f(8)), b: Math.round(255 * f(4)), a };
}

const CHECKER_BG = "linear-gradient(45deg, #808080 25%, transparent 25%), linear-gradient(-45deg, #808080 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #808080 75%), linear-gradient(-45deg, transparent 75%, #808080 75%)";
const CHECKER_BG_SIZE = "8px 8px";
const CHECKER_BG_POS = "0 0, 0 4px, 4px 4px, 4px 0";

const isHexLike = (val: string) => /^#?[0-9A-Fa-f]{3}$|^#?[0-9A-Fa-f]{6}$|^#?[0-9A-Fa-f]{8}$/.test(val.trim());

const normalizeHex = (val: string) => {
    const trimmed = val.trim();
    if (!isHexLike(trimmed)) return null;
    return trimmed.startsWith("#") ? `#${trimmed.slice(1).toUpperCase()}` : `#${trimmed.toUpperCase()}`;
};

const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));

const detectPaintMode = (val: string): PaintMode => {
    if (/^repeating-(linear|radial)-gradient/i.test(val)) return "pattern";
    if (/^(linear|radial)-gradient/i.test(val)) return "gradient";
    if (/^url\(/i.test(val)) return "image";
    return "solid";
};

const rgbaCss = (hex: string, alphaPct: number) => {
    const rgba = hexToRgba(hex);
    const a = clamp(alphaPct, 0, 100) / 100;
    return `rgba(${rgba.r}, ${rgba.g}, ${rgba.b}, ${a})`;
};

const buildGradientCss = (type: GradientType, angle: number, stops: GradientStop[]) => {
    const sorted = [...stops].sort((a, b) => a.position - b.position);
    const stopExpr = sorted.map((stop) => `${rgbaCss(stop.color, stop.alpha)} ${clamp(stop.position, 0, 100)}%`).join(", ");
    if (type === "radial") {
        return `radial-gradient(circle at center, ${stopExpr})`;
    }
    return `linear-gradient(${clamp(angle, 0, 360)}deg, ${stopExpr})`;
};

const buildPatternCss = (patternType: PatternType, color: string, cell: number) => {
    const size = clamp(cell, 6, 64);
    if (patternType === "dots") {
        return `radial-gradient(${color} 20%, transparent 21%) 0 0 / ${size}px ${size}px`;
    }
    if (patternType === "grid") {
        return `linear-gradient(${color} 1px, transparent 1px), linear-gradient(90deg, ${color} 1px, transparent 1px)`;
    }
    return `repeating-linear-gradient(45deg, ${color} 0 ${Math.max(1, Math.floor(size / 4))}px, transparent ${Math.max(1, Math.floor(size / 4))}px ${Math.max(2, Math.floor(size / 2))}px)`;
};

const extractUrlFromCss = (val: string) => {
    const match = val.match(/url\((['"]?)(.*?)\1\)/i);
    return match?.[2] || "";
};

// --- Components ---

interface ColorPickerProps {
    value: string;
    onChange: (val: string) => void;
    label?: string;
    className?: string;
    openKey?: number;
    toggleKey?: number;
    enableFillModes?: boolean;
    enableMediaFillModes?: boolean;
    popoverContainerRef?: React.RefObject<HTMLDivElement | null>;
}

export const ColorPicker = ({ value, onChange, label, className = "", openKey, toggleKey, enableFillModes = false, enableMediaFillModes = false, popoverContainerRef }: ColorPickerProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const swatchRef = useRef<HTMLButtonElement>(null);
    const lastOpenKeyRef = useRef<number | undefined>(openKey);
    const lastToggleKeyRef = useRef<number | undefined>(toggleKey);
    const id = useId();

    const toggle = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsOpen(!isOpen);
    };

    useEffect(() => {
        if (!isOpen) return;
        const handleClickOutside = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node) &&
                swatchRef.current && !swatchRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [isOpen]);

    useEffect(() => {
        if (openKey === undefined) return;
        if (lastOpenKeyRef.current !== openKey) {
            setIsOpen(true);
            lastOpenKeyRef.current = openKey;
        }
    }, [openKey]);

    useEffect(() => {
        if (toggleKey === undefined) return;
        if (lastToggleKeyRef.current !== toggleKey) {
            setIsOpen((prev) => !prev);
            lastToggleKeyRef.current = toggleKey;
        }
    }, [toggleKey]);

    const effectiveColor = value === "transparent" ? "#00000000" : value;
    const rgba = hexToRgba(effectiveColor);
    const swatchPaint = value === "transparent" ? "transparent" : value;

    return (
        <div ref={containerRef} className={`relative flex flex-col gap-1 ${className}`}>
            {label && <label className="text-[10px] text-[var(--builder-text)] font-medium">{label}</label>}
            <div className="flex items-center gap-2 bg-[var(--builder-surface-2)] rounded-lg p-1 border border-[var(--builder-border)] hover:border-[var(--builder-border-mid)] transition-colors">
                <button
                    ref={swatchRef}
                    onClick={toggle}
                    className="w-8 h-8 rounded-md border border-transparent relative overflow-hidden flex-shrink-0"
                    style={{ background: CHECKER_BG, backgroundSize: CHECKER_BG_SIZE, backgroundPosition: CHECKER_BG_POS }}
                >
                    <div className="absolute inset-0" style={{ background: swatchPaint }} />
                </button>

                <div className="flex-1 flex flex-col min-w-0">
                    <ColorTextValue value={value} onChange={onChange} />
                </div>

                <div className="flex items-center gap-1 pr-1 border-l border-transparent pl-2">
                    <span className="text-[10px] text-[var(--builder-text-faint)] font-bold">{Math.round(rgba.a * 100)}%</span>
                </div>
            </div>

            {isOpen && (
                <ColorPickerPopover
                    value={effectiveColor}
                    onChange={onChange}
                    onClose={() => setIsOpen(false)}
                    anchorRef={swatchRef}
                    enableFillModes={enableFillModes}
                    enableMediaFillModes={enableMediaFillModes}
                    containerRef={popoverContainerRef}
                />
            )}
        </div>
    );
};

const ColorPickerPopover = ({ value, onChange, onClose, anchorRef, enableFillModes = false, enableMediaFillModes = false, containerRef }: {
    value: string;
    onChange: (val: string) => void;
    onClose: () => void;
    anchorRef: React.RefObject<HTMLButtonElement | null>;
    enableFillModes?: boolean;
    enableMediaFillModes?: boolean;
    containerRef?: React.RefObject<HTMLDivElement | null>;
}) => {
    const popoverRef = useRef<HTMLDivElement>(null);
    const [coords, setCoords] = useState<{ top: number; left: number }>({ top: 10, left: 10 });
    const [popoverWidth, setPopoverWidth] = useState(enableFillModes ? 280 : 240);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const dragStartRef = useRef<{ x: number; y: number } | null>(null);
    const coordsAtDragStartRef = useRef<{ top: number; left: number } | null>(null);
    const savedPositionKeyRef = useRef('colorPickerSavedPosition');

    const rgba = hexToRgba(value);
    const [hsva, setHsva] = useState(() => rgbaToHsva(rgba.r, rgba.g, rgba.b, rgba.a));
    const [mode, setMode] = useState<'HEX' | 'RGB' | 'HSL'>('HEX');
    const [paintMode, setPaintMode] = useState<PaintMode>(() => detectPaintMode(value));
    const [gradientType, setGradientType] = useState<GradientType>('linear');
    const [gradientAngle, setGradientAngle] = useState(90);
    const [gradientStops, setGradientStops] = useState<GradientStop[]>([
        { id: 's1', position: 0, color: '#FFFFFF', alpha: 100 },
        { id: 's2', position: 47, color: '#ECECEC', alpha: 100 },
        { id: 's3', position: 100, color: '#999999', alpha: 100 },
    ]);
    const [patternType, setPatternType] = useState<PatternType>('grid');
    const [patternColor, setPatternColor] = useState('#777777');
    const [patternCellSize, setPatternCellSize] = useState(18);
    const [imageUrl, setImageUrl] = useState(() => extractUrlFromCss(value));
    const [videoUrl, setVideoUrl] = useState('');
    const imageInputRef = useRef<HTMLInputElement>(null);
    const videoInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (!enableMediaFillModes && (paintMode === "image" || paintMode === "video")) {
            setPaintMode("solid");
        }
    }, [enableMediaFillModes, paintMode]);

    useEffect(() => {
        const freshRgba = hexToRgba(value);
        setHsva(rgbaToHsva(freshRgba.r, freshRgba.g, freshRgba.b, freshRgba.a));
    }, [value]);

    React.useLayoutEffect(() => {
        const updatePosition = () => {
            if (!anchorRef.current) return;

            // Try to load saved position first
            const savedPosStr = typeof window !== 'undefined' ? window.localStorage?.getItem(savedPositionKeyRef.current) : null;
            
            if (savedPosStr) {
                try {
                    const saved = JSON.parse(savedPosStr);
                    if (saved && typeof saved.top === 'number' && typeof saved.left === 'number') {
                        setCoords(saved);
                        return;
                    }
                } catch (e) {
                    // Invalid saved position, continue to calculate default
                    if (typeof window !== 'undefined') {
                        window.localStorage?.removeItem(savedPositionKeyRef.current);
                    }
                }
            }

            // Calculate default position (viewport-based)
            const rect = anchorRef.current.getBoundingClientRect();
            const viewportPadding = 8;
            const desiredWidth = enableFillModes ? 280 : 240;
            const nextWidth = Math.min(desiredWidth, Math.max(220, window.innerWidth - viewportPadding * 2));
            const popHeight = popoverRef.current?.offsetHeight || 336;

            let left = rect.right - nextWidth;
            const maxLeft = window.innerWidth - nextWidth - viewportPadding;
            left = Math.max(viewportPadding, Math.min(left, maxLeft));

            let top = rect.bottom + 8;
            if (top + popHeight > window.innerHeight - viewportPadding) {
                top = rect.top - popHeight - 8;
            }
            top = Math.max(viewportPadding, top);

            setPopoverWidth(nextWidth);
            setCoords({ top, left });
        };

        updatePosition();
        window.addEventListener("resize", updatePosition);
        window.addEventListener("scroll", updatePosition, true);

        return () => {
            window.removeEventListener("resize", updatePosition);
            window.removeEventListener("scroll", updatePosition, true);
        };
    }, [anchorRef, enableFillModes, paintMode, gradientStops.length]);

    const updateColor = (newHsva: Partial<HSVA>) => {
        const updated = { ...hsva, ...newHsva };
        setHsva(updated);
        const rgb = hsvaToRgba(updated.h, updated.s, updated.v, updated.a);
        const hex = rgbaToHex(rgb.r, rgb.g, rgb.b, rgb.a);
        onChange(hex);
    };

    const applyGradient = useCallback((nextStops = gradientStops, nextType = gradientType, nextAngle = gradientAngle) => {
        onChange(buildGradientCss(nextType, nextAngle, nextStops));
    }, [gradientStops, gradientType, gradientAngle, onChange]);

    const applyPattern = useCallback((nextType = patternType, nextColor = patternColor, nextCell = patternCellSize) => {
        onChange(buildPatternCss(nextType, nextColor, nextCell));
    }, [patternType, patternColor, patternCellSize, onChange]);

    const applyImage = useCallback((url: string) => {
        const safe = url.trim();
        if (!safe) return;
        onChange(`url("${safe}") center / cover no-repeat`);
    }, [onChange]);

    const applyVideo = useCallback((url: string) => {
        const safe = url.trim();
        if (!safe) return;
        onChange(`url("${safe}") center / cover no-repeat`);
    }, [onChange]);

    const handlePaintModeSelect = (next: PaintMode) => {
        setPaintMode(next);
        if (next === "gradient") {
            applyGradient();
            return;
        }
        if (next === "pattern") {
            applyPattern();
            return;
        }
        if (next === "image") {
            if (imageUrl) applyImage(imageUrl);
            return;
        }
        if (next === "video") {
            if (videoUrl) applyVideo(videoUrl);
        }
    };

    const handleEyeDropper = async () => {
        // @ts-ignore
        if (typeof window !== 'undefined' && 'EyeDropper' in window) {
            try {
                // @ts-ignore
                const eyeDropper = new window.EyeDropper();
                const result = await eyeDropper.open();
                onChange(result.sRGBHex);
            } catch (e) {
                // ignore
            }
        }
    };

    // --- Drag Handlers ---
    const handleDragStart = (e: React.MouseEvent) => {
        e.preventDefault();
        setIsDragging(true);
        dragStartRef.current = { x: e.clientX, y: e.clientY };
        coordsAtDragStartRef.current = coords;

        const handleDragMove = (ev: MouseEvent) => {
            if (!dragStartRef.current || !coordsAtDragStartRef.current) return;
            const deltaX = ev.clientX - dragStartRef.current.x;
            const deltaY = ev.clientY - dragStartRef.current.y;
            setDragOffset({ x: deltaX, y: deltaY });
        };

        const handleDragEnd = () => {
            setIsDragging(false);
            if (coordsAtDragStartRef.current && (dragOffset.x !== 0 || dragOffset.y !== 0)) {
                const newCoords = {
                    top: coordsAtDragStartRef.current.top + dragOffset.y,
                    left: coordsAtDragStartRef.current.left + dragOffset.x,
                };
                setCoords(newCoords);
                // Save position to localStorage
                if (typeof window !== 'undefined') {
                    try {
                        window.localStorage?.setItem(savedPositionKeyRef.current, JSON.stringify(newCoords));
                    } catch (e) {
                        // localStorage might be unavailable
                    }
                }
            }
            dragStartRef.current = null;
            setDragOffset({ x: 0, y: 0 });
            window.removeEventListener("mousemove", handleDragMove);
            window.removeEventListener("mouseup", handleDragEnd);
        };

        window.addEventListener("mousemove", handleDragMove);
        window.addEventListener("mouseup", handleDragEnd);
    };

    // --- Saturation/Value Area Handlers ---
    const satRef = useRef<HTMLDivElement>(null);
    const handleSatDown = (e: React.MouseEvent | React.TouchEvent) => {
        const move = (ev: MouseEvent | TouchEvent) => {
            if (!satRef.current) return;
            const rect = satRef.current.getBoundingClientRect();
            const clientX = 'touches' in ev ? (ev as TouchEvent).touches[0].clientX : (ev as MouseEvent).clientX;
            const clientY = 'touches' in ev ? (ev as TouchEvent).touches[0].clientY : (ev as MouseEvent).clientY;
            const s = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
            const v = Math.max(0, Math.min(1, 1 - (clientY - rect.top) / rect.height));
            updateColor({ s, v });
        };
        const up = () => {
            window.removeEventListener("mousemove", move);
            window.removeEventListener("mouseup", up);
            window.removeEventListener("touchmove", move);
            window.removeEventListener("touchend", up);
        };
        window.addEventListener("mousemove", move);
        window.addEventListener("mouseup", up);
        window.addEventListener("touchmove", move);
        window.addEventListener("touchend", up);
        move(e.nativeEvent as any);
    };

    // --- Hue Handler ---
    const hueRef = useRef<HTMLDivElement>(null);
    const handleHueDown = (e: React.MouseEvent | React.TouchEvent) => {
        const move = (ev: MouseEvent | TouchEvent) => {
            if (!hueRef.current) return;
            const rect = hueRef.current.getBoundingClientRect();
            const clientX = 'touches' in ev ? (ev as TouchEvent).touches[0].clientX : (ev as MouseEvent).clientX;
            const h = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
            updateColor({ h });
        };
        const up = () => {
            window.removeEventListener("mousemove", move);
            window.removeEventListener("mouseup", up);
        };
        window.addEventListener("mousemove", move);
        window.addEventListener("mouseup", up);
        move(e.nativeEvent as any);
    };

    // --- Alpha Handler ---
    const alphaRef = useRef<HTMLDivElement>(null);
    const handleAlphaDown = (e: React.MouseEvent | React.TouchEvent) => {
        const move = (ev: MouseEvent | TouchEvent) => {
            if (!alphaRef.current) return;
            const rect = alphaRef.current.getBoundingClientRect();
            const clientX = 'touches' in ev ? (ev as TouchEvent).touches[0].clientX : (ev as MouseEvent).clientX;
            const a = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
            updateColor({ a });
        };
        const up = () => {
            window.removeEventListener("mousemove", move);
            window.removeEventListener("mouseup", up);
        };
        window.addEventListener("mousemove", move);
        window.addEventListener("mouseup", up);
        move(e.nativeEvent as any);
    };

    const hueRgb = hsvaToRgba(hsva.h, 1, 1, 1);
    const currentRgb = hsvaToRgba(hsva.h, hsva.s, hsva.v, 1);

    return ReactDOM.createPortal(
        <div
            ref={popoverRef}
            className="fixed z-[9999] bg-[var(--builder-surface)] p-3 rounded-xl border border-transparent shadow-2xl flex flex-col gap-4 animate-in fade-in zoom-in duration-150"
            style={{
                width: `${popoverWidth}px`,
                maxHeight: '85vh',
                overflowY: 'auto',
                top: `${coords.top + dragOffset.y}px`,
                left: `${coords.left + dragOffset.x}px`,
                opacity: 1,
                pointerEvents: 'auto',
                transition: isDragging ? 'none' : 'opacity 0.15s, transform 0.15s',
                cursor: isDragging ? 'grabbing' : 'default'
            }}
            onMouseDown={(e) => e.stopPropagation()}
        >
            {/* Drag Handle Header */}
            <div
                onMouseDown={handleDragStart}
                className="flex items-center justify-center py-1.5 mb-1 cursor-grab active:cursor-grabbing rounded-lg hover:bg-[var(--builder-surface-2)] transition-colors"
                title="Drag to move"
            >
                <div className="h-1 w-12 rounded-full bg-[var(--builder-border-mid)]" />
            </div>

            {enableFillModes && (
                <div className="flex items-center gap-2 pb-2 border-b border-[var(--builder-border)]">
                    {[
                        { key: 'solid', icon: Square, title: 'Solid' },
                        { key: 'gradient', icon: Blend, title: 'Gradient' },
                        { key: 'pattern', icon: Grid3X3, title: 'Pattern' },
                        ...(enableMediaFillModes
                            ? [
                                { key: 'image', icon: ImageIcon, title: 'Image' },
                                { key: 'video', icon: Video, title: 'Video' },
                            ]
                            : []),
                    ].map((item) => {
                        const Icon = item.icon as React.ComponentType<{ size?: number; className?: string }>;
                        const active = paintMode === item.key;
                        return (
                            <button
                                key={item.key}
                                type="button"
                                onClick={() => handlePaintModeSelect(item.key as PaintMode)}
                                title={item.title}
                                className={`h-7 w-7 rounded-md border flex items-center justify-center transition-colors ${active ? "bg-[var(--builder-surface-3)] border-[var(--builder-border-mid)] text-[var(--builder-text)]" : "bg-[var(--builder-surface-2)] border-[var(--builder-border)] text-[var(--builder-text-faint)] hover:text-[var(--builder-text)]"}`}
                            >
                                <Icon size={14} />
                            </button>
                        );
                    })}
                </div>
            )}

            {(!enableFillModes || paintMode === "solid") && (
                <>
                    <div
                        ref={satRef}
                        onMouseDown={handleSatDown}
                        onTouchStart={handleSatDown}
                        className="relative w-full h-[140px] rounded-lg cursor-crosshair overflow-hidden"
                        style={{ backgroundColor: `rgb(${hueRgb.r}, ${hueRgb.g}, ${hueRgb.b})` }}
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-white to-transparent" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent" />
                        <div
                            className="absolute w-3 h-3 rounded-full border-2 border-white shadow-md -translate-x-1/2 -translate-y-1/2 pointer-events-none"
                            style={{ left: `${hsva.s * 100}%`, top: `${(1 - hsva.v) * 100}%` }}
                        />
                    </div>

                    <div className="flex gap-3 items-center">
                        <div className="flex flex-col flex-1 gap-3">
                            <div
                                ref={hueRef}
                                onMouseDown={handleHueDown}
                                className="relative h-3 rounded-full cursor-pointer w-full"
                                style={{ background: 'linear-gradient(to right, #f00 0%, #ff0 17%, #0f0 33%, #0ff 50%, #00f 67%, #f0f 83%, #f00 100%)' }}
                            >
                                <div
                                    className="absolute w-3 h-3 rounded-full bg-white border border-black/10 shadow shadow-black/50 -translate-x-1/2 top-0"
                                    style={{ left: `${hsva.h * 100}%` }}
                                />
                            </div>

                            <div
                                ref={alphaRef}
                                onMouseDown={handleAlphaDown}
                                className="relative h-3 rounded-full cursor-pointer w-full"
                                style={{ background: CHECKER_BG, backgroundSize: CHECKER_BG_SIZE, backgroundPosition: CHECKER_BG_POS }}
                            >
                                <div className="absolute inset-0 rounded-full" style={{ background: `linear-gradient(to right, transparent, rgb(${currentRgb.r}, ${currentRgb.g}, ${currentRgb.b}))` }} />
                                <div
                                    className="absolute w-3 h-3 rounded-full bg-white border border-black/10 shadow shadow-black/50 -translate-x-1/2 top-0"
                                    style={{ left: `${hsva.a * 100}%` }}
                                />
                            </div>
                        </div>

                        <div className="flex flex-col items-center gap-2">
                            <button
                                onClick={handleEyeDropper}
                                className="p-1.5 rounded-lg bg-[var(--builder-surface-2)] hover:bg-[var(--builder-surface-3)] text-[var(--builder-text-muted)] transition-colors group"
                                title="Pick color from screen"
                            >
                                <Pipette size={14} className="group-active:scale-90 transition-transform" />
                            </button>
                            <div
                                className="w-10 h-10 rounded-full border border-transparent shadow-inner relative overflow-hidden"
                                style={{ background: CHECKER_BG, backgroundSize: CHECKER_BG_SIZE, backgroundPosition: CHECKER_BG_POS }}
                            >
                                <div className="absolute inset-0" style={{ backgroundColor: value }} />
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col gap-2">
                        <div className="flex gap-2">
                            <div className="flex-1 flex bg-[var(--builder-surface-2)] rounded-lg border border-[var(--builder-border)] overflow-hidden text-[11px]">
                                <button
                                    onClick={() => setMode(m => m === 'HEX' ? 'RGB' : m === 'RGB' ? 'HSL' : 'HEX')}
                                    className="px-2 py-1.5 bg-[var(--builder-surface-3)] text-[var(--builder-text-faint)] flex items-center gap-1 border-r border-[var(--builder-border)] hover:text-[var(--builder-text)] transition-colors capitalize"
                                >
                                    {mode.toLowerCase()} <ChevronDown size={10} />
                                </button>

                                {mode === 'HEX' && (
                                    <input
                                        type="text"
                                        value={value.replace("#", "").substring(0, 6).toUpperCase()}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            if (/^[0-9A-Fa-f]{0,6}$/.test(val)) {
                                                const alphaHex = Math.round(hsva.a * 255).toString(16).padStart(2, "0").toUpperCase();
                                                onChange("#" + val + (alphaHex === "FF" ? "" : alphaHex));
                                            }
                                        }}
                                        className="flex-1 bg-transparent px-2 py-1.5 text-[var(--builder-text)] focus:outline-none uppercase tracking-wider"
                                        spellCheck={false}
                                    />
                                )}

                                {mode === 'RGB' && (
                                    <div className="flex-1 flex divide-x divide-[var(--builder-border)]">
                                        {[rgba.r, rgba.g, rgba.b].map((v, i) => (
                                            <input
                                                key={i}
                                                type="text"
                                                value={v}
                                                onChange={(e) => {
                                                    const n = parseInt(e.target.value) || 0;
                                                    if (n >= 0 && n <= 255) {
                                                        const newRgba = { ...rgba, [i === 0 ? 'r' : i === 1 ? 'g' : 'b']: n };
                                                        onChange(rgbaToHex(newRgba.r, newRgba.g, newRgba.b, newRgba.a));
                                                    }
                                                }}
                                                className="w-full bg-transparent px-1 py-1.5 text-[var(--builder-text)] focus:outline-none text-center"
                                            />
                                        ))}
                                    </div>
                                )}

                                {mode === 'HSL' && (
                                    <div className="flex-1 flex divide-x divide-[var(--builder-border)]">
                                        {(() => {
                                            const hsl = rgbaToHsla(rgba.r, rgba.g, rgba.b, rgba.a);
                                            return [hsl.h, hsl.s, hsl.l].map((v, i) => (
                                                <input
                                                    key={i}
                                                    type="text"
                                                    value={v}
                                                    onChange={(e) => {
                                                        const n = parseInt(e.target.value) || 0;
                                                        const max = i === 0 ? 360 : 100;
                                                        if (n >= 0 && n <= max) {
                                                            const newHsl = { ...hsl, [i === 0 ? 'h' : i === 1 ? 's' : 'l']: n };
                                                            const newRgb = hslaToRgba(newHsl.h, newHsl.s, newHsl.l, rgba.a);
                                                            onChange(rgbaToHex(newRgb.r, newRgb.g, newRgb.b, rgba.a));
                                                        }
                                                    }}
                                                    className="w-full bg-transparent px-1 py-1.5 text-[var(--builder-text)] focus:outline-none text-center"
                                                />
                                            ));
                                        })()}
                                    </div>
                                )}
                            </div>

                            <div className="w-16 flex bg-[var(--builder-surface-2)] rounded-lg border border-[var(--builder-border)] overflow-hidden text-[11px]">
                                <input
                                    type="text"
                                    value={Math.round(hsva.a * 100)}
                                    onChange={(e) => {
                                        const v = parseInt(e.target.value, 10);
                                        if (!isNaN(v)) updateColor({ a: Math.max(0, Math.min(100, v)) / 100 });
                                    }}
                                    className="w-full bg-transparent px-2 py-1.5 text-[var(--builder-text)] focus:outline-none text-center"
                                />
                                <div className="pr-2 py-1.5 text-[var(--builder-text-faint)] flex items-center whitespace-nowrap">
                                    %
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            )}

            {enableFillModes && paintMode === "gradient" && (
                <div className="flex flex-col gap-3">
                    <div className="h-8 rounded-md border border-[var(--builder-border)]" style={{ background: buildGradientCss(gradientType, gradientAngle, gradientStops) }} />
                    <div className="grid grid-cols-2 gap-2">
                        <select
                            value={gradientType}
                            onChange={(e) => {
                                const nextType = e.target.value as GradientType;
                                setGradientType(nextType);
                                applyGradient(gradientStops, nextType, gradientAngle);
                            }}
                            className="bg-[var(--builder-surface-2)] rounded-md px-2 py-1.5 text-xs text-[var(--builder-text)]"
                        >
                            <option value="linear">Linear</option>
                            <option value="radial">Radial</option>
                        </select>
                        <input
                            type="number"
                            min={0}
                            max={360}
                            value={gradientAngle}
                            onChange={(e) => {
                                const nextAngle = clamp(parseInt(e.target.value || "0", 10), 0, 360);
                                setGradientAngle(nextAngle);
                                applyGradient(gradientStops, gradientType, nextAngle);
                            }}
                            className="bg-[var(--builder-surface-2)] rounded-md px-2 py-1.5 text-xs text-[var(--builder-text)]"
                        />
                    </div>
                    <div className="flex flex-col gap-2">
                        {gradientStops.map((stop, idx) => (
                            <div key={stop.id} className="grid grid-cols-[52px_1fr_48px_28px] gap-2 items-center">
                                <input
                                    type="number"
                                    min={0}
                                    max={100}
                                    value={stop.position}
                                    onChange={(e) => {
                                        const next = [...gradientStops];
                                        next[idx] = { ...stop, position: clamp(parseInt(e.target.value || "0", 10), 0, 100) };
                                        setGradientStops(next);
                                        applyGradient(next);
                                    }}
                                    className="bg-[var(--builder-surface-2)] rounded-md px-2 py-1.5 text-xs text-[var(--builder-text)]"
                                />
                                <input
                                    type="text"
                                    value={stop.color}
                                    onChange={(e) => {
                                        const normalized = normalizeHex(e.target.value);
                                        if (!normalized) return;
                                        const next = [...gradientStops];
                                        next[idx] = { ...stop, color: normalized };
                                        setGradientStops(next);
                                        applyGradient(next);
                                    }}
                                    className="bg-[var(--builder-surface-2)] rounded-md px-2 py-1.5 text-xs text-[var(--builder-text)]"
                                />
                                <input
                                    type="number"
                                    min={0}
                                    max={100}
                                    value={stop.alpha}
                                    onChange={(e) => {
                                        const next = [...gradientStops];
                                        next[idx] = { ...stop, alpha: clamp(parseInt(e.target.value || "0", 10), 0, 100) };
                                        setGradientStops(next);
                                        applyGradient(next);
                                    }}
                                    className="bg-[var(--builder-surface-2)] rounded-md px-2 py-1.5 text-xs text-[var(--builder-text)]"
                                />
                                <button
                                    type="button"
                                    disabled={gradientStops.length <= 2}
                                    onClick={() => {
                                        if (gradientStops.length <= 2) return;
                                        const next = gradientStops.filter((_, stopIndex) => stopIndex !== idx);
                                        setGradientStops(next);
                                        applyGradient(next);
                                    }}
                                    className="h-7 w-7 rounded-md bg-[var(--builder-surface-2)] text-[var(--builder-text-faint)] disabled:opacity-40"
                                    title="Remove stop"
                                >
                                    -
                                </button>
                            </div>
                        ))}
                    </div>
                    <button
                        type="button"
                        onClick={() => {
                            const next: GradientStop[] = [...gradientStops, {
                                id: `s${Date.now()}`,
                                position: clamp(Math.round(100 / (gradientStops.length + 1) * gradientStops.length), 0, 100),
                                color: '#FFFFFF',
                                alpha: 100,
                            }];
                            setGradientStops(next);
                            applyGradient(next);
                        }}
                        className="h-8 rounded-md bg-[var(--builder-surface-2)] text-[var(--builder-text)] text-xs"
                    >
                        Add stop
                    </button>
                </div>
            )}

            {enableFillModes && paintMode === "pattern" && (
                <div className="flex flex-col gap-3">
                    <div className="h-[156px] rounded-md border border-[var(--builder-border)]" style={{ background: buildPatternCss(patternType, patternColor, patternCellSize), backgroundSize: patternType === 'grid' ? `${patternCellSize}px ${patternCellSize}px` : undefined }} />
                    <select
                        value={patternType}
                        onChange={(e) => {
                            const next = e.target.value as PatternType;
                            setPatternType(next);
                            applyPattern(next, patternColor, patternCellSize);
                        }}
                        className="bg-[var(--builder-surface-2)] rounded-md px-2 py-1.5 text-xs text-[var(--builder-text)]"
                    >
                        <option value="grid">Grid</option>
                        <option value="dots">Dots</option>
                        <option value="diagonal">Diagonal</option>
                    </select>
                    <input
                        type="text"
                        value={patternColor}
                        onChange={(e) => {
                            const normalized = normalizeHex(e.target.value);
                            if (!normalized) return;
                            setPatternColor(normalized);
                            applyPattern(patternType, normalized, patternCellSize);
                        }}
                        className="bg-[var(--builder-surface-2)] rounded-md px-2 py-1.5 text-xs text-[var(--builder-text)]"
                    />
                    <div className="flex items-center gap-2">
                        <span className="text-[11px] text-[var(--builder-text-faint)]">Scale</span>
                        <input
                            type="range"
                            min={6}
                            max={64}
                            value={patternCellSize}
                            onChange={(e) => {
                                const next = parseInt(e.target.value, 10);
                                setPatternCellSize(next);
                                applyPattern(patternType, patternColor, next);
                            }}
                            className="w-full"
                        />
                    </div>
                </div>
            )}

            {enableFillModes && enableMediaFillModes && paintMode === "image" && (
                <div className="flex flex-col gap-3">
                    <div className="h-[156px] rounded-md border border-[var(--builder-border)]" style={{ background: imageUrl ? `url("${imageUrl}") center / cover no-repeat` : CHECKER_BG, backgroundSize: imageUrl ? 'cover' : CHECKER_BG_SIZE, backgroundPosition: imageUrl ? 'center' : CHECKER_BG_POS }} />
                    <input
                        type="text"
                        value={imageUrl}
                        onChange={(e) => setImageUrl(e.target.value)}
                        onBlur={(e) => applyImage(e.target.value)}
                        placeholder="https://example.com/image.jpg"
                        className="bg-[var(--builder-surface-2)] rounded-md px-2 py-1.5 text-xs text-[var(--builder-text)]"
                    />
                    <input
                        ref={imageInputRef}
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            const reader = new FileReader();
                            reader.onload = () => {
                                const next = String(reader.result || "");
                                setImageUrl(next);
                                applyImage(next);
                            };
                            reader.readAsDataURL(file);
                        }}
                        className="hidden"
                    />
                    <button
                        type="button"
                        onClick={() => imageInputRef.current?.click()}
                        className="h-8 rounded-md bg-[#2f8cff] text-white text-xs"
                    >
                        Upload from computer
                    </button>
                </div>
            )}

            {enableFillModes && enableMediaFillModes && paintMode === "video" && (
                <div className="flex flex-col gap-3">
                    <div className="h-[156px] rounded-md border border-[var(--builder-border)] bg-[var(--builder-surface-2)] flex items-center justify-center text-[11px] text-[var(--builder-text-faint)] px-3 text-center">
                        Video fill stores the provided source as a cover URL.
                    </div>
                    <input
                        type="text"
                        value={videoUrl}
                        onChange={(e) => setVideoUrl(e.target.value)}
                        onBlur={(e) => applyVideo(e.target.value)}
                        placeholder="https://example.com/video.mp4"
                        className="bg-[var(--builder-surface-2)] rounded-md px-2 py-1.5 text-xs text-[var(--builder-text)]"
                    />
                    <input
                        ref={videoInputRef}
                        type="file"
                        accept="video/*"
                        onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            const objectUrl = URL.createObjectURL(file);
                            setVideoUrl(objectUrl);
                            applyVideo(objectUrl);
                        }}
                        className="hidden"
                    />
                    <button
                        type="button"
                        onClick={() => videoInputRef.current?.click()}
                        className="h-8 rounded-md bg-[#2f8cff] text-white text-xs"
                    >
                        Upload video
                    </button>
                </div>
            )}
        </div>,
        document.body
    );
};

// --- Helper for Text Input ---
const ColorTextValue = ({ value, onChange }: { value: string, onChange: (v: string) => void }) => {
    const [local, setLocal] = useState(value);
    const keywords = ["transparent", "white", "black", "red", "blue", "green", "yellow", "purple", "orange", "pink", "gray", "grey"];

    useEffect(() => {
        setLocal(value);
    }, [value]);

    const normalizeColor = (val: string): string | null => {
        let v = val.trim();
        if (!v) return "transparent";

        // If it's a 3, 6, or 8 digit hex without #, add it
        if (/^#?[0-9A-Fa-f]{3}$|^#?[0-9A-Fa-f]{6}$|^#?[0-9A-Fa-f]{8}$/.test(v)) {
            if (v.startsWith("#")) {
                v = "#" + v.slice(1).toUpperCase();
            } else {
                v = "#" + v.toUpperCase();
            }
            return v;
        }

        if (keywords.includes(v.toLowerCase())) {
            return v.toLowerCase();
        }

        return null;
    };

    const submit = (val: string) => {
        const normalized = normalizeColor(val);
        if (normalized) {
            onChange(normalized);
            return;
        }

        setLocal(value); // Revert if garbage
    };

    const applyIfValid = (val: string) => {
        const normalized = normalizeColor(val);
        if (normalized) onChange(normalized);
    };

    const handleTextChange = (nextRaw: string) => {
        setLocal(nextRaw);
        // Apply immediately once a valid color token is detected (typed or pasted).
        applyIfValid(nextRaw);
    };

    const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
        const pasted = e.clipboardData.getData("text");
        if (!pasted) return;

        const normalized = normalizeColor(pasted);
        if (!normalized) return;

        e.preventDefault();
        setLocal(normalized);
        onChange(normalized);
    };

    const displayValue = local.startsWith("#") ? local.slice(1).toUpperCase() : local;

    return (
        <input
            type="text"
            value={displayValue}
            onChange={(e) => handleTextChange(e.target.value)}
            onPaste={handlePaste}
            onBlur={(e) => submit(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit(e.currentTarget.value)}
            className="bg-transparent text-[11px] text-[var(--builder-text)] focus:outline-none uppercase tracking-widest px-1 w-full"
            placeholder="HEX"
            spellCheck={false}
        />
    );
};
