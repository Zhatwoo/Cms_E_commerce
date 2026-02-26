"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Editor, Frame, useEditor } from "@craftjs/core";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { GROUPED_TEMPLATES } from "../../../_assets";
import { CRAFT_RESOLVER } from "../craftResolver";
import type { TemplateEntry } from "../../../_assets/_types";

const DESKTOP_PREVIEW_WIDTH = 1440;
const MAX_PREVIEW_HEIGHT = 180;

interface AssetSelection {
  folder: string;
  item: TemplateEntry;
  key: string;
}

const buildAssetKey = (folder: string, label: string, idx: number) => `${folder}::${label}::${idx}`;

const isIconFolder = (folder: string) => folder.toLowerCase() === "icons";
const isShapeFolder = (folder: string) => folder.toLowerCase() === "shapes";

const AssetLivePreview = ({
  item,
  previewMode,
  maxHeight = MAX_PREVIEW_HEIGHT,
}: {
  item: TemplateEntry;
  previewMode: "icon" | "shape" | "full";
  maxHeight?: number;
}) => {
  const previewRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const [previewHeight, setPreviewHeight] = useState(0);

  useEffect(() => {
    const containerEl = previewRef.current;
    const frameEl = frameRef.current;
    if (!containerEl || !frameEl) return;

    const resizeObserver = new ResizeObserver(() => {
      setContainerWidth(containerEl.clientWidth);
      setPreviewHeight(frameEl.getBoundingClientRect().height);
    });

    resizeObserver.observe(containerEl);
    resizeObserver.observe(frameEl);
    setContainerWidth(containerEl.clientWidth);
    setPreviewHeight(frameEl.getBoundingClientRect().height);

    return () => resizeObserver.disconnect();
  }, []);

  const scale = useMemo(() => {
    if (containerWidth <= 0) return 0.2;
    return Math.min(1, containerWidth / DESKTOP_PREVIEW_WIDTH);
  }, [containerWidth]);

  if (!item?.element) return null;

  if (previewMode === "icon") {
    return (
      <div className="h-20 w-full rounded-lg border border-dashed border-brand-medium/50 bg-brand-medium/20 flex items-center justify-center text-brand-light pointer-events-none">
        <Editor resolver={CRAFT_RESOLVER} enabled={false}>
          <Frame>{item.element}</Frame>
        </Editor>
      </div>
    );
  }

  if (previewMode === "shape") {
    const shapePreviewElement = React.cloneElement(item.element as React.ReactElement<any>, {
      isPreview: true,
      width: 64,
      height: 64,
      margin: 0,
      padding: 0,
      position: "static",
    });

    return (
      <div className="h-20 w-full rounded-lg border border-dashed border-brand-medium/50 bg-brand-medium/20 flex items-center justify-center pointer-events-none overflow-hidden">
        {shapePreviewElement}
      </div>
    );
  }

  return (
    <div
      ref={previewRef}
      className="w-full rounded-lg border border-dashed border-brand-medium/50 bg-brand-medium/20 overflow-hidden pointer-events-none relative"
      style={{ height: previewHeight > 0 ? `${Math.min(previewHeight, maxHeight)}px` : "120px" }}
    >
      <div
        ref={frameRef}
        className="origin-top-left"
        style={{
          width: `${DESKTOP_PREVIEW_WIDTH}px`,
          transform: `scale(${scale})`,
        }}
      >
        <Editor resolver={CRAFT_RESOLVER} enabled={false}>
          <Frame>{item.element}</Frame>
        </Editor>
      </div>
    </div>
  );
};

export const AssetsPanel = () => {
  const { connectors } = useEditor();
  const [panelView, setPanelView] = useState<"folders" | "items">("folders");
  const [activeFolder, setActiveFolder] = useState<string | null>(null);
  const [selectedAsset, setSelectedAsset] = useState<AssetSelection | null>(null);

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
                  {activeGroup.items.map((item: TemplateEntry, idx: number) => {
                    const assetKey = buildAssetKey(activeGroup.folder, item.label, idx);
                    const isSelected = selectedAsset?.key === assetKey;
                    const shapeFolder = isShapeFolder(activeGroup.folder);
                    const iconFolder = isIconFolder(activeGroup.folder);
                    return (
                      <div
                        key={assetKey}
                        ref={(ref) => {
                          if (ref && item?.element) connectors.create(ref, item.element);
                        }}
                        onClick={() => {
                          setSelectedAsset({
                            folder: activeGroup.folder,
                            item,
                            key: assetKey,
                          });
                        }}
                        className={`group bg-brand-white/5 p-4 rounded-xl hover:bg-brand-white/10 transition border cursor-move ${
                          isSelected ? "border-brand-light" : "border-brand-medium/30"
                        }`}
                      >
                        <div className="flex flex-col gap-2">
                          {!iconFolder && (
                            <div className="flex items-center justify-between gap-2 mb-1">
                              <div className="text-sm text-brand-white font-medium leading-tight line-clamp-1">
                                {item?.label ?? ""}
                              </div>
                            </div>
                          )}
                          <div className="flex items-center justify-center">
                            <AssetLivePreview
                              item={item}
                              previewMode={iconFolder ? "icon" : shapeFolder ? "shape" : "full"}
                            />
                          </div>
                        </div>
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
