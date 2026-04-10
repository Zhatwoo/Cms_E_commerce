"use client";

import React from "react";
import { Element, useNode } from "@craftjs/core";
import { listProducts, type ApiProduct } from "@/lib/api";
import { useDesignProject } from "../../../design/_context/DesignProjectContext";
import { getIndustryCategories } from "@/lib/industryCatalog";
import { smartGroupCategories } from "@/lib/smartCategories";
import { CategoryTile } from "../../../design/_designComponents/CategoryTile/CategoryTile";
import { TemplateEntry } from "../../_types";

type ProductWithLegacySubcategory = ApiProduct & {
  subCategory?: unknown;
  sub_category?: unknown;
  details?: { subcategory?: unknown; subCategory?: unknown; sub_category?: unknown };
  specifications?: { subcategory?: unknown; subCategory?: unknown; sub_category?: unknown };
};

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
    actions: { setProp },
  } = useNode((node) => ({
    headingText: node.data.props.headingText as string,
  }));
  const { projectIndustry, projectSubdomain } = useDesignProject();
  const [productSubcategories, setProductSubcategories] = React.useState<string[]>([]);
  const [isEditingHeading, setIsEditingHeading] = React.useState(false);
  const headingRef = React.useRef<HTMLHeadingElement | null>(null);

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
          const extracted = (res.items || []).map(extractSubcategory);
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
  }, [projectSubdomain]);

  const categories = React.useMemo(() => {
    const preset = getIndustryCategories(projectIndustry || FALLBACK_INDUSTRY);
    const raw = [...(productSubcategories || []), ...(preset || [])];
    // Apply smart grouping to intelligently cluster related subcategories
    return smartGroupCategories(raw);
  }, [projectIndustry, productSubcategories]);

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
      className="w-full box-border bg-[#f9fafb] p-4"
    >
      <div className="mx-auto flex w-full max-w-[1280px] flex-wrap items-center justify-between gap-3">
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
          onMouseDown={(event) => {
            event.stopPropagation();
          }}
          onClick={(event) => {
            event.stopPropagation();
          }}
          onBlur={() => {
            if (isEditingHeading) flushHeadingText();
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              flushHeadingText();
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
          {projectIndustry ? `Subcategories for ${projectIndustry}` : "Previewing clothing & apparel subcategories"}
        </p>
      </div>

      {categories.length > 0 ? (
        <div className="mx-auto mt-3 w-full max-w-[1280px]">
          <div className="flex flex-wrap gap-4">
            {categories.map((label, idx) => {
              const baseIconType = idx % 3 === 0 ? "shoppingBag" : idx % 3 === 1 ? "home" : "star";
              const iconTheme = idx % 2 === 0 ? "violet" : "indigo";
              const tileId = `category-tile-${label.toLowerCase().replace(/[^a-z0-9]+/g, "-") || idx}`;

              return (
                <div key={`${label}-${idx}`} className="flex-shrink-0">
                  <Element
                    id={tileId}
                    is={CategoryTile as any}
                    label={label}
                    imageUrl=""
                    iconType={baseIconType}
                    iconTheme={iconTheme}
                  />
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="mx-auto mt-3 max-w-[640px] rounded-2xl bg-white p-6 text-center text-sm font-semibold text-[#6b7280] shadow-[0_10px_24px_rgba(0,0,0,0.05)]">
          No subcategories are configured for this store type yet.
        </div>
      )}
    </div>
  );
}

export const CategoriesCard: TemplateEntry = {
  label: "Categories Card",
  description: "Dynamic subcategory card driven by the project industry",
  preview: "📦",
  category: "card",
  element: React.createElement(CategoriesCardCanvas),
};

export default CategoriesCard;