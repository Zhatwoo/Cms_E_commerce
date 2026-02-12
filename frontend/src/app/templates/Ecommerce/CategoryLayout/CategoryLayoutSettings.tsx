"use client";

import React, { useState } from "react";
import { useNode } from "@craftjs/core";
import type { CategoryLayoutProps, FilterGroup } from "../_shared/types";
import { DesignSection } from "../../../design/_components/rightPanel/settings/DesignSection";
import { NumericInput } from "../../../design/_components/rightPanel/settings/inputs/NumericInput";
import { ColorSettingsGrid, ToggleList, TextField } from "../_shared";
import { Plus, Trash2, ChevronDown, ChevronUp } from "lucide-react";

type SetProp = (cb: (props: CategoryLayoutProps) => void, throttleRate?: number) => void;

const CAT_COLORS = [
  { key: "backgroundColor", label: "Background", fallback: "#f8fafc" },
  { key: "cardBackgroundColor", label: "Card Background", fallback: "#ffffff" },
  { key: "categoryNameColor", label: "Category Name", fallback: "#1e293b" },
  { key: "categoryDescriptionColor", label: "Category Desc", fallback: "#64748b" },
  { key: "productTitleColor", label: "Product Title", fallback: "#111827" },
  { key: "ratingColor", label: "Rating Star", fallback: "#facc15" },
  { key: "priceColor", label: "Price", fallback: "#3b82f6" },
  { key: "originalPriceColor", label: "Original Price", fallback: "#9ca3af" },
  { key: "discountBadgeColor", label: "Discount Badge", fallback: "#ef4444" },
];

const CAT_TOGGLES = [
  { key: "showCategoryHeader", label: "Show Header", fallback: true },
  { key: "showFilters", label: "Show Filters", fallback: true },
  { key: "showSort", label: "Show Sort", fallback: true },
  { key: "showSidebar", label: "Show Sidebar", fallback: false },
  { key: "showDescription", label: "Show Description", fallback: false },
  { key: "showRating", label: "Show Rating", fallback: true },
  { key: "cardShadow", label: "Card Shadow", fallback: true },
];

