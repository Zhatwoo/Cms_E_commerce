"use client";

import React from "react";
import { FilePlus } from "lucide-react";
import { useAddPageToCanvas } from "./useAddPageToCanvas";

interface AddPageFABProps {
  onPageAdded?: (id: string, name: string) => void;
}

/** Floating button on the canvas to add a new page without dragging from the panel */
export function AddPageFAB({ onPageAdded }: AddPageFABProps) {
  const addPageToCanvas = useAddPageToCanvas(onPageAdded);

  return (
    <button
      type="button"
      onClick={addPageToCanvas}
      className="absolute bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-medium hover:bg-brand-medium-dark border border-white/20 text-brand-lighter text-sm font-medium shadow-lg hover:shadow-xl transition-all pointer-events-auto"
      title="Add new page to canvas"
    >
      <FilePlus className="w-4 h-4" />
      Add Page
    </button>
  );
}
