"use client";

import React from "react";
import { useNode } from "@craftjs/core";
import type { ProductListingProps } from "../_shared/types";
import { DesignSection } from "../../../design/_components/rightPanel/settings/DesignSection";
import { NumericInput } from "../../../design/_components/rightPanel/settings/inputs/NumericInput";
import { ProductListEditor } from "../_shared/ProductListEditor";

export const ProductListingSettings: React.FC = () => {
  const {
    title,
    subtitle,
    columns,
    gap,
    buttonVariant,
    showDescription,
    cardShadow,
    products,
    actions: { setProp },
  } = useNode((node) => ({
    title: node.data.props.title,
    subtitle: node.data.props.subtitle,
    columns: node.data.props.columns,
    gap: node.data.props.gap,
    buttonVariant: node.data.props.buttonVariant,
    showDescription: node.data.props.showDescription,
    cardShadow: node.data.props.cardShadow,
    products: node.data.props.products,
  }));

  const set = <K extends keyof ProductListingProps>(key: K, val: ProductListingProps[K]) =>
    setProp((p: ProductListingProps) => { (p as any)[key] = val; });

  const textInput = (label: string, value: string, key: keyof ProductListingProps) => (
    <div>
      <label className="text-[10px] text-brand-lighter">{label}</label>
      <input type="text" value={value} onChange={(e) => set(key, e.target.value as any)}
        className="w-full bg-brand-medium-dark border border-brand-medium/30 rounded-md text-xs text-brand-lighter p-1.5 focus:outline-none" />
    </div>
  );

  const checkbox = (label: string, checked: boolean, key: keyof ProductListingProps) => (
    <label className="flex items-center gap-2">
      <input type="checkbox" checked={checked} onChange={(e) => set(key, e.target.checked as any)} className="w-4 h-4 rounded cursor-pointer" />
      <span className="text-[10px] text-brand-lighter">{label}</span>
    </label>
  );

  return (
    <div className="flex flex-col gap-3 pb-4">
      <DesignSection title="Basics">
        <div className="flex flex-col gap-3">
          {textInput("Section Title", title || "Our Products", "title")}
          {textInput("Subtitle", subtitle || "Browse our collection", "subtitle")}
        </div>
      </DesignSection>

      <DesignSection title="Products">
        <ProductListEditor
          products={products || []}
          onChange={(list) => set("products", list)}
        />
      </DesignSection>

      <DesignSection title="Grid">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[10px] text-brand-lighter">Columns</label>
            <select value={columns || 3}
              onChange={(e) => set("columns", parseInt(e.target.value) as 1 | 2 | 3 | 4)}
              className="w-full bg-brand-medium-dark border border-brand-medium/30 rounded-md text-xs text-brand-lighter p-1.5 focus:outline-none">
              <option value={1}>1</option>
              <option value={2}>2</option>
              <option value={3}>3</option>
              <option value={4}>4</option>
            </select>
          </div>
          <div>
            <label className="text-[10px] text-brand-lighter">Gap (px)</label>
            <NumericInput value={gap ?? 24} onChange={(val) => set("gap", Math.max(0, Math.floor(val ?? 0)))} min={0} step={4} />
          </div>
        </div>
      </DesignSection>

      <DesignSection title="Style" defaultOpen={false}>
        <div className="flex flex-col gap-3">
          <div>
            <label className="text-[10px] text-brand-lighter">Button Style</label>
            <select value={buttonVariant || "primary"}
              onChange={(e) => set("buttonVariant", e.target.value as "primary" | "secondary" | "outline")}
              className="w-full bg-brand-medium-dark border border-brand-medium/30 rounded-md text-xs text-brand-lighter p-1.5 focus:outline-none">
              <option value="primary">Primary</option>
              <option value="secondary">Secondary</option>
              <option value="outline">Outline</option>
            </select>
          </div>
          {checkbox("Show Descriptions", showDescription !== false, "showDescription")}
          {checkbox("Show Shadows", cardShadow !== false, "cardShadow")}
        </div>
      </DesignSection>
    </div>
  );
};
