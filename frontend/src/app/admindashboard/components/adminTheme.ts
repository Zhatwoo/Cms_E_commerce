import type { CSSProperties } from 'react';

export const adminTheme = {
    fontFamily: "var(--font-outfit), 'Outfit', sans-serif",
    colors: {
        purple: '#471396',
        yellow: '#FFCC00',
        gradientStart: '#F5F4FF',
        gradientMid: '#E3E2FF',
        gradientEnd: '#DADCFF',
        surface: 'rgba(249, 247, 255, 0.72)',
        surfaceStrong: 'rgba(249, 247, 255, 0.92)',
        border: 'rgba(147, 96, 255, 0.18)',
        borderStrong: 'rgba(147, 96, 255, 0.28)',
        shadow: '0 16px 34px rgba(123, 78, 192, 0.16)',
        shadowSoft: '0 10px 24px rgba(123, 78, 192, 0.12)',
        textMuted: 'rgba(71, 19, 150, 0.58)',
        textSoft: 'rgba(71, 19, 150, 0.74)',
        logout: '#FF5E5E',
        white: '#FFFFFF',
    },
} as const;

export const adminAppStyle: CSSProperties = {
    fontFamily: adminTheme.fontFamily,
    backgroundColor: adminTheme.colors.gradientMid,
    backgroundImage: `linear-gradient(180deg, ${adminTheme.colors.gradientStart} 0%, ${adminTheme.colors.gradientMid} 50%, ${adminTheme.colors.gradientEnd} 100%)`,
};

export const adminPanelStyle: CSSProperties = {
    background: adminTheme.colors.surfaceStrong,
    border: `1px solid ${adminTheme.colors.border}`,
    boxShadow: adminTheme.colors.shadow,
    backdropFilter: 'blur(18px)',
};

export const adminInsetPanelStyle: CSSProperties = {
    background: 'rgba(255, 255, 255, 0.38)',
    border: `1px solid ${adminTheme.colors.border}`,
    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.55)',
};
