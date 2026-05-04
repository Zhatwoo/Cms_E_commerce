import React from 'react';

type IconProps = {
  className?: string;
  size?: number;
};

const base = (size: number, className: string) => ({
  width: size,
  height: size,
  viewBox: '0 0 24 24',
  fill: 'none',
  xmlns: 'http://www.w3.org/2000/svg',
  className,
});

export const DebitCard: React.FC<IconProps> = ({ className = '', size = 24 }) => (
  <svg {...base(size, className)}><rect x="2" y="5" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="2"/><path d="M2 10H22" stroke="currentColor" strokeWidth="2"/><path d="M6 15H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
);

export const BankTransfer: React.FC<IconProps> = ({ className = '', size = 24 }) => (
  <svg {...base(size, className)}><path d="M3 9L12 4L21 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><path d="M5 10V18" stroke="currentColor" strokeWidth="2"/><path d="M9 10V18" stroke="currentColor" strokeWidth="2"/><path d="M15 10V18" stroke="currentColor" strokeWidth="2"/><path d="M19 10V18" stroke="currentColor" strokeWidth="2"/><path d="M3 20H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
);

export const PosTerminal: React.FC<IconProps> = ({ className = '', size = 24 }) => (
  <svg {...base(size, className)}><rect x="6" y="3" width="12" height="18" rx="2" stroke="currentColor" strokeWidth="2"/><path d="M9 8H15" stroke="currentColor" strokeWidth="2"/><path d="M9 12H12" stroke="currentColor" strokeWidth="2"/><path d="M9 16H15" stroke="currentColor" strokeWidth="2"/></svg>
);

export const Invoice: React.FC<IconProps> = ({ className = '', size = 24 }) => (
  <svg {...base(size, className)}><path d="M6 3H15L19 7V21H6V3Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/><path d="M15 3V7H19" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/><path d="M9 12H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><path d="M9 16H13" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><path d="M11.5 9.5V11" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
);

export const CashOnDelivery: React.FC<IconProps> = ({ className = '', size = 24 }) => (
  <svg {...base(size, className)}><rect x="3" y="7" width="18" height="10" rx="2" stroke="currentColor" strokeWidth="2"/><circle cx="12" cy="12" r="2.5" stroke="currentColor" strokeWidth="2"/><path d="M7 10.5V13.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><path d="M17 10.5V13.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
);

export const DeliveryBike: React.FC<IconProps> = ({ className = '', size = 24 }) => (
  <svg {...base(size, className)}><circle cx="6" cy="18" r="3" stroke="currentColor" strokeWidth="2"/><circle cx="18" cy="18" r="3" stroke="currentColor" strokeWidth="2"/><path d="M6 18L10 10H14L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M10 10H7" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
);

export const Tracking: React.FC<IconProps> = ({ className = '', size = 24 }) => (
  <svg {...base(size, className)}><path d="M12 21C15.5 17 18 14.3 18 11A6 6 0 1 0 6 11C6 14.3 8.5 17 12 21Z" stroke="currentColor" strokeWidth="2"/><circle cx="12" cy="11" r="2" stroke="currentColor" strokeWidth="2"/></svg>
);

export const ReturnBox: React.FC<IconProps> = ({ className = '', size = 24 }) => (
  <svg {...base(size, className)}><path d="M12 2L3 7L12 12L21 7L12 2Z" stroke="currentColor" strokeWidth="2"/><path d="M3 7V17L12 22L21 17V7" stroke="currentColor" strokeWidth="2"/><path d="M9 14H15" stroke="currentColor" strokeWidth="2"/><path d="M9 14L11 12" stroke="currentColor" strokeWidth="2"/><path d="M9 14L11 16" stroke="currentColor" strokeWidth="2"/></svg>
);

export const WarehouseShelf: React.FC<IconProps> = ({ className = '', size = 24 }) => (
  <svg {...base(size, className)}><rect x="4" y="4" width="16" height="16" rx="1" stroke="currentColor" strokeWidth="2"/><path d="M4 10H20" stroke="currentColor" strokeWidth="2"/><path d="M12 4V20" stroke="currentColor" strokeWidth="2"/></svg>
);

