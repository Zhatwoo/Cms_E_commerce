"use client";

import React, { useState, useEffect, useRef, useCallback, useId } from "react";
import ReactDOM from "react-dom";
import { Pipette, ChevronDown } from "lucide-react";

type HSVA = { h: number; s: number; v: number; a: number };
type RGBA = { r: number; g: number; b: number; a: number };

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

// --- Components ---

interface ColorPickerProps {
    value: string;
    onChange: (val: string) => void;
    label?: string;
    className?: string;
}

export const ColorPicker = ({ value, onChange, label, className = "" }: ColorPickerProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const swatchRef = useRef<HTMLButtonElement>(null);
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

    const effectiveColor = value === "transparent" ? "#00000000" : value;
    const rgba = hexToRgba(effectiveColor);

    return (
        <div className={`relative flex flex-col gap-1 ${className}`}>
            {label && <label className="text-[10px] text-[var(--builder-text)] font-medium">{label}</label>}
            <div className="flex items-center gap-2 bg-[var(--builder-surface-2)] rounded-lg p-1 border border-[var(--builder-border)] hover:border-[var(--builder-border-mid)] transition-colors">
                <button
                    ref={swatchRef}
                    onClick={toggle}
                    className="w-8 h-8 rounded-md border border-transparent relative overflow-hidden flex-shrink-0"
                    style={{ background: `linear-gradient(45deg, #808080 25%, transparent 25%), linear-gradient(-45deg, #808080 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #808080 75%), linear-gradient(-45deg, transparent 75%, #808080 75%)`, backgroundSize: '8px 8px', backgroundPosition: '0 0, 0 4px, 4px 4px, 4px 0' }}
                >
                    <div className="absolute inset-0" style={{ backgroundColor: effectiveColor }} />
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
                />
            )}
        </div>
    );
};

const ColorPickerPopover = ({ value, onChange, onClose, anchorRef }: {
    value: string;
    onChange: (val: string) => void;
    onClose: () => void;
    anchorRef: React.RefObject<HTMLButtonElement | null>;
}) => {
    const popoverRef = useRef<HTMLDivElement>(null);
    const [coords, setCoords] = useState<{ top: number; left: number } | null>(null);

    const rgba = hexToRgba(value);
    const [hsva, setHsva] = useState(() => rgbaToHsva(rgba.r, rgba.g, rgba.b, rgba.a));
    const [mode, setMode] = useState<'HEX' | 'RGB' | 'HSL'>('HEX');

    useEffect(() => {
        const freshRgba = hexToRgba(value);
        setHsva(rgbaToHsva(freshRgba.r, freshRgba.g, freshRgba.b, freshRgba.a));
    }, [value]);

    React.useLayoutEffect(() => {
        if (anchorRef.current) {
            const rect = anchorRef.current.getBoundingClientRect();
            const popWidth = 240;
            const popHeight = popoverRef.current?.offsetHeight || 336;

            // Align right edge of popover with right edge of the anchor row-ish
            // The panel is roughly 350px wide from the right.
            let left = window.innerWidth - popWidth - 12;

            // If the anchor is too far left (not likely in the right panel, but for safety)
            if (left < rect.left - popWidth + rect.width) {
                left = rect.left - popWidth + rect.width;
            }

            let top = rect.bottom + 8;
            // If it would go off the bottom, flip it to be above the input
            if (top + popHeight > window.innerHeight - 12) {
                top = rect.top - popHeight - 8;
            }

            // Safety: don't let it go off the top
            if (top < 12) top = 12;

            setCoords({ top, left });
        }
    }, [anchorRef]);

    const updateColor = (newHsva: Partial<HSVA>) => {
        const updated = { ...hsva, ...newHsva };
        setHsva(updated);
        const rgb = hsvaToRgba(updated.h, updated.s, updated.v, updated.a);
        const hex = rgbaToHex(rgb.r, rgb.g, rgb.b, rgb.a);
        onChange(hex);
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
            className="fixed z-[9999] w-[240px] bg-[var(--builder-surface)] p-3 rounded-xl border border-transparent shadow-2xl flex flex-col gap-4 animate-in fade-in zoom-in duration-150"
            style={{
                top: coords ? `${coords.top}px` : '-9999px',
                left: coords ? `${coords.left}px` : '-9999px',
                opacity: coords ? 1 : 0,
                pointerEvents: coords ? 'auto' : 'none',
                transition: 'opacity 0.15s, transform 0.15s' // Explicitly NO transition for top/left
            }}
            onMouseDown={(e) => e.stopPropagation()}
        >
            {/* Saturation/Value Area */}
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
                        style={{ background: `linear-gradient(45deg, #808080 25%, transparent 25%), linear-gradient(-45deg, #808080 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #808080 75%), linear-gradient(-45deg, transparent 75%, #808080 75%)`, backgroundSize: '8px 8px', backgroundPosition: '0 0, 0 4px, 4px 4px, 4px 0' }}
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
                        style={{ background: `linear-gradient(45deg, #808080 25%, transparent 25%), linear-gradient(-45deg, #808080 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #808080 75%), linear-gradient(-45deg, transparent 75%, #808080 75%)`, backgroundSize: '8px 8px', backgroundPosition: '0 0, 0 4px, 4px 4px, 4px 0' }}
                    >
                        <div className="absolute inset-0" style={{ backgroundColor: value }} />
                    </div>
                </div>
            </div>

            {/* Mode Switcher & Inputs */}
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
        </div>,
        document.body
    );
};

// --- Helper for Text Input ---
const ColorTextValue = ({ value, onChange }: { value: string, onChange: (v: string) => void }) => {
    const [local, setLocal] = useState(value);

    useEffect(() => {
        setLocal(value);
    }, [value]);

    const submit = (val: string) => {
        let v = val.trim();
        if (!v) {
            onChange("transparent");
            return;
        }
        // If it's a 3, 6, or 8 digit hex without #, add it
        if (/^[0-9A-Fa-f]{3}$|^[0-9A-Fa-f]{6}$|^[0-9A-Fa-f]{8}$/.test(v)) {
            v = "#" + v;
        }

        // Simple validation: if it starts with # or is a known keyword
        const keywords = ["transparent", "white", "black", "red", "blue", "green", "yellow", "purple", "orange", "pink", "gray", "grey"];
        if (v.startsWith("#") || keywords.includes(v.toLowerCase())) {
            onChange(v);
        } else {
            setLocal(value); // Revert if garbage
        }
    };

    return (
        <input
            type="text"
            value={local.startsWith("#") ? local.replace("#", "").toUpperCase() : local}
            onChange={(e) => setLocal(e.target.value)}
            onBlur={(e) => submit(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit(e.currentTarget.value)}
            className="bg-transparent text-[11px] text-[var(--builder-text)] focus:outline-none uppercase tracking-widest px-1 w-full"
            placeholder="HEX"
            spellCheck={false}
        />
    );
};
