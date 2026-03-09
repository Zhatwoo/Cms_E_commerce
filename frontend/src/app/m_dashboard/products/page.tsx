'use client';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle } from 'lucide-react';
import { useTheme } from '../components/context/theme-context';
import { useAlert } from '../components/context/alert-context';
import { useProject } from '../components/context/project-context';
import { type Product, type ProductVariant } from '../lib/productsData';
import { createProduct, deleteProduct, listProducts, updateProduct, type ApiProduct } from '@/lib/api';
import ProductAddModal from './components/productAddModal';

type ProductUpsertPayload = Omit<Parameters<typeof createProduct>[0], 'subdomain'>;
const DEFAULT_LOW_STOCK_THRESHOLD = 5;

type ProductPopupState = {
  open: boolean;
  message: string;
  tone: 'success' | 'error';
};

function getLowStockThreshold(product: Product): number {
  const threshold = Number(product.lowStockThreshold);
  if (!Number.isFinite(threshold) || threshold < 0) return DEFAULT_LOW_STOCK_THRESHOLD;
  return threshold;
}

function isLowStock(product: Product): boolean {
  return product.stock > 0 && product.stock < getLowStockThreshold(product);
}

function isImageSource(value: string): boolean {
  const v = (value || '').trim();
  if (!v) return false;
  if (/^data:image\/[a-zA-Z0-9.+-]+;base64,/i.test(v)) return true;
  if (/^https?:\/\//i.test(v)) return true;
  if (v.startsWith('blob:')) return true;
  if (v.startsWith('/')) return true;
  return false;
}

function extractSizesAndColors(product: Product): { sizes: string[]; colors: string[] } {
  const sizes = new Set<string>();
  const colors = new Set<string>();

  const fallbackSizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
  const fallbackColors = ['#EAE3F9', '#F23939', '#2F49D8', '#D81CBF'];

  if (Array.isArray(product.variants)) {
    for (const variant of product.variants) {
      const variantName = String(variant?.name || '').trim().toLowerCase();
      const options = Array.isArray(variant?.options) ? variant.options : [];
      for (const option of options) {
        const optionName = String(option?.name || '').trim();
        if (!optionName) continue;
        if (variantName.includes('size')) {
          sizes.add(optionName.toUpperCase());
          continue;
        }
        if (variantName.includes('color') || /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(optionName)) {
          const normalized = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(optionName) ? optionName : '';
          if (normalized) colors.add(normalized);
        }
      }
    }
  }

  return {
    sizes: sizes.size > 0 ? Array.from(sizes).slice(0, 6) : fallbackSizes,
    colors: colors.size > 0 ? Array.from(colors).slice(0, 6) : fallbackColors,
  };
}

function getVariantGroups(product: Product): ProductVariant[] {
  return Array.isArray(product.variants)
    ? product.variants.filter((variant) => Array.isArray(variant.options) && variant.options.length > 0)
    : [];
}

function buildVariantStockKey(variants: ProductVariant[], selectedOptions: Record<string, string>): string | null {
  if (variants.length === 0) return null;
  const keyParts: string[] = [];
  for (const variant of variants) {
    const selectedOptionId = selectedOptions[variant.id];
    if (!selectedOptionId) return null;
    keyParts.push(`${variant.id}:${selectedOptionId}`);
  }
  return keyParts.join('__');
}

function getInitialVariantSelection(product: Product): Record<string, string> {
  const groups = getVariantGroups(product);
  return groups.reduce<Record<string, string>>((acc, variant) => {
    const firstOption = variant.options[0];
    if (firstOption?.id) {
      acc[variant.id] = firstOption.id;
    }
    return acc;
  }, {});
}

function getCombinationStock(product: Product, selectedOptions: Record<string, string>): number | null {
  if (!product.hasVariants || !product.variantStocks) return null;
  const groups = getVariantGroups(product);
  if (groups.length === 0) return null;
  const stockKey = buildVariantStockKey(groups, selectedOptions);
  if (!stockKey) return null;
  const value = Number(product.variantStocks[stockKey]);
  return Number.isFinite(value) && value >= 0 ? value : 0;
}

function colorFromName(value: string): string {
  const trimmed = value.trim();
  if (/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(trimmed)) return trimmed;
  const palette = ['#EAE3F9', '#F23939', '#2F49D8', '#D81CBF', '#22c55e', '#f59e0b', '#14b8a6'];
  const hash = Array.from(trimmed.toLowerCase()).reduce((sum, ch) => sum + ch.charCodeAt(0), 0);
  return palette[hash % palette.length];
}

type ThemeColors = ReturnType<typeof useTheme>['colors'];

const ProductCard = ({ product, colors, onView, onEdit, onDelete, isTransitioningOut }: {
  product: Product;
  colors: ThemeColors;
  onView: (product: Product) => void;
  onEdit: (product: Product) => void;
  onDelete: (product: Product) => void;
  isTransitioningOut?: boolean;
}) => {
  const imageValue = String(product.image || '').trim();
  const showImage = isImageSource(imageValue);
  const [menuOpen, setMenuOpen] = useState(false);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>(() => getInitialVariantSelection(product));
  const variantGroups = getVariantGroups(product);
  const sizeVariant = variantGroups.find((variant) => variant.name.toLowerCase().includes('size'));
  const colorVariant = variantGroups.find((variant) => variant.name.toLowerCase().includes('color'));
  const { sizes, colors: variantColors } = extractSizesAndColors(product);
  const selectedStock = getCombinationStock(product, selectedOptions);
  const visibleStock = selectedStock ?? product.stock;
  const lowStock = visibleStock > 0 && visibleStock < getLowStockThreshold(product);

  useEffect(() => {
    setSelectedOptions(getInitialVariantSelection(product));
  }, [product.id, product.variants]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: isTransitioningOut ? 0 : 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.12, ease: 'easeOut' }}
      className="border overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col h-full"
      style={{
        backgroundColor: '#131761',
        borderColor: '#2D3A90',
        borderRadius: '26px',
      }}
    >
      <div className="relative w-full h-56 md:h-60 overflow-hidden flex items-center justify-center border-b" style={{ borderColor: '#2D3A90', backgroundColor: '#D9D9DC' }}>
        <button
          type="button"
          onClick={() => setMenuOpen((prev) => !prev)}
          className="absolute right-3 top-3 h-8 w-8 rounded-full bg-black text-white flex items-center justify-center"
          title="Product actions"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <circle cx="6" cy="12" r="2" />
            <circle cx="12" cy="12" r="2" />
            <circle cx="18" cy="12" r="2" />
          </svg>
        </button>
        {menuOpen && (
          <div className="absolute right-3 top-12 z-20 w-32 rounded-lg border border-[#2D3A90] bg-[#12145A] py-1 shadow-xl">
            <button type="button" onClick={() => { setMenuOpen(false); onView(product); }} className="w-full px-3 py-2 text-left text-xs text-white hover:bg-white/5">View</button>
            <button type="button" onClick={() => { setMenuOpen(false); onEdit(product); }} className="w-full px-3 py-2 text-left text-xs text-white hover:bg-white/5">Edit</button>
            <button type="button" onClick={() => { setMenuOpen(false); onDelete(product); }} className="w-full px-3 py-2 text-left text-xs text-red-300 hover:bg-red-500/10">Delete</button>
          </div>
        )}
        {showImage ? (
          <img
            src={imageValue}
            alt={product.name}
            className="w-full h-full object-contain p-4"
          />
        ) : (
          <div className="flex flex-col items-center justify-center text-center p-4">
            <svg className="w-16 h-16 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: colors.border.faint }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="text-xs" style={{ color: colors.text.muted }}>No image</span>
          </div>
        )}
      </div>

      <div className="p-4 md:p-5 flex-1 flex flex-col" style={{ backgroundColor: '#131761' }}>
        <h3 className="font-semibold text-[20px] leading-tight line-clamp-2 text-white">
          {product.name}
        </h3>
        <p className="mt-1 text-xs" style={{ color: '#FFCC00' }}>{product.category} · SKU {product.sku || '-'}</p>

        <div className="mt-3 flex flex-wrap gap-1.5">
          {sizeVariant && sizeVariant.options.length > 0
            ? sizeVariant.options.map((option) => {
              const active = selectedOptions[sizeVariant.id] === option.id;
              return (
                <button
                  key={`${product.id}-${sizeVariant.id}-${option.id}`}
                  type="button"
                  onClick={() => setSelectedOptions((prev) => ({ ...prev, [sizeVariant.id]: option.id }))}
                  className="px-2 py-1 text-[10px] border text-white rounded-sm transition-all"
                  style={{ borderColor: active ? '#ffffff' : '#6C72B2', backgroundColor: active ? 'rgba(255,255,255,0.12)' : 'transparent' }}
                >
                  {option.name.toUpperCase()}
                </button>
              );
            })
            : sizes.map((size) => (
              <span key={`${product.id}-${size}`} className="px-2 py-1 text-[10px] border border-[#6C72B2] text-white rounded-sm">{size}</span>
            ))}
        </div>

        <div className="mt-2 text-[11px] text-[#BBC1E9] line-clamp-1">{product.description || 'No description'}</div>
        <div className="mt-1 flex items-center gap-1.5">
          {colorVariant && colorVariant.options.length > 0
            ? colorVariant.options.map((option) => {
              const active = selectedOptions[colorVariant.id] === option.id;
              return (
                <button
                  key={`${product.id}-${colorVariant.id}-${option.id}`}
                  type="button"
                  onClick={() => setSelectedOptions((prev) => ({ ...prev, [colorVariant.id]: option.id }))}
                  className="w-5 h-5 rounded-full border transition-all"
                  style={{
                    backgroundColor: colorFromName(option.name),
                    borderColor: active ? '#ffffff' : 'rgba(255,255,255,0.4)',
                    boxShadow: active ? '0 0 0 2px rgba(255,255,255,0.35)' : 'none',
                  }}
                  title={option.name}
                />
              );
            })
            : variantColors.map((color) => (
              <span
                key={`${product.id}-${color}`}
                className="w-5 h-5 rounded-full border border-white/40"
                style={{ backgroundColor: color }}
              />
            ))}
        </div>

        <div className="mt-auto pt-4 flex items-end justify-between">
          <p className="text-[16px] font-medium leading-none" style={{ color: '#FFCC00' }}>₱{Math.round(product.price).toLocaleString()}</p>
          <p className={`text-[16px] font-semibold ${visibleStock === 0 ? 'text-red-400' : lowStock ? 'text-orange-300' : 'text-white'}`}>
            Stock: {visibleStock}
          </p>
        </div>
      </div>
    </motion.div>
  );
};

