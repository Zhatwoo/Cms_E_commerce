"use client";

import React, { useState, useEffect, useRef, useCallback, useId } from "react";
import ReactDOM from "react-dom";
import { Pipette, ChevronDown, Square, Blend, Grid3X3, ImageIcon, Video, Eye, EyeOff, Loader2, X } from "lucide-react";
import { useDesignProject } from "@/app/design/_context/DesignProjectContext";
import { addFileToMediaLibrary } from "@/app/design/_lib/mediaActions";

type HSVA = { h: number; s: number; v: number; a: number };
type RGBA = { r: number; g: number; b: number; a: number };
type PaintMode = "solid" | "gradient" | "pattern" | "image" | "video";
type GradientType = "linear" | "radial";
type PatternType = "dots" | "grid" | "diagonal";
type GradientStop = { id: string; position: number; color: string; alpha: number };
type SavedColorEntry = { id: string; hex: string; alpha: number; visible: boolean };
type UsedColorEntry = { id: string; hex: string; alpha: number };

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

const COLOR_TOKEN_REGEX = /#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})\b|rgba?\(([^)]+)\)/g;

const parseRgbChannel = (raw: string): number | null => {
    const v = raw.trim();
    if (!v) return null;
    if (v.endsWith('%')) {
        const pct = Number(v.slice(0, -1));
        if (!Number.isFinite(pct)) return null;
        return clamp(Math.round((pct / 100) * 255), 0, 255);
    }
    const n = Number(v);
    if (!Number.isFinite(n)) return null;
    return clamp(Math.round(n), 0, 255);
};

const parseAlphaChannel = (raw: string | undefined): number => {
    if (!raw) return 100;
    const v = raw.trim();
    if (!v) return 100;
    if (v.endsWith('%')) {
        const pct = Number(v.slice(0, -1));
        if (!Number.isFinite(pct)) return 100;
        return clamp(Math.round(pct), 0, 100);
    }
    const n = Number(v);
    if (!Number.isFinite(n)) return 100;
    return clamp(Math.round(n * 100), 0, 100);
};

const tokenToColorEntry = (token: string): { hex: string; alpha: number } | null => {
    const trimmed = token.trim();
    if (!trimmed) return null;

    const hex = normalizeHex(trimmed);
    if (hex) {
        const rgba = hexToRgba(hex);
        return {
            hex: rgbaToHex(rgba.r, rgba.g, rgba.b, 1).slice(0, 7).toUpperCase(),
            alpha: clamp(Math.round(rgba.a * 100), 0, 100),
        };
    }

    const rgbMatch = trimmed.match(/^rgba?\(([^)]+)\)$/i);
    if (!rgbMatch) return null;

    const parts = rgbMatch[1].split(',').map((part) => part.trim());
    if (parts.length < 3) return null;
    const r = parseRgbChannel(parts[0]);
    const g = parseRgbChannel(parts[1]);
    const b = parseRgbChannel(parts[2]);
    if (r === null || g === null || b === null) return null;
    const alpha = parseAlphaChannel(parts[3]);

    return {
        hex: rgbaToHex(r, g, b, 1).slice(0, 7).toUpperCase(),
        alpha,
    };
};

const extractColorEntriesFromCssValue = (cssValue: string): Array<{ hex: string; alpha: number }> => {
    if (!cssValue) return [];
    const matches = cssValue.match(COLOR_TOKEN_REGEX);
    if (!matches?.length) return [];
    return matches
        .map((token) => tokenToColorEntry(token))
        .filter((entry): entry is { hex: string; alpha: number } => Boolean(entry));
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
    onMediaChange?: (media: { type: "image" | "video"; url: string }) => void;
    label?: string;
    className?: string;
    openKey?: number;
    toggleKey?: number;
    enableFillModes?: boolean;
    enableMediaFillModes?: boolean;
    popoverContainerRef?: React.RefObject<HTMLDivElement | null>;
}

