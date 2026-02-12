"use client";

import React, { useRef, useState } from "react";
import { useNode } from "@craftjs/core";
import { CategoryLayoutSettings } from "./CategoryLayoutSettings";

interface Product {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  description?: string;
  rating?: number;
}

interface FilterOption {
  label: string;
  value: string;
  count?: number;
}

interface FilterGroup {
  key: string;
  label: string;
  options: FilterOption[];
}

export interface CategoryLayoutProps {
  // Category Header
  categoryName?: string;
  categoryDescription?: string;
  bannerImage?: string;
  bannerHeight?: number;
  showCategoryHeader?: boolean;

  // Filter & Sort
  showFilters?: boolean;
  showSort?: boolean;
  sortOptions?: Array<{ label: string; value: string }>;
  filterGroups?: FilterGroup[];

  // Sidebar
  showSidebar?: boolean;
  subcategories?: Array<{ id: string; name: string; count?: number }>;

  // Layout
  columns?: number;
  gap?: number;

  // Style / Colors
  backgroundColor?: string;
  categoryNameColor?: string;
  categoryDescriptionColor?: string;
  priceColor?: string;
  originalPriceColor?: string;
  discountBadgeColor?: string;
  productTitleColor?: string;
  cardBackgroundColor?: string;
  buttonColor?: string;
  buttonTextColor?: string;
  ratingColor?: string;

  // Card Style
  cardBorderRadius?: number;
  cardShadow?: boolean;
  imageHeight?: number;

  // Button
  buttonVariant?: "primary" | "secondary" | "outline" | "custom";
  buttonText?: string;

  // Products
  products?: Product[];
  productCount?: number; // Number of products to display
  showDescription?: boolean;
  showRating?: boolean;

  // Pagination
  showPagination?: boolean;
  paginationStyle?: "numbered" | "loadmore";
  productsPerPage?: number;

  // Empty State
  emptyStateText?: string;
  showEmptyState?: boolean;
}

const defaultProducts: Product[] = [
  {
    id: "1",
    name: "Wireless Headphones",
    price: 79.99,
    originalPrice: 99.99,
    image: "https://placehold.co/300x300/3b82f6/ffffff?text=Headphones",
    description: "Premium sound quality",
    rating: 4.5,
  },
  {
    id: "2",
    name: "Smart Watch",
    price: 199.99,
    image: "https://placehold.co/300x300/10b981/ffffff?text=Watch",
    description: "Track your fitness",
    rating: 4.8,
  },
  {
    id: "3",
    name: "Bluetooth Speaker",
    price: 49.99,
    originalPrice: 69.99,
    image: "https://placehold.co/300x300/f59e0b/ffffff?text=Speaker",
    description: "Portable speaker",
    rating: 4.2,
  },
  {
    id: "4",
    name: "USB-C Hub",
    price: 39.99,
    image: "https://placehold.co/300x300/8b5cf6/ffffff?text=Hub",
    description: "Expand connectivity",
    rating: 4.6,
  },
  {
    id: "5",
    name: "Mechanical Keyboard",
    price: 129.99,
    originalPrice: 159.99,
    image: "https://placehold.co/300x300/ef4444/ffffff?text=Keyboard",
    description: "RGB gaming keyboard",
    rating: 4.7,
  },
  {
    id: "6",
    name: "Wireless Mouse",
    price: 59.99,
    image: "https://placehold.co/300x300/06b6d4/ffffff?text=Mouse",
    description: "Ergonomic design",
    rating: 4.4,
  },
];

const defaultSortOptions = [
  { label: "Relevance", value: "relevance" },
  { label: "Price: Low to High", value: "price-asc" },
  { label: "Price: High to Low", value: "price-desc" },
  { label: "Newest", value: "newest" },
  { label: "Rating", value: "rating" },
];

const defaultFilterGroups: FilterGroup[] = [
  {
    key: "price",
    label: "Price Range",
    options: [
      { label: "Under $50", value: "0-50", count: 12 },
      { label: "$50 - $100", value: "50-100", count: 24 },
      { label: "$100 - $200", value: "100-200", count: 18 },
      { label: "Over $200", value: "200+", count: 8 },
    ],
  },
  {
    key: "rating",
    label: "Rating",
    options: [
      { label: "4★ & up", value: "4+", count: 45 },
      { label: "3★ & up", value: "3+", count: 58 },
    ],
  },
];

