"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Editor, Frame, useEditor } from "@craftjs/core";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { GROUPED_TEMPLATES } from "../../../_assets";

export const AssetsPanel = () => {
  const { connectors } = useEditor();
  const [open, setOpen] = useState<Record<string, boolean>>({});

  const activeGroup = useMemo(
    () => GROUPED_TEMPLATES.find((group) => group.folder === activeFolder) ?? null,
    [activeFolder],
  );

  useEffect(() => {
    if (!activeGroup) {
      setSelectedAsset(null);
      return;
    }

    if (!selectedAsset) return;
    const existsInActive = activeGroup.items.some(
      (item: TemplateEntry, idx: number) => buildAssetKey(activeGroup.folder, item.label, idx) === selectedAsset.key,
    );

    if (!existsInActive) {
      setSelectedAsset(null);
    }
  }, [activeGroup, selectedAsset]);

  return (
    <>
      <div className="h-full flex flex-col px-1 pb-1 relative">
        <div className="relative flex-1 overflow-hidden">
          <div
            className={`absolute inset-0 overflow-y-auto space-y-1.5 pr-1 transition-transform duration-250 ease-out ${
              panelView === "folders" ? "translate-x-0" : "-translate-x-full"
            }`}
          >
            {GROUPED_TEMPLATES.map((group) => (
              <button
                key={group.folder}
                type="button"
                onClick={() => {
                  setActiveFolder(group.folder);
                  setPanelView("items");
                  setSelectedAsset(null);
                }}
                className="w-full bg-brand-white/5 p-4 rounded-xl hover:bg-brand-white/10 transition border border-brand-medium/30 text-left flex items-center justify-between"
              >
                <span className="text-sm text-brand-white font-medium">{group.folder}</span>
                <ChevronRight className="w-4 h-4 text-brand-lighter" />
              </button>
            ))}
          </div>

          <div
            className={`absolute inset-0 transition-transform duration-250 ease-out ${
              panelView === "items" ? "translate-x-0" : "translate-x-full"
            }`}
          >
            <div className="h-full overflow-y-auto pr-1">
              <div className="flex items-center gap-2 px-1 pb-2 border-b border-white/10 mb-2">
                <button
                  type="button"
                  onClick={() => {
                    setPanelView("folders");
                  }}
                  className="inline-flex items-center justify-center w-6 h-6 rounded-sm border border-white/10 text-brand-light/75 hover:text-brand-lighter hover:border-white/25 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <div className="text-xs text-brand-light/70">{activeGroup ? activeGroup.folder : "Assets"}</div>
              </div>

              {activeGroup ? (
                <div
                  className={`grid gap-2 ${
                    isIconFolder(activeGroup.folder)
                      ? "grid-cols-4"
                      : isShapeFolder(activeGroup.folder)
                        ? "grid-cols-2"
                        : "grid-cols-1"
                  }`}
              >
                {group.items.map((item: any, idx: number) => (
                  <div
                    key={item?.label ?? idx}
                    ref={(ref) => {
                      if (ref && item?.element) connectors.create(ref, item.element);
                    }}
                    className="bg-brand-white/5 p-3 rounded hover:bg-brand-white/10 transition cursor-move border border-brand-medium/30"
                  >
                    {group.folder.toLowerCase() === "icons" ? (
                      <div className="text-brand-light">{item.preview}</div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-sm font-medium text-brand-light">{item?.label ?? ""}</div>
                          {item?.description && (
                            <div className="text-xs text-brand-medium mt-1">{item?.description}</div>
                          )}
                        </div>
                         {item?.preview && (
                           <div className="h-8 w-8 bg-brand-medium/20 rounded-lg flex items-center justify-center text-xs">
                             {item?.preview}
                           </div>
                         )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="rounded-sm border border-white/10 bg-transparent p-4 text-center text-xs text-brand-light/65">
                  Select a category.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
