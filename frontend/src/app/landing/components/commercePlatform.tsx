'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { useScrollGate } from './ScrollGate';

const STAGGER_MS = 100;
const IN_OFFSET_Y = 48;
const IN_OFFSET_X_LEFT = -24;
const IN_OFFSET_X_RIGHT = 24;

function useScrollProgress() {
  const sectionRef = useRef<HTMLElement>(null);
  const [progressIn, setProgressIn] = useState(0);
  const [progressOut, setProgressOut] = useState(0);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const getScrollParent = (el: HTMLElement): HTMLElement | null => {
      let parent = el.parentElement;
      while (parent) {
        const { overflowY } = getComputedStyle(parent);
        if (overflowY === 'auto' || overflowY === 'scroll' || overflowY === 'overlay' || overflowY === 'hidden') return parent;
        parent = parent.parentElement;
      }
      return null;
    };

    const update = () => {
      const scrollParent = getScrollParent(section);
      const win = typeof window !== 'undefined' ? window : null;
      if (!win) return;

      const rect = section.getBoundingClientRect();
      const viewHeight = win.innerHeight;
      const viewTop = 0;
      const viewBottom = viewHeight;

      const sectionTop = rect.top;
      const sectionBottom = rect.bottom;
      const sectionHeight = rect.height;

      let inVal = 0;
      if (scrollParent) {
        const parentRect = scrollParent.getBoundingClientRect();
        const parentTop = parentRect.top;
        const parentBottom = parentTop + scrollParent.clientHeight;
        if (sectionBottom > parentTop && sectionTop < parentBottom) {
          const visibleStart = parentBottom - sectionTop;
          const inRange = Math.min(sectionHeight * 0.5, scrollParent.clientHeight * 0.4);
          inVal = Math.min(1, Math.max(0, visibleStart / inRange));
        }
        setProgressIn((p) => Math.max(p, inVal));

        let outVal = 0;
        if (sectionBottom <= parentTop) outVal = 1;
        else if (sectionTop < parentTop && sectionBottom > parentTop)
          outVal = Math.min(1, (parentTop - sectionTop) / sectionHeight);
        setProgressOut(outVal);
      } else {
        if (sectionBottom > viewTop && sectionTop < viewBottom) {
          const visibleStart = viewBottom - sectionTop;
          const inRange = Math.min(sectionHeight * 0.5, viewHeight * 0.4);
          inVal = Math.min(1, Math.max(0, visibleStart / inRange));
        }
        setProgressIn((p) => Math.max(p, inVal));
        if (sectionBottom <= viewTop) setProgressOut(1);
        else if (sectionTop < viewTop && sectionBottom > viewTop)
          setProgressOut(Math.min(1, (viewTop - sectionTop) / sectionHeight));
        else setProgressOut(0);
      }
    };

    const updateFromWindowScroll = () => {
      const scrollY = window.scrollY;
      const threshold = Math.max(200, window.innerHeight * 0.5 - 80);
      const inVal = Math.min(1, scrollY / threshold);
      setProgressIn((p) => Math.max(p, inVal));
    };

    update();
    updateFromWindowScroll();

    const scrollParent = getScrollParent(section);
    scrollParent?.addEventListener('scroll', update, { passive: true });
    window.addEventListener('scroll', updateFromWindowScroll, { passive: true });
    window.addEventListener('resize', update);
    return () => {
      scrollParent?.removeEventListener('scroll', update);
      window.removeEventListener('scroll', updateFromWindowScroll);
      window.removeEventListener('resize', update);
    };
  }, []);

  return { sectionRef, progressIn, progressOut };
}

