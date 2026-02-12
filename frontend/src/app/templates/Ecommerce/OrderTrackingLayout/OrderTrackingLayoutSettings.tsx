"use client";

import React from "react";
import { useNode } from "@craftjs/core";
import type { OrderTrackingLayoutProps, OrderTrackingItem, OrderStatus } from "../_shared/types";
import { DesignSection } from "../../../design/_components/rightPanel/settings/DesignSection";
import { NumericInput } from "../../../design/_components/rightPanel/settings/inputs/NumericInput";
import { ColorSettingsGrid, ToggleList, TextField, ItemListEditor, StepListEditor } from "../_shared";

const STATUS_OPTIONS: { value: OrderStatus; label: string }[] = [
  { value: "confirmed", label: "Confirmed" },
  { value: "processing", label: "Processing" },
  { value: "shipped", label: "Shipped" },
  { value: "out_for_delivery", label: "Out for Delivery" },
  { value: "delivered", label: "Delivered" },
];

const OT_ITEM_FIELDS = [
  { key: "name", label: "Name", type: "text" as const },
  { key: "price", label: "Price", type: "number" as const, min: 0, step: 0.01 },
  { key: "quantity", label: "Quantity", type: "number" as const, min: 1, step: 1 },
  { key: "image", label: "Image URL", type: "image" as const },
];

const OT_TOGGLES = [
  { key: "showItemsSummary", label: "Show Order Items", fallback: true },
  { key: "showShippingAddress", label: "Show Shipping Address", fallback: true },
  { key: "showCarrierInfo", label: "Show Carrier Info", fallback: true },
  { key: "showContactSupport", label: "Show Contact Support", fallback: true },
  { key: "showEstimatedDelivery", label: "Show Estimated Delivery", fallback: true },
];

const OT_COLORS = [
  { key: "backgroundColor", label: "Background", fallback: "#f8fafc" },
  { key: "cardBackgroundColor", label: "Card Background", fallback: "#ffffff" },
  { key: "titleColor", label: "Title", fallback: "#0f172a" },
  { key: "labelColor", label: "Labels", fallback: "#64748b" },
  { key: "valueColor", label: "Values", fallback: "#1e293b" },
  { key: "borderColor", label: "Borders", fallback: "#e2e8f0" },
  { key: "activeStepColor", label: "Active Step", fallback: "#3b82f6" },
  { key: "completedStepColor", label: "Completed Step", fallback: "#22c55e" },
  { key: "pendingStepColor", label: "Pending Step", fallback: "#cbd5e1" },
  { key: "buttonBackgroundColor", label: "Button Background", fallback: "#3b82f6" },
  { key: "buttonTextColor", label: "Button Text", fallback: "#ffffff" },
  { key: "statusBadgeColor", label: "Status Badge BG", fallback: "#dbeafe" },
  { key: "statusBadgeTextColor", label: "Status Badge Text", fallback: "#1d4ed8" },
];

