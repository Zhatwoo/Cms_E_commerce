"use client";

import React from "react";
import { useNode } from "@craftjs/core";
import type { CartLayoutProps, CartItem } from "../_shared/types";
import { DesignSection } from "../../../design/_components/rightPanel/settings/DesignSection";
import { NumericInput } from "../../../design/_components/rightPanel/settings/inputs/NumericInput";
import { ColorSettingsGrid, ToggleList, TextField, ItemListEditor } from "../_shared";

const CART_ITEM_FIELDS = [
  { key: "name", label: "Name", type: "text" as const },
  { key: "variant", label: "Variant", type: "text" as const },
  { key: "price", label: "Price", type: "number" as const, min: 0, step: 0.01 },
  { key: "quantity", label: "Quantity", type: "number" as const, min: 1, step: 1 },
  { key: "image", label: "Image URL", type: "image" as const },
];

const CART_FEATURE_TOGGLES = [
  { key: "showPromoCode", label: "Promo Code Input", fallback: true },
  { key: "showShippingEstimate", label: "Shipping Estimate", fallback: true },
  { key: "showContinueShopping", label: "Continue Shopping Button", fallback: true },
  { key: "showItemVariant", label: "Item Variants", fallback: true },
  { key: "showItemImage", label: "Item Images", fallback: true },
];

const CART_COLORS = [
  { key: "backgroundColor", label: "Background", fallback: "#f8fafc" },
  { key: "cardBackgroundColor", label: "Card Background", fallback: "#ffffff" },
  { key: "summaryBackgroundColor", label: "Summary Background", fallback: "#ffffff" },
  { key: "titleColor", label: "Title", fallback: "#0f172a" },
  { key: "labelColor", label: "Labels", fallback: "#334155" },
  { key: "priceColor", label: "Price", fallback: "#475569" },
  { key: "totalPriceColor", label: "Total", fallback: "#1e293b" },
  { key: "borderColor", label: "Borders", fallback: "#e2e8f0" },
  { key: "buttonBackgroundColor", label: "Button Background", fallback: "#3b82f6" },
  { key: "buttonTextColor", label: "Button Text", fallback: "#ffffff" },
  { key: "secondaryButtonTextColor", label: "Secondary Button", fallback: "#3b82f6" },
  { key: "removeButtonColor", label: "Remove Button", fallback: "#ef4444" },
];

