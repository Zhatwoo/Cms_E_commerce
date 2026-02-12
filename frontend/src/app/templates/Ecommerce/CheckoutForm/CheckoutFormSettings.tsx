"use client";

import React from "react";
import { useNode } from "@craftjs/core";
import { CheckoutFormProps } from "./CheckoutForm.types";
import { ColorInput } from "../../../design/_components/rightPanel/settings/inputs/ColorInput";
import { NumericInput } from "../../../design/_components/rightPanel/settings/inputs/NumericInput";

export const CheckoutFormSettings = () => {
  const {
    actions: { setProp },
    props,
  } = useNode((node) => ({
    props: node.data.props as CheckoutFormProps,
  }));

  return (
    <div className="space-y-4">
      {/* Layout Section */}
      <div className="space-y-3">
        <h3 className="text-xs font-semibold text-brand-lighter uppercase tracking-wide">
          Layout
        </h3>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs text-brand-lighter">Show Order Summary</label>
            <input
              type="checkbox"
              checked={props.showOrderSummary ?? true}
              onChange={(e) => setProp((props: CheckoutFormProps) => (props.showOrderSummary = e.target.checked))}
              className="w-4 h-4 rounded"
            />
          </div>
          
          {props.showOrderSummary && (
            <div>
              <label className="text-xs text-brand-lighter block mb-1">Summary Position</label>
              <select
                value={props.summaryPosition ?? "right"}
                onChange={(e) => setProp((props: CheckoutFormProps) => (props.summaryPosition = e.target.value as "right" | "below"))}
                className="w-full bg-brand-medium-dark border border-brand-medium/30 rounded-md text-xs text-brand-lighter p-1.5 focus:outline-none"
              >
                <option value="right">Right (Desktop)</option>
                <option value="below">Below Form</option>
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Content Section */}
      <div className="space-y-3">
        <h3 className="text-xs font-semibold text-brand-lighter uppercase tracking-wide">
          Content
        </h3>
        <div className="space-y-2">
          <div>
            <label className="text-xs text-brand-lighter block mb-1">Title</label>
            <input
              type="text"
              value={props.title ?? "Checkout"}
              onChange={(e) => setProp((props: CheckoutFormProps) => (props.title = e.target.value))}
              className="w-full bg-brand-medium-dark border border-brand-medium/30 rounded-md text-xs text-brand-lighter p-1.5 focus:outline-none"
            />
          </div>
          
          <div>
            <label className="text-xs text-brand-lighter block mb-1">Button Text</label>
            <input
              type="text"
              value={props.buttonText ?? "Place Order"}
              onChange={(e) => setProp((props: CheckoutFormProps) => (props.buttonText = e.target.value))}
              className="w-full bg-brand-medium-dark border border-brand-medium/30 rounded-md text-xs text-brand-lighter p-1.5 focus:outline-none"
            />
          </div>

          <div>
            <label className="text-xs text-brand-lighter block mb-1">Subtotal Label</label>
            <input
              type="text"
              value={props.subtotalLabel ?? "Subtotal"}
              onChange={(e) => setProp((props: CheckoutFormProps) => (props.subtotalLabel = e.target.value))}
              className="w-full bg-brand-medium-dark border border-brand-medium/30 rounded-md text-xs text-brand-lighter p-1.5 focus:outline-none"
            />
          </div>

          <div>
            <label className="text-xs text-brand-lighter block mb-1">Shipping Label</label>
            <input
              type="text"
              value={props.shippingLabel ?? "Shipping"}
              onChange={(e) => setProp((props: CheckoutFormProps) => (props.shippingLabel = e.target.value))}
              className="w-full bg-brand-medium-dark border border-brand-medium/30 rounded-md text-xs text-brand-lighter p-1.5 focus:outline-none"
            />
          </div>

          <div>
            <label className="text-xs text-brand-lighter block mb-1">Tax Label</label>
            <input
              type="text"
              value={props.taxLabel ?? "Tax"}
              onChange={(e) => setProp((props: CheckoutFormProps) => (props.taxLabel = e.target.value))}
              className="w-full bg-brand-medium-dark border border-brand-medium/30 rounded-md text-xs text-brand-lighter p-1.5 focus:outline-none"
            />
          </div>

          <div>
            <label className="text-xs text-brand-lighter block mb-1">Total Label</label>
            <input
              type="text"
              value={props.totalLabel ?? "Total"}
              onChange={(e) => setProp((props: CheckoutFormProps) => (props.totalLabel = e.target.value))}
              className="w-full bg-brand-medium-dark border border-brand-medium/30 rounded-md text-xs text-brand-lighter p-1.5 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Pricing Section */}
      <div className="space-y-3">
        <h3 className="text-xs font-semibold text-brand-lighter uppercase tracking-wide">
          Demo Prices
        </h3>
        <div className="space-y-2">
          <div>
            <label className="text-xs text-brand-lighter block mb-1">Subtotal ($)</label>
            <NumericInput
              value={props.subtotal ?? 279.98}
              onChange={(val) => setProp((props: CheckoutFormProps) => (props.subtotal = val))}
              min={0}
              step={0.01}
            />
          </div>

          <div>
            <label className="text-xs text-brand-lighter block mb-1">Shipping ($)</label>
            <NumericInput
              value={props.shipping ?? 10.00}
              onChange={(val) => setProp((props: CheckoutFormProps) => (props.shipping = val))}
              min={0}
              step={0.01}
            />
          </div>

          <div>
            <label className="text-xs text-brand-lighter block mb-1">Tax ($)</label>
            <NumericInput
              value={props.tax ?? 23.20}
              onChange={(val) => setProp((props: CheckoutFormProps) => (props.tax = val))}
              min={0}
              step={0.01}
            />
          </div>
        </div>
      </div>

      {/* Colors Section */}
      <div className="space-y-3">
        <h3 className="text-xs font-semibold text-brand-lighter uppercase tracking-wide">
          Colors
        </h3>
        <div className="space-y-2">
          <div>
            <label className="text-xs text-brand-lighter block mb-1">Background</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={props.backgroundColor ?? "#f8fafc"}
                onChange={(e) => setProp((props: CheckoutFormProps) => (props.backgroundColor = e.target.value))}
                className="w-8 h-8 rounded border border-brand-medium/30 cursor-pointer"
              />
              <ColorInput
                value={props.backgroundColor ?? "#f8fafc"}
                onChange={(val) => setProp((props: CheckoutFormProps) => (props.backgroundColor = val))}
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-brand-lighter block mb-1">Form Background</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={props.formBackgroundColor ?? "#ffffff"}
                onChange={(e) => setProp((props: CheckoutFormProps) => (props.formBackgroundColor = e.target.value))}
                className="w-8 h-8 rounded border border-brand-medium/30 cursor-pointer"
              />
              <ColorInput
                value={props.formBackgroundColor ?? "#ffffff"}
                onChange={(val) => setProp((props: CheckoutFormProps) => (props.formBackgroundColor = val))}
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-brand-lighter block mb-1">Summary Background</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={props.summaryBackgroundColor ?? "#ffffff"}
                onChange={(e) => setProp((props: CheckoutFormProps) => (props.summaryBackgroundColor = e.target.value))}
                className="w-8 h-8 rounded border border-brand-medium/30 cursor-pointer"
              />
              <ColorInput
                value={props.summaryBackgroundColor ?? "#ffffff"}
                onChange={(val) => setProp((props: CheckoutFormProps) => (props.summaryBackgroundColor = val))}
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-brand-lighter block mb-1">Title Color</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={props.titleColor ?? "#0f172a"}
                onChange={(e) => setProp((props: CheckoutFormProps) => (props.titleColor = e.target.value))}
                className="w-8 h-8 rounded border border-brand-medium/30 cursor-pointer"
              />
              <ColorInput
                value={props.titleColor ?? "#0f172a"}
                onChange={(val) => setProp((props: CheckoutFormProps) => (props.titleColor = val))}
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-brand-lighter block mb-1">Label Color</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={props.labelColor ?? "#334155"}
                onChange={(e) => setProp((props: CheckoutFormProps) => (props.labelColor = e.target.value))}
                className="w-8 h-8 rounded border border-brand-medium/30 cursor-pointer"
              />
              <ColorInput
                value={props.labelColor ?? "#334155"}
                onChange={(val) => setProp((props: CheckoutFormProps) => (props.labelColor = val))}
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-brand-lighter block mb-1">Input Background</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={props.inputBackgroundColor ?? "#f8fafc"}
                onChange={(e) => setProp((props: CheckoutFormProps) => (props.inputBackgroundColor = e.target.value))}
                className="w-8 h-8 rounded border border-brand-medium/30 cursor-pointer"
              />
              <ColorInput
                value={props.inputBackgroundColor ?? "#f8fafc"}
                onChange={(val) => setProp((props: CheckoutFormProps) => (props.inputBackgroundColor = val))}
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-brand-lighter block mb-1">Input Text</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={props.inputTextColor ?? "#1e293b"}
                onChange={(e) => setProp((props: CheckoutFormProps) => (props.inputTextColor = e.target.value))}
                className="w-8 h-8 rounded border border-brand-medium/30 cursor-pointer"
              />
              <ColorInput
                value={props.inputTextColor ?? "#1e293b"}
                onChange={(val) => setProp((props: CheckoutFormProps) => (props.inputTextColor = val))}
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-brand-lighter block mb-1">Input Border</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={props.inputBorderColor ?? "#e2e8f0"}
                onChange={(e) => setProp((props: CheckoutFormProps) => (props.inputBorderColor = e.target.value))}
                className="w-8 h-8 rounded border border-brand-medium/30 cursor-pointer"
              />
              <ColorInput
                value={props.inputBorderColor ?? "#e2e8f0"}
                onChange={(val) => setProp((props: CheckoutFormProps) => (props.inputBorderColor = val))}
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-brand-lighter block mb-1">Button Background</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={props.buttonBackgroundColor ?? "#3b82f6"}
                onChange={(e) => setProp((props: CheckoutFormProps) => (props.buttonBackgroundColor = e.target.value))}
                className="w-8 h-8 rounded border border-brand-medium/30 cursor-pointer"
              />
              <ColorInput
                value={props.buttonBackgroundColor ?? "#3b82f6"}
                onChange={(val) => setProp((props: CheckoutFormProps) => (props.buttonBackgroundColor = val))}
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-brand-lighter block mb-1">Button Text</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={props.buttonTextColor ?? "#ffffff"}
                onChange={(e) => setProp((props: CheckoutFormProps) => (props.buttonTextColor = e.target.value))}
                className="w-8 h-8 rounded border border-brand-medium/30 cursor-pointer"
              />
              <ColorInput
                value={props.buttonTextColor ?? "#ffffff"}
                onChange={(val) => setProp((props: CheckoutFormProps) => (props.buttonTextColor = val))}
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-brand-lighter block mb-1">Price Color</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={props.priceColor ?? "#475569"}
                onChange={(e) => setProp((props: CheckoutFormProps) => (props.priceColor = e.target.value))}
                className="w-8 h-8 rounded border border-brand-medium/30 cursor-pointer"
              />
              <ColorInput
                value={props.priceColor ?? "#475569"}
                onChange={(val) => setProp((props: CheckoutFormProps) => (props.priceColor = val))}
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-brand-lighter block mb-1">Total Price Color</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={props.totalPriceColor ?? "#1e293b"}
                onChange={(e) => setProp((props: CheckoutFormProps) => (props.totalPriceColor = e.target.value))}
                className="w-8 h-8 rounded border border-brand-medium/30 cursor-pointer"
              />
              <ColorInput
                value={props.totalPriceColor ?? "#1e293b"}
                onChange={(val) => setProp((props: CheckoutFormProps) => (props.totalPriceColor = val))}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Styling Section */}
      <div className="space-y-3">
        <h3 className="text-xs font-semibold text-brand-lighter uppercase tracking-wide">
          Styling
        </h3>
        <div className="space-y-2">
          <div>
            <label className="text-xs text-brand-lighter block mb-1">Border Radius (px)</label>
            <NumericInput
              value={props.borderRadius ?? 12}
              onChange={(val) => setProp((props: CheckoutFormProps) => (props.borderRadius = val))}
              min={0}
              max={50}
            />
          </div>

          <div>
            <label className="text-xs text-brand-lighter block mb-1">Input Border Radius (px)</label>
            <NumericInput
              value={props.inputBorderRadius ?? 8}
              onChange={(val) => setProp((props: CheckoutFormProps) => (props.inputBorderRadius = val))}
              min={0}
              max={50}
            />
          </div>

          <div>
            <label className="text-xs text-brand-lighter block mb-1">Button Border Radius (px)</label>
            <NumericInput
              value={props.buttonBorderRadius ?? 10}
              onChange={(val) => setProp((props: CheckoutFormProps) => (props.buttonBorderRadius = val))}
              min={0}
              max={50}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutFormSettings;
