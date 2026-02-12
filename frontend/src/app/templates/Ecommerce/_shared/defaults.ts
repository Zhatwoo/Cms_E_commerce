import type {
  CartItem,
  OrderTrackingItem,
  TrackingStep,
  OrderStatus,
  CategoryProduct,
  FilterGroup,
  ProductListingProduct,
} from "./types";

// ─── Cart Defaults ───
export const defaultCartItems: CartItem[] = [
  { id: "1", name: "Wireless Headphones", variant: "Black / Large", price: 79.99, quantity: 2, image: "https://placehold.co/120x120/3b82f6/ffffff?text=Headphones" },
  { id: "2", name: "Smart Watch Pro", variant: "Silver / 44mm", price: 199.99, quantity: 1, image: "https://placehold.co/120x120/10b981/ffffff?text=Watch" },
  { id: "3", name: "USB-C Charging Cable", variant: "2m", price: 14.99, quantity: 3, image: "https://placehold.co/120x120/f59e0b/ffffff?text=Cable" },
];

// ─── Order Tracking Defaults ───
export const defaultOrderTrackingItems: OrderTrackingItem[] = [
  { id: "1", name: "Wireless Headphones", quantity: 1, price: 79.99, image: "https://placehold.co/80x80/3b82f6/ffffff?text=Item1" },
  { id: "2", name: "Smart Watch Pro", quantity: 1, price: 199.99, image: "https://placehold.co/80x80/10b981/ffffff?text=Item2" },
  { id: "3", name: "USB-C Cable", quantity: 2, price: 14.99, image: "https://placehold.co/80x80/f59e0b/ffffff?text=Item3" },
];

export const defaultTrackingSteps: TrackingStep[] = [
  { status: "confirmed", label: "Order Confirmed", date: "Feb 8, 2026 · 10:30 AM", description: "Your order has been placed and confirmed.", completed: true },
  { status: "processing", label: "Processing", date: "Feb 9, 2026 · 2:15 PM", description: "Your order is being prepared for shipment.", completed: true },
  { status: "shipped", label: "Shipped", date: "Feb 10, 2026 · 9:00 AM", description: "Your order has left the warehouse.", completed: true },
  { status: "out_for_delivery", label: "Out for Delivery", date: "", description: "Your package is on its way to you.", completed: false },
  { status: "delivered", label: "Delivered", date: "", description: "Your package has been delivered.", completed: false },
];

export const orderStatusLabels: Record<OrderStatus, string> = {
  confirmed: "Confirmed",
  processing: "Processing",
  shipped: "Shipped",
  out_for_delivery: "Out for Delivery",
  delivered: "Delivered",
};

// ─── Checkout Defaults ───
export const defaultCheckoutCartItems = [
  { id: "1", name: "Wireless Headphones", price: 79.99, quantity: 1, image: "https://placehold.co/80x80/3b82f6/ffffff?text=Item1" },
  { id: "2", name: "Smart Watch", price: 199.99, quantity: 1, image: "https://placehold.co/80x80/10b981/ffffff?text=Item2" },
];

// ─── Category Defaults ───
export const defaultCategoryProducts: CategoryProduct[] = [
  { id: "1", name: "Wireless Headphones", price: 79.99, originalPrice: 99.99, image: "https://placehold.co/300x300/3b82f6/ffffff?text=Headphones", description: "Premium sound quality", rating: 4.5 },
  { id: "2", name: "Smart Watch", price: 199.99, image: "https://placehold.co/300x300/10b981/ffffff?text=Watch", description: "Track your fitness", rating: 4.8 },
  { id: "3", name: "Bluetooth Speaker", price: 49.99, originalPrice: 69.99, image: "https://placehold.co/300x300/f59e0b/ffffff?text=Speaker", description: "Portable speaker", rating: 4.2 },
  { id: "4", name: "USB-C Hub", price: 39.99, image: "https://placehold.co/300x300/8b5cf6/ffffff?text=Hub", description: "Expand connectivity", rating: 4.6 },
  { id: "5", name: "Mechanical Keyboard", price: 129.99, originalPrice: 159.99, image: "https://placehold.co/300x300/ef4444/ffffff?text=Keyboard", description: "RGB gaming keyboard", rating: 4.7 },
  { id: "6", name: "Wireless Mouse", price: 59.99, image: "https://placehold.co/300x300/06b6d4/ffffff?text=Mouse", description: "Ergonomic design", rating: 4.4 },
];

export const defaultSortOptions = [
  { label: "Relevance", value: "relevance" },
  { label: "Price: Low to High", value: "price-asc" },
  { label: "Price: High to Low", value: "price-desc" },
  { label: "Newest", value: "newest" },
  { label: "Rating", value: "rating" },
];

export const defaultFilterGroups: FilterGroup[] = [
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

export const defaultSubcategories = [
  { id: "audio", name: "Audio", count: 24 },
  { id: "wearables", name: "Wearables", count: 18 },
  { id: "accessories", name: "Accessories", count: 32 },
  { id: "gaming", name: "Gaming", count: 15 },
];

// ─── Product Listing Defaults ───
export const defaultListingProducts: ProductListingProduct[] = [
  { id: "1", name: "Premium Product", price: 99.99, image: "https://placehold.co/300x300/3b82f6/ffffff?text=Product+1", description: "High-quality product with amazing features" },
  { id: "2", name: "Deluxe Package", price: 149.99, image: "https://placehold.co/300x300/10b981/ffffff?text=Product+2", description: "Everything you need for success" },
  { id: "3", name: "Standard Edition", price: 49.99, image: "https://placehold.co/300x300/f59e0b/ffffff?text=Product+3", description: "Great value for money" },
];
