"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Editor, Frame, useEditor } from "@craftjs/core";
import { ChevronLeft, ChevronRight, Layout, Star, FileText, CreditCard, FormInput, PanelBottom, Smile, Shapes as ShapesIcon } from "lucide-react";
import { GROUPED_TEMPLATES } from "../../../_assets";
import { CRAFT_RESOLVER } from "../craftResolver";
type AssetItem = {
  label: string;
  description?: string;
  preview: React.ReactNode;
  element: React.ReactElement;
  category: string;
};

class AssetPreviewErrorBoundary extends React.Component<
  { fallback: React.ReactNode; children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { fallback: React.ReactNode; children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch() {
    // Prevent one bad asset preview from blocking later assets in the list.
  }

  render() {
    if (this.state.hasError) return this.props.fallback;
    return this.props.children;
  }
}

const DESKTOP_PREVIEW_WIDTH = 1440;
const MAX_PREVIEW_HEIGHT = 180;

interface AssetSelection {
  folder: string;
  item: AssetItem;
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
  item: AssetItem;
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
      <div className="h-16 w-full rounded-lg border border-dashed border-brand-medium/50 bg-brand-medium/10 flex items-center justify-center text-brand-light pointer-events-none group-hover:bg-brand-medium/20 transition-colors">
        <Editor resolver={CRAFT_RESOLVER} enabled={false}>
          <Frame>{item.element}</Frame>
        </Editor>
      </div>
    );
  }

  if (previewMode === "shape") {
    const shapePreviewElement = React.cloneElement(item.element as React.ReactElement<any>, {
      isPreview: true,
      width: 48,
      height: 48,
      margin: 0,
      padding: 0,
      position: "static",
    });

    return (
      <div className="h-20 w-full rounded-lg border border-dashed border-brand-medium/50 bg-brand-medium/10 flex items-center justify-center pointer-events-none overflow-hidden group-hover:bg-brand-medium/20 transition-colors">
        {shapePreviewElement}
      </div>
    );
  }

  return (
    <div
      ref={previewRef}
      className="w-full rounded-lg border border-dashed border-brand-medium/50 bg-brand-medium/10 overflow-hidden pointer-events-none relative group-hover:bg-brand-medium/20 transition-colors"
      style={{ height: previewHeight > 0 ? `${Math.min(previewHeight, maxHeight)}px` : "100px" }}
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
      (item: AssetItem, idx: number) => buildAssetKey(activeGroup.folder, item.label, idx) === selectedAsset.key,
    );

    if (!existsInActive) {
      setSelectedAsset(null);
    }
  }, [activeGroup, selectedAsset]);

  return (
    <div className="h-full flex flex-col p-1 relative overflow-hidden">
      <div className="relative flex-1 overflow-hidden">
        {/* Folders View */}
        <div
          className={`absolute inset-0 overflow-y-auto space-y-2 transition-transform duration-250 ease-out py-2 ${panelView === "folders" ? "translate-x-0" : "-translate-x-full"
            }`}
        >
          <span className="text-[10px] font-bold text-brand-medium uppercase tracking-widest px-1">
            Asset Library
          </span>
          <div className="grid grid-cols-1 gap-2">
            {GROUPED_TEMPLATES.map((group) => (
              <button
                key={group.folder}
                type="button"
                onClick={() => {
                  setActiveFolder(group.folder);
                  setPanelView("items");
                  setSelectedAsset(null);
                }}
                className="group relative w-full bg-brand-white/5 rounded-xl border border-brand-medium/30 overflow-hidden hover:bg-brand-white/10 transition-all duration-300 hover:border-brand-medium/50 shadow-sm h-16"
              >
                <div className="flex h-full items-center p-2.5 gap-3">
                  <div className="w-10 h-10 rounded-lg bg-brand-dark/50 flex items-center justify-center text-brand-light group-hover:text-white transition-colors border border-white/5 shadow-inner shrink-0">
                    {ASSET_ICONS[group.folder] || <Layout className="w-5 h-5" />}
                  </div>
                  <div className="flex-1 text-left">
                    <div className="text-sm font-semibold text-brand-white group-hover:translate-x-1 transition-transform">
                      {group.folder}
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-brand-medium group-hover:text-brand-lighter transition-all group-hover:translate-x-1" />
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Items View */}
        <div
          className={`absolute inset-0 transition-transform duration-250 ease-out py-2 ${panelView === "items" ? "translate-x-0" : "translate-x-full"
            }`}
        >
          <div className="h-full overflow-y-auto">
            <div className="flex items-center gap-2 px-1 pb-2 border-b border-white/10 mb-4 sticky top-0 bg-brand-dark z-10">
              <button
                type="button"
                onClick={() => setPanelView("folders")}
                className="inline-flex items-center justify-center w-7 h-7 rounded-lg border border-white/10 text-brand-light hover:text-white hover:bg-white/5 transition-all"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <div className="text-xs font-bold text-brand-lighter">{activeGroup?.folder}</div>
            </div>

            {activeGroup ? (
              <div
                className={`grid gap-2 p-0.5 ${isIconFolder(activeGroup.folder)
                  ? "grid-cols-4"
                  : isShapeFolder(activeGroup.folder)
                    ? "grid-cols-2"
                    : "grid-cols-1"
                  }`}
              >
                {activeGroup.items.map((item: AssetItem, idx: number) => {
                  const assetKey = buildAssetKey(activeGroup.folder, item.label, idx);
                  const isSelected = selectedAsset?.key === assetKey;
                  const shapeFolder = isShapeFolder(activeGroup.folder);
                  const iconFolder = isIconFolder(activeGroup.folder);
                  return (
                    <div
                      key={assetKey}
                      data-drag-source="asset"
                      data-asset-category={item.category}
                      data-asset-label={item.label}
                      ref={(ref) => {
                        if (ref && item?.element) connectors.create(ref, item.element);
                      }}
                      onDragStart={() => {
                        if (typeof document !== "undefined") {
                          document.body.dataset.assetDragCategory = item.category;
                          document.body.dataset.assetDragLabel = item.label;
                        }
                      }}
                      onMouseDown={() => {
                        if (typeof document !== "undefined") {
                          document.body.dataset.assetDragCategory = item.category;
                          document.body.dataset.assetDragLabel = item.label;
                        }
                      }}
                      onDragEnd={() => {
                        if (typeof document !== "undefined") {
                          delete document.body.dataset.assetDragCategory;
                          delete document.body.dataset.assetDragLabel;
                        }
                      }}
                      onClick={() => {
                        setSelectedAsset({
                          folder: activeGroup.folder,
                          item,
                          key: assetKey,
                        });
                      }}
                      className={`group bg-brand-white/5 p-3 rounded-xl hover:bg-brand-white/10 transition-all border cursor-move shadow-sm ${isSelected ? "border-brand-light bg-brand-white/10" : "border-brand-medium/30"
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
