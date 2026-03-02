'use client';
import React, { useCallback, useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Plus } from 'lucide-react';
import { useTheme } from '../components/context/theme-context';
import { useAlert } from '../components/context/alert-context';
import { useProject } from '../components/context/project-context';
import { type Product, type ProductVariant } from '../lib/productsData';
import { createProduct, deleteProduct, listProducts, updateProduct, type ApiProduct } from '@/lib/api';
import ProductAddModal from './components/productAddModal';

type ProductUpsertPayload = Omit<Parameters<typeof createProduct>[0], 'subdomain'>;

function isImageSource(value: string): boolean {
  const v = (value || '').trim();
  if (!v) return false;
  if (/^data:image\/[a-zA-Z0-9.+-]+;base64,/i.test(v)) return true;
  if (/^https?:\/\//i.test(v)) return true;
  if (v.startsWith('blob:')) return true;
  if (v.startsWith('/')) return true;
  return false;
}

type ThemeColors = ReturnType<typeof useTheme>['colors'];

const ProductCard = ({ product, colors, onView, onEdit, onDelete, onToggleStatus }: {
  product: Product;
  colors: ThemeColors;
  onView: (product: Product) => void;
  onEdit: (product: Product) => void;
  onDelete: (product: Product) => void;
  onToggleStatus: (product: Product) => void;
}) => {
  const imageValue = String(product.image || '').trim();
  const showImage = isImageSource(imageValue);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="border overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col h-full"
      style={{
        backgroundColor: colors.bg.card,
        borderColor: colors.border.faint,
        borderRadius: '20px',
      }}
    >
      {/* Large Image Area */}
      <div
        className="w-full h-40 md:h-48 lg:h-44 overflow-hidden flex items-center justify-center border-b"
        style={{ borderColor: colors.border.faint, backgroundColor: colors.bg.elevated }}
      >
        {showImage ? (
          <img
            src={imageValue}
            alt={product.name}
            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
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

      {/* Content Area */}
      <div className="p-3 md:p-4 flex-1 flex flex-col">
        {/* Header with status badge */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h3 className="font-semibold text-sm md:text-base line-clamp-1" style={{ color: colors.text.primary }}>
              {product.name}
            </h3>
            <p className="text-xs mt-1" style={{ color: colors.text.muted }}>
              SKU: {product.sku}
            </p>
          </div>
          <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ${product.status === 'active' ? 'bg-green-100 text-green-800' :
            product.status === 'inactive' ? 'bg-red-100 text-red-800' :
              'bg-gray-100 text-gray-800'
            }`}>
            {product.status}
          </span>
        </div>

        {/* Description */}
        <p className="text-xs mb-4 line-clamp-2 flex-1" style={{ color: colors.text.secondary }}>
          {product.description || 'No description'}
        </p>

        {/* Price & Stock Info */}
        <div className="grid grid-cols-2 gap-3 mb-4 pb-4 border-b" style={{ borderColor: colors.border.faint }}>
          <div>
            <p className="text-xs mb-1" style={{ color: colors.text.muted }}>Price</p>
            <p className="font-semibold text-sm" style={{ color: colors.text.primary }}>
              ${product.price.toFixed(2)}
            </p>
          </div>
          <div>
            <p className="text-xs mb-1" style={{ color: colors.text.muted }}>Stock</p>
            <p className={`font-semibold text-sm ${product.stock === 0 ? 'text-red-500' : product.stock < 20 ? 'text-yellow-500' : 'text-green-500'}`}>
              {product.stock} units
            </p>
          </div>
        </div>

        {/* Category */}
        <div className="mb-4">
          <span className="text-xs px-2 py-1 rounded-md inline-block" style={{ backgroundColor: colors.bg.elevated, color: colors.text.muted }}>
            {product.category}
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 mt-auto justify-end">
          <button
            onClick={() => onView(product)}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex items-center justify-center"
            style={{ color: colors.text.muted }}
            title="View details"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M1.5 12s3.5-7 10.5-7 10.5 7 10.5 7-3.5 7-10.5 7S1.5 12 1.5 12z" />
              <circle cx="12" cy="12" r="3" strokeWidth={2} />
            </svg>
          </button>
          <button
            onClick={() => onEdit(product)}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex items-center justify-center"
            style={{ color: colors.text.muted }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          <button
            onClick={() => onToggleStatus(product)}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex items-center justify-center"
            style={{ color: colors.text.muted }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
          </button>
          <button
            onClick={() => onDelete(product)}
            className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-red-500 flex items-center justify-center"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
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
          initial={{ opacity: 0, scale: 0.96, y: 14 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 14 }}
          transition={{ type: 'spring', stiffness: 260, damping: 24 }}
          className="w-full max-w-4xl rounded-2xl border overflow-hidden"
          style={{ backgroundColor: colors.bg.card, borderColor: colors.border.faint }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="px-5 py-4 border-b flex items-center justify-between" style={{ borderColor: colors.border.faint }}>
            <h2 className="text-lg font-semibold" style={{ color: colors.text.primary }}>Product Details</h2>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-lg border flex items-center justify-center"
              style={{ borderColor: colors.border.faint, color: colors.text.muted }}
              title="Close"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                  <p style={{ color: colors.text.primary }}>{product.sku || '-'}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide" style={{ color: colors.text.muted }}>Category</p>
                  <p style={{ color: colors.text.primary }}>{product.category || '-'}</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <p className="text-xs uppercase tracking-wide" style={{ color: colors.text.muted }}>Price</p>
                  <p className="font-semibold" style={{ color: colors.text.primary }}>${product.price.toFixed(2)}</p>
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
    priceRangeMin,
    priceRangeMax,
    stock: typeof product.stock === 'number' ? product.stock : 0,
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
  const selectedProjectStatus = String(selectedProject?.status || '').toLowerCase();
  const isPublishedProject = selectedProjectStatus === 'published';
  const blockedAddProductMessage = !isPublishedProject
    ? 'You cannot add products while this website is in draft. Only published domains can add products.'
    : !selectedSubdomain
      ? 'Publish this website first so products can be saved under published_subdomains/{subdomain}/products.'
      : null;
  const canAddProducts = Boolean(selectedSubdomain && isPublishedProject);
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | undefined>();
  const [viewingProduct, setViewingProduct] = useState<Product | undefined>();
  const [perPage, setPerPage] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);

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

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / perPage));
  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [totalPages, currentPage]);

  const startIndex = (currentPage - 1) * perPage;
  const endIndex = startIndex + perPage;
  const paginatedProducts = filteredProducts.slice(startIndex, endIndex);

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

  const handleToggleStatus = async (product: Product) => {
    const newStatus = product.status === 'active' ? 'inactive' : 'active';
    try {
      await updateProduct(product.id, { status: newStatus });
      setProducts((prev) => prev.map((p) => (p.id === product.id ? { ...p, status: newStatus } : p)));
    } catch (error) {
      showAlert(error instanceof Error ? error.message : 'Failed to update status', 'error');
    }
  };

  const handleSaveProduct = async (productData: Partial<Product> & Record<string, unknown>): Promise<boolean> => {
    try {
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
      const priceRangeMin = hasVariants
        ? Number(productData.priceRangeMin ?? finalPrice)
        : finalPrice;
      const priceRangeMax = hasVariants
        ? Number(productData.priceRangeMax ?? finalPrice)
        : finalPrice;

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
        priceRangeMin,
        priceRangeMax,
        stock: Number(productData.stock || 0),
        status: toDashboardStatus(String(productData.status || 'draft')),
        images: Array.isArray(productData.images) ? (productData.images as string[]) : [],
      };

      if (editingProduct) {
        await updateProduct(editingProduct.id, payload);
      } else {
        if (!isPublishedProject) {
          showAlert('You cannot add products while this website is in draft. Only published domains can add products.', 'error');
          return false;
        }
        if (!selectedSubdomain) {
          showAlert('Publish this website first so products can be saved under published_subdomains/{subdomain}/products.', 'error');
          return false;
        }
        await createProduct({
          subdomain: selectedSubdomain,
          ...payload,
          slug: payload.name.toLowerCase().replace(/\s+/g, '-'),
        });
      }

      await loadProducts();
      setShowAddModal(false);
      setEditingProduct(undefined);
      return true;
    } catch (error) {
      showAlert(error instanceof Error ? error.message : 'Failed to save product', 'error');
      return false;
    }
  };

  const stats = {
    total: products.length,
    active: products.filter(p => p.status === 'active').length,
    lowStock: products.filter(p => p.stock > 0 && p.stock < 20).length,
    outOfStock: products.filter(p => p.stock === 0).length
  };

  const hasProducts = products.length > 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <section
        className="rounded-2xl border p-5 md:p-6"
        style={{
          backgroundColor: colors.bg.card,
          borderColor: colors.border.faint,
          boxShadow: theme === 'dark'
            ? 'inset 0 1px 0 rgba(255,255,255,0.06), 0 20px 50px rgba(2,6,23,0.55)'
            : 'inset 0 1px 0 rgba(255,255,255,0.8), 0 12px 30px rgba(15,23,42,0.12)',
        }}
      >
        <div className="relative">
          <div
            className="absolute -inset-x-6 -inset-y-4 rounded-3xl opacity-70 blur-2xl"
            style={{
              background: theme === 'dark'
                ? 'radial-gradient(60% 60% at 20% 20%, rgba(99,102,241,0.2), transparent 60%), radial-gradient(55% 55% at 80% 20%, rgba(14,165,233,0.16), transparent 60%), radial-gradient(50% 50% at 40% 80%, rgba(16,185,129,0.14), transparent 60%)'
                : 'radial-gradient(60% 60% at 20% 20%, rgba(99,102,241,0.14), transparent 60%), radial-gradient(55% 55% at 80% 20%, rgba(14,165,233,0.12), transparent 60%), radial-gradient(50% 50% at 40% 80%, rgba(16,185,129,0.1), transparent 60%)'
            }}
          />
          <div className="relative z-10 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div>
              <motion.p
                className="text-xs uppercase tracking-[0.2em] mb-2"
                style={{ color: colors.text.muted }}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
              >
                Dashboard Insights
              </motion.p>
              <motion.h1
                className="text-3xl font-bold tracking-tight bg-clip-text text-transparent"
                style={{
                  backgroundImage: theme === 'dark'
                    ? 'linear-gradient(180deg, #ffffff 25%, #9ca3af 100%)'
                    : 'linear-gradient(180deg, #111827 25%, #4b5563 100%)'
                }}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45 }}
              >
                Products
              </motion.h1>
              <motion.p
                className="mt-2 text-sm md:text-base"
                style={{ color: colors.text.secondary }}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, delay: 0.08 }}
              >
                Manage your product inventory and listings
              </motion.p>
              {blockedAddProductMessage && (
                <p className="mt-2 text-xs" style={{ color: colors.text.muted }}>
                  {blockedAddProductMessage}
                </p>
              )}
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              disabled={!canAddProducts}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-white font-medium transition-colors shadow-sm ${canAddProducts ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-400 cursor-not-allowed'}`}
            >
              <Plus className="w-4 h-4" />
              Add Product
            </button>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {[
          { label: 'Total products', value: stats.total },
          { label: 'Active', value: stats.active },
          { label: 'Low stock', value: stats.lowStock },
          { label: 'Out of stock', value: stats.outOfStock },
        ].map((item) => (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl border p-4"
            style={{ backgroundColor: colors.bg.card, borderColor: colors.border.faint }}
          >
            <p className="text-xs uppercase tracking-wide" style={{ color: colors.text.muted }}>
              {item.label}
            </p>
            <p className="mt-1 text-2xl font-semibold" style={{ color: colors.text.primary }}>
              {item.value}
            </p>
          </motion.div>
        ))}
      </section>

      {loadingProducts ? (
        <section className="text-center py-16 rounded-2xl border" style={{ backgroundColor: colors.bg.card, borderColor: colors.border.faint }}>
          <p style={{ color: colors.text.secondary }}>Loading products...</p>
        </section>
      ) : hasProducts ? (
        <>
          <div id="inventory-section" className="flex flex-col sm:flex-row gap-4 items-center rounded-2xl border p-4" style={{ backgroundColor: colors.bg.card, borderColor: colors.border.faint }}>
            <div className="w-full sm:w-1/2">
              <input
                type="text"
                placeholder="Search products by name or SKU..."
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                className="w-full px-4 py-2 rounded-lg border focus:outline-none"
                style={{
                  backgroundColor: colors.bg.card,
                  borderColor: colors.border.faint,
                  color: colors.text.primary
                }}
              />
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <label className="text-sm" style={{ color: colors.text.muted }}>Category:</label>
                <select
                  value={selectedCategory}
                  onChange={(e) => { setSelectedCategory(e.target.value); setCurrentPage(1); }}
                  className="px-3 py-2 rounded-lg text-sm border"
                  style={{ backgroundColor: colors.bg.card, borderColor: colors.border.faint, color: colors.text.primary }}
                >
                  {categories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <label className="text-sm" style={{ color: colors.text.muted }}>Per page:</label>
                <select
                  value={perPage}
                  onChange={(e) => { setPerPage(Number(e.target.value)); setCurrentPage(1); }}
                  className="px-2 py-1 rounded-lg text-sm border"
                  style={{ backgroundColor: colors.bg.card, borderColor: colors.border.faint, color: colors.text.primary }}
                >
                  {[5, 10, 15, 20].map(n => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {filteredProducts.length > 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 md:gap-5 lg:gap-6">
                {paginatedProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    colors={colors}
                    onView={handleView}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onToggleStatus={handleToggleStatus}
                  />
                ))}
              </div>

              <div className="flex items-center justify-between gap-4 mt-4">
                <div style={{ color: colors.text.muted }}>
                  Showing {(filteredProducts.length === 0) ? 0 : (startIndex + 1)} - {Math.min(endIndex, filteredProducts.length)} of {filteredProducts.length}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1 rounded border"
                    style={{ backgroundColor: colors.bg.card, borderColor: colors.border.faint, color: colors.text.primary }}
                  >Prev</button>
                  <div className="px-3 py-1 rounded text-sm" style={{ color: colors.text.primary }}>{currentPage}</div>
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 rounded border"
                    style={{ backgroundColor: colors.bg.card, borderColor: colors.border.faint, color: colors.text.primary }}
                  >Next</button>
                </div>
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
