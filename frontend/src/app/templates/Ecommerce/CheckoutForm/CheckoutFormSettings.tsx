"use client";

import React from "react";
import { useNode } from "@craftjs/core";
import type { CheckoutFormProps } from "../_shared/types";
import { ColorInput } from "../../../design/_components/rightPanel/settings/inputs/ColorInput";
import { NumericInput } from "../../../design/_components/rightPanel/settings/inputs/NumericInput";

const TextInput: React.FC<{ label: string; value: string; onChange: (v: string) => void }> = ({ label, value, onChange }) => (
  <div>
    <label className="text-xs text-brand-lighter block mb-1">{label}</label>
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full bg-brand-medium-dark border border-brand-medium/30 rounded-md text-xs text-brand-lighter p-1.5 focus:outline-none"
    />
  </div>
);

const ColorRow: React.FC<{ label: string; value: string; onChange: (v: string) => void }> = ({ label, value, onChange }) => (
  <div>
    <label className="text-xs text-brand-lighter block mb-1">{label}</label>
    <div className="flex items-center gap-2">
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-8 h-8 rounded border border-brand-medium/30 cursor-pointer"
      />
      <ColorInput value={value} onChange={onChange} />
    </div>
  </div>
);

const SectionHeading: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <h3 className="text-xs font-semibold text-brand-lighter uppercase tracking-wide">{children}</h3>
);

export const CheckoutFormSettings = () => {
  const {
    actions: { setProp },
    props,
  } = useNode((node) => ({
    props: node.data.props as CheckoutFormProps,
  }));
  const set = <K extends keyof CheckoutFormProps>(key: K) => (val: CheckoutFormProps[K]) => setProp((p: CheckoutFormProps) => { (p as any)[key] = val; });

  const colorFields: Array<{ label: string; key: keyof CheckoutFormProps; fallback: string }> = [
    { label: "Background", key: "backgroundColor", fallback: "#f8fafc" },
    { label: "Form Background", key: "formBackgroundColor", fallback: "#ffffff" },
    { label: "Summary Background", key: "summaryBackgroundColor", fallback: "#ffffff" },
    { label: "Title Color", key: "titleColor", fallback: "#0f172a" },
    { label: "Label Color", key: "labelColor", fallback: "#334155" },
    { label: "Input Background", key: "inputBackgroundColor", fallback: "#f8fafc" },
    { label: "Input Text", key: "inputTextColor", fallback: "#1e293b" },
    { label: "Input Border", key: "inputBorderColor", fallback: "#e2e8f0" },
    { label: "Button Background", key: "buttonBackgroundColor", fallback: "#3b82f6" },
    { label: "Button Text", key: "buttonTextColor", fallback: "#ffffff" },
    { label: "Price Color", key: "priceColor", fallback: "#475569" },
    { label: "Total Price Color", key: "totalPriceColor", fallback: "#1e293b" },
  ];

  return (
    <div className="space-y-4">
      {/* Layout */}
      <div className="space-y-3">
        <SectionHeading>Layout</SectionHeading>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs text-brand-lighter">Show Order Summary</label>
            <input
              type="checkbox"
              checked={props.showOrderSummary ?? true}
              onChange={(e) => set("showOrderSummary")(e.target.checked)}
              className="w-4 h-4 rounded"
            />
          </div>
          {props.showOrderSummary && (
            <div>
              <label className="text-xs text-brand-lighter block mb-1">Summary Position</label>
              <select
                value={props.summaryPosition ?? "right"}
                onChange={(e) => set("summaryPosition")(e.target.value as "right" | "below")}
                className="w-full bg-brand-medium-dark border border-brand-medium/30 rounded-md text-xs text-brand-lighter p-1.5 focus:outline-none"
              >
                <option value="right">Right (Desktop)</option>
                <option value="below">Below Form</option>
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="space-y-3">
        <SectionHeading>Content</SectionHeading>
        <div className="space-y-2">
          <TextInput label="Title" value={props.title ?? "Checkout"} onChange={set("title")} />
          <TextInput label="Button Text" value={props.buttonText ?? "Place Order"} onChange={set("buttonText")} />
          <TextInput label="Subtotal Label" value={props.subtotalLabel ?? "Subtotal"} onChange={set("subtotalLabel")} />
          <TextInput label="Shipping Label" value={props.shippingLabel ?? "Shipping"} onChange={set("shippingLabel")} />
          <TextInput label="Tax Label" value={props.taxLabel ?? "Tax"} onChange={set("taxLabel")} />
          <TextInput label="Total Label" value={props.totalLabel ?? "Total"} onChange={set("totalLabel")} />
        </div>
      </div>

      {/* Demo Prices */}
      <div className="space-y-3">
        <SectionHeading>Demo Prices</SectionHeading>
        <div className="space-y-2">
          {([["Subtotal ($)", "subtotal", 279.98], ["Shipping ($)", "shipping", 10], ["Tax ($)", "tax", 23.20]] as const).map(([label, key, fallback]) => (
            <div key={key}>
              <label className="text-xs text-brand-lighter block mb-1">{label}</label>
              <NumericInput
                value={(props as any)[key] ?? fallback}
                onChange={set(key as keyof CheckoutFormProps)}
                min={0}
                step={0.01}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Colors */}
      <div className="space-y-3">
        <SectionHeading>Colors</SectionHeading>
        <div className="space-y-2">
          {colorFields.map(({ label, key, fallback }) => (
            <ColorRow key={key} label={label} value={(props as any)[key] ?? fallback} onChange={set(key)} />
          ))}
        </div>
      </div>

      {/* Styling */}
      <div className="space-y-3">
        <SectionHeading>Styling</SectionHeading>
        <div className="space-y-2">
          {([["Border Radius (px)", "borderRadius", 12, 50], ["Input Border Radius (px)", "inputBorderRadius", 8, 50], ["Button Border Radius (px)", "buttonBorderRadius", 10, 50]] as const).map(([label, key, fallback, max]) => (
            <div key={key}>
              <label className="text-xs text-brand-lighter block mb-1">{label}</label>
              <NumericInput
                value={(props as any)[key] ?? fallback}
                onChange={set(key as keyof CheckoutFormProps)}
                min={0}
                max={max}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CheckoutFormSettings;
