// c:\Users\echob\OJT\Cms_E_commerce\frontend\src\app\m_dashboard\templates\page.tsx

'use client';
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../components/theme-context';
import DomeGallery from '../components/DomeGallery';
import { templateService, Template as FullTemplate } from '@/lib/templateService';

// Template interface for DomeGallery compatibility
interface GalleryTemplate {
  id: string | number; // Allow both string and number IDs
  title: string;
  category: string;
  desc: string;
  status?: 'New' | 'Popular' | 'Coming Soon';
  imageColor: string;
}

// Convert FullTemplate to GalleryTemplate
const convertToGalleryTemplate = (template: FullTemplate): GalleryTemplate => ({
  id: template.id,
  title: template.title,
  category: template.category,
  desc: template.desc,
  status: template.status,
  imageColor: template.imageColor || 'from-gray-500 to-gray-700'
});

const CATEGORIES = ['All', 'E-commerce', 'Blog', 'Portfolio', 'Landing Page'];

const TemplateCard = ({ template, colors, onPreview, onUseTemplate }: { template: GalleryTemplate; colors: any; onPreview: (t: GalleryTemplate) => void; onUseTemplate: (t: GalleryTemplate) => void }) => (
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
          onClick={() => onUseTemplate(template)}
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


const PreviewModal = ({ template, colors, onClose, onUseTemplate }: { template: GalleryTemplate; colors: any; onClose: () => void; onUseTemplate: (t: GalleryTemplate) => void }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      onClick={(e) => e.stopPropagation()}
      className="relative w-full max-w-2xl rounded-2xl border shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      style={{ backgroundColor: colors.bg.card, borderColor: colors.border.default }}
    >
      {/* Header */}
      <div className="p-6 border-b flex justify-between items-center" style={{ borderColor: colors.border.faint }}>
        <div>
          <h3 className="text-xl font-semibold" style={{ color: colors.text.primary }}>{template.title}</h3>
          <p className="text-sm" style={{ color: colors.text.secondary }}>{template.category}</p>
        </div>
        <button onClick={onClose} className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors" style={{ color: colors.text.muted }}>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className={`w-full h-64 rounded-xl mb-6 bg-gradient-to-br ${template.imageColor} flex items-center justify-center`}>
          <span className="text-white/50 font-medium text-lg">Template Preview Image</span>
        </div>
        <p className="text-base leading-relaxed" style={{ color: colors.text.secondary }}>
          {template.desc}
        </p>
        <div className="mt-6 space-y-4">
          <h4 className="font-medium" style={{ color: colors.text.primary }}>Features</h4>
          <ul className="grid grid-cols-2 gap-2 text-sm" style={{ color: colors.text.muted }}>
            <li>• Responsive Design</li>
            <li>• SEO Optimized</li>
            <li>• Dark Mode Support</li>
            <li>• Fast Loading</li>
          </ul>
        </div>
      </div>

      {/* Footer */}
      <div className="p-6 border-t flex justify-end gap-3" style={{ borderColor: colors.border.faint, backgroundColor: colors.bg.elevated }}>
        <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm font-medium transition-colors hover:opacity-80" style={{ color: colors.text.primary }}>
          Cancel
        </button>
        <button onClick={() => onUseTemplate(template)} className="px-4 py-2 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/20">
          Use Template
        </button>
      </div>
    </motion.div>
  </div>
);

export default function TemplatesPage() {
  const { colors, theme } = useTheme();
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [previewTemplate, setPreviewTemplate] = useState<GalleryTemplate | null>(null);
  const [templates, setTemplates] = useState<GalleryTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  // Load templates on mount
  useEffect(() => {
    const loadedTemplates = templateService.getTemplates();
    const convertedTemplates = loadedTemplates.map(convertToGalleryTemplate);
    setTemplates(convertedTemplates);
    setLoading(false);
  }, []);

  const handleUseTemplate = async (template: GalleryTemplate) => {
    console.log('handleUseTemplate called with:', template);

    try {
      const success = await templateService.loadTemplate(template.id.toString());
      console.log('loadTemplate result:', success);

      if (success) {
        // Navigate to design editor
        console.log('Navigating to /design');
        window.location.href = '/design';
      } else {
        alert('Failed to load template. Please try again.');
      }
    } catch (error) {
      console.error('Error using template:', error);
      alert('Failed to load template. Please try again.');
    }
  };

  const filteredTemplates = templates.filter(
    (t: GalleryTemplate) => selectedCategory === 'All' || t.category === selectedCategory
  );

  return (
    <section className="space-y-8 min-h-screen pb-20">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight" style={{ color: colors.text.primary }}>
            Template Library
          </h1>
          <p className="mt-2 text-base max-w-2xl" style={{ color: colors.text.secondary }}>
            Jumpstart your next project with our professionally designed templates.
            Fully customizable and optimized for performance.
          </p>
        </div>
        <button
          className="px-5 py-2.5 rounded-xl text-sm font-medium transition-all shadow-lg hover:shadow-xl active:scale-95"
          style={{
            backgroundColor: theme === 'dark' ? '#fff' : '#000',
            color: theme === 'dark' ? '#000' : '#fff'
          }}
        >
          Request a Template
        </button>
      </div>

      {/* Featured Carousel */}
      <div className="w-full overflow-hidden py-2">
        <div className="mb-4">
          <h2 className="text-lg font-semibold" style={{ color: colors.text.primary }}>Featured & Popular</h2>
        </div>
        <DomeGallery templates={templates} colors={colors} onPreview={(template: GalleryTemplate) => setPreviewTemplate(template)} onUseTemplate={handleUseTemplate} />
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2 pb-2 border-b" style={{ borderColor: colors.border.faint }}>
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${selectedCategory === cat ? 'shadow-md' : 'hover:opacity-70'
              }`}
            style={{
              backgroundColor: selectedCategory === cat ? colors.bg.elevated : 'transparent',
              color: selectedCategory === cat ? colors.text.primary : colors.text.muted,
              border: `1px solid ${selectedCategory === cat ? colors.border.default : 'transparent'}`
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Grid */}
      <motion.div
        layout
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
      >
        <AnimatePresence mode='popLayout'>
          {filteredTemplates.map((template: GalleryTemplate) => (
            <motion.div
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.2 }}
              key={template.id}
            >
              <TemplateCard template={template} colors={colors} onPreview={setPreviewTemplate} onUseTemplate={handleUseTemplate} />
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>

      {filteredTemplates.length === 0 && (
        <div className="text-center py-20">
          <p style={{ color: colors.text.muted }}>No templates found for this category.</p>
          <button
            onClick={() => setSelectedCategory('All')}
            className="mt-4 text-sm hover:underline"
            style={{ color: colors.status.info }}
          >
            Clear filters
          </button>
        </div>
      )}

      {/* Preview Modal */}
      <AnimatePresence>
        {previewTemplate && (
          <PreviewModal template={previewTemplate} colors={colors} onClose={() => setPreviewTemplate(null)} onUseTemplate={handleUseTemplate} />
        )}
      </AnimatePresence>
    </section>
  );
}