export const OrderTrackingLayoutSettings: React.FC = () => {
  const { actions: { setProp }, props } = useNode((node) => ({
    props: node.data.props as OrderTrackingLayoutProps,
  }));

  const items = props.items || [];
  const steps = props.steps || [];

  const handleItemChange = (itemId: string, field: string, value: any) => {
    setProp((p: OrderTrackingLayoutProps) => { if (p.items) p.items = p.items.map((i) => (i.id === itemId ? { ...i, [field]: value } : i)); });
  };
  const handleAddItem = () => {
    setProp((p: OrderTrackingLayoutProps) => {
      const list = Array.isArray(p.items) ? p.items : [];
      p.items = [...list, { id: `item-${Date.now()}`, name: "New Item", quantity: 1, price: 0, image: "https://placehold.co/80x80/999999/ffffff?text=New" }];
    });
  };
  const handleDeleteItem = (itemId: string) => { setProp((p: OrderTrackingLayoutProps) => { if (p.items) p.items = p.items.filter((i) => i.id !== itemId); }); };
  const handleStepChange = (idx: number, field: string, value: any) => {
    setProp((p: OrderTrackingLayoutProps) => { if (p.steps) p.steps = p.steps.map((s, i) => (i === idx ? { ...s, [field]: value } : s)); });
  };

  return (
    <div className="space-y-4">
      <DesignSection title="Order Info">
        <div className="space-y-2">
          <TextField label="Title" value={props.title ?? "Order Tracking"} onChange={(v) => setProp((p: OrderTrackingLayoutProps) => (p.title = v))} />
          <TextField label="Order Number" value={props.orderNumber ?? ""} onChange={(v) => setProp((p: OrderTrackingLayoutProps) => (p.orderNumber = v))} />
          <TextField label="Tracking Number" value={props.trackingNumber ?? ""} onChange={(v) => setProp((p: OrderTrackingLayoutProps) => (p.trackingNumber = v))} />
          <TextField label="Order Date" value={props.orderDate ?? ""} onChange={(v) => setProp((p: OrderTrackingLayoutProps) => (p.orderDate = v))} />
          <TextField label="Estimated Delivery" value={props.estimatedDelivery ?? ""} onChange={(v) => setProp((p: OrderTrackingLayoutProps) => (p.estimatedDelivery = v))} />
          <div>
            <label className="text-xs text-brand-lighter block mb-1">Current Status</label>
            <select value={props.currentStatus ?? "shipped"} onChange={(e) => setProp((p: OrderTrackingLayoutProps) => (p.currentStatus = e.target.value as OrderStatus))}
              className="w-full bg-brand-medium-dark border border-brand-medium/30 rounded-md text-xs text-brand-lighter p-1.5 focus:outline-none">
              {STATUS_OPTIONS.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
          </div>
        </div>
      </DesignSection>

      <DesignSection title="Layout">
        <div className="space-y-2">
          <div>
            <label className="text-xs text-brand-lighter block mb-1">Timeline Layout</label>
            <select value={props.layoutMode ?? "vertical"} onChange={(e) => setProp((p: OrderTrackingLayoutProps) => (p.layoutMode = e.target.value as "vertical" | "horizontal"))}
              className="w-full bg-brand-medium-dark border border-brand-medium/30 rounded-md text-xs text-brand-lighter p-1.5 focus:outline-none">
              <option value="vertical">Vertical</option>
              <option value="horizontal">Horizontal</option>
            </select>
          </div>
          <ToggleList items={OT_TOGGLES} props={props as any} setProp={setProp} />
        </div>
      </DesignSection>

      <DesignSection title="Shipping Address" defaultOpen={false}>
        <div className="space-y-2">
          <TextField label="Name" value={props.shippingName ?? ""} onChange={(v) => setProp((p: OrderTrackingLayoutProps) => (p.shippingName = v))} />
          <TextField label="Address" value={props.shippingAddress ?? ""} onChange={(v) => setProp((p: OrderTrackingLayoutProps) => (p.shippingAddress = v))} />
          <div className="grid grid-cols-2 gap-2">
            <TextField label="City" value={props.shippingCity ?? ""} onChange={(v) => setProp((p: OrderTrackingLayoutProps) => (p.shippingCity = v))} />
            <TextField label="State" value={props.shippingState ?? ""} onChange={(v) => setProp((p: OrderTrackingLayoutProps) => (p.shippingState = v))} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <TextField label="ZIP" value={props.shippingZip ?? ""} onChange={(v) => setProp((p: OrderTrackingLayoutProps) => (p.shippingZip = v))} />
            <TextField label="Country" value={props.shippingCountry ?? ""} onChange={(v) => setProp((p: OrderTrackingLayoutProps) => (p.shippingCountry = v))} />
          </div>
          <TextField label="Section Title" value={props.shippingTitle ?? "Shipping Address"} onChange={(v) => setProp((p: OrderTrackingLayoutProps) => (p.shippingTitle = v))} />
        </div>
      </DesignSection>

      <DesignSection title="Carrier" defaultOpen={false}>
        <div className="space-y-2">
          <TextField label="Carrier Name" value={props.carrierName ?? ""} onChange={(v) => setProp((p: OrderTrackingLayoutProps) => (p.carrierName = v))} />
          <TextField label="Carrier Logo URL" value={props.carrierLogo ?? ""} onChange={(v) => setProp((p: OrderTrackingLayoutProps) => (p.carrierLogo = v))} />
          {props.carrierLogo && <img src={props.carrierLogo} alt="Carrier" className="w-full h-10 object-contain rounded mt-1 border border-brand-medium/20" />}
          <TextField label="Tracking URL" value={props.carrierTrackingUrl ?? "#"} onChange={(v) => setProp((p: OrderTrackingLayoutProps) => (p.carrierTrackingUrl = v))} />
          <TextField label="Section Title" value={props.carrierTitle ?? "Carrier Information"} onChange={(v) => setProp((p: OrderTrackingLayoutProps) => (p.carrierTitle = v))} />
        </div>
      </DesignSection>

      <DesignSection title="Tracking Steps" defaultOpen={false}>
        <StepListEditor steps={steps} onStepChange={handleStepChange} />
      </DesignSection>

      <DesignSection title="Order Items" defaultOpen={false}>
        <ItemListEditor<OrderTrackingItem> items={items} fields={OT_ITEM_FIELDS}
          onItemChange={handleItemChange} onAddItem={handleAddItem} onDeleteItem={handleDeleteItem} emptyText="No items" />
      </DesignSection>

      <DesignSection title="Content Labels" defaultOpen={false}>
        <div className="space-y-2">
          <TextField label="Contact Button Text" value={props.contactButtonText ?? "Contact Support"} onChange={(v) => setProp((p: OrderTrackingLayoutProps) => (p.contactButtonText = v))} />
          <TextField label="Items Summary Title" value={props.itemsSummaryTitle ?? "Order Items"} onChange={(v) => setProp((p: OrderTrackingLayoutProps) => (p.itemsSummaryTitle = v))} />
        </div>
      </DesignSection>

      <DesignSection title="Styling" defaultOpen={false}>
        <div className="space-y-2">
          <div><label className="text-xs text-brand-lighter block mb-1">Border Radius (px)</label>
            <NumericInput value={props.borderRadius ?? 12} onChange={(v) => setProp((p: OrderTrackingLayoutProps) => (p.borderRadius = v))} min={0} max={50} /></div>
          <div><label className="text-xs text-brand-lighter block mb-1">Button Border Radius (px)</label>
            <NumericInput value={props.buttonBorderRadius ?? 10} onChange={(v) => setProp((p: OrderTrackingLayoutProps) => (p.buttonBorderRadius = v))} min={0} max={50} /></div>
        </div>
      </DesignSection>

      <DesignSection title="Colors" defaultOpen={false}>
        <ColorSettingsGrid items={OT_COLORS} props={props as any} setProp={setProp} />
      </DesignSection>
    </div>
  );
};

export default OrderTrackingLayoutSettings;