export const PickupPoint: React.FC<IconProps> = ({ className = '', size = 24 }) => (
  <svg {...base(size, className)}><path d="M12 21C15.5 17 18 14.3 18 11A6 6 0 1 0 6 11C6 14.3 8.5 17 12 21Z" stroke="currentColor" strokeWidth="2"/><path d="M10 11H14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
);

export const FilterIconCommerce: React.FC<IconProps> = ({ className = '', size = 24 }) => (
  <svg {...base(size, className)}><path d="M4 6H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><path d="M7 12H17" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><path d="M10 18H14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
);

export const SortIconCommerce: React.FC<IconProps> = ({ className = '', size = 24 }) => (
  <svg {...base(size, className)}><path d="M8 6V18" stroke="currentColor" strokeWidth="2"/><path d="M5 9L8 6L11 9" stroke="currentColor" strokeWidth="2"/><path d="M16 18V6" stroke="currentColor" strokeWidth="2"/><path d="M13 15L16 18L19 15" stroke="currentColor" strokeWidth="2"/></svg>
);

export const Compare: React.FC<IconProps> = ({ className = '', size = 24 }) => (
  <svg {...base(size, className)}><rect x="4" y="5" width="6" height="14" rx="1" stroke="currentColor" strokeWidth="2"/><rect x="14" y="5" width="6" height="14" rx="1" stroke="currentColor" strokeWidth="2"/><path d="M10 12H14" stroke="currentColor" strokeWidth="2"/></svg>
);

export const Wishlist: React.FC<IconProps> = ({ className = '', size = 24 }) => (
  <svg {...base(size, className)}><path d="M7 4H17C18.1046 4 19 4.89543 19 6V20L12 16.5L5 20V6C5 4.89543 5.89543 4 7 4Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/></svg>
);

export const RecentlyViewed: React.FC<IconProps> = ({ className = '', size = 24 }) => (
  <svg {...base(size, className)}><circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="2"/><path d="M12 8V12L15 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
);

export const MoneyBack: React.FC<IconProps> = ({ className = '', size = 24 }) => (
  <svg {...base(size, className)}><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2"/><path d="M8 12H15" stroke="currentColor" strokeWidth="2"/><path d="M8 12L10 10" stroke="currentColor" strokeWidth="2"/><path d="M8 12L10 14" stroke="currentColor" strokeWidth="2"/></svg>
);

export const VerifiedSeller: React.FC<IconProps> = ({ className = '', size = 24 }) => (
  <svg {...base(size, className)}><path d="M4 10L12 4L20 10V20H4V10Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/><path d="M9 14.5L11 16.5L15 12.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
);

export const BestPrice: React.FC<IconProps> = ({ className = '', size = 24 }) => (
  <svg {...base(size, className)}><path d="M20 13.4L11 22.4L1.6 13L10.6 4C11 3.6 11.5 3.4 12 3.4C12.5 3.4 13 3.6 13.4 4L20 10.6C20.4 11 20.6 11.5 20.6 12C20.6 12.5 20.4 13 20 13.4Z" stroke="currentColor" strokeWidth="2"/><circle cx="8" cy="8" r="1.2" fill="currentColor"/></svg>
);

export const AuthenticProduct: React.FC<IconProps> = ({ className = '', size = 24 }) => (
  <svg {...base(size, className)}><circle cx="12" cy="10" r="6" stroke="currentColor" strokeWidth="2"/><path d="M10 16L8 21L12 19L16 21L14 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M9.8 10.2L11.2 11.6L14.2 8.6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
);

export const BundleOffer: React.FC<IconProps> = ({ className = '', size = 24 }) => (
  <svg {...base(size, className)}><rect x="3" y="7" width="18" height="13" rx="2" stroke="currentColor" strokeWidth="2"/><path d="M3 11H21" stroke="currentColor" strokeWidth="2"/><path d="M12 7V20" stroke="currentColor" strokeWidth="2"/><path d="M9 6C9 4.9 9.9 4 11 4C12 4 12 5 12 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><path d="M15 6C15 4.9 14.1 4 13 4C12 4 12 5 12 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
);
