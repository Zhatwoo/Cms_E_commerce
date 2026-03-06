'use client';
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../../components/context/theme-context';
import { useAlert } from '../../components/context/alert-context';
import { type Product } from '../../lib/productsData';
import { uploadProductImageApi } from '@/lib/api';
import { getIndustryCategories } from '@/lib/industryCatalog';

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
type VariantStockMap = Record<string, number>;

function buildVariantStockKey(parts: Array<{ variantId: string; optionId: string }>): string {
  return parts
    .map((part) => `${part.variantId}:${part.optionId}`)
    .join('__');
}
interface FormData {
  name: string; sku: string; category: string; description: string;
  status: 'active' | 'inactive' | 'draft';
  price: number; costPrice: number; discount: number; discountType: 'percentage' | 'fixed';
  images: string[]; stock: number; lowStockThreshold: number;
  hasVariants: boolean; variants: Variant[]; variantStocks: VariantStockMap;
}

export default function ProductAddModal({ isOpen, onClose, onSave, editingProduct, uploadSubdomain, projectIndustry }: {
  isOpen: boolean; onClose: () => void;
  onSave: (p: Partial<Product> & Partial<FormData>) => Promise<boolean> | boolean;
  editingProduct?: Product;
  uploadSubdomain?: string | null;
  projectIndustry?: string | null;
}) {
  const { colors } = useTheme();
  const { showAlert, showConfirm } = useAlert();

  const [images, setImages] = useState<ProductImage[]>([]);
  const [saving, setSaving] = useState(false);
  const [slide, setSlide] = useState(0);
  const [slideDir, setSlideDir] = useState<1 | -1>(1);
  const [dragging, setDragging] = useState(false);
  const [thumbDrag, setThumbDrag] = useState<number | null>(null);
  const [thumbOver, setThumbOver] = useState<number | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const [fd, setFd] = useState<FormData>({
    name: '', sku: '', category: '', description: '',
    status: 'active', price: 0, costPrice: 0, discount: 0, discountType: 'percentage',
    images: [], stock: 100, lowStockThreshold: 20, hasVariants: false, variants: [], variantStocks: {},
  });
  const [customCategoryInput, setCustomCategoryInput] = useState('');
  const [customCategories, setCustomCategories] = useState<string[]>([]);

  const industryPresetCategories = useMemo(
    () => getIndustryCategories(projectIndustry),
    [projectIndustry]
  );

  const availableCategories = useMemo(() => {
    const values = new Set<string>(industryPresetCategories);
    for (const customCategory of customCategories) values.add(customCategory);
    if (fd.category) values.add(fd.category);
    return Array.from(values);
  }, [industryPresetCategories, customCategories, fd.category]);

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
      const existingVariantStocks: VariantStockMap =
        editingProduct?.variantStocks && typeof editingProduct.variantStocks === 'object'
          ? Object.entries(editingProduct.variantStocks as Record<string, unknown>).reduce<VariantStockMap>((acc, [key, value]) => {
            const parsed = Number(value);
            acc[key] = Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : 0;
            return acc;
          }, {})
          : {};

      setImages(imageList.map((src) => ({ id: uid(), src })));
      setSlide(0);
      setCustomCategoryInput('');
      setCustomCategories([]);
      setFd({
        name: editingProduct?.name || '', sku: editingProduct?.sku || String(Math.floor(100000 + Math.random() * 900000)),
        category: editingProduct?.category || '', description: editingProduct?.description || '',
        status: editingProduct?.status || 'active', price: basePrice,
        costPrice: typeof editingProduct?.costPrice === 'number' ? editingProduct.costPrice : 0,
        discount, discountType, images: imageList,
        stock: editingProduct?.stock ?? 100,
        lowStockThreshold: typeof editingProduct?.lowStockThreshold === 'number' ? editingProduct.lowStockThreshold : 20,
        hasVariants,
        variants: existingVariants,
        variantStocks: existingVariantStocks,
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

  const moveSlide = (dir: 1 | -1) => {
    if (images.length <= 1) return;
    setSlideDir(dir);
    setSlide((current) => (current + dir + images.length) % images.length);
  };

  // Form helpers
  const set = (k: keyof FormData, v: any) => setFd(prev => ({ ...prev, [k]: v }));
  const patch = (p: Partial<FormData>) => setFd(prev => ({ ...prev, ...p }));

  const addCustomCategory = () => {
    const value = customCategoryInput.trim();
    if (!value) return;
    if (!availableCategories.includes(value)) {
      setCustomCategories((prev) => [...prev, value]);
    }
    set('category', value);
    setCustomCategoryInput('');
  };

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
      const stockKey = buildVariantStockKey(
        combo.map((item) => ({ variantId: item.variant.id, optionId: item.option.id }))
      );
      return { label: combo.map(c => `${c.variant.name}: ${c.option.name}`).join(' / '), price: Math.max(0, base), stockKey };
    });
  }, [fd.variants, fd.hasVariants, discBase]);

  useEffect(() => {
    if (!fd.hasVariants || combos.length === 0) return;

    setFd((prev) => {
      const nextVariantStocks: VariantStockMap = {};
      for (const combo of combos) {
        const current = Number(prev.variantStocks?.[combo.stockKey] ?? 0);
        nextVariantStocks[combo.stockKey] = Number.isFinite(current) && current > 0 ? Math.floor(current) : 0;
      }

      const prevKeys = Object.keys(prev.variantStocks || {});
      const nextKeys = Object.keys(nextVariantStocks);
      if (prevKeys.length === nextKeys.length && nextKeys.every((key) => prev.variantStocks[key] === nextVariantStocks[key])) {
        return prev;
      }

      return { ...prev, variantStocks: nextVariantStocks };
    });
  }, [combos, fd.hasVariants]);

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
      const combinationStockMap: VariantStockMap = hasVariants
        ? combos.reduce<VariantStockMap>((acc, combo) => {
          const amount = Number(fd.variantStocks?.[combo.stockKey] ?? 0);
          acc[combo.stockKey] = Number.isFinite(amount) && amount > 0 ? Math.floor(amount) : 0;
          return acc;
        }, {})
        : {};
      const combinationTotalStock = hasVariants
        ? Object.values(combinationStockMap).reduce((sum, amount) => sum + amount, 0)
        : 0;
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
        variantStocks: hasVariants ? combinationStockMap : {},
        images: uploadedImages,
        image: uploadedImages[0] || '[product]',
        stock: hasVariants ? combinationTotalStock : fd.stock,
        id: editingProduct?.id || uid(),
        createdAt: editingProduct?.createdAt || new Date().toISOString(),
      }));
      if (saved === false) return;
      if (editingProduct) {
        showAlert('Product updated successfully!', 'success');
      }
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
      fd.variants.length > 0 ||
      Object.values(fd.variantStocks || {}).some((amount) => Number(amount) > 0)
    );
  };

  const stockVariants = useMemo(
    () => fd.variants.filter((variant) => variant.options.length > 0),
    [fd.variants]
  );
  const [selectedVariantOptions, setSelectedVariantOptions] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!stockVariants.length) {
      setSelectedVariantOptions((prev) => (Object.keys(prev).length ? {} : prev));
      return;
    }

    setSelectedVariantOptions((prev) => {
      const next: Record<string, string> = {};
      for (const variant of stockVariants) {
        const current = prev[variant.id];
        const hasCurrent = current ? variant.options.some((option) => option.id === current) : false;
        next[variant.id] = hasCurrent ? current : '';
      }
      const prevKeys = Object.keys(prev);
      const nextKeys = Object.keys(next);
      if (prevKeys.length === nextKeys.length && nextKeys.every((key) => prev[key] === next[key])) {
        return prev;
      }
      return next;
    });
  }, [stockVariants]);

  const selectedVariantStockKey = useMemo(() => {
    if (!stockVariants.length) return null;
    const parts: Array<{ variantId: string; optionId: string }> = [];
    for (const variant of stockVariants) {
      const optionId = selectedVariantOptions[variant.id];
      if (!optionId) return null;
      parts.push({ variantId: variant.id, optionId });
    }
    return buildVariantStockKey(parts);
  }, [stockVariants, selectedVariantOptions]);

  const selectedVariantLabel = useMemo(() => {
    if (!stockVariants.length) return '';
    const labels: string[] = [];
    for (const variant of stockVariants) {
      const optionId = selectedVariantOptions[variant.id];
      if (!optionId) return '';
      const option = variant.options.find((item) => item.id === optionId);
      labels.push(`${variant.name}: ${option?.name || '-'}`);
    }
    return labels.join(' / ');
  }, [stockVariants, selectedVariantOptions]);

  const [variantStockDraft, setVariantStockDraft] = useState('');
  const [savedStockKey, setSavedStockKey] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedVariantStockKey) {
      setVariantStockDraft('');
      setSavedStockKey(null);
      return;
    }
    const current = Number(fd.variantStocks?.[selectedVariantStockKey] ?? 0);
    setVariantStockDraft(current > 0 ? String(current) : '');
    setSavedStockKey(null);
  }, [selectedVariantStockKey]);

  const [showColorPicker, setShowColorPicker] = useState(false);
  const [colorDraftHex, setColorDraftHex] = useState('#DBD5D5');
  const [showSizePicker, setShowSizePicker] = useState(false);
  const [sizeDraftSelection, setSizeDraftSelection] = useState<string[]>([]);
  const [pickerHue, setPickerHue] = useState(245);
  const [pickerSat, setPickerSat] = useState(15);
  const [pickerVal, setPickerVal] = useState(86);
  const [pickingSv, setPickingSv] = useState(false);
  const paletteRef = useRef<HTMLDivElement>(null);
  const colorPickerWrapRef = useRef<HTMLDivElement>(null);
  const sizePickerWrapRef = useRef<HTMLDivElement>(null);
  const sizePresetOptions = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

  const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

  const hsvToHex = (h: number, s: number, v: number) => {
    const hh = ((h % 360) + 360) % 360;
    const sat = clamp(s, 0, 100) / 100;
    const val = clamp(v, 0, 100) / 100;

    const chroma = val * sat;
    const x = chroma * (1 - Math.abs(((hh / 60) % 2) - 1));
    const m = val - chroma;

    let r = 0;
    let g = 0;
    let b = 0;

    if (hh < 60) {
      r = chroma; g = x; b = 0;
    } else if (hh < 120) {
      r = x; g = chroma; b = 0;
    } else if (hh < 180) {
      r = 0; g = chroma; b = x;
    } else if (hh < 240) {
      r = 0; g = x; b = chroma;
    } else if (hh < 300) {
      r = x; g = 0; b = chroma;
    } else {
      r = chroma; g = 0; b = x;
    }

    const toHex = (channel: number) => Math.round((channel + m) * 255).toString(16).padStart(2, '0');
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
  };

  const hexToHsv = (hex: string) => {
    const normalized = normalizeHex(hex);
    if (!normalized) return null;

    const r = parseInt(normalized.slice(1, 3), 16) / 255;
    const g = parseInt(normalized.slice(3, 5), 16) / 255;
    const b = parseInt(normalized.slice(5, 7), 16) / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const delta = max - min;

    let h = 0;
    if (delta !== 0) {
      if (max === r) h = 60 * (((g - b) / delta) % 6);
      else if (max === g) h = 60 * ((b - r) / delta + 2);
      else h = 60 * ((r - g) / delta + 4);
    }
    if (h < 0) h += 360;

    const s = max === 0 ? 0 : (delta / max) * 100;
    const v = max * 100;

    return { h: Math.round(h), s: Math.round(s), v: Math.round(v) };
  };

  const updatePickerColor = (h: number, s: number, v: number) => {
    const nextH = clamp(h, 0, 360);
    const nextS = clamp(s, 0, 100);
    const nextV = clamp(v, 0, 100);
    setPickerHue(nextH);
    setPickerSat(nextS);
    setPickerVal(nextV);
    setColorDraftHex(hsvToHex(nextH, nextS, nextV));
  };

  const updateSvFromPointer = (clientX: number, clientY: number) => {
    const el = paletteRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    if (!rect.width || !rect.height) return;

    const x = clamp(clientX - rect.left, 0, rect.width);
    const y = clamp(clientY - rect.top, 0, rect.height);
    const sat = (x / rect.width) * 100;
    const val = 100 - (y / rect.height) * 100;
    updatePickerColor(pickerHue, sat, val);
  };

  useEffect(() => {
    if (!showColorPicker) return;
    const hsv = hexToHsv(colorDraftHex) || hexToHsv('#DBD5D5');
    if (!hsv) return;
    setPickerHue(hsv.h);
    setPickerSat(hsv.s);
    setPickerVal(hsv.v);
  }, [showColorPicker]);

  useEffect(() => {
    if (!pickingSv) return;

    const onMove = (event: MouseEvent) => updateSvFromPointer(event.clientX, event.clientY);
    const onUp = () => setPickingSv(false);

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);

    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [pickingSv, pickerHue]);

  useEffect(() => {
    if (!showColorPicker && !showSizePicker) return;

    const onMouseDown = (event: MouseEvent) => {
      const target = event.target as Node | null;
      if (!target) return;
      if (colorPickerWrapRef.current?.contains(target)) return;
      if (sizePickerWrapRef.current?.contains(target)) return;
      setShowColorPicker(false);
      setShowSizePicker(false);
    };

    document.addEventListener('mousedown', onMouseDown);
    return () => document.removeEventListener('mousedown', onMouseDown);
  }, [showColorPicker, showSizePicker]);

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

  const iCls = 'w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-violet-400/40 transition-all';
  const iSt = { backgroundColor: '#191A69', borderColor: '#3140A6', color: '#FFFFFF' };
  const lCls = 'block text-[14px] font-medium mb-2';

  const colorVariant = fd.variants.find((variant) => variant.name.toLowerCase().includes('color'));
  const sizeVariant = fd.variants.find((variant) => variant.name.toLowerCase().includes('size'));

  const normalizeHex = (value: string) => {
    const v = value.trim();
    if (/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(v)) {
      if (v.length === 4) {
        return `#${v[1]}${v[1]}${v[2]}${v[2]}${v[3]}${v[3]}`.toUpperCase();
      }
      return v.toUpperCase();
    }
    return null;
  };

  const addColorOptionByHex = (hex: string) => {
    setFd((prev) => {
      const normalizedHex = normalizeHex(hex);
      if (!normalizedHex) return prev;
      const index = prev.variants.findIndex((variant) => variant.name.toLowerCase().includes('color'));
      if (index === -1) {
        return {
          ...prev,
          hasVariants: true,
          variants: [
            ...prev.variants,
            {
              id: uid(),
              name: 'Color',
              pricingMode: 'modifier',
              options: [{ id: uid(), name: normalizedHex, priceAdjustment: 0 }],
            },
          ],
        };
      }

      const current = prev.variants[index];
      const exists = current.options.some((option) => option.name.toLowerCase() === normalizedHex.toLowerCase());
      if (exists) return prev;
      const nextVariants = [...prev.variants];
      nextVariants[index] = {
        ...current,
        options: [...current.options, { id: uid(), name: normalizedHex, priceAdjustment: 0 }],
      };
      return { ...prev, hasVariants: true, variants: nextVariants };
    });
  };

  const addColorOption = () => {
    setShowSizePicker(false);
    setShowColorPicker(true);
  };

  const addSizeOptionsByList = (parsedSizes: string[]) => {
    if (!parsedSizes.length) return;
    setFd((prev) => {
      const index = prev.variants.findIndex((variant) => variant.name.toLowerCase().includes('size'));
      if (index === -1) {
        return {
          ...prev,
          hasVariants: true,
          variants: [
            ...prev.variants,
            {
              id: uid(),
              name: 'Size',
              pricingMode: 'modifier',
              options: parsedSizes.map((size) => ({ id: uid(), name: size, priceAdjustment: 0 })),
            },
          ],
        };
      }

      const current = prev.variants[index];
      const existing = new Set(current.options.map((option) => option.name.toLowerCase()));
      const additions = parsedSizes
        .filter((size) => !existing.has(size.toLowerCase()))
        .map((size) => ({ id: uid(), name: size, priceAdjustment: 0 }));
      if (!additions.length) return prev;

      const nextVariants = [...prev.variants];
      nextVariants[index] = {
        ...current,
        options: [...current.options, ...additions],
      };
      return { ...prev, hasVariants: true, variants: nextVariants };
    });
  };

  const addSizeOption = () => {
    setShowColorPicker(false);
    setShowSizePicker(true);
  };

  const colorToBg = (name: string) => {
    const v = name.trim();
    if (/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(v)) return v;
    const map: Record<string, string> = {
      white: '#DBD5D5',
      red: '#F62424',
      black: '#1F2937',
      blue: '#3B82F6',
      green: '#22C55E',
      yellow: '#FACC15',
      pink: '#EC4899',
      purple: '#A855F7',
      gray: '#9CA3AF',
    };
    return map[v.toLowerCase()] || '#DBD5D5';
  };

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
              background: 'linear-gradient(180deg, #110248 0%, #090029 100%)',
              border: '3px solid #211D69',
              boxShadow: '0 40px 80px rgba(0,0,0,0.45)',
            }}
          >

            {/* Left */}
            <div
              className="flex flex-col relative"
              style={{
                width: 460,
                minWidth: 460,
                backgroundColor: 'transparent',
                borderRight: '1px solid #211D69',
              }}
            >
              <div className="px-8 pt-9 pb-4 flex-shrink-0">
                <div>
                  <h3 className="text-[42px] leading-none font-bold" style={{ color: '#B18AF2' }}>Product Image</h3>
                  <p className="text-[14px] mt-2" style={{ color: '#FFFFFF' }}>Upload photos to showcase your product</p>
                </div>
              </div>

              <div className="flex-1 px-8 pb-8 flex flex-col gap-5 overflow-hidden min-h-0">
                <div
                  onDragEnter={() => setDragging(true)}
                  onDragLeave={() => setDragging(false)}
                  onDragOver={e => e.preventDefault()}
                  onDrop={e => { e.preventDefault(); setDragging(false); addFiles(e.dataTransfer.files); }}
                  onClick={() => fileRef.current?.click()}
                  className="relative mx-auto mt-2 rounded-[30px] cursor-pointer transition-all select-none overflow-hidden"
                  style={{
                    width: 360,
                    height: 252,
                    border: `2px dashed ${dragging ? '#7F6BDA' : '#211D69'}`,
                    backgroundColor: dragging ? 'rgba(127,107,218,0.12)' : '#2A1E66',
                  }}
                >
                  {images.length > 0 ? (
                    <>
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
                      <div className="absolute inset-x-0 bottom-0 px-4 py-2 text-center text-xs font-medium"
                        style={{ backgroundColor: 'rgba(9,0,41,0.55)', color: '#D8CCFF' }}>
                        Drop more images here or click to add
                      </div>
                    </>
                  ) : (
                    <motion.div animate={{ y: dragging ? -6 : 0 }} transition={{ type: 'spring', stiffness: 260 }}
                      className="h-full flex flex-col items-center justify-center gap-3 px-8 text-center">
                      <div className="w-20 h-20 rounded-3xl flex items-center justify-center" style={{ backgroundColor: 'transparent' }}>
                        <img src="/icons/products/add%20image.png" alt="Add image" className="w-12 h-12 object-contain" />
                      </div>
                      <div>
                        <p className="font-semibold text-[20px]" style={{ color: '#FFFFFF' }}>Drop images here</p>
                        <p className="text-[12px] mt-1" style={{ color: '#B9B9E9' }}>or click to browse file</p>
                      </div>
                    </motion.div>
                  )}
                </div>

                <div className="mt-2">
                  <h4 className="text-[42px] leading-none font-bold" style={{ color: '#B18AF2' }}>Image Preview</h4>
                  <p className="text-[14px] mt-2" style={{ color: '#FFFFFF' }}>Review the arrangement of uploaded photos</p>
                </div>

                {images.length > 0 ? (
                  <div className="relative flex items-center">
                    {images.length > 1 && (
                      <button
                        onClick={() => moveSlide(-1)}
                        className="absolute left-2 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full flex items-center justify-center transition-colors"
                        style={{ backgroundColor: '#8B6AD8', color: '#130952' }}
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                        </svg>
                      </button>
                    )}

                    <div className="mx-12 w-[calc(100%-96px)] max-w-[390px] flex items-center justify-center flex-shrink-0 h-[145px] overflow-hidden">
                      <AnimatePresence mode="wait" initial={false}>
                        <motion.div
                          key={slide}
                          initial={{ x: slideDir * 36, opacity: 0.7 }}
                          animate={{ x: 0, opacity: 1 }}
                          exit={{ x: slideDir * -36, opacity: 0.7 }}
                          transition={{ duration: 0.25, ease: 'easeOut' }}
                          className="w-full h-full flex items-center justify-center"
                        >
                          {(() => {
                            const visibleCount = Math.min(images.length, 3);
                            const startOffset = -Math.floor(visibleCount / 2);
                            const offsets = Array.from({ length: visibleCount }, (_, index) => startOffset + index);

                            return offsets.map((offset) => {
                              const idx = (slide + offset + images.length) % images.length;
                              const img = images[idx];
                              if (!img) return null;

                              const depth = Math.abs(offset);
                              const width = depth === 0 ? 116 : depth === 1 ? 104 : 86;
                              const opacity = depth === 0 ? 1 : depth === 1 ? 0.92 : 0.3;
                              const scale = depth === 0 ? 1 : depth === 1 ? 0.95 : 0.88;

                              return (
                                <button
                                  key={`${img.id}-${offset}`}
                                  type="button"
                                  onClick={() => {
                                    setSlideDir(idx >= slide ? 1 : -1);
                                    setSlide(idx);
                                  }}
                                  className="relative h-full border-r border-[#32419D] overflow-hidden transition-all"
                                  style={{
                                    width,
                                    opacity,
                                    transform: `scale(${scale})`,
                                    boxShadow: depth === 0 ? 'inset 0 0 0 2px #8A6ADF' : 'none',
                                  }}
                                >
                                  <img src={img.src} alt="" className="w-full h-full object-cover" />
                                  {depth >= 2 && <div className="absolute inset-0 bg-[#090029]/45" />}
                                </button>
                              );
                            });
                          })()}
                        </motion.div>
                      </AnimatePresence>
                    </div>

                    {images.length > 1 && (
                      <button
                        onClick={() => moveSlide(1)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full flex items-center justify-center transition-colors"
                        style={{ backgroundColor: '#8B6AD8', color: '#130952' }}
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="border border-dashed border-[#32419D] h-[145px] flex items-center justify-center text-sm"
                    style={{ color: '#8A8FC4' }}>
                    No images to preview yet
                  </div>
                )}
              </div>

              <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={e => addFiles(e.target.files)} />
            </div>

            {/* Right */}
            <div className="flex flex-col flex-1 overflow-hidden">
              <div className="flex items-center justify-end px-8 pt-6 pb-2 flex-shrink-0">
                <button
                  onClick={handleClose}
                  className="w-10 h-10 rounded-full flex items-center justify-center"
                  style={{ color: '#FFFFFF' }}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-8 pb-4 space-y-4" style={{ scrollbarWidth: 'thin' }}>
                <div className="grid grid-cols-[1fr_250px] gap-4 items-end">
                  <div>
                    <label className={lCls} style={{ color: '#BFA6EC' }}>Product Name</label>
                    <input type="text" value={fd.name} onChange={e => set('name', e.target.value)}
                      placeholder="" className={iCls} style={iSt} />
                  </div>
                  <div>
                    <label className={lCls} style={{ color: '#BFA6EC' }}>Item Code</label>
                    <div className="h-[46px] flex items-center text-[34px] font-semibold leading-none" style={{ color: '#FFFFFF' }}>
                      {fd.sku || '123456'}
                    </div>
                  </div>
                </div>

                <div>
                  <label className={lCls} style={{ color: '#BFA6EC' }}>Description</label>
                  <textarea value={fd.description} onChange={e => set('description', e.target.value)}
                    placeholder="Product description...."
                    rows={3}
                    className={`${iCls} resize-none`} style={{ ...iSt, minHeight: 116 }} />
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="relative">
                    <label className="block text-[18px] font-semibold mb-3" style={{ color: '#B18AF2' }}>Product Variants</label>
                    <div ref={colorPickerWrapRef} className="relative mb-3">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={addColorOption}
                          className="w-9 h-9 rounded-full border flex items-center justify-center"
                          style={{ borderColor: '#4952AF', backgroundColor: '#1A1D6E', color: '#FFFFFF' }}
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.8} d="M12 5v14M5 12h14" /></svg>
                        </button>
                        {(colorVariant?.options || []).slice(0, 5).map((option) => (
                          <button
                            key={option.id}
                            type="button"
                            onClick={() => {
                              if (!colorVariant) return;
                              setSelectedVariantOptions((prev) => ({ ...prev, [colorVariant.id]: option.id }));
                            }}
                            className="w-9 h-9 rounded-full border"
                            style={{
                              borderColor: selectedVariantOptions[colorVariant?.id || ''] === option.id ? '#FFFFFF' : '#E6DBFF',
                              backgroundColor: colorToBg(option.name),
                              boxShadow: selectedVariantOptions[colorVariant?.id || ''] === option.id ? '0 0 0 2px rgba(177,138,242,0.8)' : 'none',
                            }}
                          />
                        ))}
                      </div>

                      {showColorPicker && (
                        <div className="absolute left-0 top-full mt-2 w-[320px] rounded-xl border p-3 z-40 shadow-2xl" style={{ borderColor: '#3140A6', backgroundColor: '#14145C' }}>
                        <p className="text-xs mb-2" style={{ color: '#BFA6EC' }}>Pick color and confirm</p>

                        <div
                          ref={paletteRef}
                          className="relative w-full h-[155px] rounded-lg border overflow-hidden cursor-crosshair"
                          style={{ borderColor: '#4952AF', backgroundColor: `hsl(${pickerHue}, 100%, 50%)` }}
                          onMouseDown={(e) => {
                            updateSvFromPointer(e.clientX, e.clientY);
                            setPickingSv(true);
                          }}
                        >
                          <div className="absolute inset-0" style={{ background: 'linear-gradient(to right, #ffffff, rgba(255,255,255,0))' }} />
                          <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, #000000, rgba(0,0,0,0))' }} />
                          <div
                            className="absolute w-3.5 h-3.5 rounded-full border-2 border-white shadow"
                            style={{
                              left: `calc(${pickerSat}% - 7px)`,
                              top: `calc(${100 - pickerVal}% - 7px)`,
                              boxShadow: '0 0 0 1px rgba(0,0,0,0.35)',
                            }}
                          />
                        </div>

                        <input
                          type="range"
                          min={0}
                          max={360}
                          value={pickerHue}
                          onChange={(e) => updatePickerColor(parseInt(e.target.value, 10) || 0, pickerSat, pickerVal)}
                          className="figma-hue-slider w-full mt-3"
                        />

                        <div className="flex items-center gap-2 mt-3">
                          <div className="w-9 h-9 rounded-md border" style={{ borderColor: '#4952AF', backgroundColor: colorDraftHex }} />
                          <input
                            type="text"
                            value={colorDraftHex}
                            onChange={(e) => {
                              const next = e.target.value.toUpperCase();
                              setColorDraftHex(next);
                              const hsv = hexToHsv(next);
                              if (hsv) {
                                setPickerHue(hsv.h);
                                setPickerSat(hsv.s);
                                setPickerVal(hsv.v);
                              }
                            }}
                            placeholder="#FFFFFF"
                            className="flex-1 px-3 py-2 rounded-lg border text-sm"
                            style={{ backgroundColor: '#191A69', borderColor: '#3140A6', color: '#FFFFFF' }}
                          />
                        </div>

                        <div className="flex items-center justify-end gap-2 mt-3">
                          <button
                            type="button"
                            onClick={() => {
                              const normalizedHex = normalizeHex(colorDraftHex);
                              if (!normalizedHex) {
                                showAlert('Enter a valid hex color (example: #FFAA00)', 'error');
                                return;
                              }
                              addColorOptionByHex(normalizedHex);
                              setShowColorPicker(false);
                            }}
                            className="px-3 h-9 rounded-lg text-sm font-medium"
                            style={{ backgroundColor: '#A58DF3', color: '#FFFFFF' }}
                          >
                            Add
                          </button>
                          <button
                            type="button"
                            onClick={() => setShowColorPicker(false)}
                            className="px-3 h-9 rounded-lg text-sm font-medium"
                            style={{ backgroundColor: '#262B72', color: '#969AC5' }}
                          >
                            Cancel
                          </button>
                        </div>
                        </div>
                      )}
                    </div>

                    <div ref={sizePickerWrapRef} className="relative">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={addSizeOption}
                          className="w-9 h-9 border flex items-center justify-center text-[24px]"
                          style={{ borderColor: '#C7CBF2', color: '#FFFFFF' }}
                        >
                          +
                        </button>
                        {(sizeVariant?.options || []).slice(0, 5).map((option) => (
                          <button
                            key={option.id}
                            type="button"
                            onClick={() => {
                              if (!sizeVariant) return;
                              setSelectedVariantOptions((prev) => ({ ...prev, [sizeVariant.id]: option.id }));
                            }}
                            className="w-9 h-9 border flex items-center justify-center text-[22px] font-medium uppercase"
                            style={{
                              borderColor: selectedVariantOptions[sizeVariant?.id || ''] === option.id ? '#B18AF2' : '#C7CBF2',
                              color: '#FFFFFF',
                              backgroundColor: selectedVariantOptions[sizeVariant?.id || ''] === option.id ? 'rgba(177,138,242,0.22)' : 'transparent',
                            }}
                          >
                            {option.name}
                          </button>
                        ))}
                      </div>

                      {showSizePicker && (
                        <div className="absolute left-0 top-full mt-2 w-[320px] rounded-xl border p-3 z-40 shadow-2xl" style={{ borderColor: '#3140A6', backgroundColor: '#14145C' }}>
                          <p className="text-xs mb-2" style={{ color: '#BFA6EC' }}>Select size(s)</p>
                          <div className="grid grid-cols-3 gap-2">
                            {sizePresetOptions.map((size) => {
                              const selected = sizeDraftSelection.includes(size);
                              const exists = Boolean(sizeVariant?.options?.some((option) => option.name.toLowerCase() === size.toLowerCase()));
                              return (
                                <button
                                  key={size}
                                  type="button"
                                  disabled={exists}
                                  onClick={() => {
                                    setSizeDraftSelection((prev) => (
                                      prev.includes(size)
                                        ? prev.filter((item) => item !== size)
                                        : [...prev, size]
                                    ));
                                  }}
                                  className="h-9 rounded-lg border text-sm font-semibold uppercase"
                                  style={{
                                    borderColor: exists ? '#4A4F98' : (selected ? '#B18AF2' : '#C7CBF2'),
                                    color: exists ? '#7F84B3' : '#FFFFFF',
                                    backgroundColor: exists ? 'rgba(74,79,152,0.2)' : (selected ? 'rgba(177,138,242,0.22)' : 'transparent'),
                                    cursor: exists ? 'not-allowed' : 'pointer',
                                  }}
                                >
                                  {size}
                                </button>
                              );
                            })}
                          </div>
                          <div className="flex items-center justify-end gap-2 mt-3">
                            <button
                              type="button"
                              onClick={() => {
                                addSizeOptionsByList(sizeDraftSelection);
                                setSizeDraftSelection([]);
                                setShowSizePicker(false);
                              }}
                              disabled={sizeDraftSelection.length === 0}
                              className="px-3 h-9 rounded-lg text-sm font-medium"
                              style={{
                                backgroundColor: sizeDraftSelection.length === 0 ? '#4A4F98' : '#A58DF3',
                                color: '#FFFFFF',
                                opacity: sizeDraftSelection.length === 0 ? 0.6 : 1,
                              }}
                            >
                              Add Selected
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setSizeDraftSelection([]);
                                setShowSizePicker(false);
                              }}
                              className="px-3 h-9 rounded-lg text-sm font-medium"
                              style={{ backgroundColor: '#262B72', color: '#969AC5' }}
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="block text-[18px] font-semibold mb-3" style={{ color: '#B18AF2' }}>Product Category</label>
                    <select value={fd.category} onChange={e => set('category', e.target.value)} className={iCls} style={iSt}>
                      <option value="" disabled hidden>Select Category</option>
                      {availableCategories.map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                    <div className="mt-2 flex items-center gap-2">
                      <input
                        value={customCategoryInput}
                        onChange={(e) => setCustomCategoryInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            addCustomCategory();
                          }
                        }}
                        placeholder="Add custom category"
                        className="flex-1 px-3 py-2 rounded-lg border"
                        style={{
                          backgroundColor: '#0F145A',
                          borderColor: '#3140A6',
                          color: '#FFFFFF',
                        }}
                      />
                      <button
                        type="button"
                        onClick={addCustomCategory}
                        className="px-3 py-2 rounded-lg text-sm font-semibold"
                        style={{ backgroundColor: '#A58DF3', color: '#FFFFFF' }}
                      >
                        Add
                      </button>
                    </div>
                    {industryPresetCategories.length === 0 && (
                      <p className="text-xs mt-2" style={{ color: '#A9ADD8' }}>
                        No preset categories for this project yet. Add your own category above.
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6 pt-1">
                  <div>
                    <div className="flex items-center justify-center gap-3 mb-2">
                      <div className="flex-1 h-px bg-[#4A4F98]" />
                      <span className="inline-block px-2 text-[28px] leading-none font-medium" style={{ color: '#B18AF2', backgroundColor: '#0D0143' }}>Pricing</span>
                      <div className="flex-1 h-px bg-[#4A4F98]" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className={lCls} style={{ color: '#BFA6EC' }}>Price</label>
                        <div className="relative">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold" style={{ color: '#D6CEFF' }}>₱</span>
                          <input type="number" value={fd.price || ''} onChange={e => set('price', parseFloat(e.target.value) || 0)}
                            placeholder="123,123" step="0.01" className={iCls} style={{ ...iSt, paddingLeft: '1.8rem' }} />
                        </div>
                      </div>
                      <div>
                        <label className={lCls} style={{ color: '#BFA6EC' }}>Discount</label>
                        <div className="flex items-center rounded-xl border overflow-hidden" style={iSt}>
                          <select
                            value={fd.discountType}
                            onChange={e => set('discountType', e.target.value === 'fixed' ? 'fixed' : 'percentage')}
                            className="px-3 py-2.5 text-sm font-semibold focus:outline-none bg-transparent border-0"
                            style={{ color: '#D6CEFF', width: 72 }}
                          >
                            <option value="percentage">%</option>
                            <option value="fixed">₱</option>
                          </select>
                          <div className="w-px self-stretch" style={{ backgroundColor: '#3140A6' }} />
                          <input
                            type="number"
                            value={fd.discount || ''}
                            onChange={e => set('discount', parseFloat(e.target.value) || 0)}
                            placeholder="50"
                            step="0.01"
                            className="flex-1 px-3 py-2.5 bg-transparent text-white focus:outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-center gap-3 mb-2">
                      <div className="flex-1 h-px bg-[#4A4F98]" />
                      <span className="inline-block px-2 text-[28px] leading-none font-medium" style={{ color: '#B18AF2', backgroundColor: '#0D0143' }}>Stock</span>
                      <div className="flex-1 h-px bg-[#4A4F98]" />
                    </div>
                    {fd.hasVariants && stockVariants.length > 0 ? (
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className={lCls} style={{ color: '#BFA6EC' }}>Stock (Selected)</label>
                            <input
                              type="text"
                              inputMode="numeric"
                              value={variantStockDraft}
                              onChange={(e) => {
                                const normalized = e.target.value.replace(/[^0-9]/g, '');
                                setVariantStockDraft(normalized);
                                setSavedStockKey(null);
                              }}
                              disabled={!selectedVariantStockKey}
                              placeholder={selectedVariantStockKey ? '0' : 'Select color/size first'}
                              className={iCls}
                              style={iSt}
                            />
                            <div className="mt-2 flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  if (!selectedVariantStockKey) return;
                                  const amount = variantStockDraft === '' ? 0 : parseInt(variantStockDraft, 10);
                                  patch({
                                    variantStocks: {
                                      ...fd.variantStocks,
                                      [selectedVariantStockKey]: Number.isFinite(amount) && amount > 0 ? amount : 0,
                                    },
                                  });
                                  setSavedStockKey(selectedVariantStockKey);
                                }}
                                disabled={!selectedVariantStockKey}
                                className={`px-3 h-8 rounded-lg text-xs font-semibold ${selectedVariantStockKey ? 'opacity-100' : 'opacity-60 cursor-not-allowed'}`}
                                style={{ backgroundColor: '#A58DF3', color: '#FFFFFF' }}
                              >
                                Save Stock
                              </button>
                              {selectedVariantStockKey && savedStockKey === selectedVariantStockKey && (
                                <span className="text-xs" style={{ color: '#7FE0B4' }}>Saved</span>
                              )}
                            </div>
                            {selectedVariantLabel && (
                              <p className="mt-1 text-[11px]" style={{ color: '#BFA6EC' }}>{selectedVariantLabel}</p>
                            )}
                          </div>
                          <div>
                            <label className={lCls} style={{ color: '#BFA6EC' }}>Low Stock Alert</label>
                            <input type="number" value={fd.lowStockThreshold} onChange={e => set('lowStockThreshold', parseInt(e.target.value) || 0)}
                              placeholder="50" className={iCls} style={iSt} />
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className={lCls} style={{ color: '#BFA6EC' }}>Initial Stock</label>
                          <input type="number" value={fd.stock} onChange={e => set('stock', parseInt(e.target.value) || 0)}
                            placeholder="500" className={iCls} style={iSt} />
                        </div>
                        <div>
                          <label className={lCls} style={{ color: '#BFA6EC' }}>Low Stock Alert</label>
                          <input type="number" value={fd.lowStockThreshold} onChange={e => set('lowStockThreshold', parseInt(e.target.value) || 0)}
                            placeholder="50" className={iCls} style={iSt} />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6 items-end">
                  <div>
                    <div className="flex items-center justify-center gap-3 mb-2">
                      <div className="flex-1 h-px bg-[#4A4F98]" />
                      <span className="inline-block px-2 text-[28px] leading-none font-medium" style={{ color: '#B18AF2', backgroundColor: '#0D0143' }}>Status</span>
                      <div className="flex-1 h-px bg-[#4A4F98]" />
                    </div>
                    <select
                      value={fd.status}
                      onChange={(e) => set('status', e.target.value as FormData['status'])}
                      className={iCls}
                      style={iSt}
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="draft">Draft</option>
                    </select>
                  </div>
                </div>

                <div className="hidden">
                  <input type="text" value={fd.sku} onChange={e => set('sku', e.target.value)} />
                  <input type="number" value={fd.costPrice || ''} onChange={e => set('costPrice', parseFloat(e.target.value) || 0)} />
                </div>

                <div className="flex items-end justify-end gap-2 pt-3 pb-1">
                  <button
                    onClick={save}
                    disabled={saving}
                    className={`px-5 h-10 rounded-xl font-semibold text-sm leading-none transition-all ${saving ? 'opacity-70 cursor-not-allowed' : 'hover:opacity-90'}`}
                    style={{ backgroundColor: '#A58DF3', color: '#FFFFFF' }}
                  >
                    {saving ? (editingProduct ? 'Updating' : 'Saving') : (editingProduct ? 'Update' : 'Add')}
                  </button>
                  <button
                    onClick={handleClose}
                    className="px-4 h-10 rounded-xl font-medium text-sm leading-none"
                    style={{ backgroundColor: '#262B72', color: '#969AC5' }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

