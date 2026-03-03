'use client';
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../../components/context/theme-context';
import { useAlert } from '../../components/context/alert-context';
import { type Product } from '../../lib/productsData';
import { uploadProductImageApi } from '@/lib/api';

const uid = () => Math.random().toString(36).substr(2, 9);

function isImageSource(value: string): boolean {
  const v = (value || '').trim();
  if (!v) return false;
  if (/^data:image\/[a-zA-Z0-9.+-]+;base64,/i.test(v)) return true;
  if (/^https?:\/\//i.test(v)) return true;
  if (v.startsWith('blob:')) return true;
  if (v.startsWith('/')) return true;
  return false;
}

function cartesian<T>(arrays: T[][]): T[][] {
  return arrays.reduce<T[][]>(
    (acc, curr) => acc.flatMap(a => curr.map(b => [...a, b])),
    [[]]
  );
}

interface VariantOption { id: string; name: string; priceAdjustment: number; }
interface Variant { id: string; name: string; pricingMode: 'modifier' | 'override'; options: VariantOption[]; }
interface ProductImage { id: string; src: string; file?: File; }
interface FormData {
  name: string; sku: string; category: string; description: string;
  status: 'active' | 'inactive' | 'draft';
  price: number; costPrice: number; discount: number; discountType: 'percentage' | 'fixed';
  images: string[]; stock: number; lowStockThreshold: number;
  hasVariants: boolean; variants: Variant[];
}

export default function ProductAddModal({ isOpen, onClose, onSave, editingProduct, uploadSubdomain }: {
  isOpen: boolean; onClose: () => void;
  onSave: (p: Partial<Product> & Partial<FormData>) => Promise<boolean> | boolean;
  editingProduct?: Product;
  uploadSubdomain?: string | null;
}) {
  const { colors } = useTheme();
  const { showAlert, showConfirm } = useAlert();

  const [images, setImages] = useState<ProductImage[]>([]);
  const [saving, setSaving] = useState(false);
  const [slide, setSlide] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [thumbDrag, setThumbDrag] = useState<number | null>(null);
  const [thumbOver, setThumbOver] = useState<number | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const [fd, setFd] = useState<FormData>({
    name: '', sku: '', category: '', description: '',
    status: 'active', price: 0, costPrice: 0, discount: 0, discountType: 'percentage',
    images: [], stock: 100, lowStockThreshold: 20, hasVariants: false, variants: [],
  });

  // Reset on open
  useEffect(() => {
    if (isOpen) {
      const existingVariants: Variant[] = Array.isArray(editingProduct?.variants)
        ? editingProduct.variants.map((variant, variantIndex): Variant => ({
          id: String(variant?.id || uid() || `var-${variantIndex + 1}`),
          name: String(variant?.name || ''),
          pricingMode: variant?.pricingMode === 'override' ? 'override' : 'modifier',
          options: Array.isArray(variant?.options)
            ? variant.options.map((option, optionIndex) => ({
              id: String(option?.id || `opt-${variantIndex + 1}-${optionIndex + 1}`),
              name: String(option?.name || ''),
              priceAdjustment: Number(option?.priceAdjustment || 0),
            }))
            : [],
        }))
        : [];
      const existingImages = Array.isArray(editingProduct?.images)
        ? editingProduct.images.filter((img): img is string => typeof img === 'string' && img.trim().length > 0)
        : [];
      const imageList = existingImages.length > 0
        ? existingImages
        : (editingProduct?.image && isImageSource(editingProduct.image) ? [editingProduct.image] : []);
      const basePrice = typeof editingProduct?.basePrice === 'number'
        ? editingProduct.basePrice
        : (typeof editingProduct?.compareAtPrice === 'number' && editingProduct.compareAtPrice > 0
          ? editingProduct.compareAtPrice
          : (editingProduct?.price ?? 0));
      const discount = typeof editingProduct?.discount === 'number' ? editingProduct.discount : 0;
      const discountType = editingProduct?.discountType === 'fixed' ? 'fixed' : 'percentage';
      const hasVariants = typeof editingProduct?.hasVariants === 'boolean'
        ? editingProduct.hasVariants
        : existingVariants.length > 0;

      setImages(imageList.map((src) => ({ id: uid(), src })));
      setSlide(0);
      setFd({
        name: editingProduct?.name || '', sku: editingProduct?.sku || '',
        category: editingProduct?.category || '', description: editingProduct?.description || '',
        status: editingProduct?.status || 'active', price: basePrice,
        costPrice: typeof editingProduct?.costPrice === 'number' ? editingProduct.costPrice : 0,
        discount, discountType, images: imageList,
        stock: editingProduct?.stock ?? 100,
        lowStockThreshold: typeof editingProduct?.lowStockThreshold === 'number' ? editingProduct.lowStockThreshold : 20,
        hasVariants,
        variants: existingVariants,
      });
    }
  }, [isOpen, editingProduct]);

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  // Auto-advance slider
  useEffect(() => {
    if (images.length <= 1) return;
    const t = setInterval(() => setSlide(i => (i + 1) % images.length), 3500);
    return () => clearInterval(t);
  }, [images.length]);

  useEffect(() => {
    if (slide >= images.length && images.length > 0) setSlide(images.length - 1);
  }, [images.length, slide]);

  // Image helpers
  const addFiles = (files: FileList | null) => {
    if (!files) return;
    const room = 5 - images.length;
    if (room <= 0) { showAlert('Maximum 5 images', 'error'); return; }
    Array.from(files).slice(0, room).forEach(f => {
      if (!f.type.startsWith('image/')) { showAlert('Invalid file type', 'error'); return; }
      if (f.size > 8 * 1024 * 1024) { showAlert('Max 8MB per image', 'error'); return; }
      const r = new FileReader();
      r.onload = e => {
        const result = e.target?.result as string;
        if (!result) return;
        setImages(prev => [...prev, { id: uid(), src: result, file: f }]);
      };
      r.readAsDataURL(f);
    });
  };

  const removeImage = (idx: number) => setImages(prev => prev.filter((_, i) => i !== idx));

  const dropThumb = (to: number) => {
    if (thumbDrag === null || thumbDrag === to) { setThumbDrag(null); setThumbOver(null); return; }
    const next = [...images];
    const [m] = next.splice(thumbDrag, 1);
    if (!m) { setThumbDrag(null); setThumbOver(null); return; }
    next.splice(to, 0, m);
    setImages(next); setSlide(to); setThumbDrag(null); setThumbOver(null);
  };

  // Form helpers
  const set = (k: keyof FormData, v: any) => setFd(prev => ({ ...prev, [k]: v }));
  const patch = (p: Partial<FormData>) => setFd(prev => ({ ...prev, ...p }));

  // Pricing
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

  // Variant helpers
  const addVariant = () => patch({ variants: [...fd.variants, { id: uid(), name: '', pricingMode: 'modifier', options: [] }] });
  const remVariant = (id: string) => patch({ variants: fd.variants.filter(v => v.id !== id) });
  const updVariant = (id: string, f: keyof Variant, v: any) => patch({ variants: fd.variants.map(x => x.id === id ? { ...x, [f]: v } : x) });
  const addOpt = (vid: string) => patch({ variants: fd.variants.map(v => v.id === vid ? { ...v, options: [...v.options, { id: uid(), name: '', priceAdjustment: 0 }] } : v) });
  const remOpt = (vid: string, oid: string) => patch({ variants: fd.variants.map(v => v.id === vid ? { ...v, options: v.options.filter(o => o.id !== oid) } : v) });
  const updOpt = (vid: string, oid: string, f: keyof VariantOption, v: any) => patch({ variants: fd.variants.map(x => x.id === vid ? { ...x, options: x.options.map(o => o.id === oid ? { ...o, [f]: v } : o) } : x) });

  const save = async () => {
    if (saving) return;
    if (!fd.name.trim()) { showAlert('Please enter a product name', 'error'); return; }
    if (!fd.sku.trim()) { showAlert('Please enter a SKU', 'error'); return; }
    if (fd.price <= 0) { showAlert('Please enter a valid price', 'error'); return; }
    setSaving(true);
    try {
      const variants: Variant[] = fd.variants
        .map((variant): Variant => ({
          id: String(variant.id || uid()),
          name: String(variant.name || '').trim(),
          pricingMode: variant.pricingMode === 'override' ? 'override' : 'modifier',
          options: (Array.isArray(variant.options) ? variant.options : [])
            .map((option) => ({
              id: String(option.id || uid()),
              name: String(option.name || '').trim(),
              priceAdjustment: Number(option.priceAdjustment || 0),
            }))
            .filter((option) => option.name || option.priceAdjustment !== 0),
        }))
        .filter((variant) => variant.name || variant.options.length > 0);

      const hasVariants = fd.hasVariants && variants.length > 0;
      const basePrice = Number(fd.price || 0);
      const finalPrice = hasVariants
        ? Number(range?.min ?? Math.max(0, discBase))
        : Math.max(0, discBase);
      const priceRangeMin = hasVariants ? Number(range?.min ?? finalPrice) : finalPrice;
      const priceRangeMax = hasVariants ? Number(range?.max ?? finalPrice) : finalPrice;

      const uploadedImages: string[] = [];
      for (const image of images) {
        if (image.file) {
          const response = await uploadProductImageApi(image.file, uploadSubdomain || undefined);
          if (!response?.url) {
            throw new Error(response?.message || 'Failed to upload product image');
          }
          uploadedImages.push(response.url);
        } else if (isImageSource(image.src)) {
          uploadedImages.push(image.src);
        }
      }

      const saved = await Promise.resolve(onSave({
        ...fd,
        price: finalPrice,
        basePrice,
        finalPrice,
        compareAtPrice: fd.discount > 0 ? basePrice : null,
        discount: Number(fd.discount || 0),
        discountType: fd.discountType,
        hasVariants,
        variants: hasVariants ? variants : [],
        priceRangeMin,
        priceRangeMax,
        images: uploadedImages,
        image: uploadedImages[0] || '[product]',
        id: editingProduct?.id || uid(),
        createdAt: editingProduct?.createdAt || new Date().toISOString(),
      }));
      if (saved === false) return;
      showAlert(`Product ${editingProduct ? 'updated' : 'added'} successfully!`, 'success');
      onClose();
    } catch (error) {
      showAlert(error instanceof Error ? error.message : 'Failed to save product', 'error');
    } finally {
      setSaving(false);
    }
  };

  const hasDraft = () => {
    return (
      fd.name.trim() !== '' ||
      fd.sku.trim() !== '' ||
      fd.category !== '' ||
      fd.description !== '' ||
      fd.price > 0 ||
      fd.costPrice > 0 ||
      fd.discount > 0 ||
      fd.stock !== 100 ||
      images.length > 0 ||
      fd.variants.length > 0
    );
  };

  const handleClose = async () => {
    if (hasDraft()) {
      const confirmed = await showConfirm('Are you sure you want to close? Any unsaved changes will be lost.');
      if (confirmed) {
        onClose();
      }
    } else {
      onClose();
    }
  };

  if (!isOpen) return null;

  const iCls = 'w-full px-4 py-3 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/40 transition-all';
  const iSt = { backgroundColor: colors.bg.elevated, borderColor: colors.border.faint, color: colors.text.primary };
  const lCls = 'block text-xs font-bold uppercase tracking-widest mb-2';

  const Divider = ({ label }: { label: string }) => (
    <div className="flex items-center gap-3 py-1">
      <div className="flex-1 h-px" style={{ backgroundColor: colors.border.faint }} />
      <span className="text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: colors.text.muted }}>{label}</span>
      <div className="flex-1 h-px" style={{ backgroundColor: colors.border.faint }} />
    </div>
  );

  return (
    <AnimatePresence>
      {/* Full-screen overlay — covers everything including top nav */}
      <motion.div
        key="modal-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.25 }}
        className="fixed inset-0 z-[999]"
        style={{
          backgroundColor: 'rgba(0,0,0,0.55)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
        }}
        onClick={handleClose}
      >
        {/* Modal container */}
        <div className="absolute inset-0 flex items-center justify-center p-6">
          <motion.div
            onClick={e => e.stopPropagation()}
            initial={{ opacity: 0, scale: 0.93, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.93, y: 24 }}
            transition={{ type: 'spring', damping: 26, stiffness: 280 }}
            className="relative flex overflow-hidden w-full"
            style={{
              maxWidth: 1100,
              height: 'min(820px, calc(100vh - 48px))',
              borderRadius: 28,
              backgroundColor: colors.bg.primary,
              boxShadow: '0 50px 100px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.07)',
            }}
          >

            {/* ══ LEFT: Image Panel ════════════════════════════════════════ */}
            <div
              className="flex flex-col relative"
              style={{
                width: 460,
                minWidth: 460,
                backgroundColor: colors.bg.card,
                borderRight: `1px solid ${colors.border.faint}`,
              }}
            >
              {/* Panel label */}
              <div className="px-8 pt-8 pb-5 flex-shrink-0 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest" style={{ color: colors.text.muted }}>Product Images</p>
                  <p className="text-sm mt-0.5" style={{ color: colors.text.primary }}>
                    {images.length === 0 ? 'Upload photos to showcase your product' : `${images.length} of 5 images added`}
                  </p>
                </div>
                {images.length > 0 && (
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{ backgroundColor: 'rgba(59,130,246,0.12)', color: '#3b82f6' }}>
                    {images.length}/5
                  </span>
                )}
              </div>

              {/* Image zone */}
              <div className="flex-1 px-8 flex flex-col mb-10 gap-4 overflow-hidden min-h-0">
                {images.length === 0 ? (
                  /* Drop zone */
                  <div
                    onDragEnter={() => setDragging(true)}
                    onDragLeave={() => setDragging(false)}
                    onDragOver={e => e.preventDefault()}
                    onDrop={e => { e.preventDefault(); setDragging(false); addFiles(e.dataTransfer.files); }}
                    onClick={() => fileRef.current?.click()}
                    className="flex-1 flex flex-col items-center justify-center rounded-3xl cursor-pointer transition-all select-none"
                    style={{
                      border: `2px dashed ${dragging ? '#3b82f6' : colors.border.faint}`,
                      backgroundColor: dragging ? 'rgba(59,130,246,0.06)' : colors.bg.elevated,
                    }}
                  >
                    <motion.div animate={{ y: dragging ? -10 : 0 }} transition={{ type: 'spring', stiffness: 300 }}
                      className="flex flex-col items-center gap-5 px-8 text-center">
                      <div className="w-20 h-20 rounded-3xl flex items-center justify-center" style={{ backgroundColor: 'rgba(59,130,246,0.1)' }}>
                        <svg className="w-10 h-10" fill="none" stroke="#3b82f6" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.4}
                            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div>
                        <p className="font-semibold text-base" style={{ color: colors.text.primary }}>Drop images here</p>
                        <p className="text-sm mt-1" style={{ color: colors.text.muted }}>or click to browse files</p>
                        <p className="text-xs mt-3 px-4 py-2 rounded-xl" style={{ backgroundColor: colors.bg.card, color: colors.text.muted }}>
                          PNG, JPG, WEBP · Up to 5 images · Max 8MB each
                        </p>
                      </div>
                    </motion.div>
                  </div>
                ) : (
                  <>
                    {/* Main slider — tall and clear */}
                    <div
                      className="relative rounded-3xl overflow-hidden flex-shrink-0"
                      style={{ height: 360, backgroundColor: colors.bg.elevated }}
                    >
                      <AnimatePresence mode="wait">
                        <motion.img
                          key={slide}
                          src={images[slide]?.src}
                          alt=""
                          className="absolute inset-0 w-full h-full object-contain"
                          initial={{ opacity: 0, scale: 1.04 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.96 }}
                          transition={{ duration: 0.3 }}
                        />
                      </AnimatePresence>

                      {/* Gradient overlays for controls */}
                      <div className="absolute inset-x-0 top-0 h-20 pointer-events-none"
                        style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.3), transparent)' }} />
                      <div className="absolute inset-x-0 bottom-0 h-20 pointer-events-none"
                        style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.35), transparent)' }} />

                      {/* Counter */}
                      <div className="absolute top-4 left-4 px-3 py-1 rounded-full text-xs font-bold"
                        style={{ backgroundColor: 'rgba(0,0,0,0.5)', color: '#fff', backdropFilter: 'blur(6px)' }}>
                        {slide + 1} / {images.length}
                      </div>

                      {/* Remove */}
                      <button
                        onClick={() => removeImage(slide)}
                        className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center transition-colors hover:bg-red-500"
                        style={{ backgroundColor: 'rgba(0,0,0,0.5)', color: '#fff', backdropFilter: 'blur(6px)' }}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>

                      {/* Arrows */}
                      {images.length > 1 && (
                        <>
                          <button
                            onClick={() => setSlide(i => (i - 1 + images.length) % images.length)}
                            className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full flex items-center justify-center transition-colors hover:bg-white/25"
                            style={{ backgroundColor: 'rgba(0,0,0,0.4)', color: '#fff', backdropFilter: 'blur(6px)' }}
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                            </svg>
                          </button>
                          <button
                            onClick={() => setSlide(i => (i + 1) % images.length)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full flex items-center justify-center transition-colors hover:bg-white/25"
                            style={{ backgroundColor: 'rgba(0,0,0,0.4)', color: '#fff', backdropFilter: 'blur(6px)' }}
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                            </svg>
                          </button>
                        </>
                      )}

                      {/* Dot indicators */}
                      {images.length > 1 && (
                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                          {images.map((_, i) => (
                            <button
                              key={i}
                              onClick={() => setSlide(i)}
                              className="rounded-full transition-all"
                              style={{
                                width: i === slide ? 22 : 6,
                                height: 6,
                                backgroundColor: i === slide ? '#3b82f6' : 'rgba(255,255,255,0.5)',
                              }}
                            />
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Thumbnail strip */}
                    <div className="flex gap-3 overflow-x-auto pb-1 flex-shrink-0" style={{ scrollbarWidth: 'none' }}>
                      {images.map((img, idx) => (
                        <div
                          key={img.id}
                          draggable
                          onDragStart={() => setThumbDrag(idx)}
                          onDragOver={e => { e.preventDefault(); setThumbOver(idx); }}
                          onDragLeave={() => setThumbOver(null)}
                          onDrop={() => dropThumb(idx)}
                          onClick={() => setSlide(idx)}
                          className="relative flex-shrink-0 rounded-2xl overflow-hidden cursor-pointer transition-all"
                          style={{
                            width: 72, height: 72,
                            border: `2.5px solid ${idx === slide ? '#3b82f6' : thumbOver === idx ? '#10b981' : colors.border.faint}`,
                            opacity: thumbDrag === idx ? 0.3 : 1,
                            transform: idx === slide ? 'scale(1.05)' : 'scale(1)',
                            transition: 'all 0.2s ease',
                          }}
                        >
                          <img src={img.src} alt="" className="w-full h-full object-cover" />
                          {idx === slide && <div className="absolute inset-0" style={{ backgroundColor: 'rgba(59,130,246,0.18)' }} />}
                          <div className="absolute bottom-1 right-1 w-4 h-4 rounded-full bg-blue-500 text-white flex items-center justify-center"
                            style={{ fontSize: 9, fontWeight: 700 }}>{idx + 1}</div>
                        </div>
                      ))}
                      {images.length < 5 && (
                        <button
                          onClick={() => fileRef.current?.click()}
                          className="flex-shrink-0 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center transition-all hover:border-blue-400 hover:text-blue-500"
                          style={{ width: 72, height: 72, borderColor: colors.border.faint, color: colors.text.muted }}
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                          <span style={{ fontSize: 10, marginTop: 2 }}>Add</span>
                        </button>
                      )}
                    </div>

                    <p className="text-xs flex-shrink-0 pb-2" style={{ color: colors.text.muted }}>
                      Drag to reorder · First image is the cover photo
                    </p>
                  </>
                )}
              </div>

              <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={e => addFiles(e.target.files)} />
            </div>

            {/* ══ RIGHT: Details Panel ═════════════════════════════════════ */}
            <div className="flex flex-col flex-1 overflow-hidden">

              {/* Header */}
              <div className="flex items-center justify-between px-8 pt-8 pb-5 flex-shrink-0">
                <div>
                  <h2 className="text-2xl font-bold" style={{ color: colors.text.primary }}>
                    {editingProduct ? 'Edit Product' : 'New Product'}
                  </h2>
                  <p className="text-sm mt-0.5" style={{ color: colors.text.muted }}>
                    Fill in the details to {editingProduct ? 'update your' : 'add a new'} product
                  </p>
                </div>
                <button
                  onClick={handleClose}
                  className="w-10 h-10 rounded-full flex items-center justify-center transition-colors hover:bg-black/10 dark:hover:bg-white/10"
                  style={{ color: colors.text.muted }}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Scrollable form */}
              <div className="flex-1 overflow-y-auto px-8 pb-4 space-y-5" style={{ scrollbarWidth: 'thin' }}>

                {/* Name */}
                <div>
                  <label className={lCls} style={{ color: colors.text.muted }}>Product Name *</label>
                  <input type="text" value={fd.name} onChange={e => set('name', e.target.value)}
                    placeholder="e.g. Classic White Tee" className={iCls} style={iSt} />
                </div>

                {/* SKU + Category */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={lCls} style={{ color: colors.text.muted }}>SKU *</label>
                    <input type="text" value={fd.sku} onChange={e => set('sku', e.target.value)}
                      placeholder="WHT-TEE-001" className={iCls} style={iSt} />
                  </div>
                  <div>
                    <label className={lCls} style={{ color: colors.text.muted }}>Category</label>
                    <select value={fd.category} onChange={e => set('category', e.target.value)} className={iCls} style={iSt}>
                      <option value="" disabled hidden>Select Category</option>
                      {[
                        'Electronics',
                        'Clothing',
                        'Shoes & Footwear',
                        'Bags & Luggage',
                        'Jewelry & Watches',
                        'Beauty & Personal Care',
                        'Health & Wellness',
                        'Home & Living',
                        'Furniture',
                        'Home Improvement & Tools',
                        'Appliances',
                        'Sports & Outdoor',
                        'Toys & Games',
                        'Baby & Kids',
                        'Books',
                        'Office & School Supplies',
                        'Automotive',
                        'Pet Supplies',
                        'Gaming',
                        'Hobbies & Crafts',
                        'Musical Instruments',
                        'Photography & Cameras',
                        'Travel & Luggage',
                        'Accessories',
                        'Industrial & Business Supplies',
                        'Garden & Outdoor',
                        'Smart Home',
                        'Security & Surveillance',
                        'Digital Products',
                      ].map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className={lCls} style={{ color: colors.text.muted }}>Description</label>
                  <textarea value={fd.description} onChange={e => set('description', e.target.value)}
                    placeholder="e.g. High quality white cotton t-shirt, comfortable and durable..."
                    rows={3}
                    className={iCls} style={iSt} />
                </div>

                <Divider label="Pricing" />

                {/* Prices */}
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className={lCls} style={{ color: colors.text.muted }}>Price *</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold" style={{ color: colors.text.muted }}>$</span>
                      <input type="number" value={fd.price || ''} onChange={e => set('price', parseFloat(e.target.value) || 0)}
                        placeholder="0.00" step="0.01" className={iCls} style={{ ...iSt, paddingLeft: '1.8rem' }} />
                    </div>
                  </div>
                  <div>
                    <label className={lCls} style={{ color: colors.text.muted }}>Cost Price</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold" style={{ color: colors.text.muted }}>$</span>
                      <input type="number" value={fd.costPrice || ''} onChange={e => set('costPrice', parseFloat(e.target.value) || 0)}
                        placeholder="0.00" step="0.01" className={iCls} style={{ ...iSt, paddingLeft: '1.8rem' }} />
                    </div>
                  </div>
                  <div>
                    <label className={lCls} style={{ color: colors.text.muted }}>Discount</label>
                    <div className="flex gap-2">
                      <select value={fd.discountType} onChange={e => set('discountType', e.target.value)}
                        className="px-3 py-3 rounded-xl border text-sm focus:outline-none flex-shrink-0"
                        style={{ ...iSt, width: 56 }}>
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
                  <div
                    className="flex items-center justify-between px-5 py-4 rounded-2xl"
                    style={{ backgroundColor: 'rgba(59,130,246,0.07)', border: '1px solid rgba(59,130,246,0.2)' }}
                  >
                    <div>
                      <p className="text-xs font-bold uppercase tracking-widest" style={{ color: '#3b82f6' }}>
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
                        <p className="text-xl font-bold" style={{ color: discBase > fd.costPrice ? '#22c55e' : '#ef4444' }}>
                          ${(discBase - fd.costPrice).toFixed(2)}
                        </p>
                        <p className="text-xs mt-0.5" style={{ color: colors.text.muted }}>
                          {(((discBase - fd.costPrice) / fd.costPrice) * 100).toFixed(1)}% margin
                        </p>
                      </div>
                    )}
                  </div>
                )}

                <Divider label="Stock" />

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={lCls} style={{ color: colors.text.muted }}>Initial Stock</label>
                    <input type="number" value={fd.stock} onChange={e => set('stock', parseInt(e.target.value) || 0)}
                      placeholder="100" className={iCls} style={iSt} />
                    <p className="text-xs mt-1.5" style={{ color: colors.text.muted }}>Auto-deducts on each sale</p>
                  </div>
                  <div>
                    <label className={lCls} style={{ color: colors.text.muted }}>Low Stock Alert</label>
                    <input type="number" value={fd.lowStockThreshold} onChange={e => set('lowStockThreshold', parseInt(e.target.value) || 0)}
                      placeholder="20" className={iCls} style={iSt} />
                    <p className="text-xs mt-1.5" style={{ color: colors.text.muted }}>Notify when below this</p>
                  </div>
                </div>

                {/* Stock badge */}
                <div
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold"
                  style={{
                    backgroundColor: fd.stock === 0 ? 'rgba(239,68,68,0.1)' : fd.stock < fd.lowStockThreshold ? 'rgba(234,179,8,0.1)' : 'rgba(34,197,94,0.1)',
                    color: fd.stock === 0 ? '#ef4444' : fd.stock < fd.lowStockThreshold ? '#ca8a04' : '#16a34a',
                  }}
                >
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: fd.stock === 0 ? '#ef4444' : fd.stock < fd.lowStockThreshold ? '#eab308' : '#22c55e' }} />
                  {fd.stock === 0 ? 'Out of Stock' : fd.stock < fd.lowStockThreshold ? `Low Stock — ${fd.stock} left` : `In Stock — ${fd.stock} units`}
                </div>

                <Divider label="Variants" />

                {/* Variants toggle */}
                <button
                  onClick={() => set('hasVariants', !fd.hasVariants)}
                  className="flex items-center gap-4 w-full px-5 py-3.5 rounded-2xl border transition-all text-left"
                  style={{
                    backgroundColor: fd.hasVariants ? 'rgba(59,130,246,0.06)' : colors.bg.elevated,
                    borderColor: fd.hasVariants ? '#3b82f6' : colors.border.faint,
                  }}
                >
                  <div className="relative w-11 h-6 rounded-full flex-shrink-0 transition-colors"
                    style={{ backgroundColor: fd.hasVariants ? '#3b82f6' : colors.bg.card }}>
                    <motion.div className="absolute top-1 w-4 h-4 rounded-full bg-white shadow-md"
                      animate={{ left: fd.hasVariants ? '23px' : '4px' }}
                      transition={{ type: 'spring', stiffness: 400, damping: 25 }} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold" style={{ color: colors.text.primary }}>This product has variants</p>
                    <p className="text-xs mt-0.5" style={{ color: colors.text.muted }}>Sizes, colors, materials, etc.</p>
                  </div>
                </button>

                <AnimatePresence>
                  {fd.hasVariants && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden space-y-3"
                    >
                      <div className="text-xs p-3 rounded-xl" style={{ backgroundColor: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.15)', color: colors.text.secondary }}>
                        💡 <strong>± Mod</strong> adjusts from base price &nbsp;·&nbsp; <strong>$ Fix</strong> sets a fixed absolute price per option
                      </div>

                      {fd.variants.length === 0 && (
                        <div className="text-center py-5 rounded-2xl border-2 border-dashed text-sm"
                          style={{ borderColor: colors.border.faint, color: colors.text.muted }}>
                          No variant groups yet — click below to add one
                        </div>
                      )}

                      {fd.variants.map(v => {
                        const isMod = v.pricingMode === 'modifier';
                        return (
                          <div key={v.id} className="rounded-2xl border overflow-hidden" style={{ borderColor: colors.border.faint }}>
                            <div className="flex items-center gap-2 px-4 py-3" style={{ backgroundColor: colors.bg.elevated }}>
                              <input type="text" value={v.name} onChange={e => updVariant(v.id, 'name', e.target.value)}
                                placeholder="e.g. Size, Color"
                                className="flex-1 px-3 py-2 rounded-xl border text-sm focus:outline-none"
                                style={{ backgroundColor: colors.bg.card, borderColor: colors.border.faint, color: colors.text.primary }} />
                              <div className="flex rounded-xl overflow-hidden border text-xs font-bold" style={{ borderColor: colors.border.faint }}>
                                <button onClick={() => updVariant(v.id, 'pricingMode', 'modifier')} className="px-3 py-2 transition-colors"
                                  style={{ backgroundColor: isMod ? '#3b82f6' : colors.bg.card, color: isMod ? '#fff' : colors.text.muted }}>± Mod</button>
                                <button onClick={() => updVariant(v.id, 'pricingMode', 'override')} className="px-3 py-2 transition-colors"
                                  style={{ backgroundColor: !isMod ? '#8b5cf6' : colors.bg.card, color: !isMod ? '#fff' : colors.text.muted }}>$ Fix</button>
                              </div>
                              <button onClick={() => remVariant(v.id)} className="p-2 text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            </div>
                            <div className="px-4 py-3 space-y-2" style={{ backgroundColor: colors.bg.card }}>
                              {v.options.length === 0 && (
                                <p className="text-xs text-center py-1" style={{ color: colors.text.muted }}>No options yet</p>
                              )}
                              {v.options.map((opt, idx) => {
                                const prev = isMod ? Math.max(0, discBase + opt.priceAdjustment) : opt.priceAdjustment > 0 ? opt.priceAdjustment : discBase;
                                return (
                                  <div key={opt.id} className="flex items-center gap-2">
                                    <span className="w-5 text-xs text-center flex-shrink-0" style={{ color: colors.text.muted }}>{idx + 1}</span>
                                    <input type="text" value={opt.name} onChange={e => updOpt(v.id, opt.id, 'name', e.target.value)}
                                      placeholder="Option name"
                                      className="flex-1 px-3 py-2 rounded-xl border text-sm focus:outline-none"
                                      style={{ backgroundColor: colors.bg.elevated, borderColor: colors.border.faint, color: colors.text.primary }} />
                                    <div className="relative flex-shrink-0" style={{ width: 96 }}>
                                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold pointer-events-none"
                                        style={{ color: isMod ? '#f59e0b' : '#8b5cf6' }}>
                                        {isMod ? '±' : '$'}
                                      </span>
                                      <input type="number" value={opt.priceAdjustment === 0 && isMod ? '' : opt.priceAdjustment}
                                        onChange={e => updOpt(v.id, opt.id, 'priceAdjustment', parseFloat(e.target.value) || 0)}
                                        placeholder="0" step="0.01"
                                        className="w-full pl-7 pr-2 py-2 rounded-xl border text-sm focus:outline-none"
                                        style={{ backgroundColor: colors.bg.elevated, borderColor: colors.border.faint, color: colors.text.primary }} />
                                    </div>
                                    {fd.price > 0 && (
                                      <span className="text-xs font-bold flex-shrink-0" style={{ color: '#22c55e', minWidth: 52, textAlign: 'right' }}>
                                        ${prev.toFixed(2)}
                                      </span>
                                    )}
                                    <button onClick={() => remOpt(v.id, opt.id)} className="p-1.5 text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg flex-shrink-0">
                                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                      </svg>
                                    </button>
                                  </div>
                                );
                              })}
                              <button onClick={() => addOpt(v.id)} className="text-xs text-blue-500 hover:text-blue-600 font-semibold flex items-center gap-1 mt-1">
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                                Add option
                              </button>
                            </div>
                          </div>
                        );
                      })}

                      <button onClick={addVariant}
                        className="w-full py-3 rounded-2xl border-2 border-dashed text-sm font-semibold transition-all hover:border-blue-400 hover:text-blue-500"
                        style={{ borderColor: colors.border.faint, color: colors.text.muted }}>
                        + Add Variant Group
                      </button>

                      {combos.length > 0 && (
                        <div className="rounded-2xl border overflow-hidden" style={{ borderColor: colors.border.faint }}>
                          <div className="px-4 py-3 flex items-center justify-between" style={{ backgroundColor: colors.bg.elevated }}>
                            <p className="text-sm font-semibold" style={{ color: colors.text.primary }}>📊 All Combinations</p>
                            <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold"
                              style={{ backgroundColor: 'rgba(59,130,246,0.12)', color: '#3b82f6' }}>{combos.length}</span>
                          </div>
                          <table className="w-full text-sm">
                            <tbody>
                              {combos.map((c, i) => (
                                <tr key={i} className={i > 0 ? 'border-t' : ''} style={{ borderColor: colors.border.faint }}>
                                  <td className="px-4 py-2.5" style={{ color: colors.text.primary }}>{c.label}</td>
                                  <td className="px-4 py-2.5 text-right font-bold" style={{ color: '#3b82f6' }}>${c.price.toFixed(2)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Status */}
                <div>
                  <label className={lCls} style={{ color: colors.text.muted }}>Status</label>
                  <div className="flex gap-3">
                    {(['active', 'inactive', 'draft'] as const).map(s => (
                      <button key={s} onClick={() => set('status', s)}
                        className="flex-1 py-3 rounded-xl text-sm font-bold capitalize transition-all border"
                        style={{
                          backgroundColor: fd.status === s
                            ? s === 'active' ? 'rgba(34,197,94,0.12)' : s === 'inactive' ? 'rgba(239,68,68,0.1)' : 'rgba(234,179,8,0.1)'
                            : colors.bg.elevated,
                          borderColor: fd.status === s
                            ? s === 'active' ? '#22c55e' : s === 'inactive' ? '#ef4444' : '#eab308'
                            : colors.border.faint,
                          color: fd.status === s
                            ? s === 'active' ? '#16a34a' : s === 'inactive' ? '#dc2626' : '#ca8a04'
                            : colors.text.muted,
                        }}>
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div
                className="flex items-center justify-between px-8 py-5 border-t flex-shrink-0"
                style={{ borderColor: colors.border.faint }}
              >
                <button onClick={handleClose} className="text-sm font-medium transition-colors hover:opacity-70" style={{ color: colors.text.muted }}>
                  Cancel
                </button>
                <button
                  onClick={save}
                  disabled={saving}
                  className={`flex items-center gap-2 px-8 py-3 rounded-2xl font-bold text-sm text-white transition-all ${saving ? 'opacity-70 cursor-not-allowed' : 'hover:opacity-90 active:scale-95'}`}
                  style={{ backgroundColor: '#3b82f6', boxShadow: '0 4px 20px rgba(59,130,246,0.4)' }}
                >
                  {saving ? (editingProduct ? 'Updating...' : 'Saving...') : (editingProduct ? 'Update Product' : 'Add Product')}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

