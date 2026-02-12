"use client";

import React, { useState } from "react";
import { NumericInput } from "../../../design/_components/rightPanel/settings/inputs/NumericInput";

interface ItemField {
  key: string;
  label: string;
  type: "text" | "number" | "image";
  min?: number;
  max?: number;
  step?: number;
}

interface ItemListEditorProps<T extends { id: string; name: string; image?: string }> {
  items: T[];
  fields: ItemField[];
  onItemChange: (itemId: string, field: string, value: any) => void;
  onAddItem: () => void;
  onDeleteItem: (itemId: string) => void;
  emptyText?: string;
}

/**
 * Generic expandable list editor for items in settings panels.
 * Works for CartItem, OrderTrackingItem, etc.
 */
export function ItemListEditor<T extends { id: string; name: string; image?: string }>({
  items,
  fields,
  onItemChange,
  onAddItem,
  onDeleteItem,
  emptyText = "No items",
}: ItemListEditorProps<T>) {
  const [expandedItem, setExpandedItem] = useState<string | null>(null);

  return (
    <>
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] text-brand-lighter">Manage items</span>
        <button
          onClick={onAddItem}
          className="text-[10px] px-2 py-1 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded border border-blue-500/30"
        >
          + Add
        </button>
      </div>
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {items.length > 0 ? (
          items.map((item) => (
            <div
              key={item.id}
              className="bg-brand-medium/10 border border-brand-medium/20 rounded-lg p-2"
            >
              <button
                onClick={() => setExpandedItem(expandedItem === item.id ? null : item.id)}
                className="w-full flex items-center justify-between text-left"
              >
                <span className="text-[11px] text-brand-lighter truncate">
                  {item.name || "Unnamed Item"}
                </span>
                <span className="text-[10px] text-brand-medium">
                  {expandedItem === item.id ? "−" : "+"}
                </span>
              </button>
              {expandedItem === item.id && (
                <div className="mt-2 space-y-2 border-t border-brand-medium/20 pt-2">
                  {fields.map((field) => (
                    <div key={field.key}>
                      <label className="text-[10px] text-brand-lighter">{field.label}</label>
                      {field.type === "number" ? (
                        <NumericInput
                          value={(item as any)[field.key] ?? 0}
                          onChange={(val) =>
                            onItemChange(item.id, field.key, field.key === "quantity" ? Math.max(1, Math.floor(val ?? 1)) : (val ?? 0))
                          }
                          min={field.min ?? 0}
                          step={field.step ?? 1}
                        />
                      ) : (
                        <>
                          <input
                            type="text"
                            value={(item as any)[field.key] ?? ""}
                            onChange={(e) => onItemChange(item.id, field.key, e.target.value)}
                            className="w-full bg-brand-medium-dark border border-brand-medium/30 rounded-md text-xs text-brand-lighter p-1.5 focus:outline-none"
                          />
                          {field.type === "image" && (item as any)[field.key] && (
                            <img
                              src={(item as any)[field.key]}
                              alt={item.name}
                              className="w-full h-16 object-cover rounded mt-1 border border-brand-medium/20"
                            />
                          )}
                        </>
                      )}
                    </div>
                  ))}
                  <button
                    onClick={() => onDeleteItem(item.id)}
                    className="w-full text-[10px] px-2 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded border border-red-500/30"
                  >
                    Delete Item
                  </button>
                </div>
              )}
            </div>
          ))
        ) : (
          <p className="text-[11px] text-brand-medium text-center py-2">{emptyText}</p>
        )}
      </div>
    </>
  );
}
