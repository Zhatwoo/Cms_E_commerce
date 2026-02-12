// ─── Cart Types ───
export interface CartItem {
  id: string;
  name: string;
  variant?: string;
  price: number;
  quantity: number;
  image: string;
}

export interface CartLayoutProps {
  items?: CartItem[];
  showOrderSummary?: boolean;
  summaryPosition?: "right" | "below";
  backgroundColor?: string;
  cardBackgroundColor?: string;
  summaryBackgroundColor?: string;
  titleColor?: string;
  labelColor?: string;
  priceColor?: string;
  totalPriceColor?: string;
  borderColor?: string;
  buttonBackgroundColor?: string;
  buttonTextColor?: string;
  secondaryButtonBackgroundColor?: string;
  secondaryButtonTextColor?: string;
  removeButtonColor?: string;
  quantityButtonColor?: string;
  borderRadius?: number;
  buttonBorderRadius?: number;
  imageSize?: number;
  title?: string;
  subtotalLabel?: string;
  shippingLabel?: string;
  discountLabel?: string;
  totalLabel?: string;
  checkoutButtonText?: string;
  continueShoppingText?: string;
  emptyCartText?: string;
  emptyCartSubtext?: string;
  promoPlaceholder?: string;
  showPromoCode?: boolean;
  showShippingEstimate?: boolean;
  showContinueShopping?: boolean;
  showItemVariant?: boolean;
  showItemImage?: boolean;
  shippingCost?: number;
  discount?: number;
  taxRate?: number;
}

// ─── Order Tracking Types ───
export type OrderStatus = "confirmed" | "processing" | "shipped" | "out_for_delivery" | "delivered";

export interface OrderTrackingItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  image: string;
}

export interface TrackingStep {
  status: OrderStatus;
  label: string;
  date?: string;
  description?: string;
  completed: boolean;
}

export interface OrderTrackingLayoutProps {
  orderNumber?: string;
  trackingNumber?: string;
  currentStatus?: OrderStatus;
  estimatedDelivery?: string;
  orderDate?: string;
  shippingName?: string;
  shippingAddress?: string;
  shippingCity?: string;
  shippingState?: string;
  shippingZip?: string;
  shippingCountry?: string;
  carrierName?: string;
  carrierLogo?: string;
  carrierTrackingUrl?: string;
  items?: OrderTrackingItem[];
  steps?: TrackingStep[];
  showItemsSummary?: boolean;
  showShippingAddress?: boolean;
  showCarrierInfo?: boolean;
  showContactSupport?: boolean;
  showEstimatedDelivery?: boolean;
  layoutMode?: "vertical" | "horizontal";
  backgroundColor?: string;
  cardBackgroundColor?: string;
  titleColor?: string;
  labelColor?: string;
  valueColor?: string;
  borderColor?: string;
  activeStepColor?: string;
  completedStepColor?: string;
  pendingStepColor?: string;
  buttonBackgroundColor?: string;
  buttonTextColor?: string;
  statusBadgeColor?: string;
  statusBadgeTextColor?: string;
  borderRadius?: number;
  buttonBorderRadius?: number;
  title?: string;
  contactButtonText?: string;
  itemsSummaryTitle?: string;
  shippingTitle?: string;
  carrierTitle?: string;
}

// ─── Checkout Types ───
export interface CheckoutFormProps {
  showOrderSummary?: boolean;
  summaryPosition?: "right" | "below";
  backgroundColor?: string;
  formBackgroundColor?: string;
  summaryBackgroundColor?: string;
  labelColor?: string;
  inputBackgroundColor?: string;
  inputTextColor?: string;
  inputBorderColor?: string;
  buttonBackgroundColor?: string;
  buttonTextColor?: string;
  priceColor?: string;
  totalPriceColor?: string;
  borderRadius?: number;
  inputBorderRadius?: number;
  buttonBorderRadius?: number;
  title?: string;
  titleColor?: string;
  subtotalLabel?: string;
  shippingLabel?: string;
  taxLabel?: string;
  totalLabel?: string;
  buttonText?: string;
  subtotal?: number;
  shipping?: number;
  tax?: number;
}

// ─── Category Types ───
export interface CategoryProduct {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  description?: string;
  rating?: number;
}

export interface FilterOption {
  label: string;
  value: string;
  count?: number;
}

export interface FilterGroup {
  key: string;
  label: string;
  options: FilterOption[];
}

export interface CategoryLayoutProps {
  categoryName?: string;
  categoryDescription?: string;
  bannerImage?: string;
  bannerHeight?: number;
  showCategoryHeader?: boolean;
  showFilters?: boolean;
  showSort?: boolean;
  sortOptions?: Array<{ label: string; value: string }>;
  filterGroups?: FilterGroup[];
  showSidebar?: boolean;
  subcategories?: Array<{ id: string; name: string; count?: number }>;
  columns?: number;
  gap?: number;
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
  cardBorderRadius?: number;
  cardShadow?: boolean;
  imageHeight?: number;
  buttonVariant?: "primary" | "secondary" | "outline" | "custom";
  buttonText?: string;
  products?: CategoryProduct[];
  productCount?: number;
  showDescription?: boolean;
  showRating?: boolean;
  showPagination?: boolean;
  paginationStyle?: "numbered" | "loadmore";
  productsPerPage?: number;
  emptyStateText?: string;
  showEmptyState?: boolean;
}

// ─── Product Details Types ───
export interface ProductActionButton {
  label: string;
  variant: "primary" | "secondary" | "outline";
}

export interface ProductDetailsProps {
  productName?: string;
  productPrice?: number;
  discountPrice?: number | null;
  productImage?: string;
  galleryImages?: string[];
  productDescription?: string;
  fullDescription?: string;
  specifications?: string;
  reviewsEnabled?: boolean;
  productRating?: number;
  productReviews?: number;
  inStock?: boolean;
  stockCount?: number;
  backgroundColor?: string;
  titleColor?: string;
  priceColor?: string;
  showRating?: boolean;
  imageHeight?: number;
  layoutMode?: "grid" | "stack";
  maxGalleryImages?: number;
  actionButtons?: ProductActionButton[];
}

// ─── Product Listing Types ───
export interface ProductListingProduct {
  id: string;
  name: string;
  price: number;
  image: string;
  description?: string;
}

export interface ProductListingProps {
  title?: string;
  subtitle?: string;
  columns?: number;
  gap?: number;
  products?: ProductListingProduct[];
  backgroundColor?: string;
  titleColor?: string;
  priceColor?: string;
  buttonVariant?: "primary" | "secondary" | "outline";
  showDescription?: boolean;
  cardBorderRadius?: number;
  cardShadow?: boolean;
  cardHeight?: number | "auto";
  imageHeight?: number;
}