const defaultSubcategories = [
  { id: "audio", name: "Audio", count: 24 },
  { id: "wearables", name: "Wearables", count: 18 },
  { id: "accessories", name: "Accessories", count: 32 },
  { id: "gaming", name: "Gaming", count: 15 },
];

/**
 * CategoryLayout Component
 * A ProductListing with category features: header/banner, filters, sort, pagination, optional sidebar.
 */
export const CategoryLayout: React.FC<CategoryLayoutProps> = ({
  // Header
  categoryName = "Electronics",
  categoryDescription = "Explore our latest tech products and gadgets",
  bannerImage = "",
  bannerHeight = 160,
  showCategoryHeader = true,

  // Filter & Sort
  showFilters = true,
  showSort = true,
  sortOptions = defaultSortOptions,
  filterGroups = defaultFilterGroups,

  // Sidebar
  showSidebar = false,
  subcategories = defaultSubcategories,

  // Layout
  columns = 4,
  gap = 20,

  // Style / Colors
  backgroundColor = "#f8fafc",
  categoryNameColor = "#1e293b",
  categoryDescriptionColor = "#64748b",
  priceColor = "#3b82f6",
  originalPriceColor = "#9ca3af",
  discountBadgeColor = "#ef4444",
  productTitleColor = "#111827",
  cardBackgroundColor = "#ffffff",
  buttonColor = "#3b82f6",
  buttonTextColor = "#ffffff",
  ratingColor = "#facc15",

  // Card
  cardBorderRadius = 12,
  cardShadow = true,
  imageHeight = 180,

  // Button
  buttonVariant = "primary",
  buttonText = "Add to Cart",

  // Products
  products = defaultProducts,
  productCount = 6,
  showDescription = false,
  showRating = true,

  // Pagination
  showPagination = true,
  paginationStyle = "loadmore",
  productsPerPage = 8,

  // Empty
  emptyStateText = "No products found",
  showEmptyState = true,
}) => {
  const { connectors: { connect, drag } } = useNode();
  const containerRef = useRef<HTMLDivElement>(null);
  const [currentSort, setCurrentSort] = useState(sortOptions[0]?.value || "");
  const [currentPage, setCurrentPage] = useState(1);

  // Limit products to productCount
  const limitedProducts = products.slice(0, productCount);

  const gridColsClass = {
    1: "grid-cols-1",
    2: "grid-cols-1 sm:grid-cols-2",
    3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4",
    5: "grid-cols-2 sm:grid-cols-3 lg:grid-cols-5",
  }[columns] || "grid-cols-4";

  const buttonStyles: Record<string, React.CSSProperties> = {
    primary: { backgroundColor: "#3b82f6", color: "#ffffff", border: "none" },
    secondary: { backgroundColor: "#10b981", color: "#ffffff", border: "none" },
    outline: { backgroundColor: "transparent", color: "#3b82f6", border: "2px solid #3b82f6" },
    custom: { backgroundColor: buttonColor, color: buttonTextColor, border: "none" },
  };

  const totalPages = Math.ceil(limitedProducts.length / productsPerPage);
  const displayedProducts = paginationStyle === "loadmore"
    ? limitedProducts.slice(0, currentPage * productsPerPage)
    : limitedProducts.slice((currentPage - 1) * productsPerPage, currentPage * productsPerPage);

  const hasMore = paginationStyle === "loadmore" && displayedProducts.length < limitedProducts.length;

  return (
    <div
      ref={(ref) => {
        if (ref) {
          containerRef.current = ref;
          connect(drag(ref));
        }
      }}
      className="w-full"
    >
      <section style={{ backgroundColor }} className="min-h-100">
        {/* Category Header / Banner */}
        {showCategoryHeader && (
          <div
            className="w-full relative"
            style={{
              height: bannerImage ? `${bannerHeight}px` : "auto",
              backgroundImage: bannerImage ? `url(${bannerImage})` : undefined,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          >
            <div
              className={`${bannerImage ? "absolute inset-0 bg-black/40" : ""} flex flex-col justify-center px-6 py-8`}
            >
              <div className="max-w-7xl mx-auto w-full">
                <h1
                  className="text-2xl md:text-3xl font-bold mb-2"
                  style={{ color: bannerImage ? "#ffffff" : categoryNameColor }}
                >
                  {categoryName}
                </h1>
                {categoryDescription && (
                  <p
                    className="text-sm md:text-base opacity-90"
                    style={{ color: bannerImage ? "#ffffff" : categoryDescriptionColor }}
                  >
                    {categoryDescription}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex gap-6">
            {/* Optional Sidebar */}
            {showSidebar && (
              <aside className="w-56 shrink-0 hidden lg:block">
                {/* Subcategories */}
                {subcategories.length > 0 && (
                  <div className="mb-6 bg-white rounded-lg p-4 shadow-sm">
                    <h3 className="font-semibold text-gray-900 mb-3 text-sm">Categories</h3>
                    <ul className="space-y-2">
                      {subcategories.map((cat) => (
                        <li key={cat.id}>
                          <button className="text-sm text-gray-600 hover:text-blue-600 flex justify-between w-full text-left">
                            <span>{cat.name}</span>
                            {cat.count !== undefined && (
                              <span className="text-gray-400 text-xs">({cat.count})</span>
                            )}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Filter Groups */}
                {showFilters && filterGroups.map((group) => (
                  <div key={group.key} className="mb-4 bg-white rounded-lg p-4 shadow-sm">
                    <h3 className="font-semibold text-gray-900 mb-3 text-sm">{group.label}</h3>
                    <ul className="space-y-2">
                      {group.options.map((opt) => (
                        <li key={opt.value}>
                          <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-600 hover:text-gray-900">
                            <input type="checkbox" className="rounded border-gray-300 w-4 h-4" />
                            <span>{opt.label}</span>
                            {opt.count !== undefined && (
                              <span className="text-gray-400 text-xs ml-auto">({opt.count})</span>
                            )}
                          </label>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </aside>
            )}

            {/* Main Content */}
            <main className="flex-1">
              {/* Filter & Sort Bar */}
              {(showFilters || showSort) && (
                <div className="flex flex-wrap items-center justify-between gap-4 mb-6 pb-4 border-b border-gray-200">
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">{limitedProducts.length}</span> products
                  </p>

                  <div className="flex items-center gap-3">
                    {/* Inline Filters (for mobile / no sidebar) */}
                    {showFilters && !showSidebar && (
                      <button className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1 px-3 py-1.5 border border-gray-300 rounded-lg">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                        </svg>
                        Filters
                      </button>
                    )}

                    {/* Sort Dropdown */}
                    {showSort && (
                      <select
                        value={currentSort}
                        onChange={(e) => setCurrentSort(e.target.value)}
                        className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        {sortOptions.map((opt) => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    )}
                  </div>
                </div>
              )}

              {/* Product Grid */}
              {displayedProducts.length === 0 && showEmptyState ? (
                <div className="text-center py-16">
                  <div className="text-gray-400 text-5xl mb-4">📦</div>
                  <p className="text-gray-500">{emptyStateText}</p>
                </div>
              ) : (
                <div className={`grid ${gridColsClass}`} style={{ gap: `${gap}px` }}>
                  {displayedProducts.map((product) => (
                    <div
                      key={product.id}
                      className="flex flex-col overflow-hidden group"
                      style={{
                        borderRadius: `${cardBorderRadius}px`,
                        backgroundColor: cardBackgroundColor,
                        boxShadow: cardShadow ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
                        border: "1px solid #e5e7eb",
                      }}
                    >
                      {/* Image */}
                      <div
                        className="w-full bg-gray-50 relative overflow-hidden"
                        style={{ height: `${imageHeight}px` }}
                      >
                        <img
                          src={product.image}
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        {product.originalPrice && product.originalPrice > product.price && (
                          <span
                            className="absolute top-2 left-2 text-white text-[10px] font-semibold px-1.5 py-0.5 rounded"
                            style={{ backgroundColor: discountBadgeColor }}
                          >
                            -{Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}%
                          </span>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 flex flex-col p-3">
                        <h3
                          className="text-sm font-medium mb-1 line-clamp-2"
                          style={{ color: productTitleColor }}
                        >
                          {product.name}
                        </h3>

                        {showRating && product.rating && (
                          <div className="flex items-center gap-1 mb-1">
                            <span style={{ color: ratingColor }} className="text-xs">★</span>
                            <span className="text-xs text-gray-500">{product.rating}</span>
                          </div>
                        )}

                        {showDescription && product.description && (
                          <p className="text-gray-500 text-xs mb-2 line-clamp-2">{product.description}</p>
                        )}

                        <div className="flex items-center gap-2 mb-2 mt-auto">
                          <span style={{ color: priceColor }} className="text-base font-bold">
                            ${product.price.toFixed(2)}
                          </span>
                          {product.originalPrice && product.originalPrice > product.price && (
                            <span style={{ color: originalPriceColor }} className="text-xs line-through">
                              ${product.originalPrice.toFixed(2)}
                            </span>
                          )}
                        </div>

                        <button
                          style={buttonStyles[buttonVariant]}
                          className="w-full py-1.5 px-2 rounded text-xs font-medium hover:opacity-90 transition-opacity"
                        >
                          {buttonText}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Pagination */}
              {showPagination && limitedProducts.length > productsPerPage && (
                <div className="mt-8 flex justify-center">
                  {paginationStyle === "loadmore" ? (
                    hasMore && (
                      <button
                        onClick={() => setCurrentPage((p) => p + 1)}
                        className="px-6 py-2.5 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        Load More Products
                      </button>
                    )
                  ) : (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        ←
                      </button>
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => i + 1).map((page) => (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`px-3 py-1.5 border rounded-lg text-sm ${
                            page === currentPage
                              ? "bg-blue-600 text-white border-blue-600"
                              : "border-gray-300 hover:bg-gray-50"
                          }`}
                        >
                          {page}
                        </button>
                      ))}
                      {totalPages > 5 && <span className="px-2 text-gray-400">...</span>}
                      <button
                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        →
                      </button>
                    </div>
                  )}
                </div>
              )}
            </main>
          </div>
        </div>
      </section>
    </div>
  );
};

export default CategoryLayout;

(CategoryLayout as any).craft = {
  displayName: "Category Listing",
  props: {
    categoryName: "Electronics",
    categoryDescription: "Explore our latest tech products and gadgets",
    bannerImage: "",
    bannerHeight: 160,
    showCategoryHeader: true,
    showFilters: true,
    showSort: true,
    sortOptions: defaultSortOptions,
    filterGroups: defaultFilterGroups,
    showSidebar: false,
    subcategories: defaultSubcategories,
    columns: 4,
    gap: 20,
    // Colors
    backgroundColor: "#f8fafc",
    categoryNameColor: "#1e293b",
    categoryDescriptionColor: "#64748b",
    priceColor: "#3b82f6",
    originalPriceColor: "#9ca3af",
    discountBadgeColor: "#ef4444",
    productTitleColor: "#111827",
    cardBackgroundColor: "#ffffff",
    buttonColor: "#3b82f6",
    buttonTextColor: "#ffffff",
    ratingColor: "#facc15",
    // Card
    cardBorderRadius: 12,
    cardShadow: true,
    imageHeight: 180,
    // Button
    buttonVariant: "primary",
    buttonText: "Add to Cart",
    // Products
    products: defaultProducts,
    productCount: 6,
    showDescription: false,
    showRating: true,
    // Pagination
    showPagination: true,
    paginationStyle: "loadmore",
    productsPerPage: 8,
    emptyStateText: "No products found",
    showEmptyState: true,
  },
  related: {
    settings: CategoryLayoutSettings,
  },
  rules: {
    canMoveIn: () => false,
    canMoveOut: () => true,
    canDrag: () => true,
  },
};
