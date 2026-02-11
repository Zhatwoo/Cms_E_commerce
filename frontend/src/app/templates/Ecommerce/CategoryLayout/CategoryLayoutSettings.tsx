"use client";

import React, { useState } from "react";
import { useNode } from "@craftjs/core";
import { DesignSection } from "../../../design/_components/rightPanel/settings/DesignSection";
import { NumericInput } from "../../../design/_components/rightPanel/settings/inputs/NumericInput";
import { ColorInput } from "../../../design/_components/rightPanel/settings/inputs/ColorInput";
import type { CategoryLayoutProps } from "./CategoryLayout";
import { Plus, Trash2, ChevronDown, ChevronUp } from "lucide-react";

type SetProp = (cb: (props: CategoryLayoutProps) => void, throttleRate?: number) => void;

interface FilterOption {
  label: string;
  value: string;
  count?: number;
}

interface FilterGroup {
  key: string;
  label: string;
  options: FilterOption[];
}

export const CategoryLayoutSettings: React.FC = () => {
  const [expandedFilter, setExpandedFilter] = useState<string | null>(null);

  const {
    // Header
    categoryName, categoryDescription, bannerImage, bannerHeight, showCategoryHeader,
    // Filter & Sort
    showFilters, showSort, showSidebar, filterGroups, subcategories,
    // Layout
    columns, gap, imageHeight,
    // Colors
    backgroundColor, categoryNameColor, categoryDescriptionColor,
    priceColor, originalPriceColor, discountBadgeColor,
    productTitleColor, cardBackgroundColor, buttonColor, buttonTextColor, ratingColor,
    // Card
    cardBorderRadius, cardShadow,
    // Button
    buttonVariant, buttonText,
    // Products
    productCount, showDescription, showRating,
    // Pagination
    showPagination, paginationStyle, productsPerPage,
    // Empty
    emptyStateText,
    actions: { setProp },
  } = useNode((node) => ({
    // Header
    categoryName: node.data.props.categoryName,
    categoryDescription: node.data.props.categoryDescription,
    bannerImage: node.data.props.bannerImage,
    bannerHeight: node.data.props.bannerHeight,
    showCategoryHeader: node.data.props.showCategoryHeader,
    // Filter & Sort
    showFilters: node.data.props.showFilters,
    showSort: node.data.props.showSort,
    showSidebar: node.data.props.showSidebar,
    filterGroups: node.data.props.filterGroups,
    subcategories: node.data.props.subcategories,
    // Layout
    columns: node.data.props.columns,
    gap: node.data.props.gap,
    imageHeight: node.data.props.imageHeight,
    // Colors
    backgroundColor: node.data.props.backgroundColor,
    categoryNameColor: node.data.props.categoryNameColor,
    categoryDescriptionColor: node.data.props.categoryDescriptionColor,
    priceColor: node.data.props.priceColor,
    originalPriceColor: node.data.props.originalPriceColor,
    discountBadgeColor: node.data.props.discountBadgeColor,
    productTitleColor: node.data.props.productTitleColor,
    cardBackgroundColor: node.data.props.cardBackgroundColor,
    buttonColor: node.data.props.buttonColor,
    buttonTextColor: node.data.props.buttonTextColor,
    ratingColor: node.data.props.ratingColor,
    // Card
    cardBorderRadius: node.data.props.cardBorderRadius,
    cardShadow: node.data.props.cardShadow,
    // Button
    buttonVariant: node.data.props.buttonVariant,
    buttonText: node.data.props.buttonText,
    // Products
    productCount: node.data.props.productCount,
    showDescription: node.data.props.showDescription,
    showRating: node.data.props.showRating,
    // Pagination
    showPagination: node.data.props.showPagination,
    paginationStyle: node.data.props.paginationStyle,
    productsPerPage: node.data.props.productsPerPage,
    // Empty
    emptyStateText: node.data.props.emptyStateText,
  }));

  const typedSetProp = setProp as SetProp;

  return (
    <div className="flex flex-col pb-4">
      {/* Category Header */}
      <DesignSection title="Category Header">
        <div className="flex flex-col gap-2">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={showCategoryHeader !== false}
              onChange={(e) => typedSetProp((p) => { p.showCategoryHeader = e.target.checked; })}
              className="w-4 h-4 rounded cursor-pointer"
            />
            <span className="text-[10px] text-brand-lighter">Show Header</span>
          </label>
          <div>
            <label className="text-[10px] text-brand-lighter">Category Name</label>
            <input
              type="text"
              value={categoryName || ""}
              onChange={(e) => typedSetProp((p) => { p.categoryName = e.target.value; })}
              className="w-full bg-brand-medium-dark border border-brand-medium/30 rounded-md text-xs text-brand-lighter p-1.5 focus:outline-none"
            />
          </div>
          <div>
            <label className="text-[10px] text-brand-lighter">Description</label>
            <textarea
              value={categoryDescription || ""}
              onChange={(e) => typedSetProp((p) => { p.categoryDescription = e.target.value; })}
              rows={2}
              className="w-full bg-brand-medium-dark border border-brand-medium/30 rounded-md text-xs text-brand-lighter p-1.5 focus:outline-none resize-none"
            />
          </div>
          <div>
            <label className="text-[10px] text-brand-lighter">Banner Image URL</label>
            <input
              type="text"
              value={bannerImage || ""}
              onChange={(e) => typedSetProp((p) => { p.bannerImage = e.target.value; })}
              placeholder="https://..."
              className="w-full bg-brand-medium-dark border border-brand-medium/30 rounded-md text-xs text-brand-lighter p-1.5 focus:outline-none"
            />
          </div>
          <div>
            <label className="text-[10px] text-brand-lighter">Banner Height (px)</label>
            <NumericInput
              value={bannerHeight ?? 160}
              min={80}
              step={10}
              onChange={(val) => typedSetProp((p) => { p.bannerHeight = val ?? 160; })}
            />
          </div>
        </div>
      </DesignSection>

      {/* Products */}
      <DesignSection title="Products">
        <div className="flex flex-col gap-2">
          <div>
            <label className="text-[10px] text-brand-lighter">Number of Products</label>
            <NumericInput
              value={productCount ?? 6}
              min={1}
              max={20}
              step={1}
              onChange={(val) => typedSetProp((p) => { p.productCount = Math.max(1, val ?? 6); })}
            />
          </div>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={showDescription === true}
              onChange={(e) => typedSetProp((p) => { p.showDescription = e.target.checked; })}
              className="w-4 h-4 rounded cursor-pointer"
            />
            <span className="text-[10px] text-brand-lighter">Show Description</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={showRating !== false}
              onChange={(e) => typedSetProp((p) => { p.showRating = e.target.checked; })}
              className="w-4 h-4 rounded cursor-pointer"
            />
            <span className="text-[10px] text-brand-lighter">Show Rating</span>
          </label>
        </div>
      </DesignSection>

      {/* Filter & Sort */}
      <DesignSection title="Filter & Sort">
        <div className="flex flex-col gap-2">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={showFilters !== false}
              onChange={(e) => typedSetProp((p) => { p.showFilters = e.target.checked; })}
              className="w-4 h-4 rounded cursor-pointer"
            />
            <span className="text-[10px] text-brand-lighter">Show Filters</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={showSort !== false}
              onChange={(e) => typedSetProp((p) => { p.showSort = e.target.checked; })}
              className="w-4 h-4 rounded cursor-pointer"
            />
            <span className="text-[10px] text-brand-lighter">Show Sort</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={showSidebar === true}
              onChange={(e) => typedSetProp((p) => { p.showSidebar = e.target.checked; })}
              className="w-4 h-4 rounded cursor-pointer"
            />
            <span className="text-[10px] text-brand-lighter">Show Sidebar</span>
          </label>
        </div>
      </DesignSection>

      {/* Filter Groups */}
      {showFilters !== false && (
        <DesignSection title="Filter Groups" defaultOpen={false}>
          <div className="flex flex-col gap-3">
            {/* Existing Filter Groups */}
            {(filterGroups as FilterGroup[] || []).map((group, groupIndex) => (
              <div key={group.key} className="bg-brand-dark/50 rounded-md p-2">
                <div 
                  className="flex items-center justify-between cursor-pointer"
                  onClick={() => setExpandedFilter(expandedFilter === group.key ? null : group.key)}
                >
                  <span className="text-[11px] text-brand-lighter font-medium">{group.label}</span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        typedSetProp((p) => {
                          const groups = [...(p.filterGroups || [])];
                          groups.splice(groupIndex, 1);
                          p.filterGroups = groups;
                        });
                      }}
                      className="p-1 text-brand-medium hover:text-red-400"
                    >
                      <Trash2 size={12} />
                    </button>
                    {expandedFilter === group.key ? <ChevronUp size={14} className="text-brand-medium" /> : <ChevronDown size={14} className="text-brand-medium" />}
                  </div>
                </div>
                
                {expandedFilter === group.key && (
                  <div className="mt-2 flex flex-col gap-2">
                    <div>
                      <label className="text-[10px] text-brand-medium">Filter Label</label>
                      <input
                        type="text"
                        value={group.label}
                        onChange={(e) => typedSetProp((p) => {
                          const groups = [...(p.filterGroups || [])];
                          groups[groupIndex] = { ...groups[groupIndex], label: e.target.value };
                          p.filterGroups = groups;
                        })}
                        className="w-full bg-brand-medium-dark border border-brand-medium/30 rounded-md text-xs text-brand-lighter p-1.5 focus:outline-none"
                      />
                    </div>
                    
                    {/* Filter Options */}
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] text-brand-medium">Options</label>
                      {group.options.map((option, optIndex) => (
                        <div key={optIndex} className="flex items-center gap-1">
                          <input
                            type="text"
                            value={option.label}
                            onChange={(e) => typedSetProp((p) => {
                              const groups = [...(p.filterGroups || [])] as FilterGroup[];
                              const options = [...groups[groupIndex].options];
                              options[optIndex] = { ...options[optIndex], label: e.target.value, value: e.target.value.toLowerCase().replace(/\s+/g, '-') };
                              groups[groupIndex] = { ...groups[groupIndex], options };
                              p.filterGroups = groups;
                            })}
                            placeholder="Option label"
                            className="flex-1 bg-brand-medium-dark border border-brand-medium/30 rounded-md text-xs text-brand-lighter p-1 focus:outline-none"
                          />
                          <button
                            onClick={() => typedSetProp((p) => {
                              const groups = [...(p.filterGroups || [])] as FilterGroup[];
                              const options = [...groups[groupIndex].options];
                              options.splice(optIndex, 1);
                              groups[groupIndex] = { ...groups[groupIndex], options };
                              p.filterGroups = groups;
                            })}
                            className="p-1 text-brand-medium hover:text-red-400"
                          >
                            <Trash2 size={10} />
                          </button>
                        </div>
                      ))}
                      <button
                        onClick={() => typedSetProp((p) => {
                          const groups = [...(p.filterGroups || [])] as FilterGroup[];
                          const options = [...groups[groupIndex].options, { label: "New Option", value: "new-option" }];
                          groups[groupIndex] = { ...groups[groupIndex], options };
                          p.filterGroups = groups;
                        })}
                        className="flex items-center gap-1 text-[10px] text-brand-medium hover:text-brand-lighter mt-1"
                      >
                        <Plus size={10} /> Add Option
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
            
            {/* Add New Filter Group */}
            <button
              onClick={() => typedSetProp((p) => {
                const groups = [...(p.filterGroups || [])] as FilterGroup[];
                const newKey = `filter-${Date.now()}`;
                groups.push({
                  key: newKey,
                  label: "New Filter",
                  options: [{ label: "Option 1", value: "option-1" }]
                });
                p.filterGroups = groups;
              })}
              className="flex items-center justify-center gap-1 text-[11px] text-brand-medium hover:text-brand-lighter bg-brand-medium-dark border border-brand-medium/30 rounded-md p-2"
            >
              <Plus size={12} /> Add Filter Group
            </button>
          </div>
        </DesignSection>
      )}

      {/* Subcategories (for Sidebar) */}
      {showSidebar && (
        <DesignSection title="Subcategories" defaultOpen={false}>
          <div className="flex flex-col gap-2">
            {(subcategories as Array<{id: string; name: string; count?: number}> || []).map((sub, index) => (
              <div key={sub.id} className="flex items-center gap-1">
                <input
                  type="text"
                  value={sub.name}
                  onChange={(e) => typedSetProp((p) => {
                    const subs = [...(p.subcategories || [])];
                    subs[index] = { ...subs[index], name: e.target.value, id: e.target.value.toLowerCase().replace(/\s+/g, '-') };
                    p.subcategories = subs;
                  })}
                  className="flex-1 bg-brand-medium-dark border border-brand-medium/30 rounded-md text-xs text-brand-lighter p-1.5 focus:outline-none"
                />
                <button
                  onClick={() => typedSetProp((p) => {
                    const subs = [...(p.subcategories || [])];
                    subs.splice(index, 1);
                    p.subcategories = subs;
                  })}
                  className="p-1 text-brand-medium hover:text-red-400"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
            <button
              onClick={() => typedSetProp((p) => {
                const subs = [...(p.subcategories || [])];
                subs.push({ id: `sub-${Date.now()}`, name: "New Category", count: 0 });
                p.subcategories = subs;
              })}
              className="flex items-center justify-center gap-1 text-[11px] text-brand-medium hover:text-brand-lighter bg-brand-medium-dark border border-brand-medium/30 rounded-md p-2"
            >
              <Plus size={12} /> Add Subcategory
            </button>
          </div>
        </DesignSection>
      )}

      {/* Layout */}
      <DesignSection title="Layout">
        <div className="flex flex-col gap-2">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] text-brand-lighter">Columns</label>
              <NumericInput
                value={columns ?? 4}
                min={1}
                max={5}
                step={1}
                onChange={(val) => typedSetProp((p) => { p.columns = Math.max(1, Math.min(5, val ?? 4)); })}
              />
            </div>
            <div>
              <label className="text-[10px] text-brand-lighter">Gap (px)</label>
              <NumericInput
                value={gap ?? 20}
                min={0}
                step={4}
                onChange={(val) => typedSetProp((p) => { p.gap = val ?? 20; })}
              />
            </div>
          </div>
          <div>
            <label className="text-[10px] text-brand-lighter">Image Height (px)</label>
            <NumericInput
              value={imageHeight ?? 180}
              min={80}
              step={10}
              onChange={(val) => typedSetProp((p) => { p.imageHeight = val ?? 180; })}
            />
          </div>
        </div>
      </DesignSection>

      {/* Card Style */}
      <DesignSection title="Card Style" defaultOpen={false}>
        <div className="flex flex-col gap-2">
          <div>
            <label className="text-[10px] text-brand-lighter">Border Radius (px)</label>
            <NumericInput
              value={cardBorderRadius ?? 12}
              min={0}
              step={2}
              onChange={(val) => typedSetProp((p) => { p.cardBorderRadius = val ?? 12; })}
            />
          </div>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={cardShadow !== false}
              onChange={(e) => typedSetProp((p) => { p.cardShadow = e.target.checked; })}
              className="w-4 h-4 rounded cursor-pointer"
            />
            <span className="text-[10px] text-brand-lighter">Card Shadow</span>
          </label>
        </div>
      </DesignSection>

      {/* Colors */}
      <DesignSection title="Colors">
        <div className="flex flex-col gap-3">
          {/* Background Colors */}
          <div>
            <label className="text-[10px] text-brand-lighter mb-1 block">Background</label>
            <div className="flex items-center gap-2 bg-brand-medium-dark border border-brand-medium/30 rounded-md px-2.5 py-1">
              <input
                type="color"
                value={backgroundColor || "#f8fafc"}
                onChange={(e) => typedSetProp((p) => { p.backgroundColor = e.target.value; })}
                className="w-7 h-6 rounded cursor-pointer border-none bg-transparent"
              />
              <ColorInput
                value={backgroundColor || "#f8fafc"}
                onChange={(val) => typedSetProp((p) => { p.backgroundColor = val; })}
                className="flex-1"
              />
            </div>
          </div>
          <div>
            <label className="text-[10px] text-brand-lighter mb-1 block">Card Background</label>
            <div className="flex items-center gap-2 bg-brand-medium-dark border border-brand-medium/30 rounded-md px-2.5 py-1">
              <input
                type="color"
                value={cardBackgroundColor || "#ffffff"}
                onChange={(e) => typedSetProp((p) => { p.cardBackgroundColor = e.target.value; })}
                className="w-7 h-6 rounded cursor-pointer border-none bg-transparent"
              />
              <ColorInput
                value={cardBackgroundColor || "#ffffff"}
                onChange={(val) => typedSetProp((p) => { p.cardBackgroundColor = val; })}
                className="flex-1"
              />
            </div>
          </div>

          {/* Text Colors */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] text-brand-lighter mb-1 block">Category Name</label>
              <div className="flex items-center gap-2 bg-brand-medium-dark border border-brand-medium/30 rounded-md px-2 py-1">
                <input
                  type="color"
                  value={categoryNameColor || "#1e293b"}
                  onChange={(e) => typedSetProp((p) => { p.categoryNameColor = e.target.value; })}
                  className="w-5 h-5 rounded cursor-pointer border-none bg-transparent"
                />
                <ColorInput
                  value={categoryNameColor || "#1e293b"}
                  onChange={(val) => typedSetProp((p) => { p.categoryNameColor = val; })}
                  className="flex-1"
                />
              </div>
            </div>
            <div>
              <label className="text-[10px] text-brand-lighter mb-1 block">Category Desc</label>
              <div className="flex items-center gap-2 bg-brand-medium-dark border border-brand-medium/30 rounded-md px-2 py-1">
                <input
                  type="color"
                  value={categoryDescriptionColor || "#64748b"}
                  onChange={(e) => typedSetProp((p) => { p.categoryDescriptionColor = e.target.value; })}
                  className="w-5 h-5 rounded cursor-pointer border-none bg-transparent"
                />
                <ColorInput
                  value={categoryDescriptionColor || "#64748b"}
                  onChange={(val) => typedSetProp((p) => { p.categoryDescriptionColor = val; })}
                  className="flex-1"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] text-brand-lighter mb-1 block">Product Title</label>
              <div className="flex items-center gap-2 bg-brand-medium-dark border border-brand-medium/30 rounded-md px-2 py-1">
                <input
                  type="color"
                  value={productTitleColor || "#111827"}
                  onChange={(e) => typedSetProp((p) => { p.productTitleColor = e.target.value; })}
                  className="w-5 h-5 rounded cursor-pointer border-none bg-transparent"
                />
                <ColorInput
                  value={productTitleColor || "#111827"}
                  onChange={(val) => typedSetProp((p) => { p.productTitleColor = val; })}
                  className="flex-1"
                />
              </div>
            </div>
            <div>
              <label className="text-[10px] text-brand-lighter mb-1 block">Rating Star</label>
              <div className="flex items-center gap-2 bg-brand-medium-dark border border-brand-medium/30 rounded-md px-2 py-1">
                <input
                  type="color"
                  value={ratingColor || "#facc15"}
                  onChange={(e) => typedSetProp((p) => { p.ratingColor = e.target.value; })}
                  className="w-5 h-5 rounded cursor-pointer border-none bg-transparent"
                />
                <ColorInput
                  value={ratingColor || "#facc15"}
                  onChange={(val) => typedSetProp((p) => { p.ratingColor = val; })}
                  className="flex-1"
                />
              </div>
            </div>
          </div>

          {/* Price Colors */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] text-brand-lighter mb-1 block">Price</label>
              <div className="flex items-center gap-2 bg-brand-medium-dark border border-brand-medium/30 rounded-md px-2 py-1">
                <input
                  type="color"
                  value={priceColor || "#3b82f6"}
                  onChange={(e) => typedSetProp((p) => { p.priceColor = e.target.value; })}
                  className="w-5 h-5 rounded cursor-pointer border-none bg-transparent"
                />
                <ColorInput
                  value={priceColor || "#3b82f6"}
                  onChange={(val) => typedSetProp((p) => { p.priceColor = val; })}
                  className="flex-1"
                />
              </div>
            </div>
            <div>
              <label className="text-[10px] text-brand-lighter mb-1 block">Original Price</label>
              <div className="flex items-center gap-2 bg-brand-medium-dark border border-brand-medium/30 rounded-md px-2 py-1">
                <input
                  type="color"
                  value={originalPriceColor || "#9ca3af"}
                  onChange={(e) => typedSetProp((p) => { p.originalPriceColor = e.target.value; })}
                  className="w-5 h-5 rounded cursor-pointer border-none bg-transparent"
                />
                <ColorInput
                  value={originalPriceColor || "#9ca3af"}
                  onChange={(val) => typedSetProp((p) => { p.originalPriceColor = val; })}
                  className="flex-1"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="text-[10px] text-brand-lighter mb-1 block">Discount Badge</label>
            <div className="flex items-center gap-2 bg-brand-medium-dark border border-brand-medium/30 rounded-md px-2.5 py-1">
              <input
                type="color"
                value={discountBadgeColor || "#ef4444"}
                onChange={(e) => typedSetProp((p) => { p.discountBadgeColor = e.target.value; })}
                className="w-7 h-6 rounded cursor-pointer border-none bg-transparent"
              />
              <ColorInput
                value={discountBadgeColor || "#ef4444"}
                onChange={(val) => typedSetProp((p) => { p.discountBadgeColor = val; })}
                className="flex-1"
              />
            </div>
          </div>
        </div>
      </DesignSection>

      {/* Button */}
      <DesignSection title="Button">
        <div className="flex flex-col gap-2">
          <div>
            <label className="text-[10px] text-brand-lighter">Button Text</label>
            <input
              type="text"
              value={buttonText || "Add to Cart"}
              onChange={(e) => typedSetProp((p) => { p.buttonText = e.target.value; })}
              className="w-full bg-brand-medium-dark border border-brand-medium/30 rounded-md text-xs text-brand-lighter p-1.5 focus:outline-none"
            />
          </div>
          <div>
            <label className="text-[10px] text-brand-lighter">Button Style</label>
            <select
              value={buttonVariant || "primary"}
              onChange={(e) => typedSetProp((p) => { p.buttonVariant = e.target.value as CategoryLayoutProps["buttonVariant"]; })}
              className="w-full bg-brand-medium-dark border border-brand-medium/30 rounded-md text-xs text-brand-lighter p-1.5 focus:outline-none"
            >
              <option value="primary">Primary (Blue)</option>
              <option value="secondary">Secondary (Green)</option>
              <option value="outline">Outline</option>
              <option value="custom">Custom Color</option>
            </select>
          </div>
          {buttonVariant === "custom" && (
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-brand-lighter mb-1 block">Button Color</label>
                <div className="flex items-center gap-2 bg-brand-medium-dark border border-brand-medium/30 rounded-md px-2 py-1">
                  <input
                    type="color"
                    value={buttonColor || "#3b82f6"}
                    onChange={(e) => typedSetProp((p) => { p.buttonColor = e.target.value; })}
                    className="w-5 h-5 rounded cursor-pointer border-none bg-transparent"
                  />
                  <ColorInput
                    value={buttonColor || "#3b82f6"}
                    onChange={(val) => typedSetProp((p) => { p.buttonColor = val; })}
                    className="flex-1"
                  />
                </div>
              </div>
              <div>
                <label className="text-[10px] text-brand-lighter mb-1 block">Text Color</label>
                <div className="flex items-center gap-2 bg-brand-medium-dark border border-brand-medium/30 rounded-md px-2 py-1">
                  <input
                    type="color"
                    value={buttonTextColor || "#ffffff"}
                    onChange={(e) => typedSetProp((p) => { p.buttonTextColor = e.target.value; })}
                    className="w-5 h-5 rounded cursor-pointer border-none bg-transparent"
                  />
                  <ColorInput
                    value={buttonTextColor || "#ffffff"}
                    onChange={(val) => typedSetProp((p) => { p.buttonTextColor = val; })}
                    className="flex-1"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </DesignSection>

      {/* Pagination */}
      <DesignSection title="Pagination" defaultOpen={false}>
        <div className="flex flex-col gap-2">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={showPagination !== false}
              onChange={(e) => typedSetProp((p) => { p.showPagination = e.target.checked; })}
              className="w-4 h-4 rounded cursor-pointer"
            />
            <span className="text-[10px] text-brand-lighter">Show Pagination</span>
          </label>
          <div>
            <label className="text-[10px] text-brand-lighter">Style</label>
            <select
              value={paginationStyle || "loadmore"}
              onChange={(e) => typedSetProp((p) => { p.paginationStyle = e.target.value as CategoryLayoutProps["paginationStyle"]; })}
              className="w-full bg-brand-medium-dark border border-brand-medium/30 rounded-md text-xs text-brand-lighter p-1.5 focus:outline-none"
            >
              <option value="loadmore">Load More</option>
              <option value="numbered">Numbered Pages</option>
            </select>
          </div>
          <div>
            <label className="text-[10px] text-brand-lighter">Products Per Page</label>
            <NumericInput
              value={productsPerPage ?? 8}
              min={1}
              step={1}
              onChange={(val) => typedSetProp((p) => { p.productsPerPage = Math.max(1, val ?? 8); })}
            />
          </div>
        </div>
      </DesignSection>

      {/* Empty State */}
      <DesignSection title="Empty State" defaultOpen={false}>
        <div className="flex flex-col gap-2">
          <div>
            <label className="text-[10px] text-brand-lighter">Empty State Text</label>
            <input
              type="text"
              value={emptyStateText || "No products found"}
              onChange={(e) => typedSetProp((p) => { p.emptyStateText = e.target.value; })}
              className="w-full bg-brand-medium-dark border border-brand-medium/30 rounded-md text-xs text-brand-lighter p-1.5 focus:outline-none"
            />
          </div>
        </div>
      </DesignSection>
    </div>
  );
};
