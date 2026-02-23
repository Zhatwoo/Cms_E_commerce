'use client';
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useTheme } from '../context/theme-context';
import { getTopSellingProducts, type Product } from '../../lib/productsData';

export function TopSellingProducts() {
  const { theme, colors } = useTheme();
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get top selling products from shared data
    setTimeout(() => {
      setProducts(getTopSellingProducts(3));
      setLoading(false);
    }, 300);
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    if (status === 'active') {
      return (
        <span
          className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium"
          style={{
            backgroundColor: 'rgba(163,230,53,0.1)',
            color: colors.status.good,
          }}
        >
          <span className="mr-1 h-1.5 w-1.5 rounded-full bg-current" />
          Active
        </span>
      );
    }
    return null;
  };

  return (
    <motion.div
      className="rounded-2xl border p-4 md:p-6"
      style={{
        backgroundColor: colors.bg.card,
        borderColor: colors.border.default,
        boxShadow: theme === 'dark' ? '0 18px 60px rgba(0,0,0,0.6)' : '0 10px 40px rgba(0,0,0,0.08)',
      }}
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: 0.15 }}
    >
      <div className="flex items-center justify-between mb-4 md:mb-5">
        <div>
          <h3 className="text-base md:text-lg font-semibold tracking-tight" style={{ color: colors.text.primary }}>
            Products snapshot
          </h3>
          <p className="text-xs mt-0.5" style={{ color: colors.text.muted }}>
            Quick view of top performers
          </p>
        </div>
        <button
          onClick={() => router.push('/m_dashboard/products#inventory-section')}
          className="text-xs md:text-sm font-medium transition-opacity hover:opacity-70"
          style={{ color: colors.status.info }}
        >
          Open Products →
        </button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="h-16 rounded-xl" style={{ backgroundColor: colors.bg.elevated }} />
            </div>
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-sm" style={{ color: colors.text.muted }}>
            No product data available yet.
          </p>
        </div>
      ) : (
        <div className="space-y-2 md:space-y-3">
          {products.map((product, idx) => (
            <motion.div
              key={product.id}
              className="rounded-xl border p-3 md:p-4 cursor-pointer transition-all hover:scale-[1.01]"
              style={{
                backgroundColor: theme === 'dark' ? 'rgba(0,0,0,0.4)' : colors.bg.elevated,
                borderColor: colors.border.faint,
              }}
              onClick={() => router.push('/m_dashboard/products#inventory-section')}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.1 }}
            >
              <div className="flex items-start justify-between gap-2 md:gap-3">
                <div className="flex items-start gap-2 md:gap-3 flex-1 min-w-0">
                  <div
                    className="flex items-center justify-center w-8 h-8 md:w-10 md:h-10 rounded-lg text-base md:text-xl shrink-0"
                    style={{
                      backgroundColor: idx === 0 ? colors.status.good : theme === 'dark' ? 'rgba(0,0,0,0.6)' : 'rgba(156,163,175,0.2)',
                      color: idx === 0 ? colors.bg.dark : colors.text.muted,
                    }}
                  >
                    {product.image || '📦'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-xs md:text-sm truncate" style={{ color: colors.text.primary }}>
                      {product.name}
                    </p>
                    <div className="flex items-center gap-2 md:gap-3 mt-0.5 md:mt-1">
                      <span className="text-[10px] md:text-xs" style={{ color: colors.text.muted }}>
                        {product.sales} sales
                      </span>
                      <span className="text-[10px] md:text-xs font-semibold" style={{ color: colors.status.good }}>
                        {formatCurrency(product.revenue || 0)}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="hidden sm:block">{getStatusBadge(product.status)}</div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <div
        className="mt-4 md:mt-5 pt-3 md:pt-4 border-t flex items-center justify-between"
        style={{ borderColor: colors.border.faint }}
      >
        <span className="text-[10px] md:text-xs font-medium" style={{ color: colors.text.muted }}>
          Total revenue
        </span>
        <span className="text-base md:text-lg font-semibold" style={{ color: colors.text.primary }}>
          {formatCurrency(products.reduce((sum, p) => sum + (p.revenue || 0), 0))}
        </span>
      </div>
    </motion.div>
  );
}
