'use client';
import React, { useState, useEffect, useRef } from 'react';

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
  const [rotation, setRotation] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const startX = useRef(0);
  const startRotation = useRef(0);
  const requestRef = useRef<number>(0);

  useEffect(() => {
    if (isDragging) return; // Pause auto-rotation while dragging

    const animate = () => {
      setRotation((prev) => (prev + 0.1) % 360);
      requestRef.current = requestAnimationFrame(animate);
    };
    requestRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(requestRef.current);
  }, [isDragging]);

  const handleMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDragging(true);
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    startX.current = clientX;
    startRotation.current = rotation;
  };

  const handleMouseMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDragging) return;
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const delta = clientX - startX.current;
    setRotation(startRotation.current - delta * 0.5);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const itemWidth = 320;
  const radius = Math.max(500, (templates.length * itemWidth * 1.2) / (2 * Math.PI));

  return (
    <div
      className="relative h-[380px] w-full overflow-hidden flex items-center justify-center my-8 cursor-grab active:cursor-grabbing select-none rounded-2xl border-2"
      style={{
        perspective: '1200px',
        borderColor: colors.border.default,
        background: `linear-gradient(135deg, ${colors.bg.elevated}20 0%, ${colors.bg.card}20 100%)`,
      }}
      onMouseDown={handleMouseDown}
      onTouchStart={handleMouseDown}
      onMouseMove={handleMouseMove}
      onTouchMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onTouchEnd={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <div
        className="relative h-full w-full flex items-center justify-center"
        style={{
          transformStyle: 'preserve-3d',
          transform: `rotateY(${-rotation}deg)`,
        }}
      >
        {templates.map((template, i) => {
          const angle = (360 / templates.length) * i;
          return (
            <div
              key={template.id}
              className="absolute"
              style={{
                transform: `rotateY(${angle}deg) translateZ(${radius}px)`,
                width: `${itemWidth}px`,
                left: '50%',
                top: '50%',
                marginLeft: `-${itemWidth / 2}px`,
                marginTop: '-120px',
              }}
            >
              <TemplateCard template={template} colors={colors} onPreview={onPreview} onUseTemplate={onUseTemplate} />
            </div>
          );
        })}
      </div>
      {/* Enhanced Gradient Fades for depth */}
      <div className="absolute inset-y-0 left-0 w-48 z-10 pointer-events-none" style={{
        background: `linear-gradient(to right, ${colors.bg.primary}, ${colors.bg.primary}80, transparent)`
      }} />
      <div className="absolute inset-y-0 right-0 w-48 z-10 pointer-events-none" style={{
        background: `linear-gradient(to left, ${colors.bg.primary}, ${colors.bg.primary}80, transparent)`
      }} />
    </div>
  );
};

export default DomeGallery;
