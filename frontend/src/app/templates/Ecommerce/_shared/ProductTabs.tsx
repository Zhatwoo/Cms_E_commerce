"use client";

import React from "react";

interface ProductTabsProps {
  activeTab: "description" | "specs" | "reviews";
  onTabChange: (tab: "description" | "specs" | "reviews") => void;
  fullDescription: string;
  specifications: string;
  reviewsEnabled: boolean;
  productRating: number;
  productReviews: number;
}

/** Description / Specifications / Reviews tabbed panel */
export const ProductTabs: React.FC<ProductTabsProps> = ({
  activeTab, onTabChange, fullDescription, specifications,
  reviewsEnabled, productRating, productReviews,
}) => {
  const tabs: Array<{ key: typeof activeTab; label: string; show: boolean }> = [
    { key: "description", label: "Description", show: true },
    { key: "specs", label: "Specifications", show: true },
    { key: "reviews", label: "Reviews", show: reviewsEnabled },
  ];

  return (
    <div className="pt-6">
      <div className="flex gap-4 border-b border-gray-200">
        {tabs.filter((t) => t.show).map((t) => (
          <button
            key={t.key}
            className={`py-2 px-3 -mb-px border-b-2 ${activeTab === t.key ? "border-blue-600 text-blue-600" : "border-transparent text-gray-600"}`}
            onClick={() => onTabChange(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="pt-4">
        {activeTab === "description" && (
          <div className="prose max-w-none">
            <p className="whitespace-pre-line text-gray-700">{fullDescription}</p>
          </div>
        )}
        {activeTab === "specs" && (
          <div className="bg-gray-50 p-4 rounded border border-gray-200">
            <pre className="whitespace-pre-wrap text-sm text-gray-800">{specifications}</pre>
          </div>
        )}
        {activeTab === "reviews" && reviewsEnabled && (
          <div className="flex flex-col gap-3">
            <p className="text-sm text-gray-600">Average Rating: {productRating} / 5</p>
            <p className="text-sm text-gray-600">Total Reviews: {productReviews}</p>
            <div className="text-gray-500 text-sm">Reviews listing can be integrated later.</div>
          </div>
        )}
      </div>
    </div>
  );
};
