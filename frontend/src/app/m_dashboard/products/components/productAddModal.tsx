'use client';
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../../components/context/theme-context';
import { useAlert } from '../../components/context/alert-context';
import { type Product } from '../../lib/productsData';

const uid = () => Math.random().toString(36).substr(2, 9);

function cartesian<T>(arrays: T[][]): T[][] {
  return arrays.reduce<T[][]>(
    (acc, curr) => acc.flatMap(a => curr.map(b => [...a, b])),
    [[]]
  );
}

interface VariantOption { id: string; name: string; priceAdjustment: number; }
interface Variant { id: string; name: string; pricingMode: 'modifier' | 'override'; options: VariantOption[]; }
interface FormData {
  name: string; sku: string; category: string; description: string;
  status: 'active' | 'inactive' | 'draft';
  price: number; costPrice: number; discount: number; discountType: 'percentage' | 'fixed';
  images: string[]; stock: number; lowStockThreshold: number;
  hasVariants: boolean; variants: Variant[];
}

// ─── Step 1: Image Upload ─────────────────────────────────────────────────────
function ImageStep({ images, setImages, onNext, onClose, colors }: {
  images: string[]; setImages: (i: string[]) => void;
  onNext: () => void; onClose: () => void; colors: any;
}) {
  const { showAlert } = useAlert();
  const [slide, setSlide] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [thumbDrag, setThumbDrag] = useState<number | null>(null);
  const [thumbOver, setThumbOver] = useState<number | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (images.length <= 1) return;
    const t = setInterval(() => setSlide(i => (i + 1) % images.length), 3000);
    return () => clearInterval(t);
  }, [images.length]);

  useEffect(() => {
    if (slide >= images.length && images.length > 0) setSlide(images.length - 1);
  }, [images.length, slide]);

  const addFiles = (files: FileList | null) => {
    if (!files) return;
    const room = 8 - images.length;
    if (room <= 0) { showAlert('Maximum 8 images', 'error'); return; }
    Array.from(files).slice(0, room).forEach(f => {
      if (!f.type.startsWith('image/')) { showAlert('Invalid file type', 'error'); return; }
      if (f.size > 8 * 1024 * 1024) { showAlert('Max 8MB per image', 'error'); return; }
      const r = new FileReader();
      r.onload = e => setImages([...images, e.target?.result as string]);
      r.readAsDataURL(f);
    });
  };

  const remove = (idx: number) => setImages(images.filter((_, i) => i !== idx));

  const dropThumb = (to: number) => {
    if (thumbDrag === null || thumbDrag === to) { setThumbDrag(null); setThumbOver(null); return; }
    const next = [...images];
    const [m] = next.splice(thumbDrag, 1);
    next.splice(to, 0, m);
    setImages(next); setSlide(to); setThumbDrag(null); setThumbOver(null);
  };

  return (
    <motion.div key="s1" initial={{ opacity: 0, x: -32 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -32 }}
      transition={{ type: 'spring', damping: 28, stiffness: 300 }} className="flex flex-col" style={{ maxHeight: '90vh' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-8 pt-7 pb-5 flex-shrink-0">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] mb-1" style={{ color: colors.text.muted }}>Step 1 of 2</p>
          <h2 className="text-2xl font-bold" style={{ color: colors.text.primary }}>Product Images</h2>
        </div>
        <button onClick={onClose} className="w-9 h-9 rounded-full flex items-center justify-center transition-colors hover:bg-black/10 dark:hover:bg-white/10" style={{ color: colors.text.muted }}>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-8 pb-6 space-y-4">
        {images.length === 0 ? (
          <div
            onDragEnter={() => setDragging(true)} onDragLeave={() => setDragging(false)}
            onDragOver={e => e.preventDefault()} onDrop={e => { e.preventDefault(); setDragging(false); addFiles(e.dataTransfer.files); }}
            onClick={() => fileRef.current?.click()}
            className="flex flex-col items-center justify-center rounded-2xl cursor-pointer transition-all select-none"
            style={{ height: 300, border: `2px dashed ${dragging ? '#3b82f6' : colors.border.faint}`, backgroundColor: dragging ? 'rgba(59,130,246,0.05)' : colors.bg.card }}
          >
            <motion.div animate={{ y: dragging ? -6 : 0 }} className="flex flex-col items-center gap-3">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ backgroundColor: 'rgba(59,130,246,0.1)' }}>
                <svg className="w-8 h-8" fill="none" stroke="#3b82f6" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                </svg>
              </div>
              <div className="text-center">
                <p className="font-semibold text-sm" style={{ color: colors.text.primary }}>Drop images here or click to browse</p>
                <p className="text-xs mt-1" style={{ color: colors.text.muted }}>PNG, JPG, WEBP · Up to 5 images · Max 8MB each</p>
              </div>
            </motion.div>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Main slider */}
            <div className="relative rounded-2xl overflow-hidden" style={{ height: 280, backgroundColor: colors.bg.card }}>
              <AnimatePresence mode="wait">
                <motion.img key={slide} src={images[slide]} alt="" className="absolute inset-0 w-full h-full object-contain"
                  initial={{ opacity: 0, scale: 1.03 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.97 }} transition={{ duration: 0.3 }} />
              </AnimatePresence>
              {/* Counter */}
              <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-xs font-semibold backdrop-blur-sm" style={{ backgroundColor: 'rgba(0,0,0,0.5)', color: '#fff' }}>
                {slide + 1} / {images.length}
              </div>
              {/* Remove */}
              <button onClick={() => remove(slide)} className="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center backdrop-blur-sm transition-colors hover:bg-red-500" style={{ backgroundColor: 'rgba(0,0,0,0.5)', color: '#fff' }}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
              {/* Arrows */}
              {images.length > 1 && <>
                <button onClick={() => setSlide(i => (i - 1 + images.length) % images.length)} className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full flex items-center justify-center backdrop-blur-sm hover:bg-white/20 transition-colors" style={{ backgroundColor: 'rgba(0,0,0,0.35)', color: '#fff' }}>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7"/></svg>
                </button>
                <button onClick={() => setSlide(i => (i + 1) % images.length)} className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full flex items-center justify-center backdrop-blur-sm hover:bg-white/20 transition-colors" style={{ backgroundColor: 'rgba(0,0,0,0.35)', color: '#fff' }}>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7"/></svg>
                </button>
              </>}
              {/* Dots */}
              {images.length > 1 && (
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                  {images.map((_, i) => (
                    <button key={i} onClick={() => setSlide(i)} className="rounded-full transition-all"
                      style={{ width: i === slide ? 20 : 6, height: 6, backgroundColor: i === slide ? '#3b82f6' : 'rgba(255,255,255,0.5)' }} />
                  ))}
                </div>
              )}
            </div>

            {/* Thumbnails */}
            <div className="flex gap-2 overflow-x-auto pb-1">
              {images.map((img, idx) => (
                <div key={idx} draggable
                  onDragStart={() => setThumbDrag(idx)}
                  onDragOver={e => { e.preventDefault(); setThumbOver(idx); }}
                  onDragLeave={() => setThumbOver(null)}
                  onDrop={() => dropThumb(idx)}
                  onClick={() => setSlide(idx)}
                  className="relative flex-shrink-0 rounded-xl overflow-hidden cursor-pointer transition-all"
                  style={{ width: 64, height: 64, border: `2px solid ${idx === slide ? '#3b82f6' : thumbOver === idx ? '#10b981' : colors.border.faint}`, opacity: thumbDrag === idx ? 0.4 : 1 }}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                  {idx === slide && <div className="absolute inset-0 bg-blue-500/20" />}
                  <div className="absolute bottom-0.5 right-0.5 w-4 h-4 rounded-full bg-blue-500 text-white flex items-center justify-center text-[9px] font-bold">{idx + 1}</div>
                </div>
              ))}
              {images.length < 5 && (
                <button onClick={() => fileRef.current?.click()}
                  className="flex-shrink-0 w-16 h-16 rounded-xl border-2 border-dashed flex flex-col items-center justify-center transition-colors hover:border-blue-400"
                  style={{ borderColor: colors.border.faint, color: colors.text.muted }}>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/></svg>
                  <span className="text-xs mt-0.5">Add</span>
                </button>
              )}
            </div>
            <p className="text-xs" style={{ color: colors.text.muted }}>Drag thumbnails to reorder · First image is the cover</p>
          </div>
        )}
        <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={e => addFiles(e.target.files)} />
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between px-8 py-5 border-t flex-shrink-0" style={{ borderColor: colors.border.faint }}>
        <button onClick={onClose} className="text-sm font-medium" style={{ color: colors.text.muted }}>Cancel</button>
        <div className="flex gap-1.5">
          <div className="w-5 h-2 rounded-full" style={{ backgroundColor: '#3b82f6' }} />
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: colors.bg.elevated }} />
        </div>
        <button onClick={onNext} className="flex items-center gap-2 px-7 py-2.5 rounded-xl font-semibold text-sm text-white hover:opacity-90 active:scale-95 transition-all" style={{ backgroundColor: '#3b82f6' }}>
          Next
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7"/></svg>
        </button>
      </div>
    </motion.div>
  );
}

