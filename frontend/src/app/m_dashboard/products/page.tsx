'use client';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { createPortal } from 'react-dom';
import { AlertTriangle, CheckCircle } from 'lucide-react';
import { useTheme } from '../components/context/theme-context';
import { useAlert } from '../components/context/alert-context';
import { useProject } from '../components/context/project-context';
import { type Product, type ProductVariant } from '../lib/productsData';
import { createProduct, deleteProduct, listProducts, updateProduct, type ApiProduct } from '@/lib/api';
import { SearchBar } from '../components/ui/searchbar';
import ProductAddModal from './components/productAddModal';
import ProductEditModal from './components/productEditModal';
import { StatsAnalytics } from './components/statsAnalytics';
import { ProductsDropdown } from './components/productsDropdown';
import { ProductCard } from './components/productContainer';
import { ProductDetailsModal } from './components/viewProductDetails';
import { PaginationControls } from './components/paginationControls';
import { EmptyStates } from './components/emptyStates';
import { ProductListView } from './components/productListView';

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

function formatProductPrice(product: Product): string {
  const priceRangeMin = Number(product.priceRangeMin);
  const priceRangeMax = Number(product.priceRangeMax);
  const hasPriceRange = Number.isFinite(priceRangeMin)
    && Number.isFinite(priceRangeMax)
    && priceRangeMin >= 0
    && priceRangeMax >= 0
    && priceRangeMax >= priceRangeMin;

  if (hasPriceRange) {
    if (priceRangeMin === priceRangeMax) return `P${Math.round(priceRangeMin).toLocaleString()}.00`;
    return `P${Math.round(priceRangeMin).toLocaleString()} - P${Math.round(priceRangeMax).toLocaleString()}`;
  }

  return `P${Math.round(Number(product.price || 0)).toLocaleString()}.00`;
}

