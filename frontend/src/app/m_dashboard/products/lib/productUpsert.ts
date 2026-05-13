'use client';

import { type Product, type ProductVariant } from '../../lib/productsData';
import { type ApiProduct, createProduct } from '@/lib/api';

export type ProductUpsertPayload = Omit<Parameters<typeof createProduct>[0], 'subdomain'>;

export function normalizeSubdomain(value: string | null | undefined): string {
  return String(value || '').trim().toLowerCase().replace(/[^a-z0-9-]/g, '');
}

export function toDashboardStatus(status?: string): Product['status'] {
  const normalized = String(status || '').toLowerCase();
  if (normalized === 'active' || normalized === 'published') return 'active';
  if (normalized === 'inactive' || normalized === 'suspended') return 'inactive';
  return 'draft';
}

export function toDashboardProduct(product: ApiProduct): Product {
  const images = Array.isArray(product.images)
    ? product.images.filter((img): img is string => typeof img === 'string' && img.trim().length > 0)
    : [];

  const variants: ProductVariant[] = Array.isArray(product.variants)
    ? product.variants.map((variant) => ({
      id: String(variant.id || ''),
      name: String(variant.name || ''),
      pricingMode: variant.pricingMode === 'override' ? 'override' : 'modifier',
      options: Array.isArray(variant.options)
        ? variant.options.map((option) => ({
          id: String(option.id || ''),
          name: String(option.name || ''),
          priceAdjustment: Number(option.priceAdjustment || 0),
          image: String(option.image || ''),
        }))
        : [],
    }))
    : [];

  return {
    id: product.id,
    name: String(product.name || ''),
    category: String(product.category || ''),
    subcategory: String(product.subcategory || ''),
    description: String(product.description || ''),
    price: Number(product.price || 0),
    basePrice: Number(product.basePrice || product.price || 0),
    costPrice: typeof product.costPrice === 'number' ? product.costPrice : null,
    finalPrice: Number(product.finalPrice || product.price || 0),
    compareAtPrice: typeof product.compareAtPrice === 'number' ? product.compareAtPrice : null,
    discount: Number(product.discount || 0),
    discountType: product.discountType === 'fixed' ? 'fixed' : 'percentage',
    hasVariants: Boolean(product.hasVariants),
    variants,
    variantStocks: product.variantStocks || {},
    variantPrices: product.variantPrices || {},
    priceRangeMin: typeof product.priceRangeMin === 'number' ? product.priceRangeMin : null,
    priceRangeMax: typeof product.priceRangeMax === 'number' ? product.priceRangeMax : null,
    stock: typeof product.stock === 'number' ? product.stock : 0,
    lowStockThreshold: typeof product.lowStockThreshold === 'number' ? product.lowStockThreshold : 5,
    status: toDashboardStatus(product.status),
    image: images[0] || '[product]',
    images,
    sku: String(product.sku || ''),
    createdAt: String(product.createdAt || new Date().toISOString()),
  };
}

export function buildProductPayload(productData: Partial<Product> & Record<string, unknown>): ProductUpsertPayload {
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

  const priceRangeMin = hasVariants ? Number(productData.priceRangeMin ?? finalPrice) : finalPrice;
  const priceRangeMax = hasVariants ? Number(productData.priceRangeMax ?? finalPrice) : finalPrice;
  const computedStock = hasVariants
    ? Object.values(variantStocks).reduce((sum, amount) => sum + amount, 0)
    : Number(productData.stock || 0);

  return {
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
    lowStockThreshold: Math.max(0, Number(productData.lowStockThreshold || 5)),
    status: toDashboardStatus(String(productData.status || 'draft')),
    images: Array.isArray(productData.images) ? (productData.images as string[]) : [],
  };
}