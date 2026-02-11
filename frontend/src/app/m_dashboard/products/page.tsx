'use client';
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../components/context/theme-context';

interface Product {
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
}

const mockProducts: Product[] = [
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
    createdAt: '2024-01-15'
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
    createdAt: '2024-01-20'
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
    createdAt: '2024-01-10'
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
    createdAt: '2024-01-25'
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
    createdAt: '2024-01-28'
  }
];

const ProductCard = ({ product, colors, onEdit, onDelete, onToggleStatus }: {
  product: Product;
  colors: any;
  onEdit: (product: Product) => void;
  onDelete: (product: Product) => void;
  onToggleStatus: (product: Product) => void;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="rounded-xl border overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300"
    style={{ backgroundColor: colors.bg.card, borderColor: colors.border.faint }}
  >
    <div className="p-6">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="text-3xl">{product.image}</div>
          <div>
            <h3 className="font-semibold text-lg" style={{ color: colors.text.primary }}>
              {product.name}
            </h3>
            <p className="text-sm" style={{ color: colors.text.muted }}>
              SKU: {product.sku}
            </p>
          </div>
        </div>
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${product.status === 'active' ? 'bg-green-100 text-green-800' :
          product.status === 'inactive' ? 'bg-red-100 text-red-800' :
            'bg-gray-100 text-gray-800'
          }`}>
          {product.status}
        </span>
      </div>

      <p className="text-sm mb-4 line-clamp-2" style={{ color: colors.text.secondary }}>
        {product.description}
      </p>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <p className="text-xs" style={{ color: colors.text.muted }}>Price</p>
          <p className="font-semibold" style={{ color: colors.text.primary }}>
            ${product.price.toFixed(2)}
          </p>
        </div>
        <div>
          <p className="text-xs" style={{ color: colors.text.muted }}>Stock</p>
          <p className={`font-semibold ${product.stock === 0 ? 'text-red-500' : product.stock < 20 ? 'text-yellow-500' : 'text-green-500'}`}>
            {product.stock} units
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between pt-4 border-t" style={{ borderColor: colors.border.faint }}>
        <span className="text-xs px-2 py-1 rounded-md" style={{ backgroundColor: colors.bg.elevated, color: colors.text.muted }}>
          {product.category}
        </span>
        <div className="flex gap-2">
          <button
            onClick={() => onEdit(product)}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            style={{ color: colors.text.muted }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          <button
            onClick={() => onToggleStatus(product)}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            style={{ color: colors.text.muted }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
          </button>
          <button
            onClick={() => onDelete(product)}
            className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-red-500"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  </motion.div>
);

export default function ProductsPage() {
  const { colors } = useTheme();
  const [products, setProducts] = useState<Product[]>(mockProducts);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [showAddModal, setShowAddModal] = useState(false);

  const categories = ['All', 'Electronics', 'Clothing', 'Accessories', 'Home'];

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.sku.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleEdit = (product: Product) => {
    console.log('Edit product:', product);
    // TODO: Open edit modal
  };

  const handleDelete = (product: Product) => {
    if (confirm(`Are you sure you want to delete ${product.name}?`)) {
      setProducts(products.filter(p => p.id !== product.id));
    }
  };

  const handleToggleStatus = (product: Product) => {
    const newStatus = product.status === 'active' ? 'inactive' : 'active';
    setProducts(products.map(p =>
      p.id === product.id ? { ...p, status: newStatus } : p
    ));
  };

  const stats = {
    total: products.length,
    active: products.filter(p => p.status === 'active').length,
    lowStock: products.filter(p => p.stock > 0 && p.stock < 20).length,
    outOfStock: products.filter(p => p.stock === 0).length
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight" style={{ color: colors.text.primary }}>
            Products
          </h1>
          <p className="mt-2 text-base" style={{ color: colors.text.secondary }}>
            Manage your product inventory and listings
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 rounded-lg font-medium transition-colors shadow-lg shadow-blue-600/20"
          style={{ backgroundColor: '#3b82f6', color: 'white' }}
        >
          Add Product
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Products', value: stats.total, color: '#3b82f6' },
          { label: 'Active', value: stats.active, color: '#10b981' },
          { label: 'Low Stock', value: stats.lowStock, color: '#f59e0b' },
          { label: 'Out of Stock', value: stats.outOfStock, color: '#ef4444' }
        ].map((stat, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="rounded-xl border p-6"
            style={{ backgroundColor: colors.bg.card, borderColor: colors.border.faint }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium" style={{ color: colors.text.muted }}>
                  {stat.label}
                </p>
                <p className="text-2xl font-bold mt-1" style={{ color: colors.text.primary }}>
                  {stat.value}
                </p>
              </div>
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center"
                style={{ backgroundColor: `${stat.color}20`, color: stat.color }}
              >
                <div className="w-6 h-6 rounded-full" style={{ backgroundColor: stat.color }} />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500"
            style={{
              backgroundColor: colors.bg.card,
              borderColor: colors.border.faint,
              color: colors.text.primary
            }}
          />
        </div>
        <div className="flex gap-2">
          {categories.map(category => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${selectedCategory === category ? 'shadow-md' : 'hover:opacity-70'
                }`}
              style={{
                backgroundColor: selectedCategory === category ? colors.bg.elevated : 'transparent',
                color: selectedCategory === category ? colors.text.primary : colors.text.muted,
                border: `1px solid ${selectedCategory === category ? colors.border.default : 'transparent'}`
              }}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProducts.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            colors={colors}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onToggleStatus={handleToggleStatus}
          />
        ))}
      </div>

      {filteredProducts.length === 0 && (
        <div className="text-center py-20">
          <div className="text-6xl mb-4">📦</div>
          <h3 className="text-xl font-semibold mb-2" style={{ color: colors.text.primary }}>
            No products found
          </h3>
          <p style={{ color: colors.text.secondary }}>
            Try adjusting your search or filters
          </p>
        </div>
      )}
    </div>
  );
}


