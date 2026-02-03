'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';

// -----------------------------------------------------------------------------
// Constants
// -----------------------------------------------------------------------------

const SCROLL_THRESHOLD_HEADER = 8;
/** Pixels of scroll after gate ends over which front layer "rises" and overlaps entirely. */
const FRONT_LAYER_ENTRANCE_PX = 420;

function getViewportHeight() {
  if (typeof window === 'undefined') return 700;
  return window.innerHeight;
}

// -----------------------------------------------------------------------------
// Context & hooks
// -----------------------------------------------------------------------------

type LandingScrollContextValue = {
  scrollY: number;
  gateProgress: number;
  gateEndScrollY: number | null;
  frontLayerProgress: number;
  isScrolled: boolean;
  scrollContainerRef: React.RefObject<HTMLDivElement | null>;
};

const LandingScrollContext = createContext<LandingScrollContextValue>({
  scrollY: 0,
  gateProgress: 0,
  gateEndScrollY: null,
  frontLayerProgress: 0,
  isScrolled: false,
  scrollContainerRef: { current: null },
});

export function useLandingScroll() {
  return useContext(LandingScrollContext);
}

/** Gate progress (0–1) and scroll container ref; use in CommercePlatform / MercatoTools. */
export function useScrollGate() {
  const { gateProgress, scrollContainerRef } = useLandingScroll();
  return {
    progress: gateProgress,
    allowInnerScroll: false,
    scrollContainerRef,
  };
}

// -----------------------------------------------------------------------------
// ScrollGate (sticky viewport + spacer — single window scroll)
// -----------------------------------------------------------------------------