function getVariantLabelsForList(product: Product): string[] {
  const groups = getVariantGroups(product);
  if (groups.length === 0) return ['NO VARIANT'];

  if (groups.length === 1) {
    const options = groups[0]?.options?.map((o) => String(o.name || '').trim()).filter(Boolean) || [];
    if (options.length <= 3) return options;
    return [...options.slice(0, 2), `+${options.length - 2}`];
  }

  const firstGroup = groups[0];
  const options = firstGroup?.options?.map((o) => String(o.name || '').trim()).filter(Boolean) || [];
  if (options.length === 0) return [`${groups.length} VARIANTS`];
  if (options.length <= 2) return options;
  return [...options.slice(0, 1), `+${options.length - 1}`];
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

function getCombinationPrice(product: Product, selectedOptions: Record<string, string>): number | null {
  if (!product.hasVariants || !product.variantPrices) return null;
  const groups = getVariantGroups(product);
  if (groups.length === 0) return null;
  const stockKey = buildVariantStockKey(groups, selectedOptions);
  if (!stockKey) return null;
  const value = Number(product.variantPrices[stockKey]);
  return Number.isFinite(value) && value >= 0 ? value : null;
}

function getSelectedVariantImage(product: Product, selectedOptions: Record<string, string>): string | null {
  const groups = getVariantGroups(product);
  for (const variant of groups) {
    if (variant.name.trim().toLowerCase() === 'size') continue;
    const selectedOptionId = selectedOptions[variant.id];
    if (!selectedOptionId) continue;
    const selectedOption = variant.options.find((option) => option.id === selectedOptionId);
    const image = String(selectedOption?.image || '').trim();
    if (isImageSource(image)) return image;
  }
  return null;
}

function getVariantOptionImages(product: Product): string[] {
  const seen = new Set<string>();
  const images: string[] = [];

  for (const variant of getVariantGroups(product)) {
    for (const option of variant.options) {
      const image = String(option?.image || '').trim();
      if (!isImageSource(image) || seen.has(image)) continue;
      seen.add(image);
      images.push(image);
    }
  }

  return images;
}

function colorFromName(value: string): string {
  const trimmed = value.trim();
  if (/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(trimmed)) return trimmed;
  const palette = ['#EAE3F9', '#F23939', '#2F49D8', '#D81CBF', '#22c55e', '#f59e0b', '#14b8a6'];
  const hash = Array.from(trimmed.toLowerCase()).reduce((sum, ch) => sum + ch.charCodeAt(0), 0);
  return palette[hash % palette.length];
}

type ThemeColors = ReturnType<typeof useTheme>['colors'];

function toDashboardStatus(status?: string): Product['status'] {
  const normalized = (status || '').toString().toLowerCase();
  if (normalized === 'active' || normalized === 'published') return 'active';
  if (normalized === 'inactive' || normalized === 'suspended') return 'inactive';
  return 'draft';
}

function toDashboardProduct(product: ApiProduct): Product {
  const productRecord = product as ApiProduct & {
    subCategory?: unknown;
    sub_category?: unknown;
    details?: { subcategory?: unknown; subCategory?: unknown; sub_category?: unknown };
    specifications?: { subcategory?: unknown; subCategory?: unknown; sub_category?: unknown };
  };
  const normalizedSubcategory = String(
    product.subcategory
    ?? productRecord.subCategory
    ?? productRecord.sub_category
    ?? productRecord.details?.subcategory
    ?? productRecord.details?.subCategory
    ?? productRecord.details?.sub_category
    ?? productRecord.specifications?.subcategory
    ?? productRecord.specifications?.subCategory
    ?? productRecord.specifications?.sub_category
    ?? ''
  ).trim();
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
          ? variant.options.map((option) => {
            const optionRecord = option as {
              id?: unknown;
              name?: unknown;
              priceAdjustment?: unknown;
              image?: unknown;
              imageUrl?: unknown;
              image_url?: unknown;
              imgUrl?: unknown;
              img_url?: unknown;
            };
            return {
              id: String(optionRecord?.id || ''),
              name: String(optionRecord?.name || ''),
              priceAdjustment: Number(optionRecord?.priceAdjustment || 0),
              image: String(
                optionRecord?.image
                ?? optionRecord?.imageUrl
                ?? optionRecord?.image_url
                ?? optionRecord?.imgUrl
                ?? optionRecord?.img_url
                ?? ''
              ).trim(),
            };
          })
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
  const variantPrices = product.variantPrices && typeof product.variantPrices === 'object'
    ? Object.entries(product.variantPrices).reduce<Record<string, number>>((acc, [key, value]) => {
      const parsed = Number(value);
      acc[key] = Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
      return acc;
    }, {})
    : {};
  const normalizedStock = typeof product.onHandStock === 'number'
    ? product.onHandStock
    : (typeof product.stock === 'number' ? product.stock : 0);

  return {
    id: product.id,
    name: product.name || 'Untitled Product',
    sku: product.sku || '',
    category: product.category || 'General',
    subcategory: normalizedSubcategory,
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
    variantPrices,
    priceRangeMin,
    priceRangeMax,
    stock: normalizedStock,
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
  const { selectedProject, loading: projectLoading } = useProject();
  const selectedSubdomain = normalizeSubdomain(selectedProject?.subdomain);
  const blockedAddProductMessage = !selectedSubdomain
    ? 'Set a subdomain for this website first to manage products.'
    : null;
  const canAddProducts = Boolean(selectedSubdomain);
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [viewMode, setViewMode] = useState<'tile' | 'list'>('tile');
  const [showCategoryFilterMenu, setShowCategoryFilterMenu] = useState(false);
  const [showStatusFilterMenu, setShowStatusFilterMenu] = useState(false);
  const statusMenuRef = useRef<HTMLDivElement | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | undefined>();
  const [viewingProduct, setViewingProduct] = useState<Product | undefined>();
  const [openMenuProductId, setOpenMenuProductId] = useState<string | null>(null);
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

    const popupDuration = tone === 'success' ? 1500 : 3000;

    productPopupTimerRef.current = window.setTimeout(() => {
      setProductPopup((prev) => ({ ...prev, open: false }));
      productPopupTimerRef.current = null;
    }, popupDuration);
  }, []);

  useEffect(() => {
    return () => {
      if (productPopupTimerRef.current) {
        window.clearTimeout(productPopupTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!showStatusFilterMenu && !showCategoryFilterMenu) return;
    const onMouseDown = (event: MouseEvent) => {
      const target = event.target as Node | null;
      if (!target) return;
      if (statusMenuRef.current?.contains(target)) return;
      setShowCategoryFilterMenu(false);
      setShowStatusFilterMenu(false);
    };
    document.addEventListener('mousedown', onMouseDown);
    return () => document.removeEventListener('mousedown', onMouseDown);
  }, [showStatusFilterMenu, showCategoryFilterMenu]);

  useEffect(() => {
    if (!openMenuProductId) return;
    const onMouseDown = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target) return;
      if (target.closest('[data-product-menu-root="true"]')) return;
      setOpenMenuProductId(null);
    };
    document.addEventListener('mousedown', onMouseDown);
    return () => document.removeEventListener('mousedown', onMouseDown);
  }, [openMenuProductId]);

  const loadProducts = useCallback(async () => {
    if (projectLoading) {
      setLoadingProducts(true);
      return;
    }
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
  }, [projectLoading, canAddProducts, selectedSubdomain, showAlert]);

  useEffect(() => {
    void loadProducts();
  }, [loadProducts]);

  const handleRefreshOnFocus = useCallback(() => {
    if (showAddModal || Boolean(editingProduct) || Boolean(viewingProduct)) return;
    void loadProducts();
  }, [showAddModal, editingProduct, viewingProduct, loadProducts]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (showAddModal || Boolean(editingProduct) || Boolean(viewingProduct)) return;
      if (document.visibilityState === 'visible') {
        void loadProducts();
      }
    };

    window.addEventListener('focus', handleRefreshOnFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      window.removeEventListener('focus', handleRefreshOnFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [loadProducts, handleRefreshOnFocus, showAddModal, editingProduct, viewingProduct]);

  const subcategoryCounts = products.reduce<Record<string, number>>((acc, product) => {
    const subcategory = String(product.subcategory || '').trim();
    if (!subcategory) return acc;
    acc[subcategory] = (acc[subcategory] || 0) + 1;
    return acc;
  }, {});

  const subcategoryOptions = Object.keys(subcategoryCounts).sort();

  const filterOptions = [
    { value: 'all', label: `All (${products.length})` },
    ...subcategoryOptions.map((subcategory) => ({
      value: `subcategory:${subcategory}`,
      label: `${subcategory} (${subcategoryCounts[subcategory]})`,
    })),
  ];

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.sku.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all'
      || (selectedCategory.startsWith('subcategory:')
        && String(product.subcategory || '').trim() === selectedCategory.slice('subcategory:'.length));
    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'active' && product.status === 'active') ||
      (statusFilter === 'inactive' && product.status === 'inactive');
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const sortedFilteredProducts = [...filteredProducts];

  const totalPages = Math.max(1, Math.ceil(sortedFilteredProducts.length / perPage));
  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [totalPages, currentPage]);

  const startIndex = (currentPage - 1) * perPage;
  const endIndex = startIndex + perPage;
  const paginatedProducts = sortedFilteredProducts.slice(startIndex, endIndex);

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setShowAddModal(false);
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
      showProductPopup('Product deleted successfully!', 'success');
    } catch (error) {
      showAlert(error instanceof Error ? error.message : 'Failed to delete product', 'error');
    }
  };


  const handleSaveProduct = async (productData: Partial<Product> & Record<string, unknown>): Promise<boolean> => {
    try {
      let successMessage: string | null = null;
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
              image: String((option as { image?: string })?.image || '').trim(),
            }))
            .filter((option) => option.name || option.priceAdjustment !== 0 || option.image);
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
      const compareAtPriceRaw = productData.compareAtPrice;
      const compareAtPrice = compareAtPriceRaw === null || compareAtPriceRaw === undefined
        ? null
        : (() => {
          const parsed = Number(compareAtPriceRaw);
          return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
        })();
      const discountType = String(productData.discountType || 'percentage') === 'fixed' ? 'fixed' : 'percentage';
      const hasVariants = Boolean(productData.hasVariants) && variants.length > 0;
      const variantStocks = hasVariants && productData.variantStocks && typeof productData.variantStocks === 'object'
        ? Object.entries(productData.variantStocks as Record<string, unknown>).reduce<Record<string, number>>((acc, [key, value]) => {
          const parsed = Number(value);
          acc[key] = Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : 0;
          return acc;
        }, {})
        : {};
      const variantPrices = hasVariants && productData.variantPrices && typeof productData.variantPrices === 'object'
        ? Object.entries(productData.variantPrices as Record<string, unknown>).reduce<Record<string, number>>((acc, [key, value]) => {
          const parsed = Number(value);
          acc[key] = Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
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
        subcategory: String(productData.subcategory || ''),
        subCategory: String(productData.subcategory || ''),
        sub_category: String(productData.subcategory || ''),
        description: String(productData.description || ''),
        price: finalPrice,
        basePrice,
        costPrice: productData.costPrice !== undefined ? Number(productData.costPrice || 0) : null,
        finalPrice,
        compareAtPrice,
        discount,
        discountType,
        hasVariants,
        variants: hasVariants ? variants : [],
        variantStocks: hasVariants ? variantStocks : {},
        variantPrices: hasVariants ? variantPrices : {},
        priceRangeMin,
        priceRangeMax,
        stock: computedStock,
        lowStockThreshold: normalizedLowStockThreshold,
        status: toDashboardStatus(String(productData.status || 'draft')),
        images: Array.isArray(productData.images) ? (productData.images as string[]) : [],
      };

      if (editingProduct) {
        await updateProduct(editingProduct.id, payload);
        successMessage = 'Product updated successfully!';
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
        successMessage = 'Product added successfully!';
      }

      await loadProducts();
      setShowAddModal(false);
      setEditingProduct(undefined);
      if (successMessage) {
        showProductPopup(successMessage, 'success');
      }
      return true;
    } catch (error) {
      showAlert(error instanceof Error ? error.message : 'Failed to save product', 'error');
      return false;
    }
  };

  const hasProducts = products.length > 0;
  const productInsights = {
    active: products.filter((product) => product.status === 'active').length,
    inactive: products.filter((product) => product.status === 'inactive').length,
  };

  return (
    <div className="dashboard-landing-light space-y-6">
      {typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {productPopup.open && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-[2147483000] flex items-center justify-center p-4"
              style={{ backgroundColor: 'rgba(10, 8, 28, 0.6)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }}
            >
              <motion.div
                initial={{ opacity: 0, y: 12, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.98 }}
                transition={{ type: 'spring', stiffness: 280, damping: 26 }}
                className="w-full max-w-[250px] rounded-[14px] border px-4 py-3 shadow-xl"
                style={{
                  backgroundColor: '#181a59',
                  borderColor: productPopup.tone === 'success' ? 'rgba(74,222,128,0.25)' : 'rgba(239,68,68,0.35)',
                  boxShadow: '0 10px 28px rgba(0,0,0,0.5)',
                }}
              >
                <p className="text-center" style={{ color: '#ffffff', fontSize: 'clamp(12px, 1.4vw, 16px)', fontWeight: 700, letterSpacing: -0.1, lineHeight: 1.25 }}>
                  {productPopup.message}
                </p>
                <div className="mt-2 flex justify-center">
                  {productPopup.tone === 'success'
                    ? <CheckCircle className="w-6 h-6" style={{ color: '#22c55e' }} />
                    : <AlertTriangle className="w-6 h-6" style={{ color: '#ef4444' }} />}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}

      <section className="max-w-[1090px] mx-auto pt-6 pb-2">
        <div className="text-center">
          <h1
            className="text-[clamp(34px,5vw,56px)] font-extrabold tracking-[-1.8px] leading-[1.2]"
            style={{ color: colors.text.primary }}
          >
            My{' '}
            <span
              className={`inline-block bg-clip-text text-transparent bg-gradient-to-r ${theme === 'dark' ? 'from-[#7c3aed] via-[#d946ef] to-[#ffcc00]' : 'from-[#7c3aed] via-[#d946ef] to-[#f5a213]'}`}
              style={{ paddingBottom: '0.1em', marginBottom: '-0.1em' }}
            >
              Products
            </span>
          </h1>
          <p className="mt-2 text-sm" style={{ color: colors.text.secondary }}>Track stock performance and catalog details.</p>
        </div>

        <SearchBar
          value={searchTerm}
          onChange={(value) => { setSearchTerm(value); setCurrentPage(1); }}
          theme={theme}
          placeholder="Search templates, designs, or actions"
          className="mt-6 mb-7 max-w-[860px] mx-auto"
        />

        {blockedAddProductMessage && (
          <p className="mt-2 text-center text-xs" style={{ color: '#8A8FC4' }}>{blockedAddProductMessage}</p>
        )}

        <StatsAnalytics productInsights={productInsights} />
      </section>

      {loadingProducts ? (
        <section className="max-w-[1090px] mx-auto text-center py-16 rounded-2xl border" style={{ backgroundColor: colors.bg.card, borderColor: colors.border.faint }}>
          <p style={{ color: colors.text.secondary }}>Loading products...</p>
        </section>
      ) : hasProducts ? (
        <>
          <div id="inventory-section" className="max-w-[1090px] mx-auto mb-5">
            <div className="flex items-center justify-between gap-[10px] flex-wrap">
              <div className="flex items-center gap-2 justify-start">
                <ProductsDropdown
                  selectedCategory={selectedCategory}
                  onCategoryChange={(category) => {
                    setSelectedCategory(category);
                    setCurrentPage(1);
                  }}
                  filterOptions={filterOptions}
                  showMenu={showCategoryFilterMenu}
                  onMenuToggle={setShowCategoryFilterMenu}
                />

                <button
                  type="button"
                  onClick={() => setShowAddModal(true)}
                  disabled={!canAddProducts}
                  className={`h-[46px] px-4 rounded-xl border flex items-center justify-center text-[13px] font-bold ${canAddProducts ? 'hover:opacity-90' : 'opacity-50 cursor-not-allowed'}`}
                  style={{ background: 'linear-gradient(90deg, #9333ea 0%, #ec4899 100%)', borderColor: 'transparent', color: '#ffffff' }}
                  title="Add product"
                >
                  + Add Product
                </button>
              </div>

              <div className="flex items-center gap-2 justify-end">
                <div ref={statusMenuRef} className="relative">
                  <button
                    type="button"
                    onClick={() => setShowStatusFilterMenu((prev) => !prev)}
                    className={`h-[48px] w-[48px] cursor-pointer rounded-2xl border flex items-center justify-center transition-all duration-300 ${showStatusFilterMenu ? 'shadow-md scale-105' : 'hover:scale-105'} ${theme === 'light' ? 'admin-dashboard-panel-soft border-0' : ''}`}
                    style={{ 
                      backgroundColor: showStatusFilterMenu && theme === 'light' ? '#14034A' : (theme === 'light' ? undefined : colors.bg.card),
                      borderColor: theme === 'light' ? undefined : '#1F1F51',
                      boxShadow: theme === 'dark' ? '0 0 12px rgba(31,31,81,0.4)' : undefined,
                      color: showStatusFilterMenu && theme === 'light' ? '#FFFFFF' : (theme === 'light' ? '#14034A' : '#FFCE00')
                    }}
                    title="Filter products"
                  >
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                  {showStatusFilterMenu && (
                    <div
                      className="absolute right-0 top-full mt-2 w-56 rounded-xl border p-2 z-30"
                      style={{ backgroundColor: '#141446', borderColor: '#2D3A90' }}
                    >
                      {[
                        { value: 'all', label: 'All' },
                        { value: 'active', label: 'Active' },
                        { value: 'inactive', label: 'Inactive' },
                      ].map((item) => {
                        const checked = statusFilter === item.value;
                        return (
                          <button
                            key={item.value}
                            type="button"
                            onClick={() => {
                              setStatusFilter(item.value as typeof statusFilter);
                              setCurrentPage(1);
                              setShowStatusFilterMenu(false);
                            }}
                            className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm hover:bg-white/5"
                            style={{ color: '#D2D6F7' }}
                          >
                            <span>{item.label}</span>
                            <span>{checked ? '✓' : ''}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => setViewMode((prev) => (prev === 'tile' ? 'list' : 'tile'))}
                  className={`h-12 w-12 rounded-2xl border inline-flex items-center justify-center transition-all duration-300 ${viewMode === 'list' ? 'shadow-md scale-105' : 'hover:scale-105 opacity-70'}`}
                  style={{ 
                    borderColor: viewMode === 'list' ? 'transparent' : colors.border.faint, 
                    backgroundColor: viewMode === 'list' 
                      ? (theme === 'light' ? '#14034A' : colors.accent.purple) 
                      : (theme === 'light' ? 'rgba(255,255,255,0.72)' : colors.bg.card), 
                    color: viewMode === 'list' ? '#FFFFFF' : (theme === 'light' ? '#14034A' : colors.text.primary),
                    boxShadow: theme === 'dark' && viewMode !== 'list' ? '0 0 12px rgba(31,31,81,0.4)' : undefined,
                  }}
                  title={viewMode === 'tile' ? 'Switch to list view' : 'Switch to tile view'}
                >
                  {viewMode === 'tile' ? (
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" strokeLinecap="round" /></svg>
                  ) : (
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><rect x="4" y="4" width="6" height="6" rx="1.5" /><rect x="14" y="4" width="6" height="6" rx="1.5" /><rect x="4" y="14" width="6" height="6" rx="1.5" /><rect x="14" y="14" width="6" height="6" rx="1.5" /></svg>
                  )}
                </button>
              </div>
            </div>
          </div>

          <PaginationControls currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />

          {filteredProducts.length > 0 ? (
            <ProductListView
              products={paginatedProducts}
              viewMode={viewMode}
              colors={colors}
              theme={theme}
              openMenuProductId={openMenuProductId}
              onView={handleView}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onToggleMenu={(productId) => setOpenMenuProductId((prev) => (prev === productId ? null : productId))}
              onCloseMenu={() => setOpenMenuProductId(null)}
            />
          ) : (
            <EmptyStates
              variant="no-results"
              colors={colors}
              canAddProducts={canAddProducts}
              onAddProduct={() => setShowAddModal(true)}
              onClearFilters={() => {
                setSearchTerm('');
                setSelectedCategory('all');
                setCurrentPage(1);
              }}
            />
          )}
        </>
      ) : (
        <EmptyStates
          variant="no-products"
          colors={colors}
          canAddProducts={canAddProducts}
          blockedAddProductMessage={blockedAddProductMessage}
          onAddProduct={() => setShowAddModal(true)}
        />
      )}

      <ProductAddModal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          setEditingProduct(undefined);
        }}
        onSave={handleSaveProduct}
        uploadSubdomain={selectedSubdomain}
        projectIndustry={selectedProject?.industry || null}
      />

      <ProductEditModal
        isOpen={Boolean(editingProduct)}
        onClose={() => setEditingProduct(undefined)}
        onSave={handleSaveProduct}
        editingProduct={editingProduct!}
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
            onEditProduct={(productToEdit) => {
              setViewingProduct(undefined);
              handleEdit(productToEdit);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
