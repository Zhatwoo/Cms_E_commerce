'use client';

import { useEffect, useRef, useState } from 'react';
import { useScrollGate } from './ScrollGate';

const ELEMENTS = [
  'Text',
  'Button',
  'Add to bag',
  'Image',
  'Gallery',
  'Video',
  'Shape',
  'Map',
  'Instagram Feed',
  'Contact form',
  'Subscribe',
  'Social icons',
  'Embed code',
];

const INTEGRATIONS = [
  { name: 'Gluel', desc: 'Open Source | Free Tier', icon: '○' },
  { name: 'Baserow', desc: 'Open Source | Free Tier', icon: '⊞' },
  { name: 'Strapi', desc: 'Open Source | Free Tier', icon: '▣' },
  { name: 'Airtable', desc: 'Open Source | Free Tier', icon: '◇' },
];

const LAYOUT_OPTIONS = ['Fill', 'Contents', 'Layout', 'Flex', 'Grid', 'Rows'];

const STAGGER_MS = 80;
const IN_OFFSET_Y = 40;
const IN_OFFSET_X = 32;

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
      const sectionCenter = sectionTop + sectionHeight / 2;

      let inVal = 0;
      if (scrollParent) {
        const parentRect = scrollParent.getBoundingClientRect();
        const parentTop = parentRect.top;
        const parentHeight = scrollParent.clientHeight;
        const parentBottom = parentTop + parentHeight;
        const parentCenter = parentTop + parentHeight / 2;
        if (sectionBottom > parentTop && sectionTop < parentBottom) {
          // progressIn 0 → 1: section bottom at parent bottom → section center at parent center (50% of section)
          const sectionTopStart = parentBottom - sectionHeight;
          const sectionTopEnd = parentCenter - sectionHeight / 2;
          const inRange = sectionTopStart - sectionTopEnd;
          if (inRange > 0) {
            inVal = (sectionTopStart - sectionTop) / inRange;
          } else {
            inVal = sectionCenter <= parentCenter ? 1 : 0;
          }
          inVal = Math.min(1, Math.max(0, inVal));
        }
        setProgressIn((p) => Math.max(p, inVal));

        let outVal = 0;
        if (sectionBottom <= parentTop) outVal = 1;
        else if (sectionTop < parentTop && sectionBottom > parentTop)
          outVal = Math.min(1, (parentTop - sectionTop) / sectionHeight);
        setProgressOut(outVal);
      } else {
        if (sectionBottom > viewTop && sectionTop < viewBottom) {
          // progressIn 0 → 1: section bottom at viewport bottom → section center at viewport center (50%)
          const sectionTopStart = viewHeight - sectionHeight;
          const sectionTopEnd = viewHeight / 2 - sectionHeight / 2;
          let inRange = sectionTopStart - sectionTopEnd;
          if (inRange <= 0) inRange = viewHeight * 0.5;
          inVal = (sectionTopStart - sectionTop) / inRange;
          inVal = Math.min(1, Math.max(0, inVal));
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

export function MercatoTools() {
  const { sectionRef, progressIn, progressOut } = useScrollProgress();

  const { progress: stackProgressRaw, allowInnerScroll } = useScrollGate();
  const stackProgress = allowInnerScroll ? stackProgressRaw : 0;
  const stackStyle = {
    transform: `translateY(${ -stackProgress * 36 }px) scale(${1 - stackProgress * 0.02})`,
    opacity: 1 - stackProgress * 0.12,
    transition: 'transform 300ms cubic-bezier(.2,.9,.2,1), opacity 300ms ease',
    willChange: 'transform, opacity',
  };

  const dissolveOut = 1 - progressOut;
  const opacity = progressIn * dissolveOut;

  const moveInOut = (
    delay: number,
    options?: { fromLeft?: boolean; fromRight?: boolean; fromBottom?: boolean }
  ) => {
    const fromLeft = options?.fromLeft ?? false;
    const fromRight = options?.fromRight ?? false;
    const fromBottom = options?.fromBottom ?? true;
    const translateX = fromLeft ? (1 - progressIn) * -IN_OFFSET_X : fromRight ? (1 - progressIn) * IN_OFFSET_X : 0;
    const translateY = fromBottom ? (1 - progressIn) * IN_OFFSET_Y : 0;
    const scale = 1 - progressOut * 0.06;
    return {
      opacity,
      transform: `translate(${translateX}px, ${translateY}px) scale(${scale})`,
      transition: 'opacity 0.25s ease-out, transform 0.35s ease-out',
      transitionDelay: `${delay}ms`,
    };
  };

  return (
    <section ref={sectionRef} className="w-full px-6 py-16 md:px-10 md:py-24" style={stackStyle}>
      <div className="mx-auto max-w-6xl">
        {/* Title and subtitle - in from bottom */}
        <div className="mx-auto max-w-3xl text-center" style={moveInOut(0)}>
          <h2 className="text-3xl font-bold tracking-tight text-white md:text-4xl lg:text-5xl">
            Build Your Website With Mercato Exclusive Tools
          </h2>
          <p className="mt-6 text-lg leading-relaxed text-white/90 md:text-xl">
            With Mercato&apos;s exclusive tools, you can design, launch, and grow your online store faster and smarter than ever before.
          </p>
        </div>

        {/* Top row: 4 integration cards (left, from left) + Custom frontend (right, from right) */}
        <div className="mt-16 grid grid-cols-1 gap-4 md:grid-cols-12 md:gap-6">
          <div className="grid grid-cols-2 gap-3 md:col-span-5 md:grid-cols-4">
            {INTEGRATIONS.map((item, i) => (
              <div
                key={item.name}
                className="rounded-xl border border-neutral-600 bg-neutral-800/90 p-4 text-white shadow-lg"
                style={moveInOut(i * STAGGER_MS, { fromLeft: true, fromBottom: false })}
              >
                <span className="text-2xl text-neutral-400">{item.icon}</span>
                <p className="mt-2 text-sm font-semibold">{item.name}</p>
                <p className="mt-0.5 text-xs text-neutral-400">{item.desc}</p>
              </div>
            ))}
          </div>

          <div className="md:col-span-7" style={moveInOut(STAGGER_MS * 2, { fromRight: true, fromBottom: false })}>
            <div className="rounded-xl border border-neutral-600 bg-neutral-800 shadow-xl overflow-hidden h-full min-h-[220px]">
              <div className="bg-violet-600/90 px-4 py-3">
                <p className="text-sm font-medium text-white">Custom frontend without custom code</p>
              </div>
              <div className="p-4 space-y-2">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-8 rounded bg-neutral-700/80" aria-hidden />
                ))}
                <div className="grid grid-cols-2 gap-2 mt-3">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="h-14 rounded bg-neutral-700/60" aria-hidden />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom row: Add elements (from left) + Website builder (from bottom) | Files/Layers (from right) */}
        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-12 md:gap-6">
          <div className="md:col-span-7 flex gap-4">
            <div
              className="shrink-0 w-full max-w-[240px] rounded-xl border border-neutral-600 bg-white p-4 shadow-xl"
              style={moveInOut(0, { fromLeft: true, fromBottom: false })}
            >
              <div className="flex items-center justify-between border-b border-neutral-200 pb-3">
                <h3 className="text-sm font-semibold text-neutral-800">Add elements</h3>
                <span className="text-neutral-400" aria-hidden>×</span>
              </div>
              <p className="mt-2 text-xs text-neutral-600">Drag and drop elements anywhere on your page</p>
              <ul className="mt-4 space-y-2">
                {ELEMENTS.slice(0, 10).map((label) => (
                  <li
                    key={label}
                    className="flex items-center gap-2 rounded-md bg-neutral-50 px-2 py-1.5 text-xs text-neutral-700"
                  >
                    <span className="flex h-5 w-5 items-center justify-center rounded bg-neutral-200 text-[10px]">T</span>
                    {label}
                  </li>
                ))}
              </ul>
            </div>

            <div
              className="flex-1 rounded-xl border border-neutral-600 bg-neutral-800/80 p-4 shadow-xl min-h-[280px]"
              style={moveInOut(STAGGER_MS, { fromBottom: true })}
            >
              <div className="rounded-lg bg-neutral-700/60 p-4 min-h-[180px]">
                <div className="h-3 w-3/4 rounded bg-neutral-600 mb-2" />
                <div className="h-3 w-1/2 rounded bg-neutral-600 mb-4" />
                <div className="grid grid-cols-3 gap-2">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="aspect-video rounded bg-neutral-600/80" aria-hidden />
                  ))}
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between">
                <div className="flex flex-col items-center gap-1">
                  <span className="text-2xl" aria-hidden>🏗</span>
                  <span className="text-xs font-medium text-white">HTML</span>
                </div>
                <span className="text-2xl" aria-hidden>💻</span>
              </div>
            </div>
          </div>

          <div className="md:col-span-5" style={moveInOut(STAGGER_MS * 2, { fromRight: true, fromBottom: false })}>
            <div className="rounded-xl border border-neutral-600 bg-neutral-800/90 overflow-hidden shadow-xl h-full">
              <div className="flex border-b border-neutral-600">
                <button type="button" className="px-4 py-2 text-xs font-medium text-white border-b-2 border-violet-500">
                  Files
                </button>
                <button type="button" className="px-4 py-2 text-xs text-neutral-400">
                  Layers
                </button>
              </div>
              <div className="flex">
                <div className="w-28 shrink-0 border-r border-neutral-600 p-2 space-y-1">
                  {LAYOUT_OPTIONS.map((label) => (
                    <div
                      key={label}
                      className="rounded py-1.5 text-center text-[10px] text-neutral-400"
                    >
                      {label}
                    </div>
                  ))}
                  <div className="grid grid-cols-2 gap-0.5 pt-2">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                      <div key={i} className="h-6 rounded bg-neutral-700/80" aria-hidden />
                    ))}
                  </div>
                </div>
                <div className="flex-1 p-4 flex flex-col items-center justify-center min-h-[200px]">
                  <div className="rounded-lg border border-neutral-600 bg-neutral-700/50 p-6 w-full max-w-[160px] aspect-9/16 flex items-center justify-center">
                    <span className="h-16 w-16 rounded-full bg-orange-500/90" aria-hidden />
                  </div>
                  <div className="mt-3 h-2 w-full max-w-[120px] rounded bg-neutral-600" aria-hidden />
                  <div className="mt-1 h-2 w-2/3 max-w-[80px] rounded bg-neutral-600" aria-hidden />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
