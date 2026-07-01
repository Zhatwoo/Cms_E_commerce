import React from 'react';

export type SpinnerProps = {
  sizePx?: number;
  borderPx?: number;
  className?: string;
  label?: string;
  style?: React.CSSProperties;
};

export function Spinner({
  sizePx = 32,
  borderPx = 4,
  className = 'animate-spin rounded-full border-zinc-200 border-t-indigo-600',
  label = 'Loading',
  style,
}: SpinnerProps) {
  return (
    <div
      role="status"
      aria-label={label}
      className={className}
      style={{ width: `${sizePx}px`, height: `${sizePx}px`, borderWidth: `${borderPx}px`, ...style }}
    />
  );
}

export type LoadingTextProps = {
  text?: string;
  className?: string;
  style?: React.CSSProperties;
};

export function LoadingText({ text = 'Loading…', className, style }: LoadingTextProps) {
  return (
    <p className={className ?? 'text-sm text-zinc-500'} style={style}>
      {text}
    </p>
  );
}

export type DotsLoaderProps = {
  className?: string;
  dotClassName?: string;
  dotSizePx?: number;
};

export function DotsLoader({ className, dotClassName, dotSizePx = 6 }: DotsLoaderProps) {
  return (
    <div className={className ?? 'flex items-center gap-2'} aria-label="Loading" role="status">
      <span className={dotClassName ?? 'loaderDot'} />
      <span className={dotClassName ?? 'loaderDot'} style={{ animationDelay: '0.15s' }} />
      <span className={dotClassName ?? 'loaderDot'} style={{ animationDelay: '0.3s' }} />
      <style jsx>{`
        .loaderDot {
          width: ${dotSizePx}px;
          height: ${dotSizePx}px;
          border-radius: 9999px;
          background: rgba(255, 255, 255, 0.35);
          animation: loaderDotPulse 0.9s ease-in-out infinite;
        }
        @keyframes loaderDotPulse {
          0%,
          100% {
            opacity: 0.25;
            transform: translateY(0);
          }
          50% {
            opacity: 0.9;
            transform: translateY(-2px);
          }
        }
      `}</style>
    </div>
  );
}

export type UnifiedLoaderProps = {
  message?: string;
  mode?: 'spinner' | 'dots' | 'spinner+dots';
  variant?: 'dark' | 'light';
  className?: string;
};

export function UnifiedLoader({
  message = 'Loading…',
  mode = 'spinner+dots',
  variant = 'dark',
  className,
}: UnifiedLoaderProps) {
  const isDark = variant === 'dark';
  const spinnerClass = isDark
    ? 'animate-spin rounded-full border-white/15 border-t-white/70'
    : 'animate-spin rounded-full border-zinc-200 border-t-zinc-700';

  return (
    <div className={className ?? 'flex flex-col items-center justify-center gap-4'}>
      {(mode === 'spinner' || mode === 'spinner+dots') && (
        <Spinner sizePx={40} borderPx={4} className={spinnerClass} />
      )}
      {(mode === 'dots' || mode === 'spinner+dots') && (
        <DotsLoader />
      )}
      <LoadingText
        text={message}
        className={isDark ? 'text-sm text-white/60' : 'text-sm text-zinc-500'}
      />
    </div>
  );
}

export type FullPageLoaderProps = {
  message?: string;
  mode?: UnifiedLoaderProps['mode'];
  variant?: UnifiedLoaderProps['variant'];
  className?: string;
};

export function FullPageLoader({
  message,
  mode,
  variant = 'dark',
  className,
}: FullPageLoaderProps) {
  const bg = variant === 'dark' ? 'bg-[#030014]' : 'bg-white';
  return (
    <div className={className ?? `min-h-screen flex items-center justify-center ${bg}`}>
      <UnifiedLoader message={message} mode={mode} variant={variant} />
    </div>
  );
}

export type SkeletonBlockProps = {
  className?: string;
  variant?: 'light' | 'dark';
};

export function SkeletonBlock({ className, variant = 'light' }: SkeletonBlockProps) {
  const base = variant === 'dark' ? 'bg-white/10' : 'bg-[#E8E4FF]';
  return (
    <div className={`relative overflow-hidden rounded-2xl ${base} ${className ?? ''}`}>
      <div className="pointer-events-none absolute inset-0 -translate-x-full animate-[shimmer_1.2s_infinite] bg-linear-to-r from-transparent via-white/25 to-transparent" />
      <style jsx>{`
        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }
      `}</style>
    </div>
  );
}
