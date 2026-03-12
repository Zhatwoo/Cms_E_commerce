'use client';
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import { useTheme } from '../../components/context/theme-context';
import { useAlert } from '../../components/context/alert-context';
import { type Product } from '../../lib/productsData';
import { uploadProductImageApi } from '@/lib/api';
import { getIndustryCategories, INDUSTRY_OPTIONS, normalizeIndustryKey } from '@/lib/industryCatalog';

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

interface VariantOption { id: string; name: string; priceAdjustment: number; image?: string; }
interface Variant { id: string; name: string; pricingMode: 'modifier' | 'override'; options: VariantOption[]; }
interface ProductImage { id: string; src: string; file?: File; }
type VariantStockMap = Record<string, number>;
type VariantPriceMap = Record<string, number>;

function buildVariantStockKey(parts: Array<{ variantId: string; optionId: string }>): string {
  return parts
    .map((part) => `${part.variantId}:${part.optionId}`)
    .join('__');
}

function generateAutoSku(name?: string): string {
  const cleaned = String(name || '')
    .toUpperCase()
    .replace(/[^A-Z0-9\s-]/g, ' ')
    .trim();
  const prefix = cleaned
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 3)
    .map((chunk) => chunk.slice(0, 3))
    .join('')
    .slice(0, 9) || 'ITEM';
  const suffix = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}-${suffix}`;
}

const MAX_VARIANTS = 2;

interface FormData {
  name: string; sku: string; category: string; subcategory: string; description: string;
  status: 'active' | 'inactive' | 'draft';
  price: number; costPrice: number; discount: number;
  images: string[]; stock: number; lowStockThreshold: number;
  trackInventory: boolean; inventoryStatus: 'in_stock' | 'out_of_stock';
  hasVariants: boolean; variants: Variant[]; variantStocks: VariantStockMap; variantPrices: VariantPriceMap;
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
  const [enableVariationImages, setEnableVariationImages] = useState(false);
  const [slide, setSlide] = useState(0);
  const [slideDir, setSlideDir] = useState<1 | -1>(1);
  const [dragging, setDragging] = useState(false);
  const [thumbDrag, setThumbDrag] = useState<number | null>(null);
  const [thumbOver, setThumbOver] = useState<number | null>(null);
  const [removedVariantRows, setRemovedVariantRows] = useState<string[]>([]);
  const [showSubcategoryDropdown, setShowSubcategoryDropdown] = useState(false);
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const subcategoryDropdownRef = useRef<HTMLDivElement>(null);

  const [fd, setFd] = useState<FormData>({
    name: '', sku: generateAutoSku(''), category: '', subcategory: '', description: '',
    status: 'active', price: 0, costPrice: 0, discount: 0,
    images: [], stock: 100, lowStockThreshold: 20, trackInventory: true, inventoryStatus: 'in_stock', hasVariants: false, variants: [], variantStocks: {}, variantPrices: {},
  });

  const projectSubcategoryOptions = useMemo(
    () => getIndustryCategories(projectIndustry),
    [projectIndustry]
  );

  const subcategoryOptions = useMemo(() => {
    const values = new Set<string>(projectSubcategoryOptions);
    if (fd.subcategory.trim()) values.add(fd.subcategory.trim());
    return Array.from(values);
  }, [projectSubcategoryOptions, fd.subcategory]);

  const lockedProjectCategory = useMemo(() => {
    const normalizedIndustryKey = normalizeIndustryKey(projectIndustry);
    if (!normalizedIndustryKey) return '';
    const industryOption = INDUSTRY_OPTIONS.find((option) => option.key === normalizedIndustryKey);
    if (industryOption?.label) return industryOption.label;
    return normalizedIndustryKey
      .split('-')
      .filter(Boolean)
      .map((token) => token.charAt(0).toUpperCase() + token.slice(1))
      .join(' ');
  }, [projectIndustry]);

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
              image: String(option?.image || '').trim(),
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
      const basePrice = Number(editingProduct?.price ?? 0);
      const discount = Number(editingProduct?.compareAtPrice ?? editingProduct?.basePrice ?? 0);
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
      const existingVariantPrices: VariantPriceMap =
        (editingProduct as Product & { variantPrices?: unknown } | undefined)?.variantPrices
        && typeof (editingProduct as Product & { variantPrices?: unknown }).variantPrices === 'object'
          ? Object.entries(((editingProduct as Product & { variantPrices?: Record<string, unknown> }).variantPrices || {})).reduce<VariantPriceMap>((acc, [key, value]) => {
            const parsed = Number(value);
            acc[key] = Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
            return acc;
          }, {})
          : {};
      const inferredInventoryStatus: 'in_stock' | 'out_of_stock' = (editingProduct?.stock ?? 0) > 0 ? 'in_stock' : 'out_of_stock';

      setImages(imageList.map((src) => ({ id: uid(), src })));
      setRemovedVariantRows([]);
      setSlide(0);
      setEnableVariationImages(existingVariants.some((variant) =>
        variant.options.some((option) => Boolean(String(option.image || '').trim()))
      ));
      const initialCategory = editingProduct?.category || lockedProjectCategory || '';
      setFd({
        name: editingProduct?.name || '', sku: editingProduct?.sku || generateAutoSku(editingProduct?.name || ''),
        category: initialCategory, subcategory: editingProduct?.subcategory || '', description: editingProduct?.description || '',
        status: editingProduct?.status || 'active', price: basePrice,
        costPrice: typeof editingProduct?.costPrice === 'number' ? editingProduct.costPrice : 0,
        discount, images: imageList,
        stock: editingProduct?.stock ?? 100,
        lowStockThreshold: typeof editingProduct?.lowStockThreshold === 'number' ? editingProduct.lowStockThreshold : 20,
        trackInventory: true,
        inventoryStatus: inferredInventoryStatus,
        hasVariants,
        variants: existingVariants,
        variantStocks: existingVariantStocks,
        variantPrices: existingVariantPrices,
      });
    }
  }, [isOpen, editingProduct, lockedProjectCategory]);

  useEffect(() => {
    if (!isOpen || editingProduct) return;
    if (!lockedProjectCategory) return;
    setFd((prev) => {
      if (prev.category === lockedProjectCategory) return prev;
      return { ...prev, category: lockedProjectCategory };
    });
  }, [isOpen, editingProduct, lockedProjectCategory]);

  useEffect(() => {
    if (!fd.hasVariants) return;
    setFd((prev) => (prev.trackInventory ? prev : { ...prev, trackInventory: true }));
  }, [fd.hasVariants]);

  useEffect(() => {
    if (!showSubcategoryDropdown) return;
    const onMouseDown = (event: MouseEvent) => {
      const target = event.target as Node | null;
      if (!target) return;
      if (subcategoryDropdownRef.current?.contains(target)) return;
      setShowSubcategoryDropdown(false);
    };
    document.addEventListener('mousedown', onMouseDown);
    return () => document.removeEventListener('mousedown', onMouseDown);
  }, [showSubcategoryDropdown]);

  useEffect(() => {
    setPortalTarget(document.body);
  }, []);

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

  const openFileBrowser = (event: React.MouseEvent<HTMLElement>) => {
    event.preventDefault();
    event.stopPropagation();
    fileRef.current?.click();
  };

  // Form helpers
  const set = (k: keyof FormData, v: any) => setFd(prev => ({ ...prev, [k]: v }));
  const patch = (p: Partial<FormData>) => setFd(prev => ({ ...prev, ...p }));

  // Pricing
  const basePrice = useMemo(() => Math.max(0, Number(fd.price || 0)), [fd.price]);
  const costOfGoods = useMemo(() => Math.max(0, Number(fd.costPrice || 0)), [fd.costPrice]);
  const profitValue = useMemo(() => basePrice - costOfGoods, [basePrice, costOfGoods]);
  const marginValue = useMemo(() => (basePrice > 0 ? (profitValue / basePrice) * 100 : 0), [basePrice, profitValue]);

  const combos = useMemo(() => {
    if (!fd.hasVariants) return [];
    const av = fd.variants.filter(v => v.options.length > 0);
    if (!av.length) return [];
    const groups = av.map(v => v.options.map(o => ({ variant: v, option: o })));
    return cartesian(groups).map(combo => {
      const stockKey = buildVariantStockKey(
        combo.map((item) => ({ variantId: item.variant.id, optionId: item.option.id }))
      );
      const mappedPrice = Number(fd.variantPrices?.[stockKey]);
      const price = Number.isFinite(mappedPrice) && mappedPrice >= 0 ? mappedPrice : basePrice;
      return { label: combo.map(c => c.option.name).join(' / '), price, stockKey };
    });
  }, [fd.variants, fd.hasVariants, basePrice, fd.variantPrices]);

  const visibleCombos = useMemo(
    () => combos.filter((combo) => !removedVariantRows.includes(combo.stockKey)),
    [combos, removedVariantRows]
  );

  useEffect(() => {
    if (removedVariantRows.length === 0) return;
    const validKeys = new Set(combos.map((combo) => combo.stockKey));
    setRemovedVariantRows((prev) => prev.filter((key) => validKeys.has(key)));
  }, [combos, removedVariantRows.length]);

  useEffect(() => {
    if (!fd.hasVariants || visibleCombos.length === 0) return;

    setFd((prev) => {
      const nextVariantStocks: VariantStockMap = {};
      const nextVariantPrices: VariantPriceMap = {};
      for (const combo of visibleCombos) {
        const current = Number(prev.variantStocks?.[combo.stockKey] ?? 0);
        nextVariantStocks[combo.stockKey] = Number.isFinite(current) && current > 0 ? Math.floor(current) : 0;
        const currentPrice = Number(prev.variantPrices?.[combo.stockKey]);
        nextVariantPrices[combo.stockKey] = Number.isFinite(currentPrice) && currentPrice >= 0 ? currentPrice : basePrice;
      }

      const prevStockKeys = Object.keys(prev.variantStocks || {});
      const nextStockKeys = Object.keys(nextVariantStocks);
      const prevPriceKeys = Object.keys(prev.variantPrices || {});
      const nextPriceKeys = Object.keys(nextVariantPrices);
      const sameStocks = prevStockKeys.length === nextStockKeys.length && nextStockKeys.every((key) => prev.variantStocks[key] === nextVariantStocks[key]);
      const samePrices = prevPriceKeys.length === nextPriceKeys.length && nextPriceKeys.every((key) => prev.variantPrices[key] === nextVariantPrices[key]);
      if (sameStocks && samePrices) {
        return prev;
      }

      return { ...prev, variantStocks: nextVariantStocks, variantPrices: nextVariantPrices };
    });
  }, [visibleCombos, fd.hasVariants, basePrice]);

  const range = useMemo(() => {
    if (!visibleCombos.length) return null;
    const prices = visibleCombos.map(c => c.price);
    return { min: Math.min(...prices), max: Math.max(...prices) };
  }, [visibleCombos]);

  // Variant helpers
  const addVariant = () => {
    if (fd.variants.length >= MAX_VARIANTS) {
      showAlert(`You can only add up to ${MAX_VARIANTS} variants.`, 'error');
      return;
    }
    patch({ variants: [...fd.variants, { id: uid(), name: '', pricingMode: 'modifier', options: [] }] });
  };
  const remVariant = (id: string) => {
    const nextVariants = fd.variants.filter(v => v.id !== id);
    patch({ variants: nextVariants, hasVariants: nextVariants.length > 0 ? fd.hasVariants : false });
  };
  const updVariant = (id: string, f: keyof Variant, v: any) => patch({ variants: fd.variants.map(x => x.id === id ? { ...x, [f]: v } : x) });
  const addOpt = (vid: string) => patch({ variants: fd.variants.map(v => v.id === vid ? { ...v, options: [...v.options, { id: uid(), name: '', priceAdjustment: 0, image: '' }] } : v) });
  const remOpt = (vid: string, oid: string) => patch({ variants: fd.variants.map(v => v.id === vid ? { ...v, options: v.options.filter(o => o.id !== oid) } : v) });
  const updOpt = (vid: string, oid: string, f: keyof VariantOption, v: any) => patch({ variants: fd.variants.map(x => x.id === vid ? { ...x, options: x.options.map(o => o.id === oid ? { ...o, [f]: v } : o) } : x) });
  const [uploadingOptionImage, setUploadingOptionImage] = useState<Record<string, boolean>>({});
  const [dragOverOptionImageKey, setDragOverOptionImageKey] = useState<string | null>(null);

  const uploadOptionImage = async (variantId: string, optionId: string, file: File) => {
    if (!file.type.startsWith('image/')) {
      showAlert('Invalid file type', 'error');
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      showAlert('Max 8MB per image', 'error');
      return;
    }

    const key = `${variantId}:${optionId}`;
    setUploadingOptionImage((prev) => ({ ...prev, [key]: true }));
    try {
      const response = await uploadProductImageApi(file, uploadSubdomain || undefined);
      if (!response?.url) {
        throw new Error(response?.message || 'Failed to upload option image');
      }
      updOpt(variantId, optionId, 'image', response.url);
    } catch (error) {
      showAlert(error instanceof Error ? error.message : 'Failed to upload option image', 'error');
    } finally {
      setUploadingOptionImage((prev) => ({ ...prev, [key]: false }));
    }
  };

  const dropOptionImage = (variantId: string, optionId: string, event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    event.stopPropagation();
    const key = `${variantId}:${optionId}`;
    setDragOverOptionImageKey(null);
    if (uploadingOptionImage[key]) return;
    const file = event.dataTransfer.files?.[0];
    if (!file) return;
    void uploadOptionImage(variantId, optionId, file);
  };

  const save = async () => {
    if (saving) return;
    if (!fd.name.trim()) { showAlert('Please enter a product name', 'error'); return; }
    setSaving(true);
    try {
      const normalizedSku = fd.sku.trim() || generateAutoSku(fd.name);
      const normalizedCategory = (lockedProjectCategory || fd.category || '').trim();
      const normalizedSubcategory = String(fd.subcategory || '').trim();
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
              image: String(option.image || '').trim(),
            }))
            .filter((option) => option.name || option.priceAdjustment !== 0 || option.image),
        }))
        .filter((variant) => variant.name || variant.options.length > 0);

      const hasVariants = fd.hasVariants && variants.length > 0;
      if (!hasVariants && fd.price <= 0) {
        showAlert('Please enter a valid price', 'error');
        setSaving(false);
        return;
      }
      if (hasVariants && visibleCombos.length === 0) {
        showAlert('Add at least one option to generate variant combinations.', 'error');
        setSaving(false);
        return;
      }
      const combinationStockMap: VariantStockMap = hasVariants
        ? visibleCombos.reduce<VariantStockMap>((acc, combo) => {
          const amount = Number(fd.variantStocks?.[combo.stockKey] ?? 0);
          acc[combo.stockKey] = Number.isFinite(amount) && amount > 0 ? Math.floor(amount) : 0;
          return acc;
        }, {})
        : {};
      const combinationPriceMap: VariantPriceMap = hasVariants
        ? visibleCombos.reduce<VariantPriceMap>((acc, combo) => {
          const amount = Number(fd.variantPrices?.[combo.stockKey] ?? basePrice);
          acc[combo.stockKey] = Number.isFinite(amount) && amount >= 0 ? amount : basePrice;
          return acc;
        }, {})
        : {};
      const combinationTotalStock = hasVariants
        ? Object.values(combinationStockMap).reduce((sum, amount) => sum + amount, 0)
        : 0;
      const combinationPrices = hasVariants ? Object.values(combinationPriceMap) : [];
      const finalPrice = hasVariants
        ? Number((combinationPrices.length ? Math.min(...combinationPrices) : basePrice))
        : basePrice;
      const priceRangeMin = hasVariants ? Number((combinationPrices.length ? Math.min(...combinationPrices) : finalPrice)) : finalPrice;
      const priceRangeMax = hasVariants ? Number((combinationPrices.length ? Math.max(...combinationPrices) : finalPrice)) : finalPrice;
      const computedStock = hasVariants ? combinationTotalStock : Math.max(0, fd.stock);
      const computedInventoryStatus: 'in_stock' | 'out_of_stock' = computedStock > 0 ? 'in_stock' : 'out_of_stock';

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
        sku: normalizedSku,
        category: normalizedCategory,
        subcategory: normalizedSubcategory,
        price: finalPrice,
        basePrice,
        finalPrice,
        compareAtPrice: hasVariants && Number(fd.discount || 0) > 0 ? Number(fd.discount) : null,
        discount: 0,
        hasVariants,
        variants: hasVariants ? variants : [],
        priceRangeMin,
        priceRangeMax,
        variantStocks: hasVariants ? combinationStockMap : {},
        variantPrices: hasVariants ? combinationPriceMap : {},
        images: uploadedImages,
        image: uploadedImages[0] || '[product]',
        stock: computedStock,
        lowStockThreshold: fd.lowStockThreshold,
        trackInventory: true,
        inventoryStatus: computedInventoryStatus,
        id: editingProduct?.id || uid(),
        createdAt: editingProduct?.createdAt || new Date().toISOString(),
      }));
      if (saved === false) return;
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
      fd.category !== '' ||
      fd.subcategory !== '' ||
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
  const totalVariantStock = useMemo(
    () => visibleCombos.reduce((sum, combo) => sum + Math.max(0, Number(fd.variantStocks?.[combo.stockKey] ?? 0)), 0),
    [visibleCombos, fd.variantStocks]
  );
  const [expandVariantStocksPanel, setExpandVariantStocksPanel] = useState(false);

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

  const requestClose = () => {
    void handleClose();
  };

  const handleNumberInputWheel: React.WheelEventHandler<HTMLDivElement> = (event) => {
    const target = event.target as HTMLInputElement | null;
    if (!target || target.tagName !== 'INPUT' || target.type !== 'number') return;
    target.blur();
    event.preventDefault();
  };

  const sanitizeNumberInput = (input: HTMLInputElement) => {
    if (input.type !== 'number') return;
    if (!input.value) return;
    const cleaned = input.value.replace(/-/g, '');
    if (cleaned !== input.value) {
      input.value = cleaned;
    }
  };

  const handleNumberKeyDownCapture: React.KeyboardEventHandler<HTMLDivElement> = (event) => {
    const target = event.target as HTMLInputElement | null;
    if (!target || target.tagName !== 'INPUT' || target.type !== 'number') return;
    if (event.key === '-' || event.key === 'Subtract') {
      event.preventDefault();
    }
  };

  const handleNumberInputCapture: React.FormEventHandler<HTMLDivElement> = (event) => {
    const target = event.target as HTMLInputElement | null;
    if (!target || target.tagName !== 'INPUT' || target.type !== 'number') return;
    sanitizeNumberInput(target);
  };

  const handleNumberPasteCapture: React.ClipboardEventHandler<HTMLDivElement> = (event) => {
    const target = event.target as HTMLInputElement | null;
    if (!target || target.tagName !== 'INPUT' || target.type !== 'number') return;
    const pasted = event.clipboardData.getData('text');
    if (pasted.includes('-')) {
      event.preventDefault();
      const cleaned = pasted.replace(/-/g, '');
      const start = target.selectionStart ?? target.value.length;
      const end = target.selectionEnd ?? target.value.length;
      const next = `${target.value.slice(0, start)}${cleaned}${target.value.slice(end)}`;
      target.value = next;
      target.dispatchEvent(new Event('input', { bubbles: true }));
    }
  };

  if (!portalTarget) return null;

  const iCls = 'w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-violet-400/40 transition-all';
  const iSt = { backgroundColor: '#191A69', borderColor: '#3140A6', color: '#FFFFFF' };
  const lCls = 'block text-xs tracking-[0.12em] font-semibold uppercase mb-2';

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
    let limitHit = false;
    setFd((prev) => {
      const normalizedHex = normalizeHex(hex);
      if (!normalizedHex) return prev;
      const index = prev.variants.findIndex((variant) => variant.name.toLowerCase().includes('color'));
      if (index === -1) {
        if (prev.variants.length >= MAX_VARIANTS) {
          limitHit = true;
          return prev;
        }
        return {
          ...prev,
          hasVariants: true,
          variants: [
            ...prev.variants,
            {
              id: uid(),
              name: 'Color',
              pricingMode: 'modifier',
              options: [{ id: uid(), name: normalizedHex, priceAdjustment: 0, image: '' }],
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
        options: [...current.options, { id: uid(), name: normalizedHex, priceAdjustment: 0, image: '' }],
      };
      return { ...prev, hasVariants: true, variants: nextVariants };
    });
    if (limitHit) showAlert(`You can only add up to ${MAX_VARIANTS} variants.`, 'error');
  };

  const addColorOption = () => {
    setShowSizePicker(false);
    setShowColorPicker(true);
  };

  const addSizeOptionsByList = (parsedSizes: string[]) => {
    if (!parsedSizes.length) return;
    let limitHit = false;
    setFd((prev) => {
      const index = prev.variants.findIndex((variant) => variant.name.toLowerCase().includes('size'));
      if (index === -1) {
        if (prev.variants.length >= MAX_VARIANTS) {
          limitHit = true;
          return prev;
        }
        return {
          ...prev,
          hasVariants: true,
          variants: [
            ...prev.variants,
            {
              id: uid(),
              name: 'Size',
              pricingMode: 'modifier',
              options: parsedSizes.map((size) => ({ id: uid(), name: size, priceAdjustment: 0, image: '' })),
            },
          ],
        };
      }

      const current = prev.variants[index];
      const existing = new Set(current.options.map((option) => option.name.toLowerCase()));
      const additions = parsedSizes
        .filter((size) => !existing.has(size.toLowerCase()))
        .map((size) => ({ id: uid(), name: size, priceAdjustment: 0, image: '' }));
      if (!additions.length) return prev;

      const nextVariants = [...prev.variants];
      nextVariants[index] = {
        ...current,
        options: [...current.options, ...additions],
      };
      return { ...prev, hasVariants: true, variants: nextVariants };
    });
    if (limitHit) showAlert(`You can only add up to ${MAX_VARIANTS} variants.`, 'error');
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

  const displayStock = (fd.hasVariants && stockVariants.length > 0)
    ? totalVariantStock
    : Math.max(0, fd.stock);
  const isStatusInStock = displayStock > 0;
  const stockSummaryText = displayStock > 0
    ? `In Stock - ${displayStock} ${displayStock === 1 ? 'unit' : 'units'}`
    : 'Out of Stock';

  return createPortal(
    <AnimatePresence>
      {isOpen ? (
        <motion.div
          key="modal-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="fixed inset-0 z-[5000] backdrop-blur-[12px]"
          style={{
            backgroundColor: 'rgba(0,0,0,0.5)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
          }}
          onClick={requestClose}
        >
          <div className="absolute inset-0 flex items-center justify-center p-6">
            <motion.div
              onClick={e => e.stopPropagation()}
              onWheelCapture={handleNumberInputWheel}
              onKeyDownCapture={handleNumberKeyDownCapture}
              onInputCapture={handleNumberInputCapture}
              onPasteCapture={handleNumberPasteCapture}
              initial={{ opacity: 0, scale: 0.93, y: 24 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.93, y: 24 }}
              transition={{ type: 'spring', damping: 26, stiffness: 280 }}
              className="product-modal-shell relative flex overflow-hidden w-full"
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
                width: 430,
                minWidth: 430,
                backgroundColor: '#28335B',
                borderRight: '1px solid #3A4473',
              }}
            >
              <div className="px-8 pt-8 pb-4 flex-shrink-0">
                <p className="text-xs tracking-[0.12em] font-semibold uppercase" style={{ color: '#9FB3DF' }}>Product Images</p>
                <div className="mt-1">
                  <p className="text-[30px] leading-none font-semibold" style={{ color: '#EAF1FF' }}>
                    {images.length} of 5 images added
                  </p>
                </div>
              </div>

              <div className="px-8 pb-8 flex-1 min-h-0">
                <div
                  onDragEnter={() => {
                    if (thumbDrag !== null) return;
                    setDragging(true);
                  }}
                  onDragLeave={() => {
                    if (thumbDrag !== null) return;
                    setDragging(false);
                  }}
                  onDragOver={e => {
                    e.preventDefault();
                  }}
                  onDrop={e => {
                    e.preventDefault();
                    if (thumbDrag !== null) {
                      // Prevent treating thumbnail reordering as a fresh file upload.
                      setThumbDrag(null);
                      setThumbOver(null);
                      setDragging(false);
                      return;
                    }
                    setDragging(false);
                    addFiles(e.dataTransfer.files);
                  }}
                  onClick={openFileBrowser}
                  className="relative h-full rounded-[28px] border-2 border-dashed cursor-pointer transition-colors overflow-hidden"
                  style={{
                    borderColor: dragging ? '#7E9CFF' : '#54658E',
                    backgroundColor: '#2E3B63',
                  }}
                >
                  {images.length > 0 ? (
                    <div className="h-full flex flex-col">
                      <div className="relative flex-1 min-h-0">
                        <AnimatePresence mode="wait">
                          <motion.img
                            key={slide}
                            src={images[slide]?.src}
                            alt=""
                            className="absolute inset-0 w-full h-full object-contain p-6"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                          />
                        </AnimatePresence>
                        <div className="absolute left-4 top-4 px-2.5 py-1 rounded-full text-xs font-semibold" style={{ backgroundColor: 'rgba(0,0,0,0.5)', color: '#FFFFFF' }}>
                          {`${slide + 1}/${images.length}`}
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeImage(slide);
                          }}
                          className="absolute right-4 top-3 w-8 h-8 rounded-full flex items-center justify-center"
                          style={{ backgroundColor: 'rgba(0,0,0,0.5)', color: '#FFFFFF' }}
                          title="Remove current image"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.3} d="M6 6l12 12M18 6L6 18" />
                          </svg>
                        </button>
                        {images.length > 1 && (
                          <div className="absolute top-3 right-14 flex items-center gap-2">
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); moveSlide(-1); }}
                              className="w-8 h-8 rounded-full flex items-center justify-center"
                              style={{ backgroundColor: 'rgba(16,22,45,0.82)', color: '#DCE7FF' }}
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.3} d="M15 19l-7-7 7-7" /></svg>
                            </button>
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); moveSlide(1); }}
                              className="w-8 h-8 rounded-full flex items-center justify-center"
                              style={{ backgroundColor: 'rgba(16,22,45,0.82)', color: '#DCE7FF' }}
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.3} d="M9 5l7 7-7 7" /></svg>
                            </button>
                          </div>
                        )}
                      </div>

                      <div className="border-t px-4 pt-3 pb-3" style={{ borderColor: '#3A4473', backgroundColor: 'rgba(24,31,57,0.9)' }}>
                        <div className="flex items-center gap-2 overflow-x-auto pb-2" onClick={(e) => e.stopPropagation()}>
                          {images.map((img, idx) => {
                            const isActive = idx === slide;
                            const isDropTarget = thumbOver === idx;
                            return (
                              <button
                                key={img.id}
                                type="button"
                                draggable
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSlideDir(idx >= slide ? 1 : -1);
                                  setSlide(idx);
                                }}
                                onDragStart={(e) => {
                                  e.stopPropagation();
                                  setThumbDrag(idx);
                                  setThumbOver(idx);
                                }}
                                onDragOver={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  setThumbOver(idx);
                                }}
                                onDrop={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  dropThumb(idx);
                                }}
                                onDragEnd={() => {
                                  setThumbDrag(null);
                                  setThumbOver(null);
                                }}
                                className="relative h-14 w-14 rounded-lg border overflow-hidden shrink-0"
                                style={{
                                  borderColor: isActive ? '#4F93FF' : isDropTarget ? '#7E9CFF' : '#54658E',
                                  boxShadow: isActive ? '0 0 0 2px rgba(79,147,255,0.35)' : 'none',
                                  opacity: thumbDrag === idx ? 0.65 : 1,
                                }}
                                title="Drag to reorder"
                              >
                                <img src={img.src} alt="" className="w-full h-full object-cover" />
                              </button>
                            );
                          })}
                          {images.length < 5 && (
                            <button
                              type="button"
                              onClick={openFileBrowser}
                              className="h-14 w-14 rounded-lg border-2 border-dashed shrink-0 flex flex-col items-center justify-center"
                              style={{ borderColor: '#54658E', color: '#9FB3DF' }}
                              title="Add image"
                            >
                              <span className="text-xl leading-none">+</span>
                            </button>
                          )}
                        </div>
                        <div className="text-[11px]" style={{ color: '#9FB3DF' }}>
                          Drag to reorder - First image is the cover photo
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-center px-10">
                      <div className="w-20 h-20 rounded-3xl flex items-center justify-center mb-4" style={{ backgroundColor: '#324A82' }}>
                        <img src="/icons/products/add%20image.png" alt="Add image" className="w-11 h-11 object-contain" />
                      </div>
                      <p className="text-[34px] leading-none font-semibold" style={{ color: '#FFFFFF' }}>Drop images here</p>
                      <p className="text-base mt-2" style={{ color: '#9FB3DF' }}>or click to browse files</p>
                      <p className="text-xs mt-10" style={{ color: '#7F93C1' }}>PNG, JPG, WEBP - Up to 5 images - Max 8MB each</p>
                    </div>
                  )}
                </div>
              </div>

              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onClick={(e) => {
                  e.stopPropagation();
                }}
                onChange={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  addFiles(e.target.files);
                  e.currentTarget.value = '';
                }}
              />
            </div>

            {/* Right */}
            <div className="flex flex-col flex-1 overflow-hidden">
              <div className="flex items-start justify-between px-8 pt-7 pb-4 flex-shrink-0">
                <div>
                  <h2 className="text-[44px] leading-none font-bold" style={{ color: '#FFFFFF' }}>
                    {editingProduct ? 'Edit Product' : 'New Product'}
                  </h2>
                  <p className="text-base mt-2" style={{ color: '#9FB3DF' }}>Fill in the details to add a new product</p>
                </div>
                <button
                  type="button"
                  onClick={requestClose}
                  className="w-10 h-10 rounded-full flex items-center justify-center"
                  style={{ color: '#9FB3DF' }}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.4} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-8 pb-4 space-y-4" style={{ scrollbarWidth: 'thin' }}>
                <div>
                  <label className={lCls} style={{ color: '#9FB3DF' }}>Product Name *</label>
                  <input
                    type="text"
                    value={fd.name}
                    onChange={e => {
                      const nextName = e.target.value;
                      setFd((prev) => ({
                        ...prev,
                        name: nextName,
                        sku: editingProduct ? prev.sku : generateAutoSku(nextName),
                      }));
                    }}
                    placeholder="e.g. Classic White Tee"
                    className={iCls}
                    style={iSt}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={lCls} style={{ color: '#9FB3DF' }}>Category</label>
                    <input
                      type="text"
                      value={fd.category || 'No category set'}
                      readOnly
                      className={iCls}
                      style={{ ...iSt, opacity: 0.9 }}
                      title={lockedProjectCategory ? 'Category is set from your project industry and cannot be edited here.' : undefined}
                    />
                    <p className="mt-1 text-[11px]" style={{ color: '#9FB3DF' }}>
                      Category is inherited from your project setup.
                    </p>
                  </div>
                  <div>
                    <label className={lCls} style={{ color: '#9FB3DF' }}>Subcategory</label>
                    <div className="relative" ref={subcategoryDropdownRef}>
                      <button
                        type="button"
                        onClick={() => setShowSubcategoryDropdown((prev) => !prev)}
                        className={`${iCls} text-left flex items-center justify-between`}
                        style={iSt}
                      >
                        <span className={`${fd.subcategory ? '' : 'opacity-70'}`}>
                          {fd.subcategory || 'Select specific product type'}
                        </span>
                        <svg
                          className={`w-4 h-4 transition-transform ${showSubcategoryDropdown ? 'rotate-180' : ''}`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          aria-hidden="true"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>

                      {showSubcategoryDropdown ? (
                        <div
                          className="absolute z-40 mt-2 w-full rounded-xl border shadow-xl overflow-y-auto"
                          style={{
                            backgroundColor: '#121A63',
                            borderColor: '#3140A6',
                            maxHeight: 220,
                          }}
                        >
                          {subcategoryOptions.length > 0 ? (
                            <>
                              {subcategoryOptions.map((subcategory) => (
                                <button
                                  key={subcategory}
                                  type="button"
                                  onClick={() => {
                                    set('subcategory', subcategory);
                                    setShowSubcategoryDropdown(false);
                                  }}
                                  className="w-full px-3 py-2.5 text-left text-sm transition-colors"
                                  style={{
                                    color: '#DCE7FF',
                                    backgroundColor: fd.subcategory === subcategory ? 'rgba(79,147,255,0.18)' : 'transparent',
                                  }}
                                >
                                  {subcategory}
                                </button>
                              ))}
                            </>
                          ) : (
                            <p className="px-3 py-2.5 text-sm" style={{ color: '#9FB3DF' }}>
                              No subcategories available for this project category.
                            </p>
                          )}
                        </div>
                      ) : null}
                    </div>
                    <p className="mt-1 text-[11px]" style={{ color: '#9FB3DF' }}>
                      Use this for the specific product type under the selected category.
                    </p>
                  </div>
                </div>

                <div>
                  <label className={lCls} style={{ color: '#9FB3DF' }}>Description</label>
                  <textarea value={fd.description} onChange={e => set('description', e.target.value)}
                    placeholder="e.g. High quality white cotton t-shirt, comfortable and durable..."
                    rows={3}
                    className={`${iCls} resize-none`} style={{ ...iSt, minHeight: 116 }} />
                </div>

                {!fd.hasVariants && (
                  <>
                    <div className="flex items-center justify-center gap-3">
                      <div className="flex-1 h-px" style={{ backgroundColor: '#3A4473' }} />
                      <div className="text-xs font-semibold uppercase tracking-[0.12em]" style={{ color: '#9FB3DF' }}>Pricing</div>
                      <div className="flex-1 h-px" style={{ backgroundColor: '#3A4473' }} />
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                  <div>
                    <div className="mb-2 flex items-center gap-1.5 leading-none">
                      <label className="text-xs tracking-[0.12em] font-semibold uppercase leading-none" style={{ color: '#9FB3DF' }}>Price*</label>
                      <div className="relative group">
                        <span className="h-4 w-4 rounded-full border text-[10px] font-bold leading-none inline-flex items-center justify-center cursor-help" style={{ color: '#C9D8FF', borderColor: '#4D5EC8', backgroundColor: '#1A2577' }}>i</span>
                        <div className="pointer-events-none absolute left-0 top-full z-50 mt-2 w-56 rounded-xl border p-3 opacity-0 transition-opacity group-hover:opacity-100" style={{ backgroundColor: '#121A63', borderColor: '#3140A6', boxShadow: '0 18px 34px rgba(0,0,0,0.45)' }}>
                          <p className="text-xs" style={{ color: '#DCE7FF' }}><span className="font-semibold"></span> The default price of this product.</p>
                        </div>
                      </div>
                    </div>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold" style={{ color: '#D6CEFF' }}>₱</span>
                      <input type="number" value={fd.price || ''} onChange={e => set('price', parseFloat(e.target.value) || 0)}
                        placeholder="0.00" step="0.01" className={iCls} style={{ ...iSt, paddingLeft: '1.8rem' }} />
                    </div>
                  </div>
                  <div>
                    <div className="mb-2 flex items-center gap-1.5 leading-none">
                      <label className="text-xs tracking-[0.12em] font-semibold uppercase leading-none" style={{ color: '#9FB3DF' }}>Cost of Goods</label>
                      <div className="relative group">
                        <span className="h-4 w-4 rounded-full border text-[10px] font-bold leading-none inline-flex items-center justify-center cursor-help" style={{ color: '#C9D8FF', borderColor: '#4D5EC8', backgroundColor: '#1A2577' }}>i</span>
                        <div className="pointer-events-none absolute left-1/2 top-full z-50 mt-2 w-72 -translate-x-1/2 rounded-xl border p-3 opacity-0 transition-opacity group-hover:opacity-100" style={{ backgroundColor: '#121A63', borderColor: '#3140A6', boxShadow: '0 18px 34px rgba(0,0,0,0.45)' }}>
                          <p className="text-xs" style={{ color: '#DCE7FF' }}><span className="font-semibold"></span> The amount you're spending to produce and sell this product. Your customers won't see this.</p>
                        </div>
                      </div>
                    </div>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold" style={{ color: '#D6CEFF' }}>₱</span>
                      <input
                        type="number"
                        value={fd.costPrice || ''}
                        onChange={e => set('costPrice', parseFloat(e.target.value) || 0)}
                        placeholder="0.00"
                        step="0.01"
                        className={iCls}
                        style={{ ...iSt, paddingLeft: '1.8rem' }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="mb-2 flex items-center gap-1.5 leading-none">
                      <label className="text-xs tracking-[0.12em] font-semibold uppercase leading-none" style={{ color: '#9FB3DF' }}>Strikethrough Price</label>
                      <div className="relative group">
                        <span className="h-4 w-4 rounded-full border text-[10px] font-bold leading-none inline-flex items-center justify-center cursor-help" style={{ color: '#C9D8FF', borderColor: '#4D5EC8', backgroundColor: '#1A2577' }}>i</span>
                        <div className="pointer-events-none absolute right-0 top-full z-50 mt-2 w-72 rounded-xl border p-3 opacity-0 transition-opacity group-hover:opacity-100" style={{ backgroundColor: '#121A63', borderColor: '#3140A6', boxShadow: '0 18px 34px rgba(0,0,0,0.45)' }}>
                          <p className="text-xs" style={{ color: '#DCE7FF' }}><span className="font-semibold"></span> Appears crossed out next to the product's price. Used to show customers the original or market price of a product.</p>
                        </div>
                      </div>
                    </div>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold" style={{ color: '#D6CEFF' }}>₱</span>
                      <input
                        type="number"
                        value={fd.discount || ''}
                        onChange={e => set('discount', parseFloat(e.target.value) || 0)}
                        placeholder="0.00"
                        step="0.01"
                        className={iCls}
                        style={{ ...iSt, paddingLeft: '1.8rem' }}
                      />
                    </div>
                  </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-xl border px-4 py-2.5" style={{ borderColor: '#3140A6', backgroundColor: '#121A63' }}>
                        <p className="text-[11px] uppercase tracking-[0.12em]" style={{ color: '#9FB3DF' }}>Profit</p>
                        <p className="text-sm font-semibold" style={{ color: profitValue >= 0 ? '#34D399' : '#F87171' }}>
                          P{profitValue.toFixed(2)}
                        </p>
                      </div>
                      <div className="rounded-xl border px-4 py-2.5" style={{ borderColor: '#3140A6', backgroundColor: '#121A63' }}>
                        <p className="text-[11px] uppercase tracking-[0.12em]" style={{ color: '#9FB3DF' }}>Margin</p>
                        <p className="text-sm font-semibold" style={{ color: marginValue >= 0 ? '#34D399' : '#F87171' }}>
                          {marginValue.toFixed(2)}%
                        </p>
                      </div>
                    </div>
                  </>
                )}

                <div className="flex items-center justify-center gap-3">
                  <div className="flex-1 h-px" style={{ backgroundColor: '#3A4473' }} />
                  <div className="text-xs font-semibold uppercase tracking-[0.12em]" style={{ color: '#9FB3DF' }}>Variants</div>
                  <div className="flex-1 h-px" style={{ backgroundColor: '#3A4473' }} />
                </div>

                <div className="rounded-xl border p-3 space-y-3" style={{ borderColor: '#3140A6', backgroundColor: '#0F145A' }}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold" style={{ color: '#DCE7FF' }}>Enable Variants</p>
                      <p className="text-[11px]" style={{ color: '#9FB3DF' }}>Use options like size, color, or material.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        if (fd.hasVariants) {
                          set('hasVariants', false);
                          return;
                        }
                        if (fd.variants.length === 0) {
                          addVariant();
                        }
                        set('hasVariants', true);
                      }}
                      className="relative h-7 w-14 rounded-full border transition-all"
                      style={{
                        borderColor: '#4952AF',
                        backgroundColor: fd.hasVariants ? '#32C870' : '#4A4F98',
                      }}
                      aria-label="Toggle variants"
                    >
                      <span
                        className="absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all"
                        style={{ left: fd.hasVariants ? '1.65rem' : '0.2rem' }}
                      />
                    </button>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold" style={{ color: '#DCE7FF' }}>Add Variation Images</p>
                      <p className="text-[11px]" style={{ color: '#A9ADD8' }}>Show image upload tiles next to option names.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setEnableVariationImages((prev) => !prev)}
                      className="relative h-7 w-14 rounded-full border transition-all"
                      style={{
                        borderColor: '#4952AF',
                        backgroundColor: enableVariationImages ? '#32C870' : '#4A4F98',
                      }}
                      aria-label="Toggle variation images"
                    >
                      <span
                        className="absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all"
                        style={{ left: enableVariationImages ? '1.65rem' : '0.2rem' }}
                      />
                    </button>
                  </div>

                  {fd.hasVariants ? (
                    <div className="space-y-3">
                      {fd.variants.map((variant, variantIndex) => (
                        <div key={variant.id} className="rounded-xl border p-3 space-y-3" style={{ borderColor: '#3A4473', backgroundColor: '#121A63' }}>
                          <div>
                            <label className={lCls} style={{ color: '#9FB3DF' }}>Variant Name</label>
                            <input
                              type="text"
                              value={variant.name}
                              onChange={(e) => updVariant(variant.id, 'name', e.target.value)}
                              placeholder={`e.g. ${variantIndex === 0 ? 'Size' : 'Color'}`}
                              className={iCls}
                              style={iSt}
                            />
                          </div>

                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <p className="text-xs font-semibold uppercase" style={{ color: '#BFA6EC' }}>Options</p>
                              <button
                                type="button"
                                onClick={() => addOpt(variant.id)}
                                className="px-3 h-8 rounded-lg text-xs font-semibold"
                                style={{ backgroundColor: '#24327A', color: '#DCE7FF' }}
                              >
                                + Add Option
                              </button>
                            </div>

                            {variant.options.map((option) => (
                              <div key={option.id} className="grid grid-cols-[1fr_auto] gap-2 items-end">
                                <div className="flex items-end gap-2">
                                  {enableVariationImages && variant.name.trim().toLowerCase() !== 'size' ? (
                                    <div className="relative h-14 w-14 shrink-0">
                                      {(() => {
                                        const optionImageKey = `${variant.id}:${option.id}`;
                                        const isDragOver = dragOverOptionImageKey === optionImageKey;
                                        return (
                                      <label
                                        className="h-14 w-14 rounded-lg shrink-0 flex items-center justify-center cursor-pointer overflow-hidden"
                                        style={{
                                          color: '#9FB3DF',
                                          backgroundColor: '#1A2577',
                                          boxShadow: isDragOver ? '0 0 0 2px rgba(126,156,255,0.8)' : 'none',
                                          border: isDragOver ? '1px solid #7E9CFF' : '1px solid transparent',
                                        }}
                                        title="Upload variation image"
                                        onDragOver={(e) => {
                                          e.preventDefault();
                                          e.stopPropagation();
                                          e.dataTransfer.dropEffect = 'copy';
                                          setDragOverOptionImageKey(optionImageKey);
                                        }}
                                        onDragEnter={(e) => {
                                          e.preventDefault();
                                          e.stopPropagation();
                                          setDragOverOptionImageKey(optionImageKey);
                                        }}
                                        onDragLeave={(e) => {
                                          e.preventDefault();
                                          e.stopPropagation();
                                          setDragOverOptionImageKey((prev) => (prev === optionImageKey ? null : prev));
                                        }}
                                        onDrop={(e) => dropOptionImage(variant.id, option.id, e)}
                                      >
                                        {isImageSource(String(option.image || '').trim()) ? (
                                          <img
                                            src={String(option.image || '').trim()}
                                            alt={`${option.name || 'option'} image`}
                                            className="w-full h-full object-cover"
                                          />
                                        ) : (
                                          <img src="/icons/products/add%20image.png" alt="Add image" className="w-7 h-7 object-contain opacity-90" />
                                        )}
                                        <input
                                          type="file"
                                          accept="image/*"
                                          className="hidden"
                                          disabled={Boolean(uploadingOptionImage[optionImageKey])}
                                          onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            if (file) {
                                              void uploadOptionImage(variant.id, option.id, file);
                                            }
                                            e.currentTarget.value = '';
                                          }}
                                        />
                                      </label>
                                        );
                                      })()}
                                      {isImageSource(String(option.image || '').trim()) ? (
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            updOpt(variant.id, option.id, 'image', '');
                                          }}
                                          className="absolute -top-1 -right-1 h-4 w-4 rounded-full flex items-center justify-center text-[10px] font-bold"
                                          style={{ backgroundColor: '#DC2626', color: '#FFFFFF' }}
                                          title="Remove variation image"
                                        >
                                          X
                                        </button>
                                      ) : null}
                                    </div>
                                  ) : null}

                                  <div className="flex-1">
                                    <label className={lCls} style={{ color: '#9FB3DF' }}>Option Name</label>
                                    <input
                                      type="text"
                                      value={option.name}
                                      onChange={(e) => updOpt(variant.id, option.id, 'name', e.target.value)}
                                      placeholder="e.g. Small"
                                      className={iCls}
                                      style={iSt}
                                    />
                                  </div>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => remOpt(variant.id, option.id)}
                                  className="h-11 w-11 flex items-center justify-center"
                                  style={{ color: '#F87171' }}
                                  title="Remove option"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 7h12M9 7V5a1 1 0 011-1h4a1 1 0 011 1v2m-7 0v12a1 1 0 001 1h6a1 1 0 001-1V7" />
                                  </svg>
                                </button>
                              </div>
                            ))}

                            {variant.options.length === 0 ? (
                              <p className="text-xs" style={{ color: '#9FB3DF' }}>No options yet. Add one to build combinations.</p>
                            ) : null}
                          </div>

                          <div className="flex justify-end">
                            <button
                              type="button"
                              onClick={() => remVariant(variant.id)}
                              className="h-9 px-3 rounded-lg text-xs font-semibold"
                              style={{ backgroundColor: 'rgba(239,68,68,0.2)', color: '#FCA5A5' }}
                            >
                              Delete Variant
                            </button>
                          </div>
                        </div>
                      ))}

                      <button
                        type="button"
                        onClick={addVariant}
                        disabled={fd.variants.length >= MAX_VARIANTS}
                        className={`w-full h-10 rounded-xl text-sm font-semibold ${fd.variants.length >= MAX_VARIANTS ? 'opacity-60 cursor-not-allowed' : ''}`}
                        style={{ backgroundColor: '#24327A', color: '#DCE7FF' }}
                      >
                        + Add Another Variant
                      </button>

                    </div>
                  ) : (
                    <p className="text-xs" style={{ color: '#9FB3DF' }}>
                      Keep variants off for simple single-item products.
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-center gap-3">
                  <div className="flex-1 h-px" style={{ backgroundColor: '#3A4473' }} />
                  <div className="text-xs font-semibold uppercase tracking-[0.12em]" style={{ color: '#9FB3DF' }}>
                    {fd.hasVariants ? 'Stock and Pricing' : 'Stock'}
                  </div>
                  <div className="flex-1 h-px" style={{ backgroundColor: '#3A4473' }} />
                </div>

                <div>
                    {fd.hasVariants && fd.variants.length > 0 ? (
                      <div className="space-y-3">
                        <div className="rounded-xl border p-3 space-y-2" style={{ borderColor: '#3A4473', backgroundColor: '#121A63' }}>
                            <div className="flex items-center justify-between gap-2">
                              <p className="text-xs font-semibold uppercase" style={{ color: '#BFA6EC' }}>Variant Stocks and Pricing</p>
                              <button
                                type="button"
                                onClick={() => setExpandVariantStocksPanel((prev) => !prev)}
                                className="h-8 w-8 rounded-lg flex items-center justify-center border"
                                style={{ borderColor: '#3140A6', color: '#C9D8FF', backgroundColor: 'rgba(26,37,119,0.7)' }}
                                title={expandVariantStocksPanel ? 'Collapse table' : 'Expand table'}
                                aria-label={expandVariantStocksPanel ? 'Collapse variant stock table' : 'Expand variant stock table'}
                              >
                                {expandVariantStocksPanel ? (
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10V6h4M16 14v4h-4M14 8h4v4M10 16H6v-4" />
                                  </svg>
                                ) : (
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6v4M14 6h4v4M10 18H6v-4M14 18h4v-4" />
                                  </svg>
                                )}
                              </button>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <div className="mb-2 flex items-center gap-1.5 leading-none">
                                  <label className="text-xs tracking-[0.12em] font-semibold uppercase leading-none" style={{ color: '#9FB3DF' }}>Strikethrough Price</label>
                                  <div className="relative group">
                                    <span className="h-4 w-4 rounded-full border text-[10px] font-bold leading-none inline-flex items-center justify-center cursor-help" style={{ color: '#C9D8FF', borderColor: '#4D5EC8', backgroundColor: '#1A2577' }}>i</span>
                                    <div className="pointer-events-none absolute left-0 top-full z-50 mt-2 w-56 rounded-xl border p-3 opacity-0 transition-opacity group-hover:opacity-100" style={{ backgroundColor: '#121A63', borderColor: '#3140A6', boxShadow: '0 18px 34px rgba(0,0,0,0.45)' }}>
                                      <p className="text-xs" style={{ color: '#DCE7FF' }}><span className="font-semibold"></span> Appears crossed out next to the product's price. Used to show customers the original or market price of a product.</p>
                                    </div>
                                  </div>
                                </div>
                                <div className="relative">
                                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold" style={{ color: '#D6CEFF' }}>₱</span>
                                  <input
                                    type="number"
                                    min={0}
                                    step="0.01"
                                    value={fd.discount || ''}
                                    onChange={(e) => set('discount', parseFloat(e.target.value) || 0)}
                                    className={iCls}
                                    style={{ ...iSt, paddingLeft: '1.8rem' }}
                                    placeholder="0.00"
                                  />
                                </div>
                              </div>
                            </div>
                            {visibleCombos.length > 0 ? (
                              <div
                                className="overflow-auto pr-1 rounded-lg"
                                style={{
                                  maxHeight: expandVariantStocksPanel ? 380 : 240,
                                }}
                              >
                                <div className="min-w-[560px] space-y-2">
                                  <div className="grid grid-cols-[minmax(220px,1fr)_120px_120px_36px] gap-2 px-1">
                                    <p className="text-[11px] font-semibold uppercase tracking-[0.12em]" style={{ color: '#9FB3DF' }}>Variant</p>
                                    <p className="text-[11px] font-semibold uppercase tracking-[0.12em]" style={{ color: '#9FB3DF' }}>Price</p>
                                    <p className="text-[11px] font-semibold uppercase tracking-[0.12em]" style={{ color: '#9FB3DF' }}>Stock</p>
                                    <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-center" style={{ color: '#9FB3DF' }}>Del</p>
                                  </div>
                                  {visibleCombos.map((combo) => (
                                    <div key={combo.stockKey} className="grid grid-cols-[minmax(220px,1fr)_120px_120px_36px] gap-2 items-center">
                                      <div className="h-11 rounded-xl border px-3 flex items-center text-xs" style={{ borderColor: '#3140A6', backgroundColor: '#1A2577', color: '#C9D8FF' }}>
                                        {combo.label || 'Unnamed Variant'}
                                      </div>
                                      <input
                                        type="number"
                                        min={0}
                                        step="0.01"
                                        value={fd.variantPrices?.[combo.stockKey] ?? 0}
                                        onChange={(e) => {
                                          const amount = Math.max(0, Number.parseFloat(e.target.value || '0') || 0);
                                          patch({
                                            variantPrices: {
                                              ...fd.variantPrices,
                                              [combo.stockKey]: amount,
                                            },
                                          });
                                        }}
                                        className={iCls}
                                        style={iSt}
                                      />
                                      <input
                                        type="number"
                                        min={0}
                                        value={fd.variantStocks?.[combo.stockKey] ?? 0}
                                        onChange={(e) => {
                                          const amount = Math.max(0, parseInt(e.target.value || '0', 10) || 0);
                                          patch({
                                            variantStocks: {
                                              ...fd.variantStocks,
                                              [combo.stockKey]: amount,
                                            },
                                          });
                                        }}
                                        className={iCls}
                                        style={iSt}
                                      />
                                      <button
                                        type="button"
                                        onClick={() => setRemovedVariantRows((prev) => (prev.includes(combo.stockKey) ? prev : [...prev, combo.stockKey]))}
                                        className="h-9 w-9 rounded-lg border inline-flex items-center justify-center"
                                        style={{ borderColor: '#5A2F67', backgroundColor: 'rgba(127,29,29,0.22)', color: '#FCA5A5' }}
                                        title={`Delete ${combo.label || 'variant'} row`}
                                        aria-label={`Delete ${combo.label || 'variant'} row`}
                                      >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 7h12M9 7V5a1 1 0 011-1h4a1 1 0 011 1v2m-7 0v12a1 1 0 001 1h6a1 1 0 001-1V7" />
                                        </svg>
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ) : (
                              <p className="text-xs" style={{ color: '#9FB3DF' }}>
                                Add options under Variants to generate stock rows.
                              </p>
                            )}
                            {range ? (
                              <div className="pt-2 mt-1 border-t" style={{ borderColor: '#2A367F' }}>
                                <p className="text-xs" style={{ color: '#BFA6EC' }}>
                                  Variant price range: P{Number(range.min).toFixed(2)} - P{Number(range.max).toFixed(2)}
                                </p>
                              </div>
                            ) : null}
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className={lCls} style={{ color: '#9FB3DF' }}>Total Stock (Auto)</label>
                            <input
                              type="text"
                              value={totalVariantStock}
                              readOnly
                              className={iCls}
                              style={{ ...iSt, opacity: 0.85 }}
                            />
                          </div>
                          <div>
                            <label className={lCls} style={{ color: '#9FB3DF' }}>Low Stock Alert</label>
                            <input type="number" value={fd.lowStockThreshold} onChange={e => set('lowStockThreshold', parseInt(e.target.value) || 0)}
                              placeholder="50" className={iCls} style={iSt} />
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className={lCls} style={{ color: '#9FB3DF' }}>Initial Stock</label>
                          <input type="number" value={fd.stock} onChange={e => set('stock', parseInt(e.target.value) || 0)}
                            placeholder="100" className={iCls} style={iSt} />
                        </div>
                        <div>
                          <label className={lCls} style={{ color: '#9FB3DF' }}>Low Stock Alert</label>
                          <input type="number" value={fd.lowStockThreshold} onChange={e => set('lowStockThreshold', parseInt(e.target.value) || 0)}
                            placeholder="20" className={iCls} style={iSt} />
                        </div>
                      </div>
                    )}

                    <div className="mt-3">
                      <div>
                        <label className={lCls} style={{ color: '#9FB3DF' }}>SKU *</label>
                        <div className="relative">
                          <input
                            type="text"
                            value={fd.sku}
                            readOnly
                            className={iCls}
                            style={{ ...iSt, opacity: 0.9, paddingRight: '2.75rem' }}
                          />
                          {!editingProduct && (
                            <button
                              type="button"
                              onClick={() => set('sku', generateAutoSku(fd.name))}
                              className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg flex items-center justify-center"
                              style={{ backgroundColor: '#24327A', color: '#C9D8FF' }}
                              title="Regenerate SKU"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v6h6M20 20v-6h-6M20 8a8 8 0 0 0-14.9-3M4 16a8 8 0 0 0 14.9 3" />
                              </svg>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                </div>

                <div className="inline-flex items-center rounded-full px-3 h-9 text-sm font-semibold" style={{ backgroundColor: isStatusInStock ? 'rgba(16,185,129,0.2)' : 'rgba(248,113,113,0.2)', color: isStatusInStock ? '#34D399' : '#F87171' }}>
                  {stockSummaryText}
                </div>

                <div className="hidden">
                  <input type="text" value={fd.sku} onChange={e => set('sku', e.target.value)} />
                </div>
              </div>

              <div className="px-8 py-4 border-t flex items-center justify-between" style={{ borderColor: '#3A4473', backgroundColor: 'rgba(21,27,79,0.88)' }}>
                <button
                  type="button"
                  onClick={requestClose}
                  className="px-1 h-10 rounded-xl font-medium text-sm leading-none"
                  style={{ color: '#B6C5EB' }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={save}
                  disabled={saving}
                  className={`px-8 h-10 rounded-2xl font-semibold text-sm leading-none transition-all ${saving ? 'opacity-70 cursor-not-allowed' : 'hover:opacity-90'}`}
                  style={{ backgroundColor: '#3B82F6', color: '#FFFFFF', boxShadow: '0 10px 24px rgba(59,130,246,0.35)' }}
                >
                  {saving ? (editingProduct ? 'Updating...' : 'Saving...') : (editingProduct ? 'Update Product' : 'Add Product')}
                </button>
              </div>
            </div>

              <style jsx global>{`
                .product-modal-shell input[type='number']::-webkit-outer-spin-button,
                .product-modal-shell input[type='number']::-webkit-inner-spin-button {
                  -webkit-appearance: none;
                  margin: 0;
                }

                .product-modal-shell input[type='number'] {
                  -moz-appearance: textfield;
                  appearance: textfield;
                }
              `}</style>
            </motion.div>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
    ,
    portalTarget
  );
}