export function CommercePlatform() {
  const { sectionRef, progressIn, progressOut } = useScrollProgress();
  const { progress: gateProgress } = useScrollGate();

  const dissolveOut = 1 - progressOut;
  // When gate progress is 0 we're at top of gate — show CommercePlatform; otherwise use scroll-based opacity
  const opacity = gateProgress <= 0.05 ? 1 : progressIn * dissolveOut;

  const moveInOut = (delay: number, options?: { fromLeft?: boolean; fromRight?: boolean }) => {
    const fromLeft = options?.fromLeft ?? false;
    const fromRight = options?.fromRight ?? false;
    const offsetX = fromLeft ? IN_OFFSET_X_LEFT : fromRight ? IN_OFFSET_X_RIGHT : 0;
    const translateX = (1 - progressIn) * offsetX;
    const translateY = (1 - progressIn) * IN_OFFSET_Y;
    const scale = 1 - progressOut * 0.08;
    return {
      opacity,
      transform: `translate(${translateX}px, ${translateY}px) scale(${scale})`,
      transition: 'opacity 0.25s ease-out, transform 0.35s ease-out',
      transitionDelay: `${delay}ms`,
    };
  };

  return (
    <section
      ref={sectionRef}
      className="w-full bg-transparent pb-16 pt-0 md:pb-24 md:pt-0"
    >
      {/* Full-width teal block with rounded top edge (3xl) */}
      <div
        className="w-full overflow-hidden rounded-t-3xl px-6 py-12 md:px-10 md:py-16"
        style={{
          ...moveInOut(0),
          backgroundColor: '#0A2727',
          borderTopLeftRadius: '1.5rem',
          borderTopRightRadius: '1.5rem',
        }}
      >
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-white md:text-4xl lg:text-5xl">
            The commerce platform behind everything we build
          </h2>
          <p className="mt-6 text-lg leading-relaxed text-white/90 md:text-xl">
            Build, customize, and scale e-commerce websites with total control.
            <br />
            A flexible, modern system for building powerful online stores.
            <br />
            Everything you need to create, manage, and grow your store.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-6 md:px-10">
        {/* Browser mockups - staggered parallax move in */}
        <div className="mt-16 grid gap-6 md:mt-20 md:grid-cols-3 md:gap-8">
          {/* Left: Stock / creative - in from left, out dissolve */}
          <div style={moveInOut(STAGGER_MS, { fromLeft: true })}>
            <div className="translate-y-8 overflow-hidden rounded-lg border border-neutral-700 bg-white shadow-xl md:translate-y-12">
            <div className="flex items-center gap-2 border-b border-neutral-200 bg-neutral-100 px-3 py-2">
              <span className="h-2 w-2 rounded-full bg-neutral-400" />
              <span className="h-2 w-2 rounded-full bg-neutral-400" />
              <span className="h-2 w-2 rounded-full bg-neutral-400" />
            </div>
            <div className="aspect-4/3 bg-neutral-50 p-4">
              <p className="text-sm font-semibold text-neutral-800">
                Generate stock photos with various genders for creative testing
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {['People', 'Clothing', 'Business', 'Technology'].map((cat) => (
                  <span
                    key={cat}
                    className="rounded bg-neutral-200 px-2 py-0.5 text-xs text-neutral-700"
                  >
                    {cat}
                  </span>
                ))}
              </div>
              <div className="mt-4 flex justify-end gap-2">
                {[1, 2, 3].map((i) => (
                  <span
                    key={i}
                    className="h-8 w-8 rounded-full bg-neutral-300"
                    aria-hidden
                  />
                ))}
              </div>
            </div>
            </div>
          </div>

          {/* Middle: Design tool - in from below, out dissolve */}
          <div style={moveInOut(STAGGER_MS * 2)}>
            <div className="-translate-y-8 overflow-hidden rounded-lg border border-neutral-700 bg-white shadow-xl md:-translate-y-12">
            <div className="flex items-center gap-2 border-b border-neutral-200 bg-neutral-100 px-3 py-2">
              <span className="h-2 w-2 rounded-full bg-neutral-400" />
              <span className="h-2 w-2 rounded-full bg-neutral-400" />
              <span className="h-2 w-2 rounded-full bg-neutral-400" />
            </div>
            <div className="aspect-4/3 bg-neutral-50 p-4">
              <p className="text-sm font-semibold text-neutral-800">
                What will you <span className="text-blue-600">design</span> today?
              </p>
              <p className="mt-1 text-xs text-neutral-600">
                Design, generate, print, and work on anything.
              </p>
              <button
                type="button"
                className="mt-3 rounded-md bg-violet-500 px-3 py-1.5 text-xs font-medium text-white"
              >
                Start designing
              </button>
              <div className="mt-4 flex gap-2">
                {['Research Doc', 'Presentation', 'Websites'].map((label, i) => (
                  <span
                    key={label}
                    className="h-12 flex-1 rounded bg-neutral-200 text-[10px] text-neutral-600"
                    style={{
                      backgroundColor:
                        i === 0 ? '#dcfce7' : i === 1 ? '#ffedd5' : '#dbeafe',
                    }}
                  >
                    {label}
                  </span>
                ))}
              </div>
            </div>
            </div>
          </div>

          {/* Right: E-commerce / gallery - in from right, out dissolve */}
          <div style={moveInOut(STAGGER_MS * 3, { fromRight: true })}>
            <div className="translate-y-8 overflow-hidden rounded-lg border border-neutral-700 bg-white shadow-xl md:translate-y-12">
            <div className="flex items-center gap-2 border-b border-neutral-200 bg-neutral-100 px-3 py-2">
              <span className="h-2 w-2 rounded-full bg-neutral-400" />
              <span className="h-2 w-2 rounded-full bg-neutral-400" />
              <span className="h-2 w-2 rounded-full bg-neutral-400" />
            </div>
            <div className="aspect-4/3 bg-neutral-50 p-4">
              <div className="grid grid-cols-3 gap-1">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div
                    key={i}
                    className="aspect-square rounded bg-neutral-200"
                    aria-hidden
                  />
                ))}
              </div>
              <p className="mt-3 text-[10px] text-neutral-500">
                Lorem ipsum dolor sit amet, consectetur adipiscing elit.
              </p>
            </div>
            </div>
          </div>
        </div>

        {/* Button - scroll-driven in last / out dissolve */}
        <div className="mt-2 flex justify-center md:mt-4" style={moveInOut(STAGGER_MS * 4)}>
          <Link
            href="/templates"
            className="inline-flex rounded-full border border-3 border-black bg-white px-6 py-3 text-sm font-semibold text-black transition hover:bg-white hover:text-black"
          >
            Explore Web Templates
          </Link>
        </div> 
      </div>
    </section>
  );
}
