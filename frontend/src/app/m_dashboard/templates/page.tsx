'use client';
import React from 'react';

// Define the content type
interface Template {
  id: number;
  title: string;
  desc: string;
  comingSoon: boolean;
}

// The dynamic list of contents
const templates: Template[] = [
  { id: 1, title: 'Minimal Blog', desc: 'Clean blog with dark mode', comingSoon: false },
  { id: 2, title: 'SaaS Landing', desc: 'Modern product page', comingSoon: false },
  { id: 3, title: 'Portfolio v1', desc: 'Creative one-pager', comingSoon: false },
  { id: 4, title: 'E-commerce', desc: 'Shop with cart', comingSoon: true },
  { id: 5, title: 'Dashboard Kit', desc: 'Admin panels & charts', comingSoon: true },
  { id: 6, title: 'Landing Pro', desc: 'Bold startup template', comingSoon: false },
  { id: 7, title: 'Blog Pro', desc: 'Advanced article layout', comingSoon: false },
];

// Carousel row — one row, infinite marquee animation, no side scrolling
function TemplateCarousel<T>({ items, renderItem }: { items: T[]; renderItem: (item: T, index: number) => React.ReactNode }) {
  const doubledItems = [...items, ...items];
  return (
    <div className="relative w-full overflow-hidden max-w-full min-w-0">
      <div className="flex animate-marquee gap-5 md:gap-6 py-4 hover:pause-marquee group select-none flex-nowrap w-max">
        {doubledItems.map((item, index) => (
          <React.Fragment key={index}>
            {renderItem(item, index)}
          </React.Fragment>
        ))}
      </div>
      <div className="pointer-events-none absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-gray-950 to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-gray-950 to-transparent" />
    </div>
  );
}

// Card Component
const TemplateCard = ({ template }: { template: Template }) => (
  <div
    className={`
      group/card flex-shrink-0 
      w-[280px] sm:w-[320px] md:w-[360px] 
      rounded-2xl border border-white/10 
      bg-white/5 backdrop-blur-sm 
      shadow-xl overflow-hidden 
      transition-all duration-300 
      hover:scale-[1.04] hover:shadow-2xl hover:border-white/20
      pointer-events-auto
    `}
  >
    <div className="h-44 md:h-56 bg-gradient-to-br from-gray-800 via-gray-900 to-black relative overflow-hidden">
      <div className="absolute inset-0 flex items-center justify-center text-gray-500 text-sm font-medium">
        Template Preview
        <br />
        (Add Lottie / Image here)
      </div>
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
    </div>

    <div className="p-5">
      <div className="flex items-start justify-between">
        <h3 className="text-base md:text-lg font-medium text-white">
          {template.title}
          {template.comingSoon && (
            <span className="ml-2 text-xs bg-amber-500/30 text-amber-300 px-2 py-0.5 rounded">
              Soon
            </span>
          )}
        </h3>
      </div>
      <p className="mt-2 text-sm text-gray-400 line-clamp-2">
        {template.desc}
      </p>
      <div className="mt-5 flex gap-3">
        <button className="flex-1 py-2 text-sm bg-white/10 hover:bg-white/20 rounded-lg transition pointer-events-auto">
          Preview
        </button>
        <button className="flex-1 py-2 text-sm bg-indigo-600 hover:bg-indigo-500 rounded-lg transition pointer-events-auto">
          Use
        </button>
      </div>
    </div>
  </div>
);

export default function TemplatesPage() {
  return (
    <section className="space-y-8 overflow-x-hidden max-w-full min-w-0">
      <header>
        <h1 className="text-2xl md:text-3xl font-semibold text-white">Templates</h1>
        <p className="mt-2 text-sm md:text-base text-gray-400">
          Browse our collection of ready-to-use website templates
        </p>
      </header>

      <TemplateCarousel
        items={templates}
        renderItem={(template) => <TemplateCard template={template} />}
      />
      <p className="text-xs text-gray-500 text-center mt-4">Hover to pause animation</p>
    </section>
  );
}