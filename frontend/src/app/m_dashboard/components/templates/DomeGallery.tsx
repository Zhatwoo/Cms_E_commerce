/* 
Eto yung gallery ng mga templates, dito makikita ni user yung mga templates na pwede nyang gamitin
Eto yung umiikot na mga cards na parang 3d. 
Sa ngayon colors pa lang yung pinaka thumbnail nya pero in the future maglalagay tayo ng mga actual na templates dito.
*/
'use client';
import React, { useState, useEffect, useMemo, useRef } from 'react';

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
  const [loopDistance, setLoopDistance] = useState(0);
  const [repeatCount, setRepeatCount] = useState(3);
  const firstGroupRef = useRef<HTMLDivElement | null>(null);
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const total = templates.length;
  const shouldAnimate = total >= 7 && loopDistance > 0;

  useEffect(() => {
    const measure = () => {
      const groupEl = firstGroupRef.current;
      const viewportEl = viewportRef.current;
      if (!groupEl || !viewportEl) return;

      const groupWidth = groupEl.scrollWidth;
      const viewportWidth = viewportEl.clientWidth;

      setLoopDistance(groupWidth);
      const minCopies = Math.max(3, Math.ceil(viewportWidth / groupWidth) + 2);
      setRepeatCount(minCopies);
    };

    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [templates]);

  if (total === 0) return null;

  return (
    <div
      className="relative w-full overflow-hidden my-8 rounded-2xl border"
      style={{
        borderColor: colors.border.default,
        background: `linear-gradient(135deg, ${colors.bg.elevated}20 0%, ${colors.bg.card}20 100%)`,
      }}
    >
      <style jsx>{`
        @keyframes domeMarquee {
          from { transform: translateX(0); }
          to { transform: translateX(calc(-1px * var(--loop-distance))); }
        }
      `}</style>
      <div ref={viewportRef} className="overflow-hidden px-3 py-6 sm:px-6">
        <div
          className="flex w-max will-change-transform"
          style={{
            ['--loop-distance' as string]: loopDistance,
            animation: shouldAnimate ? 'domeMarquee 36s linear infinite' : 'none',
          }}
        >
          <div ref={firstGroupRef} className="flex shrink-0 gap-4 pr-4">
            {templates.map((template, index) => (
              <div data-feature-card key={`group-a-${template.id}-${index}`} className="w-[min(86vw,340px)] shrink-0">
                <div className="w-full">
                  <TemplateCard template={template} colors={colors} onPreview={onPreview} onUseTemplate={onUseTemplate} />
                </div>
              </div>
            ))}
          </div>
          {shouldAnimate && Array.from({ length: Math.max(0, repeatCount - 1) }).map((_, groupIdx) => (
            <div key={`clone-group-${groupIdx}`} className="flex shrink-0 gap-4 pr-4" aria-hidden="true">
              {templates.map((template, index) => (
                <div data-feature-card key={`group-${groupIdx}-${template.id}-${index}`} className="w-[min(86vw,340px)] shrink-0">
                  <div className="w-full">
                    <TemplateCard template={template} colors={colors} onPreview={onPreview} onUseTemplate={onUseTemplate} />
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DomeGallery;
