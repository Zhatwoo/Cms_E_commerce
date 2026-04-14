"use client";

import React from "react";
import { Element, useNode } from "@craftjs/core";
import { listProducts, type ApiProduct } from "@/lib/api";
import { useDesignProject } from "../../../design/_context/DesignProjectContext";
import { getIndustryCategories, INDUSTRY_OPTIONS, normalizeIndustryKey } from "@/lib/industryCatalog";
import { smartGroupCategories } from "@/lib/smartCategories";
import { CategoryTile } from "../../../design/_designComponents/CategoryTile/CategoryTile";
import { DesignSection } from "../../../design/_components/rightPanel/settings/DesignSection";
import { TemplateEntry } from "../../_types";

const CategoryTileElement = CategoryTile as React.ElementType;

type ProductWithLegacySubcategory = ApiProduct & {
  category_name?: unknown;
  categoryName?: unknown;
  subCategory?: unknown;
  sub_category?: unknown;
  details?: { category?: unknown; category_name?: unknown; categoryName?: unknown; subcategory?: unknown; subCategory?: unknown; sub_category?: unknown };
  specifications?: { category?: unknown; category_name?: unknown; categoryName?: unknown; subcategory?: unknown; subCategory?: unknown; sub_category?: unknown };
};

type CategoryMatcher = (product: ApiProduct) => boolean;
type CategoriesCardLayoutMode = "auto" | "compact" | "featured" | "list";
type CategoriesCardSourceMode = "auto" | "manual";

const LAYOUT_OPTIONS: Array<{ value: CategoriesCardLayoutMode; label: string; description: string }> = [
  { value: "auto", label: "Auto grid", description: "Balanced responsive grid" },
  { value: "compact", label: "Compact grid", description: "Denser cards for many categories" },
  { value: "featured", label: "Featured grid", description: "Larger cards with more spacing" },
  { value: "list", label: "List layout", description: "Single-column stacked cards" },
];

const LayoutThumb = ({
  layout,
  active,
  onClick,
  label,
  description,
}: {
  layout: CategoriesCardLayoutMode;
  active: boolean;
  onClick: () => void;
  label: string;
  description: string;
}) => {
  const boxClassName = `w-full aspect-[4/3] rounded-lg border-2 overflow-hidden flex transition-all ${
    active
      ? "border-[var(--builder-accent)] bg-[var(--builder-accent)]/10"
      : "border-[var(--builder-border)] bg-[var(--builder-surface-2)] hover:border-[var(--builder-border-mid)]"
  }`;

  const cardBlock = (width: string, height: string, tone = "#cbd5e1") => (
    <div
      style={{
        width,
        height,
        borderRadius: 6,
        background: active ? "var(--builder-accent)" : tone,
        opacity: active ? 0.75 : 0.65,
        flexShrink: 0,
      }}
    />
  );

  let inner: React.ReactNode;
  if (layout === "compact") {
    inner = (
      <div className="grid h-full w-full grid-cols-3 gap-1 p-2">
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            key={index}
            className="rounded"
            style={{
              background: active ? "var(--builder-accent)" : index % 2 === 0 ? "#dbe4f0" : "#cbd5e1",
              opacity: active ? 0.72 : 0.7,
            }}
          />
        ))}
      </div>
    );
  } else if (layout === "featured") {
    inner = (
      <div className="flex h-full w-full flex-col gap-1 p-2">
        <div className="flex flex-1 gap-1">
          {cardBlock("58%", "100%", "#bfdbfe")}
          <div className="flex flex-1 flex-col gap-1">
            {cardBlock("100%", "48%", "#dbe4f0")}
            {cardBlock("100%", "48%", "#cbd5e1")}
          </div>
        </div>
        <div className="flex gap-1">
          {cardBlock("32%", "10px", "#dbe4f0")}
          {cardBlock("52%", "10px", "#cbd5e1")}
        </div>
      </div>
    );
  } else if (layout === "list") {
    inner = (
      <div className="flex h-full w-full flex-col gap-1 p-2">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="flex items-center gap-2 rounded-md bg-transparent">
            <div
              className="rounded-sm"
              style={{
                width: 28,
                height: 28,
                background: active ? "var(--builder-accent)" : index === 0 ? "#bfdbfe" : "#cbd5e1",
                opacity: active ? 0.72 : 0.7,
                flexShrink: 0,
              }}
            />
            <div className="flex flex-1 flex-col gap-1">
              <div className="h-2.5 rounded-full" style={{ width: "72%", background: active ? "var(--builder-accent)" : "#cbd5e1", opacity: active ? 0.72 : 0.7 }} />
              <div className="h-2 rounded-full" style={{ width: "48%", background: active ? "var(--builder-accent)" : "#dbe4f0", opacity: active ? 0.55 : 0.6 }} />
            </div>
          </div>
        ))}
      </div>
    );
  } else {
    inner = (
      <div className="flex h-full w-full flex-col gap-1 p-2">
        <div className="flex flex-1 gap-1">
          {cardBlock("48%", "100%", "#bfdbfe")}
          <div className="flex flex-1 flex-col gap-1">
            {cardBlock("100%", "48%", "#dbe4f0")}
            {cardBlock("100%", "48%", "#cbd5e1")}
          </div>
        </div>
      </div>
    );
  }

  return (
    <button type="button" className="flex cursor-pointer flex-col items-center gap-1 text-left group" onClick={onClick}>
      <div className={boxClassName}>{inner}</div>
      <span className={`text-[9px] font-semibold uppercase tracking-wide ${active ? "text-builder-accent" : "text-builder-text-faint"}`}>
        {label}
      </span>
      <span className="text-center text-[9px] leading-tight text-builder-text-faint">{description}</span>
    </button>
  );
};

