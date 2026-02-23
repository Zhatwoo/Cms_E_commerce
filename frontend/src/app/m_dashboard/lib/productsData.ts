export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  status: 'active' | 'inactive' | 'draft';
  image: string;
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