export const CategoryLayoutSettings: React.FC = () => {
  const [expandedFilter, setExpandedFilter] = useState<string | null>(null);
  const { actions: { setProp }, props } = useNode((node) => ({ props: node.data.props as CategoryLayoutProps }));
  const typedSetProp = setProp as unknown as SetProp;

  return (
    <div className="flex flex-col pb-4">
      <DesignSection title="Category Header">
        <div className="flex flex-col gap-2">
          <TextField label="Category Name" value={props.categoryName || ""} onChange={(v) => typedSetProp((p) => { p.categoryName = v; })} />
          <div>
            <label className="text-[10px] text-brand-lighter">Description</label>
            <textarea value={props.categoryDescription || ""} onChange={(e) => typedSetProp((p) => { p.categoryDescription = e.target.value; })} rows={2}
              className="w-full bg-brand-medium-dark border border-brand-medium/30 rounded-md text-xs text-brand-lighter p-1.5 focus:outline-none resize-none" />
          </div>
          <TextField label="Banner Image URL" value={props.bannerImage || ""} onChange={(v) => typedSetProp((p) => { p.bannerImage = v; })} />
          <div><label className="text-[10px] text-brand-lighter">Banner Height (px)</label>
            <NumericInput value={props.bannerHeight ?? 160} min={80} step={10} onChange={(val) => typedSetProp((p) => { p.bannerHeight = val ?? 160; })} /></div>
        </div>
      </DesignSection>

      <DesignSection title="Products">
        <div className="flex flex-col gap-2">
          <div><label className="text-[10px] text-brand-lighter">Number of Products</label>
            <NumericInput value={props.productCount ?? 6} min={1} max={20} step={1} onChange={(val) => typedSetProp((p) => { p.productCount = Math.max(1, val ?? 6); })} /></div>
        </div>
      </DesignSection>

      <DesignSection title="Toggles">
        <ToggleList items={CAT_TOGGLES} props={props as any} setProp={setProp} />
      </DesignSection>

      {props.showFilters !== false && (
        <DesignSection title="Filter Groups" defaultOpen={false}>
          <div className="flex flex-col gap-3">
            {(props.filterGroups as FilterGroup[] || []).map((group, groupIndex) => (
              <div key={group.key} className="bg-brand-dark/50 rounded-md p-2">
                <div className="flex items-center justify-between cursor-pointer" onClick={() => setExpandedFilter(expandedFilter === group.key ? null : group.key)}>
                  <span className="text-[11px] text-brand-lighter font-medium">{group.label}</span>
                  <div className="flex items-center gap-1">
                    <button onClick={(e) => { e.stopPropagation(); typedSetProp((p) => { const g = [...(p.filterGroups || [])]; g.splice(groupIndex, 1); p.filterGroups = g; }); }} className="p-1 text-brand-medium hover:text-red-400"><Trash2 size={12} /></button>
                    {expandedFilter === group.key ? <ChevronUp size={14} className="text-brand-medium" /> : <ChevronDown size={14} className="text-brand-medium" />}
                  </div>
                </div>
                {expandedFilter === group.key && (
                  <div className="mt-2 flex flex-col gap-2">
                    <TextField label="Filter Label" value={group.label} onChange={(v) => typedSetProp((p) => { const g = [...(p.filterGroups || [])]; g[groupIndex] = { ...g[groupIndex], label: v }; p.filterGroups = g; })} />
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] text-brand-medium">Options</label>
                      {group.options.map((option, optIndex) => (
                        <div key={optIndex} className="flex items-center gap-1">
                          <input type="text" value={option.label} onChange={(e) => typedSetProp((p) => { const g = [...(p.filterGroups || [])] as FilterGroup[]; const o = [...g[groupIndex].options]; o[optIndex] = { ...o[optIndex], label: e.target.value, value: e.target.value.toLowerCase().replace(/\s+/g, '-') }; g[groupIndex] = { ...g[groupIndex], options: o }; p.filterGroups = g; })}
                            className="flex-1 bg-brand-medium-dark border border-brand-medium/30 rounded-md text-xs text-brand-lighter p-1 focus:outline-none" />
                          <button onClick={() => typedSetProp((p) => { const g = [...(p.filterGroups || [])] as FilterGroup[]; const o = [...g[groupIndex].options]; o.splice(optIndex, 1); g[groupIndex] = { ...g[groupIndex], options: o }; p.filterGroups = g; })} className="p-1 text-brand-medium hover:text-red-400"><Trash2 size={10} /></button>
                        </div>
                      ))}
                      <button onClick={() => typedSetProp((p) => { const g = [...(p.filterGroups || [])] as FilterGroup[]; g[groupIndex] = { ...g[groupIndex], options: [...g[groupIndex].options, { label: "New Option", value: "new-option" }] }; p.filterGroups = g; })}
                        className="flex items-center gap-1 text-[10px] text-brand-medium hover:text-brand-lighter mt-1"><Plus size={10} /> Add Option</button>
                    </div>
                  </div>
                )}
              </div>
            ))}
            <button onClick={() => typedSetProp((p) => { const g = [...(p.filterGroups || [])] as FilterGroup[]; g.push({ key: `filter-${Date.now()}`, label: "New Filter", options: [{ label: "Option 1", value: "option-1" }] }); p.filterGroups = g; })}
              className="flex items-center justify-center gap-1 text-[11px] text-brand-medium hover:text-brand-lighter bg-brand-medium-dark border border-brand-medium/30 rounded-md p-2"><Plus size={12} /> Add Filter Group</button>
          </div>
        </DesignSection>
      )}

      {props.showSidebar && (
        <DesignSection title="Subcategories" defaultOpen={false}>
          <div className="flex flex-col gap-2">
            {(props.subcategories as Array<{id: string; name: string; count?: number}> || []).map((sub, index) => (
              <div key={sub.id} className="flex items-center gap-1">
                <input type="text" value={sub.name} onChange={(e) => typedSetProp((p) => { const s = [...(p.subcategories || [])]; s[index] = { ...s[index], name: e.target.value, id: e.target.value.toLowerCase().replace(/\s+/g, '-') }; p.subcategories = s; })}
                  className="flex-1 bg-brand-medium-dark border border-brand-medium/30 rounded-md text-xs text-brand-lighter p-1.5 focus:outline-none" />
                <button onClick={() => typedSetProp((p) => { const s = [...(p.subcategories || [])]; s.splice(index, 1); p.subcategories = s; })} className="p-1 text-brand-medium hover:text-red-400"><Trash2 size={12} /></button>
              </div>
            ))}
            <button onClick={() => typedSetProp((p) => { const s = [...(p.subcategories || [])]; s.push({ id: `sub-${Date.now()}`, name: "New Category", count: 0 }); p.subcategories = s; })}
              className="flex items-center justify-center gap-1 text-[11px] text-brand-medium hover:text-brand-lighter bg-brand-medium-dark border border-brand-medium/30 rounded-md p-2"><Plus size={12} /> Add Subcategory</button>
          </div>
        </DesignSection>
      )}

      <DesignSection title="Layout">
        <div className="flex flex-col gap-2">
          <div className="grid grid-cols-2 gap-2">
            <div><label className="text-[10px] text-brand-lighter">Columns</label>
              <NumericInput value={props.columns ?? 4} min={1} max={5} step={1} onChange={(val) => typedSetProp((p) => { p.columns = Math.max(1, Math.min(5, val ?? 4)); })} /></div>
            <div><label className="text-[10px] text-brand-lighter">Gap (px)</label>
              <NumericInput value={props.gap ?? 20} min={0} step={4} onChange={(val) => typedSetProp((p) => { p.gap = val ?? 20; })} /></div>
          </div>
          <div><label className="text-[10px] text-brand-lighter">Image Height (px)</label>
            <NumericInput value={props.imageHeight ?? 180} min={80} step={10} onChange={(val) => typedSetProp((p) => { p.imageHeight = val ?? 180; })} /></div>
          <div><label className="text-[10px] text-brand-lighter">Border Radius (px)</label>
            <NumericInput value={props.cardBorderRadius ?? 12} min={0} step={2} onChange={(val) => typedSetProp((p) => { p.cardBorderRadius = val ?? 12; })} /></div>
        </div>
      </DesignSection>

      <DesignSection title="Button">
        <div className="flex flex-col gap-2">
          <TextField label="Button Text" value={props.buttonText || "Add to Cart"} onChange={(v) => typedSetProp((p) => { p.buttonText = v; })} />
          <div><label className="text-[10px] text-brand-lighter">Button Style</label>
            <select value={props.buttonVariant || "primary"} onChange={(e) => typedSetProp((p) => { p.buttonVariant = e.target.value as CategoryLayoutProps["buttonVariant"]; })}
              className="w-full bg-brand-medium-dark border border-brand-medium/30 rounded-md text-xs text-brand-lighter p-1.5 focus:outline-none">
              <option value="primary">Primary (Blue)</option><option value="secondary">Secondary (Green)</option><option value="outline">Outline</option><option value="custom">Custom Color</option>
            </select></div>
        </div>
      </DesignSection>

      <DesignSection title="Pagination" defaultOpen={false}>
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between"><label className="text-xs text-brand-lighter">Show Pagination</label>
            <input type="checkbox" checked={props.showPagination !== false} onChange={(e) => typedSetProp((p) => { p.showPagination = e.target.checked; })} className="w-4 h-4 rounded cursor-pointer" /></div>
          <div><label className="text-[10px] text-brand-lighter">Style</label>
            <select value={props.paginationStyle || "loadmore"} onChange={(e) => typedSetProp((p) => { p.paginationStyle = e.target.value as CategoryLayoutProps["paginationStyle"]; })}
              className="w-full bg-brand-medium-dark border border-brand-medium/30 rounded-md text-xs text-brand-lighter p-1.5 focus:outline-none">
              <option value="loadmore">Load More</option><option value="numbered">Numbered Pages</option></select></div>
          <div><label className="text-[10px] text-brand-lighter">Products Per Page</label>
            <NumericInput value={props.productsPerPage ?? 8} min={1} step={1} onChange={(val) => typedSetProp((p) => { p.productsPerPage = Math.max(1, val ?? 8); })} /></div>
        </div>
      </DesignSection>

      <DesignSection title="Colors" defaultOpen={false}>
        <ColorSettingsGrid items={CAT_COLORS} props={props as any} setProp={setProp} />
      </DesignSection>

      <DesignSection title="Empty State" defaultOpen={false}>
        <TextField label="Empty State Text" value={props.emptyStateText || "No products found"} onChange={(v) => typedSetProp((p) => { p.emptyStateText = v; })} />
      </DesignSection>
    </div>
  );
};
