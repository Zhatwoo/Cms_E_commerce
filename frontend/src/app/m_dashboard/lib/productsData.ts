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

export const mockProducts: Product[] = [
  {
    id: '1',
    name: 'Premium Wireless Headphones',
    category: 'Electronics',
    price: 299.99,
    stock: 45,
    status: 'active',
    image: '🎧',
    sku: 'WH-001',
    description: 'High-quality wireless headphones with noise cancellation',
    createdAt: '2024-01-15',
    sales: 342,
    revenue: 102597
  },
  {
    id: '2',
    name: 'Organic Cotton T-Shirt',
    category: 'Clothing',
    price: 29.99,
    stock: 120,
    status: 'active',
    image: '👕',
    sku: 'CT-002',
    description: 'Comfortable organic cotton t-shirt in various colors',
    createdAt: '2024-01-20',
    sales: 287,
    revenue: 8607
  },
  {
    id: '3',
    name: 'Smart Watch Pro',
    category: 'Electronics',
    price: 449.99,
    stock: 0,
    status: 'inactive',
    image: '⌚',
    sku: 'SW-003',
    description: 'Advanced smartwatch with health tracking features',
    createdAt: '2024-01-10',
    sales: 198,
    revenue: 89098
  },
  {
    id: '4',
    name: 'Leather Backpack',
    category: 'Accessories',
    price: 89.99,
    stock: 30,
    status: 'active',
    image: '🎒',
    sku: 'LB-004',
    description: 'Genuine leather backpack with laptop compartment',
    createdAt: '2024-01-25',
    sales: 156,
    revenue: 14038
  },
  {
    id: '5',
    name: 'Ceramic Coffee Mug Set',
    category: 'Home',
    price: 34.99,
    stock: 15,
    status: 'draft',
    image: '☕',
    sku: 'CM-005',
    description: 'Set of 4 ceramic coffee mugs with modern design',
    createdAt: '2024-01-28',
    sales: 89,
    revenue: 3114
  },
  {
    id: '6',
    name: 'Yoga Mat Pro',
    category: 'Sports',
    price: 59.99,
    stock: 67,
    status: 'active',
    image: '🧘',
    sku: 'YM-006',
    description: 'Premium non-slip yoga mat with carrying strap',
    createdAt: '2024-02-01',
    sales: 223,
    revenue: 13378
  },
  {
    id: '7',
    name: 'Bluetooth Speaker',
    category: 'Electronics',
    price: 79.99,
    stock: 88,
    status: 'active',
    image: '🔊',
    sku: 'BS-007',
    description: 'Portable waterproof Bluetooth speaker with 12-hour battery',
    createdAt: '2024-02-05',
    sales: 401,
    revenue: 32076
  }
];

export function getTopSellingProducts(limit: number = 4): Product[] {
  return [...mockProducts]
    .filter(p => p.sales && p.sales > 0)
    .sort((a, b) => (b.revenue || 0) - (a.revenue || 0))
    .slice(0, limit);
}

export function getAllProducts(): Product[] {
  return mockProducts;
}
