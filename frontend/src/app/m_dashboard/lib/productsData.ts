export interface ProductVariantOption {
  id: string;
  name: string;
  priceAdjustment: number;
}

export interface ProductVariant {
  id: string;
  name: string;
  pricingMode: 'modifier' | 'override';
  options: ProductVariantOption[];
}

export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  basePrice?: number;
  costPrice?: number | null;
  finalPrice?: number;
  compareAtPrice?: number | null;
  discount?: number;
  discountType?: 'percentage' | 'fixed';
  hasVariants?: boolean;
  variants?: ProductVariant[];
  variantStocks?: Record<string, number>;
  priceRangeMin?: number | null;
  priceRangeMax?: number | null;
  stock: number;
  lowStockThreshold?: number;
  status: 'active' | 'inactive' | 'draft';
  image: string;
  images?: string[];
  sku: string;
  description: string;
  createdAt: string;
  sales?: number;
  revenue?: number;
}

export const emptyProducts: Product[] = [];

export function getTopSellingProducts(limit: number = 4): Product[] {
  return [...emptyProducts]
    .filter(p => p.sales && p.sales > 0)
    .sort((a, b) => (b.revenue || 0) - (a.revenue || 0))
    .slice(0, limit);
}

export function getAllProducts(): Product[] {
  return emptyProducts;
}