export const CartLayoutSettings: React.FC = () => {
  const { actions: { setProp }, props } = useNode((node) => ({
    props: node.data.props as CartLayoutProps,
  }));

  const items = props.items || [];

  const handleItemChange = (itemId: string, field: string, value: any) => {
    setProp((p: CartLayoutProps) => {
      if (p.items) p.items = p.items.map((i) => (i.id === itemId ? { ...i, [field]: value } : i));
    });
  };

  const handleAddItem = () => {
    setProp((p: CartLayoutProps) => {
      const list = Array.isArray(p.items) ? p.items : [];
      p.items = [...list, { id: `item-${Date.now()}`, name: "New Product", variant: "Default", price: 0, quantity: 1, image: "https://placehold.co/120x120/999999/ffffff?text=New+Item" }];
    });
  };

  const handleDeleteItem = (itemId: string) => {
    setProp((p: CartLayoutProps) => { if (p.items) p.items = p.items.filter((i) => i.id !== itemId); });
  };

  return (
    <div className="space-y-4">
      <DesignSection title="Layout">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs text-brand-lighter">Show Order Summary</label>
            <input type="checkbox" checked={props.showOrderSummary ?? true}
              onChange={(e) => setProp((p: CartLayoutProps) => (p.showOrderSummary = e.target.checked))} className="w-4 h-4 rounded" />
          </div>
          {props.showOrderSummary && (
            <div>
              <label className="text-xs text-brand-lighter block mb-1">Summary Position</label>
              <select value={props.summaryPosition ?? "right"}
                onChange={(e) => setProp((p: CartLayoutProps) => (p.summaryPosition = e.target.value as "right" | "below"))}
                className="w-full bg-brand-medium-dark border border-brand-medium/30 rounded-md text-xs text-brand-lighter p-1.5 focus:outline-none">
                <option value="right">Right (Desktop)</option>
                <option value="below">Below Cart</option>
              </select>
            </div>
          )}
        </div>
      </DesignSection>

      <DesignSection title="Content">
        <div className="space-y-2">
          <TextField label="Title" value={props.title ?? "Shopping Cart"} onChange={(v) => setProp((p: CartLayoutProps) => (p.title = v))} />
          <TextField label="Checkout Button" value={props.checkoutButtonText ?? "Proceed to Checkout"} onChange={(v) => setProp((p: CartLayoutProps) => (p.checkoutButtonText = v))} />
          <TextField label="Continue Shopping" value={props.continueShoppingText ?? "← Continue Shopping"} onChange={(v) => setProp((p: CartLayoutProps) => (p.continueShoppingText = v))} />
          <TextField label="Promo Placeholder" value={props.promoPlaceholder ?? "Enter promo code"} onChange={(v) => setProp((p: CartLayoutProps) => (p.promoPlaceholder = v))} />
        </div>
      </DesignSection>

      <DesignSection title="Features">
        <ToggleList items={CART_FEATURE_TOGGLES} props={props as any} setProp={setProp} />
      </DesignSection>

      <DesignSection title="Cart Items">
        <ItemListEditor<CartItem> items={items} fields={CART_ITEM_FIELDS}
          onItemChange={handleItemChange} onAddItem={handleAddItem} onDeleteItem={handleDeleteItem}
          emptyText="No items in cart" />
      </DesignSection>

      <DesignSection title="Demo Prices" defaultOpen={false}>
        <div className="space-y-2">
          <div>
            <label className="text-xs text-brand-lighter block mb-1">Shipping ($)</label>
            <NumericInput value={props.shippingCost ?? 9.99} onChange={(v) => setProp((p: CartLayoutProps) => (p.shippingCost = v))} min={0} step={0.01} />
          </div>
          <div>
            <label className="text-xs text-brand-lighter block mb-1">Discount ($)</label>
            <NumericInput value={props.discount ?? 0} onChange={(v) => setProp((p: CartLayoutProps) => (p.discount = v))} min={0} step={0.01} />
          </div>
          <div>
            <label className="text-xs text-brand-lighter block mb-1">Tax Rate (%)</label>
            <NumericInput value={(props.taxRate ?? 0.08) * 100} onChange={(v) => setProp((p: CartLayoutProps) => (p.taxRate = (v ?? 0) / 100))} min={0} max={100} step={0.5} />
          </div>
        </div>
      </DesignSection>

      <DesignSection title="Styling" defaultOpen={false}>
        <div className="space-y-2">
          <div>
            <label className="text-xs text-brand-lighter block mb-1">Border Radius (px)</label>
            <NumericInput value={props.borderRadius ?? 12} onChange={(v) => setProp((p: CartLayoutProps) => (p.borderRadius = v))} min={0} max={50} />
          </div>
          <div>
            <label className="text-xs text-brand-lighter block mb-1">Button Border Radius (px)</label>
            <NumericInput value={props.buttonBorderRadius ?? 10} onChange={(v) => setProp((p: CartLayoutProps) => (p.buttonBorderRadius = v))} min={0} max={50} />
          </div>
          <div>
            <label className="text-xs text-brand-lighter block mb-1">Image Size (px)</label>
            <NumericInput value={props.imageSize ?? 96} onChange={(v) => setProp((p: CartLayoutProps) => (p.imageSize = v))} min={40} max={200} />
          </div>
        </div>
      </DesignSection>

      <DesignSection title="Colors" defaultOpen={false}>
        <ColorSettingsGrid items={CART_COLORS} props={props as any} setProp={setProp} />
      </DesignSection>
    </div>
  );
};

export default CartLayoutSettings;