function normalizeComparable(value: unknown): string {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function extractCategory(product: ApiProduct): string {
  const record = product as ProductWithLegacySubcategory;
  return String(
    product.category
      ?? record.category_name
      ?? record.categoryName
      ?? record.details?.category
      ?? record.details?.category_name
      ?? record.details?.categoryName
      ?? record.specifications?.category
      ?? record.specifications?.category_name
      ?? record.specifications?.categoryName
      ?? ""
  ).trim();
}

function getSelectedCategoryMatcher(projectIndustry?: string | null): CategoryMatcher | null {
  const normalizedIndustryKey = normalizeIndustryKey(projectIndustry);
  if (!normalizedIndustryKey) return null;

  const industryLabel = INDUSTRY_OPTIONS.find((option) => option.key === normalizedIndustryKey)?.label || "";
  const validKeys = new Set<string>([
    normalizeComparable(normalizedIndustryKey),
    normalizeComparable(industryLabel),
    normalizeComparable(projectIndustry),
  ].filter(Boolean));

  if (validKeys.size === 0) return null;

  return (product: ApiProduct) => {
    const productCategory = extractCategory(product);
    if (!productCategory) return false;
    return validKeys.has(normalizeComparable(productCategory));
  };
}

function getLayoutConfig(layoutMode: CategoriesCardLayoutMode) {
  if (layoutMode === "compact") {
    return {
      containerClassName: "grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
      tileWidth: 160,
      tileHeight: 154,
      mediaHeight: 102,
      fontSize: 11,
      borderRadius: 12,
      mediaScale: 0.96,
      mediaOffsetY: -2,
    };
  }

  if (layoutMode === "featured") {
    return {
      containerClassName: "grid gap-4 sm:grid-cols-2 xl:grid-cols-3",
      tileWidth: 220,
      tileHeight: 194,
      mediaHeight: 132,
      fontSize: 13,
      borderRadius: 16,
      mediaScale: 1,
      mediaOffsetY: 0,
    };
  }

  if (layoutMode === "list") {
    return {
      containerClassName: "grid grid-cols-1 gap-3",
      tileWidth: 420,
      tileHeight: 138,
      mediaHeight: 90,
      fontSize: 12,
      borderRadius: 14,
      mediaScale: 0.92,
      mediaOffsetY: -4,
    };
  }

  return {
    containerClassName: "grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
    tileWidth: 180,
    tileHeight: 170,
    mediaHeight: 120,
    fontSize: 12,
    borderRadius: 14,
    mediaScale: 1,
    mediaOffsetY: 0,
  };
}

function extractSubcategory(product: ApiProduct): string {
  const record = product as ProductWithLegacySubcategory;
  return String(
    product.subcategory
      ?? record.subCategory
      ?? record.sub_category
      ?? record.details?.subcategory
      ?? record.details?.subCategory
      ?? record.details?.sub_category
      ?? record.specifications?.subcategory
      ?? record.specifications?.subCategory
      ?? record.specifications?.sub_category
      ?? ""
  ).trim();
}

function uniqueNonEmpty(values: string[]): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const raw of values) {
    const value = String(raw || "").trim();
    if (!value) continue;
    const key = value.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(value);
  }
  return out;
}

