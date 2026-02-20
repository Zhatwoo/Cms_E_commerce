/* 
Eto yung gallery ng mga templates, dito makikita ni user yung mga templates na pwede nyang gamitin
Eto yung umiikot na mga cards na parang 3d. 
Sa ngayon colors pa lang yung pinaka thumbnail nya pero in the future maglalagay tayo ng mga actual na templates dito.
*/
'use client';
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';

// Define the content type
interface Template {
  id: string | number;
  title: string;
  category: string;
  desc: string;
  status?: 'New' | 'Popular' | 'Coming Soon';
  imageColor: string;
}

// Template Card component
const TemplateCard = ({ template, colors, onPreview, onUseTemplate }: { template: Template; colors: any; onPreview: (t: Template) => void; onUseTemplate?: (t: Template) => void }) => (
  <div
    className="group relative rounded-2xl border overflow-hidden flex flex-col shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 h-full"
    style={{
      backgroundColor: colors.bg.card,
      borderColor: colors.border.faint,
    }}
  >
    {/* Thumbnail */}
    <div className={`h-48 w-full bg-gradient-to-br ${template.imageColor} relative overflow-hidden`}>
      <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors" />

      {/* Status Badge */}
      {template.status && (
        <div className="absolute top-3 right-3">
          <span
            className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide backdrop-blur-md shadow-sm ${template.status === 'Coming Soon'
              ? 'bg-black/40 text-white border border-white/20'
              : 'bg-white text-black'
              }`}
          >
            {template.status}
          </span>
        </div>
      )}

      {/* Overlay Actions */}
      <div className="absolute inset-0 flex items-center justify-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-black/40 backdrop-blur-[2px]">
        <button
          onClick={() => onPreview(template)}
          className="px-4 py-2 rounded-lg bg-white text-black text-sm font-medium shadow-lg hover:bg-gray-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-200"
        >
          Preview
        </button>
      </div>
    </div>

    {/* Content */}
    <div className="p-5 flex-1 flex flex-col">
      <div className="flex justify-between items-start mb-2">
        <div>
          <p className="text-xs font-medium mb-1" style={{ color: colors.status.info }}>
            {template.category}
          </p>
          <h3 className="text-lg font-semibold" style={{ color: colors.text.primary }}>
            {template.title}
          </h3>
        </div>
      </div>

      <p className="text-sm line-clamp-2 mb-6" style={{ color: colors.text.secondary }}>
        {template.desc}
      </p>

      <div
        className="mt-auto pt-4 border-t flex items-center justify-between"
        style={{ borderColor: colors.border.faint }}
      >
        <button
          disabled={template.status === 'Coming Soon'}
          onClick={() => onUseTemplate ? onUseTemplate(template) : null}
          className={`w-full py-2.5 rounded-lg text-sm font-medium transition-colors ${template.status === 'Coming Soon' ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-90'
            }`}
          style={{
            backgroundColor:
              template.status === 'Coming Soon' ? colors.bg.elevated : colors.text.primary,
            color: template.status === 'Coming Soon' ? colors.text.muted : colors.bg.primary,
          }}
        >
          {template.status === 'Coming Soon' ? 'Not Available' : 'Use Template'}
        </button>
      </div>
    </div>
  </div>
);

// Main Dome Gallery component
const DomeGallery = ({ templates, colors, onPreview, onUseTemplate }: { templates: Template[]; colors: any; onPreview: (t: Template) => void; onUseTemplate?: (t: Template) => void }) => {
  const [currentSlide, setCurrentSlide] = useState(1);
  const [isTransitionEnabled, setIsTransitionEnabled] = useState(true);
  const isAnimatingRef = useRef(false);
  const total = templates.length;

  const loopedTemplates = useMemo(() => {
    if (total <= 1) return templates;
    const first = templates[0];
    const last = templates[total - 1];
    return [last, ...templates, first];
  }, [templates, total]);

  const activeIndex = total > 0 ? ((currentSlide - 1 + total) % total) : 0;

  const goTo = useCallback((index: number) => {
    if (total <= 0) return;
    if (isAnimatingRef.current) return;
    const normalized = ((index % total) + total) % total;
    isAnimatingRef.current = true;
    setIsTransitionEnabled(true);
    setCurrentSlide(normalized + 1);
  }, [total]);

  const goNext = useCallback(() => {
    if (total <= 1) return;
    if (isAnimatingRef.current) return;
    isAnimatingRef.current = true;
    setIsTransitionEnabled(true);
    setCurrentSlide((prev) => prev + 1);
  }, [total]);

  const goPrev = useCallback(() => {
    if (total <= 1) return;
    if (isAnimatingRef.current) return;
    isAnimatingRef.current = true;
    setIsTransitionEnabled(true);
    setCurrentSlide((prev) => prev - 1);
  }, [total]);

  useEffect(() => {
    if (total <= 1) return;
    const id = window.setInterval(() => {
      if (!isAnimatingRef.current) {
        goNext();
      }
    }, 2600);
    return () => window.clearInterval(id);
  }, [goNext, total]);

  useEffect(() => {
    if (total <= 1) {
      setCurrentSlide(0);
      isAnimatingRef.current = false;
      return;
    }

    setCurrentSlide((prev) => {
      if (prev < 1 || prev > total) return 1;
      return prev;
    });
    isAnimatingRef.current = false;
  }, [total]);

  const handleTransitionEnd = useCallback(() => {
    if (total <= 1) return;

    if (currentSlide === total + 1) {
      setIsTransitionEnabled(false);
      setCurrentSlide(1);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setIsTransitionEnabled(true);
          isAnimatingRef.current = false;
        });
      });
    } else if (currentSlide === 0) {
      setIsTransitionEnabled(false);
      setCurrentSlide(total);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setIsTransitionEnabled(true);
          isAnimatingRef.current = false;
        });
      });
    } else {
      isAnimatingRef.current = false;
    }
  }, [currentSlide, total]);

  return (
    <div
      className="relative w-full overflow-hidden my-8 rounded-2xl border"
      style={{
        borderColor: colors.border.default,
        background: `linear-gradient(135deg, ${colors.bg.elevated}20 0%, ${colors.bg.card}20 100%)`,
      }}
    >
      <div className="overflow-hidden px-3 py-6 sm:px-6">
        <div
          className="flex will-change-transform"
          style={{
            transform: `translateX(-${currentSlide * 100}%)`,
            transition: isTransitionEnabled ? 'transform 700ms ease-in-out' : 'none',
          }}
          onTransitionEnd={handleTransitionEnd}
        >
          {loopedTemplates.map((template, index) => (
            <div key={`${template.id}-${index}`} className="w-full shrink-0 px-1 sm:px-4">
              <div className="mx-auto w-full max-w-[940px]">
                <TemplateCard template={template} colors={colors} onPreview={onPreview} onUseTemplate={onUseTemplate} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {total > 1 && (
        <>
          <button
            type="button"
            aria-label="Previous template"
            onClick={goPrev}
            className="absolute left-3 top-1/2 -translate-y-1/2 z-20 h-9 w-9 rounded-full border flex items-center justify-center backdrop-blur hover:opacity-90 transition-opacity"
            style={{ borderColor: colors.border.faint, backgroundColor: `${colors.bg.card}CC`, color: colors.text.primary }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          </button>

          <button
            type="button"
            aria-label="Next template"
            onClick={goNext}
            className="absolute right-3 top-1/2 -translate-y-1/2 z-20 h-9 w-9 rounded-full border flex items-center justify-center backdrop-blur hover:opacity-90 transition-opacity"
            style={{ borderColor: colors.border.faint, backgroundColor: `${colors.bg.card}CC`, color: colors.text.primary }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
          </button>

          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5">
            {templates.map((template, index) => (
              <button
                key={template.id}
                type="button"
                aria-label={`Go to template ${index + 1}`}
                onClick={() => goTo(index)}
                className="h-1.5 rounded-full transition-all"
                style={{
                  width: index === activeIndex ? 20 : 8,
                  backgroundColor: index === activeIndex ? colors.text.primary : colors.border.default,
                  opacity: index === activeIndex ? 1 : 0.7,
                }}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default DomeGallery;
