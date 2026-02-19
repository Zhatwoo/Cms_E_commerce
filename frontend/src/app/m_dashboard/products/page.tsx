'use client';
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../components/context/theme-context';
import { useAlert } from '../components/context/alert-context';
import { PieChart } from '../components/analytics/PieChart';
import { getAllProducts, type Product } from '../lib/productsData';

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
  const { showConfirm } = useAlert();
  const [products, setProducts] = useState<Product[]>(getAllProducts());
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [showAddModal, setShowAddModal] = useState(false);
  const [perPage, setPerPage] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);

  const categories = ['All', 'Electronics', 'Clothing', 'Accessories', 'Home', 'Sports'];

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
    console.log('Edit product:', product);
    // TODO: Open edit modal
  };

  const handleDelete = async (product: Product) => {
    const confirmed = await showConfirm(`Are you sure you want to delete ${product.name}?`);
    if (confirmed) {
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

  // Prepare chart data for categories
  const categoryChartData = [
    { label: 'Electronics', value: products.filter(p => p.category === 'Electronics').length, color: '#3b82f6' },
    { label: 'Clothing', value: products.filter(p => p.category === 'Clothing').length, color: '#8b5cf6' },
    { label: 'Accessories', value: products.filter(p => p.category === 'Accessories').length, color: '#f59e0b' },
    { label: 'Home', value: products.filter(p => p.category === 'Home').length, color: '#10b981' }
  ];

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

      {/* Chart Row: Pie for categories */}
      <div className="flex flex-col md:flex-row gap-6">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl border p-6 w-fit flex flex-col" style={{ backgroundColor: colors.bg.card, borderColor: colors.border.faint }}>
          <h4 className="text-sm font-semibold mb-4" style={{ color: colors.text.primary }}>Products by category</h4>
          <div className="flex flex-col items-center">
            <PieChart data={categoryChartData} size={120} />
            <div className="mt-4 text-sm text-center" style={{ color: colors.text.muted }}>
              <div>
                <span className="font-semibold" style={{ color: colors.text.primary }}>Total products:</span> <span style={{ color: colors.text.primary }}>{stats.total}</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 items-center">
        <div className="w-full sm:w-1/2">
          <input
            type="text"
            placeholder="Search products by name or SKU..."
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            className="w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500"
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

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {paginatedProducts.map((product) => (
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

      {/* Pagination */}
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