const FALLBACK_INDUSTRY = "clothing-apparel";

export function CategoriesCardCanvas() {
  const {
    connectors,
    headingText,
    layoutMode,
    categoryMode,
    selectedCategories,
    actions: { setProp },
  } = useNode((node) => ({
    headingText: node.data.props.headingText as string,
    layoutMode: (node.data.props.layoutMode as CategoriesCardLayoutMode | undefined) || "auto",
    categoryMode: (node.data.props.categoryMode as CategoriesCardSourceMode | undefined) || "auto",
    selectedCategories: (node.data.props.selectedCategories as string[] | undefined) || [],
  }));
  const { projectIndustry, projectSubdomain } = useDesignProject();
  const [productSubcategories, setProductSubcategories] = React.useState<string[]>([]);
  const [isEditingHeading, setIsEditingHeading] = React.useState(false);
  const headingRef = React.useRef<HTMLHeadingElement | null>(null);
  const layoutConfig = getLayoutConfig(layoutMode);

  React.useEffect(() => {
    let cancelled = false;

    const loadSubcategories = async () => {
      if (!projectSubdomain) {
        if (!cancelled) setProductSubcategories([]);
        return;
      }

      try {
        const res = await listProducts({ subdomain: projectSubdomain, page: 1, limit: 500 });
        if (!cancelled && res?.success) {
          const selectedCategoryMatcher = getSelectedCategoryMatcher(projectIndustry || FALLBACK_INDUSTRY);
          const filteredItems = selectedCategoryMatcher
            ? (res.items || []).filter(selectedCategoryMatcher)
            : (res.items || []);
          const extracted = filteredItems.map(extractSubcategory);
          setProductSubcategories(uniqueNonEmpty(extracted));
        }
      } catch {
        if (!cancelled) setProductSubcategories([]);
      }
    };

    loadSubcategories();
    return () => {
      cancelled = true;
    };
  }, [projectIndustry, projectSubdomain]);

  const autoCategories = React.useMemo(() => {
    const preset = getIndustryCategories(projectIndustry || FALLBACK_INDUSTRY);
    const raw = [...(productSubcategories || []), ...(preset || [])];
    // Apply smart grouping to intelligently cluster related subcategories
    return smartGroupCategories(raw);
  }, [projectIndustry, productSubcategories]);

  const categories = React.useMemo(() => {
    if (categoryMode === "manual") {
      return uniqueNonEmpty(selectedCategories || []);
    }
    return autoCategories;
  }, [autoCategories, categoryMode, selectedCategories]);

  React.useEffect(() => {
    if (!isEditingHeading || !headingRef.current) return;
    headingRef.current.focus();
    const range = document.createRange();
    range.selectNodeContents(headingRef.current);
    range.collapse(false);
    const selection = window.getSelection();
    selection?.removeAllRanges();
    selection?.addRange(range);
  }, [isEditingHeading]);

  const flushHeadingText = () => {
    const nextText = headingRef.current?.innerText ?? headingText;
    const normalized = String(nextText || "").trim() || "Shop by Category";
    setProp((props: { headingText?: string }) => {
      props.headingText = normalized;
    });
    setIsEditingHeading(false);
  };

  return (
    <div
      ref={(ref) => {
        if (ref) connectors.connect(connectors.drag(ref));
      }}
      className="w-full box-border bg-[#f9fafb] px-2 py-3 sm:px-3 lg:px-4"
    >
      <div className="flex w-full flex-wrap items-center justify-between gap-2">
        <h3
          ref={headingRef}
          data-inline-text-edit
          contentEditable={isEditingHeading}
          suppressContentEditableWarning
          onDoubleClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            setIsEditingHeading(true);
          }}
          onBlur={() => {
            if (isEditingHeading) flushHeadingText();
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              event.stopPropagation();
              setIsEditingHeading(true);
            }
            if (event.key === "Escape") {
              event.preventDefault();
              if (headingRef.current) headingRef.current.innerText = headingText || "Shop by Category";
              setIsEditingHeading(false);
            }
          }}
          className={`m-0 text-[28px] font-bold leading-[1.2] text-[#111827] ${
            isEditingHeading ? "cursor-text outline-none" : "cursor-text"
          }`}
        >
          {headingText || "Shop by Category"}
        </h3>
        <p className="m-0 text-sm font-semibold text-[#6366f1]">
          {categoryMode === "manual"
            ? "Manually selected categories"
            : projectIndustry
              ? `Subcategories for ${projectIndustry}`
              : "Previewing clothing & apparel subcategories"}
        </p>
      </div>

      {categories.length > 0 ? (
        <div className="mt-3 w-full">
          <div className={layoutConfig.containerClassName}>
            {categories.map((label, idx) => {
              const baseIconType = idx % 3 === 0 ? "shoppingBag" : idx % 3 === 1 ? "home" : "star";
              const iconTheme = idx % 2 === 0 ? "violet" : "indigo";
              const tileId = `category-tile-${label.toLowerCase().replace(/[^a-z0-9]+/g, "-") || idx}`;

              return (
                <div key={`${label}-${idx}`} className="w-full">
                  <Element
                    id={tileId}
                    is={CategoryTileElement}
                    label={label}
                    imageUrl=""
                    iconType={baseIconType}
                    iconTheme={iconTheme}
                    cardWidth={layoutConfig.tileWidth}
                    cardHeight={layoutConfig.tileHeight}
                    mediaHeight={layoutConfig.mediaHeight}
                    fontSize={layoutConfig.fontSize}
                    borderRadius={layoutConfig.borderRadius}
                    mediaScale={layoutConfig.mediaScale}
                    mediaOffsetY={layoutConfig.mediaOffsetY}
                  />
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="mx-auto mt-4 max-w-160 rounded-2xl bg-white p-5 text-center text-sm font-semibold text-[#6b7280] shadow-[0_10px_24px_rgba(0,0,0,0.05)] sm:p-6">
          No subcategories are configured for this store type yet.
        </div>
      )}
    </div>
  );
}

export const CategoriesCardSettings = () => {
  const {
    layoutMode,
    categoryMode,
    selectedCategories,
    actions: { setProp },
  } = useNode((node) => ({
    layoutMode: (node.data.props.layoutMode as CategoriesCardLayoutMode | undefined) || "auto",
    categoryMode: (node.data.props.categoryMode as CategoriesCardSourceMode | undefined) || "auto",
    selectedCategories: (node.data.props.selectedCategories as string[] | undefined) || [],
  }));
  const { projectIndustry, projectSubdomain } = useDesignProject();
  const [productSubcategories, setProductSubcategories] = React.useState<string[]>([]);
  const [categoryToAdd, setCategoryToAdd] = React.useState("");
  const [customCategory, setCustomCategory] = React.useState("");

  React.useEffect(() => {
    let cancelled = false;

    const loadSubcategories = async () => {
      if (!projectSubdomain) {
        if (!cancelled) setProductSubcategories([]);
        return;
      }

      try {
        const res = await listProducts({ subdomain: projectSubdomain, page: 1, limit: 500 });
        if (!cancelled && res?.success) {
          const selectedCategoryMatcher = getSelectedCategoryMatcher(projectIndustry || FALLBACK_INDUSTRY);
          const filteredItems = selectedCategoryMatcher
            ? (res.items || []).filter(selectedCategoryMatcher)
            : (res.items || []);
          const extracted = filteredItems.map(extractSubcategory);
          setProductSubcategories(uniqueNonEmpty(extracted));
        }
      } catch {
        if (!cancelled) setProductSubcategories([]);
      }
    };

    loadSubcategories();
    return () => {
      cancelled = true;
    };
  }, [projectIndustry, projectSubdomain]);

  const availableCategories = React.useMemo(() => {
    const preset = getIndustryCategories(projectIndustry || FALLBACK_INDUSTRY);
    const raw = [...(productSubcategories || []), ...(preset || [])];
    return smartGroupCategories(raw);
  }, [projectIndustry, productSubcategories]);

  const selectedCategorySet = React.useMemo(
    () => new Set((selectedCategories || []).map((value) => value.trim().toLowerCase()).filter(Boolean)),
    [selectedCategories]
  );

  const selectableCategories = React.useMemo(
    () => availableCategories.filter((value) => !selectedCategorySet.has(value.trim().toLowerCase())),
    [availableCategories, selectedCategorySet]
  );

  const upsertSelectedCategories = React.useCallback((next: string[]) => {
    setProp((props: { selectedCategories?: string[] }) => {
      props.selectedCategories = uniqueNonEmpty(next);
    });
  }, [setProp]);

  const addSelectedCategory = React.useCallback((value: string) => {
    const normalized = String(value || "").trim();
    if (!normalized) return;
    upsertSelectedCategories([...(selectedCategories || []), normalized]);
  }, [selectedCategories, upsertSelectedCategories]);

  const removeSelectedCategory = React.useCallback((value: string) => {
    const key = value.trim().toLowerCase();
    upsertSelectedCategories((selectedCategories || []).filter((item) => item.trim().toLowerCase() !== key));
  }, [selectedCategories, upsertSelectedCategories]);

  return (
    <div className="flex flex-col gap-0">
      <DesignSection title="Layout" defaultOpen>
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-builder-text-faint">
          Select layout style
        </p>
        <div className="grid grid-cols-2 gap-2 mb-3">
          {LAYOUT_OPTIONS.map((option) => {
            const active = layoutMode === option.value;
            return (
              <LayoutThumb
                key={option.value}
                layout={option.value}
                active={active}
                label={option.label}
                description={option.description}
                onClick={() => {
                  setProp((props: { layoutMode?: CategoriesCardLayoutMode }) => {
                    props.layoutMode = option.value;
                  });
                }}
              />
            );
          })}
        </div>
      </DesignSection>

      <DesignSection title="Categories" defaultOpen>
        <p className="mb-3 text-[10px] font-semibold uppercase tracking-wider text-[var(--builder-text-faint)]">
          Choose how categories are sourced
        </p>

        <div className="mb-3 grid grid-cols-2 gap-2">
          {([
            { value: "auto", label: "Auto" },
            { value: "manual", label: "Manual" },
          ] as Array<{ value: CategoriesCardSourceMode; label: string }>).map((option) => {
            const active = categoryMode === option.value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  setProp((props: { categoryMode?: CategoriesCardSourceMode }) => {
                    props.categoryMode = option.value;
                  });
                }}
                className={`rounded-lg border px-3 py-2 text-xs font-semibold transition-colors ${
                  active
                    ? "border-[var(--builder-accent)] bg-[var(--builder-accent)]/10 text-[var(--builder-text)]"
                    : "border-[var(--builder-border)] bg-[var(--builder-surface-2)] text-[var(--builder-text-muted)] hover:border-[var(--builder-border-mid)]"
                }`}
              >
                {option.label}
              </button>
            );
          })}
        </div>

        {categoryMode === "manual" ? (
          <div className="flex flex-col gap-2">
            <p className="m-0 text-[11px] text-[var(--builder-text-muted)]">
              Add categories one by one. You can choose from detected categories or type a custom one.
            </p>

            <div className="flex gap-2">
              <select
                value={categoryToAdd}
                onChange={(event) => setCategoryToAdd(event.target.value)}
                title="Select category"
                className="h-8 flex-1 rounded-lg border border-[var(--builder-border)] bg-[var(--builder-surface-2)] px-2 text-xs text-[var(--builder-text)] focus:border-[var(--builder-accent)] focus:outline-none"
              >
                <option value="">Select category</option>
                {selectableCategories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => {
                  if (!categoryToAdd) return;
                  addSelectedCategory(categoryToAdd);
                  setCategoryToAdd("");
                }}
                className="h-8 rounded-lg border border-[var(--builder-border)] bg-[var(--builder-surface-2)] px-3 text-xs font-semibold text-[var(--builder-text)] hover:border-[var(--builder-border-mid)]"
              >
                Add
              </button>
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={customCategory}
                onChange={(event) => setCustomCategory(event.target.value)}
                placeholder="Custom category"
                className="h-8 flex-1 rounded-lg border border-[var(--builder-border)] bg-[var(--builder-surface-2)] px-2 text-xs text-[var(--builder-text)] placeholder:text-[var(--builder-text-faint)] focus:border-[var(--builder-accent)] focus:outline-none"
              />
              <button
                type="button"
                onClick={() => {
                  const value = customCategory.trim();
                  if (!value) return;
                  addSelectedCategory(value);
                  setCustomCategory("");
                }}
                className="h-8 rounded-lg border border-[var(--builder-border)] bg-[var(--builder-surface-2)] px-3 text-xs font-semibold text-[var(--builder-text)] hover:border-[var(--builder-border-mid)]"
              >
                Add custom
              </button>
            </div>

            <div className="mt-1 rounded-lg border border-[var(--builder-border)] bg-[var(--builder-surface-2)] p-2">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-[11px] font-semibold text-[var(--builder-text)]">Selected categories</span>
                <button
                  type="button"
                  onClick={() => upsertSelectedCategories([])}
                  className="text-[10px] font-semibold text-[var(--builder-text-muted)] hover:text-[var(--builder-text)]"
                >
                  Clear
                </button>
              </div>

              {selectedCategories.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {selectedCategories.map((category) => (
                    <span
                      key={category}
                      className="inline-flex items-center gap-1 rounded-full border border-[var(--builder-border-mid)] bg-[var(--builder-surface-3)] px-2 py-0.5 text-[10px] text-[var(--builder-text)]"
                    >
                      {category}
                      <button
                        type="button"
                        onClick={() => removeSelectedCategory(category)}
                        className="text-[10px] font-bold leading-none text-[var(--builder-text-muted)] hover:text-[var(--builder-text)]"
                        aria-label={`Remove ${category}`}
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              ) : (
                <p className="m-0 text-[10px] text-[var(--builder-text-faint)]">No categories selected yet.</p>
              )}
            </div>
          </div>
        ) : (
          <p className="m-0 text-[11px] text-[var(--builder-text-muted)]">
            Auto mode uses smart grouped subcategories from your project industry and products.
          </p>
        )}
      </DesignSection>

    </div>
  );
};

CategoriesCardCanvas.craft = {
  displayName: "Categories Card",
  props: {
    headingText: "Shop by Category",
    layoutMode: "auto",
    categoryMode: "auto",
    selectedCategories: [],
  },
  related: {
    settings: CategoriesCardSettings,
  },
  rules: {
    canDrag: () => true,
  },
  isCanvas: false,
};

export const CategoriesCard: TemplateEntry = {
  label: "Categories Card",
  description: "Dynamic subcategory card driven by the project industry",
  preview: "📦",
  category: "card",
  element: React.createElement(CategoriesCardCanvas),
};

export default CategoriesCard;