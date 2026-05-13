'use client';
import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { createPortal } from 'react-dom';
import { type Product } from '../../lib/productsData';

type ThemeColors = {
  [key: string]: any;
};

function isImageSource(value: string): boolean {
  const v = (value || '').trim();
  if (!v) return false;
  if (/^data:image\/[a-zA-Z0-9.+-]+;base64,/i.test(v)) return true;
  if (/^https?:\/\//i.test(v)) return true;
  if (v.startsWith('blob:')) return true;
  if (v.startsWith('/')) return true;
  return false;
}

function normalizeImageSource(value: unknown): string {
  const raw = String(value || '').trim();
  if (!raw) return '';

  const repaired = raw
    .replace(/ImageProducts_img%2F/gi, 'Products_img%2F')
    .replace(/ImageProducts_img\//gi, 'Products_img/');

  if (isImageSource(repaired)) return repaired;

  const bucket = String(process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || '').trim();
  const looksLikeStoragePath = /^Products_img(?:\/|%2F)/i.test(repaired);
  if (!bucket || !looksLikeStoragePath) return '';

  const [pathPartRaw, queryRaw = ''] = repaired.split('?');
  const pathPart = pathPartRaw.includes('%2F') ? pathPartRaw : encodeURIComponent(pathPartRaw);
  const query = queryRaw.trim();
  const suffix = query ? `?${query}` : '?alt=media';
  return `https://firebasestorage.googleapis.com/v0/b/${bucket}/o/${pathPart}${suffix}`;
}

function getVariantOptionImages(product: Product): string[] {
  const seen = new Set<string>();
  const images: string[] = [];

  const variantGroups = Array.isArray(product.variants)
    ? product.variants.filter((variant) => Array.isArray(variant.options) && variant.options.length > 0)
    : [];

  for (const variant of variantGroups) {
    for (const option of variant.options) {
      const image = normalizeImageSource(option?.image);
      if (!isImageSource(image) || seen.has(image)) continue;
      seen.add(image);
      images.push(image);
    }
  }

  return images;
}

/**
 * A modal dialog that displays detailed product information with an image gallery.
 *
 * Features:
 * - Full-screen modal with dark overlay and backdrop blur.
 * - Image carousel with main view and scrollable thumbnail strip.
 * - Product details grid showing name, SKU, category, pricing, stock, status, and description.
 * - Edit button to transition back to product editing.
 * - Closes on ESC key or when clicking outside the modal.
 * - Prevents body scroll when modal is open.
 * - Rendered via React portal into document.body for proper z-index stacking.
 *
 * Parameters:
 * - `product`: The product object to display (optional - modal won't render if not provided).
 * - `onClose`: Callback fired when user clicks close button, presses ESC, or clicks the overlay.
 * - `colors`: Theme color palette used for styling text and backgrounds.
 * - `onEditProduct`: Callback fired when user clicks the Edit button to modify the product.
 */
export function ProductDetailsModal({
  product,
  onClose,
  colors,
  onEditProduct,
}: {
  product?: Product;
  onClose: () => void;
  colors: ThemeColors;
  onEditProduct: (product: Product) => void;
}) {
  const [currentImage, setCurrentImage] = useState(0);
  const thumbnailStripRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!product) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [product]);

  if (!product) return null;

  const baseGallery = (Array.isArray(product.images) && product.images.length > 0
    ? product.images
    : [product.image]
  )
    .map((img) => normalizeImageSource(img))
    .filter((img) => isImageSource(img));
  const variantGallery = getVariantOptionImages(product);
  const gallery = Array.from(new Set([...baseGallery, ...variantGallery]));

  const hasGallery = gallery.length > 0;

  useEffect(() => {
    setCurrentImage(0);
  }, [product.id]);

  useEffect(() => {
    if (currentImage < gallery.length) return;
    setCurrentImage(0);
  }, [currentImage, gallery.length]);

  const handleThumbnailWheel = (event: React.WheelEvent<HTMLDivElement>) => {
    const element = thumbnailStripRef.current;
    if (!element) return;
    if (Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return;

    event.preventDefault();
    element.scrollLeft += event.deltaY;
  };

  if (typeof document === 'undefined') return null;

  return createPortal(
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0"
      style={{ zIndex: 2147483000, backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)' }}
      onClick={onClose}
    >
      <div className="absolute inset-0 flex items-center justify-center p-4 md:p-8">
        <motion.div
          initial={{ scale: 0.98, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="w-full max-w-4xl rounded-2xl border overflow-hidden"
          style={{ backgroundColor: colors.bg.card, borderColor: colors.border.faint }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="px-5 py-4 border-b flex items-center justify-between" style={{ borderColor: colors.border.faint }}>
            <h2 className="text-lg font-semibold" style={{ color: colors.text.primary }}>Product Details</h2>
            <button
              type="button"
              onClick={onClose}
              className="w-10 h-10 rounded-full flex items-center justify-center transition-colors hover:bg-black/10 dark:hover:bg-white/10"
              style={{ color: colors.text.muted }}
              title="Close"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
            <div className="p-5 border-b lg:border-b-0 lg:border-r" style={{ borderColor: colors.border.faint }}>
              <div className="rounded-xl overflow-hidden border relative" style={{ borderColor: colors.border.faint, backgroundColor: colors.bg.elevated, height: 320 }}>
                {hasGallery ? (
                  <img src={gallery[currentImage]} alt={product.name} className="w-full h-full object-contain" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-sm" style={{ color: colors.text.muted }}>
                    No image
                  </div>
                )}

                {hasGallery && gallery.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={() => setCurrentImage((i) => (i - 1 + gallery.length) % gallery.length)}
                      className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full text-white"
                      style={{ backgroundColor: 'rgba(0,0,0,0.45)' }}
                    >
                      <svg className="w-5 h-5 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.3} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      onClick={() => setCurrentImage((i) => (i + 1) % gallery.length)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full text-white"
                      style={{ backgroundColor: 'rgba(0,0,0,0.45)' }}
                    >
                      <svg className="w-5 h-5 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.3} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </>
                )}
              </div>

              <div className="mt-3 mx-auto w-full" style={{ maxWidth: 312 }}>
                {hasGallery && gallery.length > 1 && (
                  <div
                    ref={thumbnailStripRef}
                    onWheel={handleThumbnailWheel}
                    className="overflow-x-scroll pb-1"
                  >
                    <div className="flex gap-2 min-w-max">
                      {gallery.map((img, idx) => (
                        <button
                          type="button"
                          key={`${product.id}-thumb-${idx}`}
                          onClick={() => setCurrentImage(idx)}
                          className="w-14 h-14 rounded-lg overflow-hidden border shrink-0"
                          style={{
                            borderColor: idx === currentImage ? '#3b82f6' : colors.border.faint,
                            backgroundColor: colors.bg.elevated,
                          }}
                        >
                          <img src={img} alt={`${product.name} ${idx + 1}`} className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => onEditProduct(product)}
                  className="mt-3 h-10 w-full rounded-lg text-sm font-semibold text-white"
                  style={{ background: 'linear-gradient(90deg, #9333ea 0%, #ec4899 100%)' }}
                >
                  Edit Product
                </button>
              </div>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <p className="text-xs uppercase tracking-wide" style={{ color: colors.text.muted }}>Name</p>
                <p className="text-lg font-semibold" style={{ color: colors.text.primary }}>{product.name}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs uppercase tracking-wide" style={{ color: colors.text.muted }}>SKU</p>
                  <p style={{ color: '#A78BFA' }}>{product.sku || '-'}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide" style={{ color: colors.text.muted }}>Category</p>
                  <p style={{ color: '#A78BFA' }}>{product.category || '-'}</p>
                </div>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide" style={{ color: colors.text.muted }}>Subcategory</p>
                <p style={{ color: '#A78BFA' }}>{product.subcategory || '-'}</p>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <p className="text-xs uppercase tracking-wide" style={{ color: colors.text.muted }}>Price</p>
                  <p className="font-semibold" style={{ color: '#A78BFA' }}>₱{product.price.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide" style={{ color: colors.text.muted }}>Stock</p>
                  <p className="font-semibold" style={{ color: colors.text.primary }}>{product.stock}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide" style={{ color: colors.text.muted }}>Status</p>
                  <p
                    className="font-semibold capitalize"
                    style={{
                      color:
                        product.status === 'active'
                          ? '#22c55e'
                          : product.status === 'inactive'
                            ? '#ef4444'
                            : colors.text.primary,
                    }}
                  >
                    {product.status}
                  </p>
                </div>
              </div>
              <div className="pt-3 border-t" style={{ borderColor: colors.border.faint }}>
                <p className="text-xs uppercase tracking-wide mb-1" style={{ color: colors.text.muted }}>Description</p>
                <div className="max-h-36 overflow-y-auto pr-1">
                  <p className="text-sm leading-6 whitespace-pre-wrap" style={{ color: '#ffffff' }}>
                    {product.description || 'No description.'}
                  </p>
                </div>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide" style={{ color: colors.text.muted }}>Created</p>
                <p className="text-sm" style={{ color: colors.text.secondary }}>
                  {new Date(product.createdAt).toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>,
    document.body
  );
}