export function ScrollGate({ children }: { children: React.ReactNode }) {
  const gateContainerRef = useRef<HTMLDivElement>(null);
  const contentWrapperRef = useRef<HTMLDivElement>(null);
  const { setGateProgress, setGateEndScrollY } = useLandingScrollSetter();

  const [viewportHeight, setViewportHeight] = useState(getViewportHeight());
  const [contentHeight, setContentHeight] = useState(0);
  const [progress, setProgress] = useState(0);

  const spacerHeight = Math.max(0, contentHeight - viewportHeight);

  const measure = useCallback(() => {
    if (typeof window === 'undefined') return;
    setViewportHeight(getViewportHeight());
    const content = contentWrapperRef.current;
    if (content) {
      const h = content.getBoundingClientRect().height;
      setContentHeight(h);
    }
  }, []);

  useEffect(() => {
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [measure]);

  useEffect(() => {
    const content = contentWrapperRef.current;
    if (!content) return;
    const ro = new ResizeObserver(() => {
      setContentHeight(content.getBoundingClientRect().height);
    });
    ro.observe(content);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const gate = gateContainerRef.current;
      const scrollY = window.scrollY;
      if (!gate || contentHeight <= 0 || spacerHeight <= 0) {
        setProgress(0);
        setGateProgress?.(0);
        return;
      }
      const rect = gate.getBoundingClientRect();
      const gateStartY = scrollY + rect.top;
      const p = Math.min(1, Math.max(0, (scrollY - gateStartY) / spacerHeight));
      setProgress(p);
      setGateProgress?.(p);
      if (p >= 1) setGateEndScrollY?.(scrollY);
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [contentHeight, spacerHeight, setGateProgress, setGateEndScrollY]);

  const translateY =
    contentHeight > viewportHeight
      ? -progress * (contentHeight - viewportHeight)
      : 0;

  return (
    <div ref={gateContainerRef} className="relative w-full">
      <div
        className="sticky w-full overflow-hidden rounded-t-3xl"
        style={{
          top: 0,
          height: viewportHeight,
          minHeight: '100vh',
        }}
      >
        <div
          ref={contentWrapperRef}
          className="w-full will-change-transform"
          style={{ transform: `translateY(${translateY}px)` }}
        >
          {children}
        </div>
      </div>
      <div
        aria-hidden
        className="bg-[#092727]"
        style={{ height: spacerHeight }}
      />
    </div>
  );
}

/** Internal: context setter for gate progress and gate-end scroll (optional). */
const LandingScrollSetterContext = createContext<{
  setGateProgress?: (p: number) => void;
  setGateEndScrollY?: (y: number | null) => void;
}>({});

function useLandingScrollSetter() {
  return useContext(LandingScrollSetterContext);
}

/** Spacer after gate so scroll drives front-layer entrance (slide-up). Place right after ScrollGate. */
export function FrontLayerEntranceSpacer() {
  return (
    <div
      aria-hidden
      className="w-full bg-[#092727]"
      style={{ height: FRONT_LAYER_ENTRANCE_PX }}
    />
  );
}

/** Wrapper for Pricing + Testimonials + Footer: fixed overlay, tumataas from below and overlaps entirely sa MercatoTools. */
export function FrontLayerWrapper({ children }: { children: React.ReactNode }) {
  const { frontLayerProgress } = useLandingScroll();
  const [viewportHeight, setViewportHeight] = useState(
    typeof window !== 'undefined' ? window.innerHeight : 700
  );
  useEffect(() => {
    const onResize = () => setViewportHeight(window.innerHeight);
    onResize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  const entranceY = (1 - frontLayerProgress) * viewportHeight;
  return (
    <div
      className="fixed left-0 right-0 top-0 z-20 overflow-y-auto overflow-x-hidden rounded-t-3xl bg-[#020205] transition-transform duration-500 ease-out"
      style={{
        height: '100vh',
        minHeight: '100dvh',
        transform: `translateY(${entranceY}px)`,
        willChange: 'transform',
      }}
    >
      {/* Parent: single bg #020205 fills to bottom; sections extend to bottom via flex */}
      <div className="flex min-h-full min-h-screen flex-col bg-[#020205]">
        {children}
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// Root: operates entire landing scroll (smooth, header overlay, gate progress)
// -----------------------------------------------------------------------------

type LandingScrollRootProps = {
  children: React.ReactNode;
  /** Rendered first, overlays content (e.g. header). */
  headerSlot?: React.ReactNode;
};

export function LandingScrollRoot({ children, headerSlot }: LandingScrollRootProps) {
  const [scrollY, setScrollY] = useState(0);
  const [gateProgress, setGateProgress] = useState(0);
  const [gateEndScrollY, setGateEndScrollYState] = useState<number | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const isScrolled = scrollY > SCROLL_THRESHOLD_HEADER;

  // Start overlay rising when gate progress >= 0.8 so no gap between MercatoTools and Pricing
  const frontFromGate =
    gateProgress >= 0.8 ? Math.min(1, (gateProgress - 0.8) / 0.2) : 0;
  const frontFromScroll =
    gateEndScrollY != null && scrollY >= gateEndScrollY
      ? Math.min(1, (scrollY - gateEndScrollY) / FRONT_LAYER_ENTRANCE_PX)
      : 0;
  const frontLayerProgress = Math.max(frontFromGate, frontFromScroll);

  const setGateEndScrollY = useCallback((y: number | null) => {
    setGateEndScrollYState((prev) =>
      y != null && prev == null ? y : prev ?? null
    );
  }, []);

  useEffect(() => {
    const onScroll = () => {
      setScrollY(typeof window !== 'undefined' ? window.scrollY : 0);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const value: LandingScrollContextValue = {
    scrollY,
    gateProgress,
    gateEndScrollY,
    frontLayerProgress,
    isScrolled,
    scrollContainerRef,
  };

  return (
    <LandingScrollContext.Provider value={value}>
      <LandingScrollSetterContext.Provider value={{ setGateProgress, setGateEndScrollY }}>
        <div className="min-h-screen scroll-smooth" ref={scrollContainerRef}>
          {headerSlot != null && (
            <div className="sticky top-0 z-[100] h-0">
              {headerSlot}
            </div>
          )}
          {children}
        </div>
      </LandingScrollSetterContext.Provider>
    </LandingScrollContext.Provider>
  );
}