// ─── Step 2: Item Details ─────────────────────────────────────────────────────
function DetailsStep({ fd, patch, onBack, onSave, onClose, isEditing, colors }: {
  fd: FormData; patch: (p: Partial<FormData>) => void;
  onBack: () => void; onSave: () => void; onClose: () => void;
  isEditing: boolean; colors: any;
}) {
  const set = (k: keyof FormData, v: any) => patch({ [k]: v });

  const discBase = useMemo(() =>
    fd.discountType === 'percentage' ? fd.price * (1 - fd.discount / 100) : fd.price - fd.discount,
    [fd.price, fd.discount, fd.discountType]);

  const combos = useMemo(() => {
    if (!fd.hasVariants) return [];
    const av = fd.variants.filter(v => v.options.length > 0);
    if (!av.length) return [];
    const groups = av.map(v => v.options.map(o => ({ variant: v, option: o })));
    return cartesian(groups).map(combo => {
      let base = discBase;
      combo.forEach(({ variant, option }) => { if (variant.pricingMode === 'override' && option.priceAdjustment > 0) base = option.priceAdjustment; });
      combo.forEach(({ variant, option }) => { if (variant.pricingMode === 'modifier') base += option.priceAdjustment; });
      return { label: combo.map(c => `${c.variant.name}: ${c.option.name}`).join(' / '), price: Math.max(0, base) };
    });
  }, [fd.variants, fd.hasVariants, discBase]);

  const range = useMemo(() => {
    if (!combos.length) return null;
    const prices = combos.map(c => c.price);
    return { min: Math.min(...prices), max: Math.max(...prices) };
  }, [combos]);

  const iCls = 'w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/40 transition-all';
  const iSt = { backgroundColor: colors.bg.card, borderColor: colors.border.faint, color: colors.text.primary };
  const lCls = 'block text-xs font-semibold uppercase tracking-wide mb-1.5';
  const divider = (label: string) => (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-px" style={{ backgroundColor: colors.border.faint }} />
      <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: colors.text.muted }}>{label}</span>
      <div className="flex-1 h-px" style={{ backgroundColor: colors.border.faint }} />
    </div>
  );

  const addVariant = () => patch({ variants: [...fd.variants, { id: uid(), name: '', pricingMode: 'modifier', options: [] }] });
  const remVariant = (id: string) => patch({ variants: fd.variants.filter(v => v.id !== id) });
  const updVariant = (id: string, f: keyof Variant, v: any) => patch({ variants: fd.variants.map(x => x.id === id ? { ...x, [f]: v } : x) });
  const addOpt = (vid: string) => patch({ variants: fd.variants.map(v => v.id === vid ? { ...v, options: [...v.options, { id: uid(), name: '', priceAdjustment: 0 }] } : v) });
  const remOpt = (vid: string, oid: string) => patch({ variants: fd.variants.map(v => v.id === vid ? { ...v, options: v.options.filter(o => o.id !== oid) } : v) });
  const updOpt = (vid: string, oid: string, f: keyof VariantOption, v: any) => patch({ variants: fd.variants.map(x => x.id === vid ? { ...x, options: x.options.map(o => o.id === oid ? { ...o, [f]: v } : o) } : x) });

  return (
    <motion.div key="s2" initial={{ opacity: 0, x: 32 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 32 }}
      transition={{ type: 'spring', damping: 28, stiffness: 300 }} className="flex flex-col" style={{ maxHeight: '90vh' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-8 pt-7 pb-5 flex-shrink-0">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] mb-1" style={{ color: colors.text.muted }}>Step 2 of 2</p>
          <h2 className="text-2xl font-bold" style={{ color: colors.text.primary }}>Item Details</h2>
        </div>
        <button onClick={onClose} className="w-9 h-9 rounded-full flex items-center justify-center transition-colors hover:bg-black/10 dark:hover:bg-white/10" style={{ color: colors.text.muted }}>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-8 pb-6 space-y-5">

        {/* Name / SKU / Category */}
        <div className="space-y-3">
          <div>
            <label className={lCls} style={{ color: colors.text.muted }}>Product Name *</label>
            <input type="text" value={fd.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Classic White Tee" className={iCls} style={iSt} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={lCls} style={{ color: colors.text.muted }}>SKU *</label>
              <input type="text" value={fd.sku} onChange={e => set('sku', e.target.value)} placeholder="WHT-TEE-001" className={iCls} style={iSt} />
            </div>
            <div>
              <label className={lCls} style={{ color: colors.text.muted }}>Category</label>
              <select value={fd.category} onChange={e => set('category', e.target.value)} className={iCls} style={iSt}>
                <option value="">Select…</option>
                {['Electronics','Clothing','Books','Home','Sports'].map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
        </div>

        {divider('Pricing')}

        {/* Price fields */}
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className={lCls} style={{ color: colors.text.muted }}>Price *</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold" style={{ color: colors.text.muted }}>$</span>
              <input type="number" value={fd.price || ''} onChange={e => set('price', parseFloat(e.target.value) || 0)}
                placeholder="0.00" step="0.01" className={iCls} style={{ ...iSt, paddingLeft: '1.75rem' }} />
            </div>
          </div>
          <div>
            <label className={lCls} style={{ color: colors.text.muted }}>Cost</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold" style={{ color: colors.text.muted }}>$</span>
              <input type="number" value={fd.costPrice || ''} onChange={e => set('costPrice', parseFloat(e.target.value) || 0)}
                placeholder="0.00" step="0.01" className={iCls} style={{ ...iSt, paddingLeft: '1.75rem' }} />
            </div>
          </div>
          <div>
            <label className={lCls} style={{ color: colors.text.muted }}>Discount</label>
            <div className="flex gap-1">
              <select value={fd.discountType} onChange={e => set('discountType', e.target.value)}
                className="px-2 py-2.5 rounded-xl border text-sm focus:outline-none flex-shrink-0" style={{ ...iSt, width: 52 }}>
                <option value="percentage">%</option>
                <option value="fixed">$</option>
              </select>
              <input type="number" value={fd.discount || ''} onChange={e => set('discount', parseFloat(e.target.value) || 0)}
                placeholder="0" step="0.01" className={iCls} style={iSt} />
            </div>
          </div>
        </div>

        {/* Price pill */}
        {fd.price > 0 && (
          <div className="flex items-center justify-between px-5 py-3.5 rounded-2xl"
            style={{ backgroundColor: 'rgba(59,130,246,0.07)', border: '1px solid rgba(59,130,246,0.2)' }}>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: '#3b82f6' }}>
                {range ? 'Price Range' : 'Final Price'}
              </p>
              <p className="text-2xl font-bold mt-0.5" style={{ color: colors.text.primary }}>
                {range
                  ? range.min === range.max ? `$${range.min.toFixed(2)}` : `$${range.min.toFixed(2)} – $${range.max.toFixed(2)}`
                  : `$${discBase.toFixed(2)}`}
              </p>
            </div>
            {fd.costPrice > 0 && !range && (
              <div className="text-right">
                <p className="text-xs" style={{ color: colors.text.muted }}>Profit</p>
                <p className="text-lg font-bold" style={{ color: discBase > fd.costPrice ? '#22c55e' : '#ef4444' }}>
                  ${(discBase - fd.costPrice).toFixed(2)}
                </p>
              </div>
            )}
          </div>
        )}

        {divider('Stock')}

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={lCls} style={{ color: colors.text.muted }}>Initial Stock</label>
            <input type="number" value={fd.stock} onChange={e => set('stock', parseInt(e.target.value) || 0)}
              placeholder="100" className={iCls} style={iSt} />
            <p className="text-xs mt-1" style={{ color: colors.text.muted }}>Auto-deducts on each sale</p>
          </div>
          <div>
            <label className={lCls} style={{ color: colors.text.muted }}>Low Stock Alert</label>
            <input type="number" value={fd.lowStockThreshold} onChange={e => set('lowStockThreshold', parseInt(e.target.value) || 0)}
              placeholder="20" className={iCls} style={iSt} />
            <p className="text-xs mt-1" style={{ color: colors.text.muted }}>Notify when below this</p>
          </div>
        </div>

        {/* Stock badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold" style={{
          backgroundColor: fd.stock === 0 ? 'rgba(239,68,68,0.1)' : fd.stock < fd.lowStockThreshold ? 'rgba(234,179,8,0.1)' : 'rgba(34,197,94,0.1)',
          color: fd.stock === 0 ? '#ef4444' : fd.stock < fd.lowStockThreshold ? '#ca8a04' : '#16a34a',
        }}>
          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: fd.stock === 0 ? '#ef4444' : fd.stock < fd.lowStockThreshold ? '#eab308' : '#22c55e' }} />
          {fd.stock === 0 ? 'Out of Stock' : fd.stock < fd.lowStockThreshold ? `Low Stock — ${fd.stock} left` : `In Stock — ${fd.stock} units`}
        </div>

        {divider('Variants')}

        {/* Variants toggle */}
        <button onClick={() => set('hasVariants', !fd.hasVariants)}
          className="flex items-center gap-3 w-full px-4 py-3 rounded-xl border transition-all text-left"
          style={{ backgroundColor: fd.hasVariants ? 'rgba(59,130,246,0.06)' : colors.bg.card, borderColor: fd.hasVariants ? '#3b82f6' : colors.border.faint }}>
          <div className="relative w-10 h-5 rounded-full transition-colors flex-shrink-0" style={{ backgroundColor: fd.hasVariants ? '#3b82f6' : colors.bg.elevated }}>
            <motion.div className="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow"
              animate={{ left: fd.hasVariants ? '22px' : '2px' }} transition={{ type: 'spring', stiffness: 400, damping: 25 }} />
          </div>
          <div>
            <p className="text-sm font-semibold" style={{ color: colors.text.primary }}>Has variants</p>
            <p className="text-xs" style={{ color: colors.text.muted }}>Sizes, colors, materials, etc.</p>
          </div>
        </button>

        <AnimatePresence>
          {fd.hasVariants && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden space-y-3">
              <div className="text-xs p-3 rounded-xl" style={{ backgroundColor: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.15)', color: colors.text.secondary }}>
                💡 <strong>± Mod</strong> adjusts from base price. <strong>$ Fix</strong> sets an absolute price per option.
              </div>

              {fd.variants.length === 0 && (
                <div className="text-center py-5 rounded-xl border-2 border-dashed text-sm" style={{ borderColor: colors.border.faint, color: colors.text.muted }}>No variant groups yet</div>
              )}

              {fd.variants.map(v => {
                const isMod = v.pricingMode === 'modifier';
                return (
                  <div key={v.id} className="rounded-xl border overflow-hidden" style={{ borderColor: colors.border.faint }}>
                    <div className="flex items-center gap-2 px-3 py-2.5" style={{ backgroundColor: colors.bg.elevated }}>
                      <input type="text" value={v.name} onChange={e => updVariant(v.id, 'name', e.target.value)}
                        placeholder="e.g. Size, Color" className="flex-1 px-3 py-1.5 rounded-lg border text-sm focus:outline-none"
                        style={{ backgroundColor: colors.bg.card, borderColor: colors.border.faint, color: colors.text.primary }} />
                      <div className="flex rounded-lg overflow-hidden border text-xs font-semibold" style={{ borderColor: colors.border.faint }}>
                        <button onClick={() => updVariant(v.id, 'pricingMode', 'modifier')} className="px-3 py-1.5 transition-colors"
                          style={{ backgroundColor: isMod ? '#3b82f6' : colors.bg.card, color: isMod ? '#fff' : colors.text.muted }}>± Mod</button>
                        <button onClick={() => updVariant(v.id, 'pricingMode', 'override')} className="px-3 py-1.5 transition-colors"
                          style={{ backgroundColor: !isMod ? '#8b5cf6' : colors.bg.card, color: !isMod ? '#fff' : colors.text.muted }}>$ Fix</button>
                      </div>
                      <button onClick={() => remVariant(v.id)} className="p-1.5 text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
                      </button>
                    </div>
                    <div className="px-3 py-2.5 space-y-2" style={{ backgroundColor: colors.bg.card }}>
                      {v.options.length === 0 && <p className="text-xs text-center py-1" style={{ color: colors.text.muted }}>No options yet.</p>}
                      {v.options.map((opt, idx) => {
                        const prev = isMod ? Math.max(0, discBase + opt.priceAdjustment) : opt.priceAdjustment > 0 ? opt.priceAdjustment : discBase;
                        return (
                          <div key={opt.id} className="flex items-center gap-2">
                            <span className="w-4 text-xs text-center" style={{ color: colors.text.muted }}>{idx + 1}</span>
                            <input type="text" value={opt.name} onChange={e => updOpt(v.id, opt.id, 'name', e.target.value)}
                              placeholder="Option name" className="flex-1 px-3 py-1.5 rounded-lg border text-sm focus:outline-none"
                              style={{ backgroundColor: colors.bg.elevated, borderColor: colors.border.faint, color: colors.text.primary }} />
                            <div className="relative w-24">
                              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold pointer-events-none" style={{ color: isMod ? '#f59e0b' : '#8b5cf6' }}>
                                {isMod ? '±' : '$'}
                              </span>
                              <input type="number" value={opt.priceAdjustment === 0 && isMod ? '' : opt.priceAdjustment}
                                onChange={e => updOpt(v.id, opt.id, 'priceAdjustment', parseFloat(e.target.value) || 0)}
                                placeholder="0" step="0.01" className="w-full pl-7 pr-2 py-1.5 rounded-lg border text-sm focus:outline-none"
                                style={{ backgroundColor: colors.bg.elevated, borderColor: colors.border.faint, color: colors.text.primary }} />
                            </div>
                            {fd.price > 0 && <span className="text-xs font-bold w-14 text-right" style={{ color: '#22c55e' }}>${prev.toFixed(2)}</span>}
                            <button onClick={() => remOpt(v.id, opt.id)} className="p-1 text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded">
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
                            </button>
                          </div>
                        );
                      })}
                      <button onClick={() => addOpt(v.id)} className="text-xs text-blue-500 hover:text-blue-600 font-medium flex items-center gap-1 mt-1">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/></svg>
                        Add option
                      </button>
                    </div>
                  </div>
                );
              })}

              <button onClick={addVariant} className="w-full py-2.5 rounded-xl border-2 border-dashed text-sm font-medium transition-all hover:border-blue-400 hover:text-blue-500"
                style={{ borderColor: colors.border.faint, color: colors.text.muted }}>
                + Add Variant Group
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Status */}
        <div>
          <label className={lCls} style={{ color: colors.text.muted }}>Status</label>
          <div className="flex gap-2">
            {(['active','inactive','draft'] as const).map(s => (
              <button key={s} onClick={() => set('status', s)}
                className="flex-1 py-2 rounded-xl text-sm font-semibold capitalize transition-all border"
                style={{
                  backgroundColor: fd.status === s ? s === 'active' ? 'rgba(34,197,94,0.12)' : s === 'inactive' ? 'rgba(239,68,68,0.1)' : 'rgba(234,179,8,0.1)' : colors.bg.card,
                  borderColor: fd.status === s ? s === 'active' ? '#22c55e' : s === 'inactive' ? '#ef4444' : '#eab308' : colors.border.faint,
                  color: fd.status === s ? s === 'active' ? '#16a34a' : s === 'inactive' ? '#dc2626' : '#ca8a04' : colors.text.muted,
                }}>
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between px-8 py-5 border-t flex-shrink-0" style={{ borderColor: colors.border.faint }}>
        <button onClick={onBack} className="flex items-center gap-2 text-sm font-medium" style={{ color: colors.text.muted }}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7"/></svg>
          Back
        </button>
        <div className="flex gap-1.5">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: colors.bg.elevated }} />
          <div className="w-5 h-2 rounded-full" style={{ backgroundColor: '#3b82f6' }} />
        </div>
        <button onClick={onSave} className="flex items-center gap-2 px-7 py-2.5 rounded-xl font-semibold text-sm text-white hover:opacity-90 active:scale-95 transition-all" style={{ backgroundColor: '#3b82f6' }}>
          {isEditing ? 'Update' : 'Add Product'}
        </button>
      </div>
    </motion.div>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────
export default function ProductAddModal({ isOpen, onClose, onSave, editingProduct }: {
  isOpen: boolean; onClose: () => void;
  onSave: (p: Partial<Product> & Partial<FormData>) => void;
  editingProduct?: Product;
}) {
  const { colors } = useTheme();
  const { showAlert } = useAlert();
  const [step, setStep] = useState<1 | 2>(1);
  const [images, setImages] = useState<string[]>([]);
  const [fd, setFd] = useState<FormData>({
    name: '', sku: '', category: '', description: '',
    status: 'active', price: 0, costPrice: 0, discount: 0, discountType: 'percentage',
    images: [], stock: 100, lowStockThreshold: 20, hasVariants: false, variants: [],
  });

  useEffect(() => {
    if (isOpen) {
      setStep(1); setImages([]);
      setFd({
        name: editingProduct?.name || '', sku: editingProduct?.sku || '',
        category: editingProduct?.category || '', description: editingProduct?.description || '',
        status: editingProduct?.status || 'active', price: editingProduct?.price || 0,
        costPrice: 0, discount: 0, discountType: 'percentage', images: [],
        stock: editingProduct?.stock || 100, lowStockThreshold: 20, hasVariants: false, variants: [],
      });
    }
  }, [isOpen]);

  const save = () => {
    if (!fd.name.trim()) { showAlert('Please enter a product name', 'error'); return; }
    if (!fd.sku.trim()) { showAlert('Please enter a SKU', 'error'); return; }
    if (fd.price <= 0) { showAlert('Please enter a valid price', 'error'); return; }
    onSave({ ...fd, images, image: images[0] || '📦', id: editingProduct?.id || uid(), createdAt: editingProduct?.createdAt || new Date().toISOString() });
    showAlert(`Product ${editingProduct ? 'updated' : 'added'} successfully!`, 'success');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-40 flex items-center justify-center p-4"
        style={{ backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
        onClick={onClose}>
        <motion.div onClick={e => e.stopPropagation()}
          initial={{ opacity: 0, scale: 0.94, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.94, y: 16 }}
          transition={{ type: 'spring', damping: 30, stiffness: 320 }}
          className="relative w-full overflow-hidden"
          style={{ maxWidth: 520, maxHeight: '90vh', borderRadius: 24, backgroundColor: colors.bg.primary, boxShadow: '0 32px 64px rgba(0,0,0,0.25)', display: 'flex', flexDirection: 'column' }}>
          {/* Progress bar */}
          <div className="absolute top-0 left-0 right-0 h-0.5 z-10" style={{ backgroundColor: colors.bg.elevated }}>
            <motion.div className="h-full" style={{ backgroundColor: '#3b82f6' }}
              animate={{ width: step === 1 ? '50%' : '100%' }} transition={{ duration: 0.4, ease: 'easeInOut' }} />
          </div>

          <AnimatePresence mode="wait">
            {step === 1
              ? <ImageStep key="s1" images={images} setImages={setImages} onNext={() => setStep(2)} onClose={onClose} colors={colors} />
              : <DetailsStep key="s2" fd={fd} patch={p => setFd(prev => ({ ...prev, ...p }))} onBack={() => setStep(1)} onSave={save} onClose={onClose} isEditing={!!editingProduct} colors={colors} />
            }
          </AnimatePresence>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}