export const ColorPicker = ({ value, onChange, onMediaChange, label, className = "", openKey, toggleKey, enableFillModes = false, enableMediaFillModes = false, popoverContainerRef }: ColorPickerProps) => {
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
                    style={{ 
                        backgroundImage: CHECKER_BG, 
                        backgroundSize: CHECKER_BG_SIZE, 
                        backgroundPosition: CHECKER_BG_POS 
                    }}
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
                    onMediaChange={onMediaChange}
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

const ColorPickerPopover = ({ value, onChange, onMediaChange, onClose, anchorRef, enableFillModes = false, enableMediaFillModes = false, containerRef }: {
    value: string;
    onChange: (val: string) => void;
    onMediaChange?: (media: { type: "image" | "video"; url: string }) => void;
    onClose: () => void;
    anchorRef: React.RefObject<HTMLButtonElement | null>;
    enableFillModes?: boolean;
    enableMediaFillModes?: boolean;
    containerRef?: React.RefObject<HTMLDivElement | null>;
}) => {
    const popoverRef = useRef<HTMLDivElement>(null);
    const [coords, setCoords] = useState<{ top: number; left: number }>({ top: 10, left: 10 });
    const [popoverWidth, setPopoverWidth] = useState(320);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [hasManualPosition, setHasManualPosition] = useState(false);
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
    const [selectedStopId, setSelectedStopId] = useState<string>('s1');
    const [patternType, setPatternType] = useState<PatternType>('grid');
    const [patternColor, setPatternColor] = useState('#777777');
    const [patternCellSize, setPatternCellSize] = useState(18);
    const [imageUrl, setImageUrl] = useState(() => extractUrlFromCss(value));
    const [videoUrl, setVideoUrl] = useState('');
    const imageInputRef = useRef<HTMLInputElement>(null);
    const videoInputRef = useRef<HTMLInputElement>(null);
    const savedColorsKeyRef = useRef('colorPickerSavedColors');
    const [savedColors, setSavedColors] = useState<SavedColorEntry[]>([]);
    const [selectedSavedColorId, setSelectedSavedColorId] = useState<string | null>(null);
    const [usedColors, setUsedColors] = useState<UsedColorEntry[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const { projectId } = useDesignProject();

    useEffect(() => {
        if (typeof window === 'undefined') return;
        try {
            const raw = window.localStorage?.getItem(savedColorsKeyRef.current);
            if (!raw) return;
            const parsed = JSON.parse(raw) as SavedColorEntry[];
            if (!Array.isArray(parsed)) return;
            const normalized = parsed
                .filter((entry) => entry && typeof entry.id === 'string' && typeof entry.hex === 'string')
                .map((entry) => ({
                    id: entry.id,
                    hex: normalizeHex(entry.hex) ?? '#000000',
                    alpha: clamp(Number(entry.alpha ?? 100), 0, 100),
                    visible: entry.visible !== false,
                }));
            setSavedColors(normalized);
        } catch {
            // ignore invalid localStorage payload
        }
    }, []);

    useEffect(() => {
        if (typeof window === 'undefined') return;
        try {
            window.localStorage?.setItem(savedColorsKeyRef.current, JSON.stringify(savedColors));
        } catch {
            // ignore storage errors
        }
    }, [savedColors]);

    useEffect(() => {
        if (!savedColors.length) {
            setSelectedSavedColorId(null);
            return;
        }
        if (!selectedSavedColorId || !savedColors.some((entry) => entry.id === selectedSavedColorId)) {
            setSelectedSavedColorId(savedColors[0].id);
        }
    }, [savedColors, selectedSavedColorId]);

    const selectedSavedColor = selectedSavedColorId
        ? savedColors.find((entry) => entry.id === selectedSavedColorId) ?? null
        : null;
    const gradientTrackRef = useRef<HTMLDivElement>(null);

    const collectUsedColors = useCallback(() => {
        if (typeof document === 'undefined') return;

        const root = document.querySelector('[data-web-builder-root]') as HTMLElement | null;
        const searchRoot = root ?? document.body;
        const targets = searchRoot.querySelectorAll<HTMLElement>('[style]');
        const map = new Map<string, UsedColorEntry>();

        targets.forEach((el, index) => {
            const styleText = el.getAttribute('style') ?? '';
            const entries = extractColorEntriesFromCssValue(styleText);
            entries.forEach((entry) => {
                // Ignore fully transparent entries in the used list.
                if (entry.alpha <= 0) return;
                const key = `${entry.hex}-${entry.alpha}`;
                if (!map.has(key)) {
                    map.set(key, {
                        id: `u${index}-${key}`,
                        hex: entry.hex,
                        alpha: entry.alpha,
                    });
                }
            });
        });

        const currentEntries = extractColorEntriesFromCssValue(value);
        currentEntries.forEach((entry) => {
            if (entry.alpha <= 0) return;
            const key = `${entry.hex}-${entry.alpha}`;
            if (!map.has(key)) {
                map.set(key, {
                    id: `u-current-${key}`,
                    hex: entry.hex,
                    alpha: entry.alpha,
                });
            }
        });

        setUsedColors(Array.from(map.values()).slice(0, 24));
    }, [value]);

    useEffect(() => {
        collectUsedColors();
        if (typeof MutationObserver === 'undefined') return;

        const root = document.querySelector('[data-web-builder-root]') as HTMLElement | null;
        const observeRoot = root ?? document.body;
        const observer = new MutationObserver(() => {
            collectUsedColors();
        });

        observer.observe(observeRoot, {
            subtree: true,
            childList: true,
            attributes: true,
            attributeFilter: ['style'],
        });

        return () => observer.disconnect();
    }, [collectUsedColors]);

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
            if (!anchorRef.current || !popoverRef.current) return;

            // Try to load saved position first
            const savedPosStr = typeof window !== 'undefined' ? window.localStorage?.getItem(savedPositionKeyRef.current) : null;
            
            if (savedPosStr && hasManualPosition) {
                try {
                    const saved = JSON.parse(savedPosStr);
                    if (saved && typeof saved.top === 'number' && typeof saved.left === 'number') {
                        setCoords(saved);
                        return;
                    }
                } catch (e) {
                    // ignore
                }
            }

            // Calculate default position
            const rect = anchorRef.current.getBoundingClientRect();
            const viewportPadding = 12;
            const desiredWidth = 320;
            const nextWidth = Math.min(desiredWidth, Math.max(220, window.innerWidth - viewportPadding * 2));
            
            // Get actual height or use a safe estimate
            const popHeight = popoverRef.current.offsetHeight || 420;

            const configsPanel = document.querySelector('[data-panel="configs"]');
            let left;
            if (configsPanel) {
                const panelRect = configsPanel.getBoundingClientRect();
                left = panelRect.left - nextWidth - 12;
            } else {
                left = rect.right - nextWidth;
            }
            
            const maxLeft = window.innerWidth - nextWidth - viewportPadding;
            left = Math.max(viewportPadding, Math.min(left, maxLeft));

            // Align top with the swatch button initially
            let top = rect.top;
            
            // Constraint: Ensure it doesn't go off-screen at the bottom
            if (top + popHeight > window.innerHeight - viewportPadding) {
                top = window.innerHeight - popHeight - viewportPadding;
            }
            // Constraint: Ensure it doesn't go off-screen at the top
            top = Math.max(viewportPadding, top);

            setPopoverWidth(nextWidth);
            setCoords({ top, left });
        };

        const resizeObserver = new ResizeObserver(() => {
            if (!hasManualPosition) {
                updatePosition();
            }
        });

        if (popoverRef.current) {
            resizeObserver.observe(popoverRef.current);
        }

        updatePosition();
        window.addEventListener("resize", updatePosition);
        window.addEventListener("scroll", updatePosition, true);

        return () => {
            resizeObserver.disconnect();
            window.removeEventListener("resize", updatePosition);
            window.removeEventListener("scroll", updatePosition, true);
        };
    }, [anchorRef, enableFillModes, hasManualPosition]);

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

    const updateGradientStop = useCallback((stopId: string, patch: Partial<GradientStop>) => {
        setGradientStops((prev) => {
            const next = prev
                .map((stop) => (stop.id === stopId ? { ...stop, ...patch } : stop))
                .map((stop) => ({ ...stop, position: clamp(stop.position, 0, 100), alpha: clamp(stop.alpha, 0, 100) }));
            applyGradient(next);
            return next;
        });
    }, [applyGradient]);

    const resolveTrackPosition = useCallback((clientX: number) => {
        const trackEl = gradientTrackRef.current;
        if (!trackEl) return 0;
        const rect = trackEl.getBoundingClientRect();
        if (rect.width <= 0) return 0;
        return clamp(Math.round(((clientX - rect.left) / rect.width) * 100), 0, 100);
    }, []);

    const startGradientStopDrag = useCallback((e: React.MouseEvent, stopId: string) => {
        e.preventDefault();
        e.stopPropagation();
        setSelectedStopId(stopId);

        const handleMove = (ev: MouseEvent) => {
            const nextPosition = resolveTrackPosition(ev.clientX);
            updateGradientStop(stopId, { position: nextPosition });
        };

        const handleUp = () => {
            window.removeEventListener("mousemove", handleMove);
            window.removeEventListener("mouseup", handleUp);
        };

        window.addEventListener("mousemove", handleMove);
        window.addEventListener("mouseup", handleUp);
    }, [resolveTrackPosition, updateGradientStop]);

    const handleGradientTrackClick = useCallback((e: React.MouseEvent) => {
        const nextPosition = resolveTrackPosition(e.clientX);
        const base =
            gradientStops.find((stop) => stop.id === selectedStopId) ||
            gradientStops[gradientStops.length - 1] ||
            { color: '#FFFFFF', alpha: 100 };

        const nextStop: GradientStop = {
            id: `s${Date.now()}`,
            position: nextPosition,
            color: base.color,
            alpha: base.alpha,
        };

        setGradientStops((prev) => {
            const next = [...prev, nextStop].sort((a, b) => a.position - b.position);
            applyGradient(next);
            return next;
        });
        setSelectedStopId(nextStop.id);
    }, [resolveTrackPosition, gradientStops, selectedStopId, applyGradient]);

    const applyPattern = useCallback((nextType = patternType, nextColor = patternColor, nextCell = patternCellSize) => {
        onChange(buildPatternCss(nextType, nextColor, nextCell));
    }, [patternType, patternColor, patternCellSize, onChange]);

    const applyImage = useCallback((url: string) => {
        const safe = url.trim();
        if (!safe) return;
        onMediaChange?.({ type: "image", url: safe });
        onChange(`url("${safe}") center / cover no-repeat`);
    }, [onChange, onMediaChange]);

    const applyVideo = useCallback((url: string) => {
        const safe = url.trim();
        if (!safe) return;
        onMediaChange?.({ type: "video", url: safe });
        onChange(`url("${safe}") center / cover no-repeat`);
    }, [onChange, onMediaChange]);

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

    const addCurrentColorToSaved = () => {
        const rgb = hsvaToRgba(hsva.h, hsva.s, hsva.v, 1);
        const alpha = clamp(Math.round(hsva.a * 100), 0, 100);
        const hex = rgbaToHex(rgb.r, rgb.g, rgb.b, 1).slice(0, 7).toUpperCase();

        setSavedColors((prev) => {
            const duplicateIndex = prev.findIndex((entry) => entry.hex === hex && entry.alpha === alpha);
            if (duplicateIndex >= 0) {
                const next = [...prev];
                const [existing] = next.splice(duplicateIndex, 1);
                return [{ ...existing, visible: true }, ...next];
            }
            return [{ id: `c${Date.now()}`, hex, alpha, visible: true }, ...prev].slice(0, 16);
        });
    };

    const applySavedColor = (entry: SavedColorEntry) => {
        if (!entry.visible) return;
        const rgb = hexToRgba(entry.hex);
        const alpha = clamp(entry.alpha, 0, 100) / 100;
        onChange(rgbaToHex(rgb.r, rgb.g, rgb.b, alpha));
        if (enableFillModes && paintMode !== 'solid') {
            setPaintMode('solid');
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
                setHasManualPosition(true);
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
                overflowX: 'hidden',
                top: `${coords.top + dragOffset.y}px`,
                left: `${coords.left + dragOffset.x}px`,
                opacity: 1,
                pointerEvents: 'auto',
                transition: isDragging ? 'none' : 'opacity 0.15s, transform 0.15s',
                cursor: isDragging ? 'grabbing' : 'default'
            }}
            onMouseDown={(e) => e.stopPropagation()}
        >
            {/* Popover Header with Drag Handle and Close button */}
            <div className="flex items-center relative gap-2 mb-1">
                <div
                    onMouseDown={handleDragStart}
                    className="flex-1 flex items-center justify-center py-1.5 cursor-grab active:cursor-grabbing rounded-lg hover:bg-[var(--builder-surface-2)] transition-colors"
                    title="Drag to move"
                >
                    <div className="h-1 w-12 rounded-full bg-[var(--builder-border-mid)]" />
                </div>
                <button
                    type="button"
                    onClick={onClose}
                    className="p-1.5 rounded-lg hover:bg-[var(--builder-surface-2)] text-[var(--builder-text-faint)] hover:text-[var(--builder-text)] transition-colors flex-shrink-0"
                    title="Close color picker"
                >
                    <X size={14} />
                </button>
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
                                style={{ 
                                    backgroundImage: CHECKER_BG, 
                                    backgroundSize: CHECKER_BG_SIZE, 
                                    backgroundPosition: CHECKER_BG_POS 
                                }}
                            >
                                <div 
                                    className="absolute inset-0" 
                                    style={{ 
                                        backgroundColor: value 
                                    }} 
                                />
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
                <div className="flex flex-col gap-3 w-full min-w-0">
                    <div
                        ref={gradientTrackRef}
                        onMouseDown={handleGradientTrackClick}
                        className="relative h-6 rounded-md border border-[var(--builder-border)] cursor-crosshair"
                        style={{ background: buildGradientCss(gradientType, gradientAngle, gradientStops) }}
                    >
                        {gradientStops.map((stop) => {
                            const isSelected = stop.id === selectedStopId;
                            return (
                                <button
                                    key={stop.id}
                                    type="button"
                                    onMouseDown={(e) => startGradientStopDrag(e, stop.id)}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedStopId(stop.id);
                                    }}
                                    className={`absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 ${isSelected ? "border-[#2f8cff]" : "border-white"}`}
                                    style={{
                                        left: `clamp(8px, ${stop.position}%, calc(100% - 8px))`,
                                        background: rgbaCss(stop.color, stop.alpha),
                                        boxShadow: isSelected ? "0 0 0 2px rgba(47,140,255,0.35)" : "0 0 0 1px rgba(0,0,0,0.35)",
                                    }}
                                    title={`Stop ${stop.position}%`}
                                />
                            );
                        })}
                    </div>
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
                            type="range"
                            min={0}
                            max={360}
                            value={gradientAngle}
                            onChange={(e) => {
                                const nextAngle = clamp(parseInt(e.target.value || "0", 10), 0, 360);
                                setGradientAngle(nextAngle);
                                applyGradient(gradientStops, gradientType, nextAngle);
                            }}
                            className="w-full accent-[#2f8cff]"
                        />
                    </div>
                    <div className="w-full bg-[var(--builder-surface-2)] rounded-md px-2 py-1.5 text-xs text-[var(--builder-text)] text-center">
                        Angle: {gradientAngle}deg
                    </div>
                    <div className="flex flex-col gap-2 w-full min-w-0">
                        {gradientStops.map((stop, idx) => (
                            <div key={stop.id} className="grid w-full min-w-0 grid-cols-[44px_minmax(0,1fr)_44px_24px] gap-2 items-center">
                                <input
                                    type="number"
                                    min={0}
                                    max={100}
                                    value={stop.position}
                                    onChange={(e) => {
                                        const nextPosition = clamp(parseInt(e.target.value || "0", 10), 0, 100);
                                        updateGradientStop(stop.id, { position: nextPosition });
                                    }}
                                    className="w-full min-w-0 bg-[var(--builder-surface-2)] rounded-md px-1.5 py-1.5 text-xs text-[var(--builder-text)]"
                                />
                                <input
                                    type="text"
                                    value={stop.color}
                                    onChange={(e) => {
                                        const normalized = normalizeHex(e.target.value);
                                        if (!normalized) return;
                                        updateGradientStop(stop.id, { color: normalized });
                                    }}
                                    className="w-full min-w-0 bg-[var(--builder-surface-2)] rounded-md px-2 py-1.5 text-xs text-[var(--builder-text)]"
                                />
                                <input
                                    type="number"
                                    min={0}
                                    max={100}
                                    value={stop.alpha}
                                    onChange={(e) => {
                                        const nextAlpha = clamp(parseInt(e.target.value || "0", 10), 0, 100);
                                        updateGradientStop(stop.id, { alpha: nextAlpha });
                                    }}
                                    className="w-full min-w-0 bg-[var(--builder-surface-2)] rounded-md px-1.5 py-1.5 text-xs text-[var(--builder-text)]"
                                />
                                <button
                                    type="button"
                                    disabled={gradientStops.length <= 2}
                                    onClick={() => {
                                        if (gradientStops.length <= 2) return;
                                        const next = gradientStops.filter((_, stopIndex) => stopIndex !== idx);
                                        setGradientStops(next);
                                        applyGradient(next);
                                        if (selectedStopId === stop.id && next[0]) {
                                            setSelectedStopId(next[0].id);
                                        }
                                    }}
                                    className="h-6 w-6 rounded-md bg-[var(--builder-surface-2)] text-[var(--builder-text-faint)] disabled:opacity-40"
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
                            const selected = gradientStops.find((stop) => stop.id === selectedStopId) || gradientStops[gradientStops.length - 1];
                            const nextStop: GradientStop = {
                                id: `s${Date.now()}`,
                                position: clamp(Math.round(100 / (gradientStops.length + 1) * gradientStops.length), 0, 100),
                                color: selected?.color || '#FFFFFF',
                                alpha: selected?.alpha ?? 100,
                            };
                            const next: GradientStop[] = [...gradientStops, nextStop];
                            setGradientStops(next);
                            applyGradient(next);
                            setSelectedStopId(nextStop.id);
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

            {(!enableFillModes || paintMode === "solid") && (
            <div className="flex flex-col gap-2 pt-1 border-t border-[var(--builder-border)]">
                <div className="flex items-center justify-between">
                    <span className="text-[11px] text-[var(--builder-text-faint)]">Custom Colors</span>
                </div>

                <div className="max-h-28 overflow-y-auto pr-1">
                    {usedColors.length === 0 && (
                        <div className="text-[11px] text-[var(--builder-text-faint)]/80">No custom colors yet.</div>
                    )}

                    <div className="grid grid-cols-10 gap-1">
                        {usedColors.map((entry) => {
                            return (
                                <button
                                    key={entry.id}
                                    type="button"
                                    onClick={() => {
                                        applySavedColor({ id: entry.id, hex: entry.hex, alpha: entry.alpha, visible: true });
                                    }}
                                    className="relative h-6 w-6 rounded-md border border-[var(--builder-border)] transition-colors hover:border-[#2f8cff]"
                                    style={{
                                        backgroundImage: entry.alpha < 100
                                            ? `linear-gradient(${rgbaCss(entry.hex, entry.alpha)}, ${rgbaCss(entry.hex, entry.alpha)}), ${CHECKER_BG}`
                                            : 'none',
                                        backgroundColor: entry.alpha < 100 ? 'transparent' : rgbaCss(entry.hex, entry.alpha),
                                        backgroundSize: entry.alpha < 100 ? `100%, ${CHECKER_BG_SIZE}` : 'auto',
                                        backgroundPosition: entry.alpha < 100 ? `0% 0%, ${CHECKER_BG_POS}` : '0% 0%',
                                    }}
                                    title={`${entry.hex} ${entry.alpha}%`}
                                >
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>
            )}

            {enableFillModes && enableMediaFillModes && paintMode === "image" && (
                <div className="flex flex-col gap-3">
                    <div 
                        className="h-[156px] rounded-md border border-[var(--builder-border)]" 
                        style={{ 
                            backgroundImage: imageUrl ? `url("${imageUrl}")` : CHECKER_BG, 
                            backgroundSize: imageUrl ? 'cover' : CHECKER_BG_SIZE, 
                            backgroundPosition: imageUrl ? 'center' : CHECKER_BG_POS,
                            backgroundRepeat: 'no-repeat'
                        }} 
                    />
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
                        disabled={isUploading}
                        onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file || !projectId) return;
                            
                            setIsUploading(true);
                            try {
                                // 1. Immediate local preview
                                const reader = new FileReader();
                                reader.onload = () => {
                                    const next = String(reader.result || "");
                                    setImageUrl(next);
                                    applyImage(next);
                                };
                                reader.readAsDataURL(file);

                                // 2. Robust upload to media library
                                const newItem = await addFileToMediaLibrary(projectId, file);
                                
                                // 3. Update with final remote URL
                                setImageUrl(newItem.url);
                                applyImage(newItem.url);
                            } catch (error) {
                                console.error("Image upload to media library failed:", error);
                            } finally {
                                setIsUploading(false);
                                if (imageInputRef.current) imageInputRef.current.value = "";
                            }
                        }}
                        className="hidden"
                    />
                    <button
                        type="button"
                        onClick={() => imageInputRef.current?.click()}
                        disabled={isUploading}
                        className="h-8 rounded-md bg-[#2f8cff] text-white text-xs flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {isUploading ? (
                            <>
                                <Loader2 className="animate-spin" size={12} />
                                Uploading...
                            </>
                        ) : (
                            "Upload from computer"
                        )}
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
                        disabled={isUploading}
                        onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file || !projectId) return;

                            setIsUploading(true);
                            try {
                                // 1. Immediate local preview
                                const objectUrl = URL.createObjectURL(file);
                                setVideoUrl(objectUrl);
                                applyVideo(objectUrl);

                                // 2. Upload to media library
                                const newItem = await addFileToMediaLibrary(projectId, file);
                                
                                // 3. Update with permanent URL
                                setVideoUrl(newItem.url);
                                applyVideo(newItem.url);
                            } catch (error) {
                                console.error("Video upload failed:", error);
                            } finally {
                                setIsUploading(false);
                                if (videoInputRef.current) videoInputRef.current.value = "";
                            }
                        }}
                        className="hidden"
                    />
                    <button
                        type="button"
                        onClick={() => videoInputRef.current?.click()}
                        disabled={isUploading}
                        className="h-8 rounded-md bg-[#2f8cff] text-white text-xs flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {isUploading ? (
                            <>
                                <Loader2 className="animate-spin" size={12} />
                                Uploading...
                            </>
                        ) : (
                            "Upload video"
                        )}
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