const ProductDetailsModal = ({ product, onClose, colors }: {
  product?: Product;
  onClose: () => void;
  colors: ThemeColors;
}) => {
  const [currentImage, setCurrentImage] = useState(0);

  useEffect(() => {
    if (!product) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [product]);

  if (!product) return null;

  const gallery = (Array.isArray(product.images) && product.images.length > 0
    ? product.images
    : [product.image]
  ).filter((img) => isImageSource(String(img || '')));

  const hasGallery = gallery.length > 0;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[1000]"
      style={{ backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)' }}
      onClick={onClose}
    >
      <div className="absolute inset-0 flex items-center justify-center p-4 md:p-8">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="w-full max-w-4xl rounded-2xl border overflow-hidden"
          style={{ backgroundColor: colors.bg.card, borderColor: colors.border.faint }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="px-5 py-4 border-b flex items-center justify-between" style={{ borderColor: colors.border.faint }}>
            <h2 className="text-lg font-semibold" style={{ color: colors.text.primary }}>Product Details</h2>
            <button
              type="button"
              onClick={onClose}
              className="w-10 h-10 rounded-full flex items-center justify-center transition-colors hover:bg-black/10 dark:hover:bg-white/10"
              style={{ color: colors.text.muted }}
              title="Close"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
            <div className="p-5 border-b lg:border-b-0 lg:border-r" style={{ borderColor: colors.border.faint }}>
              <div className="rounded-xl overflow-hidden border relative" style={{ borderColor: colors.border.faint, backgroundColor: colors.bg.elevated, height: 320 }}>
                {hasGallery ? (
                  <img src={gallery[currentImage]} alt={product.name} className="w-full h-full object-contain" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-sm" style={{ color: colors.text.muted }}>
                    No image
                  </div>
                )}

                {hasGallery && gallery.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={() => setCurrentImage((i) => (i - 1 + gallery.length) % gallery.length)}
                      className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full text-white"
                      style={{ backgroundColor: 'rgba(0,0,0,0.45)' }}
                    >
                      <svg className="w-5 h-5 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.3} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      onClick={() => setCurrentImage((i) => (i + 1) % gallery.length)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full text-white"
                      style={{ backgroundColor: 'rgba(0,0,0,0.45)' }}
                    >
                      <svg className="w-5 h-5 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.3} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </>
                )}
              </div>

              {hasGallery && gallery.length > 1 && (
                <div className="flex gap-2 mt-3 overflow-x-auto">
                  {gallery.map((img, idx) => (
                    <button
                      type="button"
                      key={`${product.id}-thumb-${idx}`}
                      onClick={() => setCurrentImage(idx)}
                      className="w-14 h-14 rounded-lg overflow-hidden border flex-shrink-0"
                      style={{
                        borderColor: idx === currentImage ? '#3b82f6' : colors.border.faint,
                        backgroundColor: colors.bg.elevated,
                      }}
                    >
                      <img src={img} alt={`${product.name} ${idx + 1}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="p-5 space-y-4">
              <div>
                <p className="text-xs uppercase tracking-wide" style={{ color: colors.text.muted }}>Name</p>
                <p className="text-lg font-semibold" style={{ color: colors.text.primary }}>{product.name}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs uppercase tracking-wide" style={{ color: colors.text.muted }}>SKU</p>
                  <p style={{ color: '#FFCC00' }}>{product.sku || '-'}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide" style={{ color: colors.text.muted }}>Category</p>
                  <p style={{ color: '#FFCC00' }}>{product.category || '-'}</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <p className="text-xs uppercase tracking-wide" style={{ color: colors.text.muted }}>Price</p>
                  <p className="font-semibold" style={{ color: '#FFCC00' }}>₱{product.price.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide" style={{ color: colors.text.muted }}>Stock</p>
                  <p className="font-semibold" style={{ color: colors.text.primary }}>{product.stock}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide" style={{ color: colors.text.muted }}>Status</p>
                  <p className="font-semibold capitalize" style={{ color: colors.text.primary }}>{product.status}</p>
                </div>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide mb-1" style={{ color: colors.text.muted }}>Description</p>
                <p className="text-sm leading-6 whitespace-pre-wrap" style={{ color: colors.text.secondary }}>
                  {product.description || 'No description.'}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide" style={{ color: colors.text.muted }}>Created</p>
                <p className="text-sm" style={{ color: colors.text.secondary }}>
                  {new Date(product.createdAt).toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

function toDashboardStatus(status?: string): Product['status'] {
  const normalized = (status || '').toString().toLowerCase();
  if (normalized === 'active' || normalized === 'published') return 'active';
  if (normalized === 'inactive' || normalized === 'suspended') return 'inactive';
  return 'draft';
}

function toDashboardProduct(product: ApiProduct): Product {
  const images = Array.isArray(product.images)
    ? product.images.filter((img): img is string => typeof img === 'string' && img.trim().length > 0)
    : [];
  const variants: ProductVariant[] = Array.isArray(product.variants)
    ? product.variants
      .map((variant): ProductVariant => ({
        id: String(variant?.id || ''),
        name: String(variant?.name || ''),
        pricingMode: variant?.pricingMode === 'override' ? 'override' : 'modifier',
        options: Array.isArray(variant?.options)
          ? variant.options.map((option) => ({
            id: String(option?.id || ''),
            name: String(option?.name || ''),
            priceAdjustment: Number(option?.priceAdjustment || 0),
          }))
          : [],
      }))
      .filter((variant) => variant.id || variant.name || variant.options.length > 0)
    : [];
  const basePrice = typeof product.basePrice === 'number'
    ? product.basePrice
    : (typeof product.compareAtPrice === 'number' && product.compareAtPrice > 0
      ? product.compareAtPrice
      : (typeof product.price === 'number' ? product.price : 0));
  const finalPrice = typeof product.finalPrice === 'number'
    ? product.finalPrice
    : (typeof product.price === 'number' ? product.price : 0);
  const costPrice = typeof product.costPrice === 'number' ? product.costPrice : null;
  const priceRangeMin = typeof product.priceRangeMin === 'number' ? product.priceRangeMin : null;
  const priceRangeMax = typeof product.priceRangeMax === 'number' ? product.priceRangeMax : null;
  const discount = typeof product.discount === 'number' ? product.discount : 0;
  const discountType = product.discountType === 'fixed' ? 'fixed' : 'percentage';
  const hasVariants = typeof product.hasVariants === 'boolean' ? product.hasVariants : variants.length > 0;
  const variantStocks = product.variantStocks && typeof product.variantStocks === 'object'
    ? Object.entries(product.variantStocks).reduce<Record<string, number>>((acc, [key, value]) => {
      const parsed = Number(value);
      acc[key] = Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : 0;
      return acc;
    }, {})
    : {};

  return {
    id: product.id,
    name: product.name || 'Untitled Product',
    sku: product.sku || '',
    category: product.category || 'General',
    description: product.description || '',
    price: finalPrice,
    basePrice,
    costPrice,
    finalPrice,
    compareAtPrice: typeof product.compareAtPrice === 'number' ? product.compareAtPrice : null,
    discount,
    discountType,
    hasVariants,
    variants,
    variantStocks,
    priceRangeMin,
    priceRangeMax,
    stock: typeof product.stock === 'number' ? product.stock : 0,
    lowStockThreshold: typeof product.lowStockThreshold === 'number' ? product.lowStockThreshold : DEFAULT_LOW_STOCK_THRESHOLD,
    status: toDashboardStatus(product.status),
    image: images[0] || '[product]',
    images,
    createdAt: product.createdAt || new Date().toISOString(),
    sales: 0,
    revenue: 0,
  };
}

function normalizeSubdomain(value?: string | null): string {
  return (value || '').toString().trim().toLowerCase().replace(/[^a-z0-9-]/g, '');
}

export default function ProductsPage() {
  const { colors, theme } = useTheme();
  const { showConfirm, showAlert } = useAlert();
  const { selectedProject } = useProject();
  const selectedSubdomain = normalizeSubdomain(selectedProject?.subdomain);
  const blockedAddProductMessage = !selectedSubdomain
    ? 'Set a subdomain for this website first to manage products.'
    : null;
  const canAddProducts = Boolean(selectedSubdomain);
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortMode, setSortMode] = useState<'status' | 'price-desc' | 'stock-desc'>('status');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | undefined>();
  const [viewingProduct, setViewingProduct] = useState<Product | undefined>();
  const [perPage, setPerPage] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [productPopup, setProductPopup] = useState<ProductPopupState>({
    open: false,
    message: '',
    tone: 'success',
  });
  const productPopupTimerRef = useRef<number | null>(null);

  const showProductPopup = useCallback((message: string, tone: 'success' | 'error' = 'success') => {
    if (productPopupTimerRef.current) {
      window.clearTimeout(productPopupTimerRef.current);
    }

    setProductPopup({ open: true, message, tone });

    productPopupTimerRef.current = window.setTimeout(() => {
      setProductPopup((prev) => ({ ...prev, open: false }));
      productPopupTimerRef.current = null;
    }, 3000);
  }, []);

  useEffect(() => {
    return () => {
      if (productPopupTimerRef.current) {
        window.clearTimeout(productPopupTimerRef.current);
      }
    };
  }, []);

  const loadProducts = useCallback(async () => {
    setLoadingProducts(true);
    if (!canAddProducts) {
      setProducts([]);
      setLoadingProducts(false);
      return;
    }
    try {
      const res = await listProducts({
        subdomain: selectedSubdomain,
        page: 1,
        limit: 500,
      });
      if (res?.success && Array.isArray(res.items)) {
        setProducts(res.items.map(toDashboardProduct));
      } else {
        setProducts([]);
      }
    } catch (error) {
      setProducts([]);
      showAlert(error instanceof Error ? error.message : 'Failed to load products', 'error');
    } finally {
      setLoadingProducts(false);
    }
  }, [canAddProducts, selectedSubdomain, showAlert]);

  useEffect(() => {
    void loadProducts();
  }, [loadProducts]);

  const categories = ['All', ...Array.from(new Set(products.map((product) => product.category))).sort()];

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.sku.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const statusRank = (status: Product['status']) => {
    if (status === 'active') return 0;
    if (status === 'inactive') return 2;
    return 1;
  };

  const sortedFilteredProducts = [...filteredProducts].sort((a, b) => {
    if (sortMode === 'price-desc') return b.price - a.price;
    if (sortMode === 'stock-desc') return b.stock - a.stock;
    return statusRank(a.status) - statusRank(b.status);
  });

  const totalPages = Math.max(1, Math.ceil(sortedFilteredProducts.length / perPage));
  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [totalPages, currentPage]);

  const startIndex = (currentPage - 1) * perPage;
  const endIndex = startIndex + perPage;
  const paginatedProducts = sortedFilteredProducts.slice(startIndex, endIndex);

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setShowAddModal(true);
  };

  const handleView = (product: Product) => {
    setViewingProduct(product);
  };

  const handleDelete = async (product: Product) => {
    const confirmed = await showConfirm(`Are you sure you want to delete ${product.name}?`);
    if (!confirmed) return;
    try {
      await deleteProduct(product.id);
      await loadProducts();
      showAlert('Product deleted successfully', 'success');
    } catch (error) {
      showAlert(error instanceof Error ? error.message : 'Failed to delete product', 'error');
    }
  };


  const handleSaveProduct = async (productData: Partial<Product> & Record<string, unknown>): Promise<boolean> => {
    try {
      let shouldShowAddedPopup = false;
      const rawVariants = Array.isArray(productData.variants) ? productData.variants : [];
      const variants: ProductVariant[] = rawVariants
        .map((variant): ProductVariant => {
          const optionsRaw = Array.isArray((variant as { options?: unknown[] })?.options)
            ? (variant as { options: unknown[] }).options
            : [];
          const options = optionsRaw
            .map((option) => ({
              id: String((option as { id?: string })?.id || ''),
              name: String((option as { name?: string })?.name || '').trim(),
              priceAdjustment: Number((option as { priceAdjustment?: number })?.priceAdjustment || 0),
            }))
            .filter((option) => option.name || option.priceAdjustment !== 0);
          return {
            id: String((variant as { id?: string })?.id || ''),
            name: String((variant as { name?: string })?.name || '').trim(),
            pricingMode: (variant as { pricingMode?: string })?.pricingMode === 'override' ? 'override' : 'modifier',
            options,
          };
        })
        .filter((variant) => variant.name || variant.options.length > 0);

      const basePrice = Number(productData.basePrice ?? productData.price ?? 0);
      const finalPrice = Number(productData.finalPrice ?? productData.price ?? 0);
      const discount = Number(productData.discount || 0);
      const discountType = String(productData.discountType || 'percentage') === 'fixed' ? 'fixed' : 'percentage';
      const hasVariants = Boolean(productData.hasVariants) && variants.length > 0;
      const variantStocks = hasVariants && productData.variantStocks && typeof productData.variantStocks === 'object'
        ? Object.entries(productData.variantStocks as Record<string, unknown>).reduce<Record<string, number>>((acc, [key, value]) => {
          const parsed = Number(value);
          acc[key] = Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : 0;
          return acc;
        }, {})
        : {};
      const priceRangeMin = hasVariants
        ? Number(productData.priceRangeMin ?? finalPrice)
        : finalPrice;
      const priceRangeMax = hasVariants
        ? Number(productData.priceRangeMax ?? finalPrice)
        : finalPrice;
      const computedStock = hasVariants
        ? Object.values(variantStocks).reduce((sum, amount) => sum + amount, 0)
        : Number(productData.stock || 0);
      const normalizedLowStockThreshold = Math.max(
        0,
        Number.isFinite(Number(productData.lowStockThreshold))
          ? Number(productData.lowStockThreshold)
          : DEFAULT_LOW_STOCK_THRESHOLD
      );

      const payload: ProductUpsertPayload = {
        name: String(productData.name || ''),
        sku: String(productData.sku || ''),
        category: String(productData.category || ''),
        description: String(productData.description || ''),
        price: finalPrice,
        basePrice,
        costPrice: productData.costPrice !== undefined ? Number(productData.costPrice || 0) : null,
        finalPrice,
        compareAtPrice: discount > 0 ? basePrice : null,
        discount,
        discountType,
        hasVariants,
        variants: hasVariants ? variants : [],
        variantStocks: hasVariants ? variantStocks : {},
        priceRangeMin,
        priceRangeMax,
        stock: computedStock,
        lowStockThreshold: normalizedLowStockThreshold,
        status: toDashboardStatus(String(productData.status || 'draft')),
        images: Array.isArray(productData.images) ? (productData.images as string[]) : [],
      };

      if (editingProduct) {
        await updateProduct(editingProduct.id, payload);
      } else {
        if (!selectedSubdomain) {
          showAlert('Set a subdomain for this website first to manage products.', 'error');
          return false;
        }
        await createProduct({
          subdomain: selectedSubdomain,
          ...payload,
          slug: payload.name.toLowerCase().replace(/\s+/g, '-'),
        });
        shouldShowAddedPopup = true;
      }

      await loadProducts();
      setShowAddModal(false);
      setEditingProduct(undefined);
      if (shouldShowAddedPopup) {
        showProductPopup('Product added successfully!', 'success');
      }
      return true;
    } catch (error) {
      showAlert(error instanceof Error ? error.message : 'Failed to save product', 'error');
      return false;
    }
  };

  const hasProducts = products.length > 0;

  return (
    <div className="space-y-6">
      <AnimatePresence>
        {productPopup.open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[1200] flex items-center justify-center p-4"
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.35)', backdropFilter: 'blur(4px)' }}
          >
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="w-auto max-w-sm rounded-xl border px-4 py-3 shadow-xl"
              style={{
                backgroundColor: colors.bg.card,
                borderColor: colors.border.faint,
              }}
            >
              <p className="text-sm text-center" style={{ color: productPopup.tone === 'success' ? '#ffffff' : '#ef4444' }}>
                {productPopup.message}
              </p>
              {productPopup.tone === 'success' && (
                <div className="mt-2 flex justify-center">
                  <CheckCircle className="w-5 h-5" style={{ color: '#22c55e' }} />
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <section className="pt-4 pb-2">
        <div className="text-center">
          <h1 className="text-5xl sm:text-6xl font-extrabold tracking-tight text-white">
            My{' '}
            <span
              style={{
                backgroundImage: 'linear-gradient(90deg, #6702BF 14%, #B36760 48%, #FFCC00 78%)',
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              Products
            </span>
          </h1>
          <p className="mt-2 text-xl" style={{ color: '#8A8FC4' }}>Track stock performance and catalog details.</p>
        </div>

        <div className="mt-8 max-w-4xl mx-auto rounded-2xl border px-5 py-3.5 flex items-center gap-3 bg-[#141446] border-[#1F1F51] [box-shadow:inset_0_0_0_1px_rgba(255,255,255,0.03),0_10px_40px_rgba(16,11,62,0.45)]">
          <svg viewBox="0 0 20 20" className="h-4 w-4 shrink-0" fill="none" style={{ color: colors.accent.yellow }}>
            <path d="M14.3 14.3L18 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            <circle cx="8.75" cy="8.75" r="5.75" stroke="currentColor" strokeWidth="1.8" />
          </svg>
          <input
            type="text"
            placeholder="Search templates, designs, or actions"
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            className="w-full bg-transparent outline-none text-base text-white placeholder:text-[#6F70A8]"
          />
        </div>

        {blockedAddProductMessage && (
          <p className="mt-3 text-center text-xs" style={{ color: '#8A8FC4' }}>{blockedAddProductMessage}</p>
        )}
      </section>

      {loadingProducts ? (
        <section className="text-center py-16 rounded-2xl border" style={{ backgroundColor: colors.bg.card, borderColor: colors.border.faint }}>
          <p style={{ color: colors.text.secondary }}>Loading products...</p>
        </section>
      ) : hasProducts ? (
        <>
          <div id="inventory-section" className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4 mb-2">
            <div className="flex items-center gap-2">
              <select
                value={selectedCategory}
                onChange={(e) => { setSelectedCategory(e.target.value); setCurrentPage(1); }}
                className="h-11 px-4 rounded-xl border text-sm min-w-[150px]"
                style={{ backgroundColor: '#141446', borderColor: '#2D3A90', color: '#ffffff' }}
              >
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>

              <button
                type="button"
                onClick={() => setShowAddModal(true)}
                disabled={!canAddProducts}
                className={`h-11 px-3 rounded-xl border flex items-center justify-center gap-2 ${canAddProducts ? 'hover:opacity-90' : 'opacity-50 cursor-not-allowed'}`}
                style={{ backgroundColor: '#141446', borderColor: '#2D3A90' }}
                title="Add product"
              >
                <img src="/icons/products/add%20product.png" alt="Add" className="h-5 w-5" />
                <span className="text-xs font-semibold text-white">Add</span>
              </button>

              <button
                type="button"
                onClick={() => document.getElementById('products-grid')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                className="h-11 px-3 rounded-xl border flex items-center justify-center gap-2 hover:opacity-90"
                style={{ backgroundColor: '#141446', borderColor: '#2D3A90' }}
                title="Manage products"
              >
                <img src="/icons/products/product-management.png" alt="Manage" className="h-5 w-5" />
                <span className="text-xs font-semibold text-white">Manage</span>
              </button>
            </div>

            <div className="flex items-center justify-center gap-2" style={{ color: '#D2D6F7' }}>
              <button type="button" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="h-8 w-8 rounded-full disabled:opacity-40">‹</button>
              {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
                const page = i + 1;
                const active = page === currentPage;
                return (
                  <button
                    key={`page-dot-${page}`}
                    type="button"
                    onClick={() => setCurrentPage(page)}
                    className={`h-8 w-8 rounded-full text-sm ${active ? 'bg-white/20 text-white' : 'bg-[#1A2165] text-[#BBC1E9]'}`}
                  >
                    {page}
                  </button>
                );
              })}
              {totalPages > 5 && <span className="px-1">...</span>}
              {totalPages > 5 && (
                <button type="button" onClick={() => setCurrentPage(totalPages)} className={`h-8 w-8 rounded-full text-sm ${currentPage === totalPages ? 'bg-white/20 text-white' : 'bg-[#1A2165] text-[#BBC1E9]'}`}>{totalPages}</button>
              )}
              <button type="button" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="h-8 w-8 rounded-full disabled:opacity-40">›</button>
            </div>

            <div className="flex items-center gap-2 justify-end">
              <button
                type="button"
                onClick={() => setSortMode((prev) => prev === 'price-desc' ? 'stock-desc' : prev === 'stock-desc' ? 'status' : 'price-desc')}
                className="h-11 w-11 rounded-xl border flex items-center justify-center hover:opacity-90"
                style={{ backgroundColor: '#141446', borderColor: '#2D3A90' }}
                title="Sort products"
              >
                <img src="/icons/products/Sort%20Amount%20Up.png" alt="Sort" className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={() => setPerPage((p) => p === 10 ? 15 : p === 15 ? 20 : 10)}
                className="h-11 w-11 rounded-xl border flex items-center justify-center hover:opacity-90"
                style={{ backgroundColor: '#141446', borderColor: '#2D3A90' }}
                title="Toggle density"
              >
                <img src="/icons/products/Bulleted%20List.png" alt="List" className="h-5 w-5" />
              </button>
            </div>
          </div>

          {filteredProducts.length > 0 ? (
            <>
              <div id="products-grid" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 md:gap-5 lg:gap-6">
                <AnimatePresence>
                  {paginatedProducts.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      colors={colors}
                      onView={handleView}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                      isTransitioningOut={false}
                    />
                  ))}
                </AnimatePresence>
              </div>
            </>
          ) : (
            <section className="text-center py-16 rounded-2xl border" style={{ backgroundColor: colors.bg.card, borderColor: colors.border.faint }}>
              <div className="mx-auto w-14 h-14 rounded-2xl border flex items-center justify-center" style={{ borderColor: colors.border.default, backgroundColor: colors.bg.elevated }}>
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: colors.text.muted }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M20 7.5L12 3 4 7.5M20 7.5v9L12 21m8-13.5L12 12M4 7.5v9L12 21M4 7.5L12 12" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mt-5 mb-2" style={{ color: colors.text.primary }}>
                No matching products
              </h3>
              <p style={{ color: colors.text.secondary }}>
                Try changing search or category filters.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearchTerm('');
                  setSelectedCategory('All');
                  setCurrentPage(1);
                }}
                className="mt-5 px-4 py-2 rounded-lg border text-sm"
                style={{ borderColor: colors.border.faint, color: colors.text.primary, backgroundColor: colors.bg.elevated }}
              >
                Clear filters
              </button>
            </section>
          )}
        </>
      ) : (
        <section className="text-center py-20 rounded-2xl border" style={{ backgroundColor: colors.bg.card, borderColor: colors.border.faint }}>
          <div className="mx-auto w-16 h-16 rounded-2xl border flex items-center justify-center" style={{ borderColor: colors.border.default, backgroundColor: colors.bg.elevated }}>
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: colors.text.muted }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M20 7.5L12 3 4 7.5M20 7.5v9L12 21m8-13.5L12 12M4 7.5v9L12 21M4 7.5L12 12" />
            </svg>
          </div>
          <h3 className="text-2xl font-semibold mt-5 mb-2" style={{ color: colors.text.primary }}>
            No products yet
          </h3>
          <p className="max-w-md mx-auto" style={{ color: colors.text.secondary }}>
            {canAddProducts
              ? 'Start by adding your first product to build your inventory.'
              : blockedAddProductMessage}
          </p>
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            disabled={!canAddProducts}
            className={`mt-6 mx-auto px-4 py-2.5 rounded-lg text-white font-medium transition-colors shadow-sm ${canAddProducts ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-400 cursor-not-allowed'}`}
          >
            {canAddProducts ? 'Add your first product' : 'Publish website first'}
          </button>
        </section>
      )}

      <ProductAddModal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          setEditingProduct(undefined);
        }}
        onSave={handleSaveProduct}
        editingProduct={editingProduct}
        uploadSubdomain={selectedSubdomain}
        projectIndustry={selectedProject?.industry || null}
      />

      <AnimatePresence>
        {viewingProduct && (
          <ProductDetailsModal
            key={viewingProduct.id}
            product={viewingProduct}
            onClose={() => setViewingProduct(undefined)}
            colors={colors}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
